# 01: Evidence layers: the source catalogue

The product's value is that it knows **which layers exist**, **how to get each one**, and (critically) **what each one cannot prove**. That last column is what stops the product producing confident garbage.

⛔ Case-fact-free. `<DEVICE>`, `<WINDOW>`, `<PLATFORM>`.

---

## A. Wearable / health telemetry  ⭐ highest-density layer
**What it is:** minute-or-finer heart rate, sleep staging (incl. REM/deep/light bands), step counts, distance, SpO2, respiratory rate, HRV, skin temperature. Vendor exports run to **tens of thousands of files** for a single account.

**Gets you:** a continuous physiological and movement trace across a window, at a resolution no human witness can match. Sleep staging is the strongest single artifact available to a consumer, a continuous multi-stage sleep session across a claimed window is very hard to argue with.

**Cannot prove:**
- **Identity.** A wrist device proves *a wrist*, not *whose*. HR is only attributable if the device was worn, and off-wrist gaps are common and total.
- **Absence of an act.** Resting HR does not exclude a brief act; a spike does not indicate one. Brief events fall between sample bins.
- **Sleep in the accused's favour, unqualified.** In several jurisdictions an unconscious person cannot consent, so a sleep layer can cut *against* the user on some claim types. This double-edge must be flagged by the tool, every time, and routed to counsel. See `06`. ⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/02_barred_reasoning.md`, *which* claim types it cuts against is local; **that a strong-looking layer can cut against the user is not**, so the flag fires everywhere regardless of any pack.

**Hard-won mechanics:**
- **Device provenance is mandatory.** A single account's export often contains **two or more devices** (wrist + phone). One sensor class may come exclusively from one device while another is merged from both. Attributing a phone-sourced step burst to the wrist device produces a false claim. Emit a per-signal `source_device` on every datum or refuse to render it.
- **Timezone is the number-one silent corruption.** Vendor CSV timestamps are frequently **UTC stored as local-looking text**. Never assume; test, and record the proof.

  **Timezone anchoring is a proof *stack*, not one technique.** Each of these fails on some sources, so a single-method implementation will silently mis-anchor a corpus and be confident about it. Try them in order and record which one carried:
  1. **Cross-format pairing inside the dump itself**. The strongest, because it needs nothing external. Some exports store each event as *both* an epoch integer and a wall-clock string; the offset falls straight out of the pair.
  2. **The vendor's own explicit offset column**, where one exists.
  3. **A travel offset flip**: a known movement between zones, verified continuous across the boundary. A real gap of minutes looks like a multi-hour hole if you mishandle the flip.
  4. **Export-generation anchoring**. The export's own creation timestamp against a known-local moment of generation.
  5. **Daily-bucket roll boundaries**, where the vendor aggregates per day, the roll reveals the zone it rolled in.
  6. **An unrelated external pair**. An API response or render whose local time is independently known.

- **Diagnose the *cause* of every coverage gap, and do it from a second subsystem.** "Silence, not a negative" is only half the rule. Off-body, charging, battery-dead, powered-off and sensor-failure are five different stories, and **an explained gap kills the obvious attack while an unexplained one invites it.** Two techniques that worked: optical physiology stopping while the accelerometer keeps counting means *removed, carried, or set down*. Not absent; and where the wearable runs the same OS usage store as the phone, its lifecycle events pin a battery death to the second.

- **Rooted or otherwise modified devices are a weaker evidence class.** Data from one is still useful, but its provenance is attackable in a way an unmodified device's is not. **Disclose the modification and segregate the layer**. Do not silently mix it with unmodified sources in a convergence claim.
- Build a **validated core library with a self-test** that re-proves timezone, device-attribution and sensor invariants on every run, and let all figures/queries go through it. Ad-hoc per-purpose scripts drift and produce inconsistent numbers across a corpus.
- Instantaneous peak ≠ session maximum. Be explicit which you are quoting; they differ and get mis-cited.

## B. OS usage / screen-activity logs
**What it is:** on Android, the platform usage-statistics store: per-app foreground/background events, screen-on/off, unlock events, at **millisecond** resolution. macOS keeps a power/screen log. Both are recoverable without exotic tooling.

