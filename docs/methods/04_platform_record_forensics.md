# 04: Platform-record forensics

**The keystone insight, and the most defensible piece of product IP.**

> **What a platform's UI shows a human is not what the platform's database stores. Accusations get built on the screenshot. Defences get built on the field.**

A screenshot of a platform surface is a *render*. It is produced by client-side code applying a human-friendly label to some underlying value, and that label is very often not the thing it appears to be. When an allegation rests on such a render, the work is: identify the actual underlying field, establish what it does and does not record, and then find and demand **the authoritative record**, which is nearly always held server-side or on the operator's side, not on the accuser's screen.

---

## The worked pattern (abstracted)

A platform surface displayed a participant count with a past-tense label implying **attendance**. Reading the page's own data payload showed the label was a client-side string applied over a field that counted **sign-ups**. No field for attendance existed anywhere in the accessible payload. The platform's own operator documentation confirmed that attendance was recorded by a completely different mechanism (an operator-side scan at the door), producing a **per-participant audit trail that would show a sign-up with no corresponding check-in.**

So the render said one thing; the schema said another; and the record that could actually settle it sat with the event's operator.

**Three moves, in order:**
1. **Read the payload, not the page.** The underlying values are usually present in the response the client rendered from.
2. **Establish the schema's limits from the operator's own documentation**: freeze those help-centre pages as evidence, because vendors rewrite documentation silently and the version that was live on the date is the one that matters.
3. **Name the authoritative artifact and demand it** through counsel: the operator-side, per-participant audit trail. Not a screenshot of it. The record.

**Generalises to:** "Seen"/read receipts. "Active now". Last-seen. "Joined". "Attended". "Viewed". Login/location banners. Any count. Any past-tense verb in any UI. Every one of these is a label over a field, and the field is usually weaker than the label.

---

## Rules

1. **Never accept a past-tense UI verb as a record of an act.** Find the field. `Went`, `Attended`, `Joined`, `Read`, `Delivered`, `Viewed`, `Online` are labels.
2. **Freeze the operator's documentation on the date, with the page.** Terms, help articles, schema notes, API docs. They are evidence about what the platform could and could not record, and they change.
3. **Prefer the server-attested artifact over any render.** The original `.eml` over the screenshot. The `.ics` over the calendar view. The API response over the page. The operator's log over the participant's view.
4. **Look for what the record does NOT contain, and say so.** "No field for X exists anywhere in this payload" is a strong, checkable, honest statement. Much stronger than an argument about what X means.
5. **Absence of an authoritative record is a classification, not a gap to paper over.** If the settling record cannot be obtained, that layer is **SILENT** (`05`) and is reported as SILENT. Do not substitute a weaker layer and imply it answered the question.
6. ⛔ **Do all of this without touching a live counterparty-adjacent surface.** Root `CLAUDE.md` RAILS 2 and 9. Never enumerate a participant list. Never open a platform's chat surface, several auto-join anyone who opens them, converting a read into a contact. Never follow a per-recipient tracked link. Never create a pretext account. Work from: the user's own already-received artifacts, the operator's public documentation, and records obtained through counsel.

## Product shape
`app/capture/platform/`: per-platform adapter with three parts:

| Part | Job |
|---|---|
| **Extract** | Pull the payload/original artifact from what the user *already has* (their email, their export, their own account page) |
| **Schema note** | Machine-readable statement of what fields exist, what each records, what has no field at all, dated, sourced to frozen operator docs |
| **Authoritative-record pointer** | Names the operator-side artifact that would settle the question, and who holds it → feeds the demand generator (`03`) |

Every adapter must pass a **read-path safety audit** before shipping (`08`).
