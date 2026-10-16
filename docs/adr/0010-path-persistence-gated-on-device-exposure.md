# ADR 0010, Path persistence is gated on device exposure, not on a preference

- **Status:** Accepted
- **Scope:** Whether this tool writes the location of somebody's case folder anywhere outside that folder, what decides it, and what the screen that used to ask about it does instead
- **Supersedes:** ADR `0008` decision 5's treatment of the pointer as an opt-in, and `../../AGENTS.md` §8.2 rule 1, which forbade recording the case folder's path in the per-install working note. ⛔ ADR `0008` is **not** retro-edited; it records the reasoning of its moment and this record states what changed
- **Does not decide:** where a person's evidence should physically live. ⛔ That is a legal question, zero packs are reviewed, and it routes to counsel. It ships **no hidden-volume workflow** and makes no claim that removable storage of any kind is safe. The register's open decision on hidden volumes stays open
- **Related:** ADR `0007` decision 7 and RAIL 1 (matter facts stay in the person's own folder), RAIL 9 (the act of capture — and of writing — creates evidence), `../../RAIL_MATRIX.md` RAIL 5, ADR `0009` (the other amendment in this set, and the same shape of error: a protection aimed at the wrong decision)

## Context

The engine has one write outside the person's case folder: a file in their home folder listing the case folders it knows about, so a later session can offer one back instead of saying it has lost everything.

**It was an opt-in, off by default, behind a screen (`W3`) that explained the trade.** The screen was honest and its reasoning was correct: a file listing somebody's case folders is itself a record, on a device that may be examined.

**A reader ran the flow and called that screen ridiculous.** Their words: *"we want to keep a STATE for the agent at all times! meaning including the information of the folder! that is exactly what shouldnt happend!"*

They are right, and the reason is not that the hazard was imaginary.

### What the default actually produced

The engine finds its state file by looking in the working directory and then in each directory above it. A case folder is almost never above the directory somebody runs from, so **the path is the only thing that finds it.** With the pointer off — the default — losing the path means:

- the engine cannot find the session, says so, and asks where the folder is. That is the good case, and it only works if somebody still knows the path.
- 🔴 or they start again from above the folder, the engine finds nothing to resume, opens a fresh session, and writes a **second state file where they are standing.** Now they are back at the first screen believing every answer is gone — they are not, they are in the folder — and the stale file sits *above* the real one, so it wins every later attempt to pick up where they left off.

So the default outcome of a screen designed to protect somebody was a person answering thirty-odd questions twice, or concluding the tool had lost their work. **The artifact avoided was one line naming a folder. The cost paid was the session.**

### And the question was put to the wrong person

`W3` asked somebody who had met this tool four minutes ago, while frightened, to weigh a forensic trade-off about a file they had not seen, on a machine whose exposure nobody had established. That is not informed choice; it is a decision offloaded onto the person least equipped to make it, dressed up as respect for their autonomy.

**Whether the file is dangerous has one determinant: whether a device of theirs may be looked at.** Nothing about a person's preferences changes that, and it is not a matter of taste.

## Decision

**The pointer is derived from the contract's device-exposure question. The screen states what was done and no longer asks.** Five decisions.

### 1. A contract question decides it, in phase 0

Amendment `A2` added `H5`: *has anyone asked to look at your phone or computer, taken one, or shown you a warrant for one?* It sets `device_exposed` on the two affirmative answers **and on unsure**, because not knowing is not the same as knowing it will not happen.

⚠️ **It sits after the hard exclusions, not before them.** `X10` — do not consent to anyone searching or taking your phone — has to already be on screen when this is asked. Asked first, somebody who has already let a device be looked at reads it as an accusation. Asked after, it reads as the tool working out what it can safely do.

### 2. The engine reads which node decides, rather than being told

`Session.exposure_node()` walks the contract for the node whose branches set the flag. ⛔ **No node id is typed anywhere**, so an amendment that moves or renumbers the question moves this with it, and `--selftest` fails if no node sets the flag at all — otherwise every session would be treated as exposed forever and nothing would say why, which reads exactly like the feature working.

### 3. It fails towards not writing, and the asymmetry is the reason

Not-exposed requires the deciding question to have **actually been answered without setting the flag.** ⛔ The flag merely being absent does not count: that is also what a session started before `H5` existed looks like, and what the stateless surface looks like when it answers nothing.

Guessing "safe" writes a file naming a case folder onto a machine somebody may be about to examine. Guessing "exposed" costs one person one path they paste in themselves. Those are not comparable costs.

### 4. `W3` states, and it states either branch out loud

⛔ **Writing a file into somebody's home folder without telling them would be a worse version of this feature, not a better one.** RAIL 9 is about what an action *writes*, and this action writes. So the screen survives:

- **Not exposed:** it says the path has been written down, where, that the file holds the path and nothing else, and that deleting it breaks nothing.
- **Exposed:** it says nothing is going outside the folder, and that every command has to carry the path — which the engine prints in full at the bottom of every screen either way.

### 5. Where the files should live routes to counsel, and nothing more

The exposed branch says to ask a lawyer before moving anything, **including onto a memory stick, and including onto an encrypted one if somebody has told them to do that**, and that moving material once someone has a warrant is not a neutral act.

⛔ **That is the whole of it. No step, no recommendation, no hidden volume, and no claim that any of it is safe.** Whether moving material can be characterised as concealment is a legal question with zero reviewed packs. A tool that answered it would be advising a possible offence in order to feel helpful, and the person who acted on the answer would carry the consequence.

## Consequences

**Good.**

- The failure this was reported for is gone: the ordinary session keeps its own location and can be resumed.
- The forensic decision is made from the one fact that determines it, by the party that knows it, before the folder exists.
- The protection is *stronger* where it matters. It used to be off for anybody who did not opt in, including people whose devices had already been taken. Now it is off for exactly those people, whether or not they thought to ask.
- The screen still tells them what happened, in both directions, so nothing is done to their machine silently.

**Bad, and accepted.**

- 🔴 **An ordinary user now gets a file in their home folder they did not ask for.** That is a real reversal of the opt-in principle and it is the cost of this record. It is mitigated by the screen saying so, by the file holding a path and nothing else, and by deleting it being harmless — but somebody who would have declined now has to act to undo it.
- ⚠️ **The exposure answer is self-reported and unverified**, like every other answer here. Somebody who says no when the answer is yes gets the file. The engine cannot check, will not guess, and the fail-safe only covers not answering.
- ⚠️ **`H5`'s vocabulary is unreviewed**, like every other phase-0 wording site. It is registered in `meta.jurisdiction.wording_sites` and carries the same on-screen note.

**Rejected.**

- ⛔ **Keeping the opt-in and explaining the resume problem better.** The screen already explained it. A person four minutes into a tool, under accusation, cannot be expected to model a state-file search path in order to answer a yes/no question correctly.
- ⛔ **Writing the pointer silently in the safe case.** It would remove the one thing that makes this defensible under RAIL 9, to save a paragraph.
- ⛔ **Instructing an encrypted removable volume in the exposed case.** Requested in exactly those terms, and answered as a question for counsel instead. The instruction would close, by shipping, an owner decision that is recorded as open, and it would have this software advise a step that may be characterised as concealment in the one situation where a warrant already exists.