**Gets you:** the densest available "was this human interacting with this device" trace, often **denser than the wearable**, and it survives further back than most people expect. Independent second subsystem. Its greatest value is *corroborating another layer at the millisecond level*.

**Cannot prove:** who was holding the device. Screen-on ≠ the user. Background/automated events (media playback, OS dialogs, firmware prompts, sync) look like activity and are not. Enumerate and label automated event classes or you will over-claim.

## C. Chat / messaging archives
**What it is:** full-thread exports (not screenshots), plus, on a device the user owns, the local message database.

**Gets you:** content plus timing. Deletion footprints. Reply/quote structure.

**Cannot prove:** several things people assume it does.
- A "message deleted" placeholder typically carries the **send** time, not the **delete** time. Deletion *timing* is generally unprovable from the text export alone; only snapshot/database forensics can bracket it.
- A deletion footprint proves **an action**, not **the content** and not **the operator**. Someone else may have performed it; the user may have been coerced into it. The record is silent on both.
- Block/unblock visibility is asymmetric: an export from one side often shows only that side's actions.

**Rule:** export the *whole* thread with media. Selected screenshots are worth close to nothing and invite "what did you crop."

## D. Platform / service records
Event registrations, bookings, receipts, orders, rides, subscriptions, access grants. See `04`. This layer has its own discipline, because **what the UI shows you is not what the database stores.**

## E. Email and calendar, the original, not the render
**Always obtain the original `.eml`**, not a screenshot or a printed page. The raw message carries server-attested headers (received chain, DKIM, timestamps) that a render throws away. Same for calendar: the `.ics` attachment can carry participation status and text the rendered body omits, and conversely, a transmission *time* is often not provable from the file at all.

## F. Premises / physical-access records
Door-fob logs, access-control events, camera footage, visitor logs. Highest-value corroboration available for a location claim, and the **most perishable**, see `03`. Usually held by a third party, requiring standing and consent the user may not personally have.

## G. Financial and travel records
Card and bank transactions, lodging bookings, boarding passes, entry/exit stamps, ride receipts. Low density, high credibility, near-zero interpretive risk. Best layer for building a coarse location spine over long windows where telemetry is absent.

## H. Media metadata
Original photos/videos with intact EXIF/creation metadata. **Keep originals**: screenshot-and-delete destroys the only part that mattered. ⛔ Subject to root `CLAUDE.md` RAIL 6: never handle intimate media, no exceptions, no previews.

## I. Contemporaneous medical documentation
Independent, dated, clinically-described examination of the user's own injuries. **Time-critical, injuries heal in days.** Photographed with a scale and date in frame, recorded in a medical record. Independent of any record held by the other side.

## J. Own-account subject-access / data-portability exports
The GDPR/CCPA-style export. Slow but powerful: it is the platform's own copy of its own records about the user, delivered under legal obligation, and it is a *clean* way to obtain what would otherwise require touching a live surface (`08`).

---

## Examiner-lane capabilities, deliberately NOT product features
Some things that worked in practice are **not shippable** and must route to counsel plus a licensed examiner:
- Recovering an encrypted local backup key, even from the user's own account on the user's own hardware.
- Rooting or unlocking a device to reach app-private storage.
- Deleted-content reconstruction from database snapshots.

They are legitimate on your own device and your own account, and they are also the exact operations whose *provenance* a court will attack, whose legality is jurisdiction-specific, and which can destroy the clean custody copy if fumbled. **Product answer: freeze the container untouched, hand it to counsel, name the examiner scope.** Ship the referral, not the capability. See `../../HONEST_LIMITS.md`.

⚖️ **[JURISDICTION]** → `../../jurisdictions/<code>/07_examiner_line.md`

**The line moves per operation and per jurisdiction; the default does not.** Unclear resolves to referral (RAIL 5), so with no reviewed pack the product offers none of the three operations above, which is also the position it takes where they are perfectly lawful, because the custody story and the provenance attack do not depend on legality. A pack can tell you where the line falls. It cannot move the default.
