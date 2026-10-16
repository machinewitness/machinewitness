/**
 * tests/commands/freeze.test.mjs. The round trip is byte-exact, and the origin
 * comes out of it untouched.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHAT THIS FILE IS ACTUALLY DEFENDING AGAINST, AND IT IS NOT TAMPERING.
 *
 * It is the FALSE FAILURE. Every fixture below is a shape that some plausible
 * implementation quietly rewrites, a trailing newline dropped by a command
 * substitution, a line ending translated by a text-mode read, a byte-order mark
 * stripped because it looks like noise, an accent normalised so that two spellings
 * compare equal. Each of those produces a mismatch on a byte-identical file, and a
 * false mismatch is worse than no check at all: the first red digest a frightened
 * person sees, they panic, and the second thing they do is try to *fix* the frozen
 * set, which is the one unrecoverable move.
 *
 * So the assertions are not merely "the digest matched". For each awkward shape the
 * test ALSO computes what the digest would have been had the normalisation
 * happened, and asserts the recorded digest is not that value. That is what makes
 * the check falsifiable: it proves the trap would have changed the answer and that
 * the code did not fall into it. A test that only asserts a match would pass
 * against an implementation that normalised both sides identically.
 *
 * 🔴 THE DIGESTS ARE COMPUTED HERE BY A DIFFERENT IMPLEMENTATION. The tool under
 * test digests in Python; this file digests the same bytes with the platform's own
 * library, in another language. A tool is not a witness to its own output, and a
 * fixture checked by the code that produced it proves nothing about the code.
 *
 * ⚠️ EVERY FIXTURE IS ASSEMBLED AT RUN TIME, from code points and byte values. Two
 * reasons: a file of literals would be reformatted by an editor, which is exactly
 * the normalisation under test, applied to the test, and this repository bars
 * several identifier classes from a fixture, correctly, so writing one out would
 * fail the gate over this file. Exempting the file would be the wrong fix.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createHash } from 'node:crypto';
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPO, goAhead, proven, scratch, stateFilename, workspaceDirs } from '../rails/_rails.mjs';

const FREEZE = join(REPO, 'skill', 'scripts', 'freeze.py');

// ⛔ The two folder names and the working note's name are read out of the engine's
// own constants by the shared helper, never typed here. A test that hard-coded one
// would keep passing after somebody changed it.
const [COPIES_DIR, RECORD_DIR] = workspaceDirs();
const STATE_FILE = stateFilename();

/* ── plumbing ──────────────────────────────────────────────────────────────── */

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/** The digest of a FILE, read as bytes. Never of a string that has been decoded. */
function sha256File(path) {
  return sha256(readFileSync(path));
}

function run(args, { home }) {
  return spawnSync('python3', [FREEZE, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' },
    timeout: 60000,
  });
}

/** Every file under `root`, repo-relative to it, with the facts a copy destroys. */
function signature(root) {
  const out = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const child = join(dir, entry.name);
      const rel = relative(root, child).split(sep).join('/');
      const st = lstatSync(child);
      if (entry.isDirectory()) {
        out.set(rel, { kind: 'dir', mode: st.mode, mtimeNs: String(st.mtimeNs) });
        walk(child);
      } else if (entry.isFile()) {
        out.set(rel, {
          kind: 'file',
          size: st.size,
          mode: st.mode,
          mtimeNs: String(st.mtimeNs),
          // ⚠️ The access time is deliberately NOT in here. Reading a file updates
          // it on most filesystems, that is a property of reading rather than
          // something any tool can switch off, and asserting on it would make this
          // test demand something impossible. The tool records the access time as
          // it was BEFORE the read for exactly that reason. The change is visible
          // rather than quietly excluded, which is the honest form of the claim.
          digest: sha256File(child),
        });
      } else {
        out.set(rel, { kind: 'other', mode: st.mode });
      }
    }
  };
  walk(root);
  return out;
}

