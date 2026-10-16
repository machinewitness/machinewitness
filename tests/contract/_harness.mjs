/**
 * tests/contract/_harness.mjs: shared plumbing for the three engine tests.
 *
 * ⚠️ NOT A TEST FILE, deliberately. `node --test` with no path argument
 * discovers `*.test.mjs` and files under a directory named `test`; this is
 * `_harness.mjs` under `tests/`, so it is imported and never run as a suite.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE POINT OF THIS FILE IS INDEPENDENCE.
 *
 * The graph is rebuilt HERE, in JavaScript, straight out of tree.json. It is
 * not asked of the engine. So the three tests compare two independent readings
 * of the same contract, and a traversal bug in the engine cannot hide by also
 * being the thing that reports the expected answer. That was the failure shape
 * in tree.test.mjs's own header note: both sides of a deep-compare coming out
 * of one parser proves only that the parser is consistent with itself.
 *
 * Two constants below are the exception, and they are handled as such: the
 * engine's fallback answer sets and its exclusion-screen count cannot be read
 * out of the contract, because the contract does not state them. They are
 * declared here AND asserted against the engine's real output in
 * route.test.mjs, so a change in the engine fails an assertion rather than
 * silently corrupting the enumeration that every other test depends on.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ENGINE = join(REPO, 'skill', 'scripts', 'triage.py');
export const CONTRACT_PATH = join(REPO, 'skill', 'data', 'tree.json');

assert.ok(
  existsSync(ENGINE),
  'skill/scripts/triage.py is missing. The engine is the subject of these tests.',
);
assert.ok(
  existsSync(CONTRACT_PATH),
  'skill/data/tree.json is missing. Run `node scripts/build.mjs`.',
);

const contractBytes = readFileSync(CONTRACT_PATH);
assert.ok(contractBytes.length > 1000, `tree.json is suspiciously small: ${contractBytes.length}`);
export const contract = JSON.parse(contractBytes.toString('utf8'));

/* ── the graph, rebuilt from the contract and from nothing else ───────────── */

/** Phase keys in the order the contract states them. Order is the program. */
export const nodePhases = Object.keys(contract).filter(
  (k) => k.startsWith('phase_') && Array.isArray(contract[k]),
);
assert.ok(nodePhases.length > 0, 'the contract declares no phases of nodes. The scan is broken');

/** Every node, flattened in document order: phase order, then order within. */
export const documentOrder = nodePhases.flatMap((phase) =>
  contract[phase].map((node) => node.id),
);
assert.ok(documentOrder.length > 0, 'the contract declares no nodes. The scan is broken');
assert.equal(
  new Set(documentOrder).size,
  documentOrder.length,
  'duplicate node id in the contract',
);

export const nodesById = new Map(
  nodePhases.flatMap((phase) => contract[phase].map((node) => [node.id, node])),
);

export const phaseOfNode = new Map(
  nodePhases.flatMap((phase) => contract[phase].map((node) => [node.id, phase])),
);

/** The exclusion items, wherever they live, with the node that carries them. */
export const exclusionItems = documentOrder.flatMap((id) => {
  const node = nodesById.get(id);
  if (node.type !== 'hard_exclusions') return [];
  return (node.items ?? []).map((item) => ({ owner: id, ...item }));
});

/** Nodes that ask about one record. Read from the contract's own marker. */
export const recordNodes = documentOrder.filter((id) => 'layer' in nodesById.get(id));

/* ── the two constants the contract does not state ───────────────────────── */

/**
 * The engine's answer set for a contract question that declares no `options`.
 * ⚠️ Asserted against the engine's real output in route.test.mjs. Do not change
 * it here to make a run green, change it in the engine, or fix the engine.
 */
export const FALLBACK_QUESTION_OPTIONS = ['yes', 'no', 'unsure'];

/** The engine's acknowledgement for a screen that states rather than asks. */
export const FALLBACK_ACK_OPTIONS = ['ok'];

/**
 * How many screens the exclusion list occupies. Asserted, same as above.
 *
 * ⚠️ The split is SEMANTIC, not arithmetic: the engine's `EXCLUSION_GROUPS` names
 * which screen each item id goes on, so this number is the length of that table
 * rather than anything the contract states. Which items sit together is not
 * asserted here, the engine verifies its own table against the contract at load
 * time and refuses to start on a mismatch, and
 * `tests/contract/exclusion-grouping.test.mjs` proves that refusal fires.
 */
export const EXCLUSION_SCREENS = 4;

export const ACK = FALLBACK_ACK_OPTIONS[0];

/* ── node shape, independently ───────────────────────────────────────────── */

export function kindOf(id) {
  const node = nodesById.get(id);
  assert.ok(node, `no such node in the contract: ${id}`);
  if (node.type === 'hard_exclusions') return 'exclusions';
  if (node.type === 'guidance') return 'guidance';
  if ('ask' in node) return 'question';
  throw new Error(`node ${id} is neither a question, a statement, nor a list`);
}

export function optionsOf(id) {
  const node = nodesById.get(id);
  if (Array.isArray(node.options) && node.options.length > 0) return [...node.options];
  return kindOf(id) === 'question' ? [...FALLBACK_QUESTION_OPTIONS] : [...FALLBACK_ACK_OPTIONS];
}

export function stepsOf(id) {
  if (kindOf(id) !== 'exclusions') return 1;
  const count = (nodesById.get(id).items ?? []).length;
  assert.ok(count > 0, `${id} carries no items`);
  return Math.min(EXCLUSION_SCREENS, count);
}

