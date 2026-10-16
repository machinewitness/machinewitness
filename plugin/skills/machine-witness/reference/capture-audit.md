# capture-audit, what the act of capture writes

**Purpose:** before a source is read, report what the reading itself will create, notify,
join, or log, and issue the permission that allows exactly that one operation on exactly
that one source.

**Backed by:** `docs/methods/08_capture_hazards.md` · `skill/scripts/capture_audit.py` ·
`docs/adr/0007-one-repo-agent-first.md`

**Rails in force:** 9 · 2 · 5 · 6

---

## 🔴 This is a precondition, not advice. And it is a gate, not a phrase.

An earlier version of this precondition was satisfied by a reference document that *said*
one existed. **A document that declares a precondition is a phrase, not a gate**, losing
that sentence is how the defect comes back, so it is written here first.

⛔ **And a note about a source is not enough either.** A hazard record on its own can be
stale, can have been copied in from another matter, can be malformed, and can have been
made up. So the permission is *bound*, and the binding is the whole mechanism.

```
python3 .claude/skills/machine-witness/scripts/capture_audit.py audit --workspace <their folder> \
    --source <what would be read> --operation <freeze|verify> \
    --arrived-as <how they came to be holding it> \
    --might-hold-intimate-media <yes|no|unsure> \
    --closed-by-your-conditions <yes|no|unsure>
```

Then, and only then, the command that reads it runs, and **it** calls the preflight before
its first read:

```
python3 .claude/skills/machine-witness/scripts/capture_audit.py check --workspace <their folder> \
    --source <what would be read> --operation <freeze|verify>
```

⛔ If it refuses, relay the refusal verbatim and stop. Do not work around it, do not
paraphrase it into something gentler, and **do not perform the read by hand.** A read
performed by hand is the same read.

---

## 🔴 Ask both absolute questions BEFORE you run it, not after it refuses

The two `--might-…` and `--closed-…` flags are questions **for the person**, and the audit
will not guess either of them in either direction. So put both to them first, in your own
words, and send the command once with all five answers in it.

⛔ **Never send a value the person did not give you.** Not `no` because it seems likely, not
`no` because the flow has been calm, not `no` to save a round trip. These are the two stops
that override the whole arrivals table, and a filled-in `no` is you answering the most
absolute question in the tool on somebody else's behalf.

If you do run it short, it refuses and names exactly which answers it lacks — that is the
backstop, not the intended path.

## The four answers

| Answer | What it means | What happens |
|---|---|---|
| **go** | Reading it creates nothing anywhere and tells nobody anything | A permission is written for that one source and that one job |
| **go-with-cost** | Reading it *does* write something. The cost is named, in plain words, and recorded beside the permission | Same, and the cost goes to the lawyer with it |
| **answer-the-questions-first** | One of the two absolute questions was never answered. ⛔ **Nothing has been decided about the thing itself** | Nothing is written down as allowed, non-zero exit, and the refusal names each missing answer |
| **do-not-touch-route-to-counsel** | It is not read at all. It goes to the lawyer exactly as it is | Nothing is written down as allowed, and the command exits non-zero |

**Say the cost out loud when it is a cost.** A `go-with-cost` that gets relayed as a plain
yes is the same failure as a limit put in a footer: the person acts on the first half.

🔴 **And never relay the third one as though it were the fourth.** They share an exit code
and they are not the same thing: one is *I am short of an answer from you*, the other is *this
does not get read.* The fourth answer exists **because the third used to be delivered as the
fourth** — a person who left a flag off was told, in the most absolute language the program
has, that their own export was material it would not handle. It had looked at nothing.

---

## What the reading writes. The four questions this exists to answer

Straight out of `docs/methods/08_capture_hazards.md`, and each one is a real thing that has
happened to somebody:

1. **Does opening it join them to something?** Some services add a person as a participant
   for opening a thread. A read becomes a **contact**, and under a no-contact condition a
   contact is potentially the offence itself.
2. **Does following the link write a present-day entry into the very third-party log their
   lawyer is about to ask for?** A link in a notice usually carries a key unique to one
   recipient. Following it is dated, attributable, and it lands in the record everyone will
   later be reading. **Keep the message; let the lawyer open it.**
3. **Does it send a read receipt?** A *seen*, a typing signal, a presence update, a
   last-active stamp, a profile-view notice. All produced by *looking*, not by doing.
4. **Does it notify anyone at all?** Including the least obvious one: **trying to fix a
   hazard is usually a fresh hazard.** Leaving a group notifies the group. Un-sharing
   notifies. Cancelling notifies the organiser and can remove them from a channel in a way
   the other side sees. The instinct to tidy up is the instinct to generate a dated,
   attributable, adverse event.

⚠️ **And a fifth, which is ours rather than theirs: displaying something can reach out.**
Merely rendering a captured notice can pull in remote pictures or resolve a tracking pixel,
from their address, today. The contract forbids that outright, `fetch_remote_content_when
_rendering_captured_material`. A "read it locally" step goes over the network unless
something explicitly stops it.

---

## 🔴 It never opens the thing it is asked about

Not to classify it, not to fingerprint it, not to measure it. The binding is the **resolved
path** and nothing else, because a fingerprint of the content would be the very read this
runs in front of, and on a source that must not be opened at all, *a quick look to identify
it* is the entire failure.

So what it goes on is **the person's own account of how they came to be holding the
thing**, matched against a table drawn from the method document. It is not an inspection and
it cannot be one: whether opening a surface joins somebody to it is a fact about a service,
not a fact about a file.

