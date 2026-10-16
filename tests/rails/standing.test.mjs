/**
 * tests/rails/standing.test.mjs: the register agrees with the suite, and nothing
 * anywhere claims more.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE DELIVERABLE OF THIS WAVE IS A SENTENCE, AND THIS IS THE TEST OF IT.
 *
 * *Seven enforced, three partial, one deferred.* Never the flattened summary the
 * register forbids by name, and note that this file does not restate that phrase
 * either, so the count of its occurrences in the repository stays at exactly one. A
 * green suite that implies eleven is the exact failure this project keeps
 * rediscovering: a gate that scanned nothing printing the same green as a clean tree,
 * and then the wrapper written to report that gate doing it again.
 *
 * ⚠️ IT WAS SIX, AND THE NUMBER MOVED BECAUSE A RAIL WAS ACTUALLY ENFORCED, not
 * because anything was relabelled. RAIL 9's gate gained the two callers it had always
 * declared it needed. ⛔ Eight is not reachable in this version: RAIL 6's runtime test
 * is green and its row is still partial, because its doctrine is unresolved and a
 * default is not a resolution.
 *
 * So the counts in `RAIL_MATRIX.md` are not read as prose. The table is parsed, the
 * status markers are counted, and the totals block is required to agree. **A count of
 * a register written in prose is a defect waiting to happen**: this project shipped
 * one that said *seven* long after the list reached fourteen, so the only honest form
 * is a stated number checked against the rows it claims to count.
 *
 * ⚠️ A TRAP WORTH NAMING, because it will catch the next reader too. Searching this
 * repository for the forbidden summary CANNOT come back empty: one line of the matrix
 * *is* the prohibition, and it states the phrase in order to forbid it. Exactly one
 * file matches and that is correct. The assertion below is therefore *"the only
 * occurrence is the prohibition itself"*, ⛔ never *"there are no occurrences"*, and
 * ⛔ the matrix is not to be reworded to quieten a search.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPO, listUnder, proven, readRepo, tracked } from './_rails.mjs';

const MATRIX_FILE = 'RAIL_MATRIX.md';
const matrix = proven(MATRIX_FILE, readRepo(MATRIX_FILE), { floor: 4000 });

/* ── parse the register ───────────────────────────────────────────────────── */

const cellsOf = (line) =>
  line.trim().slice(1, -1).split('|').map((c) => c.trim());
const isRow = (line) => {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.length > 2;
};
const isRule = (line) => cellsOf(line).every((c) => /^:?-{2,}:?$/.test(c));

/** The rail table: the one whose header names a Rail column. */
function railRows() {
  const lines = matrix.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!isRow(lines[i])) continue;
    const header = cellsOf(lines[i]).map((c) => c.toLowerCase());
    if (header[0] !== 'rail') continue;
    if (!isRow(lines[i + 1]) || !isRule(lines[i + 1])) continue;
    const rows = [];
    for (let j = i + 2; j < lines.length && isRow(lines[j]); j += 1) {
      if (isRule(lines[j])) continue;
      rows.push(cellsOf(lines[j]));
    }
    if (rows.length > 0) return { header, rows };
  }
  throw new Error(`no rail table found in ${MATRIX_FILE}`);
}

/** The totals block: the one whose header's second column is a count. */
function totalsRows() {
  const lines = matrix.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (!isRow(lines[i])) continue;
    const header = cellsOf(lines[i]).map((c) => c.toLowerCase());
    if (header[1] !== 'count') continue;
    if (!isRow(lines[i + 1]) || !isRule(lines[i + 1])) continue;
    const rows = [];
    for (let j = i + 2; j < lines.length && isRow(lines[j]); j += 1) {
      if (isRule(lines[j])) continue;
      rows.push(cellsOf(lines[j]));
    }
    if (rows.length > 0) return rows;
  }
  throw new Error(`no totals block found in ${MATRIX_FILE}`);
}

const { header, rows } = railRows();
const totals = totalsRows();

const MARKERS = { '✅': 'enforced', '🟡': 'partial', '⬜': 'deferred' };

/**
 * The status marker of a row: the one that comes FIRST IN THE CELL.
 *
 * 🔴 NOT "the first marker in this object that the cell happens to contain", which is
 * what this used to be and which is a silent mis-parse waiting to happen. A status
 * cell legitimately mentions another state in its prose. *This half is fixed, this
 * half is not*, and under the old reading a `✅` anywhere in a partial row's text
 * reclassified the whole row as enforced, moving the derived counts with it. Found by
 * doing exactly that while correcting a stale cell.
 *
 * The cell is also required to BEGIN with its marker, below, so the status of a row is
 * never a matter of which sentence a reader gets to first.
 */
