# 03, Preservation demands on third-party record holders

Whether a demand binds anyone here, who may send one, and the templates.

> **Review state: ⛔ UNREVIEWED.** Until `00_status.md` says otherwise, no template on this page may be presented to a user as effective.

Engine side of this: `../../docs/methods/03_retention_race.md`. Find perishable records, order by clock, ask before overwrite. That method transfers everywhere. **Whether the asking has any teeth does not.**

---

## ⛔ The product never sends one

`tree.yaml` → `never: auto_send_any_third_party_request`. **Generate and brief only.** A request to a record holder cannot be un-sent; it is dated, attributable, and it tells a third party that a proceeding exists. Nothing in this pack changes that, and `pack.yaml` → `demands.auto_send` is permanently `false`.

⚠️ **A demand can itself be a hazard.** If a holder is connected to the counterparty (a shared workplace, a venue both parties use, a landlord) sending a request may reach them. Note any local risk of that here, and route the case to counsel rather than building a check for it.

---

## 1. What arrives without any demand at all

Fill this **before** the routes below. If disclosure obligations already deliver a record, a demand is wasted effort and an avoidable contact.

| Question | Answer |
|---|---|
| Prosecution / investigator disclosure duty | UNANSWERED |
| What it covers, in record classes | UNANSWERED |
| When it typically arrives, as a duration from what event | UNANSWERED |
| Is there anything the person must do to trigger it | UNANSWERED |

Cross-reference `05_entitlements.md`: a subject-access request to the person's *own* account is usually the safest and fastest route, and needs no demand at all (RAIL 5).

## 2. Routes

Each route a person or their counsel can use to ask a holder to keep a record.

| Route | Who may send | Binds the holder? | Authority | Typical response window |
|---|---|---|---|---|
| UNANSWERED | | `"yes"`/`"no"`/partial | | (duration) |

For each route also record:

- **What the holder is obliged to do**. Keep, produce, or merely acknowledge. Keeping and producing are different asks and often different routes.
- **Whether a court or tribunal must be involved**, and if so that it is counsel's step.
- **Consequence of non-compliance**, factually. ⛔ No outcome language (RAIL 7).
- **Cost**, if any.

## 3. Can the person send one themselves?

**Answer:** UNANSWERED

This is the answer that decides whether the product may offer a template to a user at all, or only a briefing document for counsel.

⚠️ **Unauthorised practice.** A template that reads as legal process, filled in by a product, may cross a local boundary, `06_advertising.md` §unauthorised practice. Check both before enabling a self-serve template.

## 4. Templates

Plain-text, no letterhead, no identity, nothing pre-filled about any party.

| File | Route it serves | Reviewed |
|---|---|---|
|   |   | ⛔ no |

Template rules:

- **Placeholders only:** `<SOURCE>`, `<DEVICE>`, `<WINDOW>`, `<PARTY>`, `<PLATFORM>`. ⛔ Never a real name, address, or reference number, even as an example. RAIL 1.
- **Ask for preservation, not production**, where the routes differ. Preservation stops the clock and needs less.
- **Widen the window by a day either side** by default. `tree.yaml` T2 sets this regardless of the answers.
- **No outcome language, no accusation, no characterisation of anyone.** The letter says what to keep and until when.
- ⛔ **Never request a record about another person.** RAIL 5. Own account, own device, own export, or a premises record obtained with the holder's consent.

## 5. Holder classes and local practice

Practical notes on who actually holds what here, and how they respond in practice. The gap between the legal answer and the operational one is where records die.

| Holder class | Local practice notes |
|---|---|
| Premises operators, buildings, venues, transport | UNANSWERED, often the shortest clock that exists |
| Platforms and telecoms | UNANSWERED |
| Financial institutions | UNANSWERED |
| Employers, schools, institutions | UNANSWERED |
| Medical | UNANSWERED |

---

## Reviewer sign-off

| | |
|---|---|
| Reviewer role |  |
| Scope read |   |
| Still unreviewed | everything |

Copy the result into `pack.yaml` → `demands` and `capabilities.preservation_demand_binds` / `demand_templates_available`.
