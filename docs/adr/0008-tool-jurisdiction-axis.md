# ADR 0008, The tool tree divides on the jurisdiction axis

- **Status:** Accepted
- **Scope:** Where a *tool* lives inside the one repository, how a jurisdiction is selected and carried between sessions, what the engine is allowed to read out of a pack, and whether reference data ships in the tree
- **Supersedes:** the eleven-repository, six-wave publish plan that the project's own planning notes still describe. Those notes are **not in this repository** and are deliberately not named by path here: a relative path to a tree that does not ship advertises its existence and its name to every reader of a public repository. They were written before ADR `0007` and were never updated. ⚠️ They are marked superseded where they live rather than deleted, because the account of what extracting each tool actually costs is still the only honest one written down
- **Does not decide:** whether anything is published. Gate A is untouched and every wave ends private. It does **not** amend `../../skill/data/tree.yaml`; decision 3 below exists precisely so that stays true. It does **not** answer a legal question in any pack, and it does not claim any jurisdiction is supported
- **Related:** ADR `0005` (the jurisdiction layer is a primary axis, which this record extends from *answers* to *tools*), ADR `0007` (one repository, the skill is the product, and decisions 6, 7 and 9 of that record are load-bearing here), ADR `0002` and `RAIL_MATRIX.md` RAIL 2 (the positive allowlist that decision 2 widens), `../../jurisdictions/README.md` (the single source of truth for what is claimed)

## Context

The repository is already one repository. ADR `0007` decided that, and this record does not reopen it.

What `0007` did not settle is **where a tool goes**, and the reason it did not is that at the time there were no tools to place: `skill/scripts/` holds four files and every one of them is the engine or a step of the custody chain. The question only becomes answerable once someone asks where a legal-source fetcher goes, and the answer turns out to be a different question from the one `0005` answered.

**Three things in this project all sound like "jurisdiction" and are handled three different ways.** Conflating any two of them is the failure this record exists to prevent:

1. **Legal *answers*** live in `../../jurisdictions/<code>/`, one pack per jurisdiction, every answer `UNANSWERED` until a practitioner reviews it. ADR `0005`.
2. **Legal *seams in prose*** are marked in place with an inline pointer. The document is **never forked per jurisdiction**, because a forked corpus drifts and a reader cannot tell which copy is current.
3. **Legal *tools*** had no home at all. That is the gap.

A tool is not a document and not an answer. It is code, it belongs under `skill/`, and it divides cleanly on one test: **does the answer change if the person is in another country?** A wearable parser reads a file format that a device manufacturer defined; it does not care where the person lives. A legal-source fetcher and a law-book index are bound to one country's publishing arrangements and nothing about them transfers.

⚠️ **The cheap moment is now.** None of the tools this axis sorts exists yet, so this is scaffolding placed before the tools land rather than a refactor of working code. Placed after, it is a rename across every reference document, the permission grant, the allowlist and the test suite.

### What research turned up, and it changed the design

Four findings, each of which moved a decision. All were established by reading the tree rather than assumed.

🔴 **The permission grant does not reach a subdirectory.** `skill/SKILL.src.md` grants `Bash(python3 {{scripts_path}}/*)`. **One star.** A glob of that shape matches a file directly under the directory and stops there, so every tool placed one level down is unrunnable, and the failure arrives as a permission refusal in front of a person in trouble rather than as a build error in front of a developer. This is the whole reason decision 2 exists, and it is RAIL 2 territory rather than a typo: `0007` decision 9 enforces RAIL 2 by a **positive allowlist**, so widening the grant is a rails change and needs a test with a negative control.

✅ **The three folder screens are engine-owned, not contract nodes.** The contract defines `H1`–`H4`, `X1`–`X14`, `O1`–`O5`, `T1`–`T2` and `L1`–`L11`, and nothing else. `W1`, `W2` and `W3` are constants in the engine, shown at a boundary *derived* from the contract rather than at a transcribed id. **This is the decisive finding**: a fourth setup screen sits beside them, so `tree.yaml` is untouched, the route and node-coverage tests are unaffected, and `AGENTS.md` §7's rule that a fourth contract amendment is a stop-and-report never engages.

✅ **The state file already exists and is versioned.** `.mw-state.json` is written and read by the engine alone, and a schema mismatch is already a clear refusal rather than a crash. A jurisdiction goes in there, which means **no new file appears in the person's case folder**: the workspace layout and the count derived from it are untouched.

⚠️ **The pack already carries the safety mechanism, and nothing reads it.** `jurisdictions/_template/pack.yaml` already states the invariant that *a pack whose review state is not `reviewed` may not supply hazard wording to a user*, and carries a capability block in which **every flag defaults to a refusal**, under the heading *absence of an answer is never permission*. No file under `skill/scripts/` reads it. So selecting a jurisdiction, today, would mean nothing at all. Wiring the engine to that block is the work, and it is the only genuinely new mechanism in this record.

