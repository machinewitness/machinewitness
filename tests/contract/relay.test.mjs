/**
 * tests/contract/relay.test.mjs. The human entry point stays a relay.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHY A REFERENCE DOCUMENT NEEDS A TEST AT ALL.
 *
 * The flow was once written as prose for an agent to follow, and the agent
 * invented half of it: the stop list before the question that establishes what
 * is forbidden, eleven per-record questions collapsed into one list with four
 * dropped, five kinds of record that do not exist, and a screen labelled with a
 * range of node names while only the first rendered. The fix was to move
 * traversal into a deterministic engine, but the fix only holds while the
 * document that invokes it stays a relay. The moment it names a node it has
 * started making a decision the engine owns, and the drift is invisible: the
 * flow still runs and a plan still comes out.
 *
 * So the invariants are structural and derived, not stylistic:
 *
 *   NO NODE NAMED     Every node id in the contract, and every id-shaped token,
 *                     is absent. The contract side is enumerated from tree.json,
 *                     not a list typed here, so a renamed or added node is
 *                     covered without anyone editing this file. The shape rule
 *                     covers the engine's own authored screen ids too, which are
 *                     not in the contract and could not be enumerated from it.
 *   NO MENU           No table, and no sibling command heading a list item. A
 *                     menu is a recall interface and this user's recall is the
 *                     first thing acute stress takes.
 *   NO SCREEN TEXT    Nothing is quoted. A copy of a screen drifts from the
 *                     screen, and a quoted copy is also how the internal
 *                     vocabulary would reach a person, so the internal words are
 *                     asserted absent outright.
 *   REAL COMMANDS     Every subcommand the document tells an agent to run is a
 *                     subcommand the engine actually has.
 *
 * ⚠️ Rail numbers are NOT checked here, deliberately. A reference file is read by
 * the agent, and naming the doctrine that binds a step is the point of it. What
 * may never carry a rail number is a string a person reads, and this file quotes
 * none, which is the assertion below.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { documentOrder, exclusionItems, nodesById } from './_harness.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENGINE = join(REPO, 'skill', 'scripts', 'triage.py');
const REFERENCE_DIR = join(REPO, 'skill', 'reference');
const RELAY = join(REFERENCE_DIR, 'init.md');

const relay = readFileSync(RELAY, 'utf8');

/** Sibling command names, from the files that ship. Never a list typed here. */
const siblingCommands = readdirSync(REFERENCE_DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''))
  .filter((name) => name !== 'init');

/** Fenced blocks, extracted; and the prose with fences and inline code removed. */
const fencedBlocks = [...relay.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map((m) => m[1]);
const prose = relay
  .replace(/^```[^\n]*\n[\s\S]*?^```/gm, '\n')
  .replace(/`[^`\n]*`/g, ' ');

test('the scan read something. An absence claim over nothing is worthless', () => {
  assert.ok(relay.length > 2000, `init.md is ${relay.length} bytes, too small to be the body`);
  assert.ok(!/STATUS:\s*stub/i.test(relay), 'init.md is still marked a stub');
  assert.ok(documentOrder.length > 0, 'the contract enumeration found no nodes');
  assert.ok(exclusionItems.length > 0, 'the contract enumeration found no exclusion items');
  assert.ok(siblingCommands.length > 0, 'no sibling reference files found. The scan is broken');
  assert.ok(fencedBlocks.length > 0, 'init.md shows no command at all');
  assert.ok(prose.length > 1000, `only ${prose.length} bytes of prose left to scan`);
});

/* ── NO NODE NAMED ───────────────────────────────────────────────────────── */

test('the relay names no node in the contract, enumerated, not typed', () => {
  const named = [];
  for (const id of [...documentOrder, ...exclusionItems.map((i) => i.id)]) {
    assert.ok(id.length > 0, 'an enumerated id is empty. The scan is broken');
    if (new RegExp(`\\b${id}\\b`).test(relay)) named.push(id);
  }
  assert.deepEqual(
    named,
    [],
    `init.md names ${named.length} contract node(s)/item(s): ${named.join(', ')}.\n` +
      'Naming one is how a relay starts deciding what the engine owns. The list is ' +
      'enumerated from tree.json, so it is whatever the contract holds.',
  );
});

test('and no id-SHAPED token either, which covers the engine\'s own screens', () => {
  // The engine has authored screens whose ids are not in the contract and cannot
  // be enumerated from it. One capital letter followed by one or two digits is the
  // shape every id in this project uses, contract and authored alike.
  const shaped = [...new Set(relay.match(/\b[A-Z][0-9]{1,2}\b/g) ?? [])];
  assert.deepEqual(
    shaped,
    [],
    `init.md carries id-shaped token(s): ${shaped.join(', ')}. If one of those is a ` +
      'node, the relay has started branching. If it is a coincidence, reword it, ' +
      'this check is cheap and the failure it prevents is not.',
  );
});

/* ── NO MENU ─────────────────────────────────────────────────────────────── */

test('there is no menu: no table, and no command heading a list item', () => {
  const tableRows = relay.split('\n').filter((line) => /^\s*\|/.test(line));
  assert.deepEqual(
    tableRows,
    [],
    'init.md contains a table. A table of what this can do is the menu shape, and ' +
      'a menu is a recall interface for someone whose recall is gone.',
  );

  const offered = [];
  for (const line of relay.split('\n')) {
    const item = /^\s*(?:[-*+]|\d+\.)\s+(.*)$/.exec(line);
    if (!item) continue;
    const head = item[1].replace(/[`*_[\]]/g, '').trim().toLowerCase();
    for (const name of siblingCommands) {
      if (head.startsWith(name)) offered.push(`${name}: ${line.trim().slice(0, 60)}`);
    }
  }
  assert.deepEqual(
    offered,
    [],
    `init.md offers other commands as choices: ${offered.join(' / ')}`,
  );
});

