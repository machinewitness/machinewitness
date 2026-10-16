#!/usr/bin/env bash
# casefact_gate.sh: enforce RAIL 1 (case-fact gate) + RAIL 2/7 vocabulary bans.
#
# ADR 0007 collapses the project into ONE repository, so this stops being a vendored copy and
# becomes the only one. Until the cutover lands, treat divergence from the tree this was lifted
# from as something to reconcile deliberately, not silently: two divergent copies of a shared
# tool is a defect this project has already observed once, where the two copies disagreed about
# which was authoritative. The divergence introduced here is scoped and commented at its site.
# the generated provider trees .claude/ and .codex/ are product in this shape and are scanned.
#
# WHY THIS IS STRUCTURAL, NOT A WORD LIST:
#   The lesson that produced this gate is that a name-only scrub is not a scrub. A badge
#   number, a division name, a street address and a distinctive charge combination all
#   walked past a grep that only looked for names. So this gate matches CLASSES of
#   identifier, which catches values nobody thought to add to a list.
#
# WHY NO REAL VALUES ARE COMMITTED HERE:
#   A committed denylist of real names/addresses/numbers would import into this repo exactly
#   the leak the gate exists to prevent. Real values are supplied at RUNTIME from a file
#   OUTSIDE this repo:
#       MW_DENYLIST=/path/outside/repo/denylist.txt ./ops/casefact_gate.sh
#   See DENYLIST.example.txt. Never commit the real file. Never place it inside this repo.
#
# Usage:  ./ops/casefact_gate.sh [path ...]     (default: repo root)
# Exit:   0 = clean · 1 = violations found · 2 = usage/error

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---- --profile legal ----------------------------------------------------------------
# In a LEGAL-DOMAIN repository, statute sections, reported-decision citations and the
# Crown-versus-accused case style are the SUBJECT MATTER, not case facts. Left at strict they
# produce ~140 legitimate hits in a criminal-law reference tree, which buries the handful of
# real ones, and a gate that reddens on everything gets switched off, which is the same
# lesson that made the vocabulary classes NOTES.
#
# The profile downgrades exactly three classes to NOTE. It does NOT touch the identifier,
# personal, temporal, hash, workspace-path or filename classes, and it does not touch the
# runtime denylist, the denylist is what turns *this* matter's sections into a hard failure,
# which is precisely the distinction the regex cannot make.
# --tracked scans ONLY what git would publish. Untracked and gitignored paths (staging/,
# a local books/ tree, a scratch dir) cannot reach a remote, so failing on them is noise that
# teaches people to ignore the gate, the exact outcome that makes a gate worthless. CI uses
# --tracked because CI's question is "is what we would publish clean?". A bare local run still
# scans the whole tree, which is the right default while working.
PROFILE=general
TRACKED=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --tracked)   TRACKED=1 ;;
    --profile=*) PROFILE="${a#--profile=}" ;;
    --profile)   PROFILE=__next__ ;;
    *) if [ "$PROFILE" = __next__ ]; then PROFILE="$a"; else ARGS+=("$a"); fi ;;
  esac
done
[ "$PROFILE" = __next__ ] && { echo "FATAL: --profile needs a value (general|legal)" >&2; exit 2; }
case "$PROFILE" in
  general) SUBJECT_MODE=strict ;;
  legal)   SUBJECT_MODE=note ;;
  *) echo "FATAL: unknown profile '$PROFILE' (general|legal)" >&2; exit 2 ;;
esac
set -- "${ARGS[@]+"${ARGS[@]}"}"

# Normalise every target to an ABSOLUTE path. POLICY_EXEMPT is anchored on repo-relative
# path fragments (e.g. /docs/some_policy_file.md), so a relative argument silently defeated
# every exemption and produced a wall of false failures on single-file runs.
if [ "$TRACKED" = 1 ]; then
  if [ "$#" -gt 0 ]; then echo "FATAL: --tracked takes no path arguments" >&2; exit 2; fi
  TARGETS=()
  while IFS= read -r f; do
    [ -f "$REPO_ROOT/$f" ] && TARGETS+=("$REPO_ROOT/$f")
  done < <(cd "$REPO_ROOT" && git ls-files)
  # Fail closed: an empty tracked set would scan nothing and print a confident PASS.
  if [ "${#TARGETS[@]}" -eq 0 ]; then
    echo "FATAL: --tracked found no tracked files (not a git repo, or nothing committed/staged)" >&2
    echo "       Refusing to report PASS on an empty scan." >&2
    exit 2
  fi
  echo "tracked files: ${#TARGETS[@]}"
elif [ "$#" -eq 0 ]; then
  TARGETS=("$REPO_ROOT")
