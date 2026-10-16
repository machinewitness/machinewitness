/**
 * tests/rails/harm-first.test.mjs: adverse material first, and no switch that
 * moves it.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⬜ THIS RAIL IS RED, AND RED IS THE CORRECT STATE. Its target does not exist.
 *
 * The rail governs a report generator: the thing that assembles what the records
 * say and puts what cuts AGAINST the person first, in the same detail as what helps.
 * There is no report generator in this version. It is deferred along with the
 * classification step, and it is UNBUILT rather than barred.
 *
 * ⚠️ THE REASON ON THIS RED CHANGED, AND THAT MATTERS MORE THAN THE RED DID. It used
 * to say the contract forbade asking what was alleged, so classifying against a claim
 * was impossible in principle. Amendment A1 deleted that prohibition — ADR 0009 —
 * which removed the doctrine standing in front of the only rail RAIL_MATRIX.md
 * records as absent. Nothing else changed: the generator still does not exist, so the
 * red is still correct, but it is now the honest kind. A stale reason on a registered
 * red is worse than a bare one, because it is read as a decision that has been made
 * and closed.
 *
 * ⛔ SO THIS TEST IS NOT POINTED AT A STUB. A test that passes because its target is
 * absent is this project's headline failure mode, and it has already shipped here
 * once: a wrapper reported green over a gate that read nothing. The real assertion
 * below runs, fails, and says why, and the trip-wire beside it fails the day the
 * generator appears, so the rail is demanded rather than inherited.
 *
 * ONE SLICE IS TESTABLE TODAY and it is checked as a trip-wire rather than as
 * enforcement: **no command anywhere exposes a switch that reorders, collapses, or
 * omits adverse material.** That is a real property of the surface as it stands, and
 * it is the property most likely to be added by accident. Somebody adds `--summary`
 * or `--brief` for good reasons and the harm-first ordering becomes optional. It
 * does not make the rail enforced, and the matrix row says so.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  REPO,
  allowlist,
  expectedRed,
  listUnder,
  planted,
  proven,
  readRepo,
  report,
  scan,
} from './_rails.mjs';

const OWNING_WAVE = 'deferred past this version, with the classification step';

/** Where a report generator would have to live for anything to be assertable. */
const GENERATOR_CANDIDATES = ['skill/scripts/report.py', 'skill/scripts/classify.py', 'cli/report.mjs'];

/* ── the real assertion, which fails ──────────────────────────────────────── */

function harmFirstIsEnforced() {
  const found = GENERATOR_CANDIDATES.filter((rel) => existsSync(join(REPO, rel)));
  assert.ok(
    found.length > 0,
    'THERE IS NO REPORT GENERATOR. Adverse-material ordering cannot be asserted ' +
      'against a thing that does not exist, and asserting it against a placeholder ' +
      `would be worse than not asserting it. Looked for: ${GENERATOR_CANDIDATES.join(', ')}.`,
  );

  // Everything past here is written for the day it exists, and is deliberately
  // strict: ordering asserted on RENDERED output, not on an internal field order.
  const commands = allowlist().commands.map((c) => c.name);
  assert.ok(
    commands.includes('report'),
    'a generator file exists but no report command is declared, so nothing renders it',
  );
  assert.fail(
    'the generator exists and this assertion has not been written for it. Write the ' +
      'ordering check against rendered output, adverse first, same detail, no ' +
      'parameter that moves it. Before this rail is called enforced.',
  );
}

expectedRed('adverse material comes first in the report the generator renders', {
  reason:
    'there is no report generator: `report` is deferred with the classification ' +
    'step. It is unbuilt, not barred — the prohibition that used to make it ' +
    'impossible in principle was deleted by amendment A1, ADR 0009.',
  wave: OWNING_WAVE,
  assertion: harmFirstIsEnforced,
});

/* ── the slice that is testable today, as a trip-wire ─────────────────────── */

