/**
 * tests/contract/exclusion-grouping.test.mjs. Every exclusion lands on exactly
 * one screen, and the check that says so is known to FIRE.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHY THIS FILE EXISTS.
 *
 * The stop list is chunked SEMANTICALLY: one idea per screen, under a heading, so
 * a frightened person reads a few short related lists instead of one wall. That
 * is better to read and strictly more dangerous to maintain, because the grouping
 * is a second list of the contract's ids living OUTSIDE the contract, the exact
 * shape that produced "the seven hard exclusions" in two documents long after the
 * list reached fourteen.
 *
 * An arithmetic split could not go stale. A semantic one can, and the way it goes
 * stale is silent: an exclusion added to the contract belongs to no screen, so it
 * is shown to nobody, and every count on screen still looks right because the
 * counts are derived. An unread exclusion is an absent exclusion. Two of the ones
 * at stake are *do not consent to a device search* and *replying can be the
 * breach.*
 *
 * So this file asserts both halves, and the second half is the one that matters:
 *
 *   1. COVERAGE. Read the exclusion ids out of tree.json, drive the engine, and
 *      require each id to appear on exactly one rendered screen, and the union
 *      of the screens to be the whole contract list. Nothing is typed here: no
 *      count, no screen size, no grouping.
 *   2. THE CHECK FIRES. Plant a violation in each direction against a real copy of
 *      the engine and require a refusal that names the offending id. A
 *      completeness check nobody has watched fail is indistinguishable from no
 *      check at all, this repository has already shipped a wrapper that printed
 *      green over a run which read nothing.
 *
 * ⛔ THE CONTROL RUNS FIRST in the planted-violation section. A copied engine that
 * refuses everything would satisfy every refusal assertion below it, so the
 * unmutated copy must succeed in the same temporary tree before any mutation is
 * judged.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { copyFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  contract,
  documentOrder,
  driveRoute,
  enumerateRoutes,
  exclusionItems,
  kindOf,
  nodesById,
} from './_harness.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENGINE = join(REPO, 'skill', 'scripts', 'triage.py');

const TMP = realpathSync(mkdtempSync(join(tmpdir(), 'mw-grouping-')));
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));

/** ⛔ Nothing may write under the real home directory. */
const PRETEND_HOME = join(TMP, 'pretend-home');
mkdirSync(PRETEND_HOME, { recursive: true });

const routes = enumerateRoutes();

/** The node that carries the stop list, read from the contract's own type. */
const exclusionNodes = documentOrder.filter((id) => kindOf(id) === 'exclusions');

/* ── 1. COVERAGE ─────────────────────────────────────────────────────────── */

test('the scan read something. A coverage claim over nothing is worthless', () => {
  assert.ok(exclusionNodes.length > 0, 'the contract holds no exclusion node. The scan is broken');
  assert.ok(exclusionItems.length > 0, 'the contract holds no exclusion items. The scan is broken');
  assert.ok(routes.length > 0, 'no routes were enumerated');
  for (const item of exclusionItems) {
    assert.ok(
      typeof item.id === 'string' && item.id.length > 0,
      'an exclusion item has no id, so it cannot be placed on a screen',
    );
    assert.ok(
      typeof item.text === 'string' && item.text.trim().length > 0,
      `${item.id} has no text. An empty exclusion is worse than a missing one`,
    );
  }
});

test('the SHIPPED grouping covers the contract. Read this failure first', () => {
  // Deliberately the cheapest and earliest assertion in the file, and deliberately
  // independent of the drive harness. When the grouping goes stale the engine
  // refuses to start, so every test below fails with a harness-shaped message
  // about output that is not JSON. This one fails with the engine's own sentence,
  // naming the id that is on no screen.
  const run = spawnSync('python3', [ENGINE, 'verify'], {
    cwd: TMP,
    encoding: 'utf8',
    env: { ...process.env, HOME: PRETEND_HOME },
  });
  assert.equal(run.error, undefined, `could not run the engine: ${run.error?.message}`);
  assert.equal(
    run.status,
    0,
    'the shipped engine will not start. If the text below names an exclusion that ' +
      'is on no screen, fix EXCLUSION_GROUPS in skill/scripts/triage.py: never ' +
      `the contract:\n${run.stdout}${run.stderr}`,
  );
});

