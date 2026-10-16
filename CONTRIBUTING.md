# Contributing

**Pseudonymous contributions welcome.** No identity is required, ever. We review the work, not the author.

---

## ⚖️ The most useful thing you can contribute: your country

The engine here transfers everywhere. **The legal layer does not, and no jurisdiction has been reviewed by a practitioner, not one.** That is the project's binding constraint, and it is not an engineering problem. If you practise law anywhere, you can close a gap no amount of code will.

```sh
cp -r jurisdictions/_template jurisdictions/<iso-3166-1-alpha-2>
```

Then read [`jurisdictions/_template/README.md`](jurisdictions/_template/README.md). Fill order, the hard rules, and what belongs in a pack rather than in a method document.

**⛔ Two rules, both absolute:**

1. **Do not guess, and do not let a model fill a cell.** `UNANSWERED` is a correct and useful value. It tells the next reader what to ask. An invented answer is a defect, because a frightened person will act on it and the page gives them no way to tell the two apart.
2. **Public authority only.** No matter you are working on, no client, no charge combination, no file or docket number, no date window. ⚠️ A *set* of statute sections is a fingerprint to anyone holding the paperwork even with no name, date, or event attached.

**A partial pack is worth opening a pull request for.** One reviewed file with an honest `00_status.md` beats an empty directory and beats a complete-looking guess. Correcting the engine's defaults for your jurisdiction, a barred class it misses, a retention figure that is wrong, hazard wording that does not exist where you are. Is a review, and it is the highest-value form.

**Reviewers are recorded by role, never by name.** *"criminal defence counsel, 10+ years, practising in `<jurisdiction>`"*. That protects you, and it is deliberate: it also means you get none of the credential a review normally earns. We know that is a real cost and have no way around it. If you want public credit, claim it yourself elsewhere. The pack is not the place.

## Sign-off, not a licence agreement

Every commit needs a Developer Certificate of Origin sign-off:

```sh
git commit -s -m "your message"
```

That appends `Signed-off-by:` with your commit identity, whatever you have chosen it to be. See [`DCO`](DCO).

**There is no contributor licence agreement, deliberately.** A CLA requires a legal identity and legal capacity to grant rights. That excludes exactly the anonymous contribution this project depends on, and the DCO does the necessary work without it. ADR [`0003`](docs/adr/0003-free-open-anonymous.md).

**Everything here is MIT**: ADR [`0006`](docs/adr/0006-mit-licence.md). By signing off you are contributing under that licence. ⛔ **Do not add your name to the copyright line.** It propagates into every downstream copy by the terms of the licence itself, which makes it the worst place in the tree for an identifier. The holder is `Machine Witness contributors` and stays that way.

## Before you open a pull request

- [ ] `./ops/casefact_gate.sh --tracked --profile legal` passes, **and you read the `tracked files: N` line it prints**
- [ ] `python3 ops/check_contracts.py` passes (no dangling paths, no pack claiming a review it cannot show) **and you read the `scanned N document(s)` line**
- [ ] `python3 ops/check_contracts.py --selftest` passes if you touched the checker
- [ ] `node scripts/build.mjs` leaves a **zero diff** if you touched `skill/`. The provider trees under `.claude/` and `.codex/` are generated; edit `skill/` and rebuild, never the output
- [ ] `npm test` passes
- [ ] **No absolute dates.** The gate's temporal class matches `YYYY-MM-DD` in strict mode with no exemption path. Use durations (*"30 days from receipt"*), relative phrasing, or an amendment name
- [ ] **No real name, address, phone number, e-mail, or case identifier**: anywhere, including a fixture or an example
- [ ] **Zero runtime dependencies.** Every script on a user path is Python 3 standard library. The only permitted dependency anywhere is the pinned build-time parser in `devDependencies`, because the standard library of neither language ships a YAML parser and contract fidelity is the one place fidelity is load-bearing. **Node is a build tool only and may not appear on any user path**, ADR [`0007`](docs/adr/0007-one-repo-agent-first.md) decision 10. A runtime dependency is a supply-chain surface and an audit burden for people who cannot afford either
- [ ] **No telemetry, analytics, crash reporting or version check.** Not optional, not opt-out, not "anonymous"
- [ ] **New docs say what the thing cannot do.** If you cannot write that part, the change is not ready

⚠️ **A green gate is not an identity check.** It matches *classes* of identifier, not values, so a real surname walks straight past it, verified directly, not assumed. Read your own diff for names before you push.

🔴 **A green is worth exactly what it scanned.** Both gates print a count for one reason: a gate that scans nothing prints the same green as a clean tree, and that has happened here twice, once in the gate, once in the wrapper written to report it. The count is the only thing separating a real pass from a vacuous one.

## What will be declined

**Any counterparty-facing capability.** Messaging, monitoring, people-search, profile-scraping, list-enumeration, pretext accounts, "just check whether they…". Not as an option, not behind a flag, not "for the read-only case", not "for the lawyer". Users of this project are frequently under no-contact conditions where such a feature makes the tool the instrument of a fresh offence. **The blast radius is the user's liberty.** It is absent by design and stays absent. ADR [`0002`](docs/adr/0002-no-counterparty-surface.md).