else
  TARGETS=()
  for t in "$@"; do
    if [ -e "$t" ]; then
      case "$t" in
        /*) TARGETS+=("$t") ;;
        *)  TARGETS+=("$(cd "$(dirname "$t")" && pwd)/$(basename "$t")") ;;
      esac
    else
      echo "FATAL: no such target: $t" >&2; exit 2
    fi
  done
fi
FAIL=0
HITS=0

# FOUR DOT-DIRECTORIES IN THIS REPOSITORY ARE AUTHORED OR GENERATED CONTENT AND MUST BE SCANNED.
# They are not tooling state: they are committed, they publish, and on a public repository the
# CI logs are public too, so a workflow file is one of the few places where a leaked path or
# value would be visible to everyone. The general dot-directory rule below is right for
# .venv/ and .cursor/ and wrong for exactly these four.
#
#   .github/         authored. Workflows, and its CI logs are public.
#   .claude/         🔴 GENERATED provider tree (ADR 0007 decision 2). Committed, because the
#   .codex/          freshness check diffs a rebuild against what is committed.
#   .claude-plugin/  authored manifests. They publish to a plugin marketplace.
#
# ⚠️ SCOPED CHANGE, WITH THE REASON: the previous repository shape had no generated provider
# trees, so it exempted .github/ alone and excluded .claude/ as third-party agent state. Under
# ADR 0007 .claude/ and .codex/ are PRODUCT, output of scripts/build.mjs, tracked, and bound
# for publication. Leaving them under the general rule would have aborted every `--tracked` run
# with exit 2 the moment the first generated tree was committed. The fix is to SCAN them, not
# to skip them: a substitution bug that leaks a value into a generated file is invisible if the
# only thing checked is the source it was generated from. Widening this to make a run green
# without also making the content scannable would be weakening the gate. That is not what this
# does, and the count printed by --tracked is what proves it.
#
# This was not theoretical the first time either. `--tracked` enumerates every tracked file,
# `.github/workflows/` is tracked, the dot-path guard therefore aborted the whole run with exit
# 2, and ci_casefact.sh swallowed it and printed "case-fact gate: clean". A private
# repository's CI reported green while the gate scanned nothing.
#
# The sentinel dance is because grep -E has no negative lookahead: protect the allowed
# dot-directories, apply the general rule, restore them. Same trick in scan(), and it has to be
# BOTH places, the guard decides whether the run aborts, the line filter decides whether the
# content is actually read. Fixing only one produces a run that neither aborts nor scans.
OURS_DOTDIRS='github|claude-plugin|claude|codex'   # longest first: claude-plugin before claude
protect_ours() {
  printf '%s' "$(printf '%s' "$1" | sed -E "s#/\.($OURS_DOTDIRS)/#/@@OURS_\1@@/#g")"
}

# FAIL-CLOSED ON AN UNSCANNABLE TARGET.
# Two independent mechanisms below discard dot-directories: --exclude-dir=.claude et al, and
# the /\.[^/]+/ line filter in scan(). Both are correct for a repo scan, and together they
# made the gate report a confident PASS on a target living under a dot-directory, every line
# was dropped before a single class ran. Green on zero scanned bytes is the worst possible
# failure mode for a gate, so refuse the run instead. Stage the tree somewhere neutral first,
# which is what the extraction checklist's fresh-tree rule requires anyway.
# ⚠️ The pattern is */.*/*, a dot segment with a slash AFTER it, i.e. a dot-DIRECTORY.
# It was */.* , which also matched a root dot-FILE, so `--tracked` aborted the entire run on
# `.gitignore`. scan()'s line filter always had this right ("deliberately not a root dot-FILE
# like /.gitignore, which IS ours"); the guard did not, and the guard runs first.
for t in "${TARGETS[@]}"; do
  case "$(protect_ours "$t")" in
    */.*/*) echo "FATAL: target path contains a dot-directory and cannot be scanned: $t" >&2
            echo "       Copy it to a neutral staging path and scan that (fresh tree, no history)." >&2
            echo "       (.github/ .claude/ .codex/ .claude-plugin/ are exempt. They are authored or" >&2
            echo "        generated product, they are committed, and they publish. They are SCANNED," >&2
            echo "        not skipped. A root dot-FILE such as .gitignore is ours and is scanned too.)" >&2
            exit 2;;
  esac
done

# Vendored / generated trees. Third-party reference docs carry example dates and vocabulary
# that are not ours and cannot be scrubbed; scanning them only trains people to ignore the gate.
# NOTE: landing/ itself is NOT excluded. Another workstream owns it, and its own copy must
# still pass. Only vendored subtrees inside it are skipped.
#
# ⚠️ .claude/ IS NO LONGER EXCLUDED HERE. In the previous repository shape it was the agent's
# own workspace state; under ADR 0007 it is a generated provider tree that ships. Excluding it
# would mean a bare directory run silently skipped published content, and a silent exclusion
# is how a tree stops being checked without anyone deciding to stop checking it.
EXCLUDES=(
  --exclude-dir=.git --exclude-dir=node_modules --exclude-dir=dist
  --exclude-dir=build --exclude-dir=.venv --exclude-dir=target
  --exclude-dir=.next --exclude-dir=.svelte-kit --exclude-dir=.turbo
  --exclude-dir=.kiro --exclude-dir=.pi --exclude-dir=.cursor
  --exclude-dir=vendor --exclude-dir=_vendor --exclude-dir=.pnpm-store
  --exclude=casefact_gate.sh --exclude=DENYLIST.example.txt
  --exclude=pnpm-lock.yaml --exclude=package-lock.json --exclude=yarn.lock
  # repos/ holds extracted repositories, each with its OWN gate, its own profile and its own
  # CI. Scanning them from here re-reports the same tree at the wrong profile and sweeps in
  # each repo's deliberately-unscrubbed staging/, 148 hits on the first run, none of which
  # this gate can act on. An unactionable red gate is an ignored gate.
  --exclude-dir=repos
)

# A SILENT exclusion is how a tree stops being checked without anyone deciding to stop
# checking it. So say it out loud, every run, with the command that does check it.
if [ -d "$REPO_ROOT/repos" ] && [ "$TRACKED" != 1 ]; then
  for _r in "$REPO_ROOT"/repos/*/; do
    [ -d "$_r" ] || continue
    echo "  ⤺ skipped repos/$(basename "$_r")/, gate it there: (cd repos/$(basename "$_r") && ./ops/ci_casefact.sh)"
  done
