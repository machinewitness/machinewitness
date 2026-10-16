/**
 * tests/rails/no-intimate-media.test.mjs. Zero reads against an excluded source.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🟢 THE RAIL TEST IS NOW GREEN. The command it governs exists, and the refusal is
 * asserted against what the process DID rather than against what its source says.
 *
 * 🟡 AND THE RAIL STILL CONTRADICTS PHYSICS, WHICH IS A DOCTRINE QUESTION RATHER
 * THAN A BUG, AND IS STILL OPEN. The rail says *freeze the container unopened*.
 * Copying a container reads its bytes; sealing it reads them again; and the content
 * class cannot be established without inspecting content or trusting a frightened
 * person's classification of it. So the default is TOTAL REFUSAL, no copy, no
 * listing, no seal, and not even the existence test the rail's own wording would
 * allow, which is stricter than the rail asks for, and is a default rather than a
 * resolution. It is recorded as an owner question, with counsel, and the tests at
 * the foot of this file assert the record still exists so it cannot be closed by
 * drift.
 *
 * 🔴 TWO INSTRUMENTS, BOTH PROVEN IN BOTH DIRECTIONS, BECAUSE READING THE CODE IS
 * WORTHLESS. The question is what the process did, not what it says.
 *
 *   1. A TARGET WHERE A READ IS OBSERVABLE. A named pipe with no writer: opening it
 *      for reading BLOCKS, so a read shows up as a process that never finishes, on
 *      any POSIX platform, with no privileges and no tracing tool. Proven against a
 *      stand-in that deliberately reads, and proven quiet against one that only
 *      checks the path exists.
 *
 *   2. A LEDGER OF EVERY FILESYSTEM CALL THE PROCESS ATTEMPTED, naming the target.
 *      The interpreter's own audit hook records `open`, `os.stat`, `os.listdir`,
 *      `os.scandir` and the rest AT THE POINT OF THE CALL, so a call that FAILS is
 *      recorded too, which the blocking pipe cannot see. Proven three ways: it
 *      catches a listing, it catches a bare existence test, and it stays empty for a
 *      process that touches nothing.
 *
 * ⚠️ Instrument 2 is what makes the strict reading checkable. "No stat beyond
 * existence" and "not even an existence test" are different claims, and only a
 * ledger of attempts can tell them apart.
 *
 * 🔴 AND THE SILENCE IS PROVEN NON-VACUOUS. The same command, on the same target,
 * WITHOUT the flag does make filesystem calls and they are recorded. So zero events
 * with the flag is a fact about the refusal rather than about the harness being
 * blind or the target being unreachable.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  REPO,
  contract,
  documentOrder,
  goAhead,
  nodesById,
  proven,
  readRepo,
  scratch,
} from './_rails.mjs';

const SEAL_CANDIDATES = ['skill/scripts/freeze.py', 'skill/scripts/verify.py'];

/* ── THE INSTRUMENT: a target where any read is observable ────────────────── */

/**
 * A directory holding one named pipe with no writer, dressed as a media file.
 * Reading it blocks for ever; checking that it exists does not.
 */
function unreadableTarget(name) {
  const dir = scratch(name);
  const target = join(dir, 'excluded-class');
  const made = spawnSync(
    'python3',
    ['-c', 'import os,sys; os.makedirs(sys.argv[1], exist_ok=True); os.mkfifo(os.path.join(sys.argv[1], sys.argv[2]))', target, 'IMG_0001.MOV'],
    { encoding: 'utf8' },
  );
  assert.equal(
    made.status,
    0,
    `could not build the read-detecting target:\n${made.stdout}\n${made.stderr}\n` +
      'This test cannot run without it, and skipping is not available, a skipped ' +
      'rail test reads exactly like a passing one.',
  );
  const entries = readdirSync(target);
  proven('the target contents', entries, { floor: 1 });
  return { dir, target, file: join(target, entries[0]) };
}

/** Run something against the target with a hard timeout. `true` = it blocked. */
function blockedOn(command, args) {
  const run = spawnSync(command, args, { encoding: 'utf8', timeout: 4000 });
  return { blocked: run.signal !== null || run.error?.code === 'ETIMEDOUT', run };
}

/* ── INSTRUMENT 2: a ledger of every filesystem call the process ATTEMPTED ──── */