/* ── the fixtures. Every one assembled at run time. ────────────────────────── */

const bytes = (text) => Buffer.from(new TextEncoder().encode(text));
const LF = Buffer.from([0x0a]);
const CR = Buffer.from([0x0d]);
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const COMBINING_ACUTE = String.fromCodePoint(0x0301);
const NON_LATIN = String.fromCodePoint(0x4e2d, 0x6587);

/**
 * `normalised` is the value the digest would take if the named trap had been fallen
 * into. Where it is set, the test asserts the recorded digest is NOT that, which
 * is what turns "it matched" into "it matched, and the wrong answer was available".
 */
const FIXTURES = [
  {
    name: 'trailing-newline.txt',
    content: Buffer.concat([bytes('one'), LF, bytes('two'), LF]),
    trap: 'the trailing newline stripped, as a shell command substitution does',
    normalised: Buffer.concat([bytes('one'), LF, bytes('two')]),
  },
  {
    name: 'no-trailing-newline.txt',
    content: bytes('the last line has no break after it'),
    trap: 'a newline appended to make the file "well formed"',
    normalised: Buffer.concat([bytes('the last line has no break after it'), LF]),
  },
  {
    name: 'crlf-line-endings.txt',
    content: Buffer.concat([bytes('one'), CR, LF, bytes('two'), CR, LF]),
    trap: 'line endings translated by a text-mode read',
    normalised: Buffer.concat([bytes('one'), LF, bytes('two'), LF]),
  },
  {
    name: 'cr-only-line-endings.txt',
    content: Buffer.concat([bytes('one'), CR, bytes('two'), CR]),
    trap: 'a carriage-return-only terminator rewritten',
    normalised: Buffer.concat([bytes('one'), LF, bytes('two'), LF]),
  },
  {
    name: 'byte-order-mark.txt',
    content: Buffer.concat([BOM, bytes('marked'), LF]),
    trap: 'the byte-order mark stripped because it looks like noise',
    normalised: Buffer.concat([bytes('marked'), LF]),
  },
  {
    // The unicode filename, in decomposed form, assembled from code points so no
    // editor can quietly recompose it in the source of this test.
    name: `re${COMBINING_ACUTE}sume${COMBINING_ACUTE}.txt`,
    content: Buffer.concat([bytes('a name stored one way'), LF]),
    trap: null,
  },
  {
    name: `${NON_LATIN}.txt`,
    content: Buffer.concat([bytes('a name with no latin letters in it'), LF]),
    trap: null,
  },
  {
    name: 'a name with spaces.txt',
    content: Buffer.concat([bytes('spaces in the name'), LF]),
    trap: null,
  },
  {
    // Two consecutive spaces: the checklist format is `<digest>  <path>`, so a name
    // holding the separator itself is the shape that breaks a naive reader.
    name: 'two  consecutive  spaces.txt',
    content: Buffer.concat([bytes('the separator, inside the name'), LF]),
    trap: null,
  },
  {
    name: 'empty.dat',
    content: Buffer.alloc(0),
    trap: null,
  },
  {
    name: 'not-text-at-all.dat',
    content: Buffer.from([0x00, 0xff, 0x7f, 0x80, 0x0a, 0x0d, 0x1a, 0x00]),
    trap: null,
  },
  {
    name: 'nested/deeper/inside.txt',
    content: Buffer.concat([bytes('two folders down'), LF]),
    trap: null,
  },
];

