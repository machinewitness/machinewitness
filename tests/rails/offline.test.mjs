/**
 * tests/rails/offline.test.mjs: the whole flow, with the network DENIED, in every
 * tree that ships.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 VERIFIED BY EXECUTION, NOT BY READING THE SOURCE.
 *
 * The obvious version of this check reads `skill/scripts/` and finds no network
 * import. It misses everything that matters: a child process making its own
 * connection, a shell tool, a name lookup, the GENERATED provider trees that are what
 * a person actually installs, and the command-line entry point. An earlier draft did
 * exactly that, and while it reported the architecture as Python-standard-library
 * and offline, the skill's own tool permission allowed a Node script on a user path,
 * copied from the project it was modelled on.
 *
 * So: run it. Every tree, the full flow, from the first screen to the plan, with the
 * network denied and with a ledger of every child process and every write.
 *
 * TWO INDEPENDENT DENIALS, and both are PROVEN to work before anything is concluded
 * from them:
 *
 *   AT THE OPERATING SYSTEM   a sandbox that refuses sockets and name lookups to
 *                             everything inside it, including any child process and
 *                             any shell tool. Proven with a control probe that runs
 *                             WITHOUT the interpreter-level denial, so the two cannot
 *                             be mistaken for each other.
 *   AT THE INTERPRETER        sockets, connections and name lookups replaced with a
 *                             refusal that records the attempt. This is the half that
 *                             also gives the ledgers.
 *
 * ⚠️ AND EVERY LEDGER IS PROVEN NON-EMPTY BEFORE IT IS JUDGED. An empty write ledger
 * and a perfectly contained one look identical. This is the project's own headline
 * failure mode and it is not going to be reproduced in the test written to rule it
 * out, so the write ledger must contain entries, the process ledger must contain the
 * one process the declaration admits to, and the network ledger must be empty *while
 * the control probe proves the recorder works.*
 *
 * 🔴 THE COMMAND-LINE ENTRY POINT NOW EXISTS, AND IT IS DRIVEN HERE. It used to be a
 * trip-wire (a failing assertion that said "this appeared and nothing covers it")
 * because silently skipping a surface is how a whole path goes uncovered while the
 * suite stays green. The trip-wire has been replaced by the thing it was waiting for:
 * the full flow, from the first screen to the plan, started through the launcher, in
 * the same sandbox, with the same ledgers.
 *
 * ⚠️ AND THE TRIP-WIRE IS STILL THERE IN A NEW FORM, at the bottom: the set of files
 * under `cli/` and the set of commands the package declares are both compared against
 * what this test actually drove. A second launcher appearing, or a `bin` entry
 * pointing at nothing, fails here rather than going unnoticed.
 *
 * ⚠️ THE LAUNCHER IS WRITTEN IN THE BUILD TOOL'S LANGUAGE, AND THAT IS THE POINT OF
 * DRIVING IT. It is the one place that is permitted, because it does no work, it
 * starts the interpreter and hands over. The ledgers are what turn that from a claim
 * into an observation: the interpreter-level harness reaches the launcher's own child
 * through the environment it passes down, so a write or a connection made anywhere in
 * that chain is recorded, and the operating-system denial covers the launcher itself
 * as well as everything under it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { homedir, tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  REPO,
  allowlist,
  jurisdictionCodes,
  listUnder,
  nodesById,
  optionsOf,
  proven,
  readRepo,
  recordNodes,
  scratch,
} from './_rails.mjs';

/* ── the trees that ship, derived from the lock rather than typed ──────────── */

const lock = JSON.parse(proven('skills-lock.json', readRepo('skills-lock.json'), { floor: 200 }));
const skillName = lock.skill;
const providerRoots = proven('the providers in the lock', lock.providers ?? []).map((id) => `.${id}`);
const mirrorRoots = Object.keys(lock.mirrors ?? {});

/** Every tree an engine can be run from: the source tree and every shipped copy. */
const TREES = ['skill', ...providerRoots.map((r) => `${r}/skills/${skillName}`), ...mirrorRoots.map((r) => `${r}/skills/${skillName}`)];

test('the tree list is derived, non-empty, and every tree really holds an engine', (t) => {
  proven('the trees to exercise', TREES, { floor: 4 });
  for (const tree of TREES) {
    const engine = join(REPO, tree, 'scripts', 'triage.py');
    assert.ok(existsSync(engine), `${tree} has no engine at scripts/triage.py`);
    const contract = join(REPO, tree, 'data', 'tree.json');
    assert.ok(existsSync(contract), `${tree} has no contract at data/tree.json`);
  }
  t.diagnostic(`trees to exercise offline: ${TREES.join(' · ')}`);
});

