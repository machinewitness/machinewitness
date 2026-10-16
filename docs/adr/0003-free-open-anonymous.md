# ADR 0003, Free forever, open source, anonymous maintainership

- **Status:** Accepted
- **Supersedes:** the commercial framing the project was first scaffolded with, a paid product, a defence-firm B2B channel, per-matter pricing
- **Scope:** Licensing, distribution, governance, funding, and what may be built at all
- **Rationale in full:** `../../MANIFESTO.md`

## Context

The repo was first scaffolded as a company: a paid product, a defence-firm B2B channel, per-matter or subscription pricing. That framing is commercially sensible and was the wrong call, for a reason that is structural rather than sentimental.

**The customer with the most urgent need has the least ability to pay, at the exact moment the need is most urgent.** Day one: no lawyer yet, on legal aid or nothing, possibly in an HR process with no process rights, possibly foreign to the jurisdiction, and the perishable records are already on the clock. A price at that moment does not filter for seriousness; it filters for money, and the people it filters out are precisely the ones the tool exists for.

Three further problems with the commercial framing surfaced once written down:

1. **A closed custody tool undermines its own central claim.** The product asserts that a record has not changed since capture. Asking a court to accept that on the word of an un-inspectable vendor is strictly weaker than shipping something anyone (including the other side) can read, re-implement, and verify with standard tools.
2. **A company is a single point of failure attached to someone's liberty.** Acquisition, insolvency, a change of heart, or a compelled disclosure all end or corrupt the tool. Users cannot fork their way out of that.
3. **A vendor cannot keep the jurisdiction layer correct.** Conditions, disclosure duties, retention rules, privilege and barred reasoning differ everywhere and change constantly. That layer has to be forkable by practitioners.

There is also a specific, current reason anonymity is right rather than merely acceptable, and it should be recorded honestly: a publicly-registered company on this theme, launched by a person currently under charge, is discoverable and can be characterised as attitudinal or motive evidence against them. **An anonymous, unincorporated, free open-source project removes that exposure entirely**. There is no registry entry, no officer, no commercial motive, and nothing tying the project to any individual's matter. It is the rare case where the ethically preferable structure is also the safer one.

## Decision

**Free forever. Open source. No accounts. No telemetry. Anonymous maintainership.**

1. **The tool is never the leverage.** No price, tier, trial, quota, seat, account, licence key, or feature gate. No freemium. No "pro" edition holding back the part that matters. Any future funding must be structurally incapable of gating the tool, see below.
2. **Open source, copyleft.** **AGPL-3.0** for the engine and applications, **CC BY-SA 4.0** for `docs/methods/` and jurisdiction content). Copyleft rather than permissive is deliberate: it prevents the predictable outcome where a vendor takes the custody kernel, closes it, attaches a subscription, and sells it back to accused people. Documentation is licensed separately because the method knowledge is the more valuable half and should propagate on the same terms.
3. **No accounts, ever.** No sign-up, no login, no e-mail address, no device identifier. A person under investigation should not have to create a record of having sought help.
4. **No telemetry, analytics, crash reporting, or usage data.** Not anonymised, not aggregated, not opt-in. ADR `0001` said the cloud never holds content; this goes further, there is no cloud that holds *anything about a user*. It follows that we will not know how many people use this, and will not learn from their behaviour. Accepted.
5. **Anonymous by default, pseudonymous contribution welcome.** No identity required to contribute or to be trusted. Reviewed on the code, not the author. Mechanics: `../../CONTRIBUTING.md`, Developer Certificate of Origin, never a contributor licence agreement, because a CLA needs a legal identity and that defeats the point.
6. **Self-hostable and fully offline-capable.** The tool must work end-to-end with no network at all. Any online component is optional, and its absence must degrade nothing but itself.

## Funding, honestly

Free forever needs an answer to "then who pays for it," and the honest answer is: **possibly no one, and it must survive that.** The project is designed to require approximately zero running cost, local-first (ADR `0001`), no accounts, no telemetry, no servers to keep up. A dormant, un-maintained Machine Witness still works.

Permitted, in strict order of preference:

| Model | Permitted? | Condition |
|---|---|---|
| Nothing. Volunteer maintenance | ✅ default | The baseline the project must survive on |
| Donations / grants (legal-aid, access-to-justice, digital-rights, public-interest tech) | ✅ | No funder influence over the refusals in `MANIFESTO.md`; disclosed |
| Paid training or certification **for professionals** | ✅ | Never gates the tool; never required to use it |
| Optional paid **hosted hash-anchoring** for firms | ⚠️ only if | Self-hosting and third-party anchors remain first-class, documented, and equally supported |
| Firm-facing consulting or expert work by individual maintainers | ⚠️ personal | Not the project's; no privileged position in the codebase |
| **Anything that gates, throttles, or degrades the tool for an individual** | ⛔ never |   |
| **Anything requiring an account, an identity, or user data** | ⛔ never |   |
| **Selling, sharing, or analysing user data** | ⛔ never | There is none to sell |
| **Venture funding of a company that owns the tool** | ⛔ never | Reintroduces every failure mode above |

## Consequences

**Accepted costs:**
- No revenue, therefore no paid engineering. Scope must stay small enough for volunteers; the PRD's v0 is already the right size and should not grow.
- No usage data, so no idea what works. Compensate with a local `doctor` command and structured diagnostics the user *chooses* to attach to an issue.
- No support obligation. Set that expectation in the README rather than failing it quietly.
- The defence-firm channel becomes advocacy and referral, not revenue. Firms remain the highest-leverage distribution. They just are not customers.
- Copyleft closes some adoption paths. Intended.
- Anonymity costs credibility with some institutional partners, and there is no clean fix. The answer is verifiable artifacts: reproducible builds, third-party-checkable custody, published test vectors.

**Benefits:**
- Reaches the person on day one, which was the entire thesis.
- Verifiability becomes a genuine claim rather than a marketing one.
- Outlives its authors; forkable per jurisdiction.
- No registry entry, no officer, no commercial motive attachable to any individual's matter.
- Nothing to subpoena, nothing to breach, nothing to sell.

## Rejected alternatives
- **Free for individuals, paid for firms.** Cleanest commercial option, still rejected: it needs accounts and entitlement checks to enforce, which breaks decisions 3 and 4 and rebuilds the server we refuse to run.
- **Open core.** The gated part is always the part that matters. Here that would be custody or classification. The parts a court must be able to inspect.
- **Non-profit entity now.** Adds a registry entry, officers, and an identifiable founder to a project whose safest current form has none. Revisit only if grant funding requires a legal recipient, and only with counsel.
- **Permissive licence (MIT/Apache).** Faster adoption, and permits exactly the closed-and-resold outcome this ADR exists to prevent.

## Enforcement
- No licence key, entitlement check, account, or feature flag keyed to payment may enter the codebase. Reviewed as a blocker.
- No network call is required for any core function. Offline end-to-end is a test, not an aspiration.
- `MANIFESTO.md` refusals are treated as tests: a PR that erodes one is closed on that basis alone.
- Every document describing who this is for, or what it costs, must reflect this ADR. Several written before it still say *customer*; that is tracked and being corrected, and this ADR is not retro-edited to hide it.
