/**
 * tests/contract/route.test.mjs: the engine walks the contract's order, and
 * nothing else's.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS, IN ONE SENTENCE: a draft of this flow showed the hard
 * exclusions before the hazard questions that establish which paths are closed,
 * which means it gave a person evidence advice before knowing what they were
 * forbidden to do.
 *
 * So the assertions here are about ORDER, and they come in three strengths:
 *
 *   1. POSITIONAL. For every enumerated route, the sequence of nodes the engine
 *      renders equals the sequence independently recomputed from the contract's
 *      own `branch`/`next` edges, position by position. This is the assertion
 *      that fails on ANY reordering, including one nobody thought to name.
 *   2. STRUCTURAL. Every edge in the contract goes forward in document order, so
 *      a route must be a strictly increasing subsequence of it. This catches a
 *      reordering even if the engine and the recomputation agreed, which is the
 *      case a positional comparison alone cannot see.
 *   3. NAMED. `H1` before `H3`, spelled out, because that is the failure that
 *      happened and a named assertion is harder to delete by accident than a
 *      general one.
 *
 * The graph is rebuilt from tree.json in `_harness.mjs`. It is NOT asked of the
 * engine, see that file's header for why that distinction is the whole point.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ACK,
  EXCLUSION_SCREENS,
  FALLBACK_ACK_OPTIONS,
  FALLBACK_QUESTION_OPTIONS,
  documentOrder,
  driveRoute,
  drive,
  enumerateRoutes,
  kindOf,
  nodesById,
  openingRoute,
  optionsOf,
  preamble,
  routeNodes,
  setsOf,
  stepsOf,
  successorOf,
} from './_harness.mjs';

const routes = enumerateRoutes();

test('the enumeration itself is non-empty and covers more than one path', () => {
  assert.ok(routes.length > 1, `only ${routes.length} route(s) enumerated. The walk is broken`);
  for (const answers of routes) {
    assert.ok(answers.length > 0, 'an enumerated route has no answers');
  }
});

/* ── 1. POSITIONAL ────────────────────────────────────────────────────────── */

test('every enumerated route renders the nodes the contract says, in that order', () => {
  let compared = 0;
  for (const answers of routes) {
    const expected = routeNodes(answers);
    assert.ok(expected.length > 0, 'independent recomputation produced no nodes');

    const result = driveRoute(answers);
    assert.equal(
      result.rejected,
      null,
      `the engine rejected an answer the contract offers: ${JSON.stringify(result.rejected)}`,
    );

    // Drop the engine's authored screens: the ones before the first contract
    // node, and the terminal screen after the last one.
    const contractPart = result.route.filter((id) => nodesById.has(id));
    assert.deepEqual(
      contractPart,
      expected,
      'the engine walked a different order than the contract states.\n' +
        `  engine    ${contractPart.join(' → ')}\n` +
        `  contract  ${expected.join(' → ')}`,
    );
    compared += contractPart.length;
  }
  assert.ok(compared > 40, `only ${compared} node positions compared across all routes`);
});

test('each single step is the successor the contract names, and sets what it says', () => {
  // The per-edge form of the same property. A positional comparison of whole
  // routes can be satisfied by two matching mistakes; this checks one hop at a
  // time, including the flags, which is where the fail-safe behaviour lives.
  let edges = 0;
  for (const answers of routes) {
    const result = driveRoute(answers);
    const answered = result.screens
      .map((screen, index) => ({ screen, given: [...preamble(), ...answers][index] }))
      .filter(({ screen }) => nodesById.has(screen.node));

    const expectedFlags = {};
    for (const { screen, given } of answered) {
      if (given === undefined) continue;
      if (screen.step + 1 < stepsOf(screen.node)) continue; // mid-node acknowledgement
      Object.assign(expectedFlags, setsOf(screen.node, given));
      edges += 1;
    }
    assert.deepEqual(
      result.flags,
      { ...result.flags, ...expectedFlags },
      `the engine did not set the flags the contract's branch entries declare on ${answers}`,
    );
    for (const [key, value] of Object.entries(expectedFlags)) {
      assert.equal(
        result.flags[key],
        value,
        `a contract branch sets ${key}=${value} and the engine did not`,
      );
    }
  }
  assert.ok(edges > 30, `only ${edges} edges exercised`);
});

/* ── 2. STRUCTURAL ───────────────────────────────────────────────────────── */