function markerOf(cell) {
  let best = null;
  for (const marker of Object.keys(MARKERS)) {
    const at = cell.indexOf(marker);
    if (at >= 0 && (best === null || at < best.at)) best = { marker, at };
  }
  return best;
}

/** `{ number, status, runtimeCell, fixtureCell }` per row, derived. */
const railsByStatus = { enforced: [], partial: [], deferred: [] };
const parsed = rows.map((cells) => {
  const number = Number(/\*\*(\d+)\*\*/.exec(cells[0])?.[1]);
  const statusCell = cells[cells.length - 1];
  const found = markerOf(statusCell);
  const marker = found?.marker;
  return {
    number,
    statusCell,
    status: marker ? MARKERS[marker] : null,
    invariant: cells[1],
    fixture: cells[2],
    runtime: cells[3],
  };
});
for (const row of parsed) if (row.status) railsByStatus[row.status].push(row.number);

/* ── the register is complete and well-formed ─────────────────────────────── */

test('the register parsed, and every row is a numbered rail with a status', (t) => {
  proven('the parsed rail rows', parsed, { floor: 11 });
  assert.deepEqual(
    header.slice(0, 4),
    ['rail', 'positive invariant', 'violating fixture', 'runtime test'],
    'the register columns changed; the three that do the work are the invariant, the ' +
      'fixture and the runtime test',
  );

  const numbers = parsed.map((r) => r.number);
  assert.ok(numbers.every((n) => Number.isInteger(n) && n > 0), `unparseable rail number in ${numbers}`);
  assert.equal(new Set(numbers).size, numbers.length, `a rail is listed twice: ${numbers}`);
  assert.deepEqual(
    [...numbers].sort((a, b) => a - b),
    Array.from({ length: numbers.length }, (_, i) => i + 1),
    `the rails are not a complete run from one: ${numbers.join(', ')}`,
  );

  const statusless = parsed.filter((r) => !r.status).map((r) => r.number);
  assert.deepEqual(statusless, [], `rail(s) with no status marker: ${statusless.join(', ')}`);

  // 🔴 AND THE MARKER IS THE FIRST THING IN THE CELL. A status cell whose prose
  // mentions another state before it states its own is ambiguous to a reader and was
  // ambiguous to this parser: a `✅` inside a partial row's text used to reclassify the
  // row and move the derived counts with it. The status of a rail is not allowed to
  // depend on which sentence anybody reaches first.
  const buried = parsed
    .filter((r) => !r.statusCell.trimStart().startsWith(Object.keys(MARKERS).find((m) => MARKERS[m] === r.status)))
    .map((r) => `rail ${r.number}: ${r.statusCell.slice(0, 60)}`);
  assert.deepEqual(
    buried,
    [],
    `status cell(s) do not BEGIN with their marker:\n  ${buried.join('\n  ')}\n` +
      'Put the marker first. Prose about another state belongs after it.',
  );
  t.diagnostic(`rails in the register: ${numbers.length}`);
});

test('no row has an empty invariant, fixture, or runtime-test cell', () => {
  const thin = [];
  for (const row of parsed) {
    for (const [what, value] of [
      ['positive invariant', row.invariant],
      ['violating fixture', row.fixture],
      ['runtime test', row.runtime],
    ]) {
      if (!value || value.replace(/[—–-]/g, '').trim().length < 20) {
        thin.push(`rail ${row.number}: ${what} is empty or a dash`);
      }
    }
  }
  assert.deepEqual(
    thin,
    [],
    `${thin.join('; ')}. A rail with an empty runtime-test cell is documented, not ` +
      'enforced, and this file is not allowed to leave that ambiguous.',
  );
});

/* ── the counts are derived, then checked against the stated ones ──────────── */

