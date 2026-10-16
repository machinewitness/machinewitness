# 08, Capture hazards: reading can create evidence against the user

**The most counter-intuitive lesson carried over, and a genuine safety issue.**

A person under an accusation (very often under a formal no-contact order) needs to gather evidence. But **the act of gathering can itself be the offence**, or can spoil the record they are trying to preserve. A passive-looking read frequently writes something somewhere.

Getting this wrong does not produce a bug report. It produces a re-arrest.

---

## Real hazard classes

| Hazard | What happens |
|---|---|
| **Auto-join surfaces** | Opening a platform's chat/comment/thread surface can add the user as a participant. A read becomes a **contact**. Never open them. |
| **Per-recipient tracked links** | A link in a notification email often carries a per-recipient key. Following it writes a **present-day entry into the very audit log** the lawyer needs clean, and reveals the user interacted with it now. Never click; extract the artifact from the message itself. |
| **Read receipts / seen / typing / online** | Opening a thread broadcasts to the other side. A "seen" is an interaction artifact with a timestamp. |
| **Presence and last-seen** | Merely having the app in the foreground updates state visible to the counterparty. |
| **Profile-view notifications** | Some platforms tell the other party you looked. |
| **Follow/friend/contact-sync** | Installing or signing in can trigger contact matching and generate a suggestion or notification to the counterparty. |
| **Session and login artifacts** | A fresh login writes a device/location entry that becomes discoverable and needs explaining. |
| **Accidental transmission** | Auto-complete on a recipient field, a reply-all, a stale CC list, an auto-invite from a calendar entry. A single mis-addressed message can constitute contact. Seen in practice: an ordinary accidental CC became the basis of a breach allegation. |
| **Knowledge acquisition** | Learning where someone spends time can itself trigger a condition worded around places the user *knows* the other person to frequent. **Researching can create the liability.** |
| ⚠️ **Remediation notifies** | The most under-stated hazard here. **Trying to fix a hazard is often a fresh hazard.** Leaving a group notifies the group. Un-sharing notifies. Cancelling a booking notifies the organiser and can auto-remove the user from a channel in a way the other side sees. The instinct to clean up is the instinct to generate a dated, attributable, adverse event. |
| **Third parties keep the channel alive** | The user leaves; someone else re-adds them, forwards, or replies-all. Leaving a channel does not end the user's exposure to it. |
| **Rendering fetches remote content** | Merely *displaying* a captured notification can fetch remote images, unfurl a link preview, or resolve a tracking pixel, from the user's IP, today. A "read locally" operation reaches out over the network unless it is explicitly prevented. |
| **Body ≠ attachment** | A message's visible body and its attachment can differ, so the user holds text they have never seen. Never assert what a message does or does not contain until **every MIME part** has been enumerated. |
| **Displayed time ≠ header time** | A mail client's rendered timestamp is not the message's own header field, and several machine stamps can sit seconds apart. **Name the field you are citing.** |

## Hard rules for every capture adapter

1. **Read-path safety audit is a shipping gate.** Documented, per adapter: every write, every outbound signal, every notification the read can trigger. Unaudited adapter does not ship.
2. **Prefer artifacts the user already holds.** Their inbox, their local files, their completed data export. Zero live surface, zero hazard.
3. **When a live surface is unavoidable:** authenticated as the user, read-only, no navigation into counterparty-adjacent regions, and **prove** the session generated no outbound signal. Capture the network trace as part of the evidence.
4. **Never a pretext or secondary account.** Offered in practice, declined. It manufactures a fabrication allegation and can be an offence in itself.
5. **Never enumerate or search a participant/guest/follower list.** Not "just to check." Enumeration is the exact act that looks like the thing being alleged.
6. **Never a "send" surface.** If an adapter's screen has a compose box, the adapter is wrong. Build the reader without the writer.
7. **Never delete or cancel anything**: including auto-generated artifacts the user never wanted (`03`).
8. **Kill-switch on ambiguity.** If it is unclear whether a read writes, do not read. Freeze the container, route to counsel.

## ⚠️ Our own output is a knowledge-acquisition vector

The sharpest finding in this area, and it constrains **us**, not the user.

If a condition is worded around places the user *knows* the other person to frequent, then **reading their own defence file transfers exactly that knowledge.** A preservation plan, a coverage summary, a report, anything we generate that names or implies where the other party goes, what they use, or when they are somewhere, hands the user knowledge that makes a condition bite harder than it did before they opened our software.

**Consequences, and they are real product requirements:**
- Never surface a location, venue, platform, schedule, or habit of the counterparty in any output. Not as context, not "so you know what to avoid."
- Where an exclusion must be communicated, express it as a **category and area** the user should check before acting, not as a fact about the other person.
- The pre-action screening check (below) asks about the user's **own** intentions and never returns information about anyone else.
- Any feature that would "help you avoid them" is the same hazard wearing a helpful face. It is out (ADR `0002`).

## ✅ The abstention record, proving a negative

The corollary, and a genuinely useful evidence class that is easy to miss: **reading your own already-captured or blocked archive is not contact**, and the record can affirmatively corroborate *abstention*.

An OS usage log showing an application was **never opened** across a window is positive evidence of not-doing, from an independent subsystem. Same for a blocked-state capture, or a channel the user was auto-added to and demonstrably never engaged with.

- Capture the blocked or muted **state** as its own artifact, at the time it exists.
- Where a hazard was avoided, look for the layer that proves it was avoided, and record it deliberately rather than hoping someone notices later.
- Same honest limits apply: it proves a **device** was not used, not that a person did nothing (`HONEST_LIMITS.md`).

This also matters for the product's tone: the rails must not over-block. Reading one's own captured data is safe and should be encouraged; it is the live surfaces that are dangerous.

## Product implications

- **Capture adapters are a security surface, not an integrations backlog.** Each needs a threat model. This is the strongest argument for a small, curated set of high-value adapters over broad coverage.
- **Data-portability exports are the safest possible path** and should be the default recommendation wherever they exist: the platform hands over its own records, under legal obligation, with no live interaction at all. Slow. Worth it.
- **A compliance-briefing step belongs in onboarding**, before any capture: what order is the user under, what does it prohibit, which capture paths are therefore closed for them. Consequences flow into which adapters are even offered. This is a **product feature** (it is the thing that keeps the user out of custody) and it must be reviewed by a practitioner per jurisdiction, not written by us.

  ⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/01_hazard_wording.md` 🔴 **safety-critical**

  **This is the highest-stakes pack file there is**, because it runs before any evidence advice and a wrong answer is how somebody breaches a condition while trying to help themselves. The *structure* transfers. Establish the order first, close the paths, then capture. The *vocabulary* does not: `../../skill/data/tree.yaml` currently asks about a "release or bail condition, undertaking", which are Canadian terms of art, and **no practitioner has reviewed that wording for any jurisdiction including Canada.** The engine's fallback while a pack is unreviewed is to show the question anyway and say on screen that the wording is unreviewed. Losing the question entirely would be worse than mismatched vocabulary.
- **A pre-action screening check.** Before the user does an ordinary everyday thing that could brush a condition (signing up for something, going somewhere, joining something), a short hard-exclusion checklist. Never implemented by browsing the other party's data. Implemented as questions the user answers about their own intentions.
