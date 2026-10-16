# The amendment ledger

🔴 **This file is the single record of what has been amended in `skill/data/tree.yaml` and what
has not.** `AGENTS.md` §7 is the *procedure*; this is the *history*. Nothing else may state how
many amendments have happened, or which are outstanding — point here instead.

**Why it exists at all.** Six files said *"three amendments are known-needed and all three are
the owner's"* after four had landed and the three outstanding ones had become different
amendments. Every one of those six was written before any amendment existed and none of them was
wrong when written. That is the shape: a prose copy of a value that moves. `AGENTS.md` §7 rule 5
already forbids a prose count *of the contract*; this file is the same rule applied to the
contract's own history, and it is safe to write down because **a landed amendment is historical
and cannot drift.** An outstanding one can, so it is named and never counted in prose elsewhere.

⛔ **Do not add a row here for work you are about to do.** A row means it is in the tree.

---

## Landed

Each is its own commit touching only `tree.yaml` and its regenerated `tree.json` / `tree.sha256`,
per §7 rule 1. **Owner sign-off was given for all four together**, in one decision, after the
report §7 requires.

| # | Nodes | Class | Commit | What it did |
|---|---|---|---|---|
| **A1** | `never:`, and the invariant header comment above it | 🔴 **barred class** — a `never:` entry | `b5a47e0` | Deleted `ask_what_happened`, `ask_who_was_involved`, `ask_what_was_alleged`. Added `ask_for_detail_before_naming_who_receives_it` and `write_volunteered_detail_where_the_person_was_not_told_it_lands`. ADR `0009` |
| **A2** | NEW `H0`, `H5`, `L12`; `H3.next` `H4`→`H5`; `meta.jurisdiction.wording_sites` gained `H0` and `H5` | structure | `0cfe0da` | A stage question that becomes the graph's first node, a device-exposure question after the exclusions, and the paperwork-in-hand record layer |
| **A3** | `X4` | 🔴 **barred class** — a hard exclusion | `dd4d539` | Rewrote *do not click links* so it permits reading one's own mail and forbids only the link and the attachment. Removed a stray unmatched `"` that had been rendering on screen |
| **A4** | `L2`, NEW `L2b` | wording **and** structure | `824f11d` | Split *"Did you have your phone with you? Is it Android or iPhone?"* into two nodes, because the second half was not capturable by any legal answer |

🔴 **A2, A3 and A4 are each RED ON THEIR OWN, deliberately, and this is not a defect to
"fix".** Rule 1 permits nothing in an amendment commit but the contract and its regenerated
files, so the engine words, the plain-language entries and the test fixtures each amendment needs
arrive in the commit after it. **`7f41a75` supplies everything all three named**, and its message
says which. A bisect that lands on one of the three finds a failing tree and that is the
procedure working, not breaking.

⚠️ **A2 declares its own deviation from rule 1** rather than taking it silently: three nodes in
one commit. Shipped separately, the tree would hold a question nothing consumes, or a record type
no question reaches.

### Two amendment facts worth carrying forward

- **`H5` sits after `H3`, not before, and the order is the safety property.** `X10` — *do not
  consent to anyone searching or taking your phone* — has to already be on screen. Asked first,
  somebody who has already let a device be looked at reads the question as an accusation. Asked
  after, it reads as the tool working out what it can safely do.
- **`L12` is a layer node, not a phase-0 guidance node, and that choice is load-bearing.** The
  plan derives entirely from nodes carrying a `layer:`. Guidance would have needed engine-side
  special-casing in a file whose stated rule is that nothing is hard-coded to a record type.

---

## Outstanding, and all of them are the owner's

⛔ **An agent may prepare the analysis. An agent may not make the edit.** The table is in
`AGENTS.md` §7, carried verbatim into `CONTRIBUTING.md`; it is not restated here, because two
copies of a live list is the defect this file exists to end.

Read them from `AGENTS.md` §7. They are labelled `Q4`, `Q5` and `Q6`, and none has been touched.

⚠️ **`Q4`, `Q5`, `Q6` are not "A5, A6, A7 waiting to happen."** They were identified before the
`A` series and are unrelated to it: one is a doctrine question for the owner with counsel, one is
a contract-level RAIL 3 exposure the rendering already works around, and one is a mode the engine
suppresses with a test asserting it until the contract encodes it.

---

## If a fifth `A` amendment appears needed

**Stop and report it.** §7's instruction has not changed and the `A` series does not soften it —
what changed is that the report has been made once and answered, so the answer is a precedent for
*that* set of four and nothing else. In particular, the barred class is still barred: hazard
wording, a hard exclusion, and a `never:` entry are the owner's whether or not a previous
amendment touched one.

**What a report needs**, from what worked: the node ids, whether each change is wording or
structure, which are barred class, what breaks in the commit before the fix arrives, and what the
change costs the person if it is wrong.
