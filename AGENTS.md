# AGENTS.md, for an agent working *on* this repository

Not for an agent working *for* a user. If you are here to help someone preserve their own
record, you want the skill, not this file.

**Read order:** this file → `RAIL_MATRIX.md` → `docs/adr/0007-one-repo-agent-first.md` →
`MANIFESTO.md` → `DOCTRINE.md` → `docs/methods/00_index.md` → `jurisdictions/README.md`.

`DOCTRINE.md` is the reasoning behind each refusal, in one place, so no other file has to restate it.
`README.md` is the person's entry point and is deliberately shorter. ⛔ Do not move the command
vocabulary above the boundary in it.

---

## 1. What is source, and what is not

| Path | Status |
|---|---|
| `skill/SKILL.src.md` | 🔴 **SOURCE.** The single skill definition. Edit here |
| `skill/reference/` | **SOURCE.** One file per command, eleven of them |
| `skill/data/tree.yaml` | 🔴 **THE CONTRACT.** See §2. Never edited casually, never edited by an agent at the barred sites |
| `skill/scripts/` | **SOURCE.** Every user-path script is Python 3 standard library |
| `docs/`, `jurisdictions/`, `legal/`, `ops/` | **SOURCE** |
| `scripts/build.mjs` | **SOURCE.** The build. Runs at build time only |
| `skill/data/tree.json`, `skill/data/tree.sha256` | ⛔ **GENERATED** |
| `.claude/`, `.codex/` | ⛔ **GENERATED provider trees** |

⛔ **A hand-edit of a generated file is a defect, and the freshness check fails on it.** Edit
`skill/`, then rebuild. Provider outputs diverge silently otherwise, and the divergence stays
invisible until a person on the wrong provider gets a different flow. ADR `0007` decision 2.

**Node is a build tool only.** ADR `0007` decision 10. Nothing on a user path may require it,
and the skill's `allowed-tools` carries no entry for it. Offline is *verified in a
network-denied sandbox*, covering the generated trees and the command-line entry point, not
asserted in a document.

## 2. The contract, and how it changes

`skill/data/tree.yaml` is the program. Traversal follows its `branch`/`next` edges mechanically
and its fields render verbatim, so **editing it is a code change with legal consequences.**

⛔ **Never amend it to make your own work fit.** The procedure in §7 is the source of record for
how, and **`.claude/docs/amendments.md` is the single record of what has been amended and what is
outstanding.** ⛔ Do not state that number from memory or from any other file. If your task
appears to need an amendment that is not already listed there, stop and report it.

The verbatim procedure follows in §7.

## 3. Gates, and read the printed count

```sh
./ops/casefact_gate.sh --tracked --profile legal     # ← read "tracked files: N"
./ops/ci_casefact.sh                                 # what CI runs; class names + counts only
MW_DENYLIST=<a path outside every repository> ./ops/casefact_gate.sh --tracked --profile legal
python3 ops/check_contracts.py --selftest             # the check must be known to FIRE
python3 ops/check_contracts.py                       # ← read "scanned N document(s)"
node scripts/build.mjs                               # then assert a zero diff
npm test
gh api /user -q .login                               # must print legal-ouroboros. Before EVERY push
```

🔴 **A green is worth exactly what it scanned.** Both gates print a count for one reason: a gate
that scans nothing prints the same green as a clean tree. That has happened here twice, once in
the gate, once in the wrapper written to report the gate, and in the second case a repository
sat with green continuous integration while nothing was read at all. **Read the count. It is the
only thing that distinguishes a real pass from a vacuous one.**

⛔ **Never weaken a gate to make a run green.** Fix the content, or add a scoped exception *with
a comment saying why it is scoped*. Never fix a false positive by exempting a file.

⚠️ **A negative check is the easiest one to fool.** "Not found" and "nothing read" are
indistinguishable to a text search, so every *absence* assertion must prove its input is
non-empty first and abort the section otherwise. Hash files, not variables, command
substitution strips trailing newlines and reports a mismatch on a byte-identical file, and a
false failure trains people to ignore the check.

