#!/usr/bin/env python3
"""verify.py, re-check a frozen set, and count three outcomes separately.

═══════════════════════════════════════════════════════════════════════════════
OWNS      re-digesting the copies · the three outcome counts · the comparison
          against the profile recorded at the moment of freezing · the plain-words
          explanation of the most likely cause of each finding
READS     the record beside a set, the checklist beside it, and the copies. Nothing
          else, ever, and none of the three until the go-ahead written in the
          person's folder has been checked, by way of
          `capture_audit.permission_or_refuse`.
CREATES   NOTHING. Not a folder, not a file, not a note, not a mode change. This
          program has no capability to alter anything and the declaration says so.
          a checker that can write is a checker that can be blamed for a change.
NEVER     says what a result means · reports a pass over an input it did not read ·
          prints a number it did not derive

═══════════════════════════════════════════════════════════════════════════════
🔴 THREE OUTCOMES, NOT TWO.

  verified      opened, digested, and the digest is the one recorded
  mismatched    opened, digested, and the digest is NOT the one recorded
  unverifiable  no available permission, device or path could reach it at all

The third one is the whole reason this file is careful. Folding it into failure
poisons the result permanently, every later run inherits a red that has nothing to
do with the evidence, and a check that is always red gets switched off in the first
week. Folding it into success is a lie. So it is counted on its own, every item in
it is listed with the reason, and the summary says out loud that green means N
files were opened and digested rather than that the set is clean.

🔴 AND A GREEN MUST SAY HOW MANY FILES IT ACTUALLY CHECKED.

A verifier that reads nothing finds no mismatch and prints exactly the same green
as a verifier over a clean set. That has happened in this project, in the wrapper
written to report that very failure, over an already-published repository with
green continuous integration, so the count is not decoration. It is the only thing
that distinguishes a real pass from a vacuous one. ⛔ Every number printed here is
derived from what this run did. None is typed.

═══════════════════════════════════════════════════════════════════════════════
🔴 WHEN THIS GOES RED, THE LIKELIEST CAUSE IS THE RECORD, NOT THE EVIDENCE.

Measured, not assumed: a read-only differential pass across roughly thirty records
in a mature set found ZERO changed evidence files. Every single failure was a
defect in the record's own format. An unrecorded path base, a record referring to
itself, a living document filed inside a frozen one, source-side absolute paths, a
filename spelled in a different unicode form, a free-text trailer, line terminators
of the wrong kind.

So every finding here carries the most likely cause in plain words, and the words
matter more than the code: a person's first reaction to a red digest is panic, and
their second is to try to *fix* the frozen set, which is the one unrecoverable
move. ⛔ Nothing this program prints may leave "somebody tampered with it" as the
reading a frightened person takes away, and nothing it prints may suggest editing
a frozen set.

═══════════════════════════════════════════════════════════════════════════════
⛔ WORDS THAT MAY NOT REACH ANYTHING A PERSON READS. They are fine here in code and
in comments. The two directory names come from the engine's own constant and are
never written as a string of this file's own.

⛔ NO DOUBLE-BRACE BUILD PLACEHOLDER MAY APPEAR IN THIS FILE.
"""

import argparse
import hashlib
import json
import os
import stat
import sys
import unicodedata
from pathlib import Path

# ⛔ Before the sibling module is imported, so importing it leaves no bytecode
# cache in the install tree.
sys.dont_write_bytecode = True

HERE = Path(__file__).resolve()
if str(HERE.parent) not in sys.path:
    sys.path.insert(0, str(HERE.parent))

# 🔴 The two directory names come from the engine's own constant, never retyped.
import triage  # noqa: E402  (the path insert above has to run first)

# 🔴 THE GO-AHEAD CHECK, IMPORTED. ⛔ NOT SHELLED OUT TO: a child process is a
# capability that has to be declared, and an in-process call cannot be forgotten
# between two lines of code. `permission_or_refuse` returns the bound permission or
# raises, and this program calls it before it opens a record, a checklist or a copy.
import capture_audit  # noqa: E402  (same reason)

TOOL_NAME = "machine-witness verify"
TOOL_VERSION = "0.1.0"
DIGEST_NAME = "sha256"
BLOCK = 1 << 20