/** Build the origin tree, then make it read-only. Returns paths and the signature. */
function buildOrigin(label, { readOnly = true, permitted = true } = {}) {
  const base = scratch(label);
  const home = join(base, 'pretend-home');
  const origin = join(base, 'their-files');
  const workspace = join(base, 'their-folder');
  for (const dir of [home, origin, workspace]) mkdirSync(dir, { recursive: true });

  proven('the fixture set', FIXTURES, { floor: 8 });
  for (const fixture of FIXTURES) {
    const path = join(origin, ...fixture.name.split('/'));
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, fixture.content);
  }

  // 🔴 THE GO-AHEAD, OBTAINED THE WAY A PERSON WOULD OBTAIN IT. Nothing here reads
  // a source without one, so every fixture that expects the command to DO its work
  // has to hold one, and it is issued by the real check, over the real engine's
  // real working note, rather than written into the folder by this file. The
  // refusals are proven separately in tests/rails/capture-audit-binding.test.mjs.
  if (permitted) goAhead(workspace, origin, 'freeze', { home });

  const restore = [];
  if (readOnly) {
    // 🔴 THE READ-ONLY FIXTURE. The claim under test is that freezing writes
    // nothing into the origin, and the strongest form of it is an origin that
    // could not be written to even if the tool tried. Directories keep their
    // execute bit or nothing below them can be reached at all.
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const child = join(dir, entry.name);
        if (entry.isDirectory()) walk(child);
        else chmodSync(child, 0o444);
      }
      chmodSync(dir, 0o555);
      restore.push(dir);
    };
    walk(origin);
  }

  return { base, home, origin, workspace, before: signature(origin), restore };
}

/** Give the temporary tree back its write bits so the harness can remove it. */
function makeRemovable(origin) {
  const walk = (dir) => {
    chmodSync(dir, 0o700);
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = join(dir, entry.name);
      if (entry.isDirectory()) walk(child);
      else chmodSync(child, 0o600);
    }
  };
  walk(origin);
}

function readRecord(workspace, name) {
  const path = join(workspace, RECORD_DIR, `${name}.json`);
  assert.ok(existsSync(path), `no record was written at ${path}`);
  const record = JSON.parse(readFileSync(path, 'utf8'));
  proven('the recorded entries', record.entries, { floor: 8 });
  return record;
}

/* ═══ the round trip ═══════════════════════════════════════════════════════ */

test('the round trip is byte-exact across every awkward shape', (t) => {
  const fixture = buildOrigin('round-trip');
  const done = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.equal(
    done.status,
    0,
    `freeze failed:\n${done.stdout}\n${done.stderr}`,
  );

  const record = readRecord(fixture.workspace, 'a-set');
  const copies = join(fixture.workspace, COPIES_DIR, 'a-set');

  let compared = 0;
  for (const spec of FIXTURES) {
    const originPath = join(fixture.origin, ...spec.name.split('/'));
    const entry = record.entries.find((e) => e.path === spec.name);
    assert.ok(entry, `the record has no entry for ${JSON.stringify(spec.name)}`);
    const copyPath = join(copies, ...(entry.path_written ?? entry.path).split('/'));
    assert.ok(existsSync(copyPath), `no copy was written for ${JSON.stringify(spec.name)}`);

    const originBytes = readFileSync(originPath);
    const copyBytes = readFileSync(copyPath);
    assert.equal(
      Buffer.compare(originBytes, copyBytes),
      0,
      `the copy of ${JSON.stringify(spec.name)} is not byte-identical to the original`,
    );
    assert.equal(
      originBytes.length,
      spec.content.length,
      `the fixture ${JSON.stringify(spec.name)} was not written as intended`,
    );
    assert.equal(
      entry.sha256,
      sha256(originBytes),
      `the digest recorded for ${JSON.stringify(spec.name)} is not the digest of ` +
        'its bytes, computed here by a different implementation in another language',
    );
    assert.equal(entry.bytes, originBytes.length, `the recorded size is wrong for ${spec.name}`);
    compared += 1;
  }

  // 🔴 NON-EMPTY, PROVEN. A loop over an empty list asserts nothing and reads
  // exactly like a loop over a clean one.
  assert.equal(compared, FIXTURES.length, 'not every fixture was compared');
  assert.equal(
    record.counts.copied,
    FIXTURES.length,
    'the tool copied a different number of files from the number of fixtures',
  );
  makeRemovable(fixture.origin);
  t.diagnostic(
    `fixtures round-tripped byte-exact: ${compared} · bytes copied: ${record.counts.bytes}`,
  );
});

