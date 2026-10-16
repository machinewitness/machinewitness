#!/usr/bin/env python3
"""Structural checks this repository can fail on. Python 3 standard library only.

Two checks, both chosen because the failure they catch has actually happened here:

  1. LINK INTEGRITY. A relative path that points at nothing. In a public repository a
     dangling path is worse than a broken link, the one that prompted this check named an
     internal directory that is never published, so the path advertised the existence and
     name of a private tree. It also catches the plainer version: a method file citing
     `09_filesystem_hash_traps.md` when the file is `09_filesystem_and_hash_traps.md`.

  2. PACK CLAIMS. A jurisdiction pack that claims to be reviewed without recording who
     reviewed it, or whose pack.yaml and 00_status.md disagree. The coverage table is the
     project's only statement of legal scope; a pack silently claiming more than it has is
     the exact over-claim ADR 0005 exists to prevent.

Run:  python3 ops/check_contracts.py
Test: python3 ops/check_contracts.py --selftest

The selftest is not decoration. A gate that passes because it examined nothing prints the
same green as a clean tree, so the check must be *known to fire* before a pass means
anything.
"""

from __future__ import annotations

import re
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {".git", ".github", "node_modules", "staging"}

# A path inside backticks. **Must contain a slash.** A bare `tree.yaml` or `00_status.md` is
# how these documents refer to a *kind* of file, the one in each pack, the contract in
# general, and resolving it against the citing file's directory produces noise, not findings.
# Requiring a separator keeps every real case (`../../docs/methods/09_...`, `jurisdictions/ca/`)
# and drops the ambiguous ones.
BACKTICK = re.compile(r"`([A-Za-z0-9_.][A-Za-z0-9_./-]*/[A-Za-z0-9_./-]*\.(?:md|ya?ml|sh|py|txt))`")
MDLINK = re.compile(r"\[[^\]]*\]\(([^)#\s]+)(?:#[^)\s]*)?\)")
BACKTICK_DIR = re.compile(r"`((?:\./|\.\./)[A-Za-z0-9_./-]*/)`")

# Placeholders that are meant to be filled in by a contributor, not resolved.
PLACEHOLDER = re.compile(r"<[^>]+>")


def _iter_docs(root: Path):
    for p in sorted(root.rglob("*")):
        if p.is_dir() or any(part in SKIP_DIRS for part in p.parts):
            continue
        if p.suffix in {".md", ".yaml", ".yml"}:
            yield p


def check_links(root: Path) -> list[str]:
    """Every relative path cited in a doc must resolve to something that exists."""
    problems: list[str] = []
    for path in _iter_docs(root):
        text = path.read_text(encoding="utf-8", errors="replace")
        for lineno, line in enumerate(text.splitlines(), 1):
            targets = set()
            targets.update(BACKTICK.findall(line))
            targets.update(BACKTICK_DIR.findall(line))
            for raw in MDLINK.findall(line):
                if not raw.startswith(("http://", "https://", "mailto:")):
                    targets.add(raw)
            for target in targets:
                if PLACEHOLDER.search(target):
                    continue  # `jurisdictions/<code>/04_retention.md`: a template, by design
                # Prose in this corpus cites a file two ways: relative to the citing document,
                # and repo-root-relative when naming it as a location. Accept either; only a
                # target that resolves under neither is a finding.
                #
                # ⚠️ `removeprefix("./")`, NOT `lstrip("./")`. lstrip strips CHARACTERS, not a
                # prefix, so it ate the leading dot of every dot-directory: `.claude/docs/x.md`
                # became `claude/docs/x.md` and was reported dangling while the file was right
                # there. It went unnoticed for as long as no document cited a dot-directory by
                # a root-relative path, and it reported the one thing this check exists to
                # report — a broken link — about a file that existed. Strictly stricter: it
                # strips less, so it can only catch more.
                if (path.parent / target).resolve().exists():
                    continue
                if (root / target.removeprefix("./")).resolve().exists():
                    continue
                rel = path.relative_to(root)
                problems.append(f"{rel}:{lineno}: dangling path -> {target}")
    return problems


def check_pack_claims(root: Path) -> list[str]:
    """A pack may not claim a review it cannot show."""
    problems: list[str] = []
    packs = root / "jurisdictions"
    if not packs.is_dir():
        return problems
    for pack_yaml in sorted(packs.rglob("pack.yaml")):
        d = pack_yaml.parent
        rel = pack_yaml.relative_to(root)
        y = pack_yaml.read_text(encoding="utf-8", errors="replace")

        m = re.search(r"^\s*state:\s*(\w+)", y, re.M)
        if not m:
            problems.append(f"{rel}: no review.state. Every pack must declare one")
            continue
        state = m.group(1)
        if state not in {"unreviewed", "partial", "reviewed"}:
            problems.append(f"{rel}: review.state '{state}' is not one of unreviewed|partial|reviewed")

        status = d / "00_status.md"
        if not status.is_file():
            problems.append(f"{rel}: no 00_status.md beside it. A pack without a status file is a bare legal claim")
            continue
        s = status.read_text(encoding="utf-8", errors="replace")

        if state in {"partial", "reviewed"}:
            if "UNREVIEWED" in s and "Review state" in s:
                problems.append(
                    f"{rel}: review.state is '{state}' but 00_status.md still declares UNREVIEWED"
                )
            if re.search(r"^\|\s*Reviewer role\s*\|\s*—?\s*\|", s, re.M):
                problems.append(
                    f"{rel}: review.state is '{state}' with no reviewer role recorded in 00_status.md"
                )

        # A capability flag may never be true while the pack is unreviewed. Everything the
        # product switches on for a user is gated on a practitioner having read the page.
        if state == "unreviewed":
            for cap in re.finditer(r"^\s{2}(\w+):\s*true\b", y, re.M):
                problems.append(
                    f"{rel}: capability '{cap.group(1)}' is true while the pack is unreviewed"
                )

        # A name where a role belongs. Cannot be caught structurally in general, this only
        # catches the obvious shape, and says so.
        if re.search(r"reviewer_role:\s*['\"]?[A-Z][a-z]+ [A-Z][a-z]+", y):
            problems.append(
                f"{rel}: reviewer_role looks like a personal name. Record a ROLE only"
            )
    return problems


