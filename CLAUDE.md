# CLAUDE.md

🔴 **`AGENTS.md` is the instruction file for this repository. Read it. Everything binding is
there and only there.**

This file exists because some tools look for this name and not the other. It deliberately does
**not** restate the rules. Two copies of a rule set drift, and a prose copy of a contract is a
defect this project has already shipped three times. Once as a count that said *seven* long after
the list reached fourteen; once as a wrapper that printed green over a run that read nothing; and
once as **six files stating how many contract amendments were outstanding**, every one of them
written before any amendment existed and none of them wrong when written. That third one is why
`.claude/docs/amendments.md` exists and why no other file may state that number.

---

## The four things most likely to be got wrong in the first five minutes

1. **`skill/` is source. `.claude/`, `.codex/`, `skill/data/tree.json` and
   `skill/data/tree.sha256` are GENERATED.** Editing a generated file fails the freshness check.
   Edit `skill/`, then rebuild. ADR `0007` decision 2.
2. **`skill/data/tree.yaml` is the contract and the program, not a wording source.** Amendments
   follow the procedure in `AGENTS.md` §7. ⛔ An agent may never amend hazard wording, a hard
   exclusion, or a `never:` entry — **that is barred whether or not a previous amendment touched
   one.** Some have landed and some are outstanding; ⛔ **do not state how many from memory or
   from another file** — `.claude/docs/amendments.md` is the only record. If your task appears to
   need one that is not already listed there, **stop and report it.**
3. **Every gate prints a count. Read the count.** A gate that scans nothing prints the same green
   as a clean tree, and a green is worth exactly what it scanned. `AGENTS.md` §3.
4. 🔴 **The machine's global git identity is a real person's name and personal e-mail.** Set the
   per-repo identity before the first commit and never touch the global configuration.
   `AGENTS.md` §5.

## Two absolutes worth repeating out of context

- ⛔ **No absolute dates, anywhere.** The gate's temporal class runs in strict mode with no
  exemption path.
- ⛔ **Do not describe the rails as enforced.** Seven enforced, three partial, one absent.
  `RAIL_MATRIX.md` is the single source of truth and no other file may claim more, or less.

## Where the detail is, so it is not re-derived

| Need | Read |
|---|---|
| Every binding rule | `AGENTS.md` — and only there |
| What has been amended in the contract, and what has not | `.claude/docs/amendments.md` |
| How `skill/scripts/triage.py` is shaped, and which of its constants are derived | `.claude/docs/engine.md` |
| What is actually enforced | `RAIL_MATRIX.md`, the single source of truth |
| Why a decision was taken | `docs/adr/`. ⛔ An ADR is never retro-edited |
| What this cannot establish | `HONEST_LIMITS.md` |

## Scope of this repository

Defence-side **personal** evidence custody: helping a person under accusation preserve the
digital record that already exists about their own life, before it is overwritten. It produces a
record, never a verdict. It has no capability touching another person, and that is structural
rather than a setting. `MANIFESTO.md` is the reasoning of record.
