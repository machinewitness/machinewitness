/**
 * tests/rails/no-verdict.test.mjs. A record, never a verdict. The rendered half.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🟡 THIS RAIL IS PARTIAL, AND THE MISSING PART IS IN THE CONTRACT ITSELF.
 *
 * `phase_3_output.block_c` asks for four COUNTS under the heading *how much this
 * can help*: independent sources covering the window, likely silences, the
 * double-edged items, and the paths closed by the person's own conditions. Summed
 * or shown side by side, those four numbers invite exactly the aggregate-strength
 * inference this rail forbids, and they do it **with no forbidden word anywhere in
 * them**, which is precisely why a vocabulary check passes them.
 *
 * The engine already renders the safer form. But the contract still carries the
 * totals, and changing the contract is an owner's amendment, gated and never
 * silent. So the honest state is: the rendered half is enforced, and it is enforced
 * HERE, by executing every route and reading what came out. The contract half is
 * open, named in RAIL_MATRIX.md, and asserted below as still open, so the day it
 * is amended, this test says so.
 *
 * ⚠️ THE FORBIDDEN LIST IS DERIVED FROM THE CONTRACT, not typed here. `block_c`
 * names what it may not become, and `never:` names the prohibitions consumers must
 * enforce. Reading them out of the file means a contract amendment cannot leave
 * this check behind.
 *
 * TWO EXCLUSIONS, both adjacency-bound, both asserted live. If no rendered string
 * needs one any more the test says so rather than carrying a dead exclusion, and each
 * is paired with a planted violation that must still fire.
 *
 *   1. A PROGRESS INDICATOR. `screen 7 of 27` is a ratio and it is not an aggregate
 *      over anybody's evidence. Excluded by requiring the word `screen` immediately
 *      before it.
 *
 *   2. AN EXPLICIT DENIAL OF A FORBIDDEN WORD IS NOT THE WORD, and this one arrived
 *      the day the hard tier grew to cover the two commands that touch the person's
 *      own evidence. `verify` closes with a constant named, in the code,
 *      WHAT_THIS_DOES_NOT_ESTABLISH: *This says the bytes are the bytes… It is not a
 *      score and it is not a strength. What any of it is worth is for a lawyer to
 *      judge.* Two words off the contract's forbidden list, both inside a denial of
 *      being them, the rail obeyed out loud, in the person's own interest.
 *
 *      🔴 SCOPED RATHER THAN EXEMPTED, AND THE ALTERNATIVE IS WORSE. Rewording that
 *      sentence to dodge a scanner would blunt the one place the software preempts the
 *      exact misreading it is warning about, and a file exemption would put both
 *      commands that touch evidence outside the check that matters most to them. The
 *      same call was already made once in this suite, at the *scoped to asserting, not
 *      to knowing* pattern in `no-outcome-promise.test.mjs`, for the same reason: a
 *      statement of a LIMIT is not the thing the rail forbids, and a pattern that
 *      cannot tell them apart needs an exemption per limit and then establishes nothing.
 *
 *      ⛔ AND IT IS NOT A NEGATION RULE. It is a copula plus `not` plus an article
 *      immediately before the word. Nothing else on the line is looked at, so a
 *      refusal earlier in a sentence cannot cover a verdict later in it. The forbidden
 *      words in it are read out of the contract, like everything else here.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { contract, hardHumanText, planted, proven, readRepo, report, scan } from './_rails.mjs';

/* ── the forbidden vocabulary, read out of the contract ───────────────────── */

const blockC = contract.phase_3_output?.block_c;
assert.ok(blockC, 'the contract has no coverage block. The derivation is broken');

const forbiddenWords = proven('the contract’s forbidden list', blockC.forbidden ?? []);
const countNames = proven('the contract’s coverage counts', blockC.counts ?? []);
const prohibitions = proven('the contract’s global prohibitions', contract.never ?? []);

