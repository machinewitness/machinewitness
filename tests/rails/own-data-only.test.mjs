/**
 * tests/rails/own-data-only.test.mjs. Own account, own device, own export.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE POSITIVE FORM. Every source this software reads must be something the
 * person is lawfully entitled to obtain about themselves. So the check is not "is
 * there a bad source in here". It is "here is the complete list, and every entry
 * on it resolves to the person, to this machine, or to the software's own install."
 * An enumeration can be complete; a search for the forbidden cannot.
 *
 * AND THE SECOND HALF, WHICH IS THE ONE THAT ACTUALLY BITES: **no command takes a
 * credential.** A password, a token, an API key, a cookie or a session identifier
 * is how a tool reaches something its user does not own, and the absence of any
 * parameter for one is a stronger statement than any policy about intent. It is
 * checked three ways, against the declared list, against every parameter name in
 * the code and in the reference documents, and by running the engine and watching
 * it reject one.
 *
 * ⚠️ WHAT THIS CANNOT ESTABLISH, stated rather than implied: a neutrally-named
 * positional argument could still carry a secret, and nothing textual would see it.
 * The compensating control is that there is no outbound path for a secret to travel
 * on, asserted in `allowlist.test.mjs` and executed in `offline.test.mjs`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ENGINE,
  allowlist,
  listUnder,
  planted,
  proven,
  readRepo,
  report,
  scan,
  scratch,
} from './_rails.mjs';

const list = allowlist();

const OWNERS = new Set(['the person', 'this machine', 'the install']);
const ROOTS = new Set(['install', 'workspace', 'cwd', 'machine', 'home', 'temp', 'null_device']);

/* ── every declared source belongs to the person, the machine, or the install ── */

test('every declared source is the person’s own, this machine’s own, or the install’s own', (t) => {
  const sources = proven('the declared data sources', list.data_sources ?? [], { floor: 5 });
  const wrong = [];
  for (const source of sources) {
    if (source.third_party !== false) wrong.push(`${source.id}: third_party is not false`);
    if (!OWNERS.has(source.owner)) wrong.push(`${source.id}: owner "${source.owner}" is not one of the three`);
    if (!ROOTS.has(source.root)) wrong.push(`${source.id}: root "${source.root}" is not a known root`);
    if (/<COUNTERPARTY>/i.test(source.path ?? '')) wrong.push(`${source.id}: names the other person`);
  }
  assert.deepEqual(wrong, [], `declared sources that are not the person's own:\n  ${wrong.join('\n  ')}`);
  t.diagnostic(`sources declared: ${sources.length} · owners seen: ${[...new Set(sources.map((s) => s.owner))].join(', ')}`);
});

test('the declaration says outright that nothing belongs to anybody else', () => {
  const statement = list.no_source_belonging_to_anybody_else;
  assert.ok(
    typeof statement === 'string' && statement.length > 200,
    'the declaration carries no statement about whose data it reads. The positive ' +
      'claim is the point of this rail, and a list with no claim attached is just a list.',
  );
  for (const needed of [/credential/i, /device|account|cloud/i]) {
    assert.ok(needed.test(statement), `the statement does not mention ${needed}`);
  }
});

test('a write outside the person’s folder is declared, defaulted off, and needs them to ask', () => {
  const outside = proven('the declared writes outside the workspace', list.writes_outside_the_workspace ?? []);
  for (const entry of outside) {
    assert.ok(entry.requires, `${entry.path} is written with no stated precondition`);
    assert.ok(entry.default, `${entry.path} declares no default`);
  }
  const optIn = outside.find((e) => /home/i.test(e.path));
  assert.ok(optIn, 'the pointer under the home directory is not declared at all');
  assert.match(optIn.default, /off/i, 'the pointer is not off by default');
  // A22 / ADR 0010. This used to accept "the person answering yes", because the
  // pointer was opt-in. It is now derived from the contract's device-exposure
  // question, so the declaration has to name that condition rather than any
  // condition at all — /yes|ask|answer/ would still have passed a declaration
  // saying the person is asked, which is no longer what happens.
  assert.match(
    optIn.requires,
    /device[- ]exposure|device_exposed/i,
    'the declared precondition for writing a path outside the workspace does not ' +
      'name the device-exposure condition that actually decides it',
  );
  assert.match(
    optIn.requires,
    /told|screen/i,
    'the declaration does not record that the person is told the file exists. ' +
      'Writing it silently would be a worse version of this, not a better one',
  );
});

/* ── no credential parameter, anywhere ────────────────────────────────────── */

const CREDENTIAL = [
  { name: 'a password parameter', re: /--(?:password|passwd|pass|passphrase|pin)\b/i },
  { name: 'a token or key parameter', re: /--(?:token|api[-_]?key|apikey|secret|bearer|access[-_]?token|refresh[-_]?token)\b/i },
  { name: 'a session or cookie parameter', re: /--(?:cookie|cookies|cookie[-_]?jar|session|session[-_]?id|sid)\b/i },
  { name: 'a sign-in parameter', re: /--(?:login|sign[-_]?in|auth|authenticate|credential|credentials|username|user[-_]?name|account[-_]?name)\b/i },
  { name: 'an impersonation parameter', re: /--(?:as[-_]?user|impersonate|on[-_]?behalf[-_]?of|for[-_]?user)\b/i },
  { name: 'an interactive secret prompt', re: /\bgetpass\b|\bkeyring\b|\bkeychain\b/i },
];

/**
 * Every parameter this software has, from the two places parameters are written:
 * the code that defines them and the documents that tell an agent to use them.
 */
