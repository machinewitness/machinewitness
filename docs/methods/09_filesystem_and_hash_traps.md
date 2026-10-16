# 09: Filesystem and hash traps

**The operating system contaminates evidence sets without being asked, and every contamination looks like tampering.** These are small, boring, technical, and each one has cost real time. They are the reason `app/custody/` must be written carefully rather than quickly.

---

## The traps

**1. The OS writes files into your frozen directory.**
Simply *viewing* a directory in a desktop file manager can create per-directory metadata files inside it. Found in practice: several such files sitting inside frozen evidence sets, pushing the file count one above the manifest, which reads exactly like tampering.

**Rules:** never open a frozen set in a graphical file manager. Filter OS-generated artifacts by name pattern *before* generating any manifest. And once a set is frozen, **do not delete the intruders**. Deleting from a frozen set is itself a mutation. Document them in a dated note beside the set. (`02`)

**2. Cross-filesystem copies synthesise files.**
Copying to FAT/exFAT (i.e. most USB sticks) creates companion files to carry extended attributes the target filesystem cannot store. Your 100-file set arrives as 200 files.

**3. Unicode filename normalisation silently breaks manifests.**
macOS and other systems disagree on how to normalise accented and non-Latin characters in filenames. The same name can be stored as two different byte sequences. A copy across filesystems can shift the encoding, so a **path lookup fails or a manifest entry mismatches while the file content is byte-identical.**

This is the most dangerous trap in the list because **a name-drift failure is indistinguishable from tampering to anyone who does not know about it.** Handle it: normalise consistently at manifest time, record which form you used, and baseline the known-benign failures (`02`, differential verification).

**4. Enumeration races the OS.**
Building a file list, then hashing, then writing the manifest as separate steps lets the system change the directory mid-flight. **List, hash, and write in one pass.**

**5. Copy tools carry invisible payloads.**
Some copy utilities preserve permissions, symlinks, resource forks, and extended attributes; some do not; some translate them. Any of these changes what you are hashing or how many files exist. **Use a plain, configured copy and verify with an independent hasher.** Never trust one tool to both copy and confirm.

**6. Heavy I/O to encrypted removable media can take the machine down.**
Sustained writes through a userspace-filesystem layer to an encrypted USB volume kernel-panicked a Mac in practice. The source survived because the operation was **copy-only**. Nothing had been deleted yet.

**Consequences, and they are architectural:** stage work on internal storage and treat removable encrypted media as **transport, not a working volume**. Throttle. Never auto-resume a heavy transfer after a crash without re-verifying. And **never structure a workflow so that a crash mid-operation can lose the only copy**. Every migration is additive until a final, separately-gated deletion step.

**7. Deletion is not deletion.**
Secure-overwrite utilities do not exist or do not work as expected on modern filesystems; full-disk encryption is the real eraser. Copy-on-write snapshots and automated backups retain data long after a file is "deleted." **Never tell a user data is gone from a machine without accounting for snapshots and backups.**

---

## The three-gate rule for any irreversible step
Learned designing a migration. Delete the source **only** when all three hold:

- **A**, the destination copy is hash-verified against the differential baseline;
- **B**, an independent, separately verified backup exists;
- **C**, a real end-to-end session against the destination has succeeded.

Any gate fails → do not delete. **Everything before the final gate is additive.** Bake this into any product operation that removes, moves, or overwrites user evidence, and put it in front of the user in those terms.

## Product shape
`app/custody/` owns all of this: artifact filtering, normalisation policy, single-pass manifesting, differential verification, additive-until-gated transfers, and a `doctor` command that detects each trap by name and explains it in plain language. **When it finds a mismatch it must say "this is probably a filename-encoding difference, not tampering, here is how to confirm"**, because the user's first reaction to a red hash will otherwise be panic, and their second will be to try to fix the frozen set.