/**
 * A wrapper that records every filesystem call naming the target, then runs a script
 * in its place. Two mechanisms, because neither alone is complete:
 *
 *   · THE INTERPRETER'S OWN AUDIT HOOK, which fires at the call site for `open`,
 *     `os.listdir`, `os.scandir` and the rest, so a call that FAILS is recorded too,
 *     which the blocking pipe cannot see.
 *   · INTERPOSITION ON THE STAT FAMILY. 🔴 MEASURED, NOT ASSUMED: on this
 *     interpreter `os.stat` and `os.lstat` raise NO audit event at all, so the hook
 *     alone is blind to exactly the call the rail's own wording would permit. Found
 *     by the probe below refusing to fire, which is what proving an instrument is
 *     for. The names are therefore wrapped as well, and every call through them is
 *     recorded before it is passed on.
 *
 * 🔴 WHY THIS AND NOT THE BLOCKING PIPE ALONE. The pipe sees a read that gets as far
 * as `open`. It cannot see a stat, a listing that is refused, or a call on an
 * unreachable path, and it cannot tell "stat but do not open" from "touch nothing at
 * all". Only a ledger of attempts can.
 *
 * ⚠️ WHAT THIS CANNOT ESTABLISH, stated rather than implied. It records calls made
 * through the interpreter and its standard library. A call from a compiled extension
 * that bypasses both would not appear, and this is not a kernel tracer. Nothing on a
 * user path here is anything but pure standard-library Python, and the blocking pipe
 * covers the `open` case by an independent mechanism, so the two together are
 * stronger than either, but neither is a substitute for a kernel trace, and saying
 * so is part of the result.
 */
const CALL_LEDGER = [
  'import builtins, json, os, os.path, runpy, sys',
  '',
  'needle = sys.argv[1]',
  'script = sys.argv[2]',
  'sys.argv = [script] + sys.argv[3:]',
  '',
  'touched = []',
  '',
  'def flat(value):',
  '    out = []',
  '    stack = [value]',
  '    while stack:',
  '        item = stack.pop()',
  '        if isinstance(item, str):',
  '            out.append(item)',
  '        elif isinstance(item, bytes):',
  '            out.append(item.decode("utf-8", "replace"))',
  '        elif isinstance(item, (tuple, list)):',
  '            stack.extend(item)',
  '        elif isinstance(item, os.PathLike):',
  '            out.append(str(item))',
  '    return out',
  '',
  'def note(label, args, kwargs):',
  '    for text in flat(list(args)) + flat(list(kwargs.values())):',
  '        if needle in text:',
  '            touched.append(label + "  " + text)',
  '            return',
  '',
  '# The stat family, wrapped: it raises no audit event on this interpreter.',
  'def watch(holder, name):',
  '    original = getattr(holder, name)',
  '',
  '    def wrapper(*args, **kwargs):',
  '        note(name, args, kwargs)',
  '        return original(*args, **kwargs)',
  '',
  '    setattr(holder, name, wrapper)',
  '',
  'for candidate in ("stat", "lstat", "access", "readlink", "listdir", "scandir", "walk"):',
  '    if hasattr(os, candidate):',
  '        watch(os, candidate)',
  'watch(builtins, "open")',
  '',
  'def hook(event, args):',
  '    if event == "sys.addaudithook":',
  '        return',
  '    for text in flat(args):',
  '        if needle in text:',
  '            touched.append(event + "  " + text)',
  '            return',
  '',
  'sys.addaudithook(hook)',
  'code = 0',
  'try:',
  '    runpy.run_path(script, run_name="__main__")',
  'except SystemExit as exc:',
  '    code = exc.code if isinstance(exc.code, int) else 1',
  'finally:',
  '    sys.stderr.write("FILESYSTEM-CALLS-NAMING-THE-TARGET " + json.dumps(touched) + "\\n")',
  'sys.exit(code)',
].join('\n');

let wrapperPath = null;
function auditWrapper() {
  if (wrapperPath) return wrapperPath;
  wrapperPath = join(scratch('call-ledger'), 'ledger.py');
  writeFileSync(wrapperPath, `${CALL_LEDGER}\n`);
  return wrapperPath;
}

/**
 * Run a script under the ledger. Returns `{ touched, run }`.
 * ⛔ Throws if the ledger line is absent. A missing ledger and an empty ledger are
 * the same output to a naive reader, and that confusion is this project's headline
 * failure mode.
 */
