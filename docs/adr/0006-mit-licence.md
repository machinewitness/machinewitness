# ADR 0006: MIT for everything

- **Status:** Accepted
- **Supersedes:** the licensing decision only, ADR `0003` decision 2 (AGPL-3.0 for code, CC BY-SA 4.0 for documentation)
- **Leaves intact:** everything else in ADR `0003`: free forever, no accounts, no telemetry, anonymous maintainership, offline-capable. RAIL 11 is unchanged in substance
- **Decided by:** the owner, explicitly, overriding the recommendation recorded below

## Context

ADR `0003` chose copyleft (AGPL-3.0 for code, CC BY-SA 4.0 for the method documentation) for one stated reason: *"it prevents the predictable outcome where a vendor takes the custody kernel, closes it, attaches a subscription, and sells it back to accused people."*

The owner has directed a single permissive licence across the whole project instead: **free and open source, MIT, everywhere, forever.**

## Decision

**MIT for everything.** One licence, one file, no split between code and documentation.

1. **`LICENSE` carries the verbatim MIT text.** Not a summary, not a statement of intent. ADR `0003` was right that a paraphrased licence looks binding while granting nothing, and MIT is short enough that there is no excuse for shipping an approximation of it.
2. **No second licence file.** The MIT grant covers *"this software and associated documentation files"* by its own wording, so the method corpus, the ADRs, the triage contract and the jurisdiction packs are all covered by the same text. `LICENSE-docs` is not created; the requirement is withdrawn, not deferred.
3. **Copyright holder is `Machine Witness contributors`.** No individual is named. MIT requires the notice to be retained downstream, so the holder line is the one string that propagates everywhere. It must never become a person's name.
4. **Contribution stays DCO, not a CLA.** Unchanged from ADR `0003`. A CLA needs a legal identity; the DCO does not, and MIT does not change that calculation.

## Consequences

**What is given up, stated plainly rather than glossed:**

- **Anyone may take this, close it, and sell it.** A vendor can wrap the custody kernel in a paid product, add an account system, and market it to accused people, with no obligation to publish their changes and no obligation to contribute anything back. That is the specific scenario ADR `0003` rejected, and MIT permits it. **This is now an accepted cost, not an oversight.**
- **A fork can strip the refusals.** Nothing in MIT prevents someone removing the harm-first requirement, adding a case score, or bolting on a counterparty feature. The rails bind this project; they do not bind a fork. The mitigation is reputational and documentary (`MANIFESTO.md` and the ADRs make the removals visible to anyone comparing) not legal.
- **The method corpus loses share-alike.** Under CC BY-SA a downstream jurisdiction pack or adaptation had to stay open. Under MIT it does not. Given that the jurisdiction layer is the part most likely to be adapted and least likely to be contributed back, this is where the loss actually lands.

**What is gained:**

- **Adoption with no friction.** A defence firm's IT department, a legal-aid clinic, or a developer at a company can use, embed, and modify this without a licence review. AGPL is a blocker in exactly those places, and they are the distribution surface.
- **One file, one answer.** A single short licence a non-lawyer can read is a better fit for a project whose audience includes frightened people and whose maintainers are anonymous. Two licences with a code/docs boundary invited a question nobody could answer cleanly: which one covers `tree.yaml`?
- **The warranty disclaimer is load-bearing here.** MIT's all-caps no-warranty clause is not boilerplate for this project. Output is a preserved record used in a legal matter, RAIL 3 refuses to draw conclusions from it, and RAIL 7 refuses to promise anything. An explicit disclaimer of fitness for a particular purpose aligns the licence with the doctrine.
- **It matches the promise as the owner states it.** "Free and open source, forever" without a reciprocity condition attached.

## Rejected alternatives

- **Keep AGPL-3.0 + CC BY-SA 4.0.** The recommendation of ADR `0003`. Overridden. The reasoning against closed resale is still sound and is recorded above as the accepted cost.
- **MIT for code, CC BY-SA 4.0 for docs.** Preserves share-alike where the value is densest, and reintroduces exactly the code/docs boundary question that makes a two-licence project awkward. Rejected as inconsistent with "everything is MIT".
- **Apache-2.0.** A patent grant and a NOTICE mechanism this project has no use for, in exchange for a longer text. MIT is the simpler instance of the same permission.

## Enforcement

- **`LICENSE` is verbatim MIT in every repository.** A repository shipping a paraphrase, or an SPDX identifier that disagrees with its own `LICENSE` file, is a defect.
- **`SPDX-License-Identifier: MIT`** where a header is used at all.
- **No individual's name in the copyright line, ever.** It propagates into every downstream copy by the terms of the licence itself, which makes it the single worst place in the tree for an identifier. RAIL 1.
- **ADR `0003` is not edited.** Its copyleft reasoning stands as the reasoning of its moment. This record supersedes the decision; it does not rewrite the argument.
- **Permissive licensing changes nothing about the rails.** RAIL 11's substance (no price, no tier, no account, no telemetry, works offline) is untouched. Only the word *copyleft* is withdrawn.
