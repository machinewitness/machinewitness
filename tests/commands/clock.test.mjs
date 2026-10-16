/**
 * tests/commands/clock.test.mjs. No retention figure is presented as a fact.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 JUDGED ON WHAT A PERSON READS, NEVER ON THE SOURCE.
 *
 * `never: present_a_retention_period_as_fact` is one of the contract's global
 * prohibitions, and the only place it can be broken is in output. A check over the
 * code would report the tables the engine uses to avoid printing a figure, and
 * would say nothing at all about the sentence somebody actually reads. So the input
 * here is: every screen the engine renders over every routing-distinct route,
 * everything the real commands printed in a real walk, and every file left in the
 * person's own folder afterwards.
 *
 * ⚠️ THE PATTERNS ARE SCOPED TO RETENTION, NOT TO TIME, AND THAT SCOPING IS WHAT
 * MAKES THE CHECK POSSIBLE. Rendered output legitimately holds a figure beside a
 * unit in four places: the contract's own incident-age options (`4-14 days ago`.
 * about when the event happened), the widen-the-window note (`a day either side`.
 * about a request, not a record), an ordinal (`a second account`), and a clinical
 * limit (`wrote down on one day`). A bare number-and-unit ban would fire on all
 * four and would then need four exemptions, and a check that must exempt the
 * places most likely to describe the thing no longer establishes anything.
 *
 * ⛔ SO THERE ARE NO FILE EXEMPTIONS AND NO SUPPRESSION LIST HERE. Instead the four
 * real phrases above are asserted BELOW as controls, real rendered text carrying a
 * figure and a unit, correctly not a finding, and paired with planted bare
 * retention claims that must still fire. If the scoping ever stops distinguishing
 * the two, one of those two tests goes red.
 *
 * BARE VERSUS QUALIFIED, and both are asserted. The rule is that no figure appears
 * as a FACT, so a figure carrying *typical, verify with the holder* in scope is not
 * the violation. But the shipped form is stronger than the rule: the engine names
 * an order of magnitude in WORDS and no figure at all. Both are asserted, so a
 * regression from the stronger form to the merely-permitted one is visible rather
 * than silent.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  contract,
  hardHumanText,
  isNegated,
  nodesById,
  planted,
  proven,
  readRepo,
  realWalk,
  recordNodes,
  report,
  scan,
} from '../rails/_rails.mjs';

/* ── the shapes ───────────────────────────────────────────────────────────── */

/** A quantity. Includes the vague ones, which are the ones that get written. */
const FIGURE = String.raw`(?:\d{1,4}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a|an|half|couple|few|several)`;

const UNIT = String.raw`(?:second|minute|hour|day|week|fortnight|month|year)s?`;

/** `14 days`, `14-30 days`, `a fortnight`, `a couple of weeks`, `14-day`. */
const SPAN = String.raw`${FIGURE}(?:\s*(?:-|–|to|or)\s*\d{1,4})?(?:\s+of)?[-\s]${UNIT}`;

/** A verb or noun that makes a span a RETENTION span rather than any other span. */
const HOLDING = String.raw`(?:kept|keeps|keep|held|holds|hold|retain(?:s|ed|ing)?|retention|stor(?:e|es|ed|age)|available|survives?|lasts?|lives?|overwrit(?:e|es|ten|ing)|recycl\w+|purg\w+|rotat\w+|rolls? over|erase[sd]?|wipe[sd]?|deleted after|gone (?:in|after|within)|expires? (?:in|after|within)|before it is gone)`;

const NEAR = String.raw`[^.\n]{0,40}?`;
const CLOSE = String.raw`[^.\n]{0,25}?`;