/* ═══ 🔴 THE FALSE-FAILURE REGRESSION ═════════════════════════════════════ */

test('the traps that produce a FALSE failure did not happen, and each one was available', (t) => {
  const fixture = buildOrigin('false-failure');
  const done = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.equal(done.status, 0, `freeze failed:\n${done.stdout}\n${done.stderr}`);
  const record = readRecord(fixture.workspace, 'a-set');

  const trapped = FIXTURES.filter((spec) => spec.normalised);
  proven('the fixtures carrying a normalisation trap', trapped, { floor: 4 });

  for (const spec of trapped) {
    const entry = record.entries.find((e) => e.path === spec.name);
    assert.ok(entry, `no entry for ${spec.name}`);
    const honest = sha256(spec.content);
    const wrong = sha256(spec.normalised);

    // The trap has to have been REACHABLE, or asserting it did not happen proves
    // nothing at all: if the two digests were equal, this assertion would pass
    // against an implementation that normalised everything.
    assert.notEqual(
      honest,
      wrong,
      `the fixture for "${spec.trap}" produces the same digest either way, so the ` +
        'assertion below cannot fail and is worthless. Fix the fixture.',
    );
    assert.equal(
      entry.sha256,
      honest,
      `the digest recorded for ${spec.name} is not the digest of its real bytes`,
    );
    assert.notEqual(
      entry.sha256,
      wrong,
      `FALSE FAILURE TRAP SPRUNG on ${spec.name}: the recorded digest is the one ` +
        `you get from ${spec.trap}. A byte-identical file would report a mismatch, ` +
        'and a false mismatch trains people to ignore the check.',
    );
  }
  makeRemovable(fixture.origin);
  t.diagnostic(`normalisation traps proven reachable and not sprung: ${trapped.length}`);
});

test('a file with a trailing newline matches through the real code path', (t) => {
  // 🔴 THE NAMED REGRESSION, ON ITS OWN, BECAUSE IT IS THE ONE THAT MATTERS MOST.
  // The shell form is sha256("$(cat f)"): command substitution strips the final
  // newline, so a byte-identical file reports a MISMATCH. It is asserted here
  // through the whole real path. Freeze writes the digest, the platform's own
  // digest tool reads the checklist, and this file computes the same value a third
  // way, rather than by reading the source and finding a binary-mode open.
  const fixture = buildOrigin('trailing-newline');
  const done = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.equal(done.status, 0, `freeze failed:\n${done.stdout}\n${done.stderr}`);

  const spec = FIXTURES.find((f) => f.name === 'trailing-newline.txt');
  assert.ok(spec, 'the trailing-newline fixture is gone; this test now proves nothing');
  assert.equal(
    spec.content[spec.content.length - 1],
    0x0a,
    'the fixture does not actually end in a newline',
  );

  const record = readRecord(fixture.workspace, 'a-set');
  const entry = record.entries.find((e) => e.path === spec.name);
  const originPath = join(fixture.origin, spec.name);
  const copyPath = join(fixture.workspace, COPIES_DIR, 'a-set', spec.name);

  assert.equal(entry.sha256, sha256File(originPath), 'the recorded digest is not the origin digest');
  assert.equal(entry.sha256, sha256File(copyPath), 'the recorded digest is not the copy digest');
  assert.equal(
    Buffer.compare(readFileSync(originPath), readFileSync(copyPath)),
    0,
    'the copy is not byte-identical',
  );

  // And the value the trap would have produced, so the match above is a fact about
  // the code rather than a coincidence.
  const stripped = spec.content.subarray(0, spec.content.length - 1);
  assert.notEqual(sha256(stripped), entry.sha256, 'the trap value equals the honest value');

  // The checklist beside the set carries the same digest, so the independent tool
  // an examiner would use agrees too.
  const checklist = readFileSync(
    join(fixture.workspace, RECORD_DIR, 'a-set.sha256'),
    'utf8',
  );
  proven('the checklist', checklist, { floor: 100 });
  assert.ok(
    checklist.includes(`${entry.sha256}  ${spec.name}`),
    'the checklist does not carry the same digest for the trailing-newline fixture',
  );
  makeRemovable(fixture.origin);
  t.diagnostic(`trailing newline: recorded, copied and listed as ${entry.sha256.slice(0, 12)}…`);
});

