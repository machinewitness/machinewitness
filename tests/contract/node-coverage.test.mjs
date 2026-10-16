/**
 * tests/contract/node-coverage.test.mjs. Nothing in the contract goes unshown.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS IS THE TEST THAT WOULD HAVE CAUGHT THE DRAFT THAT DROPPED L3, L8, L10
 * AND L11, AND LABELLED A SCREEN O1-O5 WHILE RENDERING ONLY O1.
 *
 * Every one of those defects is invisible to a walkthrough: the flow runs, the
 * screens look right, a plan comes out at the end, and four questions were never
 * asked. The only thing that sees it is enumeration.
 *
 * ⛔ SO COVERAGE IS ENUMERATED FROM THE CONTRACT, NEVER FROM A LIST TYPED HERE.
 * A typed list is a prose copy of a contract, and this project has already
 * shipped one of those: two documents said "seven hard exclusions" long after
 * the list reached fourteen. If a node is added to tree.yaml and the engine
 * never renders it, this file must go red without anyone editing it.
 *
 * The corollary, which matters as much: a coverage number is worth exactly what
 * it counted. Every assertion below proves its input is non-empty first, because
 * a scan that finds nothing prints the same green as a clean pass.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  documentOrder,
  driveRoute,
  enumerateRoutes,
  exclusionItems,
  kindOf,
  nodePhases,
  nodesById,
  phaseOfNode,
  recordNodes,
  stepsOf,
} from './_harness.mjs';

const routes = enumerateRoutes();

/** Every screen the engine emits across every enumerated route. */
const allScreens = routes.flatMap((answers) => driveRoute(answers).screens);

test('the scan read something. A coverage claim over nothing is worthless', () => {
  assert.ok(documentOrder.length > 0, 'the contract enumeration found no nodes');
  assert.ok(exclusionItems.length > 0, 'the contract enumeration found no exclusion items');
  assert.ok(routes.length > 0, 'no routes were enumerated');
  assert.ok(allScreens.length > 0, 'the engine emitted no screens');
  assert.ok(
    allScreens.length >= documentOrder.length,
    `${allScreens.length} screens for ${documentOrder.length} nodes. Too few to have covered them`,
  );
});

/* ── every node ──────────────────────────────────────────────────────────── */

test('every node in the contract is rendered on some route', () => {
  const rendered = new Set(allScreens.map((screen) => screen.node));
  const missing = documentOrder.filter((id) => !rendered.has(id));
  assert.deepEqual(
    missing,
    [],
    `the engine never renders ${missing.length} contract node(s): ${missing.join(', ')}.\n` +
      'A node that is never shown is a question never asked. Enumerated from ' +
      'tree.json, so this list is whatever the contract holds, not a list typed here.',
  );

  // …and nothing invented: every screen is either a contract node or one of the
  // engine's own authored screens, and the authored ones are few and named.
  const authored = [...new Set(allScreens.filter((s) => s.authored).map((s) => s.node))];
  const unauthoredExtras = [
    ...new Set(allScreens.filter((s) => !s.authored && !nodesById.has(s.node)).map((s) => s.node)),
  ];
  assert.deepEqual(
    unauthoredExtras,
    [],
    `the engine rendered node id(s) that are not in the contract and not marked ` +
      `authored: ${unauthoredExtras.join(', ')}`,
  );
  assert.ok(
    authored.length > 0 && authored.length <= 4,
    `the engine has ${authored.length} authored screens (${authored.join(', ')}); ` +
      'more than a handful means flow is being invented outside the contract',
  );
});

test('every phase the contract declares is represented on some route', () => {
  const rendered = new Set(allScreens.map((screen) => screen.node));
  for (const phase of nodePhases) {
    const ids = contractIdsFor(phase);
    assert.ok(ids.length > 0, `${phase} holds no nodes. The scan is broken`);
    const shown = ids.filter((id) => rendered.has(id));
    assert.deepEqual(
      shown,
      ids,
      `${phase}: rendered ${shown.length} of ${ids.length} nodes. Missing ` +
        `${ids.filter((id) => !rendered.has(id)).join(', ')}`,
    );
  }
});

function contractIdsFor(phase) {
  return documentOrder.filter((id) => phaseOfNode.get(id) === phase);
}

/* ── one turn per node. A collapsed list is the other half of the defect. ─── */

