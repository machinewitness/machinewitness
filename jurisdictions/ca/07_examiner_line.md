# 07: The examiner line · Canada

Where own-device work stops being something this project offers, and becomes a referral.

> **Review state: ⛔ UNREVIEWED.** Until `00_status.md` says otherwise, the line sits at its most conservative position: anything beyond a user-initiated export or a read-only copy of a device the person solely owns routes to counsel.

Engine side of this: `../../docs/methods/01_evidence_layers.md` and `../../legal/consent_and_scope.md`.

---

## The default is a refusal

RAIL 5: *where a capability is examiner-grade or entitlement is unclear, the answer is **"this routes through your lawyer to a licensed examiner"**, not a button.*

**Unclear resolves to referral.** `pack.yaml` → `capabilities.examiner_line_defined` is `false` until a practitioner has read this page, and while it is `false` a consumer offers no recovery capability at all.

---

## 1. Licensing

| Question | Answer |
|---|---|
| Is forensic examination a licensed or regulated activity here | UNANSWERED |
| Licensing body | UNANSWERED |
| Does it reach a person examining **their own** device | UNANSWERED |
| Does it reach a tool, or only a practitioner | UNANSWERED |
| Consequence of unlicensed practice, factually | UNANSWERED |

## 2. Own-device operations, one row at a time

The line is not a single point, it moves per operation. `unclear` means **refuse**.

| Operation | Lawful for the owner? | Product may offer? |
|---|---|---|
| Read a file the user can already open | UNANSWERED | |
| Export from an account the user controls | UNANSWERED | |
| Read-only image of a device the user solely owns | UNANSWERED | |
| Read an OS log the user has permission to read | UNANSWERED | |
| Recover a **deleted** file from unallocated space | UNANSWERED | 🔴 presumed examiner-only |
| Recover from a damaged or failing device | UNANSWERED | 🔴 presumed examiner-only |
| Bypass a lock or passcode on the user's own device | UNANSWERED | ⛔ presumed never |
| Extract from an employer-managed device | UNANSWERED | ⛔ presumed never. Not the user's data to take |
| Extract from a device shared with another person | UNANSWERED | ⛔ presumed never, holds a third party's data |
| Anything touching a device or account the user does not own | ⛔ **never** | ⛔ **never**, RAIL 5, no local variation |

## 3. Why the line matters even where the operation is lawful

Two reasons that are not about legality, and they hold in every jurisdiction:

**Amateur recovery destroys the thing it was reaching for.** Writing to a volume while reading it, mounting read-write by accident, or letting a filesystem replay a journal can overwrite the unallocated space holding the deleted item, and can alter timestamps that were the actual evidence. `../../docs/methods/09_filesystem_and_hash_traps.md`.

**A record a court can rely on needs a custody story a person can give on the stand.** A user-initiated export with a hashed manifest has one. An improvised recovery does not, and the weakness surfaces under cross-examination rather than at capture time.

So the referral is often right even where the operation is permitted. Note any local answer that sharpens this, an admissibility rule, a competence requirement, a practice direction.

## 4. Referral wording

What the product says *instead of* offering the capability. It must be usable by a frightened person with no lawyer yet.

> UNANSWERED

Requirements:

- **Names the next step concretely**, who to ask, in role terms.
- **Says what to do meanwhile:** stop using the device, do not attempt a fix, do not power-cycle repeatedly, keep it as it is.
- ⛔ **No outcome language.** Not *"an examiner can recover it"*. An examiner may or may not. RAIL 7.
- ⛔ **Not a directory, a marketplace, or a referral fee.** Route through counsel; counsel instructs the examiner. That is also what preserves privilege, `05_entitlements.md` §5.
- **Does not require the person to have money.** If there is a legal-aid or duty-counsel route to an examiner here, that is the most valuable line in this file. UNANSWERED.

## 5. Intimate or sexual media, RAIL 6, no local override

⛔ **Hard exclusion at ingest, by content class, no override, in every jurisdiction.**

If a source may contain it: **freeze the container unopened** and route to counsel and a licensed examiner. No preview, no thumbnail, no hash-of-content, no *"just check whether."* Handling it creates independent criminal exposure for the user **and** for maintainers.

This section records the **local consequence** of handling it. Never an exception.

| Question | Answer |
|---|---|
| Local offence classes engaged by possession or handling | UNANSWERED |
| Does it apply to material of the user themselves | UNANSWERED |
| Does it apply to material the user lawfully received | UNANSWERED |
| Any reporting duty on a person who encounters it | 🔴 UNANSWERED. A duty here changes what the product may do next |
| Route for counsel to have it examined lawfully | UNANSWERED |

## 6. Seized, restricted, or condition-bound devices

| Question | Answer |
|---|---|
| Device seized by an investigator, any route for the user | UNANSWERED, counsel's, not the product's |
| Device the user must surrender under a condition | 🔴 UNANSWERED. Capture before surrender may itself breach. Route to counsel |
| Condition restricting device or internet use | 🔴 UNANSWERED, closes capture paths; feeds `01_hazard_wording.md` §2 |

⚠️ **The second row is a live trap.** "Capture it before you hand it over" is the obvious advice and it can be the breach. The hazard gate runs first for exactly this reason, RAIL 9, and `tree.yaml` phase 0.

---

## Reviewer sign-off

| | |
|---|---|
| Reviewer role |  |
| Scope read |   |
| Still unreviewed | everything |

Copy the result into `pack.yaml` → `examiner_line` and `capabilities.examiner_line_defined`.
