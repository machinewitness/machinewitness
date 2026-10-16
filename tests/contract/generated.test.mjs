/**
 * tests/contract/generated.test.mjs. The generated provider trees are fresh.
 *
 * skill/ is the source of truth. `.claude/`, `.codex/` and `plugin/` are
 * GENERATED (STATE D3). A hand-edit of a generated file must FAIL here, because
 * the alternative is provider trees that silently disagree with the skill and
 * with each other, and one of them is what a user actually loads.
 *
 * skills-lock.json records a sha256 for every SOURCE file and every GENERATED
 * file, so this catches all four drift shapes:
 *
 *   - a generated file edited by hand          → generated hash mismatch
 *   - a source file edited without a rebuild   → source hash mismatch
 *   - a generated file added by hand           → set mismatch (extra)
 *   - a generated file deleted                 → set mismatch (missing)
 *
 * ⚠️ The set comparison is the half people forget. Hash-only checking passes an
 * added file, because nothing recorded its absence.
 *
 * 🔴 AND THERE IS A FIFTH SHAPE THE LOCK CANNOT SEE AT ALL: a file the generator
 * never emitted in the first place. The lock is written by the same run of the
 * same generator that wrote the trees, so it is self-consistent by construction:
 * it records what WAS produced, never what is REQUIRED. The last section of this
 * file therefore states the runtime requirement independently. Read the comment
 * above it before touching it.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LOCK_PATH = join(REPO, 'skills-lock.json');

const abs = (relPath) => join(REPO, ...relPath.split('/'));
const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function listFiles(relDir) {
  const root = abs(relDir);
  if (!existsSync(root)) return [];
  const out = [];
  const walk = (dirRel) => {
    for (const e of readdirSync(abs(dirRel), { withFileTypes: true })) {
      if (e.name === '.DS_Store') continue;
      const childRel = `${dirRel}/${e.name}`;
      if (e.isDirectory()) walk(childRel);
      else if (e.isFile()) out.push(childRel);
    }
  };
  walk(relDir);
  return out.sort();
}

assert.ok(
  existsSync(LOCK_PATH),
  'skills-lock.json is missing. Run `node scripts/build.mjs`. The generated trees are not optional.',
);
const lockBytes = readFileSync(LOCK_PATH);
assert.ok(lockBytes.length > 0, 'skills-lock.json is empty');
const lock = JSON.parse(lockBytes.toString('utf8'));

test('the lockfile is non-empty and well-formed', () => {
  assert.equal(lock.version, 1);
  assert.equal(lock.algorithm, 'sha256');
  assert.equal(lock.generator, 'scripts/build.mjs');
  assert.equal(lock.skill, 'machine-witness');
  assert.deepEqual(lock.providers, ['claude', 'codex']);
  assert.ok(Object.keys(lock.source).length > 0, 'lock records zero source files');
  assert.ok(Object.keys(lock.generated).length > 0, 'lock records zero generated files');
});

test('every SOURCE file still hashes to what the lock recorded', () => {
  let checked = 0;
  for (const [relPath, recorded] of Object.entries(lock.source)) {
    assert.ok(existsSync(abs(relPath)), `lock names a missing source file: ${relPath}`);
    assert.equal(
      sha256(readFileSync(abs(relPath))),
      recorded,
      `${relPath} changed since the last build. Run \`node scripts/build.mjs\``,
    );
    checked += 1;
  }
  assert.ok(checked > 0, 'checked zero source files');
});

test('every GENERATED file still hashes to what the lock recorded', () => {
  let checked = 0;
  for (const [relPath, recorded] of Object.entries(lock.generated)) {
    assert.ok(
      existsSync(abs(relPath)),
      `lock names a missing generated file: ${relPath}. ` +
        'If this fails only in CI, the generated tree is not committed. Check .gitignore.',
    );
    assert.equal(
      sha256(readFileSync(abs(relPath))),
      recorded,
      `${relPath} was hand-edited. Generated trees are not editable, edit skill/ and rebuild.`,
    );
    checked += 1;
  }
  assert.ok(checked > 0, 'checked zero generated files');
});

test('the generated file SET matches the lock exactly. An added file fails too', () => {
  const roots = [
    '.claude/skills/machine-witness',
    '.codex/skills/machine-witness',
    'plugin/skills/machine-witness',
  ];
  const onDisk = new Set(roots.flatMap((r) => listFiles(r)));
  assert.ok(onDisk.size > 0, 'found no generated files on disk. The scan is broken');

  const recorded = new Set(Object.keys(lock.generated));

  // ⚠️ Some generated files live inside skill/ rather than under a provider root:
  // the contract pair, and the jurisdiction pack pair. They used to be TWO PATHS
  // TYPED HERE, which meant adding a third build output made this test report it
  // as missing from disk while it sat on disk. Derived from the lock now, and each
  // one proven to exist, so a new pair is covered without an edit and a genuinely
  // absent file still fails, with a message that says which.
  const insideSkill = [...recorded].filter((p) => p.startsWith('skill/')).sort();
  assert.ok(
    insideSkill.length > 0,
    'the lock records no generated file inside skill/. The contract pair belongs ' +
      'there, so this scan is reading the wrong thing.',
  );
  for (const p of insideSkill) {
    assert.ok(existsSync(abs(p)), `the lock names a generated file that is not on disk: ${p}`);
    onDisk.add(p);
  }

  // …and the other direction, for that same directory: everything under
  // skill/data/ is either the YAML source of record or a build output, so a build
  // output there that the lock does not know about is an undeclared generated file.
  const dataFiles = listFiles('skill/data');
  assert.ok(dataFiles.length > 0, 'skill/data/ is empty. The scan is broken');
  const undeclared = dataFiles.filter((p) => !p.endsWith('.yaml') && !recorded.has(p)).sort();
  assert.deepEqual(
    undeclared,
    [],
    `a build output under skill/data/ is not in the lock: ${undeclared.join(', ')}`,
  );
  const extra = [...onDisk].filter((p) => !recorded.has(p)).sort();
  const missing = [...recorded].filter((p) => !onDisk.has(p)).sort();
  assert.deepEqual(extra, [], `generated files not in the lock: ${extra.join(', ')}`);
  assert.deepEqual(missing, [], `lock entries not on disk: ${missing.join(', ')}`);
});

test('plugin/ is a byte-identical mirror of .claude/', () => {
  const from = listFiles('.claude/skills/machine-witness');
  const to = listFiles('plugin/skills/machine-witness');
  assert.ok(from.length > 0, '.claude/skills/machine-witness is empty');
  assert.deepEqual(
    to.map((p) => p.replace('plugin/skills/', '')),
    from.map((p) => p.replace('.claude/skills/', '')),
    'plugin/ and .claude/ hold different files',
  );
  for (const src of from) {
    const dst = src.replace('.claude/skills/', 'plugin/skills/');
    assert.equal(sha256(readFileSync(abs(src))), sha256(readFileSync(abs(dst))), `${dst} differs`);
  }
});

/** A readable one-line report of where two long strings first diverge. */
function firstDifference(actual, expected) {
  const a = actual.split('\n');
  const e = expected.split('\n');
  for (let i = 0; i < Math.max(a.length, e.length); i += 1) {
    if (a[i] !== e[i]) {
      return `line ${i + 1}\n    generated: ${JSON.stringify(a[i])}\n    expected:  ${JSON.stringify(e[i])}`;
    }
  }
  return 'no line differs (trailing bytes?)';
}

