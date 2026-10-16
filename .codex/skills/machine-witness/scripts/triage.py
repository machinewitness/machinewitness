#!/usr/bin/env python3
"""triage.py: the deterministic triage engine. Python 3 standard library only.

═══════════════════════════════════════════════════════════════════════════════
WHY THIS IS CODE AND NOT A MARKDOWN PLAYBOOK

The first draft of this flow was prose for an agent to follow. A probabilistic
reader cannot enforce a state machine: turn granularity, branch order,
resumability, write containment and refusal all degrade into suggestions. A live
walkthrough proves one model run behaved; it does not make an unsafe run
impossible. The measured failures of the prose draft were `H3` shown before
`H1`, eleven per-record questions collapsed into one invented list with four
dropped, five record types invented that do not exist, and a screen labelled
`O1`-`O5` that rendered only `O1`.

So traversal, order, answer validation and state live here, in one file, and the
reference documents relay what this prints.

═══════════════════════════════════════════════════════════════════════════════
OWNS      node traversal · branch resolution · answer validation · the state
          file · derived plan assembly · refusals
READS     ../data/tree.json, verified against ../data/tree.sha256. Refuses to
          run on a mismatch, naming it.
EMITS     ONE screen at a time, plain text, on stdout.
ACCEPTS   ONE answer at a time, validated against that node's options. An
          answer outside the list is REJECTED, never interpreted. No fuzzy
          matching, no "did you mean".
NEVER     interprets a condition · answers a legal question · asks what
          happened, who was involved, or what was alleged · writes outside the
          confirmed workspace · presents a retention period as fact · produces
          a score, total, ranking or prediction

⛔ NO DOUBLE-BRACE BUILD PLACEHOLDER MAY APPEAR IN THIS FILE: not in code, not
in a comment, not in this docstring. The build copies `.py` verbatim and aborts
the whole build if it finds one, and `--selftest` looks for it too. Every path is
resolved at runtime, relative to this file, which is why none is needed.

⛔ WORDS THAT MAY NOT REACH A HUMAN-VISIBLE STRING: manifest, hash, custody,
layer, classification, adversarial, or a rail number. They are fine here in
code, comments and tests, `--selftest` asserts they are absent from every
screen this engine can emit.

═══════════════════════════════════════════════════════════════════════════════
TRAVERSAL IS MECHANICAL. No order is transcribed from prose anywhere in this
file. For a node and an answer:

  1. `branch[answer]["next"]`  if the node has a branch with that key
  2. `next`                    if the node has one
  3. the next node in document order, the following entry in the same phase
     list, else the first node of the next phase list, in the order the phase
     keys appear in the contract, else the plan

`branch[answer]["set"]` is applied as written, which is where the fail-safe
behaviour comes from: the contract itself routes `unsure` to the cautious side
and sets the cautious flag. Nothing about that is decided here.

═══════════════════════════════════════════════════════════════════════════════
WHAT IS AUTHORED HERE RATHER THAN READ FROM THE CONTRACT, AND WHY

Each of these is a gap in the contract, not a preference. They are collected in
one place so none of them can hide, and `--selftest` fails if one goes stale.
Amending the contract is the owner's, never an agent's.

  A1  Option sets for the eleven per-record questions. The contract gives them
      an `ask` and no `options`. `ANSWER_SET_DEFAULT` is used, and the contract's
      own stated invariant governs the third one: "unsure" is treated as
      "probably yes, go and check".
  A2  An acknowledgement option for a screen that states something rather than
      asking. The contract declares no options for `guidance` or for the
      exclusion list, and one turn needs one accepted answer.
  A3  The exclusion screens, and the one idea each of them carries. The contract
      holds a single node with a flat list of items and no grouping, so both the
      split and the headings are authored. `EXCLUSION_GROUPS` declares which
      screen each item id belongs on; no count and no screen size is written
      down, and `Graph` VERIFIES at load time that the declared mapping places
      exactly the ids the contract holds. Refusing on an id the contract has and
      the mapping does not place, and on an id the mapping names and the contract
      no longer has. So adding an exclusion stops the engine rather than
      disappearing from every screen. The split this replaced was arithmetic and
      so could not go stale, but it put unrelated warnings on the same screen,
      and one screen carrying one idea is the whole reason to group at all.
  A4  Plain-language lines for `action:`, `limits:`, `clock:`, `fence:` and
      `double_edged:`. Those fields carry machine tokens; a token on screen is
      the "what does that word mean" failure the acceptance gate counts.
  A5  Suppression of a demand action when no lawyer is engaged. The contract
      sets `plan_mode: preservation_only` but no action or output block declares
      what that mode suppresses, and `L6` still names `preservation_demand`.
      Hard-coded here with a test until the contract encodes it.
  A6  The rank order of the `clock` words. `block_a.order_by` says `clock`; the
      ordinal sequence of the values is stated only in a contract comment, which
      does not survive into the JSON form.
  A7  Screen 0, the privacy statement, and the closed-path note. Authored, and
      quoted from the wave plan rather than invented.
  A8  `priority_note` is WITHHELD from every screen. 🔴 Three of its values
      contain the word "layer", which may not reach a human-visible string, and
      it is not one of the fields the contract requires verbatim. The urgency it
      carries is re-derived from `clock` and `clock_flag` instead of paraphrased,
      because a prose copy of a contract drifts. See the report for the
      amendment this needs.
  A9  `block_c` is rendered as a non-ranked per-source checklist with limits and
      NO totals. Its `counts:` invite an aggregate strength inference, with no
      banned word present, so a vocabulary check passes it. The contract still
      carries the totals; changing that is the owner's.
 A10  The folder screens. The contract holds no node for "where do the files
      go", and it needs one BEFORE the first per-record question so the answers
      have somewhere to land. Three authored screens sit at that boundary, and
      the boundary itself is DERIVED: they are shown immediately before the
      first node the contract marks with `layer`, never before a transcribed id.
      One of them is the only place in this engine that accepts free text, a
      filesystem path cannot be offered as a closed option list. It is still not
      interpreted: it is either `ok`, or something that looks like a full path,
      or it is rejected. A bare word is rejected rather than resolved against
      the current directory, which could be anywhere, including this tool.
 A11  What that folder holds, described so that the description and the count
      cannot drift apart: `FOLDER_CONTENTS` pairs each phrase with how many
      entries it accounts for, and `--selftest` requires the sum to equal the
      layout. An earlier draft described six things and printed a derived seven,
      and a reader's response was "either it lied or I cannot count, and I did
      not trust either answer".
 A12  The command form, printed on every screen that asks for an answer, and in
      the recovery screen. See the block above `ANSWER_SLOT` for the failure it
      exists to stop and why a file on disk is not an acceptable alternative.
 A13  Plain-language TITLES for the plan's actions, so a numbered step is an
      instruction a person can carry out rather than the question that produced
      it. A reader's whole action list was a list of the questions they had just
      been asked, and one step read "Do this" with no antecedent.
 A14  Closed-path replacement. When a person's own answer closes a path, the
      instruction to walk it is WITHHELD and only the prohibition in the
      contract's note is rendered. See `prohibitions_in`.
"""

import argparse
import collections
import hashlib
import json
import os
import re
import shlex
import shutil
import stat
import subprocess
import sys
import tempfile
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════════
# Where things are. Resolved at runtime, relative to this file, so the engine
# works from inside whichever installed provider tree it was copied into.
# ═══════════════════════════════════════════════════════════════════════════════

HERE = Path(__file__).resolve()
DATA_DIR = HERE.parent.parent / "data"
CONTRACT_JSON = DATA_DIR / "tree.json"
CONTRACT_SHA = DATA_DIR / "tree.sha256"

# ⚖️ The jurisdiction packs. `jurisdictions/` sits at the top of the repository,
# OUTSIDE the skill, so an installed tree has no route to it: the build emits this
# pair into every provider tree's data/ instead, the same way and for the same
# reason as the contract. ADR 0008 decision 6.
#
# 🔴 IT HOLDS `meta`, `review` AND `capabilities`, AND NOTHING ELSE. No legal
# answer is in this file, so the engine cannot render one. That is structural, not
# a rule written somewhere: it does not have the data.
PACKS_JSON = DATA_DIR / "packs.json"
PACKS_SHA = DATA_DIR / "packs.sha256"

# The install tree. A workspace may never be created inside it: matter facts
# belong to the person, in their own folder, never in the tool.
#
# ⚠️ `parent.parent` is the install root and is CORRECT. Installed, this file is
# at `<install>/scripts/triage.py`. But it says nothing about the tree ABOVE the
# install, and a project-local install has one. That is what the version-control
# refusal below covers; do not widen this constant to reach for it.
INSTALL_ROOT = HERE.parent.parent

# The one entry that marks the top of a version-controlled project. A DIRECTORY
# in an ordinary checkout, a FILE in a submodule or a linked worktree, both
# count, and a check that looked only for a directory would wave both through.
VERSION_CONTROL_MARKER = ".git"

# ═══════════════════════════════════════════════════════════════════════════════
# A20: the printable checklist writer, loaded from `scripts/shared/`.
#
# ⛔ BY EXPLICIT PATH, NOT BY `sys.path`. Putting a directory called `shared` on the
# import path in a program a stranger runs invites a collision with whatever else
# is installed on their machine, in both directions — and the failure would be an
# import of somebody else's module rather than an error. ADR 0008 puts it in
# `shared/` because the answer does not change in another country.
#
# ⚠️ A missing or broken writer is a REFUSAL in plain words, not a traceback. This
# is the most likely thing to go wrong in a hand-copied install, and the flow does
# not depend on it: everything the PDF says is also on the screen and in PLAN.md.
# ═══════════════════════════════════════════════════════════════════════════════
# ⛔ A PLAIN IMPORT, AND A DYNAMIC ONE IS NOT AN OPTION. The first version of this
# loaded the module from its path with the standard library's dynamic-import helper,
# and the rails check refused it outright: an import by string defeats static
# extraction, so the capability cannot be declared and a declaration for it could
# not be checked. That refusal has no exception path and is right to have none.
#
# ⚠️ The helper is not named here on purpose. The scanner reads comments too, and it
# is a capability check rather than a doctrine file — so naming the token in prose
# would fail the same check for no benefit. A plain `import` is visible to anything
# reading this file, which is the whole property being bought.
#
# ⚠️ `HERE` is this FILE, not its directory — `INSTALL_ROOT` above is
# `HERE.parent.parent`. Reading it as a directory made the sheet silently never
# appear, which is why the self-check asserts the writer is PRESENT rather than
# only that its absence is survivable.
#
# Inserted at position 0, so this directory wins over anything else on the path
# rather than being shadowed by it.
sys.path.insert(0, str(HERE.parent / "shared"))
try:
    import printable as PRINTABLE
except ImportError:
    # A missing writer is survivable: everything on the sheet is also on the screen
    # and in PLAN.md. ⛔ It is NOT survivable in the self-check.
    PRINTABLE = None

STATE_FILENAME = ".mw-state.json"
# ⚠️ BUMPED FOR THE JURISDICTION SCREEN. A session saved by the previous schema has
# no jurisdiction in it and no record of having been asked, so resuming it would
# either re-ask a question already answered or silently proceed with none. Both are
# worse than the refusal `from_state` already gives on a mismatch, which says what
# happened and tells the person to start again.
STATE_SCHEMA = 2

# ═══════════════════════════════════════════════════════════════════════════════
# A12, 🔴 THE COMMAND FORM, ON EVERY SCREEN THAT ASKS FOR AN ANSWER.
#
# The measured failure this exists to stop, from a walk-through by someone with no
# technical training: they confirmed a case folder, answered the next screen the
# ordinary way, and were told the tool could not find their case folder. They
# concluded they had destroyed it by answering a question the tool itself asked.
#
# THE CAUSE, and it is mechanical. `find_state` walks UP from the working
# directory. Confirming a folder MOVES the state file into that folder, which is
# almost never above where the person is standing, so from the very next turn
# onwards, the engine cannot find its own session unless it is told the path. It
# was never told, and it never said so.
#
# ⛔ THE FIX IS NOT A NEW FILE ON DISK. Information cannot travel from one run to
# the next except through a file or through an argument, and the only file that
# could carry it is a record of where a person keeps their case folder, which is
# exactly the artifact the pointer screen makes OPT-IN, and off by default,
# because it sits on a device that may be examined. So the argument is the answer,
# and the engine's job is to hand it over rather than expect it to be remembered:
# every screen prints the whole line, with the real path already in it.
#
# ⚠️ The interpreter and this file's own path are printed as they really are, so
# the line can be copied. They are the only part of a screen the engine does not
# author, which is why the vocabulary check exempts exactly that substring.
# ═══════════════════════════════════════════════════════════════════════════════

# Where the person's own answer goes in a printed command line. Upper case so it
# reads as a slot to fill rather than a word to type.
ANSWER_SLOT = "ANSWER"

# The same, for a path the engine does not know yet.
FOLDER_SLOT = "YOUR-FOLDER"


def interpreter():
    """How to run Python, as a person could type it.

    🔴 THE SHORT FORM WHEN IT IS PROVABLY THE SAME INTERPRETER, the real path when
    it is not. This used to return `sys.executable` unconditionally, so on an
    ordinary Homebrew install every command line on every screen opened with 46
    characters of `/opt/homebrew/opt/python@3.14/bin/python3.14` before reaching
    anything the person needed to read — under a caption saying this is the whole
    line to run. Noise at the front of the one line they have to act on.

    ⛔ It is not simply shortened to `python3`, because a machine whose `python3` is
    a different build would then be handed a line that does not work, and a printed
    command that fails is worse than a long one that does not. So the two are
    resolved and compared, and the real path survives whenever they differ.
    """
    exe = sys.executable or ""
    if not exe or not Path(exe).name.startswith("python"):
        return "python3"
    short = shutil.which("python3")
    if short:
        try:
            if Path(short).resolve() == Path(exe).resolve():
                return "python3"
        except OSError:
            pass  # cannot prove they are the same, so print the one that is certain
    return exe


def command_form(command, workspace=None, tail=None):
    """One copy-pasteable command line. `--workspace` FIRST, so the answer is last.

    A person who has to append their own answer must be able to append it at the
    end of the line, and an option that came after it would put the answer in the
    middle of the command.
    """
    parts = [shlex.quote(interpreter()), shlex.quote(str(HERE)), command]
    if workspace:
        parts.extend(["--workspace", shlex.quote(str(workspace))])
    if tail:
        parts.append(shlex.quote(str(tail)))
    return " ".join(parts)


def unauthored_in(text):
    """Strip the parts of a screen the engine did not write: the two real paths.

    Used only by the vocabulary check. A folder named by the person, or an install
    path chosen by whoever installed this, is not the engine's wording, and
    failing a gate on it would be a false failure, which trains people to ignore
    the gate. Everything else on the screen is still checked.
    """
    for path in (str(HERE), interpreter()):
        text = text.replace(path, " ")
    return text

# What a case folder holds. Named here once so the screen that describes it can
# COUNT it rather than assert a number in prose. A prose count of a structure is
# a defect this project has already shipped, and it drifted for months.
MATTER_FILENAME = "MATTER.md"
PLAN_FILENAME = "PLAN.md"
CLOSED_PATHS_FILENAME = "closed-paths.md"
GITIGNORE_FILENAME = ".gitignore"
# A18. ⚠️ NAMED IN PLAIN WORDS FOR THE SAME REASON `WORKSPACE_DIRS` IS, below: a
# folder listing is a screen. `recollection.md` is a word from a statement of
# claim, not a word a frightened person uses about their own memory, and this one
# sits beside `what-was-frozen/` so the pair reads as one thing.
RECOLLECTION_FILENAME = "what-you-remember.md"
# A20. The one thing in the folder meant to leave the machine on paper.
PRINTABLE_FILENAME = "what-to-do.pdf"
# A23. 🔴 THE HOME FOR WHAT THE PERSON VOLUNTEERS, AND IT EXISTS BECAUSE OF ADR 0009.
#
# The contract used to forbid asking what happened at all. That is gone, and what
# replaced it is a condition: detail may be asked for once the person has been told
# who receives it, and ⛔ NOTHING THEY VOLUNTEER IS WRITTEN WHERE THEY WERE NOT TOLD
# IT LANDS. That second half had no home. `MATTER.md` is rewritten by the engine on
# every answer, so anything added to it is destroyed by the next turn, and
# `what-you-remember.md` is theirs, written once, and never read by anything.
#
# So detail volunteered in conversation evaporated. A reader answered "yes my mom"
# to the witness question; the engine took the `yes`, correctly refused to guess at
# the rest, and `my mom` went into no file at all.
#
# ⚠️ APPEND-ONLY, and never read back into a prompt. It is the one file here whose
# content is what a person said rather than which option they picked, so a third
# party's name will land in it. That is permitted — it is their own folder, it is
# never in this repository, and the screen names the file before anything is put in
# it — and it is exactly why the read direction is closed.
NOTES_FILENAME = "notes.md"
# ═══════════════════════════════════════════════════════════════════════════════
# 🔴 THE TWO FOLDER NAMES. A LATER WAVE MUST USE EXACTLY THESE.
#
#     frozen-copies/    the sealed copies of a person's files
#     what-was-frozen/  the record of what went in, and of it not having changed
#
# ⛔ `freeze` and `verify` read and write THESE names, from THIS constant, never a
# string of their own. ⚠️ This comment said they "are not written yet" long after
# `freeze.py` and `verify.py` shipped — a sentence that was true when written and
# went stale underneath itself, which is this project's most-repeated defect and is
# worth noticing in a place as load-bearing as the folder names.
#
# WHY THEY CHANGED. The engine was careful never to say `custody` or `manifest` on
# a screen, and then created directories called `custody` and `manifest`. A reader
# opened their own folder and found them:
#
#     "custody made my stomach drop, I thought it meant my children or being
#      taken into custody."
#
# A folder listing IS a screen. It is read by the person, on their own machine, in
# the moment they go looking for what the tool made, and it is the one screen the
# engine cannot take back once it has been printed, because it is on their disk.
# So the rule that bars those words from a screen binds the filesystem too, and
# these names are now plain enough to need no explanation and boring enough to
# frighten nobody. Being nameable on screen is a bonus, not the reason: the reason
# is that the person sees them whether the engine mentions them or not.
WORKSPACE_DIRS = ("frozen-copies", "what-was-frozen")
WORKSPACE_FILES = (
    MATTER_FILENAME,
    PLAN_FILENAME,
    CLOSED_PATHS_FILENAME,
    GITIGNORE_FILENAME,
    STATE_FILENAME,
    RECOLLECTION_FILENAME,
    PRINTABLE_FILENAME,
    NOTES_FILENAME,
)
WORKSPACE_ENTRIES = (*WORKSPACE_FILES, *WORKSPACE_DIRS)

# Exit codes. Distinct so a relay can tell a refusal from a rejected answer.
EXIT_OK = 0
EXIT_REJECTED = 2  # answer outside the node's options
EXIT_REFUSED = 3  # contract mismatch, or a path this engine will not write to
EXIT_NO_STATE = 4  # nothing to resume
EXIT_USAGE = 64

# ═══════════════════════════════════════════════════════════════════════════════
# A1/A2, the two authored answer sets.
# ═══════════════════════════════════════════════════════════════════════════════

# Used only where the contract question carries no `options`. Third value is
# governed by the contract's own stated invariant: "unsure" is treated as
# "probably yes, go and check".
ANSWER_SET_DEFAULT = ["yes", "no", "unsure"]

# A screen that states rather than asks still costs one turn, and one turn needs
# one accepted answer.
ANSWER_SET_ACK = ["ok"]

# A3: the exclusion screens. ONE IDEA PER SCREEN, so a person reads a few short
# related lists instead of one wall, and the heading tells them which idea before
# they read a word of it. An arithmetic split put "do not delete anything" and "do
# not click a link" on the same screen under no heading at all.
#
# 🔴 NOTHING HERE IS A COUNT. Not the number of items, not the size of a screen.
# Only MEMBERSHIP is declared, and `Graph` refuses to run unless this mapping
# places every id the contract holds, exactly once. Two documents in this project
# said "the seven hard exclusions" long after the list reached fourteen; a mapping
# that is checked against the contract cannot drift that way, because the check
# fails instead of the screen quietly shrinking.
#
# ⚠️ The ORDER of items inside a screen is NOT taken from here. It is the
# contract's own document order, so there is exactly one source of truth for it.
# Only which screen, and in which order the screens come, is decided here.
#
# ⛔ THE GROUPING IS DESIGN, AND MAY BE RE-CUT WITHOUT A CONTRACT AMENDMENT. The
# items, their `text`, their `why` and their ids may not, `AGENTS.md` §7, and an
# agent may never amend an exclusion.
EXCLUSION_GROUPS = (
    ("Do not reach toward them", ("X1", "X2", "X5", "X7", "X12")),
    ("Do not tidy, delete, or cancel", ("X3", "X8", "X14")),
    ("Do not explain, do not gather", ("X6", "X10", "X11", "X13")),
    ("Stop before you tap", ("X4", "X9")),
)

# Answers that mean "this record may exist". The contract's invariant makes
# `unsure` one of them.
AFFIRMATIVE = frozenset({"yes", "unsure"})

# ═══════════════════════════════════════════════════════════════════════════════
# Fields, and what may be done with them.
# ═══════════════════════════════════════════════════════════════════════════════

# 🔴 Rendered BYTE-IDENTICAL, never wrapped, never trimmed, never paraphrased.
# A test asserts each one appears in the screen exactly as the contract holds it.
VERBATIM_FIELDS = (
    "ask",
    "options",
    "text",
    "why",
    "note",
    "note_to_user",
    "title",
    # Not named by the acceptance criteria, but user-facing safety text of the
    # same weight: L4's is the no-contact fence, L11's is "do not approach".
    "warning",
    "closing_text",
)

# A8: withheld from every screen. See the header.
WITHHELD_FIELDS = ("priority_note",)

# Words that may not appear in anything a person reads.
BANNED_IN_SCREENS = (
    "manifest",
    "hash",
    "custody",
    "layer",
    "classification",
    "adversarial",
)
RAIL_NUMBER = re.compile(r"rail[\s_-]*\d", re.IGNORECASE)

# ⛔ WORDS THAT NAME A KIND OF ACCUSATION.
#
# This engine never asks what happened, who was involved, or what anyone has been
# accused of, so nothing it authors may imply an answer. A reader found a
# sentence about what a body looks like and what was agreed sitting in a file on
# their own computer, having said nothing about either, and read it as the program
# announcing what it had decided they were accused of.
#
# ⚠️ Matched as PREFIXES, so "abuse" also catches "abusive" and "consent" also
# catches "consented". `--selftest` runs this over every line the engine authors
# and is planted with the original sentence, so the check is known to fire.
#
# The one exemption is the hard fence, which cannot state its own rule without
# naming the class it refuses, and which is required in exchange to say, before
# anything else, that it is not an assumption about this person.
#
# ⛔ "accused" is deliberately NOT here. A person's own position has to be
# sayable; a class of accusation does not.
ALLEGATION_WORDS = (
    "consent",
    "agree",
    "sexual",
    "assault",
    "abus",
    "rape",
    "victim",
    "accuser",
    "complainant",
    "harass",
    "violen",
    "intimate",
)

# ═══════════════════════════════════════════════════════════════════════════════
# A4: plain language for the machine tokens. A token on screen is a stumble.
# `--selftest` fails if the contract carries a token that is not covered here,
# so an amendment cannot silently render as gibberish.
# ═══════════════════════════════════════════════════════════════════════════════

# A13, 🔴 THE TITLE OF AN ACTION IS THE ACTION.
#
# A reader's entire plan was titled with the questions they had just answered:
#
#     2. Did you have your phone with you? Is it Android or iPhone?
#        Do this on the device itself, today, before it writes over itself.
#
# On an item marked "Days. Do it now.", and their note was: "'Do this': do
# WHAT?". Their summary of the whole output was "my action list is a list of the
# questions it asked me."
#
# So each of these is an instruction a person can carry out, in the imperative,
# and `ACTION_LINES` below is now the detail UNDER it rather than the whole of it.
# The question is still printed, one line further down, as the reason the item is
# on the list, it is the only thing that tells them which of their own answers
# produced it, and it is the contract's wording, verbatim.
#
# ⛔ Keyed by the contract's own action token, and `--selftest` fails on a token
# with no title. Nothing here is a record type and nothing here is a list of
# steps: what appears in a plan is derived from the answers, as before.
ACTION_TITLES = {
    "export_own_account_data": "Download your own history from that account, in full.",
    "capture_device_now": (
        "Save what is on that device now, before it writes over itself."
    ),
    "export_full_thread_with_media": (
        "Save the whole conversation, pictures and all."
    ),
    "keep_original_email_not_screenshot": (
        "Save the original message itself, as a file."
    ),
    "download_statements": "Download the full statements as files.",
    "collect_bookings_and_passes": (
        "Gather every booking, ticket and pass you still have."
    ),
    "preserve_originals_do_not_screenshot": (
        "Leave the originals exactly where they are."
    ),
    "see_a_clinician_today": "See a doctor or a nurse today.",
    "write_names_for_counsel": "Make a list of who could have seen you, for your lawyer.",
    "preservation_demand": "Ask your lawyer to write to whoever holds it, today.",
    "keep_paperwork_you_were_given": (
        "Keep every piece of paper you were handed, exactly as it is."
    ),
}

ACTION_TITLE_UNKNOWN = (
    "There is something to do here that this tool cannot yet put into plain "
    "words. Ask your lawyer."
)

ACTION_LINES = {
    "export_own_account_data": (
        "Sign in to your own account and ask it for the full history export. Keep "
        "the file exactly as it arrives."
    ),
    "capture_device_now": (
        "Today, on the device itself. Do not tidy anything up first, and do not "
        "delete anything to make room."
    ),
    "export_full_thread_with_media": (
        "All of it, not the parts that seem to matter. A few screenshots are worth "
        "almost nothing."
    ),
    "keep_original_email_not_screenshot": (
        "The message, not a photograph of it on your screen, a photograph throws "
        "away the part that matters."
    ),
    "download_statements": (
        "From your own account, as files. Not a photograph of the screen."
    ),
    "collect_bookings_and_passes": (
        "The originals, in whatever form you have them. Do not tidy them up."
    ),
    "preserve_originals_do_not_screenshot": (
        "Do not screenshot them and do not send them anywhere. Only the original "
        "carries the detail that is useful."
    ),
    "see_a_clinician_today": (
        "Ask them to write down what they see, and keep whatever they give you."
    ),
    "write_names_for_counsel": (
        "Just names, on paper or in a note to yourself. Hand it to them and let "
        "them decide what to do with it."
    ),
    "preservation_demand": (
        "They write to whoever holds it and ask them to keep it. Today. Do not "
        "contact anyone about it yourself."
    ),
    "keep_paperwork_you_were_given": (
        "Do not write on it, do not fold it away in a pocket, and do not throw out "
        "the envelope it came in. Photograph every page, both sides, including any "
        "that look blank."
    ),
}

# ═══════════════════════════════════════════════════════════════════════════════
# A19: WHERE IT GOES, AND HOW TO GET IT. Keyed by the contract's `layer:` value.
#
# A reader finished the flow and said the list was "not helpful at all": *"the
# inputs of saving whats on the device is not specific enough"*, and for a record
# they had no idea how to obtain, *"give them a link or an instruction to google
# this information"*. "Save what is on that device now" is not an instruction a
# frightened person can carry out. It names a duty and leaves them alone with it.
#
# 🔴 KEYED BY `layer`, NOT BY `action`, AND THAT IS NOT A PREFERENCE. Two records
# share the action `capture_device_now`: one is a phone and one is a computer. A
# single search phrase attached to that action would be wrong for one of them
# every time it printed. `layer` is the contract's own per-record marker and it
# separates them, so the guidance is right for the record it appears under.
#
# 🔴 `folder: None` IS A DECLARED ANSWER, NOT A GAP. One action says outright
# "leave the originals exactly where they are", and printing a "put it here" path
# under it would contradict the instruction directly above — the same class of
# contradiction the closed-path machinery exists to remove. Another is a written
# request only a lawyer may make, where telling somebody where to file it implies
# they are going to go and get it. `search: None` likewise: you do not look up how
# to see a doctor, and one entry is fully covered by its action line already.
#
# ⛔ EXHAUSTIVE OVER THE CONTRACT, checked by `--selftest`. Every value the
# contract uses for `layer:` must appear here, so a new record question fails the
# self-check instead of quietly rendering a step with no destination. That is the
# whole reason a declared `None` beats an absent key.
#
# ⛔ NO URLS, AND NOTHING FETCHES ANYTHING. A search phrase cannot rot the way a
# link can, it works in whatever the person already uses, and it leaves no entry
# in anybody's log — RAIL 9. The angle-bracket blanks are for the person to fill
# in: the engine was never told the make of their watch and is not going to guess.
# ═══════════════════════════════════════════════════════════════════════════════

LAYER_GUIDANCE = {
    "wearable_telemetry": {
        "folder": "wearable-telemetry",
        "search": "export <the make of your watch, band or ring> health data",
        "good": (
            "You want something that arrives as a FILE — a .zip, .csv or .json. "
            "Not a page of charts you can look at, and not a photograph of one. If "
            "it asks you what dates you want, ask for everything."
        ),
    },
    "os_usage_log": {
        "folder": "phone-usage",
        "search": "<android or iphone> export screen time or digital wellbeing history",
        "good": (
            "Anything that saves to a file is what you want. If the only thing you "
            "can do is look at it on the screen, stop there and tell your lawyer "
            "that is all your phone offers, rather than spending a day fighting it."
        ),
    },
    "computer_power_log": {
        "folder": "computer-usage",
        "search": "<windows or mac> see when the computer was switched on and off",
        "good": (
            "You are after a saved file, not a window. If you can only read it on "
            "screen, say so to your lawyer rather than working around it."
        ),
    },
    "chat_archive": {
        "folder": "chat-history",
        "search": "<the app you use> export chat history with media",
        "good": (
            "Most apps put this under the conversation's own settings rather than "
            "the main ones. If it offers you a choice of how much to include, take "
            "the largest every time."
        ),
    },
    "platform_record": {
        "folder": "original-messages",
        "search": "<your mail program> save a message as a file",
        "good": (
            "One file per message, usually ending .eml or .msg. Drag it out of the "
            "message list rather than copying the text."
        ),
    },
    # ⛔ folder AND search both None. This one is a written request a lawyer makes,
    # to premises that are not the person's. Telling them where to file it implies
    # they are going to go and get it, and a search phrase would be a first step
    # towards doing so. RAIL 5.
    "premises_record": {"folder": None, "search": None, "good": None},
    "financial_spine": {
        "folder": "statements",
        "search": "<your bank or card> download statements as pdf or csv",
        "good": (
            "Ask for a longer period than you think you need — before as well as "
            "after. If it offers both PDF and CSV, take both."
        ),
    },
    "travel_record": {
        "folder": "travel",
        "search": "<the airline, rail, taxi or hire company> download receipts",
        "good": (
            "The confirmation or receipt as it was sent to you. If it only exists "
            "in an e-mail, save the e-mail itself as a file."
        ),
    },
    # 🔴 folder None ON PURPOSE. This record's action is "leave the originals
    # exactly where they are", so a destination to move them into would contradict
    # the line directly above it on the same screen.
    "media_metadata": {
        "folder": None,
        "search": "how sending a photo can strip the date it was taken",
        "good": (
            "Read enough to know why. A chat app usually strips the hidden date and "
            "place out of a picture, and re-saving it can too, and that hidden part "
            "is the whole value. Leave them alone and let your lawyer arrange it."
        ),
    },
    "independent_medical": {
        "folder": "medical",
        # ⛔ search None. There is nothing to look up here, and a search phrase
        # would imply this is a research task rather than a same-day one.
        "search": None,
        "good": (
            "Ask for your own copy before you leave, and do not wait for it to be "
            "sent on. If it comes on paper, keep the paper as well as a photograph "
            "of it."
        ),
    },
    # ⛔ Fully None. Its action line already says the whole of it — names, on paper
    # or in a note, handed to the lawyer who decides what to do with them. Adding a
    # destination and a search phrase to that would be noise, not help.
    "witness_list": {"folder": None, "search": None, "good": None},
    # 🔴 THE ONE RECORD THAT ARRIVES ON PAPER, so the folder holds a COPY and the
    # original stays with the person. That is why the "good" line says outright that a
    # photograph is not a replacement: a destination folder under an instruction to keep
    # something could otherwise read as an instruction to put the only copy in it.
    "paperwork_you_hold": {
        "folder": "paperwork",
        "search": "scan a document to pdf with <android or iphone>",
        "good": (
            "Keep the paper itself somewhere dry and out of the way. What goes in the "
            "folder is a copy, not a replacement. Get every page and both sides of each "
            "one, including any that look blank — conditions are often printed on the "
            "back."
        ),
    },
}

# ═══════════════════════════════════════════════════════════════════════════════
# A19b: THE ONE BLANK THE ENGINE CAN FILL IN, because the contract now asks.
#
# The search phrases carry angle-bracket blanks for things nobody told the engine —
# the make of a watch, which bank. `L2b` asks which phone, so two of those blanks
# stop being unknowable and become a phrase somebody can type as it stands.
#
# ⛔ SUBSTITUTED ONLY FOR A VALUE THAT NAMES ONE PLATFORM. `L2b` also accepts
# "both" and "unsure", and putting either in would produce "both export screen
# time history", which is not a phrase anybody would type. A wrong search phrase
# is worse than a blank one, because a blank one is visibly waiting for the reader
# and a wrong one looks authoritative. So those two leave the blank alone.
#
# ⛔ AND `--selftest` PROVES EACH BLANK IS STILL THERE TO FILL. A reworded guidance
# string would make `str.replace` a silent no-op — the substitution would stop
# happening and nothing would say so, which is the failure mode this whole file
# treats as the worst one available.
# ═══════════════════════════════════════════════════════════════════════════════

PHONE_BLANK = "<android or iphone>"

SEARCH_SUBSTITUTIONS = {
    layer: {"blank": PHONE_BLANK, "flag": "phone_platform"}
    for layer in ("os_usage_log", "paperwork_you_hold")
}

# The values that name one platform, and nothing else.
SEARCH_SUBSTITUTION_VALUES = {"android": "android", "iphone": "iphone"}

# A19. The folder every drop-path lives under, so a person opening their case
# folder finds one place for sealed copies rather than eleven at the top level.
# ⛔ Read from `WORKSPACE_DIRS`, never typed: that constant's own comment says a
# later wave must use exactly those names, and this is that wave.
DROP_ROOT = WORKSPACE_DIRS[0]

# A5, actions no one should be walked through without a lawyer. A written
# request to a stranger cannot be un-sent, and whether it may be made at all is
# a legal question this tool does not answer.
COUNSEL_ONLY_ACTIONS = frozenset({"preservation_demand"})

# A13: ⛔ SAID ONCE, IN ONE PLACE. A reader's list had "Get a lawyer. Today." as
# step 1 and "Getting a lawyer today IS the action." as step 3: the same job
# twice, in a list presented as an order of operations. The records only a lawyer
# can act on now sit UNDER the step that gets the lawyer, instead of becoming
# numbered steps that repeat it.
COUNSEL_ONLY_TITLE = "Your lawyer asks for this one. You do not."

COUNSEL_ONLY_LINE = (
    "It is the fastest thing here to disappear, so raise it on the first call."
)

COUNSEL_ONLY_HEADING = (
    "Also on your list, and a lawyer is the only person who can do them:"
)