**Anything that promises an outcome.** No *prove your innocence*, no *clear your name*, no success rates, no statistic about how common false accusations are. This organises a record. It does not win anything, and saying otherwise harms the person relying on it.

**A verdict, score, strength, or prediction.** Three labels exist: CONSISTENT / IN TENSION / SILENT, against a claim, per layer. A lawyer decides meaning.

**A capability without its honest limits.** A pull request adding something and no statement of what it fails to establish is incomplete.

**A one-sided report.** What cuts *against* the user comes first, in the same detail as what helps. A generator that can be made to omit an adverse layer is broken, not configurable.

**A legal answer written into the engine.** If it varies by country it belongs in a pack, with an inline `⚖️ **[JURISDICTION]** →` marker at the seam. Do not fork a method document per jurisdiction.

## Style

Match the file you are editing. Comments and asides explain *why*, especially where a decision looks wrong until you know what went wrong before. **Those are load-bearing, and deleting one as noise removes the only record of a real failure.**

Write the lesson, never the anecdote. *"A wearable export can contain two devices and one sensor class may come from only one of them"* transfers. Any version naming a real device, window, or person does not.

---

## 🔴 Contract-amendment procedure, ADR `0007`

**Carried verbatim** from the origin workspace's triage scope file, which is the source of record and states that it is carried into `AGENTS.md` and into this file. The same text appears in `AGENTS.md` §7 by design. It is the one duplication in this repository that is deliberate, because a contributor and an agent must not be able to read different versions of it.

> ⚠️ **Two citations inside the verbatim text point at the origin workspace, not at this repository:** a landing-page contract, and a workspace-root known-broken register at "§9 row 13". Neither is part of this repository and neither should be created here. They are left as written because the section is carried verbatim rather than paraphrased. The paraphrase is precisely what the fifth numbered rule warns about.

**`tree.yaml` is now executable.** ADR `0007` makes it the program a deterministic offline engine walks, not a wording source a reader interprets: traversal follows `branch`/`next` mechanically and fields render verbatim. So **editing this file is a code change with legal consequences**, and a new question, option, or layer type is a *contract amendment*. Never UI prose.

This procedure is the source of record for that. It is carried verbatim into the repository's `AGENTS.md` and `CONTRIBUTING.md` when those land in the restructure.

1. **An amendment is its own commit**, touching only `tree.yaml` and its regenerated `tree.json` / `tree.sha256`. Nothing else in the same commit.
2. **It states which node ids change and why, and whether the change is *wording* or *structure*.** The two have different review requirements and conflating them is how a structural change ships described as a copy-edit.
3. ⛔ **An agent may never amend hazard wording, an exclusion, or a `never:` entry.** Only a practitioner-reviewed pack supplies alternative wording, and **none exists**. Zero packs are reviewed, Canada included. ADR `0005`.
4. **Route and node-coverage tests must pass unchanged**, or the diff must explain the new node. Those tests exist because a draft flow showed `H3` before `H1`, dropped `L3`, `L8`, `L10` and `L11`, and labelled a screen `O1`–`O5` while rendering only `O1`.
5. **Any count of the contract written in prose is a defect. Count from the file.** Root `CLAUDE.md` §9 row 13: this file and `LANDING_CONTRACT.md` both said *seven* hard exclusions long after the list reached fourteen.

### ⛔ The amendments below are OWNER decisions, not this initiative's

Recorded here so no session performs one silently, and so none of them is re-derived from scratch. **An agent may prepare the analysis; an agent may not make the edit.**

🔴 **This table is the outstanding set only. It is not the history.** Amendments have landed, under their own labels, and `.claude/docs/amendments.md` is the single record of which. ⛔ Do not read this table as *"no amendment has happened"*, and do not count amendments in prose anywhere: six files did, all six went stale together, and none of them was wrong when written. `Q4`, `Q5` and `Q6` were identified before anything landed and are unrelated to what has.

| # | Amendment | Why it is the owner's |
|---|---|---|
| Q4 | **RAIL 6 versus physics** | Doctrine, owner **with counsel**. Copying a container reads its bytes, hashing it hashes those bytes, and the content class cannot be established without inspecting content or trusting an incomplete user classification. The plan defaults to **total refusal** (no copy, no hash, no inventory) which is *stricter* than the rail's own *"freeze the container unopened"*. A default, not a resolution |
| Q5 | **`phase_3_output.block_c` totals** | *"How much this can help"* summing independent layers, silence, adverse material and closed paths invites the aggregate strength inference **RAIL 3 forbids**, and it does so **with no banned word present**, so a vocabulary test passes it. Rendering adopts the safer form now; the contract still carries the totals |
| Q6 | **`plan_mode` action eligibility** | `H4` sets `preservation_only` but no layer action or output block declares what that mode suppresses, and `L6` still names `preservation_demand`. The engine hard-codes suppression with a test asserting it until the contract encodes it. A hard-coded rule that the contract does not state is a divergence waiting to be forgotten |
