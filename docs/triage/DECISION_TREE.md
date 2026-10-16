# The triage decision tree

**What a frightened person needs in the first hour, before any software is installed:** what records exist about them, how long each one has, what to do first, and what not to touch.

This document is the human-readable form, and it is **agent-free forever**: a person holding only a phone, with no tooling at all, still gets the hazard list and the clock from it. It is not a degraded mode and it does not acquire a dependency later.

**`skill/data/tree.yaml` is the contract**, and it is the program the engine walks, change that file, never a copy of it. Amendment procedure: `AGENTS.md` §7.

⚠️ Citations to a landing-page contract below refer to a separate workstream's file, which is deliberately **not** part of this repository. Read them as *the rules binding any interactive rendering of this tree*, and do not create the file here.

---

## Design rules, all load-bearing

1. **The hazard gate runs first, always.** Before a single question about evidence, establish what order or process the person is under and therefore which capture paths are **closed** for them. Giving evidence advice before that ordering is how someone breaches a condition while trying to help themselves. (RAILS 2, 9)
2. **The output is a preservation plan, never an assessment.** It says *these records plausibly exist, this one dies in about eleven days, do these three things in this order.* It never says how strong anything is, never scores, never predicts. (RAIL 3)
3. **Harm-first survives into triage.** Where a layer is double-edged, the tree says so at the point it recommends it, and routes the decision to counsel. It does not quietly drop the layer either. (RAIL 4, `../methods/06_harm_first_doctrine.md`)
4. **Never ask for case detail.** The tree asks about *record types and devices*, never what happened, never who, never what was alleged. Nobody needs to type the facts of their matter into anything to get a preservation plan, and on a public web page they must not (`LANDING_CONTRACT.md`).
5. **Every branch terminates in an action the person can take today**, or an explicit "this one needs your lawyer."
6. **Unsure is a first-class answer** and is treated as *probably yes, go and check*, an unchecked layer is the one that gets lost.
7. **No legal advice, ever.** The tree surfaces categories and routes to counsel. It does not interpret anyone's conditions.

---

## Phase 0: Hazard gate *(cannot be skipped)*

**H1. Are you under any court order, release condition, undertaking, bail condition, protection or restraining order, or workplace directive?** → yes / no / unsure

**H2** *(if yes or unsure)* **Does it include no-contact, non-association, or stay-away conditions?** → sets `no_contact`, which closes capture paths downstream.

**H3. The hard exclusions, `X1`–`X14`.** Shown before anything else, unconditionally, in plain language. Authoritative list is `skill/data/tree.yaml`; the highlights below are the original seven. ⚠️ Count from the contract, never from this document. A prose count of it drifted once already.

**The four that surprise people, and therefore matter most:**
- **`X8`: do not tidy up.** Leaving a shared group, un-sharing an album, removing yourself, cancelling a booking, all of these **notify**. Trying to fix a hazard is usually a fresh, dated, attributable one.
- **`X12`, inbound is not your breach; replying can be.** Including replying to say stop. Preserve it exactly as received, tell counsel the same day, do not respond and do not block-and-delete.
- **`X13`: write it once, then never improve it.** A rough note written immediately beats a tidied one, and the edits themselves become a problem.
- **`X14`: a dropped or "sorted out" allegation changes nothing.** Keep every condition and every record until counsel says otherwise in writing.

Also: `X9` check before signing up for anything at all · `X10` no device-search consent · `X11` never ask anyone what they remember.

> - **Do not contact the other person. Any channel, any intermediary, no exceptions**, including replying to them, and including through a friend or family member.
> - **Do not look at their accounts, profiles, or posts.** Viewing can notify them. Some platforms add you to a conversation just for opening it. This is one of the most common ways people breach a condition without meaning to.
> - **Do not delete anything.** Not a message, not a photo, not an app, not a booking, not a calendar entry, not even one that embarrasses you, and not even one you never wanted. Deleting looks like consciousness of guilt and can be a separate offence. **Preserve, don't purge.**
> - **Do not click links in notification e-mails** about anything involved in this. Many carry a key unique to you, and following one writes a fresh entry into the exact record your lawyer wants clean.
> - **Do not create a second or anonymous account** to look at anything.
> - **Do not explain yourself** to police, an investigator, HR, or the other person's friends. Not to clear it up. Not "just informally."
> - **Do not go anywhere you know the other person to be**, including places you only recently learned they go.

**H4. Do you have a lawyer yet?**
- **No** → the plan narrows to preservation only, plus "get counsel" as item one. Nothing in it requires a lawyer to start.
- **Yes** → everything routes through them; the plan becomes something to hand over.

**H5** *(if `no_contact`)* Any capture path that touches a shared surface is **marked closed** for this person, with the reason. Not hidden. Shown as closed, so they understand it was considered and why it is off.

## Phase 0c, Positive obligations *(`O1`–`O5`)*

**A whole class the tree originally missed.** Conditions impose **duties**, not only prohibitions. Report, notify a change of address, surrender an item, attend somewhere, keep in contact. **Failing a duty is a breach exactly like doing a forbidden thing**, and it is the easiest breach of all because nothing happens to remind you.