LIMIT_LINES = {
    "device_not_person": "It shows where the device was, not where you were.",
    "off_body_is_silence": (
        "If you took it off, it recorded nothing. That silence proves nothing "
        "either way."
    ),
    "resolution_gaps": "It does not record every minute. Gaps are normal.",
    "automated_events_look_like_activity": (
        "Some entries are the device doing something by itself, not you using it."
    ),
    "screen_on_only": (
        "It shows the machine being used, not who was sitting at it."
    ),
    "deletion_timing_unprovable": (
        "It cannot show when something was removed, or by whom."
    ),
    "action_not_content_not_actor": (
        "It can show that something happened, not what was said or who did it."
    ),
    "block_visibility_asymmetric": (
        "What you can see is not what the other side can see."
    ),
    "ui_label_is_not_a_field": (
        "What the screen calls something is not always what the record stores."
    ),
    "held_by_third_party": (
        "Someone else holds this. You cannot go and get it yourself."
    ),
    "standing_required": (
        "Whether you may ask for it at all is a question for your lawyer."
    ),
    "coarse_timing": "The times on it are rough, not to the minute.",
    "held_by_you_only": (
        "This one is only in your hands. If it goes missing there is no computer "
        "anywhere that will bring it back."
    ),
    "originals_only_screenshots_destroy_metadata": (
        "Only the original file carries the useful detail. A screenshot throws "
        "it away."
    ),
    # 🔴 THE ENGINE NEVER ASKS WHAT SOMEONE IS ACCUSED OF, SO NOTHING IT WRITES
    # MAY IMPLY AN ANSWER. This line used to read "It records what a body looks
    # like. It settles nothing about what was agreed." A reader who had said
    # nothing about a body, nothing sexual, and nothing about anything being
    # agreed found it in a file saved on their own computer, and said it was the
    # single most upsetting line in the output: "that sentence tells me this
    # program has decided what I am accused of."
    #
    # The limit itself is real and stays. What is gone is the allegation class: a
    # record of an examination does not establish anyone's state of mind, and that
    # is just as true of a broken wrist as of anything else. If a phrase only
    # makes sense once you assume a particular kind of accusation, it is wrong
    # here, `--selftest` now enforces that over every line this engine authors.
    "does_not_decide_consent_claims": (
        "It is a record of what a clinician examined and wrote down on one day. No "
        "record of any kind can establish what anyone meant, wanted or understood. "
        "That is not a question a record answers. What it is worth is for your "
        "lawyer to judge."
    ),
}

LIMIT_UNKNOWN = (
    "There is a known limit on this one that this tool cannot yet put in plain "
    "words. Ask your lawyer."
)

# A6: the rank order behind `block_a.order_by: clock`. Ordered by how fast the
# record dies, NOT by how useful it looks: a middling record dying this week
# beats a rich one that is not going anywhere.
CLOCK_RANK = {"HOURS": 0, "DAYS": 1, "WEEKS": 2, "MONTHS": 3, "STABLE": 4}
CLOCK_UNKNOWN_RANK = 5

CLOCK_LINES = {
    "HOURS": "Hours, not days. Today.",
    "DAYS": "Days. Do it now.",
    "WEEKS": "Weeks.",
    "MONTHS": "Months.",
    "STABLE": "No known deadline, which is not a reason to put it off.",
}
CLOCK_UNKNOWN_LINE = "How long this lasts is not known. Treat it as urgent."

CLOCK_RED_SUFFIX = "It may already be running out."

# ⛔ Never a figure, and never stated as fact.
CLOCK_DISCLAIMER = (
    "These are rough and typical only. Check each one with whoever holds the "
    "record. Never treat them as fact."
)

# 🔴 THE REFUSAL STAYS, IT IS ABSOLUTE. Only the FRAMING changed.
#
# A reader met this twice, unprompted, having volunteered nothing of the kind, and
# read it as the tool telling them what it thought they had done. The rule is not
# a judgement about anyone: it is the same line for every person who ever uses
# this, and it now says so before it says anything else. `FENCE_DISCLAIMER` is
# required to appear in every fence line by `--selftest`, which is also what lets
# these lines name a class of material that no other authored line may.
FENCE_DISCLAIMER = "not a guess about you"

# 🔴 THE HAZARD, IN THE WORDS A PERSON READS, IN EXACTLY ONE PLACE.
#
# Three surfaces refuse this class of material, this fence, the copy command's
# notice before it reads anything, and the go-ahead check's own refusal, and each
# one used to type the description out. Three copies of one description is three
# answers waiting to disagree, and the disagreement would land on the most
# absolute rule in the tool. So it is a constant here for the same reason
# `FENCE_DISCLAIMER` and `WORKSPACE_DIRS` are: the files that state a rule read the
# words of it from the module that owns them, never from a string of their own.
#
# ⚠️ THE TWO FLAG NAMES REMAIN DELIBERATELY DIFFERENT, and that is not drift.
# `freeze --excluded-class` is opaque; the go-ahead check's own question names the
# class in plain words. There is a genuine trade-off underneath: plain words are
# clearer on a screen, and a flag naming this class lands permanently in the shell
# history of a machine that may later be examined, where opaque wording is safer.
# ⛔ That question is OPEN WITH THE OWNER. Only the DESCRIPTION is unified here;
# picking a winner on the flag names would close a decision that is not an
# agent's.
EXCLUDED_CLASS = "intimate or sexual pictures or video"

# The one sentence all three surfaces state, assembled from the description above
# so that no two of them can word it differently.
EXCLUDED_CLASS_RULE = f"I do not handle {EXCLUDED_CLASS}, for anybody, ever."

FENCE_LINES = {
    # The contract names this fence by a rail number, which may not reach a
    # screen. This is the same refusal in plain words.
    "RAIL_6": (
        f"⛔ A rule that applies to every person who uses this, whatever they are "
        f"dealing with, {FENCE_DISCLAIMER}, or about your situation. "
        f"{EXCLUDED_CLASS_RULE} If any of "
        "this might include some, stop there: do not open it, do not copy it, do "
        "not describe it to me. Tell your lawyer, and let them arrange somebody "
        "qualified to handle it. Mishandling that kind of file creates a fresh "
        "problem of its own, for you and for me, which is why the line is absolute "
        "rather than a judgement about your case."
    ),
}
FENCE_UNKNOWN = (
    f"⛔ There is a hard stop on this one, and it applies to everyone, "
    f"{FENCE_DISCLAIMER}. Do not open it. Ask your lawyer first."
)

DOUBLE_EDGED_LINE = (
    "This one can cut both ways. Show it to your lawyer either way. A record "
    "you held back is worse than a record that helped the other side."
)

# ═══════════════════════════════════════════════════════════════════════════════
# A7: the authored screens. Two of them, and both are quoted rather than
# invented.
# ═══════════════════════════════════════════════════════════════════════════════

SCREEN_ZERO_ID = "S0"
PLAN_ID = "PLAN"
# A25: the cursor value meaning "the entire plan on one screen". Distinct from any
# real step index, and from 0, which is the opening.
PLAN_WHOLE = -1
# What the plan screens accept. `all` is the escape hatch out of stepping, and it
# is offered on every step so nobody is trapped in a walk they did not want.
PLAN_ANSWER_STEP = ["ok", "all"]

SCREEN_ZERO_LINES = (
    # A reader who ran this end to end called the opening "robotic". The content
    # was right and the delivery was a specification: two numbered true things,
    # stated to a person who had just been accused of something. So the facts are
    # unchanged and the order is unchanged — what is added is the one thing a
    # frightened person needs before they will read a warning at all, which is
    # some idea of what they have walked into and that it is finite.
    #
    # ⛔ NEITHER TRUE THING MAY BE SOFTENED, and neither is. Nothing here promises
    # anything about the outcome, and nothing here is warm at the expense of being
    # accurate: the uncomfortable one is still announced as uncomfortable, before
    # it is given, so it cannot read as something slipped past them.
    # ⛔ NO FIGURE IN THIS SENTENCE. The first draft said "around twenty of them"
    # while the derived counter two lines below said 27, and 31 once the folder
    # screens are being asked for. A prose count of a derived number is the defect
    # class this repository has already shipped twice; the counter states the
    # figure, and it cannot be wrong.
    "What follows is questions about devices and accounts, and nothing else, one "
    "at a time. You can stop whenever you like and pick it up where you left off "
    "— nothing you answer gets lost.",
    "",
    "Two things to know before you answer anything. The second is the "
    "uncomfortable one, and you should hear it from me now rather than work it "
    "out later.",
    "",
    "The files I make stay on this machine. They are never uploaded. There is no "
    "account, no sign-up, and nothing anywhere counting what you do here.",
    "",
    # A reader on the original wording, "what you type to me goes to whoever runs
    # me", asked: "Who is that? A company? The police? My employer?" A warning
    # that leaves a frightened person guessing at the answer is worse than none,
    # because the guesses available to them are all worse than the truth. ⛔ And
    # the answer must not be softened into "nothing leaves your device": when a
    # remote service is driving the session, that is simply false.
    "But I am an AI assistant, and that means the words you type travel over the "
    "internet to the company whose computers run me, the same as any AI chat "
    "window. Not to the police. Not to a court. Not to your employer. Not to "
    "anybody involved in your case. But they are somebody else's computers, and I "
    "cannot promise you what is kept there or for how long.",
    "",
    # 🔴 THIS PARAGRAPH USED TO SAY "tell me as little as possible about what
    # happened. I do not need it. I will never ask you what happened, who was
    # involved, or what you have been accused of." Amendment A1 removed the three
    # prohibitions behind it, and ADR 0009 records why: the safety property was never
    # that this software stayed ignorant, it was that a person cannot un-say something
    # to a service somebody else runs. Silence bought that and charged the one thing
    # people arrive here for.
    #
    # ⛔ SO THE GATE MOVED AND DID NOT DISAPPEAR, and this is the site of it. The
    # invitation may only be made AFTER the paragraph above has named who receives the
    # words, which is why it is here and not one screen earlier. It hands the decision
    # over rather than making it, it does not ask for anything on this screen, and it
    # says out loud what it will not do with what it is given.
    #
    # ⛔ AND IT DOES NOT ANSWER A LEGAL QUESTION IN ORDER TO SOUND HELPFUL. Whether a
    # thing typed here is safe to type is a legal question, no pack is reviewed, so it
    # routes to counsel. What is stated instead is a fact about identity: this is not a
    # lawyer, and this is not a conversation with one.
    "So how much you tell me is yours to decide, and I would rather you decided it "
    "knowing all of that. Nothing below needs it. Every question I ask is about a "
    "device or an account, and I can build your list out of yes and no alone.",
    "",
    # ⚠️ NOT a third paragraph opening with "But". Read back on screen, three
    # consecutive pivots in a row is a tic, and this is the paragraph that has to
    # sound like an offer rather than another caveat.
    "I am more use to you if I know roughly what this is about, because that is "
    "what separates the records that matter from the ones that would waste time you "
    "do not have to spare. If you want to tell me, tell me. If you would rather "
    "not, say so and we carry on, and I will not ask you again.",
    "",
    "⛔ Two limits on that, and they are mine rather than yours. I am not your "
    "lawyer and this is not a conversation with your lawyer — whether something is "
    "safe to type here is a question for them and not for me. And nothing you tell "
    "me goes into a file unless I have told you which file first.",
    "",
    "My own questions are about records and devices only, one at a time.",
    "",
    # A15's ceiling, explained ONCE, here, on the screen the counter first appears
    # on. It used to be re-explained in a full sentence on every screen; see
    # `progress_block`.
    "Last thing: the two numbers under each screen are where you are and the most "
    "screens there can be. The ~ is there because answering no to something skips "
    "whatever came after it, so it is usually fewer.",
)

# ⚖️ EVERY wording site the contract names is marked, every time, while
# `meta.jurisdiction.reviewed` is false. ADR 0005 requires the marker at every
# legal seam and that has not changed — an unmarked seam is a seam the reader
# cannot see.
#
# ⚠️ WHAT CHANGED IS THAT THE PARAGRAPH PRINTS ONCE. A reader ran the whole flow
# and reported the full note as "distracting and discouraging". They are right,
# and the reason is not taste: a repeated stimulus stops being processed after
# roughly five exposures, so printing the reasoning thirty times spends the one
# caveat that has to land. Worse, the reader furthest into the flow — the one who
# has answered most and is most likely to act — is the one it has gone invisible
# for.
#
# ⛔ The fail-safe direction is to mark MORE, never less. `_wording_seen()` is
# derived from the answers already given, so a truncated or resumed session shows
# the full note AGAIN rather than dropping to the short form on a reader who
# never saw the long one.
UNREVIEWED_WORDING_LINES = (
    "⚖️ A note on the words used here. They were written from one country's "
    "paperwork and no lawyer has checked them, anywhere.",
    "If you do not recognise any of these words, that does not mean this is "
    "not about you. Answer as best you can and ask your lawyer.",
    "This applies wherever you see ⚖️ below. I will mark it, and not explain it "
    "again.",
)

# ⚖️ The same seam, after the reasoning has been given once. One line, and still
# self-contained: it says what to do rather than pointing at a screen that has
# scrolled away.
UNREVIEWED_WORDING_BRIEF = (
    "⚖️ Unreviewed wording here too. Answer as best you can and ask your lawyer."
)

# A9/A14, how a shut-off record is explained. ⛔ Never an interpretation of
# anyone's conditions: the flag came from their own answer to a contract question,
# and every sentence printed from the record's own note is the contract's own,
# unchanged.
CLOSED_PATH_LINES = (
    "Left off your list, because you said there may be a no-contact condition.",
    "Only your lawyer can say what that covers. This is not us reading it for you.",
)

# ═══════════════════════════════════════════════════════════════════════════════
# A14, ⛔ NEVER PRINT AN INSTRUCTION TO WALK A PATH THAT IS ALREADY CLOSED.
#
# The contract's note on the messaging record is ONE string carrying both halves:
#
#   "Export the whole thread. Selected screenshots are worth close to nothing.
#    Do NOT open the thread if a no-contact condition applies. Ask your lawyer
#    first."
#
# A reader met those in consecutive sentences on one screen WHEN THE ENGINE
# ALREADY KNEW the condition applied. They had answered that question two screens
# earlier, and then again in PLAN.md, and again in closed-paths.md. One
# contradiction, printed three times, with the engine holding the answer that
# resolved it.
#
# The contract is the owner's and that sentence is not the engine's to rewrite. So
# the engine WITHHOLDS the half that instructs and renders the half that forbids,
# verbatim, sentence by sentence. Withholding is precedented. `Priority_note` is
# withheld in full, A8, and paraphrasing is not.
#
# ⛔ THE FAIL-SAFE DIRECTION IS TO WITHHOLD MORE, NEVER LESS. If no sentence in a
# note forbids anything, then the note is all instruction and ALL of it is
# withheld. The engine's own reason for closing the path is printed either way,
# and it says outright that part of the note is being held back and that the
# lawyer can see the whole thing. A silent omission would be its own defect.
# ═══════════════════════════════════════════════════════════════════════════════

PROHIBITION_MARKERS = ("do not", "don't", "never", "must not", "stop")
SENTENCE_BREAK = re.compile(r"(?<=[.!?])\s+")

CLOSED_PATH_REPLACEMENT = (
    "⛔ The note on this record also explains how to go and get it. I am not "
    "repeating that part: by your own answer this one may be closed to you, and an "
    "instruction you must not follow does not belong on your screen. Your lawyer "
    "can read the whole note. This is the part of it that stands either way:"
)

CLOSED_PATH_NOTHING_LEFT = (
    "The note on this record is an instruction for going and getting it, so I am "
    "not repeating any of it. Ask your lawyer before you touch this one."
)


def prohibitions_in(text):
    """A14, the sentences of a note that FORBID. Verbatim, in order, or nothing."""
    if not text:
        return []
    kept = []
    for sentence in SENTENCE_BREAK.split(str(text).strip()):
        stripped = sentence.strip()
        if not stripped:
            continue
        low = stripped.lower()
        if any(marker in low for marker in PROHIBITION_MARKERS):
            kept.append(stripped)
    return kept

# ═══════════════════════════════════════════════════════════════════════════════
# A18: ENGINE-AUTHORED ADDENDA TO AN EXCLUSION, keyed by the exclusion's own id.
#
# ⛔ THE EXCLUSION'S OWN TEXT IS NOT TOUCHED, not a word, and this is not a way
# around that rule. It is the same mechanism class as `CLOSED_PATH_REPLACEMENT`
# and `prohibitions_in()`: the engine already decides what to print AROUND a
# contract field, and withholds contract text it must not repeat. Adding a
# sentence after one is the same power used in the other direction.
#
# WHAT IT IS FOR. A reader hit `X13` and read it as being sent away to do
# something alone that this tool was obviously part of. The advice was right; the
# gap was that nothing offered them anywhere to put it. So the addendum says the
# place exists and where it will be. It adds no rule, softens nothing, and
# contradicts nothing in the item above it.
#
# ⛔ NOT A ROUTE FOR SECOND THOUGHTS ABOUT AN EXCLUSION. If an addendum here ever
# needs to qualify, soften, or explain away what an exclusion says, the exclusion
# is wrong and that is a contract amendment for the owner — not a paragraph the
# engine prints underneath to take the edge off.
#
# `--selftest` requires every key to be a real exclusion id AND requires each
# addendum to actually reach a rendered screen, so a key that stopped matching
# fails there rather than silently never printing.
# ═══════════════════════════════════════════════════════════════════════════════

EXCLUSION_ADDENDA = {
    "X13": (
        # ⛔ NO COUNT OF SCREENS IN THIS SENTENCE. The first draft said "in a few
        # screens" and the folder ask is about ten screens further on. It is
        # anchored to the STRUCTURE instead, which is true by construction: the
        # folder screens render immediately before the first node the contract
        # marks with `layer`, so they always come before any device question.
        "If you have not done that yet: do not rush off and do it alone, and do "
        "not do it twice. This part is mine as much as yours. Before I ask about "
        "any of your devices I ask you where your case folder should go, and one "
        "of the things I put in it is an empty file for exactly this, with a line "
        "for you to fill in saying when you wrote it. You write it once, in your "
        "own words, in your own editor. I never read it and I never write to it "
        "again.",
    ),
}

# A9, what a person is told when a record is shut off by their own conditions.
NO_CONTACT_CLOSES = ("L4",)


# ═══════════════════════════════════════════════════════════════════════════════
# A10: the folder screens. Three of them, shown at a boundary DERIVED from the
# contract: immediately before the first node the contract marks with `layer`.
# No id is transcribed, so a contract that renamed or reordered its per-record
# questions would still get the folder asked for at the right moment.
# ═══════════════════════════════════════════════════════════════════════════════

FOLDER_ASK_ID = "W1"  # where do the files go
FOLDER_CONFIRM_ID = "W2"  # the resolved absolute path, confirmed back
FOLDER_POINTER_ID = "W3"  # the opt-in pointer, off unless asked for
FOLDER_IDS = (FOLDER_ASK_ID, FOLDER_CONFIRM_ID, FOLDER_POINTER_ID)

# ═══════════════════════════════════════════════════════════════════════════════
# ⚖️ A17, W4: WHICH JURISDICTION. The fourth engine-owned setup screen.
#
# 🔴 IT IS NOT A CONTRACT NODE, and that is the whole reason it can exist at all.
# The contract defines H1-H4, X1-X14, O1-O5, T1-T2 and L1-L11 and nothing else. A
# new question in it is an amendment, and an amendment is the owner's. This sits
# beside W1-W3 as engine-owned setup, at the same boundary derived from the
# contract, so `tree.yaml` gains nothing and loses nothing. ADR 0008 decision 3.
#
# ⛔ WHY IT IS ASKED ONCE AND WRITTEN DOWN. A person answered this while
# frightened; asking again next session, or in every later command, is asking them
# to remember a two-letter code they were shown once. It goes in the session's own
# working note, which is the only file that already carries this session's answers.
#
# ⚖️ AND WHAT ANSWERING IT DOES NOT DO. It does not make the jurisdiction
# supported. Zero packs are reviewed by a practitioner, Canada included, so every
# choice here lands in the degraded path, and the screen says so with a number it
# COUNTS rather than a number it states. The day a pack is reviewed, that sentence
# changes by itself; a typed figure would not. ADR 0008 decision 5.
# ═══════════════════════════════════════════════════════════════════════════════

JURISDICTION_ID = "W4"

# Every engine-owned setup screen. ⚠️ `FOLDER_IDS` stays exactly the three folder
# screens: several checks are about the folder specifically and would be quietly
# widened by adding to it. Use this one where "any setup screen" is meant.
SETUP_IDS = (*FOLDER_IDS, JURISDICTION_ID)

# The answer for "mine is not one of those". ⛔ It is an ANSWER, never a code: it
# must never reach a pack lookup, because there is no pack behind it.
JURISDICTION_NOT_LISTED = "not-listed"

JURISDICTION_ASK_LINES = (
    "Last thing before your own records: which country are you in?",
    "",
    # ⚠️ The reason is given because a person under accusation being asked where
    # they are, by a program, without being told why, is a reasonable thing to
    # refuse to answer. It is also the truthful reason.
    # ⚠️ NO SECOND PERSON ANYWHERE IN THIS PARAGRAPH, and it is not a style
    # preference. An earlier draft read "what you are entitled to ask for", which
    # names a legal concept in the second person, and a reader cannot tell a
    # description of what varies from a statement about their own position. The
    # engine may say that the law differs. It may never say what it is.
    "I ask for one reason. What the law allows, what it forbids, how long a "
    "company has to keep a record, and what a person can ask a company to hand "
    "over are all different in different places, and I am not going to guess "
    "which set applies here.",
)

JURISDICTION_NOT_LISTED_LINES = (
    f"If yours is not on that list, reply {JURISDICTION_NOT_LISTED}.",
    "",
    "Nothing stops working if you do. Everything that follows is about your own "
    "devices and your own accounts, and that part is the same everywhere.",
)

# ⚖️ THE HONEST PART, and it is deliberately the last thing on the screen so it is
# the thing still on the page when the person answers.
#
# ⛔ NO NUMBER IN THESE LINES. The count is derived from the packs themselves at
# render time, so the sentence corrects itself the day a pack is reviewed. A typed
# figure would keep saying "none" for as long as nobody remembered to edit it,
# which is precisely how a stale count survived in this project for months.
JURISDICTION_NONE_REVIEWED_LINES = (
    "Whichever you choose, including yours if it is on the list: no lawyer "
    "anywhere has checked the local material behind any of these, so I am not "
    "going to tell you what the law is in any of them. Your lawyer does that. "
    "What I do is find the records about your own life that are running out, and "
    "that does not depend on where you are.",
)

# Proposed, never imposed. Under the person's own home directory, which is the
# one place we can be reasonably sure is theirs and not the tool's.
FOLDER_DEFAULT = "~/MachineWitness/case-01"

# The single accepted keyword. Anything else must look like a full path.
FOLDER_ACCEPT_DEFAULT = "ok"
FOLDER_CONFIRM_OPTIONS = ["yes", "change"]
# ⛔ `no` FIRST, and it is the answer that writes nothing. Off by default.
# A22: the pointer screen STATES rather than asks — the decision came from `H5`.
FOLDER_POINTER_OPTIONS = list(ANSWER_SET_ACK)

FOLDER_ASK_LINES = (
    "I need a folder on this machine for your case.",
    "",
    f"I suggest: {FOLDER_DEFAULT}",
    "",
    f"Reply {FOLDER_ACCEPT_DEFAULT} to use that, or type a folder of your own.",
    "",
    # A reader on the original wording: "I have never typed that character on
    # purpose in my life." Naming the character is not the same as explaining it,
    # and a screen a person cannot parse is a screen that does not work.
    "It has to be written out in full, so that I know where it goes. A name on "
    "its own could land anywhere, including inside this tool. Written out in full "
    f"means either starting with a / like /Users/you/cases, or starting with the ~ "
    f"character as above: ~ is your computer's shorthand for your own home folder, "
    f"so {FOLDER_DEFAULT} means a folder called case-01, inside a folder called "
    "MachineWitness, inside your home folder.",
    "",
    "I will show you exactly where it lands, and ask again, before I create "
    "anything.",
)

# ⚠️ THE TRUTHFUL PARAGRAPH, and it is truthful in a specific way that earlier
# drafts were not. A `.gitignore` and a handful of brand names were once sold as
# a security boundary. They are not one, so this says what is and is not
# controlled and stops there.
FOLDER_NOT_A_BOUNDARY_LINES = (
    # ⚠️ The truthfulness is unchanged. What changed is that a reader could not
    # tell what a "sync client" or a "search index" was, and a warning nobody
    # understands is not a warning.
    "I do not copy this folder anywhere, and I cannot stop anything else on this "
    "machine from copying it. Three ordinary things might: whatever backs this "
    "computer up; anything that keeps your files the same on your phone and your "
    "computer, which works by sending them to a company's computers; and the "
    "search that finds files on this machine, which reads them to do it. If where "
    "these files sit matters, ask your lawyer how they want them kept.",
)

# ═══════════════════════════════════════════════════════════════════════════════
# A11, WHAT THE FOLDER HOLDS, described so that the description and the number
# cannot drift apart.
#
# The failure: the sentence described three files, two folders and a working note,
# six things, and then printed a derived seven, because the seventh was never
# mentioned. A reader's note: "so either it lied or I can't count, and at that
# moment I didn't trust either answer." Which is the real cost. The number was
# right and the sentence was short, and the reader ended up distrusting both.
#
# So each phrase is paired with HOW MANY entries of the layout it accounts for.
# The printed number is still `len(WORKSPACE_ENTRIES)`: the layout itself, never a
# typed figure, and `--selftest` requires these counts to sum to exactly that. An
# eighth entry therefore stops the engine instead of quietly going undescribed.
# ═══════════════════════════════════════════════════════════════════════════════
FOLDER_CONTENTS = (
    (
        "three files you can open and correct. What you have told me, what to do "
        "and in what order, and what your conditions rule out",
        3,
    ),
    (
        f"two folders I fill in as we go, {WORKSPACE_DIRS[0]} for the things you "
        f"get hold of and {WORKSPACE_DIRS[1]} for the record of them",
        2,
    ),
    (
        "one empty file for your own account of what happened, which you write "
        "once and I never touch",
        1,
    ),
    ("one file for anything you tell me along the way", 1),
    ("one printable copy of the list, to put in a pocket", 1),
    ("one small file that asks other programs to leave the folder alone", 1),
    ("and my own working notes", 1),
)

FOLDER_CONTENTS_LINES = (
    "Inside it I will put "
    + "; ".join(phrase for phrase, _how_many in FOLDER_CONTENTS)
    + f". {len(WORKSPACE_ENTRIES)} things in all, and nothing else.",
)

# A22: 🔴 THE PATH POINTER IS DERIVED FROM `H5`, AND IT USED TO BE A QUESTION.
#
# What this screen used to do: ask "Shall I write the path down?", default no, and
# explain that a file listing case folders is itself a record on a device that may
# be examined. Every word of that reasoning is still true. What was wrong with it
# was that it asked the wrong person.
#
# A reader hit it and called it ridiculous: *"we want to keep a STATE for the agent
# at all times, meaning including the information of the folder."* They are right,
# and the failure it produced is worse than the artifact it avoided. Declining is
# the default, so the ordinary outcome was a session that could not find its own
# folder, a person back at the first screen believing every answer was gone, and —
# where they started again from above the folder — a second state file sitting
# where the upward search reaches it first, winning every later attempt to resume.
#
# 🔴 SO THE DECISION MOVES TO THE ONE FACT THAT DECIDES IT. Whether a file naming a
# case folder is dangerous depends on whether a device of theirs may be looked at,
# and `H5` asks exactly that, in phase 0, long before the folder exists. Nobody has
# to weigh a forensic trade-off about a tool they met four minutes ago. The engine
# already knows the answer, and unsure counts as exposed.
#
# ⛔ IT IS STILL SAID OUT LOUD, EITHER WAY. Writing a file into somebody's home
# folder without telling them would be a worse version of this screen, not a
# better one — RAIL 9. So this stays a screen; it states what was done and what to
# do about it, and it stops being a question. ADR 0010.

# Shared, because it is true whichever branch prints: the pointer helps recover a
# lost path, it does not remove the need to carry one.
POINTER_CARRY_LINES = (
    "I do not remember your folder by myself. Next time, I go looking for it in "
    "the folder you run me from, and then in each folder that contains that one. "
    "Your case folder is usually somewhere else entirely, so what actually finds "
    "it is the path.",
    "",
    "⚠️ So from here on, every command has to carry the path to your folder. You "
    "do not have to remember it: I print the whole line to run, with the path "
    "already in it, at the bottom of every screen. Copy it from there.",
)

# `device_exposed` is not set: the path is written down, and the person is told.
#
# 🔴 THIS USED TO PUT WORDS IN THEIR MOUTH, on the one screen about a forensic
# artifact. It opened "You told me nobody has asked to look at your phone or your
# computer" — but TWO of the deciding question's answers reach this branch, and one
# of them is `asked but I refused`. Somebody did ask. A reader who had refused a
# search was told they had said the opposite, in the paragraph explaining why a file
# naming their case folder was about to be written to their home directory.
#
# ⛔ So the branch no longer narrates the answer, it QUOTES it. The echo below is
# formatted with the person's own reply at render time, which cannot drift when the
# contract's options change, and the sentence that follows states only what is true
# of every answer reaching here: nothing has been taken and nothing has been
# searched. Refusing is not the same as being searched, and neither is being asked.
POINTER_KEPT_ECHO = (
    "You answered: {answer}. Nothing of yours has been taken and nothing has been "
    "searched, so I have also written the path down, in a file in your home folder, "
    "and I can offer it back to you if you ever lose it."
)

POINTER_KEPT_TAIL = (
    "",
    "⚠️ That file is itself a record on this machine, and you should know it "
    "exists. It holds the path and nothing else — none of your answers, nothing "
    "you have told me. If you would rather it did not exist, delete it and "
    "nothing breaks; I will just ask you where your folder is next time.",
)

# `device_exposed` IS set. ⛔ Nothing is written outside the folder, and the
# question of where these files should physically live routes to counsel.
#
# ⛔ NO HIDDEN VOLUME, AND NO CLAIM THAT REMOVABLE STORAGE IS SAFE. Encrypted
# removable storage is named only as something to ask a lawyer about, never as a
# step. Moving material once a warrant exists can be characterised as concealment,
# whether it can is a legal question, and zero packs are reviewed. A tool that
# answered it would be advising a possible offence in order to feel helpful.
POINTER_WITHHELD_LINES = POINTER_CARRY_LINES + (
    "",
    "⛔ And that is the only place the path is going. You told me a device of "
    "yours may be looked at, so I am not writing your folder's location anywhere "
    "outside the folder itself — not in your home folder, not anywhere.",
    "",
    "Where these files should physically live is a question with real "
    "consequences, and I do not answer those. Ask your lawyer, today, before you "
    "move anything — including onto a memory stick, and including onto an "
    "encrypted one if somebody has told you to do that. Moving material once "
    "someone has a warrant is not a neutral act, and I am not going to tell you "
    "it is.",
)


# ═══════════════════════════════════════════════════════════════════════════════
# Refusals
# ═══════════════════════════════════════════════════════════════════════════════


class Refusal(Exception):
    """Something this engine will not do. The message is shown verbatim."""

    def __init__(self, message, code=EXIT_REFUSED):
        super().__init__(message)
        self.code = code


# ═══════════════════════════════════════════════════════════════════════════════
# A3: THE GROUPING, CHECKED AGAINST THE CONTRACT
#
# 🔴 THIS IS WHAT MAKES AN AUTHORED GROUPING SAFE TO HAVE AT ALL.
#
# A semantic grouping is a second list of the contract's ids living outside the
# contract, which is precisely the shape that produced "the seven hard exclusions",
# a prose count of a list that had grown to fourteen. The difference is that
# this second list is VERIFIED against the first one every time the engine starts,
# in both directions, and a disagreement is a refusal rather than a missing screen.
#
#   contract has, mapping does not place  →  the item would appear on NO screen.
#                                            An unread exclusion is an absent
#                                            exclusion, so this refuses.
#   mapping names, contract does not have →  the mapping is describing a list that
#                                            no longer exists, so it can no longer
#                                            be trusted about the rest of it.
#
# ⛔ There is deliberately no flag, no environment variable and no "best effort"
# path. A switch that lets the engine run with an unplaced exclusion is a switch
# that ships the defect this check exists to catch.
# ═══════════════════════════════════════════════════════════════════════════════


def exclusion_placement():
    """`{item id: screen index}` from `EXCLUSION_GROUPS`. Refuses a bad table.

    A duplicate placement is refused rather than resolved last-wins: the item
    would print twice and the screen count would still look right.
    """
    placed = {}
    for index, group in enumerate(EXCLUSION_GROUPS):
        heading, ids = group
        if not str(heading).strip():
            raise Refusal(
                f"I cannot start: exclusion screen {index + 1} has no heading, and "
                "a screen without one is the wall this grouping exists to break up."
            )
        if not ids:
            raise Refusal(
                f"I cannot start: exclusion screen {index + 1} holds no items, so it "
                "is a turn spent showing nothing."
            )
        for item_id in ids:
            if item_id in placed:
                raise Refusal(
                    "I cannot start: the exclusion grouping puts "
                    f"{item_id} on two screens ({placed[item_id] + 1} and "
                    f"{index + 1}). One item, one screen."
                )
            placed[item_id] = index
    return placed


def verify_exclusion_grouping(contract_ids):
    """The mapping must place exactly the ids the contract holds. Or refuse.

    `contract_ids` is read out of the contract at runtime. Nothing here is a
    count and nothing here is a transcribed list.
    """
    placed = exclusion_placement()
    held = list(contract_ids)
    unplaced = [item_id for item_id in held if item_id not in placed]
    orphaned = sorted(item_id for item_id in placed if item_id not in set(held))
    if not unplaced and not orphaned:
        return placed

    trouble = []
    if unplaced:
        trouble.append(
            "  in the contract, on no screen   "
            + ", ".join(unplaced)
            + "\n    Each of those would be shown to nobody. An exclusion that is "
            "not read is an exclusion that is not there."
        )
    if orphaned:
        trouble.append(
            "  on a screen, not in the contract  "
            + ", ".join(orphaned)
            + "\n    The grouping is describing a list that has changed, so it "
            "cannot be trusted about the rest of it either."
        )
    raise Refusal(
        "I cannot start: the list of things not to do does not match the screens "
        "I would show it on.\n"
        + "\n".join(trouble)
        + f"\n  the contract holds  {len(held)} item(s)\n"
        f"  the screens place   {len(placed)} item(s) across "
        f"{len(EXCLUSION_GROUPS)} screen(s)\n"
        "Fix EXCLUSION_GROUPS in this file so every item the contract holds sits "
        "on exactly one screen. ⛔ Do not amend the contract to fit the screens: "
        "the grouping is design and may be re-cut freely, the items may not."
    )


# ═══════════════════════════════════════════════════════════════════════════════
# The contract: load, and verify the digest before reading a field
# ═══════════════════════════════════════════════════════════════════════════════