function filesystemCallsNaming(needle, scriptPath, args) {
  const run = spawnSync(
    'python3',
    [auditWrapper(), needle, scriptPath, ...args],
    { encoding: 'utf8', timeout: 8000 },
  );
  const marked = /FILESYSTEM-CALLS-NAMING-THE-TARGET (\[.*\])/.exec(run.stderr ?? '');
  assert.ok(
    marked,
    'the call ledger produced no line at all, so nothing below would be measuring ' +
      `anything:\n${run.stdout}\n${run.stderr}`,
  );
  return { touched: JSON.parse(marked[1]), run };
}

/** A throwaway script, so the ledger can be proven in both directions. */
function standIn(name, body) {
  const path = join(scratch(`stand-in-${name}`), `${name}.py`);
  writeFileSync(path, `${body}\n`);
  return path;
}

test('the call ledger records a listing of the target', () => {
  const { target } = unreadableTarget('ledger-listing');
  const script = standIn('lists', 'import os, sys\nos.listdir(sys.argv[1])\n');
  const { touched } = filesystemCallsNaming(target, script, [target]);
  proven('the calls the ledger recorded for a process that listed the target', touched, {
    floor: 1,
  });
});

test('the call ledger records even a bare existence test. The call the rail would allow', () => {
  // 🔴 THIS IS THE ONE THAT MATTERS. The rail's own wording permits establishing
  // that a path exists. The default here is stricter and does not even do that, and
  // only a ledger sensitive enough to SEE an existence test can tell the two apart.
  const { target } = unreadableTarget('ledger-existence');
  const script = standIn(
    'exists',
    'import os, sys\nsys.stdout.write("yes" if os.path.lexists(sys.argv[1]) else "no")\n',
  );
  const { touched, run } = filesystemCallsNaming(target, script, [target]);
  assert.match(run.stdout ?? '', /yes|no/, 'the stand-in did not run at all');
  proven('the calls the ledger recorded for a bare existence test', touched, { floor: 1 });
});

test('the call ledger stays empty for a process that touches nothing', () => {
  const { target } = unreadableTarget('ledger-quiet');
  const script = standIn('quiet', 'import sys\nsys.stdout.write("did nothing")\n');
  const { touched, run } = filesystemCallsNaming(target, script, [target]);
  assert.match(run.stdout ?? '', /did nothing/, 'the stand-in did not run at all');
  assert.deepEqual(
    touched,
    [],
    `the ledger fired on a process that touched nothing. It is too broad: ${touched.join(' | ')}`,
  );
});

test('the read detector fires on a process that reads the target', () => {
  const { file } = unreadableTarget('instrument-reads');
  const { blocked } = blockedOn('python3', [
    '-c',
    'import sys\nopen(sys.argv[1], "rb").read()\n',
    file,
  ]);
  assert.ok(
    blocked,
    'a process that opened the target for reading finished anyway, so the detector ' +
      'cannot see a read. Everything below would pass on nothing.',
  );
});

test('and stays quiet for a process that only establishes the path exists', () => {
  const { file } = unreadableTarget('instrument-stats');
  const { blocked, run } = blockedOn('python3', [
    '-c',
    'import os, sys\nsys.stdout.write("exists\\n" if os.path.lexists(sys.argv[1]) else "no\\n")\n',
    file,
  ]);
  assert.ok(!blocked, 'the detector fired on a process that read nothing. It is too broad');
  assert.match(run.stdout ?? '', /exists/, 'the probe did not run at all');
});

/* ── 🟢 THE RAIL ITSELF. Promoted out of expected-red: the command exists. ───── */

/** The command that copies and seals a source. Named, not guessed. */
function sealingCommand() {
  const found = SEAL_CANDIDATES.filter((rel) => existsSync(join(REPO, rel)));
  assert.ok(
    found.length > 0,
    'THERE IS NO COMMAND THAT COPIES OR SEALS A SOURCE, so zero-reads-on-an-excluded-' +
      'source cannot be asserted against anything. Both instruments above are built ' +
      `and proven, so this becomes one call. Looked for: ${SEAL_CANDIDATES.join(', ')}.`,
  );
  return { rel: found[0], path: join(REPO, found[0]) };
}

