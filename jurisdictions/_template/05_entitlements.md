# 05, Entitlements to the person's own data

What the person can lawfully obtain **about themselves**, and how.

> **Review state: ⛔ UNREVIEWED.** Until `00_status.md` says otherwise, the product offers only own-device and own-account export paths, with no local route described.

Engine side of this: `../../docs/methods/01_evidence_layers.md`, and RAIL 5. Own account, own device, own export, user-initiated.

---

## Why this file usually matters more than `03_demands.md`

A subject-access route to the person's own data is normally **faster, cheaper, safer, and needs nobody's permission.** It is also the one path that cannot be characterised as reaching toward anyone else. Fill this before building any demand.

⛔ **RAIL 5 has no local override.** Nothing in this file may describe obtaining a counterparty's device, account, cloud, or credential, not as a feature, not as an integration, not "for the lawyer." Where entitlement is unclear, the answer is *"this routes through your lawyer"*, never a button.

---

## 1. Data-protection regime

| Question | Answer |
|---|---|
| Regime name | UNANSWERED |
| Regulator | UNANSWERED |
| Does it apply to a person's own records held by a private company | UNANSWERED |
| Does it apply to records held by the state or police | UNANSWERED |
| Any exemption for an ongoing investigation or proceeding | 🔴 UNANSWERED. This is the exemption that most often closes the route |

## 2. Subject-access right

| Question | Answer |
|---|---|
| Does a right of access exist | UNANSWERED |
| Statutory response window | UNANSWERED (a duration, never a date) |
| Cost | UNANSWERED |
| Form required | UNANSWERED |
| Right to a machine-readable copy | UNANSWERED. Decides whether custody can hash a real export |
| Grounds a holder may refuse on | UNANSWERED |
| Route if refused | UNANSWERED |

⚠️ **Ask what the act of requesting writes.** RAIL 9: a request is dated and attributable, and on some platforms it appears in an account's own audit log. The log a lawyer may later want clean. Note any local instance here.

## 3. Disclosure in the proceeding

What arrives because a proceeding exists, with no request at all. Cross-reference `03_demands.md` §1.

| Question | Answer |
|---|---|
| Disclosure duty on the prosecution / investigator | UNANSWERED |
| Record classes it covers | UNANSWERED |
| Timing, as a duration from what event | UNANSWERED |
| Does it reach third-party records | UNANSWERED |
| Route for third-party records | UNANSWERED, usually counsel-only |

## 4. Own-device data

| Question | Answer |
|---|---|
| Is extracting data from a device the person owns lawful | UNANSWERED |
| A device the person owns but an employer manages | 🔴 UNANSWERED, commonly not theirs to extract |
| A shared or family device, other people's data on it | UNANSWERED |
| An account the person shares with someone else | UNANSWERED |
| A device seized or subject to a condition | 🔴 UNANSWERED, route to counsel, never a capture path |

⚠️ **A device in the person's hand is not automatically theirs to extract.** Employer-managed, family-shared, and finance-agreement devices all raise a different answer, and a shared device holds another person's data, which RAIL 5 does not cover.

## 5. Privilege

| Question | Answer |
|---|---|
| Privilege for material prepared for counsel | UNANSWERED |
| Does it attach before counsel is retained | UNANSWERED |
| Does storing material with a third-party service weaken it | 🔴 UNANSWERED, **underpins ADR `0001`** |
| Anything that must be done to claim it | UNANSWERED |

🔴 **The third row is the one that matters architecturally.** ADR `0001` keeps evidence local partly because a cloud holding a privileged defence corpus may weaken the user's own privilege. If the local answer differs, it is an ADR conversation, not a pack note.

## 6. Records held by another person that concern the user

The narrow, easily-misread case: a record about the user, held by someone else who is not a company, a neighbour's doorbell, a friend's photograph, a colleague's message thread.

| Question | Answer |
|---|---|
| Can the user obtain it with the holder's consent | UNANSWERED |
| Does consent need to be in writing | UNANSWERED |
| Counsel-only, or may the user ask | UNANSWERED |

⛔ **The user does not approach a witness.** `tree.yaml` L11: write the names for the lawyer, do not approach anyone. And `never: ask_the_user_to_gather_anyone_elses_recollection`. This section covers a *record*, not a statement, and even then the safe default is that counsel asks.

---

## Reviewer sign-off

| | |
|---|---|
| Reviewer role |  |
| Scope read |   |
| Still unreviewed | everything |

Copy the result into `pack.yaml` → `entitlements` and `capabilities.subject_access_route_available`.
