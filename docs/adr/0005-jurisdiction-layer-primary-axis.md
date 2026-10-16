# ADR 0005, The jurisdiction layer is a primary axis of the repository

- **Status:** Accepted
- **Scope:** How jurisdiction-dependent content is organised, declared, reviewed, and contributed
- **Does not decide:** which jurisdictions get packs, or in what order. That follows practitioner availability, not market size
- **Related:** ADR `0003` (§ "a vendor cannot keep the jurisdiction layer correct". This makes that structural), RAIL 3, RAIL 5, RAIL 7

## Context

Two facts about this corpus were true at once and neither was written down anywhere a reader would find it.

**First, the method is jurisdiction-dependent in at least fourteen places**: across `docs/methods/00, 01, 03, 06, 08, 11`, `legal/advertising_rules.md`, `legal/consent_and_scope.md`, `HONEST_LIMITS.md`, and `docs/triage/`. Each of those sites says, correctly, that the answer varies by jurisdiction and needs a lawyer. None of them said *which* jurisdiction the surrounding text assumes, and there was no directory, no coverage declaration, and no contributor path. The whole layer existed as a ten-row list of the right questions with nowhere to put the answers.

**Second (and this is the part that inverts the obvious reading) almost nothing in the corpus is explicitly Canada-specific.** Exactly one line names Canada (`docs/methods/06_harm_first_doctrine.md`, the barred-reasoning paragraph). The engine is jurisdiction-*neutral with unfilled holes*, not Canada-covered.

That distinction matters because it changes which claim is dangerous. "We cover Canada" is the false one. It would tell a Canadian reader the legal layer has been checked when no practitioner has reviewed a single line of it. The true and less comfortable statement is:

- **The lived practitioner experience behind every method document is Canadian.** So an unmarked jurisdictional assumption is *most likely* Canadian, and a reader elsewhere cannot tell which sentences those are.
- **Zero jurisdiction packs are complete or reviewed.** Not one. `docs/triage/DECISION_TREE.md` already states that the phase-0 hazard wording has never had practitioner review.
- A reader outside Canada opening `skill/data/tree.yaml` meets *"release or bail condition, undertaking"* (Canadian terms of art) and may reasonably conclude it describes their own situation. **That is the specific harm this ADR exists to prevent**, and it lands on the hazard gate, which is the one part of the tree that runs before any evidence advice at all.

A third pressure made the decision now rather than later: the concept already existed and had never been built. The planning documents behind this project have referred to a "jurisdiction pack" as a future artifact from the beginning. Leaving it as a plan while publishing the method corpus means shipping a legally-shaped document with its legal scope undeclared.

## Decision

**Split the corpus along one explicit seam: a common engine, and a forkable per-jurisdiction pack. Give the pack layer a top-level directory, a declared coverage state, and a template a contributor can fill without asking permission.**

1. **`jurisdictions/` sits at the workspace top level**, not under `docs/`. It is a primary axis of the repository, on a par with `docs/methods/`, and it maps 1:1 into the public repository.
2. **The engine stays where it is and does not move.** Method documents are not carved up. Each jurisdiction-dependent site is *marked in place* with an explicit pointer to the pack file that owns the answer. Moving the content would break the method narrative and produce eleven half-documents.
3. **A pack is unusable until a practitioner in that jurisdiction reviews it.** Every pack carries a `00_status.md` naming what was reviewed, by whom in role terms, and what is still unreviewed. The default state of every file in every pack is **UNREVIEWED**, and it is displayed as such, not as a footnote.
4. **Unmarked jurisdictional assumptions are presumed Canadian** until a pack states otherwise. This is written where readers see it, because the alternative is a reader assuming neutrality that does not exist.
5. **The coverage table never claims more than it has.** A pack with a skeleton and no review reads *Safe to rely on: **No***. So does a jurisdiction with no pack at all. The two states differ in what a contributor can pick up, not in what a user may trust.
6. **Contributors add their own jurisdiction as a first-class path**, pseudonymously, with no coordination required, `jurisdictions/_template/` copied to a country code. This follows directly from ADR `0003`: the legal layer must be forkable by practitioners, because no maintainer can keep it correct.

### The seam, verified per file

Not a taxonomy, checked against the actual documents.