⚠️ **Three outcomes, not two.** Some checks no available credential can reach. Failing them
poisons the exit code; passing them is a lie. Report them as a distinct *unverifiable* count,
list them, and say that green means N checks ran. Not that the state is clean.

⛔ **The structural gate cannot catch a proper name.** Plant a real surname and it prints a pass.
The missing half is a denylist of real values which by design lives outside every repository; it
is unwritten, and writing it is the owner's. **No step may treat a green gate as a clean tree.**

## 4. Standing rules

- ⛔ **No absolute dates, anywhere.** A `YYYY`-`MM`-`DD` string fails the gate's temporal class in
  strict mode and there is no exemption path, not in a README, not in a comment, not in a
  fixture. Use relative phrasing: *this wave*, *four weeks earlier*, *before the first push*.
- ⛔ **No real person's name, address, phone number, e-mail, docket, badge, division, or charge
  section**: not in a fixture, not in an example, not in a comment. The one permitted identifier
  is the forge no-reply commit address, which the gate whitelists by construction.
- ⛔ **No case facts.** RAIL 1 bars them from *this repository*. A user's own workspace is a
  different thing and lives outside the install tree by design.
- **Write with placeholders:** `<SOURCE>`, `<DEVICE>`, `<WINDOW>`, `<PARTY>`, `<COUNTERPARTY>`,
  `<PLATFORM>`. If a sentence only makes sense with a real value in it, the sentence is wrong
  for this repository.
- **Render is the quality surface, not source.** Check what a human will actually read,
  extracted back out of the finished artifact.
- **Fail closed.** A check whose input is empty must fail, not pass.
- **An architecture change gets an ADR**, not a paragraph edited into a method file.
- **Never run a model call carrying real matter content against any third-party service.**
  Including during development.
- ⛔ **Do not describe the rails as enforced.** The honest count for v0 is **seven enforced, three
  partial, one absent**, say seven, name the three and why, name the one. `RAIL_MATRIX.md` is the
  single source of truth and no other file may assert a broader state. ⚠️ **Nor a narrower one:**
  the register itself once recorded a gate class as inert after it had been fixed, which sent the
  next reader to re-fix it. The rule binds both ways. ⛔ **Eight is not reachable in this version**.
  RAIL 6 stays partial until its doctrine is settled with counsel, whatever its test says.

## 5. One account, and the identity trap on this machine

🔴 **Every commit, branch and push uses the single pseudonymous account and no other, ever.** Not
to fix a permission, not because another account happened to be active. Account state is global
to the tooling and changes between sessions, so a previous check is not an answer:

```sh
gh api /user -q .login      # must print: legal-ouroboros. Run it immediately before every push
```

🔴 **The machine's global git identity is a real person's name and personal e-mail.** Any
repository created without a per-repo override publishes that identity permanently, and a
wrong-account push is retroactive and irreversible.

```sh
git config user.name  "legal-ouroboros"
git config user.email "<numeric-id>+legal-ouroboros@users.noreply.github.com"
git config --get user.email     # verify BEFORE the first commit, not after
```

⛔ **Never change the global configuration to fix this.** It is correct for every other project
on this machine, and changing it silently mis-attributes unrelated work.

**The licence holder is `Machine Witness contributors` and must never become a person's name.**
The licence requires the notice to propagate into every downstream copy.

## 6. Every wave ends private

⛔ Nothing here is published. Making a repository public, or pointing a name at a live site, is
the same irreversible act by two routes, and both carry a gate that is counsel's rather than an
agent's. ADR `0007` decides shape, not publication.

---

## 7. 🔴 Contract-amendment procedure, ADR `0007`

**Carried verbatim** from the origin workspace's triage scope file, which is the source of record
and states that it is carried into this file and into `CONTRIBUTING.md`.

