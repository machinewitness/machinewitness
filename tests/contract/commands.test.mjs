/**
 * tests/contract/commands.test.mjs. The Commands table IS the command list.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ COUNT FROM THE FILESYSTEM AND FROM THE PARSED TABLE. NEVER FROM PROSE.
 *
 * This project has already shipped the failure this test exists to prevent: two
 * documents said "the seven hard exclusions" long after the list reached
 * fourteen (root CLAUDE.md §9 row 13). A builder trusting either would have
 * shipped a gate missing half its exclusions. A prose count of a contract is a
 * defect waiting to happen.
 *
 * So both numbers below are DERIVED, one by parsing SKILL.src.md's own table,
 * one by listing skill/reference/. They are then required to be equal, and equal
 * to the v0 ceiling, which is a recorded DECISION rather than a count of prose.
 *
 * The table parser here is deliberately a SECOND, stricter implementation, not
 * an import from scripts/build.mjs. Two independent routes to the same number
 * catch a bug in either; one route shared between build and test catches
 * nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(REPO, 'skill', 'SKILL.src.md');
const REF_DIR = join(REPO, 'skill', 'reference');

/**
 * The v0 command ceiling. This is a DECISION (STATE D23, ROADMAP §4.1) not a
 * count copied out of a document. Ten commands were deferred and `doctor` was
 * cut outright because no method backed it. A twelfth command needs a method
 * doc, a RAIL_MATRIX row, and a wave; changing this number without those three
 * is how scope crept back toward twenty-two.
 */
const V0_COMMAND_CEILING = 11;

const srcRaw = readFileSync(SRC, 'utf8');
assert.ok(srcRaw.length > 0, 'skill/SKILL.src.md is empty');

/** Strict markdown-table reader: returns the rows of the Commands table. */
function commandsTableRows(md) {
  const lines = md.split('\n');
  const isRow = (l) => {
    const t = l.trim();
    return t.startsWith('|') && t.endsWith('|') && t.length > 1;
  };
  const cells = (l) =>
    l
      .trim()
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());
  const isRule = (l) => cells(l).every((c) => /^:?-{2,}:?$/.test(c));

  for (let i = 0; i < lines.length; i += 1) {
    if (!isRow(lines[i])) continue;
    const header = cells(lines[i]).map((c) => c.toLowerCase());
    if (!header.some((c) => c.includes('command'))) continue;
    if (i + 1 >= lines.length || !isRow(lines[i + 1]) || !isRule(lines[i + 1])) continue;

    const rows = [];
    for (let j = i + 2; j < lines.length && isRow(lines[j]); j += 1) {
      if (isRule(lines[j])) continue;
      rows.push(cells(lines[j]));
    }
    if (rows.length > 0) return { header, rows };
  }
  throw new Error('no Commands table found in skill/SKILL.src.md');
}

/** `` `/mw init` `` / `` `{{command_prefix}} init` `` / `init` -> `init` */
function commandName(cell) {
  let s = String(cell ?? '').trim();
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  s = s.replace(/[`*_]/g, '');
  s = s.replace(/\{\{command_prefix\}\}/g, '');
  s = s.trim().replace(/^\/+/, '');
  s = s.replace(/^mw\s+/, '');
  const m = s.match(/^([a-z][a-z0-9-]*)/);
  return m ? m[1] : null;
}

const { rows } = commandsTableRows(srcRaw);
const tableCommands = rows.map((r) => commandName(r[0]));

const refFiles = readdirSync(REF_DIR)
  .filter((f) => f.endsWith('.md'))
  .sort();

test('the counts are derived, non-zero, and agree', () => {
  assert.ok(rows.length > 0, 'the Commands table parsed to zero rows. The parser is broken');
  assert.ok(refFiles.length > 0, 'skill/reference/ holds zero .md files');

  assert.equal(
    rows.length,
    refFiles.length,
    `Commands table has ${rows.length} rows but skill/reference/ has ${refFiles.length} files`,
  );
  assert.equal(
    rows.length,
    V0_COMMAND_CEILING,
    `v0 is ${V0_COMMAND_CEILING} commands (STATE D23). Found ${rows.length}.`,
  );
  assert.equal(refFiles.length, V0_COMMAND_CEILING);
});

test('every table row names a real command, and every reference file has a row', () => {
  const unparsed = rows.filter((r, i) => tableCommands[i] === null).map((r) => r[0]);
  assert.deepEqual(unparsed, [], `unparseable Command cells: ${unparsed.join(' | ')}`);

  assert.equal(
    new Set(tableCommands).size,
    tableCommands.length,
    `duplicate command in the table: ${tableCommands.join(' ')}`,
  );

  const fromFiles = refFiles.map((f) => f.replace(/\.md$/, '')).sort();
  assert.deepEqual(
    [...tableCommands].sort(),
    fromFiles,
    'the Commands table and skill/reference/ name different commands',
  );
});

test('every path referenced by SKILL.src.md resolves', () => {
  // Markdown link targets plus bare reference/ paths. Anchors, mailto: and
  // absolute URLs are out of scope; a dangling relative path is not.
  const targets = new Set();
  for (const m of srcRaw.matchAll(/\]\(([^)\s]+)\)/g)) targets.add(m[1]);
  for (const m of srcRaw.matchAll(/\breference\/[A-Za-z0-9._/-]+\.md\b/g)) targets.add(m[0]);
  for (const m of srcRaw.matchAll(/\bdata\/[A-Za-z0-9._/-]+\.(?:json|ya?ml|sha256)\b/g)) {
    targets.add(m[0]);
  }

  const checkable = [...targets].filter(
    (t) => !/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(t) && !t.startsWith('/'),
  );
  assert.ok(
    checkable.length > 0,
    'found zero relative paths to check in SKILL.src.md. The extraction is broken, ' +
      'and a check that resolves nothing is not a check',
  );

  const unresolved = [];
  for (const target of checkable) {
    const clean = target.split('#')[0];
    if (clean === '') continue;
    // Skill-relative first (that is how a loaded skill resolves its own
    // references), then repo-relative for docs/ and jurisdictions/ citations.
    const candidates = [join(REPO, 'skill', clean), join(REPO, clean)];
    if (!candidates.some((p) => existsSync(p))) unresolved.push(target);
  }
  assert.deepEqual(unresolved, [], `SKILL.src.md references paths that do not exist: ${unresolved.join(', ')}`);
});

test('every reference file is non-empty', () => {
  for (const f of refFiles) {
    const body = readFileSync(join(REF_DIR, f), 'utf8');
    assert.ok(body.trim().length > 0, `skill/reference/${f} is empty`);
  }
});

test('skills-lock.json records the same command list, in table order', () => {
  // Closes the loop with generated.test.mjs, which builds {{command_hint}} from
  // the lock. This is the independent parse the lock is checked against, so the
  // hint cannot be self-justifying.
  const lockPath = join(REPO, 'skills-lock.json');
  assert.ok(existsSync(lockPath), 'skills-lock.json is missing. Run `node scripts/build.mjs`');
  const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
  assert.deepEqual(
    lock.commands,
    tableCommands,
    "skills-lock.json's command list disagrees with SKILL.src.md's Commands table",
  );
  assert.equal(lock.commands.length, V0_COMMAND_CEILING);
});
