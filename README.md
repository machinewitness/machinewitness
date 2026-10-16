<a id="readme-top"></a>

<div align="center">

# Machine Witness

**The machine is the witness that cannot be coached, cannot misremember, and takes no side.**

Your own devices have been keeping a timestamped record of your own life.
Nobody told you it was there, and **some of it is being deleted this week.**

> **This will not tell you that you are innocent. Nothing can.**
> It keeps the record intact long enough for a lawyer to look at it.

[![Licence: MIT](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)
[![Free forever](https://img.shields.io/badge/price-free%20forever-brightgreen)](MANIFESTO.md)
[![No accounts, no telemetry](https://img.shields.io/badge/accounts%20%C2%B7%20telemetry-none-brightgreen)](docs/adr/0003-free-open-anonymous.md)
[![Works offline](https://img.shields.io/badge/network-never%20required-brightgreen)](#privacy)
[![Countries reviewed: 0](https://img.shields.io/badge/countries%20reviewed-0-critical)](jurisdictions/README.md)

**[Do this first](#first) · [Quick start](#start) · [What it does](#does) · [Your country](#country) · [Add your country](#contributing)**

</div>

---

> [!CAUTION]
> **⚖️ No country's law has been reviewed here. Not one.** The technical method works anywhere; the
> legal side is empty. **Get a lawyer.** This preserves the record — it does not advise you.
> [Your country](#country) · [What it cannot establish](HONEST_LIMITS.md)
>
> **🤖 Most of it runs through an AI assistant, and AI makes mistakes.** Read what the assistant
> produced before you send it anywhere, and read it as though somebody hostile will — hardest for
> the steps that look finished. **The part you need most needs no assistant at all**, and never
> will: the stop list and the clock are text on a page. That is the next section.

---

<a id="first"></a>

## 🆘 Do this first

**No software. No network. No assistant. Works on paper, today.**

1. **Don't talk to the police. They are not your friends.** Not to an investigator, not to HR, not
   to the other person's friends. Not to clear it up, not informally, not at your own door. Anything
   you say becomes a fixed account you are held to later — before you or your lawyer know what is
   actually alleged. **Do not consent to anyone searching or taking your phone or computer. Say you
   want your lawyer.**
2. **Get a lawyer. Today.** What you save now is what they have to work with.
3. **Write down what you remember ONCE, and then never improve it.** Today, because memory fades —
   but a note that gets tidied or corrected later is worth far less than a rough one written
   immediately, and the edits themselves become a problem.

Three more that cannot wait:

- ⛔ **Do not delete or cancel anything.** Not a message, photo, booking, subscription, or calendar
  entry — not one that embarrasses you, not one you never wanted. Deleting looks like consciousness
  of guilt, cancelling often *notifies the other side*, and either can be a separate offence.
  **Preserve, do not purge.**
- ⛔ **Do not contact the other person or look at their accounts.** Any channel, any intermediary,
  any reason. Opening a profile can notify them. Some platforms add you to a conversation merely
  for viewing it.
- 🔴 **Building camera footage is usually the most perishable record that exists** — often a rolling
  loop of about two weeks. If one thing gets done today, it is asking whoever holds it, in writing,
  to keep it. *Whether that request binds them is a question for your country, and it is unanswered
  here.*

**Full version — fourteen things not to do, then the clock, then the ordered actions, in that order
and no other: [docs/triage/DECISION_TREE.md](docs/triage/DECISION_TREE.md).** It needs no software
and never will.

---

<a id="start"></a>

## 🚀 Quick start

**Three steps. You need `python3` and about two minutes.**

⚠️ **Nothing is published yet, so step 2 copies from a local clone of this repository.** It has to
work with the network switched off, so there is no download step at the moment you actually need it.

### 1 · Make a folder for your own material

Somewhere under your home directory. **It must not be inside a code project.** Nothing needs to be
in it yet.

```sh
mkdir -p ~/my-defence          # any name you like. This folder is yours
```

### 2 · Put the skill inside that folder

Run this **from your clone of this repository**, and change the last path to the folder you just
made. One command, both assistants:

```sh
MW=~/my-defence                                              # ← the folder from step 1
mkdir -p "$MW/.claude/skills" "$MW/.codex/skills"             # ⚠️ do not skip this line
cp -r .claude/skills/machine-witness "$MW/.claude/skills/"
cp -r .codex/skills/machine-witness  "$MW/.codex/skills/"
```

### 3 · Open your assistant **in that folder** and type one thing

```sh
cd ~/my-defence      # ⚠️ this line matters more than it looks. See below
```

Then start Claude Code, Codex, OpenCode or Gemini there, and type:

<div align="center">
<br>

# `/machine-witness`

**That is the whole interface.**

`/machine-witness` in an assistant · `mw` in a terminal

</div>

<details>
<summary>🔴 <b>Why you must NOT run this from inside the cloned repository</b> — it will refuse, and the refusal is correct</summary>

<br>

If you open your assistant inside the clone and start the flow, **the engine stops and will not
continue.** Its own words:

```
I will not put your case folder inside a project that keeps its own history of every file in it.
That is the kind of project people keep code in, and the tool that manages it copies whatever is
inside it. One ordinary command sends everything in that folder to a shared server, or puts it on
the internet where anyone can read it, with a note of who sent it and when. None of that can be
taken back afterwards.
```

**That is not a bug and it is not something to work around.** This repository is a git project. A
single ordinary `git push` from inside it would publish your own evidence, permanently, with a
record of who pushed it and when.

The check looks for a `.git` marker at your folder **and every folder above it** — never below. So
keeping the clone *inside* your material folder is fine; making the clone *be* your material folder
is not. Steps 1–3 put you on the right side of that line, which is the only reason they are in that
order.

</details>

<details>
<summary>⚠️ <b>Why <code>cd</code> in step 3 is not optional, and what breaks without it</b></summary>

<br>

The skill tells your assistant to run `python3 .claude/skills/machine-witness/scripts/triage.py`,
and that path is **relative to wherever the assistant was opened.** So it resolves in the folder
holding the skill, and nowhere else.

🔴 **A consequence worth stating plainly: copying the skill to the usual global location
(`~/.claude/skills/`) makes it findable but not runnable.** Your assistant will offer it, then fail
with `can't open file '.../.claude/skills/machine-witness/scripts/triage.py'`. That is a known
defect in how the path is generated, not something you did wrong, and the per-folder install in step
2 is the route that works today.

</details>

<details>
<summary>🔴 <b>Why that <code>mkdir</code> line in step 2 is the difference between working and failing silently</b></summary>

<br>

If the destination directory does not exist, `cp -r` does not copy *into* it — it **renames** the
folder to that path. The skill lands as `<your folder>/.claude/skills/SKILL.md` instead of
`<your folder>/.claude/skills/machine-witness/SKILL.md`, **nothing reports an error**, and the
assistant simply never offers the skill.

A silent failure is the worst kind here, because the person finding out is someone who needed this
to work on the day they installed it.

</details>

<details>
<summary><b>Two other ways in</b> — a plugin, or a terminal with no assistant at all</summary>

<br>

**As a plugin, in an assistant that supports them.** ⚠️ Same caveat as the global install above: run
the flow from a folder that is not a code project.

```
/plugin marketplace add /absolute/path/to/this/repository
/plugin install machine-witness@machine-witness
```

**Or a terminal, with no assistant in the loop at all.** Run it *from* your material folder:

```sh
cd ~/my-defence
node /absolute/path/to/the/clone/cli/bin/mw.js
npm link      # once, from the clone, if you would rather type just mw
```

**Node opens the door and nothing else** — it turns the name you typed into one program, starts it,
and steps out of the way. Everything that reads or writes your own files is `python3` on every
route, so the assistant routes need nothing but `python3`.

| Tier | You need | You get |
|---|---|---|
| **1 · Read it** | Nothing. Works on paper | The stop list, the clock, the ordered actions. **The part that helps most on day one** |
| **2 · Run it** | A terminal and `python3` | The same flow, offline, nothing between you and it |
| **3 · 🤖 Assist** | An AI assistant that loads skills | The same flow walked with you, plus freeze-and-check and their stop conditions |

</details>

**No argument. No menu. Nothing to pick from.** It asks what is safe to ask, in a fixed order it
owns and will not shuffle, and stops when it has told you what to save and in what order.

**Its questions are about devices and accounts, and it needs nothing else** to tell you which
records about you are running out. Yes and no are enough. Not needing the facts is the design, not
a shortcoming.

**Whether you say more is your call, and it tells you what you need to make it.** Before it invites
anything, it says plainly where your words go: over the internet, to the company whose computers run
the assistant — not to police, not to a court, not to anyone involved. Then it offers, once, and
drops it if you say no. It will not put anything you tell it into a file without telling you which
file first.

The first thing it does is work out what order or process you are under, and therefore which ways of
saving something are **closed** for you. Advice about evidence before that ordering is how somebody
breaches a condition while trying to help themselves.

<p align="right"><a href="#readme-top">back to top ↑</a></p>

---

## Who are you?

Three readers, three first pages. Take yours and skip the rest.

|  | You are | Go to |
|---|---|---|
| 🆘 | **Accused of something, and frightened.** Maybe today. Maybe no lawyer yet | **[Do this first](#first)** |
| ⚖️ | **A lawyer or advocate** deciding whether to point a client here | **[What it cannot do](#does)** · [honest limits](HONEST_LIMITS.md) · [your country](#country) |
| 🛠 | **A developer, or a practitioner who wants their country covered** | **[The method](docs/methods/00_index.md)** · **[Contributing](#contributing)** |

<details>
<summary><b>If you have five minutes and no idea what any of this is</b></summary>

<br>

Somebody has accused you of something. From that moment, the records that could corroborate your
account are **dying on a clock you cannot see.** Camera loops overwrite — some in about two weeks.
Device logs roll over in days. Export links expire. Platform records get pruned. Nobody tells you any
of it exists.

Meanwhile the other side may have laboratories, warrants, trained investigators, and years. You have
a phone.

| | |
|---|---|
| **One side has** | laboratories, warrants, trained investigators, years |
| **You have** | a phone, no idea what data exists about your own life, and about two weeks before the building's cameras overwrite the morning in question |

But the record on that phone — and in your watch, your card statements, your door fob, your bookings,
your sleep and heart rate, every screen unlock to the millisecond — **was written by machines that
had no idea a dispute was coming and no stake in how it ends.** None of it has to be believed. It
cannot be coached and it cannot change its story under pressure. In most disputes it is the only
evidence that is not somebody's account of events.

And when somebody loses the evidence that would have corroborated them, it is almost never because
anyone destroyed it. It is that **nobody told them it was there, and nobody told them it was running
out.**

This is the instructions for keeping it alive, and the tool for freezing it so it can be shown not to
have changed since you saved it. Free, forever. No account, no e-mail address, nothing to pay.

**Who it is for: anyone facing an accusation, at any stage.** A workplace complaint. A family-court
allegation. A fraud or theft accusation. A criminal charge. An investigation nobody has explained to
you yet. You do not need a lawyer yet to start, and **you do not need to know what any of this is
called.**

**It will not tell you that you are innocent, and it is not designed to.** It preserves what the
devices recorded, including the parts that hurt you. That is precisely what makes it worth anything
to a lawyer.

</details>

<p align="right"><a href="#readme-top">back to top ↑</a></p>

---

<a id="does"></a>

## ✅ What this does, and what it cannot

**Read the right-hand column first.** It matters more, and it is not a disclaimer — a tool that
overstates itself is worthless the moment somebody tests it.

| ✅ It does | ⛔ It does not, and will not |
|---|---|
| Tells you **which records exist** about your own life, and **how fast each one dies** | **Prove you did not do something.** Nothing can. A record is a cross-check on a claim |
| **Freezes and seals** your own data, so a copy can be shown not to have changed since you made it | Give you **a verdict, a score, a percentage, or a prediction** |
| Shows what cuts **against** you first, in the same detail as what helps | Give you **legal advice**, or interpret the conditions you are under |
| Produces something **organised and checkable**, ready to hand to your lawyer | **Touch the other person**: no messaging, no lookup, no location. Absent from the design, not switched off |
| Works **completely offline.** No account, no e-mail, no telemetry, no price | **Recover deleted or locked data.** That is a licensed examiner's work, through your lawyer |
| Warns you when **the act of looking** writes a record against you | **Handle intimate images.** Hard exclusion, no override, no preview |
| Is **open source and forkable**, so it outlives whoever wrote it | **Send anything anywhere on your behalf.** A request cannot be un-sent |

> **A record is a cross-check on a claim. It is never proof of innocence.**

⚠️ **One thing in that list is not yours to fetch.** Your watch, phone, camera roll, chat logs and
inbox receipts are your own, and this walks you through them. **Building cameras and door-entry logs
belong to somebody else** — and they are usually the first to be overwritten — so today's move is
asking your lawyer to send a preservation request, not installing anything.

**Nothing here reaches toward the person accusing you.** Not messaging, not a profile lookup, not
"just checking where they are": not as a feature, not behind a flag, not as a favour, not "for the
lawyer." You are very likely under a condition forbidding contact, where far less than speaking
counts. **The blast radius is your liberty.** So it is absent from the design rather than present
and refused.

<details>
<summary><b>The other refusals, each with what it costs you</b></summary>

<br>

- **A record, never a verdict.** No score, no ranking, no prediction, no "how strong is my
  position." Meaning is a lawyer's job and this stops short of it deliberately.
- **⚖️ No legal answers, for any country.** What your conditions forbid, what you may demand from a
  record holder, how long they keep it, which arguments are barred — all local, all in
  [`jurisdictions/`](jurisdictions/README.md), and **none of it checked by a practising lawyer.** An
  unanswered question is the correct entry there. An invented one is a defect, because you would act
  on it.
- **No promise about how this ends.** ⛔ Never *cleared*, never *exonerated*, never *prove your
  innocence*, never *beat the charge*. What is on offer is an intact record. Nothing more is
  available to offer, and anybody offering more is selling you something.
- **Nothing sexual or intimate is opened, previewed, listed, or sealed.** If a source might hold it,
  the tool refuses outright and routes you to your lawyer and a licensed examiner. Handling that
  material would create fresh criminal exposure for you.
- **No examiner-grade work.** Key recovery, unlocking a device, reconstructing deleted content are
  real and belong with a licensed examiner instructed by your lawyer, because how they were obtained
  will be attacked and what is lawful differs by country. You get the referral and the scope-of-work
  document, not the capability.
- **Only your own.** Your device, your account, your export, your receipt. Never anybody else's
  device or cloud, never a credential you do not own, never a way around anyone else's encryption.
- ⛔ **Not scoped to one gender, and carrying no figure for how common a false accusation is.** Both
  are somebody else's argument, and neither does anything for the person in front of us.

Why each refusal exists and what each one costs: **[DOCTRINE.md](DOCTRINE.md)**.

</details>

<p align="right"><a href="#readme-top">back to top ↑</a></p>

---

<a id="country"></a>

## ⚖️ Your country: the law is local

**The honest state of the project, deliberately near the top.**

| Country | Pack | Reviewed by a practitioner | Safe to rely on |
|---|---|---|---|
| 🇨🇦 Canada | [`jurisdictions/ca/`](jurisdictions/ca/00_status.md): the question list, no answers | ⛔ **none** | **No** |
| Everywhere else |   |   | **No.** The method works; the legal side does not exist for you |

Capturing a record, freezing it, checking it and sorting it is the same everywhere. **What you are
allowed to do, what your conditions forbid, which arguments are barred, whether a preservation
request binds anyone, and what a record holder owes you** changes at every border, and over time
inside each one. So the project is split down that seam: a common engine, and a per-country pack a
practitioner has to fill. **Zero packs are filled.**

**Can you fix this for your country?** [Yes, and it is the most valuable contribution
available.](#contributing)

<details>
<summary>⚠️ <b>The part that is easy to get wrong — and it is the opposite of what it looks like</b></summary>

<br>

The method documents here barely name a country. **That absence is not neutrality.** The experience
behind them is Canadian, so an unmarked legal assumption is most likely a Canadian one, and you
cannot tell from the page which sentences those are.

It bites hardest at the very first question you are asked, about *"a release or bail condition,
undertaking."* Those are Canadian terms of art. **If none of those words describe anything you were
given, the question still applies to you**: read it as *any order, condition, or directive
restricting what you may do or where you may go, including one from an employer.*

Wherever a legal answer is load-bearing, the text carries a marker:

> ⚖️ **[JURISDICTION]** → `jurisdictions/<code>/<file>.md`

Every one of them currently points at an unanswered question. Reasoning:
**[ADR 0005](docs/adr/0005-jurisdiction-layer-primary-axis.md)** · Coverage:
**[jurisdictions/README.md](jurisdictions/README.md)**

</details>

<p align="right"><a href="#readme-top">back to top ↑</a></p>

---

<a id="privacy"></a>

## 🔒 Privacy: two halves, and you should read both

**The files stay on your machine.** Nothing you keep is uploaded. No server, no account, no
telemetry, no analytics, no crash reporting, no version check. Cut the network and it still runs.

**And what you type to the assistant goes to whoever runs the assistant.** ⛔ Anyone who tells you
nothing you type leaves your machine is wrong. What makes it survivable is that **the flow never
asks for the facts of your matter**, so there is very little for you to have typed.

<details>
<summary><b>Why the terminal route does not have that second half, and one more thing said plainly</b></summary>

<br>

The second half is about the assistant, not about this software. At the terminal front door there is
nothing in the loop to send anything to, and what you type does not leave your machine. Same
questions, same order, same answer either way.

And: the folder it creates is yours, at restrictive permissions — but a backup tool, a sync client,
or a search index already on your machine may still reach it. **That is not a safety boundary and is
never described as one.**

</details>

<p align="right"><a href="#readme-top">back to top ↑</a></p>

---

<a id="standing"></a>

## 🧭 Where this actually stands

| | |
|---|---|
| ✅ **Enforced** by a check that executes the thing and asserts what it did | **seven** of eleven |
| 🟡 **Partly enforced**, each for a reason printed in its own row | **three** |
| ⬜ **Not enforced at all** — the feature it guards is not in this version, so its check lands red on purpose | **one** |

**Read [`RAIL_MATRIX.md`](RAIL_MATRIX.md) rather than trusting a summary of it, including this
one.** ⛔ No other file may claim a wider state than that file, or a narrower one.

<details>
<summary><b>The three partials, and two more live gaps</b></summary>

<br>

The three partly-enforced refusals: one needs a file that must never live in a repository, one needs
a contract amendment that is the owner's, one needs a doctrine question settled with counsel.

Two more, both live: **nothing here has been published**, and **the outward-facing wording in this
repository has never been reviewed by a lawyer.** A clean automated check plus a clean checklist is
two steps of three, and the third is the only one that can catch a claim being *wrong* rather than
merely off-message.

What the output cannot establish, as doctrine rather than a footnote:
**[HONEST_LIMITS.md](HONEST_LIMITS.md)**. Every limit there is a required field on the thing it
describes — a device record shows what a device did, not who held it; a quiet device does not show
that nothing happened; a brief event can fall between samples.

</details>

<p align="right"><a href="#readme-top">back to top ↑</a></p>

---

<a id="contributing"></a>

## 🤝 Contributing

**Pseudonymous contributions welcome. No identity required, ever.** We review the work, not the
author. Full rules: **[CONTRIBUTING.md](CONTRIBUTING.md)**.

<details>
<summary>⚖️ <b>The most valuable thing you can add is your country</b></summary>

<br>

If you practise law anywhere, you can close a gap no amount of code will:

```sh
cp -r jurisdictions/_template jurisdictions/<iso-3166-1-alpha-2>
```

Then work the ordered question list in that pack's `00_status.md`. **A partial pack is worth a pull
request**: one reviewed file with an honest status beats an empty directory, and beats a
complete-looking guess. Correcting an engine default that is wrong where you are *is* a review, and
it is the most useful form of one.

**Two rules, both absolute:**

1. ⛔ **Do not guess, and do not let a model fill a cell.** `UNANSWERED` is a correct value — it
   tells the next reader what to ask. An invented answer is a defect, because a frightened person
   will act on it.
2. ⛔ **Public authority only.** No matter you are working on, no client, no charge combination, no
   file number, no date window.

Reviewers are recorded **by role, never by name.** That protects you, and it means you get none of
the credential a review normally earns. That cost is real and there is no way around it.

Pack instructions: **[jurisdictions/_template/README.md](jurisdictions/_template/README.md)**

</details>

<details>
<summary><b>📜 Licence — MIT, for everything — and 🙏 acknowledgments</b></summary>

<br>

**MIT, for everything.** Code, documents, the method corpus, the country packs: one licence, one
file, verbatim — [LICENSE](LICENSE). Use it, change it, embed it, ship it. No reciprocity condition,
no separate documentation licence, no field-of-use restriction. Keep the copyright notice and you
have complied.

**What that means honestly:** MIT also lets somebody take this, close it, and sell it. That was
accepted in exchange for a licence a legal-aid clinic's IT department can approve in thirty seconds.
Reasoning and cost in [ADR 0006](docs/adr/0006-mit-licence.md).

**Free forever is a promise about this project, not a restriction on yours.** No price, tier, trial,
quota, seat, key, or account. No telemetry — not anonymised, not opt-in. Why it must be free rather
than merely cheap, why it must be open to be worth anything on the stand, and why the maintainers
are anonymous: **[MANIFESTO.md](MANIFESTO.md)**.

**Acknowledgments.** The method here was learned the hard way, inside a real matter, by people who
had no such document. **The method transfers; the facts do not.** Nothing from any real case is in
this repository, and a check runs on every commit to keep it that way. Unsigned, deliberately — the
identity of the authors has nothing to do with whether the work is correct.

</details>

<p align="right"><a href="#readme-top">back to top ↑</a></p>

---

<a id="for-developers-and-experts"></a>

## 🛠 For developers and experts

⛔ **Everything above this line is the entire interface for a person who needs help. Everything
below it is vocabulary for somebody building, reviewing, or auditing this.**

The boundary is not tidiness. **A command table is a recall interface, and acute stress removes
recall first.** An earlier draft put a twenty-two-row command table at the centre of this file,
recreating the exact thing the single command exists to remove, on the surface a frightened person
reaches first.

<details>
<summary><b>The command vocabulary</b> — the agent's, and an expert's. Never presented to a person</summary>

<br>

| Command | Does | Reference |
|---|---|---|
| `init` | 🔴 The one human surface. Walks the contract and sets up the person's own folder | [init](skill/reference/init.md) |
| `hazard` | The stop list, first and unskippable: what is closed for this person, and what not to touch | [hazard](skill/reference/hazard.md) |
| `triage` | The clock and the record questions, then the preservation plan that falls out of them | [triage](skill/reference/triage.md) |
| `clock` | What dies when, ordered by clock and never by value | [clock](skill/reference/clock.md) |
| `layers` | Re-read the record questions and the fence on each | [layers](skill/reference/layers.md) |
| `capture-audit` | 🔴 What the *act of saving something* writes. A precondition, not advice | [capture-audit](skill/reference/capture-audit.md) |
| `freeze` | Copies a source they own, seals the copy, and writes a record beside it a person can read. The original is never changed | [freeze](skill/reference/freeze.md) |
| `verify` | Re-check a sealed copy: verified / mismatched / **unverifiable**, counted separately | [verify](skill/reference/verify.md) |
| `limits` | What the result cannot establish | [limits](skill/reference/limits.md) |
| `jurisdiction` | Report a pack's review state and every unanswered question. ⛔ Never answers one | [jurisdiction](skill/reference/jurisdiction.md) |
| `gate` | The case-fact check, over repository and publication inputs only | [gate](skill/reference/gate.md) |

An expert who types `mw freeze` at a terminal gets `freeze`. A person in trouble never learns it
exists.

⛔ **Eleven, and that is the ceiling for this version.** A twelfth needs a method document, a row in
the register, and a wave of its own. Ten more were deferred and one was cut outright; each was a
defect rather than a trim, and [ADR 0007](docs/adr/0007-one-repo-agent-first.md) records why.

⚠️ Which entry points are covered by the offline check is a moving question, and the check answers it
rather than this file: it **fails loudly** on a surface it does not drive, rather than skipping one.

</details>

<details>
<summary><b>Source, generated, and the contract</b> — read before editing anything</summary>

<br>

`skill/` is source. `.claude/`, `.codex/`, `plugin/`, `skill/data/tree.json` and
`skill/data/tree.sha256` are **generated**: edit `skill/`, then rebuild. A hand-edit of a generated
tree is a defect and the freshness check catches it; provider trees diverge silently otherwise, and
the divergence stays invisible until somebody on the wrong provider gets a different flow.

`skill/data/tree.yaml` is the contract **and the program.** A deterministic offline engine walks its
`branch`/`next` edges mechanically and renders its fields verbatim, so **editing it is a code change
with legal consequences.** It has its own amendment procedure, [`AGENTS.md`](AGENTS.md) §7, carried
verbatim into [`CONTRIBUTING.md`](CONTRIBUTING.md), and ⛔ an agent may never amend hazard wording, a
hard exclusion, or a `never:` entry — barred whether or not a previous amendment touched one. What
has been amended, and what is still the owner's, is recorded in one place:
[`.claude/docs/amendments.md`](.claude/docs/amendments.md).

Zero runtime dependencies. Every script on a user path is Python 3 standard library. Node is a build
tool only and may not appear on any user path.

**The register's numbers are derived, not typed.** The totals in [Where this
stands](#standing) come out of `RAIL_MATRIX.md`'s own rows, and `tests/rails/standing.test.mjs`
parses that table, counts the markers, and fails if the totals disagree with the rows they claim to
count. ⛔ Do not flatten it into a claim that all of them are covered — that is the failure this
project keeps rediscovering.

</details>

<details>
<summary><b>Checks — and read the count each one prints</b></summary>

<br>

```sh
git config --get user.email                   # verify BEFORE the first commit, not after
./ops/ci_casefact.sh                          # ← read "tracked files: N"
python3 ops/check_contracts.py --selftest     # the check must be known to fire
python3 ops/check_contracts.py                # ← read "scanned N document(s)"
node scripts/build.mjs                        # then assert a zero diff
npm test
```

🔴 **A green is worth exactly what it scanned.** Both gates print a count for one reason: a gate that
scans nothing prints the same green as a clean tree. That has happened here twice — once in the gate,
once in the wrapper written to report the gate, and in the second case a repository sat with green
continuous integration while nothing was read at all. ⛔ Never weaken a check to make a run green;
fix the content, or add a scoped exception with a comment saying why it is scoped.

⚠️ **The case-fact check cannot catch a proper name.** Plant a real surname and it prints a pass. The
missing half is a list of real values which by design lives outside every repository, and it is
unwritten. No step may treat a green check as a clean tree.

</details>

<details>
<summary><b>Where to read next</b></summary>

<br>

| File | What it owns |
|---|---|
| [`AGENTS.md`](AGENTS.md) | 🔴 The binding instructions for anyone working *on* this repository. Read it first |
| [`RAIL_MATRIX.md`](RAIL_MATRIX.md) | The single source of truth for what is enforced, and what is not |
| [`DOCTRINE.md`](DOCTRINE.md) | Why each refusal exists, and what each one costs |
| [`MANIFESTO.md`](MANIFESTO.md) | Why this exists at all; the reasoning of record for free, open, anonymous |
| [`HONEST_LIMITS.md`](HONEST_LIMITS.md) | What the output cannot establish, as a doctrine rather than a footnote |
| [`docs/adr/`](docs/adr/README.md) | Decision records. ⛔ Never retro-edited, even where one is now stale |
| [`docs/methods/00_index.md`](docs/methods/00_index.md) | ⭐ The method knowledge behind every command, the justification the tool rests on |
| [`docs/triage/DECISION_TREE.md`](docs/triage/DECISION_TREE.md) | Day-one guidance, agent-free forever |
| [`jurisdictions/README.md`](jurisdictions/README.md) | ⚖️ The coverage table. The only statement of legal scope this project makes |
| [`legal/`](legal/advertising_rules.md) | The project's own claims policy and its own-data-only boundary |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to contribute, pseudonymously, with no identity required |
| [`SECURITY.md`](SECURITY.md) · [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md) | Reporting, and how people are expected to behave here |

</details>

<div align="center">
<br>

**This preserves the record. It does not tell you what the record means,
and it cannot prove a negative.**

### Get a lawyer.

<br>
<a href="#readme-top">back to top ↑</a>
</div>
