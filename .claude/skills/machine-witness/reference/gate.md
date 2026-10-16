# gate, the case-fact gate, over repository and publication inputs only

🔴 **This command checks material going INTO this repository or OUT to the public. Nothing
else.** Not a folder of somebody's evidence. Not a package bound for their lawyer. Not a file
they are about to hand to an examiner. Those contain matter facts *by design*, and this gate
exists to reject matter facts, so pointing it at one has exactly two outcomes, both bad: it
rejects every useful package, or somebody quietly relaxes it until it proves nothing about
anything. **A package going to counsel is verified by a different tool**: the handoff verifier,
named at the bottom of this file, and the two must never be collapsed into one.

**Purpose:** run the structural case-fact gate over what this repository would publish, and
report the class names, the counts, and how many files were actually scanned.

**Backed by:** `ops/casefact_gate.sh` · `ops/ci_casefact.sh` · `ops/check_contracts.py` ·
`ops/policy_exempt.re`

**Rails in force:** 1 · 2 · 7

---

## 🔴 Two gates, and they are not variants of each other

They ask opposite questions, and that is why one tool cannot serve both.

| | This gate | The handoff verifier |
|---|---|---|
| Subject | source, documentation, generated trees, published copy | one person's evidence package |
| Matter facts | ⛔ a failure, always | 🔴 the entire contents |
| A real name in the input | must fail | must be *there*, and must reach only the recipient |
| Question asked | *would publishing this leak a real matter?* | *is this complete, sealed, and going to the right person, with their say-so?* |
| Failure means | fix the content before it is committed | do not send it yet |
| Arrives | now | with `handoff`, a later version |

The first version of this plan pointed one gate at *"anything about to leave"* and that single
phrase covered both columns. Read it charitably and you get a gate that rejects a lawful,
necessary, correctly-assembled package because it contains the name of the person it is about.
Read it as anyone in a hurry actually would and you get a gate with its teeth pulled, still
printing green, now protecting neither column.

⚠️ **So if the thing in front of you is a person's own material, this is the wrong command.**
Say so plainly, say which tool owns it, and stop. ⛔ Do not run this gate over it "just to see",
and do not run it with a class switched off. Both are the same mistake wearing different
clothes.

---

## What it runs

Three checks, in this order, because each one can invalidate the reading of the next:

```
./ops/casefact_gate.sh --tracked --profile legal
./ops/ci_casefact.sh
python3 ops/check_contracts.py
```

- **`--tracked`** scans what the repository would publish, and only that. Untracked and ignored
  paths cannot reach a remote, so failing on them is noise, and noise is what teaches people to
  ignore a gate, which is the failure mode that ends with the gate switched off.
  ⚠️ **It reads the staged index, not the working tree.** An edit that has not been added is
  invisible to it, so a clean run over a dirty tree has told you nothing about the edit you just
  made. Stage first, then gate.
- **`--profile legal`** downgrades exactly three subject-matter classes to notes: statute
  sections, reported-decision citations, and the case style. In a legal-domain repository those
  are the *subject*, and at full strictness they bury the handful of real hits under a hundred
  legitimate ones. ⛔ The profile does not touch the identifier, personal, temporal,
  case-workspace or filename classes, and it never touches the real-value list.
- **`check_contracts.py`** is a different question, a relative path that resolves to nothing.
  That matters here because the dangling path that produced the check named an internal directory
  that is never published, so the broken link advertised the existence and the name of a private
  tree.

## Read the count. It is the only thing that separates a real pass from a vacuous one.

**A gate that scans nothing prints the same green as a clean tree.** So the first thing to report
is not the verdict, it is `tracked files: N`, and `scanned N document(s)`, and whether either is
plausible for the tree in front of you.

This is not a hypothetical worry, and it is not somebody else's mistake:

- The dot-path guard matched a root dot-**file** as well as a dot-**directory**, so the gate
  aborted with an error on *every* run the moment a repository had a `.gitignore`, which is
  every repository.
- The wrapper written to report the gate ran it with the failure suppressed and looked only for
  a failure marker. An aborted run has no failure marker. So it printed *clean*, exited zero,
  and a repository sat with green continuous integration **while nothing had been read at all.**