EXIT_OK = 0
EXIT_REJECTED = 2  # an argument this program will not interpret
EXIT_REFUSED = 3  # it cannot run at all, so it refuses rather than reporting
EXIT_MISMATCH = 5  # something opened does not match what was recorded
EXIT_DIFFERENT_PROFILE = 6  # no mismatch, but not the same answer as last time
EXIT_USAGE = 64

if len(triage.WORKSPACE_DIRS) != 2:
    raise SystemExit(
        "verify cannot start: the engine now names "
        f"{len(triage.WORKSPACE_DIRS)} folder(s) for a person's case folder and "
        "this program expects two. One for the copies and one for the record of "
        "them."
    )
COPIES_DIR = triage.WORKSPACE_DIRS[0]
RECORD_DIR = triage.WORKSPACE_DIRS[1]

RECORD_SUFFIX = ".json"
CHECKLIST_SUFFIX = ".sha256"

# The one key that says a file in the record folder is a record of a frozen set.
# ⚠️ Load-bearing rather than tidy: other things legitimately live in that folder,
# and treating any file that happens to end in the same three letters as a set
# would make this program report on something it does not understand. A file
# without this key is skipped and SAID to have been skipped.
RECORD_MARKER = "record_schema"


class Refusal(Exception):
    """Something this program will not do. The message is shown verbatim."""

    def __init__(self, message, code=EXIT_REFUSED):
        super().__init__(message)
        self.code = code


# ═══════════════════════════════════════════════════════════════════════════════
# The digest. 🔴 OVER A FILE HANDLE, IN BINARY, IN BLOCKS, and written out again
# here rather than shared with the program that made the copies.
#
# ⛔ THE DUPLICATION IS THE POINT, not an oversight. A tool is not a witness to its
# own output. The copier and the checker read the bytes through two separate pieces
# of code, and the real independent check is neither of them: it is the platform's
# own digest tool run against the checklist, which needs nothing of ours installed.
# If verifying our work required our software, our work would be worth much less to
# anybody.
#
# Binary mode, so no line ending is translated. No decoding, so a byte-order mark
# is data like any other byte. Nothing stripped, nothing trimmed, nothing
# normalised, the shell form of this bug is digesting the output of a command
# substitution, which silently drops a trailing newline and reports a MISMATCH on a
# byte-identical file. A false failure trains people to ignore the check.
# ═══════════════════════════════════════════════════════════════════════════════


def digest_of_file(path):
    running = hashlib.sha256()
    with open(path, "rb") as handle:
        while True:
            block = handle.read(BLOCK)
            if not block:
                break
            running.update(block)
    return running.hexdigest()


def normalised(name):
    """One comparison form, used ONLY to notice that two spellings are one name."""
    return unicodedata.normalize("NFC", name)


# ═══════════════════════════════════════════════════════════════════════════════
# The probable cause of each finding, in plain words.
#
# ⛔ NOT decoration, and not reassurance either. Each line is the measured most
# likely explanation, it says how to confirm it, and it says what not to do. The
# thing being prevented is specific: a person reads a red line, concludes somebody
# has tampered with their evidence, and repairs the frozen set to make the red go
# away. That is unrecoverable, and it is what happens when a checker reports a
# state without reporting what the state usually means.
# ═══════════════════════════════════════════════════════════════════════════════

CAUSE_MISSING = (
    "The copy is not where the record says it is. The likeliest causes, in order: "
    "the folder was opened in a file manager window and something was tidied or "
    "moved; a program that keeps your files the same on your phone and your "
    "computer moved it; or the whole folder was copied somewhere and this is the "
    "incomplete arrival. ⛔ Do not try to put it back and do not rebuild anything. "
    "Look for the file elsewhere on this machine, leave the frozen set exactly as "
    "it is, and tell your lawyer what you see here."
)

CAUSE_UNREADABLE = (
    "This machine would not let this program open the copy. That is a permission "
    "or a device answer, not a statement about the contents. Nothing was checked "
    "either way, which is why it is counted on its own rather than as a failure. "
    "If the folder is on something removable, plug it in and run this again."
)

