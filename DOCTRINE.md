# Doctrine, why the refusals exist

**Audience: a contributor or a reviewer.** Not a person in trouble, [`README.md`](README.md) is
theirs, and it is deliberately shorter than this.

This file exists so that the *reasoning* behind each refusal lives in exactly one place. Every
refusal here looks like caution until you know what it is standing on, and a reason that is not
written down gets re-litigated in a pull request, softened by somebody acting in good faith, or
re-derived from scratch and got wrong. So: one section per refusal, each stating what is refused,
why, and what the refusal costs.

Three files, three jobs, and mixing them is how this corpus rots:

| File | Job |
|---|---|
| [`RAIL_MATRIX.md`](RAIL_MATRIX.md) | 🔴 **Enforcement state.** What is actually checked, what is only partly checked, and what is not checked at all. **The single source of truth**, and no other file (including this one) may claim a wider state, or a narrower one |
| [`MANIFESTO.md`](MANIFESTO.md) | The argument made to a stranger: why this exists, why free, why open, why anonymous |
| **This file** | Why each refusal exists, and what each one costs |

⛔ **Do not restate the register here.** If you find yourself typing a count of what is enforced,
stop, that number belongs in one file, is derived from its own rows, and is checked against them by
`tests/rails/standing.test.mjs`. Point at it instead.

⚠️ **The person-facing vocabulary rule does not bind this file**, because nobody in trouble is
reading it. It does bind any string quoted here that a person would see.

---

## 1. Local-first, because a cloud holding defence material is the wrong shape

ADR [`0001`](docs/adr/0001-local-first-custody.md) · RAIL 10

**Refused:** any server that holds a byte of anyone's evidence.

**Why.** Possession is the whole problem, and it produces three distinct failures from one cause. A
store of privileged defence material is a **subpoena target**. The adversary does not need to break
anything, only to ask the right party. It is an **unmitigable breach risk**, because the blast radius
of one incident is every user's defence corpus at once. And it may **weaken the user's own
privilege**, which is the worst of the three: a protection they had before installing this, damaged
by a design decision they never saw.

**And it buys nothing.** The work is local by nature: read a source the person owns, copy it, seal
the copy, write a record beside it. None of that needs a network. The only legitimate cloud job is
anchoring a digest and a timestamp. Never content.

**What it costs, accepted knowingly.** No sync. No recovery if they lose the folder. No server-side
fix for anything, ever, including a bug in the sealing. Nothing can be improved for a user who does
not update. We take all of that, because "we cannot read your data" is only true when it is
structurally true.

**⚠️ The honest tension, written down rather than smoothed over.** Local-first says the files never
leave the machine, and the agent driving the session is usually a remote commercial service. Both
sentences are true at once:

> The files stay on this machine. **And what the person types to the assistant goes to whoever runs
> the assistant.**

An early draft printed only the first, which was simply false. Two things make the honest version
survivable, and both are decisions rather than caveats. **The flow needs none of the facts**: its
own questions are about records and devices, and yes and no are enough to say which records are
dying and in what order. And the one file that does accumulate matter detail is written by the
engine, read by the engine, and **never placed in a prompt**.

⚠️ **ADR `0009` changed who decides, not what is true.** The contract used to forbid asking what
happened, who was involved, or what was alleged. That protected the wrong property — the risk was
never that this software might know something, it was that a person cannot un-say something to a
service somebody else runs — and it charged the one thing people arrive here for, which is help
making sense of their own situation. So the gate moved to the disclosure: `S0` states who the words
travel to *before* any invitation to say more, and the decision is then theirs. **Not needing the
facts is still the design.** What is gone is a refusal to hear them.

⛔ **Rejected: requiring a local-only runtime**, to make the claim true rather than merely honest. It
would exclude nearly everyone this is for, in exchange for a purity that helps nobody in a cell.

**How it is held:** by execution, not assertion. The whole flow runs in a network-denied sandbox.
`tests/rails/offline.test.mjs`, in every tree that ships.

