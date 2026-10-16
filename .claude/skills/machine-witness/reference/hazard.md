# hazard, establish which paths are closed, before anything else

**Purpose:** run the hazard gate (`H1`–`H4`, every hard exclusion, then `O1`–`O5`) so the
person knows what not to touch before they are told anything about evidence.

**Backed by:** `skill/data/tree.yaml` → `phase_0_hazard`, `phase_0c_positive_obligations` ·
the engine at `skill/scripts/triage.py` · `docs/methods/08_capture_hazards.md` ·
ADR `docs/adr/0007-one-repo-agent-first.md`

**Rails in force:** 2 · 9 · and the standing refusal to interpret anyone's conditions.
`RAIL_MATRIX.md` is the only statement of what is actually enforced; nothing here may claim
more.

---

## 🔴 The engine owns the flow. This file does not.

**Do not walk the gate from this document.** Run the engine and relay what it prints:

```
python3 .claude/skills/machine-witness/scripts/triage.py begin
python3 .claude/skills/machine-witness/scripts/triage.py answer <the person's exact reply>
```

The engine reads the contract, verifies its digest, resolves each edge from the contract's own
`branch`/`next` keys, validates every answer against that node's `options`, and writes the
state. It emits **one screen at a time**. You print that screen and pass back exactly one
answer.

Why the split is structural rather than stylistic: a prose version of this gate was written for
an agent to follow, and a probabilistic reader showed the stop list *before* the question that
establishes whether anything restricts the person at all, then collapsed and dropped questions
further down. That is not a wording defect. It is evidence advice handed out before anyone knows
which paths are closed, which is the exact route by which somebody breaches a condition while
trying to help themselves.

So the node ids below are **a map for you**, not a script. Every one of them is named here so
you can tell whether the engine is where you think it is, and **none of their wording is
reproduced**, because a copy of a question drifts from the question.

⛔ If the engine refuses, relay the refusal verbatim and stop. Do not work around it, do not
paraphrase it into something gentler, and do not perform the step by hand.

---

## What the gate establishes, in the order the contract routes it

| Node | Establishes | What it is for |
|---|---|---|
| `H1` | Is there anything at all restricting what this person may do or where they may go, including a non-criminal directive from an employer | Everything downstream depends on it. `no` still proceeds; the exclusions are unconditional |
| `H2` | Whether the restriction includes no-contact, non-association or stay-away terms | Reached only when `H1` was not a flat `no`. Sets the flag that **closes** capture paths |
| `H3` | The hard exclusions, the things that get people in trouble | Displayed unconditionally, on **four screens**, before any question about evidence |
| `H4` | Whether counsel is engaged | Narrows the whole plan when they are not. See below |
| `O1`–`O5` | Positive obligations: whether anything requires the person to **do** something, and on what schedule | A whole class of breach that has nothing to do with forbidden acts |

**⛔ The order is the contract's, not this table's.** The table is in contract order at the time
of writing and is *not* the source of that order, the engine resolves each edge from
`branch`/`next` and a route test rejects any reordering. If this table and the engine ever
disagree, the engine is right and this table is a defect.

### `unsure` fails safe, and the contract is what makes it fail safe

At `H1`, `H2` and `O1`, an `unsure` answer sets the **cautious** flag and routes to the
cautious side. That is written into the contract's own `branch` entries; the engine applies it
as written and decides nothing. Treat `unsure` in conversation the same way: it means *assume
the restriction exists until a lawyer says otherwise*, never *probably fine*.

### `H4`, and what having no lawyer narrows

`no` or `in progress` sets `plan_mode: preservation_only`. Say the consequence plainly and
without hedging: until they have a lawyer, this helps them **save** things. Saving is the part
with a deadline. Anything that means contacting a third party, or interpreting what a record
means, waits, doing it unsupervised can hurt them.

⚠️ **The contract does not yet encode what that mode suppresses.** `H4` sets the flag, but no
action or output block declares what it rules out. The engine hard-codes the suppression with a
test asserting it, and the gap is recorded as a known-needed contract amendment that belongs to
the owner (`AGENTS.md` §7, Q6). ⛔ Do not close that gap yourself, in either direction: do not
amend the contract, and do not decide in conversation that some other action is fine after all.

---

## The four stop screens

