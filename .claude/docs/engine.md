# The engine, as a map

**What this is for.** `skill/scripts/triage.py` is one file of a few thousand lines and it is the
whole product's human surface. A session that needs to change one thing in it should not have to
re-derive its shape first. ⛔ **This is a map, not a specification.** Where it disagrees with the
file, the file is right and this is stale — so it cites **names to grep for**, never line numbers
and never counts.

**Read `AGENTS.md` first.** Everything binding is there. This adds no rule.

---

## Who owns what

| Layer | Owns | ⛔ Must not |
|---|---|---|
| `skill/data/tree.yaml` | Every question, option, edge, exclusion, layer, clock and limit token | be treated as a wording source. It is the program |
| `skill/scripts/triage.py` | Traversal, state, refusals, path containment, and the *plain language* for tokens the contract only names | invent a question, reorder, or hard-code a node id |
| `skill/SKILL.src.md` + `skill/reference/` | Relaying screens and answers | name a node, encode a branch, or quote a screen |

The relay owning nothing is structural, not stylistic: a probabilistic reader given the flow as
prose dropped four questions and invented five record types, and every one of those defects is
invisible to a walkthrough.

## Subcommands

Registered in one place near the bottom of the file — grep `subparsers.add_parser` and the local
`add()` helper. `begin` · `screen` · `answer` · `state` · `collected` · `verify` · `drive`, plus
the top-level `--selftest`.

- **`drive`** replays answers with no state file. It is the test surface and most of the suite
  goes through it.
- **`collected`** is what the person runs after the errands. ⛔ It is a subcommand, deliberately
  **not** a twelfth skill command — that needs a method document, a rail-matrix row and a wave.
- **`verify`** checks the contract digest and stops.

## 🔴 The rule that recurs: derive it, never type it

Four places where a value that looks like a constant is read out of the contract instead. Each one
exists because the typed version was there first and went stale, or would have.

| Derived | How | If it were typed |
|---|---|---|
| The first screen | `Graph.first` is `self.order[0]` — **document order** | Putting a new node first in `phase_0_hazard` would need an engine change. It does not |
| Which nodes become plan steps | `is_record_question()` reads **`layer:` and nothing else** | A node without a layer would need a list to exclude it from. There is no list |
| Which node decides device exposure | `exposure_node()` walks for the node whose branch sets `device_exposed` | An amendment renumbering it would silently make every session read as exposed, which looks exactly like the feature working |
| Which jurisdictions exist | `skill/data/packs.json`, derived at build from the `jurisdictions/` listing | A second source goes stale in the one direction that hurts: offering a pack that was removed |

⚠️ **`device_exposed()` fails towards *exposed*, and the asymmetry is the whole reason.** Not-exposed
requires the deciding question to have been **answered without setting the flag.** The flag merely
being absent does not count — that is also what a pre-amendment session and the stateless `drive`
surface look like. Guessing *safe* writes a file naming somebody's case folder onto a machine that
may be examined; guessing *exposed* costs one person one pasted path. ADR `0010`.

## The plain-language tables, and why they are checked both ways

The contract names a token; the engine says it in words a frightened person can read. Grep:

`ACTION_TITLES` · `ACTION_LINES` · `LIMIT_LINES` · `LAYER_GUIDANCE`

🔴 **`--selftest` fails on any action or limit token in the contract with no entry, and
`LAYER_GUIDANCE` is checked exhaustive in both directions.** A declared `None` is an answer; an
absent key is a defect. Both directions matter: a missing entry ships a token to the screen, and a
leftover entry is a record of a layer that no longer exists.

**Substitution.** `SEARCH_SUBSTITUTIONS`, `SEARCH_SUBSTITUTION_VALUES`, `PHONE_BLANK` and
`Session.search_phrase()` fill a blank in a search phrase from an answer the person already gave.
⚠️ **All three rendered surfaces must call `search_phrase()`** — the plan screen, the printable,
and `collected_rows()`. A phrase rendered raw shows the blank to the person, and only one of the
three would look wrong.

