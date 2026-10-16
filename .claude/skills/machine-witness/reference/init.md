# init, the one human surface

**Purpose:** hand the person to the engine, print what it prints, and pass their answer back.
That is the whole job.

**Backed by:** the engine at `skill/scripts/triage.py`, which walks `skill/data/tree.yaml` ·
ADR `docs/adr/0007-one-repo-agent-first.md`

**Rails in force:** 1 (matter facts live in the person's own folder, never in this repository) ·
2 · 3 · 5 · 9 · 10 · 11. `RAIL_MATRIX.md` is the only statement of what is actually enforced.

---

## 🔴 This file is a relay. It owns nothing.

Not the order of the questions. Not their wording. Not which one comes next. Not where the
files go. Not what is refused. Not the state. **All of it belongs to the engine**, and this file
exists only to move text in one direction and one answer back in the other.

⛔ **Do not write this flow as prose, and do not follow it from prose.** That was tried and it
failed: a probabilistic reader given the flow as a document showed the stop list before the
question that establishes whether anything restricts the person at all, collapsed eleven
per-record questions into one invented list, dropped four of them, invented five kinds of record
that do not exist, and labelled a screen with a range of node names while rendering only the
first one. Every one of those defects is invisible to a walkthrough: the flow runs, the screens
look right, a plan comes out, and four questions were never asked.

So the fix is structural rather than a warning. The engine is deterministic, offline, and the
only thing that reads or writes the state; this file names **no** node, encodes **no** branch,
and quotes **no** screen text. If it named a node it would have started making a decision the
engine owns, and a test asserts it does not.

---

## The loop

Start:

```
python3 .claude/skills/machine-witness/scripts/triage.py begin
```

Print exactly what it prints. Then, for every turn after that:

```
python3 .claude/skills/machine-witness/scripts/triage.py answer "<their reply, exactly as they gave it>" --workspace <their folder>
```

Print exactly what that prints. Repeat until the engine stops asking.

That is the entire protocol. **One screen out, one answer in.** The engine tells the person what
it accepts at the bottom of every screen, validates their reply against that list, and rejects
anything outside it. A rejection is not a failure to relay around. Print it and let them answer
again.

If the engine refuses something, **relay the refusal verbatim and stop.** Do not work around it,
do not soften it, do not retry it a different way, and do not do the step by hand.

### Where the session has an interactive question tool, use it

The screen's option list is a closed set and the engine prints the exact line to type, which works
with nothing but a terminal. But a person picking from buttons is doing less work than one
transcribing a sentence, and every mistyped answer comes back as a refusal they read as being
turned away. Rules, all of which come from the fact that the option list is the contract:

- **The options are the engine's, verbatim, in the engine's order.** Never add, drop, reorder,
  retitle, or write a friendlier label over one.
- ⛔ **Too many options for the picker → relay the engine's text instead.** One node in the
  contract offers six answers. Showing four of six, or grouping two into one, silently changes
  what was asked.
- **Acknowledgement screens and the folder screen are not pickers.** One accepts a single word,
  the other a path.
- ⛔ **Do not simulate a picker in prose** where the session has no such tool. The engine's screen
  is already complete.

### A reply that carries more than one thing

Somebody answered `yes, android` to a question that accepts one option, and got exit 2. **The
engine was right and does not change** — it accepts one of its own options and refuses to guess,
because reading a near-miss as a `yes` records an answer nobody gave.

**The flexibility is yours.** Send the one option the engine listed and keep the extra detail for
the question it actually answers. ⛔ Only where it is unambiguous: `not really` is not `no`, and a
reply that fits two options or none is a question to put back to the person. ⛔ Never retry a
rejected answer with the wording adjusted in the hope it lands.

---

## ⛔ What a relay may not do

- **Do not decide.** Not which question is next, not which is relevant, not which can be
  dropped because the person seems not to need it.
- **Do not reorder.** The order carries the safety: what may be captured cannot be discussed
  before what is forbidden has been.
- **Do not summarise.** Not the screen, not the list on it, not "the gist so far". A skimmed
  warning is an absent warning.
- **Do not skip.** Not to save the person time, not because they are distressed, not because they
  already said something that seems to answer a later question.
- **Do not paraphrase a question into friendlier words.** The wording is the contract. A nicer
  sentence is a different question, and asking a different question is a defect even when the
  answer looks the same.
- **Do not answer on their behalf**, and do not translate an unclear reply into one of the
  accepted answers. Ask them to pick one. The engine will not guess and neither should you.
- **Do not print anything the engine did not print**: no preamble, no reassurance wrapped
  around a screen, no explanation of what is coming. Say what you like in your own voice
  *between* turns; do not present it as part of the flow.

---

## 🔴 There is no argument, and there is no menu

Nothing is passed to this file. A bare invocation of the skill lands here, and the response is
to start the engine, **immediately.**

⛔ **Not a list of what this tool can do. Not a table of commands. Not "what would you like to
do?". Not a summary of capabilities first.** This is a deliberate inversion of the convention
most command-driven tools use, and the reason is the user rather than taste: a menu is a *recall*
interface, it only works for someone who already knows what they need, and **acute stress removes
recall first.** The person on the other side does not know what records exist about their own
life. Asking them to choose is asking the one question they cannot answer.

An expert who types a specific command reaches that command's own reference file, and that
routing is the dispatcher's business, not this file's. A person in trouble never has to learn
that any of it exists.

---

## 🔴 Once the folder exists, name it on every call

**This is the difference between resuming and appearing to have lost everything, and it is the
easiest thing here to get wrong.**

Partway through, the engine asks for a folder on this machine, confirms the resolved absolute
path back, and creates it. **At that moment the state file moves into the new folder.** It is no
longer where the earlier calls kept it.

So from then on the engine has to be told where to look. Two ways, and either is fine:

- pass `--workspace <the absolute path the engine confirmed>` on every call, or
- run it with the new folder as the working directory.

⚠️ **Take the path from the engine's own confirmation screen**, not from anything this file says
and not from what was proposed. The person may type a path of their own, so the folder they end
up with is frequently not the one that was suggested.

✅ **You do not have to construct that line yourself. The engine prints it.** From the moment the
folder exists, every screen ends with the whole command to run, with the real path already in it.
and the screen says so, in the person's own reading, so someone driving the engine by hand is not
left guessing either. **Relay that line as it stands**, and when the person answers, run it. A
reader who walked this flow escaped the dead end only because somebody had happened to mention the
option to them in passing; that is luck, not a design, and the engine no longer relies on it.

What happens if you get this wrong, verified rather than assumed:

- Continue **from a folder above it**, with no path named, and the engine cannot find the state.
  It says so and **asks** where the folder is. Stating first that nothing has been deleted, then
  printing the exact line to run with a slot for the path, then offering any folder it legitimately
  knows of. Relay that ask and give it the path. Nothing is lost.
- Start **again** from a folder above it, with no path named, and the engine has nothing to
  resume from, so it opens a fresh session and writes a second state file where you are standing.
  Now the person is back at the first screen, their answers appear to be gone. They are not, they
  are in their folder, and the stale file sits *above* the real one, so it wins every later
  attempt to pick up where they left off.

⛔ **So: start the engine once.** After that, continue. If it says it cannot find the folder,
that is a question to relay, never a reason to start over. The engine says the same thing on that
screen, and it is worth relaying with emphasis: starting again deletes nothing, but they would
answer every question twice, and the counter on each screen says how many that is.

**Resumability is not a nicety.** This flow is long, and the person will be interrupted.
a phone call, a visit, a panic. Being interrupted is the expected case, not the exception.

---

## The engine refuses some folders. It owns those refusals, not this list.

Before creating anything it resolves the path, following every link first, so a link into a bad
place is the same case as naming that place outright, and refuses when the folder would sit:

- inside this tool's own install folder, because the person's records are theirs and must not be
  carried off by an update or a reinstall;
- inside a project that keeps its own history of every file in it, detected by a marker in the
  folder or in any folder above it. **One ordinary command publishes everything in such a folder**.
  to a shared server, or to the open internet, with a note of who sent it and when, and none of
  that can be taken back;
- on a volume that leaves this machine, or one that a program serves rather than a disk, judged by
  what the operating system says the mount *is* and by the folders the system reserves for file
  providers. ⛔ **Never by brand name**. Brand names miss a custom sync root, a network mount, a
  link and a rename, all four of which are ordinary.

And when it cannot establish what a folder sits on, **it refuses.** Not being able to check is not
the same as it being safe: a folder that copies itself to a company server looks exactly like an
ordinary one from the inside.

⚠️ **The list above is deliberately not a count and is not the set.** A prose enumeration of a
rule set drifts out of step with the rules, silently, and that is precisely the defect that
produced *"the seven hard exclusions"* in two documents in this project long after the list had
reached fourteen. **Read the refusals from the engine.** Each one prints the path, what it found,
why it will not use it, and what to do instead, in plain words, already fit to relay.

There is deliberately no flag, no environment variable and no override that makes any of these
pass. A switch that lets the check through is a switch that ships the harm it exists to prevent.

---

## Two things the opening must not lose

1. **Both halves of the privacy truth, in the engine's own words.** The files it creates stay on
   this machine and are never uploaded, **and** what the person types to the assistant goes to
   whoever runs the assistant. Both are true at once. The engine prints both, and this is
   survivable because the flow genuinely never *needs* the facts — its own questions are about
   records and devices, and yes and no are enough. ⛔ Never claim that nothing they type leaves
   this machine. When a remote service is driving the session, that is false.
2. **The folder is confirmed as a resolved absolute path before anything is created**, at mode
   `700`, and the screen says plainly what cannot be controlled: a backup tool, a sync client or a
   search index on this machine may still reach it. ⛔ Do not upgrade that into a promise of
   safety. It is not a boundary and must never be described as one.

⛔ **Do not ask for any of it until the engine has printed the screen that says where their words
go** — the first of the two things above. That screen is the whole permission. Before it, a question
is asked in the dark and the person cannot make the decision it needs from them. After it, the
decision is theirs and the invitation is already on their screen in the engine's own words, so you
do not have to make it, and you do not repeat it if they decline.

⛔ **And whatever they say, it goes into no file unless you told them which file first.** Not a
scratch note, not a summary handed back as a recap, and nothing inside this tool's own folder. If
they ask whether something is safe to type, name it as a question for their lawyer.

---

## How it ends, and what is in the folder

The last screen is the plan, and **it is not the last thing that happens.** It prints more than one
line to run: one that shows the plan again, and one that checks what actually arrived once the
person has been out and done what they could. ⛔ **Relay every line it prints.** As above, you do
not construct any of them — the engine builds each with the real path already in it, and naming
them here would make this file a menu.

The folder holds a fixed set of entries and nothing else. ⛔ The COUNT is on the engine's own
confirmation screen, derived from the layout — do not restate it here or anywhere else; a prose
copy of a count is a defect this project has already shipped twice. Three properties of what is in
there bind you rather than the engine:

- 🔴 **One file is the person's own account, empty, and written once.** The stop list tells them to
  write down what they remember immediately and never improve it, and the engine makes the place
  for it and then never writes to it again. ⛔ Do not read it, summarise it, quote it, tidy it, or
  put any part of it into a prompt. Do not offer to. If they ask you to, say plainly that it is
  theirs and that putting it through an assistant sends it to whoever runs the assistant.
- **One file is the list as something they can print and carry.** Several of the errands happen in
  a building with no computer in it. It is rewritten whenever an answer changes the plan.
- **One folder per record they said yes to**, with the absolute path printed under the step it
  belongs to. The export goes in exactly as it arrives: not renamed, not opened and saved again.
- ⛔ **The file recording what they told the engine is never read back into a prompt**, by the
  engine or by you.

**When they come back**, run the line the plan printed for it. It reports **three** outcomes and
they are not interchangeable: a folder with something in it, a folder with nothing in it yet, and a
folder it **could not read**. ⛔ Never relay the third as though it were the second — nothing was
established about what is in there, and a person deciding whether they are finished would be
deciding on an absence that was never checked.

⚠️ **An empty folder is not a failure and must not be relayed as one.** Some of these records are
genuinely not available to this person, and none of it was ever mandatory. One they tried for and
could not get is worth telling their lawyer about, including what happened when they tried.

⛔ **Then it prints the next line, and that is all it does.** It is not an explanation of the
charges, not an assessment of what they collected, and not a view on whether any of it helps them.
Explaining a charge is a legal answer, no country's law has been reviewed by a practitioner
for this tool, and the engine will not do it either.