test('each generated SKILL.md is SKILL.src.md with exactly the three substitutions', () => {
  // ⚠️ NOT a cross-provider diff. SKILL.src.md legitimately names `.claude/` and
  // `.codex/` in its own prose, so normalising one provider root away makes the
  // two copies look divergent when they are correct. Reconstruct each expected
  // output from the source instead. That also proves nothing ELSE was rewritten.
  const src = readFileSync(abs('skill/SKILL.src.md'), 'utf8');
  assert.ok(src.includes('{{scripts_path}}'), 'SKILL.src.md has no {{scripts_path}} to substitute');

  const hint = lock.commands.join('|');
  assert.ok(hint.length > 0, 'the lock records no commands');

  for (const providerRoot of ['.claude', '.codex']) {
    const expected = src
      .split('{{scripts_path}}')
      .join(`${providerRoot}/skills/machine-witness/scripts`)
      .split('{{command_prefix}}')
      .join(lock.command_prefix)
      .split('{{command_hint}}')
      .join(hint);
    const actual = readFileSync(abs(`${providerRoot}/skills/machine-witness/SKILL.md`), 'utf8');
    assert.ok(actual.length > 0, `${providerRoot} SKILL.md is empty`);
    assert.equal(
      sha256(Buffer.from(actual, 'utf8')),
      sha256(Buffer.from(expected, 'utf8')),
      `${providerRoot}/skills/machine-witness/SKILL.md is not SKILL.src.md + the three ` +
        `substitutions. First difference at ${firstDifference(actual, expected)}`,
    );
  }
});