test('the stated totals agree with the rows they claim to count', (t) => {
  const stated = new Map();
  const statedRails = new Map();
  for (const cells of totals) {
    const marker = Object.keys(MARKERS).find((m) => cells[0].includes(m));
    if (!marker) continue;
    const count = Number(/\*\*(\d+)\*\*/.exec(cells[1])?.[1]);
    assert.ok(Number.isInteger(count), `the totals block has no count for ${cells[0]}`);
    stated.set(MARKERS[marker], count);
    statedRails.set(
      MARKERS[marker],
      (cells[2] ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n)),
    );
  }
  proven('the stated totals', [...stated.keys()], { floor: 3 });

  for (const [status, railNumbers] of Object.entries(railsByStatus)) {
    assert.equal(
      stated.get(status),
      railNumbers.length,
      `the totals block says ${stated.get(status)} ${status}; the rows say ` +
        `${railNumbers.length} (${railNumbers.join(', ')})`,
    );
    assert.deepEqual(
      [...(statedRails.get(status) ?? [])].sort((a, b) => a - b),
      [...railNumbers].sort((a, b) => a - b),
      `the totals block names the wrong rails as ${status}`,
    );
  }

  // The deliverable sentence, in numbers derived from the rows. ⛔ These three are
  // hard on purpose: they and the register go stale together, so a row promoted
  // without the totals block and this assertion moving with it fails here.
  assert.equal(railsByStatus.enforced.length, 7, 'the enforced count is no longer seven');
  assert.equal(railsByStatus.partial.length, 3, 'the partial count is no longer three');
  assert.equal(railsByStatus.deferred.length, 1, 'the deferred count is no longer one');
  t.diagnostic(
    `derived from the rows: ${railsByStatus.enforced.length} enforced ` +
      `(${railsByStatus.enforced.join(', ')}) · ${railsByStatus.partial.length} partial ` +
      `(${railsByStatus.partial.join(', ')}) · ${railsByStatus.deferred.length} deferred ` +
      `(${railsByStatus.deferred.join(', ')})`,
  );
});

/* ── every row names a test that exists, and every test is named ──────────── */

const RAIL_TESTS = listUnder('tests/rails', ['.test.mjs']);

test('every runtime-test cell names a test that exists', (t) => {
  const named = new Set();
  const missing = [];
  for (const row of parsed) {
    const cited = [...row.runtime.matchAll(/tests\/rails\/([a-z0-9-]+)(?:\.test\.mjs)?/g)].map(
      (m) => m[1],
    );
    assert.ok(
      cited.length > 0,
      `rail ${row.number}'s runtime-test cell names no test under tests/rails/`,
    );
    for (const name of cited) {
      named.add(name);
      if (!existsSync(join(REPO, 'tests', 'rails', `${name}.test.mjs`))) {
        missing.push(`rail ${row.number} -> tests/rails/${name}.test.mjs`);
      }
    }
  }
  assert.deepEqual(
    missing,
    [],
    `the register names test file(s) that do not exist:\n  ${missing.join('\n  ')}`,
  );
  t.diagnostic(`test files named by the register: ${[...named].sort().join(', ')}`);
});

test('every rail test is named somewhere in the register, no orphans', () => {
  proven('the rail test files', RAIL_TESTS, { floor: 10 });
  const orphans = RAIL_TESTS.filter((rel) => !matrix.includes(rel.split('/').pop()));
  assert.deepEqual(
    orphans,
    [],
    `test file(s) nobody accounts for: ${orphans.join(', ')}. A rail test the register ` +
      'does not mention is a check nobody is reading the result of.',
  );
});

/* ── the forbidden summary, and the trap in checking for it ───────────────── */

test('the only occurrence of the forbidden summary is the prohibition itself', (t) => {
  const phrase = /rails\s+are\s+enforced/i;
  const offenders = [];
  let occurrences = 0;
  for (const rel of tracked()) {
    if (!/\.(?:md|mjs|py|json|ya?ml|sh|txt|yml)$/.test(rel)) continue;
    const text = readRepo(rel);
    for (const line of text.split('\n')) {
      if (!phrase.test(line)) continue;
      occurrences += 1;
      const isProhibition =
        rel === MATRIX_FILE && /do not summarise|do not describe/i.test(line);
      if (!isProhibition) offenders.push(`${rel}: ${line.trim().slice(0, 140)}`);
    }
  }
  // 🔴 NON-EMPTY FIRST. A search for this phrase that finds nothing has not proved the
  // repository is clean, it has proved the search is broken, because the prohibition
  // states the phrase in order to forbid it.
  assert.ok(
    occurrences > 0,
    'the forbidden summary appears nowhere at all, including in the line that forbids ' +
      'it. Either the prohibition was reworded to quieten a search, which is exactly ' +
      'what must not happen, or this check is looking for the wrong words.',
  );
  assert.deepEqual(
    offenders,
    [],
    `something states the forbidden summary as a claim:\n  ${offenders.join('\n  ')}`,
  );
  t.diagnostic(
    `occurrences of the forbidden summary: ${occurrences}, all of them the ` +
      'prohibition in the register',
  );
});