Both are fixed. The lesson is not: the exit code alone is not a result. Require the success
marker, fail on any abort, and **read the number.** If it is missing, or zero, or smaller than
the tree, the run is a failure regardless of what it printed.

⚠️ **A negative check is the easiest one in this repository to fool**, for a reason that has
nothing to do with this gate in particular: *not found* and *nothing read* are the same output.
Prove the input is non-empty before judging it, and abort the section otherwise.

## ⛔ The structural classes cannot catch a proper name

Plant a real surname in a tracked file and this gate prints a pass. That is verified, not
suspected, and it has happened in this project's own history with a real person's surname sitting
in a file the whole time the gate reported clean.

The classes match *shapes*: a docket-shaped number, a badge-shaped number, an address, an
absolute date, a full-length digest, a case-workspace path. A name has no shape. The missing half
is a list of the real values from an actual matter, which by design lives **outside every
repository**, is supplied at run time, and **is unwritten.** Writing it is the owner's, not an
agent's.

```
MW_DENYLIST=<a path outside every repository> ./ops/casefact_gate.sh --tracked --profile legal
```

⛔ **So never describe a green gate as a clean tree**, and never let a report imply it. The
honest sentence is: *the structural classes found nothing, the real-value list was not supplied,
and a name would not have been caught.* The gate prints that warning itself, every run it is not
given the list. Relay it rather than trimming it. It is the most load-bearing line in the
output.

⚠️ **A combination is a fingerprint even when no single element is.** A fixture with no name, no
date and no place can still identify a matter through the *set* of statute sections in it, to
anyone holding the paperwork. The fix for that is an unrelated fact pattern, never a redaction of
a real one, and no regex can tell the two apart, which is why one class here is a note that
makes a human look rather than a failure.

---

## ⛔ Never offer to weaken it

Not a class switched off, not a file exempted, not a profile widened, not a narrower path so the
run comes back green. **If a hit is real, fix the content.** Generalise the value to a
placeholder (`<SOURCE>`, `<DEVICE>`, `<WINDOW>`, `<PARTY>`, `<COUNTERPARTY>`, `<PLATFORM>`) or
delete the sentence. If a sentence only works with the real value in it, the sentence is wrong
for this repository.

If a hit is genuinely a false positive, the fix is a **scoped exception with a comment saying why
it is scoped**, in the gate itself, reviewed as a change to the gate. ⛔ Never by exempting the
file that tripped, and never by widening a pattern until it stops matching. Two properties tell
you an exception is honest rather than a hole: it names the paths it covers one by one instead of
describing their shape, and it has a compensating control that would catch abuse. An exception
described more narrowly in its comment than it is in its pattern is this project's recurring
defect, and it has shipped twice.

**Three outcomes, not two.** Some checks no available credential can reach. Failing them poisons
the result; passing them is a lie. Report them as a distinct *unverifiable* count, list them, and
say that green means *N checks ran*. Not that the state is clean.

---

## The handoff verifier, a separate tool, named here so nobody reaches for this one

Arriving with `handoff` in a later version. It asks the questions this gate structurally cannot,
because its input is the thing this gate is built to reject:

- **Recipient.** Who exactly is receiving it, and is that the person the sender named?
- **Scope.** Is the package what was agreed, without the material that was excluded?
- **Completeness.** Is every item in the record of what went in actually present, and is
  everything present actually in that record?
- **Sealing.** Is it encrypted in transit and at rest, and does the recipient hold what they need
  to open it without anything secret travelling beside it?
- **Adverse material.** Is what cuts against the person in there, first, in the same detail as
  what helps? A one-sided package is worse than none: the first thing opposing counsel does is
  find the part that was left out.
- **Authorisation.** Did a human say *send this*, in as many words, for this package and this
  recipient? Nothing goes anywhere on a tool's own initiative. A package cannot be un-sent.

⛔ **Until that tool exists, there is no verified handoff.** Say that rather than substituting
this gate, and do not assemble one by hand and call it checked.