One idea per screen, under a heading, each ending in a single acknowledgement, and **all four
before the first question about evidence.** Grouping is what makes the list readable; it is not
what makes it optional.

🔴 **Count the exclusions from the contract, never from prose, including from this file.** Two
documents in this project said *seven* long after the list reached fourteen, and a builder
trusting either would have shipped a gate missing *do not consent to a device search* and
*replying can be the breach*. The engine derives both numbers it prints, the total from the
contract's own item list, the screen count from its verified grouping table, and refuses to
start if any item the contract holds is on no screen. `tests/contract/exclusion-grouping.test.mjs`
plants a violation in each direction and requires that refusal.

**Which items sit together is design and may be re-cut. The items themselves are contract.**
⛔ An agent may never amend, shorten, merge, reorder for brevity, or "clarify" an exclusion, its
reason, or a `never:` entry.

Two properties of the rendering that matter to you when you relay it:

- **Every item's reason prints with the item, on the same screen.** The reason is the part that
  changes behaviour. An exclusion with its reason stripped reads as an arbitrary rule, and an
  arbitrary rule is the one people talk themselves out of.
- **A skimmed exclusion is an absent exclusion.** Do not summarise a screen, do not offer to
  skip ahead, and do not compress four acknowledgements into one because the person seems to be
  in a hurry. They are in a hurry. That is the condition this gate was built for.

⚠️ **Shame drives deletion, and deletion is the worst available move.** At least one exclusion
exists solely because of it, *not even one that embarrasses you*. Expect the impulse, and do
not soften the answer to make the moment easier.

---

## `O1`–`O5`, the obligations half, which is easy to forget entirely

**Failing a duty is a breach exactly like doing a forbidden thing.** An earlier version of this
tree asked only about prohibitions, which left a whole class of breach unmentioned: report,
notify a change of address, surrender an item, attend somewhere, keep in touch with someone.

The five nodes surface the category, ask whether anything is on a schedule, and then say three
things: put every required act and its date somewhere it cannot be missed; keep proof of every
act performed, **and of every failed attempt, written down the same day**, because a genuine
attempt to comply is evidence that disappears if nobody records it; and ask a lawyer before a
date passes rather than after.

⛔ **The category is surfaced. The obligation is never interpreted.** Whether a particular
paragraph requires a particular act on a particular day is a legal question, and this tool does
not answer one.

---

## ⛔ Never interpret, never adjudicate

This is the whole discipline of the gate, and it is easy to break while being helpful.

- **Never say whether something is, was, or would be a breach.** Not "that sounds fine", not
  "that is probably a breach", not "technically yes but". A frightened person will act on it.
- **Never read their paperwork for them**, summarise it, classify it, or tell them what a clause
  covers. The gate's job is to learn *which options to leave out* and route the rest to counsel.
- **Never ask for detail before they have been told who receives it.** The contract barred those
  questions outright until ADR `0009`; what changed is that the gate is now the disclosure rather
  than silence. ⛔ **The gate itself still does not need any of it**, and asking here buys
  nothing: what it is working out is which options to leave out, and that comes from the answers
  in front of it. Whatever a person volunteers goes nowhere near a file unless they were told
  which file first.
- **⛔ Never surface anything about the other person**, where they go, what they use, when they
  are somewhere. Not as context, not "so you know what to avoid". `docs/methods/08_capture_hazards.md`
  is explicit that **our own output is a knowledge-acquisition vector**: a condition can bite on
  knowledge acquired only because of the accusation, so a helpful-looking "here is what to steer
  clear of" makes the condition bite harder than before they opened this.
- **A legal question gets named as one**, told that nobody has reviewed the answer for their
  jurisdiction, and routed to counsel. `skill/reference/jurisdiction.md` reports what is
  unanswered; it never supplies an answer.

---

## ⚖️ The wording is unreviewed. Everywhere. Including where it came from.

`meta.jurisdiction` in the contract records `assumed: ca`, `reviewed: false`, and names the
three sites whose vocabulary a pack may replace: `H1`, `H2`, and one exclusion. While
`reviewed` is false the engine prints an unreviewed-wording note at every one of those sites,
**every time**: not once, and not only on the first.

