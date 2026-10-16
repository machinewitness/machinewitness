#!/usr/bin/env python3
"""capture_audit.py, what the act of reading writes, and the permission that has
to exist before anything reads anything.

⛔ THIS IS NOT A DECLARATION, AND THE DIFFERENCE IS THE WHOLE POINT.

An earlier draft of this precondition was satisfied by a reference document that
SAID one existed. A document that declares a precondition is a phrase; a gate is
a gate. This file is the gate. And a note about a source written by somebody at
some point is not enough either. It can be stale, it can have been copied in
from another matter, it can be malformed, it can have been made up. So the
permission is BOUND: to one source, to one operation, to one folder, to one
contract, and to a recent moment.

TWO SUBCOMMANDS, deliberately separate:

  audit   Asks what the act of reading would WRITE, answers
          go / go-with-cost / do-not-touch-route-to-counsel, and on the first
          two writes a permission into the person's own folder.
  check   The dispatcher's preflight, run BEFORE the first read. Refuses unless
          a permission exists for exactly this source and exactly this
          operation. Five checks, in a fixed order, and it names the one that
          failed.

🔴 NOTHING IN THIS FILE OPENS THE SOURCE. Not to classify it, not to fingerprint
it, not to measure it. The binding is the RESOLVED PATH and nothing else, because
a fingerprint of the content would be the very read this gate runs in front of.
and on a source that must not be opened at all, "a quick look to identify it" is
the entire failure. `Path.resolve()` follows links and reads directory entries;
it never opens the thing at the end of the chain.

WHAT IT GOES ON, AND WHAT IT DOES NOT. It is the person's own account of how
they came to be holding the thing, matched against a table drawn from
`docs/methods/08_capture_hazards.md`. It is NOT an inspection of the source and
it cannot be: whether opening a surface joins somebody to it is a fact about a
platform, not a fact about a file. So an unanswered question is treated as the
hazardous answer, every time, with no exception, the same rule the contract
already applies to `unsure`.

WHAT IT CANNOT ESTABLISH, said here rather than implied. This is not proof
against somebody who sets out to defeat it: the permission sits in the person's
own folder and they own every byte of it. It is proof against the four things
that actually happen, a permission that was never obtained, one obtained for
something else, one obtained long enough ago that the answers may have changed,
and one carried over from a different folder. And it is proof against an
assistant deciding to press on regardless, which is the failure this project can
least afford.

READS     the person's own working note in their folder, and the installed
          contract's digest by way of the engine. Never the source.
WRITES    one file, inside the folder the person confirmed. Nothing else, ever.
NETWORK   none, and no code path here could acquire one.
"""

from __future__ import annotations

import argparse
import json
import os
import stat
import sys
import time
from pathlib import Path

# ⛔ SET BEFORE THE SIBLING MODULE IS IMPORTED, and this file was missing it.
# Importing a module writes a bytecode cache beside it otherwise, which puts a file
# into the install tree that nobody asked for and that the build would then have to
# know about. Found by running this command in an isolated install tree WITHOUT the
# environment variable that suppresses the cache. The suites that drive it all set
# that variable, which is exactly what hid it. The two files that already had this
# line say why; this one now says it too.
sys.dont_write_bytecode = True

HERE = Path(__file__).resolve()

# The engine is the single source of truth for the contract, its digest, the
# refusal type and the exit codes. Importing it is deliberate: a second copy of
# "which contract is installed" is a second answer waiting to disagree.
if str(HERE.parent) not in sys.path:
    sys.path.insert(0, str(HERE.parent))

import triage  # noqa: E402  imported after the path is set, for the reason above

Refusal = triage.Refusal

EXIT_OK = triage.EXIT_OK
EXIT_REJECTED = triage.EXIT_REJECTED
EXIT_REFUSED = triage.EXIT_REFUSED
EXIT_USAGE = triage.EXIT_USAGE

# ═══════════════════════════════════════════════════════════════════════════════
# The permission, and every number in it
# ═══════════════════════════════════════════════════════════════════════════════

PERMISSION_SCHEMA = 1

# 🔴 It lives inside the folder the engine already made and already described, in
# the one the engine set aside for exactly this. ⛔ Never a new entry at the top
# of the person's folder: a folder listing is a screen, and the engine counts what
# it told them is in there.
PERMISSION_FILENAME = "checked-before-reading.json"

