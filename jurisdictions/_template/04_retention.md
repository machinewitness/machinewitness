# 04: Retention

How long each record class typically survives here, and where each figure came from.

> **Review state: ⛔ UNREVIEWED.** Until `00_status.md` says otherwise, the engine shows its own default clocks, flagged as unverified.

Engine side of this: `../../docs/methods/03_retention_race.md`. The *race* is universal. The *numbers* are local, and are currently **unsourced and unverified everywhere, including Canada.**

---

## Two rules on every figure

**⛔ A figure with no source is a defect, not a draft.** Delete it rather than ship it. An unsourced number in a document like this reads as an assurance, and the person reading it is deciding what to do today.

**⛔ Never present a retention period as fact.** RAIL 7, and `tree.yaml` → `never: present_a_retention_period_as_fact`. Every figure is *typical, verify with the holder*. A holder's actual setting is whatever their administrator configured, which is frequently not their published policy and sometimes shorter.

⚠️ **Under-promise, never over-promise.** If a range is 14–30 days, plan on 14. A person who acts on the optimistic end of a range and loses the record has lost it permanently.

---

## Entries

Layer IDs match `../../skill/data/tree.yaml` phase 2, so a consumer can join on them.

| Layer | `tree.yaml` id | Typical window | Source | Region varies? | Verified with a holder? |
|---|---|---|---|---|---|
| Wearable telemetry | L1 | UNANSWERED |   | | ⛔ no |
| Phone OS usage log | L2 | UNANSWERED |   | | ⛔ no |
| Computer power / session log | L3 | UNANSWERED |   | | ⛔ no |
| Chat archive | L4 | UNANSWERED |   | | ⛔ no |
| Platform record, booking, order, ride, ticket | L5 | UNANSWERED |   | | ⛔ no |
| **Premises record, door fobs, cameras** | L6 | UNANSWERED |   | | ⛔ no |
| Financial | L7 | UNANSWERED |   | | ⛔ no |
| Travel | L8 | UNANSWERED |   | | ⛔ no |
| Media metadata | L9 | UNANSWERED |   | | ⛔ no |
| Independent medical | L10 | UNANSWERED |   | | ⛔ no |

🔴 **L6 is the one to get right.** It is routinely the most perishable record that exists and the one nobody thinks of in time. `tree.yaml` already flags it RED with *"if nothing else gets done today, do this."* A wrong figure here is the difference between a record existing and not.

🔴 **L10 expires from the person's own body** and is the only layer that does. Hours, not days. Whatever the local answer, the action is *see a clinician today*.

## What drives retention here

| Driver | Answer |
|---|---|
| Statutory minimum retention, by sector | UNANSWERED |
| Statutory **maximum**: data-protection deletion duties | UNANSWERED |
| Sector regulators that set a period | UNANSWERED |
| Anything that suspends the clock once a request is received | UNANSWERED |

⚠️ **A deletion duty and a retention duty pull opposite ways**, and a data-protection regime with a strict minimisation rule can make a record *more* perishable, not less. Note where that happens.

## Sources

Public, citable, and re-checkable by the next reader.

| # | Source | Covers | Type |
|---|---|---|---|
|   |   |   | statute / regulator guidance / published policy / operator confirmation |

⛔ **Not acceptable as a source:** a figure from a matter you worked on, an unattributed number, a model's answer, or another jurisdiction's pack.

## Local notes

Practical gaps between policy and practice, the fixed-size loop that overwrites earlier than the stated period, the operator whose retention depends on which system recorded it, the export link that expires faster than the underlying data.

- none recorded yet

---

## Reviewer sign-off

| | |
|---|---|
| Reviewer role |  |
| Scope read |   |
| Still unreviewed | everything |

Copy the result into `pack.yaml` → `retention.entries` and `capabilities.retention_figures_sourced`. **Leave that flag `false` while any entry lacks a source.**
