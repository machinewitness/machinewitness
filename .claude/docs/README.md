# `.claude/docs/`

Working notes for an agent operating **on** this repository. Tracked and published, like the rest
of `.claude/`, and scanned by the case-fact gate — which exempts `.claude/` as *ours* rather than
skipping it.

| File | Holds |
|---|---|
| [`amendments.md`](amendments.md) | 🔴 The single record of what has been amended in `skill/data/tree.yaml`, and what is outstanding. Nothing else may state a number |
| [`engine.md`](engine.md) | A map of `skill/scripts/triage.py`: who owns what, the derive-don't-type seams, the floors that must not be softened, and what `--selftest` guarantees |

⚠️ **`.claude/skills/` is GENERATED and this directory is not.** `scripts/build.mjs` removes and
rewrites `.claude/skills/machine-witness` on every build; the freshness check is scoped to that
path, so nothing here is regenerated and nothing here may be relied on by the build.

---

## ⛔ What does not belong here

**A rule.** `AGENTS.md` is the instruction file and everything binding is there and only there.
Two copies of a rule set drift, and this project has shipped that defect three times: a count that
said *seven* long after the list reached fourteen, a wrapper that printed green over a run that
read nothing, and six files stating an amendment count that four landed amendments had moved.

**A count of anything derived.** Read it from the file that owns it. `RAIL_MATRIX.md` for what is
enforced, `tree.yaml` for the contract, the gate's own output for what it scanned.

**Anything a person said.** ⛔ Nothing volunteered in a session reaches a tracked file, here least
of all. RAIL 1, and ADR `0009` decision 4.

**A decision.** That is an ADR in `docs/adr/`, and an ADR is never retro-edited.

## What does

Knowledge a future session would otherwise re-derive from thousands of lines, or from a defect it
would rediscover the hard way. If a note here is only true this week, it belongs in a commit
message instead.