# Half an hour. A permission that never expires is not a permission. The answers
# behind it are about a live situation, and a condition can be varied, a new order
# can arrive, and a person can learn something between one hour and the next. The
# figure is short on purpose: re-running the audit costs a few seconds, and
# getting it wrong costs somebody their liberty.
GOOD_FOR_SECONDS = 1800

# A clock that has moved is not a source anybody should trust, so a permission
# stamped in the future is refused rather than rounded down. Two minutes of slack
# absorbs an ordinary correction without accepting a reset.
CLOCK_SLACK_SECONDS = 120

# ⛔ A CLOSED SET. "Bound to this operation" means nothing if the operation is
# free text, a permission for `look` would satisfy a check for `look`, and both
# would be invented at the point of use.
OPERATIONS = ("freeze", "verify")

# ═══════════════════════════════════════════════════════════════════════════════
# The four answers
# ═══════════════════════════════════════════════════════════════════════════════

GO = "go"
GO_WITH_COST = "go-with-cost"
DO_NOT_TOUCH = "do-not-touch-route-to-counsel"

# 🔴 A FOURTH ANSWER, AND IT EXISTS BECAUSE THE THIRD ONE WAS BEING USED AS A
# CATCH-ALL. A missing answer refuses, like `DO_NOT_TOUCH` — but `DO_NOT_TOUCH`
# ends with "it goes to your lawyer instead, exactly as it is", which is a verdict
# ON THE THING. Said to somebody who merely left a flag off, that is the tool
# telling them their own export is the class it will not handle. Same exit code,
# different sentence, and the sentence was the defect.
NEED_AN_ANSWER = "answer-the-questions-first"

# ⛔ Unchanged, and the new answer is deliberately NOT in it. Nothing reads
# anything on this path.
PERMITTED_ANSWERS = (GO, GO_WITH_COST)

# ═══════════════════════════════════════════════════════════════════════════════
# HOW THEY CAME TO BE HOLDING IT. The table, and it is the whole classifier
#
# Drawn from `docs/methods/08_capture_hazards.md`. Every value is a statement
# about the person's OWN holding of the thing. ⛔ Not one of them asks anything
# about anybody else, and none of them can be answered by looking somebody up.
#
# `writes` is what the ACT OF READING creates, notifies, joins or logs, in words
# a frightened person can act on. It is printed for `go` as well, because "this
# writes nothing" is the sentence that makes the other answers legible.
# ═══════════════════════════════════════════════════════════════════════════════

ARRIVALS = {
    "already-on-your-device": {
        "answer": GO,
        "writes": [
            "Reading a file that is already on your own machine creates nothing "
            "anywhere and tells nobody anything.",
        ],
    },
    "your-own-completed-export": {
        "answer": GO,
        "writes": [
            "The service already handed this over, under an obligation, and it "
            "is finished. Reading the file it gave you touches nothing live.",
        ],
    },
    "the-original-message-you-already-hold": {
        "answer": GO,
        "writes": [
            "Reading the message file itself creates nothing. It is already in "
            "your hands.",
            "⛔ Do not follow any link inside it and do not open an attachment. "
            "A link is often addressed to one recipient, and following it makes "
            "a dated entry in somebody else's records, today.",
        ],
    },
    "signing-in-to-your-own-account": {
        "answer": GO_WITH_COST,
        "writes": [
            "Signing in writes a dated entry naming a device and a rough place. "
            "It becomes part of what can be asked for later, and somebody will "
            "want it explained.",
            "On a first sign-in from a new device, matching your contacts can "
            "produce a suggestion or a message to other people without you doing "
            "anything.",
            "Your account may show as active while the app is open.",
            "⛔ Go to the part of your own account that hands you a file. Do not "
            "go anywhere else in it, and do not open a conversation.",
        ],
    },
    "a-link-that-was-sent-to-you": {
        "answer": DO_NOT_TOUCH,
        "writes": [
            "A link in a notice is usually addressed to one recipient. Following "
            "it writes a present-day entry into the very record your lawyer is "
            "about to ask for, and it shows you using it now.",
            "Keep the message exactly as it arrived. Your lawyer opens it, or "
            "nobody does.",
        ],
    },
    "opening-a-conversation-or-thread": {
        "answer": DO_NOT_TOUCH,
        "writes": [
            "Opening it can add you to it. On some services a read is a contact.",
            "It can send a seen, a typing signal, or a mark that you were there.",
            "None of that can be taken back once it has happened.",
        ],
    },
    "somebody-elses-device-or-account": {
        "answer": DO_NOT_TOUCH,
        "writes": [
            "This tool only ever handles what is yours: your own machine, your "
            "own account, the file a service handed to you.",
            "Anything else goes through your lawyer, and it goes to somebody "
            "qualified, not through here.",
        ],
    },
}