**Being the source jurisdiction buys a reader nothing.** The practitioner experience behind this
gate is Canadian, so `H1` asks about a *"release or bail condition, undertaking"*, terms of
art, not descriptions. **No practitioner has reviewed that wording for any jurisdiction,
Canada included.** `jurisdictions/ca/01_hazard_wording.md` exists as a skeleton whose answers
are `UNANSWERED`, and `jurisdictions/README.md` is the single source of truth for what the
project claims. ADR `docs/adr/0005-jurisdiction-layer-primary-axis.md`.

⛔ **An agent may never amend hazard wording.** Not to make it read better, not to localise it,
not because a person said none of those words match their paperwork, and not by inference from a
neighbouring country. Only a **practitioner-reviewed pack** may supply alternative vocabulary,
and none exists.

**And losing the question would be far worse than mismatched words.** So when someone does not
recognise the terms, the answer is not to reword the question. It is the note the engine
already prints: the question still applies, read it as *anything at all restricting what you
may do or where you may go*, answer as best you can, and ask a lawyer. Then move on.

---

## Closed paths, and the file that records them

What `H2` and `H4` establish is not advice. It is a set of capture paths that are **shut** for
this person, and the workspace records them so the person and their lawyer can both see what was
left out and why.

⛔ **`closed-paths.md` carries closed paths and the reason for each, and nothing else.** No
account of what happened. Nothing about anyone else. No dates. No narrative about the matter.
Each line traces to an answer the person gave and, where the contract carries a warning for that
record, to the contract's own words. Never to a reading of their conditions. The engine writes
that file; a workspace test asserts the answers themselves do not leak into it.

Two things this earns, and both matter to a lawyer:

1. **A path left out on purpose is visible as such**, rather than looking like an oversight or
   like the tool quietly deciding something.
2. **Nothing suppressed is hidden.** A record that is closed to the person is still named, with
   its reason, in the same detail as one that is open.

---

## The doctrine underneath: reading can create evidence

`docs/methods/08_capture_hazards.md` is the reasoning of record, and it is worth having in mind
while relaying this gate, because it is why several exclusions look excessive and are not:

- **Opening a surface can join the person to it.** A read becomes a contact.
- **A link in a notification often carries a key unique to its recipient.** Following it writes
  a present-day entry into the very third-party record their lawyer is about to ask for.
- **A read receipt, a "seen", a presence update and a profile view are all contact artifacts**,
  and all of them are produced by looking rather than by doing.
- 🔴 **Remediation notifies.** The most under-stated hazard in the whole set. Leaving a group
  notifies the group. Un-sharing notifies. Cancelling notifies the organiser and can remove the
  person from a channel in a way the other side sees. **The instinct to clean up is the instinct
  to generate a dated, attributable, adverse event.**
- **The safest path is almost always an artifact they already hold**. Their own inbox, their own
  files, their own completed account export. Zero live surface, zero hazard.
- ✅ **And the corollary, which is easy to miss:** reading their own already-captured archive is
  **not** contact, and a record showing an application was never opened across a window is
  positive evidence of not-doing. The rails must not over-block. It is the live surfaces that are
  dangerous.

Anything that touches a live surface goes through `skill/reference/capture-audit.md` first.
what the act of reading **writes**, and that is a precondition, not advice.

---

## What this gate does not do

- **It does not decide anything about the person's situation.** It sorts capture paths into open
  and closed, and hands the rest to counsel.
- **It does not produce a verdict, a score, a total or a prediction.** Not here and not anywhere
  downstream.
- **It does not print an unconditional "get a lawyer" screen of its own after the stop list.**
  The engine leads the plan with counsel when `H4` says there is none, and that is currently the
  only place it says so. ⚠️ **Do not supply the missing line yourself.** Authoring screen text is
  how a relay turns into a flow, the wording involved is jurisdiction-flavoured, and both the
  contract amendment and the copy belong to the owner. Say it in your own voice as an assistant
  if it is true and needed, but do not present it as part of the gate.
- **It is not a substitute for the plain-reading path.** `docs/triage/DECISION_TREE.md` is the
  human-readable form of the same tree, for someone with no agent at all.

**Honest standing:** `HONEST_LIMITS.md` and `skill/reference/limits.md` carry the same discipline
toward the person, say what this cannot establish, unprompted, before they rely on it.
