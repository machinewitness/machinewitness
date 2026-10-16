# ADR 0007, One repository, agent-first: the skill is the product

- **Status:** Accepted
- **Scope:** Repository shape, the human interface, who owns the triage flow, where matter facts live, what v0 contains, and how the rails are checked
- **Supersedes:** nothing. ADRs `0001`–`0006` stand unchanged
- **Does not decide:** whether anything is published. Gate A is untouched and every wave of this restructure ends private. It also does **not** amend `../../skill/data/tree.yaml`; that is a contract change with its own procedure, recorded in `../../AGENTS.md` and `../../CONTRIBUTING.md`
- **Related:** ADR `0001` (local-first. The tension this record has to name out loud rather than smooth over), ADR `0002` (*"structurally incapable, not policy-restricted"*. The standard decision 4 is measured against), ADR `0003` and `0006` (free, offline, MIT), ADR `0005` (the jurisdiction layer, which this restructure must not "help"), `../../skill/data/tree.yaml`, and the rail matrix, `RAIL_MATRIX.md`, which lands at the repository root in the first wave of the restructure

## Context

The project is two private repositories: a documentation repository holding the manifesto, the method corpus, the ADRs and the triage contract, and a second repository holding three working agent skills. **The split encodes *doctrine versus tooling***, and that boundary is the defect, not the organising principle. A visitor arriving at either one had no route to the other, and neither one was something a person in trouble could *run*.

Underneath the repository shape sits a larger misreading of who the reader is.

**The corpus was written for a human reader who will never read it.** Every method document, every marker, every honest-limits paragraph assumes someone sits down and works through prose. The person this exists for has been accused, has perishable records, and has roughly two weeks before the material that could corroborate them is overwritten. They do not read eleven method documents. **The actual reader is an agent acting for them**, and an agent reads a corpus far better than a frightened person does, on demand, at the moment a specific question arises.

That inverts the deliverable. The method knowledge stops being the thing shipped *to* the user and becomes the justification layer *behind* something executable.

A third input made the shape concrete rather than aspirational: a separate project on this machine demonstrates the working form end to end, one repository holding a skill directory as source, commands as the interface, generated per-provider trees, a plugin and a CLI over the same scripts, and rails expressed as tests. Nothing here needs inventing; it needs deciding, because the standing rule is that **an architecture change gets an ADR, not a paragraph edited into a method file.** This change moves the centre of gravity from a document corpus to an executable skill, kills a repository, introduces a new structural boundary in the case workspace, and puts a deterministic engine between the agent and the contract. A future session reading only the tree would re-derive all four and guess wrong on at least two.

⚠️ **One further fact, discovered rather than assumed, reshaped the whole plan.** The first draft wrote the flow as an agent playbook: a Markdown walkthrough the model reads and follows. It does not work, and the reason is not quality of prose. A probabilistic reader degrades turn order, branch selection, resumability, write containment and refusal into *suggestions*. The draft demonstrably showed `H3` before `H1` while claiming to render the contract unchanged, collapsed eleven separate layer questions into one invented list, dropped `L3`, `L8`, `L10` and `L11` outright, invented five layer types that do not exist, and rendered only `O1` while labelling the screen `O1`–`O5`. **RAIL 2's own standard is "structurally incapable, not policy-restricted", and the draft failed that standard at the exact centre of the product.**

## Decision

**One repository, whose product is an executable agent skill driven by a deterministic offline engine over the existing triage contract. The method corpus becomes the justification layer the agent loads on demand.** Ten decisions, each recorded because each is expensive to reverse later.

**1. One repository.** `machinewitness` absorbs `mw-skills`, which is **archived, not deleted**. The name stays reserved and the private history stays intact. The doctrine/tooling boundary that the split encoded is the framing being rejected, so the split goes with it.