# The two questions that can stop anything, whatever the table says. Asked
# separately because each is absolute on its own and each has its own reason.
VETO_MEDIA = "might-hold-intimate-media"
VETO_CLOSED = "closed-by-your-conditions"

YES_NO_UNSURE = ("yes", "no", "unsure")

# ⛔ `unsure` IS TREATED AS `yes`. A question that was never asked is not a
# question that was answered no, and a gate whose default is the permissive answer
# is a gate that is off by default.
HAZARDOUS = ("yes", "unsure")

# 🔴 ABSENT REFUSES, BUT IT IS NOT THE SAME REFUSAL AS `unsure`, AND CONFLATING
# THE TWO PUT THE WORST SENTENCE IN THIS TOOL IN FRONT OF THE WRONG PERSON.
#
# Absent used to arrive here as the literal string `unsure`, so a person who left
# a flag off — because nothing had ever told them it existed — was answered with
# `MEDIA_REFUSAL`: stop, this is not handled for anybody, route it to your lawyer.
# For an ordinary export sitting in their own downloads folder. They had said
# nothing, and the tool replied as though they had said the one thing that ends
# the conversation.
#
# ⛔ THE DIRECTION DOES NOT CHANGE. Absent still refuses, and it refuses before
# the arrivals table is consulted. What changes is that the refusal says an answer
# is MISSING rather than saying something about what they are holding.
UNANSWERED = None

# 🔴 THE DESCRIPTION OF THE CLASS, AND THE FRAMING PHRASE, ARE BOTH READ FROM THE
# ENGINE'S OWN CONSTANTS. Three surfaces refuse this, the contract's fence, the
# copy command's notice, and this, and each one used to type the words out.
#
# ⚠️ The FLAG that asks about it is `--might-hold-intimate-media` here and
# `--excluded-class` on the copy command. That difference is deliberate and the
# question is OPEN WITH THE OWNER: plain words read better on a screen, and a flag
# naming this class lands permanently in the shell history of a machine that may
# later be examined, where opaque wording is safer. ⛔ Only the description is
# unified. See `triage.EXCLUDED_CLASS`.
MEDIA_REFUSAL = (
    "⛔ Stop here, and this is the same answer for every person who uses this, "
    f"{triage.FENCE_DISCLAIMER}, or about your situation.\n"
    f"{triage.EXCLUDED_CLASS_RULE} "
    "That means no copy, no listing, no preview, no seal, and no checking "
    "whether. Not one byte of it is read.\n"
    "Tell your lawyer, and let them arrange somebody qualified to handle it. "
    "Mishandling that kind of file creates a fresh problem of its own, for you "
    "and for me, which is why the line is absolute rather than a judgement about "
    "your case."
)

CLOSED_REFUSAL = (
    "⛔ Your own answers earlier closed this path, and nothing here reopens it.\n"
    "A clean answer to what the reading would write is not a permission to do "
    "it. The two are different questions, and this one is already settled.\n"
    "Your folder holds the list of paths that are shut and the reason for each. "
    "Show it to your lawyer and ask them what to do about this one."
)

UNSURE_ROUTE = (
    "If you are not sure, that IS the answer for now: treat it as a yes, leave "
    "it exactly as it is, and ask your lawyer. Being unsure whether reading "
    "something writes something is precisely when reading it is dangerous."
)


def unanswered_refusal(flags):
    """The stop for a question that was never put, naming each one that is missing.

    ⛔ SAYS NOTHING ABOUT WHAT THEY HAVE, deliberately and in those words. This is
    the whole point of separating it from `MEDIA_REFUSAL`: the person is being told
    the tool is short of an answer, not being told what the tool thinks of their
    file. The old behaviour said the second thing, and it said it in the most
    absolute language in the program.

    ⛔ Every missing flag at once. One at a time would send somebody back around
    this loop twice for two questions nobody had shown them yet, which is the same
    defect in a politer voice.
    """
    missing = "\n".join(f"  not answered  --{flag}" for flag in flags)
    return (
        "There are questions here I have not been given an answer to, so I am not "
        "reading anything yet.\n"
        f"{missing}\n"
        "⛔ This is not a statement about what you have. A question nobody "
        "answered is not a question that was answered no, so an unanswered one "
        "stops me rather than being guessed at in either direction.\n"
        "Answer each of them and run this again. `unsure` is a real answer and it "
        "is allowed — it is treated as a yes, which stops this too, but it stops "
        "it for a reason you chose."
    )

