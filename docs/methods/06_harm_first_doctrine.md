# 06: The harm-first doctrine

**Why a lawyer will trust our output, and why a one-sided tool is worse than no tool.**

Every report leads with what cuts **against** the user, in the same detail and the same typeface as what helps. Not a disclaimer at the bottom. Not a "limitations" appendix. First, and integrated.

---

## Why

1. **Opposing counsel's first move is to find the layer you hid.** A report that concealed one is a report that discredits everything else in it, plus the person who commissioned it.
2. **A lawyer cannot use a partisan document.** They need to know the shape of the problem to make decisions. A cheerleading export gets binned, and the vendor who produced it does not get a second matter.
3. **The customer needs the truth to make life decisions**, not comfort. They are deciding how to plead, what to spend, whether to travel.
4. It is the honest thing to do, and this is a product for people whose liberty is at stake.

## Definition, get this right, it is easy to over-apply

**Harm-first means: surface the things that genuinely damage the user's position if the other side has them first.**

**The test:** *would the other side, having this, actually damage us on this specific claim in this specific window?*

**These are NOT harm and must not be dressed up as it:**
- A **missing or absent layer.** Absence is SILENT (`05`), not adverse.
- A gap **outside** the relevant window.
- **Sparse** own-evidence. Thin is thin.
- The user's own **casual estimates** conflicting with telemetry, zero evidentiary status; writing it up *creates* the inconsistency. This mistake was made twice in practice and is the single most important calibration in this file.

**These ARE harm and must lead:**
- A genuinely adverse **in-window** record, however small. One real event inside the window changes the honest characterisation of the whole window and must change the wording. The difference between *"no activity"* and *"no interaction, no movement, one background event"* is the difference between a statement that survives cross-examination and one that does not.
- An **admitted fact** that looks bad. Lead with it. Admitting the thing you cannot deny is what buys credibility for everything you do contest.
- A layer that **cuts both ways**: see below.
- A **plausible innocent explanation for the other side's account.** If the record is equally consistent with their version, say so.

## The double-edge, build it into the generator
Some layers help on one claim type and harm on another. The clearest example: a sleep layer is powerful against a presence or participation claim, and can cut **against** the user on claims where an unconscious person's capacity to consent is at issue.

**Handling:**
- Flag the double-edge on the layer, automatically, wherever that layer is used.
- **Never resolve it in software.** How prominently to rely on a double-edged layer is a legal strategy decision belonging to the user's lawyer. The tool flags and routes; it does not choose, and it does not quietly drop the layer either. Silently removing it is also making the decision.

## Two refinements that change how this is built

**Harm-first governs the artifact's internal structure, not the conversation's opening move.** A deliverable leads with adverse material. That does not mean the first thing a frightened person sees on screen is a list of what is wrong with their position. Structure the *document* adverse-first; sequence the *interaction* humanely.

**Build timelines from the record only. Never mix in the user's recollection.** And where a point rests on the user's word, the move is to **re-ground it** on a frozen third-party or operator mechanism, *not* to test the user's memory against the telemetry. Auditing the user manufactures an inconsistency that did not exist in the case and hands the other side something they never had. Re-grounding replaces a weak link with a strong one; auditing creates a new weakness. They look similar and are opposites.

## Reasoning the product must never generate

### The thirteen barred classes
Each class has a full specification. Input → forbidden conclusion, why it is barred, the surface
patterns that detect it, and the safe alternative, which belongs with the gate that implements it.
The classes themselves are the doctrine, and they are:

| | Class |
|---|---|
| **B1** | Prior sexual history / sexual propensity. The shield class, and it runs **both ways** |
| **B2** | Prior complaints, "they have accused before". Two-branch fork; **unproven is not false** |
| **B3** | Delay in reporting, staged or evolving disclosure |
| **B4** | Post-event behaviour, continued contact, demeanour |
| **B5** | Relationship-as-consent, broad consent, advance consent |
| **B6** | Character attack or motive narrative about the accuser (plus the tu-quoque check) |
| **B7** | Aggression inversion from a keyword hit |
| **B8** | Severity mismatch, "the rest of the record looks normal" |
| **B9** | Any medical, psychiatric, or involuntariness theory of the user, **counsel-only** |
| **B10** | Reasoning from the accuser's protected, therapeutic, or advocacy material |
| **B11** | **Absence of a record as a defence** |
| **B12** | Any argument whose predicate is an act by the counterparty or their circle |
| **B13** | Reception and audience prediction, how evidence "will play" |

### ⚠️ The gate can defeat RAIL 4 if built naively

A barred-reasoning gate that simply removes what it flags becomes **the mechanism of a one-sided report**, it satisfies itself by deleting adverse or double-edged material, which is exactly the failure harm-first exists to prevent.

**So it needs two independent verdicts, and both must pass:**
1. *Barred inference present* → **block**.
2. *Adverse or double-edged item present* → **required**; its removal is itself a violation.

A single-verdict gate will quietly optimise toward the flattering document.

### Two more build constraints
- **A deterministic rule set, never a model call.** Required for offline operation (RAIL 11) and for auditability. A court-facing gate whose behaviour cannot be enumerated is not a gate. It also means a false positive is cheap and a false negative is not, so tune toward over-flagging.
- **Counsel-only classes are not user-configurable.** No setting, no flag, no "advanced mode" turns B9 or B10 off.

### Every lever carries its downside, as a schema requirement
The self-destructive-if-won problem is not a warning, it is a data-model constraint. Every lever or argument object carries four **mandatory** fields (`if_won`, `if_lost`, `opens`, `base_rate`) and an empty one is a validation failure, exactly like `honest_limits`. Some mechanisms are pure arithmetic that a tool will otherwise reproduce every single time: a mitigation that succeeds entirely on its own terms while a parallel rule keyed on the offence's *maximum* penalty delivers the consequence anyway.
### The refusal list, and which half of it is local

Certain lines of argument are **never generated by this product, anywhere, as policy**, reasoning from a complainant's prior conduct, from their sexual history, from delay in reporting, from their behaviour after the event, or from their relationship with the accused, to conclusions about consent or credibility.

**The product must be structurally incapable of generating them.** No feature, no template, no prompt, no export.

Two independent reasons, and it matters which is which:

1. **They are wrong, and deploying them is affirmatively harmful to the case.** That holds everywhere and is why the refusal is project policy rather than a compliance setting. It does not depend on any jurisdiction's answer and cannot be switched off by one.
2. **In many systems they are additionally *barred by law***, with a defined consequence for raising them. **Which lines, on what authority, absolutely or only on application, is local, and nothing in this file states it.**

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/02_barred_reasoning.md`

⚠️ **Do not read the list above as a statement of any country's law.** It is the engine's refusal set, written from one system's practice, and no practitioner has checked it against any jurisdiction's authority. Including the one it was written in. A pack can only *add* to it. An empty pack means **unknown**, never *"nothing is barred here"*, and the engine's refusal stands regardless. ADR `0005`.

Also barred by policy here: characterising the accuser (motive narratives, "vindictive", "unstable"), and constructing any medical or psychiatric theory. Several such theories carry catastrophic downside for the person raising them and are counsel-only territory.

**This is not just an ethics rail, it is a correctness rail:** these arguments lose, and lose expensively.

## Product shape
- Report generator: adverse section **first**, same weight, not collapsible, not skippable.
- Every finding object carries a mandatory `honest_limits` field. Empty is a validation failure.
- A **classifier gate** over generated text for barred reasoning patterns, run before any render is shown to a user. **Deterministic rules, two independent verdicts, fail closed**, see above.
- Every lever/argument object validates `if_won`, `if_lost`, `opens`, `base_rate` as mandatory.
- Never characterise how a piece of evidence "will play" with a prosecutor, judge, or jury. Report the record as neutral fact. Warn about risky **actions** (`08`), never speculate about reactions.