/* ═══ the origin comes out untouched ═══════════════════════════════════════ */

test('the origin is not mutated, asserted against a read-only fixture', (t) => {
  const fixture = buildOrigin('origin-untouched');
  proven('the origin signature', [...fixture.before.keys()], { floor: 8 });

  const done = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.equal(done.status, 0, `freeze failed on a read-only origin:\n${done.stdout}\n${done.stderr}`);

  const after = signature(fixture.origin);
  assert.deepEqual(
    [...after.keys()].sort(),
    [...fixture.before.keys()].sort(),
    'the set of entries in the origin changed',
  );
  const changed = [];
  for (const [path, before] of fixture.before) {
    const now = after.get(path);
    if (JSON.stringify(before) !== JSON.stringify(now)) {
      changed.push(`${path}: ${JSON.stringify(before)} -> ${JSON.stringify(now)}`);
    }
  }
  assert.deepEqual(
    changed,
    [],
    `the origin changed:\n  ${changed.join('\n  ')}\n` +
      'Contents, sizes, permissions and modification times must all survive. Access ' +
      'times are excluded and the reason is stated at the signature function.',
  );

  // And the tool says so itself, in the record, with the access-time caveat spelled
  // out rather than quietly left off.
  const record = readRecord(fixture.workspace, 'a-set');
  assert.equal(record.origin_unchanged.identical, true, 'the record does not claim the origin held');
  assert.match(
    record.origin_unchanged.said_plainly,
    /last opened|access/i,
    'the record claims the origin is unchanged without admitting that reading a file ' +
      'updates the time it was last opened. An over-claim in a document a lawyer may ' +
      'rely on is worse than the caveat.',
  );
  for (const entry of record.entries) {
    for (const field of ['modified_ns', 'accessed_ns', 'mode', 'owner_id', 'links_to_same_content']) {
      assert.ok(
        field in entry.before_copy,
        `the record does not carry ${field}, which a copy destroys`,
      );
    }
  }
  makeRemovable(fixture.origin);
  t.diagnostic(`origin entries compared before and after: ${fixture.before.size}`);
});

/* ═══ the independent tool agrees ═════════════════════════════════════════ */

test('the platform’s own digest tool verifies the whole set, with nothing of ours', (t) => {
  const fixture = buildOrigin('independent-tool', { readOnly: false });
  const done = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.equal(done.status, 0, `freeze failed:\n${done.stdout}\n${done.stderr}`);

  const copies = join(fixture.workspace, COPIES_DIR, 'a-set');
  const checklistPath = join(fixture.workspace, RECORD_DIR, 'a-set.sha256');
  const checked = spawnSync('shasum', ['-a', '256', '-c', checklistPath], {
    cwd: copies,
    encoding: 'utf8',
  });
  if (checked.error?.code === 'ENOENT') {
    // Three outcomes, not two: a tool that is not installed is not a failure and
    // not a pass. Say which happened rather than printing a green over nothing.
    t.diagnostic('UNVERIFIABLE on this machine: the platform digest tool is not installed');
  } else {
    const output = proven('the external tool output', `${checked.stdout}${checked.stderr}`, {
      floor: 10,
    });
    assert.equal(checked.status, 0, `the external tool reported a problem:\n${output}`);
    const okLines = output.split('\n').filter((line) => /: OK$/.test(line));
    assert.equal(
      okLines.length,
      FIXTURES.length,
      `the external tool confirmed ${okLines.length} file(s); ${FIXTURES.length} were frozen`,
    );
    t.diagnostic(`confirmed by the platform's own tool: ${okLines.length} file(s)`);
  }

  // The whole-set digest is the digest of that checklist file, so it is reproducible
  // by anybody with a digest tool and no knowledge of this project.
  const record = readRecord(fixture.workspace, 'a-set');
  assert.equal(
    record.whole_set_digest,
    sha256File(checklistPath),
    'the whole-set digest is not the digest of the checklist file, so nobody can ' +
      'reproduce it with a standard tool',
  );
});