# ═══════════════════════════════════════════════════════════════════════════════
# The audit
# ═══════════════════════════════════════════════════════════════════════════════


def classify(arrived_as, might_hold_intimate_media, closed_by_your_conditions):
    """The verdict, and the reason, from three answers and nothing else.

    Order matters. The most absolute reason is named first, because a person who
    is told three things remembers the first one.

    ⚠️ AND THE UNANSWERED CHECK COMES THIRD, NOT FIRST, WHICH LOOKS BACKWARDS AND
    IS NOT. `UNANSWERED` is not in `HAZARDOUS`, so the two fences above skip a
    missing value on their own and an ANSWERED absolute reason still wins. Putting
    the missing-answer stop first would hide a stated `yes` to the media question
    behind a note about a different flag being blank, which loses the one sentence
    that must land.
    """
    if might_hold_intimate_media in HAZARDOUS:
        return DO_NOT_TOUCH, [MEDIA_REFUSAL], VETO_MEDIA
    if closed_by_your_conditions in HAZARDOUS:
        return DO_NOT_TOUCH, [CLOSED_REFUSAL], VETO_CLOSED

    unanswered = [
        flag
        for value, flag in (
            (might_hold_intimate_media, VETO_MEDIA),
            (closed_by_your_conditions, VETO_CLOSED),
        )
        if value is UNANSWERED
    ]
    if unanswered:
        return (
            NEED_AN_ANSWER,
            [unanswered_refusal(unanswered)],
            # ⛔ Plain words rather than the flag names joined together. The flags
            # are already named, one per line, in the refusal directly above this
            # in the output — and repeating them here put the excluded class's
            # description into a summary line about a blank field.
            "a question that was not answered",
        )

    entry = ARRIVALS.get(arrived_as)
    if entry is None:
        # Fail closed. An arrival this table does not know is an arrival nobody
        # has thought about, and the honest answer to that is not "probably fine".
        return (
            DO_NOT_TOUCH,
            [
                "I do not have an answer for how this one reached you, and I am "
                "not going to guess at what reading it would set off.",
                UNSURE_ROUTE,
            ],
            "arrived-as",
        )
    return entry["answer"], list(entry["writes"]), "arrived-as"


def audit_command_lines(workspace, source, operation):
    """The line that makes the permission a refusal has just failed to find.

    🔴 EVERY REFUSAL THAT SAYS "RUN THE CHECK" GETS THIS, and the reason is that
    for the whole life of this program none of them said WHICH check. A person who
    followed the tool's own closing instruction ran the copy command, was told to
    run a check first, and was told nothing about how. That is a stop with no route
    out of it, at the last step of the only path the tool tells anybody to walk.

    ⛔ THE TWO ABSOLUTE QUESTIONS ARE NOT PRINTED HERE, and that is not an
    oversight. One of the flag names describes the excluded class, and a flag naming
    that class lands permanently in the shell history of a machine that may later be
    examined — whether it should is OPEN WITH THE OWNER, see `triage.EXCLUDED_CLASS`.
    Printing a ready-to-paste line containing it would close that decision by
    shipping, and would also hand somebody a pre-filled answer to the most absolute
    question in the tool. So the command stops short, `classify` refuses on the
    missing answers, and THAT refusal names them. The assistant is told to ask both
    up front, which is where the question belongs.
    """
    return [
        "Run this first. It asks what reading it would write, and records the answer:",
        "",
        "  "
        + " ".join(
            [
                triage.interpreter(),
                str(HERE),
                "audit",
                "--workspace",
                str(workspace),
                "--source",
                str(source),
                "--operation",
                operation,
                "--arrived-as",
                "HOW-IT-REACHED-YOU",
            ]
        ),
        "",
        "Replace the last one with whichever of these is true. ⛔ Your own account "
        "of it, not something to go and check:",
        # Derived from the table, never listed by hand. An arrival added to
        # `ARRIVALS` appears here without anybody remembering to come back.
        *(f"  {arrival}" for arrival in sorted(ARRIVALS)),
        "",
        "It will then tell you the two things it still needs before it decides. "
        "Both are about you, not about the file.",
    ]


