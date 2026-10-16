/**
 * tests/rails/allowlist.test.mjs: the positive declaration, diffed against the
 * code, both ways.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHY A POSITIVE ALLOWLIST AND NOT A WORD BAN.
 *
 * The obvious enforcement for "nothing here touches another person" is a
 * repository-wide ban on the verbs, track, monitor, watch, surveil. It cannot
 * work, and the reason is structural rather than fixable: those verbs necessarily
 * appear in the doctrine that forbids them, in this file, and in the fixtures
 * below. A ban that must exempt the rail, the test and the fixture no longer
 * establishes the absence of the capability; it establishes only that somebody
 * remembered to exempt three files.
 *
 * An enumeration is falsifiable instead. Extract every child process, every
 * outbound shape and every open-for-write out of the code that ships on a user
 * path, diff it against `skill/allowlist.json`, and fail on anything undeclared.
 * Vocabulary survives separately, over human-facing strings, in
 * `copy-vocabulary.test.mjs`, with its exclusions stated at their sites.
 *
 * THE DIFF RUNS BOTH WAYS, and the second direction is the one that keeps this
 * honest: a declaration with no site behind it also fails. Without that, the
 * failure mode is an allowlist quietly edited to match whatever the code grew
 * into, a rubber stamp with a reason field.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  REPO,
  allowlist,
  capabilitySites,
  declaredKeys,
  diffAgainstDeclaration,
  extractSites,
  listUnder,
  proven,
  readRepo,
} from './_rails.mjs';

const list = allowlist();

/** The roots to scan, read from the declaration so the file drives the scan. */
const declaredRoots = proven('scanned_roots', list.scanned_roots ?? []).map((r) => r.path);

const SOURCE_EXTENSIONS = ['.py', '.js', '.mjs', '.cjs', '.ts', '.sh'];

const presentRoots = declaredRoots.filter((r) => existsSync(join(REPO, r)));
const absentRoots = declaredRoots.filter((r) => !existsSync(join(REPO, r)));

const scanned = presentRoots.flatMap((root) => listUnder(root, SOURCE_EXTENSIONS));

/* ── the scan read something ──────────────────────────────────────────────── */

test('the declaration is complete in shape, and every entry carries a reason', (t) => {
  for (const key of [
    'commands',
    'subprocesses',
    'network',
    'data_sources',
    'filesystem_writes',
    'external_tools',
    'scanned_roots',
  ]) {
    assert.ok(key in list, `skill/allowlist.json declares no ${key}`);
  }

  // A reason on every entry is what makes a change to this file self-documenting:
  // an entry cannot be added without a reason appearing in the diff.
  const reasonless = [];
  for (const key of ['commands', 'subprocesses', 'data_sources', 'filesystem_writes', 'external_tools', 'scanned_roots', 'out_of_scope', 'writes_outside_the_workspace']) {
    for (const entry of list[key] ?? []) {
      if (typeof entry.reason !== 'string' || entry.reason.trim().length < 20) {
        reasonless.push(`${key}: ${JSON.stringify(entry).slice(0, 80)}`);
      }
    }
  }
  assert.deepEqual(reasonless, [], `entries with no usable reason:\n${reasonless.join('\n')}`);

  t.diagnostic(`scanned roots present: ${presentRoots.join(', ') || 'none'}`);
  if (absentRoots.length > 0) {
    t.diagnostic(`scanned roots not written yet: ${absentRoots.join(', ')}`);
  }
  t.diagnostic(`source files extracted from: ${scanned.length}`);
});

test('every declared root that exists yielded source files', () => {
  proven('the scanned source set', scanned, { floor: 1 });
  for (const root of presentRoots) {
    const under = listUnder(root, SOURCE_EXTENSIONS);
    assert.ok(
      under.length > 0,
      `${root} is declared as a scanned root, exists, and holds no source file. ` +
        'The extractor would have read nothing and reported clean.',
    );
  }
});

test('the commands declared are the commands that ship', () => {
  const declared = proven('declared commands', list.commands).map((c) => c.name).sort();
  const shipped = listUnder('skill/reference', ['.md'])
    .map((f) => f.split('/').pop().replace(/\.md$/, ''))
    .sort();
  proven('the shipped command set', shipped, { floor: 5 });
  assert.deepEqual(
    declared,
    shipped,
    'the allowlist and skill/reference/ name different commands. The allowlist is ' +
      'meant to be exhaustive, so a command with no entry is an undeclared surface.',
  );
  for (const command of list.commands) {
    assert.ok(
      existsSync(join(REPO, command.reference)),
      `${command.name} names a reference file that does not exist: ${command.reference}`,
    );
  }
});

