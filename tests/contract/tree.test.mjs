/**
 * tests/contract/tree.test.mjs: is skill/data/tree.json still the contract?
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 READ THIS BEFORE "SIMPLIFYING" ANYTHING IN HERE.
 *
 * There are two different questions in this file and only one of them is
 * answered by the deep-compare.
 *
 *   FRESHNESS, "is tree.json a current build of tree.yaml?"
 *       Answered by `test: tree.json deep-equals a fresh parse`. Catches a stale
 *       artifact, an edited JSON, a forgotten rebuild.
 *
 *   FIDELITY, "did the parse preserve what the YAML actually says?"
 *       NOT answered by the deep-compare. Both sides of that comparison come
 *       out of the SAME parser, so a parser bug corrupts both sides identically
 *       and the deep-compare still passes, green, forever. Swap in a parser that
 *       coerces `yes` to `true` and both sides carry the boolean; nothing in the
 *       deep-compare can see it.
 *
 * Fidelity therefore comes from assertions that do NOT go through the parser
 * twice:
 *
 *   1. Counts and id lists derived by REGEX from the raw YAML bytes, then
 *      required to be present in the parsed JSON. If the parser drops a node,
 *      the raw text still names it.
 *   2. Four folded (`>`) scalar values asserted BYTE-FOR-BYTE against literals
 *      transcribed from the file by hand, including the stray `"` inside
 *      X4.why, which is part of the value and must survive.
 *   3. `"yes"` / `"no"` / `"unsure"` asserted to be STRINGS. A coercing parser
 *      produces the object key "true"; the test demands "yes" present and
 *      "true" absent, which no coercing parser can satisfy. Verified by
 *      experiment, see the note above that test for exactly which defence is
 *      carrying the weight, because it is not the one you would guess.
 *
 * Delete any of those three and this file goes back to proving only that a
 * build ran.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse as parseYaml } from 'yaml';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const YAML_PATH = join(REPO, 'skill', 'data', 'tree.yaml');
const JSON_PATH = join(REPO, 'skill', 'data', 'tree.json');
const SHA_PATH = join(REPO, 'skill', 'data', 'tree.sha256');

for (const [label, p] of [
  ['skill/data/tree.yaml', YAML_PATH],
  ['skill/data/tree.json', JSON_PATH],
  ['skill/data/tree.sha256', SHA_PATH],
]) {
  assert.ok(
    existsSync(p),
    `${label} is missing. Run \`node scripts/build.mjs\`: tree.json and tree.sha256 ` +
      'are build outputs and the engine refuses to run without them.',
  );
}

const rawYaml = readFileSync(YAML_PATH, 'utf8');
const jsonBytes = readFileSync(JSON_PATH);
const jsonText = jsonBytes.toString('utf8');
const built = JSON.parse(jsonText);

// Same options the build uses. Explicit, not inherited from a default.
const PARSE_OPTS = { version: '1.2', schema: 'core', uniqueKeys: true };

/* ── the inputs are non-empty. A check on nothing prints the same green as a
      check on a clean tree. ─────────────────────────────────────────────── */

test('inputs are non-empty', () => {
  assert.ok(rawYaml.length > 1000, `tree.yaml is suspiciously small: ${rawYaml.length} bytes`);
  assert.ok(jsonBytes.length > 1000, `tree.json is suspiciously small: ${jsonBytes.length} bytes`);
  assert.equal(typeof built, 'object');
  assert.notEqual(built, null);
  assert.ok(Object.keys(built).length >= 7, 'tree.json has almost no top-level keys');
});

/* ── FRESHNESS ────────────────────────────────────────────────────────────── */

test('tree.json deep-equals a fresh parse of tree.yaml (FRESHNESS, not fidelity)', () => {
  const fresh = parseYaml(rawYaml, PARSE_OPTS);
  // Round-trip the fresh parse through JSON so the comparison is against what
  // JSON can actually represent, which is what the engine will read.
  assert.deepStrictEqual(built, JSON.parse(JSON.stringify(fresh)));
});