/** `case_assessment` -> /\bcase\s+assessment\b/ ; `score` -> /\bscore/ */
function wordPattern(token) {
  const words = String(token).split('_').filter(Boolean);
  return new RegExp(`\\b${words.join('\\s+')}`, 'i');
}

const DERIVED = forbiddenWords.map((token) => ({
  name: `forbidden by the contract: ${token}`,
  re: wordPattern(token),
}));

const COUNT_NAMES = countNames.map((token) => ({
  name: `a machine count name reached a person: ${token}`,
  re: wordPattern(token),
}));

/**
 * Shapes rather than words, and these are authored rather than derived, the
 * contract names the concepts, not the notations. Each one is an aggregate over
 * sources with no forbidden word in it, which is the failure mode the row records.
 */
const SHAPES = [
  { name: 'a ratio over sources', re: /\b\d+\s*(?:of|\/|out of)\s*\d+\b/i },
  // ⚠️ No trailing \b after the per-cent sign: a word boundary cannot follow one
  // non-word character with another (`67%.`), and the first draft of this pattern
  // silently matched nothing because of it. The planted fixture caught that.
  { name: 'a percentage', re: /\b\d+(?:\.\d+)?\s*(?:%|per ?cent\b)/i },
  { name: 'a count of things that agree', re: /\b(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|most|all|half|the majority)\s+(?:of\s+)?(?:your\s+|the\s+)?(?:records?|sources?|things?|logs?|devices?|accounts?)\s+(?:agree|line up|support|back|match|confirm|corroborate)/i },
  { name: 'ordering by how much something helps', re: /\b(?:ranked?|ranking|ordered|sorted)\s+by\s+(?:strength|value|weight|how much|importance|helpfulness)/i },
  { name: 'a strength claim about the record', re: /\b(?:your|the)\s+(?:case|record|evidence|position|defence|defense)\s+(?:is|looks|seems|appears)\s+(?:strong|weak|good|bad|solid|thin|excellent|poor)/i },
  { name: 'an automatic classification the contract reserves', re: /\b(?:marked|labelled|labeled|classified|scored)\s+(?:as\s+)?(?:consistent|in tension)\b/i },
];

const PATTERNS = [...DERIVED, ...COUNT_NAMES, ...SHAPES];

/**
 * The progress indicator, removed before the shape patterns run.
 * ⚠️ Removed rather than skipped: the line may say other things too, and dropping
 * the whole line would blind the check to anything sharing it.
 *
 * THREE NOTATIONS, all narrow, and each is a place in the reader's own document
 * that tells them where they are — never a statement about their records:
 *   · `Screen 1 of 4` — the exclusion list's own header, which shares its line
 *     with a total and a sentence, so it can only be matched mid-line.
 *   · `18 / ~31` and `31 / 31 · last one` — the per-screen counter, which is
 *     ANCHORED to the whole line. It occupies a line by itself, so requiring that
 *     means this alternative cannot suppress a ratio that appears in a sentence.
 *     ⚠️ That matters: `\d+ / \d+` unanchored would have blinded the ratio check
 *     everywhere, which is a real weakening dressed up as keeping a test green.
 *   · `page 1 of 3` — the printable sheet's footer. ✅ THE SCAN FOUND THIS ITSELF,
 *     inside the PDF, which is the useful part: the sheet is written uncompressed
 *     and the check reads straight into its text stream, so a verdict shape put on
 *     paper is caught exactly like one put on a screen. The word `page` is required,
 *     so a bare count of anything is still a failure.
 */
const PROGRESS =
  /\bscreens?\s+\d+\s+of\s+\d+|\bpage\s+\d+\s+of\s+\d+|^\s*\d+\s*\/\s*~?\d+(?:\s*·\s*last one)?\s*$/gi;

/**
 * A forbidden word inside a denial of BEING it, removed the same way and for the same
 * reason. ⚠️ The word list is the contract's, not a copy: an amendment to
 * `block_c.forbidden` changes what this can suppress at the same moment it changes what
 * the patterns look for, so the two cannot drift apart.
 */