## 2. Nothing that touches the other person, structurally incapable, not policy-restricted

ADR [`0002`](docs/adr/0002-no-counterparty-surface.md) · RAIL 2

**Refused:** messaging, monitoring, location lookup, people-search, profile retrieval, list
enumeration, pretext accounts, *"just check whether they…"*. Not as a feature, not behind a flag, not
read-only, not "for the lawyer."

**Why, and it is not squeamishness.** Users of this are very often under an order forbidding contact,
where far less than speaking counts. Merely opening some surfaces joins the user to them. Following a
link written for one recipient writes a present-day entry into the exact record their lawyer wants
clean. A read receipt is a contact artifact. So a feature reaching the other party would make this
software **the instrument of a fresh offence against the person it was built for**, and the blast
radius is not a bad review, it is their liberty.

There is a second, colder reason. Anything that even *looks* like it does this destroys the referral
channel this depends on. Counsel will not name a tool that could have produced a breach, and no
distribution surface will carry one.

**The standard is the wording of the ADR: absent, not disabled.** A capability behind a switch is a
capability that ships, because a switch is exactly what gets flipped by somebody desperate at two in
the morning.

**Why a word ban is the wrong technique.** The banned verbs necessarily appear in the rails, the
fixtures and the documents that forbid them, so a repository-wide ban is either impossible to satisfy
or exempted into meaninglessness. Enforcement is instead a **positive allowlist** of commands,
subprocesses, endpoints, data sources and writes, extracted from the code and diffed **both ways**.
an undeclared capability fails, and so does a declaration with no code behind it, because an
allowlist edited to match whatever the code grew into is a rubber stamp. Vocabulary survives as a
narrower and genuinely useful **copy check**: no string a person reads may describe, offer, or
instruct an act against another person.

## 3. Own data only, and where the licensed-examiner line falls

RAIL 5 · [`docs/methods/01_evidence_layers.md`](docs/methods/01_evidence_layers.md)

**Refused:** anything the person is not lawfully entitled to obtain about themselves.

**Why.** The test is **entitlement, never capability.** Their device, their account, their export,
their receipt, a premises record obtained with the holder's consent. Never a counterparty's device,
account or cloud; never a credential they do not own; never a way around anybody else's encryption.
The reason is the same as RAIL 2's: a capture that is technically easy and legally unavailable
converts a person trying to defend themselves into a person committing a fresh offence.

**No command has a credential parameter, and that is a design decision rather than an omission.** A
password or token argument is an invitation, and the invitation is what gets accepted. The engine
rejects one if it is passed.

**Where the examiner line falls.** Key recovery, unlocking a device, reconstructing deleted content.
These are real, they have worked in practice, and they are **still refused here**, for two reasons
that are worth separating because they fail differently:

1. **Provenance will be attacked.** How the material was obtained becomes the argument, and an
   unlicensed tool in that chain hands the other side a better point than the evidence was worth.
2. **⚖️ Legality is local.** Where the line sits differs by country and nobody has checked.

So the deliverable is **the referral and the scope-of-work document, not the capability**, routed
through counsel to a licensed examiner. ⚖️ Where the line falls is a jurisdiction question; **that an
unclear case resolves to a referral is not.** With no reviewed pack anywhere, the answer is always
the referral.

## 4. A record, never a verdict

RAIL 3 · [`docs/methods/05_convergence_and_classification.md`](docs/methods/05_convergence_and_classification.md)

**Refused:** a score, a strength, a ranking, a percentage, a likelihood, a prediction, or any
aggregate over sources.

**Why.** Three labels exist (**CONSISTENT / IN TENSION / SILENT**) against a stated claim, one per
record type, and the tool stops there. A number invites the person to make life decisions on our
arithmetic, and we have no basis for the arithmetic. Worse, the moment the output concludes anything
it stops being a record a lawyer reads and becomes a claim the other side attacks, and attacking our
conclusion is far easier than attacking a sealed copy of what a device wrote.