CAUSE_NOT_PLAIN = (
    "What is at that path is not a plain file, so nothing here opened it, some of "
    "them never finish being read. It was recorded as not copied when the set was "
    "frozen, and it is counted here as not checkable rather than as a failure."
)

CAUSE_NOT_COPIED = (
    "The record says this was found in the original and deliberately not copied, "
    "with the reason. There is nothing here to check, so it is counted as not "
    "checkable, which is the honest answer and is exactly what the record said to "
    "expect."
)

CAUSE_MISMATCH = (
    "The bytes at that path are not the bytes that were recorded. ⚠️ Read this "
    "part before anything else: when this goes red, the overwhelmingly likely "
    "cause is a defect in the record's own format rather than a change to the "
    "evidence. Measured across roughly thirty records in a mature set, every "
    "single red was a record defect and none was a changed file. Check three "
    "things, in this order: whether the checklist beside the set still matches its "
    "own recorded digest; whether the name is spelled with an accent stored two "
    "different ways; and whether anything else on this machine writes into that "
    "folder. ⛔ Whatever the answer, do not edit the frozen set and do not delete "
    "anything from it. A frozen set is corrected by adding a note beside it. "
    "Changing one byte of it makes the digest change, and then nobody can tell "
    "your correction from somebody tampering with it."
)

CAUSE_NAME_FORM = (
    "The contents are identical. The name is stored with an accent or a "
    "non-English character spelled a different way from the one recorded, because "
    "two filesystems disagree about how to store one. ⚠️ This is NOT a sign that "
    "anything was altered, and it is called out because a checker that did not "
    "know about it would report it as a problem, which is indistinguishable from "
    "tampering to anybody who has not met this before."
)

CAUSE_UNEXPECTED = (
    "There is something in the copies folder that the record does not list. The "
    "likeliest cause by a long way is the operating system: simply looking at a "
    "folder in a file manager window makes it write small hidden files inside, and "
    "copying onto a memory stick creates companion files to carry information the "
    "stick cannot hold. ⛔ Do not delete them. Removing anything from a frozen set "
    "is itself a change to it, and it is a change nobody can tell from tampering "
    "afterwards. Write a note in a new file beside the set saying what appeared, "
    "and leave them where they are."
)

CAUSE_CHECKLIST = (
    "The checklist beside this set no longer matches the digest recorded for it, "
    "so the list of what should be there has itself changed since the set was "
    "frozen. That is a finding about the RECORD, not about the copies, and it is "
    "the first thing to establish because every other answer below was measured "
    "against it. ⛔ Do not repair either file. Tell your lawyer, and keep both "
    "exactly as they are."
)

CAUSE_DISAGREEMENT = (
    "The record and the checklist beside it do not say the same thing about this "
    "entry. That is a defect in the record's own format, the commonest cause of a "
    "red by a wide margin, and it says nothing at all about whether the copy "
    "changed. ⛔ Do not edit either file to make them agree."
)

WHAT_THIS_DOES_NOT_ESTABLISH = (
    "This says the bytes are the bytes. It says nothing about what they mean, "
    "nothing about whether they help anybody, and nothing about what happened. It "
    "is not a score and it is not a strength. What any of it is worth is for a "
    "lawyer to judge."
)


# ═══════════════════════════════════════════════════════════════════════════════
# Reading the record
# ═══════════════════════════════════════════════════════════════════════════════


def resolve_given(given, what):
    if not given or not str(given).strip():
        raise Refusal(f"I need {what}, and I am not going to guess.", code=EXIT_REJECTED)
    return Path(os.path.realpath(os.path.expanduser(str(given).strip())))


