/**
 * tests/rails/copy-vocabulary.test.mjs: the vocabulary check, as a COPY check
 * over human-facing strings, with its exclusions stated.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS IS NOT A REPOSITORY-WIDE WORD BAN, AND IT CANNOT BE ONE.
 *
 * The banned verbs necessarily appear in the doctrine, the rail matrix, the tests
 * and the fixtures that forbid them. A ban needing those exemptions no longer
 * establishes that the capability is absent, it establishes that somebody
 * remembered to write the exemptions. The structural absence of the capability is
 * enforced somewhere else and by a different technique: the positive allowlist in
 * `skill/allowlist.json`, diffed against static extraction, in
 * `allowlist.test.mjs`.
 *
 * What survives here is narrower and worth having on its own: **no string a
 * person reads may describe, offer, or instruct an action against another
 * person.** That is a copy property, and copy is where the reputational and legal
 * damage of this project's worst possible feature would actually land.
 *
 * ⚠️ AND A SECOND VOCABULARY PROPERTY, ADDED LATER AND FOR A DIFFERENT REASON.
 * TIER 3, at the bottom. The engine already refuses to put six internal words in
 * front of a person, and asserts it over every screen it can render. Nothing
 * asserted the same thing about the PUBLISHED MANIFESTS, which are read before a
 * screen exists, and all six had walked into the marketplace listing, two of them
 * into the `tags`, which are the discovery surface. It is here rather than in a new
 * file of its own for two reasons: this is the vocabulary check, so it is where the
 * next reader will look; and a new file under `tests/rails/` would be a test the
 * register does not name, which `standing.test.mjs` correctly fails as an orphan.
 *
 * ⚠️ THE THREE EXCLUSIONS, STATED RATHER THAN BURIED.
 *
 *  1. THE OBJECT MUST BE A PERSON. `a tracking pixel` is a compound noun naming a
 *     hazard, and it is in the contract, rendered verbatim to the person, because
 *     warning them about it is the point. `a smartwatch` is a device. So the verbs
 *     are scoped to a personal object rather than banned as words. Asserted live
 *     below: if no rendered string still needs this exclusion, the exclusion has
 *     outlived its justification and the test says so instead of drifting.
 *
 *  2. A LINE THAT FORBIDS THE THING IS NOT THE THING. A stop list has to name
 *     what it stops, the contract's own hard exclusions say *do not look at their
 *     accounts, profiles, or posts*, in those words, to a person. Also asserted
 *     live, and paired with a planted bare violation that must still fire.
 *
 *  3. ONE FILE IS EXEMPT, IN THE DOCUMENTATION TIER ONLY: the capture-hazards
 *     document, whose job is to enumerate what our own output must never surface
 *     about the other person. Four more were written and all four proved IDLE under
 *     the two rules above, so they were deleted: the test below requires every
 *     exemption to be load-bearing. Nothing is skipped without being counted, the
 *     accounting is asserted rather than assumed.
 *
 * ⛔ None of the three can be widened to make a run green. If a hit is real, the
 * copy is wrong.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  copyDocs,
  hardHumanText,
  isNegated,
  planted,
  proven,
  report,
  scan,
} from './_rails.mjs';
import {
  barredPatterns,
  barredWords,
  descriptionsIn,
  manifestBlocks,
  manifestPaths,
  railNumberShape,
  withPlantedWord,
} from './_manifests.mjs';

/* ── the patterns. Capability shapes, not a word list. ────────────────────── */

/**
 * ⚠️ A POSSESSIVE IS A DETERMINER, NOT AN OBJECT, and a bare pronoun cannot be
 * resolved by a regular expression at all. `watched their own devices` is the
 * person watching their own things; `where they are` in a plan means where the
 * FILES are. Both turned up as false hits on the first run of this check, in real
 * copy, which is why the object set below is object pronouns and explicit person
 * phrases only. The cost is stated in the mutation set: an evasion that refers to
 * the other person by a bare `she` or `their` is not caught here.
 */
const PERSON = String.raw`(?:them|him|someone|somebody|anyone|anybody|the other (?:person|party)|the complainant|(?:the |your )?accuser|the counterparty|<COUNTERPARTY>|<PARTY>)`;

/** Possessive forms, meaningful only when a surface noun follows. */
const POSSESSIVE = String.raw`(?:their|his|her|the other person's|the complainant's|the accuser's|<COUNTERPARTY>'s)`;