fi

# POLICY FILES may name the things they prohibit. A rail cannot ban a word without
# writing it. Exempt from the VOCABULARY and OUTCOME-PROMISE classes only; never from
# the identifier or temporal classes, which have no legitimate use anywhere in this repo.
#
# 🔴 THE LIST IS PER-TREE AND MUST NOT BE HARDCODED HERE. It was, and it named internal
# never-published directories, so every vendored copy of this script carried those names
# into a repository destined to be public. A path fragment in a regex is not a claim, but a
# public file naming a private tree is the same leak class as a dangling relative path, and
# this script is the one file guaranteed to be in every repository.
#
# So: a tree supplies its own list at ops/policy_exempt.re: first non-comment, non-blank
# line, one extended regex. Absent, the default below is the generic minimum. The LOGIC stays
# identical across every copy, which is what "vendored" has to mean; only the configuration
# is local.
POLICY_EXEMPT='(/ops/casefact_gate\.sh|/ops/policy_exempt\.re)'
_pe_file="$REPO_ROOT/ops/policy_exempt.re"
if [ -f "$_pe_file" ]; then
  _pe="$(grep -vE '^[[:space:]]*(#|$)' "$_pe_file" | head -1)"
  [ -n "$_pe" ] && POLICY_EXEMPT="$_pe"
fi

# mode:
#   strict  → any match FAILS. Identifier + temporal classes. No legitimate use anywhere.
#   policy  → FAILS, but files that DEFINE a prohibition are exempt (a rail cannot ban a
#             word without writing it).
#   note    → prints a NOTE and does NOT fail. For vocabulary classes, where a regex cannot
#             tell a capability claim ("we monitor X") from a quoted prohibition ("never
#             monitor X"). A gate that reddens on every doc discussing the rule gets ignored,
#             and an ignored gate protects nothing. NOTES are for a human to read.
NOTES=0
scan() { # scan <label> <extended-regex> [strict|policy|note] [drop-regex] [keep-only-regex]
  # drop = lines matching are discarded (false-positive suppression, e.g. hex colours).
  # keep = lines NOT matching are discarded. Narrows a class to the only paths where it is
  #        meaningful, so a broad pattern can be used without drowning the whole repo.
  local label="$1" re="$2" mode="${3:-strict}" drop="${4:-}" keep="${5:-}" out
  # -H is load-bearing: with a SINGLE file as the target, grep -r omits the filename, so
  # every path-based filter below (dot-dir, drop, keep, POLICY_EXEMPT) silently matched
  # nothing and the class went quiet on exactly the single-file runs used during extraction.
  out="$(grep -rHInE "${EXCLUDES[@]}" -- "$re" "${TARGETS[@]}" 2>/dev/null)" || return 0
  # Any dot-DIRECTORY segment is tooling/vendor state (framework caches, other tools' state),
  # never our authored content. General rule beats enumerating each new tool convention.
  # Matches /.foo/, deliberately not a root dot-FILE like /.gitignore, which IS ours.
  # ⚠️ .github/ .claude/ .codex/ .claude-plugin/ ARE ours: committed, published, and .github's
  # CI logs are public. Protect them through the filter with a sentinel, because grep -E has no
  # negative lookahead. Same list as protect_ours(), and it MUST be the same list, or the guard
  # lets a target through that this filter then silently empties.
  out="$(printf '%s\n' "$out" \
        | sed -E "s#/\.($OURS_DOTDIRS)/#/@@OURS_\1@@/#g" \
        | grep -vE '/\.[^/]+/' \
        | sed -E 's#/@@OURS_([a-z-]+)@@/#/.\1/#g' || true)"
  [ -n "$drop" ] && out="$(printf '%s\n' "$out" | grep -vE "$drop" || true)"
  [ -n "$keep" ] && out="$(printf '%s\n' "$out" | grep -E  "$keep" || true)"
  [ -z "$out" ] && return 0
  [ "$mode" != strict ] && out="$(printf '%s\n' "$out" | grep -vE "$POLICY_EXEMPT" || true)"
  [ -z "$out" ] && return 0
  local n; n=$(printf '%s\n' "$out" | wc -l | tr -d ' ')
  if [ "$mode" = note ]; then
    printf '\n\033[33m· NOTE (%s (%s)) review by hand, not a failure\033[0m\n%s\n' "$label" "$n" "$out"
    NOTES=$((NOTES + n)); return 0
  fi
  printf '\n\033[31m✖ %s\033[0m\n%s\n' "$label" "$out"
  HITS=$((HITS + n)); FAIL=1
}