/**
 * 🔴 THE DECLARATION AND THE DOCUMENT MUST AGREE ABOUT WHAT RUNS, and this is not
 * bookkeeping. `cli/bin/mw.js` reads THIS field at run time to build its dispatch, so a
 * stale `runs` is something a person is told: `layers` was declared as `none, reads the
 * contract and reports` while `skill/reference/layers.md` says *do not walk the questions
 * from this document, run the engine* and gives the two invocations. The launcher
 * therefore answered `mw layers` with *"it has no program of its own"*, false, about the
 * command that walks the record questions.
 *
 * Nothing checked it. The test above compares the command NAMES and the existence of each
 * reference file and stops there, so the two halves of the same fact were free to
 * disagree. A positive allowlist is the enforcement mechanism for the rule that no
 * capability touches the other person, which makes a stale entry worse than a missing
 * one: it is the thing a reviewer trusts.
 *
 * ⚠️ ONE DIRECTION ONLY, AND THE OTHER IS STATED RATHER THAN ASSERTED. A reference that
 * invokes a script must have that script in its `runs`. The converse, a declared script
 * the reference does not invoke, is deliberately NOT asserted: `skill/reference/triage.md`
 * says *STATUS: stub, the body lands in the wave that builds the engine*, and `triage` does
 * run the engine. Requiring that document to invoke something would be requiring a stub to
 * document what it says it does not document yet, and the fix for that would be a file
 * exemption. Counted and printed below so the gap is visible rather than implied.
 */