def audit_command_text(workspace, source, operation):
    """`audit_command_lines` as one block, for embedding in a refusal.

    ⛔ ONE WRAPPER, so every refusal that carries the route carries the same words.
    Nine of them say "run the check"; nine hand-written command lines would be nine
    chances for one of them to name a flag the others do not.
    """
    return "\n".join(audit_command_lines(workspace, source, operation))


def render_audit(source, operation, answer, writes):
    """What the person is shown. One idea per line, the answer stated plainly."""
    lines = [
        "What reading this would write",
        "",
        f"  what   {source}",
        f"  for    {operation}",
        "",
    ]
    for sentence in writes:
        # A sentence may run to several lines. The two absolute refusals do.
        # Continuations are indented under the bullet rather than left hanging at
        # the margin, where they read as a new and unrelated point.
        first, *rest = sentence.split("\n")
        lines.append(f"  · {first}")
        lines.extend(f"    {more}" for more in rest)
    lines.append("")
    if answer == GO:
        lines.append(
            "Answer: go. Nothing about reading this reaches anybody or leaves a "
            "mark anywhere."
        )
    elif answer == GO_WITH_COST:
        lines.append(
            "Answer: go, and it costs you something. The lines above are the "
            "cost, they are written down beside the permission, and your lawyer "
            "should be told about them."
        )
    elif answer == NEED_AN_ANSWER:
        # ⛔ NOT "do not touch this". Nothing has been decided about the thing
        # itself, and saying otherwise is what this branch exists to stop.
        lines.append(
            "Answer: not yet, and not because of anything about what you have. "
            "Answer what is missing above and run this again."
        )
    else:
        lines.append(
            "Answer: do not touch this. It goes to your lawyer instead, exactly "
            "as it is."
        )
    return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# The folder, and the file the permission lives in
# ═══════════════════════════════════════════════════════════════════════════════


def permission_path(workspace):
    """Where the permission lives, derived from the engine's own folder names.

    ⛔ Never a string of our own. The engine owns the two folder names and says
    out loud that a later command must read them from its constant.
    """
    return Path(workspace) / triage.WORKSPACE_DIRS[1] / PERMISSION_FILENAME


def working_note(workspace):
    """The person's own working note, read to establish this IS their folder.

    Two things come out of it: that the engine has been through this folder at
    all, and which contract it was walking. A permission carried in from another
    matter fails on the first; one made before a rebuilt contract fails on the
    second.
    """
    path = Path(workspace) / triage.STATE_FILENAME
    if not path.is_file():
        raise Refusal(
            "I cannot check anything about this folder, because it is not one of "
            "mine.\n"
            f"  folder  {workspace}\n"
            f"  looked for  {path.name}\n"
            "Start in the folder you set up at the beginning. ⛔ Do not create "
            "that file by hand. It is the record of what you answered, and one "
            "written by hand is a record of nothing."
        )
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise Refusal(f"I cannot read the working note in that folder: {exc}")
    if not isinstance(data, dict) or data.get("schema") != triage.STATE_SCHEMA:
        raise Refusal(
            "The working note in that folder was written by a different version "
            "of this tool, so I cannot tell what it means. Do not work around "
            "it, say so, and stop."
        )
    return data


def installed_contract_digest():
    """The digest of the contract this install actually holds.

    The engine digests the FILE, never a string read out of it. Left to the engine
    on purpose: command substitution strips a trailing newline and reports a
    mismatch on a byte-identical file, and a false failure trains people to
    ignore the check.
    """
    _tree, digest = triage.load_contract()
    return digest


