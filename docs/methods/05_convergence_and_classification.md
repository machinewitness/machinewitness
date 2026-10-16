# 05: Convergence and classification

The engine. Takes a **claim** and a **corpus** and produces a per-layer classification. It never produces a conclusion (root `CLAUDE.md` RAIL 3).

---

## The three labels. Only three.

For each claim × each layer:

- **CONSISTENT**: the layer fits the claim.
- **IN TENSION**, the layer and the claim do not sit together comfortably. *Not* "the claim is false."
- **SILENT**, the layer has nothing to say. Absent, out of window, or structurally incapable of recording the thing.

**SILENT is a real, first-class, honourable answer and must be reported as loudly as the others.** Most of a mature corpus is SILENT for most claims. Hiding SILENT layers to make a report look strong is the failure mode that destroys the product's credibility, and the one an opposing lawyer finds first.

A layer that is HR-blind for a period is SILENT for that period, not CONSISTENT. A layer whose coverage stops an hour before the claimed window is SILENT. Write it down.

## Convergence: why four layers beats one layer four times

A single layer is arguable. The device was off, someone else held it, the sensor drifts. What is very hard to attack is **several layers, from independent subsystems, agreeing.** In practice the powerful shape looked like this:

> A claimed act inside a window, with: a continuous multi-stage sleep session across it; a physiological metric at rest for its duration; zero movement recorded **by two separate devices**; and no interaction with the device at all.

Four independent records, four different failure modes, all pointing the same way. That is the product's flagship output.

**Independence is the whole game, and it must be computed, not assumed:**
- Two signals from the **same device** are not independent. One off-wrist event kills both.
- Two signals from the **same vendor cloud** share a sync failure mode.
- A derived metric and its input are not independent.

Emit an explicit **independence graph**: signal → device → subsystem → vendor. **Never claim convergence across signals sharing a node.** A convergence claim resting on one device dressed up as four data points is exactly the over-claim that gets a report dismantled.

## Millisecond cross-confirmation
The strongest corroboration seen in practice was **two different subsystems on the same device recording the same event ~191 ms apart.** Independent implementations, independent storage, same instant. Extremely hard to explain as coincidence or fabrication.

Look for these deliberately: a media-store change alongside a usage-log event; a file-system timestamp alongside an app-lifecycle event; a network log alongside a UI event. **But hold the honest limit:** it proves an *action occurred at an instant*. It proves nothing about **content** and nothing about **who performed it**. Including whether the user was acting freely. Both of those live in testimony, not in the log.

## ⭐ Auto-classify SILENT only. Never the other two.

The harness that worked **deliberately refused to decide** anything but absence:

- **Zero data in the window → `SILENT`, automatically.** Safe, mechanical, unambiguous.
- **Any data-bearing layer → `REVIEW`, for a human.** Never auto-labelled.

The reason is that `CONSISTENT` vs `IN TENSION` depends entirely on **what was alleged**, and one telemetry window can face four different claims (a message, a call, an approach, an automated invitation) each of which the same data answers differently. Software that guesses which one is being tested will be confidently wrong in a way nobody catches, because the label looks authoritative.

This is RAIL 3 implemented rather than promised: the machine finds absence and organises evidence; a human supplies the claim and the meaning.

## No number travels naked

**Print the layer's limits with the data, on every run, at the API boundary**. Not in the report template, not in a footer, not in review. If a value can be obtained from the engine without its limits attached, then sooner or later it will appear somewhere without them, and by then nobody remembers it came from a wearable that was off the wrist for half the window.

Make the limits a required field of the return type, not a convention.

## The evidence-strength ladder

Rank layers honestly when presenting them, strongest first:

1. **An independent third-party record**: someone else's system, no stake in the outcome.
2. **Body-worn or on-device telemetry**: the user's, so attackable, but contemporaneous and dense.
3. **"There is no record of it on my device"**: genuinely useful and only **moderate**. It proves a device shows nothing, which is weaker than it feels and is often the layer users over-rely on.
4. **Denial**, not evidence, and it belongs to the user's account, not to ours.

Never present rung 3 with the confidence of rung 1. The gap between them is where over-claiming lives.

## The DEFUSER, a first-class output class

Not every useful finding supports the user's account. Some exist purely to **remove an inference the other side would otherwise draw for free**. Showing that a physiological spike was a logged brisk walk rather than a struggle, or that a system event at a contested instant fires benignly all week (`07`).

A defuser proves nothing affirmative and is often the most valuable thing in the corpus, because it closes a door rather than opening one. **Give it its own output class**, so it does not get filed as a weak `CONSISTENT` and so nobody is tempted to inflate it into one.

## Discipline on claim intake
- **Never audit the user's own casual estimates against the device record.** A person's offhand "I think I got up around eight" in an old chat message has no evidentiary status. Testing it against telemetry and reporting the mismatch *manufactures an inconsistency that did not exist in the case*, and hands the other side something they never had. Classify against the **opposing claim**, and against nothing else.
- **A claim must be specific to be classifiable.** Vague claims get **SILENT**, not a guess.
- **Absence of the user's own evidence is not adverse.** A sparse layer is sparse. It is not a finding against them.

## Product shape
`app/timeline/`: deterministic. Same corpus + same claim = byte-identical output. Structured, machine-readable classification objects carrying: claim ref, layer, `source_device`, coverage window, label, the honest limit, the independence node, and the underlying data citation (set ID + hash, per `02`). Rendering is a separate concern (`10`). No natural-language generation inside the engine.
