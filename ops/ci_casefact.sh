#!/usr/bin/env bash
# CI wrapper for the case-fact gate.
#
# WHY A WRAPPER: CI logs are PUBLIC on a public repository. The gate prints the matching line
# so a human can fix it, which in a public log would publish the very value it caught,
# turning the leak detector into the leak. This prints class headers only (each carries a
# count, no content) and points a maintainer at the local command for detail.
#
# 🔴 WHY IT FAILS CLOSED THREE WAYS: the first version of this wrapper ran the gate with
# `|| true`, then looked only for a ❌ marker. When the gate aborted with `FATAL: ... exit 2`,
# which it did on every run, because `--tracked` enumerates `.github/workflows/` and the
# dot-path guard rejected it. There was no ❌ in the output, so this script printed
# "case-fact gate: clean" and exited 0. **CI reported green while the gate scanned nothing.**
#
# That is the project's own headline failure mode ("a gate that scans nothing prints the same
# green as a clean tree") reproduced in the wrapper built to report the gate. So now: the exit
# code is propagated, a success marker is REQUIRED, and any FATAL is a failure. A silent pass
# needs all three to break at once.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

out="$(./ops/casefact_gate.sh --tracked --profile legal 2>&1)"
rc=$?

# Strip ANSI, keep only summary lines. A class header looks like "✖ Street address" or
# "· NOTE: … (3)" and carries no matched text.
#
# ⚠️ `targets:` is deliberately NOT printed. Under --tracked it is every absolute path in the
# repository on one line, which on a developer's machine embeds the operating-system username,
# and a maintainer pasting that output into an issue would publish it. `tracked files: N` is the
# number that actually matters (it is what tells a real pass from a vacuous one) and it carries
# nothing identifying. FATAL lines name one path and are kept, because a suppressed error is how
# this wrapper failed in the first place.
#
# ⚠️ `files in scope:` and the indented archive paths are BOTH kept. A path under an archive
# line is a repo-relative path to a committed file, which is public content by definition, so
# it carries nothing the repository does not already publish. Suppressing them would leave CI
# reporting an unverifiable count without saying what was unverifiable, which is the shape of
# the failure this wrapper exists to prevent rather than a smaller version of it.
printf "%s\n" "$out" | sed 's/\x1b\[[0-9;]*m//g' \
  | grep -E '^(profile:|tracked files:|files in scope:|FATAL|✖|·|❌|✅|⚠)|^    [A-Za-z0-9_.]' || true

fail() { echo "::error::$1"; exit 1; }

# 1. The gate's own exit code. 0 = clean, 1 = violations, 2 = usage/error.
if [ "$rc" -ne 0 ]; then
  fail "case-fact gate exited $rc. Run './ops/casefact_gate.sh --tracked --profile legal' locally. The matching lines are deliberately not printed here."
fi

# 2. An explicit success marker. An empty or truncated run has no ✅ and must not pass.
if ! printf '%s\n' "$out" | grep -q '✅'; then
  fail "case-fact gate produced no success marker, refusing to report clean on a run that may have scanned nothing."
fi

# 3. Belt and braces: a failure marker anywhere, or any FATAL, regardless of exit code.
if printf '%s\n' "$out" | grep -qE '❌|^FATAL'; then
  fail "case-fact gate reported a failure. Run it locally for detail."
fi

# 4. ⚖️ THE THIRD OUTCOME. ADR 0008 decision 7: verified, failed, and UNVERIFIABLE.
#
# 🔴 THE WORD "clean" IS NOT AVAILABLE WHEN SOMETHING WAS NOT READ. Every class in the gate
# uses `grep -I`, which skips non-text files, and so does the runtime denylist scan, which is
# the only check that can catch a real person's name. An archive is therefore outside every
# check, and reporting "clean" over one would be this repository's headline failure mode with
# a new cause: a green whose scope nobody stated.
#
# ⛔ It does NOT fail the build. A permanently red gate is one people stop reading, and the
# state being reported is "unknown", not "unsafe".
archives="$(printf '%s\n' "$out" | sed 's/\x1b\[[0-9;]*m//g' \
  | sed -nE 's/^⚠ ([0-9]+) archive\(s\) NOT scanned.*/\1/p' | head -1)"
scope="$(printf '%s\n' "$out" | sed -nE 's/^files in scope: ([0-9]+).*/\1/p' | head -1)"

# The scope line must exist. If the gate stops printing it, this wrapper must not silently
# fall back to the old unconditional "clean": that is how the first version failed.
if [ -z "$scope" ]; then
  fail "the gate printed no 'files in scope:' count, so this wrapper cannot say what it read. Refusing to report clean."
fi

if [ -n "$archives" ] && [ "$archives" -gt 0 ]; then
  echo "::warning::case-fact gate: $archives archive(s) UNVERIFIABLE. Not scanned by any class, including the real-value denylist. Verify them against their digest manifest by hand."
  echo "case-fact gate: no match in $((scope - archives)) file(s) read · $archives UNVERIFIABLE"
else
  echo "case-fact gate: clean, $scope file(s) read · 0 unverifiable"
fi
