# Jurisdiction pack template

Copy this directory to a country code and fill it in.

```sh
cp -r jurisdictions/_template jurisdictions/<iso-3166-1-alpha-2>
```

Lowercase, two letters: `ca`, `de`, `br`, `gb`, `au`. Sub-national goes one level down (`ca/on/`, `us/tx/`, `de/by/`) and only when an answer genuinely differs at that level. Say which level each answer is good at in `00_status.md`.

---

## The one rule that matters more than the rest

**⛔ Do not guess. Do not let a model fill a cell. Do not infer from a neighbouring country.**

`UNANSWERED` is a correct, useful, shippable value. It tells the next reader exactly what to ask a lawyer. A plausible invented answer is a defect, because a frightened person will act on it and the page gives them no way to tell the two apart.

Every cell needs a practitioner in that jurisdiction. That was the rule from the first sketch of this layer (*"every cell needs a lawyer's sign-off; none may be inferred"*) and ADR `0005` gives it teeth.

## Fill order

Not arbitrary. This order gets the safety-critical part right first and the marketing part last.

| # | File | Why here |
|---|---|---|
| 1 | `00_status.md` | Fill this **first**, saying "nothing reviewed". A pack without it is not a pack |
| 2 | `01_hazard_wording.md` | 🔴 Safety-critical. Runs before any evidence advice. Wrong here is how someone breaches a condition while trying to help themselves |
| 3 | `07_examiner_line.md` | Decides what the project may offer as a button at all in your jurisdiction |
| 4 | `05_entitlements.md` | The safest capture path. Often makes a demand unnecessary |
| 5 | `04_retention.md` | Sets the clock, which sets the action order |
| 6 | `03_demands.md` | Only useful once you know what arrives without a demand |
| 7 | `02_barred_reasoning.md` | Gates the classifier. Engine already refuses the whole class; this narrows to local law |
| 8 | `06_advertising.md` | Last, because it constrains words rather than actions |

Keep `pack.yaml` in step as you go. It is the file a consumer reads to decide whether the pack may be used at all.

## Hard rules

**⛔ Never cite a real matter.** Published authority and public statute only. No case you are working on, no client, no counsel, no file or docket number, no date window, no charge combination.

⚠️ **A set of statute sections is a fingerprint even with no name, no date and no event attached.** Anyone holding the paperwork recognises the combination. The fix is to cite only what the doctrine requires (never the combination belonging to a real matter) not to redact it afterwards.

**⛔ No absolute dates.** `../../ops/casefact_gate.sh` matches `YYYY-MM-DD` in strict mode with no exemption path. Use durations (*"30 days from receipt"*), relative phrasing, or an amendment name. A statute's in-force date is the one awkward case: cite it by public citation or amendment title.

**⛔ No outcome language** (RAIL 7). Banned in every pack, in every language: *acquit, cleared, exonerate, vindicate, win, beat the charge, prove your innocence*, and their local equivalents. State what the law is. Never what will happen.

**⛔ No counterparty surface** (RAIL 2). A pack never describes how to obtain a record about another person, and never uses the vocabulary of following a person. Own account, own device, own export, own premises record obtained with the holder's consent, RAIL 5.

**⛔ Do not write out a barred argument in order to describe it** (RAIL 3). Name the class. `02_barred_reasoning.md` says more.

**Role, never name.** `00_status.md` records a reviewer as *"criminal defence counsel, 10+ years, practising in <jurisdiction>"*. No name, no firm, no initials. Anonymity here protects the reviewer as much as the project, and it fails permanently on the first mistake.

## Before you open a pull request

```sh
./ops/casefact_gate.sh --profile legal                  # from the workspace root
python3 -c "import yaml; yaml.safe_load(open('jurisdictions/<code>/pack.yaml'))"
```

⚠️ **A green gate is not an identity check.** It matches *classes* of identifier, not values, a real surname walks straight past it. Read your own diff for names before you push.

You do not need an account here, an identity, or permission. Pseudonymous contribution is the norm, ADR `0003`. `../../CONTRIBUTING.md` has the sign-off mechanics.

## What does **not** belong in a pack

The engine. Custody, hashing, manifests, classification, adversarial audit, deliverable assembly, the harm-first doctrine, the retention *race* as a method, all of that is jurisdiction-neutral and lives in `../../docs/methods/`. If you find a jurisdiction-dependent statement in a method document, mark it there with an inline `⚖️ **[JURISDICTION]** →` pointer to the pack file that owns the answer. Do not move the paragraph, and do not fork the document.