/**
 * The rendered screens of one exclusion node, in step order, on one route. One
 * route is the right surface: a person walks one path, and the exclusions are
 * unconditional, so coverage-by-union across routes would hide a dropped item.
 */
function screensOf(nodeId) {
  const walked = driveRoute(routes[0]);
  const screens = walked.screens
    .filter((screen) => screen.node === nodeId)
    .sort((a, b) => a.step - b.step);
  assert.ok(screens.length > 0, `${nodeId} rendered no screen at all`);
  assert.deepEqual(
    screens.map((s) => s.step),
    screens.map((_s, i) => i),
    `${nodeId} rendered its screens out of step order`,
  );
  return screens;
}

test('EVERY exclusion in the contract is placed on exactly one screen', () => {
  for (const nodeId of exclusionNodes) {
    const screens = screensOf(nodeId);
    const mine = exclusionItems.filter((item) => item.owner === nodeId);
    assert.ok(mine.length > 0, `${nodeId} owns no items. The scan is broken`);

    /** id -> the screen indexes its text was found on. */
    const placement = new Map();
    for (const item of mine) {
      const on = screens.flatMap((s, i) => (s.text.includes(item.text) ? [i] : []));
      placement.set(item.id, on);
    }

    const unplaced = [...placement].filter(([, on]) => on.length === 0).map(([id]) => id);
    assert.deepEqual(
      unplaced,
      [],
      `${unplaced.length} exclusion(s) in the contract are on NO screen: ${unplaced.join(', ')}.\n` +
        'They would be shown to nobody, and every number on screen would still ' +
        'look right, because the numbers are derived. Enumerated from tree.json, ' +
        'this list is whatever the contract holds, not a list typed in this file.',
    );

    const doubled = [...placement]
      .filter(([, on]) => on.length > 1)
      .map(([id, on]) => `${id} on screens ${on.map((i) => i + 1).join(' and ')}`);
    assert.deepEqual(doubled, [], `an exclusion is shown twice: ${doubled.join('; ')}`);

    // The union is the whole list, and every screen earns its turn.
    const placedCount = [...placement.values()].filter((on) => on.length === 1).length;
    assert.equal(
      placedCount,
      mine.length,
      `placed ${placedCount} of ${mine.length} exclusions the contract holds`,
    );
    for (const [index, screen] of screens.entries()) {
      const here = mine.filter((item) => screen.text.includes(item.text));
      assert.ok(here.length > 0, `screen ${index + 1} of ${nodeId} shows no exclusion at all`);
    }
  }
});