def _sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def load_contract(json_path=CONTRACT_JSON, sha_path=CONTRACT_SHA):
    """Read the contract, or refuse. Naming what failed, not just that it did.

    The digest file is one line of `shasum -a 256` output naming its sibling:
    `<digest>  tree.json`. Field 0 is the digest. Hash the FILE, never a string
    read out of it, command substitution strips trailing newlines and reports a
    mismatch on a byte-identical file, and a false failure trains people to
    ignore the check.
    """
    for path, what in ((json_path, "the contract"), (sha_path, "its digest")):
        if not path.exists():
            raise Refusal(
                f"I cannot start: {what} is missing at {path}.\n"
                "This is a build output. The install is incomplete. Do not work "
                "around it."
            )
        if path.stat().st_size == 0:
            raise Refusal(f"I cannot start: {what} at {path} is empty.")

    recorded_line = sha_path.read_text(encoding="utf-8").strip()
    fields = recorded_line.split()
    if not fields:
        raise Refusal(f"I cannot start: {sha_path} holds no digest.")
    recorded = fields[0]
    if not re.fullmatch(r"[0-9a-f]{64}", recorded):
        raise Refusal(
            f"I cannot start: {sha_path} field 0 is not a sha256 digest: {recorded!r}"
        )

    actual = _sha256_file(json_path)
    if actual != recorded:
        raise Refusal(
            "I cannot start: the contract does not match its digest, so I do not "
            "know what I would be walking you through.\n"
            f"  file      {json_path}\n"
            f"  recorded  {recorded}   (from {sha_path})\n"
            f"  actual    {actual}\n"
            "Rebuild the contract, or reinstall. Do not proceed by hand."
        )

    try:
        tree = json.loads(json_path.read_text(encoding="utf-8"))
    except ValueError as exc:  # includes JSONDecodeError
        raise Refusal(f"I cannot start: {json_path} is not readable JSON: {exc}")
    if not isinstance(tree, dict) or not tree:
        raise Refusal(f"I cannot start: {json_path} did not parse to a mapping.")
    return tree, actual


# ═══════════════════════════════════════════════════════════════════════════════
# ⚖️ THE JURISDICTION PACKS. What may be used, and, today, what may not.
#
# ADR 0008 decision 5, which is the doctrine this whole section implements:
#
#   Selecting a jurisdiction is NOT a claim that the jurisdiction is supported.
#   Zero packs are reviewed, Canada included, so every selection available today
#   lands in the degraded path. The engine reads the selected pack's review state
#   and capability flags, refuses by default, and never substitutes, defaults, or
#   infers an unanswered value. Selecting a jurisdiction with no reviewed pack
#   must make the flow LOUDER, not quieter, than it is today.
#
# ⛔ Nothing here answers a legal question, and nothing here can: the file it reads
# carries no answers. `UNANSWERED` is a correct value. An invented answer is a
# defect, because a frightened person will act on it.
# ═══════════════════════════════════════════════════════════════════════════════


def load_packs(json_path=PACKS_JSON, sha_path=PACKS_SHA):
    """Read the pack summary, or refuse. Same shape as `load_contract`.

    ⛔ IT REFUSES RATHER THAN DEGRADING TO "no jurisdictions available". A broken
    or missing pair means the install is broken, and an empty option list would be
    indistinguishable, on screen, from a world in which no pack exists. That is
    the failure mode this project keeps rediscovering: a green over nothing read.
    """
    for path, what in ((json_path, "the jurisdiction list"), (sha_path, "its digest")):
        if not path.exists():
            raise Refusal(
                f"I cannot start: {what} is missing at {path}.\n"
                "This is a build output. The install is incomplete. Do not work "
                "around it."
            )
        if path.stat().st_size == 0:
            raise Refusal(f"I cannot start: {what} at {path} is empty.")

    fields = sha_path.read_text(encoding="utf-8").strip().split()
    if not fields:
        raise Refusal(f"I cannot start: {sha_path} holds no digest.")
    recorded = fields[0]
    if not re.fullmatch(r"[0-9a-f]{64}", recorded):
        raise Refusal(
            f"I cannot start: {sha_path} field 0 is not a sha256 digest: {recorded!r}"
        )
    # Hash the FILE, never a string read out of it. Same reason as the contract.
    actual = _sha256_file(json_path)
    if actual != recorded:
        raise Refusal(
            "I cannot start: the jurisdiction list does not match its digest, so I "
            "do not know which packs I would be offering you.\n"
            f"  file      {json_path}\n"
            f"  recorded  {recorded}   (from {sha_path})\n"
            f"  actual    {actual}\n"
            "Rebuild, or reinstall. Do not proceed by hand."
        )

    try:
        payload = json.loads(json_path.read_text(encoding="utf-8"))
    except ValueError as exc:
        raise Refusal(f"I cannot start: {json_path} is not readable JSON: {exc}")
    if not isinstance(payload, dict) or not payload:
        raise Refusal(f"I cannot start: {json_path} did not parse to a mapping.")
    return PackSet(payload)


class PackSet:
    """Every pack's review state and capability flags. No legal answer, ever."""

    # Defined once, with the other setup constants, so the screen and the lookup
    # cannot disagree about the spelling of the one answer that has no pack.
    NOT_LISTED = JURISDICTION_NOT_LISTED

    def __init__(self, payload):
        self.packs = payload.get("packs") or {}
        codes = payload.get("codes") or []
        if not isinstance(codes, list) or not codes:
            raise Refusal(
                f"I cannot start: {PACKS_JSON} lists no jurisdiction at all. That is "
                "a build that read nothing, not a world with no packs in it."
            )
        # ⛔ Derived at build time from the directory listing, never typed, and
        # cross-checked here: a code offered with no pack behind it would be a
        # menu entry that refuses the moment it is chosen.
        missing = [c for c in codes if c not in self.packs]
        if missing:
            raise Refusal(
                "I cannot start: the jurisdiction list offers "
                f"{', '.join(missing)} with no pack behind it."
            )
        self.codes = list(codes)

    # ── review state ──────────────────────────────────────────────────────────

    def review_state(self, code):
        """`unreviewed` when the pack says nothing. Never `reviewed` by default."""
        review = (self.packs.get(code) or {}).get("review") or {}
        state = review.get("state")
        return state if isinstance(state, str) and state else "unreviewed"

    def reviewed(self, code):
        return self.review_state(code) == "reviewed"

    def name_of(self, code):
        """How a reader would say the jurisdiction. The code if the pack is silent."""
        meta = (self.packs.get(code) or {}).get("meta") or {}
        name = meta.get("name")
        return name if isinstance(name, str) and name else code

    # ── capabilities: refused unless the pack says otherwise, exactly ─────────

    def capability(self, code, flag):
        """True only for a literal boolean `true` in a REVIEWED pack.

        🔴 TWO GATES, AND BOTH ARE LOAD-BEARING.

        The value must be boolean `True`. Not `"yes"`, not `"partial"`, not
        `"unknown"`, not a non-empty string of any kind. A pack's tri-state fields
        are strings on purpose, and Python would read every one of them as truthy,
        so a test for truthiness here would grant a capability on the word
        `unknown`. That is the single worst bug this function could have.

        And the pack must be `reviewed`. The pack format states the invariant
        itself: a pack whose review state is not `reviewed` may not supply wording
        to a user. Enforcing it at the point of use rather than at the point of
        parsing means a pack that is edited to claim a capability without being
        reviewed still gets nothing.
        """
        if not self.reviewed(code):
            return False
        flags = (self.packs.get(code) or {}).get("capabilities") or {}
        return flags.get(flag) is True

    def unreviewed_codes(self):
        return [c for c in self.codes if not self.reviewed(c)]

    def reviewed_any(self):
        """Whether ANY offered pack is reviewed. Currently false, and derived."""
        return any(self.reviewed(c) for c in self.codes)


# ═══════════════════════════════════════════════════════════════════════════════
# The graph, derived from the contract and from nothing else
# ═══════════════════════════════════════════════════════════════════════════════


class Graph:
    """Nodes, document order, and edges. All read out of the contract."""

    def __init__(self, tree):
        self.tree = tree

        # Phase keys in the order the contract states them. A phase whose value
        # is a list holds nodes; the one whose value is a mapping is the output.
        self.node_phases = [
            key
            for key, value in tree.items()
            if key.startswith("phase_") and isinstance(value, list)
        ]
        self.output_phases = [
            key
            for key, value in tree.items()
            if key.startswith("phase_") and isinstance(value, dict)
        ]
        if not self.node_phases:
            raise Refusal("I cannot start: the contract declares no phases of nodes.")
        if not self.output_phases:
            raise Refusal("I cannot start: the contract declares no output phase.")

        self.order = []
        self.nodes = {}
        self.phase_of = {}
        for phase in self.node_phases:
            for node in tree[phase]:
                node_id = node.get("id")
                if not isinstance(node_id, str) or not node_id:
                    raise Refusal(f"I cannot start: a node in {phase} has no id.")
                if node_id in self.nodes:
                    raise Refusal(f"I cannot start: duplicate node id {node_id}.")
                self.nodes[node_id] = node
                self.phase_of[node_id] = phase
                self.order.append(node_id)

        self.output = tree[self.output_phases[0]]
        self.first = self.order[0]

        # A3: the exclusion grouping, checked against what the contract actually
        # holds. ⛔ HERE, at load time, so every command path runs it: `begin`,
        # `screen`, `answer`, `state`, `verify`, `drive` and `--selftest` all build
        # a Graph, and none of them can show a screen without one.
        self.exclusion_screen_of = verify_exclusion_grouping(self.exclusion_ids())

        # Wording sites, and whether to print the unreviewed note at all.
        jurisdiction = (tree.get("meta") or {}).get("jurisdiction") or {}
        self.wording_sites = frozenset(jurisdiction.get("wording_sites") or ())
        self.wording_reviewed = bool(jurisdiction.get("reviewed"))

    # ── node shape ────────────────────────────────────────────────────────────

    def node(self, node_id):
        try:
            return self.nodes[node_id]
        except KeyError:
            raise Refusal(f"I cannot continue: the contract has no node {node_id}.")

    def items_of(self, node_id):
        return self.node(node_id).get("items") or []

    def exclusion_ids(self):
        """Every exclusion item id the contract holds, in document order.

        ⚠️ Read from `type: hard_exclusions` rather than from an id pattern, so
        renaming the items cannot quietly shrink the list this is checked against.
        """
        found = []
        for node_id in self.order:
            if self.nodes[node_id].get("type") != "hard_exclusions":
                continue
            for item in self.nodes[node_id].get("items") or []:
                item_id = item.get("id")
                if not isinstance(item_id, str) or not item_id:
                    raise Refusal(
                        f"I cannot start: an item in {node_id} has no id, so I "
                        "cannot tell which screen it belongs on."
                    )
                found.append(item_id)
        return found

    def kind(self, node_id):
        node = self.node(node_id)
        if node.get("type") == "hard_exclusions":
            return "exclusions"
        if node.get("type") == "guidance":
            return "guidance"
        if "ask" in node:
            return "question"
        raise Refusal(
            f"I cannot continue: node {node_id} is neither a question, a "
            "statement, nor a list I know how to show."
        )

    def steps(self, node_id):
        """How many screens this node occupies."""
        if self.kind(node_id) != "exclusions":
            return 1
        return len(self.exclusion_screens(node_id))

    def exclusion_screens(self, node_id):
        """A3: `[(heading, items)]`, one entry per screen this node occupies.

        Membership is the declared grouping, already verified against the contract
        in `__init__`. ORDER inside a screen is the CONTRACT'S document order, not
        the grouping's, so re-cutting the grouping cannot silently reorder a
        warning. A group holding none of this node's items is dropped, so the
        printed screen count is never larger than the list being shown.
        """
        items = self.items_of(node_id)
        if not items:
            raise Refusal(
                f"I cannot continue: {node_id} carries no items, and an unread "
                "warning is an absent warning."
            )
        screens = []
        for index, group in enumerate(EXCLUSION_GROUPS):
            heading = group[0]
            on_this_screen = [
                item
                for item in items
                if self.exclusion_screen_of.get(item.get("id")) == index
            ]
            if on_this_screen:
                screens.append((heading, on_this_screen))
        if not screens:
            raise Refusal(
                f"I cannot continue: none of {node_id}'s items is placed on a "
                "screen, so the whole list would go unread."
            )
        return screens

    def chunk(self, node_id, step):
        """`(heading, items)` for one exclusion screen."""
        screens = self.exclusion_screens(node_id)
        if not 0 <= step < len(screens):
            raise Refusal(f"I cannot continue: {node_id} has no screen {step}.")
        return screens[step]

    def wording_ids_on(self, node_id, step):
        """⚖️ The wording sites the contract places on ONE screen. Derived.

        A site is either a node id or an exclusion ITEM id, so the answer depends
        on which chunk of a multi-screen list is on show. ⛔ Nothing is typed: a
        contract that moved a site to another screen moves the marker with it.

        Tolerates an id that is not a contract node at all — the setup screens
        (`S0`, the folder screens, `W4`, the plan) are engine-owned and carry no
        seam — so a caller may pass anything a session was ever parked on.
        """
        if not self.wording_sites or node_id not in self.nodes:
            return []
        if self.kind(node_id) == "exclusions":
            try:
                _, chunk = self.chunk(node_id, step)
            except Refusal:
                return []
            ids = [item.get("id") for item in chunk]
        else:
            ids = [node_id]
        return [i for i in ids if i in self.wording_sites]

    def is_record_question(self, node_id):
        """A per-record question, by the contract's own marker and nothing else."""
        return "layer" in self.node(node_id)

    def options(self, node_id):
        """The answers this node accepts. Contract `options` render as-is."""
        node = self.node(node_id)
        declared = node.get("options")
        if isinstance(declared, list) and declared:
            return list(declared)
        if self.kind(node_id) == "question":
            return list(ANSWER_SET_DEFAULT)  # A1
        return list(ANSWER_SET_ACK)  # A2

    # ── edges ─────────────────────────────────────────────────────────────────

    def document_successor(self, node_id):
        index = self.order.index(node_id)
        if index + 1 < len(self.order):
            return self.order[index + 1]
        return PLAN_ID

    def edge(self, node_id, answer):
        """(next_node_id, flags_to_set): mechanically, from the contract."""
        node = self.node(node_id)
        branch = node.get("branch")
        if isinstance(branch, dict) and answer in branch:
            entry = branch[answer] or {}
            to_set = dict(entry.get("set") or {})
            target = entry.get("next")
            if target:
                return target, to_set
            # A branch that only sets a flag falls through to the node's own
            # `next`, then to document order. T2 is written that way.
            return node.get("next") or self.document_successor(node_id), to_set
        if node.get("next"):
            return node["next"], {}
        return self.document_successor(node_id), {}


# ═══════════════════════════════════════════════════════════════════════════════
# A screen
# ═══════════════════════════════════════════════════════════════════════════════

RULE = "─" * 72


class Screen:
    """One screen. `verbatim` is the audit trail the fidelity test reads."""

    def __init__(self, node_id, step, kind, lines, options, verbatim, authored):
        self.node_id = node_id
        self.step = step
        self.kind = kind
        self.lines = lines
        self.options = options
        self.verbatim = verbatim
        self.authored = authored
        # A12, the base command line for this turn, set by `Session.screen()`
        # because only the session knows whether a folder exists yet.
        self.command = None
        # A21, the way back after the errands. Set beside `command` for the same
        # reason: only the session knows the folder.
        self.collected_command = None
        # A15: (this screen's number, the most there can be). Set by
        # `Session.screen()` for the same reason. ⛔ BOTH DERIVED.
        self.progress = None

    @property
    def text(self):
        return "\n".join(self.lines)

    def command_block(self):
        """A12, the whole line to run, with nothing left to remember."""
        if not self.command:
            return []
        if self.kind == "plan":
            # A21. ⛔ THE WAY BACK IS PRINTED HERE, on the last screen, because this
            # is the last thing the person is looking at before they close the
            # window and go and do the errands. A reader asked for exactly this:
            # having done what was possible, open a new terminal and run one thing
            # that checks it all landed. Nothing else in the flow tells them.
            return [
                "",
                "To read this again at any time, run:",
                f"  {self.command}",
                "",
                "When you have collected what you can, come back and run this. It "
                "looks in each folder and tells you what arrived and what did not:",
                f"  {self.collected_command}",
            ]
        lead = "If you are typing commands yourself, this is the whole line to run"
        if self.kind == "path":
            return [
                "",
                f"{lead}, one or the other:",
                f"  {self.command} {FOLDER_ACCEPT_DEFAULT}",
                f"  {self.command} /the/path/you/want",
            ]
        if len(self.options) == 1:
            return ["", f"{lead}:", f"  {self.command} {self.options[0]}"]
        return [
            "",
            f"{lead}. Put your answer in place of {ANSWER_SLOT}:",
            f"  {self.command} {ANSWER_SLOT}",
        ]

    def progress_block(self):
        """A15, where they are, on every screen. ⛔ Neither number is typed.

        ⚠️ ONE LINE, AND MOSTLY DIGITS. What this replaced explained the ceiling
        in a full sentence — "at most… some questions get skipped… so it may be
        fewer" — on every one of roughly thirty screens. The explanation is worth
        reading once and is noise thereafter, and a reader reported exactly that.
        `~` carries the same fact in one character; `S0` says what it means, once,
        on the screen the counter first appears on.
        """
        if not self.progress:
            return []
        at, most = self.progress
        if at >= most:
            return [f"{at} / {most} · last one", ""]
        return [f"{at} / ~{most}", ""]

    def render(self):
        out = [RULE, ""]
        out.extend(self.lines)
        out.append("")
        out.extend(self.progress_block())
        if self.kind == "path":
            # A10, the one screen whose answer cannot be a closed list. What is
            # accepted is stated exactly, so a rejection is never a surprise.
            out.append(f"  · {FOLDER_ACCEPT_DEFAULT}")
            out.append("  · or a path of your own, written out in full")
            out.append("")
            out.append(
                f"NEXT: reply {FOLDER_ACCEPT_DEFAULT}, or type the path you want."
            )
        elif self.kind == "question":
            for option in self.options:
                out.append(f"  · {option}")
            out.append("")
            out.append("NEXT: reply with exactly one of: " + " / ".join(self.options))
        elif self.kind == "plan":
            out.append("NEXT: nothing here is optional. Start at the top.")
        else:
            out.append(
                "NEXT: reply " + " or ".join(f"{o}" for o in self.options) + " to go on."
            )
        out.extend(self.command_block())
        out.append("")
        return "\n".join(out)

    def as_dict(self):
        return {
            "node": self.node_id,
            "step": self.step,
            "kind": self.kind,
            "authored": self.authored,
            "options": list(self.options),
            "text": self.text,
            "rendered": self.render(),
            "verbatim": [{"field": f, "value": v} for f, v in self.verbatim],
        }


# ═══════════════════════════════════════════════════════════════════════════════
# A session, the answers so far, and where it is parked
# ═══════════════════════════════════════════════════════════════════════════════


