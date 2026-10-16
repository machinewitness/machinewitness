#!/usr/bin/env python3
"""freeze.py, copy a source the person owns, seal the copy, never touch the origin.

═══════════════════════════════════════════════════════════════════════════════
OWNS      the survey of a source · the copy · the per-file and whole-set digests ·
          the record written beside the copies · the refusals
READS     one source the person names, and only what it copied, and BEFORE
          either of those, the go-ahead written in their folder, by way of
          `capture_audit.permission_or_refuse`
WRITES    ONLY inside the folder the person confirmed, and only into the two
          directories named by `triage.WORKSPACE_DIRS`
NEVER     mutates the origin · normalises content or a filename · deletes
          anything · reaches a network · touches a source it has been told may
          hold an excluded class · reads one byte, or creates one thing in the
          person's folder, before the go-ahead has passed · says what a record
          means

═══════════════════════════════════════════════════════════════════════════════
🔴 THE ONE TRAP THAT MATTERS MOST, AND IT IS NOT CRYPTOGRAPHY.

DIGEST FILES, NEVER VARIABLES. The shell form of this bug is
`sha256("$(cat f)")`: command substitution strips trailing newlines, so a
byte-identical file reports a MISMATCH. The Python forms are the same bug wearing
different clothes, `read_text()` then `.encode()`, opening in text mode so the
platform translates line endings, stripping a byte-order mark because it "looks
like noise", or normalising a name to make two spellings compare equal.

Every one of those produces a FALSE FAILURE, and a false failure is worse than no
check at all: the first red digest a frightened person sees, they panic, and the
second thing they do is try to "fix" the frozen set, which is the one
unrecoverable move. So every digest in this file is taken over a file handle
opened in binary mode, in blocks, with nothing in between.

⛔ NORMALISE NOTHING SILENTLY. Not a line ending, not a byte-order mark, not a
unicode filename. Where two spellings of a name genuinely exist, and they do,
because two filesystems disagree about how to store an accent. The difference is
RECORDED and reported as a name-form difference rather than smoothed away.

═══════════════════════════════════════════════════════════════════════════════
🔴 THE EXCLUDED CLASS, TOTAL REFUSAL, AND IT IS STRICTER THAN THE WRITTEN RULE.

The written rule is *freeze the container unopened*. That operation does not
exist. Copying a container reads its bytes; digesting it digests those bytes; and
the content class cannot be established without inspecting content or trusting a
classification that is incomplete by construction. The person is frightened and
does not know everything that is in their own archive.

So on `--excluded-class` this program performs NO filesystem call whatsoever
against the named path. Not a copy, not a listing, not a preview, not a digest,
not a stat, not an existence test. It prints the refusal, prints where it goes
instead, and exits. That is deliberately stricter than the written rule asks for,
it is a DEFAULT rather than a resolution, and the contradiction is recorded as an
owner decision taken with counsel in `AGENTS.md` section 7.

⛔ And the refusal reads as THE SAME RULE FOR EVERY PERSON, never as a guess
about this one. The framing phrase is read from the engine's own constant so the
two cannot drift apart, and so is the DESCRIPTION of the class itself: this
notice and the go-ahead check's own refusal state one sentence, assembled from
`triage.EXCLUDED_CLASS` in both places.

⚠️ THE TWO FLAG NAMES REMAIN DELIBERATELY DIFFERENT, AND THAT IS NOT DRIFT.
`--excluded-class` here; `--might-hold-intimate-media` on the go-ahead check. The
trade-off is real, plain words are clearer on a screen, and a flag naming this
class lands permanently in the shell history of a machine that may later be
examined, where opaque wording is safer. ⛔ That question is OPEN WITH THE OWNER.
Only the description is unified, and picking a winner on the names is not an
agent's decision to take. See `triage.EXCLUDED_CLASS`.

═══════════════════════════════════════════════════════════════════════════════
⛔ WORDS THAT MAY NOT REACH ANYTHING A PERSON READS. Including a file name and a
directory name, because a folder listing is a screen and it is the one screen
that cannot be taken back once it is on their disk. They are fine here in code
and in comments. The two directory names come from `triage.WORKSPACE_DIRS` and
are never written as a string of this file's own; one reader opened a folder and
found the internal word for the record there, and read it as their children being
taken.

═══════════════════════════════════════════════════════════════════════════════
⛔ NO DOUBLE-BRACE BUILD PLACEHOLDER MAY APPEAR IN THIS FILE. The build copies
`.py` verbatim and aborts if it finds one. Every path is resolved at run time.
"""

import argparse
import hashlib
import json
import os
import stat
import sys
import time
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

# ⛔ Set BEFORE the sibling module is imported. Importing a module writes a
# bytecode cache beside it otherwise, which puts a file into the install tree that
# nobody asked for and that the build would then have to know about.
sys.dont_write_bytecode = True

HERE = Path(__file__).resolve()
if str(HERE.parent) not in sys.path:
    sys.path.insert(0, str(HERE.parent))

# 🔴 THE TWO DIRECTORY NAMES ARE READ FROM THE ENGINE'S OWN CONSTANT, NEVER
# RETYPED. `triage.py` records why they are what they are; this file is one of the
# two its comment says must use them.
import triage  # noqa: E402  (the path insert above has to run first)

# 🔴 THE GO-AHEAD CHECK, IMPORTED. ⛔ NOT SHELLED OUT TO, and the difference is the
# point rather than a style preference: a child process is a capability that has to
# be declared, and an in-process call cannot be forgotten between two lines of code.
# `permission_or_refuse` is the one entry point, it returns the bound permission,
# and it raises otherwise, see the contract at the top of that file.
import capture_audit  # noqa: E402  (same reason)

TOOL_NAME = "machine-witness freeze"
TOOL_VERSION = "0.1.0"
RECORD_SCHEMA = 1
DIGEST_NAME = "sha256"

# One mebibyte. Large enough that a big export is not read a page at a time, small
# enough that nothing here holds a whole file in memory. A set can be larger than
# the machine's memory and must still freeze.
BLOCK = 1 << 20