/* ═══ the refusals ════════════════════════════════════════════════════════ */

test('it refuses to write over a frozen set', () => {
  const fixture = buildOrigin('no-overwrite', { readOnly: false });
  const first = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.equal(first.status, 0, `the first freeze failed:\n${first.stdout}`);
  const before = signature(join(fixture.workspace, COPIES_DIR, 'a-set'));

  const second = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.notEqual(second.status, 0, 'it wrote over a frozen set');
  assert.match(second.stdout, /already/i, 'the refusal does not say the set is already there');
  assert.deepEqual(
    [...signature(join(fixture.workspace, COPIES_DIR, 'a-set'))],
    [...before],
    'the first set was altered by the second attempt',
  );
});

test('it refuses a folder for the case that does not exist, rather than inventing one', () => {
  const fixture = buildOrigin('no-invented-folder', { readOnly: false });
  const missing = join(fixture.base, 'a-folder-nobody-agreed-to');
  const done = run([fixture.origin, '--into', missing], fixture);
  assert.notEqual(done.status, 0, 'it proceeded without a folder the person had confirmed');
  assert.equal(existsSync(missing), false, 'it created a folder for case files unasked');
  assert.match(done.stdout, /walk-through|does not exist/i, 'the refusal routes nowhere');
});

test('it refuses when there is nothing to read, instead of reporting a set of nothing', () => {
  // 🔴 FOUND BY RUNNING IT. The first version printed "Frozen." over a folder with
  // no plain files in it, and gave the whole set the digest of the empty string, a
  // well-known constant that means the tool read zero bytes, and indistinguishable
  // from a clean result. Green on nothing scanned is this project's headline failure.
  const base = scratch('empty-read');
  const home = join(base, 'pretend-home');
  const origin = join(base, 'nothing-here');
  const workspace = join(base, 'their-folder');
  for (const dir of [home, origin, workspace]) mkdirSync(dir, { recursive: true });
  // With a go-ahead in hand, so what is being asserted is the empty-read refusal
  // rather than the go-ahead refusing first. Two refusals in a row would make this
  // test pass for the wrong reason.
  goAhead(workspace, origin, 'freeze', { home });

  const done = run([origin, '--into', workspace, '--name', 'a-set'], { home });
  assert.notEqual(done.status, 0, 'it reported a frozen set over nothing read');
  assert.match(done.stdout, /nothing|no plain files/i, 'the refusal does not say what was wrong');
  assert.equal(
    existsSync(join(workspace, RECORD_DIR, 'a-set.json')),
    false,
    'it wrote a record for a set it did not freeze',
  );
});

test('it never writes outside the folder the person confirmed', () => {
  const fixture = buildOrigin('containment', { readOnly: false });
  const done = run([fixture.origin, '--into', fixture.workspace, '--name', 'a-set'], fixture);
  assert.equal(done.status, 0, `freeze failed:\n${done.stdout}`);

  // Everything it made is under the confirmed folder, and the confirmed folder holds
  // only the two directories the engine's constant names, plus the engine's own
  // working note, which the go-ahead fixture created by running the engine and which
  // is not this command's output. Both names come from the engine's constants.
  const top = readdirSync(fixture.workspace).sort();
  proven('the confirmed folder listing', top, { floor: 2 });
  assert.deepEqual(
    top,
    [COPIES_DIR, RECORD_DIR, STATE_FILE].sort(),
    'the confirmed folder holds something other than the two folders the engine names ' +
      'and the engine’s own working note',
  );
  // The pretend home is untouched: nothing was written there.
  assert.deepEqual(readdirSync(fixture.home), [], 'it wrote into the home directory');
});

