/**
 * tests/rails/positioning.test.mjs: wrongly accused, not a gender. And no
 * statistic about how common a false accusation is.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS TEST EXISTS BECAUSE THERE WAS NO TEST. The first plan for the rail suite
 * had no row for this rail at all (eleven rails, ten rows) and a suite with a
 * missing row reads exactly like a suite that passes.
 *
 * TWO PROPERTIES, and they fail for different reasons.
 *
 *  GENDER. Scoping the audience to men closes the distribution this needs: the
 *  people who forward it are respondents in workplace processes, parents in family
 *  proceedings, people accused of fraud or theft, and falsely-accused people of
 *  every gender. It also attracts a reading of the project that ADR 0002 says no
 *  version of this survives. So the check is on AUDIENCE SCOPING, *for men*,
 *  *helping accused men*, rather than on the words, because a gendered pronoun in
 *  an example sentence is not a positioning claim and banning it would make this
 *  check impossible to satisfy honestly.
 *
 *  PREVALENCE. A statistic about how often accusations are false is somebody
 *  else's argument. It does nothing for the person in front of you, it cannot be
 *  sourced in a way that survives contact with a lawyer, and it converts a
 *  preservation tool into a position in a public fight.
 *
 * ⚠️ AND IT IS A COPY CHECK, SO IT CANNOT BE EXHAUSTIVE. That limit is in the
 * rail-matrix row for this rail and for the outcome-promise rail, and it is asserted
 * here by a mutation set that includes phrasings this check provably misses.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { copyDocs, hardHumanText, isNegated, planted, proven, report, scan } from './_rails.mjs';

/**
 * ⚠️ SINGULAR AND PLURAL, both. The first version listed `fathers` and not `father`,
 * so `written for every falsely-accused father` passed, a gendered scoping in the
 * singular, which is the more natural way somebody would actually write it. Found by
 * the mutation set, which is the whole reason a mutation set exists.
 */
const GENDERED = String.raw`(?:m[ae]n|males?|wom[ae]n|females?|guys?|blokes?|lads?|fathers?|mothers?|husbands?|wife|wives|boys?|girls?|dads?|mums?|moms?|brothers?|sisters?|sons?|daughters?)`;

const SCOPING = String.raw`(?:for|helping|help|helps|built for|designed for|aimed at|about|serves|serving|defend|defending|protect|protecting|supports?|supporting|written for|made for)`;

const PATTERNS = [
  {
    // ⚠️ `[\w-]+` rather than `\w+` for the intervening words. `written for every
    // falsely-accused father` slipped through the first version because a hyphenated
    // adjective is not one word-character run. Found by the mutation set.
    name: 'the audience scoped by gender',
    re: new RegExp(String.raw`\b${SCOPING}\s+(?:[\w'’-]+\s+){0,2}${GENDERED}\b`, 'i'),
  },
  {
    name: 'a gendered movement or framing',
    re: /\bmen'?s rights\b|\bmanosphere\b|\bred pill\b|\bMGTOW\b|\bfemale (?:accuser|complainant)s?\b|\bmale (?:accused|defendant)s?\b/i,
  },
  {
    name: 'a prevalence figure about accusations',
    re: /\b\d+(?:\.\d+)?\s*(?:%|per ?cent\b)[^.]{0,60}(?:accusation|allegation|complaint|claim)|\b(?:accusation|allegation|complaint|claim)s?[^.]{0,60}\b\d+(?:\.\d+)?\s*(?:%|per ?cent\b)/i,
  },
  {
    name: 'a prevalence claim in words',
    re: /\b(?:most|many|majority|\d+ in \d+|one in \w+)\b[^.]{0,40}\b(?:accusations?|allegations?|complaints?|claims?)\b[^.]{0,40}\b(?:are|is|turn out|prove)\b[^.]{0,20}\bfalse\b|\bfalse\s+(?:accusations?|allegations?)\b[^.]{0,60}\b(?:common|rare|frequent|prevalent|rate|statistic|often|widespread|epidemic)\b|\bhow\s+(?:common|often|frequently|widespread)\b[^.]{0,40}\bfalse\b/i,
  },
  {
    name: 'a comparative frequency claim about accusations',
    re: /\b(?:far |much |a lot )?(?:more|less)\s+(?:common|often|frequent(?:ly)?)\b[^.]{0,60}\b(?:accusation|allegation|complaint|claim)/i,
  },
];