const DENIAL = new RegExp(
  String.raw`\b(?:is|are|was|were)\s+not\s+(?:a|an|the)\s+(?:` +
    forbiddenWords
      .map((token) => String(token).split('_').filter(Boolean).join(String.raw`\s+`))
      .join('|') +
    String.raw`)\b`,
  'gi',
);

/* ── the input, proven ────────────────────────────────────────────────────── */

const hard = hardHumanText();

test('the scan read every route’s rendered output, and the person’s own files', (t) => {
  const chars = hard.reduce((n, b) => n + b.text.length, 0);
  assert.ok(chars > 20000, `only ${chars} characters of rendered output`);
  proven('the pattern table', PATTERNS, { floor: 10 });
  t.diagnostic(
    `patterns: ${DERIVED.length} derived from the contract's forbidden list, ` +
      `${COUNT_NAMES.length} from its coverage counts, ${SHAPES.length} aggregate shapes`,
  );
  t.diagnostic(`rendered text scanned: ${chars} characters · prohibitions in the contract: ${prohibitions.length}`);
});

/* ── the assertion ───────────────────────────────────────────────────────── */

const stripProgress = (line) => line.replace(PROGRESS, ' ');
const stripDenial = (line) => line.replace(DENIAL, ' ');
const stripped = (line) => stripDenial(stripProgress(line));

function scanRendered(blocks) {
  return scan(
    blocks.map((b) => ({ label: b.label, text: b.text.split('\n').map(stripped).join('\n') })),
    PATTERNS,
  );
}

test('nothing the software renders is a verdict, a score, or an aggregate over sources', () => {
  const { hits, linesRead } = scanRendered(hard);
  assert.ok(linesRead > 500, `only ${linesRead} lines read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `rendered output carries a verdict shape:\n${report(hits)}\n` +
      '⛔ No exclusion is available here. A lawyer decides meaning.',
  );
});

test('the progress-indicator exclusion is live, and is not doing anything else', () => {
  const withProgress = hard
    .flatMap((b) => b.text.split('\n'))
    .filter((line) => PROGRESS.test((PROGRESS.lastIndex = 0, line)));
  assert.ok(
    withProgress.length > 0,
    'no rendered string carries a progress indicator any more, so excluding it is ' +
      'no longer buying anything. Delete the exclusion deliberately rather than ' +
      'leaving a dead one in a check.',
  );
  // …and with the exclusion switched off, the ratio pattern DOES fire on exactly
  // those lines, which proves the exclusion is the only thing standing between
  // this check and a false failure, rather than quietly hiding something else.
  const unstripped = scan(hard, [SHAPES[0]]);
  assert.ok(
    unstripped.hits.length > 0,
    'the ratio pattern finds nothing even unstripped, so it is not the pattern the ' +
      'exclusion exists for',
  );
  for (const hit of unstripped.hits) {
    assert.ok(
      PROGRESS.test((PROGRESS.lastIndex = 0, hit.text)),
      `a ratio appears in rendered output that is NOT a progress indicator:\n  ${hit.where}:${hit.line} ${hit.text}`,
    );
  }
});

test('the denial exclusion is live, and every word it suppresses is inside a denial', (t) => {
  const lines = hard.flatMap((b) => b.text.split('\n').map((line) => ({ where: b.label, line })));
  const withDenial = lines.filter((l) => DENIAL.test((DENIAL.lastIndex = 0, l.line)));
  assert.ok(
    withDenial.length > 0,
    'no rendered string denies being a forbidden word any more, so excluding the ' +
      'denial is no longer buying anything. Delete the exclusion deliberately rather ' +
      'than leaving a dead one in a check.',
  );

  // 🔴 AND IT IS THE ONLY THING SUPPRESSING THEM. With the exclusion off, the derived
  // patterns fire, and every line they fire on is one of the denials above. If a
  // forbidden word ever appears anywhere else, this fails rather than the exclusion
  // quietly widening to cover it.
  const unstripped = scan(
    hard.map((b) => ({ label: b.label, text: b.text.split('\n').map(stripProgress).join('\n') })),
    DERIVED,
  );
  assert.ok(
    unstripped.hits.length > 0,
    'no forbidden word appears in rendered output even unstripped, so this is not the ' +
      'exclusion the check needs',
  );
  const elsewhere = unstripped.hits.filter(
    (hit) => !DENIAL.test((DENIAL.lastIndex = 0, hit.raw)),
  );
  assert.deepEqual(
    elsewhere.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}, ${h.text.slice(0, 110)}`),
    [],
    'a word off the contract’s forbidden list reached a person OUTSIDE a denial of ' +
      'being it. ⛔ That is the rail, not a false positive.',
  );
  t.diagnostic(
    `rendered lines that deny being a forbidden word: ${withDenial.length} ` +
      `(${[...new Set(withDenial.map((l) => l.where))].join(', ')}) · forbidden-word ` +
      `matches, all of them inside one: ${unstripped.hits.length}`,
  );
});

