# 03: The retention race

**The most valuable thing the product does, and the most time-critical.** Most third-party records that could corroborate a person's account are on a short overwrite loop. The window to save them is measured in days, and it opens the moment an accusation exists, which is usually *before* the person has a lawyer, and always before they think of it.

If the product does exactly one thing well, it is this: **on day zero, tell the user which perishable records exist, how long each has, and generate the demand that stops the clock.**

---

## Typical retention realities (verify per holder. Never state these as fact to a user)
| Record | Order of magnitude |
|---|---|
| Building / venue CCTV | days to a few weeks; commonly a ~14-day rolling loop |
| Door-fob / access-control events | weeks to months |
| Ride-hail / delivery trip detail | months, but in-app detail degrades |
| Platform event/registration audit trails | indefinite in principle, unpredictable in practice |
| Carrier call/SMS metadata | months, and generally needs legal process |
| Device-local OS usage logs | days to weeks, rolling; **capture immediately** |
| Wearable cloud history | long, but export links expire quickly once generated |

**Product behaviour:** a countdown, per record, from the incident date. Not a checklist, a clock. The single highest-leverage UI element in the whole product.

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/04_retention.md`

⚠️ **Every figure in that table is an order of magnitude, and none of them is sourced.** Not for Canada either. They are what practice suggested, not what a statute, regulator, or holder confirmed, and a holder's real setting is whatever their administrator configured. The *race* transfers everywhere; the numbers do not, and until a pack sources them the product shows these flagged as unverified. Under-promise: if a range is 14–30 days, plan on 14. RAIL 7.

---

## ⚠️ First, the correction: requesting an unseen record is an irreversible decision

Everything below reads as "send the demand." **That is wrong as an unqualified rule, and it is the most dangerous simplification in this file.**

Nobody on our side has seen the record. It could show a departure nobody mentioned, contradict the user's own account or their own witness, or become the other side's best exhibit. And **once a third party has been asked to preserve and produce, it cannot be un-asked**. The request exists, the holder knows, and in many routes the other side learns of it or receives it too.

So the decision to request is a **legal strategy decision, not a preservation chore**, and it belongs to counsel. What the product does about that:

- **Generate and brief. Never auto-send.** A mandatory acknowledgement step stating plainly: this cannot be withdrawn, and neither you nor your lawyer knows what the record shows.
- **The clock still runs**, so this is a decision to make *fast*, not a decision to defer. Surface the deadline and the irreversibility together.
- Preservation *by the holder* and production *to us* are separable. Where the route allows, freezing the record without anyone reading it buys time to decide, and that is usually the right first move.

### The four-rung route ladder, and the double-edge on the last rung
A single path does not exist. Rungs, in ascending order of force and descending order of control:

1. **Voluntary production** on request, with consent where standing requires it.
2. **A data-protection subject-access request.** Reaches only the user's *own* personal information, and its statutory clock is typically far longer than the retention loop, so it is often useless against a two-week overwrite, and valuable for everything slower.
3. **Formal compulsion** through the proceeding.
4. **Asking investigators to seize it.** ⚠️ This means **they see the unseen record first, unfiltered, before anyone on our side.** It is a real route and sometimes the only one. It must be documented, and it must **never** be surfaced as a button.

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/03_demands.md` · `05_entitlements.md`

**The ladder is the transferable part. Every rung's existence and force is local.** Whether a voluntary request binds anyone, whether a subject-access right exists at all and how long its clock runs, what compulsion is available and whether the person may invoke it themselves or only counsel. All pack answers. A jurisdiction may have a rung this ladder does not, or lack one it assumes. **The engine never auto-sends on any rung** (`tree.yaml` → `never: auto_send_any_third_party_request`), and nothing in a pack changes that.

## The distinction that decides cases: a SEARCH is not a PRESERVATION
Asking a record-holder "can you check whether you have footage from that morning" produces a *search*. It does not stop the loop. Ten days later the answer is "we had it."