# HEXCOLOUR, the POSTAL-CODE drop. ⚠️ It is not the badge drop and was never usable as one.
#
# A CSS hex colour turns up in design docs (.md) as well as in stylesheets, so the suppression
# drops LINES carrying a hex-colour token rather than whole file types.
#
# 🔴 THE SENTENCE THAT USED TO END THIS COMMENT WAS FALSE: "a real badge number in prose still
# fails." It does not, and being a *documented, reasoned* exemption is precisely what stopped
# anyone re-checking it, which is worse than an undocumented one.
#
# The claim holds for the postal-code class and cannot hold for the badge class, and the whole
# difference is one character. A postal code's shape (A1A 1A1) contains no '#', so a prose line
# carrying one is never dropped by this pattern. A badge number's shape IS '#' plus decimal
# digits, and every decimal digit is also a hex digit, so every token the badge pattern could
# match also matched this drop, which runs BEFORE the class is judged. The badge class was
# therefore dead for the whole life of the gate, by construction rather than by accident: all
# five measured shapes silent, including a bare token alone on its line.
#
# Left unchanged and still used by the postal-code class, where it is correct. The badge rules
# below no longer use it, see them for what replaced it.
HEXCOLOUR='#[0-9A-Fa-f]{3,8}([^0-9A-Fa-f]|$)'

# A BUILD-INTEGRITY DIGEST IS NOT AN EVIDENCE DIGEST, and the two are identical to a regex.
#
# ⚠️ SCOPED EXCEPTION, WITH THE REASON. The hash class exists to catch the digest of a piece of a
# real matter's evidence, a case-workspace artifact. This repository's architecture requires two
# generated files that are nothing but digests: the contract digest, which the engine verifies
# before reading the contract and refuses on mismatch (ADR 0007 decision 6), and the generated-
# tree lock, which carries one content hash per generated file. Together they produced 55 strict
# failures on the first run after the generated trees landed.
#
# The exception is anchored to those PATHS and nothing else: five of them, and the three
# generated-tree copies are ENUMERATED DELIBERATELY rather than described by a path shape. A
# full-length hex string anywhere else, in prose, in a method document, in a fixture, in a
# jurisdiction pack, or at a path that merely resembles one of these, still fails, which is
# verified rather than assumed.
#
# ⚠️ WIDENED ONCE, IN KIND, AND ONLY IN KIND. The contract digest is a RUNTIME input, not just a
# build artifact: the engine runs from inside the INSTALLED provider tree and resolves
# data/tree.sha256 relative to itself, so the same file must ship in every generated tree as well
# as at its canonical source path. Those copies are byte-identical to the canonical one, emitted
# by the same build, and covered by the same compensating control. This adds no new CLASS of
# exempt file, three more named paths for the one file that was already exempt.
#
# ⚠️ THEN NARROWED, FROM A SHAPE TO A LIST. That widening was first written as the pattern
# `skills/<any-name>/data/tree.sha256`, which matched that path shape ANYWHERE in the tree, so
# `docs/skills/anything/data/tree.sha256` was silently exempt, and the paragraph above claimed an
# anchoring the pattern did not have. A gate whose comment overstates its own narrowness is this
# project's recurring failure mode, and there are exactly three generated provider trees: known,
# finite, and now listed one by one. WHY A LIST AND NOT A PATTERN: a fourth provider then has to
# be a deliberate gate decision (someone adds a line here and states why) instead of inheriting
# an exemption automatically from the shape of its path. That is the point of the narrower form,
# not the price of it.
#
# The compensating control is real rather than nominal: every one of these files is GENERATED,
# rebuilt from public repository content, and the freshness job fails if any diverges from a
# rebuild. So a case digest smuggled into one of them is reverted by the next build and caught
# there. That is what makes this an exception rather than a hole.
#
# ⚠️ WIDENED A SECOND TIME, SAME KIND, SAME REASON, AND THE LIST FORM IS WHY THIS IS VISIBLE.
# ADR 0008 decision 6 adds a second build-output digest pair: the jurisdiction pack summary,
# `packs.sha256`, emitted from `jurisdictions/*/pack.yaml` and shipped into every provider tree
# for exactly the reason `tree.sha256` is: the engine resolves it relative to itself and nothing
# on a user path can parse YAML. Four more named paths for one more generated file.
#
# The compensating control is the same one and it is not nominal: every one of these files is
# GENERATED from public repository content, and the freshness job fails if any diverges from a
# rebuild. A case digest smuggled into one is reverted by the next build and caught there.
#
# ⛔ AND THE NARROWNESS IS DELIBERATE, AGAIN. It is not `data/.*\.sha256`. Adding a third digest
# pair has to be somebody writing a line here and saying why, rather than inheriting an exemption
# from the shape of a filename. That is the point of the list form, not the price of it.
#
# Residual, stated rather than hidden: the drop is still a path FRAGMENT anchored on a leading
# slash, so a line elsewhere that literally contains one of these path-and-colon strings would
# also be dropped, and so would a copy of a listed path nested under some other directory.
# Anchoring to the repository root is not available. Targets are absolute paths and vary by
# machine.
BUILD_DIGEST='/(skills-lock\.json|skill/data/tree\.sha256|\.claude/skills/machine-witness/data/tree\.sha256|\.codex/skills/machine-witness/data/tree\.sha256|plugin/skills/machine-witness/data/tree\.sha256|skill/data/packs\.sha256|\.claude/skills/machine-witness/data/packs\.sha256|\.codex/skills/machine-witness/data/packs\.sha256|plugin/skills/machine-witness/data/packs\.sha256):'