test('every `why` travels with the item it belongs to, on the same screen', () => {
  // The `why` is the part that changes behaviour. Split from its item it is noise.
  let checked = 0;
  for (const nodeId of exclusionNodes) {
    const screens = screensOf(nodeId);
    for (const item of exclusionItems.filter((i) => i.owner === nodeId)) {
      if (item.why === undefined) continue;
      const withText = screens.filter((s) => s.text.includes(item.text));
      assert.equal(withText.length, 1, `${item.id} is not on exactly one screen`);
      assert.ok(
        withText[0].text.includes(item.why),
        `${item.id}'s reason is not on the same screen as ${item.id} itself`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'no `why` was checked. The scan is broken');
});

test('each screen carries ONE heading, before a word of the list, and no two repeat', () => {
  for (const nodeId of exclusionNodes) {
    const screens = screensOf(nodeId);
    const mine = exclusionItems.filter((item) => item.owner === nodeId);
    const headings = [];
    for (const [index, screen] of screens.entries()) {
      const lines = screen.text.split('\n');
      const progress = lines.findIndex((line) => line.trim().length > 0);
      assert.ok(progress >= 0, `screen ${index + 1} of ${nodeId} is blank`);

      const after = lines.slice(progress + 1).filter((line) => line.trim().length > 0);
      assert.ok(after.length > 0, `screen ${index + 1} of ${nodeId} holds only its first line`);
      const heading = after[0];

      const isContractText = mine.some(
        (item) => heading.includes(item.text) || (item.why && heading.includes(item.why)),
      );
      assert.ok(
        !isContractText,
        `screen ${index + 1} of ${nodeId} goes straight into the list with no heading: ` +
          `${heading.slice(0, 60)}…`,
      );

      // …and it really is BEFORE the list, not a trailing label.
      const firstItemAt = lines.findIndex((line) =>
        mine.some((item) => line.includes(item.text)),
      );
      assert.ok(
        firstItemAt > lines.indexOf(heading),
        `the heading of screen ${index + 1} of ${nodeId} comes after the first item`,
      );
      headings.push(heading.trim());
    }
    assert.equal(
      new Set(headings).size,
      headings.length,
      `${nodeId} repeats a heading across screens: ${headings.join(' / ')}`,
    );
    for (const heading of headings) {
      assert.ok(heading.length > 0, `${nodeId} has an empty heading`);
    }
  }
});

test('the progress line states BOTH numbers, and both come from the contract', () => {
  // "Screen 2 of 4; 14 in all". Neither number may be typed anywhere: the total
  // is the contract's item count and the screen count is however many screens the
  // engine actually rendered. A count written in prose is the defect that shipped.
  for (const nodeId of exclusionNodes) {
    const screens = screensOf(nodeId);
    const total = exclusionItems.filter((item) => item.owner === nodeId).length;
    for (const [index, screen] of screens.entries()) {
      const first = screen.text.split('\n').find((line) => line.trim().length > 0);
      const found = /Screen\s+(\d+)\s+of\s+(\d+);\s+(\d+)\s+in all/.exec(first);
      assert.ok(found, `screen ${index + 1} of ${nodeId} has no progress line: ${first}`);
      assert.equal(Number(found[1]), index + 1, 'the progress line names the wrong screen');
      assert.equal(
        Number(found[2]),
        screens.length,
        `the progress line claims ${found[2]} screens; the engine rendered ${screens.length}`,
      );
      assert.equal(
        Number(found[3]),
        total,
        `the progress line claims ${found[3]} items; the contract holds ${total}`,
      );
    }
  }
});

/* ── 2. THE CHECK FIRES ──────────────────────────────────────────────────── */

/**
 * A whole install tree in a temporary folder: `scripts/triage.py` beside
 * `data/tree.json` and `data/tree.sha256`, which is where the engine resolves
 * both, relative to its own file. `tree` is written as given, so a mutated
 * contract is loaded exactly as a real one would be, digest included.
 */
function plantedInstall(name, tree) {
  const root = join(TMP, name);
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'data'), { recursive: true });
  copyFileSync(ENGINE, join(root, 'scripts', 'triage.py'));
  const json = Buffer.from(`${JSON.stringify(tree, null, 2)}\n`, 'utf8');
  writeFileSync(join(root, 'data', 'tree.json'), json);
  const digest = createHash('sha256').update(json).digest('hex');
  writeFileSync(join(root, 'data', 'tree.sha256'), `${digest}  tree.json\n`);
  return join(root, 'scripts', 'triage.py');
}

function runVerify(enginePath) {
  const run = spawnSync('python3', [enginePath, 'verify'], {
    cwd: TMP,
    encoding: 'utf8',
    env: { ...process.env, HOME: PRETEND_HOME },
  });
  assert.equal(run.error, undefined, `could not run the copied engine: ${run.error?.message}`);
  assert.ok(
    (run.stdout ?? '').trim().length > 0,
    `the copied engine printed nothing.\n  status ${run.status}\n  stderr ${run.stderr}`,
  );
  return run;
}

/** The exclusion node's items, mutated. Returns a fresh deep copy every time. */
function contractWithItems(mutate) {
  const copy = structuredClone(contract);
  let touched = 0;
  for (const [key, value] of Object.entries(copy)) {
    if (!key.startsWith('phase_') || !Array.isArray(value)) continue;
    for (const node of value) {
      if (node?.type !== 'hard_exclusions') continue;
      node.items = mutate([...node.items]);
      touched += 1;
    }
  }
  assert.equal(touched, exclusionNodes.length, 'could not reach the exclusion items to plant one');
  return copy;
}