**2. `skill/` is the single source of truth. `.claude/`, `.codex/` and any later provider tree are generated artifacts.** A hand-edit of a generated tree is a defect, and the build detects it via content hashes and a freshness test. Provider outputs diverge silently otherwise, and the divergence is invisible until a user on the wrong provider gets a different flow.

**3. 🔴 The human surface is one command.** `/mw` runs `init`. No argument produces the flow, never a menu. A command table is a *recall* interface, and acute stress removes recall first. The eleven-command vocabulary below is **the agent's**, not the human's; an expert typing `/mw freeze` gets `freeze`, and a frightened person never learns that the table exists. This is a deliberate inversion of the routing rule the reference project uses, whose user is a developer with a goal rather than a person in trouble.

**4. 🔴 A deterministic offline engine owns the flow. Not prose.** The engine, `triage.py`, which lands under the skill's own script directory in the wave that builds it, is the **sole reader and writer of triage state**: traversal, branch order, resumability, refusals and path containment all live there. The command reference file invokes it and relays its output, owns nothing stateful, and must not decide, reorder, summarise, or improvise. This is decision 4 because of the finding in the context section: prose cannot enforce a state machine, and a live walkthrough proves only that one model run behaved.

**5. 🔴 `tree.yaml` is the program, not a wording source.** Traversal follows its `branch`/`next` edges mechanically and renders its fields verbatim. **A new question, option, or layer type is a contract amendment. Never UI prose.** Route tests reject any reordering; a node-coverage test enumerates the graph and fails on any unrendered node, which is what makes the four dropped `L` nodes and the four missing `O` nodes impossible to repeat.

**6. No YAML at runtime.** The build emits `tree.json` plus `tree.sha256`; the engine reads the JSON, verifies the digest, and **refuses on mismatch**; CI asserts that the JSON is equivalent to the YAML. Python's standard library has no YAML parser and the dependency policy is zero runtime dependencies. An ad-hoc parser would make contract fidelity brittle at the one place fidelity is load-bearing.

**7. 🔴 The case workspace lives outside the install path.** RAIL 1 bars matter facts from *this repository*, not from the user's own machine, so the boundary has to be structural rather than a rule in a document.

- `init` scaffolds a workspace at a path the user names, **asked, defaulted, and confirmed back as a resolved absolute path**, `chmod 700`.
- ⛔ It refuses a path inside the install tree, by resolved-prefix comparison.
- ⛔ It refuses a cloud-sync root or network volume by **mount properties and resolved symlinks**. Never by brand name, because four brand names miss every custom sync root.
- ⚠️ **`.gitignore` is not a security boundary and is not described as one.** It does not stop a forced add, a parent repository, a backup tool, a search index, or another agent. The screen says so, and states the residual risk in a sentence rather than implying safety.
- ⛔ **`MATTER.md` is never read into an assistant prompt.**

**8. v0 is eleven commands: `init` `hazard` `triage` `clock` `layers` `capture-audit` `freeze` `verify` `limits` `jurisdiction` `gate`.** Ten are deferred and one is cut outright, and `DEFERRED_V1.md` records the reason for each. **Each was a defect, not a trim**. Two were overriding a recorded no-ship with a warning, one is structurally blocked because it needs a stated allegation and the contract forbids asking for one, three are downstream of that one, one reformats a disk with nothing yet to carry, and the one that was cut had no method behind it at all. The v0 ceiling is eleven; a twelfth needs a method document, a rail-matrix row, and a wave.

**9. The rails are checked by executable tests plus an honest matrix, and the honest count is stated rather than implied.** For v0: **six enforced (RAILS 2, 5, 7, 9, 10, 11. Four partial) RAILS 1, 3, 6, 8. One deferred with its feature. RAIL 4**, whose target (`report`) does not exist in v0, so its row lands red rather than green. ⛔ **No rail may be described as enforced until its matrix row is complete**, with a positive invariant, a violating fixture and a runtime test that executes the thing and asserts side effects. **RAIL 2 is enforced by a positive allowlist** of commands, subprocesses, endpoints, data sources and writes, not a word ban, because the banned verbs necessarily appear in the rails and fixtures that forbid them, which makes a repository-wide word scan either impossible or toothless. Vocabulary linting survives as a separate copy check.

