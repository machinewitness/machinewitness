# `shared/`: tools that do not care where the person lives

**One test decides whether a tool belongs here:**

> **Does the answer change if the person is in another country?**

**No** means this directory. **Yes** means `../jurisdiction/<code>/`. ADR `0008` decision 1.

A wearable parser reads a file format a device manufacturer defined. A phone backup has the
structure the operating system gave it. Neither one becomes a different program at a border, so
neither one is jurisdiction-bound and neither one may be duplicated per country.

⚠️ **The test is about the tool's own behaviour, not about its subject.** Whether a person is
*entitled* to obtain a record, how long a holder must keep it, and whether a demand binds
anyone are all legal questions, they all differ by country, and none of them lives in code.
They live in `jurisdictions/<code>/`, unanswered until a practitioner reviews them. A
tool here may report what a file contains; it may never report what that means legally.

## What belongs here

The record-layer tools: wearable and health exports, phone backups and their usage records,
desktop and application logs, and anything that turns one of those into a plain summary a
person can read. Nothing yet. This directory holds this file and no tool, deliberately: the
layout is placed before the tools land, because placing it afterwards is a rename across every
reference document, the tool permission, the capability declaration and the test suite.

## Rules that bind every file here

- **Python 3 standard library only.** No runtime dependency, ever, and no Node on any user
  path. ADR `0007` decision 10, and it is verified in a network-denied sandbox rather than
  asserted.
- **Every capability is declared.** A child process, an open-for-write, or anything resembling
  an outbound shape must appear in `../../allowlist.json` with a reason, or the rails test
  fails. The diff runs both ways: a declaration with no site behind it fails too.
- ⛔ **No outbound path.** Not a version check, not an update check, not telemetry.
- ⛔ **Nothing that touches another person.** No lookup, no profile, no location, no message.
  Structurally absent, not switched off. RAIL 2.
- ⛔ **Never open, preview, inventory, or hash intimate or sexual media.** Refuse at ingest by
  content class and route to counsel. No thumbnail, no hash-of-content, no *just check
  whether*. RAIL 6.
- 🔴 **Audit what the act of reading writes** before it runs. Opening a surface can join a
  person to it; following a per-recipient link writes a present-day entry into the audit log
  their lawyer wants clean. RAIL 9, and `capture-audit` is the precondition, not advice.
- **A record, never a verdict.** No total, ranking, count-of-consistent, percentage, score, or
  ordering by strength, in output or in a file name. RAIL 3.

## Where a tool is reachable from

The skill's tool permission enumerates one bounded pattern per depth of this tree. A tool at
`shared/<name>.py` is reachable. A tool buried deeper than the layout describes is **denied**,
on purpose, and widening that is a decision recorded in an ADR rather than a glob edit.
`tests/rails/allowlist.test.mjs` holds the check and the negative control.
