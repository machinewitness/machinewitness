/**
 * tests/rails/no-telemetry.test.mjs. Free forever, and nothing is reported back.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHY THIS IS A RAIL AND NOT A PREFERENCE. The person with the most urgent need
 * has the least ability to pay at the exact moment the need is most urgent, so a
 * price is a filter on precisely the people this exists for. And usage data about a
 * defence-preservation tool is a record that somebody was preparing a defence, on
 * somebody else's server, discoverable, so *anonymised* and *opt-in* are not
 * mitigations here, they are two more ways to hold the record.
 *
 * FOUR PROPERTIES, checked four different ways.
 *   ZERO RUNTIME DEPENDENCIES  read out of the package manifest and its lock, and
 *                              cross-checked against the absence of any dependency
 *                              manifest inside the shipped skill
 *   NO REPORTING SHAPE         no analytics, beacon, crash reporter, version check
 *                              or update check anywhere on a user path
 *   NO PRICE SURFACE           no tier, quota, seat, key or paywall in human-facing
 *                              copy
 *   NO ACCOUNT                 read out of the contract's own declared invariants
 *
 * The compensating control for all four is behavioural and lives in
 * `offline.test.mjs`: the whole flow runs with the network denied. A textual absence
 * is evidence; an execution with no network is proof.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  REPO,
  capabilitySites,
  contract,
  copyDocs,
  extractSites,
  hardHumanText,
  isNegated,
  listUnder,
  planted,
  proven,
  readRepo,
  report,
  scan,
} from './_rails.mjs';

/* ── zero runtime dependencies ────────────────────────────────────────────── */

test('the package declares no runtime dependency, and the lock agrees', (t) => {
  const pkg = JSON.parse(proven('package.json', readRepo('package.json'), { floor: 100 }));
  assert.deepEqual(
    Object.keys(pkg.dependencies ?? {}),
    [],
    'a runtime dependency is declared. Nothing on a user path may need an install step.',
  );
  const dev = Object.keys(pkg.devDependencies ?? {});
  proven('the build-time dependencies', dev, { floor: 1 });

  const lock = JSON.parse(proven('package-lock.json', readRepo('package-lock.json'), { floor: 100 }));
  const rootEntry = lock.packages?.[''] ?? {};
  assert.deepEqual(
    Object.keys(rootEntry.dependencies ?? {}),
    [],
    'the lock records a runtime dependency the manifest does not',
  );
  // Every locked package must be reachable only as a build-time dependency.
  const locked = Object.keys(lock.packages ?? {}).filter((k) => k !== '');
  const runtime = locked.filter((k) => (lock.packages[k].dev ?? false) !== true);
  assert.deepEqual(
    runtime,
    [],
    `the lock holds package(s) that are not marked build-only: ${runtime.join(', ')}`,
  );
  t.diagnostic(`build-time dependencies: ${dev.join(', ')} · locked packages: ${locked.length}`);
});

test('nothing inside the shipped skill needs an install step', () => {
  const shipped = ['skill', '.claude', '.codex', 'plugin'];
  const offenders = [];
  for (const root of shipped) {
    if (!existsSync(join(REPO, root))) continue;
    for (const rel of listUnder(root)) {
      if (/(?:^|\/)(?:package\.json|requirements\.txt|pyproject\.toml|Pipfile|poetry\.lock|package-lock\.json|yarn\.lock)$/.test(rel)) {
        offenders.push(rel);
      }
      if (rel.includes('/node_modules/') || rel.includes('/site-packages/')) offenders.push(rel);
    }
  }
  assert.deepEqual(
    offenders,
    [],
    `a dependency manifest ships inside the skill: ${offenders.join(', ')}. It must work ` +
      'offline, end to end, with nothing fetched and nothing installed.',
  );
});

/* ── no reporting shape ───────────────────────────────────────────────────── */

