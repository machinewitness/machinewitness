# Architecture decision records

One file per decision: context → decision → consequences → rejected alternatives. Never delete one; supersede it with a new record and mark the old one Superseded.

| # | Decision | Status |
|---|---|---|
| [0001](0001-local-first-custody.md) | Local-first custody; the cloud never holds content | Accepted |
| [0002](0002-no-counterparty-surface.md) | No counterparty surface, enforced structurally | Accepted |
| [0003](0003-free-open-anonymous.md) | Free forever, open source, anonymous maintainership | Accepted, supersedes the commercial framing |
| [0005](0005-jurisdiction-layer-primary-axis.md) | ⚖️ The jurisdiction layer is a primary axis of the repository | Accepted |
| [0006](0006-mit-licence.md) | MIT for everything, verbatim, holder `Machine Witness contributors` | Accepted, supersedes `0003`'s copyleft clause only |
| [0007](0007-one-repo-agent-first.md) | One repository, agent-first: the skill is the product | Accepted |
| [0008](0008-tool-jurisdiction-axis.md) | ⚖️ The tool tree divides on the jurisdiction axis; a jurisdiction is selected at `init` | Accepted, supersedes the workspace repository list |
| [0009](0009-informed-disclosure-replaces-prohibition.md) | Informed disclosure replaces prohibition: the gate is who receives the words, not silence | Accepted, amends three `never:` entries |
| [0010](0010-path-persistence-gated-on-device-exposure.md) | Path persistence is gated on device exposure, not on a preference | Accepted, supersedes `0008` decision 5's opt-in and `AGENTS.md` §8.2 rule 1 |

**`0001`–`0003` are effectively permanent.** They are why the tool is safe for the person using it, verifiable to a court, and able to outlive whoever wrote it. Reopening any of them is a project-level decision, not an engineering one, and [`../../MANIFESTO.md`](../../MANIFESTO.md) is the reasoning of record.

`0005` makes `0003`'s *"a vendor cannot keep the jurisdiction layer correct"* structural: a common engine, a forkable per-jurisdiction pack in [`../../jurisdictions/`](../../jurisdictions/), and a coverage table that never claims more than a practitioner has reviewed, currently **nothing**.

`0008` extends that axis from *answers* to *tools*, and states the rule that governs both: **selecting a jurisdiction is not a claim that it is supported.** Zero packs are reviewed, so every selection lands in the degraded path and must say so on the screen.

`0009` is the first record to change the contract's `never:` list. It deletes the prohibition on asking a person what happened, and **replaces it with a condition rather than removing the protection**: the words may be asked for only after the person has been told who receives them, and nothing they volunteer is written anywhere they were not told it lands. 🔴 It also removes the doctrine that made **RAIL 4 impossible in principle** — harm-first is the one rail [`../../RAIL_MATRIX.md`](../../RAIL_MATRIX.md) records as absent, and after `0009` it is unbuilt rather than barred.

`0010` is the same shape of error as `0009`, found in the same session: a protection aimed at the wrong decision. Whether a file naming somebody's case folder is dangerous depends on whether a device of theirs may be looked at, so asking *them* to weigh it produced a default under which the ordinary outcome was a session that could not find its own folder. The engine now decides it from a contract question in phase 0, it fails towards not writing, and the screen that used to ask **states what was done** instead.

⚠️ **`0001` and `0002` say *customer*.** They were written while the project was still framed as a company, a paid product with a defence-firm sales channel. `0003` ended that. The vocabulary is historical and correct for an ADR, which records the reasoning of its moment; **it is not retro-edited**, and it is not licence to use that vocabulary in live documentation. There is no customer here and nothing to buy.

## Why the numbering has a gap

`0004` is not in this repository. It records how the project's own website is hosted and what makes a deploy public, operational detail about publishing *this project*, of no use to anyone reading it, and it cites internal files that are not published. The gap is deliberate rather than a missing file.

## Not yet written

Deterministic classification with no model call · desktop stack and reproducible builds · the practitioner-review pipeline for pack content (`0005` decides the structure, not who reviews or how).

`0007` decides the delivery surface for the triage tree, which this list previously carried as unwritten.