/* ── TIER 1, what the software prints ────────────────────────────────────── */

const hard = hardHumanText();

test('the scan read what the software really prints', (t) => {
  const chars = hard.reduce((n, b) => n + b.text.length, 0);
  assert.ok(chars > 20000, `only ${chars} characters of printed text`);
  proven('the pattern table', PATTERNS, { floor: 5 });
  t.diagnostic(`printed text scanned: ${chars} characters · patterns: ${PATTERNS.length}`);
});

test('nothing the software prints scopes its audience by gender or cites a prevalence', () => {
  const { hits, linesRead } = scan(hard, PATTERNS, { negationExempt: true });
  assert.ok(linesRead > 500, `only ${linesRead} lines read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `printed copy takes a position:\n${report(hits)}\n` +
      '⛔ This is for people facing an accusation. Nothing narrower, and no statistic.',
  );
});

/* ── TIER 2, documentation, including the README when there is one ────────── */

/**
 * 🔴 ONE FILE, IN THE DOCUMENTATION TIER ONLY, and it is the same file the case-fact
 * gate exempts from its vocabulary classes, for the same reason.
 *
 * The decision record that refuses a counterparty surface states, as its distribution
 * argument, the exact description this project must never fit. The prohibition is
 * carried by the paragraph rather than by a word before the phrase, so the negation
 * rule cannot see it, and **an ADR records the reasoning of its moment and must not be
 * retro-edited**, so rewording it to satisfy a scanner would be the wrong fix.
 *
 * ⛔ Nothing is exempt in the tier that covers what the software prints.
 */
const DOC_EXEMPT = [
  {
    file: 'docs/adr/0002-no-counterparty-surface.md',
    reason:
      'the decision record for this refusal. It quotes the description the project ' +
      'must never fit, in order to explain why the capability is structurally absent, ' +
      'and an ADR is a historical record that must not be retro-edited.',
  },
];

const allDocs = copyDocs();
const docs = allDocs.filter((d) => !DOC_EXEMPT.some((e) => d.label === e.file));

test('the documentation scan covers the outward-facing files, and would cover a README', (t) => {
  proven('the documentation set', docs, { floor: 20 });
  assert.equal(
    docs.length + DOC_EXEMPT.length,
    allDocs.length,
    'a document fell out of both the scanned set and the exemption list',
  );
  // An exemption for a file that no longer trips the check is one nobody is watching.
  const idle = [];
  for (const exempt of DOC_EXEMPT) {
    const block = allDocs.find((d) => d.label === exempt.file);
    assert.ok(block, `${exempt.file} is exempted and is not in the set at all`);
    const { hits } = scan([block], PATTERNS, { negationExempt: true });
    if (hits.length === 0) idle.push(exempt.file);
  }
  assert.deepEqual(
    idle,
    [],
    `exempt and no longer needing to be: ${idle.join(', ')}. Remove the exemption ` +
      'rather than leaving it as cover for a future hit.',
  );
  t.diagnostic(`file-level exemptions: ${DOC_EXEMPT.map((e) => e.file).join(', ')}`);
  // The set is derived from the tracked tree, so an outward-facing file added later
  // is covered without anybody editing a list. There is no README yet, which is
  // exactly why the coverage must be derived rather than named.
  const readme = docs.find((d) => /^README\.md$/.test(d.label));
  const front = docs.filter((d) => /^[A-Z_]+\.md$/.test(d.label)).map((d) => d.label);
  proven('the front-matter documents', front, { floor: 4 });
  t.diagnostic(
    `outward-facing documents scanned: ${front.join(', ')}` +
      `${readme ? '' : ' · no README exists yet; the glob will pick one up when it does'}`,
  );
});

test('no document scopes the audience by gender or cites a prevalence', () => {
  const { hits, linesRead } = scan(docs, PATTERNS, { negationExempt: true });
  assert.ok(linesRead > 2000, `only ${linesRead} lines of documentation read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `documentation takes a position:\n${report(hits)}`,
  );
});