test('no sibling command is named in the prose at all', () => {
  // Checked against the prose with fences and inline code stripped, so the engine's
  // own filename does not read as an offer of the command that shares its name.
  const mentioned = siblingCommands.filter((name) =>
    new RegExp(`\\b${name.replace(/-/g, '\\-')}\\b`, 'i').test(prose),
  );
  assert.deepEqual(
    mentioned,
    [],
    `init.md names other command(s) in prose: ${mentioned.join(', ')}. Routing to a ` +
      'named command is the dispatcher\'s job; a relay that lists them has built a menu.',
  );
});

/* ── NO SCREEN TEXT ──────────────────────────────────────────────────────── */

test('the relay quotes no screen text, so it cannot drift from a screen', () => {
  const quoted = relay.split('\n').filter((line) => /^\s*>/.test(line));
  assert.deepEqual(
    quoted,
    [],
    `init.md quotes ${quoted.length} line(s) of screen text. A copy of a question is ` +
      'a different question, and the engine owns the wording.',
  );

  for (const block of fencedBlocks) {
    for (const line of block.split('\n')) {
      if (line.trim().length === 0) continue;
      assert.match(
        line,
        /^\s*(#|python3\s)/,
        `a fenced block in init.md holds something that is not a command: ${line.trim()}`,
      );
    }
  }
});

test('the internal vocabulary is absent outright, not merely unquoted', () => {
  const banned = ['manifest', 'hash', 'custody', 'layer', 'classification', 'adversarial'];
  const lower = relay.toLowerCase();
  const hits = banned.filter((word) => lower.includes(word));
  assert.deepEqual(
    hits,
    [],
    `init.md contains ${hits.join(', ')}. Those words may not reach a person, and the ` +
      'safe rule for the one file that stands between the engine and a person is that ' +
      'they do not appear in it at all.',
  );
});

/* ── REAL COMMANDS ───────────────────────────────────────────────────────── */

test('every command the relay tells an agent to run really exists', () => {
  const help = spawnSync('python3', [ENGINE, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, `the engine has no usable help:\n${help.stderr}`);

  const invocations = fencedBlocks
    .flatMap((block) => block.split('\n'))
    .filter((line) => line.trim().startsWith('python3'));
  assert.ok(invocations.length > 0, 'init.md shows no engine invocation. The scan is broken');

  for (const line of invocations) {
    assert.match(
      line,
      /triage\.py/,
      `init.md tells an agent to run something other than the engine: ${line.trim()}`,
    );
    const after = line.split(/triage\.py\s+/)[1] ?? '';
    const sub = after.trim().split(/\s+/)[0];
    assert.ok(sub && /^[a-z][a-z-]*$/.test(sub), `no subcommand in: ${line.trim()}`);
    assert.ok(
      help.stdout.includes(sub),
      `init.md names the subcommand "${sub}", which the engine does not offer.\n` +
        `Engine help:\n${help.stdout}`,
    );
  }
});

/**
 * ⚠️ `assert.ok(re.test(…), msg)` rather than `assert.match`, deliberately. A
 * failed `match` prints the whole document as `actual`, which buries the one
 * sentence that is missing under several thousand characters of the ones that are
 * not. A failure nobody reads is a failure that gets ignored.
 */
function says(pattern, message) {
  assert.ok(pattern.test(relay), `init.md ${message}`);
}

test('the relay names --workspace, and says why the folder has to be named', () => {
  // 🔴 The trap this exists for: when the folder is created the state file moves
  // into it, so a later call from a folder ABOVE it finds nothing. Continuing
  // then merely asks; STARTING again writes a second state file where you stand,
  // above the real one, and the person's answers appear to be gone.
  says(/--workspace/, 'never names --workspace, so an agent will lose the folder');
  says(
    /state file moves/i,
    'does not say that the state file moves into the new folder. That is the ' +
      'difference between resuming and appearing to have lost everything',
  );
  says(
    /confirmation screen/i,
    'does not say where the folder path comes from. The person may type their own, ' +
      'so the path is whatever the engine confirmed, not what was proposed',
  );
});

test('the refusals are described as the engine\'s, and the list is not the set', () => {
  // ⚠️ A prose enumeration of a rule set drifts out of step with the rules. This
  // project has already shipped that defect. So the document must send the reader
  // to the engine rather than to its own list.
  says(
    /read the refusals from the engine/i,
    'does not send the reader to the engine for the refusals, so its own list ' +
      'becomes the source of truth and will go stale',
  );
  says(
    /not a count and is not the set/i,
    'does not say that its refusal list is neither complete nor a count',
  );
  // The refusal added most recently, named because a list missing it reads as
  // complete. One ordinary command publishes everything in such a folder.
  says(
    /keeps its own history of every file/i,
    'does not name the refusal for a folder inside a version-controlled project, ' +
      'which is the newest of them and the least obvious',
  );
});

/* ── the generated copies ────────────────────────────────────────────────── */

/** A generated copy of the relay. */
function generated(provider) {
  return readFileSync(
    join(REPO, provider, 'skills', 'machine-witness', 'reference', 'init.md'),
    'utf8',
  );
}

test('each provider copy names its OWN engine path, not a placeholder', () => {
  // ⚠️ `plugin/` is excluded on purpose: the build mirrors it byte-for-byte from
  // the Claude tree, so it carries that tree's path by design. The mirror is
  // asserted below instead. Checking it for its own name here would be asserting
  // a property the build does not have.
  let checked = 0;
  for (const provider of ['.claude', '.codex']) {
    const text = generated(provider);
    assert.ok(!text.includes('{{'), `the ${provider} copy still holds a placeholder`);
    const wanted = `python3 ${provider}/skills/machine-witness/scripts/triage.py`;
    assert.ok(
      text.includes(wanted),
      `the ${provider} copy of init.md does not tell an agent to run its own engine ` +
        `(${wanted} not found)`,
    );
    checked += 1;
  }
  assert.equal(checked, 2, `only ${checked} provider copies checked`);
});

test('the packaged mirror is byte-identical to the tree it mirrors', () => {
  assert.equal(
    generated('plugin'),
    generated('.claude'),
    'plugin/ is meant to be a byte-identical mirror, so the packaged plugin and the ' +
      'in-repo skill cannot drift. It has drifted.',
  );
});

test('no contract node id survives into the generated copies either', () => {
  // The build substitutes into markdown, so a placeholder could in principle
  // expand into something id-shaped. Cheap to rule out, and it closes the loop.
  for (const provider of ['.claude', '.codex', 'plugin']) {
    const text = readFileSync(
      join(REPO, provider, 'skills', 'machine-witness', 'reference', 'init.md'),
      'utf8',
    );
    const named = [...documentOrder, ...exclusionItems.map((i) => i.id)].filter((id) =>
      new RegExp(`\\b${id}\\b`).test(text),
    );
    assert.deepEqual(named, [], `${provider} copy of init.md names ${named.join(', ')}`);
    assert.ok(nodesById.size > 0, 'the contract scan is broken');
  }
});