const INVOKES_SCRIPT = /\bpython3\s+[^\s`]*?([A-Za-z0-9_]+\.py)\b/g;

/** The scripts a reference document invokes, by file name. */
function invokedBy(command) {
  const text = readRepo(command.reference);
  INVOKES_SCRIPT.lastIndex = 0;
  return [...new Set([...text.matchAll(INVOKES_SCRIPT)].map((m) => m[1]))];
}

/** Every command whose document invokes a script its declaration does not name. */
function undeclaredPrograms(commands) {
  const wrong = [];
  for (const command of commands) {
    const runs = (command.runs ?? '').trim();
    for (const script of invokedBy(command)) {
      if (!runs.includes(script)) {
        wrong.push(`${command.name}: ${command.reference} invokes ${script}, runs says ${JSON.stringify(runs)}`);
      }
    }
  }
  return wrong;
}

test('what a command runs agrees with what its own reference document invokes', (t) => {
  const withInvocation = list.commands.filter((c) => invokedBy(c).length > 0);
  // Non-empty first: if no reference invoked anything the check would read nothing and
  // report the same green as a tree where every declaration was right.
  proven('the commands whose reference invokes a program', withInvocation, { floor: 5 });

  assert.deepEqual(
    undeclaredPrograms(list.commands),
    [],
    'a command declares that it runs something other than what its reference document ' +
      'actually invokes.\n⛔ The launcher reads that field to decide what to start, so ' +
      'the person is the one who finds out.',
  );

  const silent = list.commands.filter((c) => invokedBy(c).length === 0).map((c) => c.name);
  t.diagnostic(
    `commands whose reference invokes a program: ${withInvocation.length} · ` +
      `whose reference invokes none: ${silent.length} (${silent.join(', ')}): the ` +
      'converse direction is not asserted for these, and one of them is a documented stub',
  );
});

test('and that check fires. Every declaration emptied in turn, and each one caught', (t) => {
  // 🔴 The planted value is the exact string that really shipped on `layers`, and it is
  // planted on EVERY command in turn rather than on the one that had it, so the check is
  // proven general rather than proven against the one case that produced it.
  const STALE = 'none, reads the contract and reports';
  const withInvocation = list.commands.filter((c) => invokedBy(c).length > 0);
  proven('the commands to mutate', withInvocation, { floor: 5 });
  const missed = [];
  for (const target of withInvocation) {
    const mutated = list.commands.map((c) => (c.name === target.name ? { ...c, runs: STALE } : c));
    if (undeclaredPrograms(mutated).length === 0) missed.push(target.name);
  }
  assert.deepEqual(missed, [], `the check did not fire on a stale declaration for: ${missed.join(', ')}`);
  t.diagnostic(`stale declarations planted one at a time and caught: ${withInvocation.length}`);
});

/* ── the diff, both ways ──────────────────────────────────────────────────── */

const extracted = capabilitySites(scanned);
const declared = declaredKeys(list);
const diff = diffAgainstDeclaration(extracted, declared);

test('nothing in the code has a capability the declaration does not admit to', () => {
  proven('the extracted capability sites', extracted.sites, { floor: 5 });
  assert.deepEqual(
    diff.undeclared.map((u) => `${u.key}  (${u.sites.length} site(s), first at line ${u.sites[0].line})`),
    [],
    'UNDECLARED CAPABILITY. Add it to skill/allowlist.json with a reason, or remove it ' +
      'from the code. ⛔ Do not remove it from the scan.',
  );
});

test('nothing in the declaration is a capability the code does not have', () => {
  assert.deepEqual(
    diff.dead,
    [],
    'DEAD DECLARATION, the allowlist claims a capability with no site behind it. ' +
      'This direction of the diff exists because an allowlist edited to match ' +
      'whatever the code grew into is a rubber stamp, and a dead entry is what one ' +
      'looks like on the way there.',
  );
});

test('there is no outbound shape anywhere on a user path', () => {
  assert.equal(list.network.outbound_allowed, false, 'the declaration permits outbound traffic');
  assert.deepEqual(list.network.endpoints, [], 'an endpoint is declared');
  assert.deepEqual(list.network.hostnames, [], 'a hostname is declared');
  assert.deepEqual(list.network.sockets, [], 'a socket is declared');
  assert.deepEqual(
    diff.network.map((n) => `${n.key} at line ${n.sites[0].line}: ${n.sites[0].text.slice(0, 90)}`),
    [],
    'a network shape appears in a scanned root. An endpoint is not an allowlist ' +
      'edit, it is a change of architecture, and it needs a row in RAIL_MATRIX.md ' +
      'before it needs a line in the declaration.',
  );
});

test('no capability is reached by building a name at run time', () => {
  assert.deepEqual(
    diff.indirect.map((n) => `${n.key} at line ${n.sites[0].line}: ${n.sites[0].text.slice(0, 90)}`),
    [],
    'An import by string, an attribute resolved off a module, or evaluated text ' +
      'defeats static extraction, so it cannot be declared, a declaration for it ' +
      'could not be checked. This is a hard failure rather than an entry.',
  );
});

test('every user-path entry point lies under a declared scanned root', () => {
  // Derived from what actually launches code: the skill's own tool permission,
  // and the package's command name. Not a list typed here.
  const skillSrc = readRepo('skill/SKILL.src.md');
  const allowedTools = [...skillSrc.matchAll(/^\s*-\s*(Bash\([^)]*\)|\S+)\s*$/gm)]
    .map((m) => m[1])
    .filter((entry) => entry.includes('('));
  proven('the allowed-tools entries', allowedTools);

  const paths = [];
  for (const entry of allowedTools) {
    for (const m of entry.matchAll(/([A-Za-z0-9_.{}/-]*\/[A-Za-z0-9_.{}/*-]+)/g)) paths.push(m[1]);
  }
  const bin = JSON.parse(readRepo('package.json')).bin ?? {};
  for (const target of Object.values(bin)) paths.push(target);
  proven('the entry-point paths', paths);

  const outside = paths.filter((p) => {
    const normalised = p.replace(/\{\{scripts_path\}\}/g, 'skill/scripts').replace(/^\.\//, '');
    return !declaredRoots.some((root) => normalised.startsWith(`${root}/`) || normalised === root);
  });
  assert.deepEqual(
    outside,
    [],
    `an entry point lives outside every declared scanned root: ${outside.join(', ')}. ` +
      'Add the root to scanned_roots with a reason. An unscanned entry point is an ' +
      'undeclared surface that the extractor never looks at.',
  );
});

/* ── the grant reaches the tool tree, and stops ────────────────────────────── */

/**
 * 🔴 A SINGLE `*` IN A TOOL PERMISSION DOES NOT CROSS A PATH SEPARATOR, and that
 * one fact is why this section exists. ADR 0008 decision 2.
 *
 * The grant that shipped was `Bash(python3 {{scripts_path}}/*)`: correct for a flat
 * script directory, and silently wrong the moment a tool lands one level down. The
 * failure does not arrive as a build error in front of a developer. It arrives as a
 * permission refusal in front of a person who has been accused of something, at the
 * moment they run the thing that was supposed to help them.
 *
 * ⛔ THE FIX IS NOT `**`. The grant is where RAIL 2 is drawn, and a boundary that
 * reaches everywhere is not a boundary. One bounded entry per depth the layout
 * actually has means a tool buried deeper than the design is DENIED, and adding a
 * depth is a visible diff in a file the rails check rather than something a
 * wildcard already covered.
 *
 * ⚠️ The reachability check below is only worth the semantics of its matcher, so
 * the last test in this section plants the pre-fix grant and requires the matcher
 * to reproduce the bug. If `*` were compiled as crossing a separator, every
 * assertion here would pass while establishing nothing.
 */

/** Every `allowed-tools` entry, read from the source of truth rather than typed. */
function grantEntries() {
  const block = readRepo('skill/SKILL.src.md').match(/^allowed-tools:\n((?:[ \t]+-.*\n?)+)/m);
  assert.ok(block, 'skill/SKILL.src.md frontmatter carries no allowed-tools list');
  return block[1]
    .split('\n')
    .map((l) => l.replace(/^[ \t]*-[ \t]*/, '').trim())
    .filter(Boolean);
}

/** The path pattern inside one entry, with the provider placeholder resolved. */
function grantPattern(entry) {
  const m = entry.match(/^Bash\(python3\s+(\S+)\)$/);
  return m ? m[1].replace(/\{\{scripts_path\}\}/g, 'skill/scripts') : null;
}

/** A permission pattern compiled with `*` NOT crossing a separator. */
function grantMatcher(pattern) {
  const body = pattern
    .split('*')
    .map((piece) => piece.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${body}$`);
}

function permitted(patterns, path) {
  return patterns.some((p) => grantMatcher(p).test(path));
}

/** Every directory under the script tree that holds a file. Read, never typed. */
function scriptDirectories() {
  const files = listUnder('skill/scripts');
  return [...new Set(files.map((f) => f.split('/').slice(0, -1).join('/')))].sort();
}

const GRANT_PATTERNS = grantEntries().map(grantPattern).filter(Boolean);

test('the grant reaches every directory the script tree actually has', (t) => {
  proven('the permission grant patterns', GRANT_PATTERNS);
  // Read off the tree, so a tool directory nothing can run fails HERE rather
  // than in front of the person it was written for.
  const dirs = proven('the script directories', scriptDirectories());

  const unreachable = dirs.filter((d) => !permitted(GRANT_PATTERNS, `${d}/tool.py`));
  assert.deepEqual(
    unreachable,
    [],
    `a script directory exists that no allowed-tools entry can reach: ${unreachable.join(', ')}.\n` +
      '⛔ Add one bounded entry for that depth in skill/SKILL.src.md. Do not replace ' +
      'the enumeration with a recursive glob: the grant is where RAIL 2 is drawn.',
  );
  t.diagnostic(`grant entries: ${GRANT_PATTERNS.length} · script directories reached: ${dirs.length}`);
});

test('and the grant stops. Outside the script tree, or deeper than it, is denied', () => {
  const DENIED = [
    { what: 'a path outside the script tree', path: 'skill/data/tree.json' },
    { what: 'the build tool, which is not a user path', path: 'scripts/build.mjs' },
    { what: 'the launcher, which the grant must not cover', path: 'cli/bin/mw.js' },
    { what: 'an absolute path anywhere on the machine', path: '/tmp/anything.py' },
    { what: 'deeper than the layout the grant enumerates', path: 'skill/scripts/a/b/c/d/tool.py' },
  ];
  proven('the denied set', DENIED, { floor: 5 });
  const wrongly = DENIED.filter((d) => permitted(GRANT_PATTERNS, d.path)).map((d) => d.what);
  assert.deepEqual(
    wrongly,
    [],
    `the grant permits something it must not: ${wrongly.join(', ')}. A widened glob is ` +
      'a widened surface, and this is the direction that makes it one.',
  );
});

test('the matcher reproduces the bug it exists to stop, so the checks above mean something', () => {
  // The grant exactly as it shipped, planted here rather than described.
  const ONE_STAR = ['skill/scripts/*'];
  assert.ok(
    permitted(ONE_STAR, 'skill/scripts/triage.py'),
    'the one-star grant does not even reach the engine in this matcher, so it models ' +
      'nothing and this control proves nothing',
  );
  assert.ok(
    !permitted(ONE_STAR, 'skill/scripts/shared/wearable.py'),
    'the matcher lets `*` cross a path separator. It therefore cannot see the defect ' +
      'this whole section exists to stop, and every assertion above it is vacuous.',
  );
  // …and the widened grant does reach it. Both halves, or the pair proves nothing.
  assert.ok(
    permitted(GRANT_PATTERNS, 'skill/scripts/shared/wearable.py'),
    'the shipped grant still cannot reach a tool one level down',
  );
  assert.ok(
    permitted(GRANT_PATTERNS, 'skill/scripts/jurisdiction/xx/source.py'),
    'the shipped grant cannot reach a jurisdiction-bound tool, which is two levels down',
  );
});

/* ── planted violations: each must be caught ──────────────────────────────── */

const FIXTURES = [
  {
    what: 'an undeclared child process',
    file: 'cli/fixture-runner.py',
    source: [
      'import subprocess',
      'def helpful():',
      '    return subprocess.check_output(["curl", "-s", "example.invalid"])',
    ].join('\n'),
    expect: 'undeclared',
  },
  {
    what: 'an undeclared open-for-write',
    file: 'cli/fixture-writer.py',
    source: [
      'def stash(where, what):',
      '    with open(where, "w", encoding="utf-8") as handle:',
      '        handle.write(what)',
    ].join('\n'),
    expect: 'undeclared',
  },
  {
    what: 'an undeclared outbound endpoint',
    file: 'cli/fixture-caller.py',
    source: [
      'import urllib.request',
      'def latest():',
      '    return urllib.request.urlopen("https://updates.example.invalid/v").read()',
    ].join('\n'),
    expect: 'network',
  },
  {
    what: 'a write hidden behind a path object',
    file: 'cli/fixture-path.py',
    source: ['from pathlib import Path', 'Path("/tmp/x").write_text("anything")'].join('\n'),
    expect: 'undeclared',
  },
  {
    what: 'an outbound endpoint in a JavaScript entry point',
    file: 'cli/bin/fixture-mw.js',
    source: ['const r = await fetch("https://telemetry.example.invalid/hit");', 'export default r;'].join('\n'),
    expect: 'network',
  },
];

test('the checker fires on every planted violation. A test that never failed is untested', () => {
  proven('the fixture set', FIXTURES, { floor: 5 });
  for (const fixture of FIXTURES) {
    const found = diffAgainstDeclaration(
      extractSites([{ file: fixture.file, text: fixture.source }]),
      declared,
    );
    const bucket = found[fixture.expect];
    assert.ok(
      bucket.length > 0,
      `the checker did NOT catch ${fixture.what} in ${fixture.file}. ` +
        `Expected a ${fixture.expect} finding; got none.\n${fixture.source}`,
    );
  }
});

test('the checker fires on a dead declaration', () => {
  const stale = new Map(declared);
  stale.set('subprocess:subprocess.Popen@skill/scripts/nothing-here.py', {
    call: 'subprocess.Popen',
    in: 'skill/scripts/nothing-here.py',
    reason: 'planted for this test. No such file and no such call',
  });
  const found = diffAgainstDeclaration(extracted, stale);
  assert.ok(
    found.dead.length > 0,
    'a declaration with no site behind it was not reported. The rubber-stamp ' +
      'direction of the diff is not working, which is the direction that matters ' +
      'once somebody is editing this file to make a run green.',
  );
});

/* ── the mutation set: semantic evasions, not the literal ─────────────────── */

const EVASIONS = [
  { what: 'import by string', source: 'mod = __import__("socket")\nmod.socket()' },
  { what: 'import through the import machinery', source: 'import importlib\nm = importlib.import_module("urllib.request")' },
  { what: 'an attribute resolved off a module', source: 'import os\nrunner = getattr(os, "sys" + "tem")\nrunner("id")' },
  { what: 'evaluated text', source: 'opener = eval("op" + "en")\nopener("/tmp/x", "w")' },
  { what: 'a function built from a string, in JavaScript', source: 'const go = new Function("return fetch");' },
];

test('the mutation set is caught as indirect, not waved through', () => {
  proven('the mutation set', EVASIONS, { floor: 5 });
  const missed = [];
  for (const evasion of EVASIONS) {
    const found = diffAgainstDeclaration(
      extractSites([{ file: 'cli/fixture-evasion.py', text: evasion.source }]),
      declared,
    );
    if (found.indirect.length === 0 && found.network.length === 0 && found.undeclared.length === 0) {
      missed.push(evasion.what);
    }
  }
  assert.deepEqual(
    missed,
    [],
    `the extractor did not notice: ${missed.join(', ')}. Each of these reaches a ` +
      'capability without naming it in a shape the extractor was taught.',
  );
});

test('the declaration says out loud what static extraction cannot establish', () => {
  const caveat = list.what_this_file_cannot_establish;
  assert.ok(
    typeof caveat === 'string' && caveat.length > 200,
    'the declaration does not state its own limits. A list of capabilities that ' +
      'reads as complete, over a technique that cannot be complete, is the same ' +
      'over-claim as a gate that reports a pass on nothing scanned.',
  );
  for (const needed of [/run time|runtime/i, /network/i]) {
    assert.ok(needed.test(caveat), `the stated limit does not mention ${needed}`);
  }
});