class Session:
    def __init__(self, graph, digest, ask_folder=True):
        self.graph = graph
        self.digest = digest
        self.node_id = SCREEN_ZERO_ID
        self.step = 0
        self.finished = False
        # A25: where they are in the plan. 0 = the opening, 1..N = one numbered step
        # per turn, N+1 = the closing blocks, -1 = the whole plan on one screen
        # because they asked for it. ⛔ Not the same thing as `self.step`, which
        # counts screens of one contract node.
        self.plan_cursor = 0
        self.flags = {}
        self.answers = []  # [{"node": id, "step": n, "answer": text}]
        self.selected = []  # per-record questions answered affirmatively
        self.declined = []

        # A10: the folder. `ask_folder` is False only for the stateless test
        # surface, which has no filesystem to put a folder on.
        self.ask_folder = bool(ask_folder)
        self.workspace = None  # Path, once the person has confirmed it
        self.proposed = None  # Path, resolved, awaiting confirmation
        self.typed = None  # exactly what they typed, to show beside the resolved
        self.pending_node = None  # the contract node the folder screens interrupt
        self.pointer = None  # None = not asked · False = declined · True = opted in

        # ⚖️ A17, W4. `None` = not asked yet. A code, or `not-listed`, once asked.
        # ⛔ Never defaulted to a jurisdiction. There is no sensible default and
        # inventing one would silently pick a country for somebody.
        self.jurisdiction = None
        # Loaded lazily, and only where the folder screens run: the stateless test
        # surface has no setup screens at all, so it needs no packs either.
        self._packs = None

    @property
    def packs(self):
        """The pack summary, loaded once. Refuses if the pair is missing or stale."""
        if self._packs is None:
            self._packs = load_packs()
        return self._packs

    # ── serialisation. Human-readable, and the node id it is parked on. ───────

    def to_state(self):
        return {
            "_note": (
                "Written by the Machine Witness triage engine. It is the only "
                "thing that reads or writes this file. Safe to read; do not "
                "hand-edit."
            ),
            "schema": STATE_SCHEMA,
            "parked_on": self.node_id,
            "parked_step": self.step,
            "plan_cursor": self.plan_cursor,
            "finished": self.finished,
            "contract_digest": self.digest,
            "your_folder": None if self.workspace is None else str(self.workspace),
            "folder_you_are_choosing": None if self.proposed is None else str(self.proposed),
            "folder_you_typed": self.typed,
            "question_the_folder_screens_interrupted": self.pending_node,
            "path_written_down_in_your_home_folder": self.pointer,
            # ⚖️ Plain-language key, like every other key here: the person can open
            # this file. ⛔ The VALUE is the pack code, never a display name, so a
            # resumed session looks the pack up by the same string the build emitted.
            "where_you_told_me_you_are": self.jurisdiction,
            "flags": self.flags,
            "answers": self.answers,
            "records_you_said_yes_to": self.selected,
            "records_you_said_no_to": self.declined,
        }

    @classmethod
    def from_state(cls, graph, digest, data, ask_folder=True):
        session = cls(graph, digest, ask_folder=ask_folder)
        if not isinstance(data, dict):
            raise Refusal("I cannot resume: the saved state is not a mapping.")
        if data.get("schema") != STATE_SCHEMA:
            raise Refusal(
                "I cannot resume: the saved state was written by a different "
                f"version of this engine (schema {data.get('schema')!r})."
            )
        parked = data.get("parked_on")
        if not isinstance(parked, str) or not parked:
            raise Refusal("I cannot resume: the saved state names no node.")
        if (
            parked not in (SCREEN_ZERO_ID, PLAN_ID)
            and parked not in SETUP_IDS
            and parked not in graph.nodes
        ):
            raise Refusal(
                f"I cannot resume: the saved state is parked on {parked}, which "
                "is not in the contract. The contract changed underneath it."
            )
        saved_digest = data.get("contract_digest")
        if isinstance(saved_digest, str) and saved_digest and saved_digest != digest:
            raise Refusal(
                "I cannot resume: the contract changed since this session "
                "started, so the answers may no longer mean what they meant.\n"
                f"  then  {saved_digest}\n"
                f"  now   {digest}\n"
                "Start again rather than mix the two."
            )
        session.node_id = parked
        session.step = int(data.get("parked_step") or 0)
        session.plan_cursor = int(data.get("plan_cursor") or 0)
        session.finished = bool(data.get("finished"))
        session.flags = dict(data.get("flags") or {})
        session.answers = list(data.get("answers") or [])
        session.selected = list(data.get("records_you_said_yes_to") or [])
        session.declined = list(data.get("records_you_said_no_to") or [])

        folder = data.get("your_folder")
        session.workspace = Path(folder) if folder else None
        choosing = data.get("folder_you_are_choosing")
        session.proposed = Path(choosing) if choosing else None
        typed = data.get("folder_you_typed")
        session.typed = typed if isinstance(typed, str) and typed else None
        session.pending_node = data.get("question_the_folder_screens_interrupted")
        pointer = data.get("path_written_down_in_your_home_folder")
        session.pointer = None if pointer is None else bool(pointer)

        # ⚖️ W4. Read back exactly as written.
        #
        # ⚠️ A CODE WHOSE PACK IS GONE IS NOT VALIDATED HERE, ON PURPOSE. A rebuild
        # can remove a pack, so this really happens. The temptation is to re-park
        # the session on W4 and ask again; that was written and then removed,
        # because re-parking a session that was standing on a contract node loses
        # the node it has to return to, and the person lands on the plan with their
        # remaining record questions silently skipped. A lost jurisdiction is a
        # nuisance. A lost record question is the thing this tool exists to stop.
        #
        # It is safe to carry an unknown code because every lookup refuses by
        # default: an unknown code reports `unreviewed`, grants no capability, and
        # displays as itself. That is the same degraded path every code is in today.
        where = data.get("where_you_told_me_you_are")
        session.jurisdiction = where if isinstance(where, str) and where else None
        return session

    # ── one answer at a time ──────────────────────────────────────────────────

    def plan_options(self, cursor=None):
        """A25: what a plan screen accepts, at a given cursor.

        🔴 ONE SOURCE FOR BOTH SIDES. The screen prints this list and `accept()`
        validates against it, and they diverged the moment the plan gained a second
        answer: the step screens offered `all`, `options_here()` still returned only
        `ok` for the plan, and a person typing the word the screen told them to type
        got "I did not understand that, and I am not going to guess."
        """
        if cursor is None:
            cursor = self.plan_cursor
        if cursor == PLAN_WHOLE:
            return list(ANSWER_SET_ACK)
        if cursor >= len(self.plan_steps()) + 2:
            return list(ANSWER_SET_ACK)
        return list(PLAN_ANSWER_STEP)

    def options_here(self):
        if self.node_id == PLAN_ID:
            return self.plan_options()
        if self.node_id == SCREEN_ZERO_ID:
            return list(ANSWER_SET_ACK)
        if self.node_id == FOLDER_ASK_ID:
            return [FOLDER_ACCEPT_DEFAULT]
        if self.node_id == FOLDER_CONFIRM_ID:
            return list(FOLDER_CONFIRM_OPTIONS)
        if self.node_id == FOLDER_POINTER_ID:
            return list(FOLDER_POINTER_OPTIONS)
        if self.node_id == JURISDICTION_ID:
            # ⛔ DERIVED FROM THE PACKS, NEVER TYPED. A hardcoded country list is a
            # second source of truth for which jurisdictions exist, and the copy
            # that goes stale is always the one a person is shown: offering a
            # jurisdiction whose pack was removed, or omitting one that was added.
            return [*self.packs.codes, JURISDICTION_NOT_LISTED]
        return self.graph.options(self.node_id)

    def accept(self, answer):
        """Validate and advance by exactly one answer, or reject it.

        ⛔ An answer outside the list is REJECTED, never interpreted. No fuzzy
        match, no nearest neighbour, no "I think you meant yes". Case and
        surrounding blanks are normalised because they are not the user's
        meaning; nothing else is.
        """
        if self.finished:
            raise Refusal(
                "This walk-through is finished. There is nothing left to answer.",
                code=EXIT_REJECTED,
            )

        options = self.options_here()
        given = "" if answer is None else str(answer).strip()

        if self.node_id == FOLDER_ASK_ID:
            # A10, the only free-text answer in the engine. Resolved and refused
            # BEFORE it is recorded, so a refused path never enters the state and
            # the session stays parked on this screen.
            match = self._accept_folder_path(given)
        else:
            match = None
            for option in options:
                if given.lower() == option.lower():
                    match = option
                    break
            if match is None:
                raise Refusal(
                    "I did not understand that, and I am not going to guess.\n"
                    f"  you said   {given!r}\n"
                    "  I accept   " + " / ".join(options) + "\n"
                    "Reply with one of those, exactly.",
                    code=EXIT_REJECTED,
                )

        self.answers.append(
            {"node": self.node_id, "step": self.step, "answer": match}
        )

        if self.node_id in FOLDER_IDS:
            return self._advance_folder(match)

        if self.node_id == JURISDICTION_ID:
            return self._advance_jurisdiction(match)

        if self.node_id == SCREEN_ZERO_ID:
            self.node_id = self._gate_folder(self.graph.first)
            self.step = 0
            return match
        if self.node_id == PLAN_ID:
            # A25: the plan is walked one step per turn. ⛔ `finished` is set only at
            # the real end, because it is what blocks every later answer -- setting it
            # on the first acknowledgement is what made the old single screen re-render
            # itself in full, with the counter bumped and "last one" printed twice.
            total = len(self.plan_steps())
            if match == "all":
                self.plan_cursor = PLAN_WHOLE
            elif self.plan_cursor == PLAN_WHOLE or self.plan_cursor >= total + 2:
                self.finished = True
            else:
                self.plan_cursor += 1
            return match

        node = self.graph.node(self.node_id)
        kind = self.graph.kind(self.node_id)

        # More screens of the same node? Stay put, move on one step.
        if self.step + 1 < self.graph.steps(self.node_id):
            self.step += 1
            return match

        # `sets: <name>` records the answer itself under that name.
        sets = node.get("sets")
        if isinstance(sets, str) and sets:
            self.flags[sets] = match

        # A per-record question: selected, or not. The contract's invariant puts
        # `unsure` on the "probably yes, go and check" side.
        if kind == "question" and self.graph.is_record_question(self.node_id):
            target = self.selected if match in AFFIRMATIVE else self.declined
            if self.node_id not in target:
                target.append(self.node_id)

        target_node, to_set = self.graph.edge(self.node_id, match)
        self.flags.update(to_set)
        self.node_id = self._gate_folder(target_node)
        self.step = 0
        return match

    # ── A10: the folder, asked at a boundary derived from the contract ─────────

    def _gate_folder(self, target):
        """Interrupt for the folder screens before the first per-record question.

        The boundary is the contract's own `layer` marker, never a transcribed id
        and never a position. Once the person has confirmed a folder this returns
        the target untouched, so it fires exactly once per session.
        """
        if not self.ask_folder or self.workspace is not None:
            return target
        if target in SETUP_IDS or target not in self.graph.nodes:
            return target
        if not self.graph.is_record_question(target):
            return target
        self.pending_node = target
        return FOLDER_ASK_ID

    def _accept_folder_path(self, given):
        """`ok`, or something shaped like a full path. Never a guess.

        ⛔ A bare word is REJECTED rather than resolved against the working
        directory. The working directory could be anywhere, including inside
        this tool, and a person typing `yes` at this screen must not end up with
        a folder called `yes` wherever the agent happened to be standing.
        """
        if given.lower() == FOLDER_ACCEPT_DEFAULT:
            wanted = FOLDER_DEFAULT
        elif given.startswith("~") or given.startswith("/"):
            wanted = given
        else:
            raise Refusal(
                "I need a folder, and I am not going to guess where.\n"
                f"  you said   {given!r}\n"
                f"  I accept   {FOLDER_ACCEPT_DEFAULT}, or a full path starting "
                "with ~ or /\n"
                "A name on its own could land anywhere, including inside this "
                "tool, so I will not resolve one.",
                code=EXIT_REJECTED,
            )
        proposed = resolve_workspace(wanted)
        # Refuse a folder already in use HERE, before it is confirmed back, so
        # the person hears about it while they are still choosing.
        check_workspace_usable(proposed)
        self.proposed = proposed
        # What they actually typed, kept so the confirmation can show it beside
        # the resolved path. A reader typed a short path, saw a longer one read
        # back, "assumed it had misheard me and nearly typed change".
        self.typed = wanted
        return given if given else FOLDER_ACCEPT_DEFAULT

    def _advance_folder(self, match):
        if self.node_id == FOLDER_ASK_ID:
            self.node_id = FOLDER_CONFIRM_ID
            self.step = 0
            return match

        if self.node_id == FOLDER_CONFIRM_ID:
            if match == "change":
                self.proposed = None
                self.typed = None
                self.node_id = FOLDER_ASK_ID
                self.step = 0
                return match
            if self.proposed is None:  # cannot happen through the screens
                raise Refusal(
                    "I have lost track of which folder you chose, and I will not "
                    "guess. Tell me the path again."
                )
            # Confirmed. Re-resolved and re-refused at the moment of commitment,
            # because the filesystem can change between two screens.
            self.workspace = resolve_workspace(str(self.proposed))
            self.proposed = None
            # A22: DECIDED HERE, from `H5`, before the screen that reports it. The
            # screen states what was done; it does not ask, so the answer to it
            # cannot change this. ADR 0010.
            self.pointer = not self.device_exposed()
            self.node_id = FOLDER_POINTER_ID
            self.step = 0
            return match

        # The pointer screen. It states rather than asks, so `match` is only an
        # acknowledgement and `self.pointer` was already settled above.
        # ⚖️ …and then W4, which is the last setup screen. `pending_node` is left
        # alone here: W4 is what hands it back, so the question the setup screens
        # interrupted survives one more screen.
        self.node_id = JURISDICTION_ID
        self.step = 0
        return match

    def _advance_jurisdiction(self, match):
        """⚖️ Record where they said they are, and hand back the interrupted question.

        ⛔ No pack is consulted to decide where to go next. Nothing about the flow
        branches on jurisdiction, and nothing may: the questions are the contract's
        and the contract is jurisdiction-neutral. What a pack can change is
        vocabulary and whether a capability is offered, and only when reviewed.
        """
        self.jurisdiction = match
        onward = self.pending_node
        self.pending_node = None
        self.node_id = onward if onward else PLAN_ID
        self.step = 0
        return match

    # ── rendering ─────────────────────────────────────────────────────────────

    def screen(self, plan_cursor=None):
        """The one screen this session is parked on, ready to print.

        A25: `plan_cursor` overrides where in the plan to render from, and exists so a
        caller that wants the WHOLE plan still gets the command line, the collected
        line and the counter attached. ⛔ Calling `plan_screen()` directly skips all
        three, which is how the plan lost its progress counter.

        A12, the command line is attached HERE and nowhere else, because only the
        session knows whether a folder exists yet and therefore whether the engine
        will still be able to find its own state without being told.
        """
        built = self._build_screen(plan_cursor)
        built.command = command_form(
            "screen" if built.kind == "plan" else "answer", workspace=self.workspace
        )
        built.collected_command = command_form("collected", workspace=self.workspace)
        built.progress = self.progress()
        return built

    def progress(self):
        """A15: (this screen's number, the most there can be). ⛔ BOTH DERIVED.

        A reader said the exclusion list's own "Screen 1 of 4; 14 in all" was the
        only place in the whole flow where they knew how much was left, and asked
        for it everywhere.

        The most there can be is one privacy screen, the folder screens if they
        are being asked for, every screen the contract's nodes occupy, and the
        plan. It is a CEILING, not a total: branches skip nodes, so the walk is
        often shorter, which is why the screen says "at most" rather than
        implying a figure it cannot promise.
        """
        so_far = len(self.answers) + 1
        ceiling = 1 + sum(self.graph.steps(n) for n in self.graph.order) + 1
        if self.ask_folder:
            ceiling += len(SETUP_IDS)
        # Choosing `change` re-asks a screen, so a walk can outrun the ceiling.
        # Never print a ceiling below where the person already is.
        return so_far, max(ceiling, so_far)

    def _build_screen(self, plan_cursor=None):
        if self.node_id == SCREEN_ZERO_ID:
            return Screen(
                SCREEN_ZERO_ID,
                0,
                "notice",
                list(SCREEN_ZERO_LINES),
                list(ANSWER_SET_ACK),
                [],
                authored=True,
            )
        if self.node_id in FOLDER_IDS:
            return self.folder_screen()
        if self.node_id == JURISDICTION_ID:
            return self.jurisdiction_screen()
        if self.node_id == PLAN_ID:
            return self.plan_screen(
                self.plan_cursor if plan_cursor is None else plan_cursor
            )
        return self.node_screen(self.node_id, self.step)

    def folder_screen(self):
        """A10: three authored screens. No contract field is rendered here."""
        if self.node_id == FOLDER_ASK_ID:
            return Screen(
                FOLDER_ASK_ID,
                0,
                "path",
                list(FOLDER_ASK_LINES),
                [FOLDER_ACCEPT_DEFAULT],
                [],
                authored=True,
            )

        if self.node_id == FOLDER_CONFIRM_ID:
            if self.proposed is None:
                raise Refusal(
                    "I have lost track of which folder you chose, and I will not "
                    "guess. Tell me the path again."
                )
            lines = [
                # 🔴 THE RESOLVED ABSOLUTE PATH, confirmed back before anything is
                # created. `~` is expanded and every symlink is followed first, so
                # what is shown is where the files will actually be.
                f"I will create {self.proposed}.",
                "Only your own account on this machine will be able to open it.",
            ]
            # …and what they TYPED, whenever the two differ. A reader typed a
            # short path, saw a longer one read back, and "assumed it had
            # misheard me and nearly typed change". Showing only the resolved
            # path is correct and still unreadable: the person cannot tell a
            # correction from a misunderstanding without seeing both.
            if self.typed and self.typed != str(self.proposed):
                lines.extend(
                    [
                        "",
                        f"You typed   {self.typed}",
                        f"It lands at {self.proposed}",
                        "Those are the same folder. Your computer has a short name "
                        "and a long name for some places, ~ is short for your own "
                        "home folder, and a few others are shortcuts to longer "
                        "paths. I show you the long one because that is where the "
                        "files really go. Nothing has been changed about your "
                        "answer.",
                    ]
                )
            lines.extend(
                [
                    "",
                    *FOLDER_NOT_A_BOUNDARY_LINES,
                    "",
                    *FOLDER_CONTENTS_LINES,
                    "",
                    "Create it?",
                ]
            )
            return Screen(
                FOLDER_CONFIRM_ID,
                0,
                "question",
                lines,
                list(FOLDER_CONFIRM_OPTIONS),
                [],
                authored=True,
            )

        lines = []
        if self.workspace is not None:
            lines.append(f"Your folder is ready: {self.workspace}")
            lines.append(
                f"Everything you have told me so far is already in there, in "
                f"{MATTER_FILENAME}. You can open it and read it whenever you like."
            )
            lines.append("")
        # A22: which branch, from `H5` and nothing else. ⛔ Not from a preference,
        # not from a flag, and there is no switch that swaps them.
        lines.extend(
            self.pointer_lines()
        )
        return Screen(
            FOLDER_POINTER_ID,
            0,
            "notice",
            lines,
            list(FOLDER_POINTER_OPTIONS),
            [],
            authored=True,
        )

    def jurisdiction_screen(self):
        """⚖️ A17: one authored screen. No contract field, and no legal answer.

        Every part of it is derived from the packs: the options, the names beside
        them, and the sentence about what has been reviewed. Nothing is typed, so
        nothing can go stale in the one direction that hurts, which is claiming more
        than is true.
        """
        packs = self.packs
        lines = [*JURISDICTION_ASK_LINES, ""]

        for code in packs.codes:
            name = packs.name_of(code)
            # ⛔ The review state is printed BESIDE each option rather than only in
            # a note underneath, because a person picking their own country will
            # read their own line and stop reading.
            state = "checked by a lawyer" if packs.reviewed(code) else "not checked by a lawyer"
            lines.append(f"  {code}   {name}   ({state})")

        lines.extend(["", *JURISDICTION_NOT_LISTED_LINES])

        # ⚖️ The honest sentence, and it is CONDITIONAL on the packs rather than
        # written as a permanent truth. While nothing is reviewed it says so, in
        # full. When something is reviewed it stops saying it, by itself.
        if not packs.reviewed_any():
            lines.extend(["", *JURISDICTION_NONE_REVIEWED_LINES])

        return Screen(
            JURISDICTION_ID,
            0,
            "question",
            lines,
            self.options_here(),
            [],
            authored=True,
        )

    def _wording_seen(self):
        """⚖️ Has the full unreviewed-wording note already been on screen?

        DERIVED FROM THE ANSWERS ALREADY GIVEN, deliberately, rather than kept as
        a flag in the state file. A flag would be one more thing to serialise, to
        migrate, and to get wrong on resume — and getting it wrong in the silent
        direction means a reader who never saw the reasoning gets only the short
        marker. Derivation cannot drift from the walk, because it IS the walk.

        ⚠️ The failure mode of this function is safe in one direction only, and
        that is the direction it fails in: a shorter answer list than the reader
        actually gave prints the full note a second time. Harmless. The reverse —
        claiming it was seen when it was not — is not reachable from here, since
        every entry it counts is a screen that was answered.
        """
        for answer in self.answers:
            node_id = answer.get("node")
            if not isinstance(node_id, str):
                continue
            try:
                step = int(answer.get("step") or 0)
            except (TypeError, ValueError):
                step = 0
            if self.graph.wording_ids_on(node_id, step):
                return True
        return False

    def _wording_note(self, ids):
        """⚖️ The marker, at every site the contract names. Reasoning once."""
        if self.graph.wording_reviewed:
            return []
        if not any(node_id in self.graph.wording_sites for node_id in ids):
            return []
        if self._wording_seen():
            return ["", UNREVIEWED_WORDING_BRIEF]
        return ["", *UNREVIEWED_WORDING_LINES]

    def node_screen(self, node_id, step):
        graph = self.graph
        node = graph.node(node_id)
        kind = graph.kind(node_id)
        lines = []
        verbatim = []

        def put(field, container=None):
            """Render one contract field byte-identically, or skip it."""
            source = node if container is None else container
            value = source.get(field)
            if value is None:
                return
            if isinstance(value, list):
                for item in value:
                    verbatim.append((field, item))
                return
            lines.append(value.rstrip("\n") if value.endswith("\n") else value)
            verbatim.append((field, value))

        if kind == "exclusions":
            # 🔴 BOTH NUMBERS DERIVED. The total is the length of the contract's own
            # item list and the screen count is the length of the verified grouping.
            # Neither is typed anywhere in this file.
            total = len(graph.items_of(node_id))
            screens = graph.steps(node_id)
            lines.append(
                f"Things not to do. Screen {step + 1} of {screens}; "
                f"{total} in all, and every one of them matters."
            )
            heading, chunk = graph.chunk(node_id, step)
            # A3, the one idea this screen carries, before a word of the list.
            lines.append("")
            lines.append(heading)
            shown_ids = []
            for item in chunk:
                item_id = item.get("id")
                shown_ids.append(item_id)
                lines.append("")
                put("text", item)
                if item.get("why"):
                    put("why", item)
                # A18, after the contract's own words and clearly separated from
                # them. ⛔ Never interleaved with them, and never in place of them.
                for extra in EXCLUSION_ADDENDA.get(item_id, ()):
                    lines.append("")
                    lines.append(extra)
            lines.extend(self._wording_note(shown_ids))
            options = list(ANSWER_SET_ACK)

        elif kind == "guidance":
            put("title")
            put("text")
            lines.extend(self._wording_note([node_id]))
            options = list(ANSWER_SET_ACK)

        else:  # question
            put("ask")
            for extra in ("note_to_user", "note"):
                put(extra)
            # A14, the record's own note, unless this person's own answer has
            # already closed the path. Then the closed treatment REPLACES the
            # instruction rather than sitting in the next sentence along.
            if self.is_closed(node_id):
                lines.append("")
                lines.extend(self.closed_path_lines(node_id, asking=True))
            else:
                put("warning")
            if node.get("fence"):
                lines.append("")
                lines.append(FENCE_LINES.get(node["fence"], FENCE_UNKNOWN))
            lines.extend(self._wording_note([node_id]))
            options = graph.options(node_id)
            declared = node.get("options")
            if isinstance(declared, list) and declared:
                for option in declared:
                    verbatim.append(("options", option))

        return Screen(node_id, step, kind, lines, options, verbatim, authored=False)

    # ── the derived plan ──────────────────────────────────────────────────────

    def record_nodes(self):
        """Every per-record question, in contract order."""
        return [
            node_id
            for node_id in self.graph.order
            if self.graph.is_record_question(node_id)
        ]

    def is_closed(self, node_id):
        """Whether this person's OWN ANSWER shut this path off.

        ⛔ Never an interpretation of their conditions. The flag was set by the
        contract's own branch, from their own answer to a contract question.
        """
        return bool(self.flags.get("no_contact")) and node_id in NO_CONTACT_CLOSES

    def closed_path_lines(self, node_id, asking=False):
        """A14, why a path is shut off, and the part of its note that still holds.

        🔴 THE REPLACEMENT, NOT AN ADDITION. The instruction to obtain the record
        is withheld; the prohibition is rendered verbatim. One function, used by
        the question screen, the plan and the closed-paths file, so the three
        cannot disagree, they did, and a reader met the contradiction three times.

        `asking` adds one line and changes nothing else: on the question screen the
        person has not answered yet, and being told a record is off their list
        while being asked about it needs the missing half. The question is asked
        because their lawyer needs to know the record exists.
        """
        out = []
        if asking:
            out.append(
                "⛔ I am still asking, because your lawyer needs to know whether "
                "this record exists. You are not going to go and get it."
            )
        out.extend(CLOSED_PATH_LINES)
        kept = prohibitions_in(self.graph.node(node_id).get("warning"))
        if kept:
            out.append(CLOSED_PATH_REPLACEMENT)
            out.extend(kept)
        else:
            out.append(CLOSED_PATH_NOTHING_LEFT)
        return out

    def plan_steps(self):
        """A25: every NUMBERED step of the plan, in order, as one list.

        🔴 ONE LIST SO STEPPING IS UNIFORM. The plan's first step is sometimes "get a
        lawyer", which is not a record and is not in `plan_items()`, and the records
        only a lawyer can act on are listed underneath it rather than numbered on
        their own. Walking the plan one step per turn against `plan_items()` alone
        would therefore skip the first step in exactly the mode where it matters most
        and mis-number every step after it.

        Each entry is `(kind, payload)`. ⛔ Derived from the answers and the mode,
        never a typed sequence.
        """
        items = self.plan_items()
        yours = [entry for entry in items if entry[2] is not None]
        counsel = [entry for entry in items if entry[2] is None]
        steps = []
        if self.flags.get("plan_mode") == "preservation_only":
            steps.append(("lawyer", counsel))
            counsel = []
        steps.extend(("record", entry) for entry in [*yours, *counsel])
        return steps

    def plan_items(self):
        """Selected AND open AND eligible for this mode. Nothing hard-coded to a
        record type: the whole list is derived from the answers given."""
        items = []
        for node_id in self.record_nodes():
            if node_id not in self.selected:
                continue
            if self.is_closed(node_id):
                continue
            node = self.graph.node(node_id)
            action = node.get("action")
            counsel_only = action in COUNSEL_ONLY_ACTIONS
            if counsel_only and self.flags.get("plan_mode") == "preservation_only":
                items.append((node_id, node, None))  # routed to counsel instead
                continue
            items.append((node_id, node, action))
        items.sort(key=lambda entry: CLOCK_RANK.get(entry[1].get("clock"), CLOCK_UNKNOWN_RANK))
        return items

    def action_title(self, action):
        """A13: the plain-words instruction for one of the contract's action
        tokens. Never the question that produced it."""
        if action is None:
            return COUNSEL_ONLY_TITLE
        return ACTION_TITLES.get(action, ACTION_TITLE_UNKNOWN)

    def exposure_node(self):
        """A22: the node whose branches set `device_exposed`. ⛔ Read, never typed.

        The contract owns which question decides this, so an amendment that moves
        or renumbers it moves this with it. `--selftest` fails if no node sets the
        flag at all, because the fail-safe below would then treat every session as
        exposed forever and nothing would say why.
        """
        for node_id in self.graph.order:
            for entry in (self.graph.node(node_id).get("branch") or {}).values():
                if ((entry or {}).get("set") or {}).get("device_exposed"):
                    return node_id
        return None

    def device_exposed(self):
        """A22: whether a device of theirs may be looked at.

        ⛔ FAILS TOWARDS EXPOSED, and the asymmetry is the reason. Guessing "safe"
        writes a file naming a case folder onto a machine somebody may be about to
        examine. Guessing "exposed" costs one person one path they paste in
        themselves. So the only thing that counts as not-exposed is the deciding
        question having actually been answered without setting the flag —
        not the flag being absent, which is also what a session started before
        that question existed looks like, and what the stateless surface looks
        like when it answers nothing.
        """
        if self.flags.get("device_exposed"):
            return True
        decider = self.exposure_node()
        if decider is None:
            return True
        return not any(entry.get("node") == decider for entry in self.answers)

    def pointer_lines(self):
        """A22b: the pointer screen, with the person's own answer quoted back.

        ⛔ QUOTED, NEVER NARRATED. The kept branch used to open by describing the
        answer — "you told me nobody has asked" — which is wrong for one of the two
        replies that reach it, `asked but I refused`. Somebody who had refused a
        search was told they had said the opposite. Reading the reply out of the
        session cannot drift when the contract's options change, and the fail-safe
        below means the exposed branch never depends on finding one.
        """
        if self.device_exposed():
            return POINTER_WITHHELD_LINES
        decider = self.exposure_node()
        said = next(
            (
                entry.get("answer")
                for entry in reversed(self.answers)
                if entry.get("node") == decider
            ),
            None,
        )
        # ⛔ Not reachable while `device_exposed()` fails towards exposed: it returns
        # True unless the deciding node was answered. Kept as a belt: an unattributed
        # sentence is better than one asserting an answer that was never given.
        if not said:
            return POINTER_WITHHELD_LINES
        return (
            *POINTER_CARRY_LINES,
            "",
            POINTER_KEPT_ECHO.format(answer=said),
            *POINTER_KEPT_TAIL,
        )

    def search_phrase(self, node):
        """A19b: this record's search phrase, with any blank the session can fill.

        ⛔ Returns the phrase UNCHANGED unless a recorded answer names one thing the
        blank stands for. Nothing is inferred, nothing is defaulted, and a value the
        substitution table does not list — `both`, `unsure` — leaves the blank
        visible, because a blank is plainly waiting for the reader and a wrong
        phrase is not.

        ⛔ Every rendered surface goes through here rather than reading the guidance
        directly, so the screen, the printed sheet and the come-back check cannot
        disagree about what the person was told to search for.
        """
        guide = LAYER_GUIDANCE.get(node.get("layer")) or {}
        phrase = guide.get("search")
        rule = SEARCH_SUBSTITUTIONS.get(node.get("layer"))
        if not phrase or not rule:
            return phrase
        answered = str(self.flags.get(rule["flag"]) or "").strip().lower()
        value = SEARCH_SUBSTITUTION_VALUES.get(answered)
        if not value:
            return phrase
        return phrase.replace(rule["blank"], value)

    def drop_path(self, node):
        """A19: where this record's files go, or None if it has no destination.

        The folder NAME comes from `LAYER_GUIDANCE`, which is exhaustive over the
        contract's `layer:` values; the path it is printed under is the person's
        own case folder when one is known. ⛔ Returns None both for a record whose
        action says to leave things where they are and for a record the contract
        never marked with a layer, so a caller cannot tell "no destination" from
        "forgot to look" — it does not need to, because neither prints a path.
        """
        layer = node.get("layer")
        entry = LAYER_GUIDANCE.get(layer) or {}
        folder = entry.get("folder")
        if not folder:
            return None
        if self.workspace is None:
            return f"{DROP_ROOT}/{folder}/"
        return f"{self.workspace / DROP_ROOT / folder}/"

    def make_drop_paths(self):
        """A19: create the destinations the plan is about to print. Idempotent.

        ⛔ HERE AND NOT IN `create_workspace`, deliberately. Only the records this
        person said yes to get a folder, so an empty one is never left standing as
        a suggestion that something is missing. It also keeps `WORKSPACE_ENTRIES`
        and the folder-description count intact: everything made here lives inside
        a directory that count already accounts for.
        """
        if self.workspace is None:
            return []
        made = []
        for _node_id, node, action in self.plan_items():
            if action is None:
                continue  # a lawyer's request has nowhere for the person to file
            layer = node.get("layer")
            folder = (LAYER_GUIDANCE.get(layer) or {}).get("folder")
            if not folder:
                continue
            target = self.workspace / DROP_ROOT / folder
            try:
                target.mkdir(parents=True, exist_ok=True)
                os.chmod(target, stat.S_IRWXU)
            except OSError:
                # A folder that cannot be made is not a reason to withhold the
                # plan. The path still prints, and the person can make it.
                continue
            made.append(folder)
        return made

    def harm_first_notes(self, node_id, node, action, verbatim):
        """The contract's warning, the hard fence, and the two-edged note.

        Harm-first: what cuts against the person is shown in the same detail as
        what helps it, in place, never moved to a footer. The contract's warning
        is appended to `verbatim` here rather than by the caller so that there is
        exactly one place it can be lost from.
        """
        out = []
        warning = node.get("warning")
        if warning:
            out.append(warning)
            verbatim.append(("warning", warning))
        if node.get("fence"):
            out.append(FENCE_LINES.get(node["fence"], FENCE_UNKNOWN))
        if node.get("double_edged"):
            out.append(DOUBLE_EDGED_LINE)
        if action is not None and "standing_required" in (node.get("limits") or ()):
            out.append("Ask your lawyer before you ask anyone else.")
        return out

    def plan_screen(self, cursor=PLAN_WHOLE):
        """A25: the plan, either whole or one numbered step at a time.

        🔴 WHY IT IS STEPPED. A reader reached the end and reported it as "too much
        at once, nothing guided, just text text text" -- 239 lines, arriving in one
        turn, at the moment somebody is least able to read 239 lines.

        ⛔ AND WHY NOTHING IS SUMMARISED TO ACHIEVE THAT. Every line of the per-step
        detail is content a reader asked for a round earlier, and the caveats among it
        are RAIL 4 material: what cuts against the person, in the same detail as what
        helps, in place. So a step shows EVERYTHING it showed before; only how many
        arrive per turn changed. `all` prints the whole thing on demand, and
        `plan_document()` always renders whole, so PLAN.md remains the full record no
        matter where the person stopped reading.

        `cursor`: `PLAN_WHOLE` for the entire plan, 0 for the opening, 1..N for one
        numbered step, N+1 for the closing blocks.
        """
        graph = self.graph
        output = graph.output
        lines = []
        verbatim = []
        steps = self.plan_steps()
        total = len(steps)
        whole = cursor == PLAN_WHOLE
        # ⚠️ Out-of-range cursors render the closing blocks rather than nothing. A
        # state file written when the plan had more steps -- an answer changed, a
        # record dropped off -- must not produce an empty screen.
        # A25: 0 opening · 1..N one step each · N+1 the clock · N+2 the checklist and
        # the folder listing. ⚠️ Two closing screens, not one: together they came to 122
        # lines in a single turn, which is the defect this whole change exists to fix
        # arriving again at the end of it.
        last = total + 2
        if not whole and cursor > last:
            cursor = last
        show_opening = whole or cursor == 0
        show_clock = whole or cursor == total + 1
        show_coverage = whole or cursor >= last

        def put(field, container):
            value = container.get(field)
            if value is None:
                return
            lines.append(value.rstrip("\n") if value.endswith("\n") else value)
            verbatim.append((field, value))

        blocks = [key for key in output if isinstance(output[key], dict)]

        # 🔴 A24: THE FIRST TWELVE LINES ANSWER THE WHOLE SCREEN.
        #
        # A reader finished the walk and said the ending was "too much at once — no
        # PDF, nothing guided, just text text text." The screen was 239 lines with
        # every action stated three times, and the one artifact they could carry out
        # of the room was named nowhere in it.
        #
        # ⚠️ The length below is NOT the defect and must not be "fixed" by cutting
        # it. The per-step detail — the search phrase, the folder path, what a good
        # copy looks like — is what the SAME reader asked for a round earlier, when
        # "save what is on that device now" was correctly called an instruction
        # nobody can carry out. What was missing was a top: something short enough to
        # read while frightened that says how many things there are, which one is for
        # today, and that the list is on paper.
        #
        # ⛔ AND THE DETAIL STAYS ON THE SCREEN, because `plan_document()` renders
        # PLAN.md from this very text. Summarising here would shorten the record, and
        # the full form would survive only in the PDF — which `write_printable` is
        # allowed to fail at quietly. A summary that quietly becomes the only copy is
        # a worse defect than a long screen.
        items_preview = self.plan_items()
        if items_preview and show_opening:
            # ⛔ ITEM ZERO FOR BOTH HALVES. `plan_items` is already sorted by how fast
            # a record dies, so the first entry IS the most urgent — reading the clock
            # off one item and the title off another is how a screen ends up telling
            # somebody that the thing with hours on it is the thing with months.
            first_node, first_action = items_preview[0][1], items_preview[0][2]
            count = len(items_preview)
            lines.append(
                f"{count} thing{'' if count == 1 else 's'} to do. The detail for every "
                "one of them is below, and the same list is in the folder as a sheet "
                "you can print or put on your phone."
            )
            lines.append("")
            lines.append(
                "Start with: "
                + CLOCK_LINES.get(first_node.get("clock"), CLOCK_UNKNOWN_LINE).rstrip(
                    "."
                )
                + f" — {self.action_title(first_action)}"
            )
            lines.append("")
            # ⛔ NO RULE SEPARATOR HERE, deliberately. Three checks locate the plan's
            # blocks by splitting the screen on the rule, so emitting one would make
            # this summary a fourth block and silently shift every later index — the
            # clock qualification, the numbered-step titles and the get-a-lawyer-once
            # assertion all failed at once when it did. The summary belongs to block A
            # and sits directly above its heading.

        # ── block A: do these now, in this order ──────────────────────────────
        block_a = output.get(blocks[0]) if blocks else {}
        if show_opening:
            put("title", block_a)
            lines.append("")
        # 🔴 A24: THE RULE THAT APPLIES TO EVERY STEP IS STATED ONCE.
        #
        # It used to be repeated under every single item: "I have made that folder
        # already. Put the file in exactly as it arrives — do not rename it, and do
        # not open it and save it again." Six records meant six identical copies of
        # it, and a repeated stimulus stops being read after about five exposures —
        # which is the same finding that took the jurisdiction note down to one full
        # printing. So the one instruction that must actually land was the one being
        # trained out of visibility, by being printed the most.
        #
        # ⚠️ The claim that the folders exist is only made where a workspace is
        # known, because that is the only case in which this engine has made any. The
        # stateless surface states the rule without the claim rather than asserting
        # something untrue.
        if show_opening and any(
            self.drop_path(node) for _id, node, _action in self.plan_items()
        ):
            lines.append(
                (
                    "One rule for all of them: I have made a folder for each thing "
                    "below and printed its path under the step. "
                    if self.workspace is not None
                    else "One rule for all of them: each thing below has a folder, "
                    "and its path is printed under the step. "
                )
                + "Put what you get in exactly as it arrives — do not rename it, and "
                "do not open it and save it again."
            )
            lines.append("")

        def item(node_id, node, action, opener):
            """A13, one item: the ACTION first, then which answer put it here.

            `opener` is what starts the first line, a step number, or a dash for
            something listed under a step, and the indent for every line after it
            is derived from its width, so a two-digit step still lines up.
            """
            indent = " " * len(opener)
            lines.append(f"{opener}{self.action_title(action)}")
            # The question, verbatim, and SECOND: two records can share an action,
            # so this is what tells a person which of the two an item is about.
            lines.append(f"{indent}Because you said yes to: {node['ask']}")
            verbatim.append(("ask", node["ask"]))
            if action is None:
                lines.append(f"{indent}{COUNSEL_ONLY_LINE}")
            else:
                lines.append(f"{indent}{ACTION_LINES.get(action, ACTION_TITLE_UNKNOWN)}")
            clock_line = CLOCK_LINES.get(node.get("clock"), CLOCK_UNKNOWN_LINE)
            if node.get("clock_flag") == "RED":
                clock_line = f"{clock_line} {CLOCK_RED_SUFFIX}"
            lines.append(f"{indent}{clock_line}")
            for extra in self.harm_first_notes(node_id, node, action, verbatim):
                lines.append(f"{indent}{extra}")
            # ── A19, how to get it and where to put it ────────────────────────
            #
            # ⛔ AFTER the harm-first notes, never before. What cuts against the
            # person keeps its place above any convenience, and a search phrase
            # sitting between the instruction and its warning would put the easy
            # part in front of the costly part. RAIL 4.
            #
            # ⛔ AND NOTHING HERE PRINTS FOR A CLOSED RECORD, because a closed
            # record never reaches this function: `plan_items` drops it. That is
            # load-bearing rather than incidental — a how-to for a conversation
            # somebody is forbidden to open would be the exact contradiction the
            # withholding machinery was built to remove, so `--selftest` asserts
            # the absence rather than trusting the filter.
            if action is not None:
                guide = LAYER_GUIDANCE.get(node.get("layer")) or {}
                search = self.search_phrase(node)
                if search:
                    lines.append("")
                    lines.append(f"{indent}Search for:  {search}")
                if guide.get("good"):
                    lines.append(f"{indent}{guide['good']}")
                where = self.drop_path(node)
                if where:
                    lines.append("")
                    lines.append(f"{indent}Put it here:  {where}")
            lines.append("")

        if not self.plan_items() and show_opening:
            lines.append(
                "Nothing you said yes to has an action I can give you here."
            )
            lines.append(
                "That is not a problem. Tell your lawyer which of the questions "
                "you were not sure about."
            )

        # A25: ONE PASS OVER `plan_steps()`, emitting the step or steps this cursor
        # asks for. ⛔ The step NUMBER is the position in that list and never a count
        # of what was printed, so a single step still says which of N it is and the
        # numbering matches the whole-plan view and the printed sheet exactly.
        for index, (kind, payload) in enumerate(steps, start=1):
            if not whole and index != cursor:
                continue
            if not whole:
                lines.append(f"Step {index} of {total}.")
                lines.append("")
            if kind == "lawyer":
                lines.append(f"{index}. Get a lawyer. Today.")
                lines.append(
                    "   Until you have one, keep everything and change nothing."
                )
                lines.append("")
                # ⚠️ The records only a lawyer can act on hang under that step rather
                # than being numbered of their own. They are things to raise on the
                # call, not errands the person can run.
                if payload:
                    lines.append(f"   {COUNSEL_ONLY_HEADING}")
                    lines.append("")
                    for node_id, node, action in payload:
                        item(node_id, node, action, "   - ")
                continue
            node_id, node, action = payload
            item(node_id, node, action, f"{index}. ")

        # ── block B: what is running out ──────────────────────────────────────
        # ⚠️ The RECORD items, not `plan_steps()`: a deadline belongs to a record, and
        # the get-a-lawyer step is not one. It has no clock and must not be given one.
        items = self.plan_items()
        if show_clock and len(blocks) > 1:
            lines.append(RULE)
            lines.append("")
            block_b = output.get(blocks[1]) or {}
            put("title", block_b)
            lines.append("")
            lines.append(CLOCK_DISCLAIMER)
            lines.append("")
            # A13/A24, the same shape as the ordered list: what to do, then the
            # deadline, then which answer put it here. Two different shapes for
            # the same items is two things for a frightened person to learn.
            #
            # 🔴 TWO LINES PER ITEM, NOT THREE, and the deadline shares the first
            # one. Every word of this block also appears in block A above it — the
            # clock is printed inside each numbered step — so its entire job is
            # letting somebody see the ORDER of urgency without reading six
            # paragraphs to work it out. At three lines an item it was a second full
            # copy of the plan, and the whole screen reached 239 lines with each
            # action stated three times over.
            #
            # ⛔ FLAT AND ORDERED, deliberately NOT grouped under clock headings.
            # Grouping would make the ordering true by construction, and the test
            # that asserts this block runs fastest-dying first would then be
            # agreeing with the engine's layout instead of checking its sort.
            for node_id, node, action in items:
                clock_line = CLOCK_LINES.get(node.get("clock"), CLOCK_UNKNOWN_LINE)
                lines.append(f"· {self.action_title(action)}  {clock_line}")
                lines.append(f"    Because you said yes to: {node['ask']}")
                verbatim.append(("ask", node["ask"]))
            if not items:
                lines.append("Nothing on your list has a deadline I can show you.")
            lines.append("")

        # ── block C: A9: a non-ranked checklist, with limits, and no totals ──
        if show_coverage and len(blocks) > 2:
            lines.append(RULE)
            lines.append("")
            block_c = output.get(blocks[2]) or {}
            put("title", block_c)
            lines.append("")
            lines.append(
                "Every question you were asked, and where it stands. This is a "
                "checklist, not a count and not a rating."
            )
            # A24: GROUPED BY WHERE EACH ONE STANDS, and ordered so the ones the
            # person has to act on come first. This block used to print all twelve
            # questions in contract order with a paragraph each, so somebody read
            # sixty lines to find out which six mattered, and the five that were
            # simply absent took as much room as the ones that were not.
            #
            # ⛔ The headings are the only thing added. Every question still appears
            # with its own text, every limit on a record they hold still appears, and
            # the closed one still carries the forbidding half of its note. Nothing
            # is summarised away: what changed is that a limit list is joined onto one
            # line instead of one line each.
            ordered = list(self.record_nodes())
            groups = (
                (
                    "On your list",
                    [
                        n
                        for n in ordered
                        if n in self.selected and not self.is_closed(n)
                    ],
                ),
                (
                    "Left off, because a condition of yours may close it",
                    [n for n in ordered if self.is_closed(n)],
                ),
                (
                    "Nothing here, which is normal and is not a mark against you",
                    [
                        n
                        for n in ordered
                        if n not in self.selected and not self.is_closed(n)
                    ],
                ),
            )
            for heading, members in groups:
                if not members:
                    continue
                lines.append("")
                lines.append(heading)
                for node_id in members:
                    node = graph.node(node_id)
                    lines.append("")
                    lines.append(f"· {node['ask']}")
                    verbatim.append(("ask", node["ask"]))
                    if self.is_closed(node_id):
                        # A14: the same replacement the question screen showed. ⛔ No
                        # verbatim entry: what is rendered is a SELECTION of the
                        # contract's sentences, and claiming a whole field was
                        # rendered when part of it was withheld would be a false
                        # audit trail.
                        for line in self.closed_path_lines(node_id):
                            lines.append(f"    {line}")
                        continue
                    if node_id not in self.selected:
                        # ⛔ EXACTLY ONE LINE, and a check downstream asserts it. A
                        # caveat about a record they do not hold explains nothing and
                        # volunteers something: this block once printed every limit
                        # for every question, so a person who said NO still got a
                        # paragraph about what that record cannot establish, saved
                        # into a file on their own machine. That is how a statement
                        # about a kind of accusation nobody had mentioned reached
                        # somebody who had said no.
                        lines.append(
                            "    Not on your list. Having nothing here is normal, "
                            "and it is not a mark against you."
                        )
                        continue
                    lines.append("    On your list.")
                    # A24: every limit still shown, JOINED onto one line rather than
                    # given a line each. Six records with three caveats apiece is
                    # eighteen lines of caveat in a block whose job is to say where
                    # each question stands. ⛔ Nothing is dropped — a caveat removed
                    # to save room is a RAIL 4 failure, not a formatting choice.
                    caveats = [
                        LIMIT_LINES.get(limit, LIMIT_UNKNOWN)
                        for limit in node.get("limits") or ()
                    ]
                    if caveats:
                        lines.append(f"    {' '.join(caveats)}")
            lines.append("")
            put("closing_text", block_c)

        # A16, 🔴 SAY THAT IT IS SAVED, AND WHERE.
        #
        # The flow never did. A reader reached the end, saw the plan on screen, and
        # said: "if I'd closed that terminal window I'd have believed the whole
        # thing was gone." Nothing named a file, nothing named a folder, and
        # nothing said the work had been written down at all.
        # 🔴 A25: ON THE OPENING SCREEN AS WELL AS THE LAST ONE, and the reason is the
        # sentence that produced this block: "if I'd closed that terminal window I'd
        # have believed the whole thing was gone." Somebody who reads the opening and
        # walks away must already know it is saved and where the printable sheet is --
        # waiting until after eleven steps to say so protects only the people who
        # never needed protecting. In the whole-plan view both flags are true and this
        # renders exactly once, at the end, where it always was.
        # ⚠️ `show_opening` only, which in the whole-plan view is also true, so the
        # record still carries it. It is NOT repeated on the closing checklist screen:
        # that put the folder listing 93 lines into one turn and duplicated what the
        # opening had already said, and the short acknowledgement after the last screen
        # names the folder and the sheet again anyway.
        if show_opening and self.workspace is not None:
            lines.append("")
            lines.append(RULE)
            lines.append("")
            lines.append(
                "This is saved. You do not have to keep this window open, and you "
                "do not have to remember any of it."
            )
            lines.append("")
            # 🔴 A24: THE PRINTABLE COPY IS NAMED FIRST, AND IT USED TO BE NAMED
            # NOWHERE AT ALL. The engine has written a PDF of this list into the
            # folder since the sheet was built, and no screen in the entire flow
            # mentioned it — thirty-seven screens, zero occurrences. A reader
            # finished the walk and reported that no PDF had been created. One had.
            # Several of these errands happen in a building with no computer in it,
            # so the sheet is the only part of this the person can take with them,
            # and it was the one thing they were never told about.
            #
            # ⚠️ It is also what makes the rest of this screen safe to keep short:
            # nothing is being hidden by a compact summary when the complete list is
            # sitting in the folder in a form that can be carried.
            lines.append(f"  Your folder      {self.workspace}")
            lines.append("")
            lines.append(
                f"  {PRINTABLE_FILENAME:<20} the whole list, to print or put on your "
                "phone. Take it with you"
            )
            lines.append("")
            for name, what in (
                (PLAN_FILENAME, "the same list, as text you can read here"),
                (MATTER_FILENAME, "what you told me, in your own answers"),
                (CLOSED_PATHS_FILENAME, "what your conditions rule out, and why"),
                (RECOLLECTION_FILENAME, "empty, and yours. Your own account, written once"),
                (NOTES_FILENAME, "anything else you tell me, added as you tell me it"),
            ):
                lines.append(f"  {name:<20} {what}")
            lines.append("")
            lines.append(
                "Those five are plain text. Double-clicking one normally opens it "
                "in whatever your computer uses for text; you can also open them "
                "from any notes or text app. Reading them changes nothing, and "
                "correcting one breaks nothing here."
            )
            lines.append("")
            # ⚠️ THIS SENTENCE USED TO BE WRONG TWICE OVER. It said "the two empty
            # folders", on a screen that had just told the person to put files into
            # four subfolders of the first one, and it said the engine's own working
            # note lived in there when it sits at the top of the folder instead. Both
            # halves were read by somebody who then could not tell what was where.
            lines.append(
                f"{WORKSPACE_DIRS[0]} already has a folder waiting for each thing on "
                f"your list — the path is printed under its step above. "
                f"{WORKSPACE_DIRS[1]} stays empty until there is something in the "
                "first one to make a record of."
            )

            # ⚖️ A17. WHERE THEY SAID THEY ARE, ON THE LAST SCREEN, so it is never
            # asked again and so the assistant relaying this has it in front of it
            # without opening a file.
            #
            # ⛔ WHAT THIS IS NOT: it is not a claim that the jurisdiction is
            # covered. The state is printed beside it precisely so the sentence
            # cannot be read as coverage, and while nothing is reviewed it says so
            # in words rather than in a flag a person would have to interpret.
            if self.jurisdiction:
                lines.append("")
                if self.jurisdiction == JURISDICTION_NOT_LISTED:
                    lines.append(
                        "You said your country is not one of the ones I listed. "
                        "Nothing above depends on it: it is all about your own "
                        "devices and your own accounts."
                    )
                else:
                    packs = self.packs
                    lines.append(
                        f"  Where you are    {self.jurisdiction}  "
                        f"({packs.name_of(self.jurisdiction)})"
                    )
                    if not packs.reviewed(self.jurisdiction):
                        lines.append("")
                        lines.append(
                            "I have no material for there that a lawyer has "
                            "checked, so nothing above tells you what the law is. "
                            "Your lawyer does that part."
                        )

        # A25: a step offers `all`; the last screen and the whole-plan view do not,
        # because there is nothing left to expand. ⛔ The option list is what the
        # engine validates against, so it has to match what the screen says it takes.
        options = self.plan_options(PLAN_WHOLE if whole else cursor)
        return Screen(PLAN_ID, 0, "plan", lines, options, verbatim, authored=True)


# ═══════════════════════════════════════════════════════════════════════════════
# The state file. This engine is the only thing that reads or writes it.
# ═══════════════════════════════════════════════════════════════════════════════


