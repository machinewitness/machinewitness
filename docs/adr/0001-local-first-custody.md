# ADR 0001, Local-first custody; the cloud never holds content

- **Status:** Accepted
- **Scope:** Whole product. This decision constrains `app/`, `cloud/`, `legal/`, and pricing.

## Context

The obvious architecture for this product is a cloud service: the user uploads their exports, we parse, classify, store, and render. It is easier to build, easier to update, and easier to monetise as a subscription.

It is also the wrong architecture, and getting it wrong is close to unrecoverable, because of *what* the content is. Every byte a customer would upload is material assembled for the purpose of obtaining legal advice, in an active or anticipated legal proceeding, concerning a person whose liberty may be at stake.

Three consequences follow, and they are not hypothetical:

1. **A cloud holding this content is a subpoena target.** Not the customer's device, ours. We would hold, in one place, the evidence corpora of many accused people, and we would be a third party who can be compelled without the customer being present to object. Worse, our very possession of it may weaken or complicate the customer's own privilege claim over it, since privilege is protected by confidentiality and we would be a party outside it.
2. **A breach is catastrophic and unmitigable.** Not "reputationally damaging": a single breach discloses the defence corpora of people mid-proceeding, to anyone. There is no remediation. No amount of encryption-at-rest changes the fact that a service which can parse content can read content.
3. **We do not want to be the custodian.** Custody of the user's evidence is the user's, and their lawyer's. Our value is the *tooling and the method*, not possession. Holding it adds no product value and imports the entire liability.

## Decision

**The client is local-first and authoritative. The cloud never receives evidence content, not encrypted, not chunked, not "temporarily for processing."**

- All capture, parsing, hashing, classification, and rendering happen **on the user's machine**. `app/` is the product.
- Evidence lives in a user-controlled location. The user holds the keys. We cannot decrypt, and cannot be compelled to.
- `cloud/` is limited to services that are *structurally incapable* of seeing content:

| Cloud service | Sees |
|---|---|
| **`anchor/`**: timestamp a manifest **digest** to an external authority | A hash. Nothing else. |
| Licensing / entitlement | Account and plan |
| Template and jurisdiction-content delivery | Our own content, one-way to the client |
| Software update | Our own binaries |
| Anonymous crash/telemetry, opt-in | No content, no filenames, no paths, no hashes of user data |

**Hash-anchoring is the one genuinely valuable cloud feature** and it is worth building carefully: it converts "this was captured before I had a motive to fabricate" from the user's assertion into something a third party can check, while we learn nothing at all about what was captured. (`docs/methods/02`)

## Consequences

**Accepted costs, honestly:**
- Harder engineering. Cross-platform desktop, local storage, no server-side fixes, painful debugging with no access to the failing data.
- Weaker subscription logic. Mitigate with per-matter licensing, the anchor service, template/jurisdiction content updates, and the professional tier, not with hostage-taking the user's data.
- No server-side heavy compute. Constrains any ML ambitions; classification must be deterministic and local anyway (`docs/methods/05`), so this is a smaller loss than it looks.
- Support cannot "just look." Invest in a local `doctor` command and structured, redactable diagnostics the user chooses to send.

**Benefits:**
- Subpoena surface approaching zero. Our honest answer to a demand is that we do not have it.
- Breach blast radius approaching zero.
- The customer's privilege stays intact, which is itself a selling point to counsel, arguably the strongest one.
- Marketing is simple and true: **we never see your evidence.**

## Rejected alternatives
- **Client-side-encrypted cloud sync.** Better than plaintext, still wrong: we hold ciphertext volumes of privileged material, we become a compellable custodian, and any server-side feature quietly pressures the boundary until something can read content. The failure mode is a slow slide, not a single bad decision.
- **Hybrid "process in an enclave."** Adds unverifiable complexity and asks a court and a customer to trust a claim neither can check.
- **Cloud-first with a local option.** The default is the architecture; an unused escape hatch is not a mitigation.

## Enforcement
- No content-bearing field may appear in any cloud API schema. Reviewed as a hard gate.
- `cloud/` code must be independently auditable as content-blind, and that audit is a shipping requirement.
- No third-party LLM or analytics call may ever receive user evidence content, in any form, in any environment, including development.