# ── exit codes. Distinct so a relay can tell one outcome from another ──────────
EXIT_OK = 0
EXIT_REJECTED = 2  # an argument this program will not interpret
EXIT_REFUSED = 3  # something it will not do
EXIT_NOT_FAITHFUL = 5  # the copy is not the origin, or the origin moved under us
EXIT_USAGE = 64

# ── the two directories, from the constant, with the order it documents ───────
if len(triage.WORKSPACE_DIRS) != 2:
    raise SystemExit(
        "freeze cannot start: the engine now names "
        f"{len(triage.WORKSPACE_DIRS)} folder(s) for a person's case folder and "
        "this program expects two. One for the copies and one for the record of "
        "them. Fix the pairing here rather than guessing which is which."
    )
COPIES_DIR = triage.WORKSPACE_DIRS[0]  # the copies themselves
RECORD_DIR = triage.WORKSPACE_DIRS[1]  # the record of what went in, and of it holding

# Extensions for the three files written beside a set. Plain, boring, and
# checkable by somebody who has never heard of this tool.
RECORD_SUFFIX = ".json"  # everything, for a program
READABLE_SUFFIX = ".txt"  # the same thing, for a person
CHECKLIST_SUFFIX = ".sha256"  # one line per file, for the standard command-line tool


# ═══════════════════════════════════════════════════════════════════════════════
# Files the operating system writes into a directory without being asked.
#
# ⚠️ These are NOT excluded from the copy, and the reason is a rule rather than a
# preference. A frozen set is the complete source AS PRODUCED, nothing selected,
# nothing dropped, because the cheapest attack on a self-collected set is *you
# kept the parts that helped you*. Dropping files, even boring ones, is a
# selection.
#
# So they are copied, digested and recorded like anything else, and additionally
# LABELLED, with a count. The trap they cause is a file count one above the record,
# which reads exactly like tampering, and labelling defuses it without either
# hiding them or, worse, deleting them out of a set that is already frozen.
# ═══════════════════════════════════════════════════════════════════════════════
MACHINE_WRITTEN_NAMES = frozenset(
    {
        ".ds_store",
        "thumbs.db",
        "ehthumbs.db",
        "desktop.ini",
        ".spotlight-v100",
        ".fseventsd",
        ".temporaryitems",
        ".trashes",
        ".apdisk",
        ".localized",
        "$recycle.bin",
        "system volume information",
    }
)
MACHINE_WRITTEN_PREFIXES = ("._",)


def machine_written(name):
    """Whether a filesystem entry looks like something the machine wrote itself."""
    low = name.lower()
    if low in MACHINE_WRITTEN_NAMES:
        return True
    return any(low.startswith(prefix) for prefix in MACHINE_WRITTEN_PREFIXES)


# ═══════════════════════════════════════════════════════════════════════════════
# Refusals
# ═══════════════════════════════════════════════════════════════════════════════


class Refusal(Exception):
    """Something this program will not do. The message is shown verbatim."""

    def __init__(self, message, code=EXIT_REFUSED):
        super().__init__(message)
        self.code = code


# ═══════════════════════════════════════════════════════════════════════════════
# 🔴 THE HARD FENCE. Printed before anything is read, and it is the stop as well
# as the notice, so a person meets the rule before the tool meets their files.
#
# The framing phrase comes from the engine's constant. The engine's own version of
# this refusal is required by its self-check to carry that phrase, and there is
# exactly one reason: a reader met the rule twice, having volunteered nothing of
# the kind, and read it as the program announcing what it had decided they had
# done. It is the same line for every person who ever runs this, and it now says
# so before it says anything else.
# ═══════════════════════════════════════════════════════════════════════════════

FENCE_NOTICE = (
    "⛔ One rule first, and it is the same rule for every person who uses this, "
    f"{triage.FENCE_DISCLAIMER}, or about your situation.\n"
    "\n"
    f"{triage.EXCLUDED_CLASS_RULE} If "
    "what you are about to give me might contain any, stop here. Do not open it, "
    "do not copy it, do not describe it to me, and do not send it anywhere.\n"
    "\n"
    "Tell your lawyer instead, and let them arrange somebody qualified, a "
    "licensed examiner, to handle it. Mishandling that kind of file creates a "
    "fresh problem of its own, for you and for me, which is why the line is "
    "absolute rather than a judgement about your case."
)

EXCLUDED_CLASS_REFUSAL = (
    FENCE_NOTICE
    + "\n\n"
    + "You have told me this one may contain some, so I have stopped. I have not "
    "opened it, not copied it, not listed what is inside it, not measured it, and "
    "not even asked this machine whether the path is there. Nothing about it has "
    "been read.\n"
    "\n"
    "Where this goes instead:\n"
    "  · Tell your lawyer that this source exists, where it is, and that it was "
    "left untouched.\n"
    "  · They arrange a licensed examiner. That is the only route, and it is not "
    "a slower version of this tool. It is the correct one.\n"
    "  · Leave the source exactly where it is. Do not tidy it, do not move it, "
    "do not rename it, and do not delete anything to make room.\n"
    "\n"
    "⚠️ And the honest part: I cannot tell what is inside anything without "
    "reading it, so this stop rests on what you told me. If you are unsure about "
    "another source, treat it the same way and ask your lawyer. Being wrong in "
    "this direction costs you a delay. Being wrong in the other direction costs "
    "more than this tool can undo."
)


# ═══════════════════════════════════════════════════════════════════════════════
# Digests. 🔴 OVER FILE HANDLES, IN BINARY, IN BLOCKS. See the header.
# ═══════════════════════════════════════════════════════════════════════════════


def digest_of_file(path):
    """SHA-256 of the bytes of a file, exactly as they are on disk.

    ⛔ Binary mode, so no line-ending translation happens. ⛔ No decoding, so a
    byte-order mark is data like any other byte. ⛔ Nothing is stripped, trimmed
    or normalised, a trailing newline is part of the file and part of the digest,
    which is the whole point of digesting the file rather than a string that has
    been through a shell.
    """
    running = hashlib.sha256()
    with open(path, "rb") as handle:
        while True:
            block = handle.read(BLOCK)
            if not block:
                break
            running.update(block)
    return running.hexdigest()


