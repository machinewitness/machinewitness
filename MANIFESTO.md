# Machine Witness, manifesto

*Unsigned, deliberately. Anonymous maintainership is ADR `0003`, and the identity of the
authors has nothing to do with whether the code is correct.*

---

## The asymmetry

When someone is accused, two parties start gathering the record of what happened. One of them has forensic laboratories, a budget, subpoena power, warrants, trained investigators, and years. The other has a phone, no idea what data exists about their own life, and roughly two weeks before the building's cameras overwrite the morning in question.

That is not a fair fight, and it is not meant to be. The state is supposed to have those powers. But nothing about the design of that system requires the accused person to *lose the evidence that already exists*. That happens for a much stupider reason: **nobody told them it was there, and nobody told them it was dying.**

## The record already exists

This is the whole idea, and it is worth stating plainly.

An ordinary person now generates a dense, timestamped, multi-device record of their own life without trying. Sleep stages. Heart rate. Steps, from two devices at once. Every screen unlock, to the millisecond. Every app opened. Receipts, bookings, rides, door-fob swipes, message timings, calendar invitations with server-attested headers.

**None of it needs to be believed.** It is not testimony. It was written by machines that had no idea a dispute was coming, no stake in the outcome, and no capacity to be coached, to misremember, or to change its story under pressure. In a domain where almost everything is one person's word against another's, that is the only material in the room that is not somebody's account.

And it dies by default. Camera loops overwrite in days. Device logs roll. Export links expire. Platform records get pruned. **The default outcome is that the evidence never existed**, not because anyone destroyed it, but because the one person with the standing to save it did not know to ask, and then it was too late.

## Why this must be free, forever

Because the moment it costs money, it stops reaching the people it was built for.

The person who needs this most is the person on day one: no lawyer yet, or a lawyer who cannot start until next week. On legal aid, or nothing. Facing an HR process with no process rights at all. Far from home, in a legal system that is not theirs, in a language that is not theirs. Frightened, and about to make it worse by deleting something or explaining themselves to the wrong person.

A licensed forensics firm is better than this project at nearly everything, except being there on day one, for free. They cost four or five figures and start in a few weeks, and by then the short-loop records are gone. That gap is not a market opportunity. It is a hole that people fall through, and the ones who fall through it are the ones with the least money.

**A paywall on evidence preservation is a paywall on the truth surviving.** We are not going to build that and then describe it as access to justice.

So: free. No price, no tier, no trial, no account, no upsell, no "pro" version that unlocks the part that matters. Not freemium. Not free-for-now. **The tool is never the leverage.**

## Why it must be open

Four reasons, and each one alone would be sufficient.

**It has to be auditable to be worth anything.** The product's entire claim is that a record has not changed since it was captured. A closed tool making that claim asks a court to trust a vendor it cannot inspect. An open one can be read, re-implemented, and checked with standard tools by anyone, including the other side. **Verifiability is not a feature of this project; it is the product.** Anything that cannot be independently verified should be assumed worthless on the stand.

**It has to outlive whoever built it.** Companies get acquired, run out of money, change their minds, get compelled, or quietly turn their users into the product. A person's liberty must not depend on a startup's runway or a founder's continued good intentions. Open, forkable, self-hostable, no server required, so that if every original maintainer disappears tomorrow, the tool still works and can still be improved.

**Adversarial review is the only thing that makes it correct.** The methods in `docs/methods/` were not derived cleanly. They were learned by getting things wrong: a timezone silently misread, a signal attributed to the wrong device, a "helpful" finding that collapsed the moment somebody attacked it properly, a scrub that missed everything except names. Every one of those errors would have produced a confident, wrong, and *harmful* answer in someone's real case. Closed development would have shipped them.

**The law is local; the tool must be forkable.** Conditions, disclosure duties, retention rules, privilege, admissibility, and which lines of reasoning are outright barred, all differ by jurisdiction and all change. No central team can keep that correct everywhere. The engine should be common and the jurisdiction layer should be forkable by people who actually practise there.

## Why anonymous

Because the identity of the authors is irrelevant to whether the code is correct, and attaching identities creates problems that have nothing to do with the code.

An open custody tool is either verifiable or it is not. That question is settled by reading it, running it, and checking its output with independent tools. Never by who wrote it. Once names are attached, the tool becomes discreditable by discrediting a person, and a project about the reliability of records should not have a reputational single point of failure.

There is a plainer reason too. Some of the people best placed to build this are people who have been through it. Requiring them to attach their names in order to help is asking them to accept a permanent, searchable cost for it. **Contribution should not require that.** Anonymous by default, pseudonymous contribution welcome, no identity required to be taken seriously.

## What we will not build

Stated as commitments, because a project like this drifts unless the refusals are written down and load-bearing.

- **Nothing that touches the other party.** No messaging, monitoring, location lookup, people-search, list enumeration, or pretext accounts. Users of this tool are frequently under no-contact orders, where far less than speaking counts as contact, merely opening some surfaces auto-joins you to them, and following a tracked link writes an entry into a log. A feature that touched the counterparty would make this software the instrument of a fresh offence against the person we built it for. It is absent, not disabled.
- **No cloud that holds anyone's evidence.** It would be a subpoena target, an unmitigable breach risk, and it may weaken the user's own privilege. It also adds nothing. Everything runs locally; we cannot read your data because we never have it.
- **No accounts, no telemetry, no analytics, no data collection of any kind.** Not anonymised, not aggregated, not opt-out. A person under investigation should not have to trust us about this, and with no server they do not have to.
- **No verdicts, scores, or predictions.** The tool classifies a record against a claim (consistent, in tension, or silent) and stops. Meaning is a lawyer's job.
- **No outcome promises.** We do not sell hope, and we could not deliver it. The record will cut against the user roughly half the time.
- **No gender politics and no statistics about how common false accusations are.** Both are somebody else's argument. This is a forensics tool for anyone facing an accusation, and the moment it sounds aggrieved it stops being useful to the lawyers who would otherwise recommend it.

## The uncomfortable part, said out loud

This tool does not sort the innocent from the guilty, and it is not designed to. It preserves what a person's own devices actually recorded, including the parts that hurt them, surfaced first and in the same detail as the parts that help. That is not a caveat bolted on for legal cover; it is the core design, because a one-sided record is worthless to a lawyer and gets dismantled the moment the other side finds the layer you hid.

A tool built to fabricate an alibi would look nothing like this one. It would not freeze adverse material into the same hashed set. It would not lead with the events that damage its user. It would not refuse to draw conclusions.

**An early-frozen, tamper-evident, harm-first record makes a fact-finder's job easier, not harder. Whatever it happens to show.** Sorting people is what due process is for. Making sure it has something real to work with is what this is for.

## What we are actually claiming

Modest, and true:

> Your devices already recorded your life. That record is perishable, and it is probably dying right now. This tool helps you preserve it before it is gone, prove it has not been altered since, and hand it to your lawyer in a form that survives being attacked. Including the parts you would rather it did not contain.

It will not prove anyone innocent. Nothing can. It is not a defence, not a lawyer, and not a substitute for either.

It is a way of making sure that when someone finally looks at what actually happened, there is still something there to look at.