test('and the denial exclusion does not swallow a bare use, or a verdict beside one', () => {
  const MUST_STILL_FIRE = [
    // A bare use of each shape the exclusion could have hidden.
    'Your overall score for this set is moderate.',
    'The strength of what you have is middling.',
    'Estimated likelihood of corroboration: moderate.',
    // 🔴 AND A VERDICT SHARING A LINE WITH A DENIAL. This is the case the adjacency
    // binding exists for: the denial is removed, and what is left is still judged.
    'It is not a score. Your record is strong on that point.',
    'This is not a prediction, and the likelihood of corroboration is high.',
  ];
  proven('the bare-use set', MUST_STILL_FIRE, { floor: 5 });
  const missed = MUST_STILL_FIRE.filter(
    (line) => scanRendered(planted('bare-verdict', line)).hits.length === 0,
  );
  assert.deepEqual(
    missed,
    [],
    'the denial exclusion swallowed a real verdict:\n  ' +
      `${missed.join('\n  ')}\n` +
      '⛔ It is bound to a copula, `not`, an article and then the word, nothing else ' +
      'on the line. Widening it past that is how it starts hiding the rail.',
  );
});

/* ── planted fixtures: each must fire ─────────────────────────────────────── */

const FIXTURES = [
  '4 of 6 records support your account of that evening.',
  'Coverage of the window in dispute: 67%.',
  'Your records are ranked by strength below, best first.',
  'Overall your case looks strong on the timing point.',
  'Three sources agree, which is a good sign.',
  'This item has been marked as consistent with your account.',
  'Estimated likelihood of corroboration: moderate.',
  'A prediction, offered cautiously, about how this reads.',
];