# ═══════════════════════════════════════════════════════════════════════════════
# WHAT THE FOLDER SITS ON
#
# ⛔ BY MOUNT PROPERTIES AND RESOLVED SYMLINKS. NEVER BY BRAND NAME.
#
# An earlier draft defended this with four brand strings. Four brand strings miss
# a custom sync root, a network mount, a symlink, and a rename, all four of
# which are ordinary, and any one of which puts a person's case folder somewhere
# it is copied off this machine. What is inspected here is what the operating
# system says the mount IS: its filesystem type, its source, and its options.
#
# THE MECHANISM, stated plainly because a refusal has to be defensible:
#
#   Linux   /proc/self/mountinfo, falling back to /proc/mounts. The kernel's own
#           table: mount point, filesystem type, source, and mount options.
#   macOS   the `mount` utility with no arguments, which prints the same table
#           the kernel holds: `<source> on <point> (<type>, <options…>)`.
#   both    the path is resolved FIRST, `Path.resolve()` follows every symlink
#           in the chain, and every check runs on the resolved path, so a
#           symlink pointing into a network volume is the same case as naming
#           that volume outright.
#   both    the entry is matched by st_dev as well as by path prefix, because
#           macOS presents `/` and its data volume as one device through
#           firmlinks, and a prefix-only match would pick the wrong volume.
#
# ⛔ WHAT IT CANNOT SEE, and why an unrecognised answer is therefore a refusal
# rather than a pass:
#
#   · a userspace program watching a PLAIN LOCAL DIRECTORY. A sync client with a
#     custom root can be an ordinary folder on the ordinary disk, and no mount
#     property distinguishes it from any other folder. This is why the folder
#     screen says out loud that it cannot control what else on this machine
#     copies the folder, instead of claiming a boundary.
#   · a provider mount that does not appear in the table on some releases.
#     partly covered by the operating system's own provider directories below.
#   · anything on a platform with no reader here. That case refuses.
#   · a filesystem type this file does not recognise. That case refuses too: a
#     type we cannot classify is not established to be local.
# ═══════════════════════════════════════════════════════════════════════════════

MountFact = collections.namedtuple("MountFact", "point source fstype options origin")

# Families that carry bytes to another machine. Types, never vendors.
NETWORK_FSTYPES = frozenset(
    {
        "9p", "afp", "afpfs", "afs", "beegfs", "ceph", "cifs", "coda", "davfs",
        "davfs2", "ftp", "ftpfs", "gfs2", "glusterfs", "gpfs", "lustre",
        "moosefs", "ncpfs", "nfs", "nfs3", "nfs4", "ocfs2", "orangefs", "pvfs2",
        "smb", "smb2", "smb3", "smbfs", "sshfs", "webdav",
    }
)

# Families where a PROGRAM, not the disk, decides what the bytes are. That is
# exactly how a sync client presents a folder, which is why the family is the
# property that matters and the vendor is not.
PROGRAM_SERVED_FSTYPES = frozenset(
    {
        "fskit", "fuse", "fuseblk", "fusefs", "fusefs.sshfs", "kbfuse",
        "macfuse", "osxfuse", "userfs",
    }
)

# Ordinary on-disk and in-memory filesystems. A type that is in none of the three
# sets is UNCLASSIFIED, and unclassified refuses.
LOCAL_FSTYPES = frozenset(
    {
        "apfs", "aufs", "bcachefs", "btrfs", "cd9660", "devtmpfs", "erofs",
        "exfat", "ext2", "ext3", "ext4", "f2fs", "fat", "fat32", "hfs",
        "hfsplus", "iso9660", "jfs", "lifs", "msdos", "nilfs2", "ntfs", "ntfs3",
        "nullfs", "overlay", "overlayfs", "ramfs", "reiserfs", "squashfs",
        "tmpfs", "udf", "ufs", "unionfs", "vfat", "xfs", "zfs",
    }
)

# The shape of a mount source that names another machine. Syntax, not a vendor.
REMOTE_SOURCE_SHAPES = (
    re.compile(r"^//"),  # //host/share
    re.compile(r"^\\\\"),  # \\host\share
    re.compile(r"^[A-Za-z][A-Za-z0-9+.\-]*://"),  # scheme://host/path
    re.compile(r"^[A-Za-z0-9][A-Za-z0-9._\-]*@[^/]+:"),  # user@host:/export
    re.compile(r"^[A-Za-z0-9][A-Za-z0-9._\-]*:/"),  # host:/export
)


def _unescape_octal(text):
    """`/proc` escapes a space in a path as `\\040`. Undo that."""
    return re.sub(r"\\([0-7]{3})", lambda m: chr(int(m.group(1), 8)), text)


def _parse_linux_mountinfo(text):
    facts = []
    for line in text.splitlines():
        if " - " not in line:
            continue
        left, _, right = line.partition(" - ")
        before = left.split()
        after = right.split()
        if len(before) < 6 or len(after) < 2:
            continue
        options = [o for o in before[5].split(",") if o]
        if len(after) > 2:
            options.extend(o for o in after[2].split(",") if o)
        facts.append(
            MountFact(
                _unescape_octal(before[4]),
                _unescape_octal(after[1]),
                after[0],
                tuple(options),
                "linux-mountinfo",
            )
        )
    return facts


def _parse_linux_mounts(text):
    facts = []
    for line in text.splitlines():
        fields = line.split()
        if len(fields) < 4:
            continue
        facts.append(
            MountFact(
                _unescape_octal(fields[1]),
                _unescape_octal(fields[0]),
                fields[2],
                tuple(o for o in fields[3].split(",") if o),
                "linux-mounts",
            )
        )
    return facts


# `<source> on <point> (<type>, <option>, …)`. The point is matched greedily so a
# point containing " (" cannot split the line early.
MACOS_MOUNT_LINE = re.compile(r"^(?P<source>.+?) on (?P<point>.+) \((?P<options>[^()]*)\)\s*$")


def _parse_macos_mount(text):
    facts = []
    for line in text.splitlines():
        found = MACOS_MOUNT_LINE.match(line)
        if not found:
            continue
        fields = [f.strip() for f in found.group("options").split(",") if f.strip()]
        if not fields:
            continue
        facts.append(
            MountFact(
                found.group("point"),
                found.group("source").strip(),
                fields[0],  # macOS prints the filesystem type first
                tuple(fields[1:]),
                "darwin-mount",
            )
        )
    return facts


MOUNT_TABLE_PARSERS = {
    "linux-mountinfo": _parse_linux_mountinfo,
    "linux-mounts": _parse_linux_mounts,
    "darwin-mount": _parse_macos_mount,
}


def parse_mount_table(text, origin):
    """Parse one of the three table formats. Also the test seam for fixtures."""
    try:
        parser = MOUNT_TABLE_PARSERS[origin]
    except KeyError:
        raise Refusal(f"I do not know how to read a {origin!r} mount table.")
    return parser(text or "")


def read_mount_table():
    """(entries, what was consulted). An EMPTY list means it could not be seen.

    ⛔ Fails closed by construction: every caller treats an empty list as a
    refusal, so a platform with no reader here refuses rather than assuming a
    folder is local.
    """
    if sys.platform.startswith("linux"):
        for path, origin in (
            (Path("/proc/self/mountinfo"), "linux-mountinfo"),
            (Path("/proc/mounts"), "linux-mounts"),
        ):
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if not text.strip():
                continue
            facts = parse_mount_table(text, origin)
            if facts:
                return facts, f"this machine's own list of mounted volumes ({path})"
        return [], "this machine's own list of mounted volumes, which I could not read"

    if sys.platform == "darwin":
        binary = "/sbin/mount" if os.path.exists("/sbin/mount") else shutil.which("mount")
        if binary:
            try:
                run = subprocess.run(
                    [binary],
                    stdin=subprocess.DEVNULL,
                    capture_output=True,
                    text=True,
                    timeout=20,
                    check=False,
                )
            except (OSError, subprocess.SubprocessError):
                run = None
            if run is not None and run.stdout and run.stdout.strip():
                facts = parse_mount_table(run.stdout, "darwin-mount")
                if facts:
                    return facts, f"this machine's own list of mounted volumes ({binary})"
        return [], "this machine's own list of mounted volumes, which I could not read"

    return [], f"a list of mounted volumes, which I have no way to read on {sys.platform}"


def _covers(point, path):
    """Is `point` this path, or a folder above it? Compared part by part."""
    try:
        parts = Path(point).parts
    except (TypeError, ValueError):
        return False
    if not parts:
        return False
    return tuple(path.parts[: len(parts)]) == tuple(parts)


def mount_for(path, facts):
    """The entry this path sits on, or None when that cannot be established.

    ⛔ None is a REFUSAL upstream, never a pass. Matched by device as well as by
    prefix: macOS presents the system and data volumes as one device through
    firmlinks, so the longest matching prefix alone picks the wrong volume, and a
    table that disagrees with the filesystem is not an answer.
    """
    probe = path
    target_dev = None
    while True:
        try:
            target_dev = os.stat(probe).st_dev
            break
        except OSError:
            if probe.parent == probe:
                break
            probe = probe.parent
    if target_dev is None:
        return None

    on_this_device = []
    for fact in facts:
        if not _covers(fact.point, path):
            continue
        try:
            if os.stat(fact.point).st_dev != target_dev:
                continue
        except OSError:
            continue  # a mount point that cannot be inspected is not evidence
        on_this_device.append((len(Path(fact.point).parts), fact))
    if not on_this_device:
        return None
    on_this_device.sort(key=lambda entry: entry[0])
    return on_this_device[-1][1]


def _remote_source(source):
    return any(shape.search(source) for shape in REMOTE_SOURCE_SHAPES)


def classify_mount(fact):
    """(class, what it is) for a mount to refuse, or None for an ordinary disk.

    Classes: `network` · `program` · `unclassified`. All three refuse; they are
    separate because the reason a person is given has to be the true one.
    """
    fstype = (fact.fstype or "").strip().lower()
    tokens = {fstype, fstype.split(".")[0], fstype.split(".")[-1]} - {""}
    options = {str(option).strip().lower() for option in (fact.options or ())}
    source = (fact.source or "").strip()

    if tokens & NETWORK_FSTYPES:
        return ("network", f"a {fstype} volume, which is served over a network")
    if _remote_source(source):
        return ("network", f"mounted from {source}, which names another machine")
    if tokens & PROGRAM_SERVED_FSTYPES:
        return ("program", f"a {fstype} volume, which a program serves rather than a disk")
    if str(fact.origin).startswith("darwin") and "local" not in options:
        # macOS marks every real local volume `local`. Its absence is a property
        # of the mount, not a guess about a name.
        return ("network", f"a {fstype} volume this machine does not report as local")
    if not tokens & LOCAL_FSTYPES:
        return ("unclassified", f"a {fstype} volume, and I do not know what that is")
    return None


def provider_areas():
    """Folders the OPERATING SYSTEM reserves for third-party file providers.

    ⚠️ NOT BRAND NAMES, these are the provider-agnostic locations the system
    itself defines, so every provider is under them and none is named here. They
    are a supplement to the mount table, not a replacement: on some releases a
    provider's mount does not appear in the table at all.
    """
    # ⚠️ RESOLVED, like everything else here. A home directory reached through a
    # symlink would otherwise sit outside every area this builds, and the check
    # would compare two spellings of the same folder and find no match.
    try:
        home = Path.home().resolve()
    except (RuntimeError, OSError):
        home = None
    areas = []
    if sys.platform == "darwin" and home is not None:
        areas.append(
            (
                home / "Library" / "CloudStorage",
                "the folder this system reserves for cloud providers",
            )
        )
    if sys.platform.startswith("linux"):
        uid = getattr(os, "getuid", None)
        if uid is not None:
            for tail, what in (
                ("gvfs", "the folder this system reserves for remote and cloud volumes"),
                ("doc", "the folder this system reserves for files handed over by other programs"),
            ):
                try:
                    areas.append(((Path(f"/run/user/{uid()}") / tail).resolve(), what))
                except OSError:
                    continue
    return areas


def _undetectable_refusal(root, mechanism, what_happened):
    return Refusal(
        "I cannot establish what that folder sits on, so I will not use it.\n"
        f"  you asked for  {root}\n"
        f"  I checked      {mechanism}\n"
        f"  what I found   {what_happened}\n"
        "Not being able to check is not the same as it being safe: a folder that "
        "copies itself to a company server, or to another person's computer, "
        "looks exactly like this from here. So this is a refusal, not a warning.\n"
        "Pick a folder under your home directory on this machine's own disk. If "
        "you cannot, ask your lawyer where they want your files kept."
    )


def refuse_unsafe_volume(root, mounts=None):
    """Refuse a folder that is not established to be on this machine's own disk.

    `mounts` is the injection seam for tests: a list of `MountFact`. `None` means
    read this machine's real table. There is deliberately no environment
    variable and no flag, a switch that makes this check pass is a switch that
    makes it worthless.
    """
    for area, what in provider_areas():
        if _covers(area, root):
            raise Refusal(
                "I will not put your case folder there. This system hands that "
                "folder to a cloud provider.\n"
                f"  you asked for   {root}\n"
                f"  it sits inside  {area}\n"
                f"That is {what}. Everything under it is copied off this machine "
                "by whichever provider owns it. Whatever the folder is called, "
                "and whoever renamed it.\n"
                "Pick a plain folder on this machine, somewhere under your home "
                "directory."
            )

    if mounts is None:
        facts, mechanism = read_mount_table()
    else:
        facts, mechanism = list(mounts), "the list of mounted volumes I was given"

    if not facts:
        raise _undetectable_refusal(root, mechanism, "no list I could read")

    fact = mount_for(root, facts)
    if fact is None:
        raise _undetectable_refusal(
            root,
            mechanism,
            "nothing in it covers that path on the volume the path is actually on",
        )

    verdict = classify_mount(fact)
    if verdict is None:
        return fact
    kind, what = verdict

    if kind == "unclassified":
        raise _undetectable_refusal(root, mechanism, f"{what}, mounted at {fact.point}")

    if kind == "program":
        raise Refusal(
            "I will not put your case folder there. That folder is not handled "
            "by this machine's own disk, a program stands between you and the "
            "files.\n"
            f"  you asked for  {root}\n"
            f"  it sits on     {fact.point}\n"
            f"  which is       {what}\n"
            f"  mounted from   {fact.source}\n"
            "That is how a sync client or a cloud drive presents a folder: the "
            "program decides what is really there, and it can copy what you save "
            "somewhere else without this machine's disk being involved.\n"
            "Pick a plain folder on this machine, somewhere under your home "
            "directory."
        )

    raise Refusal(
        "I will not put your case folder there. That folder is on a volume that "
        "leaves this machine.\n"
        f"  you asked for  {root}\n"
        f"  it sits on     {fact.point}\n"
        f"  which is       {what}\n"
        f"  mounted from   {fact.source}\n"
        "Anything saved there travels to another machine, and neither of us can "
        "see what happens to it after that or who else can read it.\n"
        "Pick a folder on this machine's own disk, under your home directory. If "
        "you have been told to keep it somewhere else, ask your lawyer first."
    )


# ═══════════════════════════════════════════════════════════════════════════════
# IS THE FOLDER INSIDE A VERSION-CONTROLLED PROJECT?
#
# ⛔ BY INSPECTING THE FILESYSTEM. NEVER BY RUNNING `git`.
#
# A subprocess would need the tool installed, would run whatever `git` is on the
# path, and would read the person's own configuration to answer. One marker entry
# is the whole question, so this walks up and looks for it.
#
# THE MECHANISM, stated plainly because a refusal has to be defensible:
#
#   · the path is resolved FIRST by the caller, so a link into a project is the
#     same case as naming the project outright
#   · the resolved path itself is checked, then every folder above it, up to the
#     filesystem root, a case folder AT the top of a project is the same hazard
#     as one buried inside it
#   · a `.git` DIRECTORY and a `.git` FILE both count. A submodule and a linked
#     worktree carry a file holding a pointer, not a directory
#   · a folder that cannot be inspected is stepped over rather than treated as an
#     answer, and the walk keeps going up
#
# ⛔ WHAT IT CANNOT SEE, so the limits are on the record rather than implied:
#
#   · a project whose marker is somewhere else entirely, set through the
#     environment, or through a configured work tree with no marker in it
#   · any other kind of version control. This looks for one marker, and a
#     different tool's marker has a different name
#   · a project created LATER. This answers at the moment the folder is chosen;
#     nothing stops someone starting a project in a folder above it afterwards
#   · a copy. If the folder is copied into a project, the copy is a new path this
#     was never asked about
# ═══════════════════════════════════════════════════════════════════════════════


def version_controlled_project(root):
    """(project folder, the marker found) for the project this path sits in.

    `None` when no folder from here to the filesystem root carries the marker.
    """
    probe = root
    while True:
        marker = probe / VERSION_CONTROL_MARKER
        try:
            # `is_symlink` as well, so a marker that is a broken link still
            # counts. Fail closed: an entry by that name is the answer.
            if marker.exists() or marker.is_symlink():
                return probe, marker
        except OSError:
            pass  # a folder we cannot inspect is not an answer. Keep going up
        if probe.parent == probe:
            return None
        probe = probe.parent


def resolve_workspace(given, start=None, mounts=None):
    """The folder this engine may write to, resolved, and refused if unsafe.

    🔴 `Path.resolve()` FIRST, and every check afterwards runs on the resolved
    path. It follows every symlink in the chain, so a link pointing into the
    install tree, a version-controlled project, a network volume or a provider
    folder is the same case as naming that place outright, which is the hole a
    check on the typed string leaves wide open.
    """
    if given:
        root = Path(given).expanduser().resolve()
    else:
        root = Path(start or Path.cwd()).resolve()

    install = INSTALL_ROOT.resolve()
    if root == install or install in root.parents:
        raise Refusal(
            "I will not put your case folder inside the tool's own install "
            "folder.\n"
            f"  you asked for  {root}\n"
            f"  the tool lives at  {install}\n"
            "Your records are yours and must sit outside it, an update or a "
            "reinstall would take them with it, and nothing about your matter "
            "belongs in the tool. Pick a folder in your home directory."
        )

    # The install tree is often INSIDE a project rather than above it, so the
    # check above cannot reach this case and the two are separate refusals.
    project = version_controlled_project(root)
    if project is not None:
        folder, marker = project
        raise Refusal(
            "I will not put your case folder inside a project that keeps its own "
            "history of every file in it.\n"
            f"  you asked for   {root}\n"
            f"  it sits inside  {folder}\n"
            f"  which holds     {marker}\n"
            "That is the kind of project people keep code in, and the tool that "
            "manages it copies whatever is inside it. One ordinary command sends "
            "everything in that folder to a shared server, or puts it on the "
            "internet where anyone can read it, with a note of who sent it and "
            "when. None of that can be taken back afterwards.\n"
            "Pick a folder outside that project. Somewhere under your home "
            "directory that is not part of any project."
        )

    refuse_unsafe_volume(root, mounts=mounts)
    return root


# ═══════════════════════════════════════════════════════════════════════════════
# What the folder holds. Seven things, and three of them are documents the person
# is meant to read and correct.
# ═══════════════════════════════════════════════════════════════════════════════

# ⚠️ NOT DESCRIBED AS A SECURITY BOUNDARY, here or on any screen. It asks one
# tool to leave the folder alone. That is all it does and all it is said to do.
GITIGNORE_TEXT = """\
# Everything in this folder is yours, and none of it belongs in a code
# repository. This line asks one tool (git) to ignore all of it.
*

# ⚠️ THIS IS A CONVENIENCE, NOT A PROTECTION. It does not stop any of these from
# reading what is in here: somebody adding these files by force; a project in a
# folder above this one; whatever backs this computer up; the search that indexes
# files on this machine; or any other program on it. If where these files live
# matters, ask your lawyer how they want them kept.
"""

MATTER_HEADER = """\
# What you told me

This file stays on this machine. I do not upload it.

It is never read into an assistant prompt. I do not put it in front of the AI
service that is talking to you, and I never will.

⛔ Do not paste it into any AI service yourself, not to summarise it, not to
tidy it up, not to ask what it means. If someone needs to see it, ask your lawyer
how they want it sent.

## This is yours. How to change it.

Open it in anything that shows plain text, the text editor that came with this
computer, a notes app, whatever you already use. Read it, and correct anything
that is wrong.

Correcting it breaks nothing. Nothing I do depends on what this file says, and I
never read it back.

⚠️ One honest warning. While we are still working through the questions, I rewrite
this file every time you answer one, so anything you add now would be overwritten
next time. Either wait until we reach the end, or keep your own notes in a
separate file beside this one. Once we are finished I stop touching it.
"""

# ═══════════════════════════════════════════════════════════════════════════════
# A18: THE FILE X13 TELLS THEM TO WRITE, MADE FOR THEM INSTEAD OF DESCRIBED.
#
# A reader met `X13` — "write down what you remember ONCE, as soon as possible,
# and then never improve it" — and said the tool was telling them to go and do
# something on their own that it was plainly part of. They were right. The advice
# is correct and is the contract's; what was missing was a PLACE, and a place is
# the engine's to provide.
#
# ⛔ THE ENGINE DOES NOT ASK FOR THE CONTENT AND NEVER RECEIVES IT. It creates an
# empty file with a heading and gets out of the way. That is the whole difference
# between this and asking what happened, which the contract forbids: the person
# writes into their own file, in their own editor, and nothing about it is ever
# read back, put in a prompt, or sent anywhere.
#
# 🔴 NO MACHINE TIMESTAMP IN IT, DELIBERATELY. The obvious move is to stamp the
# creation time at the top, and it is wrong: a date that looks like when the
# account was written, but is really when the folder was made, is worse than no
# date at all in a document a lawyer may one day rely on. Only the person knows
# when they wrote it, so there is a blank line and they fill it in.
#
# ⛔ AND IT IS WRITTEN ONCE. `create_workspace` skips it if it exists, so a second
# run cannot overwrite what somebody wrote at four in the morning. `MATTER_HEADER`
# warns that MATTER.md is rewritten on every answer; that must never be true of
# this file, and the skip is what makes `X13`'s "never improve it" a property of
# the tool rather than a request.
# ═══════════════════════════════════════════════════════════════════════════════

NOTES_TEXT = """\
# What you told me

This file is for the things you tell me that are not a yes or a no — where you put
a file, a name, a date, anything you want kept with the rest of it.

It starts empty. I write this heading and nothing else. Anything below it was added
because you said it, and I will tell you it is going in here before I put it there.

## What happens to it

It only ever grows. Nothing in here is edited or removed to make room, so if
something you said turns out to be wrong, say so and the correction goes on the end
underneath it. Both stay. A note that has been quietly changed is worth less than
two notes that disagree.

It is never uploaded. ⛔ It is never read back into an assistant prompt — not by me
and not to remind me what you said. That direction is closed on purpose: this is the
one file here holding your words rather than your answers.

⚠️ What you type in the chat window has already gone to the company whose computers
run the assistant. Putting it here does not undo that and does not add to it. This
file is so the words survive the window being closed.

## If somebody else is named in here

That is allowed and it is normal — you cannot describe your own week without other
people in it. It stays in this folder, it never goes into our own files, and nobody
is contacted about anything in it. ⛔ If you are under any order about who you may
speak to, writing a name down here is not a way around it. Ask your lawyer.
"""

RECOLLECTION_TEXT = """\
# What you remember

This file is empty on purpose. It is for your own account, in your own words,
written ONCE.

My own questions were about devices and accounts, not about what happened. This
file exists because the list of things not to do told you to write it down
straight away, and a file in the right place with a date on it is worth more than
a note you cannot find later.

If you have already told me things in the chat window, they are not in here. This
file is yours and I do not write to it. What I was told is in notes.md beside
this one.

## What happens to it

Nothing. I made this file and I will not write to it again, not on this run and
not on any later one. It is never uploaded. It is never read into an assistant
prompt, and it is never put in front of the AI service that is talking to you.

⛔ Do not paste it into any AI service yourself either, not to summarise it, not
to tidy it up, not to check how it sounds. If someone needs to see it, ask your
lawyer how they want it sent.

## Why once, and why not tidied afterwards

This is not our rule and it is not about being neat. A rough note written
immediately is worth far more than a polished one written later, and the edits
themselves become a problem.

So write it, then leave it alone. If you remember something new next week, do NOT
come back and change this — start a new file beside this one and put its own date
on it. Two dated notes are fine. One note that has been quietly improved is not.

## Fill in yourself

The date you wrote this:

## Your account


"""

MATTER_FOOTER = """\
## What I have not asked you, and will not

I have not asked what happened, who else was involved, or what you have been
accused of. I do not need any of it, and none of my questions require it.
"""

PLAN_PLACEHOLDER = """\
# What to do, in order

You have not answered all the questions yet, so there is nothing to put here.
This file is rewritten every time you answer one, and it will be complete when we
reach the end.
"""

CLOSED_PATHS_HEADER = """\
# What is closed to you, and why

⛔ This file holds closed paths and the reason for each, and nothing else. No
account of what happened, nothing about anyone else, no dates.

Only your lawyer can say what your conditions actually cover. Nothing here is me
reading them for you, each line below comes from an answer you gave me.
"""

CLOSED_PATHS_NONE = (
    "Nothing is closed off by what you told me. If that changes, so does this "
    "file."
)

CLOSED_PATHS_NO_LAWYER = (
    "Anything that means contacting someone else, or asking a stranger to keep a "
    "record for you.\n"
    "  Closed because you told me you do not have a lawyer yet. A request like "
    "that cannot be un-sent, and whether it may be made at all is a legal "
    "question I do not answer."
)

# The opt-in pointer. ⛔ OFF unless the person asks for it, and the cost of asking
# is on the screen where they answer.
POINTER_DIRNAME = ".machine-witness"
POINTER_FILENAME = "workspaces"


def _write_private(path, text):
    """Write a file only this person can read. Best effort on the mode."""
    path.write_text(text, encoding="utf-8")
    try:
        os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass
    return path


def check_workspace_usable(root):
    """Refuse a folder already in use for something else.

    Two reasons, and the second is the one that would surprise someone: case
    files would be mixed into whatever is already there, and this engine sets the
    folder to 700, which is a change to somebody's existing folder, made on
    their behalf, that they did not ask for.
    """
    if not root.exists():
        return root
    if not root.is_dir():
        raise Refusal(
            "That is a file, not a folder.\n"
            f"  you asked for  {root}\n"
            "Give me a folder name. One that does not exist yet is fine. I will "
            "create it."
        )
    if (root / STATE_FILENAME).exists():
        return root  # already a case folder of ours
    try:
        occupied = any(root.iterdir())
    except OSError as exc:
        raise Refusal(
            f"I cannot look inside {root}, so I will not use it: {exc}"
        )
    if occupied:
        raise Refusal(
            "That folder already has things in it, and I will not mix your case "
            "files into it.\n"
            f"  you asked for  {root}\n"
            "I would also be changing who is allowed to read that folder, and I "
            "am not doing that to a folder that is already in use for something "
            "else. Give me an empty folder, or a name that does not exist yet."
        )
    return root


def create_workspace(root):
    """Make the folder and everything in it. Idempotent, and 700.

    ⛔ Two of the entries are created and never NAMED on a screen, A11.
    """
    check_workspace_usable(root)
    root.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(root, stat.S_IRWXU)
    except OSError:
        pass  # a filesystem that cannot hold the mode is not a reason to stop
    for name in WORKSPACE_DIRS:
        folder = root / name
        folder.mkdir(exist_ok=True)
        try:
            os.chmod(folder, stat.S_IRWXU)
        except OSError:
            pass
    gitignore = root / GITIGNORE_FILENAME
    if not gitignore.exists():
        _write_private(gitignore, GITIGNORE_TEXT)
    # A18. ⛔ CREATED ONCE AND NEVER AGAIN. The `exists()` guard is not tidiness:
    # this is the only file in the folder whose contents are the person's own
    # account, and overwriting it on a second run would destroy the one thing
    # `X13` says cannot be rewritten.
    recollection = root / RECOLLECTION_FILENAME
    if not recollection.exists():
        _write_private(recollection, RECOLLECTION_TEXT)
    # A23. ⛔ SAME `exists()` GUARD, AND FOR A STRICTER REASON. This one is
    # APPEND-ONLY: the assistant adds to the end of it as the person volunteers
    # things, so recreating it on a later run would delete detail nobody can
    # reproduce. ⚠️ The engine writes the header and never writes to it again.
    notes = root / NOTES_FILENAME
    if not notes.exists():
        _write_private(notes, NOTES_TEXT)
    # A20. A placeholder sheet, for the same reason `PLAN.md` gets one: the folder
    # is described to the person as holding a printable list before there is a list
    # to print, and a described file that is not there reads as something broken.
    # ⚠️ Overwritten on every answer by `write_printable`, unlike the file above.
    printable_path = root / PRINTABLE_FILENAME
    if PRINTABLE is not None and not printable_path.exists():
        try:
            printable_path.write_bytes(
                PRINTABLE.render_pdf(
                    [("title", "What to do, in order"), ("body", PRINTABLE_WAITING)]
                )
            )
            os.chmod(printable_path, stat.S_IRUSR | stat.S_IWUSR)
        except (OSError, Exception):  # noqa: BLE001 - a missing sheet is survivable
            pass
    return root


def matter_document(session):
    """What they told me, in their words and the contract's. ⛔ NEVER read back
    into a prompt, the header says so and this engine never does it."""
    parts = [MATTER_HEADER, "## What you have answered so far", ""]
    graph = session.graph
    answered = 0
    for entry in session.answers:
        node_id = entry.get("node")
        if node_id not in graph.nodes:
            continue  # an acknowledgement of an authored screen is not an answer
        node = graph.node(node_id)
        question = node.get("ask")
        if not question:
            continue
        if entry.get("step", 0) + 1 < graph.steps(node_id):
            continue
        parts.append(f"- {question}")
        parts.append(f"  You said: {entry.get('answer')}")
        answered += 1
    if answered == 0:
        parts.append("Nothing yet. This fills in as you answer.")
    parts.append("")
    parts.append(MATTER_FOOTER)
    return "\n".join(parts)


def plan_document(session):
    """The plan, as it will be shown. Derived, never hard-coded."""
    if session.node_id != PLAN_ID and not session.finished:
        return PLAN_PLACEHOLDER
    # ⛔ ALWAYS THE WHOLE PLAN, whatever the person is reading on screen. PLAN.md is
    # the record: if it were rendered from the current cursor it would hold one step,
    # and somebody who stopped after step two would have a file claiming that was the
    # plan. A25.
    return "# What to do, in order\n\n" + session.plan_screen(PLAN_WHOLE).text + "\n"


def closed_paths_document(session):
    """⛔ CLOSED PATHS AND REASONS ONLY. No narrative about the matter."""
    parts = [CLOSED_PATHS_HEADER, ""]
    closed = 0
    for node_id in session.record_nodes():
        if not session.is_closed(node_id):
            continue
        node = session.graph.node(node_id)
        parts.append(f"- {node.get('ask')}")
        # The SAME lines the question screen and the plan use, reused rather than
        # rewritten: three versions of one explanation is three things to drift,
        # and the drift already happened once. The instruction to go and get the
        # record was printed beside the ban on doing so, in all three places.
        for line in session.closed_path_lines(node_id):
            parts.append(f"  {line}")
        closed += 1
    if session.flags.get("plan_mode") == "preservation_only":
        parts.append(f"- {CLOSED_PATHS_NO_LAWYER}")
        closed += 1
    if closed == 0:
        parts.append(CLOSED_PATHS_NONE)
    parts.append("")
    return "\n".join(parts)


PRINTABLE_LEAD = (
    "Printed from your own case folder. Tick these off as you go. Not all of it "
    "will be possible, and that is expected — do what you can and tell your "
    "lawyer what you could not."
)

PRINTABLE_WAITING = (
    "You have not answered all the questions yet, so there is nothing to print. "
    "This page is rewritten every time you answer one."
)

PRINTABLE_TAIL = (
    "⛔ This sheet is a to-do list, not a statement of your case. It says nothing "
    "about whether any of these records help you, because that is your lawyer's "
    "to read and not this tool's. Hand it to them."
)


def printable_blocks(session):
    """A20: the ordered list, as blocks for the PDF writer. ⛔ ONE SOURCE.

    Built from `plan_items()`, the same call the plan screen and PLAN.md use, so
    the paper cannot say something the screen does not. A separate walk over the
    answers would be a second implementation of the plan, and the two would part
    company on the first amendment.

    ⚠️ HARM-FIRST SURVIVES THE MEDIUM. The contract's warning, the fence and the
    two-edged note are emitted here in the same order and the same size as the
    instruction, because a printed sheet is where the temptation to keep only the
    encouraging half is strongest, and a one-sided sheet is the one that gets
    handed over. RAIL 4.
    """
    blocks = [("title", "What to do, in order")]
    items = session.plan_items()
    if not items:
        blocks.append(("body", PRINTABLE_WAITING))
        return blocks
    blocks.append(("body", PRINTABLE_LEAD))
    blocks.append(("blank", ""))

    step = 0
    if session.flags.get("plan_mode") == "preservation_only":
        step += 1
        blocks.append(("item", f"{step}. Get a lawyer. Today."))
        blocks.append(("body", "Until you have one, keep everything and change nothing."))
        blocks.append(("blank", ""))

    for node_id, node, action in items:
        step += 1
        blocks.append(("item", f"{step}. {session.action_title(action)}"))
        blocks.append(("body", f"Because you said yes to: {node['ask']}"))
        if action is None:
            blocks.append(("body", COUNSEL_ONLY_LINE))
        else:
            blocks.append(("body", ACTION_LINES.get(action, ACTION_TITLE_UNKNOWN)))
        clock_line = CLOCK_LINES.get(node.get("clock"), CLOCK_UNKNOWN_LINE)
        if node.get("clock_flag") == "RED":
            clock_line = f"{clock_line} {CLOCK_RED_SUFFIX}"
        blocks.append(("body", clock_line))
        for extra in session.harm_first_notes(node_id, node, action, []):
            blocks.append(("body", extra))
        if action is not None:
            guide = LAYER_GUIDANCE.get(node.get("layer")) or {}
            search = session.search_phrase(node)
            if search:
                blocks.append(("body", f"Search for: {search}"))
            if guide.get("good"):
                blocks.append(("body", guide["good"]))
            where = session.drop_path(node)
            if where:
                blocks.append(("path", f"Put it here: {where}"))
        blocks.append(("blank", ""))

    blocks.append(("heading", "Before you hand this to anybody"))
    blocks.append(("body", PRINTABLE_TAIL))
    return blocks


def write_printable(session):
    """A20: the checklist as a PDF, or nothing at all. ⛔ Never a broken file.

    Returns the path written, or None. A failure here is deliberately quiet in the
    flow and loud in the self-check: everything on the sheet is also on the screen
    and in `PLAN.md`, so a person who cannot get the PDF has lost a convenience,
    not a record. ⛔ But a HALF-WRITTEN PDF is worse than none, so nothing is put on
    disk unless the whole document rendered.
    """
    root = session.workspace
    if root is None or PRINTABLE is None:
        return None
    try:
        data = PRINTABLE.render_pdf(printable_blocks(session))
    except Exception:  # noqa: BLE001 - a refusal or a bug, same outcome for them
        return None
    path = root / PRINTABLE_FILENAME
    if path.resolve().parent != root.resolve():
        raise Refusal(f"I will not write outside {root}. Refusing {path}.")
    path.write_bytes(data)
    try:
        os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass
    return path


def write_workspace_documents(session):
    """The three documents, rewritten on every answer so none of them is stale."""
    root = session.workspace
    if root is None:
        return []
    # A19. ⛔ BEFORE the documents, so the plan cannot name a folder that is not
    # there. The plan says "I have made that folder already", and a claim about the
    # filesystem has to be true at the moment it is written, not shortly after.
    session.make_drop_paths()
    written = []
    for name, body in (
        (MATTER_FILENAME, matter_document(session)),
        (PLAN_FILENAME, plan_document(session)),
        (CLOSED_PATHS_FILENAME, closed_paths_document(session)),
    ):
        path = root / name
        if path.resolve().parent != root.resolve():
            raise Refusal(f"I will not write outside {root}. Refusing {path}.")
        written.append(_write_private(path, body))
    # A20, last: it is derived from the same plan the documents above just used.
    printed = write_printable(session)
    if printed is not None:
        written.append(printed)
    return written