def read_permission_file(workspace, source, operation):
    """The permission file, parsed, or a refusal naming what is wrong with it.

    ⛔ A missing file is a refusal, not an empty result. "Nothing there" and
    "nothing checked" are the same to a caller that treats absence as clean, and
    that is the failure this whole file exists to prevent.

    ⚠️ `source` and `operation` are here ONLY so the refusals can carry the command
    that repairs them, and they are required rather than optional because the single
    caller always has both. An optional argument that is always supplied is a
    signature saying the route is nice-to-have; it is the whole difference between a
    stop somebody can act on and one they cannot.
    """
    route = audit_command_text(workspace, source, operation)
    path = permission_path(workspace)
    if not path.is_file():
        raise Refusal(
            "Nothing has been checked for this yet, so I am not going to read "
            "anything.\n"
            f"  folder  {workspace}\n"
            "The point of the order is that once something has been read it "
            "cannot be unread.\n\n"
            f"{route}"
        )
    try:
        raw = path.read_text(encoding="utf-8")
    except OSError as exc:
        raise Refusal(f"I cannot read what was checked before: {exc}")
    if not raw.strip():
        raise Refusal(
            "The record of what was checked before is empty. That can happen if "
            "something was interrupted half-way through writing it. An empty "
            "record is not a permission.\n\n"
            f"{route}"
        )
    try:
        data = json.loads(raw)
    except ValueError as exc:
        raise Refusal(
            "The record of what was checked before is damaged and I will not "
            f"guess at what it meant: {exc}\n\n"
            f"{route}"
        )
    return data


def write_permission(workspace, digest, entry):
    """Add or replace one permission, and leave the file readable by them alone.

    ⛔ Written whole, not appended to. A half-written file fails the schema check
    on the next run, which is the safe direction: a truncated permission refuses,
    it does not half-permit.
    """
    path = permission_path(workspace)
    if not path.parent.is_dir():
        raise Refusal(
            "That folder is missing the part I keep this in.\n"
            f"  expected  {path.parent}\n"
            "⛔ I am not going to create it here. Go back to the beginning in "
            "that folder so the whole thing is set up the way it was described "
            "to you."
        )

    existing = []
    if path.is_file():
        try:
            previous = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(previous, dict) and isinstance(previous.get("checks"), list):
                existing = [
                    item
                    for item in previous["checks"]
                    if isinstance(item, dict)
                    and (item.get("before_reading"), item.get("so_that"))
                    != (entry["before_reading"], entry["so_that"])
                ]
        except (OSError, ValueError):
            # A damaged file is replaced rather than merged into. Merging into
            # something unparseable is how a bad record survives a rewrite.
            existing = []

    document = {
        "_note": (
            "What was checked before anything was read, and what the reading "
            "would write. Written by this tool. Safe to read; do not hand-edit, "
            "a permission written by hand is a record of nothing."
        ),
        "schema": PERMISSION_SCHEMA,
        "made_for_the_folder": str(workspace),
        "made_against_contract": digest,
        "checks": [*existing, entry],
    }
    path.write_text(json.dumps(document, indent=2) + "\n", encoding="utf-8")
    try:
        os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        # Best effort, exactly as the engine treats it. A filesystem that cannot
        # hold the mode is not a reason to stop, and it is not claimed as a
        # protection anywhere.
        pass
    return path


# ═══════════════════════════════════════════════════════════════════════════════
# 🔴 THE GATE. Five checks, in order, before the first read.
# ═══════════════════════════════════════════════════════════════════════════════

CHECKS_RUN = (
    "the record's own shape",
    "the contract it was made against",
    "the folder it was made for",
    "it names this exact source and this exact operation",
    "it was made recently enough to still mean something",
)