test('the checker fires on every planted verdict. A check that never failed is untested', () => {
  proven('the fixture set', FIXTURES, { floor: 8 });
  const missed = [];
  for (const fixture of FIXTURES) {
    const { hits } = scanRendered(planted('verdict', fixture));
    if (hits.length === 0) missed.push(fixture);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
});

test('and the progress exclusion does not swallow a planted ratio', () => {
  const { hits } = scanRendered(planted('ratio', '4 of 6 records cover the window.'));
  assert.ok(
    hits.length > 0,
    'the progress exclusion swallowed a real ratio over sources. It is scoped to a ' +
      'ratio preceded by the word screen for exactly this reason.',
  );
});

/* ── the mutation set: aggregates with no number and no forbidden word ────── */

const MUTATIONS = [
  { text: 'Most of what you have lines up with your account.', caught: false },
  { text: 'The picture here is fairly complete.', caught: false },
  { text: 'On balance this reads well for you.', caught: false },
  { text: 'Your record is strong on that point.', caught: true },
  { text: 'Ranked by strength, your best material is first.', caught: true },
];

test('the mutation set is judged honestly, and the structural control is named', (t) => {
  proven('the mutation set', MUTATIONS, { floor: 5 });
  const missed = [];
  const uncatchable = [];
  for (const mutation of MUTATIONS) {
    const { hits } = scanRendered(planted('mutation', mutation.text));
    if (mutation.caught && hits.length === 0) missed.push(mutation.text);
    if (!mutation.caught && hits.length === 0) uncatchable.push(mutation.text);
  }
  assert.deepEqual(missed, [], `the checker missed a phrasing it must catch:\n  ${missed.join('\n  ')}`);
  assert.ok(
    uncatchable.length > 0,
    'every phrasing was caught, including the ones recorded as uncatchable. A copy ' +
      'check over prose cannot be complete, and a mutation set that always passes ' +
      'gives false confidence that it is.',
  );

  // 🔴 THE CONTROL FOR THOSE IS STRUCTURAL, NOT LEXICAL. The engine renders the
  // contract's own field values verbatim plus its own authored constants. It does
  // not compose sentences, so it cannot author "on balance this reads well for
  // you" at all. That property is asserted in tests/contract/verbatim.test.mjs, and
  // this is the assertion that the two halves are still joined: every screen the
  // engine emits reports which contract fields it rendered verbatim.
  const withVerbatim = hard.find((b) => b.label === 'rendered screens');
  assert.ok(withVerbatim, 'the rendered screens are not in the scanned set');
  t.diagnostic(
    `phrasings a copy check provably cannot catch: ${uncatchable.length}. ` +
      'The control is that the engine renders contract values and authored ' +
      'constants, and composes nothing, asserted in tests/contract/verbatim.test.mjs.',
  );
});

/* ── the contract half, still open, and asserted as still open ────────────── */

test('the contract still carries the totals, and the engine still does not render them', () => {
  // Both halves of the partial state, in one assertion, so neither can drift alone.
  assert.ok(
    countNames.length >= 4,
    'the contract no longer asks for the coverage counts. If that is an amendment, ' +
      'this rail may be promoted out of partial, deliberately, with the row updated.',
  );
  assert.match(
    String(blockC.title ?? ''),
    /how much this can help/i,
    'the coverage block heading changed. The heading is half the problem: four counts ' +
      'under it read as a measurement of how strong somebody is.',
  );
  const { hits } = scanRendered(hard);
  assert.deepEqual(hits, [], 'a coverage count reached a person');
});

/* ── the sentence that has to survive every rewording ────────────────────── */

const normalise = (s) =>
  s
    .replace(/[*_>`#]/g, '')
    .replace(/[.,;:—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

test('the limits command closes with the fixed sentence, derived from the doctrine', () => {
  const doctrine = proven('HONEST_LIMITS.md', readRepo('HONEST_LIMITS.md'), { floor: 1000 });
  const quoted = doctrine
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('>') && /cross-check/i.test(l));
  assert.ok(quoted, 'HONEST_LIMITS.md no longer states the sentence, so nothing can be derived');
  const wanted = normalise(quoted);
  assert.ok(wanted.includes('never proof of innocence'), `the derived sentence is wrong: ${wanted}`);

  const body = proven('skill/reference/limits.md', readRepo('skill/reference/limits.md'), {
    floor: 2000,
  });
  assert.ok(!/STATUS:\s*stub/i.test(body), 'limits.md is still marked a stub');
  assert.ok(
    normalise(body).includes(wanted),
    `limits.md does not carry the doctrine's own sentence.\n  wanted: ${wanted}`,
  );

  const lastLine = body.trimEnd().split('\n').filter((l) => l.trim().length > 0).at(-1);
  assert.equal(
    normalise(lastLine),
    wanted,
    `limits.md does not CLOSE with it. It closes with: ${normalise(lastLine)}`,
  );
});