**The subtle half, and why this refusal is not closed.** An aggregate can be a verdict **with no
forbidden word in it.** Four counts under a heading reading *how much this can help* invites the
strength inference the rail forbids, and a vocabulary check passes it happily. The rendering takes
the safer form already; the contract still carries the totals, and correcting the contract is an
amendment that belongs to the owner. Recorded, not quietly fixed.

## 5. Harm-first, adverse material first, in the same detail

RAIL 4 · [`docs/methods/06_harm_first_doctrine.md`](docs/methods/06_harm_first_doctrine.md)

**Refused:** any parameter that reorders, collapses, or omits what cuts against the user.

**Why.** A one-sided export is worthless to a lawyer and lethal under cross-examination, the first
thing opposing counsel does is find the part you left out, and finding it discredits everything
beside it. So this is not a fairness gesture. It is the property that makes the output usable at all.

There is a sharper way to see it. **A tool built to fabricate an alibi would look nothing like this
one.** It would not seal adverse material into the same set. It would not lead with the events that
damage its user. It would not refuse to draw conclusions. Harm-first is what makes this useful to a
fact-finder rather than to a fabricator, and that distinction is the entire reason a lawyer would let
it near a file.

**So it belongs in the generator, never in a footer**, and a generator that can be made to omit an
adverse item is broken rather than configurable. ⚠️ The generator does not exist in this version, so
this rail's check **runs and fails on purpose.** ⛔ Do not point it at a stub: a check that passes
because its target is absent is this project's headline failure mode. See the register.

## 6. The act of reading can create evidence against the user

RAIL 9 · [`docs/methods/08_capture_hazards.md`](docs/methods/08_capture_hazards.md)

**Refused:** any read of an external source that has not first been audited for what the read
*writes*.

**Why, and this is the least intuitive thing in the corpus.** Preservation is not passive. Opening a
platform surface can join the user to it. Following a per-recipient link writes a present-day entry
into the very record their lawyer wanted untouched. A viewed notification is a timestamp somebody
else now holds. **The person can damage their own position by looking**, and nothing about the act
feels dangerous while they are doing it.

So every command that touches a source carries a permission bound to **that exact source and that
exact operation**, and the dispatcher verifies it before the first read.

**The lesson that generalises past this rail:** a declaration in a reference document is a phrase; a
gate is a gate. This was once written down as enforced on the strength of a document *declaring* a
precondition. Then the gate was real and its two callers did not call it. Both failures are
invisible to a reader who trusts the document, which is why enforcement claims live in the register
and are pinned by name.

**Stated limit.** The go-ahead sits in the person's own folder and they own every byte of it, so it
establishes nothing against somebody setting out to defeat it. What it does establish is the absence
of the four things that actually happen: never obtained, obtained for something else, obtained too
long ago, carried in from another folder, and an assistant pressing on regardless.

## 7. Never handle intimate or sexual media

RAIL 6

**Refused:** opening, previewing, listing, thumbnailing, digesting, or "just checking whether." Hard
exclusion at ingest, by content class, no override.

**Why.** Handling that material creates independent criminal exposure **for the person we are trying
to help** and for maintainers. There is no version of this where the tool's convenience is worth
that.

**⛔ And the rail contradicts physics, which is stated here rather than hidden.** Copying a container
reads its bytes. Sealing it digests those bytes. The content class cannot be established without
either inspecting content or trusting the person's own classification, which is incomplete by
construction, because they frequently do not know what is inside an old backup, and that is precisely
why the rail exists. **The rail as written asks for an operation that does not exist.**

So the engine defaults to the strictly safer reading: **total refusal**: no copy, no inventory, no
digest, nothing beyond establishing that the path exists, and exits with a route to counsel or a
licensed examiner. That is *stricter* than the rail's own words, which is the correct direction to
err.

⛔ **It is a default, not a resolution.** The contradiction is a doctrine question for the owner with
counsel, and it is not an agent's to close. Note for reviewers: the runtime check for this rail is
green and its row in the register is **still partial, deliberately.** Promoting a test is not
resolving a question.