def load_record(path):
    """The record of one frozen set, or a refusal that names what was wrong."""
    if not path.is_file():
        raise Refusal(
            "There is no record of a frozen set there.\n"
            f"  I looked at  {path}\n"
            "⛔ And I am not going to work one out from the copies. A list built "
            "from whatever happens to be in a folder today cannot tell you the "
            "folder has not changed. It would agree with itself no matter what "
            "had happened to it."
        )
    try:
        payload = json.loads(path.read_bytes().decode("utf-8"))
    except (ValueError, OSError, UnicodeDecodeError) as exc:
        raise Refusal(
            "I cannot read that record, so I am not going to report on the set it "
            "describes.\n"
            f"  the record  {path}\n"
            f"  the problem {exc}\n"
            "⛔ Leave it exactly as it is. Do not try to repair it, a repaired "
            "record is a record somebody has edited, which is the one thing it "
            "exists to rule out. Tell your lawyer."
        )
    if not isinstance(payload, dict) or RECORD_MARKER not in payload:
        raise Refusal(
            "That file is not a record of a frozen set.\n"
            f"  I looked at  {path}\n"
            "Other things live in that folder legitimately. I will not guess at "
            "the shape of a file I do not recognise."
        )
    if not isinstance(payload.get("entries"), list):
        raise Refusal(
            f"The record at {path} lists no entries at all, so there is nothing "
            "for me to check. ⛔ Reporting a pass over an empty list is the one "
            "failure a checker must never have: it looks exactly like a clean "
            "result."
        )
    return payload


def find_records(workspace, name):
    """Which sets to check. Refuses rather than reporting a pass over nothing."""
    record_root = workspace / RECORD_DIR
    if not record_root.is_dir():
        raise Refusal(
            "That folder has nothing in it that I recognise.\n"
            f"  I looked in  {record_root}\n"
            "Either nothing has been frozen into this folder yet, or this is not "
            "the folder that holds your case files."
        )
    if name is not None:
        return [record_root / f"{name}{RECORD_SUFFIX}"], []

    found = []
    skipped = []
    for candidate in sorted(record_root.glob(f"*{RECORD_SUFFIX}")):
        try:
            payload = json.loads(candidate.read_bytes().decode("utf-8"))
        except (ValueError, OSError, UnicodeDecodeError) as exc:
            # 🔴 A FILE THAT WILL NOT PARSE AT ALL IS A REFUSAL, NOT SOMETHING TO
            # PASS OVER. Found by running this: a damaged record of a real set was
            # quietly filed under "not one of mine", and the run then ended with the
            # much weaker "I found no records here". That downgrade is the whole
            # failure, the person whose record has been truncated needs to be told
            # their record is damaged and that they must not repair it, not that
            # there was nothing to look at.
            #
            # ⛔ And it fails closed in the other direction too: a file in this folder
            # that is not a record but has been truncated is also worth stopping for.
            # Guessing which of the two it is would mean guessing at the shape of a
            # file that cannot be read.
            raise Refusal(
                "There is a file in that folder that I cannot read, and I am not "
                "going to carry on around it.\n"
                f"  the file     {candidate}\n"
                f"  the problem  {exc}\n"
                "\n"
                "It is either the record of a frozen set that has been damaged or "
                "cut short, or another file in there that has. I cannot tell which "
                "without guessing at the shape of something unreadable, and the "
                "difference matters far too much to guess.\n"
                "\n"
                "⛔ Leave it exactly as it is. Do not try to repair it and do not "
                "delete it. A repaired record is a record somebody has edited, "
                "which is the one thing it exists to rule out. Tell your lawyer what "
                "you see here. If you want to check the other sets meanwhile, name "
                "one with --name."
            )
        if isinstance(payload, dict) and RECORD_MARKER in payload:
            found.append(candidate)
        else:
            skipped.append((candidate.name, "not a record of a frozen set"))
    if not found:
        raise Refusal(
            "I did not find a single record of a frozen set in there, so there is "
            "nothing to check.\n"
            f"  I looked in  {record_root}\n"
            + (
                "  files I passed over, each of which reads fine and is not a "
                "record of a set:\n"
                + "\n".join(f"    {n}, {why}" for n, why in skipped)
                + "\n"
                if skipped
                else ""
            )
            + "⛔ I am not going to print a clean result over nothing read. A "
            "checker that reads nothing and finds no problem prints exactly the "
            "same thing as a checker over a set that is fine, and this project has "
            "shipped that mistake before."
        )
    return found, skipped


# ═══════════════════════════════════════════════════════════════════════════════
# Checking one set
# ═══════════════════════════════════════════════════════════════════════════════