def digest_of_bytes(payload):
    """SHA-256 of bytes already in hand. Used only for text this program authored."""
    return hashlib.sha256(payload).hexdigest()


# ═══════════════════════════════════════════════════════════════════════════════
# Names, and the form they are stored in
# ═══════════════════════════════════════════════════════════════════════════════


def name_form(name):
    """Which unicode form a name is already in. RECORDED, never applied.

    Two filesystems disagree about how to store an accented or non-Latin
    character, so the same name can exist as two different byte sequences. A copy
    across filesystems can shift the form, and then a path lookup fails or a
    recorded entry mismatches WHILE THE CONTENT IS BYTE-IDENTICAL.

    This is the most dangerous trap in the whole area, because a name-form failure
    is indistinguishable from tampering to anybody who does not know about it. The
    handling is: never normalise, record which form each name was in, and give the
    verifier enough to say "this is a spelling difference, not tampering".
    """
    forms = [form for form in ("NFC", "NFD") if unicodedata.is_normalized(form, name)]
    return "+".join(forms) if forms else "neither"


def same_name_ignoring_form(left, right):
    """Whether two names are the same name stored two different ways."""
    return unicodedata.normalize("NFC", left) == unicodedata.normalize("NFC", right)


# A path this program cannot put in the standard checklist format, because the
# format is one line per file. Recorded and NOT copied, with the reason said out
# loud, a silently dropped file is a count mismatch waiting to happen.
UNREPRESENTABLE = ("\n", "\r")


# ═══════════════════════════════════════════════════════════════════════════════
# The survey. ⛔ lstat ONLY. Nothing here opens anything.
# ═══════════════════════════════════════════════════════════════════════════════


def kind_of(mode):
    if stat.S_ISDIR(mode):
        return "directory"
    if stat.S_ISLNK(mode):
        return "link"
    if stat.S_ISREG(mode):
        return "file"
    return "other"


def facts_of(entry_stat):
    """The filesystem metadata that a copy will NOT carry across.

    Captured BEFORE anything is copied, because most of it is destroyed by the act
    of copying and the rest can be destroyed by the filesystem it lands on. A copy
    onto a volume with no ownership bits, which is most memory sticks, which is
    exactly what a person hands a lawyer, silently loses the last four of these.
    """
    return {
        "mode": oct(stat.S_IMODE(entry_stat.st_mode)),
        "bytes": entry_stat.st_size,
        "modified_ns": entry_stat.st_mtime_ns,
        "accessed_ns": entry_stat.st_atime_ns,
        "changed_ns": entry_stat.st_ctime_ns,
        "owner_id": entry_stat.st_uid,
        "group_id": entry_stat.st_gid,
        "links_to_same_content": entry_stat.st_nlink,
        "filesystem_id": entry_stat.st_ino,
        "volume_id": entry_stat.st_dev,
    }


def survey(origin):
    """One pass over the origin: every entry, its kind, and its metadata.

    ⛔ `lstat` only, and a symbolic link is never followed. Two reasons, and both
    are safety rather than tidiness:

      · Following a link can read a file OUTSIDE the source, which may be
        something the person is not entitled to hand anybody.
      · Opening an entry that is not a plain file can BLOCK FOR EVER. A pipe with
        no writer is the standard example, and a tool that hung on one would look
        broken rather than careful. Nothing in this function opens anything, so it
        cannot happen here at all.

    Listing and digesting happen in one traversal at the call site rather than as
    two separate walks, because the operating system writes into a directory while
    you work and two walks race it.
    """
    entries = []
    origin_stat = os.lstat(origin)
    if stat.S_ISREG(origin_stat.st_mode):
        entries.append(
            {
                "path": os.path.basename(origin),
                "kind": "file",
                "machine_written": machine_written(os.path.basename(origin)),
                "name_form": name_form(os.path.basename(origin)),
                "before_copy": facts_of(origin_stat),
            }
        )
        return entries, "file"

    if not stat.S_ISDIR(origin_stat.st_mode):
        raise Refusal(
            "I can only freeze a plain file or a folder of them.\n"
            f"  you gave me  {origin}\n"
            f"  which is     {kind_of(origin_stat.st_mode)}\n"
            "⛔ I will not open anything else. Some of them never finish being "
            "read, and a tool that hangs looks broken rather than careful."
        )

    stack = [""]
    while stack:
        relative = stack.pop()
        absolute = os.path.join(origin, relative) if relative else origin
        try:
            listing = sorted(os.listdir(absolute))
        except OSError as exc:
            raise Refusal(
                f"I cannot look inside {absolute}, so I will not report a set as "
                f"complete: {exc}\n"
                "A listing I could not read is not an empty folder, and treating "
                "it as one is how a set ends up short without anybody noticing."
            )
        for name in listing:
            child_relative = os.path.join(relative, name) if relative else name
            child_absolute = os.path.join(absolute, name)
            child_stat = os.lstat(child_absolute)
            child_kind = kind_of(child_stat.st_mode)
            entries.append(
                {
                    "path": child_relative,
                    "kind": child_kind,
                    "machine_written": machine_written(name),
                    "name_form": name_form(child_relative),
                    "before_copy": facts_of(child_stat),
                }
            )
            if child_kind == "directory":
                stack.append(child_relative)
    entries.sort(key=lambda item: item["path"].encode("utf-8", "surrogateescape"))
    return entries, "folder"