const RETENTION_FIGURE = [
  {
    name: 'a holding period stated of a record',
    re: new RegExp(
      `\\b${HOLDING}${NEAR}\\b${SPAN}\\b|\\b${SPAN}\\b${NEAR}\\b${HOLDING}\\b`,
      'i',
    ),
  },
  {
    name: 'a loop, cycle or window given a length',
    re: new RegExp(
      `\\b${SPAN}\\b${CLOSE}\\b(?:loop|cycle|rolling|window)\\b|` +
        `\\b(?:loop|cycle|rolling|window)\\b${CLOSE}\\b${SPAN}\\b`,
      'i',
    ),
  },
  {
    name: 'a deadline handed over as a number',
    re: new RegExp(
      `\\b(?:you have|you have got|you've got|that gives you|that leaves you|` +
        `there are only|you get|you are left with)\\s+(?:\\w+\\s+){0,3}${SPAN}\\b`,
      'i',
    ),
  },
  {
    name: 'a retention period named outright',
    re: new RegExp(
      `\\bretention\\s+(?:period|window|policy|setting)\\b${NEAR}\\b${SPAN}\\b|` +
        `\\b${SPAN}\\b${CLOSE}\\bretention\\b`,
      'i',
    ),
  },
];

/**
 * What turns a figure from a fact into an estimate. Read in the same scope the
 * shared scanner uses for a negation: the preceding line, plus everything before
 * the match on its own line, because a qualifier is written before the number it
 * qualifies, and markdown hard-wraps sentences.
 */
const QUALIFIER =
  /\btypical(?:ly)?\b|\brough(?:ly)?\b|\bapproximat\w+\b|\bapprox\b|\border of magnitude\b|\bestimate[sd]?\b|\bvaries\b|\bverify\b|\bcheck\b[^.]{0,24}\bwith\b|\bnever treat\b|\bnot\b[^.]{0,14}\bfact\b|\bmay be\b|\bmight be\b|\bcould be\b|\bno known\b|\bunverified\b|\bnot sourced\b/i;

const qualified = (hit) => QUALIFIER.test(hit.negationScope) || isNegated(hit.negationScope, hit.negationAt);

/* ── the input: what a person actually reads ──────────────────────────────── */

const rendered = hardHumanText();

test('the scan read what the software really shows, over every route', (t) => {
  const chars = rendered.reduce((n, b) => n + b.text.length, 0);
  assert.ok(
    chars > 20000,
    `only ${chars} characters of rendered output, an absence assertion over a ` +
      'fragment is worthless, so this fails rather than reporting clean',
  );
  t.diagnostic(`rendered output scanned: ${chars} characters across ${rendered.length} sources`);
  t.diagnostic(rendered.map((b) => b.label).join(' · '));
});

/* ══════════════════════════════════════════════════════════════════════════════
   🔴 THE RULE, AND THE STRONGER FORM THAT IS ACTUALLY SHIPPED.
   ══════════════════════════════════════════════════════════════════════════════ */

test('no retention figure appears as a bare fact in anything a person reads', () => {
  const { hits, linesRead } = scan(rendered, RETENTION_FIGURE);
  assert.ok(linesRead > 500, `only ${linesRead} lines read`);
  const bare = hits.filter((hit) => !qualified(hit));
  assert.deepEqual(
    bare.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a retention period is stated as a fact:\n${report(bare)}\n` +
      "⛔ The contract forbids it by name. A holder's real setting is whatever their " +
      'administrator configured, and a figure repeated to a frightened person becomes ' +
      'a deadline they plan their week around. The fix is the output, not this check.',
  );
});

test('and the shipped form is stronger than the rule: there is no figure at all, qualified or not', (t) => {
  const { hits } = scan(rendered, RETENTION_FIGURE);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a retention figure appears in rendered output:\n${report(hits)}\n` +
      'The engine names an order of magnitude in WORDS and prints no figure, which is ' +
      'stronger than the rule requires. A number with "typically" in front of it is ' +
      'still a number, and "typically" is the word a reader drops. If a qualified ' +
      'figure has been added deliberately, that is a decision to weaken the shipped ' +
      'form: record it where the doctrine lives, do not discover it here.',
  );
  t.diagnostic('retention figures in rendered output: 0, bare or qualified');
});

test('the words the engine uses for a deadline carry no digits', () => {
  // The other half of the same property, from the opposite direction: whatever the
  // engine prints in the deadline position must be a word rather than a number.
  const lines = [];
  for (const block of rendered) {
    for (const line of block.text.split('\n')) {
      const m = /^\s{2,}(Hours|Days|Weeks|Months|No known deadline|How long this lasts)\b.*$/.exec(line);
      if (m) lines.push(line.trim());
    }
  }
  proven('the deadline lines the engine prints', lines, { floor: 5 });
  const withDigits = lines.filter((line) => /\d/.test(line));
  assert.deepEqual(withDigits, [], `a deadline line carries a digit:\n  ${withDigits.join('\n  ')}`);
});

