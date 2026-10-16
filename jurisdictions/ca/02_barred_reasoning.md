# 02: Barred reasoning · Canada

Which lines of argument the law here forbids, and how the product must be structurally incapable of producing them.

> **Review state: ⛔ UNREVIEWED.** Until `00_status.md` says otherwise, the classifier gate runs on the engine's own default list only.

Engine side of this: `../../docs/methods/06_harm_first_doctrine.md`.

---

## Read this before filling anything in

**⛔ Name the class. Never write the argument.** RAIL 3, and it applies to this file with no exception. A pack that spells out a barred line of reasoning "for completeness" has published the thing the classifier exists to suppress, in a document that ships. Write `prior_conduct_to_consent`. Do not write the inference.

**⚠️ An empty `barred_classes` list means UNKNOWN. It never means "nothing is barred here."** A consumer treats the two identically (refuse the whole class) but a human reader will not, so say which one you mean.

**The engine's default is a refusal, and this file cannot widen it.** `../../docs/methods/06` bars a set of classes as *policy* regardless of local law, because they lose and lose expensively. This file can only narrow further, by adding what local law bars on top. Nothing written here switches a refusal off.

⛔ **Counsel-only classes are not user-configurable**: no setting, no flag, no advanced mode. Same file.

---

## 🔴 Canada-specific warning: the engine's default list was written from Canadian practice and has never been checked

`../../docs/methods/06_harm_first_doctrine.md` carries a refusal list, prior conduct, sexual history, delay in reporting, post-event behaviour, relationship between the parties, each reasoning toward consent or credibility. That list came out of Canadian practice, and until recently the method document asserted it as Canadian law.

**It is now stated as what it actually is: the engine's project-wide refusal set, unverified against any authority.** The refusal holds everywhere on policy grounds (those arguments are wrong and they lose) and nothing in this pack can switch it off.

So the Canadian reviewer's job here is *not* to re-derive the list. It is to answer the questions below on public authority, and in particular to say **where the engine's list is wrong or incomplete for Canada**, a class it misses, a class it names that is not actually barred, or one that is barred only on application rather than outright. A reviewer who reads the list and nods has added nothing.

## 1. Does a barring regime exist here?

**Answer:** UNANSWERED, `"yes" | "no" | partial`

If `no`: say so explicitly rather than leaving it blank, and note whether the same lines are excluded by a general relevance or prejudice rule instead. "Not specifically barred" and "freely available" are very different answers.

## 2. Authority

Public statute or reported authority only. ⛔ **No matter you are working on, no unreported decision you have seen, no charge combination, no file number.**

| Class of authority | Citation | Notes |
|---|---|---|
| Statute | UNANSWERED | |
| Leading authority | UNANSWERED | |
| Procedural rule | UNANSWERED | |

⚠️ Cite only what the doctrine needs. A *set* of sections is a fingerprint to anyone holding the paperwork even with no name, date or event attached, root `CLAUDE.md` §6, finding 3.

## 3. Barred classes

Class labels only, in `snake_case`, with a one-line gloss that describes the *shape* of the inference without performing it.

| Class label | One-line gloss | Barred by | Absolute or on application? |
|---|---|---|---|
| UNANSWERED | | | |

Classes to check for, as a prompt list. This is a checklist of *questions*, not an assertion that any of them is barred in your jurisdiction:

- reasoning from a complainant's prior conduct to consent or credibility
- reasoning from sexual history
- reasoning from delay in reporting
- reasoning from behaviour after the event
- reasoning from the relationship between the parties
- use of a complainant's private records held by a third party
- character or propensity reasoning about either party
- reasoning from a protected characteristic

## 4. Procedure, where a barred line can be raised on application

Some systems bar a line of reasoning outright; others allow it only through a defined procedure with notice, a hearing, and a threshold. If the latter, describe the route in terms of who does what, **counsel's territory, never a product feature.**

| Question | Answer |
|---|---|
| Is there an application route | UNANSWERED |
| Who may bring it | UNANSWERED |
| Notice period | UNANSWERED (state as a duration) |
| Does the product have any role | **No.** Route to counsel |

## 5. Additional local bars on the product's own output

Anything the product must not generate here that the engine's list does not already cover, a claims restriction, a professional-conduct rule, a statutory publication ban that reaches a document handed to counsel.

- none recorded yet

## 6. Barred by project policy regardless of local law

Recorded here so a reviewer does not propose them. Not open for local variation.

| Not generated, anywhere | Why |
|---|---|
| Characterising the accuser, motive narratives, *"vindictive"*, *"unstable"* | RAIL 2 and 3. Also loses |
| Any medical or psychiatric theory about either party | Catastrophic downside; counsel-only |
| Anything touching the counterparty at all | RAIL 2 / ADR `0002`: structurally absent |
| Any statistic about how common false accusations are | RAIL 8 |
| A verdict, score, strength, or prediction | RAIL 3 |

---

## Reviewer sign-off

| | |
|---|---|
| Reviewer role |  |
| Scope read |   |
| Still unreviewed | everything |

Copy the result into `pack.yaml` → `barred_reasoning` and `capabilities.barred_reasoning_list_available`.
