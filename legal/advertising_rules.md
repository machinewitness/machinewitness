# Advertising and claims rules

⚠️ **Not legal advice, and not a substitute for counsel review.** This is our internal claims policy, written to be conservative. Every jurisdiction we market into needs a lawyer's sign-off on the actual copy.

⚖️ **[JURISDICTION]** → `../jurisdictions/<code>/06_advertising.md`. **This file is the floor, never the ceiling.** A pack adds local rules on top; it can never relax a ban here. ⛔ **No pack is reviewed**, so review step 3 below has never been satisfied for any jurisdiction. ADR `0005`.

---

## 1. No outcome promises. RAIL 7.
Two independent reasons, either sufficient:
- **Regulatory.** Law societies and bar regulators in most common-law jurisdictions restrict outcome-suggestive marketing for legal and legal-adjacent services. We are adjacent enough to be caught, and being nominally outside the rules is not a defence worth testing.
- **Liability.** A promise creates an expectation, and the record will cut against the customer roughly half the time. That is not a failure of the product (it is the product working (`docs/methods/06`)) but a customer who was promised a result will not see it that way.

**Banned in name, domain, copy, UI, sales conversation, and testimonial:** *acquit · cleared · exonerate · vindicate · win · beat the charge · prove your innocence · get the charges dropped · guaranteed.*

**Say instead:** *preserve · freeze · verify · intact · unaltered · counsel-ready · before it is overwritten.*

## 2. No legal advice, and no appearance of it.
No "you should", no interpretation of the customer's conditions, no assessment of their case. Route to counsel at the point the question arises. In several jurisdictions doing otherwise is unauthorised practice.

## 3. No prevalence claims about false accusations. RAIL 8.
Never quantify, never imply, never cite a statistic. It is contested, it is off-message, and it converts this from a custody tool into an advocacy outfit, which loses the defence-firm channel that is the whole distribution surface. The positioning is *anyone wrongly accused*, never a gender and never a prevalence claim (RAIL 8).

## 4. No gendered marketing. RAIL 8.
Say *anyone facing an accusation*.

## 5. No counterparty-facing capability, implied or stated. RAILS 2, 9 / ADR 0002.
Nothing in any material may suggest the product can find, monitor, check on, or gather information about another person. This includes casual phrasing in a sales call, "well, you could always look at her..." is a compliance incident.

## 6. No case studies from real matters. RAIL 1.
Ever. Not anonymised, not "composite", not with permission. A privileged matter cannot be marketing material, and a customer's consent does not cure the exposure to *them*. Illustrate with fully synthetic scenarios, labelled as such.

## 7. Substantiate every technical claim.
If we say a record type is retained for a period, that must come from a named, dated source, and be framed as *typical, verify with the holder*. Never state a retention period as fact. `Docs/methods/03` numbers are orders of magnitude, not guarantees.

## 8. Testimonials
Only from professionals speaking about the tool, never from accused customers about their outcomes. Bar rules restrict outcome-implying testimonials, and a customer testimonial in a live matter is a privilege and safety problem regardless.

## Review gate
All outward-facing copy passes:
1. `../ops/casefact_gate.sh` (with the runtime denylist, from outside the repo)
2. This checklist
3. **A lawyer, per jurisdiction**: recorded in `../jurisdictions/<code>/06_advertising.md` §7, against the *actual shipped words*, not against this file

⛔ **Step 3 has never been run for any jurisdiction, and step 1's denylist is unwritten.** So no outward-facing copy in this project has cleared its own gate. **A green structural gate plus a clean checklist is not approval to publish copy**. It is two of three steps, and the missing one is the only one that can catch a claim being wrong rather than merely off-message.

`landing/` is owned by a separate workstream. **These rules bind it.** Send them this file before any copy is written.