test('every contract edge goes FORWARD in document order. No route can loop back', () => {
  let checked = 0;
  for (const id of documentOrder) {
    const from = documentOrder.indexOf(id);
    for (const option of optionsOf(id)) {
      const target = successorOf(id, option);
      if (target === null) continue;
      const to = documentOrder.indexOf(target);
      assert.ok(to >= 0, `${id} + ${option} leads to ${target}, which is not a contract node`);
      assert.ok(
        to > from,
        `${id} + ${option} goes BACKWARD to ${target}. The engine's traversal ` +
          'assumes forward-only edges, and so does the subsequence assertion below.',
      );
      checked += 1;
    }
  }
  assert.ok(checked > 20, `only ${checked} edges inspected`);
});

test('a rendered route is a strictly increasing subsequence of document order', () => {
  let checked = 0;
  for (const answers of routes) {
    const result = driveRoute(answers);
    const rendered = result.route.filter((id) => nodesById.has(id));
    let previous = -1;
    for (const id of rendered) {
      const index = documentOrder.indexOf(id);
      assert.ok(
        index > previous,
        `${id} was rendered out of contract order (after position ${previous}). ` +
          `Route: ${rendered.join(' → ')}`,
      );
      previous = index;
      checked += 1;
    }
  }
  assert.ok(checked > 40, `only ${checked} positions inspected`);
});

/* ── 3. NAMED, the reordering that actually happened ────────────────────── */

test('the FIRST contract node shown is the contract opener, not the exclusion list', () => {
  // Deliberately independent of everything above, including the harness's
  // preamble discovery: this is the one assertion that must still produce a
  // clear message when the opening of the flow is what is wrong. It reads the
  // engine's opening sequence directly.
  const route = openingRoute();
  const contractPart = route.filter((id) => nodesById.has(id));
  assert.ok(
    contractPart.length > 0,
    `the engine's opening showed no contract node at all: ${route.join(' → ')}`,
  );
  assert.equal(
    contractPart[0],
    documentOrder[0],
    `the first contract node shown was ${contractPart[0]}, not ${documentOrder[0]}. ` +
      `Opening sequence: ${route.join(' → ')}`,
  );
  for (const id of documentOrder.filter((n) => kindOf(n) === 'exclusions')) {
    const at = contractPart.indexOf(id);
    assert.ok(
      at !== 0,
      `${id}, the list of things not to do, was the first thing shown. The ` +
        'questions that establish which paths are closed come first, always. ' +
        `Opening sequence: ${route.join(' → ')}`,
    );
  }
});