## Decision

**Tools divide on the jurisdiction axis, one level under the engine. A jurisdiction is chosen once at `init`, carried in state, and handed to the next session in writing. The engine reads the selected pack and refuses by default.** Seven decisions.

**1. Two directories under `skill/scripts/`, and the engine stays flat.**

```
skill/scripts/                 the engine and the custody chain. NOT moved
  triage.py freeze.py verify.py capture_audit.py

skill/scripts/shared/          jurisdiction-INDEPENDENT tools
skill/scripts/jurisdiction/    jurisdiction-BOUND tools, one directory per code
  _template/                   what a contributor copies
```

The deciding test is one sentence and it goes in both READMEs: **does the answer change if the person is in another country?** No means `shared/`. Yes means `jurisdiction/<code>/`.

⛔ **The engine is not moved into `shared/`.** It would churn every path in `skill/reference/*.md`, the permission grant, the workspace test's engine constant and the two scripts that invoke it, for no gain. The engine is not a tool that sorts on jurisdiction; it is the thing that runs them.

**2. The permission grant widens by one bounded entry per depth the layout actually has, with a negative control.** A single `*` does not cross a path separator, so the existing grant reaches the engine and stops. `allowed-tools` becomes three entries: the flat engine, one level down for `shared/`, and two levels down for `jurisdiction/<code>/`.

⛔ **It is not `**`.** The grant is the RAIL 2 boundary and a boundary that reaches everywhere is not a boundary. Enumerating the depths means a tool buried deeper than the layout describes is **denied**, which is the correct answer, and adding a depth is a visible diff in a rails-checked file rather than something a wildcard already covered. ⚠️ The count of entries is the depth of the designed tree and nothing else; if a later layout is deeper, that is a decision, not a glob fix.

`tests/rails/allowlist.test.mjs` gains a positive case (a tool under `scripts/shared/` and one under `scripts/jurisdiction/<code>/` are both permitted) **and** a negative case (a path outside `scripts/` is still denied, and so is one deeper than the grant reaches), because a check never observed to fail is not a check.

**3. Jurisdiction selection is an engine-owned setup screen, not a contract node.** It sits beside the three folder screens, at the same derived boundary, and it is **not** a contract amendment. `tree.yaml` gains nothing and loses nothing.

**4. The options are derived from the directory listing, never typed.** The engine lists `jurisdictions/*/`, drops the template, and offers what it finds plus an explicit "not listed" choice that proceeds engine-only. A hardcoded country list would be a **second source of truth for the same fact**, and the one that goes stale is always the one a person is shown.

**5. ⚖️ Selecting a jurisdiction is not a claim that the jurisdiction is supported, and the flow gets LOUDER rather than quieter.**

This is the doctrine half of this record and it binds every later change to it:

> **Zero packs are reviewed, Canada included.** Every selection available today therefore lands in the degraded path. The engine reads the selected pack's review state and capability flags, **refuses by default**, and **never substitutes, defaults, or infers** an unanswered value. A person who selects a jurisdiction with no reviewed pack must be told so, on the screen, in the same breath as the selection is recorded.

⛔ An agent may build a pack skeleton and mark a seam. An agent may **never** answer a legal question in a pack. `UNANSWERED` is a correct value; an invented answer is a defect, because a frightened person will act on it.

**6. The pack is read the way the contract is read: a build-time JSON emission with a digest.** ADR `0007` decision 6 bars YAML at runtime and Python's standard library has no parser for it. So `scripts/build.mjs` emits the pack data as JSON with a sibling digest, exactly mirroring the existing `tree.json` and `tree.sha256` pair, and the engine verifies the digest and refuses on mismatch. ⛔ **Not an ad-hoc partial YAML parser.** The one place fidelity is load-bearing is the one place a hand-rolled parser fails quietly.

**7. Reference data ships in the tree, compressed, and the gate says out loud that it could not read it.** A law-book archive lives at `jurisdictions/<code>/lawbooks/`, with a per-member digest manifest beside it in plain text.

⛔ **It does not live under `skill/`.** The build's file walk is recursive and every provider tree gets a full copy before one of them is mirrored again, so anything placed under `skill/` exists **four times**. A large binary in four copies, in git, permanently.

🔴 **And that placement has a consequence which is not optional, so it is recorded here rather than discovered later.** An installed provider tree is `<somewhere>/skills/machine-witness/`, and a script inside it resolves paths relative to itself. It has **no route to `jurisdictions/`**, which sits at the top of the repository. That is exactly the problem decision 6 solves for the pack summary, by emitting a small JSON pair into the skill's own data directory, and **the same trick is not available for bulk data**: emitting it into `skill/data/` puts it back into the four-copy path this decision exists to avoid.