test('THE CONTROL, an unmutated copy of the engine still runs, in the same tree', () => {
  // ⛔ First, and non-negotiable. Every refusal asserted below would also be
  // produced by an engine that refuses everything, or by a copy that cannot find
  // its own contract. Without this the section proves nothing.
  const run = runVerify(plantedInstall('control', contract));
  assert.equal(
    run.status,
    0,
    `the unmutated copy refused to run, so no refusal below means anything:\n${run.stdout}`,
  );
  assert.match(run.stdout, /nodes\s+\d+/, `verify printed no node count:\n${run.stdout}`);
  assert.match(run.stdout, /screens\s+\d+/, `verify printed no screen count:\n${run.stdout}`);
});

test('an exclusion the grouping does not place REFUSES, and names it', () => {
  // The failure that actually matters: somebody adds an exclusion to the contract
  // and the screens quietly carry on without it.
  const planted = 'X_ADDED_AND_NOT_PLACED';
  const tree = contractWithItems((items) => [
    ...items,
    { id: planted, text: 'A planted exclusion, to prove this check can fail.' },
  ]);
  const run = runVerify(plantedInstall('added', tree));
  assert.notEqual(
    run.status,
    0,
    `an exclusion on no screen was accepted. The completeness check is dead:\n${run.stdout}`,
  );
  assert.ok(
    run.stdout.includes(planted),
    `the refusal does not name the unplaced exclusion:\n${run.stdout}`,
  );
  assert.match(
    run.stdout,
    /on no screen/,
    `the refusal does not say what is wrong:\n${run.stdout}`,
  );
});

test('a grouping entry the contract no longer has REFUSES, and names it', () => {
  // The mirror image, and it is not cosmetic: a grouping describing a list that
  // has changed cannot be trusted about the rest of the list either.
  const dropped = exclusionItems.at(-1);
  assert.ok(dropped?.id, 'could not find an exclusion to remove');
  const tree = contractWithItems((items) => items.slice(0, -1));
  const run = runVerify(plantedInstall('removed', tree));
  assert.notEqual(
    run.status,
    0,
    `a grouping naming an exclusion the contract dropped was accepted:\n${run.stdout}`,
  );
  assert.ok(
    run.stdout.includes(dropped.id),
    `the refusal does not name the orphaned entry ${dropped.id}:\n${run.stdout}`,
  );
});

test('the refusal is legible. No internal vocabulary, and it says what to fix', () => {
  const run = runVerify(
    plantedInstall('legible', contractWithItems((items) => [...items, { id: 'X_ZZ', text: 'x.' }])),
  );
  const lower = run.stdout.toLowerCase();
  for (const word of ['manifest', 'hash', 'custody', 'layer', 'classification', 'adversarial']) {
    assert.ok(!lower.includes(word), `the refusal shows the internal word "${word}"`);
  }
  assert.ok(!/rail[\s_-]*\d/i.test(run.stdout), 'the refusal shows a rail number');
  assert.match(
    run.stdout,
    /do not amend the contract/i,
    'the refusal does not say which side to fix. The grouping is design and may be ' +
      're-cut; the exclusions are the contract and an agent may never amend one.',
  );
});

/* ── the engine's own copy of this check, run rather than trusted ─────────── */

test('the engine asserts its own grouping, and says how many exclusions it saw', () => {
  const run = spawnSync('python3', [ENGINE, '--selftest'], {
    cwd: TMP,
    encoding: 'utf8',
    env: { ...process.env, HOME: PRETEND_HOME },
  });
  assert.equal(run.status, 0, `the engine's selftest failed:\n${run.stdout}\n${run.stderr}`);
  const found = /(\d+)\s+exclusions/.exec(run.stdout);
  assert.ok(found, `the selftest did not report an exclusion count:\n${run.stdout}`);
  assert.equal(
    Number(found[1]),
    exclusionItems.length,
    `the selftest examined ${found[1]} exclusions; the contract holds ${exclusionItems.length}`,
  );
});

test('the exclusion node is one node with many screens, not many nodes', () => {
  // A grouping is a rendering decision. If the screens ever became contract nodes
  // the split would have escaped into the contract, which is an amendment.
  for (const nodeId of exclusionNodes) {
    assert.ok(nodesById.has(nodeId), `${nodeId} is not a contract node`);
    assert.ok(screensOf(nodeId).length > 1, `${nodeId} occupies one screen. The split is gone`);
  }
});