> ⚠️ **Two citations inside the verbatim text point at the origin workspace, not at this
> repository:** a landing-page contract, and a workspace-root known-broken register at "§9 row
> 13". Neither is part of this repository and neither should be created here. They are left as
> written because the section is carried verbatim rather than paraphrased. The paraphrase is
> precisely what the fifth numbered rule below warns about.

**`tree.yaml` is now executable.** ADR `0007` makes it the program a deterministic offline engine walks, not a wording source a reader interprets: traversal follows `branch`/`next` mechanically and fields render verbatim. So **editing this file is a code change with legal consequences**, and a new question, option, or layer type is a *contract amendment*. Never UI prose.

This procedure is the source of record for that. It is carried verbatim into the repository's `AGENTS.md` and `CONTRIBUTING.md` when those land in the restructure.

1. **An amendment is its own commit**, touching only `tree.yaml` and its regenerated `tree.json` / `tree.sha256`. Nothing else in the same commit.
2. **It states which node ids change and why, and whether the change is *wording* or *structure*.** The two have different review requirements and conflating them is how a structural change ships described as a copy-edit.
3. ⛔ **An agent may never amend hazard wording, an exclusion, or a `never:` entry.** Only a practitioner-reviewed pack supplies alternative wording, and **none exists**. Zero packs are reviewed, Canada included. ADR `0005`.
4. **Route and node-coverage tests must pass unchanged**, or the diff must explain the new node. Those tests exist because a draft flow showed `H3` before `H1`, dropped `L3`, `L8`, `L10` and `L11`, and labelled a screen `O1`–`O5` while rendering only `O1`.
5. **Any count of the contract written in prose is a defect. Count from the file.** Root `CLAUDE.md` §9 row 13: this file and `LANDING_CONTRACT.md` both said *seven* hard exclusions long after the list reached fourteen.

### ⛔ The amendments below are OWNER decisions, not this initiative's

Recorded here so no session performs one silently, and so none of them is re-derived from scratch. **An agent may prepare the analysis; an agent may not make the edit.**

🔴 **This table is the outstanding set only. It is not the history.** Amendments have landed, under their own labels, and `.claude/docs/amendments.md` is the single record of which — including that owner sign-off for a set of four was given once and is a precedent for that set and nothing else. ⛔ Do not read this table as *"no amendment has happened"*, and do not count amendments in prose anywhere: six files did, all six went stale together, and none of them was wrong when written.

⚠️ **`Q4`, `Q5` and `Q6` are not the next in a sequence.** They were identified before anything landed and are unrelated to what has: one is a doctrine question for the owner with counsel, one is a contract-level RAIL 3 exposure the rendering already works around, and one is a mode the engine suppresses with a test asserting it until the contract encodes it.

| # | Amendment | Why it is the owner's |
|---|---|---|
| Q4 | **RAIL 6 versus physics** | Doctrine, owner **with counsel**. Copying a container reads its bytes, hashing it hashes those bytes, and the content class cannot be established without inspecting content or trusting an incomplete user classification. The plan defaults to **total refusal** (no copy, no hash, no inventory) which is *stricter* than the rail's own *"freeze the container unopened"*. A default, not a resolution |
| Q5 | **`phase_3_output.block_c` totals** | *"How much this can help"* summing independent layers, silence, adverse material and closed paths invites the aggregate strength inference **RAIL 3 forbids**, and it does so **with no banned word present**, so a vocabulary test passes it. Rendering adopts the safer form now; the contract still carries the totals |
| Q6 | **`plan_mode` action eligibility** | `H4` sets `preservation_only` but no layer action or output block declares what that mode suppresses, and `L6` still names `preservation_demand`. The engine hard-codes suppression with a test asserting it until the contract encodes it. A hard-coded rule that the contract does not state is a divergence waiting to be forgotten |

---

## 8. ⚖️ Jurisdiction: chosen once by the person, then carried by you

ADR `0008`. There are two separate jobs here and conflating them is the failure this section
exists to stop.

### 8.1 What the person does, once

