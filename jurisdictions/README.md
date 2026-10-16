# ⚖️ Jurisdictions, the law is local

**The engine in this project transfers everywhere. The legal layer does not.**

Everything about capturing a record, freezing it, hashing it, and classifying it against a claim is the same in every country. Everything about what you are *allowed* to do, what your conditions forbid, which arguments are barred, whether a preservation demand binds anyone, and what a record holder must give you, changes at every border, and changes over time inside each one.

This directory is that second half. One directory per jurisdiction. **Nothing here is reviewed yet.**

---

## Coverage

| Jurisdiction | Pack | Practitioner review | Safe to rely on |
|---|---|---|---|
| 🇨🇦 Canada | [`ca/`](ca/): skeleton, questions only | ⛔ none | **No** |
| Everywhere else |   |   | **No.** The engine works; the legal layer does not exist for you yet |

**Zero packs are complete. Zero packs have been reviewed by a practitioner.** That is the honest state and it is the first thing on this page deliberately.

### What "not safe to rely on" means in practice

It does not mean the project is useless to you. It means the split is:

| Use it for | Do not use it for |
|---|---|
Understanding **which records exist** about your own life, and **how fast each one dies** | Deciding whether an action breaches your conditions |
| Preserving your own device and account data **before** it is overwritten | Working out what you are entitled to demand from a record holder |
| Handing an organised, hashed, harm-first set of files to a lawyer | Anything a lawyer would otherwise tell you |

**Get a lawyer.** This project preserves the record; it does not advise you. That is not a disclaimer, it is the design, see `../HONEST_LIMITS.md`.

---

## ⚠️ If there is no pack for your country, assume the text was written from Canadian experience

The method documents in `../docs/methods/` barely name any jurisdiction. **That absence is not neutrality.** The practitioner experience behind them is Canadian, so an unmarked legal assumption is most likely a Canadian one, and you cannot tell from the page which sentences those are.

The place this bites hardest is the hazard gate in `../skill/data/tree.yaml`, which runs before any evidence advice. It asks about a *"release or bail condition, undertaking"*, Canadian terms of art. If those words do not describe anything you have been given, **the question still applies to you**; the vocabulary does not. Read it as: *any order, condition, or directive restricting what you may do or where you may go.*

Reasoning of record: ADR [`0005`](../docs/adr/0005-jurisdiction-layer-primary-axis.md).

---

## Add your country

You do not need permission, an account, or an identity. Pseudonymous contribution is the norm here, ADR [`0003`](../docs/adr/0003-free-open-anonymous.md).

```sh
cp -r jurisdictions/_template jurisdictions/<iso-3166-1-alpha-2>
```

Then fill it in, leaving `00_status.md` honest about what is still unreviewed. Full instructions: [`_template/README.md`](_template/README.md).

**Two rules, both hard:**

1. **⛔ Do not guess, and do not let a model fill a cell.** Every answer needs a practitioner in that jurisdiction. An unanswered question marked `UNANSWERED` is useful. It tells the next person what to ask. A plausible-sounding invented answer is worse than an empty one, because a reader will act on it.
2. **⛔ Never cite a real matter.** No case you are working on, no client, no charge combination, no file number, no date window. Published authority and public statute only. `../ops/casefact_gate.sh` enforces the structural classes; it cannot catch a name, so do not write one.

Sub-national splits are expected, criminal procedure, premises-record practice and data-protection regimes often differ by province, state or Land. Use `ca/on/`, `us/ca/`, `de/by/` under the country directory, and say in `00_status.md` which level an answer is good at.

## What is in a pack

| File | Owns | Why it is jurisdiction-bound |
|---|---|---|
| `00_status.md` | Review state, reviewer in role terms, what is still unreviewed | The pack is unusable without it |
| `01_hazard_wording.md` | Phase-0 hazard wording. 🔴 **Safety-critical** | "Undertaking", "release condition" are terms of art, not descriptions |
| `02_barred_reasoning.md` | Which lines of argument are barred by law here | Each system bars a different set, or none |
| `03_demands.md` | Preservation-demand routes, templates, and whether they bind | A demand with no teeth is a different tool |
| `04_retention.md` | Retention estimates, each one sourced | Region-varying, and currently unsourced everywhere |
| `05_entitlements.md` | Subject-access and disclosure routes to your own data | Entirely a creature of local law |
| `06_advertising.md` | Claims rules for legal-adjacent services | Binds every outward-facing word, RAIL 7 |
| `07_examiner_line.md` | Where own-device recovery becomes examiner-only | Determines what this project may offer as a button |

`pack.yaml` carries the same facts machine-readably, for a consumer that needs to know whether a pack may be used at all.

## What is *not* in a pack

The engine. Do not copy method content in here, and do not fork a method document per jurisdiction. If a method document contains a jurisdiction-dependent statement, it carries an inline `⚖️ **[JURISDICTION]** →` pointer to the pack file that owns the answer, and the document keeps the transferable principle. ADR `0005`, decision 2.
