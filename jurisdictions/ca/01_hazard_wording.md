# 01: Hazard wording · Canada 🔴 SAFETY-CRITICAL

**This file feeds the phase-0 hazard gate, which runs before any evidence question and cannot be skipped.** Wrong wording here is how somebody breaches a condition while trying to help themselves. It is the single highest-stakes file in the pack.

> **Review state: ⛔ UNREVIEWED.** Until `00_status.md` says otherwise, a consumer must not use anything on this page as local wording. It falls back to the engine default and says on screen that no local review exists.

---

## What you are being asked, and what you are not

**You are not designing questions.** The questions are fixed by `../../skill/data/tree.yaml`, which is the contract both the app and the site consume, and rewording them silently forks that contract. They ask, in substance:

- Are you under anything that restricts what you may do or where you may go?
- Does it include no-contact, non-association, or stay-away terms?
- Does anything require you to **do** something. Report, notify, surrender, attend, keep in touch?

**You are supplying local vocabulary for those questions**, so a reader recognises their own paperwork in them.

⚠️ **Canada is the odd case here.** The engine's default wording already uses Canadian terms of art (*"release or bail condition, undertaking"*), so this file looks pre-solved. It is not. Nobody has confirmed that the default wording is correct, current, or complete for any province. It is simply what got written. **Treat the default as an unverified draft to be checked, not as a starting answer**, and say plainly in `00_status.md` which parts you confirmed as opposed to left alone.

⛔ **Never interpret a user's conditions**, in this file or anywhere downstream. `tree.yaml` lists `interpret_users_conditions` under global prohibitions. The gate's job is to tell someone which options to leave out, and to route them to a lawyer.

---

## 1. Instruments that restrict conduct

Every local name for a thing that can restrict what a person does, criminal and non-criminal. A reader must be able to find their own document in this list.

| Local name | Rough English gloss | Issued by | Criminal? |
|---|---|---|---|
| UNANSWERED | | | |

Include the non-criminal analogues. A workplace directive, a school or university measure, a tenancy notice, a professional-body interim order, a sporting-body suspension. None of them are court orders and all of them can be breached.

## 2. Condition types

The local terms for the restriction classes the gate asks about.

| Class | Local term(s) | Notes |
|---|---|---|
| No contact | UNANSWERED | Does it reach intermediaries, a friend, a relative, a lawyer's staff? |
| Non-association | UNANSWERED | |
| Stay-away / exclusion zone | UNANSWERED | Is it address-based, area-based, or knowledge-based? |
| Communication restriction short of no-contact | UNANSWERED | e.g. permitted only through a named channel |
| Device, account, or internet restriction | UNANSWERED | 🔴 Directly closes capture paths. Say so plainly |
| Reporting / residence requirement | UNANSWERED | A positive duty, see §4 |

## 3. Is breach a separate offence?

**Answer:** UNANSWERED, `"yes" | "no" | partial`

State it factually, in one or two sentences: what the breach itself is, and how it is dealt with. ⛔ **No outcome language** (RAIL 7). No *"you will be convicted"*, no *"you will lose bail"*. What the law provides for, not what will happen.

This answer drives how severely the product warns before every hazardous capture path, so a wrong `no` here is expensive.

## 4. Positive obligations

Conditions impose **duties**, not only prohibitions, and failing a duty is a breach exactly like doing a forbidden thing. `tree.yaml` phase `0c` covers this.

**Do positive obligations exist here?** UNANSWERED

| Obligation type | Local name | Typically on a deadline? |
|---|---|---|
| UNANSWERED | | |

## 5. Deletion and cancellation

The engine's exclusion `X3` says: *do not delete or cancel anything. Deleting looks like consciousness of guilt and can be a separate offence.* The first half is universal. The second half is local.

**Is destroying, concealing, or altering potential evidence a distinct offence here?** UNANSWERED

**Is there a preservation duty on the person once they know of a proceeding?** UNANSWERED

⚠️ **The engine refuses to suggest deleting or cancelling regardless of what this file says** (`tree.yaml` → `never: suggest_deleting_or_cancelling_anything`). Nothing you write here can switch that on. This section only sharpens the reason given to the user.

## 6. Self-incrimination and the right to say nothing

`X6` tells the user not to explain themselves to police, an investigator, or HR. `X10` tells them not to consent to a device search. Both rest on local law.

| Question | Answer |
|---|---|
| Right to silence, how it is framed locally | UNANSWERED |
| Any adverse consequence of silence | UNANSWERED |
| Does the person carry any burden to account for their whereabouts | UNANSWERED |
| Consent to a device search, can it be withdrawn once given | UNANSWERED |
| Right to counsel before questioning, and how it is invoked | UNANSWERED |

## 7. Wording that must NOT appear

Local phrasings that read as reassuring or dismissive and are wrong here, plus any term a reader would misunderstand.

- none recorded yet

---

## Reviewer sign-off

| | |
|---|---|
| Reviewer role |  |
| Scope read |   |
| Still unreviewed | everything |

Copy the result into `pack.yaml` → `hazard_wording` and `capabilities.hazard_wording_available`. **Leave that flag `false` until a practitioner has read this whole page**, not part of it.