/** The following entry in document order, or null at the end of the contract. */
export function documentSuccessor(id) {
  const index = documentOrder.indexOf(id);
  assert.ok(index >= 0, `${id} is not in document order`);
  return index + 1 < documentOrder.length ? documentOrder[index + 1] : null;
}

/**
 * Where an answer must lead. Independently derived: `branch[answer].next`, then
 * the node's own `next`, then document order. `null` means the contract is
 * exhausted and the engine should be showing its terminal screen.
 */
export function successorOf(id, answer) {
  const node = nodesById.get(id);
  const branch = node.branch;
  if (branch && Object.hasOwn(branch, answer)) {
    const entry = branch[answer] ?? {};
    if (entry.next) return entry.next;
    return node.next ?? documentSuccessor(id);
  }
  if (node.next) return node.next;
  return documentSuccessor(id);
}

/** Flags an answer sets, as the contract writes them. */
export function setsOf(id, answer) {
  const branch = nodesById.get(id).branch;
  if (!branch || !Object.hasOwn(branch, answer)) return {};
  return { ...((branch[answer] ?? {}).set ?? {}) };
}

/* ── route enumeration, by graph walk. Never by example. ─────────────────── */

/**
 * Every routing-distinct path through the contract, as answer sequences that
 * start at the first contract node.
 *
 * At each node, every accepted answer is tried and ONE is kept per DISTINCT
 * successor. Answers that route identically are the same route, so the eleven
 * per-record questions do not multiply into thousands of paths and no branch is
 * lost. A node visited twice is a cycle, which is a contract defect rather than
 * a path, so the walk stops and the route is still returned for inspection.
 */
export function enumerateRoutes() {
  const routes = [];

  const walk = (id, answers, seen) => {
    if (id === null) {
      routes.push([...answers]);
      return;
    }
    if (seen.has(id)) {
      routes.push([...answers]);
      return;
    }
    const pad = [];
    for (let i = 0; i < stepsOf(id) - 1; i += 1) pad.push(ACK);
    const chosen = new Map();
    for (const option of optionsOf(id)) {
      const target = successorOf(id, option);
      const key = target === null ? ' end' : target;
      if (!chosen.has(key)) chosen.set(key, { target, option });
    }
    for (const { target, option } of chosen.values()) {
      walk(target, [...answers, ...pad, option], new Set([...seen, id]));
    }
  };

  walk(documentOrder[0], [], new Set());
  assert.ok(routes.length > 0, 'route enumeration produced nothing. The walk is broken');
  return routes;
}

/** The node sequence a route visits, independently recomputed. */
export function routeNodes(answers) {
  const visited = [];
  let id = documentOrder[0];
  let cursor = 0;
  const seen = new Set();
  while (id !== null && cursor < answers.length) {
    if (seen.has(id)) break;
    seen.add(id);
    visited.push(id);
    cursor += stepsOf(id) - 1; // the acknowledgements for the extra screens
    const answer = answers[cursor];
    cursor += 1;
    id = successorOf(id, answer);
  }
  return visited;
}

/* ── running the engine ──────────────────────────────────────────────────── */

/**
 * One `drive` run. Stateless in the engine, so nothing is written to disk and a
 * test cannot leave a state file behind.
 */
export function drive(answers) {
  const args = [ENGINE, 'drive', '--json'];
  for (const answer of answers) args.push('--answer', answer);
  const run = spawnSync('python3', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(run.error, undefined, `could not run the engine: ${run.error?.message}`);
  assert.ok(
    run.stdout && run.stdout.trim().length > 0,
    `the engine produced no output.\n  status ${run.status}\n  stderr ${run.stderr}`,
  );
  let parsed;
  try {
    parsed = JSON.parse(run.stdout);
  } catch (err) {
    throw new Error(`the engine's --json output is not JSON: ${err.message}\n${run.stdout}`);
  }
  assert.ok(Array.isArray(parsed.screens), 'the engine reported no screens');
  assert.ok(parsed.screens.length > 0, 'the engine reported an empty screen list');
  return parsed;
}

/**
 * How many authored screens the engine shows before the first contract node.
 *
 * ⚠️ The probe is deliberately longer than any single node's screen count. A
 * short probe cannot tell "the engine shows nothing before the contract" from
 * "the engine shows a four-screen node first", and the second is the reordering
 * these tests exist to catch, so a short probe turns a specific, nameable
 * failure into a vague one about the harness.
 */
const PROBE_ACKS = 12;
let preambleCache = null;
export function preamble() {
  if (preambleCache !== null) return preambleCache;
  const probe = drive(new Array(PROBE_ACKS).fill(ACK));
  const index = probe.route.indexOf(documentOrder[0]);
  assert.ok(
    index >= 0,
    `the engine never reached the contract's first node (${documentOrder[0]}) in ` +
      `${PROBE_ACKS} acknowledgements; its route was ${probe.route.join(' → ')}`,
  );
  preambleCache = new Array(index).fill(ACK);
  return preambleCache;
}

/** The engine's opening sequence, with no assumption about its length. */
export function openingRoute() {
  return drive(new Array(PROBE_ACKS).fill(ACK)).route;
}

/** Drive a contract route, prefixed with whatever the engine shows first. */
export function driveRoute(answers) {
  return drive([...preamble(), ...answers]);
}

/** Every string value stored under `field` anywhere in the contract. */
export function contractValues(field) {
  const found = new Set();
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (key === field) {
        if (typeof child === 'string') found.add(child);
        else if (Array.isArray(child)) for (const item of child) {
          if (typeof item === 'string') found.add(item);
        }
      }
      walk(child);
    }
  };
  walk(contract);
  return found;
}
