/**
 * tests/rails/capture-audit-binding.test.mjs. Reading can create evidence, so no
 * read happens without a permission bound to that exact source and that exact
 * operation.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🟢 THE RAIL IS NOW ENFORCED END TO END, and the last step of it is what this
 * file gained: the two commands that read a source CALL the preflight, so the
 * three refusals are proven twice over, once against the preflight itself, and
 * once through each command that reads.
 *
 * 🟡 IT WAS RED BEFORE THAT, AND RED WAS THE CORRECT STATE: nothing read a source
 * belonging to the person, so there was nothing to gate. Then the preflight
 * existed and the two commands did not call it, which is the state this file used
 * to pin by name, a precondition that is real in one file and absent from its two
 * callers is not enforcement.
 *
 * ⚠️ BEFORE ALL OF THAT IT WAS WRITTEN DOWN AS ENFORCED, AND THAT WAS THE DEFECT.
 * The earliest check confirmed that a reference document DECLARED a precondition. A
 * declaration in a document is a phrase; a gate is a gate. So the assertion below
 * is not about prose: it RUNS the preflight and requires it to refuse three
 * specific things, a missing permission, a permission for a different source, and
 * a stale one, by exiting non-zero before the first read.
 *
 * FOUR PROPERTIES, and each one exists because its absence is a real failure mode:
 *
 *  1. EXECUTED, NOT READ. Every refusal below is a process that ran and an exit
 *     code that came back. Nothing here greps the gate's source for a promise.
 *
 *  2. A CONTROL. A valid permission is ACCEPTED. Without it, "refuses everything"
 *     and "refuses the right things" are the same green, and a gate that refuses
 *     everything is not a gate, it is an outage.
 *
 *  3. 🔴 THE SOURCE IS A NAMED PIPE WITH NO WRITER. Opening it for reading blocks
 *     for ever, so a read is observable as a process that never finishes, on any
 *     platform, with no privileges and no tracing tool. A timeout is therefore
 *     REPORTED AS A READ rather than counted as a refusal, which matters because
 *     `spawnSync` returns a null status on timeout and `status !== 0` would have
 *     passed on it. That is the trap this file would otherwise have walked into.
 *
 *  4. A PLANTED MUTANT PER REFUSAL, AND IT MUST BE ACCEPTED. Each refusal is
 *     re-run against a throwaway copy of the gate with exactly that one guard
 *     removed, and the mutant is required to ACCEPT what the real gate refused.
 *     That is what proves the refusal comes from that guard rather than from an
 *     accident somewhere else. ⛔ The mutants live only in throwaway trees; the
 *     shipped file is never edited, and the last test in this file re-reads it and
 *     asserts every guard is still in it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  ENGINE,
  REPO,
  allowlist,
  constantsIn,
  listUnder,
  proven,
  readRepo,
  realWalk,
  scratch,
  workspaceDirs,
} from './_rails.mjs';

const GATE_REL = 'skill/scripts/capture_audit.py';
const GATE = join(REPO, GATE_REL);

/** The two commands that read a source. Both must route through the preflight. */
const COPY_REL = 'skill/scripts/freeze.py';
const CHECK_REL = 'skill/scripts/verify.py';
const COPY = join(REPO, COPY_REL);
const CHECK = join(REPO, CHECK_REL);

/**
 * Where the gate keeps the permission. ⛔ READ OUT OF THE CONSTANTS, not typed: the
 * comment that used to sit here claimed these were derived and they were two
 * literals, which is the same class of defect as a prose count of a contract.
 */
const [COPIES_IN, KEPT_IN] = workspaceDirs();
const KEPT_AS = constantsIn(GATE_REL, 'PERMISSION_FILENAME')[0];

/**
 * How each command that routes through the preflight is invoked with no permission
 * in hand. ⛔ Their argument shapes genuinely differ. One takes a source
 * positionally, the other is pointed at a folder, so a map is the honest form, and
 * it FAILS CLOSED: a script that starts routing through the preflight without an
 * entry here fails the trip-wire rather than being skipped by it.
 */
const NO_PERMISSION_RUN = {
  [COPY_REL]: (source, workspace) => [source, '--into', workspace],
  [CHECK_REL]: (_source, workspace) => ['--into', workspace],
};

/* ── running the gate, with a timeout that means something ─────────────────── */

const walk = realWalk();
const WORKSPACE = walk.folder;
const HOME = walk.home;

function run(script, args, { cwd = WORKSPACE, home = HOME, timeout = 30000 } = {}) {
  const result = spawnSync('python3', [script, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' },
    timeout,
  });
  // 🔴 A TIMEOUT IS A READ, NOT A REFUSAL. `spawnSync` reports a null status when
  // it kills the child, and a bare `status !== 0` would have accepted that as a
  // refusal, with the named pipe below, a hang is the one thing this whole file
  // is built to catch.
  assert.equal(
    result.error?.code,
    undefined,
    `could not run ${script}: ${result.error?.message}`,
  );
  assert.ok(
    typeof result.status === 'number' && result.signal === null,
    `${script} ${args.join(' ')} NEVER FINISHED (signal ${result.signal}). With a ` +
      'named pipe as the source that means it opened the source and blocked, the ' +
      'exact thing this gate exists to run in front of.',
  );
  return result;
}

const gate = (args, options) => run(GATE, args, options);

/** A named pipe with no writer. Opening it for reading blocks for ever. */
function namedPipe(name) {
  const path = join(scratch('sources'), name);
  rmSync(path, { force: true });
  const made = spawnSync('mkfifo', [path], { encoding: 'utf8' });
  assert.equal(
    made.status,
    0,
    'could not create a named pipe, so the no-read property cannot be observed at ' +
      `all: ${made.stderr}. ⛔ Do not soften this into a skip, an unrun check ` +
      'reads exactly like a passing one.',
  );
  assert.ok(existsSync(path), 'the named pipe was not created');
  return path;
}