test('the two providers really were substituted differently', () => {
  const claude = readFileSync(abs('.claude/skills/machine-witness/SKILL.md'), 'utf8');
  const codex = readFileSync(abs('.codex/skills/machine-witness/SKILL.md'), 'utf8');
  assert.notEqual(claude, codex, 'the two providers generated identical files. Did substitution run?');
  assert.ok(claude.includes('.claude/skills/machine-witness/scripts'), 'claude scripts_path missing');
  assert.ok(codex.includes('.codex/skills/machine-witness/scripts'), 'codex scripts_path missing');
  assert.ok(!codex.includes('Bash(python3 .claude/'), 'codex allowed-tools points at .claude/');
});

test('no placeholder survives into any generated file', () => {
  let scanned = 0;
  for (const relPath of Object.keys(lock.generated)) {
    if (!/\.(md|json|yaml|yml|py|txt)$/.test(relPath)) continue;
    const text = readFileSync(abs(relPath), 'utf8');
    for (const key of ['scripts_path', 'command_prefix', 'command_hint']) {
      assert.ok(!text.includes(`{{${key}}}`), `{{${key}}} survived into ${relPath}`);
    }
    scanned += 1;
  }
  assert.ok(scanned > 0, 'scanned zero generated files for placeholders');
});

test('the contract is copied into the generated trees byte-for-byte', () => {
  // ⛔ The template pass must never touch skill/data/. A substitution inside the
  // contract would corrupt it silently.
  const source = readFileSync(abs('skill/data/tree.yaml'));
  for (const root of [
    '.claude/skills/machine-witness',
    '.codex/skills/machine-witness',
    'plugin/skills/machine-witness',
  ]) {
    const copied = abs(`${root}/data/tree.yaml`);
    assert.ok(existsSync(copied), `${root}/data/tree.yaml is missing`);
    assert.equal(sha256(readFileSync(copied)), sha256(source), `${root}/data/tree.yaml was altered`);
  }
});

/* ── RUNTIME-INPUT PRESENCE ────────────────────────────────────────────────────
 *
 * 🔴 THIS SECTION ENUMERATES ITS REQUIREMENTS ON PURPOSE. Do not "simplify" it
 * into a comparison against skills-lock.json, that is the exact form that let
 * the defect it exists for ship green.
 *
 * The defect: scripts/build.mjs emitted data/tree.json and data/tree.sha256 into
 * skill/data/ and never copied them into any provider tree. The whole suite passed,
 * 26 of 26, because the lock is written by the same run of the same generator
 * that wrote the trees. The lock recorded what was emitted, the trees held what
 * was emitted, and the two agreed perfectly about a set that was missing the
 * engine's two most load-bearing files. A diff against the lock is structurally
 * incapable of seeing an omission: nothing in it records that a file is REQUIRED,
 * only whether it was produced.
 *
 * So the requirement is stated here, from the engine's side. The generated
 * provider tree is what a user installs and what the engine runs from.
 * `allowed-tools` is `Bash(python3 <that tree>/scripts/*)`, so the engine resolves
 * its contract relative to ITSELF. It reads data/tree.json, verifies
 * data/tree.sha256, and REFUSES on mismatch (ADR 0007 decision 6 · STATE D20 ·
 * PHASE_1 deliverable 1). Nothing on a user path can parse YAML, so a tree
 * carrying only tree.yaml cannot start at all.
 *
 * Add an entry when the engine gains a runtime input. Never derive this list from
 * the generator's own output.
 */

const PROVIDER_ROOTS = [
  '.claude/skills/machine-witness',
  '.codex/skills/machine-witness',
  'plugin/skills/machine-witness',
];

// Named here rather than discovered. `data/tree.yaml` is the contract of record
// and ships so the JSON can be audited against it; the engine reads the JSON.
const REQUIRED_RUNTIME_FILES = [
  'SKILL.md',
  'data/tree.yaml',
  'data/tree.json',
  'data/tree.sha256',
];

test('every runtime input the engine needs is present and non-empty in each provider tree', () => {
  let checked = 0;
  for (const root of PROVIDER_ROOTS) {
    for (const tail of REQUIRED_RUNTIME_FILES) {
      const p = abs(`${root}/${tail}`);
      assert.ok(
        existsSync(p),
        `${root}/${tail} is MISSING. The installed engine cannot start without it, ` +
          'it is a runtime input, not a build artifact of skill/. Run `node scripts/build.mjs`.',
      );
      assert.ok(readFileSync(p).length > 0, `${root}/${tail} is EMPTY`);
      checked += 1;
    }
  }
  assert.equal(checked, PROVIDER_ROOTS.length * REQUIRED_RUNTIME_FILES.length);
  assert.ok(checked > 0, 'checked zero runtime inputs. The scan is broken');
});