**10. Node is a build tool only.** Every script on a user path is Python 3 standard library, and **offline is verified rather than asserted**. The full flow runs in a network-denied sandbox covering the generated provider trees and the CLI, not merely the script directory. The first draft allowed a Node entry point in a user path, copied from the reference project, while claiming Python-only.

## Consequences

**What changes, stated plainly:**

- **The method corpus stops being the deliverable and becomes the justification layer.** Not demoted, every command cites the document behind it, and the corpus is what makes the tool defensible, but **nobody has to read it to be helped.**
- **A human with no agent is served by exactly one path: the plain-reading triage, which is agent-free forever.** It is not a degraded mode and it does not acquire a dependency later. Someone holding only a phone, in a cell, or with no tooling at all still gets the hazard list and the clock.
- **One repository means one blast radius.** One gate, one CI, one licence file, one place a matter fact could land. That is a benefit for coherence and a cost for containment, and it is accepted knowingly: the previous shape's only real virtue was that a mistake in one repository was not a mistake in the other.
- **The rails become falsifiable, which cuts both ways.** A failing rail test blocks a wave. That is the point, and it will be inconvenient at exactly the moment it matters.
- **ADR `0005` is untouched and gets no relief from this.** ⛔ An agent may build a pack skeleton and mark seams; it may never answer a legal question in a pack. `UNANSWERED` stays the correct value, and `jurisdiction` reports review state and every unanswered question without ever supplying one.

### ⚠️ The tension with RAIL 10 and RAIL 11, written down rather than smoothed over

**RAIL 10 is local-first and RAIL 11 forbids telemetry, but the agent driving the session is usually a remote commercial service.** The files never leave the machine; **what the user types to the assistant goes to whoever runs the assistant.** Those two sentences are both true at once, and the first draft printed only the first one (*"nothing you type leaves this machine"*) which was simply false, and is the same defect as the landing page's absolute privacy claim.

Four things follow, and all four are decisions, not caveats:

1. **Screen 0 says so, in the user's words, before anything else.** Files stay local; what you type to the assistant goes to whoever runs the assistant.
2. **The flow never asks what happened, who was involved, or what was alleged.** This is not a new promise. The contract's `never:` block already forbids all three. The engine exploits a guarantee that already exists: **the tool does not need the facts** to tell someone which records about them are dying and in what order.
3. **`MATTER.md` never enters an assistant prompt.** The one file that does accumulate matter detail is written by the engine, read by the engine, and never placed in a transcript.
4. **The plain-reading path stays complete enough to be useful alone**, which is what makes the honesty survivable. A person who reads sentence 1 and decides not to involve a remote assistant is not left with nothing.

Honesty plus not asking for the facts achieves more here than a warning does, and materially more than the rejected alternative of requiring a local-only runtime.

### ⚠️ Two rails cannot be fully enforced at v0, and this record names which and why

**RAIL 1, the structural gate cannot catch a proper name.** Plant a real surname in a file and the gate prints `✅ PASS`. **This is verified, not assumed**: it was true for the entire life of one file that carried a counsel surname, and the gate reported clean throughout. The structural classes catch identifier *shapes* (dockets, badges, addresses, dates) and a name has no shape. The missing half is the runtime denylist of real values, which by design **must live outside every repository** (committing it would import exactly the leak it exists to prevent). **It is unwritten, and writing it is the owner's, not an agent's.** Until it exists, RAIL 1 is structurally half-checked, and no publication step may treat a green gate as a clean tree.