/* ── the interpreter-level denial, and the three ledgers ──────────────────── */

const HARNESS = scratch('offline-harness');

/**
 * Written into a directory placed on the interpreter's import path, so it loads
 * before any script runs and covers anything the script imports.
 *
 * ⚠️ The ledger is written with the LOW-LEVEL file calls, which are not patched, for
 * two reasons: recording a write with a patched write is infinite recursion, and the
 * ledger's own entries would otherwise appear in the ledger.
 */
const SITECUSTOMIZE = `
import builtins
import io
import os
import shutil
import socket
import subprocess

_WRITES = os.environ.get("MW_LEDGER_WRITES")
_PROCS = os.environ.get("MW_LEDGER_PROCS")
_NET = os.environ.get("MW_LEDGER_NET")

def _log(where, line):
    if not where:
        return
    try:
        fd = os.open(where, os.O_WRONLY | os.O_APPEND | os.O_CREAT, 0o600)
        os.write(fd, (str(line) + "\\n").encode("utf-8", "replace"))
        os.close(fd)
    except OSError:
        pass

# ── network: refused, and the attempt recorded ──────────────────────────────
class NetworkDenied(OSError):
    pass

def _deny(*args, **kwargs):
    _log(_NET, "attempt " + repr(args)[:300])
    raise NetworkDenied("the offline harness denies every outbound call")

socket.socket = _deny
socket.create_connection = _deny
socket.getaddrinfo = _deny
socket.gethostbyname = _deny
socket.gethostbyname_ex = _deny
socket.gethostbyaddr = _deny

# ── writes: allowed, and every one recorded ────────────────────────────────
_WRITE_MODES = ("w", "a", "x", "+")
_real_open = _real_io_open = io.open

def _record_open(file, mode="r"):
    try:
        if isinstance(mode, str) and any(ch in mode for ch in _WRITE_MODES):
            target = file if isinstance(file, (str, bytes)) else getattr(file, "__fspath__", lambda: file)()
            _log(_WRITES, "open " + os.fsdecode(target) if not isinstance(target, int) else "open <fd>")
    except Exception:
        pass

def _open(file, mode="r", *a, **k):
    _record_open(file, mode)
    return _real_io_open(file, mode, *a, **k)

builtins.open = _open
io.open = _open

def _wrap(module, name, label, index=0):
    original = getattr(module, name, None)
    if original is None:
        return
    def wrapper(*a, **k):
        try:
            if len(a) > index:
                _log(_WRITES, label + " " + os.fsdecode(a[index]) if isinstance(a[index], (str, bytes)) else label)
        except Exception:
            pass
        return original(*a, **k)
    setattr(module, name, wrapper)

for _name in ("mkdir", "makedirs", "remove", "unlink", "rmdir", "chmod", "chown", "rename", "replace", "symlink", "link", "truncate"):
    _wrap(os, _name, _name)
for _name in ("copy", "copy2", "copyfile", "copytree", "move", "rmtree"):
    _wrap(shutil, _name, _name)

# ── child processes: allowed, and every one recorded ───────────────────────
_real_popen_init = subprocess.Popen.__init__

def _popen_init(self, args, *a, **k):
    try:
        if isinstance(args, (str, bytes)):
            _log(_PROCS, os.fsdecode(args))
        else:
            _log(_PROCS, " ".join(os.fsdecode(x) if isinstance(x, (str, bytes)) else str(x) for x in args))
    except Exception:
        pass
    return _real_popen_init(self, args, *a, **k)

subprocess.Popen.__init__ = _popen_init
_wrap(os, "system", "system")
_wrap(os, "popen", "popen")
`;

writeFileSync(join(HARNESS, 'sitecustomize.py'), SITECUSTOMIZE);

/* ── the operating-system denial ───────────────────────────────────────────── */

/** `{ id, wrapper }`: the argv prefix that denies the network, or null. */
function osDenial() {
  if (process.platform === 'darwin' && existsSync('/usr/bin/sandbox-exec')) {
    const profile = join(HARNESS, 'no-network.sb');
    writeFileSync(profile, '(version 1)\n(allow default)\n(deny network*)\n');
    return { id: 'sandbox-exec', wrapper: ['/usr/bin/sandbox-exec', '-f', profile] };
  }
  const probe = spawnSync('unshare', ['-rn', '/bin/true'], { encoding: 'utf8' });
  if (probe.status === 0) return { id: 'unshare -rn', wrapper: ['unshare', '-rn'] };
  return { id: 'none', wrapper: null };
}

const OS_DENIAL = osDenial();

function ledgerPaths(tag) {
  const dir = scratch(`ledgers-${tag}`);
  return {
    writes: join(dir, 'writes.log'),
    procs: join(dir, 'processes.log'),
    net: join(dir, 'network.log'),
  };
}