const VERBS = String.raw`(?:track|tracks|tracking|tracked|monitor|monitors|monitoring|monitored|watch|watches|watching|watched|shadow|shadows|shadowing|shadowed|trace|traces|tracing|traced|surveil\w*|stake out|keep tabs on|keep an eye on)`;

const PATTERNS = [
  {
    name: 'a banned verb with a person as its object',
    re: new RegExp(String.raw`\b${VERBS}\s+(?:the\s+|that\s+)?${PERSON}\b`, 'i'),
  },
  {
    name: 'surveillance vocabulary with no legitimate use in copy',
    re: /\bsurveil\w*|\bpredate[ds]?\b|\bpredating\b|\bstakeout\b/i,
  },
  {
    name: "reaching another person's own surface",
    re: new RegExp(
      String.raw`\b(?:look at|look up|check|view|open|visit|browse|search(?: for)?|scroll|read)\s+(?:${POSSESSIVE}|${PERSON})\s*(?:'s)?\s*(?:account|profile|posts?|page|feed|messages?|story|stories|timeline|photos?)`,
      'i',
    ),
  },
  {
    name: 'surfacing where another person is, goes, or will be',
    re: new RegExp(
      [
        String.raw`\b(?:find out|work out|figure out|establish|show you|tell you|surface)\s+(?:\w+\s+){0,3}where\s+(?:they|he|she|${PERSON})\b`,
        String.raw`\bwhere\s+${PERSON}\s+(?:is|are|was|were|lives?|works?|goes|will be)\b`,
        // ⚠️ An explicit person phrase only, NOT a possessive. `account for their
        // whereabouts` in a hazard-wording pack is about the accused person's OWN
        // movements, and a regular expression cannot resolve the determiner. Fixed
        // by class rather than by exempting the two files that tripped it.
        String.raw`\b${PERSON}(?:'s)?\s+(?:whereabouts|routine|movements|daily pattern)\b`,
      ].join('|'),
      'i',
    ),
  },
  {
    name: 'contacting another person, or reaching them through somebody',
    re: new RegExp(
      String.raw`\b(?:message|text|call|email|e-mail|contact|reach out to|get in touch with|reply to|respond to|apologise to|apologize to)\s+(?:${PERSON})\b`,
      'i',
    ),
  },
];

/**
 * 🔴 ONE FILE-LEVEL EXEMPTION IN THE DOCUMENTATION TIER, AND THE SHORTNESS OF THIS
 * LIST IS A FINDING RATHER THAN AN OMISSION.
 *
 * Four more were written first, the rail matrix, the contributing guide, the
 * manifesto and the limits document. On the assumption that a file whose job is to
 * state the refusals must trip a check on the refusals. The test below, which
 * requires every exemption to be load-bearing, reported all four as idle: with the
 * verbs scoped to a person as their object and the negation rule in place, not one
 * produces a hit. So they were removed rather than left as cover for a future one.
 * An exemption nobody is watching is how a tree stops being checked without anybody
 * deciding to stop checking it.
 *
 * ⛔ NONE OF THIS APPLIES TO THE TIER THAT COVERS WHAT THE SOFTWARE PRINTS. There
 * are no file exemptions there and there is nowhere to put one.
 */
const DOC_EXEMPT = [
  {
    file: 'docs/methods/08_capture_hazards.md',
    reason:
      'it is the capture-hazards document, and its job is to enumerate what our own ' +
      'output must never surface about the other person, in those words, because a ' +
      'reader has to recognise the shape to avoid producing it. The warning is ' +
      'carried by the paragraph rather than by a word on the line, so the negation ' +
      'rule cannot see it. The same file is exempt from the case-fact gate\'s ' +
      'vocabulary classes, for the same reason.',
  },
];

/* ── TIER 1, what the software actually prints ───────────────────────────── */

const hard = hardHumanText();

test('the hard tier read what the software really shows, over every route', (t) => {
  const chars = hard.reduce((n, b) => n + b.text.length, 0);
  assert.ok(
    chars > 20000,
    `only ${chars} characters of printed text. The enumeration is broken, and an ` +
      'absence assertion over a fragment is worthless',
  );
  t.diagnostic(`printed text scanned: ${chars} characters across ${hard.length} sources`);
  t.diagnostic(hard.map((b) => b.label).join(' · '));
});

test('nothing the software prints describes, offers, or instructs an act against another person', () => {
  const { hits, linesRead } = scan(hard, PATTERNS, { negationExempt: true });
  assert.ok(linesRead > 500, `only ${linesRead} lines read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} ${h.match}`),
    [],
    `printed copy reaches another person:\n${report(hits)}\n` +
      '⛔ The fix is the copy. This tier takes no file exemptions.',
  );
});