def pointer_path():
    """The one path the pointer may ever be written to. ⛔ Never from a caller."""
    try:
        home = Path.home()
    except (RuntimeError, OSError):
        return None
    return home / POINTER_DIRNAME / POINTER_FILENAME


def write_pointer(workspace):
    """⛔ OPT-IN. Nothing calls this unless the person answered yes on the screen
    that states the cost: a file listing your case folders is itself a record, on
    a device that may be examined."""
    path = pointer_path()
    if path is None:
        return None
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        os.chmod(path.parent, stat.S_IRWXU)
    except OSError:
        return None
    line = str(workspace)
    known = read_pointer()
    if line in known:
        return path
    try:
        return _write_private(path, "\n".join([*known, line]) + "\n")
    except OSError:
        return None


def read_pointer():
    """Whatever was opted into before, or nothing at all."""
    path = pointer_path()
    if path is None or not path.is_file():
        return []
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return []
    return [line.strip() for line in lines if line.strip()]


def default_folder_area():
    """The folder the engine's OWN suggestion sits in. Derived from the suggestion.

    Not a guess about where a person keeps files: it is the one place this engine
    itself proposed on screen, so a folder found there is one it may have created.
    """
    try:
        return Path(FOLDER_DEFAULT).expanduser().parent
    except (RuntimeError, OSError):
        return None


def offerable_case_folders():
    """Case folders this engine may OFFER, from the two places it may look.

    ⛔ OFFERED, NEVER OPENED. Nothing here resumes a session; the caller prints a
    ready-to-run line per candidate and the person chooses. The pointer screen
    promises the path is written down only so it can be "offered back", and
    silently picking one up would exceed that promise, and would pick up the
    wrong matter when someone has two.

    Two places, and neither is a search of the machine: the opt-in pointer file,
    and the immediate children of the folder this engine suggests by default.
    """
    found = []

    def consider(path):
        try:
            candidate = Path(path)
            if (candidate / STATE_FILENAME).is_file():
                text = str(candidate)
                if text not in found:
                    found.append(text)
        except (OSError, ValueError):
            pass

    for line in read_pointer():
        consider(line)
    area = default_folder_area()
    if area is not None:
        try:
            children = sorted(area.iterdir())
        except OSError:
            children = []
        for child in children:
            try:
                if child.is_dir():
                    consider(child)
            except OSError:
                continue
    return found


def _nothing_to_resume_message(command="screen", answer=None):
    """⛔ ASK, and hand over the exact line to run. Never "start again".

    Starting again answers everything twice, and a person who has been interrupted
    mid-flow is exactly who reaches this screen.

    🔴 THE WHOLE POINT IS THAT EVERY INSTRUCTION HERE IS ONE THE READER CAN
    CARRY OUT. The version this replaced said "tell me where your case folder is"
    and never said HOW, so a reader typed the path on its own, got the identical
    screen back, and believed answering the tool's own question had destroyed
    their folder. An instruction a person cannot act on is worse than silence,
    because it looks like they are the one failing.
    """
    lines = [
        "I could not find your case folder.",
        "",
        "🔴 Nothing has been deleted and nothing you told me is lost. Your folder "
        "is exactly where you told me to make it. I simply cannot see it from "
        "here, and I do not remember the path between runs.",
        "",
        f"  I looked in {Path.cwd()}",
        "  and in every folder that contains that one,",
        f"  for the small working note I keep inside your case folder, {STATE_FILENAME}.",
        "  The dot at the start of that name is why your computer normally hides "
        "it.",
        "",
        "Tell me where your case folder is and I will pick up where you left off. "
        "It has to go on the command, like this. Put your own path where it says "
        f"{FOLDER_SLOT}:",
        "",
        f"  {command_form(command, workspace=FOLDER_SLOT, tail=answer)}",
    ]

    known = offerable_case_folders()
    if known:
        lines.append("")
        lines.append(
            "I do know of a folder that has a walk-through in it. If it is yours, "
            "that whole line below is ready to run as it stands:"
            if len(known) == 1
            else "I know of more than one folder with a walk-through in it. I will "
            "not choose for you. If one of them is yours, that whole line is "
            "ready to run as it stands:"
        )
        for path in known:
            lines.append("")
            lines.append(f"  {command_form(command, workspace=path, tail=answer)}")
    else:
        lines.append("")
        lines.append(
            "I have not written the path down anywhere. I only do that if you ask "
            "me to."
        )

    lines.append("")
    lines.append(
        "Do not start from the beginning unless you mean to. Starting again "
        "deletes nothing, but you would answer every question twice."
    )
    return "\n".join(lines)


def state_path(workspace):
    path = (workspace / STATE_FILENAME).resolve()
    # Containment: one file, in the confirmed folder, and nowhere else.
    if path.parent != workspace.resolve():
        raise Refusal(
            f"I will not write outside {workspace}. Refusing {path}."
        )
    return path


def find_state(start=None):
    """CWD, then up through the parents. Resumability, deliberately cheap."""
    here = Path(start or Path.cwd()).resolve()
    for candidate in [here, *here.parents]:
        path = candidate / STATE_FILENAME
        if path.is_file():
            return path
    return None


def read_state(path, graph, digest):
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except ValueError as exc:
        raise Refusal(f"I cannot resume: {path} is not readable JSON: {exc}")
    return Session.from_state(graph, digest, data)


def write_state(path, session):
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(path.parent, stat.S_IRWXU)
    except OSError:
        pass  # a filesystem that cannot hold the mode is not a reason to stop
    text = json.dumps(session.to_state(), indent=2, ensure_ascii=False) + "\n"
    path.write_text(text, encoding="utf-8")
    try:
        os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass
    return path


# ═══════════════════════════════════════════════════════════════════════════════
# Commands
# ═══════════════════════════════════════════════════════════════════════════════


def _discard_stale_note(path):
    """Remove a state file this engine wrote, and nothing else, ever.

    Used once: the working note kept before the person had chosen a folder is
    deleted after its content has been written into that folder. Leaving it is
    worse than removing it. It is a second copy of their answers outside the
    only folder they were told about, and `find_state` looks in the current
    directory FIRST, so the stale copy would win every later resume.

    ⛔ It parses the file and requires this engine's own schema key before
    unlinking. A file that is not one of ours is left exactly where it is.
    """
    try:
        if not path.is_file():
            return False
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return False
    if not isinstance(data, dict) or data.get("schema") != STATE_SCHEMA:
        return False
    try:
        path.unlink()
    except OSError:
        return False
    return True


def _persist(session, current_path):
    """Write the state, in the folder the person confirmed once there is one."""
    if session.workspace is None:
        write_state(current_path, session)
        return current_path

    create_workspace(session.workspace)
    if session.pointer:
        write_pointer(session.workspace)
    target = state_path(session.workspace)
    write_state(target, session)
    write_workspace_documents(session)
    if target != current_path:
        # Written first, discarded second. The other order loses the answers if
        # the write fails.
        _discard_stale_note(current_path)
    return target


def _session_for(args, create):
    tree, digest = load_contract()
    graph = Graph(tree)

    found = None if args.workspace else find_state()
    if found is not None:
        workspace = resolve_workspace(str(found.parent))
        session = read_state(found, graph, digest)
        if session.workspace is not None:
            # The folder it is found in is the folder, whatever the file records.
            # A person may move or rename their own case folder, and the recorded
            # path would then point somewhere that is not theirs any more.
            session.workspace = workspace
        return graph, digest, session, state_path(workspace)

    workspace = resolve_workspace(args.workspace)
    path = state_path(workspace)
    if path.is_file():
        return graph, digest, read_state(path, graph, digest), path
    if not create:
        # A12, the recovery line is the command they were ACTUALLY running, with
        # the missing option in it. A generic example would leave them working out
        # how to graft it on, which is the step that failed for a real reader.
        raise Refusal(
            _nothing_to_resume_message(
                command=getattr(args, "command", None) or "screen",
                answer=getattr(args, "answer", None),
            ),
            code=EXIT_NO_STATE,
        )
    return graph, digest, Session(graph, digest), path


def cmd_begin(args):
    graph, digest, session, path = _session_for(args, create=True)
    _persist(session, path)
    sys.stdout.write(session.screen().render())
    return EXIT_OK


def closing_screen(session):
    """A25: the short acknowledgement after the last plan screen.

    ⛔ It repeats none of the plan. Everything is in the folder and in the printable
    sheet, both named here, and the two lines worth running are built by the same
    command block every plan screen carries.
    """
    lines = [
        "That is everything I can give you.",
        "",
        "Nothing here needs this window. It is all in your folder, and the sheet is "
        "there to print or carry.",
        "",
        f"  Your folder      {session.workspace}",
        f"  {PRINTABLE_FILENAME:<16} the whole list, on one sheet",
        f"  {PLAN_FILENAME:<16} the same list as text",
        "",
        "Go and do what you can. An errand you tried and could not finish is worth "
        "telling your lawyer about, including what happened when you tried.",
    ]
    return Screen(PLAN_ID, 0, "notice", lines, [], [], authored=True)


def cmd_screen(args):
    graph, digest, session, path = _session_for(args, create=False)
    # A25: once the walk is done, `screen` is how somebody reads their plan back, and
    # what they want is the WHOLE thing -- not whichever closing screen the cursor
    # happens to be parked on. The plan's own footer tells them to run this line to
    # read it again, so it has to answer that promise.
    if session.finished and session.node_id == PLAN_ID:
        sys.stdout.write(session.screen(PLAN_WHOLE).render())
        return EXIT_OK
    sys.stdout.write(session.screen().render())
    return EXIT_OK


def cmd_answer(args):
    graph, digest, session, path = _session_for(args, create=False)
    session.accept(args.answer)
    _persist(session, path)
    # 🔴 A25: ACKNOWLEDGING THE LAST SCREEN DOES NOT REPRINT IT.
    #
    # It used to. The plan was one screen, answering it set `finished`, and this line
    # then rendered the same screen again with the counter bumped -- so a reader saw
    # 239 lines twice and "last one" printed at 35 and again at 36. Splitting the plan
    # into steps did not fix that on its own; it just moved it to the final screen,
    # where it reprinted 122 lines instead.
    if session.finished and session.node_id == PLAN_ID:
        sys.stdout.write(closing_screen(session).render())
        return EXIT_OK
    sys.stdout.write(session.screen().render())
    return EXIT_OK


def cmd_state(args):
    graph, digest, session, path = _session_for(args, create=False)
    sys.stdout.write(f"{path}\n")
    sys.stdout.write(json.dumps(session.to_state(), indent=2, ensure_ascii=False) + "\n")
    return EXIT_OK


# ═══════════════════════════════════════════════════════════════════════════════
# A21: `collected`. THE COMMAND THEY RUN WHEN THEY COME BACK.
#
# A reader asked for exactly this: once they have done what was possible — *"not
# mandatory to do all as sometimes its not possible"* — they open a new terminal,
# run one command, and it checks everything landed where it should before going on.
#
# ⛔ IT IS NOT A TWELFTH SKILL COMMAND. `SKILL.md` states eleven, and a twelfth
# needs a method document, a rail-matrix row and a wave. This is a subcommand of the
# engine, reached by a line the plan already prints.
#
# 🔴 THREE OUTCOMES, NEVER TWO. A folder with a file in it, a folder with nothing in
# it yet, and a folder this engine could not read. The third is the one that gets
# collapsed into the second by anybody in a hurry, and collapsing it is the worse
# error by far: it reports an absence that was never established, to somebody
# deciding whether they still have work to do. AGENTS.md §3.
#
# ⛔ AND IT SAYS NOTHING ABOUT WHETHER ANY OF IT HELPS THEM. It counts folders, not
# evidence. No total across records, no ranking, no ratio, and no assessment — a
# lawyer decides meaning. RAIL 3.
#
# ⛔ The step after this is `freeze`. A reader guessed it would be an explanation of
# the charges; that is a legal answer, zero packs are reviewed, and it is not on
# offer here or anywhere else in this tool.
# ═══════════════════════════════════════════════════════════════════════════════

COLLECTED_NOT_A_SCORE = (
    "⛔ That is a count of folders with something in them. It is not a score and "
    "not a mark out of anything, and it says nothing at all about whether any of "
    "it helps you. Your lawyer reads it. I do not."
)

COLLECTED_NOTHING_EXPECTED = (
    "You have no records on your list with a folder of their own, so there is "
    "nothing for me to look for. That is not a problem. Take the list to your "
    "lawyer."
)

COLLECTED_PARTIAL = (
    "An empty folder is not a failure. Some of these are genuinely not available "
    "to you, and one you could not get is worth telling your lawyer about — say "
    "which, and what happened when you tried."
)

COLLECTED_NEXT = (
    "When you have put in what you can, the next step is to seal what is there so "
    "a later change to it can be shown. One source at a time, and the original is "
    "never touched:"
)

# 🔴 SAID HERE BECAUSE THIS SCREEN HANDS OVER A COMMAND THAT REFUSES ON PURPOSE THE
# FIRST TIME IT IS RUN, and for the whole life of this screen it did not mention
# that. Somebody who followed the last instruction in the flow got a refusal and no
# reason to think it was anything but the tool being broken at the final step.
#
# ⛔ THE CHECK'S OWN COMMAND IS NOT REPEATED HERE. The refusal prints it, and this
# file cannot import the program that owns it — that program imports this one. Two
# hand-written copies of one command line is the drift this project keeps paying
# for, so the one copy lives with the refusal and this only says to expect it.
COLLECTED_CHECK_FIRST = (
    "The first time you run that it will stop and hand you one more line to run "
    "before it, a check on what reading the file would write. ⛔ That is the order "
    "working rather than a fault: nothing gets read until that check has an answer, "
    "and it asks you two things about your own situation that I am not going to "
    "answer on your behalf."
)


def collected_targets(session):
    """A21: `[(node_id, node, folder)]` the plan gave this person a folder for.

    ⛔ THROUGH `plan_items`, so a record their own answer closed is absent here for
    the same reason it is absent from the plan. A second walk over the answers would
    be a second implementation of that filter, and the first thing it would get
    wrong is the closed conversation — which is how a folder for a record somebody
    must not open ends up on a checklist.
    """
    wanted = []
    for node_id, node, action in session.plan_items():
        if action is None:
            continue
        folder = (LAYER_GUIDANCE.get(node.get("layer")) or {}).get("folder")
        if folder:
            wanted.append((node_id, node, folder))
    return wanted


def collected_rows(session, wanted):
    """A21: `(rows, present, empty, unreadable)` for the folders the plan named.

    🔴 SEPARATED FROM THE PRINTING SO IT CAN BE TESTED WITHOUT ONE. The property
    worth proving is that an unreadable folder is counted apart from an empty one,
    and it cannot be proved by reading the code — it needs a folder that genuinely
    will not open. The self-check makes one and calls this.
    """
    root = session.workspace
    rows, present, empty, unreadable = [], [], [], []
    for _node_id, node, folder in wanted:
        target = root / DROP_ROOT / folder
        try:
            # ⚠️ Listed rather than merely stat-ed: a folder that exists and cannot
            # be opened is the case that matters, and `exists()` answers True for it.
            entries = [e for e in target.iterdir() if not e.name.startswith(".")]
        except OSError as exc:
            # ⛔ NOT "empty". Nothing was established about what is in there, and
            # reporting an absence that was never established is the worse error:
            # somebody decides they are finished on the strength of it.
            unreadable.append(folder)
            rows.append(("?", folder, f"could not read it: {exc.strerror or exc}"))
            continue
        if entries:
            present.append(folder)
            how_many = len(entries)
            rows.append(
                ("x", folder, f"{how_many} file{'' if how_many == 1 else 's'} in it")
            )
        else:
            empty.append(folder)
            note = "nothing in it yet"
            search = session.search_phrase(node)
            if search:
                note += f" — search for: {search}"
            rows.append((" ", folder, note))
    return rows, present, empty, unreadable


def cmd_collected(args):
    """A21: what actually landed in the folders the plan named."""
    graph, digest, session, path = _session_for(args, create=False)
    root = session.workspace
    if root is None:
        raise Refusal(
            "I do not know where your case folder is, so I cannot look in it.\n"
            "Put it on the command, like this:\n"
            f"  {command_form('collected', workspace='YOUR-FOLDER')}"
        )

    wanted = collected_targets(session)
    out = ["", RULE, "", "What I can see in your case folder", f"  {root}", ""]
    if not wanted:
        out.append(COLLECTED_NOTHING_EXPECTED)
        out.append("")
        sys.stdout.write("\n".join(out) + "\n")
        return EXIT_OK

    rows, present, empty, unreadable = collected_rows(session, wanted)
    width = max(len(folder) for _mark, folder, _note in rows)
    for mark, folder, note in rows:
        out.append(f"  [{mark}] {folder.ljust(width)}  {note}")
    out.extend(
        [
            "",
            f"  something in it     {len(present)}",
            f"  nothing in it yet   {len(empty)}",
            f"  could not be read   {len(unreadable)}",
            "",
            COLLECTED_NOT_A_SCORE,
        ]
    )
    if unreadable:
        out.extend(
            [
                "",
                "⚠️ I could not read one or more of those folders, so I am not "
                "telling you they are empty. I do not know what is in them.",
            ]
        )
    if empty:
        out.extend(["", COLLECTED_PARTIAL])
    if present:
        out.extend(
            [
                "",
                RULE,
                "",
                COLLECTED_NEXT,
                "",
                # ⛔ The sibling program's own path, derived from this file's, never
                # a name typed twice. `freeze` owns its own arguments and its own
                # refusals; this only says which line to run next.
                "  "
                + " ".join(
                    [
                        shlex.quote(interpreter()),
                        shlex.quote(str(HERE.parent / "freeze.py")),
                        "THE-FILE",
                        "--into",
                        shlex.quote(str(root)),
                    ]
                ),
                "",
                COLLECTED_CHECK_FIRST,
            ]
        )
    out.append("")
    sys.stdout.write("\n".join(out) + "\n")
    return EXIT_OK


def cmd_verify(args):
    tree, digest = load_contract()
    graph = Graph(tree)
    sys.stdout.write(
        f"contract   {CONTRACT_JSON}\n"
        f"digest     {digest}  (matches {CONTRACT_SHA.name})\n"
        f"nodes      {len(graph.order)} in {len(graph.node_phases)} phases\n"
        f"screens    {sum(graph.steps(n) for n in graph.order)} from those nodes\n"
    )
    return EXIT_OK


def drive(answers):
    """Replay a whole answer sequence with NO state file. The test surface.

    Stateless on purpose: a route or coverage test that had to create a folder
    per path would be slow enough that someone would trim the enumeration.

    ⚠️ THE FOLDER SCREENS ARE NOT SHOWN HERE, and that is the honest consequence
    of being stateless: there is no folder to ask about. Nothing is skipped for
    convenience, the question `A10` inserts exists to give the answers a place
    on disk, and this surface has no disk. The folder screens are exercised
    through the real commands instead, where they create something, which is the
    only place the assertion means anything.
    """
    tree, digest = load_contract()
    graph = Graph(tree)
    session = Session(graph, digest, ask_folder=False)
    screens = []
    route = []
    rejected = None
    consumed = 0

    while True:
        # A25: at the plan this surface emits the WHOLE plan, not the step the cursor is
        # parked on. ⛔ It exists so route, coverage, verbatim and rail checks can read
        # what the plan contains; handing them the opening screen would leave every one
        # of them asserting something true of a summary and silent about the rest --
        # which is the failure mode this project keeps rediscovering, a green that
        # scanned less than it claimed.
        if session.node_id == PLAN_ID and not session.finished:
            screen = session.screen(PLAN_WHOLE)
        else:
            screen = session.screen()
        screens.append(screen)
        if not route or route[-1] != screen.node_id:
            route.append(screen.node_id)
        if session.finished or consumed >= len(answers):
            break
        answer = answers[consumed]
        consumed += 1
        try:
            session.accept(answer)
        except Refusal as exc:
            rejected = {
                "at": session.node_id,
                "step": session.step,
                "answer": answer,
                "options": session.options_here(),
                "message": str(exc),
            }
            break

    return {
        "contract_digest": digest,
        "route": route,
        "screens": [s.as_dict() for s in screens],
        "consumed": consumed,
        "rejected": rejected,
        "finished": session.finished,
        "parked_on": session.node_id,
        "parked_step": session.step,
        "flags": session.flags,
        "records_you_said_yes_to": session.selected,
        "records_you_said_no_to": session.declined,
    }