`init` asks which country they are in, on an engine-owned screen (`W4`), and records the answer
in the case folder's own working note under `where_you_told_me_you_are`. The options are read
from `skill/data/packs.json`, which the build derives from the directory listing of
`jurisdictions/`. ⛔ **There is no list of country codes typed anywhere**, and there must not be:
a second source of truth for which packs exist goes stale in the one direction that hurts, which
is offering a jurisdiction whose pack was removed.

### 8.2 What you do, after `init`

🔴 **Write it down, so nobody has to ask again.** Acute stress removes recall first, and a
two-letter code shown once, while frightened, is not something to make a person produce on
demand in a later session.

After `init` completes, write an `ACTIVE.md` inside a `.mw/` directory at the root of the tree you
are working in. ⚠️ It is deliberately **not** cited here as a full backticked path, because it is
per-install and therefore never in the repository, and the contract checker's job is to fail on a
cited path that does not exist. Do not "fix" that by exempting it.

```markdown
# ACTIVE

- jurisdiction: <the code the person chose, or `not-listed`>
- pack review state: <as the engine printed it>
- case folder: <the absolute path, ONLY if the engine said it wrote the path down>
```

**Read that file first, at the start of any later session, if it exists.** It is gitignored,
because it is one person's answer and committing it would ship that answer to everyone who
cloned this.

🔴 **RULE 1 IS REVERSED. The case folder's path now GOES IN IT — unless the engine said it
would not.** ADR `0010`, superseding what this section used to say.

The old rule was that a note naming a case folder is a forensic artifact on a device that may be
examined, so `W3` made writing it down an opt-in that was off by default, and this file was
forbidden from recording it anyway. Every word of the hazard is still true. What was wrong was
who the question was put to, and what happened when the default won: the ordinary outcome was a
session that could not find its own folder, a person back at the first screen believing every
answer was gone, and — where they started again from above the folder — a second state file
sitting where the upward search reaches it first, winning every later attempt to resume.

**So the engine now decides it, from the contract's own device-exposure question**, in phase 0,
long before a folder exists. Unsure counts as exposed. `W3` survives as a screen that **states
what was done** rather than asking.

**How you know which happened, without being told anything new:** the screen you relayed says
so. If it said the path was written down, write it here too. ⛔ **If it said it is not writing
the location anywhere outside the folder, do not write it here either** — that is the whole
protection, and a note that recorded it anyway would defeat the screen quietly.

⛔ **Two things still never go in it, and each is a decision rather than an oversight:**
1. **Anything the person said.** RAIL 1 and ADR `0007` decision 7: matter facts live in the
   person's own folder and nowhere else. The jurisdiction is a country, not a matter fact.
2. **The value, in a tracked file.** ⛔ Never write it into `CLAUDE.md`, `AGENTS.md`, or any
   other committed file. It would make every install a dirty tree and put one person's answer
   into somebody else's commit. The instruction is tracked; the value is not.

### 8.3 ⛔ What a jurisdiction does NOT buy

**Selecting one is not a claim that it is supported.** Zero packs are reviewed by a practitioner,
Canada included, so every choice available today lands in the degraded path. The engine reads the
pack's review state and capability flags and **refuses by default**: a capability is granted only
by a literal boolean `true` in a pack whose review state is `reviewed`, which no pack has.

So, holding a jurisdiction changes **nothing** about what you may say. You may not answer a legal
question, infer one, fill an `UNANSWERED` field, or reach for a neighbouring country.
`UNANSWERED` is a correct value. An invented answer is a defect, because a frightened person will
act on it.

### 8.4 Where a tool goes

One question decides it, and it is in both READMEs rather than only here:

> **Does the answer change if the person is in another country?**

**No** goes in `skill/scripts/shared/`. **Yes** goes in `skill/scripts/jurisdiction/<code>/`, using
the same code as the pack. The engine stays flat at `skill/scripts/`.

⚠️ **Reference data does not go under `skill/`.** The build's file walk is recursive and each
provider tree gets a full copy, so anything placed there exists four times over, permanently, in
git. Data belongs beside the pack, at `jurisdictions/<code>/`, verified against a digest manifest.