test('the hazard questions come before the hard exclusions, on every route', () => {
  // `H1` establishes whether anything restricts this person at all; `H3` is the
  // list of things not to do. Shown the other way round, the flow hands out
  // advice before it knows which paths are closed. The ids are read from the
  // contract's own structure, so this survives a rename.
  const exclusionNodes = documentOrder.filter((id) => kindOf(id) === 'exclusions');
  assert.ok(exclusionNodes.length > 0, 'the contract holds no exclusion node. The scan is broken');
  const firstNode = documentOrder[0];
  assert.ok(
    !exclusionNodes.includes(firstNode),
    `the contract's first node ${firstNode} IS the exclusion list. That is the ` +
      'reordering this test exists to reject, and it is now in the contract itself',
  );

  let checked = 0;
  for (const answers of routes) {
    const result = driveRoute(answers);
    const rendered = result.route.filter((id) => nodesById.has(id));
    assert.equal(
      rendered[0],
      firstNode,
      `the first contract node rendered was ${rendered[0]}, not ${firstNode}`,
    );
    for (const exclusion of exclusionNodes) {
      const at = rendered.indexOf(exclusion);
      if (at < 0) continue;
      assert.ok(
        at > rendered.indexOf(firstNode),
        `${exclusion} was rendered before ${firstNode}. Route: ${rendered.join(' → ')}`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 0, 'no route rendered an exclusion node, the check ran on nothing');
});

test('the two branches the contract writes as shortcuts really do skip', () => {
  // H1 "no" goes straight past H2, and O1 "no" skips three obligation screens.
  // Both are properties of the contract, not of this test, so each is read out
  // of it first and then asserted against the engine.
  const shortcuts = [];
  for (const id of documentOrder) {
    for (const option of optionsOf(id)) {
      const target = successorOf(id, option);
      if (target === null) continue;
      const skipped = documentOrder.slice(
        documentOrder.indexOf(id) + 1,
        documentOrder.indexOf(target),
      );
      if (skipped.length > 0) shortcuts.push({ id, option, target, skipped });
    }
  }
  assert.ok(shortcuts.length > 0, 'the contract declares no skipping branch. The scan is broken');

  for (const { id, option, target, skipped } of shortcuts) {
    const answers = [];
    let cursor = documentOrder[0];
    const guard = new Set();
    while (cursor !== null && cursor !== id && !guard.has(cursor)) {
      guard.add(cursor);
      for (let i = 0; i < stepsOf(cursor) - 1; i += 1) answers.push(ACK);
      const first = optionsOf(cursor).find((o) => {
        const next = successorOf(cursor, o);
        return next !== null && documentOrder.indexOf(next) <= documentOrder.indexOf(id);
      });
      if (first === undefined) break;
      answers.push(first);
      cursor = successorOf(cursor, first);
    }
    if (cursor !== id) continue; // not reachable while forcing toward this node
    for (let i = 0; i < stepsOf(id) - 1; i += 1) answers.push(ACK);
    answers.push(option);

    const result = driveRoute(answers);
    const rendered = result.route.filter((n) => nodesById.has(n));
    assert.ok(rendered.includes(id), `could not drive the engine to ${id}`);
    assert.ok(
      rendered.includes(target),
      `${id} + "${option}" should reach ${target}; route was ${rendered.join(' → ')}`,
    );
    for (const missed of skipped) {
      assert.ok(
        !rendered.includes(missed),
        `${id} + "${option}" must skip ${missed}, and the engine rendered it`,
      );
    }
  }
});

/* ── the harness constants the contract cannot supply, asserted ──────────── */

test('the engine offers exactly the answers the contract declares, byte-for-byte', () => {
  let checked = 0;
  for (const answers of routes) {
    const result = driveRoute(answers);
    for (const screen of result.screens) {
      if (!nodesById.has(screen.node)) continue;
      const node = nodesById.get(screen.node);
      if (Array.isArray(node.options) && node.options.length > 0) {
        if (screen.step + 1 < stepsOf(screen.node)) continue;
        assert.deepEqual(
          screen.options,
          node.options,
          `${screen.node}: the engine's answers are not the contract's, verbatim`,
        );
      } else if (kindOf(screen.node) === 'question') {
        assert.deepEqual(
          screen.options,
          FALLBACK_QUESTION_OPTIONS,
          `${screen.node}: the engine's fallback answer set changed. Update ` +
            '_harness.mjs FALLBACK_QUESTION_OPTIONS, the enumeration depends on it.',
        );
      } else {
        assert.deepEqual(
          screen.options,
          FALLBACK_ACK_OPTIONS,
          `${screen.node}: the engine's acknowledgement changed. Update ` +
            '_harness.mjs FALLBACK_ACK_OPTIONS.',
        );
      }
      assert.ok(
        screen.options.length <= 6,
        `${screen.node} offers ${screen.options.length} answers`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 40, `only ${checked} answer sets checked`);
});

test('the exclusion list occupies the number of screens the harness assumes', () => {
  const exclusionNodes = documentOrder.filter((id) => kindOf(id) === 'exclusions');
  const result = driveRoute(routes[0]);
  for (const id of exclusionNodes) {
    const screens = result.screens.filter((s) => s.node === id);
    assert.equal(
      screens.length,
      stepsOf(id),
      `${id} rendered ${screens.length} screen(s); the harness assumes ` +
        `${stepsOf(id)} (EXCLUSION_SCREENS = ${EXCLUSION_SCREENS}). ` +
        'Every enumerated route is built on that number.',
    );
    assert.deepEqual(
      screens.map((s) => s.step),
      screens.map((_, i) => i),
      `${id} rendered its screens out of step order`,
    );
  }
});

/* ── an answer outside the list is rejected, never interpreted ───────────── */

test('an unlisted answer is rejected and the engine does not move', () => {
  const firstNode = documentOrder[0];
  const offered = optionsOf(firstNode);
  // Near-misses on purpose: a prefix, a superstring, a synonym, and nothing.
  const nearMisses = [
    offered[0].slice(0, 1),
    `${offered[0]} please`,
    'maybe',
    'i think so',
    '',
  ];
  for (const bad of nearMisses) {
    const result = drive([...preamble(), bad]);
    assert.ok(
      result.rejected !== null,
      `the engine interpreted ${JSON.stringify(bad)} instead of rejecting it`,
    );
    assert.equal(
      result.parked_on,
      firstNode,
      `after rejecting ${JSON.stringify(bad)} the engine moved to ${result.parked_on}`,
    );
    assert.deepEqual(result.rejected.options, offered, 'the rejection lists the wrong answers');
  }
  // …and the listed answer is still accepted, so the check is not just strict.
  const good = drive([...preamble(), offered[0]]);
  assert.equal(good.rejected, null, 'a listed answer was rejected');
  assert.notEqual(good.parked_on, firstNode, 'a listed answer did not advance the engine');
});
