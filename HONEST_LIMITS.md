# Honest limits, the doctrine

**The product's single most important sentence, and it must appear in the UI, not just the docs:**

> **A record is a cross-check on a claim. It is never proof of innocence.**

**And the second sentence, because most of this runs through an assistant:**

> **AI makes mistakes. If your life depends on it, double check its output.**

That is not a disclaimer bolted on at the end. An assistant will state a retention figure it was never given, tidy a rough note into a better-sounding one, and summarise a folder it only partly read, and every one of those is worse here than being unhelpful, because a frightened person will act on it and a hostile reader will find it. Read what the assistant produced before it goes anywhere, and read it as though somebody is looking for the seam. **The steps that look finished are the ones to check hardest.**

Every layer, every figure, every classification carries its own limits, and those limits are a **mandatory field on the data structure** (`docs/methods/05`), not prose someone remembers to add.

---

## The limits that recur, and must be enforced in software

| Limit | Statement the product must make |
|---|---|
| **Device ≠ person** | A device record proves what a device did. It does not prove who held it. |
| **Absence proves nothing** | A quiet device does not show nothing happened. A busy one does not show something did. |
| **Resolution** | A brief event can fall between samples. A gap between bins is not an absence of the event. |
| **Off-body / off-wrist** | A wearable not worn produces silence, not a negative. |
| **Provenance** | A signal is only as attributable as the device that produced it, and multi-device exports mix them. |
| **Action ≠ content ≠ actor** | A deletion, an unlock, an upload: the log records that something happened. It is silent on what, and on who, and on whether it was done freely. |
| **Timing of deletion** | A "deleted" placeholder usually carries the send time, not the delete time. |
| **Label ≠ field** | A UI's past-tense verb is a client-side string over a weaker underlying value (`docs/methods/04`). |
| **The double-edge** | Some layers help on one claim type and harm on another. Flagged automatically, resolved only by a lawyer (`docs/methods/06`). |
| **Silence is a result** | A layer with nothing to say is reported as SILENT, prominently. |
| **⚖️ The legal layer is unreviewed** | Wherever this product touches law, the answer is local and **no jurisdiction has been reviewed by a practitioner**, not one, Canada included. The engine's clocks, entitlement routes, and barred-reasoning list are one practitioner's experience, unchecked. `jurisdictions/README.md`, ADR `0005` |

## What the product will not do, stated to the customer plainly

- **No verdict, score, or prediction.** No "strength of case" number. A number invites the customer to make life decisions on our arithmetic.
- **No legal advice.** We are a forensics and custody tool. Every legal question routes to their lawyer, and the UI says so at the point the question arises.
- **No interpretation of their conditions or obligations.** We surface the categories and prompt them to ask counsel.
- **No handling of intimate media** (RAIL 6): freeze the container, route to an examiner via counsel.
- **No examiner-grade recovery**: key recovery, device rooting, deleted-content reconstruction. Those are real, they worked in practice, and they belong with a licensed examiner instructed by counsel, because their *provenance* will be attacked and their legality is jurisdiction-specific. **We ship the referral and the scope-of-work document, not the capability** (`docs/methods/01_evidence_layers.md`). ⚖️ **[JURISDICTION]** → `jurisdictions/<code>/07_examiner_line.md`, where the line falls is local; **that unclear resolves to referral is not** (RAIL 5), so with no reviewed pack the answer is always the referral.
- **⚖️ No legal answers for your country.** The engine works everywhere. The legal layer. What your conditions forbid, what you may demand, how long a holder keeps a record, which arguments are barred, exists in `jurisdictions/`, and **every pack there is an unanswered question list.** Stated plainly rather than buried: this is a preservation tool with an unreviewed legal layer, and that is why *get a lawyer* is the first instruction and not the last.

## Why this sells rather than costs

Counsel's default assumption about any consumer "evidence" tool is that it over-claims, and they are usually right. A tool that states its limits harder than the customer would like is the only kind a lawyer will put their name near. **The limits are the product's credibility, and credibility is the whole business** (`docs/methods/06`).

The customer-facing version of this is short and should be said early: *we cannot prove you did not do it. Nothing can. What we can do is make sure the record of what your devices actually saw still exists, is provably unaltered, and is in your lawyer's hands. Including the parts you will not like.*