/* ── the two exclusions, proven live and proven non-swallowing ────────────── */

test('exclusion 1 is still needed: a banned verb really does appear with a non-person object', () => {
  const bareWords = /\b(?:track|tracking|monitor|monitoring|watch|watching|trace|tracing)\b/i;
  const carriers = [];
  for (const block of hard) {
    for (const line of block.text.split('\n')) {
      if (bareWords.test(line)) carriers.push(`${block.label}: ${line.trim().slice(0, 120)}`);
    }
  }
  assert.ok(
    carriers.length > 0,
    'no printed string carries one of the banned verbs at all any more, so scoping ' +
      'them to a personal object is no longer buying anything. Either the contract ' +
      'changed, in which case tighten this check to a bare word ban for this tier, ' +
      'deliberately, or the scan is broken.',
  );
  // …and every one of them is a non-person object, which is why it is not a hit.
  const { hits } = scan(hard, [PATTERNS[0]], { negationExempt: true });
  assert.deepEqual(hits, [], `a banned verb DOES have a person as its object:\n${report(hits)}`);
});

test('exclusion 2 is still needed: printed copy really does forbid things in their own words', (t) => {
  let exempted = 0;
  const raw = scan(hard, PATTERNS, { negationExempt: false });
  for (const hit of raw.hits) if (isNegated(hit.negationScope, hit.negationAt)) exempted += 1;
  assert.ok(
    exempted > 0,
    'the negation exemption suppressed nothing, so it is vestigial. Remove it ' +
      'deliberately rather than leaving an unused exclusion in a check.',
  );
  // A count, not an adjective. It is the only thing that distinguishes an exclusion
  // doing real work from one that happens to suppress a single line.
  t.diagnostic(`printed lines that name a banned act in order to refuse it: ${exempted}`);
});

test('and exclusion 2 does not swallow a bare instruction with no negation in it', () => {
  const bare = [
    'We can monitor them for you and let you know if anything changes.',
    'Open their profile and take a screenshot of the posts.',
    'Here is how to find out where she is on a Tuesday.',
    'Message him once to explain, briefly, and keep it polite.',
    'Run the surveillance step before you freeze anything.',
    // 🔴 A MARKER IN AN EARLIER CLAUSE, which the line-scoped version of the rule
    // swallowed whole. `Nothing` sits in the first clause; the instruction is in the
    // second. See `governingClause` in _rails.mjs.
    'Nothing here reaches anyone, and you can message him once to explain.',
    '⛔ We never go near their account, so open their profile and read the posts.',
  ];
  proven('the bare-instruction set', bare, { floor: 7 });
  for (const line of bare) {
    // Judged by the scan rather than by asking whether the LINE holds a negation: a
    // bare instruction can contain one and still be an instruction.
    const { hits } = scan(planted('bare-instruction', line), PATTERNS, { negationExempt: true });
    assert.ok(hits.length > 0, `the scanner missed a bare instruction: ${line}`);
  }
});

/* ── the mutation set: semantic evasions, and the honest limit ────────────── */

const MUTATIONS = [
  { text: 'We can keep an eye on them and tell you if anything changes.', caught: true },
  { text: 'Just check their page quickly, nobody will know.', caught: true },
  { text: 'I can work out roughly where she is most evenings.', caught: true },
  { text: 'Reply to him once, very briefly, to clear it up.', caught: true },
  { text: 'A quiet look at what they have been posting would help your case.', caught: false },
  { text: 'Have a friend take a look and report back.', caught: false },
];

test('the mutation set is judged honestly. Including the ones a copy check cannot catch', (t) => {
  proven('the mutation set', MUTATIONS, { floor: 6 });
  const missed = [];
  const uncatchable = [];
  for (const mutation of MUTATIONS) {
    const { hits } = scan(planted('mutation', mutation.text), PATTERNS, { negationExempt: true });
    if (mutation.caught && hits.length === 0) missed.push(mutation.text);
    if (!mutation.caught && hits.length === 0) uncatchable.push(mutation.text);
  }
  assert.deepEqual(
    missed,
    [],
    `the scanner missed a phrasing it is meant to catch:\n  ${missed.join('\n  ')}`,
  );
  assert.ok(
    uncatchable.length > 0,
    'every phrasing in the mutation set was caught, including the ones recorded as ' +
      'uncatchable. Either the patterns improved. In which case move them and add ' +
      'harder ones, or the scan is broken. A mutation set that always passes gives ' +
      'false confidence of completeness, which is the risk this test carries.',
  );
  t.diagnostic(
    `phrasings a copy check provably cannot catch: ${uncatchable.length}. ` +
      'The structural control for those is the absence of the capability, not the words.',
  );
});

