# 11: Precedent calibration

**Read the honest conclusion first: this layer calibrates expectations far more than it wins anything.** That is still valuable. It is the difference between a customer spending money on a theory that has never worked and a customer knowing that before they spend. But it is not a defence, and the product must not sell it as one.

Included here because the *method* is sound and reusable, and because the *findings pattern* is a permanent lesson about what this kind of research actually yields.

---

## The method (transfers cleanly, jurisdiction-agnostic)

⚖️ **[JURISDICTION]** → the *pipeline* below is neutral. Its **source** is not: a public case-law database is a national institution, and the one this method was built against covers Canada only. A pack does not carry case law. It names the local source and citation format in `../../jurisdictions/<code>/00_status.md`. Everything the pipeline *produces* is jurisdiction-specific, per the closing line of this file.

**scrape → structure → compare → learn → adapt → apply**

1. **Discover** candidates in an attended browser session against a public case-law database. Many are behind bot protection that a real browser passes and a plain HTTP client does not.
2. **Rank offline** by overlap with the fact pattern's dimensions, stratified so no single dimension dominates the shortlist.
3. **Fetch once, process locally.** Store a per-case bundle (raw page, metadata, extracted text, parsed structure) and **hash it**. Enforce fetch-count of one. Never re-hit the source for analysis.
4. **Segment deterministically** into sections and numbered paragraphs. A re-run must be byte-identical.
5. **Extract per-dimension against the actual legal test**, not by keyword matching. Every extracted finding anchored to a paragraph number, every quotation re-checked verbatim against the stored text.
6. **Synthesise**, with a mandatory **graveyard section** and a **base-rate / calibration section**.
7. **Structure it** into a queryable dataset plus a scenario engine, so that when new information arrives the whole corpus can be re-walked in seconds instead of re-read.

## ⭐ Zero-fabrication grounding, and it takes TWO gates, not one

The single most reusable idea in this layer. Two gates that check **different things**, and either alone leaks:

**Gate A: per-citation existence.** Every cited authority is resolved against the fetched bundle store, on a four-status ladder (well-formed and confirmed · well-formed but unverified · malformed · unresolvable).

**Gate B: reachability at startup.** The engine refuses to run unless **every authority reachable by the renderer** is a fetched bundle. The critical subtlety: the grounding set is *the union of everything the renderer can reach*, **including the human-readable display-name map**, because a display name is exactly where a plausible-looking invented authority hides while never appearing in any branch. Gate A alone lets a fabrication through in any artifact the engine does not render.

### The metric contract that makes "zero fabricated" measurable

```
grounding_pass_rate = 1 − (malformed + unresolvable) / total
```

And **`resolved_rate` is deliberately NOT a gate.** That asymmetry is the honest part: running fully offline with no credential, everything legitimately lands on *well-formed-but-unverified*, pass rate `1.0`, resolved rate near zero. Gating on confirmations would force either a network dependency or a lie. Compatible with RAILS 10 and 11 exactly as it stands, and it ships with a deterministic offline self-test.

A real run over roughly fifty authorities returned `grounding_pass_rate = 1.0` with every entry labelled *well-formed-unverified*, and the accompanying document **said so in plain words** rather than presenting them as confirmed. That is the behaviour to reproduce.

## Base rates are COMPUTED, never typed

Nobody writes a win rate into a document. The scoreboard (outcome distribution, graveyard count, helps/hurts/double-edged split) is **derived from the extraction enums** by a generator.

This is what turns "base rates beat intuition" from an observation into an auditable artifact: **the scoreboard cannot flatter a theory the underlying extractions do not support.** A hand-typed rate can, and will.

### The extraction schema's four load-bearing fields
- **`court_finding` per ISSUE, not per case.** Recording a case-level outcome as a lever outcome is the easiest way in existence to manufacture a false base rate. A case won on an unrelated point becomes a win for whatever lever you were looking at.
- **`appeal_status`**, catches the trial win later reversed, which is otherwise counted as a success forever.
- **`evidentiary_status: confirmed | inference`**: keeps the two from merging.
- **`graveyard_flag`**: makes the graveyard a **query**, not an appendix nobody opens.

### Two refusal rules
- **If you cannot cite it, you cannot claim it.**
- **If no exact operative sentence exists, leave the quote empty.** Never approximate, never paraphrase into quotation marks. An approximated quote is a fabrication that passes every other check.

## Two non-negotiable rules

**FETCH-ONCE, PROCESS-LOCALLY.** Touch the source in a small number of attended stages; all analysis runs offline on hashed bundles. Protects the source, makes the work reproducible, makes the corpus auditable.

**THE FULL DECISION IS THE ONLY SOURCE OF TRUTH.** Any headnote, summary, or AI-generated abstract is a **discovery pointer, never analysis.** Promising leads died on full text in practice, a case that looked like the perfect authority turned out to be about something else entirely with no relevant reasoning in it. Log those as *not-reached*; do not quietly drop them, and never cite from a summary.

## What the findings pattern taught

- **Most theories are graveyards.** Whole dimensions produced zero durable successes. Documenting that saves more money than any single win.
- **A "win" can be worse than a loss.** At least one line of argument, when it succeeded, delivered an outcome materially worse for the person than the conviction they were avoiding. The research existed to *find that out*, and the correct action was to stop developing it. **A tool that surfaces plausible-looking arguments without their downside is dangerous.**
- **Base rates beat intuition, badly.** The dimensions that felt strong were weak; the bars that felt high were low.
- **Log the honest negatives.** "No binding authority exists at this level for this point" is a finding. Silent gaps are how a corpus lies.
- **Build the downside layer explicitly**. Exposure if the matter is lost, and collateral consequences (immigration, licensing, registration, employment) that can dwarf the direct outcome. Frame as *exposure, not prediction*. In practice the collateral layer was the larger risk and was almost invisible until modelled.
- **Never fabricate a citation.** A grounding gate that refuses to run when any cited case is not a fetched bundle. Zero-fabrication as a measured metric, not an aspiration.
- Self-corrections get logged. One synthesis note mis-stated a case's outcome; the underlying extraction was right. Log the correction next to the artifact.

## Product position, be careful here

This is **research support for lawyers**, not consumer output. Handing a lay customer base rates and precedent invites them to self-diagnose, and the failure mode is severe: a customer who talks themselves into a graveyard theory, or out of a defence, based on our summary. Ship it, if at all, as a professional-tier tool with the graveyard and the downside layer **structurally inseparable** from the findings.

Everything in this layer is jurisdiction-specific and must carry a verify-with-counsel marker.

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/`: **the whole layer, not a seam within it.** Output from this pipeline in one jurisdiction is not evidence of anything in another, and it does not degrade gracefully across a border: a base rate from the wrong system is worse than no base rate, because it reads as calibration. Nothing here ships to a jurisdiction with no reviewed pack.
