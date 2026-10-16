# 00: Review status · Canada

**⛔ Nothing in this pack has been reviewed by anyone. Every answer is `UNANSWERED`. It is a skeleton.**

It exists so that a consumer asking *"may I use the Canadian pack?"* gets a definite **no** instead of finding no file and guessing, and so that a Canadian practitioner has a specific question list to work through rather than a blank page.

---

## Declared state

| Field | Value |
|---|---|
| Jurisdiction | Canada (`ca`) |
| Subdivision | national, see the note below |
| Pack version | `0` |
| **Review state** | ⛔ **UNREVIEWED** |
| Reviewer role |  |
| Legal system | mixed, common law federally and in nine provinces; civil law in Quebec |

⚠️ **"National" is provisional and probably wrong for several files.** Criminal procedure is federal, but release-condition practice, premises-record practice, privacy statutes and law-society advertising rules are all provincial or territorial. Expect `ca/<province>/` sub-packs; a reviewer's first job is to say which answers are good nationally and which are not. Quebec differs on more than language.

`review.state` in `pack.yaml` must match this table exactly. If they disagree, the consumer trusts neither.

Three states, and only three:

| State | Means | A consumer may |
|---|---|---|
| `unreviewed` | No practitioner has read any of it | Use the engine only. Must say so on screen |
| `partial` | Some files reviewed, listed below | Use the reviewed files. Refuse the rest |
| `reviewed` | Every file read by a practitioner in this jurisdiction | Use the pack |

## Per-file review

| File | Reviewed | Reviewer role | Notes |
|---|---|---|---|
| `01_hazard_wording.md` | ⛔ no |   | 🔴 safety-critical, runs before any evidence advice |
| `02_barred_reasoning.md` | ⛔ no |   | |
| `03_demands.md` | ⛔ no |   | |
| `04_retention.md` | ⛔ no |   | |
| `05_entitlements.md` | ⛔ no |   | |
| `06_advertising.md` | ⛔ no |   | binds outward-facing copy |
| `07_examiner_line.md` | ⛔ no |   | |

## Reviewer identification, role only

⛔ **Never a name, a firm, initials, or a bar number.** Record a reviewer as:

> criminal defence counsel, 10+ years, practising in Canada, `<province or territory>`

That is enough for a reader to weigh the review and not enough to identify anyone. **Anonymity protects the reviewer at least as much as it protects the project, and it fails permanently and retroactively on the first mistake**. A name, once pushed, is in every clone and cache. A reviewer who wants public credit for the review can say so themselves, elsewhere; the pack is not the place.

## What is still unreviewed

**Everything.** No file in this directory has been read by a practitioner.

## ⚠️ Why an empty Canadian pack is the *most* misleading state in the project

The practitioner experience behind every document in `../../docs/methods/` is Canadian. Almost none of it says so. Exactly one line in the whole method corpus names Canada. So the corpus reads as jurisdiction-neutral while carrying unmarked Canadian assumptions, and this pack is where those assumptions were supposed to be checked. It has checked none of them.

Two concrete consequences a reader should hold onto:

- **A Canadian reader gets no more assurance than anyone else.** Unreviewed is unreviewed. That the text was written from Canadian practice is not a review.
- **A non-Canadian reader is at more risk here than they look.** The phase-0 hazard gate in `../../skill/data/tree.yaml` uses Canadian terms of art, so it reads as if it describes their paperwork when it may not. `01_hazard_wording.md` is the fix, and it is empty.

## Known gaps and open questions

The question list for the first reviewer. Ordered by what closes the biggest hazard first, not by ease.

1. 🔴 **`01_hazard_wording.md` in full.** `../../docs/triage/DECISION_TREE.md` already records that phase-0 wording has never had practitioner review. It runs before any evidence advice.
2. 🔴 **Whether a branching preservation tree crosses the unauthorised-practice line** in any province, `06_advertising.md` §3, row 4. A `yes` is a structural finding and needs an ADR, not a copy edit.
3. 🔴 **Whether storing a defence corpus with a third-party service weakens privilege**, `05_entitlements.md` §5. ADR `0001` rests on the answer.
4. **Every retention figure.** `04_retention.md` is empty and the engine's own clocks are unsourced *even for Canada*. Premises records (L6) first, routinely the shortest clock that exists.
5. **Whether a preservation request binds a private record holder at all**, and whether a person may send one themselves or only counsel, `03_demands.md`.
6. **The barred-reasoning list**, as public authority, with no citation drawn from any real matter, `02_barred_reasoning.md`.
7. **Where the examiner line falls per operation**, and whether legal aid or duty counsel can reach an examiner, `07_examiner_line.md` §2, §4.
8. **Which answers are national and which are provincial**, which decides whether this stays one pack.

### ⛔ One thing that is not a shortcut

This pack is filled **from public authority only**: published statute, reported decisions, regulator guidance. Not from notes, not from a matter anyone has worked on, not from a model's recollection.

That rule exists for two independent reasons. Material written inside a live matter carries facts that must never enter a public repository, and it cannot be laundered into one by paraphrase. And a citation nobody can re-check is worth nothing to the next reader. The point of a source column is that a stranger can verify the answer without trusting the reviewer.

## Changes

Newest first. **No absolute dates**. The gate's temporal class is strict with no exemption path. Use pack versions and relative phrasing.

| Version | Change | Reviewed |
|---|---|---|
| 0 | Skeleton created from `_template/`. No content, no review | ⛔ no |