echo "== Machine Witness case-fact gate =="
echo "profile: $PROFILE   (subject-matter classes: $SUBJECT_MODE)"
echo "targets: ${TARGETS[*]}"

# ═══════════════════════════════════════════════════════════════════════════════════════
# CLASS 0: ARCHIVES. THREE OUTCOMES, NOT TWO. ADR 0008 decision 7.
#
# 🔴 THE DEFECT THIS EXISTS TO REPORT, and it was one flag wide. Every scan below runs
# `grep -rHInE`, and `-I` SKIPS NON-TEXT FILES. So does the runtime denylist scan, which is
# the one check built specifically to catch a real person's name. A committed archive is
# therefore invisible to every structural class AND to the denylist, and the gate prints the
# same green over it as over an empty tree.
#
# ⛔ THIS DOES NOT CHANGE THE EXIT CODE, and that is a decision rather than a softening.
# Failing on an unreadable archive makes the gate permanently red, and a permanently red gate
# is one people stop reading. Passing silently is a lie. So the honest form is a THIRD
# outcome: a distinct unverifiable count, the paths listed, and the word UNVERIFIABLE next to
# them. Green then means "N text files were read", never "the tree is clean".
#
# ⚠️ It is not a substitute for anything. It reports a gap; it does not close one. What
# closes it is a per-member digest manifest committed in plain text beside the archive, so a
# reviewer can at least establish that the bytes are the bytes somebody signed off.
# ═══════════════════════════════════════════════════════════════════════════════════════

# Compressed and packed containers. Extended when a real one appears, never by guessing at
# formats nobody uses: an extension listed here and never seen is a claim this gate checks
# something it has never met.
ARCHIVE_RE='\.(zip|tar|tgz|tbz2?|txz|tar\.gz|tar\.bz2|tar\.xz|tar\.zst|gz|bz2|xz|zst|7z|rar|jar|whl|epub|sqlite|sqlite3|db)$'

ARCHIVES=()
IN_SCOPE=0
if [ "$TRACKED" = 1 ]; then
  # The targets ARE the file list, so filter it. No second enumeration to drift.
  IN_SCOPE="${#TARGETS[@]}"
  for _t in "${TARGETS[@]}"; do
    printf '%s' "$_t" | grep -qE "$ARCHIVE_RE" && ARCHIVES+=("$_t")
  done
else
  # A directory target: walk it with the same directory exclusions the scans use, so the two
  # cannot disagree about what is in scope. The prune list is READ FROM `EXCLUDES` rather than
  # retyped, because a second copy of that list would drift and the drift would be silent.
  #
  # ⚠️ THE WALK ALSO PRODUCES THE FILE COUNT, in one pass. Before this, a directory run's
  # summary said "1 target", which is true and useless: the whole standing rule here is that a
  # green is worth exactly what it scanned, and "1" invited a reader to think one file was read.
  _prune=()
  for _e in "${EXCLUDES[@]}"; do
    case "$_e" in
      --exclude-dir=*) _prune+=(-name "${_e#--exclude-dir=}" -prune -o) ;;
    esac
  done
  while IFS= read -r _f; do
    [ -z "$_f" ] && continue
    IN_SCOPE=$((IN_SCOPE + 1))
    printf '%s' "$_f" | grep -qE "$ARCHIVE_RE" && ARCHIVES+=("$_f")
  done < <(
    for _t in "${TARGETS[@]}"; do
      [ -e "$_t" ] || continue
      if [ -f "$_t" ]; then printf '%s\n' "$_t"; continue; fi
      find "$_t" \( "${_prune[@]}" -false \) -o -type f -print 2>/dev/null
    done
  )
  # Fail closed. A walk that found nothing would make every count below a fiction.
  if [ "$IN_SCOPE" -eq 0 ]; then
    echo "FATAL: found no files under the target(s). Refusing to report on an empty scan." >&2
    exit 2
  fi