/**
 * ⛔ THE ONE EXEMPT TREE, AND IT IS EXEMPT FOR A REASON THAT CANNOT EXPIRE.
 *
 * A decision record states the reasoning of ITS OWN MOMENT and is never retro-edited;
 * editing one destroys the only thing it is for. `docs/adr/0007` records the count as
 * it stood when the decision was taken, and it is now stale, deliberately, and
 * permanently.
 *
 * ⚠️ The exemption is asserted LIVE below, in both directions: the tree must actually
 * state a count (or the exemption is vestigial and hiding nothing), and the count it
 * states must be NARROWER than the register's (or the exemption is covering an
 * over-claim, which is the thing this check exists to catch). An exemption that
 * suppresses nothing, and an exemption that suppresses the wrong thing, are both
 * defects.
 */
const HISTORICAL = 'docs/adr/';

/** Every spoken enforced-count line in a file, with the number it names. */
const WORDS = ['five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
const SPOKEN_COUNT = new RegExp(String.raw`\b(${WORDS.join('|')})\b[^.]{0,40}\benforced\b`, 'i');

function spokenCounts(rel) {
  const out = [];
  for (const line of readRepo(rel).split('\n')) {
    const found = SPOKEN_COUNT.exec(line);
    if (!found) continue;
    out.push({ rel, line: line.trim().slice(0, 140), number: WORDS.indexOf(found[1].toLowerCase()) + 5 });
  }
  return out;
}

test('no other file states a different count from the register, broader OR narrower', () => {
  // 🔴 THE NUMBER IS DERIVED FROM THE ROWS, not typed here. A check that hard-coded
  // the word would have to be edited in step with the register, which is the drift it
  // is supposed to catch.
  const derived = railsByStatus.enforced.length;
  const spoken = [];
  const wrong = [];
  for (const rel of tracked()) {
    if (!/\.(?:md|json)$/.test(rel)) continue;
    if (rel === MATRIX_FILE) continue;
    if (rel.startsWith(HISTORICAL)) continue;
    for (const hit of spokenCounts(rel)) {
      spoken.push(`${rel}: ${hit.line}`);
      if (hit.number !== derived) wrong.push(`${rel}: ${hit.line}`);
    }
  }
  assert.ok(
    spoken.length > 0,
    'no file outside the register states the count at all, so this check has nothing ' +
      'to compare. The doctrine requires the honest count to be stated where a reader ' +
      'meets it.',
  );
  assert.deepEqual(
    wrong,
    [],
    `a file states a different enforced count from the register's ${derived}:\n  ${wrong.join('\n  ')}\n` +
      '⛔ The register is the single source of truth and the rule binds BOTH ways: a ' +
      'narrower claim misdirects the next reader just as a broader one misleads them.',
  );
});

test('the exempt decision-record tree is exempt for a live reason, and under-claims rather than over-claims', (t) => {
  const records = tracked().filter((rel) => rel.startsWith(HISTORICAL) && rel.endsWith('.md'));
  proven('the decision records', records, { floor: 1 });
  const stated = records.flatMap((rel) => spokenCounts(rel));

  // (a) The exemption suppresses something real. If no decision record states a count
  //     at all, this exemption is vestigial and must be deleted rather than kept.
  proven('the enforced counts stated in the decision records', stated, { floor: 1 });

  // (b) And what it suppresses is an UNDER-claim. A decision record naming MORE
  //     enforced rails than the register would be an over-claim wearing an
  //     exemption, which is exactly what must not pass.
  const derived = railsByStatus.enforced.length;
  const overClaiming = stated.filter((hit) => hit.number > derived);
  assert.deepEqual(
    overClaiming.map((hit) => `${hit.rel}: ${hit.line}`),
    [],
    'a decision record claims MORE enforced rails than the register does. The ' +
      'exemption exists because an ADR is never retro-edited, not to let one ' +
      'over-claim. ⛔ Do not edit the record. Work out why the register says less, ' +
      'and fix that.',
  );

  t.diagnostic(
    `decision records scanned: ${records.length} · enforced counts stated in them: ` +
      `${stated.map((hit) => hit.number).join(', ')} · derived from the register: ${derived} ` +
      '(the difference is RAIL 8, and the register is the superset)',
  );
});

/* ── the two membership statements, and the one that is deliberately stale ──── */

/** `RAILS 2, 5, 7, …` out of a sentence stating an enforced membership. */
function enforcedMembership(label, text) {
  const claim = new RegExp(
    String.raw`\b(?:${WORDS.join('|')})\b enforced\b[^(]{0,30}\(?RAILS?[^0-9]{0,3}([0-9,\s]+)`,
    'i',
  ).exec(text);
  assert.ok(claim, `${label} no longer states an enforced membership at all`);
  const rails = claim[1]
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n));
  return proven(`the membership stated by ${label}`, rails, { floor: 5 });
}

