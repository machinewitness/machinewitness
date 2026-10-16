# 02: Chain of custody

**The entire commercial moat is here.** Anyone can screenshot their step count. What makes a personal record *evidence* is being able to show it has not changed since the moment it was captured, and that the moment of capture was before anyone had a reason to alter it.

**This cannot be retrofitted.** A record hashed today is a record that was mutable until today. Custody is a capture-time property or it is nothing, which is also why the retention race (`03`) and custody are really one product.

---

## The invariants

1. **Two-tier separation, absolute.**
   - `master/`: originals, exactly as obtained, **never edited, never renamed, never re-hashed.**
   - `processed/`: every derivative: parses, extracts, slices, figures, transcripts.

   Analysis reads from `master/` and writes only to `processed/`.

   **Enforce with a write-path assertion in code, not with filesystem permissions.** Permissions look like the obvious answer and they do not survive the medium: FAT and exFAT (i.e. most USB sticks, i.e. exactly what a user hands a lawyer) carry no meaningful ownership or permission bits. A guard that silently stops existing when the corpus moves to removable media is worse than no guard, because nobody notices it left. Assert the destination path on every write, in the code, and fail loudly.

2. **Never mutate a frozen original, including for a cosmetic fix.** This is the rule people break, and it is unrecoverable. Correcting a typo in a frozen set's README changes its hash, and a changed hash on a custody artifact is indistinguishable from tampering. **A frozen set is amended by adding a dated correction note beside it, never by editing it.** Say this to users in the UI, at the moment they are tempted.

3. **Hash at ingest, in the same pass as enumeration.** List → hash → write the manifest as one atomic operation. Splitting them races the operating system, which is writing into your directory while you work (`09`).

4. **The manifest is a first-class artifact.** Per-file `path`, `size`, `sha256`, `mtime`, plus a set-level count and a capture timestamp. The count is a tripwire: a file-count mismatch against the manifest is the earliest warning that something contaminated the set.

5. **Digests are PULLED from a declared anchor, never hand-authored.** A set declares where its authoritative digest lives (`anchor`, `anchor_mode`, `primary`) and the generator reads it live at build time, **failing loudly** on a missing set, file, anchor, or entry. Never type a digest into a document. A hand-copied digest that drifts by one character is indistinguishable from tampering, and it will drift.

6. **Differential verification, not "all green".** A mature corpus will have known, benign hash failures. **Baseline the pass/fail profile at freeze time and require later verification to match that baseline byte-for-byte.** A gate demanding 100% green gets switched off in the first week; a gate demanding *the same result as last time* catches real changes forever.

   **Empirical finding, and it should shape the whole `doctor` design:** a read-only differential pass across roughly thirty manifests in a mature corpus found **zero mismatched evidence files. Every single failure was a manifest-schema defect**, an unrecorded path base (by far the most common), a manifest referencing itself, a living document filed inside a content manifest, source-side absolute paths, filename normalisation drift, a free-text trailer, CR-only line terminators.

   So when a hash gate goes red, the overwhelmingly likely cause is that **the manifest format was underspecified, not that the evidence changed.** `doctor` must say that, name the probable class, and tell the user how to confirm, because their first instinct on a red hash is panic and their second is to "fix" the frozen set, which is the one unrecoverable move (invariant 2).

7. **Prove the capture wrote nothing, and prove bit-identity *across* the transfer.**
   - **List the source before and after the read** and record that the two listings are identical. That is what turns "we only read it" from a claim into a checkable fact.
   - **Hash on the source side, before the copy.** Re-hash on the host afterwards and diff. Hashing only the destination proves the destination is internally consistent. It says nothing about whether the copy was faithful.
   - **Never accept a copy tool's own report as proof.** "N files transferred, 0 skipped" is the tool grading its own work.

8. **Neutral scope.** Capture the complete export **as produced** (nothing selected, excluded, edited, reordered, renamed) and state that explicitly in the provenance record. Window-filtering belongs in derived analysis, never in the frozen set. A small human-readable core may be lifted for convenience, but only as a **labelled duplicate**, never as a selection. This defeats the cheapest attack on any self-collected corpus: *you kept the parts that helped you.*

9. **Cite by ID + hash. Never duplicate the evidence.** Reports and analyses reference a set by identifier and digest. Copying evidence into a report creates a second, divergent, un-frozen version of the truth. When redundant copies were found in practice, every one was byte-verified against the frozen original *before* removal. Never delete a suspected duplicate without proving it is one.

10. **Provenance record per set.** Where it came from, who obtained it, how, when, under what entitlement or consent, what tool and version. A perfect hash on an unexplained file proves only that you have consistently held something of unknown origin.

11. **Append-only custody log.** Every capture, verification, export, and access appended with a timestamp. Never rewritten.

## Recovery epistemics, when you claim to have recovered something

Distinct discipline, because a recovery claim is the easiest place in the whole corpus to be confidently wrong.

- **Validate the tool on a known-live target first.** Where a parser fails its own sanity check on data known to be present, **nothing may be claimed from it at all**, not even a negative.
- **A null result is a real negative only if that same vector produced a positive on a known target.** Otherwise "we found nothing" means "our tool found nothing", which is not a fact about the data.
- **Exact match only.** A tolerance window (even a couple of seconds) manufactures false recoveries that look like corroboration.
- **Match on content-derived keys, never on row identifiers.** An id-based join produced a phantom recovery that had to be retracted. Identifiers are reassigned; content is not.
- **Re-verify every recovered string against the source bytes, independently of the tool that recovered it.** The tool is not a witness to its own output.
- **Two exports of the same data are never byte-identical**, so hash comparison cannot answer "has anything been altered." That question needs a record-level differential between exports, and it is a different tool.

## Product implications

- **The full manifest and provenance schema** (field names, meanings, and tripwires) is roughly forty fields, and it belongs with the custody implementation rather than in this document. What matters here is that it exists as one schema, that every field earns its place from a specific failure, and that a capture writing a partial manifest is a failed capture.
- `app/custody/` is the trust kernel. It should be small, boring, dependency-light, deterministic, and independently auditable. No feature belongs in it.
- **Verification must be re-runnable by a third party using standard tools** (`shasum`, a published manifest format). If verifying our custody requires our software, our custody is worth much less on the stand. Ship the manifest in a format an examiner can check without us.
- A **hash-anchor** service (`cloud/anchor/`) that timestamps a manifest digest to an external authority converts "captured before I had a motive" from an assertion into something checkable, **without the cloud ever seeing content.** This is the one genuinely valuable cloud feature. See `docs/adr/0001-local-first-custody.md`.
- **Independent verification tooling beats proprietary.** Use `shasum`-compatible digests and a plain-text manifest. Avoid copy tools that quietly carry extended attributes, resource forks, or permission metadata across filesystems. They change what you are hashing. A tuned plain copy plus an *independent* hash check is more trustworthy than a single clever tool that claims to do both.