⛔ **An unanswered question never becomes a permission.** *unsure* counts as *yes*; an
arrival the table does not recognise is refused rather than guessed at; and an **absent**
answer stops the run too. A gate whose default is the permissive answer is a gate that is off
by default. This is the same rule the contract already applies to `unsure`.

⚠️ **Absent and *unsure* refuse alike but do not read alike, and this paragraph used to say
they were the same thing.** Absent arrived as the literal string `unsure`, so a missing flag
produced the excluded-class refusal — the strongest sentence in the program — about a file
nothing had examined, said to somebody who had volunteered nothing. The direction is
unchanged and absent still refuses. What changed is that the refusal now says an answer is
missing instead of describing what the person is holding.

⛔ **Every question is about their own holding of their own thing.** Not one of them can be
answered by looking anybody up, and none of them asks anything about another person. If a
question about a source can only be answered by going and finding something out, the answer
is already *do not touch*, `docs/methods/08_capture_hazards.md` is explicit that
**researching can create the liability**, and that our own output is a knowledge vector.

---

## The five checks the dispatcher makes, before the first read

In this order, and it names the one that failed:

| # | Check | The failure it catches |
|---|---|---|
| 1 | **Shape**, the record parses, and its own version is the one this tool writes | Malformed, truncated, hand-written, or written by a different build |
| 2 | **Contract**, it was made against the contract this install actually holds | The questions changed underneath it, so the answers may no longer stand |
| 3 | **Folder**, it was made for this folder, and this folder is one of ours | ⭐ **Copied in from another matter.** The single likeliest way a stale permission travels |
| 4 | **Bound to this exact source and this exact operation** | A permission for something else, or for a different job on the same thing. Neither covers this |
| 5 | **Freshness**, recent enough that the answers behind it still mean something | A permission obtained hours ago, when the situation was different |

**Freshness is judged on the bound record, after step 4 rather than before it.** A stale
permission for a *different* source is the wrong complaint, and a refusal that names the
wrong reason sends somebody to fix the wrong thing.

Two details worth knowing when you relay a refusal:

- **A permission is good for half an hour.** Short on purpose: the answers behind it are
  about a live situation, not a fact about a file. A condition can be varied, a new order
  can arrive, and a person can learn something between one hour and the next. Re-running the
  audit costs seconds.
- **A record stamped later than now is refused, not rounded down.** A clock that has moved
  is not a source anybody should act on.

### ⛔ The dispatcher imports the preflight. It does not shell out to it.

A child process is a capability that has to be declared, and an in-process call cannot be
forgotten between two lines of code. `permission_or_refuse(workspace, source, operation)` is
the one entry point, it returns the bound permission, and it raises otherwise.

---

## What this establishes, and what it does not

**It does not establish anything against somebody who sets out to defeat it.** The
permission sits in the person's own folder and they own every byte of it. Say so rather than
implying a strength it does not have.

**What it does establish** is the absence of the four things that actually happen: a
permission that was never obtained, one obtained for something else, one obtained long
enough ago that the answers may have changed, and one carried over from a different folder.
And it stops an assistant pressing on regardless, which is the failure this project can
least afford, because the assistant is the part that is fluent, confident, and wrong.

---

## ⛔ A clean answer here is not a permission to proceed

Two questions, not one. *What would reading this write?* and *is this path open to this
person at all?* This command answers the first. The hazard gate already answered the second,
and **its answer stands.**

If the person's own earlier answers closed this path, the audit refuses on that ground and
names it. The list of shut paths and the reason for each is already in their folder; it goes
to the lawyer, and this command does not reopen anything.

The same holds for the two absolute stops, which are checked before anything else and in
this order:

1. **If it might hold intimate or sexual material, nothing is read.** No copy, no listing,
   no preview, no seal, no *"just check whether"*, the refusal is total, which is stricter
   than *freeze the container unopened*, because copying a container reads its bytes and
   sealing one reads them again. That contradiction is doctrine and it is the owner's, with
   counsel; the stricter reading is the default while it stands, and a default is not a
   resolution.
2. **If it is somebody else's device, account, or cloud, it is not theirs to obtain.** Own
   machine, own account, the file a service handed them. Everything else routes through the
   lawyer to somebody qualified.

---

## ✅ The corollary, which is easy to miss and matters to the tone

**Reading their own already-captured files is not contact**, and the rails must not
over-block. A record showing an application was never opened across a window is positive
evidence of *not doing something*, from a subsystem with no stake in the outcome, and it is
exactly the kind of thing nobody thinks to keep.

It is the **live** surfaces that are dangerous. Say the difference plainly, or a frightened
person concludes that everything is forbidden and stops preserving while the clock runs.

---

## What this command never does

- **It never opens, previews, lists, measures, or seals the thing it is asked about.**
- **It never asks anything about another person**, and there is no version of it that does.
- **It never says whether something was, is, or would be a breach.** It sorts a read into
  allowed, allowed-at-a-cost, or refused, and hands the rest to the lawyer.
- **It never produces a verdict, a total, a ranking, or a prediction**: not here and not
  anywhere downstream.
- **It never offers to tidy anything up.** Leaving, un-sharing, cancelling and removing all
  notify, and the contract forbids offering any of them.

**Honest standing:** `RAIL_MATRIX.md` at the repository root is the only statement of what
is actually enforced, and nothing here may claim more.