So a jurisdiction-bound tool that needs bulk reference data **takes the path to that data as an argument** and verifies it against the manifest. It does not resolve it relative to itself, and it does not assume the repository is above it. A tool that silently assumed a repository checkout would work for a developer and fail for every installed user, which is the worst direction for that failure to run.

⚠️ **Nothing is committed under `lawbooks/` by this record, and the reasons are cumulative rather than a matter of sequencing.** The directory and its README exist; the archive does not. (a) No archive is in hand. (b) The method this layer comes from carries its own licensing rail, *never bundle, never commit, never redistribute*, and committing licensed practitioner texts is redistribution. (c) Whether that layer ships **at all** past a private repository is a recorded open decision for the owner, not an agent's, because a takedown notice against a pseudonymous repository is an attribution-pressure event. The mechanism is built and the gate's archive class is proven against a planted archive; **placing real content there is the owner's call.**

🔴 **And the gate is widened, because it was silently blind.** The scan uses a flag that skips non-text files, so a committed archive is invisible to every structural class *and* to the denylist check built specifically to catch real names, and the gate prints the same green as an empty tree. The gate now **enumerates archives, lists them by path, counts them, and prints them as unverifiable**, without changing its exit code. Three outcomes, not two: verified, failed, and **unverifiable**. Failing them poisons the exit code permanently; passing them silently is a lie.

**Directory names inside the repository carry no `mw-` prefix.** The repository is the namespace. Free to decide now, because nothing is named yet.

## Consequences

**What this buys:**

- **A tool's location states its portability.** A contributor in another country can read the tree and see, without asking, which tools they can reuse and which they have to write.
- **The jurisdiction stops being asked twice.** It is selected once, recorded in state, and written to a file the next session's agent reads. The person is not asked to remember a code they were shown once while frightened.
- **The refuse-by-default capability block finally does something.** It has been correct and inert. Decision 6 makes it load-bearing.
- **The gate stops over-reporting.** An unverifiable count is worse news than the green it replaces, which is the point.

**What it costs, stated rather than argued:**

- 🔴 **An archive in git history is permanent.** Once committed it cannot be removed without rewriting history, and a takedown aimed at the book layer reaches **the whole repository**, because `0007` accepted one blast radius. This is the tool that makes that abstraction concrete. The known-broken register already flags the book layer as an attribution-pressure event and Gate A territory, and this record does not move that line.
- ⚠️ **A wider permission grant is a wider surface.** One level, bounded, with a negative control, and the allowlist diff still runs both ways. That is mitigation, not removal.
- ⚠️ **A fourth setup screen is a fourth turn** before a person reaches the first question about their own records. Accepted because the alternative is asking them the same thing again in every later session.
- 🔴 **The degraded path is now the only path, and it is visible.** Wiring the engine to the packs makes the absence of any reviewed pack a thing a person is told, every time. That is correct and it will read as the tool being less capable than a version that said nothing.
- **`jurisdictions/` now holds two kinds of thing**, answers and data. Accepted, because the alternative was a second top-level tree whose name differed from this one by a plural, which is a permanent reading hazard.

## Rejected alternatives

**A tool tree that mirrors the record layers instead** (`wearable/`, `phone/`, `platform/`). It reads well and it sorts on the wrong axis: it answers *what does this parse* when the question a contributor actually has is *can I reuse this*. The layer is already recorded in the contract, so this would be a second encoding of a fact that has an owner.

**A second top-level directory for jurisdiction-bound tools.** Two trees whose names differ by a plural, one holding answers and one holding code, and no way for a reader to guess which is which. The subdirectory is uglier in a path and unambiguous in a head.

**A hardcoded list of offered jurisdictions.** Rejected under decision 4. The failure mode is a list that outlives the directory it describes, offering a jurisdiction whose pack was removed or omitting one that was added, and the person who finds out is the person being helped.

**A contract node for the jurisdiction question.** It is the shape a reader expects, and it would have been wrong twice: it needs an amendment to `tree.yaml`, which is the owner's and not an agent's, and it would put a *setup* question into a contract whose subject is the person's records. The three folder screens already established the precedent, at a boundary derived rather than transcribed.

**Reading `pack.yaml` at run time with a small parser.** Rejected under decision 6. It reintroduces exactly the fragility `0007` removed, at a site where a silent misparse becomes a legal-capability flag read the wrong way round.

**Keeping the books out of the tree and fetching them.** Every version of this needs a network path on a user path, which RAIL 10 and RAIL 11 both close, and which the offline check would catch. The cost of committing them is permanent and named above; the cost of fetching them is architectural.

**Making the gate fail on an archive it cannot read.** Tempting and wrong. A permanently red gate is a gate people stop reading, and the state it would report is not "unsafe" but "unknown". The distinct unverifiable count is the honest form, and it depends on the count being printed and read rather than on the exit status.