/** Ask the gate for a permission on a source, and require it to be issued. */
function permitted(source, operation, options = {}) {
  const issued = gate([
    'audit',
    '--workspace',
    WORKSPACE,
    '--source',
    source,
    '--operation',
    operation,
    '--arrived-as',
    options.arrivedAs ?? 'already-on-your-device',
    '--might-hold-intimate-media',
    options.media ?? 'no',
    '--closed-by-your-conditions',
    options.closed ?? 'no',
  ]);
  assert.equal(
    issued.status,
    0,
    `the audit refused to issue a permission for ${source}:\n${issued.stdout}\n${issued.stderr}`,
  );
  return issued;
}

const permissionFile = () => join(WORKSPACE, KEPT_IN, KEPT_AS);

function readPermission() {
  const path = permissionFile();
  assert.ok(existsSync(path), `no permission was written at ${path}`);
  const body = proven('the permission on disk', readFileSync(path, 'utf8'), { floor: 100 });
  return JSON.parse(body);
}

function writePermission(document) {
  writeFileSync(permissionFile(), `${JSON.stringify(document, null, 2)}\n`);
}

function clearPermission() {
  rmSync(permissionFile(), { force: true });
}

/* ── the planted mutants: one guard removed, in a throwaway install tree ───── */

/**
 * A whole throwaway install: the engine, the gate, and the contract pair, laid out
 * the way the gate resolves them relative to itself. The gate is copied through a
 * text substitution, so the mutant runs the IDENTICAL code path with exactly one
 * guard gone. A fixture checked by a second implementation proves nothing about
 * the first.
 */
function plantedGate(label, from, to) {
  const root = scratch(`planted-${label}`);
  mkdirSync(join(root, 'scripts'), { recursive: true });
  mkdirSync(join(root, 'data'), { recursive: true });
  copyFileSync(join(REPO, 'skill', 'scripts', 'triage.py'), join(root, 'scripts', 'triage.py'));
  for (const name of ['tree.json', 'tree.sha256']) {
    copyFileSync(join(REPO, 'skill', 'data', name), join(root, 'data', name));
  }

  const original = readRepo(GATE_REL);
  assert.ok(
    original.includes(from),
    `the guard this mutation removes is no longer in ${GATE_REL}:\n${from}\n` +
      '⛔ The marker drifted. Re-point the mutation at the guard rather than ' +
      'deleting the mutation. An unplantable mutant is an unfalsifiable test.',
  );
  const mutated = original.replace(from, to);
  assert.notEqual(mutated, original, 'the mutation changed nothing');
  const path = join(root, 'scripts', 'capture_audit.py');
  writeFileSync(path, mutated);
  return path;
}

/* ══════════════════════════════════════════════════════════════════════════════
   THE CONTROL FIRST. Everything below is vacuous without it.
   ══════════════════════════════════════════════════════════════════════════════ */

const PIPE = namedPipe('a-source-that-must-not-be-opened');
const OTHER_PIPE = namedPipe('a-different-source');

test('a valid permission is ACCEPTED, and the source is never opened', (t) => {
  clearPermission();
  permitted(PIPE, 'freeze');
  const ok = gate(['check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze']);
  assert.equal(ok.status, 0, `a valid permission was refused:\n${ok.stdout}\n${ok.stderr}`);
  // A pass that does not say what it checked is worth what it checked.
  assert.match(ok.stdout, /\b5 checks ran\b/, `the pass does not say how many checks ran:\n${ok.stdout}`);
  assert.ok(ok.stdout.includes(PIPE), 'the pass does not name what it was asked about');
  t.diagnostic('the control passes, so every refusal below is a refusal of something specific');
});

/* ══════════════════════════════════════════════════════════════════════════════
   🔴 THE THREE REFUSALS. Each one executed, then re-run against a mutant with
   exactly that guard removed, which must ACCEPT it.
   ══════════════════════════════════════════════════════════════════════════════ */