/* ══════════════════════════════════════════════════════════════════════════════
   THE CONTROLS. Real rendered text with a figure and a unit in it, correctly not
   a finding, because the patterns are scoped to retention rather than to time.
   ⛔ These are NOT exemptions. Nothing is suppressed; the phrases simply are not
   retention claims, and this test is what proves the distinction is being drawn.
   ══════════════════════════════════════════════════════════════════════════════ */

test('the scoping is what avoids the noise, and the noise is really there', (t) => {
  const timeShaped = new RegExp(`\\b${SPAN}\\b`, 'i');
  const carriers = [];
  for (const block of rendered) {
    for (const line of block.text.split('\n')) {
      if (timeShaped.test(line)) carriers.push(`${block.label}: ${line.trim().slice(0, 110)}`);
    }
  }
  // 🔴 NON-EMPTY FIRST. If rendered output no longer carries a figure beside a unit
  // anywhere, then scoping the patterns to retention is buying nothing and the two
  // tests above are passing on air.
  proven('rendered lines carrying a figure beside a unit', carriers, { floor: 4 });

  // …and each of the four real classes is present, so the distinction is live.
  const wholeText = rendered.map((b) => b.text).join('\n');
  for (const [what, re] of [
    ['when the event happened', /\b\d+-\d+ (?:days|months) ago\b/],
    ['widening a request window', /\ba day either side\b/i],
    ['an ordinal, not a unit of time', /\ba second or anonymous account\b/i],
    ['what a clinician wrote on a day', /\bwrote down on one day\b/i],
  ]) {
    assert.match(wholeText, re, `the control for "${what}" is no longer in rendered output`);
  }
  t.diagnostic(`lines with a figure beside a unit, none of them a retention claim: ${carriers.length}`);
});

/* ══════════════════════════════════════════════════════════════════════════════
   THE PLANTED VIOLATIONS. A test that has never failed has never been tested.
   ══════════════════════════════════════════════════════════════════════════════ */