| Transfers everywhere (the engine) | Jurisdiction-bound (the pack) |
|---|---|
| `methods/02` custody · `04` platform records · `05` classification · `07` adversarial audit · `09` filesystem + hash traps · `10` deliverable assembly, **zero jurisdiction mentions between them** | The barred-reasoning **list**. Canada's set reflects its own statutory scheme; another system bars a different set, or none |
| The *principle* that some reasoning is barred by law, and that you must establish which before generating anything | Phase-0 hazard **wording**, "undertaking", "release condition", and "deleting can be a separate offence" are terms of art, not descriptions |
| The retention **race**: find perishable records, order by clock, demand before overwrite (`methods/03`) | Whether a preservation demand has any **teeth**, and the demand templates themselves, already `legal/`, not code |
| Layer-catalogue **structure**, and the double-edge warning pattern (`methods/01`) | The consent and legality propositions inside it, and where the examiner-referral line falls |
| Precedent-calibration **method** (`methods/11`) | Its case-law source and citation format. CanLII is Canada-only |
| Harm-first doctrine · record-never-verdict · honest limits | Advertising and claims rules for legal-adjacent services |
| Retention *clocks* are platform-shaped, so mostly portable | …but region-varying, and currently unsourced and unverified **even for Canada** |

The left column is the reason this project transfers at all. The right column is the reason it cannot be shipped as if it did.

## Consequences

**Accepted costs:**
- **A visible zero.** The coverage table's honest state is "one skeleton, no review, nothing safe to rely on," and that is the first thing a lawyer evaluating this will read. Correct, and cheaper than the alternative, a reader who trusts an unreviewed hazard line and breaches a condition.
- **Reviewed content is the real recurring cost**, and it does not scale with engineering. `jurisdiction_matrix.md` already said launch order should follow where the review cost is lowest, not where the market is biggest. That now has somewhere to land.
- **Fourteen inline markers add friction** to documents that read cleanly today. The friction is the point: an unmarked seam is invisible exactly when it matters.
- **A `ca/` pack narrows the project's likely jurisdiction** and is therefore a de-anonymisation signal, however weak. Necessary for any pack to be useful, and it belongs in the Gate A conversation rather than in a commit message. Not decided here.

**Benefits:**
- The scope claim becomes checkable instead of implied.
- A contributor in another jurisdiction has a path that does not run through a maintainer.
- The wave-1 publish target stops being a legally-shaped document with undeclared legal scope.
- The forkability ADR `0003` asserted becomes a directory rather than a sentence.

## Rejected alternatives

- **Leave it as a research stub.** A checklist in a folder of checklists has no template, no per-jurisdiction storage, and nothing consuming it. A reader looking for "does this apply to me" will not find it there.
- **A single `LEGAL_SCOPE.md` disclaimer at the root.** One paragraph cannot mark fourteen seams, cannot hold a per-jurisdiction answer, and gives a contributor nothing to copy. It also fails the test that matters, the reader meeting Canadian vocabulary in `tree.yaml` never sees the root file.
- **Move jurisdiction content out of the method documents into the packs.** Breaks the method narrative, produces half-documents, and duplicates the transferable principle into every pack. Mark in place instead.
- **Complete the `ca/` pack first, then generalise.** Backwards: the shape of the template is what tells a reviewer what they are being asked, and a one-jurisdiction shape generalises badly. Also risks shipping "we cover Canada" before a practitioner has read a line.
- **Declare the corpus jurisdiction-neutral, since it barely names Canada.** The most tempting option and the most dangerous. Neutral-looking text written from one system's experience carries that system's assumptions unmarked; the hazard gate is where that gets someone hurt.

## Enforcement

- **`jurisdictions/README.md`'s coverage table is the single source of truth for what is claimed.** No other file may assert a broader coverage state; the README is the one to edit.
- **A pack file's review status is stated in the file**, not inferred from its existence. A file with content and no review line is treated as UNREVIEWED.
- **No pack content may be generated, inferred, or filled in by an agent.** Every cell needs a practitioner, per `jurisdiction_matrix.md`'s original rule. An agent may build the skeleton and mark the seams; it may not answer the questions.
- **Adding a jurisdiction-dependent statement to any method document requires the marker**, in the same edit.
- **RAIL 7 still binds the packs.** A pack describes what the law is, never what the outcome will be. `legal/advertising_rules.md` reaches every pack's `06_advertising.md`, and the lawyer-review step there has never run.