- **`O1`** (is anything required of you? **`O2`**) is any of it on a deadline?
- **`O3`**: put every required act and its date somewhere unmissable; tell counsel about each.
- **`O4`: keep a proof ledger.** For every required act, keep proof it was done. **And record every failed attempt the same day**. If the user tried to comply and could not, that attempt is evidence, and it evaporates if it is not written down immediately.
- **`O5`**, unsure whether something is required? Ask counsel *before* the date, not after.

The tree never interprets the obligation. It surfaces the category and routes to counsel.

## Phase 1: The clock

**T1. When did the alleged event happen?** → today / 1–3 days / 4–14 days / 15–30 days / 1–6 months / more than 6 months

This drives everything. It converts each record type into a **countdown**, and the countdown is the most important output in the product.

**T2. Is there a specific window in dispute, a date, and roughly which hours?** → yes / no / not yet known

"Not yet known" is common early and is fine. It widens every preservation request by a day either side, which should be the default anyway (`../methods/03_retention_race.md`).

## Phase 2, Which layers exist

One question per layer, each answerable without knowing anything about law. Full catalogue and limits: `../methods/01_evidence_layers.md`.

| Q | Asks about | Layer |
|---|---|---|
| L1 | A smartwatch, fitness band, or ring worn during the window | Wearable telemetry, **highest density available** |
| L2 | The phone you had with you, and which OS | OS usage / screen-activity logs |
| L3 | A laptop or desktop used around then | Computer power/screen log |
| L4 | Messaging with anyone about it | Chat archives |
| L5 | A booking, registration, order, ride, or ticket involved | Platform records |
| L6 | A building with door fobs or cameras. Home, hotel, office, gym, venue | **Premises records, most perishable** |
| L7 | Card, bank, or transit use in the window | Financial spine |
| L8 | Travel in or out | Travel records |
| L9 | Photos or videos you took | Media metadata ⚠️ RAIL 6 fence applies |
| L10 | Injuries on your own body | **Independent medical documentation, heals in days** |
| L11 | Anyone who saw you or was with you | Witness list (names to counsel, no approach) |

## Phase 3: Output

Three blocks. Nothing else.

**A. Do these things now, in this order.** Ranked by *clock*, not by value. A medium-value record dying in eleven days beats a high-value one that is stable for years. Each item: what to do, roughly how long it takes, whether it needs the lawyer.

**B. The clock.** Per record type: an estimated remaining window, marked clearly as *typical, verify with the holder* (RAIL 7. Never state a retention period as fact), and a red state for anything under 14 days.

**C. Coverage summary, how much this can actually help.** Counted, not judged:
- how many **independent** layers plausibly cover the window (independence computed by device and subsystem, not by counting signals, `../methods/05_convergence_and_classification.md`);
- which are likely **SILENT**, and that this is a normal and honourable result;
- which are **double-edged**, flagged for counsel;
- which are **closed** by the person's conditions, and why.

**Then, plainly:** *this tells you what to save. It does not tell you how strong anything is, and it cannot prove you did not do something. Nothing can.*

## What the tree must never do
- Never ask what happened, who was involved, or what was alleged.
- Never store, transmit, or log an answer (`LANDING_CONTRACT.md`).
- Never produce a strength, likelihood, score, or percentage.
- Never interpret the person's conditions, surface the category, route to counsel.
- Never recommend anything touching the counterparty, even when the user asks. (ADR `0002`)
- Never suggest deleting, cancelling, or "cleaning up" anything.

## ⚖️ Jurisdiction

The **questions** in this tree are jurisdiction-neutral and are the contract. Some of the **vocabulary** in them is not: `H1` asks about a *"release or bail condition, undertaking"*, which are Canadian terms of art. `skill/data/tree.yaml` → `meta.jurisdiction` marks the three sites (`H1`, `H2`, `X3`) whose wording a reviewed pack may replace, and it records `reviewed: false`.

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/01_hazard_wording.md` 🔴 safety-critical · `04_retention.md` for the clocks

⚠️ **A reader who recognises none of those words is still in scope.** The engine's fallback while no pack is reviewed is to show the question as written *and say on screen that the wording is unreviewed and may not match the reader's jurisdiction*. Losing the question would be far worse than mismatched vocabulary. ADR `0005`.

## Still to build
- [ ] Per-jurisdiction retention estimates, each sourced (`../../jurisdictions/<code>/04_retention.md`). ⚠️ The engine's own clocks are **unsourced for every jurisdiction including Canada**. They are orders of magnitude from practice, not confirmed figures
- [ ] Practitioner review of Phase 0 wording per jurisdiction, this is the part that keeps someone out of custody, and it is the part we are least qualified to write alone. ⛔ **Still zero jurisdictions reviewed**, and `jurisdictions/ca/01_hazard_wording.md` is a skeleton. Being the jurisdiction the default wording came from is not a review
- [ ] Plain-language and reading-level pass; the reader is frightened and may not be in their first language
- [ ] Accessibility pass; keyboard-only and screen-reader complete
