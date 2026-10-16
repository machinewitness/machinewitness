# freeze, copy it, digest both sides, leave the original alone

**Purpose:** take a source the person is entitled to, copy it without changing the original,
digest it, and write a record beside the copies that a lawyer or a licensed examiner can check
later without installing anything of ours.

**Backed by:** `docs/methods/02_chain_of_custody.md` ·
`docs/methods/09_filesystem_and_hash_traps.md`

**Rails in force:** 5 · 6 · 9 · 10 · 2

**Runs:** `skill/scripts/freeze.py`: Python 3 standard library, offline, no install step.

```
python3 <install>/scripts/freeze.py <source> --into <their folder> [--name <short name>]
python3 <install>/scripts/freeze.py <source> --excluded-class
```

The two folders it writes into are the two the walk-through already made inside the person's own
folder. ⛔ Their names are read from the engine's own constant and are never retyped anywhere.
one reader opened their folder, found the internal word for the record sitting in it, and read it
as their children being taken. A folder listing is a screen, and it is the one screen that cannot
be taken back once it is on somebody's disk.

## 🔴 It will not read anything until `capture-audit` has been answered for that source

This command **calls the go-ahead check itself**, before its first listing and before anything
at all is created in the person's folder. Not a declaration in this file. An in-process call, so
it cannot be forgotten between two lines of code. See
[reference/capture-audit.md](capture-audit.md).

So the order is: run `capture-audit audit` for **that exact source** and the `freeze` operation,
then run this. With nothing on file it stops and says so, and ⛔ **the refusal is relayed verbatim
and the read is not performed by hand.** A read performed by hand is the same read.

⚠️ A go-ahead is good for half an hour and is bound to one source, one operation and one folder.
A go-ahead to `freeze` one source is not a go-ahead to `freeze` another, and it is not a go-ahead
to `verify` anything.

---

## What to say, and in what order

1. **Read the refusal at the top of the output aloud, first, before anything else.** It is
   printed before a single byte is read, and it is the same rule for every person who ever runs
   this. Do not soften it and do not attach it to anything about *this* person's situation.
2. **Relay the counts verbatim.** Every number in the output is derived from what the run
   actually did. ⛔ Never type one of your own, never round one, and never say "all of them" in
   place of the number, the number is the only thing that separates a real result from one that
   read nothing.
3. **Relay the two check commands.** They use the platform's own digest tool. If checking our
   work needs our software, our work is worth much less to anybody.
4. **Relay what it does not establish**, unprompted, in the same detail as the rest.

## What it refuses, and why each refusal is a refusal rather than a warning

| It refuses | Because |
|---|---|
| **A source that may hold an excluded class** | See below. Reads nothing at all |
| A source it cannot fully read | A set with holes that says nothing about the holes is worse than no set |
| A source with no plain files in it | An empty read produces a digest that means *nothing was read*, and it looks identical to a clean result |
| A folder for the case that does not exist yet | Where a person's case files live is a screen with a warning and a confirmation on it. That belongs to the walk-through, not to this |
| A set name that already exists | Writing over a frozen set destroys the only thing it was for |
| A case folder sitting inside the source | It would copy its own output into its own input |
| A source that is one of the copies it made earlier | A copy of a copy is a second, different-looking version of the same thing |
| Anything that is not a plain file or a folder of them | Some of them never finish being read. A tool that hangs looks broken rather than careful |
| A write that would land outside the person's own folder | Asserted in code on every write, never left to a permission bit. A memory stick carries no meaningful ownership bits, so a guard built out of them stops existing the moment the folder is copied onto one, and nobody notices it left |

## ⛔ The excluded class, total refusal, and it is stricter than the written rule

On `--excluded-class` the program performs **no filesystem call whatsoever** against the named
path. No copy, no listing, no preview, no digest, no measurement, and not even a test of whether
the path is there. It prints the refusal, prints the route, and exits.

**The written rule says *freeze the container unopened*, and that operation does not exist.**
Copying a container reads its bytes, digesting it digests those bytes, and the content class
cannot be established without either inspecting content or trusting a classification that is
incomplete by construction. The person is frightened and does not know everything in their own
archive. So the default is total refusal. ⚠️ It is a **default, not a resolution**: the
contradiction is recorded as an owner decision taken with counsel in `AGENTS.md` section 7, and
nothing in this wave closes it.

The route is the whole point of the refusal. Tell their lawyer the source exists, where it is,
and that it was left untouched; the lawyer arranges a **licensed examiner**. That is not a slower
version of this tool. It is the correct one.