function parameterSurface() {
  const blocks = [];
  for (const rel of listUnder('skill/scripts', ['.py'])) {
    blocks.push({ label: rel, text: readRepo(rel) });
  }
  for (const rel of listUnder('skill/reference', ['.md'])) {
    blocks.push({ label: rel, text: readRepo(rel) });
  }
  blocks.push({ label: 'skill/SKILL.src.md', text: readRepo('skill/SKILL.src.md') });
  return proven('the parameter surface', blocks, { floor: 10 });
}

const surface = parameterSurface();

test('the parameter surface really holds parameters. Otherwise the absence proves nothing', (t) => {
  const flags = new Set();
  for (const block of surface) {
    for (const m of block.text.matchAll(/--[a-z][a-z0-9-]*/gi)) flags.add(m[0].toLowerCase());
  }
  proven('the flags found on the parameter surface', [...flags], { floor: 4 });
  t.diagnostic(`parameters found: ${[...flags].sort().join(' ')}`);
});

test('no command anywhere takes a credential', () => {
  assert.deepEqual(
    list.credential_parameters ?? null,
    [],
    'the declaration lists a credential parameter',
  );
  const { hits, linesRead } = scan(surface, CREDENTIAL);
  assert.ok(linesRead > 500, `only ${linesRead} lines read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    `a credential parameter exists:\n${report(hits)}\n` +
      '⛔ A command that takes a credential is a command reaching something the ' +
      'person may not own. There is no version of this that is fine because it is ' +
      'optional.',
  );
});

test('the engine REJECTS a credential parameter when one is actually passed', () => {
  // Executed, not read. A document saying no credential is accepted is a phrase;
  // an argument parser that refuses one is a gate.
  const work = scratch('credential-rejection');
  for (const attempt of [
    ['begin', '--password', 'anything'],
    ['begin', '--token', 'anything'],
    ['answer', 'ok', '--as-user', 'somebody'],
  ]) {
    const run = spawnSync('python3', [ENGINE, ...attempt], {
      cwd: work,
      encoding: 'utf8',
      env: { ...process.env, HOME: join(work, 'home'), PYTHONDONTWRITEBYTECODE: '1' },
    });
    assert.notEqual(
      run.status,
      0,
      `the engine ACCEPTED ${attempt.join(' ')}:\n${run.stdout}\n${run.stderr}`,
    );
    assert.match(
      `${run.stdout}\n${run.stderr}`,
      /unrecognized arguments|error:/i,
      `the engine did not reject ${attempt.join(' ')} as an unknown parameter`,
    );
  }
});

/* ── planted fixtures ─────────────────────────────────────────────────────── */

test('the checker fires on every planted violation', () => {
  const FIXTURES = [
    'Run it with --password <their account password> to reach the export.',
    'Pass --api-key so the platform will answer.',
    'Supply --cookie-jar from the browser profile first.',
    'Use --as-user to look at somebody else’s side of the thread.',
    'It falls back to getpass when no key is given.',
  ];
  proven('the fixture set', FIXTURES, { floor: 5 });
  const missed = [];
  for (const fixture of FIXTURES) {
    const { hits } = scan(planted('credential', fixture), CREDENTIAL);
    if (hits.length === 0) missed.push(fixture);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
});

test('the declared-source checker fires on a source that is not the person’s', () => {
  const bad = [
    { id: 'planted-third-party', path: 'the other account', root: 'machine', owner: 'the person', third_party: true },
    { id: 'planted-unknown-owner', path: 'somewhere', root: 'machine', owner: 'a platform', third_party: false },
    { id: 'planted-counterparty', path: '<COUNTERPARTY> message store', root: 'machine', owner: 'the person', third_party: false },
    { id: 'planted-unknown-root', path: 'somewhere else', root: 'the internet', owner: 'the person', third_party: false },
  ];
  proven('the bad-source fixture set', bad, { floor: 4 });
  for (const source of bad) {
    const wrong = [];
    if (source.third_party !== false) wrong.push('third party');
    if (!OWNERS.has(source.owner)) wrong.push('owner');
    if (!ROOTS.has(source.root)) wrong.push('root');
    if (/<COUNTERPARTY>/i.test(source.path)) wrong.push('names the other person');
    assert.ok(wrong.length > 0, `${source.id} was accepted, and it should not have been`);
  }
});

/* ── the mutation set ─────────────────────────────────────────────────────── */

test('the mutation set of credential-shaped parameters is caught, and the limit is stated', (t) => {
  const MUTATIONS = [
    { text: 'Add --credential-file pointing at the saved sign-in.', caught: true },
    { text: 'Use --auth to attach the header.', caught: true },
    { text: 'Set --session-id from the browser tab.', caught: true },
    { text: 'Pass --impersonate to see it as they do.', caught: true },
    { text: 'Give it the second argument from the sticky note on their desk.', caught: false },
  ];
  proven('the mutation set', MUTATIONS, { floor: 5 });
  const missed = [];
  const uncatchable = [];
  for (const mutation of MUTATIONS) {
    const { hits } = scan(planted('mutation', mutation.text), CREDENTIAL);
    if (mutation.caught && hits.length === 0) missed.push(mutation.text);
    if (!mutation.caught && hits.length === 0) uncatchable.push(mutation.text);
  }
  assert.deepEqual(missed, [], `the checker missed:\n  ${missed.join('\n  ')}`);
  assert.ok(
    uncatchable.length > 0,
    'every mutation was caught, including the one recorded as uncatchable. A ' +
      'neutrally-named positional argument can carry a secret and nothing textual ' +
      'will see it, if that is no longer true, say why rather than letting the ' +
      'mutation set imply completeness.',
  );
  t.diagnostic(
    `credential shapes a name check cannot catch: ${uncatchable.length}. ` +
      'The control is that there is no outbound path for a secret to travel on.',
  );
});