fi

UNVERIFIABLE="${#ARCHIVES[@]}"
# The count is printed on every run, pass or fail, because it is the only thing that
# distinguishes a real pass from a vacuous one.
echo "files in scope: $IN_SCOPE   (archives among them, unreadable by every class below: $UNVERIFIABLE)"
if [ "$UNVERIFIABLE" -gt 0 ]; then
  echo
  echo "⚠ $UNVERIFIABLE archive(s) NOT scanned, UNVERIFIABLE. Every class below uses grep -I,"
  echo "  which skips non-text files, and so does the runtime denylist scan."
  for _a in "${ARCHIVES[@]}"; do
    echo "    ${_a#"$REPO_ROOT"/}"
  done
  echo "  A PASS below is a statement about the text files it read, not about these."
fi

# ---- Class 1: legal-proceeding identifiers -------------------------------------------
scan "Criminal Code / statute section reference"   '\b(s\.|ss\.|section)[[:space:]]*[0-9]{3}(\.[0-9]+)?(\([0-9a-z]+\))*' "$SUBJECT_MODE"
# A CVE identifier is a public vulnerability ID, not a docket number, and security docs must
# be able to name one. Drop the LINE only where a CVE token is present.
CVEID='CVE-[0-9]{4}-[0-9]+'
scan "Occurrence / docket / information number"    '\b[0-9]{2,4}-[0-9]{3,7}(-[0-9]{2,4})?\b' strict "$CVEID"
# ---- Badge / shield number. TWO rules, because one broad drop killed the class ------
#
# 🔴 WHAT WAS WRONG. This was a single scan, `'#[0-9]{4,6}\b' strict "$HEXCOLOUR"`, and it could
# not fail on anything. See the HEXCOLOUR comment above for the mechanism. RAIL 1 names badge
# numbers explicitly, so a declared class that cannot fire is a rail with nothing behind it.
#
# THE HONEST DIFFICULTY, which is real and does not go away: as BARE TOKENS a hex colour and a
# badge number are the same string. `#141416` is a surface colour and it is also a plausible
# six-digit badge. No regex over the token alone can separate them, so these rules separate them
# by CONTEXT (what actually surrounds each one in a real file) and split into two because the
# two contexts want opposite defaults.
#
# RULE A, a role word is on the line. This is the class RAIL 1 actually names, and it is the
# one that matters: a badge number in a case fact arrives attached to a person's role. So the
# token is read WIDE (three to eight digits, colour lengths included) and the line is kept only
# where a role word appears. A stylesheet does not say "officer".
#
# RULE B: a BARE token, no role word. Here the default has to come from length, because that is
# the only signal left. CSS hex colours are 3, 4, 6 or 8 hex digits; `#RRGGBB` is the dominant
# form and `#RRGGBBAA` its alpha variant, while `#RGBA` (four) is uncommon in real stylesheets
# and five and seven digits are not colour lengths at all. So a bare four- or five-digit decimal
# token is treated as badge-shaped and fires, and six- and eight-digit ones need rule A's role
# word. On top of that, colour CONTEXT on the line, a stylesheet property, a custom-property
# declaration, a palette or swatch table, a stylesheet or asset path, another hex token that
# contains a hex letter and so cannot be a badge, drops the line.
#
# ⛔ THESE RULES ARE DELIBERATELY NOISY, and that is the safe direction. A false positive costs a
# human a moment's review; a dead class costs RAIL 1. Both role and colour terms are broad on
# purpose: `\bunits?\b` and `\bPC\b` will collide with ordinary prose the day a `#`-plus-digits
# token lands on the same line, and that collision is a hit to look at, not a bug to tune away.
#
# WHAT THEY STILL CANNOT DISTINGUISH, stated rather than hidden:
#   · a bare four- or five-digit issue/PR reference (`#4417`) from a badge number, identical
#     strings, and the issue reference is the one that loses. Fires. Intended.
#   · a bare all-decimal `#RGBA` shorthand from a badge number, unless colour context is on the
#     line. Fires. Intended.
#   · a bare six- or eight-digit badge number from a hex colour. This one goes the UNSAFE way
#     and is the residual gap: without a role word on the line it stays silent. Rule A is what
#     covers it, and a role word is present in every realistic case-fact sentence.
#   · a badge number whose line legitimately discusses colour (`badge blue #123456`), dropped
#     by rule B, caught by rule A on the word `badge`.
#
# Neither rule uses HEXCOLOUR. Reintroducing it here re-kills the class.
BADGE_ROLE='([Bb]adge|[Oo]fficer|[Cc]onstable|[Ss]ergeant|[Dd]etective|[Ww]arrant|[Ss]hield|[Rr]egimental|[Dd]etachment|[Pp]recinct|\b(P|D)\.?C\.?\b|\bSgt\b|\bCst\b|\bDet\b|\bunits?\b)'
BADGE_COLOUR_CTX='(colou?r|background|foreground|border|outline|shadow|gradient|fill[=:]|stroke[=:]|rgba?\(|hsla?\(|palette|swatch|--[A-Za-z0-9_-]+:|\.(css|scss|sass|less|styl|svg)[:.]|#[0-9A-Fa-f]*[A-Fa-f])'
scan "Badge / shield number (role word on the line)" '#[0-9]{3,8}\b' strict '' "$BADGE_ROLE"
scan "Badge-shaped bare number (not a hex-colour length)" '#[0-9]{4,5}\b' strict "$BADGE_COLOUR_CTX|$BADGE_ROLE"
scan "Police division / detachment"                '\b[0-9]{1,3}[[:space:]]+(Division|Detachment|Precinct)\b'
scan "Courtroom / court reference"                 '\b(Courtroom|Ctrm|Court Room)[[:space:]]*#?[0-9]+'
scan "Case-law citation (matter-specific research)" '\b[0-9]{4}[[:space:]]+(SCC|ONCA|ONSC|ONCJ|CanLII|BCCA|ABCA|QCCA)[[:space:]]+[0-9]+' "$SUBJECT_MODE"
scan "Named-party case style"                       '\bR\.?[[:space:]]+v\.?[[:space:]]+[A-Z]' "$SUBJECT_MODE"