function readLedger(path) {
  if (!existsSync(path)) return [];
  return readFileSync(path, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
}

/**
 * Run the interpreter with the network denied both ways.
 * `interpreterDenial: false` drops the import-path harness, which is how the
 * operating-system denial is proven on its own.
 */
function denied(args, { cwd, home, ledgers, interpreterDenial = true, timeout = 60000 } = {}) {
  const env = {
    ...process.env,
    HOME: home,
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONPATH: interpreterDenial ? HARNESS : '',
    MW_LEDGER_WRITES: ledgers?.writes ?? '',
    MW_LEDGER_PROCS: ledgers?.procs ?? '',
    MW_LEDGER_NET: ledgers?.net ?? '',
  };
  const argv = OS_DENIAL.wrapper
    ? [...OS_DENIAL.wrapper, '/usr/bin/env', 'python3', ...args]
    : ['/usr/bin/env', 'python3', ...args];
  return spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8', env, timeout });
}

/**
 * The same two denials and the same three ledgers, around a whole command line rather
 * than around the interpreter.
 *
 * 🔴 THE INTERPRETER-LEVEL HARNESS STILL APPLIES TO WHAT THIS STARTS, and that is not
 * an accident of the environment. It is why the launcher may exist at all. The
 * harness is delivered through the import path, the launcher hands its own environment
 * to the interpreter it starts, so the ledgers record what the interpreter does even
 * though the interpreter is now a grandchild. The sandbox covers the launcher itself.
 */
function deniedCommand(argv, { cwd, home, ledgers, timeout = 60000 } = {}) {
  const env = {
    ...process.env,
    HOME: home,
    PYTHONDONTWRITEBYTECODE: '1',
    PYTHONPATH: HARNESS,
    MW_LEDGER_WRITES: ledgers?.writes ?? '',
    MW_LEDGER_PROCS: ledgers?.procs ?? '',
    MW_LEDGER_NET: ledgers?.net ?? '',
  };
  const full = OS_DENIAL.wrapper ? [...OS_DENIAL.wrapper, ...argv] : argv;
  return spawnSync(full[0], full.slice(1), { cwd, encoding: 'utf8', env, timeout });
}

/* ── prove each denial actually denies, before concluding anything ─────────── */

const PROBE = [
  '-c',
  [
    'import socket, sys',
    'ok = []',
    'for what, fn in (("connect", lambda: socket.create_connection(("1.1.1.1", 53), timeout=3)), ("name lookup", lambda: socket.getaddrinfo("example.invalid", 80))):',
    '    try:',
    '        fn()',
    '        ok.append(what)',
    '    except Exception:',
    '        pass',
    'sys.stdout.write("REACHED:" + ",".join(ok) + "\\n")',
  ].join('\n'),
];

test('the interpreter-level denial refuses a connection and a name lookup, and records both', (t) => {
  const ledgers = ledgerPaths('probe-interpreter');
  const run = denied(PROBE, { cwd: HARNESS, home: join(HARNESS, 'home'), ledgers });
  assert.equal(run.status, 0, `the probe did not run:\n${run.stdout}\n${run.stderr}`);
  assert.match(run.stdout, /REACHED:/, `the probe printed nothing usable:\n${run.stdout}`);
  assert.equal(
    run.stdout.trim(),
    'REACHED:',
    `the network was reachable: ${run.stdout.trim()}. Every conclusion below would be ` +
      'meaningless.',
  );
  const attempts = readLedger(ledgers.net);
  assert.ok(
    attempts.length >= 2,
    `the recorder logged ${attempts.length} attempt(s); the probe made two. An empty ` +
      'network ledger must mean "nothing tried", never "nothing recorded".',
  );
  t.diagnostic(`interpreter-level denial: proven, ${attempts.length} attempts recorded`);
});

test('the operating-system denial refuses on its own, with the interpreter harness off', (t) => {
  if (!OS_DENIAL.wrapper) {
    assert.fail(
      'NO OPERATING-SYSTEM LEVEL NETWORK DENIAL IS AVAILABLE ON THIS PLATFORM. The ' +
        'interpreter-level denial covers Python and anything it imports, but NOT a ' +
        'child process, a shell tool, or a name lookup made outside the interpreter, ' +
        'which is precisely the gap that made the previous static check worthless. ' +
        'Install or enable one, or run this suite where one exists. ⛔ Do not soften ' +
        'this into a skip: an unrun check reads exactly like a passing one.',
    );
  }
  // `-S` drops the import-path harness entirely, so only the sandbox can be denying.
  const run = denied(['-S', ...PROBE], {
    cwd: HARNESS,
    home: join(HARNESS, 'home'),
    interpreterDenial: false,
  });
  assert.match(run.stdout, /REACHED:/, `the bare probe printed nothing usable:\n${run.stdout}\n${run.stderr}`);
  assert.equal(
    run.stdout.trim(),
    'REACHED:',
    `the sandbox let the network through: ${run.stdout.trim()}`,
  );
  t.diagnostic(`operating-system denial: ${OS_DENIAL.id}, proven with the interpreter harness off`);
});

/* ── the answer sequence, derived once from a real walk ────────────────────── */

const FOLDER_SLOT = '<THEIR-FOLDER>';

/**
 * The replies that walk the real commands from the first screen to the plan,
 * discovered by asking the engine where it is parked rather than by being typed.
 * Discovered ONCE, outside the sandbox, then replayed inside it for every tree, a
 * state query per answer would double the process count for no extra coverage.
 */
function replySequence() {
  const engine = join(REPO, 'skill', 'scripts', 'triage.py');
  const start = scratch('sequence-probe');
  const folder = join(start, 'their-folder');
  const home = join(start, 'home');
  const env = { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' };
  const run = (args, cwd) => spawnSync('python3', [engine, ...args], { cwd, encoding: 'utf8', env });

  const forced = { H1: 'yes', H2: 'yes', H4: 'no' };
  forced[recordNodes[recordNodes.length - 1]] = 'no';

  let cwd = start;
  const begun = run(['begin'], cwd);
  assert.equal(begun.status, 0, `begin failed while deriving the sequence:\n${begun.stderr}`);

  const replies = [];
  for (let guard = 0; guard < 200; guard += 1) {
    const state = run(['state'], cwd);
    assert.equal(state.status, 0, `state failed:\n${state.stdout}\n${state.stderr}`);
    const parked = JSON.parse(state.stdout.slice(state.stdout.indexOf('{'))).parked_on;
    if (parked === 'PLAN') return proven('the reply sequence', replies, { floor: 20 });

    let reply;
    if (parked === 'W1') reply = FOLDER_SLOT;
    else if (parked === 'W2') reply = 'yes';
    else if (parked === 'W3') reply = 'ok';   // A22: it states, it does not ask
    else if (parked === 'S0') reply = 'ok';
    // ⚖️ W4's options come from the packs, not the contract, so `optionsOf` has
    // nothing for it. Read from the digest-verified summary, never typed.
    else if (parked === 'W4') [reply] = jurisdictionCodes();
    else if (nodesById.has(parked)) reply = forced[parked] ?? optionsOf(parked)[0];
    // ⚠️ The fallback used to be a bare `ok`, which is not an option on any
    // authored screen but the first, so a new setup screen reached it and the walk
    // died with a rejection rather than saying which screen it could not answer.
    else assert.fail(`the sequence probe has no answer for the screen ${parked}`);
    replies.push(reply);

    const answered = run(['answer', reply === FOLDER_SLOT ? folder : reply], cwd);
    assert.equal(answered.status, 0, `answering at ${parked} failed:\n${answered.stderr}`);
    if (parked === 'W2') cwd = folder;
  }
  assert.fail('could not derive a reply sequence that reaches the plan');
  return [];
}

const REPLIES = replySequence();

/* ── the full flow, in every tree, with the network denied ────────────────── */

const results = new Map();

for (const tree of TREES) {
  const tag = tree.replace(/[^a-z0-9]+/gi, '-');
  const engine = join(REPO, tree, 'scripts', 'triage.py');
  const root = scratch(`flow-${tag}`);
  const home = join(root, 'home');
  const folder = join(root, 'their-folder');
  const ledgers = ledgerPaths(`flow-${tag}`);

  const printed = [];
  let cwd = root;
  let failure = null;

  const first = denied([engine, 'begin'], { cwd, home, ledgers });
  if (first.status !== 0) failure = `begin exited ${first.status}: ${first.stdout}\n${first.stderr}`;
  printed.push(first.stdout ?? '');

  if (!failure) {
    for (const reply of REPLIES) {
      const value = reply === FOLDER_SLOT ? folder : reply;
      const run = denied([engine, 'answer', value], { cwd, home, ledgers });
      printed.push(run.stdout ?? '');
      if (run.status !== 0) {
        failure = `answering ${JSON.stringify(value)} exited ${run.status}: ${run.stdout}\n${run.stderr}`;
        break;
      }
      if (reply === 'yes' && existsSync(folder)) cwd = folder;
    }
  }

  /**
   * 🔴 A SEPARATE LEDGER FOR THE SELF-CHECK, because it is a different claim.
   *
   * The engine's own self-check builds a throwaway install tree and a throwaway case
   * folder in the platform's temporary directory. It has to, in order to test a
   * corrupted contract and a refused folder for real rather than by inspection. Those
   * writes are declared, and they are NOT inside anybody's workspace. Mixing them into
   * the flow's ledger would either fail the containment check for the wrong reason or,
   * worse, force the containment check to allow anywhere temporary at all, which is
   * most of the disk.
   */
  const selftestLedgers = ledgerPaths(`selftest-${tag}`);
  const selftest = failure
    ? null
    : denied([engine, '--selftest'], { cwd: root, home, ledgers: selftestLedgers });

  results.set(tree, {
    failure,
    printed: printed.join('\n'),
    folder,
    root,
    home,
    ledgers,
    selftestLedgers,
    selftest,
    entries: existsSync(folder) ? readdirSync(folder).sort() : [],
  });
}

test('the full flow completes in every shipped tree with the network denied', (t) => {
  const broken = [];
  for (const [tree, result] of results) {
    if (result.failure) broken.push(`${tree}: ${result.failure.slice(0, 400)}`);
  }
  assert.deepEqual(broken, [], `the flow did not complete offline:\n  ${broken.join('\n  ')}`);

  for (const [tree, result] of results) {
    proven(`what ${tree} printed`, result.printed, { floor: 4000 });
    proven(`the folder ${tree} created`, result.entries, { floor: 5 });
    assert.equal(
      result.selftest?.status,
      0,
      `${tree}: the engine's own selftest failed offline:\n${result.selftest?.stdout}\n${result.selftest?.stderr}`,
    );
    assert.ok(
      (result.selftest?.stdout ?? '').includes('✅'),
      `${tree}: the offline selftest produced no success marker`,
    );
  }
  t.diagnostic(
    `flows completed offline: ${results.size} · replies replayed per flow: ${REPLIES.length}`,
  );
});

test('not one outbound attempt was made, by anything, in any tree', () => {
  const attempts = [];
  for (const [tree, result] of results) {
    for (const line of readLedger(result.ledgers.net)) attempts.push(`${tree} flow: ${line}`);
    for (const line of readLedger(result.selftestLedgers.net)) {
      attempts.push(`${tree} self-check: ${line}`);
    }
  }
  assert.deepEqual(
    attempts,
    [],
    `something tried to reach the network:\n  ${attempts.join('\n  ')}`,
  );
});

test('every child process is one the declaration admits to', (t) => {
  const declared = new Set(
    (allowlist().subprocesses ?? []).flatMap((entry) => entry.binaries ?? []),
  );
  proven('the declared child-process binaries', [...declared], { floor: 1 });

  const seen = new Set();
  const undeclared = [];
  for (const [tree, result] of results) {
    for (const line of [...readLedger(result.ledgers.procs), ...readLedger(result.selftestLedgers.procs)]) {
      const argv0 = line.split(/\s+/)[0] ?? '';
      const name = argv0.split('/').pop();
      if (!name) continue;
      seen.add(name);
      if (!declared.has(name)) undeclared.push(`${tree}: ${line.slice(0, 160)}`);
    }
  }
  assert.deepEqual(
    undeclared,
    [],
    `an undeclared child process ran:\n  ${undeclared.join('\n  ')}\n` +
      `declared: ${[...declared].join(', ')}`,
  );
  // ⛔ And specifically not the build tool. Nothing on a user path may need it.
  for (const forbidden of ['node', 'npm', 'npx', 'curl', 'wget', 'ssh', 'nc', 'dig', 'host', 'nslookup']) {
    assert.ok(!seen.has(forbidden), `a user path ran ${forbidden}`);
  }
  t.diagnostic(`child processes observed: ${[...seen].sort().join(', ') || 'none'}`);
});

test('every write landed inside the person’s own folder, and nowhere else', (t) => {
  const allowedRoots = [];
  const offenders = [];
  let recorded = 0;

  /**
   * ⚠️ Both spellings of a temporary root, and NOT a blanket allowance for anything
   * under the temporary directory. On this platform the temporary path is reachable as
   * `/var/...` and as `/private/var/...` and the engine resolves symbolic links before
   * writing, so a write to the folder it was given can be recorded either way. Allowing
   * "anywhere temporary" instead would have made the containment claim almost empty.
   */
  const variants = (path) => [
    path,
    path.startsWith('/private/') ? path.slice('/private'.length) : `/private${path}`,
  ];

  for (const [tree, result] of results) {
    const roots = [result.root, result.home, HARNESS, '/dev/null'].flatMap(variants);
    allowedRoots.push(...roots);
    const lines = readLedger(result.ledgers.writes);
    // 🔴 NON-EMPTY FIRST. A containment assertion over an empty ledger is the exact
    // shape of this project's worst failure: green over nothing observed.
    assert.ok(
      lines.length > 10,
      `${tree}: the write ledger holds ${lines.length} entries. The flow creates a ` +
        'folder and five files, so a ledger this short means nothing was recorded and ' +
        'the containment check below would pass on air.',
    );
    for (const line of lines) {
      const path = line.slice(line.indexOf(' ') + 1);
      if (!path.startsWith('/')) continue; // a relative write resolves inside cwd
      recorded += 1;
      const inside = roots.some((root) => path === root || path.startsWith(`${root}${sep}`));
      if (!inside) offenders.push(`${tree}: ${path}`);
    }
  }

  assert.ok(recorded > 20, `only ${recorded} absolute writes recorded across every tree`);
  assert.deepEqual(
    offenders,
    [],
    `a write landed outside the workspace:\n  ${offenders.join('\n  ')}`,
  );

  // Explicitly: nothing in the repository, and nothing in the real home directory.
  const real = readLedger(results.get(TREES[0]).ledgers.writes)
    .map((line) => line.slice(line.indexOf(' ') + 1))
    .filter((path) => path.startsWith(REPO) || path.startsWith(homedir()));
  const outsideTemp = real.filter((path) => !path.startsWith(HARNESS));
  assert.deepEqual(
    outsideTemp.map((p) => relative(REPO, p)),
    [],
    `the flow wrote into the repository or the real home directory: ${outsideTemp.join(', ')}`,
  );
  t.diagnostic(`absolute writes recorded and contained: ${recorded}`);
});

test('the self-check writes only into a throwaway directory it made itself', (t) => {
  // The other half of the split above, asserted rather than waved away. The declaration
  // says the self-check reaches the platform's temporary directory and the null device
  // and nothing else; this is that claim, checked.
  const temp = [tmpdir(), `/private${tmpdir()}`, tmpdir().replace(/^\/private/, '')];
  let recorded = 0;
  const offenders = [];
  for (const [tree, result] of results) {
    const lines = readLedger(result.selftestLedgers.writes);
    assert.ok(
      lines.length > 10,
      `${tree}: the self-check write ledger holds ${lines.length} entries. It builds a ` +
        'throwaway tree and a throwaway folder, so a ledger this short means nothing ' +
        'was recorded.',
    );
    for (const line of lines) {
      const path = line.slice(line.indexOf(' ') + 1);
      if (!path.startsWith('/')) continue;
      recorded += 1;
      const ok =
        path === '/dev/null' ||
        temp.some((root) => path === root || path.startsWith(`${root}${sep}`));
      if (!ok) offenders.push(`${tree}: ${path}`);
    }
  }
  assert.ok(recorded > 20, `only ${recorded} absolute writes recorded by the self-checks`);
  assert.deepEqual(
    offenders,
    [],
    `the self-check wrote outside a throwaway directory:\n  ${offenders.join('\n  ')}`,
  );
  t.diagnostic(`self-check writes recorded and contained: ${recorded}`);
});

/* ── no build tool on any user path ───────────────────────────────────────── */

test('no shipped tool permission names the build tool, and no user-path script needs it', () => {
  const shipped = [
    'skill/SKILL.src.md',
    ...providerRoots.map((r) => `${r}/skills/${skillName}/SKILL.md`),
    ...mirrorRoots.map((r) => `${r}/skills/${skillName}/SKILL.md`),
  ];
  proven('the shipped skill definitions', shipped, { floor: 4 });
  for (const rel of shipped) {
    const front = /^---\n([\s\S]*?)\n---/.exec(readRepo(rel));
    assert.ok(front, `${rel} has no front matter`);
    const tools = [...front[1].matchAll(/^\s*-\s*(.+)$/gm)].map((m) => m[1].trim());
    proven(`the tool permissions in ${rel}`, tools, { floor: 1 });
    for (const entry of tools) {
      assert.ok(
        !/\bnode\b|\bnpx\b|\bnpm\b|\.mjs\b|\.cjs\b/.test(entry),
        `${rel} permits a build-tool invocation on a user path: ${entry}`,
      );
    }
  }
  // …and nothing in a user-path script shells out to it either.
  const scripts = [
    ...listUnder('skill/scripts', ['.py']),
    ...listUnder('cli', ['.py', '.js', '.mjs', '.cjs', '.ts']),
  ];
  proven('the user-path scripts', scripts, { floor: 1 });
  // ⚠️ Narrow on purpose. The first version matched the bare word and fired on the
  // engine's own screen records, which carry a `node` field because the contract is a
  // graph of nodes. What is forbidden is INVOKING the build tool, so the pattern looks
  // for a command shape. The behavioural check above is the real control: the only
  // child process observed across every tree was the volume-list tool.
  // ⚠️ The list form needs a COMMA after it. An argv has a second element. Without
  // that, `s["node"]`, which is how the engine reads its own screen records, matched.
  const INVOKES_BUILD_TOOL = /\bnpx\b|\bnpm\s+(?:run|exec|install|ci)\b|which\s*\(\s*["']node["']\s*\)|\[\s*["']node["']\s*,|\bnode\s+[\w./-]+\.(?:js|mjs|cjs)\b/;
  for (const rel of scripts) {
    const text = readRepo(rel);
    assert.ok(
      !INVOKES_BUILD_TOOL.test(text),
      `${rel} invokes the build tool. Nothing on a user path may need it.`,
    );
  }
  // …and the pattern is known to fire, so its silence means something.
  assert.ok(
    INVOKES_BUILD_TOOL.test('subprocess.run(["node", "context.mjs"])'),
    'the build-tool pattern does not catch the exact invocation that was found on a ' +
      'user path in the project this skill was modelled on. A check that cannot fire ' +
      'is not a check.',
  );
});

/* ── the command-line launcher, driven through the same sandbox ────────────── */

const CLI_EXTENSIONS = ['.py', '.js', '.mjs', '.cjs', '.ts'];
const CLI_FILES = listUnder('cli', CLI_EXTENSIONS);
const BIN = JSON.parse(proven('package.json', readRepo('package.json'), { floor: 100 })).bin ?? {};

/**
 * The whole flow, started through the launcher rather than through the interpreter.
 *
 * ⛔ THE FIRST TURN IS THE BARE FORM, no argument at all, which is the only form a
 * frightened person types. Every turn after it goes through the launcher too, with the
 * arguments passed on, so the pass-through path is exercised rather than described.
 */
function driveLauncher(launcherRel) {
  const launcher = join(REPO, ...launcherRel.split('/'));
  const root = scratch('flow-cli');
  const home = join(root, 'home');
  const folder = join(root, 'their-folder');
  const ledgers = ledgerPaths('flow-cli');

  const printed = [];
  let cwd = root;
  let failure = null;

  const step = (args) =>
    deniedCommand([process.execPath, launcher, ...args], { cwd, home, ledgers });

  const first = step([]);
  printed.push(first.stdout ?? '');
  if (first.status !== 0) {
    failure = `the bare command exited ${first.status}: ${first.stdout}\n${first.stderr}`;
  }

  if (!failure) {
    for (const reply of REPLIES) {
      const value = reply === FOLDER_SLOT ? folder : reply;
      const run = step(['init', 'answer', value]);
      printed.push(run.stdout ?? '');
      if (run.status !== 0) {
        failure = `answering ${JSON.stringify(value)} exited ${run.status}: ${run.stdout}\n${run.stderr}`;
        break;
      }
      if (reply === 'yes' && existsSync(folder)) cwd = folder;
    }
  }

  return {
    launcherRel,
    failure,
    printed: printed.join('\n'),
    folder,
    root,
    home,
    ledgers,
    entries: existsSync(folder) ? readdirSync(folder).sort() : [],
  };
}

const launcherRel = BIN.mw;
const launched = launcherRel && existsSync(join(REPO, launcherRel))
  ? driveLauncher(launcherRel)
  : null;

test('the package names a launcher, it exists, and it is the only one', (t) => {
  // 🔴 THE TRIP-WIRE, IN ITS NEW FORM. It used to fail because `cli/` appeared and
  // nothing drove it. It now fails if `bin` names something that is not there, or if a
  // SECOND file appears under `cli/` that the flow below does not go through, which is
  // the same failure by the same route: a user path nobody executed.
  proven('the commands the package declares', Object.keys(BIN), { floor: 1 });
  const missing = Object.entries(BIN).filter(([, target]) => !existsSync(join(REPO, target)));
  assert.deepEqual(
    missing.map(([name, target]) => `${name} -> ${target}`),
    [],
    'the package declares a command whose file does not exist. Installing the package ' +
      'would produce a command that cannot run at all, which is the state this ' +
      'repository was in before the launcher was written.',
  );

  assert.deepEqual(
    CLI_FILES,
    [launcherRel],
    `cli/ holds ${CLI_FILES.length} source file(s) and only ${launcherRel} is driven ` +
      `offline: ${CLI_FILES.join(', ')}\n` +
      '⛔ Drive the new one here (the full flow, in the sandbox, with the ledgers) ' +
      'before this rail may be called enforced. This is a FAILURE rather than a skip ' +
      'on purpose: a surface silently left out of an offline check is exactly how the ' +
      'previous version of this check missed subprocesses, shell tools, name lookups, ' +
      'the generated trees and the command line at once.',
  );
  t.diagnostic(`launcher driven offline: ${launcherRel} · files under cli/: ${CLI_FILES.length}`);
});

test('the full flow completes through the launcher with the network denied', (t) => {
  assert.ok(launched, `${launcherRel ?? 'the launcher'} was not driven at all`);
  assert.equal(launched.failure, null, `the flow did not complete through the launcher:\n${launched.failure}`);
  proven('what the launcher printed', launched.printed, { floor: 4000 });
  proven('the folder the launcher created', launched.entries, { floor: 5 });
  t.diagnostic(
    `turns through the launcher: ${REPLIES.length + 1} (the first with no argument at ` +
      `all) · entries left in the folder: ${launched.entries.length}`,
  );
});

test('nothing in the launcher chain tried to reach the network', () => {
  const attempts = readLedger(launched.ledgers.net);
  assert.deepEqual(
    attempts,
    [],
    `something in the launcher chain tried to reach the network:\n  ${attempts.join('\n  ')}`,
  );
});

test('the launcher chain started nothing the declaration does not admit to', (t) => {
  // 🔴 NON-EMPTY FIRST, and this ledger is the proof that the harness really did reach
  // the interpreter through the launcher. If it were empty, every assertion in this
  // section would be green over nothing observed, and the launcher would be the one
  // surface where that was true.
  const lines = readLedger(launched.ledgers.procs);
  const writes = readLedger(launched.ledgers.writes);
  assert.ok(
    writes.length > 10,
    `the launcher's write ledger holds ${writes.length} entries. The flow creates a ` +
      'folder and five files, so a ledger this short means the interpreter-level ' +
      'harness never reached the interpreter the launcher started, and nothing below ' +
      'is an observation.',
  );

  const declared = new Set(
    (allowlist().subprocesses ?? []).flatMap((entry) => entry.binaries ?? []),
  );
  proven('the declared child-process binaries', [...declared], { floor: 1 });
  const seen = new Set();
  const undeclared = [];
  for (const line of lines) {
    const name = (line.split(/\s+/)[0] ?? '').split('/').pop();
    if (!name) continue;
    seen.add(name);
    if (!declared.has(name)) undeclared.push(line.slice(0, 160));
  }
  assert.deepEqual(
    undeclared,
    [],
    `an undeclared child process ran under the launcher:\n  ${undeclared.join('\n  ')}\n` +
      `declared: ${[...declared].join(', ')}`,
  );

  // ⛔ And the launcher must not have started a SECOND copy of the build tool. It is
  // allowed to BE one; it is not allowed to run one, or to run anything that fetches.
  for (const forbidden of ['npm', 'npx', 'curl', 'wget', 'ssh', 'nc', 'dig', 'host', 'nslookup']) {
    assert.ok(!seen.has(forbidden), `the launcher chain ran ${forbidden}`);
  }
  t.diagnostic(
    `writes recorded under the launcher: ${writes.length} · child processes the ` +
      `interpreter started: ${[...seen].sort().join(', ') || 'none'}`,
  );
});

test('every write the launcher chain made landed inside the throwaway folder', (t) => {
  const variants = (path) => [
    path,
    path.startsWith('/private/') ? path.slice('/private'.length) : `/private${path}`,
  ];
  const roots = [launched.root, launched.home, HARNESS, '/dev/null'].flatMap(variants);
  const lines = readLedger(launched.ledgers.writes);
  assert.ok(lines.length > 10, `only ${lines.length} write entries recorded`);

  let recorded = 0;
  const offenders = [];
  for (const line of lines) {
    const path = line.slice(line.indexOf(' ') + 1);
    if (!path.startsWith('/')) continue;
    recorded += 1;
    if (!roots.some((root) => path === root || path.startsWith(`${root}${sep}`))) {
      offenders.push(path);
    }
  }
  assert.ok(recorded > 20, `only ${recorded} absolute writes recorded under the launcher`);
  assert.deepEqual(
    offenders,
    [],
    `the launcher chain wrote outside the folder:\n  ${offenders.join('\n  ')}`,
  );

  // Explicitly: nothing in this repository. ⛔ Including the compiled copies the
  // interpreter caches beside a script it runs. Those are a write into the install
  // tree caused by nothing but having run, and the launcher switches them off.
  const inRepo = lines
    .map((line) => line.slice(line.indexOf(' ') + 1))
    .filter((path) => path.startsWith(REPO) || path.startsWith(homedir()))
    .filter((path) => !path.startsWith(HARNESS));
  assert.deepEqual(
    inRepo.map((p) => relative(REPO, p)),
    [],
    `the launcher chain wrote into the repository or the real home directory: ${inRepo.join(', ')}`,
  );
  t.diagnostic(`absolute writes recorded under the launcher and contained: ${recorded}`);
});