test('1, NO PERMISSION AT ALL is refused, and the mutant that treats absence as clean accepts it', (t) => {
  clearPermission();
  assert.ok(!existsSync(permissionFile()), 'the fixture did not remove the permission');

  const refused = gate([
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.notEqual(
    refused.status,
    0,
    `THE PREFLIGHT ACCEPTED A READ WITH NO PERMISSION:\n${refused.stdout}\n${refused.stderr}`,
  );
  assert.match(
    refused.stdout,
    /Nothing has been checked/i,
    `the refusal does not say what is missing:\n${refused.stdout}`,
  );

  // The mutant: absence treated as clean. This is the project's own headline
  // failure ("not found" and "nothing read" being the same answer) planted here
  // so the refusal above cannot be passing by accident.
  const mutant = plantedGate(
    'absence-is-clean',
    '    document = read_permission_file(workspace, source, operation)\n',
    [
      '    try:',
      '        document = read_permission_file(workspace, source, operation)',
      '    except Refusal:',
      '        document = {',
      '            "schema": PERMISSION_SCHEMA,',
      '            "made_for_the_folder": str(workspace),',
      '            "made_against_contract": installed_contract_digest(),',
      '            "checks": [{',
      '                "before_reading": str(source),',
      '                "so_that": operation,',
      '                "answer": GO,',
      '                "made_at": time.time(),',
      '                "good_for_seconds": GOOD_FOR_SECONDS,',
      '            }],',
      '        }',
      '',
    ].join('\n'),
  );
  const waved = run(mutant, [
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.equal(
    waved.status,
    0,
    'the mutant with the absence guard removed STILL refused, so the refusal above ' +
      `is not produced by that guard and this test proves nothing:\n${waved.stdout}\n${waved.stderr}`,
  );
  t.diagnostic('refusal 1 proven: the real gate refuses, the mutant without the guard does not');
});

test('2, A PERMISSION FOR A DIFFERENT SOURCE is refused, and the mutant that drops the binding accepts it', (t) => {
  clearPermission();
  permitted(OTHER_PIPE, 'freeze');

  // The permission exists, is fresh, is for this folder and this contract, and is
  // for the wrong thing. That is the whole fixture.
  const document = readPermission();
  assert.equal(document.checks.length, 1, 'the fixture holds more than the one permission it meant to');
  assert.equal(document.checks[0].before_reading, OTHER_PIPE, 'the permission names the wrong source');

  const refused = gate([
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.notEqual(
    refused.status,
    0,
    `THE PREFLIGHT ACCEPTED A PERMISSION ISSUED FOR SOMETHING ELSE:\n${refused.stdout}\n${refused.stderr}`,
  );
  assert.ok(
    refused.stdout.includes(PIPE),
    `the refusal does not name what was asked for:\n${refused.stdout}`,
  );

  const mutant = plantedGate(
    'any-source-will-do',
    '        if Path(named).expanduser().resolve() != source:\n            continue\n',
    '        if False:\n            continue\n',
  );
  const waved = run(mutant, [
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.equal(
    waved.status,
    0,
    'the mutant with the source binding removed STILL refused, so the refusal above ' +
      `is not the binding doing the work:\n${waved.stdout}\n${waved.stderr}`,
  );
  t.diagnostic('refusal 2 proven: bound to the source, and provably so');
});

test('3, A STALE PERMISSION is refused, and the mutant that drops the deadline accepts it', (t) => {
  clearPermission();
  permitted(PIPE, 'freeze');

  /**
   * ⚠️ THE FIXTURE AGES THE RECORD ON DISK, and that is deliberate rather than
   * lazy. The alternative is a parameter telling the gate what time it is, and a
   * switch that makes a gate pass is a switch that makes it worthless. Time is the
   * one input a test cannot supply honestly from outside, so the record moves
   * instead of the clock.
   */
  const document = readPermission();
  const goodFor = document.checks[0].good_for_seconds;
  assert.ok(goodFor > 0, 'the permission records no deadline at all, so it cannot go stale');
  document.checks[0].made_at -= goodFor * 4;
  writePermission(document);

  const refused = gate([
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.notEqual(
    refused.status,
    0,
    `THE PREFLIGHT ACCEPTED A STALE PERMISSION:\n${refused.stdout}\n${refused.stderr}`,
  );
  assert.match(
    refused.stdout,
    /too old/i,
    `the refusal does not say the permission is out of date:\n${refused.stdout}`,
  );

  const mutant = plantedGate('never-expires', '    if age > good_for:\n', '    if False:\n');
  const waved = run(mutant, [
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.equal(
    waved.status,
    0,
    'the mutant with the deadline removed STILL refused, so the refusal above is not ' +
      `the deadline doing the work:\n${waved.stdout}\n${waved.stderr}`,
  );
  t.diagnostic('refusal 3 proven: a permission is good for a bounded time, and provably so');
});

/* ══════════════════════════════════════════════════════════════════════════════
   The other two-thirds of the binding, and the shapes a hazard record fails in.
   The plan names three fixtures; a record can be wrong in more ways than three.
   ══════════════════════════════════════════════════════════════════════════════ */

test('a permission for a different OPERATION on the same source is refused', () => {
  clearPermission();
  permitted(PIPE, 'freeze');
  const refused = gate([
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'verify',
  ]);
  assert.notEqual(
    refused.status,
    0,
    `a permission to freeze was accepted as a permission to verify:\n${refused.stdout}`,
  );
  assert.ok(refused.stdout.includes('verify'), 'the refusal does not name the job that was asked for');
});

test('a permission COPIED IN FROM ANOTHER FOLDER is refused, the stale-record case that travels', () => {
  clearPermission();
  permitted(PIPE, 'freeze');

  // A second folder that looks like a workspace, holding a permission made for the
  // first one. This is what "copied from another matter" actually looks like.
  const elsewhere = scratch('another-matter');
  mkdirSync(join(elsewhere, KEPT_IN), { recursive: true });
  copyFileSync(join(WORKSPACE, '.mw-state.json'), join(elsewhere, '.mw-state.json'));
  copyFileSync(permissionFile(), join(elsewhere, KEPT_IN, KEPT_AS));

  const refused = gate(
    ['check', '--workspace', elsewhere, '--source', PIPE, '--operation', 'freeze'],
    { cwd: elsewhere },
  );
  assert.notEqual(
    refused.status,
    0,
    `a permission made for another folder was accepted here:\n${refused.stdout}`,
  );
  assert.match(refused.stdout, /different folder/i, `the refusal does not say why:\n${refused.stdout}`);
});

test('a permission made against a DIFFERENT CONTRACT is refused', () => {
  clearPermission();
  permitted(PIPE, 'freeze');
  const document = readPermission();
  const real = document.made_against_contract;
  assert.match(real, /^[0-9a-f]+$/, 'the permission records no contract digest');
  // Flipped rather than typed, so no full-length digest is written into this file.
  // the case-fact gate refuses one, correctly, even in a fixture.
  document.made_against_contract = real.split('').reverse().join('');
  writePermission(document);

  const refused = gate([
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.notEqual(refused.status, 0, `a permission from another contract was accepted:\n${refused.stdout}`);
  assert.match(refused.stdout, /different version of the questions/i);
});

test('a permission whose SHAPE is wrong is refused, and so is an empty or damaged one', () => {
  const cases = [
    { what: 'a different schema', body: () => ({ schema: 99, checks: [] }) },
    { what: 'no list of checks', body: () => ({ schema: 1 }) },
    { what: 'an empty list of checks', body: () => ({ schema: 1, checks: [] }) },
    { what: 'not a record at all', body: () => ['nothing', 'useful'] },
  ];
  for (const one of cases) {
    clearPermission();
    permitted(PIPE, 'freeze'); // so the folder and the directory are real
    writePermission(one.body());
    const refused = gate([
      'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    ]);
    assert.notEqual(refused.status, 0, `${one.what} was accepted:\n${refused.stdout}`);
  }

  // …and the two shapes that are not JSON at all.
  for (const [what, text] of [['empty', ''], ['damaged', '{"schema": 1, "checks": [ ']]) {
    clearPermission();
    permitted(PIPE, 'freeze');
    writeFileSync(permissionFile(), text);
    const refused = gate([
      'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    ]);
    assert.notEqual(refused.status, 0, `an ${what} permission file was accepted`);
  }
});

test('a permission stamped LATER THAN NOW is refused rather than rounded down', () => {
  clearPermission();
  permitted(PIPE, 'freeze');
  const document = readPermission();
  document.checks[0].made_at += 60 * 60 * 24;
  writePermission(document);
  const refused = gate([
    'check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
  ]);
  assert.notEqual(refused.status, 0, `a permission from the future was accepted:\n${refused.stdout}`);
  assert.match(refused.stdout, /clock has moved|later than now/i);
});

test('a folder that is not one of ours is refused, however good the permission looks', () => {
  const bare = scratch('not-a-workspace');
  mkdirSync(join(bare, KEPT_IN), { recursive: true });
  clearPermission();
  permitted(PIPE, 'freeze');
  copyFileSync(permissionFile(), join(bare, KEPT_IN, KEPT_AS));
  const refused = gate(
    ['check', '--workspace', bare, '--source', PIPE, '--operation', 'freeze'],
    { cwd: bare },
  );
  assert.notEqual(refused.status, 0, `a folder with no working note was accepted:\n${refused.stdout}`);
  assert.match(refused.stdout, /not one of mine/i);
});

/* ══════════════════════════════════════════════════════════════════════════════
   🔴 A REFUSAL THAT SAYS "RUN THE CHECK" HAS TO SAY WHICH CHECK.

   The whole reason this exists: a person who followed the tool's own closing
   instruction ran the copy command, was told a check had to happen first, and was
   told nothing whatsoever about how to run one. Every refusal in the go-ahead had
   that shape. A stop with no route out of it is where somebody either gives up or
   starts working around the gate by hand, and the second one is worse.
   ══════════════════════════════════════════════════════════════════════════════ */

test('the refusal for a missing permission carries the command that makes one', () => {
  clearPermission();
  const refused = gate(['check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze']);
  assert.notEqual(refused.status, 0, 'the preflight passed with no permission on disk');
  const text = proven('the refusal', refused.stdout, { floor: 200 });

  // The command, with everything it can already answer already filled in. A route
  // the person has to reconstruct is not a route.
  assert.match(text, /capture_audit\.py audit\b/, `no audit command in the refusal:\n${text}`);
  for (const filled of ['--workspace', '--source', '--operation freeze', '--arrived-as']) {
    assert.ok(text.includes(filled), `the command omits ${filled}:\n${text}`);
  }
  assert.ok(text.includes(WORKSPACE), `the command does not carry their own folder:\n${text}`);
  assert.ok(text.includes(PIPE), `the command does not carry the source it refused:\n${text}`);

  // ⛔ And the arrival values are listed, because `--arrived-as` is the one thing
  // left blank and argparse's own answer to a bad value is a usage block — which
  // this repository already records as a refusal nobody can act on.
  for (const arrival of ['already-on-your-device', 'a-link-that-was-sent-to-you']) {
    assert.ok(text.includes(arrival), `the refusal does not list ${arrival}:\n${text}`);
  }

  // ⛔ THE TWO ABSOLUTE QUESTIONS ARE NOT PRE-FILLED, and this is the assertion
  // that keeps it that way. Whether a flag naming the excluded class should ever be
  // pasted into a shell history is OPEN WITH THE OWNER, and handing somebody a
  // ready-made answer to the most absolute question in the tool would close it by
  // shipping. The audit's own refusal names them; a copy-pasteable line must not.
  assert.ok(
    !/--might-hold-intimate-media\s+(yes|no|unsure)/.test(text),
    `the refusal pre-answers the excluded-class question:\n${text}`,
  );
  assert.ok(
    !/--closed-by-your-conditions\s+(yes|no|unsure)/.test(text),
    `the refusal pre-answers the closed-path question:\n${text}`,
  );
});

test('the whole chain walks: refusal names the check, check names what it still needs, then the copy runs', () => {
  // 🔴 END TO END, because each link was verified alone and the chain was still
  // broken. This is the sequence a person actually performs, in order, with nothing
  // supplied that a refusal did not tell them to supply.
  clearPermission();

  // 1. The copy command refuses and hands over the audit line.
  const first = gate(['check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze']);
  assert.notEqual(first.status, 0, 'step 1 did not refuse');

  // 2. The audit line, exactly as printed: no veto flags, because it did not give
  //    any. It must refuse, and must name both of the answers it is short of.
  const second = gate([
    'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    '--arrived-as', 'already-on-your-device',
  ]);
  assert.notEqual(second.status, 0, 'step 2 issued a permission with two questions unanswered');
  assert.match(second.stdout, /--might-hold-intimate-media/, 'step 2 does not name the first missing answer');
  assert.match(second.stdout, /--closed-by-your-conditions/, 'step 2 does not name the second missing answer');

  // 3. With both answered, it issues.
  const third = gate([
    'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    '--arrived-as', 'already-on-your-device',
    '--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'no',
  ]);
  assert.equal(third.status, 0, `step 3 refused a fully answered check:\n${third.stdout}`);

  // 4. And only now does the preflight pass.
  const fourth = gate(['check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze']);
  assert.equal(fourth.status, 0, `step 4 still refuses after a good permission:\n${fourth.stdout}`);
});

/* ══════════════════════════════════════════════════════════════════════════════
   The audit itself: the verdict a hazardous arrival gets, and the two absolute
   stops. Nothing is written down as allowed, and nothing is opened.
   ══════════════════════════════════════════════════════════════════════════════ */

test('a link that was sent to them returns do-not-touch, and no permission is written', () => {
  clearPermission();
  const refused = gate([
    'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    '--arrived-as', 'a-link-that-was-sent-to-you',
    '--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'no',
  ]);
  assert.notEqual(refused.status, 0, `a link addressed to one recipient was waved through:\n${refused.stdout}`);
  assert.match(
    refused.stdout,
    /present-day entry/i,
    `the answer does not say what following it writes:\n${refused.stdout}`,
  );
  assert.match(refused.stdout, /do not touch this/i, 'the answer is not stated in plain words');
  assert.ok(
    !existsSync(permissionFile()),
    'a do-not-touch answer wrote a permission anyway, which is the whole failure',
  );
  // And the preflight then refuses, because there is nothing to find.
  const blocked = gate(['check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze']);
  assert.notEqual(blocked.status, 0, 'the preflight passed after a do-not-touch answer');
});

test('every hazardous arrival returns do-not-touch, and every safe one is named', (t) => {
  // Enumerated rather than sampled: the table is read out of the gate's own source,
  // so a value added later is covered without anybody editing a list here.
  const source = readRepo(GATE_REL);
  const block = source.slice(source.indexOf('ARRIVALS = {'), source.indexOf('\n# The two questions'));
  proven('the arrivals table in the gate', block, { floor: 500 });
  const values = [...block.matchAll(/^    "([a-z][a-z0-9-]*)": \{$/gm)].map((m) => m[1]);
  proven('the arrival values', values, { floor: 5 });

  const answers = new Map();
  for (const value of values) {
    clearPermission();
    const result = gate([
      'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
      '--arrived-as', value,
      '--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'no',
    ]);
    const refusedIt = result.status !== 0;
    answers.set(value, refusedIt ? 'do-not-touch' : 'permitted');
    assert.equal(
      existsSync(permissionFile()),
      !refusedIt,
      `${value}: a permission was written for a refusal, or withheld from a pass`,
    );
  }

  const refusedValues = [...answers].filter(([, a]) => a === 'do-not-touch').map(([v]) => v);
  const permittedValues = [...answers].filter(([, a]) => a === 'permitted').map(([v]) => v);
  // Both sides must be non-empty. A table that refuses everything is an outage, and
  // one that permits everything is not a table.
  proven('the arrivals that are refused', refusedValues, { floor: 3 });
  proven('the arrivals that are permitted', permittedValues, { floor: 3 });
  for (const mustRefuse of [
    'a-link-that-was-sent-to-you',
    'opening-a-conversation-or-thread',
    'somebody-elses-device-or-account',
  ]) {
    assert.equal(answers.get(mustRefuse), 'do-not-touch', `${mustRefuse} was permitted`);
  }
  t.diagnostic(`arrivals refused: ${refusedValues.join(', ')}`);
  t.diagnostic(`arrivals permitted: ${permittedValues.join(', ')}`);
});

test('an unrecognised arrival is refused rather than guessed at', () => {
  clearPermission();
  const rejected = gate([
    'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    '--arrived-as', 'something-nobody-has-thought-about',
    '--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'no',
  ]);
  assert.notEqual(rejected.status, 0, 'an arrival the table does not know was accepted');
  assert.ok(!existsSync(permissionFile()), 'a permission was written for an unknown arrival');
});

/* 🔴 THIS TEST USED TO ASSERT THE DEFECT, and that is worth saying plainly rather
   than quietly editing out. Its last case sent NO answer to either absolute
   question and required the reply to be `/do not handle intimate or sexual/` — so
   the suite was pinning the behaviour where somebody who left a flag off, because
   nothing had ever told them it existed, was answered with the most absolute
   sentence in the program about a file it had never looked at.

   Absence still refuses. ⛔ THE DIRECTION HAS NOT CHANGED and the two answered
   forms below still produce the fence, including `unsure`. What changed is that a
   missing answer is now its own outcome, and this asserts BOTH halves of it: that
   it stops, and that it does not describe the person's file while stopping. */
test('the two absolute stops fire, and a missing answer stops without judging the file', (t) => {
  const cases = [
    { what: 'it might hold that class of material', args: ['--might-hold-intimate-media', 'yes', '--closed-by-your-conditions', 'no'], says: /do not handle intimate or sexual/i },
    { what: 'unsure about that class', args: ['--might-hold-intimate-media', 'unsure', '--closed-by-your-conditions', 'no'], says: /do not handle intimate or sexual/i },
    { what: 'their own answers closed this path', args: ['--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'yes'], says: /closed this path/i },
    { what: 'unsure whether the path is closed', args: ['--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'unsure'], says: /closed this path/i },
    { what: 'neither question answered at all', args: [], says: /not been given an answer to/i },
    { what: 'only the media question answered', args: ['--might-hold-intimate-media', 'no'], says: /not answered {2}--closed-by-your-conditions/ },
    { what: 'only the closed question answered', args: ['--closed-by-your-conditions', 'no'], says: /not answered {2}--might-hold-intimate-media/ },
  ];
  for (const one of cases) {
    clearPermission();
    const refused = gate([
      'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
      '--arrived-as', 'already-on-your-device',
      ...one.args,
    ]);
    assert.notEqual(refused.status, 0, `${one.what}: it went ahead anyway:\n${refused.stdout}`);
    assert.match(refused.stdout, one.says, `${one.what}: the refusal names the wrong reason:\n${refused.stdout}`);
    assert.ok(!existsSync(permissionFile()), `${one.what}: a permission was written anyway`);
  }

  // ⛔ The half that the old assertion made impossible: a person who answered
  // nothing must not be told anything about what they are holding. Both sentences
  // are checked, because the verdict line and the reason line are written in
  // different places and only one of them was ever the visible problem.
  clearPermission();
  const blank = gate([
    'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    '--arrived-as', 'already-on-your-device',
  ]);
  assert.ok(
    !/do not handle intimate or sexual/i.test(blank.stdout),
    `an unanswered question was answered with the excluded-class refusal:\n${blank.stdout}`,
  );
  assert.ok(
    !/do not touch this/i.test(blank.stdout),
    `an unanswered question was answered with a verdict on the file:\n${blank.stdout}`,
  );
  assert.match(
    blank.stdout,
    /not a statement about what you have/i,
    `the refusal does not say it is about the missing answer:\n${blank.stdout}`,
  );
  t.diagnostic(`absolute stops asserted: ${cases.length}, and a missing answer judges nothing`);
});

test('the refusal for that class of material says it applies to everybody, before it refuses', () => {
  // 🔴 The framing is load-bearing. A reader met this unprompted, having volunteered
  // nothing of the kind, and read it as the tool telling them what it thought they
  // had done. So the disclaimer has to come BEFORE the refusal, not after it.
  clearPermission();
  const refused = gate([
    'audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
    '--arrived-as', 'already-on-your-device',
    '--might-hold-intimate-media', 'yes', '--closed-by-your-conditions', 'no',
  ]);
  const text = refused.stdout;
  const framing = text.search(/not a guess about you/i);
  const refusal = text.search(/I do not handle intimate or sexual/i);
  assert.ok(framing >= 0, `the refusal carries no every-person framing:\n${text}`);
  assert.ok(refusal >= 0, 'the refusal does not state the rule');
  assert.ok(framing < refusal, 'the framing comes after the refusal, which is the wrong order');
  for (const total of [/no copy/i, /no preview/i, /counsel|lawyer/i]) {
    assert.match(text, total, `the refusal does not state ${total}`);
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   Nothing reads a source it has no permission for, including the gate itself.
   ══════════════════════════════════════════════════════════════════════════════ */

test('the gate never opens the thing it is asked about, on either subcommand', (t) => {
  // Both subcommands, over a named pipe, in both outcomes. Every one of these
  // finished, and `run` fails on a process that does not, so this is an
  // observation rather than a reading of the code.
  clearPermission();
  const calls = [
    ['audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze',
      '--arrived-as', 'already-on-your-device',
      '--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'no'],
    ['check', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'freeze'],
    ['check', '--workspace', WORKSPACE, '--source', OTHER_PIPE, '--operation', 'freeze'],
    ['audit', '--workspace', WORKSPACE, '--source', PIPE, '--operation', 'verify',
      '--arrived-as', 'a-link-that-was-sent-to-you',
      '--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'no'],
  ];
  for (const args of calls) gate(args);
  t.diagnostic(`calls over a named pipe that all finished: ${calls.length}`);

  // …and the source never appears in anything the gate wrote, other than as a name.
  const written = readFileSync(permissionFile(), 'utf8');
  assert.ok(written.includes(PIPE), 'the permission does not name what it is for');
  assert.ok(
    !written.includes('"content"') && !written.includes('"bytes"') && !written.includes('"digest"'),
    'the permission carries something derived from the contents of the source, which ' +
      'would mean it was opened in order to be identified',
  );
});

test('every file the engine opens is one of the declared sources, and none is anybody else’s', (t) => {
  const engineSource = proven('the engine source', readRepo('skill/scripts/triage.py'), {
    floor: 10000,
  });

  // Read sites, extracted rather than assumed: every path-reading call in the engine.
  const readSites = [];
  const lines = engineSource.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    if (/\.read_text\s*\(|\.read_bytes\s*\(|\bopen\s*\([^)]*["'][rb]+["']|json\.loads?\s*\(/.test(lines[i])) {
      readSites.push(`${i + 1}: ${lines[i].trim().slice(0, 100)}`);
    }
  }
  proven('the read sites in the engine', readSites, { floor: 5 });

  const declared = proven('the declared data sources', allowlist().data_sources ?? [], { floor: 5 });
  const thirdParty = declared.filter((s) => s.third_party !== false);
  assert.deepEqual(
    thirdParty.map((s) => s.id),
    [],
    'a declared source belongs to a third party, so a read of it could notify somebody, ' +
      'and this rail stops being merely unbuilt and becomes unenforced',
  );
  t.diagnostic(
    `read sites in the engine: ${readSites.length} · declared sources: ${declared.length} · ` +
      'none belongs to a third party',
  );
});

test('the engine takes no parameter naming a source to read', () => {
  // Executed: the argument parser is the thing that would have to accept one.
  const help = spawnSync('python3', [ENGINE, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, `the engine has no usable help:\n${help.stderr}`);
  proven('the engine help', help.stdout, { floor: 200 });
  for (const forbidden of ['--source', '--capture', '--freeze', '--read', '--file', '--path']) {
    assert.ok(
      !help.stdout.includes(forbidden),
      `the engine accepts ${forbidden}, which would be a read of something the person ` +
        'named, and there is no permission gate to put in front of it',
    );
  }
});

/* ══════════════════════════════════════════════════════════════════════════════
   🔴 THE TRIP-WIRE. Every other user-path script routes through the preflight.
   Nothing is pinned any more, and the pin is not to be reintroduced: it existed
   because the two callers were another wave's to write, and they now call it.
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * 🔴 THE ONE NARROWING, AND IT IS BY CAPABILITY RATHER THAN BY NAME.
 *
 * A script that cannot read anything cannot read what a person names, so a read
 * permission in front of it would guard nothing. This is not an exemption list and
 * must never become one: to fall out of scope, a file has to contain no way to
 * touch a file, a process, or a socket AT ALL — proved by reading its source here,
 * not by anything it declares about itself. Add one `open(` and it is back in scope
 * on the next run.
 *
 * ⚠️ The distinction being preserved is the trip-wire's own stated one: it exists so
 * that a script which "reads what the person names" cannot ship without a
 * permission. A pure text-to-bytes function is outside that sentence, and pretending
 * otherwise would mean writing a permission call that has no source to name — which
 * is how a gate turns into a phrase.
 */
const READS_SOMETHING =
  /\bopen\s*\(|\bPath\b|\bos\.[a-z]|\.read_text\b|\.read_bytes\b|\breadlines?\b|\bsubprocess\b|\bsocket\b|\bshutil\b|\bglob\b|\bscandir\b|\blistdir\b|\bsys\.stdin\b/;

test('every other user-path script routes through the preflight. Nothing is exempt', (t) => {
  const all = listUnder('skill/scripts', ['.py']).filter(
    (rel) => rel !== 'skill/scripts/triage.py' && rel !== GATE_REL,
  );
  const inert = all.filter((rel) => !READS_SOMETHING.test(readRepo(rel)));
  const candidates = all.filter((rel) => READS_SOMETHING.test(readRepo(rel)));
  // ⛔ The narrowing is REPORTED, every run. A file dropping out of this test
  // silently is the failure mode; a diagnostic naming it is not.
  if (inert.length > 0) {
    t.diagnostic(
      `no read capability at all, so no read to permit: ${inert.join(', ')}`,
    );
  }
  // ⛔ Non-empty first. With no candidates this test would pass having judged
  // nothing, which reads exactly like a tree where every caller is gated.
  proven('the user-path scripts other than the engine and the gate', candidates, { floor: 2 });

  const routed = [];
  const unbound = [];
  for (const rel of candidates) {
    const text = proven(rel, readRepo(rel), { floor: 100 });
    // Both halves: the module, and the one entry point it exposes. Naming the file
    // without calling the preflight is a citation, not a gate.
    if (text.includes('capture_audit') && text.includes('permission_or_refuse')) routed.push(rel);
    else unbound.push(rel);
  }

  // (a) EVERY candidate must be routed. A new script that reads what a person names,
  //     with no permission in front of it, fails here immediately.
  assert.deepEqual(
    unbound,
    [],
    `a user-path script reads what the person names with no permission in front of it: ` +
      `${unbound.join(', ')}.\n⛔ Call permission_or_refuse(workspace, source, operation) ` +
      'before the first read, imported, not shelled out to. Do not delete this ' +
      'trip-wire to get a green, and do not reintroduce a pinned-pending list: the ' +
      'callers exist now, so a pin would be a gap rather than a schedule.',
  );

  // (b) Every routed script has an invocation recorded here, so the refusal below is
  //     the gate firing on a real call rather than argparse rejecting a shape nobody
  //     meant. Fails closed on a script nobody wrote an invocation for.
  const unmapped = routed.filter((rel) => !NO_PERMISSION_RUN[rel]);
  assert.deepEqual(
    unmapped,
    [],
    `no no-permission invocation is recorded for: ${unmapped.join(', ')}. Add one, or ` +
      'the assertion below would silently stop covering it.',
  );

  // (c) And each one really refuses, with the GATE'S OWN WORDING. ⚠️ The earlier
  //     version of this asserted only a non-zero exit and said so: a usage error and
  //     a refusal are the same number. Matching the gate's own sentence is what
  //     separates them, and it is why the map above exists.
  clearPermission();
  for (const rel of routed) {
    const attempt = run(join(REPO, rel), NO_PERMISSION_RUN[rel](PIPE, WORKSPACE), {
      timeout: 30000,
    });
    assert.notEqual(
      attempt.status,
      0,
      `${rel} read something with no permission in front of it:\n${attempt.stdout}\n${attempt.stderr}`,
    );
    assert.match(
      attempt.stdout,
      /Nothing has been checked/i,
      `${rel} exited non-zero without the go-ahead check's own refusal in it, so this ` +
        `may be an argument error rather than the gate firing:\n${attempt.stdout}\n${attempt.stderr}`,
    );
  }

  t.diagnostic(
    `user-path scripts other than the engine and the gate: ${candidates.length} · ` +
      `routed through the preflight: ${routed.length} (${routed.join(', ')}) · ` +
      `not routed: ${unbound.length}`,
  );
  t.diagnostic(
    'green here means those counts, and that each of those scripts refused in the ' +
      'gate’s own words with no permission in hand.',
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   🔴 THE SAME THREE REFUSALS, THROUGH THE TWO COMMANDS THAT ACTUALLY READ.
   The gate refusing is one fact; the dispatcher refusing is the fact the rail is
   about. A control comes first in each, and the ONLY difference between a control
   and a refusal below is the go-ahead.
   ══════════════════════════════════════════════════════════════════════════════ */

/** A small readable source of the person's own, so a control can do real work. */
function ownFiles(label) {
  const dir = scratch(`own-files-${label}`);
  writeFileSync(join(dir, 'one.txt'), 'anything\n');
  writeFileSync(join(dir, 'two.txt'), 'anything else\n');
  return dir;
}

/** Move the go-ahead's own timestamp back past its deadline. Never the clock. */
function ageTheGoAhead() {
  const document = readPermission();
  const goodFor = document.checks[0].good_for_seconds;
  assert.ok(goodFor > 0, 'the go-ahead records no deadline at all, so it cannot go stale');
  document.checks[0].made_at -= goodFor * 4;
  writePermission(document);
}

const setName = (what) => `through-${what}`;

test('THE CONTROL, both commands ACCEPT a valid go-ahead, and both do their real work', (t) => {
  const source = ownFiles('control');
  const name = setName('control');

  clearPermission();
  permitted(source, 'freeze');
  const froze = run(COPY, [source, '--into', WORKSPACE, '--name', name]);
  assert.equal(froze.status, 0, `the copy command refused a valid go-ahead:\n${froze.stdout}\n${froze.stderr}`);
  assert.match(froze.stdout, /files copied and checked\s+2/, `it copied nothing:\n${froze.stdout}`);
  assert.ok(
    existsSync(join(WORKSPACE, COPIES_IN, name, 'one.txt')),
    'the copy command reported a set it did not write',
  );

  permitted(WORKSPACE, 'verify');
  const checked = run(CHECK, ['--into', WORKSPACE, '--name', name]);
  assert.equal(checked.status, 0, `the check command refused a valid go-ahead:\n${checked.stdout}\n${checked.stderr}`);
  assert.match(
    checked.stdout,
    /files opened and digested\s+2/,
    `it opened nothing, so a green here would be the vacuous kind:\n${checked.stdout}`,
  );
  t.diagnostic(
    'the control passes through both commands, so every refusal below is a refusal ' +
      'of something specific rather than a command that cannot run at all',
  );
});

test('the COPY command refuses all three: none, one for another source, and a stale one', (t) => {
  const source = ownFiles('copy-refusals');
  const elsewhere = ownFiles('copy-somewhere-else');
  const outcomes = [];

  const attempt = (what) => {
    const name = setName(`copy-${what}`);
    const result = run(COPY, [source, '--into', WORKSPACE, '--name', name]);
    assert.notEqual(
      result.status,
      0,
      `THE COPY COMMAND READ A SOURCE WITH ${what}:\n${result.stdout}\n${result.stderr}`,
    );
    // 🔴 AND IT LEFT THE PERSON'S FOLDER AS IT FOUND IT. A refusal that had already
    // created the set's folder would have acted on the source before it stopped.
    assert.equal(
      existsSync(join(WORKSPACE, COPIES_IN, name)),
      false,
      `${what}: it created the set's folder before refusing`,
    );
    outcomes.push(what);
    return result;
  };

  clearPermission();
  const none = attempt('no go-ahead at all');
  assert.match(none.stdout, /Nothing has been checked/i, `the refusal does not say what is missing:\n${none.stdout}`);

  clearPermission();
  permitted(elsewhere, 'freeze');
  const wrong = attempt('a go-ahead for a different source');
  assert.ok(
    wrong.stdout.includes(source),
    `the refusal does not name the source it was asked about:\n${wrong.stdout}`,
  );
  assert.ok(
    !wrong.stdout.includes(elsewhere),
    'the refusal names the source the go-ahead was for instead of the one asked about, ' +
      'which sends the person to look at the wrong thing',
  );

  clearPermission();
  permitted(source, 'freeze');
  ageTheGoAhead();
  const stale = attempt('a stale go-ahead');
  assert.match(stale.stdout, /too old/i, `the refusal does not say it is out of date:\n${stale.stdout}`);

  assert.equal(outcomes.length, 3, 'not all three refusals were exercised');
  t.diagnostic(`refusals proven through the copy command: ${outcomes.join(' · ')}`);
});

test('the CHECK command refuses all three, over a set that would otherwise verify', (t) => {
  // 🔴 A REAL SET FIRST, so the only thing standing between each run below and a
  // green is the go-ahead. Without it a refusal could be "there is nothing here".
  const source = ownFiles('check-refusals');
  const name = setName('check');
  clearPermission();
  permitted(source, 'freeze');
  const froze = run(COPY, [source, '--into', WORKSPACE, '--name', name]);
  assert.equal(froze.status, 0, `the fixture set could not be built:\n${froze.stdout}\n${froze.stderr}`);

  const outcomes = [];
  const attempt = (what) => {
    const result = run(CHECK, ['--into', WORKSPACE, '--name', name]);
    assert.notEqual(
      result.status,
      0,
      `THE CHECK COMMAND READ A SET WITH ${what}:\n${result.stdout}\n${result.stderr}`,
    );
    assert.doesNotMatch(result.stdout, /✅/, `${what}: a refusal carried a success marker`);
    outcomes.push(what);
    return result;
  };

  clearPermission();
  const none = attempt('no go-ahead at all');
  assert.match(none.stdout, /Nothing has been checked/i, `the refusal does not say what is missing:\n${none.stdout}`);

  clearPermission();
  permitted(scratch('another-folder-entirely'), 'verify');
  const wrong = attempt('a go-ahead for a different source');
  assert.ok(
    wrong.stdout.includes(WORKSPACE),
    `the refusal does not name what it was asked about:\n${wrong.stdout}`,
  );

  clearPermission();
  permitted(WORKSPACE, 'verify');
  ageTheGoAhead();
  const stale = attempt('a stale go-ahead');
  assert.match(stale.stdout, /too old/i, `the refusal does not say it is out of date:\n${stale.stdout}`);

  // …and the same set verifies the moment a good go-ahead is in hand, which is what
  // makes the three refusals above facts about the go-ahead and nothing else.
  clearPermission();
  permitted(WORKSPACE, 'verify');
  const allowed = run(CHECK, ['--into', WORKSPACE, '--name', name]);
  assert.equal(allowed.status, 0, `the set does not verify even with a go-ahead:\n${allowed.stdout}`);
  assert.match(allowed.stdout, /files opened and digested\s+2/, `it opened nothing:\n${allowed.stdout}`);

  assert.equal(outcomes.length, 3, 'not all three refusals were exercised');
  t.diagnostic(
    `refusals proven through the check command: ${outcomes.join(' · ')}, and the same ` +
      'set verifies with a good one, so each refusal is the go-ahead doing the work',
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   The plants are reverted, and the doctrine is written as a gate.
   ══════════════════════════════════════════════════════════════════════════════ */

test('the shipped gate is unmutated. Every guard the plants removed is still in it', () => {
  // ⛔ The mutants are built in throwaway trees and the real file is never written
  // to. This asserts that, by re-reading it after every plant above has run.
  const source = proven(GATE_REL, readRepo(GATE_REL), { floor: 2000 });
  for (const guard of [
    '    document = read_permission_file(workspace, source, operation)\n',
    '        if Path(named).expanduser().resolve() != source:\n            continue\n',
    '    if age > good_for:\n',
    'if not path.is_file():',
    'if age < -CLOCK_SLACK_SECONDS:',
  ]) {
    assert.ok(
      source.includes(guard),
      `a guard is missing from the shipped gate:\n${guard}\n⛔ Either a plant leaked ` +
        'into the working tree, or a check was removed. Neither is acceptable.',
    );
  }
  assert.ok(!source.includes('if False:'), 'a planted mutation leaked into the shipped gate');
});

test('the permission command describes a gate, not a declaration', () => {
  const body = proven('skill/reference/capture-audit.md', readRepo('skill/reference/capture-audit.md'), {
    floor: 500,
  });
  assert.ok(
    /precondition, not advice/i.test(body),
    'the reference no longer says this is a precondition rather than advice',
  );
  assert.ok(
    /phrase, not a gate/i.test(body),
    'the reference no longer records WHY it exists: a document that declares a ' +
      'precondition is a phrase, and that was the defect. Losing the reason is how ' +
      'the defect comes back.',
  );
  for (const needed of [/exact source/i, /exact operation/i, /stale/i]) {
    assert.ok(needed.test(body), `the reference does not name the binding condition ${needed}`);
  }
  // …and it states what the binding cannot establish, rather than implying a
  // strength it does not have.
  assert.ok(
    /does not establish anything against somebody who sets out to defeat it/i.test(body),
    'the reference no longer says what the binding cannot establish. A permission in ' +
      "the person's own folder is not proof against the person, and claiming otherwise " +
      'is the over-claim this project keeps rediscovering.',
  );
});

test('the doctrine is in the skill definition too, where a reader starts', () => {
  const skill = proven('skill/SKILL.src.md', readRepo('skill/SKILL.src.md'), { floor: 2000 });
  assert.ok(
    /act of reading|reading can create/i.test(skill),
    'the skill definition no longer says that reading can create evidence against the person',
  );
  assert.ok(
    /audit/i.test(skill),
    'the skill definition no longer names the precondition before a first read',
  );
});
