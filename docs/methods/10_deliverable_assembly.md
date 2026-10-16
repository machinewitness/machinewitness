# 10: Deliverable assembly

A corpus is not a deliverable. **A lawyer bills by the hour and will not mine a folder.** What gets used is a small number of clean, self-contained, per-topic documents.

---

## What worked

**Per-topic documents, not one giant report.** Separate documents by subject matter, each independently readable and independently shareable. Reasons: different documents have different audiences and sensitivities, one topic can move while others are frozen, and a document that must be read in full to be useful does not get read.

**A single source of truth per document.** Either the upstream is authoritative and generation is one-way, **or** the output is authoritative and the upstream is frozen. Pick one per document, record which, enforce it. Never both.

⚠️ **The real failure was worse than "edits went to the wrong file," and the shape of it is the lesson: the build never ran the port step at all.** So an upstream edit landed in a genuine file, the build reported success, the output rendered cleanly, and the reader read stale text. **Every symptom was "it worked."** Nothing was red, nothing was missing, nothing warned.

Consequences for the tool: a build must **assert that the port ran and that its output is newer than its input**, and fail if not. A pipeline stage that can be silently absent is worse than a stage that breaks, because a broken stage tells you.

**Cite evidence by ID + hash; never embed it.** (`02`)

**Figure placement is a per-deliverable option, not doctrine.** The body-mention-plus-separate-appendix pattern was built, shipped, and then **reversed by the reader's own direction** on the largest deliverable, where figures went inline with their interpretation in an adjacent note box. Both are legitimate:
- *Mention + timestamped appendix* keeps a long argument readable and the evidence block verifiable in one place.
- *Inline with adjacent interpretation* wins when the figure **is** the point and the reader is reading for the figure.

The invariant across both: a figure always carries a **source pointer** (set ID + digest), and it is never the only place a claim appears. Make placement a switch; do not hardcode one and call it correct.

**Classify, do not command.** The document tells the reader what the record shows and what its limits are. It does not tell a lawyer what to do, does not rank tactics, and does not contain internal working vocabulary. Strip all of it before the reader sees it.

**A verification marker used sparingly.** A single consistent symbol for "this needs professional verification." Used on everything it means nothing.

**A table of authorities / source table with working links**, where citations are used at all, every one resolves. Never a citation that cannot be opened and checked.

## Gates before anything leaves

The seven principles below are the *doctrine*. They were implemented as an inventory of **46 gates across 6 layers (36 blocking, 10 advisory**) and that inventory belongs with the code that runs it. The layers: deny-gate · staging · packager · generator · port · **editorial**. The count is worth stating because it is the honest scale of the problem: a report generator that a lawyer will rely on is mostly gates.

⚠️ The **editorial layer is missing from this file and from `07` entirely**: the written-document contract (classify-don't-command, an explicit KEEP list, no working-document citations, the dangling-cross-reference rule, honest-limits placement, a verification marker that is colour *plus* glyph *plus* word) is the most reusable non-code artifact in the whole corpus, and it exists only because a human reviewer rejected two successive drafts. Port it as documentation before porting any code.

### The five gates worth building first
1. **Record fidelity**: byte-equality of every verbatim span against source, with an *expected-FAIL-then-re-baseline* protocol for legitimate changes. It exists because an automated editing pass **silently paraphrased a quotation.** Any tool that rewrites prose can alter a quote without anyone noticing, which inverts meaning while every other check passes.
2. **Ship-list == cite-list, with asymmetric verdicts**: over-ship **FAILS**, under-ship **NOTES**. It exists because a sensitive set once rode a shareable bundle *completely uncited*.
3. **Render-surface sweep with a fail-closed extractor probe**. A present-but-unreadable output must **FAIL**, never silently pass on a source-level scan.
4. **Config and topology self-consistency**. The cardinal error is a configuration mistake before it is ever a copy mistake. Check the map before trusting the move.
5. **Shipped-bytes and orphan-directory sweep**. Scan **what ships**, never the source tree. They diverge, and the divergence is where leaks live.

Learned by nearly shipping leaks:

1. **Render is the QA surface, not source.** Extract text back out of the finished PDF/HTML and check *that*. Source-level greps pass broken output and flag fine output. (`07`)
2. **A leak audit on generated bibliographies and metadata.** A generated reference entry can quietly carry a source **filename** or **path** that discloses exactly what a redacted document was meant to hide. Check the machine-generated parts, not just the prose.
3. **Ship-list must equal cite-list.** What gets packaged must match exactly what the document references. Over-shipping is a **failure**, it leaks material the document never needed. Under-shipping is a note if references still resolve.
4. **Sanitise every derived filename.** Output names built from document titles or subject names leak the subject in the filename. The filename is part of the deliverable.
5. **Author sensitive documents clean from the start**: write them without the sensitive value present, rather than writing them normally and substituting later. Substitution misses instances; case-sensitivity, possessives, and hyphenation all defeat it.
6. **Redact scaffolding, never verbatim evidence.** Editing a quoted original breaks its hash and its custody. If a verbatim artifact cannot be shown, exclude it. Do not modify it.
7. **A silent pass is a failure.** A gate whose extraction step returns empty must **fail**, not pass. An empty check that reports success is worse than no check.

## Figure integrity, how a chart lies without anyone lying

A figure is the highest-trust, least-audited artifact in a deliverable. A reader accepts it in a second and never checks it. These rules exist because each failure produces a chart that is *visually confident and factually false*, and unlike prose, nobody proofreads a plot.

1. **Gap-aware series splitting.** Never let a line interpolate across a dropout. A connecting segment through missing data is an assertion that data existed there.
2. **An empty panel must announce its own blindness.** A blank axis reads as *flat* or *zero*, which is the exact opposite of *unknown*. Print "no data, sensor not recording" **into** the panel.
3. **No phantom axes.** Do not render a scale for a series that has no data.
4. **Print the resolution on the axis.** A reader cannot otherwise know whether a brief event could fit between samples (`05`).
5. **Label account-derived annotations *on the figure*.** Where a marker comes from someone's recollection rather than the record, the figure must say so, otherwise the plot silently promotes testimony to telemetry.
6. ⭐ **Emphasising a sensitive window force-enables the confound overlay.** The best pattern in the corpus: if the generator is asked to highlight a contested period, it *automatically* draws the confounding signals alongside it. **Harm-first implemented in the generator rather than trusted to review**. You cannot produce the flattering version of the chart, because the flattering version does not exist as an option.
7. **Name the source device per series** where an export mixes devices (`01`).
8. **State the timezone and which anchoring method proved it** in the caption (`01 §A`).
9. **Same quantity, same scale, across every figure in a document.** Rescaling between plots manufactures apparent differences.
10. **A figure is never the only place a claim appears.** If it is not in the text with a source pointer, it is not in the deliverable.

## Product shape
`app/report/`:
- structured findings from `app/timeline/` (`05`) → templates → render;
- **adverse section first**, mandatory, non-collapsible (`06`);
- honest limits attached per finding, mandatory field;
- appendix of figures, timestamped, each citing its source set;
- a manifest of exactly what is included, matching the citations;
- gate suite as above, **fail closed**, results logged;
- deterministic: same corpus → same bytes.

**Export packaging:** per-topic bundles the user can hand over on physical media, each self-contained and each individually gated. A bundle that will never be shared externally is marked as such and **excluded from automated packaging by default**, so it cannot be shipped by accident.
