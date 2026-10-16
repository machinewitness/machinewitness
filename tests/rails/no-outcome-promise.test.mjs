/**
 * tests/rails/no-outcome-promise.test.mjs. An intact record, never a result.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS MATTERS MORE THAN IT LOOKS. Advertising rules for legal-adjacent
 * services restrict outcome-suggestive claims in most places, and a promise
 * creates an expectation the moment the record cuts against the person, which it
 * will, for roughly half of them. So the exposure is not reputational, it is
 * regulatory and it lands on the person as well as on the project.
 *
 * ⚠️ AND THIS IS A COPY CHECK, WHICH CANNOT BE EXHAUSTIVE. A novel phrasing passes.
 * That is stated in the rail-matrix row and it is asserted here, by carrying a
 * mutation set that includes phrasings this check provably does not catch and
 * failing if all of them start passing, because a mutation set that always
 * succeeds gives false confidence of completeness, which is worse than no mutation
 * set at all.
 *
 * TWO TIERS, ONE EXCLUSION.
 *   what the software prints, every route's rendered output, everything the real
 *   commands printed, and every file left in the person's folder.
 *   what a person or a lawyer reads, the documentation, derived by glob.
 *
 * The single exclusion in both tiers is negation context: a line that FORBIDS a
 * phrase is not the phrase. A policy cannot ban a word without writing it, and the
 * project's own advertising rules, its contributing guide and two jurisdiction packs
 * exist partly to list these exact words. Asserted live below, and paired with
 * planted bare promises that must still fire.
 *
 * ⚠️ A THIRD TIER WAS ADDED LATER (THE PUBLISHED MANIFESTS) AND FINDING IT COST
 * THIS TABLE A PATTERN. The plugin listing said the software *freezes and hashes
 * them so nobody can claim tampering*, and every check here passed it: no pattern
 * covered the shape, and the marketplace listing was in no tier at all. Somebody
 * absolutely can claim tampering; what an intact record does is make the claim
 * harder to sustain. So a promise about what an opponent will be unable to assert is
 * now its own pattern, over every tier.
 *
 * 🔴 AND THE SAME CLAUSE WAS IN THE SKILL DEFINITION, where the negation exclusion
 * swallowed it: the words *what not to touch* sit earlier on the same line, so the
 * marker-before-the-match rule read the whole line as a prohibition. That was the
 * documented residual of the exclusion, met in the wild, found by eye, not by this
 * check. ✅ THE RULE IS NOW FIXED TOO, not just the copy: a marker governs the clause
 * it sits in and nothing after it. Both halves are asserted below, and the fixture set
 * that holds it is the one thing standing between this check and the same blind spot
 * coming back, because prose about what a tool REFUSES carries a negation marker almost
 * by definition, so the blind spot sat exactly where an over-claim is most likely to
 * be written.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  copyDocs,
  hardHumanText,
  hasNegationMarker,
  isNegated,
  planted,
  proven,
  report,
  scan,
} from './_rails.mjs';
import { manifestBlocks, manifestPaths, withPlantedWord } from './_manifests.mjs';

const PATTERNS = [
  { name: 'proving innocence', re: /\bprov(?:e|es|ed|ing)\s+(?:your|his|her|their|the)\s+innocen\w+|\bproof of innocence\b/i },
  { name: 'beating or defeating the accusation', re: /\bbeat(?:ing)?\s+(?:the|this|your)\s+(?:charge|charges|case|allegation|accusation)\b|\bwin\s+(?:your|the|this)\s+(?:case|matter|trial|hearing)\b/i },
  { name: 'an acquittal or a clearing', re: /\bacquit\w*|\bexonerat\w+|\bvindicat\w+|\bclear(?:ing)?\s+(?:your|his|her|their)\s+name\b|\byou\s+will\s+be\s+cleared\b/i },
  { name: 'charges going away', re: /\b(?:charges?|allegations?|the case)\s+(?:will|would|should|are going to)\s+(?:be\s+)?(?:dropped|withdrawn|dismissed|thrown out|go away)\b|\bget\s+the\s+charges?\s+dropped\b/i },
  { name: 'a guarantee or a reassurance about the result', re: /\bguarantee\w*\b|\byou\s+will\s+be\s+(?:fine|ok|okay|all right|alright)\b|\bnothing\s+to\s+worry\s+about\b|\bthis\s+will\s+(?:save|rescue)\s+you\b/i },
  { name: 'a promise about how the record will read', re: /\bwill\s+(?:prove|show)\s+(?:you|he|she|they)\s+(?:did ?n[o']t|were ?n[o']t|was ?n[o']t|are innocent)\b/i },
  {
    /**
     * ⚠️ SCOPED TO ASSERTING, NOT TO KNOWING, and the scoping is what makes this
     * pattern possible at all. *Nobody can tell the tidy-up from tampering* and
     * *a time nobody can vouch for* are LIMITS, said in the person's own interest,
     * and they appear repeatedly in the engine and in the reference documents. A
     * pattern on the bare phrase would fire on eleven of those and would then need
     * eleven exemptions, at which point it establishes nothing. So the verb has to
     * be one of asserting: what is forbidden is a promise about what somebody else
     * will be unable to say, because that is a promise about a result.
     */
    name: 'a promise that an opponent will be unable to assert something',
    re: /\b(?:nobody|no[- ]one|not one person)\b[^.]{0,40}\b(?:claim|claims|claiming|allege|alleges|say|says|argue|argues|suggest|suggests|dispute|disputes|accuse|accuses)\b|\b(?:cannot|can't|could not|impossible)\b[^.]{0,30}\bbe\s+(?:claimed|alleged|disputed|challenged|questioned)\b/i,
  },
];

