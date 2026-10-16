# Consent, entitlement, and scope boundaries

⚠️ Internal policy, not legal advice. Every jurisdiction needs counsel review.

⚖️ **This file is the project-wide floor. The per-jurisdiction answers live in `../jurisdictions/`**, ADR `0005`. ⛔ **No pack is reviewed, so every jurisdiction-dependent proposition below is currently unanswered.** The rails (5, 6) hold regardless; the legal detail does not.

## 1. Own data only (RAIL 5)
Every capture path must be something the user is lawfully entitled to obtain **about themselves**: their device, their account, their subject-access export, their receipt, or a third-party record obtained with the record-holder's documented consent.

Never: a counterparty's device, account, or cloud. Never a credential the user does not own. Never a bypass of anyone else's encryption. No exceptions, no override, no "the lawyer said it was fine."

## 2. Standing and consent chains
The user frequently has **no standing** over the record they need, a guest in a building, a visitor at a venue, a passenger on another person's account. The holder will refuse, correctly.

Route: the party **with** standing makes the request in writing, with counsel copied, and the user's representative attends. **Document the consent chain as carefully as the evidence**. A record obtained without a clean entitlement chain becomes something the other side attacks instead of answering.

The standing-and-consent wizard is where requests actually die, and therefore where the product earns its keep. (`../docs/methods/03_retention_race.md`)

⚖️ **[JURISDICTION]** → `../jurisdictions/<code>/05_entitlements.md` · `03_demands.md`, *who* has standing, and what a holder may lawfully accept as consent, are local. Documenting the chain is not.

## 3. The examiner boundary
Route to counsel plus a licensed examiner. Never a product feature:
- encrypted-backup key recovery, even on the user's own account and hardware
- device rooting or unlocking to reach app-private storage
- deleted-content reconstruction from database snapshots
- ⛔ anything that may contain intimate media (RAIL 6): freeze the container **unopened**, no preview, no thumbnail, no "just check whether"

These are legitimate on your own device and your own account. They are also the operations whose provenance a court will attack and whose legality is jurisdiction-specific, and fumbling one destroys the clean custody copy. Ship the referral and the scope-of-work document.

⚖️ **[JURISDICTION]** → `../jurisdictions/<code>/07_examiner_line.md`: the line moves per operation and per jurisdiction. **Unclear resolves to referral** (RAIL 5), so with no reviewed pack every item above is a referral, which is also the position where they are lawful. RAIL 6 has no local override anywhere.

## 4. Third-party rights in captured material
A user's own chat export contains another person's messages; a building's footage contains uninvolved people. Data-protection regimes generally permit processing for the purpose of legal proceedings, but the scope is not unlimited. Needs a per-jurisdiction answer before launch, and it shapes what a report may reproduce.

⚖️ **[JURISDICTION]** → `../jurisdictions/<code>/05_entitlements.md` §1, §6

⚠️ **This is the seam with no safe default.** The others fail closed to a referral; this one cannot. The third party's data is already inside a record the user is entitled to, and refusing to process it would refuse the capture itself. The conservative engine position is: **capture the export whole, and constrain what the *report* reproduces** to what the claim requires. Whether that is sufficient is the unanswered per-jurisdiction question, and it currently has no answer anywhere.

## 5. Our own position
We are not the custodian (ADR `0001`), not counsel, and not the investigator. We are tooling plus method. Say so in the ToS, and make the architecture match the claim rather than the reverse.