test('the skill definition’s MEMBERSHIP agrees with the register, rail for rail', () => {
  // ⚠️ THIS ASSERTION USED TO BE A BUG REPORT. `skill/SKILL.src.md` carried the phase
  // plan's TARGET membership (rail 9 in, rail 8 missing) which was right about how
  // many and wrong about which, and the file was another wave's to edit. It has been
  // corrected to state the register's derived membership, so the pin becomes an
  // equality check rather than a pinned difference. Kept, not deleted: it is what
  // stops the two drifting apart again, in either direction.
  const skill = proven('skill/SKILL.src.md', readRepo('skill/SKILL.src.md'), { floor: 2000 });
  const claimed = enforcedMembership('the skill definition', skill);

  const here = new Set(railsByStatus.enforced);
  const onlyInSkill = claimed.filter((n) => !here.has(n));
  const onlyInRegister = railsByStatus.enforced.filter((n) => !claimed.includes(n));
  assert.deepEqual(
    [onlyInSkill, onlyInRegister],
    [[], []],
    'the skill definition and this register no longer name the same enforced rails.\n' +
      `  stated by the skill definition: ${claimed.join(', ')}\n` +
      `  enforced per this register: ${railsByStatus.enforced.join(', ')}\n` +
      '⛔ The register is the single source of truth. Fix the skill definition, never ' +
      'this assertion, and if a row here moved, the totals block and the three hard ' +
      'counts above move with it.',
  );
  assert.equal(claimed.length, railsByStatus.enforced.length, 'the two counts no longer agree');
});

test('the decision record’s TARGET membership differs by exactly RAIL 8, and the register is the superset', (t) => {
  // ⛔ THE ONE DISAGREEMENT THAT STAYS, AND IT IS NOT TO BE FIXED. `docs/adr/0007`
  // states the target as it stood when the decision was taken, which omits RAIL 8.
  // finding #14, the row that did not exist at the time. An ADR is never retro-edited.
  //
  // What makes leaving it safe is the DIRECTION: this register's enforced set is a
  // superset of the record's, so the record under-claims. Pinned here so that if the
  // difference ever reverses (the record naming a rail this register does not enforce)
  // it fails, because that direction would be an over-claim nobody could edit away.
  const adr = proven(
    'docs/adr/0007-one-repo-agent-first.md',
    readRepo('docs/adr/0007-one-repo-agent-first.md'),
    { floor: 2000 },
  );
  const target = enforcedMembership('the decision record', adr);
  const here = new Set(railsByStatus.enforced);
  const onlyInRecord = target.filter((n) => !here.has(n));
  const onlyInRegister = railsByStatus.enforced.filter((n) => !target.includes(n));
  assert.deepEqual(
    [onlyInRecord, onlyInRegister],
    [[], [8]],
    'the difference between the decision record and this register is no longer ' +
      '"nothing there that is not here, and RAIL 8 here that is not there".\n' +
      `  the record's target: ${target.join(', ')}\n` +
      `  enforced per this register: ${railsByStatus.enforced.join(', ')}\n` +
      '⛔ Do not edit the decision record to make this pass. If the register lost a ' +
      'rail the record names, that is a rail that stopped being enforced and it is ' +
      'the thing to look at.',
  );
  t.diagnostic(
    `the decision record's target: ${target.join(', ')} · enforced now: ` +
      `${railsByStatus.enforced.join(', ')} · the register is the superset, by RAIL 8`,
  );
});

/* ── the blockers are still recorded ─────────────────────────────────────── */

test('the register still names what blocks full enforcement, and none of it as a task', () => {
  for (const needed of [
    /MW_DENYLIST/,
    /planted real surname passes/i,
    /contract amendments?/i,
    /with counsel/i,
    /badge-number class/i,
    /lawyer review/i,
  ]) {
    assert.ok(
      needed.test(matrix),
      `the register no longer records the blocker matching ${needed}. Each of these is ` +
        'somebody else\'s decision, and dropping one from the register is how it gets ' +
        'quietly treated as done.',
    );
  }
});

test('the register states how the tests are built, so a reader can judge a green', () => {
  for (const needed of [
    /non-empty input/i,
    /planted violating fixture/i,
    /mutation set/i,
    /trip-wire/i,
    /zero bytes/i,
  ]) {
    assert.ok(needed.test(matrix), `the register no longer states ${needed}`);
  }
});