/**
 * Read a required runtime file, proving it exists and is non-empty BEFORE judging
 * its content. A raw ENOENT stack is a worse diagnostic than a named assertion,
 * and judging bytes you never read is how a check reports on nothing.
 */
function readRuntime(relPath) {
  const p = abs(relPath);
  assert.ok(existsSync(p), `${relPath} is MISSING. The installed engine cannot start without it`);
  const bytes = readFileSync(p);
  assert.ok(bytes.length > 0, `${relPath} is EMPTY`);
  return bytes;
}

test("each provider tree's tree.sha256 matches the bytes of its OWN sibling tree.json", () => {
  // The digest is computed HERE, from the bytes on disk, so this cannot inherit a
  // digest the generator got wrong. The recorded name must stay a bare sibling
  // filename, because that is what makes
  //     cd <provider tree>/data && shasum -a 256 -c tree.sha256
  // verify from inside the INSTALLED tree and not only from skill/data/.
  let checked = 0;
  for (const root of PROVIDER_ROOTS) {
    const jsonBytes = readRuntime(`${root}/data/tree.json`);
    const shaText = readRuntime(`${root}/data/tree.sha256`).toString('utf8');
    assert.ok(shaText.trim().length > 0, `${root}/data/tree.sha256 is blank`);

    const [recorded, named] = shaText.trim().split(/\s+/);
    assert.match(recorded, /^[0-9a-f]{64}$/, `${root}/data/tree.sha256 is not a sha256 digest`);
    assert.equal(
      named,
      'tree.json',
      `${root}/data/tree.sha256 must name its sibling by bare filename so it verifies ` +
        'from inside this directory',
    );
    assert.equal(
      recorded,
      sha256(jsonBytes),
      `${root}/data/tree.sha256 does not match ${root}/data/tree.json. The engine would refuse ` +
        'to start. Run `node scripts/build.mjs`.',
    );
    checked += 1;
  }
  assert.equal(checked, PROVIDER_ROOTS.length);
});

test("each provider tree's tree.json deep-equals the canonical skill/data/tree.json", () => {
  const canonicalBytes = readRuntime('skill/data/tree.json');
  const canonical = JSON.parse(canonicalBytes.toString('utf8'));
  assert.ok(Object.keys(canonical).length > 0, 'skill/data/tree.json parsed to an empty object');

  let checked = 0;
  for (const root of PROVIDER_ROOTS) {
    const copyBytes = readRuntime(`${root}/data/tree.json`);
    // Deep-equal first, so a failure names the divergent field rather than two
    // opaque hashes. Then byte-equal, because the digest in tree.sha256 is over
    // bytes: the contract is COPIED, never re-serialised per provider.
    assert.deepStrictEqual(
      JSON.parse(copyBytes.toString('utf8')),
      canonical,
      `${root}/data/tree.json is not the canonical contract`,
    );
    assert.equal(
      sha256(copyBytes),
      sha256(canonicalBytes),
      `${root}/data/tree.json differs BYTE-wise from skill/data/tree.json`,
    );
    checked += 1;
  }
  assert.equal(checked, PROVIDER_ROOTS.length);
});

test('allowed-tools names no node entry on any user path', () => {
  // STATE D32 / ROADMAP §7: Node is a BUILD tool. Draft 1 copied
  // `Bash(node .../context.mjs)` into a user path while claiming
  // Python-stdlib-only. This is the generated tree, what a user actually loads.
  let checked = 0;
  for (const root of [
    '.claude/skills/machine-witness',
    '.codex/skills/machine-witness',
    'plugin/skills/machine-witness',
  ]) {
    const text = readFileSync(abs(`${root}/SKILL.md`), 'utf8');
    const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
    assert.ok(fm, `${root}/SKILL.md has no YAML frontmatter`);

    const block = fm[1].match(/^allowed-tools:\n((?:[ \t]+-.*\n?)+)/m);
    assert.ok(block, `${root}/SKILL.md frontmatter has no allowed-tools list`);
    const entries = block[1]
      .split('\n')
      .map((l) => l.replace(/^[ \t]*-[ \t]*/, '').trim())
      .filter(Boolean);
    assert.ok(entries.length > 0, `${root}/SKILL.md allowed-tools is empty`);

    for (const entry of entries) {
      assert.ok(
        !/\bnode\b|\.mjs\b|\bnpx\b/.test(entry),
        `${root}/SKILL.md allowed-tools puts Node on a user path: ${entry}`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'checked zero allowed-tools entries');
});
