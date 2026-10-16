# POLICY_EXEMPT for this repository. Read by ops/casefact_gate.sh.
#
# One extended regex on the first non-comment, non-blank line. Paths are matched as
# repo-relative fragments against absolute target paths, so each entry starts with /.
#
# WHAT THIS EXEMPTS: the VOCABULARY and OUTCOME-PROMISE classes only, for files that
# *define* a prohibition, a rail cannot ban a word without writing it.
#
# ⛔ WHAT IT CANNOT EXEMPT, EVER: the identifier, personal, temporal, hash, workspace-path
# and filename classes. Those have no legitimate use in any file, exempted or not. An ISO
# date fails in every file listed below. The script enforces this; the list cannot widen it.
#
# ⚠️ This list is deliberately SHORTER than the working workspace's. Two reasons, and the
# second is the one that matters:
#
#   1. Most of those paths do not exist here.
#   2. The list used to be hardcoded inside casefact_gate.sh, which meant every vendored
#      copy (including this one, bound for a public repository) carried the names of
#      never-published internal directories. A path fragment in a regex is not a claim, but
#      a public file naming a private tree is the same leak class as a dangling relative
#      path, and this script is the one file guaranteed to be in every repository.
#
# Entries, each with the reason it stops being checked:
#   /legal/advertising_rules.md. IS the claims policy; it must list the banned words
#   /docs/methods/06_, /08_. Harm-first + capture hazards enumerate what is barred
#   /docs/triage/, the plain-reading path renders the exclusion list and the
#                                  contract's `never:` prohibitions in prose. ⚠️ The contract
#                                  itself is no longer here: ADR 0007 moves it to
#                                  skill/data/tree.yaml, which is checked at full strictness
#                                  and needs no exemption, verified, it trips no class.
#   /docs/adr/0002-, /0003-, the ADRs that state the refusals
#   /.gitignore, names the classes of file that must never be committed
#
# ⛔ NOT exempted, deliberately: /jurisdictions/, /CONTRIBUTING.md and /README.md. Each
# quotes the banned outcome words in order to forbid them, and each produces a NOTE that
# stays visible. Exempting them would drop the count while nothing improved. A jurisdiction
# pack is the one place a contributor might paste real outcome language into a legal claim,
# so it is the last place to stop looking, and the README is outward-facing copy whose
# lawyer review has never run. NOTES are for a human to read, not a number to minimise.
(/ops/casefact_gate\.sh|/ops/policy_exempt\.re|/\.gitignore|/legal/advertising_rules\.md|/docs/adr/000[23]-|/docs/methods/(06|08)_|/docs/triage/)