**Always demand, in writing, and get written confirmation back:**
1. The **retention period** for the specific system, stated by the holder.
2. **Preservation**: the specific window pulled off the loop and held, confirmed **in writing**. A verbal "yeah we'll keep it" is nothing.
3. **Scope**, deliberately widened beyond the obvious: which cameras exist, what areas they cover, **which exits are uncovered**, and **which cameras were not recording**. The negative answers are frequently the valuable ones.
4. A **window wider than the claim**: a day either side. Claim windows move, and they move after you have sent the letter.
5. **No release to any other party without notifying counsel**, so the user learns what the other side has and when.
6. **The recording system's time source and clock accuracy.** Then, before relying on any time inside a produced record, **verify its internal clock against a known reference.** A third-party clock is nobody's calibrated instrument: it drifts, it is set by hand, it misses daylight-saving changes. **A timestamp we cannot vouch for is worse than no timestamp**, it invites a correction that discredits everything around it. A third-party clock is also its own independence-failure node (`05`).

## Standing and consent, the trap that stops the request cold
The user often has **no standing of their own** over the record they need. A guest in a building, a visitor at a venue, a passenger on someone else's account. The holder will refuse, correctly.

**Route:** the person or entity *with* standing (tenant, account holder, employer, host) makes the request in writing, with counsel copied, and the user's representative attends in person. Document the consent chain as carefully as the evidence. A record obtained without a clean entitlement chain is a record the other side attacks instead of answering.

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/05_entitlements.md`

*Who* counts as having standing, and what a holder may lawfully accept as consent, are local. The discipline of documenting the chain is not.

**Product feature: a consent-and-standing wizard.** Determine who actually has standing, generate *their* letter, capture their written authorisation, and record the chain. This is unglamorous and it is where requests die.

## Drafting discipline, learned by getting it wrong
- **State a purpose, do not characterise the evidence.** "Counsel requires records relating to presence at these times" is a purpose. "Records showing he was asleep at home" is a characterisation, and it hands the holder (and later the other side) your theory before you have seen the record.
- **Never invite the holder to interpret.** Ask for the record, not their opinion of it.
- Once a request is sent, **its wording becomes a fact in the case.** If it named a time band or asserted a purpose, everyone downstream (including any witness who read the email) is now anchored to it. That makes free-recall discipline *more* important, not less: brief anyone giving a statement that they must recount what they remember, not what the letter said. Never walk back an already-sent purpose line, supplement it, note the limitation, move on.
- **If footage or a record is offered, the user does not view it.** It goes to counsel, and it enters as a **new, separately hashed evidence set** (`02`). A user viewing raw third-party footage first contaminates their own account of events and hands the other side a cross-examination gift.
- **Nothing is ever cancelled or deleted**: not a booking, not a calendar entry, not a registration, not an auto-created artifact. Even an unwanted, automatically-generated entry stays. Deleting it looks like consciousness of guilt and can be an offence in itself. **"Preserve, don't purge" applies to things the user wishes did not exist.** That is precisely when it matters.

## Capture the AS-SENT letter, not the draft

The draft is what we meant. **The as-sent text is the operative document**, and it is what everyone downstream is anchored to.

- **Capture the as-sent version verbatim**, at the time of sending, as its own artifact.
- **Diff it against the draft** and produce a gap table: what was dropped, and where each dropped ask is recovered.
- **Recovery letters widen and add only.** Never contradict, never retract, never re-explain the earlier wording. A supplement is credible; a correction invites the question of why the first version said what it said.

## The holder-contact log, same day, fixed form

Every interaction with a record-holder gets logged **the same day**, on a fixed form. A parallel note left blank for two weeks in practice became reconstruction rather than record, and the honest recovery was to date it honestly. Never to write better prose after the fact.

Fields that earn their place:
- Who was spoken to, their role, and how they were reached
- **Did anyone say the record *exists*, or only that they would *look*?** These are constantly conflated, and only the first is worth anything.
- What proof of standing or identity they demanded
- Whether preservation was confirmed **in writing**, or only verbally
- What they said the retention period is, and whether they were sure
- ⭐ **"Has anyone else asked about this premises, or about this date?"**: the highest-value question available, because it reveals whether the other side got there first and what they asked for.

## Product shape
`app/capture/` owns device-local layers (fast, do them first, they are on the shortest clocks). A **demand-generator** module owns third-party layers: holder identification, standing resolution, letter generation from templates, written-confirmation tracking, and the countdown. Templates are jurisdiction-reviewed content, not code.

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/03_demands.md` §4

**No pack, no templates, no demand generator.** The module is engine; every letter it emits is pack content, and a pack with `demand_templates_available: false` means the generator has nothing to generate. This is the clearest case in the corpus of the engine being useless on its own, and the reason the coverage table in `../../jurisdictions/README.md` is honest about a zero.
