# Methods, the transferred knowledge

**Read this first.** These eleven files are the reason the company can exist: a body of method learned the hard way inside a live, high-stakes matter, generalised to be reusable and stripped of every case fact.

⛔ **Case-fact gate applies to every file in this folder** (root `CLAUDE.md` RAIL 1). Placeholders only: `<SOURCE>`, `<DEVICE>`, `<WINDOW>`, `<PARTY>`, `<COUNTERPARTY>`, `<PLATFORM>`.

> **These files state rules, not schemas.** A method file gives you the rule, the reason, and the
> failure it came from. The implementing specifications, a manifest schema, a gate inventory, a
> classifier spec, belong with the code that implements them, in the repository that ships it, and
> are being written there rather than restated here. **If a rule and a spec disagree, the rule is the
> one that was learned the hard way.**

## ⚖️ These files are the engine. The law is not in them.

**Read this before relying on any legal statement here.** ADR [`0005`](../adr/0005-jurisdiction-layer-primary-axis.md) splits the corpus along one seam: a jurisdiction-neutral engine, and a forkable per-jurisdiction pack in [`../../jurisdictions/`](../../jurisdictions/). These eleven files are the engine.

Wherever a legal answer is load-bearing, the text carries an inline pointer:

> ⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/<file>.md`

⚠️ **The absence of a marker is not a guarantee of neutrality.** The practitioner experience behind every file here is Canadian, and exactly one line in the corpus ever said so. An unmarked legal assumption is most likely a Canadian one, and you cannot tell from the page which sentences those are.

⛔ **Zero packs are reviewed.** Not one, Canada included. So every marker currently resolves to an unanswered question, and the honest reading of any legal statement below is *"this is what one practitioner's experience suggested, unchecked."* The engine (custody, hashing, classification, adversarial audit, deliverable assembly) does not depend on that and transfers as written.

---

## The three-sentence version

An ordinary person already generates a dense, timestamped, multi-device record of their own life. That record is the only non-subjective evidence in most accusation cases (everything else is what somebody *said*) and it is **perishable**: retention loops overwrite it, exports expire, devices get seized, and the moment it is touched carelessly its integrity is gone. The product captures it, freezes it, classifies it against claims, and hands a lawyer something that survives cross-examination.

## What actually moved the needle, ranked honestly

| Rank | What | Why it mattered |
|---|---|---|
| 1 | **The retention race**. Preservation demands sent before overwrite | Highest-value action available at any moment. Some records live 14 days. A day late = the evidence never existed. `03` |
| 2 | **Multi-layer independent convergence** | One layer is arguable. Four independent layers agreeing is very hard to attack. `05` |
| 3 | **Chain of custody done properly at capture time** | Freeze-and-hash at the moment of capture is what separates *evidence* from *a file you might have edited*. Cannot be retrofitted. `02` |
| 4 | **Harm-first discipline** | The reason a lawyer trusts the output at all. `06` |
| 5 | **Platform-record forensics**: UI label ≠ underlying field | Turned an accusation resting on a screenshot into a demand for the authoritative host-side record. `04` |
| 6 | **Device-provenance attribution** | *Which* device produced a signal changes what it can prove. Ignoring this produces confident false claims. `01` |
| 7 | **Adversarial self-audit** | Killed more "wins" than it created. That is the point. `07` |
| 8 | **Precedent/base-rate calibration** | Calibrates expectations far more than it wins anything. `11` |

## What was research vs what was engineering

- **Engineering (transfers directly into product):** `01` layers, `02` custody, `04` platform records, `05` classification, `08` capture hazards, `09` filesystem traps, `10` deliverable assembly.
- **Research (transfers as *doctrine and guardrails*, not features):** `03` retention/legal-demand practice, `06` harm-first, `07` adversarial audit, `11` precedent calibration. These shape what the software is allowed to say and must be jurisdiction-reviewed, not hardcoded.

**A third cut, orthogonal to that one, and the one that decides what ships where**, ADR `0005`:

| Carries no jurisdiction seam | Carries one or more ⚖️ markers |
|---|---|
| `02` custody · `04` platform records · `05` classification · `07` adversarial audit · `09` filesystem traps · `10` deliverable assembly | `01` layers · `03` retention race · `06` harm-first · `08` capture hazards · `11` precedent calibration |
| Ships anywhere, as written | Ships with the marker visible, and the marked claim is unanswered until a pack is reviewed |

The left column is why this project transfers at all. **The right column is why it cannot be shipped as if it did**, and `11` is the extreme case: the whole layer is local, not a seam within it.

## The single most important non-obvious lesson

**Absence of a record is not evidence of anything, and neither is presence.** A quiet device does not prove nothing happened; a busy one does not prove something did. Every layer is a *cross-check on a claim*, never a proof of innocence. The instant the product implies otherwise it becomes a liability to the person paying for it. `06`, `05`.

## Files
| # | File | Subject |
|---|---|---|
| 01 | `01_evidence_layers.md` | The source catalogue: what layers exist, what each can and cannot prove |
| 02 | `02_chain_of_custody.md` | Freeze, hash, manifest, never-mutate-originals |
| 03 | `03_retention_race.md` | Retention windows, preservation vs search, standing and consent |
| 04 | `04_platform_record_forensics.md` | UI label ≠ database field; find and demand the authoritative record |
| 05 | `05_convergence_and_classification.md` | CONSISTENT / IN TENSION / SILENT; independence; convergence |
| 06 | `06_harm_first_doctrine.md` | Adverse-first output, honest limits, the double-edge |
| 07 | `07_adversarial_audit.md` | Attack every helpful finding; the graveyard |
| 08 | `08_capture_hazards.md` | How the act of reading creates evidence against the user |
| 09 | `09_filesystem_and_hash_traps.md` | The OS silently contaminates evidence sets |
| 10 | `10_deliverable_assembly.md` | Turning a corpus into something counsel will actually read |
| 11 | `11_precedent_calibration.md` | Base rates, graveyards, and why "wins" backfire |
