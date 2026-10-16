# 07: Adversarial self-audit

Every "helpful" finding gets attacked by an independent reviewer whose job is to break it. Most do not survive, and that is the value: **the findings that survive a genuine attack are the only ones worth handing a lawyer.**

---

## The loop
1. Analyst produces a finding.
2. **Independent** reviewer (separate context, no stake in the finding, explicitly instructed to destroy it) attacks it.
3. Survives → ships, with the attack's residue recorded as an honest limit.
4. Collapses → **the graveyard**, with the reason.
5. Partially survives → narrowed to what actually holds. Most common outcome.

## The graveyard is an asset, not a failure log
A written record of every theory that collapsed and **why**. It is one of the highest-value artifacts produced, because:
- it stops the same dead theory being re-derived every time someone new looks at the corpus;
- it tells the lawyer what has already been tested, so they do not spend money re-testing;
- an approach that collapsed for a *documented* reason is a decision, not an oversight.

Ship the graveyard. Do not hide it.

## ⭐ The benign-baseline test. Run this before anything else

**The corpus is its own control group. Use it.**

A system-service event found at a contested moment was first written up as "the service ran at that moment." Counting how often that same event occurred *elsewhere in the same corpus* showed it firing repeatedly and benignly on an ordinary day. The finding survived only after being rewritten around a genuinely unusual feature (a sub-second coincidence across two independent subsystems) rather than around the event's mere presence.

**The rule:** before any event is a finding, count its occurrences across the whole corpus outside the window. If it is common, its presence at the contested moment establishes nothing, and writing it up produces a "finding" that dies on the first question. After the other side has learned we thought it mattered.

Cheap, mechanical, and it should run automatically on every candidate finding, not be remembered by a human.

## Attack checklist, run against every finding
- **Benign baseline.** How often does this event occur elsewhere in the corpus? (above)
- **Provenance.** Which device produced this? Is it attributed correctly? (`01`)
- **Timezone method.** Which of the six anchoring techniques carried here, and is it recorded? (`01 §A`)
- **Independence.** Do these "separate" corroborating signals share a device, subsystem, or vendor? (`05`)
- **Timezone.** Is the offset *proven* for this specific source, or assumed?
- **Resolution.** Could the claimed event fit between samples?
- **Attribution.** Does this prove a *person*, or only a device?
- **Inversion.** What is the strongest reading of this same record *against* us?
- **Barred reasoning.** Does this argument rely on something inadmissible? (`06`)
- **Over-claim.** Does the wording say more than the data? Especially: does an *action* record get described as proving *content* or *actor*?
- **Verbatim check.** Is every quoted string byte-identical to source? Quotes drift when they get copied between documents, and a drifted quote can invert its meaning.
- **Self-inflicted harm.** Does writing this up *create* a problem that did not exist? (`06`)

## Two rules from real failures
**"Check my own work first."** When a number looks wrong, when something does not reconcile, when the user pushes back. The error is in our pipeline until proven otherwise. Never make the user locate our mistake, and never default to assuming their input was wrong. This happened enough to become a standing rule.

**Do not accept another reviewer's finding at face value either.** Automated and delegated reviews produce confident wrong answers. A reported defect gets verified against source before it is acted on. Including a reported defect in our own work. Corrections are made plainly and briefly; no re-litigating, no tallying.

## Product shape
- The report pipeline runs a **gate** before any output is shown: schema completeness, mandatory honest-limits, quote-verbatim check against source, independence-graph validation, barred-reasoning classifier. **Fail closed.**
- Gate results are logged per build. A passing gate is a record, not a vibe.
- **Render is the QA surface, not source.** A hard-won lesson: checking the source markup passes things that are broken in the rendered output, and flags things that render fine. Verify what the human will actually read, extract the text back out of the final PDF/HTML and check *that*.
- Keep the graveyard machine-readable and queryable, keyed by claim and layer.