## Two floors that must not be softened

- **`accept()` refuses fuzzy matching.** Exact match after case and whitespace normalisation, and
  nothing else. A compound reply gets exit 2. ⛔ **This is correct and does not change** — reading
  a near-miss as a `yes` records an answer nobody gave. The flexibility belongs to the assistant,
  which sends one option and keeps the rest for the question it answers.
- **The folder refusals.** Resolved after following links, so a link into a bad place is the same
  case as naming it. There is deliberately no flag, no environment variable and no override: a
  switch that lets the check through is a switch that ships the harm it prevents.

## Screen copy is machine-checked before a person sees it

`authored_screen_strings()` collects every string the engine authors, and `--selftest` scans them:

- `ALLEGATION_WORDS` — bars naming a kind of accusation. ⚠️ **`agree` is on that list**, so new
  screen copy cannot use it. `accused` is deliberately *not* on it.
- `BANNED_IN_SCREENS` — outcome words, RAIL 7.

⛔ **A slip fails the self-check rather than reaching a screen.** If you add an authored string,
add it to `authored_screen_strings()` too, or it is unchecked and nothing says so.

Also authored, and each with both branches driven by the self-check: `SCREEN_ZERO_LINES`,
`UNREVIEWED_WORDING_LINES`, `POINTER_CARRY_LINES`, `POINTER_KEPT_LINES`,
`POINTER_WITHHELD_LINES`, `CLOSED_PATH_REPLACEMENT`.

⚠️ **`prohibitions_in()` and `closed_path_lines()` are the withholding path.** Guidance for a
record that a condition forbids reaching must be suppressed **by that same path**, never added
beside it as a second ungated string. This is the one place where a careless edit reintroduces the
contradiction the engine was built to remove.

## `--selftest`, and the hygiene lesson in it

It is intolerant on purpose: a tolerant runtime needs an intolerant self-check, and
`write_printable` once swallowed a loader bug whole.

🔴 **`selftest()` redirects `HOME` for the entire run and then asserts the real pointer file is
byte-identical.** The reason is worth carrying: when the pointer became on-by-default, the
self-check began writing case-folder paths into the real home folder of whoever ran it. Found by
looking, not by an assertion firing. One block already redirected `HOME` **for itself**, which is
exactly why it went unnoticed — it covered the only block that had thought to ask. ⛔ Do not add a
per-block redirect; the whole run is covered and the assertion is what proves it.

⚠️ **Running it by hand leaves `__pycache__` beside the programs, and a test fails on that.**
`python3 skill/scripts/triage.py --selftest` imports `skill/scripts/shared/printable.py`, which writes a
compiled copy into `skill/scripts/` and `skill/scripts/shared/`. Version control ignores those
directories, which is exactly why the artifact goes unnoticed until the suite reports it. Clear
them before `npm test`, and do not "fix" the assertion — a test that modifies the tree it tests
can affect the next test.

## Prove a check can fire

⛔ **Never trust a silent check.** Every guard added should be planted against once — break the
thing on a throwaway copy of the tree and confirm the check fails. Copy the tree fresh for each
plant; `git checkout --` inside a plant directory reverts to HEAD and will discard uncommitted
work.

Two shapes seen here that pass while reading nothing:

- **A check downstream of an equality on the same string can never fire** — the equality throws
  first. Replace it with something total, not with an inverted copy of itself.
- **`grep … || ok` on an absence** passes when the input is empty. Prove the input is non-empty
  before judging it. Hash files, not command substitutions: `$( )` strips trailing newlines and
  reports a mismatch on a byte-identical file, which trains people to ignore the check.

## Where the rest is written down

`AGENTS.md` — binding rules · `.claude/docs/amendments.md` — what has been amended ·
`RAIL_MATRIX.md` — the only statement of what is enforced · `docs/adr/` — why, per decision ·
`DOCTRINE.md` — the two-halves privacy statement and what it costs.