test('an excluded source is refused with zero reads and a route to counsel', (t) => {
  const command = sealingCommand();
  const { dir, target } = unreadableTarget('excluded-source');

  // INSTRUMENT 1: the process finished, so it never got as far as opening the pipe.
  const { blocked, run } = blockedOn('python3', [command.path, target, '--excluded-class']);
  assert.ok(
    !blocked,
    `${command.rel} read the excluded source. It must perform no read at all: no ` +
      'copy, no listing, no seal, and not even the existence test the rail\'s own ' +
      'wording would allow.',
  );
  assert.notEqual(run.status, 0, `${command.rel} exited 0 on an excluded source instead of refusing`);
  assert.match(
    `${run.stdout}\n${run.stderr}`,
    /lawyer|counsel|examiner/i,
    `${command.rel} refused without routing anywhere. A refusal with no route leaves ` +
      'the person holding the problem.',
  );

  // Nothing may be left behind either: a refusal that created a folder has already
  // acted on the source.
  const left = readdirSync(dir).filter((name) => name !== 'excluded-class');
  assert.deepEqual(left, [], `${command.rel} left something behind: ${left.join(', ')}`);
  assert.ok(statSync(target).isDirectory(), 'the target itself was altered');

  // INSTRUMENT 2: 🔴 THE LEDGER OF ATTEMPTS. Zero filesystem calls naming the
  // target, which is a statement about what the process DID rather than about what
  // succeeded. This is the assertion the blocking pipe cannot make.
  const refused = filesystemCallsNaming(target, command.path, [target, '--excluded-class']);
  assert.deepEqual(
    refused.touched,
    [],
    `${command.rel} made filesystem call(s) against an excluded source:\n  ` +
      `${refused.touched.join('\n  ')}\n` +
      'The rule is zero: no copy, no listing, no preview, no digest, no measurement, ' +
      'and no existence test. Each line above is a call the process attempted, ' +
      'recorded where it was made rather than after it returned.',
  );
  assert.notEqual(refused.run.status, 0, 'it exited 0 under the ledger');
  assert.match(
    refused.run.stdout ?? '',
    /lawyer|counsel|examiner/i,
    'the refusal under the ledger routed nowhere',
  );

  // 🔴 AND THE SILENCE IS NON-VACUOUS. The same command, the same target, without the
  // flag: it DOES make calls, and they are recorded. So an empty ledger with the flag
  // is a fact about the refusal rather than about the harness being blind, the target
  // being unreachable, or the command failing before it got started.
  //
  // ⚠️ AND THE CONTROL NEEDS A GO-AHEAD, or it measures the wrong refusal. The
  // command now checks a go-ahead before it reads anything, so without one it stops
  // at the gate having listed nothing, and the ledger would read empty for BOTH
  // runs, which would make the zero above meaningless while every assertion stayed
  // green. That is this project's signature failure mode, and it arrived here the
  // moment the gate was wired up.
  assert.equal(
    command.rel,
    'skill/scripts/freeze.py',
    'the sealing command is no longer the one whose argument shape and go-ahead ' +
      'operation are written below. Fix them together rather than guessing.',
  );
  const workspace = scratch('excluded-source-control');
  goAhead(workspace, target, 'freeze', { home: scratch('excluded-source-control-home') });
  const control = filesystemCallsNaming(target, command.path, [
    target,
    '--into',
    workspace,
    '--name',
    'a-set',
  ]);
  proven(
    'the filesystem calls the same command makes on the same target WITHOUT the flag',
    control.touched,
    { floor: 1 },
  );
  assert.ok(
    control.touched.some((line) => /^os\.(?:stat|listdir|scandir)/.test(line)),
    'without the flag the command made no stat, listing or scan of the target either, ' +
      'so the empty ledger above may be measuring a command that does nothing at all ' +
      `rather than one that refuses. Recorded: ${control.touched.join(' | ')}`,
  );

  t.diagnostic(
    `filesystem calls naming the target, with the flag: ${refused.touched.length} · ` +
      `without it (control): ${control.touched.length}`,
  );
  // The control's calls, listed. This is the evidence that the zero above is a
  // measurement rather than a blind spot, and it belongs in the output where a
  // reader can see it rather than in a claim about the output.
  t.diagnostic(
    `the control's calls: ${[...new Set(control.touched.map((line) => line.split('  ')[0]))]
      .sort()
      .join(', ')}`,
  );
});