# ---- Class 1b: bare statute sections in DATA position -------------------------------
# The class-1 regex needs an "s."/"section" prefix, so a fixture written as
#   {"our_sections": {"271": 1.5, "266": 1.0, "264.1": 2.0}}
# passes cleanly while publishing this matter's exact charge combination. A combination is
# a fingerprint even when no single number is: three quoted sections plus a lever list
# identifies a matter to anyone holding the Information.
#
# NOTE, not FAIL, and the reason is structural: the gate cannot know which combination is
# real without embedding a case fact in the gate itself. The hard stop is the runtime
# denylist (class 7, lives outside the repo) plus the reviewer rule in
# github_org/EXTRACTION_CHECKLIST.md §2. This class only guarantees a human is made to look.
scan "Bare statute section in fixture/config (charge-combination check)" \
     '"[0-9]{3}(\.[0-9]+)?"[[:space:]]*:' note '' '(fixture|eval|example|sample|test|config|\.json|\.ya?ml)'

# ---- Class 2: personal identifiers --------------------------------------------------
scan "Street address"                              '\b[0-9]{1,5}[A-Z]?[[:space:]]+[A-Z][a-zA-Z]+[[:space:]]+(St|Street|Ave|Avenue|Rd|Road|Blvd|Cres|Crescent|Dr|Drive|Way|Lane|Ln)\b'
scan "Postal code (CA/UK style)"                   '\b[A-Z][0-9][A-Z][[:space:]]?[0-9][A-Z][0-9]\b' strict "$HEXCOLOUR"
scan "Phone number"                                '(\+[0-9]{1,3}[[:space:]]?)?\(?[0-9]{3}\)?[[:space:].-][0-9]{3}[[:space:].-][0-9]{4}\b'
# A forge no-reply address (<id>+<login>@users.noreply.github.com) is by construction
# non-identifying, it encodes only a public account id and login, which is exactly the
# pseudonym we publish under. Publish-prep docs have to state the commit address to be usable.
scan "Email address"                               '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' strict 'users\.noreply\.github\.com'
scan "Date of birth pattern"                       '\b(DOB|D\.O\.B\.|born)[[:space:]:]*[0-9]{4}[/-][0-9]{2}[/-][0-9]{2}'

# ---- Class 3: matter-pinning temporal data -----------------------------------------
scan "Absolute ISO date (use <WINDOW> instead)"    '\b(19|20)[0-9]{2}-[0-9]{2}-[0-9]{2}\b'
scan "Absolute slash date"                         '\b[0-9]{1,2}/[0-9]{1,2}/(19|20)?[0-9]{2}\b'

# ---- Class 4: case-workspace artifacts ---------------------------------------------
scan "Full-length hash (evidence digest)"          '\b[a-f0-9]{40,64}\b' strict "$BUILD_DIGEST"
# policy mode: .gitignore must name the directories it blocks from ever being committed.
scan "Case-workspace path"                         '(evidence_master|evidence_processed|case_docs|precedent_mining|chat_work|legal-defense)' policy
# Requires a filename stem: a bare `.eml`/`.ics` in prose is a format name, not an artifact.
# A stem containing a glob is a FORMAT NAME, not an artifact: `msgstore*.db.crypt14` names a
# naming convention, `msgstore-2026-01-01.db.crypt14` names a file. Only the latter is a leak.
scan "Verbatim evidence filename"                  '[A-Za-z0-9_-]{2,}\.(eml|ics|crypt1[0-9]|m4a|pkpass)\b' strict '[A-Za-z0-9_-]*\*[A-Za-z0-9_.-]*\.(eml|ics|crypt1[0-9]|m4a|pkpass)'