/* ═══ nothing is left behind in the install tree ══════════════════════════ */

test('running it leaves no bytecode cache in the install tree', (t) => {
  // ⛔ Asserted in an ISOLATED copy of the scripts, and WITHOUT the environment
  // variable that would suppress the cache, so what is being tested is the setting
  // inside the program rather than the way this suite happens to launch it. Asserting
  // against the real install tree would be a race: another test in this suite imports
  // the engine as a module and legitimately creates one there.
  const base = scratch('no-bytecode');
  const install = join(base, 'install');
  const scripts = join(install, 'scripts');
  const data = join(install, 'data');
  mkdirSync(scripts, { recursive: true });
  mkdirSync(data, { recursive: true });
  // The whole install tree the command needs: the engine, the go-ahead check it
  // calls, and the contract pair the check reads through the engine. A tree missing
  // any of them cannot start, which would make this test pass on a program that
  // never ran.
  const SHIPPED = ['triage.py', 'freeze.py', 'capture_audit.py'];
  for (const name of SHIPPED) {
    writeFileSync(join(scripts, name), readFileSync(join(REPO, 'skill', 'scripts', name)));
  }
  for (const name of ['tree.json', 'tree.sha256']) {
    writeFileSync(join(data, name), readFileSync(join(REPO, 'skill', 'data', name)));
  }
  const origin = join(base, 'their-files');
  const workspace = join(base, 'their-folder');
  const home = join(base, 'pretend-home');
  mkdirSync(origin, { recursive: true });
  mkdirSync(workspace, { recursive: true });
  mkdirSync(home, { recursive: true });
  writeFileSync(join(origin, 'one.txt'), Buffer.concat([bytes('anything'), LF]));

  // ⚠️ The go-ahead is obtained through THIS tree's own copies, not the repository's:
  // the check binds to the contract the install actually holds, so a go-ahead issued
  // by another tree would be refused here. Which is the property, working.
  const isolated = spawnSync(
    'python3',
    [
      join(scripts, 'triage.py'), 'begin', '--workspace', workspace,
    ],
    { encoding: 'utf8', env: { ...process.env, HOME: home }, timeout: 60000 },
  );
  assert.equal(isolated.status, 0, `the isolated engine would not start:\n${isolated.stdout}\n${isolated.stderr}`);
  mkdirSync(join(workspace, RECORD_DIR), { recursive: true });
  const issued = spawnSync(
    'python3',
    [
      join(scripts, 'capture_audit.py'), 'audit',
      '--workspace', workspace, '--source', origin, '--operation', 'freeze',
      '--arrived-as', 'already-on-your-device',
      '--might-hold-intimate-media', 'no', '--closed-by-your-conditions', 'no',
    ],
    { encoding: 'utf8', env: { ...process.env, HOME: home }, timeout: 60000 },
  );
  assert.equal(issued.status, 0, `the isolated check issued nothing:\n${issued.stdout}\n${issued.stderr}`);

  const done = spawnSync(
    'python3',
    [join(scripts, 'freeze.py'), origin, '--into', workspace, '--name', 'a-set'],
    {
      encoding: 'utf8',
      env: { ...process.env, HOME: home },
      timeout: 60000,
    },
  );
  assert.equal(done.status, 0, `freeze failed in the isolated tree:\n${done.stdout}\n${done.stderr}`);
  const left = readdirSync(scripts).sort();
  assert.deepEqual(
    left,
    [...SHIPPED].sort(),
    `it left something in the install tree: ${left.join(', ')}`,
  );
  t.diagnostic(`isolated install tree after a real run: ${left.join(', ')}`);
});
