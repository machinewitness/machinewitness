# ADR 0009, Informed disclosure replaces prohibition

- **Status:** Accepted
- **Scope:** Whether this software may ask a person for detail about their own situation, and what has to be true before it does. Amends `../../skill/data/tree.yaml`'s `never:` list — amendment **A1** — and the opening screen the engine authors around it
- **Supersedes:** nothing. Three entries of one list are deleted and two are added in their place; every other prohibition in that list stands untouched
- **Does not decide:** whether `report` or `classify` gets built. This record removes the doctrine that made them impossible in principle; building them is a wave, a method document and a `../../RAIL_MATRIX.md` row. It does **not** relax RAIL 1 — nothing from a real matter enters this repository, and that is unchanged and unchangeable. It does **not** answer a legal question, and it does not claim any jurisdiction is reviewed
- **Related:** ADR `0007` decision 7 (matter facts live in the person's own folder and nowhere else), ADR `0002` and RAIL 2 (no capability touching the other person, which this does not alter), `../../RAIL_MATRIX.md` RAIL 4 (the only rail recorded as absent, and the one this unblocks), `../../DOCTRINE.md` (the two-halves privacy statement this record makes survivable in a second way)

## Context

`tree.yaml`'s `never:` list opened with three entries:

```yaml
- ask_what_happened
- ask_who_was_involved
- ask_what_was_alleged
```

They were the first thing anyone read about this project's posture, they were restated in nine other files, and they were wrong.

**The owner ran the whole flow end to end and reported it plainly:** the tool tells the person not to say what happened, and *"thats wrong."* They should be told that their words are processed by whichever provider they chose, and then decide for themselves — *"because the skill works better if they open up."* And, on what to do about it: *"we shall remove what blocks the agent to ask for information as this is one of the sole reasons people would use this! to structure and prepare properly!"*

### What the prohibition was actually protecting, and what it cost

The risk is real and it does not go away: **a person cannot un-say something to a service somebody else runs.** When a remote model is driving the session, the words they type travel to a company's computers, and neither they nor this software controls what is kept there or for how long. That is why `S0` has always printed both halves of the privacy truth rather than the comfortable half.

But silence is the wrong instrument for that risk, for three reasons that only became visible once somebody used the thing.

🔴 **It bought ignorance, which was never the safety property.** The property is *informed choice*. A person who has been told where their words go and decides to speak is not in more danger than one who was refused a hearing; they are in the same position with more agency. The prohibition confused the hazard with the subject matter.

🔴 **It charged the one thing people come for.** A flow that may only ask about record types can only ever hand back a generic list of record types. The owner's phrase for what is wanted — *"to structure and prepare properly"* — is exactly the work that needs to know roughly what the matter is about, because that is what separates the records that matter from the ones that waste time nobody has to spare.

🔴 **It was unenforceable and therefore unfalsifiable.** "Do not ask what happened" cannot be checked against anything. A transcript can be read for whether a disclosure preceded a question; it cannot be read for whether a question was motivated by curiosity. A prohibition no test can fail is a statement of intent wearing the clothes of a rule.

### And it was standing in front of the one absent rail

`../../RAIL_MATRIX.md` records **RAIL 4, harm-first, as absent** — the only rail in that state. `tests/rails/harm-first.test.mjs` is deliberately red, and its own failure message gave the cause: *`report` is deferred with the classification step, because classifying against a claim needs the claim and the contract forbids asking what was alleged.*

So the deleted entries were not merely costing quality of advice. They made the project's own harm-first doctrine unimplementable by construction, and the test that fails because of it said so out loud on every CI run. **After this record the red is still correct and its reason is different:** `report` is unbuilt, not barred.

## Decision

**The gate moves from the question to the disclosure, and from silence to consent.** Five decisions.

### 1. The three prohibitions are deleted and two replace them

```yaml
- ask_for_detail_before_naming_who_receives_it
- write_volunteered_detail_where_the_person_was_not_told_it_lands
```

Both are **checkable against a transcript**, which is the whole point. The first asks whether the disclosure screen came before the question. The second asks whether a file appeared that nobody was told about. Neither requires anyone to establish a motive.

### 2. `S0` names who receives the words before any invitation to speak

The engine's opening screen already stated that the words travel over the internet to the company whose computers run the assistant — *not to the police, not to a court, not to an employer, not to anybody involved.* That paragraph is now load-bearing rather than merely honest: **the invitation is placed after it and may not be moved in front of it.**

⛔ **It hands the decision over rather than making it.** It asks for nothing on that screen, it says the list can be built out of yes and no alone, and it says that if they would rather not, the offer is dropped and not repeated.

### 3. Whether something is safe to type is a legal question, and routes to counsel

`S0` states a fact about identity — *I am not your lawyer and this is not a conversation with your lawyer* — and then routes the rest. ⛔ It does **not** state what protection a conversation with a lawyer carries, because that is jurisdiction-dependent, zero packs are reviewed, and an invented answer is a defect a frightened person will act on.

### 4. Nothing volunteered is written where the person was not told it lands

This is the second new prohibition and it binds the assistant, not only the engine. No scratch note, no summary handed back as a recap, and ⛔ nothing at all inside this repository — RAIL 1 is untouched and tightens rather than relaxes here, because there is now a class of detail that exists in a session and must never reach a tracked file.

The one file that accumulates matter detail is written by the engine, read by the engine, and never placed in a prompt. The one file that is the person's own account of events is created empty, written once by them, and ⛔ never read by anything.

### 5. RAIL 2 is not touched, and the one edge it does have is stated

**No capability touching the other person is added, and none becomes possible.** No messaging, no lookup, no location, no profile check — those are absent from the allowlist, structurally, and this record adds nothing to it.

⚠️ **What does change is that a counterparty's name can now enter the session and therefore a provider's logs**, where before that was structurally impossible because nobody was ever asked. That is a real consequence and it is why decision 4 exists in the form it does. It is not a RAIL 2 breach: RAIL 2 governs *capabilities that reach a third party*, and reading a name a person chose to type is not one.

## Consequences

**Good.**

- The one thing the tool was built to do — help somebody structure and prepare — becomes possible instead of being refused on principle.
- Two unfalsifiable prohibitions become two checkable ones.
- The doctrine blocking RAIL 4 is gone. `report` and `classify` become a question of work rather than of permission.
- The privacy statement gets stronger, not weaker: it now has to be printed *before* anything is asked, which makes it structural rather than courteous.

**Bad, and accepted.**

- 🔴 **A person may tell a remote service something they later wish they had not.** That was always possible — nothing ever stopped somebody typing it unprompted — but this record makes it likelier by inviting it. The mitigation is that the invitation cannot precede the disclosure, and that the disclosure names the recipient in plain words rather than gesturing at "whoever runs me". A reader of the earlier wording asked *"Who is that? A company? The police? My employer?"*, which is the question the current wording answers.
- ⚠️ **Nine files restated the deleted prohibition in prose**, and every one of them had to be found and rewritten. That is this project's recurring defect — a prose copy of a contract value — arriving in the place where it costs most, and it is recorded here as the reason the copies were rewritten in their own voice rather than to a template.
- ⚠️ **`MW_DENYLIST` becomes more consequential and is still unwritten.** Nothing volunteered goes into a tracked file, so the gate's blindness to a real person's name is not newly breached — but the volume of matter detail passing through a session goes up, and the structural gate cannot catch a proper name. That is an owner action and lives outside every repository.

**Rejected.**

- ⛔ **Keeping the prohibitions and documenting a workaround.** A rule that everyone is told to route around is worse than no rule: it trains readers to treat the whole list as advisory, and that list also contains the entries that stop this software becoming the instrument of a fresh offence.
- ⛔ **Asking first and disclosing after.** The disclosure is only a disclosure if it precedes the decision. Reversed, it is a notification.
- ⛔ **A local-model-only mode, so the claim could be absolute.** Considered and rejected in `../../DOCTRINE.md` for the same reason: it would exclude nearly everyone this exists for, in exchange for a purity that helps nobody in a cell.