def cmd_drive(args):
    result = drive(args.answer or [])
    if args.json:
        sys.stdout.write(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    else:
        for screen in result["screens"]:
            sys.stdout.write(screen["rendered"])
        if result["rejected"]:
            sys.stdout.write(result["rejected"]["message"] + "\n")
    return EXIT_REJECTED if result["rejected"] else EXIT_OK


# ═══════════════════════════════════════════════════════════════════════════════
# --selftest. Enough to prove the engine, offline, with no test runner.
# ═══════════════════════════════════════════════════════════════════════════════


def enumerate_routes(graph):
    """Every routing-distinct path, by graph walk. Never by example.

    At each node, try every accepted answer and keep one per DISTINCT successor.
    Answers that route identically are the same route, so the eleven per-record
    questions do not multiply into thousands of paths, and no branch is lost.
    """
    routes = []

    def walk(node_id, answers, seen):
        if node_id == PLAN_ID:
            routes.append(list(answers))
            return
        if node_id in seen:  # a contract cycle is a defect, not a path
            routes.append(list(answers))
            return
        steps = graph.steps(node_id)
        for _ in range(steps - 1):
            answers.append(ANSWER_SET_ACK[0])
        options = graph.options(node_id)
        chosen = {}
        for option in options:
            target, _ = graph.edge(node_id, option)
            chosen.setdefault(target, option)
        for target, option in chosen.items():
            walk(target, answers + [option], seen | {node_id})
        for _ in range(steps - 1):
            answers.pop()

    walk(graph.first, [], frozenset())
    return routes


def route_answers(route):
    """The answer list `drive` needs for a route that starts at the first
    contract node: one acknowledgement for the privacy screen, then the route."""
    return [ANSWER_SET_ACK[0], *route]


def _banned_in(text):
    low = text.lower()
    hits = [word for word in BANNED_IN_SCREENS if word in low]
    if RAIL_NUMBER.search(text):
        hits.append("a rail number")
    return hits


def _allegation_words_in(text):
    """Words naming a KIND of accusation. Prefixes, so "abuse" catches "abusive"."""
    return [
        word
        for word in ALLEGATION_WORDS
        if re.search(r"\b" + re.escape(word), text, re.IGNORECASE)
    ]


def authored_screen_strings():
    """Every string this engine authors and may put in front of a person.

    🔴 COLLECTED IN ONE PLACE so a new line cannot escape a check by being
    declared somewhere the check does not look. The fences are excluded and
    checked separately, see `FENCE_DISCLAIMER`.
    """
    pieces = []
    for mapping in (ACTION_TITLES, ACTION_LINES, LIMIT_LINES, CLOCK_LINES):
        pieces.extend(mapping.values())
    # A19. ⛔ Every string here reaches a screen and a file on the person's disk,
    # including the FOLDER NAMES — a folder listing is a screen, which is what cost
    # this project two directory renames. So they go through the same word checks.
    for guide in LAYER_GUIDANCE.values():
        pieces.extend(value for value in guide.values() if isinstance(value, str))
    for group in (
        SCREEN_ZERO_LINES,
        UNREVIEWED_WORDING_LINES,
        CLOSED_PATH_LINES,
        FOLDER_ASK_LINES,
        FOLDER_NOT_A_BOUNDARY_LINES,
        FOLDER_CONTENTS_LINES,
        POINTER_KEPT_TAIL,
        POINTER_WITHHELD_LINES,
        (POINTER_KEPT_ECHO,),
        # A18. ⛔ Collected here or it escapes every copy check in this file, which
        # is exactly what this function's own docstring warns about.
        *EXCLUSION_ADDENDA.values(),
    ):
        pieces.extend(group)
    pieces.extend(
        [
            LIMIT_UNKNOWN,
            CLOCK_UNKNOWN_LINE,
            CLOCK_RED_SUFFIX,
            CLOCK_DISCLAIMER,
            ACTION_TITLE_UNKNOWN,
            COUNSEL_ONLY_TITLE,
            COUNSEL_ONLY_LINE,
            COUNSEL_ONLY_HEADING,
            DOUBLE_EDGED_LINE,
            UNREVIEWED_WORDING_BRIEF,
            # A20. Printed on paper is still read by the person, so the same word
            # checks apply. Everything else on the sheet is already collected here.
            PRINTABLE_LEAD,
            PRINTABLE_WAITING,
            PRINTABLE_TAIL,
            CLOSED_PATH_REPLACEMENT,
            CLOSED_PATH_NOTHING_LEFT,
            MATTER_HEADER,
            MATTER_FOOTER,
            PLAN_PLACEHOLDER,
            CLOSED_PATHS_HEADER,
            CLOSED_PATHS_NONE,
            CLOSED_PATHS_NO_LAWYER,
            GITIGNORE_TEXT,
            # 🔴 THESE TWO ESCAPED EVERY COPY CHECK IN THIS FILE. Both are written
            # into the person's own folder and read by them there, and neither was
            # collected here — so an outcome promise or a word about a kind of
            # accusation could have shipped in either one and no check would have
            # seen it. A file on their disk is a screen; this function's own
            # docstring says so two dozen lines up.
            RECOLLECTION_TEXT,
            NOTES_TEXT,
            # 🔴 AND THESE FOUR ESCAPED IT TOO, found the same way: by asking what
            # was NOT in this list rather than by any check firing. They are the
            # last thing a person reads in the whole flow — the screen after they
            # come back from the errands — and until now an outcome promise or a
            # word about a kind of accusation could have shipped in any of them.
            COLLECTED_NOT_A_SCORE,
            COLLECTED_NOTHING_EXPECTED,
            COLLECTED_PARTIAL,
            COLLECTED_NEXT,
            COLLECTED_CHECK_FIRST,
        ]
    )
    return [piece for piece in pieces if isinstance(piece, str) and piece.strip()]


def selftest():
    """A22: run every check with HOME pointed at a scratch directory.

    🔴 THE POINTER IS ON BY DEFAULT NOW, and the moment it became so, `--selftest`
    started writing case-folder paths into the real home folder of whoever ran it —
    six temporary paths on the first run, found by looking rather than by any check
    firing. A self-check that leaves an artifact on the machine it is checking is a
    defect in the check, and this one left the exact class of artifact the pointer
    screen exists to warn a person about.

    ⛔ SO HOME IS REDIRECTED FOR THE WHOLE RUN, and the real pointer file is
    asserted untouched afterwards rather than assumed. One block already redirected
    HOME for itself; that covered the only block that had thought to ask, which is
    how this went unnoticed until the default changed underneath it.
    """
    real_pointer = pointer_path()
    before = (
        real_pointer.read_bytes()
        if real_pointer is not None and real_pointer.exists()
        else None
    )
    home = Path(tempfile.mkdtemp(prefix="mw-selftest-home-"))
    saved_home = os.environ.get("HOME")
    os.environ["HOME"] = str(home)
    try:
        code = _selftest_body()
    finally:
        if saved_home is None:
            os.environ.pop("HOME", None)
        else:
            os.environ["HOME"] = saved_home
        shutil.rmtree(home, ignore_errors=True)

    after = (
        real_pointer.read_bytes()
        if real_pointer is not None and real_pointer.exists()
        else None
    )
    if after != before:
        sys.stdout.write(
            "\nselftest: 1 FAILURE(S)\n"
            f"  \u2716 the run changed {real_pointer}, which is outside its own "
            "scratch tree. A self-check that leaves an artifact on the machine it "
            "is checking is a defect in the check.\n"
        )
        return 1
    return code


def _selftest_body():
    failures = []
    notes = []

    def check(condition, message):
        if not condition:
            failures.append(message)

    # 1: no build placeholder survived into this file. The needle is assembled
    #     at runtime so this check is not itself the thing it looks for.
    source = HERE.read_text(encoding="utf-8")
    needle = "{" + "{"
    check(
        needle not in source,
        "this file contains a build placeholder; the build copies .py verbatim",
    )

    # 2: the contract loads and verifies.
    tree, digest = load_contract()
    graph = Graph(tree)
    check(len(digest) == 64, "the contract digest is not a sha256")

    # 3: every route, and every node rendered on at least one of them.
    routes = enumerate_routes(graph)
    check(len(routes) > 0, "route enumeration produced nothing. The walk is broken")
    rendered_nodes = set()
    rendered_items = set()
    screens_seen = 0
    for answers in routes:
        result = drive(route_answers(answers))
        check(
            result["rejected"] is None,
            f"a route the graph itself produced was rejected: {result['rejected']}",
        )
        check(result["parked_on"] == PLAN_ID, f"route {answers} did not reach the plan")
        for screen in result["screens"]:
            screens_seen += 1
            rendered_nodes.add(screen["node"])
            hits = _banned_in(screen["text"])
            check(
                not hits,
                f"{screen['node']} step {screen['step']} shows {hits} to a person",
            )
            # …and the SCAFFOLDING too, not only the body. The option list, the
            # NEXT line and the printed command are all things a person reads,
            # and a check that only reads `text` cannot see any of them. The two
            # real paths are removed first: they are the only part of a screen the
            # engine does not author, see `unauthored_in`.
            around = _banned_in(unauthored_in(screen["rendered"]))
            check(
                not around,
                f"{screen['node']} step {screen['step']} shows {around} in the "
                "part of the screen around the question",
            )
            for entry in screen["verbatim"]:
                check(
                    entry["value"] in screen["text"]
                    or entry["field"] == "options"
                    or entry["value"].rstrip("\n") in screen["text"],
                    f"{screen['node']}.{entry['field']} is not rendered verbatim",
                )
        # the exclusion items, counted from the contract
        for node_id in graph.order:
            if graph.kind(node_id) != "exclusions":
                continue
            joined = "\n".join(
                s["text"] for s in result["screens"] if s["node"] == node_id
            )
            for item in graph.items_of(node_id):
                if item["text"] in joined:
                    rendered_items.add(item["id"])

    missing = [n for n in graph.order if n not in rendered_nodes]
    check(not missing, f"nodes never rendered on any route: {missing}")
    all_items = [
        item["id"]
        for node_id in graph.order
        if graph.kind(node_id) == "exclusions"
        for item in graph.items_of(node_id)
    ]
    missing_items = [i for i in all_items if i not in rendered_items]
    check(not missing_items, f"exclusions never shown: {missing_items}")

    # 3b, A3. Every exclusion the contract holds sits on exactly one screen, each
    #      screen carries its heading, and (the part that matters) THE CHECK THAT
    #      SAYS SO IS KNOWN TO FIRE. A completeness check nobody has seen fail is
    #      indistinguishable from no check at all.
    placement = exclusion_placement()
    check(
        sorted(placement) == sorted(all_items),
        "the exclusion grouping and the contract disagree: on a screen but not in "
        f"the contract {sorted(set(placement) - set(all_items))}, in the contract "
        f"but on no screen {sorted(set(all_items) - set(placement))}",
    )
    one_walk = drive(route_answers(routes[0]))
    for node_id in graph.order:
        if graph.kind(node_id) != "exclusions":
            continue
        grouped = graph.exclusion_screens(node_id)
        check(
            sum(len(items) for _heading, items in grouped)
            == len(graph.items_of(node_id)),
            f"{node_id}'s screens show fewer items than the contract holds",
        )
        headings = [heading for heading, _items in grouped]
        check(
            len(set(headings)) == len(headings),
            f"{node_id} shows the same heading on two screens: {headings}",
        )
        shown_here = [s["text"] for s in one_walk["screens"] if s["node"] == node_id]
        check(
            len(shown_here) == len(grouped),
            f"{node_id} rendered {len(shown_here)} screen(s) for {len(grouped)} group(s)",
        )
        for heading, body in zip(headings, shown_here):
            check(
                heading in body,
                f"{node_id} never printed the heading {heading!r} to the person",
            )

    # …and now plant a violation in each direction and require a refusal.
    for mutate, what, needle in (
        (
            lambda items: [*items, {"id": "X_NOT_PLACED", "text": "planted."}],
            "an exclusion the grouping does not place",
            "X_NOT_PLACED",
        ),
        (
            lambda items: items[:-1],
            "a grouping entry the contract no longer has",
            all_items[-1],
        ),
    ):
        planted = json.loads(json.dumps(tree))
        touched = False
        for phase in planted:
            if not phase.startswith("phase_") or not isinstance(planted[phase], list):
                continue
            for node in planted[phase]:
                if isinstance(node, dict) and node.get("type") == "hard_exclusions":
                    node["items"] = mutate(node["items"])
                    touched = True
        check(touched, "could not plant a violation: no exclusion node was found")
        try:
            Graph(planted)
            failures.append(f"{what} was accepted. The completeness check is dead")
        except Refusal as exc:
            check(
                needle in str(exc),
                f"the refusal for {what} does not name {needle}: {str(exc).splitlines()[0]}",
            )
            check(
                not _banned_in(str(exc)),
                f"the refusal for {what} shows {_banned_in(str(exc))} to a person",
            )

    # 4, the first screen comes before the first contract node, and the hazard
    #     gate is first among contract nodes.
    plain = drive([])
    check(plain["route"][0] == SCREEN_ZERO_ID, "the privacy screen is not first")
    first_walk = drive([ANSWER_SET_ACK[0]])
    check(
        first_walk["route"][1] == graph.first,
        f"the first contract node shown is {first_walk['route'][1]}, not {graph.first}",
    )

    # 5, an answer outside the list is rejected, not interpreted.
    for bad in ("maybe", "y", "yes please", "", "YES!"):
        probe = drive([ANSWER_SET_ACK[0], bad])
        if bad == "":
            check(probe["rejected"] is not None, "an empty answer was accepted")
        else:
            check(
                probe["rejected"] is not None,
                f"the engine interpreted {bad!r} instead of rejecting it",
            )
    # ⛔ THE OPTION IS READ OUT OF THE CONTRACT, NOT TYPED. This check used to send a
    # literal "YES", which worked only for as long as the first contract node happened
    # to accept that word. An amendment that put a stage question first therefore broke
    # a check about case normalisation, which has nothing to do with what the first
    # question is — a prose copy of a contract value, exactly the defect this file
    # spends most of its comments warning about.
    listed = graph.options(graph.first)[0]
    good = drive([ANSWER_SET_ACK[0], listed.upper()])
    check(
        good["rejected"] is None,
        f"case normalisation of a listed option broke on {listed.upper()!r}",
    )

    # 6, the fail-safe sets, read from the contract, asserted by behaviour.
    # H5 is here for the same reason the other three are: not knowing whether a device
    # of yours may be looked at is not the same as knowing it will not be, and the
    # flag decides whether this tool writes the folder's location down at all.
    fail_safe = {
        "H1": "conditions_assumed",
        "H2": "no_contact",
        "H5": "device_exposed",
        "O1": "obligations_assumed",
    }
    for node_id, flag in fail_safe.items():
        node = graph.nodes.get(node_id)
        check(node is not None, f"the contract no longer has {node_id}")
        if node is None:
            continue
        entry = (node.get("branch") or {}).get("unsure") or {}
        check(
            (entry.get("set") or {}).get(flag) is True,
            f"{node_id}.branch.unsure no longer sets {flag}. Fail-safe is gone",
        )

    # H1 unsure -> H2, H1 no -> H3, O1 no skips to O5. All from the contract.
    check(graph.edge("H1", "unsure")[0] == "H2", "H1 unsure no longer goes to H2")
    check(graph.edge("H1", "no")[0] == "H3", "H1 no no longer goes straight to H3")
    check(graph.edge("O1", "no")[0] == "O5", "O1 no no longer skips to O5")

    # 7: H4 = no gives preservation_only, and a demand is not offered.
    walked = _walk_to_plan(graph, {"H4": "no"})
    check(
        walked["flags"].get("plan_mode") == "preservation_only",
        "H4 = no did not produce preservation_only",
    )
    plan_text = walked["screens"][-1]["text"]
    check("Get a lawyer. Today." in plan_text, "no-lawyer plan does not start with counsel")
    check(
        ACTION_LINES["preservation_demand"] not in plan_text,
        "a demand action was offered with no lawyer engaged",
    )
    with_counsel = _walk_to_plan(graph, {"H4": "yes"})
    check(
        with_counsel["flags"].get("plan_mode") == "full",
        "H4 = yes did not produce full mode",
    )

    # 7b, A13. THE ACTION LIST IS A LIST OF ACTIONS, AND SAYS EACH THING ONCE.
    #
    #      A reader's summary of the whole output was "my action list is a list of
    #      the questions it asked me", and one item read "Do this" with nothing to
    #      point "this" at.
    titles = {*ACTION_TITLES.values(), COUNSEL_ONLY_TITLE, ACTION_TITLE_UNKNOWN}
    asks = {graph.node(n).get("ask") for n in graph.order if graph.node(n).get("ask")}
    for mode in ("no", "yes"):
        walk = _walk_to_plan(graph, {"H4": mode})
        text = walk["screens"][-1]["text"]
        numbered = re.findall(r"^\s*\d+\.\s+(.*)$", text, re.MULTILINE)
        check(bool(numbered), f"the plan in mode {mode!r} has no numbered steps at all")
        for line in numbered:
            check(
                line not in asks,
                f"a numbered step is titled with the question that produced it: {line!r}",
            )
            check(
                line in titles or line == "Get a lawyer. Today.",
                f"a numbered step is titled with something that is not an "
                f"instruction: {line!r}",
            )
        # …and every item still names the answer that put it there, in the
        #    contract's own words, so a person can tell where it came from.
        closed_here = set(NO_CONTACT_CLOSES) if walk["flags"].get("no_contact") else set()
        for node_id in walk["selected"]:
            if node_id in closed_here:
                continue
            ask = graph.node(node_id).get("ask")
            check(
                f"Because you said yes to: {ask}" in text,
                f"the plan does not say which of their answers put {node_id} on the list",
            )
        check(
            text.count("Get a lawyer. Today.") <= 1,
            "the plan tells the person to get a lawyer more than once, in a list "
            "presented as an order of operations",
        )
        check(
            "IS the action" not in text,
            "the plan still carries the line that duplicated the lawyer step",
        )

    # 7c, A14. ⛔ A CLOSED PATH IS NEVER PRINTED BESIDE THE WAY TO WALK IT.
    #
    #      Every place a closed record is described has to agree, because the
    #      contradiction appeared three times: the question screen, the plan, and
    #      the closed-paths file. All three go through one function now, and this
    #      checks the OUTPUT of all three rather than the function.
    for node_id in NO_CONTACT_CLOSES:
        note = graph.node(node_id).get("warning") or ""
        check(bool(note), f"{node_id} carries no note, so this check proves nothing")
        forbids = prohibitions_in(note)
        check(
            bool(forbids),
            f"{node_id}'s note has no sentence that forbids anything, so the "
            "closed treatment would withhold all of it, which is the fail-safe "
            "direction, but the contract has changed and this needs a look",
        )
        instructing = [s for s in SENTENCE_BREAK.split(note.strip()) if s.strip() not in forbids]
        check(
            bool(instructing),
            f"{node_id}'s note is all prohibition, so nothing is being withheld "
            "and this check cannot fail",
        )

        closed_walk = _walk_to_plan(graph, {"H2": "yes"})
        check(
            closed_walk["flags"].get("no_contact") is True,
            "answering yes to the no-contact question no longer closes anything",
        )
        question = [s for s in closed_walk["screens"] if s["node"] == node_id]
        check(bool(question), f"{node_id} was never rendered on the closed walk")
        surfaces = {
            f"the {node_id} screen": "\n".join(s["text"] for s in question),
            "the plan": closed_walk["screens"][-1]["text"],
        }
        for where, text in surfaces.items():
            for sentence in instructing:
                check(
                    sentence.strip() not in text,
                    f"{where} still tells the person to go and get a record their "
                    f"own answer closed: {sentence.strip()!r}",
                )
            for sentence in forbids:
                check(
                    sentence in text,
                    f"{where} dropped the part of the note that forbids: {sentence!r}",
                )
            check(
                CLOSED_PATH_LINES[0] in text,
                f"{where} does not say why the path is off the list",
            )

        # 🔴 A19, AND THE HOW-TO IS WITHHELD BY THE SAME ANSWER. This is the check
        # most likely to be lost by a careless edit, because nothing in the drop-path
        # code mentions no-contact at all: the guidance is only reachable through
        # `plan_items`, which drops a closed record before it ever gets there. That
        # makes the safety property INCIDENTAL to a filter somewhere else, so it is
        # asserted here rather than trusted. A search phrase and a folder for a
        # conversation somebody has been told not to open is the precise
        # contradiction the withholding machinery exists to remove — arriving by a
        # different route, and looking helpful on the way in.
        closed_guide = LAYER_GUIDANCE.get(graph.node(node_id).get("layer")) or {}
        check(
            bool(closed_guide.get("search") or closed_guide.get("folder")),
            f"{node_id} has no search phrase and no folder, so this check proves "
            "nothing. It exists to show that BOTH are withheld when the path closes",
        )
        plan_text = closed_walk["screens"][-1]["text"]
        for kind in ("search", "folder"):
            value = closed_guide.get(kind)
            if value:
                check(
                    value not in plan_text,
                    f"the plan tells the person how to reach a record their own "
                    f"answer closed ({kind}): {value!r}",
                )

        # …and with the condition NOT declared, the whole note renders as written.
        open_walk = _walk_to_plan(graph, {"H2": "no"})
        check(
            not open_walk["flags"].get("no_contact"),
            "answering no to the no-contact question still closes a path",
        )
        open_text = "\n".join(
            s["text"] for s in open_walk["screens"] if s["node"] == node_id
        )
        check(
            note.strip() in open_text,
            f"{node_id}'s note is withheld even when nothing closes it, "
            "withholding is for a closed path only",
        )

    # 8, every machine token the contract carries has plain words.
    for node_id in graph.order:
        node = graph.node(node_id)
        action = node.get("action")
        if action and action not in ACTION_LINES:
            failures.append(f"{node_id}.action {action!r} has no plain-language line")
        if action and action not in ACTION_TITLES:
            failures.append(f"{node_id}.action {action!r} has no plain-language title")
        for limit in node.get("limits") or ():
            if limit not in LIMIT_LINES:
                failures.append(f"{node_id}.limits {limit!r} has no plain-language line")
        clock = node.get("clock")
        if clock and clock not in CLOCK_LINES:
            failures.append(f"{node_id}.clock {clock!r} has no plain-language line")
        if clock and clock not in CLOCK_RANK:
            failures.append(f"{node_id}.clock {clock!r} has no rank, so ordering is undefined")
        fence = node.get("fence")
        if fence and fence not in FENCE_LINES:
            failures.append(f"{node_id}.fence {fence!r} has no plain-language line")

    # 8b, ⛔ NOTHING THE ENGINE AUTHORS NAMES A KIND OF ACCUSATION.
    #
    #      The engine never asks what someone is accused of, so it may never guess.
    #      This is the check that makes that a property rather than an intention.
    authored = authored_screen_strings()
    check(len(authored) > 40, f"only {len(authored)} authored lines collected. The scan is broken")
    for text in authored:
        named = _allegation_words_in(text)
        check(
            not named,
            f"an authored line names an allegation class {named}: {text.strip()[:90]!r}",
        )

    #      …and the check is KNOWN TO FIRE, planted with the exact sentence that
    #      caused it. A check nobody has seen fail is indistinguishable from none.
    check(
        _allegation_words_in(
            "It records what a body looks like. It settles nothing about what was agreed."
        ),
        "the allegation-class check does not fire on the line that produced it",
    )

    #      The one exemption has to state its own rule, so in exchange it must say
    #      it is not an assumption about the person reading it.
    for what, value in [*FENCE_LINES.items(), ("the fallback", FENCE_UNKNOWN)]:
        check(
            FENCE_DISCLAIMER in value,
            f"the {what} fence does not say it is {FENCE_DISCLAIMER!r}, so it reads "
            "as a conclusion about this person rather than a rule about everyone",
        )

    #      And a limit is only ever a caveat on a record the person actually has.
    limited = [n for n in graph.order if graph.node(n).get("limits")]
    check(bool(limited), "no node carries limits. This check would prove nothing")
    declined_all = _walk_to_plan(
        graph, {node_id: "no" for node_id in graph.order if graph.is_record_question(node_id)}
    )
    declined_plan = declined_all["screens"][-1]["text"]
    for node_id in limited:
        for limit in graph.node(node_id).get("limits") or ():
            line = LIMIT_LINES.get(limit, LIMIT_UNKNOWN)
            check(
                line not in declined_plan,
                f"{node_id}'s caveat is printed to somebody who said no to every "
                f"record: {line[:70]!r}",
            )

    # 9: A8. priority_note is withheld, and this is why.
    withheld = [
        node_id
        for node_id in graph.order
        if graph.node(node_id).get("priority_note")
    ]
    for node_id in withheld:
        value = graph.node(node_id)["priority_note"]
        hits = _banned_in(value)
        notes.append(
            f"withheld {node_id}.priority_note"
            + (f" (it contains {hits}" if hits else ") see A8")
        )
    check(
        any(_banned_in(graph.node(n)["priority_note"]) for n in withheld),
        "no priority_note carries a banned word any more, A8 can be reconsidered",
    )

    # 10, ⚖️ EVERY site the contract names is MARKED, and the reasoning behind the
    #     mark prints EXACTLY ONCE. Three assertions, because they fail in three
    #     different directions and only the first of them existed before:
    #
    #       · an unmarked seam is a seam the reader cannot see — ADR 0005;
    #       · a seam whose reasoning is restated thirty times is unread by the
    #         reader furthest into the flow, which is the reader who acts on it;
    #       · 🔴 and a SHORT marker arriving before the full note would be a silent
    #         downgrade — somebody gets the mark without ever being given the
    #         reason. That is the one this pair of strings could plausibly regress
    #         into, so it is asserted by ORDER rather than by count.
    if not graph.wording_reviewed and graph.wording_sites:
        for answers in routes:
            result = drive(route_answers(answers))
            marks = []
            for index, screen in enumerate(result["screens"]):
                if UNREVIEWED_WORDING_LINES[0] in screen["text"]:
                    marks.append((index, "full"))
                elif UNREVIEWED_WORDING_BRIEF in screen["text"]:
                    marks.append((index, "brief"))
            for site in graph.wording_sites:
                owner = site
                for node_id in graph.order:
                    if any(i.get("id") == site for i in graph.items_of(node_id)):
                        owner = node_id
                shown = [s for s in result["screens"] if s["node"] == owner]
                if not shown:
                    continue
                carrying = [
                    s
                    for s in shown
                    if UNREVIEWED_WORDING_LINES[0] in s["text"]
                    or UNREVIEWED_WORDING_BRIEF in s["text"]
                ]
                check(
                    carrying,
                    f"the unreviewed-wording marker is missing from {owner} "
                    f"(site {site})",
                )
            if marks:
                fulls = [index for index, which in marks if which == "full"]
                check(
                    len(fulls) == 1,
                    f"the full unreviewed-wording note prints {len(fulls)} time(s) "
                    "on one walk, and it is written to print exactly once",
                )
                check(
                    bool(fulls) and fulls[0] == marks[0][0],
                    "a short unreviewed-wording marker reached a screen before the "
                    "note that explains it, so somebody is marked without the reason",
                )

    # 10c, A19: the guidance table is EXHAUSTIVE over the contract's layers, and
    #      every folder name is safe to see. ⛔ A record question whose layer is
    #      missing here renders a step with no destination and no way to obtain it,
    #      which is the defect this table exists to remove, so it fails HERE.
    contract_layers = [
        graph.node(node_id).get("layer")
        for node_id in graph.order
        if graph.is_record_question(node_id)
    ]
    check(bool(contract_layers), "no record questions were found, so this reads nothing")
    for layer in contract_layers:
        check(
            layer in LAYER_GUIDANCE,
            f"the contract has a record marked {layer!r} and nothing says where its "
            "files go or how to obtain it. A declared None is an answer; an absent "
            "key is a step that names a duty and abandons the person with it",
        )
    for layer, guide in LAYER_GUIDANCE.items():
        check(
            layer in contract_layers,
            f"guidance exists for {layer!r}, which the contract does not have. It "
            "can never print, and nothing else would report that",
        )
        check(
            set(guide) == {"folder", "search", "good"},
            f"{layer}'s guidance has keys {sorted(guide)}, not folder/search/good",
        )
        folder = guide.get("folder")
        if folder:
            hits = _banned_in(folder)
            check(
                not hits,
                f"the folder {folder!r} puts {hits} in front of the person the "
                "moment they open their own case folder",
            )
    # 🔴 AND THE GUIDANCE DOES NOT RESTATE THE ACTION LINE IT SITS UNDER.
    #
    # Found by rendering the plan and reading it, which is the only way this shows
    # up: SIX of these lines ended by repeating the sentence printed three lines
    # above them, word for word — "do not delete anything to make room", "a
    # photograph throws away the part that matters". Every one was individually
    # sensible and the item as a whole was padded, which is the same complaint that
    # produced the repetition fixes elsewhere in this file, arriving from a
    # direction nothing was watching.
    #
    # A shared run of six words is the test. It is a heuristic and it is allowed to
    # be: it costs a rephrase when it is wrong, and it catches the case where
    # somebody writes the guidance while looking at the action line.
    for node_id in graph.order:
        if not graph.is_record_question(node_id):
            continue
        node = graph.node(node_id)
        guide = LAYER_GUIDANCE.get(node.get("layer")) or {}
        good = guide.get("good")
        line = ACTION_LINES.get(node.get("action"))
        if not good or not line:
            continue
        words = [w for w in re.findall(r"[a-z]+", line.lower()) if w]
        runs = {" ".join(words[i : i + 6]) for i in range(max(0, len(words) - 5))}
        flat = " ".join(re.findall(r"[a-z]+", good.lower()))
        shared = sorted(run for run in runs if run in flat)
        check(
            not shared,
            f"{node_id}'s guidance repeats its own action line: {shared[:1]!r}. "
            "The person reads both, three lines apart, and the item reads as "
            "padding. Say the new thing only",
        )

    # 10e, A19b: the blanks a recorded answer can fill are STILL THERE TO FILL, and
    #      filling them really happens. ⛔ `str.replace` on a phrase that no longer
    #      holds the blank is a silent no-op: the substitution stops, the reader keeps
    #      getting a blank to fill in by hand, and nothing reports it. That is the
    #      failure mode, so it is asserted from both ends.
    for layer, rule in SEARCH_SUBSTITUTIONS.items():
        guide = LAYER_GUIDANCE.get(layer) or {}
        phrase = guide.get("search") or ""
        check(
            rule["blank"] in phrase,
            f"{layer}'s search phrase no longer contains {rule['blank']!r}, so the "
            "substitution is a no-op that will never report itself. Either the "
            "phrase was reworded or this entry is dead",
        )
    check(
        bool(SEARCH_SUBSTITUTION_VALUES),
        "no substitution values are declared, so no blank can ever be filled",
    )
    #      …and end to end, on the record whose blank the contract asks about. One
    #      probe fills it, one deliberately does not: `both` is a legal answer at
    #      `L2b` and must leave the blank visible rather than produce a phrase nobody
    #      would type.
    _probe = Session(graph, "selftest")
    for answered, wanted_filled in (("android", True), ("both", False)):
        _probe.flags["phone_platform"] = answered
        for layer in SEARCH_SUBSTITUTIONS:
            rendered = _probe.search_phrase({"layer": layer}) or ""
            check(
                (PHONE_BLANK not in rendered) == wanted_filled,
                f"with phone_platform={answered!r}, {layer}'s phrase rendered as "
                f"{rendered!r}, which is not what the substitution rule says",
            )
            if wanted_filled:
                check(
                    answered in rendered,
                    f"{layer}'s phrase lost the answer it was given: {rendered!r}",
                )

    # 10d, A20: the printable writer is really loaded, and its own checks pass.
    #      🔴 THE FLOW TREATS ITS ABSENCE AS SURVIVABLE, WHICH IS WHY THIS IS HERE.
    #      `write_printable` returns None on any failure so a person never gets a
    #      traceback over a convenience — and that swallowed the first version of the
    #      loader entirely: it read `HERE` as a directory when `HERE` is the file, so
    #      the sheet never appeared and nothing anywhere said so. A tolerant runtime
    #      needs an intolerant self-check, or the tolerance is just a hidden defect.
    check(
        PRINTABLE is not None,
        "the printable-sheet writer did not load from scripts/shared/printable.py, "
        "so no case folder gets the sheet and the flow will not complain",
    )
    if PRINTABLE is not None:
        try:
            for note in PRINTABLE.selfcheck():
                notes.append(f"printable  {note}")
        except Exception as exc:  # noqa: BLE001 - report it, do not abort the run
            failures.append(f"the printable writer's own checks failed: {exc}")

    # 10b, A18: every addendum is keyed to a real exclusion and really prints.
    #      🔴 BOTH HALVES, because they fail differently and silently. A key naming
    #      an exclusion the contract no longer has never renders and nothing says
    #      so — the addendum simply disappears, which is how the offer at `X13`
    #      would go missing after an amendment reordered or renamed an item. And a
    #      key that matches but sits on a screen no route reaches is the same defect
    #      one step later.
    if EXCLUSION_ADDENDA:
        known = set(graph.exclusion_ids())
        check(bool(known), "no exclusion ids were read, so this check reads nothing")
        for item_id in EXCLUSION_ADDENDA:
            check(
                item_id in known,
                f"an addendum is keyed to {item_id}, which is not an exclusion in "
                "the contract, so it can never print and nothing would report it",
            )
        every_screen = "\n".join(
            s["text"] for answers in routes for s in drive(route_answers(answers))["screens"]
        )
        check(bool(every_screen.strip()), "no screens were rendered to search")
        for item_id, extra_lines in EXCLUSION_ADDENDA.items():
            for extra in extra_lines:
                check(
                    extra in every_screen,
                    f"{item_id}'s addendum never reaches a screen on any route: "
                    f"{extra[:60]!r}",
                )

    # 11, a digest mismatch refuses to run, and says so.
    scratch = Path(tempfile.mkdtemp(prefix="mw-selftest-"))
    try:
        (scratch / "data").mkdir()
        shutil.copy2(CONTRACT_JSON, scratch / "data" / "tree.json")
        (scratch / "data" / "tree.sha256").write_text(
            f"{'0' * 64}  tree.json\n", encoding="utf-8"
        )
        try:
            load_contract(scratch / "data" / "tree.json", scratch / "data" / "tree.sha256")
            failures.append("a wrong digest did not refuse the run")
        except Refusal as exc:
            check("does not match its digest" in str(exc), "the refusal does not name the mismatch")
            check(digest in str(exc), "the refusal does not print the actual digest")

        # 12, a workspace inside the install tree is refused.
        try:
            resolve_workspace(str(INSTALL_ROOT / "somewhere"))
            failures.append("a workspace inside the install tree was allowed")
        except Refusal as exc:
            check("install" in str(exc).lower(), "the containment refusal does not say why")

        # 13, begin / answer / resume, including from a child folder.
        #      Those commands print a screen; swallow it so the report is the
        #      only thing this writes to stdout.
        work = scratch / "case"
        work.mkdir()
        args = argparse.Namespace(workspace=str(work), answer=None, json=False)
        cwd = Path.cwd()
        real_stdout = sys.stdout
        try:
            sys.stdout = open(os.devnull, "w", encoding="utf-8")
            os.chdir(scratch)
            check(cmd_begin(args) == EXIT_OK, "begin failed")
            path = state_path(work)
            check(path.is_file(), "begin wrote no state file")
            saved = json.loads(path.read_text(encoding="utf-8"))
            check(saved.get("parked_on") == SCREEN_ZERO_ID, "state parked on the wrong node")
            args.answer = ANSWER_SET_ACK[0]
            check(cmd_answer(args) == EXIT_OK, "answer failed")
            saved = json.loads(path.read_text(encoding="utf-8"))
            check(saved.get("parked_on") == graph.first, "state did not advance")
            deep = work / "a" / "b"
            deep.mkdir(parents=True)
            os.chdir(deep)
            resumed = argparse.Namespace(workspace=None, answer=None, json=False)
            check(cmd_screen(resumed) == EXIT_OK, "resume from a child folder failed")
            try:
                bad = argparse.Namespace(workspace=None, answer="probably", json=False)
                cmd_answer(bad)
                failures.append("a bad answer was accepted through the state path")
            except Refusal as exc:
                check(exc.code == EXIT_REJECTED, "a bad answer used the wrong exit code")
        finally:
            os.chdir(cwd)
            if sys.stdout is not real_stdout:
                sys.stdout.close()
            sys.stdout = real_stdout

        # 13b, A12. 🔴 THE SESSION SURVIVES THE FOLDER MOVING.
        #
        #       The measured failure: confirm a folder, answer the very next screen
        #       the ordinary way, and the engine reports it cannot find the case
        #       folder, because confirming MOVED the state file somewhere the
        #       upward search cannot reach. A reader concluded they had destroyed
        #       their folder by answering a question the tool asked them.
        #
        #       Two halves, and neither is sufficient alone: the screen must hand
        #       over the line that works, and the line must actually work.
        moving = (scratch / "state-moves").resolve()
        moving.mkdir()
        landing = (scratch / "moved-into").resolve()
        real_stdout = sys.stdout
        cwd = Path.cwd()
        try:
            sys.stdout = open(os.devnull, "w", encoding="utf-8")
            os.chdir(moving)
            here = argparse.Namespace(workspace=None, answer=None, json=False, command="begin")
            check(cmd_begin(here) == EXIT_OK, "begin failed in the moving-state case")

            def parked_now():
                return json.loads(
                    (moving / STATE_FILENAME).read_text(encoding="utf-8")
                )["parked_on"]

            guard = 0
            while parked_now() != FOLDER_ASK_ID and guard < 200:
                guard += 1
                at = parked_now()
                if at == SCREEN_ZERO_ID:
                    reply = ANSWER_SET_ACK[0]
                else:
                    reply = graph.options(at)[0]
                cmd_answer(
                    argparse.Namespace(
                        workspace=None, answer=reply, json=False, command="answer"
                    )
                )
            check(
                parked_now() == FOLDER_ASK_ID,
                f"never reached the folder question from a plain start: at {parked_now()}",
            )
            for reply in (str(landing), "yes"):
                cmd_answer(
                    argparse.Namespace(
                        workspace=None, answer=reply, json=False, command="answer"
                    )
                )
            check(
                (landing / STATE_FILENAME).is_file(),
                "confirming the folder did not put the state file in it",
            )
            check(
                not (moving / STATE_FILENAME).exists(),
                "the working note was left behind where the person started",
            )
        finally:
            os.chdir(cwd)
            if sys.stdout is not real_stdout:
                sys.stdout.close()
            sys.stdout = real_stdout

        # The screen the person is now looking at must carry the line that works.
        moved = read_state(state_path(landing), graph, digest)
        after_move = moved.screen()
        check(
            after_move.node_id == FOLDER_POINTER_ID,
            f"the screen after confirming is {after_move.node_id}, not the pointer question",
        )
        rendered_after = after_move.render()
        check(
            f"--workspace {shlex.quote(str(landing))}" in rendered_after,
            "the screen after the folder moved does not print the folder on the "
            "line it tells the person to run. That is the whole defect: the state "
            "file is somewhere the upward search cannot reach, and the screen went "
            "silent about it.",
        )
        # ⚠️ SETUP_IDS, not FOLDER_IDS. Every screen that asks for an answer needs
        # the line, and the jurisdiction screen asks for one. Widening this was the
        # whole point of having a name for "any setup screen".
        for node_id in SETUP_IDS:
            probe_session = read_state(state_path(landing), graph, digest)
            probe_session.node_id = node_id
            if node_id == FOLDER_CONFIRM_ID:
                probe_session.proposed = landing
            check(
                bool(probe_session.screen().command),
                f"{node_id} tells a person how to answer and prints no command line",
            )

        # …and answering it WITH that line continues the flow rather than losing it.
        real_stdout = sys.stdout
        cwd = Path.cwd()
        try:
            sys.stdout = open(os.devnull, "w", encoding="utf-8")
            os.chdir(moving)
            # A22: the pointer screen STATES, so the answer is an acknowledgement.
            # ⛔ Read out of the engine's own option list rather than typed — this
            # fixture said "no" and passed only while the screen was a question.
            carried = argparse.Namespace(
                workspace=str(landing),
                answer=FOLDER_POINTER_OPTIONS[0],
                json=False,
                command="answer",
            )
            check(cmd_answer(carried) == EXIT_OK, "the line the screen printed did not work")
            after = json.loads((landing / STATE_FILENAME).read_text(encoding="utf-8"))
            check(
                after["parked_on"] != FOLDER_POINTER_ID,
                "acknowledging the pointer screen left the session on the same screen",
            )
            # This walk never answered the exposure question, so the fail-safe holds
            # and nothing was written outside the folder.
            # ⛔ AGREES WITH THE EXPOSURE ANSWER, never asserted as a constant.
            # This walk does answer the device question, so what is recorded has to
            # be the opposite of what it said, and pinning either value here would
            # be a prose copy of a contract answer.
            resumed = read_state(state_path(landing), graph, digest)
            check(
                after["path_written_down_in_your_home_folder"]
                is not resumed.device_exposed(),
                "what was recorded about writing the path down does not match what "
                f"the device question established (exposed={resumed.device_exposed()})",
            )

            # And the bare form, which cannot work, must RECOVER rather than
            # frighten: name the folder it looked in, say nothing is lost, and
            # print the whole line to run.
            try:
                cmd_answer(
                    argparse.Namespace(
                        workspace=None,
                        answer=FOLDER_POINTER_OPTIONS[0],
                        json=False,
                        command="answer",
                    )
                )
                failures.append(
                    "a bare answer found a state file that is not on the search path"
                )
            except Refusal as exc:
                message = str(exc)
                check(exc.code == EXIT_NO_STATE, "the recovery used the wrong exit code")
                for needed in (
                    "Nothing has been deleted",
                    FOLDER_SLOT,
                    "--workspace",
                    str(moving),
                ):
                    check(
                        needed in message,
                        f"the recovery screen does not carry {needed!r}",
                    )
                check(
                    f"answer --workspace {FOLDER_SLOT} {FOLDER_POINTER_OPTIONS[0]}" in message,
                    "the recovery screen does not print the command the person was "
                    f"actually running: {message}",
                )
                # …and the stray double space a reader noticed is gone. Small,
                # but this screen is read by someone who has just been told
                # something frightening, and it reads as carelessness.
                check(
                    "looked in  " not in message,
                    "the recovery screen still has a double space after 'looked in'",
                )
        finally:
            os.chdir(cwd)
            if sys.stdout is not real_stdout:
                sys.stdout.close()
            sys.stdout = real_stdout

        # 14: A10. The folder is asked for BEFORE the first per-record question,
        #      the resolved absolute path is confirmed back, and nothing a person
        #      reads on those screens claims a boundary that does not exist.
        for setup_id in SETUP_IDS:
            check(
                setup_id not in graph.nodes,
                f"the authored screen id {setup_id} collides with a contract node",
            )

        wanted = scratch / "folder-screens"
        session, route, screens = _walk_with_folder(graph, digest, str(wanted))
        check(session.workspace == wanted.resolve(), "the confirmed folder is not the one asked for")

        records = [n for n in graph.order if graph.is_record_question(n)]
        check(bool(records), "the contract marks no per-record question")
        check(
            all(node_id in route for node_id in SETUP_IDS),
            "the setup screens were never shown: the route was "
            + " → ".join(route),
        )
        if records and all(node_id in route for node_id in SETUP_IDS):
            first_record = records[0]
            check(first_record in route, f"{first_record} was never reached")
            if first_record in route:
                at = route.index(first_record)
                width = len(SETUP_IDS)
                check(
                    route[max(0, at - width) : at] == list(SETUP_IDS),
                    f"the setup screens are not the {width} screens immediately "
                    f"before {first_record}: got {route[max(0, at - width): at]}",
                )
            settled_at = route.index(FOLDER_POINTER_ID)
            for record in records:
                check(
                    record in route and route.index(record) > settled_at,
                    f"{record} was asked before the folder existed",
                )

        folder_screens = {s.node_id: s for s in screens if s.node_id in SETUP_IDS}
        check(
            len(folder_screens) == len(SETUP_IDS),
            f"only {sorted(folder_screens)} of the setup screens rendered",
        )
        for node_id, screen in folder_screens.items():
            hits = _banned_in(screen.text)
            check(not hits, f"{node_id} shows {hits} to a person")
        confirm = folder_screens.get(FOLDER_CONFIRM_ID)
        if confirm is not None:
            check(
                str(wanted.resolve()) in confirm.text,
                "the confirmation screen does not show the resolved absolute path",
            )
            check(
                "only your own account" in confirm.text.lower(),
                "the confirmation screen no longer says who can open the folder. "
                "It used to say \"readable only by you (700)\", and a reader's note "
                "was that 700 meant nothing to them.",
            )
            # A11: the description accounts for every entry, and the number
            # printed is the layout rather than a figure typed into prose.
            described = sum(how_many for _phrase, how_many in FOLDER_CONTENTS)
            check(
                described == len(WORKSPACE_ENTRIES),
                f"the folder is described as {described} thing(s) and holds "
                f"{len(WORKSPACE_ENTRIES)}. A reader met that gap and said: either "
                "it lied or I cannot count, and I did not trust either answer.",
            )
            check(
                f"{len(WORKSPACE_ENTRIES)} things in all" in confirm.text,
                "the confirmation screen no longer counts what it creates",
            )
            # A15, what they typed, beside where it lands, whenever they differ.
            check(
                str(wanted.resolve()) in confirm.text,
                "the confirmation screen lost the resolved path",
            )
            if str(wanted) != str(wanted.resolve()):
                check(
                    f"You typed   {wanted}" in confirm.text,
                    "the confirmation screen reads back a path the person did not "
                    "type and does not show theirs beside it",
                )
                check(
                    "the same folder" in confirm.text,
                    "the confirmation screen shows two different paths and does "
                    "not say they are the same place",
                )
            check(
                FOLDER_NOT_A_BOUNDARY_LINES[0] in confirm.text,
                "the confirmation screen no longer says what it cannot control",
            )
            for word in ("protect", "secure", "safe from", "cannot be"):
                check(
                    word not in confirm.text.lower(),
                    f"the confirmation screen claims a boundary: {word!r}",
                )
        # A22: the pointer screen STATES rather than asks, and which of the two
        # things it states is decided by the exposure question. ADR 0010.
        pointer_screen = folder_screens.get(FOLDER_POINTER_ID)
        if pointer_screen is not None:
            check(
                pointer_screen.options == list(ANSWER_SET_ACK),
                f"the pointer screen accepts {pointer_screen.options}, so it is still "
                "asking a person to weigh a forensic trade-off about a tool they met "
                "four minutes ago. The exposure question decides it",
            )
            # ⛔ THE SCREEN MATCHES THE SESSION, not a preference. Which branch is
            # on show has to agree with what the exposure question established, or
            # the screen is telling somebody the opposite of what was done.
            wanted_branch = (
                session.pointer_lines()
            )
            check(
                wanted_branch[-1] in pointer_screen.text,
                "the pointer screen shows the branch that does not match this "
                f"session (device_exposed={session.device_exposed()}), so it is "
                "describing something other than what happened",
            )
        check(
            session.pointer is not session.device_exposed(),
            f"the path was recorded as written={session.pointer} while the device is "
            f"exposed={session.device_exposed()}. Those cannot both be true",
        )
        # 🔴 AND THE DECIDING NODE IS FOUND IN THE CONTRACT. If nothing sets the
        # flag, every session is treated as exposed forever and no screen says why,
        # which reads exactly like the feature working.
        check(
            session.exposure_node() is not None,
            "no node in the contract sets device_exposed, so the pointer is off for "
            "everybody and the reason is invisible",
        )
        # 🔴 BOTH BRANCHES REACHABLE, AND WHAT EACH ONE MAY SAY. Driven rather than
        # constructed: an exposed session must withhold, a clear one must write and
        # say so, and the withheld branch may name removable storage only as a thing
        # to ask a lawyer about. ⛔ Never as a step, and never as safe — moving
        # material once a warrant exists can be characterised as concealment, whether
        # it can is a legal question, and zero packs are reviewed.
        for exposed in (True, False):
            probe = Session(graph, digest, ask_folder=False)
            probe.workspace = Path("/tmp/mw-selftest-pointer")
            probe.node_id = FOLDER_POINTER_ID
            probe.flags["device_exposed"] = True if exposed else False
            probe.answers.append({"node": probe.exposure_node(), "step": 0, "answer": "x"})
            check(
                probe.device_exposed() is exposed,
                f"a session flagged device_exposed={exposed} reads back as "
                f"{probe.device_exposed()}",
            )
            text = probe.screen().text
            if exposed:
                check(
                    "not a neutral act" in text,
                    "the withheld branch no longer says that moving material once "
                    "somebody has a warrant is not neutral, which is the one thing "
                    "on that screen a person could get badly wrong",
                )
                for promised in ("hidden volume", "is safe", "will be safe", "secure"):
                    check(
                        promised not in text.lower(),
                        f"the withheld branch says {promised!r} about removable "
                        "storage. It may name it as a thing to ask a lawyer about "
                        "and nothing more",
                    )
            else:
                check(
                    "is itself a record" in text,
                    "the kept branch no longer tells the person that the file "
                    "naming their case folder exists and is a record on this machine",
                )

        # 🔴 A22b. THE KEPT BRANCH QUOTES THE ANSWER AND NARRATES NOTHING.
        #
        # It used to open "you told me nobody has asked to look at your phone or your
        # computer" — false for one of the two replies that reach it. So every
        # non-exposing reply is DERIVED from the contract and driven, each one has to
        # appear in the screen verbatim, and the old sentence may never come back.
        # ⛔ The derivation is what makes this total: a new non-exposing option added
        # by amendment is covered here without editing a list.
        decider_id = Session(graph, digest, ask_folder=False).exposure_node()
        clear_replies = [
            reply
            for reply, entry in (
                (graph.node(decider_id).get("branch") or {}) if decider_id else {}
            ).items()
            if not ((entry or {}).get("set") or {}).get("device_exposed")
        ]
        check(
            len(clear_replies) > 1,
            f"only {len(clear_replies)} reply reaches the kept branch, so the defect "
            "this checks for — one sentence describing two different answers — "
            "cannot be reproduced and this check has stopped meaning anything",
        )
        for reply in clear_replies:
            probe = Session(graph, digest, ask_folder=False)
            probe.workspace = Path("/tmp/mw-selftest-pointer")
            probe.node_id = FOLDER_POINTER_ID
            probe.answers.append({"node": decider_id, "step": 0, "answer": reply})
            text = probe.screen().text
            check(
                reply in text,
                f"the kept branch does not quote the reply {reply!r} back. It has to "
                "say what they answered rather than describe it, because one sentence "
                "cannot describe every answer that reaches this branch",
            )
            check(
                "nobody has asked" not in text,
                f"the kept branch tells somebody who answered {reply!r} that nobody "
                "asked to look at their device. Being asked and refusing is not the "
                "same as never being asked",
            )

        # ══════════════════════════════════════════════════════════════════════
        # 14b, ⚖️ A17/W4. THE JURISDICTION SCREEN, AND WHAT IT REFUSES TO CLAIM.
        #
        # ADR 0008 decision 5. Selecting a jurisdiction is NOT a claim that the
        # jurisdiction is supported, and the checks below are the enforcement of
        # that sentence rather than a restatement of it.
        # ══════════════════════════════════════════════════════════════════════
        packs = load_packs()
        where_screen = folder_screens.get(JURISDICTION_ID)
        check(where_screen is not None, "the jurisdiction screen never rendered")
        if where_screen is not None:
            # ⛔ DERIVED, NEVER TYPED. The options are the packs that exist plus the
            # one answer that is not a pack, and nothing else.
            check(
                where_screen.options == [*packs.codes, JURISDICTION_NOT_LISTED],
                "the jurisdiction options are not the pack list plus the "
                f"not-listed answer: got {where_screen.options}",
            )
            # `_template` is dropped at build time, so it cannot be offered. Named
            # here because the guarantee is structural and worth failing loudly on.
            check(
                "_template" not in where_screen.options,
                "the template is offered as a jurisdiction. It is not one.",
            )
            for code in packs.codes:
                check(
                    code in where_screen.text,
                    f"the pack {code} exists and is not offered on the screen",
                )
                # 🔴 THE REVIEW STATE IS BESIDE THE OPTION, not only in a note
                # underneath it. A person picking their own country reads their own
                # line and stops reading.
                check(
                    "not checked by a lawyer" in where_screen.text
                    or packs.reviewed(code),
                    f"{code} is unreviewed and the screen does not say so",
                )
            check(
                not packs.reviewed_any(),
                "a pack now reports itself as reviewed. That is not an error, but "
                "it is a project-level event: the coverage table, the advertising "
                "review and this check all have to be revisited together.",
            )
            hits = _banned_in(where_screen.text)
            check(not hits, f"the jurisdiction screen shows {hits} to a person")

        # THE ANSWER IS RECORDED, AND IT SURVIVES A SAVE AND A RELOAD.
        check(
            session.jurisdiction in [*packs.codes, JURISDICTION_NOT_LISTED],
            f"the walk recorded {session.jurisdiction!r} as a jurisdiction",
        )
        revived = Session.from_state(graph, digest, session.to_state())
        check(
            revived.jurisdiction == session.jurisdiction,
            "the jurisdiction did not survive a save and a reload, so the person "
            "would be asked again next session, which is the whole reason it is "
            "written down",
        )

        # 🔴 REFUSE BY DEFAULT, AND THE TRUTHY-STRING TRAP.
        #
        # A pack's tri-state fields are STRINGS: "yes", "no", "partial", "unknown".
        # Python reads every one of them as truthy, so a capability check written as
        # `if flags.get(name)` would grant a capability on the word `unknown`. That
        # is the single worst bug this function could have and it would never show
        # up in a walk-through, so it is planted here.
        planted = PackSet(
            {
                "codes": ["zz"],
                "packs": {
                    "zz": {
                        "meta": {"jurisdiction": "zz", "name": "Nowhere"},
                        "review": {"state": "reviewed"},
                        "capabilities": {
                            "truthy_string": "unknown",
                            "the_word_yes": "yes",
                            "really_true": True,
                            "explicitly_false": False,
                        },
                    }
                },
            }
        )
        check(
            planted.capability("zz", "really_true") is True,
            "a literal boolean true in a reviewed pack was refused, so this control "
            "proves nothing and every refusal below it is vacuous",
        )
        for flag in ("truthy_string", "the_word_yes", "explicitly_false", "absent"):
            check(
                planted.capability("zz", flag) is False,
                f"the capability {flag} was GRANTED. Only a literal boolean true "
                "may grant one: every tri-state value in a pack is a string, and "
                "a truthiness test grants on the word `unknown`.",
            )

        # …and review state gates it, so a pack edited to claim a capability
        # without being reviewed still gets nothing.
        unreviewed_but_claiming = PackSet(
            {
                "codes": ["zz"],
                "packs": {
                    "zz": {
                        "meta": {"jurisdiction": "zz"},
                        "review": {"state": "unreviewed"},
                        "capabilities": {"really_true": True},
                    }
                },
            }
        )
        check(
            unreviewed_but_claiming.capability("zz", "really_true") is False,
            "an UNREVIEWED pack granted a capability by claiming it. The pack "
            "format states the invariant itself: a pack whose review state is not "
            "`reviewed` may not supply wording to a user.",
        )
        # A pack that says nothing about its review state is unreviewed, never
        # reviewed. Absence of an answer is never permission.
        silent = PackSet({"codes": ["zz"], "packs": {"zz": {}}})
        check(
            silent.review_state("zz") == "unreviewed"
            and silent.capability("zz", "anything") is False,
            "a pack that states no review state was treated as reviewed",
        )
        # An unknown code is the resume case: a rebuild can remove a pack while a
        # saved session still names it. It must degrade, not grant.
        check(
            packs.review_state("no-such-code") == "unreviewed"
            and packs.capability("no-such-code", "anything") is False,
            "a jurisdiction code with no pack behind it did not degrade safely",
        )

        # 14c, A15/A16. WHERE THEY ARE, ON EVERY SCREEN, AND THAT IT IS SAVED.
        #
        #       A reader said the exclusion list's own progress line was the only
        #       place in the whole flow where they knew how much was left, and
        #       asked for it everywhere. And at the end: "if I'd closed that
        #       terminal window I'd have believed the whole thing was gone."
        seen_progress = 0
        previous = 0
        for screen in screens:
            spot = screen.progress
            check(spot is not None, f"{screen.node_id} shows no progress at all")
            if spot is None:
                continue
            at, most = spot
            check(at >= 1, f"{screen.node_id} is screen {at}")
            check(most >= at, f"{screen.node_id} says {at} / {most}")
            check(
                at == previous + 1,
                f"{screen.node_id} is screen {at}, one after {previous} expected, "
                "the count skipped or repeated",
            )
            previous = at
            # ⚠️ Both numbers, on the wire, on every screen. The FORM is short now
            # and that is deliberate, but this assertion is about presence rather
            # than about wording, so it must still fail if either figure goes
            # missing. `at >= most` prints the last-one variant.
            rendered = screen.render()
            check(
                (f"{at} / {most}" in rendered) or (f"{at} / ~{most}" in rendered),
                f"{screen.node_id} does not print where the person is",
            )
            seen_progress += 1
        check(seen_progress > 5, f"only {seen_progress} screen(s) carried progress")

        finished = screens[-1]
        check(finished.node_id == PLAN_ID, "the walk did not end on the plan")
        check(
            str(wanted.resolve()) in finished.text,
            "the last screen does not say where the work was saved",
        )
        check("saved" in finished.text.lower(), "the last screen does not say it is saved")
        for name in (PLAN_FILENAME, MATTER_FILENAME, CLOSED_PATHS_FILENAME):
            check(
                name in finished.text,
                f"the last screen does not name {name}, so nothing tells the person "
                "the work exists as a file they can open",
            )
        check(
            STATE_FILENAME not in finished.text,
            f"the last screen names {STATE_FILENAME}, which is mine, not theirs",
        )
        # …and the two folders they WILL see when they open it are named, now that
        # their names are plain enough to say out loud. Not naming something the
        # person is about to find is how `custody` came as a shock.
        for name in WORKSPACE_DIRS:
            check(
                name in finished.text,
                f"the last screen does not name {name}, which the person sees the "
                "moment they open their own folder",
            )

        # A bare word at the folder screen is rejected, not resolved.
        bare = Session(graph, digest, ask_folder=True)
        bare.node_id = FOLDER_ASK_ID
        for bad in ("yes", "MachineWitness", "case-01", ""):
            try:
                bare.accept(bad)
                failures.append(f"the folder screen resolved {bad!r} instead of rejecting it")
            except Refusal as exc:
                check(
                    exc.code == EXIT_REJECTED,
                    f"rejecting {bad!r} at the folder screen used the wrong exit code",
                )
                check(bare.proposed is None, f"a rejected path {bad!r} was still recorded")

        # `change` goes back and forgets the path, rather than creeping forward.
        again = Session(graph, digest, ask_folder=True)
        again.node_id = FOLDER_ASK_ID
        again.accept(str(scratch / "first-choice"))
        check(again.node_id == FOLDER_CONFIRM_ID, "the folder screen did not ask for confirmation")
        again.accept("change")
        check(again.node_id == FOLDER_ASK_ID, "`change` did not go back to the folder question")
        check(again.proposed is None, "`change` kept the path it was told to forget")
        check(again.workspace is None, "`change` created a folder anyway")

        # 15: the volume refusals. ⛔ By mount property and resolved symlink,
        #      never by brand name, and a case that cannot be established
        #      REFUSES rather than being assumed safe.
        real_facts, mechanism = read_mount_table()
        check(
            bool(real_facts),
            f"no mount table could be read on {sys.platform}, so every folder "
            f"would be refused as unestablished: {mechanism}",
        )
        notes.append(f"volumes seen  {len(real_facts)} via {mechanism}")

        volumes = (scratch / "volumes").resolve()
        plain_dir = volumes / "plain"
        net_dir = volumes / "from-a-server"
        remote_source_dir = volumes / "mounted-from-elsewhere"
        program_dir = volumes / "served-by-a-program"
        odd_dir = volumes / "something-else"
        for folder in (plain_dir, net_dir, remote_source_dir, program_dir, odd_dir):
            folder.mkdir(parents=True)
        # ⚠️ The network entry's SOURCE looks local, and the remote-source entry's
        # TYPE is ordinary. Each property is therefore the only thing that can
        # catch its own case. A fixture that tripped both at once would keep
        # passing after either check was deleted.
        fixture = [
            MountFact(str(volumes), "/dev/sda2", "ext4", ("rw",), "linux-mountinfo"),
            MountFact(str(net_dir), "/dev/sdb1", "nfs4", ("rw",), "linux-mountinfo"),
            MountFact(
                str(remote_source_dir),
                "a-host:/exported",
                "ext4",
                ("rw",),
                "linux-mountinfo",
            ),
            MountFact(str(program_dir), "a-daemon", "fuse.a-daemon", ("rw",), "linux-mountinfo"),
            MountFact(str(odd_dir), "/dev/sdz9", "notatypeweknow", ("rw",), "linux-mountinfo"),
        ]

        # The control FIRST. A check that refuses everything is not a check, and
        # every refusal below would be satisfied by one.
        try:
            allowed = resolve_workspace(str(plain_dir / "case"), mounts=fixture)
            check(
                allowed == (plain_dir / "case").resolve(),
                "an ordinary local folder resolved to something else",
            )
        except Refusal as exc:
            failures.append(f"an ordinary local folder was refused: {exc}")

        (net_dir / "case").mkdir()
        (program_dir / "case").mkdir()
        into_network = volumes / "looks-local-1"
        into_network.symlink_to(net_dir / "case")
        into_install = volumes / "looks-local-2"
        into_install.symlink_to(INSTALL_ROOT.resolve())

        # A version-controlled project, planted three ways: the marker as a
        # DIRECTORY, the marker as a FILE, which is what a submodule or a linked
        # worktree carries, and a link that resolves inside one. ⚠️ Every one of
        # these passes `None` for the table, so none of them can pass by hitting
        # the unestablished refusal wearing a different name.
        projects = (scratch / "projects").resolve()
        marker_is_a_dir = projects / "a-project"
        (marker_is_a_dir / VERSION_CONTROL_MARKER).mkdir(parents=True)
        marker_is_a_file = projects / "a-part-of-another-project"
        marker_is_a_file.mkdir(parents=True)
        (marker_is_a_file / VERSION_CONTROL_MARKER).write_text(
            "gitdir: ../somewhere-else\n", encoding="utf-8"
        )
        into_project = projects / "looks-local-3"
        into_project.symlink_to(marker_is_a_dir / "deep" / "case")

        refusal_cases = [
            (str(net_dir / "case"), fixture, "leaves this machine", "a network volume"),
            (
                str(remote_source_dir / "case"),
                fixture,
                "leaves this machine",
                "a volume mounted from another machine",
            ),
            (
                str(program_dir / "case"),
                fixture,
                "a program stands between you",
                "a volume a program serves",
            ),
            (
                str(odd_dir / "case"),
                fixture,
                "cannot establish",
                "a filesystem type it cannot classify",
            ),
            (str(plain_dir / "case"), [], "cannot establish", "no mount table at all"),
            (
                # A table that describes a DIFFERENT volume. "Not found" and
                # "nothing read" are the same shape, and both must refuse.
                str(plain_dir / "case"),
                [MountFact(str(odd_dir), "/dev/sdb1", "ext4", ("rw",), "linux-mountinfo")],
                "cannot establish",
                "a table that covers another volume but not this path",
            ),
            (
                str(into_network),
                fixture,
                "leaves this machine",
                "a symlink resolving into a network volume",
            ),
            (str(into_install), None, "install", "a symlink resolving into the install tree"),
            (str(INSTALL_ROOT / "somewhere"), None, "install", "the install tree named outright"),
            (
                str(marker_is_a_dir / "case"),
                None,
                "keeps its own history",
                "a folder directly inside a version-controlled project",
            ),
            (
                str(marker_is_a_dir / "one" / "two" / "case"),
                None,
                "keeps its own history",
                "a folder nested deep inside a version-controlled project",
            ),
            (
                str(marker_is_a_dir),
                None,
                "keeps its own history",
                "the top of a version-controlled project, named outright",
            ),
            (
                str(marker_is_a_file / "case"),
                None,
                "keeps its own history",
                "a project whose marker is a file rather than a directory",
            ),
            (
                str(into_project),
                None,
                "keeps its own history",
                "a symlink resolving into a version-controlled project",
            ),
        ]
        for path, mounts, expected, what in refusal_cases:
            try:
                resolve_workspace(path, mounts=mounts)
                failures.append(f"{what} was allowed")
            except Refusal as exc:
                message = str(exc)
                check(
                    expected in message,
                    f"the refusal for {what} does not state the reason "
                    f"({expected!r} missing): {message.splitlines()[0]}",
                )
                hits = _banned_in(message)
                check(not hits, f"the refusal for {what} shows {hits} to a person")

        # 16, what the folder actually holds, and that it is 700.
        made = (scratch / "made").resolve()
        holder = Session(graph, digest, ask_folder=True)
        holder.workspace = made
        holder.flags["no_contact"] = True
        holder.flags["plan_mode"] = "preservation_only"
        holder.answers.append({"node": graph.first, "step": 0, "answer": "yes"})
        _persist(holder, state_path(made))

        on_disk = sorted(entry.name for entry in made.iterdir())
        check(
            on_disk == sorted(WORKSPACE_ENTRIES),
            f"the folder holds {on_disk}, not {sorted(WORKSPACE_ENTRIES)}",
        )
        mode = stat.S_IMODE(made.stat().st_mode)
        check(mode == stat.S_IRWXU, f"the folder is {oct(mode)}, not 700")

        # ⛔ A FOLDER LISTING IS A SCREEN, and the one screen that cannot be taken
        # back, because it is on the person's own disk. Read off what was actually
        # created rather than off the constant, so a name introduced anywhere in
        # this file is caught. The engine was careful never to SAY `custody` and
        # then created a directory called `custody`; a reader opened their folder,
        # found it, and thought it meant their children.
        check(bool(on_disk), "nothing was created, so this check would read nothing")
        for entry in on_disk:
            hits = _banned_in(entry)
            check(
                not hits,
                f"the folder holds an entry named {entry!r}, which puts {hits} in "
                "front of the person the moment they open it",
            )

        # A18: the file X13 sends them to, and the property that makes X13 true.
        #
        # ⚠️ Whitespace-normalised before searching, and the first draft was not:
        # the document is hard-wrapped, so "never read into an assistant prompt"
        # sits across a line break and a plain substring test failed on a file that
        # said exactly the right thing. A check that goes red on correct content is
        # not a safe check — it teaches whoever meets it next to stop reading this
        # one.
        recollection = made / RECOLLECTION_FILENAME
        flat = " ".join(recollection.read_text(encoding="utf-8").split())
        # ⚠️ `I have not asked you what happened` USED TO BE ON THIS LIST, asserted
        # as a promise the file had to make. ADR 0009 deleted that posture: the
        # engine's own questions are still about devices and accounts, but `S0` now
        # invites the person to say what this is about, so a file claiming nothing
        # was ever asked contradicted a screen they had already read. What replaces
        # it is the distinction that actually matters to them — this file is theirs
        # and untouched, and what they told the assistant is in the other one.
        for promised in (
            "written ONCE",
            "My own questions were about devices and accounts",
            f"in {NOTES_FILENAME} beside",
            "will not write to it again",
            "never read into an assistant prompt",
            "The date you wrote this:",
        ):
            check(
                promised in flat,
                f"{RECOLLECTION_FILENAME} does not say {promised!r}",
            )
        # 🔴 AND A SECOND RUN DOES NOT TOUCH IT. Asserted by writing something into
        # it and creating the workspace again, because this is the one file in the
        # folder whose contents are the person's own account, and `X13`'s "never
        # improve it" is only a property of the tool if this holds. A check that
        # merely read the header would pass while the engine clobbered the body.
        theirs = "what they wrote at four in the morning\n"
        recollection.write_text(theirs, encoding="utf-8")
        create_workspace(made)
        check(
            recollection.read_text(encoding="utf-8") == theirs,
            f"a second run overwrote {RECOLLECTION_FILENAME}, destroying the one "
            "file in the folder the person wrote themselves",
        )
        recollection.write_text(RECOLLECTION_TEXT, encoding="utf-8")

        # A23: `notes.md` is the home for what the person volunteers, and the ONLY
        # property that makes it usable is that it survives. It is append-only, so
        # the assistant adds to the end of it across sessions; recreating it on a
        # later run would delete detail that cannot be reproduced from any answer.
        notes_file = made / NOTES_FILENAME
        check(notes_file.exists(), f"{NOTES_FILENAME} was not created")
        notes_flat = " ".join(notes_file.read_text(encoding="utf-8").split())
        for promised in (
            # ⛔ Each of these is a property the file has to state, not decoration.
            # The read direction being closed is what makes it safe to hold words
            # rather than answers, and the order caveat is why it may only grow.
            "never read back into an assistant prompt",
            "It only ever grows",
            "has already gone to the company",
            "Ask your lawyer",
        ):
            check(
                promised in notes_flat,
                f"{NOTES_FILENAME} does not say {promised!r}",
            )
        appended = NOTES_TEXT + "\n- where they put the export\n"
        notes_file.write_text(appended, encoding="utf-8")
        create_workspace(made)
        check(
            notes_file.read_text(encoding="utf-8") == appended,
            f"a second run overwrote {NOTES_FILENAME}, destroying detail the person "
            "volunteered that no answer can reproduce",
        )
        notes_file.write_text(NOTES_TEXT, encoding="utf-8")

        # 🔴 A25: THE STEPPED PLAN. Every step reachable, nothing lost, and the record
        # complete whatever the person read.
        #
        # The defect this replaces: 239 lines in one turn, reported as "too much at
        # once, nothing guided, just text text text". ⛔ The fix may not be allowed to
        # become a different defect — a walk that drops a step, or a PLAN.md that holds
        # only the step somebody happened to stop on — so both are asserted here rather
        # than trusted.
        # ⚠️ The live session from the walk, reset to the top of the plan. `finished`
        # above is a SCREEN, not a session -- cloning its __dict__ silently shadowed
        # `Session.progress` with `Screen.progress` and the engine crashed on a tuple.
        stepper = session
        stepper.finished = False
        stepper.node_id = PLAN_ID
        stepper.plan_cursor = 0
        total_steps = len(stepper.plan_steps())
        check(total_steps > 0, "the walk reached the plan with no numbered steps at all")
        whole_text = stepper.screen(PLAN_WHOLE).text
        # 🔴 WHAT THE SCREEN OFFERS IS WHAT THE ENGINE ACCEPTS, at EVERY plan cursor.
        # ⛔ This is the general guard, not a fix for one case: the two lists diverged
        # the moment the plan gained a second answer, and the symptom was the engine
        # refusing the exact word its own screen told the person to type. Walked over
        # every cursor including the whole-plan view and one past the end.
        for probe_cursor in [*range(0, total_steps + 3), PLAN_WHOLE]:
            stepper.plan_cursor = probe_cursor
            stepper.finished = False
            offered = stepper.screen().options
            accepted = stepper.options_here()
            check(
                offered == accepted,
                f"at plan cursor {probe_cursor} the screen offers {offered} while the "
                f"engine accepts {accepted}. A person typing what the screen told them "
                "to type is refused",
            )
            check(
                bool(offered),
                f"plan cursor {probe_cursor} offers no answer at all, so the walk "
                "cannot be continued from it",
            )
        stepper.plan_cursor = 0

        # ⛔ EVERY STEP TITLE IN THE WHOLE PLAN MUST APPEAR ON SOME STEPPED SCREEN.
        # Derived from the whole form, so a step added later is covered without
        # editing anything here.
        seen_steps = []
        guard = 0
        while not stepper.finished and guard < 400:
            guard += 1
            seen_steps.append(stepper.screen().text)
            stepper.accept("ok")
        check(
            guard < 400,
            "walking the plan one step at a time never finished, so the cursor does "
            "not advance to the end",
        )
        walked = "\n".join(seen_steps)
        for index in range(1, total_steps + 1):
            check(
                f"Step {index} of {total_steps}." in walked,
                f"step {index} of {total_steps} never appeared while walking the plan "
                "one step at a time. A skipped step is invisible: the walk still ends, "
                "the screens still look right, and an errand was never shown",
            )
        # ⛔ AND THE CLOSING BLOCKS ARE REACHED, both of them. They carry what is
        # running out and what each answer cannot establish, which is RAIL 4 material.
        for promised in ("What is running out", "How much this can help"):
            check(
                promised in walked,
                f"walking one step at a time never reached {promised!r}. Stepping must "
                "not drop the closing blocks: one is the deadlines and the other is "
                "what these records cannot show",
            )
        # 🔴 AND `all` IS A REAL ESCAPE HATCH, not a word on a screen.
        jumper = session
        jumper.finished = False
        jumper.node_id = PLAN_ID
        jumper.plan_cursor = 0
        check(
            "all" in jumper.screen().options,
            "the opening plan screen does not offer `all`, so somebody who does not "
            "want to be walked through it has no way out",
        )
        # ⚠️ GUARDED, because the thing being tested is whether the engine accepts the
        # word its own screen offers. An unguarded call turns a check failure into an
        # uncaught refusal, and the crash happens BEFORE the collected failures are
        # printed -- so the run reports a stack trace instead of the sentence saying
        # what is wrong. That is how this very defect first showed up.
        try:
            jumper.accept("all")
            check(
                jumper.screen().text == whole_text,
                "`all` did not produce the whole plan, so the escape hatch shows "
                "something other than what it promises",
            )
        except Refusal as exc:
            check(
                False,
                f"the engine refused `all`, which its own plan screen offers: {exc}",
            )

        # A21: `collected` tells THREE outcomes apart, and the third is the point.
        #
        # 🔴 A REAL UNREADABLE FOLDER, not a simulated one. `exists()` answers True
        # for a directory that will not open, so the only way to know this engine
        # does not report it as empty is to make one and look. ⚠️ Skipped where the
        # platform or the user lets root read anything regardless, because there the
        # fixture cannot be built and a pass would mean nothing — reported as such
        # rather than counted as a success.
        holder.selected = [
            node_id
            for node_id in graph.order
            if graph.is_record_question(node_id)
            and (LAYER_GUIDANCE.get(graph.node(node_id).get("layer")) or {}).get("folder")
        ]
        check(bool(holder.selected), "no record has a folder, so this proves nothing")
        holder.make_drop_paths()
        # ⛔ The command's OWN target list, not a second walk. Building it by hand
        # here put the no-contact-closed conversation back in and reported its
        # missing folder as unreadable — a fixture bug that was also a preview of
        # the real defect, since a hand-rolled list is exactly what would ship a
        # folder for a record the person must not open.
        chosen = collected_targets(holder)
        check(len(chosen) >= 3, f"only {len(chosen)} folder(s) to look at")
        has_file, cannot_open = chosen[0][2], chosen[1][2]
        (made / DROP_ROOT / has_file / "an-export.zip").write_text("x", encoding="utf-8")
        blocked = made / DROP_ROOT / cannot_open
        os.chmod(blocked, 0)
        try:
            list(blocked.iterdir())
            notes.append(
                "unreadable-folder case NOT tested: a mode-000 folder still opened "
                "here, so the fixture could not be built"
            )
        except OSError:
            rows, present, empty, unreadable = collected_rows(holder, chosen)
            check(
                present == [has_file],
                f"a folder with a file in it was reported as {present}",
            )
            check(
                unreadable == [cannot_open],
                f"an unreadable folder was reported as {unreadable}, and if it "
                "landed in the empty list then somebody is told a record is "
                "missing when nothing of the kind was established",
            )
            check(
                cannot_open not in empty,
                "an unreadable folder was counted as empty. ⛔ That reports an "
                "absence that was never checked, to a person deciding whether they "
                "still have work to do",
            )
            check(
                len(rows) == len(chosen),
                f"{len(rows)} row(s) for {len(chosen)} folder(s)",
            )
        finally:
            os.chmod(blocked, stat.S_IRWXU)

        matter = (made / MATTER_FILENAME).read_text(encoding="utf-8")
        for opening in (
            "stays on this machine",
            "never read into an assistant prompt",
            "Do not paste it into any AI service",
        ):
            check(opening in matter, f"{MATTER_FILENAME} does not say {opening!r}")
        check(
            matter.index("never read into an assistant prompt")
            < matter.index("## What you have answered so far"),
            f"{MATTER_FILENAME} buries the warning below the answers",
        )
        check(graph.node(graph.first)["ask"] in matter, f"{MATTER_FILENAME} lost an answer")

        closed_text = (made / CLOSED_PATHS_FILENAME).read_text(encoding="utf-8")
        check(
            CLOSED_PATH_LINES[0] in closed_text,
            f"{CLOSED_PATHS_FILENAME} states no reason for a closed path",
        )
        check(
            "You said" not in closed_text,
            f"{CLOSED_PATHS_FILENAME} carries the answers. It holds closed paths "
            "and reasons ONLY",
        )
        check(
            "do not have a lawyer yet" in closed_text,
            f"{CLOSED_PATHS_FILENAME} does not record what having no lawyer closes",
        )
        for node_id in NO_CONTACT_CLOSES:
            check(
                graph.node(node_id)["ask"] in closed_text,
                f"{CLOSED_PATHS_FILENAME} does not name the path {node_id} closes",
            )

        ignore_text = (made / GITIGNORE_FILENAME).read_text(encoding="utf-8")
        check(
            "NOT A PROTECTION" in ignore_text.upper(),
            f"{GITIGNORE_FILENAME} no longer says it is not a protection",
        )
        for cannot_stop in ("by force", "backs this computer up", "search that indexes"):
            check(
                cannot_stop in ignore_text,
                f"{GITIGNORE_FILENAME} no longer says it cannot stop {cannot_stop!r}",
            )

        for name in WORKSPACE_FILES:
            # A20. ⚠️ The printable sheet is BYTES, and high WinAnsi bytes are not
            # valid UTF-8, so it is decoded as latin-1 — which cannot fail — rather
            # than skipped. Skipping it would drop the word check on the one file in
            # the folder meant to be carried out of the house, and the stream is
            # deliberately uncompressed, so every word really is in there to find.
            #
            # ⛔ AND A MISSING FILE IS A FAILURE, NOT A CRASH. Reading straight into
            # `read_bytes` here raised `FileNotFoundError` and aborted the entire
            # self-check the first time the sheet was not written, hiding every
            # remaining check including the one that names the cause. A self-check
            # that stops on the first surprise reports the least when it matters most.
            here = made / name
            if not here.exists():
                failures.append(f"{name} is described to the person but was not created")
                continue
            if name == PRINTABLE_FILENAME:
                body = here.read_bytes().decode("latin-1")
            else:
                body = here.read_text(encoding="utf-8")
            check(body.strip() != "", f"{name} was created empty")
            if name == STATE_FILENAME:
                continue  # machine state, not a screen
            hits = _banned_in(body)
            check(not hits, f"{name} shows {hits} to a person")

        # 17, the pointer stays off, and the resume question ASKS.
        pretend_home = (scratch / "pretend-home").resolve()
        pretend_home.mkdir()
        saved_home = os.environ.get("HOME")
        os.environ["HOME"] = str(pretend_home)
        try:
            check(read_pointer() == [], "something had already written a pointer file")
            check(
                pointer_path() == pretend_home / POINTER_DIRNAME / POINTER_FILENAME,
                "the pointer path is not the fixed one under the home folder",
            )
            no_pointer_ask = _nothing_to_resume_message()
            check(
                "have not written the path down" in no_pointer_ask,
                "the resume question does not say the path was never written down",
            )

            declined = Session(graph, digest, ask_folder=True)
            declined.workspace = made
            declined.pointer = False
            _persist(declined, state_path(made))
            check(
                not (pretend_home / POINTER_DIRNAME).exists(),
                "declining the pointer wrote a file anyway",
            )

            opted = Session(graph, digest, ask_folder=True)
            opted.workspace = made
            opted.pointer = True
            _persist(opted, state_path(made))
            _persist(opted, state_path(made))  # twice: it must not duplicate
            check(
                read_pointer() == [str(made)],
                f"the pointer holds {read_pointer()}, not one line naming the folder",
            )
            pointer_mode = stat.S_IMODE(pointer_path().stat().st_mode)
            check(
                pointer_mode == stat.S_IRUSR | stat.S_IWUSR,
                f"the pointer file is {oct(pointer_mode)}, readable by others",
            )
            offered = _nothing_to_resume_message()
            check(str(made) in offered, "the resume question does not offer the last folder")
            check(
                "unless you mean to" in offered,
                "the resume question does not warn against starting again",
            )
            check(
                "Start at the beginning instead" not in offered,
                "the resume question still tells an interrupted person to start over",
            )
        finally:
            if saved_home is None:
                os.environ.pop("HOME", None)
            else:
                os.environ["HOME"] = saved_home

        # 18, an existing folder that belongs to something else is refused.
        occupied = (scratch / "already-in-use").resolve()
        occupied.mkdir()
        (occupied / "someone-elses-file.txt").write_text("not ours\n", encoding="utf-8")
        try:
            check_workspace_usable(occupied)
            failures.append("a folder already in use for something else was accepted")
        except Refusal as exc:
            check(
                "already has things in it" in str(exc),
                "the refusal for an occupied folder does not say why",
            )
        empty = (scratch / "empty-and-fine").resolve()
        empty.mkdir()
        try:
            check_workspace_usable(empty)
        except Refusal as exc:
            failures.append(f"an empty folder was refused: {exc}")
    finally:
        shutil.rmtree(scratch, ignore_errors=True)

    # ── report ────────────────────────────────────────────────────────────────
    sys.stdout.write(
        f"selftest: contract   {len(graph.order)} nodes · {len(all_items)} exclusions\n"
        f"selftest: routes     {len(routes)} routing-distinct path(s)\n"
        f"selftest: screens    {screens_seen} rendered across those routes\n"
        f"selftest: covered    {len(rendered_nodes)} node(s) · "
        f"{len(rendered_items)} exclusion(s)\n"
    )
    for note in notes:
        sys.stdout.write(f"selftest: note       {note}\n")
    if failures:
        sys.stdout.write(f"\nselftest: {len(failures)} FAILURE(S)\n")
        for failure in failures:
            sys.stdout.write(f"  ✖ {failure}\n")
        return 1
    sys.stdout.write("selftest: ✅ all checks passed\n")
    return EXIT_OK


def _walk_with_folder(graph, digest, path_answer, forced=None):
    """Walk a real session with the folder screens in it, to the plan.

    In-process and with no state file, so the screens can be inspected without
    the command layer. `resolve_workspace` still runs, so a refused path refuses
    here exactly as it would on the real path.
    """
    session = Session(graph, digest, ask_folder=True)
    route = []
    screens = []
    guard = 0
    while guard < 500:
        guard += 1
        screen = session.screen()
        screens.append(screen)
        if not route or route[-1] != screen.node_id:
            route.append(screen.node_id)
        if session.node_id == PLAN_ID or session.finished:
            break
        if session.node_id == FOLDER_ASK_ID:
            session.accept(path_answer)
            continue
        options = session.options_here()
        session.accept((forced or {}).get(session.node_id, options[0]))
    return session, route, screens


def _walk_to_plan(graph, forced):
    """Drive to the plan, forcing named nodes to a named answer. No filesystem."""
    tree, digest = load_contract()
    session = Session(Graph(tree), digest, ask_folder=False)
    screens = []
    guard = 0
    while not session.finished and guard < 500:
        guard += 1
        # A25: at the plan, record the WHOLE plan rather than the step the person
        # would be looking at. ⛔ Every check downstream of this helper is about what
        # the plan CONTAINS -- that a step is titled with its action, that a record
        # says which answer selected it, that counsel is named once. Handing them the
        # opening screen would make each one assert something about a summary, and
        # they would go quiet about the thing they were written to protect.
        if session.node_id == PLAN_ID:
            screens.append(session.screen(PLAN_WHOLE).as_dict())
            break
        screens.append(session.screen().as_dict())
        options = session.options_here()
        answer = forced.get(session.node_id, options[0])
        session.accept(answer)
    return {
        "screens": screens,
        "flags": session.flags,
        "selected": session.selected,
    }


# ═══════════════════════════════════════════════════════════════════════════════
# Entry point
# ═══════════════════════════════════════════════════════════════════════════════


def build_parser():
    parser = argparse.ArgumentParser(
        prog="triage.py",
        description=(
            "The deterministic triage engine. One screen out, one answer in. "
            "It owns the state file and nothing else may touch it."
        ),
    )
    parser.add_argument(
        "--selftest",
        action="store_true",
        help="run the engine's own checks over the contract and exit",
    )
    subparsers = parser.add_subparsers(dest="command")

    def add(name, help_text):
        sub = subparsers.add_parser(name, help=help_text)
        sub.add_argument(
            "--workspace",
            default=None,
            help="the folder that holds this person's case files",
        )
        return sub

    add("begin", "start, or pick up where this left off").set_defaults(func=cmd_begin)
    add("screen", "show the screen this is parked on").set_defaults(func=cmd_screen)
    answer = add("answer", "give exactly one answer")
    answer.add_argument("answer", nargs="?", default=None)
    answer.set_defaults(func=cmd_answer)
    add("state", "print the state file and where it is").set_defaults(func=cmd_state)
    add(
        "collected",
        "check what has landed in the folders the plan named, and what has not",
    ).set_defaults(func=cmd_collected)

    verify = subparsers.add_parser("verify", help="check the contract digest and stop")
    verify.set_defaults(func=cmd_verify, workspace=None)

    driver = subparsers.add_parser(
        "drive", help="replay answers with no state file (test surface)"
    )
    driver.add_argument("--answer", action="append", default=None)
    driver.add_argument("--json", action="store_true")
    driver.set_defaults(func=cmd_drive, workspace=None)

    return parser


def main(argv=None):
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.selftest:
        return selftest()
    if not getattr(args, "func", None):
        parser.print_help()
        return EXIT_USAGE
    try:
        return args.func(args)
    except Refusal as exc:
        sys.stdout.write(f"\n{exc}\n\n")
        return exc.code


if __name__ == "__main__":
    sys.exit(main())