/* ── TIER 1, what the software prints ────────────────────────────────────── */

const hard = hardHumanText();

test('the scan read what the software really prints', (t) => {
  const chars = hard.reduce((n, b) => n + b.text.length, 0);
  assert.ok(chars > 20000, `only ${chars} characters of printed text`);
  proven('the pattern table', PATTERNS, { floor: 6 });
  t.diagnostic(`printed text scanned: ${chars} characters · patterns: ${PATTERNS.length}`);
});

test('nothing the software prints promises an outcome', () => {
  const { hits, linesRead } = scan(hard, PATTERNS, { negationExempt: true });
  assert.ok(linesRead > 500, `only ${linesRead} lines read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `printed copy promises a result:\n${report(hits)}\n` +
      '⛔ The promise is an intact record. Nothing else is available to promise.',
  );
});

/* ── TIER 2: documentation ───────────────────────────────────────────────── */

const docs = copyDocs();

test('the documentation scan read a real set of files', (t) => {
  proven('the documentation set', docs, { floor: 20 });
  const chars = docs.reduce((n, d) => n + d.text.length, 0);
  assert.ok(chars > 100000, `only ${chars} characters of documentation`);
  t.diagnostic(`documentation scanned: ${docs.length} files, ${chars} characters`);
});

test('no document promises an outcome outside a line that forbids it', () => {
  const { hits, linesRead } = scan(docs, PATTERNS, { negationExempt: true });
  assert.ok(linesRead > 2000, `only ${linesRead} lines of documentation read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `documentation promises a result:\n${report(hits)}`,
  );
});

/* ── the exclusion, proven live and proven non-swallowing ──────────────────── */

test('the negation exclusion is live. Documents really do list these words to ban them', (t) => {
  const raw = scan(docs, PATTERNS, { negationExempt: false });
  const exempted = raw.hits.filter((h) => isNegated(h.negationScope, h.negationAt));
  assert.ok(
    exempted.length > 0,
    'nothing was exempted by negation context, so the exclusion is vestigial. Remove ' +
      'it deliberately rather than leaving an unused exclusion in a check.',
  );
  // …and every raw hit is accounted for: either negated, or it would have failed above.
  assert.equal(
    exempted.length,
    raw.hits.length,
    `${raw.hits.length - exempted.length} raw hit(s) were neither negated nor reported. ` +
      'The accounting is broken.',
  );
  t.diagnostic(
    `lines that name a banned promise in order to forbid it: ${exempted.length} ` +
      `across ${new Set(exempted.map((h) => h.where)).size} file(s)`,
  );
});