/* ── TIER 2: documentation, with the file exemptions stated ──────────────── */

const docs = copyDocs();

test('the documentation tier read a real set of files', (t) => {
  proven('the documentation set', docs, { floor: 10 });
  const chars = docs.reduce((n, d) => n + d.text.length, 0);
  assert.ok(chars > 50000, `only ${chars} characters of documentation`);
  t.diagnostic(`documentation scanned: ${docs.length} files, ${chars} characters`);
  t.diagnostic(`file-level exemptions: ${DOC_EXEMPT.length === 0 ? 'none' : DOC_EXEMPT.map((e) => e.file).join(', ')}`);
});

const EXEMPT_NAMES = new Set(DOC_EXEMPT.map((e) => e.file));
const checked = docs.filter(
  (d) => !EXEMPT_NAMES.has(d.label) && ![...EXEMPT_NAMES].some((f) => d.label.endsWith(`/${f}`)),
);

test('nothing is skipped, and any exemption would have to be load-bearing', (t) => {
  // Accounting first: every document is either scanned or named as an exemption.
  // A file that is neither has been dropped silently, which is how a tree stops
  // being checked without anybody deciding to stop checking it.
  assert.equal(
    checked.length + DOC_EXEMPT.length,
    docs.length,
    `${docs.length - checked.length - DOC_EXEMPT.length} document(s) fell out of ` +
      'both the scanned set and the exemption list',
  );

  // …and an exemption for a file that does not trip the check is an exemption
  // nobody is watching. Prove each one is load-bearing, or delete it.
  const idle = [];
  for (const exempt of DOC_EXEMPT) {
    const block = docs.find((d) => d.label === exempt.file || d.label.endsWith(`/${exempt.file}`));
    assert.ok(block, `${exempt.file} is exempted and is not in the scanned set at all`);
    const { hits } = scan([block], PATTERNS, { negationExempt: true });
    if (hits.length === 0) idle.push(exempt.file);
  }
  assert.deepEqual(
    idle,
    [],
    `these files are exempt and no longer need to be: ${idle.join(', ')}. ` +
      'Remove the exemption rather than leaving it as cover for a future hit.',
  );
  t.diagnostic(
    `documents scanned: ${checked.length} · file-level exemptions: ${DOC_EXEMPT.length}`,
  );
});