test('the checker fires on every planted retention claim', () => {
  const FIXTURES = [
    'Building camera footage is kept for 14 days.',
    'Door-fob records are retained for 90 days.',
    'It is a 14-day rolling loop, so move now.',
    'You have 14 days before it is gone.',
    'The retention period is 30 days.',
    'Ride detail stays available for six months.',
    'Usage records survive two weeks.',
    'Their system overwrites itself every 28 days.',
  ];
  proven('the fixture set', FIXTURES, { floor: 8 });
  const missed = [];
  for (const fixture of FIXTURES) {
    const { hits } = scan(planted('retention', fixture), RETENTION_FIGURE);
    if (hits.length === 0) missed.push(fixture);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
});

test('a planted claim is judged BARE, and the qualified form is judged qualified', () => {
  // The discriminator itself, proven in both directions. Without this the two
  // headline tests could agree for the wrong reason.
  const bare = scan(planted('bare', 'Camera footage is kept for 14 days.'), RETENTION_FIGURE);
  assert.ok(bare.hits.length > 0, 'the bare claim was not found at all');
  assert.deepEqual(
    bare.hits.filter(qualified),
    [],
    'a bare retention claim was judged as qualified, so the discriminator lets facts through',
  );

  const softened = scan(
    planted(
      'qualified',
      'Typical only, and verify it with the holder: footage is often kept for 14 days.',
    ),
    RETENTION_FIGURE,
  );
  assert.ok(softened.hits.length > 0, 'the qualified claim was not found at all');
  assert.equal(
    softened.hits.filter(qualified).length,
    softened.hits.length,
    'a qualified figure was judged bare, so the discriminator cannot tell the two apart ' +
      'and the rule collapses into a ban on the word "days"',
  );
});

test('the mutation set of quieter claims is caught, and the limit is stated', (t) => {
  const MUTATIONS = [
    { text: 'Most venues wipe it after a fortnight.', caught: true },
    { text: 'Expect it to be gone in a couple of weeks.', caught: true },
    { text: 'Their system only holds about a fortnight of it.', caught: true },
    { text: 'Assume a fortnight and act accordingly.', caught: false },
    { text: 'It rolls over every other Tuesday, so today or never.', caught: false },
  ];
  proven('the mutation set', MUTATIONS, { floor: 5 });
  const missed = [];
  const uncatchable = [];
  for (const mutation of MUTATIONS) {
    const { hits } = scan(planted('mutation', mutation.text), RETENTION_FIGURE);
    if (mutation.caught && hits.length === 0) missed.push(mutation.text);
    if (!mutation.caught && hits.length === 0) uncatchable.push(mutation.text);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
  assert.ok(
    uncatchable.length > 0,
    'every phrasing was caught, including the ones recorded as uncatchable. A period ' +
      'named with no figure in it, or pinned to a weekday, says the same thing and no ' +
      'pattern over a figure will see it, if that is no longer true, move them and add ' +
      'harder ones rather than letting the set imply completeness.',
  );
  t.diagnostic(
    `phrasings a figure-shaped check provably cannot catch: ${uncatchable.length}. ` +
      'The control for those is that the engine states no period at all.',
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   THE POSITIVE HALF. What the block must say, and in what order.
   ══════════════════════════════════════════════════════════════════════════════ */

const walk = realWalk();
const plan = walk.artifacts.find((a) => a.name === 'PLAN.md');

test('the plan the person keeps really holds the clock block', () => {
  assert.ok(plan, 'the walk left no plan in the person’s folder');
  proven('the plan', plan.body, { floor: 2000 });
  const title = contract.phase_3_output?.block_b?.title;
  assert.ok(typeof title === 'string' && title.length > 0, 'the contract names no title for the block');
  assert.ok(plan.body.includes(title), `the plan does not carry the block titled "${title}"`);
});

/** The clock block, sliced out of the plan by the contract's own titles. */
function clockBlock() {
  const titles = ['block_a', 'block_b', 'block_c'].map(
    (key) => contract.phase_3_output?.[key]?.title ?? null,
  );
  const start = plan.body.indexOf(titles[1]);
  assert.ok(start >= 0, 'the clock block is not in the plan');
  const afterStart = start + titles[1].length;
  const end = titles[2] ? plan.body.indexOf(titles[2], afterStart) : -1;
  const block = plan.body.slice(afterStart, end >= 0 ? end : undefined);
  return proven('the clock block', block, { floor: 400 });
}

test('the qualification comes BEFORE the first deadline, not after it', () => {
  const block = clockBlock();
  const lines = block.split('\n');
  // ⚠️ A deadline is matched wherever two or more spaces precede it, not only at the
  // start of an indented line. The block used to give each item three lines — action,
  // then deadline, then the answer that selected it — and the deadline was therefore
  // always on its own indented line. It now shares the action's line, because every
  // word of this block also appears in block A and at three lines an item it was a
  // second full copy of the plan. ⛔ The ASSERTION is unchanged and is the point: the
  // qualification has to arrive before the first figure, because one that arrives
  // after the number is one the reader has already skipped. Only the shape the
  // matcher looks for moved.
  const firstDeadline = lines.findIndex((line) =>
    /(?:^|\s{2,})(Hours|Days|Weeks|Months|No known deadline|How long this lasts)\b/.test(line),
  );
  assert.ok(firstDeadline > 0, `the block names no deadline at all:\n${block.slice(0, 400)}`);

  const before = lines.slice(0, firstDeadline).join('\n');
  assert.match(
    before,
    QUALIFIER,
    'the block states a deadline before it says the figures are rough. A ' +
      'qualification that arrives after the number is a qualification the reader has ' +
      `already skipped:\n${before}`,
  );
  // …and it says the two things that make it actionable rather than merely hedged.
  assert.match(before, /\bholds? the record\b|\bwhoever holds\b/i, 'it does not say who to check with');
  assert.match(before, /\bnot\b[^.]{0,14}\bfact\b|\bnever treat\b/i, 'it does not say never to treat them as fact');
});

test('the block is ordered by what is running out, not by how useful it looks', (t) => {
  // ⚠️ The rank order of the clock words is AUTHORED in the engine: the contract
  // states the sequence only in a comment, which does not survive into the form the
  // engine reads. It is written out here rather than imported so the two are
  // independent, a shared constant would make this test agree with the engine by
  // construction and check nothing.
  const RANK = { HOURS: 0, DAYS: 1, WEEKS: 2, MONTHS: 3, STABLE: 4 };

  const askToNode = new Map();
  for (const id of proven('the record nodes', recordNodes, { floor: 8 })) {
    askToNode.set(nodesById.get(id).ask, nodesById.get(id));
  }

  const seen = [];
  for (const line of clockBlock().split('\n')) {
    const m = /Because you said yes to:\s*(.+?)\s*$/.exec(line);
    if (!m) continue;
    const node = askToNode.get(m[1]);
    assert.ok(node, `the block cites a question the contract does not hold: ${m[1]}`);
    seen.push({ clock: node.clock, density: node.density, ask: m[1] });
  }
  proven('the records listed in the clock block', seen, { floor: 5 });

  const ranks = seen.map((item) => RANK[item.clock] ?? 5);
  for (let i = 1; i < ranks.length; i += 1) {
    assert.ok(
      ranks[i] >= ranks[i - 1],
      `the block is out of order at position ${i + 1}: ${seen[i - 1].clock} then ` +
        `${seen[i].clock}. It is ordered by how fast a record dies, never by how much ` +
        'it might help, value can be argued about next month and perishability cannot.',
    );
  }

  // …and prove that is a real constraint rather than a coincidence: the densest
  // record is NOT first, so the list is demonstrably not ordered by value.
  const densities = ['highest', 'high', 'medium', 'low'];
  const densest = seen
    .slice()
    .sort((a, b) => densities.indexOf(a.density) - densities.indexOf(b.density))[0];
  assert.notEqual(
    seen[0].ask,
    densest.ask,
    'the first item is also the densest one, so this ordering is indistinguishable ' +
      'from an ordering by value and the assertion above proves nothing on this walk',
  );
  t.diagnostic(`records in clock order: ${seen.map((s) => s.clock).join(' → ')}`);
  t.diagnostic(`densest record sits at position ${seen.indexOf(densest) + 1} of ${seen.length}`);
});

/* ══════════════════════════════════════════════════════════════════════════════
   The prohibition, read out of the contract, and the reference an agent relays.
   ══════════════════════════════════════════════════════════════════════════════ */

test('the prohibition is the contract’s own, read from it rather than typed', () => {
  const never = proven('the contract’s prohibitions', contract.never ?? [], { floor: 10 });
  assert.ok(
    never.includes('present_a_retention_period_as_fact'),
    `the contract no longer forbids presenting a retention period as fact:\n${never.join('\n')}`,
  );
  assert.ok(
    never.includes('auto_send_any_third_party_request'),
    'the contract no longer forbids sending a request to a holder by itself, which is ' +
      'the other half of what this command must never do',
  );
});

test('the reference an agent relays states no figure either, and says not to restore one', () => {
  // The reference is not source in the sense that matters here: it is the wording an
  // agent reads and then says out loud, so a figure in it becomes rendered output one
  // step later.
  const body = proven('skill/reference/clock.md', readRepo('skill/reference/clock.md'), {
    floor: 2000,
  });
  const { hits } = scan([{ label: 'skill/reference/clock.md', text: body }], RETENTION_FIGURE);
  const bare = hits.filter((hit) => !qualified(hit));
  assert.deepEqual(
    bare.map((h) => `${h.line} [${h.name}] ${h.match}`),
    [],
    `the reference states a retention period as a fact:\n${report(bare)}`,
  );
  for (const needed of [
    /present a retention period as fact/i,
    /do not supply a figure the engine withheld/i,
    // …and it must say where a real figure comes from, not merely that ours is not one.
    /\b(?:verify|check(?:ed|ing)?)\b[^.]{0,40}\b(?:holder|whoever holds)\b/i,
    /order of magnitude/i,
  ]) {
    assert.match(body, needed, `the reference no longer states ${needed}`);
  }
});