def permission_or_refuse(workspace, source, operation, now=None):
    """The dispatcher's preflight. Returns the bound permission, or refuses.

    ⛔ CALLERS: import this and call it BEFORE the first read. Do not shell out
    to this file, a child process is a capability that has to be declared, and
    an in-process call cannot be forgotten between two lines of code.

    🔴 The source is RESOLVED and never opened. Resolving follows links; it does
    not read the thing at the end of them. On a source that must not be opened at
    all, opening it to identify it is the whole failure.
    """
    if operation not in OPERATIONS:
        raise Refusal(
            f"I do not know what {operation!r} means, so I cannot say whether "
            "anything was checked for it. This is a fault in the tool, not "
            f"something you did. Known: {', '.join(OPERATIONS)}.",
            code=EXIT_REJECTED,
        )

    workspace = triage.resolve_workspace(workspace)
    source = Path(source).expanduser().resolve()
    now = time.time() if now is None else now

    # 🔴 THE ROUTE OUT, BUILT ONCE AND CARRIED BY EVERY REFUSAL BELOW THAT WANTS
    # THE CHECK RUN AGAIN. Nine refusals in this function and its helper used to end
    # in some wording of "run the check", and not one of them said which command
    # that was. Nine hand-written copies would be nine chances to drift, so there
    # is one.
    route = audit_command_text(workspace, source, operation)

    # 1, the record's own shape.
    document = read_permission_file(workspace, source, operation)
    if not isinstance(document, dict):
        raise Refusal("The record of what was checked before is not a record at all.")
    if document.get("schema") != PERMISSION_SCHEMA:
        raise Refusal(
            "The record of what was checked before was written by a different "
            f"version of this tool (its shape says {document.get('schema')!r}), so "
            "I am not going to trust it.\n\n"
            f"{route}"
        )
    checks = document.get("checks")
    if not isinstance(checks, list) or not checks:
        raise Refusal(
            "The record of what was checked before holds nothing.\n\n" f"{route}"
        )

    # 2, the contract it was made against.
    digest = installed_contract_digest()
    if document.get("made_against_contract") != digest:
        raise Refusal(
            "What was checked before was checked against a different version of "
            "the questions than the one installed now, so I do not know that the "
            "answers still stand.\n\n"
            f"{route}"
        )

    # 3, the folder it was made for. This is what stops a record travelling
    #     between matters: it names one folder, and so does the working note.
    note = working_note(workspace)
    for what, value in (
        ("the record", document.get("made_for_the_folder")),
        ("the working note", note.get("your_folder")),
    ):
        if value is not None and Path(str(value)).expanduser().resolve() != workspace:
            raise Refusal(
                "What was checked before belongs to a different folder, so it "
                "says nothing about this one. A record carried over from "
                "somewhere else is the exact thing this check exists to catch.\n"
                f"  this folder is    {workspace}\n"
                f"  but {what} names  {value}\n\n"
                f"{route}"
            )

    # 4, it names this exact source and this exact operation.
    bound = None
    for item in checks:
        if not isinstance(item, dict):
            continue
        named = item.get("before_reading")
        if not isinstance(named, str) or not named:
            continue
        if Path(named).expanduser().resolve() != source:
            continue
        if item.get("so_that") != operation:
            continue
        bound = item
        break
    if bound is None:
        raise Refusal(
            "Nothing was checked for this, so nothing is going to read it.\n"
            f"  what  {source}\n"
            f"  for   {operation}\n"
            "There may be a check here for something else, or for a different "
            "job on this same thing. Neither one covers this.\n\n"
            f"{route}"
        )

    # 5, it was made recently enough to still mean something.
    made_at = bound.get("made_at")
    if not isinstance(made_at, (int, float)):
        raise Refusal(
            "What was checked for this does not say when it was checked, so I "
            "cannot tell whether it still holds.\n\n"
            f"{route}"
        )
    good_for = bound.get("good_for_seconds")
    if not isinstance(good_for, (int, float)) or good_for <= 0:
        raise Refusal(
            "What was checked for this does not say how long it was good for.\n\n"
            f"{route}"
        )
    age = now - made_at
    if age > good_for:
        raise Refusal(
            "What was checked for this is too old to rely on. Your situation can "
            "change between one hour and the next, and the answers behind it are "
            "about a live situation rather than a fact about a file.\n"
            f"  checked  {int(age)} seconds ago\n"
            f"  good for {int(good_for)} seconds\n\n"
            f"{route}"
        )
    if age < -CLOCK_SLACK_SECONDS:
        raise Refusal(
            "What was checked for this is stamped later than now, so this "
            "machine's clock has moved or the record was not written by me. "
            "Either way I am not going to act on it.\n\n"
            f"{route}"
        )

    answer = bound.get("answer")
    if answer not in PERMITTED_ANSWERS:
        # ⛔ THE ONE REFUSAL HERE THAT DOES NOT CARRY THE ROUTE, DELIBERATELY. Every
        # other one above failed to FIND an answer; this one found it and it was no.
        # Handing somebody the command to run it again, here, is an invitation to
        # answer differently until it comes out the other way — and the answers
        # behind it are about their own situation, which re-running does not change.
        raise Refusal(
            "What was checked for this did not come out as something to go ahead "
            f"with (it says {answer!r}). That answer stands. Leave it exactly as "
            "it is and tell your lawyer."
        )
    return bound


# ═══════════════════════════════════════════════════════════════════════════════
# The command line
# ═══════════════════════════════════════════════════════════════════════════════