test('the negation exclusion is live here too, and every raw hit is accounted for', (t) => {
  const raw = scan(docs, PATTERNS, { negationExempt: false });
  const exempted = raw.hits.filter((h) => isNegated(h.negationScope, h.negationAt));
  assert.ok(
    exempted.length > 0,
    'nothing was exempted, so the exclusion is vestigial here. The project states this ' +
      'refusal in its own documents, so something should be.',
  );
  assert.equal(
    exempted.length,
    raw.hits.length,
    `${raw.hits.length - exempted.length} raw hit(s) neither exempted nor reported`,
  );
  t.diagnostic(
    `lines that name the forbidden framing in order to refuse it: ${exempted.length} ` +
      `across ${new Set(exempted.map((h) => h.where)).size} file(s)`,
  );
});

/* ── planted fixtures ─────────────────────────────────────────────────────── */

test('the checker fires on every planted violation', () => {
  const FIXTURES = [
    'Built for men who have been falsely accused.',
    'A tool for wrongly accused husbands and fathers.',
    'Helping accused men keep the record straight.',
    'Studies suggest 8% of accusations of this kind are false.',
    'Most accusations of this kind turn out to be false.',
    'False allegations are far more common than people realise.',
    'Here is how common false accusations actually are.',
    'A resource for the men’s rights community.',
    // 🔴 A MARKER IN AN EARLIER CLAUSE. The line-scoped version of the negation rule
    // read `Nothing`/`never` as covering the whole line and reported neither of these.
    // See `governingClause` in _rails.mjs.
    'Nothing here is scoped by gender, and it is built for men who were wrongly accused.',
    '⛔ We never cite a rate, but this is far more common than people realise for accusations of this kind.',
  ];
  proven('the fixture set', FIXTURES, { floor: 10 });
  const missed = [];
  for (const fixture of FIXTURES) {
    const { hits } = scan(planted('positioning', fixture), PATTERNS, { negationExempt: true });
    if (hits.length === 0) missed.push(fixture);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
});

/* ── the mutation set, and the limit stated ───────────────────────────────── */

test('the mutation set is judged honestly, including what a copy check cannot catch', (t) => {
  const MUTATIONS = [
    { text: 'For guys in this situation, the first hour matters most.', caught: true },
    { text: 'Written for every falsely-accused father out there.', caught: true },
    { text: 'This happens far more often than anybody admits.', caught: false },
    { text: 'The majority of these do not hold up under scrutiny.', caught: false },
    { text: 'You are not the first person this has been done to, and there are a lot of you.', caught: false },
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
    'every phrasing was caught, including the ones recorded as uncatchable. A ' +
      'prevalence claim can be made without a number and without the word false, and ' +
      'a mutation set that always passes hides that.',
  );
  t.diagnostic(
    `positioning claims this copy check provably does not catch: ${uncatchable.length}. ` +
      'Stated in the rail-matrix row rather than implied away.',
  );
});

test('the project states the positioning it wants, not only the one it refuses', () => {
  // A refusal alone leaves the positive open to drift. Somebody has to have written
  // down what this IS for, or the next writer picks.
  const conduct = docs.find((d) => d.label === 'CODE_OF_CONDUCT.md');
  assert.ok(conduct, 'CODE_OF_CONDUCT.md is not in the scanned set');
  assert.match(
    conduct.text,
    /people facing an accusation|wrongly accused/i,
    'nothing in the code of conduct states who this is for. Refusing a gendered ' +
      'framing without stating the intended one leaves the positioning to whoever ' +
      'writes the next paragraph.',
  );
});
