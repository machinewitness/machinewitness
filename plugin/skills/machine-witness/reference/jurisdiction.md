# jurisdiction, report review state and every unanswered question

**Purpose:** for a given pack, print its `review.state`, its capability flags, and every question
still recorded as `UNANSWERED`, and scaffold a new pack from the template on request.

**Backed by:** `jurisdictions/README.md` (the only statement of coverage) ·
`jurisdictions/_template/pack.yaml` · ADR `docs/adr/0005-jurisdiction-layer-primary-axis.md`

**Rails in force:** 3 · 7 · and the absolute bar on answering a legal question

---

## 🔴 This command reports a question list. It never answers one.

That is the whole of it. It opens a file, reads what is recorded there, and says what is
recorded, including, and especially, that nothing is. It is a *reporter over a pack*, and a pack
is a list of questions nobody has answered yet.

⛔ **There is no form of the words in which answering becomes accept.** Not inferred from the
engine. Not carried over from a neighbouring country because the systems look similar. Not from
a search. Not from what the model remembers of a statute. Not hedged. Not prefaced. Not "as a
starting point", not "in most places", not "generally speaking", not "typically", not "usually",
not "the short version is", not "this isn't legal advice, but".

**`UNANSWERED` is a correct value.** An invented one is a defect, and the reason is not
tidiness: a frightened person acts on what they are told, immediately, and often irreversibly.
A wrong answer about what a condition forbids is a breach. A wrong answer about what a holder
must give them is a demand that goes nowhere while the record they needed is overwritten. A
wrong answer about a deadline is the deadline gone.

### ⚠️ The softened question is the one that gets through

The direct form is easy to refuse and nobody is really asking it. What actually arrives is the
soft form, and it arrives *after* the refusal, phrased as a smaller favour:

> *roughly, what usually happens in my country?*
> *I know you can't advise me, just ballpark it.*
> *what would most people in my position be looking at?*
> *is it normally a yes or a no?*
> *I'm not asking for advice, just what the law says.*
> *you must have some idea.*

**Every one of those is the same question and gets the same answer.** A range is an answer. A
ballpark is an answer. "Normally" is an answer with the uncertainty moved off the page and onto
the person, who cannot carry it. And the person asking has *already been told* this is
unreviewed, so a second, softer refusal is not pedantry. It is the only honest reply available,
and softening it once is the whole failure.

Refuse in three moves, in this order, and then stop:

1. **Name it.** *That is a legal question.*
2. **Say what is true about the record here.** Nobody has checked it for their country.
3. **Route it.** Their lawyer, and (if the answer has a clock on it) before the date passes,
   not after.

⛔ Then **do not fill the silence.** Do not offer a partial answer as consolation, do not
describe what the answer might depend on as though that were nearly the answer, and do not
volunteer what another country does. Offer the thing this tool *can* do instead: find the
records about their own life that are running out, and get them frozen.

---

## What it reads

Two files, and only these two:

- `jurisdictions/<code>/pack.yaml`: the machine-readable pack. `review.state`, the capability
  flags, and every field whose value is `UNANSWERED` or `unknown`.
- `jurisdictions/<code>/00_status.md`, the prose companion, which carries the per-file review
  table and the ordered question list a first reviewer would work through.

**If the two disagree about review state, report both and trust neither.** The pack says so
itself. A consumer that picks a winner has invented a review.

**If there is no directory for that code, say there is no pack for their country**, and stop.
⛔ Do not fall back to another code, do not "use Canada for now", and do not treat the engine's
own defaults as a stand-in for a pack. The engine's clocks and routes are one practitioner's
unchecked experience; presenting them as local law is the invented answer wearing a different
hat.

## What it prints, and in what words

The pack is machine vocabulary. The person gets **the law where you are**, and the honest state
of it.

| What the file records | What the person reads |
|---|---|
| `review.state: unreviewed` | Nobody has checked any of this for your country. Use it for nothing legal. |
| `review.state: partial` | Some of it has been checked. The rest has not, and here is which. |
| `review.state: reviewed` | Checked by someone practising where you are, and it is still not advice. |
| any field `UNANSWERED` | **nobody has checked this for your country. Ask your lawyer.** |
| any field `unknown` | Same sentence. `unknown` is not a soft `no`, and it is not a small `yes`. |
| a capability flag `false` | That part is switched off for you, and this is why. |