## 8. Positioning, and no promise about the result

RAILS 7 and 8 · `legal/advertising_rules.md`

**Refused, on positioning:** any scoping of the audience by gender, and ⛔ any figure about how common
a false accusation is.

**Why it is strategy and not delicacy.** The audience is *wrongly accused*, and it is deliberately
wide: respondents in workplace processes, parties in family proceedings, people accused of fraud or
theft, falsely-accused people of any gender, people far from home in a legal system that is not
theirs. A narrower scope closes exactly the distribution this needs, and it attracts a reading of
the project that no version of this survives. The prevalence figure fails on its own terms too: it
does nothing for the person in front of you, it cannot be sourced in a way that survives contact with
a lawyer, and it converts a preservation tool into a position in somebody else's public fight.

**Refused, on outcomes:** anything asserting or implying a result. We promise an intact record.

**Why it matters more than it looks.** Advertising rules for legal-adjacent services restrict
outcome-suggestive claims in most places, so the exposure is regulatory rather than merely
reputational, and a promise creates an expectation the moment the record cuts against the person,
which it will for roughly half of them. The cost of the broken promise lands on them, not on us.

**⚠️ Both are copy checks, and a copy check cannot be exhaustive.** A novel phrasing passes. Each
check therefore carries a mutation set that **includes phrasings it provably misses**, and fails if
all of them start being caught, because a mutation set that always passes claims a completeness that
scanning natural language cannot have.

**⚠️ And the project's own copy review is two steps of three.** A clean structural scan plus a clean
claims checklist is not approval. The third step (a lawyer, per jurisdiction) **has never been run
for any jurisdiction**, and it is the only one of the three that can catch a claim being *wrong*
rather than merely off-message.

## 9. ⚖️ No legal answers, and the seam that runs through everything

ADR [`0005`](docs/adr/0005-jurisdiction-layer-primary-axis.md) ·
[`jurisdictions/README.md`](jurisdictions/README.md)

**Refused:** answering a legal question. Not inferred, not from a neighbouring country, not from a
search, not "roughly."

**Why.** One seam runs through the whole corpus. **The engine transfers everywhere**, capture,
sealing, the clock, the refusals, adverse-material-first. **The legal side transfers nowhere:** what
conditions forbid, which arguments are barred, whether a demand binds, what a holder must give you,
how long a record survives, where the examiner line falls, what copy is permitted.

⛔ **Zero packs are reviewed by a practitioner, Canada included.** `UNANSWERED` is a correct and
useful value, it tells the next reader what to ask. An invented answer is a defect, because a
frightened person will act on it and the page gives them no way to tell the two apart.

**The inversion, and it is the opposite of what it looks like.** This corpus is *not*
"Canada-covered." It is jurisdiction-neutral-*looking* with unmarked assumptions drawn from Canadian
practice, which is **worse**, because a reader cannot tell which sentences those are. Claiming
coverage would be false in the dangerous direction.

**Working rules that follow.** Mark seams in place with an inline pointer; never move the content and
never fork a document per jurisdiction. An agent may build a pack skeleton and mark a seam; **an
agent may never answer a legal question in a pack.** Review state lives *in* the file and is never
inferred from the file existing.

**The binding constraint is not engineering.** It is finding practitioner reviewers under anonymous
maintainership, where a reviewer is recorded **by role only**, so they get none of the credential a
review normally earns. That cost is real and there is no way around it.

## 10. Free forever, open, anonymous, MIT, and the cost that is accepted rather than argued away

ADRs [`0003`](docs/adr/0003-free-open-anonymous.md) and [`0006`](docs/adr/0006-mit-licence.md) ·
RAIL 11

**Refused:** any price, tier, trial, quota, seat, key, or account; and any telemetry, analytics,
crash reporter, or version check.