def checklist_entries(path):
    """`{path: digest}` from the one-line-per-file checklist, or None if absent."""
    if not path.is_file():
        return None
    out = {}
    raw = path.read_bytes().decode("utf-8", "surrogateescape")
    for line in raw.split("\n"):
        if not line.strip():
            continue
        # `<digest>  <path>`: two spaces, the ordinary text form of the platform's
        # own tool. Split on the FIRST double space only: a filename may contain
        # spaces and splitting on whitespace would cut it in half.
        parts = line.split("  ", 1)
        if len(parts) != 2:
            continue
        out[parts[1]] = parts[0]
    return out


def check_set(record_path, out=sys.stdout):
    """One frozen set. Returns the three outcome lists and every derived count."""
    record = load_record(record_path)
    workspace = record_path.parent.parent
    name = record.get("set") or record_path.stem
    copies_root = workspace / COPIES_DIR / name
    checklist_path = record_path.parent / f"{name}{CHECKLIST_SUFFIX}"

    verified = []
    mismatched = []
    unverifiable = []
    unexpected = []
    record_defects = []

    # ── the record's own integrity, first, because everything else is measured
    #    against it ─────────────────────────────────────────────────────────────
    recorded_whole_set = record.get("whole_set_digest")
    checklist_digest = None
    checklist = checklist_entries(checklist_path)
    if checklist is None:
        record_defects.append(
            (
                str(checklist_path),
                "the checklist beside this set is missing, so the list an examiner "
                "would use is not there",
                CAUSE_CHECKLIST,
            )
        )
    else:
        checklist_digest = digest_of_file(checklist_path)
        if recorded_whole_set and checklist_digest != recorded_whole_set:
            record_defects.append(
                (
                    str(checklist_path),
                    f"recorded {recorded_whole_set}, now {checklist_digest}",
                    CAUSE_CHECKLIST,
                )
            )

    # ── what is actually on disk, by comparison name, so a name stored in a
    #    different unicode form is FOUND rather than reported missing ───────────
    present = {}
    if copies_root.is_dir():
        for root, _dirnames, filenames in os.walk(copies_root):
            for filename in filenames:
                absolute = os.path.join(root, filename)
                relative = os.path.relpath(absolute, copies_root)
                present[normalised(relative)] = relative

    accounted = set()

    for entry in record["entries"]:
        recorded_path = entry.get("path_written") or entry.get("path")
        expected = entry.get(DIGEST_NAME)
        if not recorded_path or not expected:
            record_defects.append(
                (str(recorded_path), "the record's entry has no path or no digest", CAUSE_DISAGREEMENT)
            )
            continue

        # The record and the checklist must agree before either is trusted.
        if checklist is not None:
            listed = checklist.get(recorded_path)
            if listed is None:
                record_defects.append(
                    (recorded_path, "in the record, absent from the checklist", CAUSE_DISAGREEMENT)
                )
            elif listed != expected:
                record_defects.append(
                    (
                        recorded_path,
                        f"the record says {expected}, the checklist says {listed}",
                        CAUSE_DISAGREEMENT,
                    )
                )

        key = normalised(recorded_path)
        actual_relative = present.get(key)
        if actual_relative is None:
            unverifiable.append((recorded_path, "the copy is not there", CAUSE_MISSING))
            continue
        accounted.add(key)
        absolute = copies_root / actual_relative
        try:
            entry_stat = os.lstat(absolute)
        except OSError as exc:
            unverifiable.append((recorded_path, f"{exc}", CAUSE_UNREADABLE))
            continue
        if not stat.S_ISREG(entry_stat.st_mode):
            unverifiable.append((recorded_path, "not a plain file", CAUSE_NOT_PLAIN))
            continue
        try:
            found_digest = digest_of_file(absolute)
        except OSError as exc:
            unverifiable.append((recorded_path, f"{exc}", CAUSE_UNREADABLE))
            continue

        if found_digest != expected:
            mismatched.append((recorded_path, expected, found_digest, CAUSE_MISMATCH))
            continue

        note = None
        if actual_relative != recorded_path:
            note = CAUSE_NAME_FORM
        verified.append((recorded_path, actual_relative, entry_stat.st_size, note))

    # ── what the record said was found and deliberately not copied ────────────
    for entry in record.get("not_copied") or []:
        path = entry.get("path", "?")
        unverifiable.append(
            (path, entry.get("why", "recorded as not copied"), CAUSE_NOT_COPIED)
        )

    # ── the count tripwire: anything present that the record does not list ────
    for key, relative in sorted(present.items()):
        if key not in accounted:
            unexpected.append((relative, CAUSE_UNEXPECTED))

    checked = len(verified) + len(mismatched)
    baseline = record.get("baseline") or {}
    profile_now = {
        "verified": len(verified),
        "mismatched": len(mismatched),
        "unverifiable": len(unverifiable),
    }
    profile_then = {
        key: baseline.get(key)
        for key in ("verified", "mismatched", "unverifiable")
        if baseline.get(key) is not None
    }
    same_profile = bool(profile_then) and all(
        profile_now[key] == value for key, value in profile_then.items()
    )

    return {
        "name": name,
        "record": record_path,
        "copies": copies_root,
        "checklist": checklist_path,
        "recorded_entries": len(record["entries"]),
        "recorded_not_copied": len(record.get("not_copied") or []),
        "checked": checked,
        "verified": verified,
        "mismatched": mismatched,
        "unverifiable": unverifiable,
        "unexpected": unexpected,
        "record_defects": record_defects,
        "checklist_digest": checklist_digest,
        "recorded_whole_set": recorded_whole_set,
        "profile_now": profile_now,
        "profile_then": profile_then,
        "same_profile": same_profile,
        "frozen_at_utc": record.get("frozen_at_utc"),
        "bytes_checked": sum(size for _p, _a, size, _n in verified),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Reporting. ⛔ EVERY NUMBER DERIVED. None of them typed.
# ═══════════════════════════════════════════════════════════════════════════════


def report_set(result, out):
    lines = [
        "",
        f"Set  {result['name']}",
        f"  copies      {result['copies']}",
        f"  record      {result['record']}",
        f"  frozen at   {result['frozen_at_utc']} (UTC)",
        "",
        "  How many, of what",
        f"    entries in the record            {result['recorded_entries']}",
        f"    files opened and digested        {result['checked']}",
        f"    bytes read                       {result['bytes_checked']}",
        "",
        "  The three outcomes, counted separately",
        f"    verified                         {len(result['verified'])}",
        f"    mismatched                       {len(result['mismatched'])}",
        f"    not checkable                    {len(result['unverifiable'])}",
        "",
        f"    in the folder, not in the record {len(result['unexpected'])}",
        f"    defects in the record itself     {len(result['record_defects'])}",
    ]

    then = result["profile_then"]
    if then:
        lines.extend(
            [
                "",
                "  Same answer as when it was frozen?",
                f"    then  verified {then.get('verified')} · mismatched "
                f"{then.get('mismatched')} · not checkable {then.get('unverifiable')}",
                f"    now   verified {result['profile_now']['verified']} · mismatched "
                f"{result['profile_now']['mismatched']} · not checkable "
                f"{result['profile_now']['unverifiable']}",
                (
                    "    → the same, entry for entry"
                    if result["same_profile"]
                    else "    → NOT the same. What changed is below."
                ),
            ]
        )
    else:
        lines.extend(
            [
                "",
                "  ⚠️ This record carries no note of what the answer was when it was "
                "frozen, so there is nothing to compare against. A check that asks "
                "for the same answer as last time keeps working; a check that "
                "demands everything be perfect gets switched off.",
            ]
        )

    if result["record_defects"]:
        lines.extend(["", "  Defects in the record itself. Read these first"])
        for path, detail, cause in result["record_defects"]:
            lines.extend([f"    {path}", f"      {detail}", f"      {cause}"])

    if result["mismatched"]:
        lines.extend(["", "  Mismatched"])
        for path, expected, found, cause in result["mismatched"]:
            lines.extend(
                [
                    f"    {path}",
                    f"      recorded  {expected}",
                    f"      now       {found}",
                    f"      {cause}",
                ]
            )

    if result["unverifiable"]:
        lines.extend(["", "  Not checkable. Listed, and counted on their own"])
        for path, detail, cause in result["unverifiable"]:
            lines.extend([f"    {path}", f"      {detail}", f"      {cause}"])

    if result["unexpected"]:
        lines.extend(["", "  In the folder, not in the record"])
        for path, cause in result["unexpected"]:
            lines.extend([f"    {path}", f"      {cause}"])

    spelled = [item for item in result["verified"] if item[3]]
    if spelled:
        lines.extend(
            ["", "  Verified, with the name spelled a different way on disk"]
        )
        for path, actual, _size, cause in spelled:
            lines.extend(
                [f"    recorded as {path}", f"    found as    {actual}", f"      {cause}"]
            )

    out.write("\n".join(lines) + "\n")


def verdict_of(results):
    """The exit code, derived from the results and from nothing else."""
    if any(r["mismatched"] or r["record_defects"] for r in results):
        return EXIT_MISMATCH
    # Something in the folder the record does not list. The commonest cause is the
    # operating system writing into it, which is benign, and it is still not the
    # same answer as last time, so it does not get a green.
    if any(r["unexpected"] for r in results):
        return EXIT_DIFFERENT_PROFILE
    # ⛔ `same_profile` is FALSE when a record carries no note of what the answer was
    # at the moment of freezing. That is the fail-closed direction on purpose: with
    # nothing to compare against, "the same as last time" cannot be established, and
    # a green that quietly means "there was no last time" is the vacuous pass this
    # whole file is written against.
    if any(not r["same_profile"] for r in results):
        return EXIT_DIFFERENT_PROFILE
    # 🔴 And a run that opened nothing is never a pass, whatever else agrees.
    if sum(r["checked"] for r in results) == 0:
        return EXIT_DIFFERENT_PROFILE
    return EXIT_OK


def verify(workspace_given, name_given, record_given, out=sys.stdout):
    # ═══════════════════════════════════════════════════════════════════════════
    # 🔴 WHAT THE GO-AHEAD IS BOUND TO HERE, AND WHY IT IS THE THING IT IS.
    #
    # The copy command's source is one file or folder the person names. This
    # command has no such argument: it is pointed either at the folder that holds
    # their case files, or at one record by its own path. So the source it binds to
    # is THE THING IT WAS POINTED AT, which is exactly what it is about to read,
    # and is the path a refusal can name back to them.
    #
    # ⚠️ Bound at the granularity of the invocation rather than per set, and that
    # is stated rather than glossed: one go-ahead for `--into <folder>` covers
    # every set in that folder, because reading every set in that folder is what
    # the command was asked to do. It does NOT cover a different folder, a
    # different record, or the copy operation, all three of which are refused.
    # ═══════════════════════════════════════════════════════════════════════════
    if record_given is not None:
        pointed_at = resolve_given(record_given, "the record to check")
        # A record named by its own path may sit outside any folder this tool set
        # up, so the folder holding the go-ahead is derived from it the same way
        # `check_set` derives the copies: the record lives one directory inside it.
        workspace = (
            resolve_given(workspace_given, "the folder that holds your case files")
            if workspace_given
            else pointed_at.parent.parent
        )
    else:
        pointed_at = resolve_given(
            workspace_given, "the folder that holds your case files"
        )
        workspace = pointed_at
        # A folder that is not there is said to be, before the go-ahead is judged:
        # refusing for a missing go-ahead in a folder that does not exist sends
        # somebody to fix the wrong thing. This is an existence test, not a read.
        if not workspace.is_dir():
            raise Refusal(
                "That folder is not there.\n"
                f"  you gave me  {workspace}\n"
                "I need the folder that holds your case files."
            )

    # 🔴 BEFORE THE FIRST READ OF ANYTHING. Before a record is parsed, before the
    # checklist is digested, before one copy is opened. Deciding which sets exist
    # is itself a read of files in their folder, so the check comes first.
    capture_audit.permission_or_refuse(workspace, pointed_at, "verify")

    if record_given is not None:
        records = [pointed_at]
        skipped = []
    else:
        records, skipped = find_records(workspace, name_given)

    results = [check_set(path, out=out) for path in records]

    out.write(
        "\n".join(
            [
                "",
                f"{TOOL_NAME} {TOOL_VERSION}",
                f"  sets checked  {len(results)}",
            ]
            + (
                [
                    f"  files in that folder I passed over  {len(skipped)}",
                ]
                + [f"    {n}, {why}" for n, why in skipped]
                if skipped
                else []
            )
        )
        + "\n"
    )

    for result in results:
        report_set(result, out)

    total_checked = sum(r["checked"] for r in results)
    total_verified = sum(len(r["verified"]) for r in results)
    total_mismatched = sum(len(r["mismatched"]) for r in results)
    total_unverifiable = sum(len(r["unverifiable"]) for r in results)
    total_unexpected = sum(len(r["unexpected"]) for r in results)
    total_defects = sum(len(r["record_defects"]) for r in results)
    total_bytes = sum(r["bytes_checked"] for r in results)
    code = verdict_of(results)

    summary = [
        "",
        "─" * 72,
        "",
        f"Across {len(results)} set(s):",
        f"  files opened and digested   {total_checked}",
        f"  bytes read                  {total_bytes}",
        f"  verified                    {total_verified}",
        f"  mismatched                  {total_mismatched}",
        f"  not checkable               {total_unverifiable}",
        f"  in the folder, not recorded {total_unexpected}",
        f"  defects in the record       {total_defects}",
        "",
    ]

    # 🔴 THE SENTENCE THAT MAKES THE GREEN MEAN SOMETHING. It states the count,
    # because a checker that read nothing prints an identical green otherwise.
    if code == EXIT_OK:
        summary.extend(
            [
                f"✅ Every one of the {total_checked} file(s) this opened matched what "
                "was recorded, and the answer is the same as it was when the set was "
                "frozen.",
                "",
                f"⚠️ Read that as it is written: {total_checked} file(s) were opened "
                "and digested. It does not say the set is clean, and it does not say "
                "anything at all about a file that was not checkable. This project "
                "has shipped a green that read nothing, so the count is the claim.",
            ]
        )
    elif code == EXIT_MISMATCH:
        summary.extend(
            [
                f"❌ {total_mismatched} mismatched and {total_defects} defect(s) in "
                "the record itself, out of "
                f"{total_checked} file(s) opened.",
                "",
                "⚠️ Start with the defects in the record, not with the mismatches. "
                "Measured across roughly thirty records in a mature set, every "
                "single red was a defect in the record's own format and none was a "
                "changed file. ⛔ Do not edit the frozen set, do not delete anything "
                "from it, and do not repair the record. Hand this output to your "
                "lawyer as it is.",
            ]
        )
    else:
        summary.extend(
            [
                "🟡 Nothing mismatched, and the answer is not the same as it was "
                "when the set was frozen.",
                "",
                f"That is not a failure and it is not a pass. {total_checked} file(s) "
                f"were opened; {total_unverifiable} could not be checked and "
                f"{total_unexpected} thing(s) are in the folder that the record does "
                "not list. Each one is listed above with the most likely cause. ⛔ Do "
                "not delete anything to make this go green.",
            ]
        )

    summary.extend(["", WHAT_THIS_DOES_NOT_ESTABLISH, ""])
    out.write("\n".join(summary))
    return code


# ═══════════════════════════════════════════════════════════════════════════════
# Entry point
# ═══════════════════════════════════════════════════════════════════════════════


def build_parser():
    parser = argparse.ArgumentParser(
        prog="verify.py",
        description=(
            "Re-check a frozen set against the record beside it, and report "
            "verified, mismatched and not-checkable as three separate counts."
        ),
    )
    parser.add_argument(
        "--into",
        default=None,
        help="the folder that holds your case files",
    )
    parser.add_argument(
        "--name",
        default=None,
        help="one set by name. Left out, every set in that folder is checked",
    )
    parser.add_argument(
        "--record",
        default=None,
        help="check one record by its own path, wherever it is",
    )
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if not args.into and not args.record:
        parser.print_help()
        return EXIT_USAGE
    try:
        return verify(args.into, args.name, args.record)
    except (Refusal, capture_audit.Refusal) as exc:
        # ⛔ RELAYED VERBATIM, by the same two lines that relay this program's own
        # refusals. Two classes because the go-ahead check raises the engine's
        # refusal type rather than this file's; the exit codes are the same numbers.
        sys.stdout.write(f"\n{exc}\n\n")
        return exc.code


if __name__ == "__main__":
    sys.exit(main())
