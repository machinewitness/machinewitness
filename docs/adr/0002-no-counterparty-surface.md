# ADR 0002: No counterparty surface, enforced structurally

- **Status:** Accepted
- **Scope:** Whole product, permanently. Overrides feature requests, customer demand, and revenue arguments.

## Context

Customers will ask for the opposite. Repeatedly, and with good-faith reasons. Some real requests to expect:

- "Can it show me what she posted that day?"
- "Can it check whether he was actually at work?"
- "Can it monitor the account so I know if something changes?"
- "Can you look at the guest list and tell me if she signed up?"
- "Can I make a second account just to look?"

Every one of these is a reasonable-sounding request from a frightened person, and every one is a trap, for them and for us.

**Why it is a trap for them:** users of this product are very frequently under a no-contact or non-association order. Under such orders, a great deal short of speaking counts. Viewing a profile can notify. Opening some platform surfaces auto-joins the viewer as a participant, converting a read into a contact. Following a per-recipient link writes a present-day entry into an audit log. A mis-addressed email has founded a breach allegation in practice. **A breach of a release condition is a separate criminal offence and grounds for re-arrest.** A feature that touches the counterparty makes our software the instrument of that offence, on a paying customer, in the middle of their case. (`docs/methods/08`)

**Why it is a trap for us:** liability, obviously, but more immediately, distribution. A product that can be described as helping accused men monitor their accusers loses law-firm referral, payment processing, and app-store listing, in roughly that order and roughly immediately. There is no version of this product that survives that description, deserved or not.

**Why "it's just for the lawyer" fails:** a capability in the binary is a capability the customer has. Gating by role, by tier, or by a click-through warning does not change what the software can do, and the customer is the one holding it.

## Decision

**The product is structurally incapable of touching the counterparty.** Not policy-restricted. Not warning-gated. Absent.

**Not built, ever:**
- Any messaging or compose capability, to anyone
- Monitoring, alerting, or change-detection on any external person, account, or surface
- Location tracking or lookup of any person
- People-search, profile lookup, social aggregation, OSINT on any individual
- Enumeration or search of any participant, guest, follower, or member list
- Pretext, secondary, or anonymous account creation
- Any navigation into a counterparty-adjacent region of any platform

**Built instead:**
- Capture limited to the user's own devices, accounts, exports, and receipts (RAIL 5)
- Third-party records obtained only through a documented standing-and-consent chain, in writing, via counsel (`docs/methods/03`)
- **A compliance briefing at onboarding**, which closes capture paths that the user's specific conditions prohibit, the feature that keeps the customer out of custody
- **A pre-action screening check** implemented purely as questions about the user's own intentions, never by inspecting anyone else's data

## Consequences

- We will lose deals to competitors who ship the monitoring feature. Accept it. Those competitors are one incident away from being uninsurable.
- Some legitimate needs go unserved: an investigator, acting under a lawyer's instruction and their own professional obligations, is the correct answer, and **we should refer rather than build.** A referral network is the honest product here.
- Support and onboarding must handle the request gracefully and often: explain the hazard, explain why the absence is protecting them, refer where appropriate. Script it. This conversation happens constantly.
- **Vocabulary ban** in code, UI, docs, marketing, and commit messages: `track`, `monitor`, `watch`, `shadow`, `surveil`, `trace <person>`, `predate`. Use `capture`, `preserve`, `freeze`, `attest`, `custody`. Enforced in review.

## Enforcement
- Every capture adapter ships only after a documented **read-path safety audit**: every write, every outbound signal, every notification the read can trigger (`docs/methods/08`).
- No adapter may render a compose or send affordance. Reviewed as a hard gate.
- No network egress to a counterparty-controlled surface. Allowlist, fail closed.