**Why free.** The person with the most urgent need has the least ability to pay at the exact moment
the need is most urgent: day one, no lawyer yet, on legal aid or nothing, facing a process with no
procedural rights at all. A licensed forensics firm is better than this at nearly everything except
being there on day one for nothing, and by the time one starts there is no short-loop record left.
**A paywall on evidence preservation is a paywall on the truth surviving.** The tool is never the
leverage.

**Why no usage data, specifically.** Usage data about a defence-preservation tool is a record that
somebody was preparing a defence, held on a third party's server, and discoverable. So *anonymised*
and *opt-in* are not mitigations here; they are two further ways to hold that record. With no server,
the user does not have to trust us about any of it.

**Why open**, and each of these alone would be sufficient. **It has to be auditable to be worth
anything**: the entire claim is that a record has not changed since capture, and a closed tool making
that claim asks a court to trust a vendor it cannot inspect. Verifiability is not a feature of this
project, it *is* the product. **It has to outlive whoever built it**, because a person's liberty must
not depend on a startup's runway. **Adversarial review is the only thing that makes it correct**.
the methods were learned by getting things wrong, and closed development would have shipped those
errors into somebody's real matter. **And the legal side has to be forkable** by people who actually
practise where they are.

**Why anonymous.** Whether the code is correct is settled by reading it, running it, and checking its
output with independent tools. Never by who wrote it. Attaching names makes the tool discreditable
by discrediting a person, which is a poor property for a project about the reliability of records.
And some of the people best placed to build this have been through it; requiring a name is asking
them to accept a permanent, searchable cost for helping. The consequence we inherit: **reproducible
builds are the only credibility anonymity leaves us.**

**🔴 The cost, stated plainly because it is real: MIT is permissive, so it does not bind a fork.**
Anyone may close this, sell it, and strip every refusal in this file. **Free forever is a promise
about *this* project, not a restriction on anyone else's.** That was weighed and accepted rather than
mitigated, and the reasoning is in ADR `0006`.

⛔ **The copyright holder is `Machine Witness contributors` and must never become a person's name.**
The licence requires the notice to propagate into every downstream copy, which makes that line the
worst place in the tree for an identifier.

## 11. The uncomfortable part, and it is not a caveat

**This tool does not sort the innocent from the guilty, and it is not designed to.**

It preserves what a person's own devices recorded, including the parts that hurt them, surfaced
first and in the same detail as the parts that help. Anyone reading this hoping it filters for the
deserving has misread it, and anyone hoping it can be bent into an alibi generator has misread it
harder: every property in sections 4, 5 and 6 exists to make that impossible.

**Sorting people is what due process is for. Making sure it has something real to work with is what
this is for.** An early-frozen, tamper-evident, adverse-material-first record makes a fact-finder's
job easier, not harder, whatever it happens to show.

And the last line, which belongs in every version of this: it will not prove anybody innocent.
Nothing can. It is not a defence, not a lawyer, and not a substitute for either.

---

## How to use this file

- **A change to anything above is an ADR**, not a paragraph edited into a method document. ⛔ And an
  ADR records the reasoning of its own moment: it is never retro-edited, even where it has gone
  stale.
- **Enforcement state is [`RAIL_MATRIX.md`](RAIL_MATRIX.md), and only there.** ⛔ No rail may be
  described as enforced until its row is complete, a positive invariant, a violating fixture, and a
  check that executes the thing and asserts what it did.
- **Working rules for anyone editing this repository are [`AGENTS.md`](AGENTS.md).** How to
  contribute is [`CONTRIBUTING.md`](CONTRIBUTING.md). What the output cannot establish is
  [`HONEST_LIMITS.md`](HONEST_LIMITS.md).
- **Comments and asides explain *why*, especially where a decision looks wrong until you know what
  went wrong before.** Those are load-bearing; deleting one as noise removes the only record of a
  real failure.
- **Write the lesson, never the anecdote.** A sentence that only makes sense with a real name, date,
  or matter in it is wrong for this repository. Generalise it or drop it.