test('each node is its OWN screen. Nothing is collapsed into a combined list', () => {
  // The draft did not only drop nodes; it merged the survivors into one invented
  // list. So being "rendered" is not enough: each node must occupy its own turn.
  const perRoute = routes.map((answers) => driveRoute(answers));
  let checked = 0;
  for (const result of perRoute) {
    const counts = new Map();
    for (const screen of result.screens) {
      counts.set(screen.node, (counts.get(screen.node) ?? 0) + 1);
    }
    for (const [id, count] of counts) {
      if (!nodesById.has(id)) continue;
      assert.equal(
        count,
        stepsOf(id),
        `${id} occupied ${count} screen(s) on one route; the contract's shape ` +
          `gives it ${stepsOf(id)}`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 40, `only ${checked} node/screen relationships checked`);
});

test('the per-record questions are each a separate turn, all of them', () => {
  // Read from the contract's own per-record marker rather than from an id
  // pattern, so renaming L1..L11 cannot quietly shrink the list.
  assert.ok(recordNodes.length > 0, 'the contract marks no per-record nodes. The scan is broken');
  const rendered = new Set(allScreens.map((s) => s.node));
  const missing = recordNodes.filter((id) => !rendered.has(id));
  assert.deepEqual(missing, [], `per-record questions never asked: ${missing.join(', ')}`);

  // Every one of them on a SINGLE route, not spread across several. A person
  // walks one path, so coverage-by-union would hide a dropped question.
  const oneRoute = driveRoute(routes[0]);
  const onThisRoute = new Set(oneRoute.screens.map((s) => s.node));
  const skipped = recordNodes.filter((id) => !onThisRoute.has(id));
  assert.deepEqual(
    skipped,
    [],
    `a single walk skipped ${skipped.length} per-record question(s): ${skipped.join(', ')}`,
  );
  assert.equal(
    new Set(recordNodes).size,
    recordNodes.length,
    'the per-record list has a duplicate',
  );
});

test('the guidance screens are each a separate turn', () => {
  const guidance = documentOrder.filter((id) => kindOf(id) === 'guidance');
  assert.ok(guidance.length > 0, 'the contract holds no guidance node. The scan is broken');
  const rendered = new Set(allScreens.map((s) => s.node));
  const missing = guidance.filter((id) => !rendered.has(id));
  assert.deepEqual(missing, [], `guidance screens never shown: ${missing.join(', ')}`);
});

/* ── every exclusion, counted from the contract at runtime ───────────────── */

test('all of the hard exclusions are shown, and every `why` with them', () => {
  // ⛔ The count is never written down. It was fourteen when this was authored
  // and two documents in this project's history said seven.
  const bodies = new Map();
  for (const screen of allScreens) {
    if (!bodies.has(screen.node)) bodies.set(screen.node, []);
    bodies.get(screen.node).push(screen.text);
  }

  let textsChecked = 0;
  let whysChecked = 0;
  const missing = [];
  for (const item of exclusionItems) {
    const joined = (bodies.get(item.owner) ?? []).join('\n');
    assert.ok(joined.length > 0, `${item.owner} rendered no text at all`);
    if (!joined.includes(item.text)) {
      missing.push(`${item.id}.text`);
    } else {
      textsChecked += 1;
    }
    if (item.why !== undefined) {
      if (!joined.includes(item.why)) missing.push(`${item.id}.why`);
      else whysChecked += 1;
    }
  }
  assert.deepEqual(
    missing,
    [],
    `not shown to the person: ${missing.join(', ')}. An unread exclusion is an ` +
      'absent exclusion, and the `why` is the part that changes behaviour.',
  );
  assert.equal(
    textsChecked,
    exclusionItems.length,
    `showed ${textsChecked} of ${exclusionItems.length} exclusions`,
  );
  assert.ok(whysChecked > 0, 'no `why` was checked. The scan is broken');
});

test('the exclusions are shown on EVERY route, not only the one that has them', () => {
  // They are unconditional. A branch that skips them is the failure the hazard
  // gate exists to prevent.
  for (const answers of routes) {
    const result = driveRoute(answers);
    const joined = result.screens.map((s) => s.text).join('\n');
    for (const item of exclusionItems) {
      assert.ok(
        joined.includes(item.text),
        `${item.id} was not shown on the route ${answers.join(' / ')}`,
      );
    }
  }
});

/* ── the terminal screen ─────────────────────────────────────────────────── */

test('every route ends somewhere, and the same somewhere', () => {
  const endings = new Set();
  for (const answers of routes) {
    const result = driveRoute(answers);
    endings.add(result.parked_on);
    assert.equal(result.rejected, null, 'a route the contract itself offers was rejected');
    assert.ok(
      !nodesById.has(result.parked_on),
      `a route stopped on the contract node ${result.parked_on} instead of reaching the end`,
    );
    const last = result.screens.at(-1);
    assert.ok(last.text.trim().length > 0, 'the last screen is empty');
  }
  assert.equal(endings.size, 1, `routes ended in ${endings.size} different places: ${[...endings]}`);
});
