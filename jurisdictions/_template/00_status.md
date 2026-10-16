# 00: Review status

**Fill this file first, before any other file in the pack.** A pack without an honest status file is not a pack; it is an unlabelled legal claim.

---

## Declared state

| Field | Value |
|---|---|
| Jurisdiction | `<name>` (`<iso code>`) |
| Subdivision | `<or "national">` |
| Pack version | `0` |
| **Review state** | ⛔ **UNREVIEWED** |
| Reviewer role |  |
| Legal system | `<common law / civil law / mixed>` |

`review.state` in `pack.yaml` must match this table exactly. If they disagree, the consumer trusts neither.

Three states, and only three:

| State | Means | A consumer may |
|---|---|---|
| `unreviewed` | No practitioner has read any of it | Use the engine only. Must say so on screen |
| `partial` | Some files reviewed, listed below | Use the reviewed files. Refuse the rest |
| `reviewed` | Every file read by a practitioner in this jurisdiction | Use the pack |

## Per-file review

| File | Reviewed | Reviewer role | Notes |
|---|---|---|---|
| `01_hazard_wording.md` | ⛔ no |   | 🔴 safety-critical, runs before any evidence advice |
| `02_barred_reasoning.md` | ⛔ no |   | |
| `03_demands.md` | ⛔ no |   | |
| `04_retention.md` | ⛔ no |   | |
| `05_entitlements.md` | ⛔ no |   | |
| `06_advertising.md` | ⛔ no |   | binds outward-facing copy |
| `07_examiner_line.md` | ⛔ no |   | |

## Reviewer identification, role only

⛔ **Never a name, a firm, initials, or a bar number.** Record a reviewer as:

> criminal defence counsel, 10+ years, practising in `<jurisdiction>`

That is enough for a reader to weigh the review and not enough to identify anyone. **Anonymity protects the reviewer at least as much as it protects the project, and it fails permanently and retroactively on the first mistake**. A name, once pushed, is in every clone and cache. A reviewer who wants public credit for the review can say so themselves, elsewhere; the pack is not the place.

## What is still unreviewed

Be specific. "Everything" is honest while nothing has been read; once something has, list what has *not*, because that is the list a reader needs.

- Everything.

## Known gaps and open questions

Things a reviewer flagged as genuinely uncertain, or that need a second practitioner. This section is the most valuable part of a partially-filled pack. It is the question list for the next person.

- none recorded yet

## Changes

Newest first. **No absolute dates**. The gate's temporal class is strict with no exemption path. Use pack versions and relative phrasing.

| Version | Change | Reviewed |
|---|---|---|
| 0 | Skeleton created from `_template/`. No content, no review | ⛔ no |
