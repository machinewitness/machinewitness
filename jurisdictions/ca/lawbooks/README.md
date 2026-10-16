# `lawbooks/`: the slot for local reference data, and why it is empty

⛔ **Nothing is committed here, and that is a decision rather than a gap waiting to be filled.**
The directory and this file exist so the shape is decided before any content arrives. ADR
`0008` decision 7.

## Why it is empty

Four reasons, and they are cumulative. Any one of them alone would be enough.

1. **No archive is in hand.** There is nothing to commit.
2. 🔴 **The method this layer comes from carries its own licensing rail:** *never bundle, never
   commit, never redistribute; page-cite only.* Practitioner reference texts are licensed to the
   person who bought them. Committing one is redistribution, and it does not stop being
   redistribution because the repository is private today.
3. ⛔ **Whether this layer ships at all is an open decision for the owner**, not an agent's. A
   takedown notice against a pseudonymous repository is an attribution-pressure event: it
   creates a party with a reason to find out who maintains this, and a channel for asking.
4. ⚠️ **An archive in git history is permanent.** It cannot be removed without rewriting
   history, and one repository means one blast radius, so a demand aimed at this directory
   reaches everything.

## What goes here when something does

```
lawbooks/
  <name>.tar.zst        the archive. ONE file, compressed
  MANIFEST.sha256       one `<digest>  <member>` line per member, PLAIN TEXT
  README.md             this file, updated to say what arrived and under what terms
```

**`MANIFEST.sha256` is the load-bearing part, not the archive.** It is plain text, so the
case-fact gate reads it, the runtime denylist scan reads it, and a reviewer can establish that
the bytes are the bytes somebody signed off. It is verified with `shasum -c` and nothing else is
needed to check it.

## 🔴 The gate cannot read an archive, and now says so

Every class in the case-fact gate scans with `grep -I`, which **skips non-text files**, and so
does the runtime denylist scan, which is the one check built specifically to catch a real
person's name. So an archive here is outside every check.

The gate no longer prints the same green over it as over an empty tree. It **enumerates
archives, lists them by path, counts them, and reports them as UNVERIFIABLE**, without changing
its exit code. Three outcomes, not two: verified, failed, and unverifiable.

⛔ **Read that count.** A pass means *N text files were read*. It has never meant *the tree is
clean*, and over an archive it cannot.

## How a tool reaches this directory

⚠️ **Not by resolving a path relative to itself.** An installed skill tree sits somewhere with no
route back up to this repository, so a tool that assumed one would work for whoever wrote it and
fail for every installed user.

A tool in this jurisdiction's own directory under `../../../skill/scripts/jurisdiction/` therefore
takes the path to this directory **as an argument** and verifies what it finds against
`MANIFEST.sha256` before reading a byte of it. ADR `0008` decision 7. ⚠️ No such tool exists yet,
which is why that directory is not cited here as a full path: the contract checker fails on a
cited path that does not exist, and it is right to.

## ⛔ And what a tool here may never do with it

Quote a source, with the source named. Report a page or a section. Report that it found nothing.

Never answer a legal question, never infer one, and never fill an `UNANSWERED` field in the pack
beside this directory. **A hit is a pointer to be verified against the licensed copy, never an
answer.** Every answer in this pack reads `UNANSWERED` and no practitioner has reviewed any of
them, so there is nothing here for a tool to be confident about.
