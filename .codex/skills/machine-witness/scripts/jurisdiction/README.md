# `jurisdiction/`: tools bound to one country's arrangements

**One test decides whether a tool belongs here:**

> **Does the answer change if the person is in another country?**

**Yes** means this tree, in `<code>/`. **No** means `../shared/`. ADR `0008` decision 1.

A legal-source fetcher is bound to whoever publishes that country's decisions and to the terms
under which they may be read. A law-book index is bound to the books. Neither one transfers, and
pretending otherwise by putting them in `../shared/` would make a contributor in another country
believe they had a tool that works.

```
jurisdiction/
  _template/     what a contributor copies. Not a working jurisdiction
  <code>/        one directory per jurisdiction, lower-case, the same code as the pack
```

⚠️ **The code here must match the pack directory in `jurisdictions/`, exactly.** Two
spellings of the same jurisdiction is the failure this naming rule exists to stop: the tool
would silently pair with no pack, and the engine would report the jurisdiction as having no
review state rather than reporting an inconsistency.

## ⛔ The line no tool here may cross

**Code in this tree may fetch, index, and quote a legal source. It may never answer a legal
question.**

The answers live in `jurisdictions/<code>/`, one numbered file per topic, and every one
of them reads `UNANSWERED` until a practitioner in that jurisdiction has reviewed it. **Zero
packs are reviewed. Canada included.** A tool that inferred an answer from a source it fetched,
or from a neighbouring country, or from anything else, would be producing legal advice that
nobody checked, to a frightened person who will act on it. `UNANSWERED` is a correct value. An
invented answer is a defect.

So a tool here reports **what a source says**, with the source named and the retrieval recorded.
It never reports what that means for the person, never characterises whether something helps or
hurts them, and never fills a gap in a pack.

## What a jurisdiction directory holds

Nothing yet, in any of them. The template exists so that the first contributor copies a shape
rather than inventing one.

## Rules that bind every file here

Everything in `../shared/README.md` under *"Rules that bind every file here"* applies unchanged:
Python 3 standard library only, every capability declared in `../../allowlist.json` with a
reason, no outbound path on a user path, nothing touching another person, the intimate-media
refusal, the read-path audit, and a record rather than a verdict.

Two further rules that only bite here:

- 🔴 **A source that needs the network is not a user-path tool.** RAIL 10 and RAIL 11 close
  every outbound path, and the offline check would catch one. A tool that needs material it
  does not have ships as a tool that reads material committed alongside it, or it does not ship.
- ⚠️ **Reference data does not live under `skill/`.** The build's file walk is recursive and each
  provider tree gets a full copy, so anything placed here exists four times over. Data belongs
  beside the pack, at `jurisdictions/<code>/`, and a tool here resolves it by path and
  verifies it against a digest manifest. ADR `0008` decision 7.