test('tree.sha256 matches the bytes of tree.json', () => {
  const shaFile = readFileSync(SHA_PATH, 'utf8');
  assert.ok(shaFile.trim().length > 0, 'tree.sha256 is empty');

  // Format is `shasum -a 256` output naming the sibling file, so
  // `cd skill/data && shasum -a 256 -c tree.sha256` verifies it, and a Python
  // consumer takes field 0.
  const [recorded, named] = shaFile.trim().split(/\s+/);
  assert.match(recorded, /^[0-9a-f]{64}$/, `not a sha256 digest: ${recorded}`);
  assert.equal(named, 'tree.json');

  const actual = createHash('sha256').update(jsonBytes).digest('hex');
  assert.equal(recorded, actual, 'tree.sha256 does not match tree.json: rebuild');
});

/* ── FIDELITY 1: every node id in the raw YAML survives into the JSON, with
      its human-facing fields. ─────────────────────────────────────────────── */

/** Collect every object carrying an `id` out of the parsed JSON. */
function nodesById(root) {
  const found = new Map();
  const walk = (v) => {
    if (Array.isArray(v)) {
      for (const item of v) walk(item);
      return;
    }
    if (v === null || typeof v !== 'object') return;
    if (typeof v.id === 'string') {
      assert.ok(!found.has(v.id), `duplicate node id in tree.json: ${v.id}`);
      found.set(v.id, v);
    }
    for (const item of Object.values(v)) walk(item);
  };
  walk(root);
  return found;
}

const NODE_ID = /^[ \t]*(?:- )?id: ([HXOTL]\d+)[ \t]*$/gm;
const rawIds = [...rawYaml.matchAll(NODE_ID)].map((m) => m[1]);

// The seven human-facing fields named by the contract build's acceptance
// criteria, plus the two per-layer safety strings, which are user-facing text
// and just as load-bearing (L4's no-contact warning is RAIL 2; L2/L6/L10's
// priority notes are the clock). Prefix-colliding names come first so
// `note_to_user` and `priority_note` never resolve as `note`.
const FIELDS = [
  'note_to_user',
  'priority_note',
  'options',
  'warning',
  'title',
  'note',
  'text',
  'why',
  'ask',
];
const FIELD_LINE = new RegExp(`^[ \\t]+(${FIELDS.join('|')}):`);

/**
 * Which of FIELDS appear under each id, read from the raw YAML text. A block
 * ends at the next `id:` line or at the next column-0 line (a top-level key or
 * a section comment), folded-scalar continuation lines are indented, so they
 * are inside the block and their content cannot be mistaken for a key.
 */