/**
 * 🔴 `TELEMETRY` IS THIS PROJECT'S OWN DOMAIN VOCABULARY, AND THAT BREAKS THE OBVIOUS
 * CHECK. The highest-density record class in the whole method corpus is *wearable
 * telemetry*; the platform store on one mobile operating system is literally called
 * usage statistics. A word ban on `telemetry` or `usage data` fires on eight real
 * documents describing records the person owns, which is the same lesson as the
 * banned verbs: **the word is not the capability.**
 *
 * So every pattern below needs a verb of collection, a named third-party product, or
 * an endpoint noun. What is forbidden is reporting something back, not naming a kind
 * of record.
 */
const REPORTING = [
  {
    name: 'sending, collecting or reporting data back',
    re: /\b(?:send|sends|sending|sent|report|reports|reporting|upload|uploads|uploading|uploaded|transmit|transmits|transmitting|collect|collects|collecting|collected|gather|gathers|gathering|emit|emits|emitting)\b[^.]{0,40}\b(?:telemetry|analytics|usage (?:data|statistics|stats|metrics)|diagnostics|crash (?:report|reports|data))\b/i,
  },
  {
    name: 'a named analytics or crash-reporting product',
    re: /\b(?:mixpanel|posthog|amplitude|segment\.io|heap\.io|plausible\.io|google-analytics|gtag|sentry|sentry_sdk|bugsnag|rollbar|crashlytics|datadog|new ?relic)\b/i,
  },
  {
    name: 'a beacon or a ping home',
    re: /\bsendBeacon\b|\bbeacon\s*\(|\bping[-_ ]?home\b|\bphone[-_ ]?home\b|\bpings?\s+home\b|\bcall(?:s|ing)?\s+home\b/i,
  },
  {
    name: 'a version or update check',
    re: /\b(?:version[-_ ]?check\w*|check(?:s|ing)?[-_ ]?for[-_ ]?updates?|update[-_ ]?check\w*|auto[-_ ]?updat\w+|latest[-_ ]?release)\b/i,
  },
  {
    name: 'an analytics or telemetry endpoint',
    re: /\b(?:telemetry|analytics|metrics|diagnostics)[-_. ]?(?:endpoint|server|service|host|url|api|sink|pipeline)\b/i,
  },
  {
    name: 'anonymised or opt-in data collection, which is not a mitigation here',
    re: /\b(?:anonymous|anonymised|anonymized|aggregate|aggregated|opt[-_ ]?in)\s+(?:usage\s+)?(?:statistics|stats|metrics|analytics|telemetry)\b/i,
  },
];

const codeBlocks = [
  ...listUnder('skill/scripts', ['.py']),
  ...listUnder('cli', ['.py', '.js', '.mjs', '.cjs', '.ts']),
].map((rel) => ({ label: rel, text: readRepo(rel) }));

test('the code scan read real source', (t) => {
  proven('the user-path source set', codeBlocks, { floor: 1 });
  const chars = codeBlocks.reduce((n, b) => n + b.text.length, 0);
  assert.ok(chars > 10000, `only ${chars} characters of user-path source`);
  t.diagnostic(`user-path source scanned: ${codeBlocks.map((b) => b.label).join(', ')} (${chars} characters)`);
});

test('no user-path source carries a reporting shape', () => {
  const { hits } = scan(codeBlocks, REPORTING);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a reporting shape exists in code:\n${report(hits)}`,
  );
});

test('and no user-path source has any outbound shape at all', () => {
  const extracted = capabilitySites(
    [...listUnder('skill/scripts', ['.py']), ...listUnder('cli', ['.py', '.js', '.mjs', '.cjs', '.ts'])],
  );
  proven('the extracted capability sites', extracted.sites, { floor: 5 });
  const network = extracted.sites.filter((s) => s.cls === 'network');
  assert.deepEqual(
    network.map((s) => `${s.file}:${s.line} ${s.token}`),
    [],
    'there is an outbound shape on a user path. Nothing can be reported without one, ' +
      'and its absence is what makes the four properties above check each other.',
  );
});

test('nothing the software prints, and no document, offers a reporting surface', () => {
  const surfaces = [...hardHumanText(), ...copyDocs(), {
    label: 'skill/allowlist.json',
    text: readRepo('skill/allowlist.json'),
  }];
  const { hits, linesRead } = scan(surfaces, REPORTING, { negationExempt: true });
  assert.ok(linesRead > 2000, `only ${linesRead} lines read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a reporting surface is described somewhere a reader will see it:\n${report(hits)}`,
  );
});

test('the negation exclusion is live here. The project names these to refuse them', (t) => {
  const surfaces = [...copyDocs(), { label: 'skill/allowlist.json', text: readRepo('skill/allowlist.json') }];
  const raw = scan(surfaces, REPORTING, { negationExempt: false });
  const exempted = raw.hits.filter((h) => isNegated(h.negationScope, h.negationAt));
  assert.ok(exempted.length > 0, 'nothing was exempted, so the exclusion is vestigial');
  assert.equal(
    exempted.length,
    raw.hits.length,
    `${raw.hits.length - exempted.length} raw hit(s) neither exempted nor reported`,
  );
  t.diagnostic(`lines that name a reporting surface in order to refuse it: ${exempted.length}`);
});

/* ── no price surface ─────────────────────────────────────────────────────── */

/**
 * ⚠️ `trial` and `subscription` are NOT in this list, deliberately. A trial is a
 * court proceeding, and the contract's own stop list tells the person not to cancel
 * a subscription, both are rendered verbatim to a person, and banning either word
 * would make this check impossible to satisfy for reasons that have nothing to do
 * with money.
 */
const PRICE = [
  // ⚠️ `checkout` was here and it is gone: in this repository a checkout is a git
  // working tree, and the jurisdiction command's own scaffolding note tripped on it.
  // ⚠️ `pricing` is narrowed to an OFFER, because two decision records legitimately
  // use the bare word, one to say what the decision constrains, one to describe the
  // commercial framing it supersedes.
  { name: 'a price or a paywall', re: /\b(?:pricing\s+(?:page|plan|table|tiers?)|our pricing|paywall|per[-_ ]seat|free tier|price list|checkout page|payment (?:page|method|details)|add to (?:cart|basket))\b/i },
  { name: 'a tier or an edition', re: /\b(?:pro|premium|plus|enterprise|paid)\s+(?:plan|tier|edition|version|account)\b|\bupgrade to\b/i },
  { name: 'a key, a quota, or a seat', re: /\b(?:licen[cs]e key|activation code|serial number|quota|rate limit|seats?\s+remaining)\b/i },
  { name: 'an account requirement', re: /\b(?:sign up|create an account|register an account|log ?in to (?:your )?account)\b/i },
];

/**
 * 🔴 ONE FILE, AND IT IS THE DOCUMENT THAT REFUSES THE PRICE. The manifesto's
 * argument is *a paywall on evidence preservation is a paywall on the truth
 * surviving*, the refusal is in the sentence after it, so neither the line nor the
 * preceding line carries a marker. Load-bearing, asserted below.
 */
const PRICE_EXEMPT = [
  {
    file: 'MANIFESTO.md',
    reason:
      'it is the reasoning of record for free-forever, and it cannot argue against a ' +
      'paywall without naming one. The refusal follows the sentence rather than ' +
      'preceding it.',
  },
];

test('the price exemption is load-bearing, and nothing else is skipped', (t) => {
  const all = copyDocs();
  const idle = [];
  for (const exempt of PRICE_EXEMPT) {
    const block = all.find((d) => d.label === exempt.file);
    assert.ok(block, `${exempt.file} is exempted and is not in the set`);
    const { hits } = scan([block], PRICE, { negationExempt: true });
    if (hits.length === 0) idle.push(exempt.file);
  }
  assert.deepEqual(idle, [], `exempt and no longer needing to be: ${idle.join(', ')}`);
  t.diagnostic(`price-check exemptions: ${PRICE_EXEMPT.map((e) => e.file).join(', ')}`);
});

test('no human-facing surface carries a price, a tier, a key, or an account', () => {
  const exempt = new Set(PRICE_EXEMPT.map((e) => e.file));
  const surfaces = [...hardHumanText(), ...copyDocs().filter((d) => !exempt.has(d.label))];
  const { hits, linesRead } = scan(surfaces, PRICE, { negationExempt: true });
  assert.ok(linesRead > 2000, `only ${linesRead} lines read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a price or account surface is described:\n${report(hits)}\n` +
      '⛔ No price, tier, trial, quota, seat, key or account. Not as a plan, not as a ' +
      'future, not as a note about how it might have been.',
  );
});

/* ── no account, read out of the contract ─────────────────────────────────── */

test('the contract itself declares no account, no transmission, and offline working', () => {
  const meta = contract.meta ?? {};
  assert.equal(meta.requires_account, false, 'the contract declares that an account is required');
  assert.equal(meta.transmits_answers, false, 'the contract declares that answers are transmitted');
  assert.equal(meta.works_offline, true, 'the contract no longer declares that it works offline');
});

/* ── planted fixtures ─────────────────────────────────────────────────────── */

test('the checkers fire on every planted violation', () => {
  // A runtime dependency.
  const fakePkg = { dependencies: { 'some-http-client': '1.0.0' } };
  assert.notDeepEqual(
    Object.keys(fakePkg.dependencies),
    [],
    'the dependency check cannot fail, which means it is not a check',
  );

  // A reporting shape in code, and an outbound endpoint with it.
  const planted_code = [
    { file: 'cli/fixture-telemetry.py', text: 'import urllib.request\nurllib.request.urlopen("https://telemetry.example.invalid/hit")\n' },
    { file: 'cli/fixture-crash.py', text: 'import sentry_sdk\nsentry_sdk.init("x")\n' },
    { file: 'cli/fixture-version.mjs', text: 'const latest = await fetch("https://example.invalid/version-check");\n' },
  ];
  for (const block of planted_code) {
    const { hits } = scan([{ label: block.file, text: block.text }], REPORTING);
    const sites = extractSites([block]).sites.filter((s) => s.cls === 'network');
    assert.ok(
      hits.length > 0 || sites.length > 0,
      `neither checker caught ${block.file}:\n${block.text}`,
    );
  }

  // A price surface in copy.
  const PRICE_FIXTURES = [
    'Upgrade to the pro plan for the full report.',
    'Enter your licence key to continue.',
    'See our pricing page for details.',
    'Create an account to save your answers.',
    'You have 3 seats remaining on this plan.',
    // 🔴 A MARKER IN AN EARLIER CLAUSE. The line-scoped version of the negation rule
    // read `No`/`never` as covering the whole line and reported neither of these.
    // See `governingClause` in _rails.mjs.
    'No account is ever required, and you can enter your licence key to continue.',
    '⛔ The tool is never the leverage, so upgrade to the pro plan for the rest.',
  ];
  proven('the price fixture set', PRICE_FIXTURES, { floor: 7 });
  const missed = [];
  for (const fixture of PRICE_FIXTURES) {
    const { hits } = scan(planted('price', fixture), PRICE, { negationExempt: true });
    if (hits.length === 0) missed.push(fixture);
  }
  assert.deepEqual(missed, [], `the price checker missed:\n  ${missed.join('\n  ')}`);
});

/* ── the mutation set ─────────────────────────────────────────────────────── */

test('the mutation set of quieter reporting shapes is caught, and the limit is stated', (t) => {
  const MUTATIONS = [
    { text: 'It quietly pings home once a week so we know it still works.', caught: true },
    { text: 'Anonymous usage statistics, opt-in, nothing identifying.', caught: true },
    { text: 'A one-line check for the latest release on start-up.', caught: true },
    { text: 'We keep a note of how many people got as far as the plan.', caught: false },
  ];
  proven('the mutation set', MUTATIONS, { floor: 4 });
  const missed = [];
  const uncatchable = [];
  for (const mutation of MUTATIONS) {
    const { hits } = scan(planted('mutation', mutation.text), REPORTING);
    if (mutation.caught && hits.length === 0) missed.push(mutation.text);
    if (!mutation.caught && hits.length === 0) uncatchable.push(mutation.text);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
  assert.ok(
    uncatchable.length > 0,
    'every mutation was caught, including the one recorded as uncatchable. A ' +
      'description of counting people needs none of these words.',
  );
  t.diagnostic(
    `reporting descriptions a word check cannot catch: ${uncatchable.length}. ` +
      'The control is that there is no outbound path to report on, executed in ' +
      'tests/rails/offline.test.mjs, not asserted here.',
  );
});