test('and the exclusion does not swallow a bare promise', () => {
  const BARE = [
    'This will prove your innocence.',
    'Use it to beat the charge.',
    'You will be cleared once your lawyer sees this.',
    'The charges will be dropped when they read it.',
    'Guaranteed to help.',
    'It will show you were not there.',
    'Do this and you will be fine.',
    // The clause that really shipped in the marketplace listing, kept verbatim so the
    // regression it caused cannot come back quietly.
    'It freezes and hashes them so nobody can claim tampering.',
  ];
  proven('the bare-promise set', BARE, { floor: 8 });
  const missed = [];
  for (const line of BARE) {
    // ⚠️ Judged by the scan, not by asking whether the LINE contains a negation.
    // `It will show you were not there` contains one, inside the promise itself.
    // which is exactly the fixture that forced the exclusion to require its marker
    // to come BEFORE the match.
    const { hits } = scan(planted('bare-promise', line), PATTERNS, { negationExempt: true });
    if (hits.length === 0) missed.push(line);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
});

/**
 * 🔴 THE DEFECT THIS TEST EXISTS FOR, and it was live, not hypothetical.
 *
 *     This will prove your innocence completely.                        fired
 *     What not to touch, and it will prove your innocence completely.   SILENT
 *
 * Both directions are asserted per fixture, and the first direction is what stops the
 * set from being decoration: each line MUST carry a marker before its match, so the
 * old line-scoped rule provably swallowed it, and the clause rule must fire anyway.
 * A fixture with no marker in it would fire under either rule and establish nothing.
 */
test('and a marker in an EARLIER CLAUSE no longer swallows a promise later on the line', (t) => {
  const AFTER_A_MARKER = [
    // The marker differs in every one: `not`, `not`, `Nothing`, `never`, `⛔`/`No`,
    // `cannot`, so this is a property of the rule, not of one word.
    'What not to touch, and it will prove your innocence completely.',
    'Covers which records exist, how fast each dies, what not to touch, and freezing them so nobody can claim tampering.',
    'Nothing is uploaded, and your lawyer will win your case with it.',
    'We never ask what happened, but the charges will be dropped once they read it.',
    '⛔ No capability touches the other person, so you will be cleared.',
    'This tool cannot tell you what a record means; it is guaranteed to help anyway.',
  ];
  proven('the earlier-clause set', AFTER_A_MARKER, { floor: 6 });
  const unmarked = [];
  const stillSwallowed = [];
  for (const line of AFTER_A_MARKER) {
    const raw = scan(planted('after-a-marker', line), PATTERNS, { negationExempt: false });
    assert.ok(raw.hits.length > 0, `no pattern matched the fixture at all: ${line}`);
    for (const hit of raw.hits) {
      const preceding = hit.negationScope.slice(0, hit.negationAt);
      if (!hasNegationMarker(preceding)) unmarked.push(line);
      if (isNegated(hit.negationScope, hit.negationAt)) stillSwallowed.push(line);
    }
  }
  assert.deepEqual(
    unmarked,
    [],
    'fixture(s) carry no negation marker before the match, so the old line-scoped rule ' +
      `would have reported them and they prove nothing:\n  ${unmarked.join('\n  ')}`,
  );
  assert.deepEqual(
    stillSwallowed,
    [],
    'a marker in an earlier clause still swallowed a promise:\n  ' +
      `${stillSwallowed.join('\n  ')}\n` +
      '⛔ This is the line-scoped exclusion coming back. A marker governs the clause it ' +
      'sits in and nothing after it.',
  );
  // …and end to end, through the scan the rail actually runs.
  const missed = AFTER_A_MARKER.filter(
    (line) => scan(planted('after-a-marker', line), PATTERNS, { negationExempt: true }).hits.length === 0,
  );
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
  t.diagnostic(
    `promises placed after an earlier-clause marker, swallowed before and caught now: ` +
      `${AFTER_A_MARKER.length}`,
  );
});

test('but a marker and a promise in genuinely DIFFERENT SENTENCES on one line stay excluded', (t) => {
  /**
   * ⚠️ THIS IS THE CASE THE EXCLUSION EXISTS FOR, and it is why a sentence terminator
   * is deliberately NOT a clause boundary. Markdown hard-wraps, so a document that
   * forbids a phrase in one sentence and quotes it in the next is ONE LINE to a text
   * scanner. Fixture 3 is the shape of a real line in a decision record in this tree.
   * *This is not a new promise … The engine exploits a guarantee that already exists*.
   * and a decision record may not be retro-edited, so narrowing to the sentence would
   * fire on a file that cannot be changed.
   */
  const SEPARATE_SENTENCES = [
    '⛔ We never promise a result. A page that says this will prove your innocence is not shippable.',
    'Nothing here is a prediction. Somebody telling you you will be cleared is guessing.',
    'This is not a new promise. The engine exploits a guarantee that already exists.',
    'No outcome language, in any language. The banned list starts at acquit.',
  ];
  proven('the separate-sentence set', SEPARATE_SENTENCES, { floor: 4 });
  const fired = [];
  for (const line of SEPARATE_SENTENCES) {
    const raw = scan(planted('separate-sentences', line), PATTERNS, { negationExempt: false });
    assert.ok(raw.hits.length > 0, `no pattern matched the fixture at all: ${line}`);
    if (scan(planted('separate-sentences', line), PATTERNS, { negationExempt: true }).hits.length > 0) {
      fired.push(line);
    }
  }
  assert.deepEqual(
    fired,
    [],
    'the exclusion stopped covering a document that forbids a phrase and then quotes ' +
      `it in the next sentence:\n  ${fired.join('\n  ')}\n` +
      '⛔ Narrowing this far would force exemptions on the files that define the rule.',
  );
  t.diagnostic(
    `prohibitions still excluded across a sentence break on one line: ${SEPARATE_SENTENCES.length}. ` +
      'Residual, stated: a genuine promise written after a refusal in a previous sentence ' +
      'on the SAME line is still exempted.',
  );
});

/* ── the mutation set, and the limit stated ───────────────────────────────── */

test('the mutation set is judged honestly, including what a copy check cannot catch', (t) => {
  const MUTATIONS = [
    { text: 'People who bring this to counsel tend to do very well.', caught: false },
    { text: 'Once the record is in, this usually goes away quietly.', caught: false },
    { text: 'Nine times out of ten that is the end of it.', caught: false },
    { text: 'You will be exonerated.', caught: true },
    { text: 'This gets the charges withdrawn.', caught: false },
  ];
  proven('the mutation set', MUTATIONS, { floor: 5 });
  const missed = [];
  const uncatchable = [];
  for (const mutation of MUTATIONS) {
    const { hits } = scan(planted('mutation', mutation.text), PATTERNS, { negationExempt: true });
    if (mutation.caught && hits.length === 0) missed.push(mutation.text);
    if (!mutation.caught && hits.length === 0) uncatchable.push(mutation.text);
  }
  assert.deepEqual(missed, [], `the checker missed a phrasing it must catch:\n  ${missed.join('\n  ')}`);
  assert.ok(
    uncatchable.length > 0,
    'every phrasing was caught, including the ones recorded as uncatchable. This is a ' +
      'copy check over natural language; it cannot be complete, and a mutation set ' +
      'that always passes claims otherwise.',
  );
  t.diagnostic(
    `outcome promises this copy check provably does not catch: ${uncatchable.length}. ` +
      'The compensating control is human review, and step 3 of the review in ' +
      'legal/advertising_rules.md, a lawyer per jurisdiction, has never been run.',
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   TIER 3: THE PUBLISHED MANIFESTS. Marketing copy, read before anything is
   installed and before one word of doctrine reaches the reader.

   ⛔ NO NEGATION EXCLUSION HERE, deliberately, unlike the two tiers above. A
   listing has no business forbidding anything, so there is no legitimate reason for
   one of these words to appear in it at all, and the exclusion is exactly what hid
   this class of promise in the skill definition.
   ══════════════════════════════════════════════════════════════════════════════ */

const manifests = manifestBlocks();

test('the manifest scan read every published manifest', (t) => {
  const paths = manifestPaths();
  assert.equal(manifests.length, paths.length, 'a manifest was derived and then not read');
  const chars = manifests.reduce((n, b) => n + b.text.length, 0);
  assert.ok(chars > 800, `only ${chars} characters of manifest text`);
  t.diagnostic(`manifests read: ${manifests.length}, ${paths.join(' · ')}`);
  t.diagnostic(`manifest text scanned: ${chars} characters · patterns: ${PATTERNS.length}`);
});

test('no published manifest promises a result, or promises what nobody will be able to say', () => {
  const { hits, linesRead } = scan(manifests, PATTERNS);
  assert.ok(linesRead > 40, `only ${linesRead} lines of manifest read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a published manifest promises a result:\n${report(hits)}\n` +
      '⛔ The promise is an intact record, and nothing else is available to promise. ' +
      'A record that is hard to attack is not a record nobody will attack.',
  );
});

test('the manifest scan fires on the clause that really shipped, planted back into a real manifest', (t) => {
  // 🔴 IN A COPY OF THE REAL FILE, in the field it was really in. The listing carried
  // this for the whole life of the manifest and every check here was green.
  const target = manifestPaths().find((rel) => rel.endsWith('marketplace.json'))
    ?? manifestPaths()[0];
  const REGRESSIONS = [
    'freezes and hashes them so nobody can claim tampering.',
    'so nobody can say it was edited.',
    'It cannot be disputed once it is sealed.',
    'Use it to beat the charge.',
    'You will be cleared.',
  ];
  proven('the regression set', REGRESSIONS, { floor: 5 });
  const missed = [];
  for (const clause of REGRESSIONS) {
    const { hits } = scan(withPlantedWord(target, clause), PATTERNS);
    if (hits.length === 0) missed.push(clause);
  }
  assert.deepEqual(
    missed,
    [],
    `planted into ${target} and NOT caught:\n  ${missed.join('\n  ')}`,
  );
  t.diagnostic(`clauses planted in ${target} and caught: ${REGRESSIONS.length}`);
});

test('the new pattern is scoped to asserting, and the limits it must not fire on are real', (t) => {
  // The control, in the project's own words. These are statements of what a record
  // CANNOT establish, said to the person's benefit, and they appear in rendered output
  // and in the reference documents. If the pattern ever starts firing on them it has
  // stopped distinguishing a limit from a promise, and the rule collapses into a ban
  // on the word "nobody".
  const LIMITS = [
    'Changing one byte of it makes the digest change, and then nobody can tell.',
    'A time nobody can vouch for is worse than no time at all.',
    'A lawyer can build with it. Nobody can build with a score.',
    'A refusal nobody can act on routes the person nowhere.',
  ];
  proven('the limit set', LIMITS, { floor: 4 });
  const assertingPattern = PATTERNS.find(
    (p) => p.name === 'a promise that an opponent will be unable to assert something',
  );
  assert.ok(assertingPattern, 'the pattern this test is about is no longer in the table');
  const wrong = LIMITS.filter((line) => assertingPattern.re.test(line));
  assert.deepEqual(
    wrong,
    [],
    `the pattern fired on a statement of a LIMIT:\n  ${wrong.join('\n  ')}\n` +
      'Those sentences exist to tell the person what a record cannot do. Firing on ' +
      'them would force exemptions on exactly the files most likely to describe the ' +
      'thing, which is how a check stops establishing anything.',
  );
  // …and it still fires on the promise form of the same grammar, so the distinction
  // is being drawn rather than the pattern being dead.
  assert.ok(
    assertingPattern.re.test('so nobody can claim tampering'),
    'the pattern no longer catches the clause it was written for, so the scoping went ' +
      'too far and this control is protecting nothing',
  );
  t.diagnostic(`limit sentences correctly not reported: ${LIMITS.length}`);
});

test('and the project says out loud that its own copy review has not been run', () => {
  // The honest half of this rail. A green scan is not approval to publish copy.
  const rules = docs.find((d) => d.label === 'legal/advertising_rules.md');
  assert.ok(rules, 'legal/advertising_rules.md is not in the scanned set');
  assert.match(
    rules.text,
    /never been run/i,
    'the advertising rules no longer record that the lawyer review has not been run. ' +
      'If it HAS been run, that is a change to record deliberately, a green ' +
      'structural scan plus a clean checklist is two of three steps.',
  );
});