⛔ **The refusal must read as the same rule for every person, never as a guess about this one.**
The framing phrase comes from the engine's own constant so the two cannot drift. A reader who had
volunteered nothing of the kind met this rule and read it as the program announcing what it had
decided they had done.

⚠️ And say the honest part rather than hiding it: nothing can tell what is inside a file without
reading it, so this stop rests on what the person said. Being wrong in the refusing direction
costs a delay. Being wrong in the other direction costs more than this tool can undo.

## The traps this is actually built against

Not cryptography. Every one of these has cost real time somewhere, and the first four all produce
a **false failure**, which is worse than no check at all, because the first red digest a
frightened person sees, they panic, and the second thing they do is try to *fix* the frozen set,
which is the one unrecoverable move.

- 🔴 **Digest files, never variables.** The shell form is `sha256("$(cat f)")`: command
  substitution strips trailing newlines, so a byte-identical file reports a mismatch. The
  equivalents are reading a file as text and then encoding it, opening it in text mode so the
  platform translates line endings, and stripping a byte-order mark because it looks like noise.
  Every digest here is taken over a file handle opened in binary mode, in blocks, with nothing
  in between.
- ⛔ **Normalise nothing silently.** Not a line ending, not a byte-order mark, not a unicode
  filename. Two filesystems disagree about how to store an accent, so the same name can exist as
  two different byte sequences, and a name-form failure is indistinguishable from tampering to
  anybody who does not know about it. The form of every name is **recorded**, never applied, and
  a name the machine spelled differently when it wrote the copy is reported as a spelling
  difference with the words *this is not a sign that anything was altered* beside it.
- **The origin is digested in one pass and the copy in another**, over separate file handles, by
  the same function. A copier that also reports on the copy is the tool grading its own work, and
  *N files transferred, 0 skipped* has never been evidence of anything.
- **The plain copy is deliberate.** The convenience copy helpers preserve permissions, resource
  forks and extended attributes on some platforms, translate them on others, and synthesise
  companion files where the target filesystem cannot hold them, so a hundred-file set arrives as
  two hundred and the count stops matching.
- **The metadata that a copy destroys is captured before the copy**, including the times, the
  permissions, the owner and group, and how many names point at the same content. Most of it does
  not survive a copy onto a memory stick, which is exactly what a person hands a lawyer.
- **The operating system writes files into a folder once anything has looked at it.** Those files
  are **copied and recorded like everything else**. Leaving them out would be a selection, and
  the cheapest attack on a self-collected set is *you kept the parts that helped you*, and
  separately labelled with a count, so a later count that includes them is not mistaken for
  something added. ⛔ Never delete one out of a frozen set. Removing anything from a frozen set is
  itself a change to it.
- **The origin is listed before the read and again after it**, and the two listings are compared
  on kind, size, permissions and modification time. That is what turns *we only read it* from a
  claim into a checkable fact.
- ⚠️ **Reading a file can update the time it was last opened, and nothing can prevent that.** So
  the claim made is the one that is true: same entries, same sizes, same permissions, same
  modification times. The last-opened time is recorded as it was **before** the read, so the
  change to it is visible rather than quietly excluded.
- **Nothing is ever deleted, and nothing is ever moved.** Every step is additive. A half-finished
  operation that deletes is how a person loses the only copy they had.

## What lands in the person's folder

Under the copies folder, one directory per set holding the byte-exact copies. Beside it, three
files named after the set:

- a plain-text one they can read, which says in words what was copied, what did not change, what
  was left exactly as found, and what none of it establishes;
- a one-line-per-file checklist in the format the platform's own digest tool checks;
- the full detail for a program, including the per-file digests, the sizes, the pre-copy
  metadata, the name forms, and the outcome profile at the moment of freezing.

**One digest stands for the whole set:** the digest of the checklist file. Anybody can work it
out again with the platform's own tool, which is the point. It is reproducible by somebody who
has never heard of this project.

⛔ **A frozen set is corrected by adding a dated note beside it, never by editing it.** Correcting
a typo inside one changes its digest, and a changed digest on a frozen set is indistinguishable
from somebody tampering with it. The plain-text record says so where the person will read it.

## What this does not establish

It says the bytes are the bytes. It says nothing about what they mean, nothing about whether they
help, and nothing about what happened. It cannot show when something was deleted, who was holding
a device, or what anybody meant. **Say that unprompted.** A verification result is not a strength
claim and must never be relayed as one.
