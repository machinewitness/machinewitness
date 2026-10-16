# verify, re-check a frozen set, and count the three outcomes separately

**Purpose:** re-digest everything the record lists and report **verified**,
**mismatched** and **not checkable** as three distinct counts, each one listed, each one
with the most likely cause in plain words.

**Backed by:** `docs/methods/02_chain_of_custody.md` ·
`docs/methods/09_filesystem_and_hash_traps.md`

**Rails in force:** 3 · 9 · 10 · 4

**Runs:** `skill/scripts/verify.py`: Python 3 standard library, offline, no install step.

```
python3 <install>/scripts/verify.py --into <their folder>
python3 <install>/scripts/verify.py --into <their folder> --name <set>
python3 <install>/scripts/verify.py --record <a record's own path>
```

With no `--name` it checks every set in the folder and says how many it found. It also says
how many files in that folder it **passed over** and why. Other things live there
legitimately, and treating an unrecognised file as a set would be reporting on something it
does not understand.

**It creates nothing.** Not a folder, not a file, not a note, not a permission change. It has
no capability to alter anything and the declaration says so, because a checker that can write
is a checker that can be blamed for a change.

## 🔴 It will not read anything until `capture-audit` has been answered for the `verify` operation

This command **calls the go-ahead check itself**, before it decides which sets exist, working
that out is already a read of files in the person's folder. Not a declaration in this file: an
in-process call. See [reference/capture-audit.md](capture-audit.md).

**What the go-ahead is bound to here is the thing this command was pointed at**: the folder with
`--into`, or the record's own path with `--record`. That is what it is about to read, and it is
the path the refusal names back to the person.

⚠️ **Stated plainly rather than glossed:** one go-ahead for `--into <their folder>` covers every
set in that folder, because reading every set in that folder is what the command was asked to do.
It does not cover a different folder, a different record, or the `freeze` operation, all three
are refused. ⛔ If it refuses, relay the refusal verbatim and stop.

---

## 🔴 Three outcomes, not two

| Outcome | Means |
|---|---|
| **verified** | opened, digested, and the digest is the one recorded |
| **mismatched** | opened, digested, and the digest is **not** the one recorded |
| **not checkable** | no available permission, device or path could reach it at all |

The third is why this exists in the shape it does. Folding it into failure poisons the result
permanently, every later run inherits a red that has nothing to do with the evidence, and a
check that is always red gets switched off in the first week. Folding it into success is a
lie. So it is counted on its own, every item in it is listed with the reason, and the summary
says outright that green means N files were opened rather than that the set is clean.

Two further counts, kept separate because they are findings about different things:

- **in the folder, not in the record**. The count tripwire. The operating system writes files
  into a folder once anything has looked at it, and copying onto a memory stick creates
  companion files. ⛔ **Never delete one.** Removing anything from a frozen set is itself a
  change to it, and afterwards nobody can tell the tidy-up from tampering.
- **defects in the record itself**. The checklist beside the set no longer matching its own
  recorded digest, or the record and the checklist disagreeing about an entry. Established
  **first**, because every other answer was measured against them.

## 🔴 A green must say how many files it actually checked

A verifier that reads nothing finds no mismatch and prints exactly the same green as a
verifier over a clean set. **That has happened in this project**: inside the wrapper written
to report that very failure, over an already-published repository with green continuous
integration.

So relay the count, verbatim, every time. ⛔ Never say "all of them" in place of the number,
never round it, and never type one of your own. Every number in the output is derived from
what the run did.

## Same answer as last time, not everything green

The record carries the outcome profile from the moment of freezing, and this compares against
it entry for entry. **A check that demands perfection gets switched off in the first week; a
check that demands the same answer as last time keeps working for ever.** A mature set will
have known, harmless not-checkable entries, and the point is that the *profile* has not moved.

⛔ A record carrying no profile at all is treated as **not the same answer**, not as a pass.
With nothing to compare against, "the same as last time" cannot be established, and a green
that quietly means *there was no last time* is the vacuous pass this whole command is written
against.

## What the exit code means

| Code | Meaning |
|---|---|
| 0 | every file opened matched, and the answer is the same as at freezing. **The count is the claim** |
| 2 | an argument this will not interpret |
| 3 | it cannot run at all, so it refuses rather than reporting. Nothing was read |
| 5 | something mismatched, or the record itself has a defect |
| 6 | nothing mismatched, and the answer is not the same as last time. Neither a pass nor a failure |

## 🔴 When this goes red, the likeliest cause is the record, not the evidence

Measured, not assumed. A read-only differential pass across roughly thirty records in a mature
set found **zero changed evidence files.** Every single failure was a defect in the record's
own format, an unrecorded path base, a record referring to itself, a living document filed
inside a frozen one, source-side absolute paths, a filename spelled in a different unicode
form, a free-text trailer, line terminators of the wrong kind.

So every finding carries the most likely cause in plain words, and **the words matter more
than the code.** A person's first reaction to a red digest is panic and their second is to try
to *fix* the frozen set, which is the one unrecoverable move.

⛔ **Relay the cause with the finding, never the finding alone.** Never leave "somebody
tampered with my evidence" as the reading a frightened person takes away, and never suggest
editing or tidying a frozen set. A frozen set is corrected by adding a dated note beside it.

⚠️ **A name spelled a different way is not a mismatch.** Two filesystems disagree about how to
store an accent, so the same name can exist as two different byte sequences. Where the contents
match but the spelling on disk differs, this reports **verified** with the difference named and
the words *this is not a sign that anything was altered* beside it. A name-form failure is
indistinguishable from tampering to anybody who has not met it before, which is exactly why it
is called out rather than smoothed over.

## The independent check, which is the one that counts

The checklist beside each set is in the format the **platform's own digest tool** reads. Run it
from inside the copies folder and it checks every file at once, with nothing of ours installed:

```
shasum -a 256 -c ../../<the record folder>/<set>.sha256
```

And one digest stands for the whole set, the digest of that checklist file, worked out with
the same tool. **If verifying our work required our software, our work would be worth much
less to anybody.** Relay both commands.

⛔ The digest routine here is written out separately from the one in the command that made the
copies, deliberately. **A tool is not a witness to its own output.**

## What this does not establish

It says the bytes are the bytes. It says nothing about what they mean, nothing about whether
they help, and nothing about what happened. **It is not a score and it is not a strength**, and
the output must never be relayed as one. What any of it is worth is for a lawyer to judge.
