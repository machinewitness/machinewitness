# `_template/`: what a contributor copies

⛔ **This is not a working jurisdiction.** It holds no tool, and the engine never offers it as a
choice: the jurisdiction options a person sees are derived by listing `jurisdictions/`
and dropping the template, so a directory named with a leading underscore can never be selected.
ADR `0008` decision 4.

## To add a jurisdiction

1. **The pack first, not the tool.** Copy `jurisdictions/_template/` to
   `jurisdictions/<code>/` and leave every answer `UNANSWERED`. A pack whose review
   state is not `reviewed` cannot supply wording to a person, and that is enforced rather than
   requested. ⛔ Do not answer a legal question while creating the skeleton, not from a
   neighbouring country and not from a search.
2. **Then this directory.** Copy this one to `../<code>/`, using **the same code as the pack**.
   Lower-case, and identical. Two spellings of one jurisdiction pair the tool with no pack.
3. **Then the tool**, if there is one to write. Many jurisdictions will have a pack and no tool
   at all, which is a complete and useful state: the pack is the part that helps somebody.
4. **A practitioner in that jurisdiction reviews the pack**, and the review state is recorded
   **in** the pack. ⛔ It is never inferred from the pack existing, and a reviewer is recorded by
   role only. Never a name.

## What a tool here may and may not do

**May:** fetch or read a legal source, index it, quote it with the source named, and record what
was retrieved and when relative to the person's own timeline.

⛔ **May not:** answer a legal question, infer an answer, fill an `UNANSWERED` field, characterise
whether anything helps or hurts the person, or produce a total, ranking, score, or ordering by
strength over anything.

The reason is not caution. A person who has been accused acts on what this prints, in the first
hours, usually before they have counsel. An answer nobody checked is worse for them than a blank,
because a blank sends them to a lawyer and a wrong answer does not.

## The rules

`../README.md` and `../../shared/README.md` carry them, and they are not restated here. A second
copy of a rule set drifts, and a prose copy of a contract is a defect this project has already
shipped twice.