def listing_signature(entries):
    """What has to be identical before and after the read, and nothing more.

    ⚠️ THE ACCESS TIME IS DELIBERATELY NOT IN HERE, and saying why matters more
    than the line of code. Reading a file updates its access time on most
    filesystems. That is a property of reading, not something this program can
    switch off, and pretending otherwise would be a false claim in a document a
    lawyer may rely on. So the claim made is the one that is true and checkable:
    the same entries, with the same sizes, the same permissions and the same
    MODIFICATION times, before the read and after it, and the access time is
    recorded before the read so the change to it is visible rather than hidden.
    """
    return {
        item["path"]: (
            item["kind"],
            item["before_copy"]["bytes"],
            item["before_copy"]["mode"],
            item["before_copy"]["modified_ns"],
        )
        for item in entries
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Writing, and the assertion that keeps every write inside the person's folder
# ═══════════════════════════════════════════════════════════════════════════════


def inside(root, candidate):
    """Whether `candidate` really is under `root`, after every link is resolved."""
    try:
        root_real = Path(os.path.realpath(root))
        candidate_real = Path(os.path.realpath(candidate))
    except OSError:
        return False
    return root_real == candidate_real or root_real in candidate_real.parents


def contained(root, candidate):
    """⛔ EVERY WRITE GOES THROUGH HERE. A path assertion in code, not a permission.

    Permissions look like the obvious answer and they do not survive the medium: a
    memory stick carries no meaningful ownership bits, so a guard built out of them
    stops existing the moment the folder is copied onto one, and nobody notices it
    left, which is worse than never having had it.
    """
    if not inside(root, candidate):
        raise Refusal(
            "I stopped before writing, because that is not inside the folder you "
            "confirmed.\n"
            f"  your folder  {root}\n"
            f"  I was about to write  {candidate}\n"
            "⛔ This is a bug in me, not something you did. Nothing was written. "
            "Tell whoever maintains this."
        )
    return candidate


def make_private_dir(root, path):
    """A directory only this person can open. Best effort on the mode."""
    contained(root, path.parent if path != root else path)
    path.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(path, stat.S_IRWXU)
    except OSError:
        # A filesystem that cannot hold the mode is not a reason to stop, and the
        # record says plainly that a backup tool or a search index on this machine
        # may still reach the folder.
        pass
    return path


def write_private_bytes(root, path, payload, mode=stat.S_IRUSR):
    """Write bytes, then take write permission away. Frozen means frozen."""
    contained(root, path)
    with open(path, "wb") as handle:
        handle.write(payload)
    try:
        os.chmod(path, mode)
    except OSError:
        pass
    return len(payload)


def copy_bytes(root, source, destination):
    """A plain byte-for-byte copy, and nothing else.

    ⛔ NOT one of the standard library's convenience copy helpers. They preserve
    permissions, resource forks and extended attributes on some platforms,
    translate them on others, and synthesise companion files when the target
    filesystem cannot hold them, so a hundred-file set arrives as two hundred
    files and the count no longer matches. Any of that changes what is being
    digested or how many files exist.

    And the copy is NOT digested as it goes past. The origin is digested in its own
    pass and the copy in another, by the same function, over two separate file
    handles, because a copier that also reports the copy is the tool grading its
    own work, and "N files transferred, 0 skipped" has never been evidence of
    anything.
    """
    contained(root, destination)
    total = 0
    with open(source, "rb") as reading:
        with open(destination, "wb") as writing:
            while True:
                block = reading.read(BLOCK)
                if not block:
                    break
                writing.write(block)
                total += len(block)
    try:
        os.chmod(destination, stat.S_IRUSR)
    except OSError:
        pass
    return total


# ═══════════════════════════════════════════════════════════════════════════════
# The workspace, the origin, and the refusals between them
# ═══════════════════════════════════════════════════════════════════════════════


def resolve_given(given, what):
    if not given or not str(given).strip():
        raise Refusal(f"I need {what}, and I am not going to guess.", code=EXIT_REJECTED)
    text = str(given).strip()
    return Path(os.path.realpath(os.path.expanduser(text)))


def open_workspace(given):
    """The folder the person confirmed. It must already exist. I do not invent one.

    ⛔ Deliberately not created here. Choosing where a person's case files live is
    a screen with a warning on it and a confirmation, and it belongs to the
    walk-through. A command that quietly created one somewhere would put case
    material in a folder nobody agreed to.
    """
    root = resolve_given(given, "the folder that holds your case files")
    if not root.exists():
        raise Refusal(
            "That folder does not exist yet, and I am not going to create one for "
            "your case files without asking.\n"
            f"  you gave me  {root}\n"
            "Run the walk-through first. It asks where the folder should go, shows "
            "you exactly where it will land, and asks again before it makes it."
        )
    if not root.is_dir():
        raise Refusal(
            "That is a file, not a folder.\n"
            f"  you gave me  {root}\n"
            "I need the folder that holds your case files."
        )
    return root


def set_name_from(source, given):
    """A short, plain name for one frozen set. Rejected rather than sanitised.

    ⛔ Nothing here quietly rewrites what somebody typed. A name that turned into
    a different name would produce a folder they cannot find, and a folder they
    cannot find is a folder they will go looking for in a graphical file manager.
    which writes files into it.
    """
    if given is None:
        base = os.path.basename(str(source).rstrip(os.sep)) or "set"
        candidate = "".join(
            char if (char.isalnum() or char in "-_.") else "-" for char in base
        ).strip("-.")
        candidate = candidate or "set"
    else:
        candidate = str(given).strip()
        if not candidate or candidate in {".", ".."} or os.sep in candidate:
            raise Refusal(
                "That is not a name I can use for a folder.\n"
                f"  you gave me  {given!r}\n"
                "A short name, letters and numbers, no slashes.",
                code=EXIT_REJECTED,
            )
        if any(char in candidate for char in UNREPRESENTABLE):
            raise Refusal(
                "That name has a line break in it, and I cannot write it into a "
                "list that has one entry per line.",
                code=EXIT_REJECTED,
            )
    for word in triage.BANNED_IN_SCREENS:
        if word in candidate.lower():
            raise Refusal(
                "I am not going to make a folder with that word in the name.\n"
                f"  you gave me  {candidate!r}\n"
                "It is one of the words this tool keeps out of anything you read, "
                "and a folder in your own case folder is something you read every "
                "time you open it. Pick a plainer name.",
                code=EXIT_REJECTED,
            )
    return candidate


def check_geometry(origin, workspace, copies_root):
    """Refuse the two shapes that eat themselves."""
    if inside(origin, workspace):
        raise Refusal(
            "Your case folder is inside the thing you asked me to freeze.\n"
            f"  the source     {origin}\n"
            f"  your folder    {workspace}\n"
            "⛔ I would be copying my own output into my own input, and the set "
            "would never finish or would contain itself. Point one of them "
            "somewhere else."
        )
    if inside(workspace, origin) and inside(copies_root, origin):
        raise Refusal(
            "That source is already one of the copies I made earlier.\n"
            f"  the source   {origin}\n"
            "⛔ A copy of a copy is not evidence of anything, and freezing one "
            "would put a second, different-looking version of the same thing in "
            "your folder. If you want to check the copies you already have, "
            "verify them instead."
        )


# ═══════════════════════════════════════════════════════════════════════════════
# The record. Three files, one set, and every number in them derived.
# ═══════════════════════════════════════════════════════════════════════════════


def checklist_bytes(recorded):
    """One line per file, in the format the standard command-line tool checks.

    `<digest>  <path>`: two spaces, the ordinary text form. An examiner runs the
    platform's own digest tool against this file from inside the copies folder and
    gets an answer without ever installing anything of ours. If verifying our work
    needs our software, our work is worth much less to anybody.

    Order is by the path's bytes, so the file is byte-identical on every run over
    an unchanged set, which is what lets its own digest stand for the whole set.
    """
    lines = []
    for item in sorted(
        recorded, key=lambda entry: entry["path_written"].encode("utf-8", "surrogateescape")
    ):
        lines.append(f"{item[DIGEST_NAME]}  {item['path_written']}\n")
    return "".join(lines).encode("utf-8", "surrogateescape")


WHAT_THIS_DOES_NOT_ESTABLISH = (
    "This record says the bytes are the bytes. It says nothing about what they "
    "mean, nothing about whether they help anybody, and nothing about what "
    "happened. It cannot show when something was deleted, who was holding a "
    "device, or what anybody meant. What any of it is worth is for a lawyer to "
    "judge."
)

READABLE_HEADER = (
    "What was frozen, and what has not changed since\n"
    "\n"
    "Written by the Machine Witness freeze command. Safe to read.\n"
    "\n"
    "⛔ Do not edit this file, and do not edit anything in the copies folder, not "
    "even to correct a typo. Changing one byte of a frozen set changes its digest, "
    "and a changed digest on a frozen set looks exactly like somebody tampering "
    "with it. If something in here is wrong, write a note in a NEW file beside it "
    "saying what and when. Never by editing.\n"
)


def readable_record(record):
    """The same facts, in plain words, for the person whose folder this is."""
    counts = record["counts"]
    lines = [
        READABLE_HEADER,
        "",
        f"Set name          {record['set']}",
        f"Copied from       {record['origin']['resolved']}",
        f"Copies are in     {record['copies_in']}",
        f"Frozen at         {record['frozen_at_utc']} (UTC)",
        f"Tool              {record['tool']['name']} {record['tool']['version']}",
        "",
        "The numbers",
        f"  files copied and checked        {counts['copied']}",
        f"  entries recorded in total       {counts['recorded']}",
        f"  folders inside the source       {counts['directories']}",
        f"  entries recorded but not copied {counts['not_copied']}",
        f"  written by the machine itself   {counts['machine_written']}",
        f"  bytes copied                    {counts['bytes']}",
        "",
        "One digest for the whole set",
        f"  {record['whole_set_digest']}",
        "",
        "  That is the digest of the checklist file beside this one. Anybody can",
        "  work it out again from the platform's own digest tool:",
        "",
        f"    {record['how_to_check']['whole_set']}",
        "",
        "  And every single file at once, from inside the copies folder:",
        "",
        f"    {record['how_to_check']['every_file']}",
        "",
        "What was NOT changed",
        f"  {record['origin_unchanged']['said_plainly']}",
        "",
        "What was left exactly as it was found",
        f"  {record['normalisation']['content']}",
        f"  {record['normalisation']['filenames']}",
        "",
        "What this does not tell anybody",
        f"  {record['what_this_does_not_establish']}",
    ]
    if record["not_copied"]:
        lines.extend(["", "Recorded, but not copied, and why"])
        for item in record["not_copied"]:
            lines.append(f"  {item['path']}")
            lines.append(f"    {item['why']}")
    if record["name_differences"]:
        lines.extend(
            [
                "",
                "Names your computer spelled differently when it wrote the copy",
                "  This is a spelling difference in how your computer stores an "
                "accent or a non-English character. It is NOT a sign that anything "
                "was altered, and the contents are identical. It is recorded here "
                "because a checker that did not know about it would report it as a "
                "problem.",
            ]
        )
        for item in record["name_differences"]:
            lines.append(f"  found as   {item['path']}")
            lines.append(f"  written as {item['path_written']}")
    if record["counts"]["machine_written"]:
        lines.extend(
            [
                "",
                "Files your computer put there by itself",
                "  Some of what was copied was written by the operating system, not "
                "by you, the small hidden files it leaves in a folder once "
                "something has looked at it. They were copied and recorded like "
                "everything else, and they are labelled so that nobody later "
                "mistakes them for something added to the set.",
                "  ⛔ Do not delete them from the copies. Removing anything from a "
                "frozen set is itself a change to it.",
            ]
        )
    lines.append("")
    return "\n".join(lines).encode("utf-8")


# ═══════════════════════════════════════════════════════════════════════════════
# freeze
# ═══════════════════════════════════════════════════════════════════════════════


def freeze(source, workspace_given, name_given, out=sys.stdout):
    """Copy, digest both sides, compare, and write the record. Or refuse."""
    origin = resolve_given(source, "the file or folder to freeze")
    if not os.path.lexists(origin):
        raise Refusal(
            "There is nothing there.\n"
            f"  you gave me  {origin}\n"
            "Check the path. ⛔ Do not go hunting for it in a file manager window. "
            "Looking at a folder that way makes the operating system write files "
            "into it, and then the count no longer matches."
        )

    workspace = open_workspace(workspace_given)

    # ═══════════════════════════════════════════════════════════════════════════
    # 🔴 THE GO-AHEAD. Nothing below this line runs without one, and the ORDER of
    # the three lines above it is deliberate rather than incidental.
    #
    # AFTER the two refusals that name a wrong path, "there is nothing there" and
    # "that folder does not exist", because a go-ahead refusal for a path the
    # person mistyped sends them to answer questions about something that is not
    # there. A refusal that routes to the wrong repair is a refusal nobody can act
    # on. Neither of those two is a read: both establish that a path exists, which
    # is the one call the rule's own wording allows, and neither opens anything.
    #
    # BEFORE the first listing, the first digest, and, just as importantly,
    # before anything at all is created in the person's folder. A refusal must
    # leave their folder as it found it.
    #
    # ⛔ And strictly AFTER the excluded-class branch in `main`, which returns
    # before this function is ever entered: on that path not one filesystem call
    # names the source, and resolving a path is a filesystem call.
    # ═══════════════════════════════════════════════════════════════════════════
    capture_audit.permission_or_refuse(workspace, origin, "freeze")

    copies_root = make_private_dir(workspace, workspace / COPIES_DIR)
    record_root = make_private_dir(workspace, workspace / RECORD_DIR)
    check_geometry(origin, workspace, copies_root)

    name = set_name_from(origin, name_given)
    destination = copies_root / name
    record_path = record_root / f"{name}{RECORD_SUFFIX}"
    readable_path = record_root / f"{name}{READABLE_SUFFIX}"
    checklist_path = record_root / f"{name}{CHECKLIST_SUFFIX}"
    for existing in (destination, record_path, readable_path, checklist_path):
        if existing.exists():
            raise Refusal(
                "There is already a frozen set by that name, and I will not write "
                "over it.\n"
                f"  already there  {existing}\n"
                "⛔ Writing over a frozen set destroys the one thing it was for. "
                "Give this one a different name."
            )

    out.write(f"\n{FENCE_NOTICE}\n")
    out.write(
        "\nIf that applies to what you are freezing, stop now and add "
        "--excluded-class to this command instead. Nothing has been read yet.\n\n"
    )

    started_ns = time.time_ns()
    started_utc = datetime.now(timezone.utc).isoformat()

    # ── pass A: list, and digest the origin. One traversal, before any copy. ──
    entries, shape = survey(origin)
    before = listing_signature(entries)

    origin_digests = {}
    unreadable = []
    for item in entries:
        if item["kind"] != "file":
            continue
        absolute = origin if shape == "file" else os.path.join(origin, item["path"])
        try:
            origin_digests[item["path"]] = digest_of_file(absolute)
        except OSError as exc:
            unreadable.append((item["path"], f"{exc}"))

    if unreadable:
        detail = "\n".join(f"  {path}\n    {why}" for path, why in unreadable)
        raise Refusal(
            "I could not read part of that source, so I am not going to report a "
            "frozen set at all.\n"
            f"{detail}\n"
            "A set with holes in it that says nothing about the holes is worse than "
            "no set. Nothing has been copied. If these are files you are not "
            "allowed to read on this machine, that is a question for your lawyer "
            "rather than something to work around."
        )

    # ── 🔴 FAIL CLOSED ON AN EMPTY READ, BEFORE ANYTHING IS CREATED. ──────────
    #
    # A set with no files in it produced a cheerful "Frozen." and a whole-set
    # digest, which is the digest of nothing, a well-known constant that means the
    # tool read zero bytes. That is this project's headline failure mode: a green
    # that scanned nothing looks identical to a green over a clean set, and the
    # number that distinguishes them is the count. Found by running it, on a folder
    # holding one entry that is not a plain file.
    #
    # ⛔ So an empty read is a refusal, not a success with a zero in it. Nothing has
    # been created at this point beyond the two folders the walk-through makes
    # anyway, so the refusal leaves the person's folder as it found it.
    if not origin_digests:
        detail = "\n".join(f"    {item['path']}, {item['kind']}" for item in entries)
        raise Refusal(
            "There are no plain files in there, so there is nothing for me to "
            "freeze, and I am not going to write a record saying I froze nothing.\n"
            f"  you gave me  {origin}\n"
            + (f"  what is in it:\n{detail}\n" if entries else "  it is empty\n")
            + "\n"
            "A record of an empty set carries a digest that means 'nothing was "
            "read', and it looks exactly like a record of a set that came out "
            "clean. Check the path, or point me at the folder that actually holds "
            "the files."
        )

    # ── pass B: the copy. Plain bytes, nothing carried, nothing derived. ──────
    make_private_dir(workspace, destination)
    not_copied = []
    copied_bytes = 0
    copied_paths = []
    for item in entries:
        relative = item["path"]
        if any(char in relative for char in UNREPRESENTABLE):
            not_copied.append(
                {
                    "path": relative,
                    "kind": item["kind"],
                    "why": (
                        "the name has a line break in it, so it cannot be written "
                        "into a list that has one entry per line. It is recorded "
                        "here and was left exactly where it was."
                    ),
                }
            )
            continue
        target = destination / relative
        if item["kind"] == "directory":
            make_private_dir(workspace, target)
            continue
        if item["kind"] == "link":
            not_copied.append(
                {
                    "path": relative,
                    "kind": "link",
                    "why": (
                        "it is a shortcut to somewhere else rather than a file. "
                        "Following it would read something outside what you asked "
                        "me to freeze, which may not be yours to hand anybody, so "
                        "it is recorded and left alone."
                    ),
                }
            )
            continue
        if item["kind"] != "file":
            not_copied.append(
                {
                    "path": relative,
                    "kind": item["kind"],
                    "why": (
                        "it is not a plain file. Some of these never finish being "
                        "read, so nothing here opens one. It is recorded and left "
                        "alone."
                    ),
                }
            )
            continue
        make_private_dir(workspace, target.parent)
        absolute = origin if shape == "file" else os.path.join(origin, relative)
        copied_bytes += copy_bytes(workspace, absolute, target)
        copied_paths.append(relative)

    # ── which name the filesystem actually gave each copy ─────────────────────
    written_index = {}
    for root, dirnames, filenames in os.walk(destination):
        for filename in filenames:
            absolute = os.path.join(root, filename)
            relative = os.path.relpath(absolute, destination)
            written_index[unicodedata.normalize("NFC", relative)] = relative

    # ── pass C: digest the copy, with its own file handles ────────────────────
    recorded = []
    mismatched = []
    name_differences = []
    for item in entries:
        relative = item["path"]
        if item["kind"] != "file" or relative not in copied_paths:
            continue
        written = written_index.get(unicodedata.normalize("NFC", relative))
        if written is None:
            mismatched.append(
                (relative, "the copy is not where it was written", origin_digests[relative], "-")
            )
            continue
        if written != relative:
            name_differences.append({"path": relative, "path_written": written})
        copy_digest = digest_of_file(destination / written)
        if copy_digest != origin_digests[relative]:
            mismatched.append(
                (relative, "the copy does not match the original", origin_digests[relative], copy_digest)
            )
            continue
        recorded.append(
            {
                "path": relative,
                "path_written": written,
                "kind": "file",
                "bytes": item["before_copy"]["bytes"],
                DIGEST_NAME: copy_digest,
                "name_form": item["name_form"],
                "name_form_written": name_form(written),
                "name_differs_from_source": written != relative,
                "machine_written": item["machine_written"],
                "before_copy": item["before_copy"],
            }
        )

    # ── pass D: the origin, listed again. Proof rather than a claim. ──────────
    after_entries, _ = survey(origin)
    after = listing_signature(after_entries)
    drifted = sorted(
        set(before) ^ set(after)
    ) + sorted(path for path in set(before) & set(after) if before[path] != after[path])

    if mismatched or drifted:
        report = []
        for path, why, expected, got in mismatched:
            report.append(f"  {path}\n    {why}\n    original {expected}\n    copy     {got}")
        for path in drifted:
            report.append(
                f"  {path}\n    this changed in the ORIGINAL while I was reading it"
            )
        raise Refusal(
            "I am not going to tell you this is frozen, because it is not.\n"
            + "\n".join(report)
            + "\n\n"
            "What I did and did not do:\n"
            f"  · The copies are in {destination}. They are still there, I never "
            "delete anything, because a half-finished move that deletes is how a "
            "person loses the only copy they had.\n"
            "  · I have written NO record beside them, so nothing in your folder "
            "claims they are frozen.\n"
            "  · Your original was not changed by me.\n"
            "\n"
            "The likeliest cause by a long way is that something else on this "
            "machine was writing to that folder while I read it, a backup, a "
            "program that keeps your files the same on your phone, or a window you "
            "had open. Close what you can, then run this again with a different "
            "name. If it happens twice, stop and tell your lawyer what you see "
            "here rather than trying to tidy it.",
            code=EXIT_NOT_FAITHFUL,
        )

    # ── the record ────────────────────────────────────────────────────────────
    checklist = checklist_bytes(recorded)
    whole_set = digest_of_bytes(checklist)
    directories = sum(1 for item in entries if item["kind"] == "directory")

    record = {
        "_note": (
            "Written by the Machine Witness freeze command. It is the record of "
            "what was copied and of the copies not having changed. Safe to read. "
            "Do not hand-edit: a frozen set is corrected by adding a note beside "
            "it, never by changing it."
        ),
        "record_schema": RECORD_SCHEMA,
        "tool": {
            "name": TOOL_NAME,
            "version": TOOL_VERSION,
            "python": sys.version.split()[0],
            "platform": sys.platform,
        },
        "set": name,
        "frozen_at_utc": started_utc,
        "frozen_at_unix_ns": started_ns,
        "digest_algorithm": DIGEST_NAME,
        "origin": {
            "as_given": str(source),
            "resolved": str(origin),
            "shape": shape,
        },
        "copies_in": f"{COPIES_DIR}/{name}",
        "checklist": f"{RECORD_DIR}/{name}{CHECKLIST_SUFFIX}",
        "whole_set_digest": whole_set,
        "how_to_check": {
            "whole_set": f"shasum -a 256 {RECORD_DIR}/{name}{CHECKLIST_SUFFIX}",
            "every_file": f"shasum -a 256 -c ../../{RECORD_DIR}/{name}{CHECKLIST_SUFFIX}",
            "note": (
                "Run the second one from inside the copies folder. Both use the "
                "platform's own tool and need nothing of ours installed."
            ),
        },
        "scope": (
            "The source as it was found, nothing selected, nothing left out, "
            "nothing reordered, nothing renamed. Anything that could not be copied "
            "is listed with the reason."
        ),
        "normalisation": {
            "content": (
                "Bytes were copied and digested exactly as found. No line endings "
                "were translated, no byte-order mark was removed, and nothing was "
                "trimmed."
            ),
            "filenames": (
                "Names were recorded exactly as this machine reported them. No "
                "unicode form was applied. The form each name was already in is "
                "recorded per entry, and any name your computer spelled "
                "differently when it wrote the copy is listed separately."
            ),
        },
        "counts": {
            "recorded": len(entries),
            "copied": len(recorded),
            "directories": directories,
            "not_copied": len(not_copied),
            "machine_written": sum(1 for item in recorded if item["machine_written"]),
            "bytes": copied_bytes,
        },
        "baseline": {
            "verified": len(recorded),
            "mismatched": 0,
            "unverifiable": len(not_copied),
            "why": (
                "The outcome profile at the moment of freezing. A later check is "
                "expected to reproduce these three numbers exactly. A check that "
                "demands everything be green gets switched off in the first week; "
                "a check that demands the same answer as last time keeps working."
            ),
        },
        "origin_unchanged": {
            "entries_before": len(before),
            "entries_after": len(after),
            "identical": True,
            "compared": ["kind", "bytes", "permissions", "modified_ns"],
            "said_plainly": (
                "The original was listed before it was read and again afterwards, "
                "and the two listings are identical: the same entries, the same "
                "sizes, the same permissions and the same modification times. "
                "Reading a file can update the time it was last opened, on most "
                "systems, and nothing can prevent that. The time each file was "
                "last opened is recorded above as it was BEFORE the read, so the "
                "change is visible rather than hidden. Nothing was written to the "
                "original, nothing was moved and nothing was deleted."
            ),
        },
        "name_differences": name_differences,
        "not_copied": not_copied,
        "machine_written_note": (
            "Entries flagged machine_written were written by the operating system "
            "rather than by the person. They were copied and recorded like "
            "everything else, because leaving them out would be a selection. They "
            "are flagged so a later count that includes them is not mistaken for "
            "something added to the set."
        ),
        "what_this_does_not_establish": WHAT_THIS_DOES_NOT_ESTABLISH,
        "entries": recorded,
    }

    payload = json.dumps(record, indent=2, ensure_ascii=False).encode("utf-8")
    write_private_bytes(workspace, checklist_path, checklist)
    write_private_bytes(workspace, readable_path, readable_record(record))
    write_private_bytes(workspace, record_path, payload)

    # ── the report. ⛔ Every number derived; none of them typed. ──────────────
    counts = record["counts"]
    out.write(
        "\n".join(
            [
                "Frozen.",
                "",
                f"  from            {origin}",
                f"  copies in       {destination}",
                f"  record in       {record_root}",
                "",
                f"  files copied and checked        {counts['copied']}",
                f"  entries recorded in total       {counts['recorded']}",
                f"  folders inside the source       {counts['directories']}",
                f"  entries recorded but not copied {counts['not_copied']}",
                f"  written by the machine itself   {counts['machine_written']}",
                f"  bytes copied                    {counts['bytes']}",
                "",
                f"  one digest for the whole set    {whole_set}",
                "",
                "  Each file was digested twice, from two separate readings: once "
                "where you keep it, and again after it was copied. The two agreed "
                f"for all {counts['copied']} of them.",
                "",
                f"  {record['origin_unchanged']['said_plainly']}",
                "",
                f"  {WHAT_THIS_DOES_NOT_ESTABLISH}",
                "",
                "Anybody can check this without installing anything of ours. From "
                "inside the copies folder:",
                f"    {record['how_to_check']['every_file']}",
                "",
                "To check it again with this tool, run:",
                f"    {command_line('verify.py', workspace, name)}",
                "",
                "  That asks first whether reading it was checked, the same way "
                "this did, and it stops and says so if it was not. Nothing here "
                "reads anything before that has been answered.",
                "",
            ]
        )
    )
    return EXIT_OK


def command_line(script, workspace, name):
    """One copy-pasteable line, with the real paths already in it.

    A person who has to remember a path will not, and the failure that taught this
    project so was somebody concluding they had destroyed their own case folder
    because a tool could not find it and did not say why.
    """
    interpreter = sys.executable or "python3"
    if not os.path.basename(interpreter).startswith("python"):
        interpreter = "python3"
    return (
        f"{interpreter} {HERE.parent / script} --into {workspace} --name {name}"
    )


# ═══════════════════════════════════════════════════════════════════════════════
# Entry point
# ═══════════════════════════════════════════════════════════════════════════════


def build_parser():
    parser = argparse.ArgumentParser(
        prog="freeze.py",
        description=(
            "Copy a file or folder you own, digest both sides, and write a record "
            "of it beside the copies. The original is never changed."
        ),
    )
    parser.add_argument(
        "source",
        nargs="?",
        default=None,
        help="the file or folder to freeze. Yours, on this machine",
    )
    parser.add_argument(
        "--into",
        default=None,
        help="the folder that holds your case files. It has to exist already",
    )
    parser.add_argument(
        "--name",
        default=None,
        help="a short plain name for this set. Defaults to the source's own name",
    )
    parser.add_argument(
        "--excluded-class",
        action="store_true",
        help=(
            "this source may contain intimate or sexual pictures or video. "
            "Refuses outright and reads nothing at all"
        ),
    )
    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)

    # 🔴 FIRST, BEFORE EVERY OTHER CHECK, AND BEFORE ONE FILESYSTEM CALL.
    #
    # Nothing above this point has touched the path. Nothing below it runs. In
    # particular this is BEFORE the missing-argument checks, deliberately: an
    # argument error here would exit with a usage message, which is a refusal
    # nobody can act on and which routes the person nowhere. A refusal with no
    # route leaves them holding the problem.
    if args.excluded_class:
        sys.stdout.write(f"\n{EXCLUDED_CLASS_REFUSAL}\n\n")
        return EXIT_REFUSED

    if not args.source:
        parser.print_help()
        return EXIT_USAGE
    if not args.into:
        sys.stdout.write(
            "\nI need to know which folder holds your case files, and I am not "
            "going to guess.\n"
            "  add  --into /the/folder/you/confirmed\n"
            "If you have not made one yet, run the walk-through first. It asks "
            "where it should go and shows you where it will land before it creates "
            "anything.\n\n"
        )
        return EXIT_REJECTED

    try:
        return freeze(args.source, args.into, args.name)
    except (Refusal, capture_audit.Refusal) as exc:
        # ⛔ RELAYED VERBATIM, and the go-ahead check's refusals are relayed by the
        # same two lines as this program's own. Two classes, because the check
        # raises the engine's refusal type rather than this file's, their exit
        # codes are the same numbers, and paraphrasing one of them into the other
        # would be a second wording of a stop that must have exactly one.
        sys.stdout.write(f"\n{exc}\n\n")
        return exc.code


if __name__ == "__main__":
    sys.exit(main())