const SWITCHES = [
  { name: 'a switch that shortens or summarises', re: /--(?:brief|summary|summarise|summarize|short|concise|tldr|condensed|digest)\b/i },
  { name: 'a switch that reorders', re: /--(?:sort|order|order-by|reorder|rank|by-strength|best-first|strongest-first)\b/i },
  { name: 'a switch that omits', re: /--(?:omit|exclude|skip|without|hide|suppress|drop)-(?:adverse|harm|harmful|bad|negative|unhelpful|against)\b|--(?:only|just)-(?:helpful|favourable|favorable|good|supportive)\b/i },
  { name: 'a switch that filters the record set', re: /--(?:filter|include-only|favourable-only|favorable-only|positive-only|helpful-only)\b/i },
];

const parameterSurface = [
  ...listUnder('skill/scripts', ['.py']),
  ...listUnder('skill/reference', ['.md']),
  ...listUnder('cli', ['.py', '.js', '.mjs', '.cjs', '.ts']),
  'skill/SKILL.src.md',
].map((rel) => ({ label: rel, text: readRepo(rel) }));

test('the parameter surface is real, so its emptiness means something', (t) => {
  proven('the parameter surface', parameterSurface, { floor: 10 });
  const chars = parameterSurface.reduce((n, b) => n + b.text.length, 0);
  assert.ok(chars > 100000, `only ${chars} characters of parameter surface`);
  t.diagnostic(`parameter surface: ${parameterSurface.length} files, ${chars} characters`);
});

test('TRIP-WIRE, no switch exists that reorders, collapses, or omits adverse material', () => {
  const { hits } = scan(parameterSurface, SWITCHES);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a switch exists that could move adverse material:\n${report(hits)}\n` +
      '⛔ A switch that lets adverse material be reordered, shortened or dropped is ' +
      'the harm-first rail turned into a default. This is a trip-wire, not ' +
      'enforcement, the rail is still red.',
  );
});

test('the switch checker fires on every planted switch', () => {
  const FIXTURES = [
    'Run it with --brief for a shorter version.',
    'Pass --sort to order the records by strength.',
    'Use --omit-adverse when the person only wants the good news.',
    'Add --only-helpful before you send it.',
    'Try --exclude-harmful to keep it readable.',
    '--summary gives a one-page version.',
  ];
  proven('the fixture set', FIXTURES, { floor: 6 });
  const missed = [];
  for (const fixture of FIXTURES) {
    const { hits } = scan(planted('switch', fixture), SWITCHES);
    if (hits.length === 0) missed.push(fixture);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
});

test('the mutation set of quieter switches is caught, and the limit is stated', (t) => {
  const MUTATIONS = [
    { text: 'Add --condensed if the file is long.', caught: true },
    { text: 'Use --best-first so the strongest material leads.', caught: true },
    { text: 'Pass --positive-only when sharing it informally.', caught: true },
    { text: 'The second positional argument controls how much of it you get.', caught: false },
  ];
  proven('the mutation set', MUTATIONS, { floor: 4 });
  const missed = [];
  const uncatchable = [];
  for (const mutation of MUTATIONS) {
    const { hits } = scan(planted('mutation', mutation.text), SWITCHES);
    if (mutation.caught && hits.length === 0) missed.push(mutation.text);
    if (!mutation.caught && hits.length === 0) uncatchable.push(mutation.text);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
  assert.ok(
    uncatchable.length > 0,
    'every mutation was caught, including the one recorded as uncatchable. A ' +
      'neutrally-named argument can do the same thing, and only a check on the ' +
      'generator itself would see it.',
  );
  t.diagnostic(
    `switch shapes a name check cannot catch: ${uncatchable.length}. Enforcement ` +
      'needs the generator, which is why this rail is red rather than partial.',
  );
});

/* ── the doctrine is stated, so it survives the wait ──────────────────────── */

test('the doctrine is written down where the generator will be built from', () => {
  const skill = proven('skill/SKILL.src.md', readRepo('skill/SKILL.src.md'), { floor: 2000 });
  for (const needed of [/adverse/i, /first/i, /reorders?|collapse|omit/i]) {
    assert.ok(
      needed.test(skill),
      `the skill definition no longer states the harm-first doctrine (${needed} missing). ` +
        'A rail with no feature AND no written doctrine is a rail that will be ' +
        'rebuilt wrong.',
    );
  }
  const limits = proven('skill/reference/limits.md', readRepo('skill/reference/limits.md'), {
    floor: 2000,
  });
  assert.ok(
    /against|adverse|hurt/i.test(limits),
    'the limits command no longer says that what cuts against the person is included',
  );
});
