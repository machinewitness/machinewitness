# 06: Advertising and claims rules · Canada

The local rules that constrain every outward-facing word shipped for this jurisdiction.

> **Review state: ⛔ UNREVIEWED.** Until `00_status.md` says otherwise, no copy has cleared this jurisdiction, and the project-wide policy is the only thing standing.

Project-wide policy: `../../legal/advertising_rules.md`. **That file is the floor, not the ceiling.** This file adds what local law requires on top; it can never relax the project-wide bans.

---

## The review step nobody can run alone

`../../legal/advertising_rules.md` § Review gate requires **three** steps for outward-facing copy:

1. `../../ops/casefact_gate.sh`, with the runtime denylist sourced from outside the repository
2. The claims checklist in that file
3. **A lawyer, per jurisdiction** ← this file's subject

⚠️ **Step 3 has never been run for any jurisdiction.** A green gate plus a clean checklist is *not* approval to publish copy. `pack.yaml` → `advertising.lawyer_reviewed` stays `false` until a practitioner in this jurisdiction has read the actual shipped words, not this page.

---

## 1. Who regulates this

| Question | Answer |
|---|---|
| Regulator for legal-services advertising | UNANSWERED |
| Does it reach legal-**adjacent** services | 🔴 UNANSWERED, the question that decides whether we are caught at all |
| General consumer-protection regulator | UNANSWERED |
| Any regime specific to software touching legal process | UNANSWERED |

⚠️ **Being nominally outside the rules is not a defence worth testing.** Project policy already assumes we are caught.

## 2. Outcome claims

| Question | Answer |
|---|---|
| Are outcome-suggestive claims restricted | UNANSWERED |
| For legal-adjacent providers specifically | UNANSWERED |
| Does a disclaimer cure it | UNANSWERED, usually not |
| Consequence of breach, factually | UNANSWERED |

**Banned project-wide regardless of the answer, in this language and in translation:** *acquit · cleared · exonerate · vindicate · win · beat the charge · prove your innocence · get the charges dropped · guaranteed.* RAIL 7.

**Say instead:** *preserve · freeze · verify · intact · unaltered · counsel-ready · before it is overwritten.*

🔴 **Translation is where this leaks.** A phrase that is merely encouraging in English can be an outcome promise in another language, and the reverse. List the local equivalents in §5. A translator without this list will reintroduce every banned claim.

## 3. Unauthorised practice

| Question | Answer |
|---|---|
| How is the practice of law defined here | UNANSWERED |
| Does producing a document or template cross it | UNANSWERED |
| Does explaining a procedure cross it | UNANSWERED |
| Does a decision tree that routes to categories cross it | 🔴 UNANSWERED. This reaches the triage tree directly |
| Any safe-harbour for self-help materials | UNANSWERED |
| Consequence, factually | UNANSWERED |

⚠️ **Row 4 can close a feature.** If a branching tree that tells someone which records to preserve reads as advice here, that is a structural finding. It belongs in an ADR and in `00_status.md`'s open questions, not in a copy edit.

⛔ **No interpretation of a user's conditions, anywhere.** `tree.yaml` → `never: interpret_users_conditions`. Route to counsel at the point the question arises.

## 4. Other local constraints

| Constraint | Answer |
|---|---|
| Mandatory disclaimers or disclosures | UNANSWERED |
| Restrictions on testimonials | UNANSWERED |
| Restrictions on comparative claims | UNANSWERED |
| Restrictions on approaching a person known to be under charge | 🔴 UNANSWERED. Several jurisdictions restrict this and it reaches distribution |
| Publication bans that could reach project material | UNANSWERED |
| Accessibility or plain-language requirements | UNANSWERED |

## 5. Locally banned terms

Local additions and translations. Copy into `pack.yaml` → `advertising.banned_terms`.

| Term | Why banned | Say instead |
|---|---|---|
|   |   |   |

## 6. Bans that hold everywhere

Recorded so a reviewer does not propose relaxing one.

| Never, in any jurisdiction | Rail |
|---|---|
| An outcome promise, in any language | RAIL 7 |
| Any statistic or implication about how common false accusations are | RAIL 8 |
| Gendered framing, say *anyone facing an accusation* | RAIL 8 |
| Any suggestion the tool can find, check on, or gather information about another person, including casual phrasing | RAIL 2 / ADR `0002` |
| A case study, testimonial, or example from a real matter, not anonymised, not composite, not with permission | RAIL 1 |
| A retention period stated as fact | RAIL 7 |
| Any price, tier, trial, account, or upgrade path | RAIL 11 |
| A testimonial from an accused person about their outcome | RAIL 7 |
| A contact mailbox for accused people | ADR `0003`. A person under investigation should not have to create a record of having sought help |

## 7. Copy reviewed for this jurisdiction

| Surface | Version reviewed | Reviewer role | Outcome |
|---|---|---|---|
|   |   |   | ⛔ not reviewed |

---

## Reviewer sign-off

| | |
|---|---|
| Reviewer role |  |
| Scope read |   |
| Still unreviewed | everything |

Copy the result into `pack.yaml` → `advertising`. ⛔ **`lawyer_reviewed` is set by recording an actual review above, never as a self-assessment.**
