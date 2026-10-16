/**
 * tests/contract/verbatim.test.mjs. What the person reads is what the contract
 * says, byte for byte.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY BYTES AND NOT MEANING. tree.yaml is not a wording source that a nicer
 * sentence may improve. It is the program, and its user-facing strings were
 * written to be legally safe: "Do not delete OR CANCEL anything" is capitalised
 * on purpose, X12 draws the line between being contacted and replying on one
 * clause, and X4's `why` ends with a stray `"` that is part of the value. A
 * paraphrase, a re-wrap, a trimmed emphasis or a helpfully softened warning is a
 * change to the program, and the amendment procedure exists so that such a
 * change is a deliberate act with a review requirement rather than a render bug.
 *
 * THREE DIRECTIONS, because one of them alone proves very little:
 *
 *   FORWARD    every value the engine claims to have rendered verbatim really is
 *              a value in the contract, and really does appear in that screen's
 *              text. Catches a paraphrase.
 *   BACKWARD   every mandated field present on a node appears on some screen for
 *              that node. Catches a DROPPED field, which forward checking cannot
 *              see: an engine that renders nothing passes a forward check
 *              perfectly.
 *   NEGATIVE   nothing a person reads carries the internal vocabulary or a rail
 *              number. That is a render-policy property, and it lives here
 *              because this is the file that already has every screen in hand.
 *
 * ⚠️ `priority_note` is deliberately NOT in the mandated set. Three of its values
 * contain a word that may not reach a person, it is not one of the fields the
 * contract requires verbatim, and the engine withholds it and re-derives the
 * urgency from `clock`. The last test in this file asserts that the reason still
 * holds, so the exclusion cannot outlive it. Do not "fix" this by adding
 * priority_note to MANDATED, fix it in the contract, which is the owner's.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  contractValues,
  documentOrder,
  driveRoute,
  enumerateRoutes,
  exclusionItems,
  nodesById,
  optionsOf,
  recordNodes,
  stepsOf,
  successorOf,
} from './_harness.mjs';

const routes = enumerateRoutes();
const runs = routes.map((answers) => ({ answers, result: driveRoute(answers) }));
const allScreens = runs.flatMap(({ result }) => result.screens);

/**
 * The fields whose values must reach the person unchanged. The first seven are
 * named by the wave's acceptance criteria; `warning` and `closing_text` are
 * user-facing safety and honesty text of the same weight, L4's `warning` is the
 * no-contact fence and L11's is "do not approach anyone yourself".
 */
const MANDATED = [
  'ask',
  'options',
  'text',
  'why',
  'note',
  'note_to_user',
  'title',
  'warning',
  'closing_text',
];

/** Words that may not appear in anything a person reads. */
const BANNED = ['manifest', 'hash', 'custody', 'layer', 'classification', 'adversarial'];
const RAIL_NUMBER = /rail[\s_-]*\d/i;

test('the scan read something', () => {
  assert.ok(allScreens.length > 0, 'no screens to check');
  assert.ok(
    allScreens.some((s) => s.verbatim.length > 0),
    'not one screen reports a verbatim field. The audit trail is empty and every ' +
      'assertion below would pass on nothing',
  );
});

/* ── FORWARD ─────────────────────────────────────────────────────────────── */