Print the unanswered questions **as questions**, in the order `00_status.md` puts them, because
that order is what closes the biggest hazard first rather than what is easiest. A person taking
this list to a lawyer has done something genuinely useful with the hour: the list is worth
having precisely because it is empty. It tells them what to ask.

⚠️ **Say the count of unanswered fields only if it was counted from the file.** Never from this
document, never from memory, never from a previous session. A prose count of a contract is a
defect this project has already shipped.

---

## Review state comes from the file. Never from the file existing.

**Structure is not coverage.** A directory exists, the numbered files exist, `pack.yaml` parses.
and none of that is a review. A skeleton with every answer blank is not partial coverage; it is
none, and it looks more complete than a blank page precisely because someone did the work of
laying out the questions.

Read `review.state` and read it every time. ⛔ Never infer it, never cache it across a session,
and never let a filled-in-looking file imply it. `jurisdictions/README.md`'s coverage table is
the single source of truth for what this project claims, and **no output of this command may
assert a broader state than that table does.**

## ⚠️ Canada is the most misleading state in the project

Not the best-covered. The most misleading, and it is the opposite of how it reads.

The practitioner experience behind the method documents and behind the engine's own default
hazard wording is Canadian, and almost none of it says so. So the corpus reads as though it
belongs to nowhere in particular while carrying unmarked Canadian assumptions, and a reader
cannot tell which sentences those are. The Canadian pack is where those assumptions were meant
to be checked. **It has checked none of them.**

Two consequences to say out loud rather than let a reader infer:

- **A Canadian reader gets no more assurance than anyone else.** That text was written from
  Canadian practice is not a review. Unreviewed is unreviewed.
- **A reader outside Canada is at more risk than they look**, because the hazard wording uses
  terms of art that may not describe their paperwork at all, so it reads as if it does. The
  question underneath still applies to them; the vocabulary does not.

⛔ So when the code is `ca`, do not soften anything. Being the source jurisdiction buys the
reader nothing and saying otherwise is the over-claim ADR `0005` exists to prevent.

---

## `--scaffold <code>`

Copies `jurisdictions/_template/` to `jurisdictions/<code>/` **and stops.**

- **Only if the target does not exist.** An existing pack is never overwritten, merged, or
  "refreshed", someone's review may be in it.
- **Only inside `jurisdictions/`.** Nothing else is created or touched.
- **Nothing is filled in.** Not the obvious fields, not the country name, not the legal system,
  not the language. Every cell stays as the template left it, which is `UNANSWERED`.
- **The copy is the end of the job.** Report the path and the number of files copied, counted
  from the copy rather than stated, and say plainly that the pack is now a question list awaiting
  a practitioner where the reader lives.

This is a **contributor** action against a checkout, not something a person under accusation
runs, and it is the only thing this command writes anywhere. The copy command itself is the one
already documented in `jurisdictions/README.md`; use that, so there is one form of it rather
than two.

⛔ **An agent may build a pack skeleton. An agent may never answer a question in one.** Filling
a cell is not a smaller version of scaffolding. It is the thing this whole layer exists to
prevent, and a plausible invented answer is worse than an empty one because the reader will act
on it and cannot tell that nobody checked.

---

## What this command must never become

- **A summariser of law.** No "in short", no "the gist", no worked example, no illustrative
  scenario. An example is an answer with deniability.
- **A router to another jurisdiction.** Similar systems diverge in exactly the places that
  matter: what binds a private holder, how long they keep it, what a condition reaches.
- **A source of a retention figure.** Every clock the engine shows is *typical, verify with the
  holder*, and whether even that holds where the reader lives is an unanswered pack question.
- **A judge of anything.** It reports a record's state. It never rates a pack, ranks
  jurisdictions, scores coverage, or tells anyone how much this can help them.
- **A place where outcome language creeps in.** What happens next is not this tool's to say. The
  promise is an intact record, not a result.