# ---- Class 5: banned vocabulary (RAIL 2): policy files exempt ----------------------
scan "Surveillance vocabulary (RAIL 2)"            '\b(surveil|surveillance|predated?|predates)\b' note

# ---- Class 6: outcome promises (RAIL 7): policy files exempt ----------------------
# ⚠️ This class was blind to an entire part of speech and printed green on a line that named
# a banned outcome. Every entry came from advertising_rules.md §1, and every entry THERE is a
# VERB phrase, so the class inherited that list's grammar: `prove your innocence` fired,
# `evidence of your innocence` did not. A lexicon built from a banned-phrase list can only
# catch the grammar of the list it was built from. The noun, adjective and clause forms below
# were added for that reason; the broad catch-all after them is what actually closes the class,
# because a phrase list is precisely what failed here.
# ⛔ Additions only. Never narrow or delete a branch to clear a note.
scan "Outcome promise (RAIL 7)"                    '\b(prove your innocence|beat the charge|guaranteed acquittal|clear your name|exonerat(e|ed|ion)|(evidence|proof) of (your|his|her|their|my|the) innocence|(establish|demonstrate|show|confirm|verify|document)[[:space:]]+(your|his|her|their|my|the)[[:space:]]+innocence|(proves?|shows?|establishes?)[[:space:]]+(you|he|she|they|I)[[:space:]]+(are|is|were|was)[[:space:]]+innocent|clears?[[:space:]]+(you|your name|him|her|them))\b' note
# The catch-all. Fires on every remaining construction, including a negation. The project's own
# rule is that a banned word is banned in a denial too, so `will not prove you innocent` is
# still the word on the page and still worth a human reading it. Deliberately overlaps the
# phrase list above; the drop-regex discards lines that class already reported, so one line is
# one review item rather than two. ⛔ README.md is NOT policy-exempt (see policy_exempt.re) and
# must earn each use.
scan "Outcome word, any construction (RAIL 7)"     '\binnocen(ce|t)\b' note '\b(prove your innocence|clear your name|(evidence|proof) of (your|his|her|their|my|the) innocence|(establish|demonstrate|show|confirm|verify|document)[[:space:]]+(your|his|her|their|my|the)[[:space:]]+innocence|(proves?|shows?|establishes?)[[:space:]]+(you|he|she|they|I)[[:space:]]+(are|is|were|was)[[:space:]]+innocent)\b'

# ---- Class 7: runtime denylist of REAL values (never committed) ---------------------
if [ -n "${MW_DENYLIST:-}" ]; then
  case "$MW_DENYLIST" in
    "$REPO_ROOT"*) echo "FATAL: MW_DENYLIST must live OUTSIDE this repo ($MW_DENYLIST)"; exit 2;;
  esac
  [ -r "$MW_DENYLIST" ] || { echo "FATAL: MW_DENYLIST unreadable: $MW_DENYLIST"; exit 2; }
  # -F fixed strings, -i case-insensitive: catches possessives, hyphenation, case drift.
  out="$(grep -rHIinF "${EXCLUDES[@]}" -f "$MW_DENYLIST" -- "${TARGETS[@]}" 2>/dev/null)" || true
  if [ -n "$out" ]; then
    printf '\n\033[31m✖ RUNTIME DENYLIST HIT (real case value present)\033[0m\n%s\n' "$out"
    FAIL=1
  fi
  # 🔴 AND SAY WHAT IT COULD NOT READ, HERE, not only at the top. This is the ONE check built
  # to catch a real person's name, and `-I` blinds it to an archive exactly as it blinds every
  # structural class. A reviewer who scrolls to the denylist result and sees nothing must not be
  # able to read that as "no name is present in this tree".
  if [ "$UNVERIFIABLE" -gt 0 ]; then
    echo
    echo "⚠ the denylist scan also skipped $UNVERIFIABLE archive(s), listed above. A real name"
    echo "  inside one of them would not appear here. UNVERIFIABLE, not clean."
  fi
else
  echo
  echo "⚠ MW_DENYLIST not set, structural classes only."
  echo "  Before any publish or hand-off, re-run with the real-value denylist from outside this repo."
fi

echo
# THE SUMMARY CARRIES ALL THREE OUTCOMES. A green that does not say what it read is worth
# nothing, and a green that hides what it could NOT read is worse than nothing.
if [ "$UNVERIFIABLE" -gt 0 ]; then
  _scope="$((IN_SCOPE - UNVERIFIABLE)) file(s) read, $UNVERIFIABLE UNVERIFIABLE"
else
  _scope="$IN_SCOPE file(s) read, 0 unverifiable"
fi
if [ "$FAIL" -eq 0 ]; then
  echo "✅ PASS on what it could read: $_scope. ($NOTES vocabulary note(s) for human review.)"
  exit 0
fi
echo "❌ FAIL: $HITS structural match(es). Review each: generalise to a placeholder, or confirm it is"
echo "   generic doctrine and add a scoped exception WITH a comment saying why."
exit 1