**RAIL 6: the rail contradicts physics.** It requires that a source which may contain intimate or sexual media be frozen **unopened**, with no preview, no thumbnail, no hash of content. But **copying a container reads its bytes, hashing it hashes those bytes, and the content class cannot be established without either inspecting content or trusting a user classification that is incomplete by construction**. The user often does not know what is in an old backup, which is precisely why the rail exists. So the rail as written asks for an operation that does not exist.

The plan therefore **defaults to the strictly safer reading: total refusal** (no copy, no inventory, no hash, no stat beyond existence) and exits with a route to counsel or a licensed examiner. That is *stricter* than the rail's own words, which is the correct direction to err, and it is a default rather than a resolution. ⛔ **The contradiction is a doctrine question for the owner with counsel, and it is not an agent's to close.**

Neither of these is an engineering task, and neither is presented as one.

## Rejected alternatives

- **Keep two repositories and cross-link harder.** The split *is* the defect. A visitor to either had no route to the other, and better cross-links would have made the doctrine/tooling boundary tidier instead of removing it. The boundary is what stopped this being executable.
- **Three repositories**: doctrine, engine, skills. More surface, more drift, three licence files, three gates, and the same boundary drawn twice.
- **Expose the command set to the human.** The tempting option, because a table looks like capability. A menu is a *recall* interface, and acute stress removes recall first. The first draft put a twenty-two-row command table at the centre of the README. Recreating the exact interface `/mw` exists to remove, on the surface a frightened person reaches first.
- **Write the flow as an agent playbook.** The finding that reshaped the plan: a Markdown walkthrough read by a probabilistic agent cannot enforce a state machine, and every property that matters here (turn order, branch selection, resumability, write containment, refusal) becomes a suggestion. See the context section for what that produced in practice.
- **Require a local-only agent runtime**, to make the privacy claim true rather than merely honest. ⛔ Rejected as impractical: it would exclude nearly everyone this is for, in favour of a purity that helps nobody in a cell. Saying what actually happens, and then not asking for the facts, achieves more.
- **Answer the Canadian pack, so the jurisdiction layer is useful to the flow.** ⛔ Rejected absolutely. It needs a practitioner, and an invented answer is not an approximation. It is a defect, because a frightened person will act on it. ADR `0005` already settled this and the restructure does not reopen it.

## Enforcement

- **`RAIL_MATRIX.md` is the single source of truth for what is enforced.** No other file (not this ADR, not a README, not a commit message) may assert a broader state. ⛔ **Do not summarise it as though every rail were enforced.** Say six, name the four that are partial and why, and name the one that is absent.
- **A rail test lands with its owning feature and is red until that feature exists.** A test that passes because its target is absent is this project's headline failure mode, and it has already happened twice: a gate that reported clean while scanning nothing, and a wrapper that printed green over an aborted run.
- **Absence assertions are upgraded, not trusted.** A planted literal proves only that the scanner sees that literal. Every negative assertion needs a non-empty input proven first, plus a mutation set of semantic evasions, plus execution against adversarial prompts with observed side effects.
- **A hand-edit of a generated provider tree fails the freshness test.** `skill/` is edited; `.claude/` and its siblings are rebuilt.
- **`tree.yaml` changes follow the contract-amendment procedure** in `../../AGENTS.md`, carried verbatim into `../../CONTRIBUTING.md`. ⛔ An agent may never amend hazard wording, an exclusion, or a `never:` entry.
- **Preconditions are enforced in the dispatcher, not declared in a reference file.** Schema, contract version, workspace identity, freshness, and a per-operation audit token bound to the exact source. A declaration is a phrase; a gate is a gate.
- **Two gates, never one.** The case-fact gate covers repository and publication inputs and stays strict. A counsel handoff *is* matter facts, so it gets a separate verifier, pointing one tool at both either rejects everything useful or gets weakened until it proves nothing.
- **Node may not appear on any user path**, and offline is proven in a network-denied sandbox rather than asserted in a document.
- **Every wave of the restructure ends private.** This record decides shape, not publication; the publication gate is unchanged and remains counsel's.