function rawFieldsById() {
  const lines = rawYaml.split('\n');
  const out = new Map();
  let currentId = null;
  for (const line of lines) {
    const idMatch = line.match(/^[ \t]*(?:- )?id: ([A-Za-z0-9_]+)[ \t]*$/);
    if (idMatch) {
      currentId = /^[HXOTL]\d+$/.test(idMatch[1]) ? idMatch[1] : null;
      if (currentId) out.set(currentId, new Set());
      continue;
    }
    if (/^[A-Za-z_#]/.test(line)) {
      currentId = null;
      continue;
    }
    if (!currentId) continue;
    const fieldMatch = line.match(FIELD_LINE);
    if (fieldMatch) out.get(currentId).add(fieldMatch[1]);
  }
  return out;
}

test('every H/X/O/T/L id in the YAML is present in the JSON', () => {
  assert.ok(rawIds.length > 0, 'regex found no node ids in the raw YAML. The scan is broken');
  assert.equal(new Set(rawIds).size, rawIds.length, 'duplicate node id in the raw YAML');

  const parsed = nodesById(built);
  const missing = rawIds.filter((id) => !parsed.has(id));
  assert.deepEqual(missing, [], `tree.json is missing node(s): ${missing.join(', ')}`);

  // And nothing invented: every H/X/O/T/L node in the JSON is named in the YAML.
  const extra = [...parsed.keys()].filter((id) => /^[HXOTL]\d+$/.test(id) && !rawIds.includes(id));
  assert.deepEqual(extra, [], `tree.json invented node(s): ${extra.join(', ')}`);
});

test('ask / options / text / why / note / note_to_user / title survive per node', () => {
  const parsed = nodesById(built);
  const rawFields = rawFieldsById();
  assert.ok(rawFields.size > 0, 'raw field scan found nothing. The scan is broken');

  let checked = 0;
  for (const id of rawIds) {
    const node = parsed.get(id);
    const expected = [...rawFields.get(id)].sort();
    const actual = FIELDS.filter((f) => Object.hasOwn(node, f)).sort();
    assert.deepEqual(
      actual,
      expected,
      `${id}: fields in tree.json (${actual.join(',') || '(none)'}) ` +
        `do not match the YAML text (${expected.join(',') || '(none)'})`,
    );
    for (const f of expected) {
      const v = node[f];
      if (Array.isArray(v)) {
        assert.ok(v.length > 0, `${id}.${f} became an empty array`);
        for (const item of v) assert.equal(typeof item, 'string', `${id}.${f} item is not a string`);
      } else {
        assert.equal(typeof v, 'string', `${id}.${f} is not a string`);
        assert.ok(v.trim().length > 0, `${id}.${f} became empty`);
      }
      checked += 1;
    }
  }
  assert.ok(checked > 40, `only ${checked} field values checked, expected far more`);
});

/* ── FIDELITY 2: the folded (`>`) scalars, byte-for-byte. ──────────────────── */

// Transcribed from skill/data/tree.yaml by hand. These literals are the ONLY
// assertions in this file that do not pass through the YAML parser, which is
// exactly why they are here. Folded blocks join their lines with single spaces
// and, under clip chomping, end with exactly one newline.
//
// ⚠️ X4.why USED TO END WITH A STRAY `"` inside the folded content, and this
// fixture asserted it was preserved, because a parser dropping a character out of
// a contract value is a defect whether or not the character was meant. Amendment
// A3 removed it at the source, along with the sentence about remote images, so the
// literal below is the amended value. ⛔ Refreshing a transcribed fixture after an
// amendment is the whole point of transcribing it: the diff has to be looked at by
// somebody. Amendment procedure: `AGENTS.md` section 7.
const FOLDED = [
  {
    label: 'X4.why',
    nodeId: 'X4',
    field: 'why',
    value:
      'Reading is fine. A link is not: it often carries a code unique to you, so following it ' +
      'writes a dated entry, TODAY, into the very record your lawyer is about to ask for. Save ' +
      'the whole message as a file and let them open it. If you need to know where a link goes, ' +
      'tell your lawyer rather than finding out.\n',
  },
  {
    label: 'X7.text',
    nodeId: 'X7',
    field: 'text',
    value:
      'Do not go anywhere you know the other person to be — including places you only recently ' +
      'learned they go, and including a TYPE of place or area they are known to use, not just a ' +
      'specific address.\n',
  },
  {
    label: 'O4.text',
    nodeId: 'O4',
    field: 'text',
    value:
      'For every required act, keep proof you did it — a receipt, a confirmation, a sent ' +
      'message, a photograph, a note of who you spoke to and when. Also record every ' +
      'FAILED ATTEMPT: if you tried to comply and could not, that attempt is evidence and ' +
      'it disappears if you do not write it down the same day.\n',
  },
  {
    label: 'phase_3_output.block_c.closing_text',
    nodeId: null, // not an id-bearing node, reached by explicit path
    field: 'closing_text',
    value:
      'This tells you what to save. It does not tell you how strong anything is, and it cannot ' +
      'prove you did not do something. Nothing can.\n',
  },
];

test('the fixture set still covers every folded (>) block in the contract', () => {
  // If someone adds a fifth folded block, this fails and asks for it to be
  // added to FOLDED rather than silently going unverified.
  const foldedSites = [...rawYaml.matchAll(/^[ \t]+[A-Za-z_]+: >[ \t]*$/gm)];
  assert.ok(foldedSites.length > 0, 'found no folded blocks in the raw YAML. The scan is broken');
  assert.equal(
    foldedSites.length,
    FOLDED.length,
    `tree.yaml has ${foldedSites.length} folded (>) blocks but FOLDED covers ${FOLDED.length}. ` +
      'Add the new one, byte-for-byte, or the multi-line scalars stop being verified.',
  );
});

test('folded (>) scalars survive byte-for-byte', () => {
  const parsed = nodesById(built);
  let compared = 0;
  for (const { label, nodeId, field, value } of FOLDED) {
    // Resolve through the node-id map so the assertion does not depend on array
    // ordering, which is a different property tested above.
    const container = nodeId ? parsed.get(nodeId) : built.phase_3_output?.block_c;
    assert.ok(container, `could not resolve ${label}`);
    assert.equal(typeof container[field], 'string', `${label} is not a string`);
    assert.equal(container[field], value, `${label} does not match the YAML byte-for-byte`);
    compared += 1;
  }
  assert.equal(compared, FOLDED.length);

  // ⚠️ THE STRAY `"` INSIDE X4.why IS GONE — amendment A3 removed it at the source —
  // and the assertion that named it is NOT replaced with one that inverts it. A
  // "there is no quote any more" check could never fire: the literal above compares
  // the whole value byte-for-byte, so it throws first, and a check downstream of an
  // equality on the same string is dead weight dressed up as coverage.
  //
  // 🔴 SO THIS IS THE CHOMPING PROPERTY MADE TOTAL INSTEAD, which the four
  // transcriptions genuinely cannot cover: a FIFTH folded block added to the
  // contract, chomped `>-` or `>+` by accident, changes what a person reads at the
  // end of a warning and every literal above still passes. Counted from the raw
  // YAML, so the scan cannot come up empty and call that agreement.
  const foldedBlocks = [...rawYaml.matchAll(/^[ \t]*(\w+): >[-+]?[ \t]*$/gm)];
  assert.ok(
    foldedBlocks.length >= FOLDED.length,
    `the raw YAML holds ${foldedBlocks.length} folded blocks but ${FOLDED.length} are ` +
      'transcribed above, so the scan below is reading less than it thinks',
  );
  const plain = [...rawYaml.matchAll(/^[ \t]*\w+: >[-+][ \t]*$/gm)];
  assert.deepEqual(
    plain.map((m) => m[0].trim()),
    [],
    'a folded block in the contract is chomped `>-` or `>+`. Every other assertion ' +
      'in this file passes either way, and the difference is what a person reads at ' +
      'the end of a warning.',
  );

  let ends = 0;
  const walk = (value) => {
    if (typeof value === 'string') {
      if (value.endsWith('\n')) {
        ends += 1;
        assert.ok(
          !value.endsWith('\n\n') && !/[ \t]\n$/.test(value),
          `a contract value ends with more than one clean newline: ${JSON.stringify(value.slice(-40))}`,
        );
      }
      return;
    }
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(built);
  assert.equal(
    ends,
    foldedBlocks.length,
    `${foldedBlocks.length} folded blocks in the YAML produced ${ends} values ending ` +
      'in a newline. They should be the same number; a mismatch means one was ' +
      'chomped away or something else grew a trailing newline.',
  );
});

/* ── FIDELITY 3: no YAML 1.1 boolean coercion. ────────────────────────────── */

/**
 * ⚠️ TWO INDEPENDENT DEFENCES, and it is worth knowing which one is doing the
 * work, because they protect against different futures.
 *
 *   1. tree.yaml QUOTES its branch keys and options. Verified by experiment: a
 *      YAML 1.1 parser run over the contract AS WRITTEN still returns the
 *      strings "yes"/"no"/"unsure", because they are quoted.
 *   2. The build pins YAML 1.2 core schema. Verified by experiment: with the
 *      quotes removed (the shape a careless contract amendment produces) a 1.1
 *      parser returns `options: [true, false, "unsure"]` and branch keys
 *      `["true","unsure","false"]`, while 1.2 core still returns the strings.
 *
 * So the current green does NOT prove the parser choice matters today; the
 * quoting alone would carry it. It proves the pair holds, and it is the thing
 * that fails the moment either one is dropped. Keep both.
 */
test('"yes" / "no" / "unsure" are STRINGS, not booleans', () => {
  const parsed = nodesById(built);

  // Every branch map in the contract, found through the JSON.
  const branchNodes = [...parsed.entries()].filter(([, n]) => n.branch);
  assert.ok(branchNodes.length > 0, 'found no branch maps. The scan is broken');

  let keysChecked = 0;
  for (const [id, node] of branchNodes) {
    const keys = Object.keys(node.branch);
    assert.ok(keys.length > 0, `${id}.branch is empty`);
    for (const k of keys) {
      // A YAML 1.1 parser resolves bare `yes` to true, and the object key
      // becomes "true". Both of these must therefore be absent.
      assert.notEqual(k, 'true', `${id}.branch has a coerced boolean key. Parser is YAML 1.1`);
      assert.notEqual(k, 'false', `${id}.branch has a coerced boolean key. Parser is YAML 1.1`);
      keysChecked += 1;
    }
  }
  assert.ok(keysChecked >= 9, `only ${keysChecked} branch keys checked`);

  // The two hazard-gate questions whose branch keys are the safety-critical
  // ones. RAIL 9. Their quoting in the contract is a guard; see the note above.
  for (const id of ['H1', 'H2']) {
    const node = parsed.get(id);
    assert.deepEqual(node.options, ['yes', 'no', 'unsure'], `${id}.options coerced`);
    for (const opt of node.options) assert.equal(typeof opt, 'string');
    assert.deepEqual(Object.keys(node.branch).sort(), ['no', 'unsure', 'yes'], `${id}.branch keys`);
  }

  // The map key is `branch:`, not `on:`. `On` is a 1.1 boolean too.
  assert.ok(!Object.hasOwn(parsed.get('H1'), 'on'), 'H1 has an `on` key');
  assert.ok(!Object.hasOwn(parsed.get('H1'), 'true'), 'H1 has a coerced `on` key');

  // …and the converse: real booleans are still real booleans, so this is not a
  // parser that turned everything into a string.
  assert.equal(built.meta.requires_account, false);
  assert.equal(built.meta.transmits_answers, false);
  assert.equal(built.meta.works_offline, true);
  assert.equal(built.meta.jurisdiction.reviewed, false);
  assert.equal(built.meta.version, 0);
  assert.equal(typeof built.meta.version, 'number');
});

/* ── FIDELITY 4: the counts nobody may write in prose. ────────────────────── */

test('the hard-exclusion count is read from the contract and agrees with the JSON', () => {
  // ⛔ Not hard-coded. Root CLAUDE.md §9 row 13: two documents said "seven hard
  // exclusions" long after the list reached fourteen. Count from the file.
  const rawX = [...rawYaml.matchAll(/^[ \t]*- id: (X\d+)[ \t]*$/gm)].map((m) => m[1]);
  assert.ok(rawX.length > 0, 'found no X ids in the raw YAML. The scan is broken');

  const exclusionNode = built.phase_0_hazard.find((n) => n.type === 'hard_exclusions');
  assert.ok(exclusionNode, 'no hard_exclusions node in tree.json');
  assert.equal(
    exclusionNode.items.length,
    rawX.length,
    `tree.json carries ${exclusionNode.items.length} exclusions; the YAML text names ${rawX.length}`,
  );
  assert.deepEqual(
    exclusionNode.items.map((i) => i.id),
    rawX,
    'exclusion ids or their order changed',
  );

  // Every exclusion has non-empty user-facing text. An unread exclusion is an
  // absent exclusion; an empty one is worse.
  for (const item of exclusionNode.items) {
    assert.equal(typeof item.text, 'string');
    assert.ok(item.text.trim().length > 20, `${item.id}.text is too short to be real`);
  }
});

test('the `never:` prohibitions are all present', () => {
  const neverBlock = rawYaml.slice(rawYaml.indexOf('\nnever:'));
  assert.ok(neverBlock.length > 0, 'no never: block in the raw YAML');
  const rawNever = [...neverBlock.matchAll(/^ {2}- ([a-z_]+)[ \t]*(?:#.*)?$/gm)].map((m) => m[1]);
  assert.ok(rawNever.length > 0, 'found no never: entries. The scan is broken');
  assert.deepEqual(built.never, rawNever, '`never:` list changed between YAML and JSON');
});

test('phase and node-group sizes agree with the raw YAML', () => {
  const groups = {
    phase_0_hazard: /^[ \t]*- id: (H\d+)[ \t]*$/gm,
    phase_0c_positive_obligations: /^[ \t]*- id: (O\d+)[ \t]*$/gm,
    phase_1_clock: /^[ \t]*- id: (T\d+)[ \t]*$/gm,
    // ⚠️ The trailing letter is for a QUALIFIER on the node before it — `L2b` asks
    // which phone, after `L2` asks whether there was one. Widening the id shape does
    // not weaken this check: it compares the whole ordered list in both directions,
    // so an id in one file and not the other still fails. What it stops is the check
    // failing on the id shape itself while the two files agree perfectly.
    phase_2_layers: /^[ \t]*- id: (L\d+[a-z]?)[ \t]*$/gm,
  };
  for (const [key, re] of Object.entries(groups)) {
    const ids = [...rawYaml.matchAll(re)].map((m) => m[1]);
    assert.ok(ids.length > 0, `found no ids for ${key}. The scan is broken`);
    assert.ok(Array.isArray(built[key]), `${key} is not an array in tree.json`);
    assert.deepEqual(
      built[key].map((n) => n.id),
      ids,
      `${key}: ids or order differ between tree.yaml and tree.json`,
    );
  }
});