test('every value the engine renders verbatim is a value the contract holds', () => {
  const known = new Map(MANDATED.map((field) => [field, contractValues(field)]));
  for (const [field, values] of known) {
    assert.ok(values.size > 0, `the contract holds no ${field} values. The scan is broken`);
  }

  let checked = 0;
  for (const screen of allScreens) {
    for (const { field, value } of screen.verbatim) {
      assert.ok(
        known.has(field),
        `${screen.node} reports a verbatim field this test does not track: ${field}`,
      );
      assert.ok(
        known.get(field).has(value),
        `${screen.node}.${field} is not a value in the contract. It has been ` +
          `paraphrased, re-wrapped or trimmed.\n  rendered: ${JSON.stringify(value)}`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 60, `only ${checked} verbatim values checked`);
});

test('every rendered value appears in the screen text byte-for-byte', () => {
  let checked = 0;
  for (const screen of allScreens) {
    for (const { field, value } of screen.verbatim) {
      if (field === 'options') {
        assert.ok(
          screen.options.includes(value),
          `${screen.node}: option ${JSON.stringify(value)} is not offered verbatim`,
        );
        checked += 1;
        continue;
      }
      // A folded contract scalar ends with a newline; the screen puts it on its
      // own line, so the newline is the line break. Nothing else may differ.
      const needle = value.endsWith('\n') ? value.slice(0, -1) : value;
      assert.ok(
        screen.text.includes(needle),
        `${screen.node}.${field} is not present in the screen it claims to be on.\n` +
          `  wanted: ${JSON.stringify(needle.slice(0, 120))}\n` +
          `  screen: ${JSON.stringify(screen.text.slice(0, 200))}`,
      );
      assert.ok(
        !value.endsWith('\n') || !screen.text.includes(`${needle}\n\n${needle}`),
        `${screen.node}.${field} appears twice in a row`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 60, `only ${checked} placements checked`);
});

test('the whole value is present, not a prefix of it', () => {
  // A wrapper that truncated at 80 characters would satisfy a substring test on
  // the first line and lose the rest, so the longest values are checked to the
  // last byte and their final clause named separately.
  const longest = allScreens
    .flatMap((screen) => screen.verbatim.map((v) => ({ screen, ...v })))
    .filter((v) => v.field !== 'options' && v.value.length > 150)
    .sort((a, b) => b.value.length - a.value.length)
    .slice(0, 8);
  assert.ok(longest.length > 0, 'the contract holds no long values. The scan is broken');

  for (const { screen, field, value } of longest) {
    const needle = value.endsWith('\n') ? value.slice(0, -1) : value;
    const tail = needle.slice(-40);
    assert.ok(
      screen.text.includes(needle),
      `${screen.node}.${field} is truncated or re-wrapped in the screen`,
    );
    assert.ok(screen.text.includes(tail), `${screen.node}.${field} loses its last clause`);
  }
});

/* ── BACKWARD, the half a forward check cannot see ──────────────────────── */

test('every mandated field on a rendered node appears on a screen for that node', () => {
  const byNode = new Map();
  for (const screen of allScreens) {
    if (!byNode.has(screen.node)) byNode.set(screen.node, []);
    byNode.get(screen.node).push(screen);
  }

  const missing = [];
  let checked = 0;
  for (const id of documentOrder) {
    const screens = byNode.get(id);
    assert.ok(screens && screens.length > 0, `${id} was never rendered`);
    const joined = screens.map((s) => s.text).join('\n');
    const offered = new Set(screens.flatMap((s) => s.options));
    const node = nodesById.get(id);

    for (const field of MANDATED) {
      if (!Object.hasOwn(node, field)) continue;
      const value = node[field];
      if (Array.isArray(value)) {
        for (const item of value) {
          if (!offered.has(item)) missing.push(`${id}.${field}[${JSON.stringify(item)}]`);
          else checked += 1;
        }
        continue;
      }
      const needle = value.endsWith('\n') ? value.slice(0, -1) : value;
      if (!joined.includes(needle)) missing.push(`${id}.${field}`);
      else checked += 1;
    }
  }
  assert.deepEqual(
    missing,
    [],
    `the engine holds back contract field(s) a person must read: ${missing.join(', ')}`,
  );
  assert.ok(checked > 40, `only ${checked} field presences checked`);
});

test('the output blocks the contract declares put their own titles on screen', () => {
  // The plan is assembled rather than routed to, so its fields are the easiest
  // ones to lose without any route test noticing.
  const titles = [...contractValues('title')];
  assert.ok(titles.length > 0, 'the contract declares no titles. The scan is broken');

  const terminal = runs.map(({ result }) => result.screens.at(-1));
  const joined = terminal.map((s) => s.text).join('\n');
  assert.ok(joined.length > 0, 'the terminal screens are empty');

  const shown = titles.filter((t) => joined.includes(t));
  assert.ok(
    shown.length >= 3,
    `only ${shown.length} of ${titles.length} contract titles reach a screen: ` +
      `missing ${titles.filter((t) => !joined.includes(t)).join(' | ')}`,
  );

  const closing = [...contractValues('closing_text')];
  assert.ok(closing.length > 0, 'the contract declares no closing text');
  for (const value of closing) {
    const needle = value.endsWith('\n') ? value.slice(0, -1) : value;
    assert.ok(joined.includes(needle), 'the closing text is not on the final screen');
  }
});

test('a per-record question that reaches the plan keeps the contract wording', () => {
  // The plan restates each record by its own question. If that were rewritten
  // into a label ("building cameras") the person could no longer tell which of
  // their own answers produced the item.
  const { result } = runs[0];
  const plan = result.screens.at(-1);
  const onList = result.records_you_said_yes_to;
  assert.ok(Array.isArray(onList) && onList.length > 0, 'no record reached the plan');
  for (const id of onList) {
    assert.ok(recordNodes.includes(id), `${id} is not a per-record node`);
    assert.ok(
      plan.text.includes(nodesById.get(id).ask),
      `the plan does not name ${id} in the contract's own words`,
    );
  }
});

/* ── NEGATIVE, the engine never volunteers anything about the accusation ──── */

/**
 * The same route, with `pick(nodeId)` choosing a different answer at some nodes.
 *
 * ⚠️ Recomputed as it walks rather than indexed by position, because changing an
 * answer can change the successor and everything after it would then be aligned
 * to the wrong node. A replacement the contract does not offer at that node is
 * ignored, the answer set is the contract's, not this test's.
 */
function routeWith(route, pick) {
  const answers = [...route];
  let id = documentOrder[0];
  let cursor = 0;
  const seen = new Set();
  while (id !== null && cursor < answers.length) {
    if (seen.has(id)) break;
    seen.add(id);
    cursor += stepsOf(id) - 1;
    const wanted = pick(id);
    if (wanted !== undefined && optionsOf(id).includes(wanted)) answers[cursor] = wanted;
    const answer = answers[cursor];
    cursor += 1;
    id = successorOf(id, answer);
  }
  return answers;
}

const withEveryRecordDeclined = (route) =>
  routeWith(route, (id) => (recordNodes.includes(id) ? 'no' : undefined));

test('a record the person does not have carries no caveat about what it cannot show', () => {
  // 🔴 STRUCTURAL, and deliberately blind to the wording. The engine's caveats
  // are its own text, not the contract's, so a test that named one would only
  // check that one. What is asserted is the shape: in the closing checklist, an
  // entry the person is not acting on says so and then stops.
  //
  // The failure this comes from: the checklist printed every caveat for every
  // question, answered or not. So a person who said no to the question about
  // injuries still had a sentence about what a body looks like and what was
  // agreed written into a file on their own machine, having said nothing about
  // any of it. The engine never asks what someone is accused of; it must
  // therefore never volunteer a guess.
  const declined = driveRoute(withEveryRecordDeclined(routes[0]));
  assert.equal(
    declined.records_you_said_yes_to.length,
    0,
    'the walk still said yes to a record, so this check proves nothing',
  );
  assert.ok(declined.records_you_said_no_to.length > 0, 'nothing was declined');

  const plan = declined.screens.at(-1);
  const blocks = plan.text.split('─'.repeat(72));
  const checklist = blocks.at(-1);
  assert.ok(checklist.includes('Not on your list'), `could not find the checklist:\n${plan.text}`);

  let checked = 0;
  let closedByConditions = 0;
  for (const entry of checklist.split('\n· ').slice(1)) {
    // Indented lines only. The block's own closing text sits at column zero
    // after the last entry, and counting it would be a false failure.
    const body = entry.split('\n').slice(1).filter((l) => /^\s+\S/.test(l));
    if (!body.some((l) => l.includes('Not on your list'))) {
      closedByConditions += 1;
      continue;
    }
    assert.equal(
      body.length,
      1,
      `an entry the person is not acting on carries ${body.length} lines. Only the ` +
        `"not on your list" line belongs there:\n${entry}`,
    );
    checked += 1;
  }
  // Every record is accounted for: declined, or shut off by their own answers.
  // The remainder is derived rather than typed, so a contract that closed a
  // second path could not quietly shrink what this test looks at.
  assert.equal(
    checked + closedByConditions,
    recordNodes.length,
    `the checklist accounts for ${checked + closedByConditions} of ${recordNodes.length} records`,
  );
  assert.ok(checked > 0, 'no declined record was examined, the check ran on nothing');
});

/* ── the plan is a list of ACTIONS, and says each thing once ───────────────── */

/** The ordered action list is the block before the first rule. */
const actionBlockOf = (plan) => plan.text.split('─'.repeat(72))[0];

/** The title of each numbered step, in order. */
const numberedTitles = (block) => [...block.matchAll(/^\s*\d+\.\s+(.*)$/gm)].map((m) => m[1]);

test('every numbered step is titled with the action, never with the question', () => {
  // A reader's summary of the whole output was "my action list is a list of the
  // questions it asked me", and one step read "Do this" with nothing for "this"
  // to point at. Derived from the contract: no step title may BE a question the
  // contract asks. The question still has to appear. The test below requires it.
  const asks = new Set(
    documentOrder.map((id) => nodesById.get(id).ask).filter((a) => typeof a === 'string'),
  );
  assert.ok(asks.size > 5, `only ${asks.size} questions collected. The scan is broken`);

  let checked = 0;
  for (const { result } of runs) {
    const titles = numberedTitles(actionBlockOf(result.screens.at(-1)));
    assert.ok(titles.length > 0, 'the plan has no numbered steps at all');
    for (const title of titles) {
      assert.ok(
        !asks.has(title),
        `a numbered step is titled with the question that produced it: ${title}`,
      );
      assert.ok(
        !title.endsWith('?'),
        `a numbered step is titled with a question rather than an instruction: ${title}`,
      );
      checked += 1;
    }
  }
  assert.ok(checked > 10, `only ${checked} numbered steps examined`);
});

test('an item on the plan still says which of their own answers put it there', () => {
  for (const { result } of runs) {
    const block = actionBlockOf(result.screens.at(-1));
    for (const id of result.records_you_said_yes_to) {
      const ask = nodesById.get(id).ask;
      // A closed path is off the list entirely and is explained further down.
      if (!block.includes(ask)) continue;
      assert.ok(
        block.includes(`Because you said yes to: ${ask}`),
        `${id} is on the plan without saying which answer put it there`,
      );
    }
  }
});

test('the plan does not tell the person to get a lawyer twice', () => {
  // ⚠️ Driven with the answer that narrows the plan to preservation only, because
  // the enumeration collapses that branch: every answer to it routes to the same
  // next node, so only one survives. Without this the duplicate could not appear.
  const narrowed = driveRoute(routeWith(routes[0], (id) => (id === 'H4' ? 'no' : undefined)));
  const block = actionBlockOf(narrowed.screens.at(-1));
  assert.match(block, /Get a lawyer\. Today\./, 'the narrowed plan does not lead with counsel');
  assert.equal(
    block.split('Get a lawyer').length - 1,
    1,
    `the plan says "Get a lawyer" more than once, in a list presented as an order ` +
      `of operations:\n${block}`,
  );
  assert.ok(
    !block.includes('IS the action'),
    'the plan still carries the second sentence that duplicated the lawyer step',
  );
  // The thing only a lawyer can do is still THERE, under the step that gets one.
  assert.match(
    block,
    /a lawyer is the only person who can do them/,
    'the records only a lawyer can act on vanished instead of moving under step 1',
  );
});

/* ── where the person is, on every screen ──────────────────────────────────── */

test('every screen says where the person is, and both numbers are derived', () => {
  // A reader said the exclusion list's own "Screen 1 of 4; 14 in all" was the
  // only place in the flow where they knew how much was left, and asked for it
  // everywhere.
  //
  // 🔴 The ceiling is recomputed HERE, from the contract, independently of the
  // engine: one opening screen, every screen the contract's nodes occupy, and the
  // plan. The folder screens are not in it because the stateless surface has no
  // disk and does not ask for one. If the engine started typing a number instead
  // of deriving it, these two would part company.
  const ceiling = 1 + documentOrder.reduce((sum, id) => sum + stepsOf(id), 0) + 1;

  let checked = 0;
  for (const { result } of runs) {
    let previous = 0;
    for (const screen of result.screens) {
      // ⚠️ Anchored to the start of a line, because the counter occupies a line by
      // itself and the exclusion list's own "Screen 1 of 4" header does not. An
      // unanchored pattern would read the header's numbers on four screens and
      // compare THOSE against the ceiling.
      //
      // The last screen drops the `~`. There is nothing left to skip.
      const found = /^\s*(\d+)\s*\/\s*~?(\d+)/m.exec(screen.rendered);
      assert.ok(found, `${screen.node} does not say where the person is`);
      assert.equal(
        Number(found[1]),
        previous + 1,
        `${screen.node} is screen ${found[1]}, one after ${previous} expected`,
      );
      assert.equal(
        Number(found[2]),
        ceiling,
        `${screen.node} says there are at most ${found[2]} screens; the contract ` +
          `allows ${ceiling}`,
      );
      previous = Number(found[1]);
      checked += 1;
    }
    assert.ok(previous <= ceiling, `a run reached screen ${previous} of ${ceiling}`);
  }
  assert.ok(checked > 20, `only ${checked} screens examined`);
});

/* ── a closed path replaces the instruction, it does not sit beside it ─────── */

/**
 * Which sentences of a note FORBID something.
 *
 * ⚠️ A SECOND, INDEPENDENT implementation of the engine's rule, deliberately.
 * Sharing the engine's list would make this test agree with the engine by
 * construction; two readings disagreeing is a real finding about which sentences
 * are instructions.
 */
const PROHIBITION_MARKERS = ['do not', "don't", 'never', 'must not', 'stop'];
const sentencesOf = (text) =>
  text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
const forbidsIn = (text) =>
  sentencesOf(text).filter((s) => PROHIBITION_MARKERS.some((m) => s.toLowerCase().includes(m)));

/** Whether a run's plan reports this record as shut off by their own answers. */
function closedInPlan(planText, ask) {
  const at = planText.indexOf(`· ${ask}`);
  if (at < 0) return false;
  const entry = planText.slice(at).split('\n· ')[0];
  return entry.includes('Left off your list');
}

test('a screen never tells the person to obtain a record their own answer closed', () => {
  // The contract's note on the messaging record carries both halves in one
  // string: how to export it, and not to open it if a no-contact condition
  // applies. A reader met them in consecutive sentences WHEN THE ENGINE ALREADY
  // KNEW the condition applied. The instructing half is withheld; the forbidding
  // half is rendered verbatim. Nothing here names a node or a sentence.
  let whenClosed = 0;
  let whenOpen = 0;
  for (const { result } of runs) {
    const plan = result.screens.at(-1).text;
    for (const id of recordNodes) {
      const note = nodesById.get(id).warning;
      if (typeof note !== 'string' || note.trim().length === 0) continue;
      const forbids = forbidsIn(note);
      const instructs = sentencesOf(note).filter((s) => !forbids.includes(s));
      if (forbids.length === 0 || instructs.length === 0) continue; // nothing to split
      const own = result.screens.filter((s) => s.node === id).map((s) => s.text).join('\n');
      if (own.length === 0) continue;

      if (closedInPlan(plan, nodesById.get(id).ask)) {
        for (const sentence of instructs) {
          assert.ok(
            !own.includes(sentence),
            `${id}'s screen tells the person to go and get a record their own ` +
              `answer closed: "${sentence}"`,
          );
        }
        for (const sentence of forbids) {
          assert.ok(
            own.includes(sentence),
            `${id}'s screen dropped the half of the note that forbids: "${sentence}"`,
          );
        }
        whenClosed += 1;
      } else {
        assert.ok(
          own.includes(note.trim()),
          `${id}'s note is withheld on a route where nothing closes it. Withholding ` +
            'is for a closed path only.',
        );
        whenOpen += 1;
      }
    }
  }
  // ⚠️ BOTH directions must have been exercised. One alone passes trivially: a
  // run of routes that never closes anything proves nothing about the closed
  // case, and vice versa.
  assert.ok(whenClosed > 0, 'no route closed a path. The replacement was never checked');
  assert.ok(whenOpen > 0, 'no route left a path open. The control was never checked');
});

/* ── NEGATIVE, the internal vocabulary never reaches a person ───────────── */

test('no screen shows the internal vocabulary or a rail number', () => {
  let scanned = 0;
  for (const screen of allScreens) {
    const lower = screen.text.toLowerCase();
    const hits = BANNED.filter((word) => lower.includes(word));
    assert.deepEqual(
      hits,
      [],
      `${screen.node} step ${screen.step} shows ${hits.join(', ')} to a person.\n` +
        'Those are internal words. A person under accusation does not know them, ' +
        'and a screen they cannot parse is a screen that does not work.',
    );
    assert.ok(
      !RAIL_NUMBER.test(screen.text),
      `${screen.node} step ${screen.step} shows a rail number to a person`,
    );
    scanned += screen.text.length;
  }
  assert.ok(scanned > 5000, `only ${scanned} characters scanned, too little to be real`);
});

test('no machine token reaches a screen', () => {
  // The contract's `action`, `limits`, `layer`, `fence`, `clock_flag` and
  // `density` values are identifiers, not sentences. `see_a_clinician_today` on
  // screen is the "what does that word mean" failure, and it is the shape a
  // renderer falls into when a field has no plain-language line.
  const tokens = new Set();
  for (const field of ['action', 'limits', 'layer', 'fence', 'density', 'clock_flag']) {
    for (const value of contractValues(field)) tokens.add(value);
  }
  assert.ok(tokens.size > 10, `only ${tokens.size} machine tokens collected. The scan is broken`);

  // ⚠️ WORD BOUNDARIES, and not as a softening. Some tokens are ordinary English
  // words (`density: low`) so a substring search matches "following" and
  // reports a leak that is not one. A false failure trains people to ignore the
  // check, which costs more than the case it would have caught. The general fix
  // is a correct match, never an exempted token: `see_a_clinician_today` and
  // `RAIL_6` still fail here, which is verified by planting one.
  const joined = allScreens.map((s) => s.text).join('\n');
  const leaked = [...tokens].filter((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`).test(joined);
  });
  assert.deepEqual(leaked, [], `machine token(s) rendered to a person: ${leaked.join(', ')}`);
});

/* ── the withheld field, and the reason it is withheld ──────────────────── */

test('priority_note is withheld, and the reason for withholding it still holds', () => {
  const carriers = documentOrder.filter((id) => Object.hasOwn(nodesById.get(id), 'priority_note'));
  assert.ok(carriers.length > 0, 'the contract carries no priority_note. The scan is broken');

  const joined = allScreens.map((s) => s.text).join('\n');
  for (const id of carriers) {
    assert.ok(
      !joined.includes(nodesById.get(id).priority_note),
      `${id}.priority_note reached a screen. It carries internal vocabulary, and ` +
        'the negative test above would fail next.',
    );
  }

  // 🔴 The reason, asserted. If no priority_note carries a banned word any more,
  // the exclusion has outlived its justification and belongs in MANDATED, but
  // that is a decision, taken deliberately, not a green test drifting.
  const stillOffending = carriers.filter((id) => {
    const lower = nodesById.get(id).priority_note.toLowerCase();
    return BANNED.some((word) => lower.includes(word)) ||
      RAIL_NUMBER.test(nodesById.get(id).priority_note);
  });
  assert.ok(
    stillOffending.length > 0,
    'no priority_note carries internal vocabulary any more, so withholding the ' +
      'field is no longer justified. Either the contract was amended, in which ' +
      'case add priority_note to MANDATED and delete this test, or the check is ' +
      'broken.',
  );

  // …and the urgency it carried is not simply lost: the clock words reach the
  // plan for every record on the list.
  const { result } = runs[0];
  const plan = result.screens.at(-1);
  const urgent = result.records_you_said_yes_to.filter(
    (id) => nodesById.get(id).clock_flag === 'RED',
  );
  assert.ok(urgent.length > 0, 'no urgent record on this route, the check ran on nothing');
  assert.ok(
    plan.text.toLowerCase().includes('today'),
    'the plan does not convey urgency for a record the contract flags RED',
  );
});

/* ── the contract's own answers, unchanged ───────────────────────────────── */

test('a declared option set is offered exactly as written, in order', () => {
  let checked = 0;
  for (const screen of allScreens) {
    if (!nodesById.has(screen.node)) continue;
    const node = nodesById.get(screen.node);
    if (!Array.isArray(node.options) || node.options.length === 0) continue;
    if (screen.step + 1 < stepsOf(screen.node)) continue;
    assert.deepEqual(
      screen.options,
      optionsOf(screen.node),
      `${screen.node}: the offered answers are not the contract's, in the contract's order`,
    );
    checked += 1;
  }
  assert.ok(checked > 10, `only ${checked} declared option sets checked`);
});

test('the exclusion text and why are byte-identical, including the odd bytes', () => {
  // X4's `why` ends with a stray `"` inside the folded value, and X14 quotes
  // 'sorted out' with apostrophes. Both are part of the value.
  const joined = allScreens.map((s) => s.text).join('\n');
  let odd = 0;
  for (const item of exclusionItems) {
    const text = item.text.endsWith('\n') ? item.text.slice(0, -1) : item.text;
    assert.ok(joined.includes(text), `${item.id}.text is not verbatim on screen`);
    if (item.why === undefined) continue;
    const why = item.why.endsWith('\n') ? item.why.slice(0, -1) : item.why;
    assert.ok(joined.includes(why), `${item.id}.why is not verbatim on screen`);
    if (/["']/.test(why) || /["']/.test(text)) odd += 1;
  }
  assert.ok(odd > 0, 'no exclusion carries a quote character. The scan is broken');
});