def build_parser():
    parser = argparse.ArgumentParser(
        prog="capture-audit",
        description=(
            "What the act of reading writes, and the permission that has to "
            "exist before anything reads anything. Nothing here opens the thing "
            "it is asked about."
        ),
    )
    sub = parser.add_subparsers(dest="command", required=True)

    ask = sub.add_parser("audit", help="ask what reading it would write, and record the answer")
    ask.add_argument("--workspace", required=True, help="the folder they set up")
    ask.add_argument("--source", required=True, help="what would be read")
    ask.add_argument("--operation", required=True, choices=list(OPERATIONS))
    ask.add_argument(
        "--arrived-as",
        required=True,
        choices=sorted(ARRIVALS),
        help="how they came to be holding it. Their own account of it, not an inspection",
    )
    # ⛔ BOTH ARE NEEDED AND NEITHER IS `required=True`, ON PURPOSE. argparse would
    # answer a missing one with a usage block and exit 2, and this file's sibling
    # already records why that is the wrong stop: a usage message is a refusal
    # nobody can act on, and it routes the person nowhere. Missing lands in
    # `classify` instead, which refuses in words and says what to add.
    ask.add_argument(
        f"--{VETO_MEDIA}",
        dest="might_hold_intimate_media",
        choices=list(YES_NO_UNSURE),
        default=UNANSWERED,
        help="required. Absent refuses as unanswered, and unsure counts as yes",
    )
    ask.add_argument(
        f"--{VETO_CLOSED}",
        dest="closed_by_your_conditions",
        choices=list(YES_NO_UNSURE),
        default=UNANSWERED,
        help="required. Absent refuses as unanswered, and unsure counts as yes",
    )

    gate = sub.add_parser(
        "check", help="the preflight a dispatcher runs before its first read"
    )
    gate.add_argument("--workspace", required=True)
    gate.add_argument("--source", required=True)
    gate.add_argument("--operation", required=True, choices=list(OPERATIONS))

    return parser


def do_audit(args):
    workspace = triage.resolve_workspace(args.workspace)
    source = Path(args.source).expanduser().resolve()
    answer, writes, decided_by = classify(
        args.arrived_as,
        args.might_hold_intimate_media,
        args.closed_by_your_conditions,
    )

    sys.stdout.write(render_audit(source, args.operation, answer, writes) + "\n")

    if answer not in PERMITTED_ANSWERS:
        sys.stdout.write(
            "\nNothing has been written down as allowed, and nothing will read "
            f"this. What decided it: {decided_by}.\n"
        )
        return EXIT_REFUSED

    digest = installed_contract_digest()
    working_note(workspace)  # refuses if this is not their folder
    entry = {
        "before_reading": str(source),
        "so_that": args.operation,
        "answer": answer,
        "what_it_writes": writes,
        "made_at": int(time.time()),
        "good_for_seconds": GOOD_FOR_SECONDS,
        "what_you_told_me": {
            "arrived_as": args.arrived_as,
            VETO_MEDIA.replace("-", "_"): args.might_hold_intimate_media,
            VETO_CLOSED.replace("-", "_"): args.closed_by_your_conditions,
        },
    }
    path = write_permission(workspace, digest, entry)
    sys.stdout.write(
        "\nWritten down, for this one thing and this one job, for the next "
        f"{GOOD_FOR_SECONDS // 60} minutes:\n  {path}\n"
    )
    return EXIT_OK


def do_check(args):
    bound = permission_or_refuse(args.workspace, args.source, args.operation)
    # 🔴 A pass says what it checked. A gate that reports a pass without saying
    # what it read is worth exactly what it read, and this project has shipped
    # the other kind twice.
    sys.stdout.write(
        f"ok, {len(CHECKS_RUN)} checks ran and all {len(CHECKS_RUN)} passed:\n"
    )
    for line in CHECKS_RUN:
        sys.stdout.write(f"  · {line}\n")
    sys.stdout.write(
        f"\n  what   {bound['before_reading']}\n"
        f"  for    {bound['so_that']}\n"
        f"  answer {bound['answer']}\n"
    )
    for sentence in bound.get("what_it_writes") or []:
        sys.stdout.write(f"  · {sentence}\n")
    return EXIT_OK


def main(argv):
    args = build_parser().parse_args(argv)
    try:
        if args.command == "audit":
            return do_audit(args)
        return do_check(args)
    except Refusal as exc:
        sys.stdout.write(f"{exc}\n")
        return exc.code


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