test('no document offers, describes, or instructs an act against another person', () => {
  proven('the scanned documentation set', checked, { floor: 8 });
  const { hits, linesRead } = scan(checked, PATTERNS, { negationExempt: true });
  assert.ok(linesRead > 1000, `only ${linesRead} lines of documentation read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} ${h.match}`),
    [],
    `documentation reaches another person:\n${report(hits)}`,
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   TIER 3: THE PUBLISHED MANIFESTS. The first screen, before any doctrine.

   🔴 The rule the engine enforces over its own screens, enforced over the copy a
   person reads before a screen exists. The reason it is a rule at all is short:
   jargon before value is a prediction failure. A word that has to be explained
   before it means anything spends the only attention a frightened person has.

   ⛔ NO EXEMPTIONS, and no negation rule either. A listing has no business
   forbidding anything, so a listing that names a barred word is a listing that
   uses it.
   ══════════════════════════════════════════════════════════════════════════════ */

const manifests = manifestBlocks();
const MANIFEST_VOCABULARY = barredPatterns();

test('the manifest scan read every published manifest, and each one has content', (t) => {
  const paths = manifestPaths();
  const chars = manifests.reduce((n, b) => n + b.text.length, 0);
  assert.equal(manifests.length, paths.length, 'a manifest was derived and then not read');
  assert.ok(
    chars > 800,
    `only ${chars} characters of manifest text across ${manifests.length} file(s). An ` +
      'absence assertion over a fragment is worthless, so this fails rather than ' +
      'reporting clean.',
  );
  t.diagnostic(`manifests read: ${manifests.length}, ${paths.join(' · ')}`);
  t.diagnostic(`manifest text scanned: ${chars} characters`);
  t.diagnostic(
    `barred words, read from the engine's own constant: ${barredWords().join(', ')} ` +
      `· plus the rail-number shape ${railNumberShape()}`,
  );
});

test('no published manifest uses a word that has to be explained before it means anything', () => {
  const { hits, linesRead } = scan(manifests, MANIFEST_VOCABULARY);
  assert.ok(linesRead > 40, `only ${linesRead} lines of manifest read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a published manifest carries internal vocabulary:\n${report(hits)}\n` +
      '⛔ This is the one surface where the rule is easy: no filename to keep, no ' +
      'citation to preserve, and the audience is not an agent. Write it in words a ' +
      'frightened person already knows. The fix is the copy, never this check.',
  );
});

test('the manifest vocabulary scan fires on every barred word, planted in a real manifest', (t) => {
  // 🔴 EACH WORD, IN A COPY OF THE REAL FILE, IN THE FIELD THE BREACH WAS IN. A
  // planted stub would prove only that a scanner sees a string; this proves the scan
  // as configured, over the surface it guards, catches every entry of the list.
  const target = manifestPaths().find((rel) => rel.endsWith('marketplace.json'))
    ?? manifestPaths()[0];
  const words = barredWords();
  const missed = [];
  for (const word of words) {
    const { hits } = scan(withPlantedWord(target, word), MANIFEST_VOCABULARY);
    if (hits.length === 0) missed.push(word);
  }
  assert.deepEqual(
    missed,
    [],
    `the manifest scan did not catch: ${missed.join(', ')}, planted in ${target}`,
  );

  // …and the rail-number shape, which is a pattern rather than a word.
  const { hits: railHits } = scan(withPlantedWord(target, 'RAIL 7'), MANIFEST_VOCABULARY);
  assert.ok(
    railHits.some((h) => h.name === 'a rail number'),
    'a planted rail number was not reported as one, so the pattern read out of the ' +
      'engine did not survive being read',
  );
  t.diagnostic(
    `barred words planted in ${target} and caught: ${words.length}, plus the rail number`,
  );
});

/* ── the positive half: what the listing must still say ───────────────────── */

test('every manifest still says it produces a record rather than a verdict', () => {
  const silent = [];
  for (const rel of manifestPaths()) {
    const copy = descriptionsIn(rel);
    if (!/\b(?:never|not)\b[^.]{0,24}\bverdict\b/i.test(copy)) silent.push(rel);
  }
  assert.deepEqual(
    silent,
    [],
    `manifest(s) no longer say that the output is a record and not a verdict: ` +
      `${silent.join(', ')}\n` +
      'It is the single most load-bearing sentence in the listing: it is what stops a ' +
      'reader expecting the software to tell them how their situation turns out. ' +
      'Rewording it is fine. Losing it is not.',
  );
});

test('every manifest still says whose records these are. Own device, own account, own export', () => {
  const thin = [];
  for (const rel of manifestPaths()) {
    const copy = descriptionsIn(rel);
    const missing = [
      ['a device of their own', /\byour own\b[^.]{0,60}\bdevices?\b/i],
      ['an account of their own', /\byour own\b[^.]{0,60}\baccounts?\b/i],
      ['an export of their own', /\byour own\b[^.]{0,60}\bexports?\b/i],
    ]
      .filter(([, re]) => !re.test(copy))
      .map(([what]) => what);
    if (missing.length > 0) thin.push(`${rel}: does not scope it to ${missing.join(' / ')}`);
  }
  assert.deepEqual(
    thin,
    [],
    `the listing no longer scopes itself to the person's own records:\n  ${thin.join('\n  ')}\n` +
      'A listing that leaves the scope out reads as an offer to obtain somebody ' +
      "else's record, which is the one thing this project has no capability for and " +
      'the one reading that would make it dangerous to the person installing it.',
  );
});

test('the two plugin descriptions are identical, because nothing keeps them in step', () => {
  // ⚠️ A REAL DRIFT HAZARD, NOT A TIDINESS CHECK. `plugin/.claude-plugin/plugin.json`
  // is a near-duplicate of `.claude-plugin/plugin.json` differing only in where it
  // points for its skills, and unlike the skill tree beside it, the build does NOT
  // generate it and the lock does not cover it. So the only thing keeping the packaged
  // listing and the in-repo listing saying the same thing is this assertion.
  const plugins = manifestPaths().filter((rel) => rel.endsWith('.claude-plugin/plugin.json'));
  proven('the plugin manifests', plugins, { floor: 2 });
  const [first, ...rest] = plugins;
  const reference = descriptionsIn(first);
  for (const other of rest) {
    assert.equal(
      descriptionsIn(other),
      reference,
      `${other} and ${first} describe the plugin differently. Neither is generated ` +
        'from the other, so a change to one silently leaves the other behind, and ' +
        'the stale one is the copy that ships inside the package.',
    );
  }
});