CHECKS = (("link integrity", check_links), ("pack claims", check_pack_claims))


def run(root: Path) -> list[str]:
    out: list[str] = []
    for _, fn in CHECKS:
        out.extend(fn(root))
    return out


def selftest() -> int:
    """Prove each check fires. A check that cannot fail is not a check."""
    failures = []
    with tempfile.TemporaryDirectory() as td:
        t = Path(td)

        # 1. dangling path is caught
        (t / "sub").mkdir()
        (t / "a.md").write_text("see `sub/nope.md` for detail\n")
        if not check_links(t):
            failures.append("link integrity did not catch a dangling path")

        # 2. an existing path is not flagged, and a <placeholder> is left alone
        (t / "sub" / "real.md").write_text("ok\n")
        (t / "b.md").write_text("see `sub/real.md` and `jurisdictions/<code>/04_retention.md`\n")
        if [q for q in check_links(t) if "b.md" in q]:
            failures.append("link integrity flagged a valid path or a placeholder")

        # 3. a bare filename with no separator is NOT treated as a path
        (t / "c.md").write_text("the contract is `tree.yaml` and status is `00_status.md`\n")
        if [q for q in check_links(t) if "c.md" in q]:
            failures.append("link integrity treated a bare filename as a path")

        # 4. a repo-root-relative citation resolves even from a nested file
        (t / "sub" / "d.md").write_text("see `sub/real.md`\n")
        if [q for q in check_links(t) if "d.md" in q]:
            failures.append("link integrity did not accept a root-relative citation")

        # 4b. a DOT-DIRECTORY cited root-relatively resolves, and a missing one still fails.
        #     Both directions, because the bug this replaces reported a real file as dangling:
        #     `lstrip("./")` stripped the leading dot and looked for `dot/…` instead.
        (t / ".dotdir").mkdir()
        (t / ".dotdir" / "real.md").write_text("ok\n")
        #     ⚠️ The filters below anchor on `<name>.md:` with the colon. A bare `"e.md" in q`
        #     matches fixture 1's own `-> sub/nope.md`, so the positive half failed on a
        #     problem belonging to another fixture. A substring is not a selector.
        #     ⛔ The citing file must sit in a SUBDIRECTORY or this fixture pins nothing: from
        #     the root the relative branch resolves first and the root-relative branch is never
        #     reached, so it passes under the broken spelling too. Verified by planting.
        (t / "sub" / "e.md").write_text("see `.dotdir/real.md` for detail\n")
        if [q for q in check_links(t) if "e.md:" in q]:
            failures.append("link integrity flagged a real file under a dot-directory")
        (t / "sub" / "f.md").write_text("see `.dotdir/nope.md` for detail\n")
        if not [q for q in check_links(t) if "f.md:" in q]:
            failures.append("link integrity did not catch a dangling dot-directory path")

        # 5. a pack claiming review with no reviewer is caught
        d = t / "jurisdictions" / "xx"
        d.mkdir(parents=True)
        (d / "pack.yaml").write_text("review:\n  state: reviewed\n  reviewer_role: null\n")
        (d / "00_status.md").write_text("| Reviewer role |  |\n")
        if not any("no reviewer role" in p for p in check_pack_claims(t)):
            failures.append("pack claims did not catch a review with no reviewer")

        # 6. a capability true on an unreviewed pack is caught
        (d / "pack.yaml").write_text(
            "review:\n  state: unreviewed\ncapabilities:\n  hazard_wording_available: true\n"
        )
        if not any("while the pack is unreviewed" in p for p in check_pack_claims(t)):
            failures.append("pack claims did not catch a capability enabled on an unreviewed pack")

        # 7. a clean unreviewed pack passes
        (d / "pack.yaml").write_text(
            "review:\n  state: unreviewed\ncapabilities:\n  hazard_wording_available: false\n"
        )
        if check_pack_claims(t):
            failures.append("pack claims flagged a clean unreviewed pack")

    for f in failures:
        print(f"selftest FAIL: {f}", file=sys.stderr)
    if failures:
        return 1
    print("selftest ok, every check fired when it should and stayed quiet when it should")
    return 0


def main(argv: list[str]) -> int:
    if "--selftest" in argv:
        return selftest()

    scanned = sum(1 for _ in _iter_docs(ROOT))
    if scanned == 0:
        # Fail closed. Green on zero scanned bytes is the worst failure a gate has.
        print("FAIL: scanned 0 documents. Refusing to report a pass", file=sys.stderr)
        return 2

    problems = run(ROOT)
    print(f"scanned {scanned} document(s)")
    if problems:
        print(f"\n{len(problems)} problem(s):", file=sys.stderr)
        for p in problems:
            print(f"  {p}", file=sys.stderr)
        return 1
    print("PASS: no dangling paths, no over-claiming pack")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