test('the refusal reads as the same rule for everyone, not a guess about this person', () => {
  // ⛔ THE FRAMING IS PART OF THE RAIL, not presentation. A reader met this rule
  // having volunteered nothing of the kind and read it as the program announcing what
  // it had decided they had done. The framing phrase is read out of the engine's own
  // constant here, so this test cannot drift from the string the engine enforces.
  const command = sealingCommand();
  const { target } = unreadableTarget('excluded-source-wording');
  const { run } = blockedOn('python3', [command.path, target, '--excluded-class']);
  const printed = proven('the refusal', run.stdout ?? '', { floor: 400 });

  const engine = proven('the engine source', readRepo('skill/scripts/triage.py'), { floor: 10000 });
  const declared = /^FENCE_DISCLAIMER\s*=\s*"([^"]+)"/m.exec(engine);
  assert.ok(declared, 'the engine no longer declares the framing phrase as a constant');
  assert.ok(
    printed.includes(declared[1]),
    `the refusal does not carry the engine's own framing phrase: ${JSON.stringify(declared[1])}. ` +
      'Two wordings of the same rule drift, and this is the one that stops a person ' +
      'reading a hard rule as a judgement about them.',
  );
  assert.match(
    printed,
    /every person who uses this/i,
    'the refusal does not say the rule applies to everyone',
  );
  // And it says the honest part: nothing can establish the class without reading, so
  // the stop rests on what the person said.
  assert.match(
    printed,
    /cannot tell what is inside/i,
    'the refusal does not admit that it cannot establish the class itself. A stop that ' +
      'implies the tool knows what is in the file is claiming something impossible',
  );
});

/* ── the doctrine record, which stays open ────────────────────────────────────
 *
 * 🟡 The rail test above is green. The DOCTRINE is not settled, and these assert the
 * record of that still exists so it cannot be closed by somebody quietly writing a
 * copy step. Promoting a test is not resolving a question. */

test('the contract still carries a fence on the record class that can hold this', (t) => {
  const fenced = documentOrder.filter((id) => 'fence' in (nodesById.get(id) ?? {}));
  proven('the fenced record nodes', fenced, { floor: 1 });
  for (const id of fenced) {
    const node = nodesById.get(id);
    assert.ok(node.layer, `${id} carries a fence but is not a record question`);
    assert.ok(
      /preserve|original/i.test(String(node.action ?? '')),
      `${id} is fenced and its action is ${node.action}, which does not read as ` +
        'preserve-without-opening',
    );
  }
  // ⛔ And the flow must never tell anybody to look at it to decide.
  const forbidden = /\b(?:preview|thumbnail|check whether|take a look|open it to see|glance)\b/i;
  const nodeText = fenced
    .map((id) => JSON.stringify(nodesById.get(id)))
    .join('\n');
  assert.ok(
    !forbidden.test(nodeText),
    `a fenced record question invites a look: ${nodeText.slice(0, 200)}`,
  );
  t.diagnostic(`fenced record classes in the contract: ${fenced.join(', ')}`);
});

test('the doctrine question is still recorded as the owner’s, with counsel', () => {
  // ⚠️ The contradiction between the rail's wording and what a computer can do is
  // resolved by a person, not by a wave. This asserts the record still exists, so it
  // cannot be closed by somebody quietly writing a copy step.
  const agents = proven('AGENTS.md', readRepo('AGENTS.md'), { floor: 2000 });
  assert.ok(
    /with counsel/i.test(agents),
    'AGENTS.md no longer records that this is an owner decision taken with counsel',
  );
  assert.ok(
    /total refusal/i.test(agents),
    'AGENTS.md no longer records that the default is total refusal, which is stricter ' +
      'than the rail asks for. If that changed, it changed by decision. Say so.',
  );
});

test('the commands that will own this are described as refusing outright', () => {
  for (const rel of ['skill/reference/freeze.md', 'skill/reference/layers.md']) {
    const body = proven(rel, readRepo(rel), { floor: 500 });
    assert.ok(
      /refus/i.test(body),
      `${rel} does not say the source is refused. A rail with no feature and no ` +
        'written doctrine gets rebuilt wrong.',
    );
    assert.ok(
      /counsel|examiner/i.test(body),
      `${rel} does not route the refusal to counsel or a licensed examiner`,
    );
  }
  assert.ok(contract.never.length > 0, 'the contract holds no prohibitions. The scan is broken');
});
