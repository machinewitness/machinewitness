/**
 * tests/commands/verify.test.mjs: three outcomes, counted separately, and a green
 * that says how many files it opened.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THE TWO THINGS THIS FILE EXISTS TO MAKE IMPOSSIBLE.
 *
 *  1. A GREEN OVER NOTHING READ. A checker that opens no files finds no mismatch
 *     and prints exactly the same green as a checker over a clean set. This project
 *     has shipped that, inside the wrapper written to report that very failure,
 *     over an already-published repository with green continuous integration. So
 *     every assertion here reads the COUNT out of the output and compares it with a
 *     number derived from the fixture, and the refusal paths are asserted to carry
 *     no success marker at all.
 *
 *  2. TWO OUTCOMES INSTEAD OF THREE. Folding *not checkable* into failure poisons
 *     the result permanently and the check gets switched off; folding it into
 *     success is a lie. One run below produces all three at once, a flipped byte, a
 *     file that cannot be reached, and something in the folder the record does not
 *     list, and the test asserts each is counted on its own rather than summed.
 *
 * ⚠️ FIXTURES ASSEMBLED AT RUN TIME, and the digests computed here by a different
 * implementation in another language from the one under test. A tool is not a
 * witness to its own output.
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
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPO, goAhead, isNegated, proven, scratch, workspaceDirs } from '../rails/_rails.mjs';

const FREEZE = join(REPO, 'skill', 'scripts', 'freeze.py');
const VERIFY = join(REPO, 'skill', 'scripts', 'verify.py');

const EXIT = { ok: 0, rejected: 2, refused: 3, mismatch: 5, differentProfile: 6 };

// ⛔ The two folder names come from the engine's own constant by way of the shared
// helper, never typed here.
const [COPIES_DIR, RECORD_DIR] = workspaceDirs();

/* ── plumbing ──────────────────────────────────────────────────────────────── */

const bytes = (text) => Buffer.from(new TextEncoder().encode(text));
const LF = Buffer.from([0x0a]);
const BOM = Buffer.from([0xef, 0xbb, 0xbf]);
const COMBINING_ACUTE = String.fromCodePoint(0x0301);

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function sha256File(path) {
  return sha256(readFileSync(path));
}

function python(script, args, home) {
  return spawnSync('python3', [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' },
    timeout: 60000,
  });
}

/**
 * A frozen set built by the real command, over fixtures whose shapes are the ones
 * a normaliser would rewrite. Returns everything a test needs to poke at it.
 */
const FILES = [
  { name: 'trailing-newline.txt', content: Buffer.concat([bytes('one'), LF, bytes('two'), LF]) },
  { name: 'no-trailing-newline.txt', content: bytes('nothing after the last word') },
  { name: 'byte-order-mark.txt', content: Buffer.concat([BOM, bytes('marked'), LF]) },
  { name: `re${COMBINING_ACUTE}sume${COMBINING_ACUTE}.txt`, content: Buffer.concat([bytes('a name stored one way'), LF]) },
  { name: 'plain.txt', content: Buffer.concat([bytes('plain'), LF]) },
  { name: 'empty.dat', content: Buffer.alloc(0) },
];

function freezeASet(label, name = 'a-set') {
  const base = scratch(label);
  const home = join(base, 'pretend-home');
  const origin = join(base, 'their-files');
  const workspace = join(base, 'their-folder');
  for (const dir of [home, origin, workspace]) mkdirSync(dir, { recursive: true });

  proven('the fixture set', FILES, { floor: 5 });
  for (const file of FILES) writeFileSync(join(origin, file.name), file.content);

  // 🔴 TWO GO-AHEADS, ONE PER OPERATION, BECAUSE THE BINDING IS PER OPERATION. One
  // for copying that source, one for checking this folder. Both issued by the real
  // check over the real engine's real working note. Nothing here writes either
  // file. A permission to copy is provably not a permission to check, which is
  // asserted in tests/rails/capture-audit-binding.test.mjs rather than here.
  goAhead(workspace, origin, 'freeze', { home });
  goAhead(workspace, workspace, 'verify', { home });

  const done = python(FREEZE, [origin, '--into', workspace, '--name', name], home);
  assert.equal(done.status, 0, `freeze failed while building the fixture:\n${done.stdout}\n${done.stderr}`);

  const copies = join(workspace, COPIES_DIR, name);
  const recordPath = join(workspace, RECORD_DIR, `${name}.json`);
  const checklistPath = join(workspace, RECORD_DIR, `${name}.sha256`);
  const record = JSON.parse(readFileSync(recordPath, 'utf8'));
  proven('the recorded entries', record.entries, { floor: 5 });
  return { base, home, origin, workspace, copies, recordPath, checklistPath, record, name, frozen: done.stdout };
}

/** Make a frozen copy writable so a test can damage it on purpose. */
function unlock(path) {
  chmodSync(path, 0o600);
  return path;
}

/** Every file under a root, with its digest. Used to prove verify changed nothing. */
function treeSignature(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1,
    )) {
      const child = join(dir, entry.name);
      const rel = relative(root, child).split(sep).join('/');
      if (entry.isDirectory()) {
        out.push([rel, 'dir', lstatSync(child).mode]);
        walk(child);
      } else {
        out.push([rel, sha256File(child), lstatSync(child).mode]);
      }
    }
  };
  walk(root);
  return out;
}

/**
 * The counts out of the summary block, read from the output rather than assumed.
 * ⛔ Throws on a block it cannot find, so a test can never compare against a number
 * it silently failed to parse. An absent count and a zero count are the same thing
 * to a naive reader, which is the failure this whole command is written against.
 */
function counts(output) {
  const text = proven('the verify output', output, { floor: 200 });
  const tail = text.slice(text.lastIndexOf('Across '));
  assert.ok(tail.length > 100, 'the output carries no summary block at all');
  const read = (label) => {
    const found = new RegExp(`^\\s*${label}\\s+(\\d+)\\s*$`, 'm').exec(tail);
    assert.ok(found, `the summary block has no count for "${label}":\n${tail}`);
    return Number(found[1]);
  };
  return {
    sets: Number(/Across (\d+) set/.exec(tail)[1]),
    opened: read('files opened and digested'),
    bytes: read('bytes read'),
    verified: read('verified'),
    mismatched: read('mismatched'),
    unverifiable: read('not checkable'),
    unexpected: read('in the folder, not recorded'),
    defects: read('defects in the record'),
  };
}

/* ═══ a clean set ═════════════════════════════════════════════════════════ */

test('a clean set verifies, and the green states how many files it opened', (t) => {
  const set = freezeASet('clean');
  const done = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(done.status, EXIT.ok, `verify did not report clean:\n${done.stdout}`);

  const got = counts(done.stdout);
  assert.equal(got.sets, 1, 'it did not report exactly one set');
  assert.equal(got.opened, FILES.length, 'it opened a different number of files from the fixture');
  assert.equal(got.verified, FILES.length, 'not every file was verified');
  assert.equal(got.mismatched, 0, 'a clean set reported a mismatch');
  assert.equal(got.unverifiable, 0, 'a clean set reported something not checkable');
  assert.equal(got.unexpected, 0, 'a clean set reported an entry the record does not list');
  assert.equal(got.defects, 0, 'a clean set reported a defect in its own record');
  assert.equal(
    got.bytes,
    FILES.reduce((total, file) => total + file.content.length, 0),
    'the bytes it says it read are not the bytes in the fixture',
  );

  // 🔴 THE COUNT IS IN THE SUCCESS SENTENCE ITSELF, not only in a table above it. A
  // green with no number in it is the one this project has already shipped.
  assert.match(
    done.stdout,
    new RegExp(`✅[^\\n]*\\b${FILES.length}\\b`),
    'the success line does not state how many files were opened. A green that does ' +
      'not say what it read is worth nothing, and that is not a style preference here',
  );
  assert.match(
    done.stdout,
    /does not say the set is clean/i,
    'the success line does not say what it is NOT claiming',
  );
  t.diagnostic(`clean set: opened ${got.opened}, verified ${got.verified}, bytes ${got.bytes}`);
});

test('verify creates nothing, not a file, not a folder, not a mode change', () => {
  const set = freezeASet('read-only-checker');
  const before = treeSignature(set.workspace);
  proven('the folder signature', before, { floor: 6 });
  const done = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(done.status, EXIT.ok, `verify failed:\n${done.stdout}`);
  assert.deepEqual(
    treeSignature(set.workspace),
    before,
    'verify altered the folder it was checking. A checker that can write is a checker ' +
      'that can be blamed for a change',
  );
  assert.deepEqual(readdirSync(set.home), [], 'verify wrote into the home directory');
});

/* ═══ 🔴 one flipped byte, and all three outcomes at once ═════════════════ */

test('a single flipped byte is detected, and all three outcomes are counted separately', (t) => {
  const set = freezeASet('three-outcomes');

  // (1) one byte, in one file, flipped. Nothing else about it changes.
  const target = join(set.copies, 'plain.txt');
  const original = readFileSync(target);
  const damaged = Buffer.from(original);
  damaged[0] ^= 0x01;
  assert.equal(damaged.length, original.length, 'the fixture changed the length, not one byte');
  assert.notEqual(sha256(damaged), sha256(original), 'the flip did not change the digest');
  writeFileSync(unlock(target), damaged);

  // (2) something the checker cannot reach at all.
  const removed = join(set.copies, 'byte-order-mark.txt');
  rmSync(unlock(removed));

  // (3) something in the folder that the record does not list. The count tripwire.
  //     The commonest real cause is the operating system writing into the folder.
  writeFileSync(join(set.copies, '.DS_Store'), Buffer.from([0x00, 0x01]));

  const done = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(
    done.status,
    EXIT.mismatch,
    `a flipped byte did not produce the mismatch exit code:\n${done.stdout}`,
  );

  const got = counts(done.stdout);
  assert.equal(got.mismatched, 1, 'the flipped byte was not reported as exactly one mismatch');
  assert.equal(got.unverifiable, 1, 'the unreachable file was not counted on its own');
  assert.equal(got.unexpected, 1, 'the extra file in the folder was not counted on its own');
  assert.equal(
    got.verified,
    FILES.length - 2,
    'the files that were fine were not all still reported as verified',
  );
  assert.equal(
    got.opened,
    FILES.length - 1,
    'the number of files it says it opened does not match what was reachable',
  );

  // ⛔ AND THE THREE ARE NOT SUMMED. A single "failed" number would satisfy every
  // assertion above if the labels were interchangeable, so the labels are asserted.
  for (const label of ['verified', 'mismatched', 'not checkable']) {
    assert.ok(
      new RegExp(`^\\s*${label}\\s+\\d+\\s*$`, 'm').test(done.stdout),
      `the output has no separate count labelled "${label}"`,
    );
  }

  // The mismatched file is named, with the most likely cause and the prohibition.
  assert.match(done.stdout, /plain\.txt/, 'the mismatched file is not named');
  assert.match(
    done.stdout,
    /do not edit the frozen set/i,
    'a red result does not tell the person not to edit the frozen set. Their first ' +
      'reaction is panic and their second is to fix it, which is unrecoverable',
  );
  assert.match(
    done.stdout,
    /every single red was a (defect|record defect)/i,
    'a red result does not say that the likeliest cause is the record rather than the ' +
      'evidence. Reporting a state without reporting what it usually means is how a ' +
      'person concludes they have been tampered with',
  );
  assert.match(
    done.stdout,
    /⛔ Do not delete them/i,
    'the extra entry in the folder is reported without telling the person not to ' +
      'delete it. Removing anything from a frozen set is itself a change to it',
  );
  t.diagnostic(
    `three outcomes: verified ${got.verified} · mismatched ${got.mismatched} · ` +
      `not checkable ${got.unverifiable} · unexpected ${got.unexpected}`,
  );
});

test('the trailing-newline file still verifies through the whole real path', () => {
  // 🔴 THE FALSE-FAILURE REGRESSION, ON THE VERIFY SIDE. The shell form of the bug
  // reports a mismatch on a byte-identical file, so the assertion is not merely that
  // verify was quiet, it is that the file whose bytes end in a newline is counted in
  // the VERIFIED total and never in the mismatched one.
  const set = freezeASet('trailing-newline-through-verify');
  const spec = FILES.find((f) => f.name === 'trailing-newline.txt');
  assert.equal(
    spec.content[spec.content.length - 1],
    0x0a,
    'the fixture does not end in a newline, so this proves nothing',
  );
  const stripped = spec.content.subarray(0, spec.content.length - 1);
  assert.notEqual(
    sha256(stripped),
    sha256(spec.content),
    'the trap value equals the honest value, so this test cannot fail',
  );

  const entry = set.record.entries.find((e) => e.path === spec.name);
  assert.equal(entry.sha256, sha256(spec.content), 'the recorded digest is the stripped one');

  const done = python(VERIFY, ['--into', set.workspace, '--name', set.name], set.home);
  assert.equal(done.status, EXIT.ok, `verify reported a problem on a clean set:\n${done.stdout}`);
  const got = counts(done.stdout);
  assert.equal(got.mismatched, 0, 'a byte-identical file with a trailing newline was reported as changed');
  assert.equal(got.verified, FILES.length, 'the trailing-newline file was not counted as verified');
});

/* ═══ a name spelled a different way is not a mismatch ════════════════════ */

test('a name stored in a different unicode form verifies, and is called out as a spelling difference', (t) => {
  const set = freezeASet('name-form');
  const recorded = FILES.find((f) => f.name.includes(COMBINING_ACUTE)).name;
  const other = recorded.normalize('NFC');
  assert.notEqual(
    Buffer.from(recorded).toString('hex'),
    Buffer.from(other).toString('hex'),
    'the two unicode forms of the fixture name are the same bytes, so the drift case ' +
      'cannot be built at all. Fix the fixture rather than the assertion',
  );

  const from = join(set.copies, recorded);
  const to = join(set.copies, other);
  renameSync(from, to);
  const onDisk = readdirSync(set.copies);
  proven('the copies listing after the rename', onDisk, { floor: 5 });
  const stored = onDisk.find((n) => n.normalize('NFC') === other);
  assert.ok(stored, 'the renamed file is gone from the folder entirely');

  const done = python(VERIFY, ['--into', set.workspace], set.home);
  const got = counts(done.stdout);

  // The property under test is that the lookup is insensitive to the form, so the
  // file is FOUND and verified rather than reported missing or changed.
  assert.equal(got.mismatched, 0, 'a spelling difference was reported as a mismatch');
  assert.equal(got.unverifiable, 0, 'a spelling difference was reported as unreachable');
  assert.equal(got.verified, FILES.length, 'the renamed file was not verified');

  // Three outcomes, not two: on a filesystem that stores both forms as one name the
  // drift cannot be constructed, so say which branch ran rather than passing quietly.
  if (stored !== recorded) {
    assert.equal(done.status, EXIT.ok, `verify did not report clean:\n${done.stdout}`);
    assert.match(
      done.stdout,
      /not a sign that anything was altered/i,
      'the spelling difference was not called out with the words that stop a person ' +
        'reading it as tampering. A name-form failure is indistinguishable from ' +
        'tampering to anybody who has not met it before',
    );
    t.diagnostic(`this filesystem stores both forms separately. The drift case was constructed`);
  } else {
    t.diagnostic(
      'UNVERIFIABLE on this filesystem: it stores both unicode forms as one name, so a ' +
        'name-form difference cannot be constructed here. The form-insensitive lookup ' +
        'is still asserted above.',
    );
  }
});

/* ═══ findings about the record itself ════════════════════════════════════ */

test('a changed checklist is reported as a defect in the record, before anything else', () => {
  const set = freezeASet('checklist-changed');
  const before = readFileSync(set.checklistPath);
  writeFileSync(unlock(set.checklistPath), Buffer.concat([before, bytes('# a trailing note'), LF]));

  const done = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(done.status, EXIT.mismatch, `a changed checklist was not reported:\n${done.stdout}`);
  const got = counts(done.stdout);
  assert.ok(got.defects >= 1, 'the changed checklist was not counted as a defect in the record');
  assert.equal(got.mismatched, 0, 'a changed checklist was reported as changed evidence');
  assert.match(
    done.stdout,
    /Defects in the record itself. Read these first/,
    'the record defects are not put in front of everything else',
  );
  assert.match(done.stdout, /Do not repair/i, 'it does not say to leave the record alone');
});

test('a record with no note of the answer at freezing time is not a pass', () => {
  // ⛔ The fail-closed direction. With nothing to compare against, "the same as last
  // time" cannot be established, and a green quietly meaning "there was no last
  // time" is the vacuous pass this command exists to prevent.
  const set = freezeASet('no-baseline');
  const record = JSON.parse(readFileSync(set.recordPath, 'utf8'));
  delete record.baseline;
  writeFileSync(unlock(set.recordPath), bytes(JSON.stringify(record, null, 2)));

  const done = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(
    done.status,
    EXIT.differentProfile,
    `a record with no profile was treated as a pass:\n${done.stdout}`,
  );
  const got = counts(done.stdout);
  assert.equal(got.verified, FILES.length, 'the files themselves were not verified');
  assert.equal(got.mismatched, 0, 'a missing profile was reported as changed evidence');
  assert.match(done.stdout, /nothing to compare against/i, 'it does not say why this is not a pass');
});

test('a damaged record is refused rather than repaired or guessed at', () => {
  const set = freezeASet('damaged-record');
  writeFileSync(unlock(set.recordPath), bytes('{ this is not readable as a record'));
  const done = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(done.status, EXIT.refused, `a damaged record did not refuse:\n${done.stdout}`);
  assert.doesNotMatch(done.stdout, /✅/, 'a refusal carried a success marker');
  assert.match(done.stdout, /lawyer/i, 'the refusal routes nowhere');
});

/* ═══ fails closed ════════════════════════════════════════════════════════ */

test('a folder with no records refuses, and prints no success marker', () => {
  const base = scratch('nothing-frozen');
  const home = join(base, 'pretend-home');
  const workspace = join(base, 'their-folder');
  mkdirSync(home, { recursive: true });
  mkdirSync(join(workspace, RECORD_DIR), { recursive: true });
  mkdirSync(join(workspace, COPIES_DIR), { recursive: true });
  // With a go-ahead, so the refusal under test is the one about nothing being read
  // rather than the go-ahead firing first. A test that passes on the wrong refusal
  // is asserting nothing about the thing it names.
  goAhead(workspace, workspace, 'verify', { home });

  const done = python(VERIFY, ['--into', workspace], home);
  assert.equal(done.status, EXIT.refused, `an empty folder did not refuse:\n${done.stdout}`);
  assert.doesNotMatch(done.stdout, /✅/, 'a refusal over nothing read carried a success marker');
  assert.match(
    done.stdout,
    /not going to print a clean result over nothing read/i,
    'the refusal does not say why reporting clean over nothing is the thing being refused',
  );
});

test('a file in the record folder that is not a record is passed over, and said to be', () => {
  // Other things live in that folder legitimately. Reporting on a file whose shape it
  // does not understand would be worse than passing over it, but passing over it
  // SILENTLY is how a set goes unchecked without anybody noticing.
  const set = freezeASet('unrecognised-neighbour');
  writeFileSync(
    join(set.workspace, RECORD_DIR, 'something-else.json'),
    bytes('{"not":"a record of a frozen set"}'),
  );
  const done = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(done.status, EXIT.ok, `verify failed:\n${done.stdout}`);
  assert.equal(counts(done.stdout).sets, 1, 'it did not still check the one real set');
  assert.match(done.stdout, /passed over/i, 'it passed over a file without saying so');
  assert.match(done.stdout, /something-else\.json/, 'it did not name the file it passed over');
});

test('naming a set that is not there refuses, rather than reporting an empty pass', () => {
  const set = freezeASet('no-such-set');
  const done = python(VERIFY, ['--into', set.workspace, '--name', 'not-a-set-here'], set.home);
  assert.equal(done.status, EXIT.refused, `a missing set did not refuse:\n${done.stdout}`);
  assert.doesNotMatch(done.stdout, /✅/, 'a refusal carried a success marker');
  assert.match(
    done.stdout,
    /not going to work one out from the copies/i,
    'it does not say why it will not rebuild a record from whatever is in the folder, ' +
      'a list built from the folder would agree with itself no matter what had happened',
  );
});

/* ═══ what a person actually reads ════════════════════════════════════════ */

test('nothing either command shows a person carries the internal vocabulary', (t) => {
  // ⛔ THE FOLDER LISTING IS A SCREEN, and it is the one screen that cannot be taken
  // back once it is on somebody's disk. A reader opened their own case folder, found
  // the internal word for the record sitting in it, and read it as their children
  // being taken. So the names are checked before the words are.
  const banned = ['manifest', 'hash', 'custody', 'layer', 'classification', 'adversarial'];
  const set = freezeASet('vocabulary');
  const checked = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(checked.status, EXIT.ok, `verify failed:\n${checked.stdout}`);

  const surfaces = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = join(dir, entry.name);
      surfaces.push({ label: `a name in their folder: ${relative(set.workspace, child)}`, text: entry.name });
      if (entry.isDirectory()) walk(child);
    }
  };
  walk(set.workspace);
  // Only the records are read as text: a copy is the person's own file and its
  // contents are none of this check's business.
  for (const name of readdirSync(join(set.workspace, RECORD_DIR))) {
    surfaces.push({
      label: `their folder: ${name}`,
      text: readFileSync(join(set.workspace, RECORD_DIR, name), 'utf8'),
    });
  }
  surfaces.push({ label: 'what freeze printed', text: set.frozen });
  surfaces.push({ label: 'what verify printed', text: checked.stdout });

  proven('the surfaces a person reads', surfaces, { floor: 8 });
  const hits = [];
  for (const surface of surfaces) {
    // ⚠️ The fixture names are the person's own filenames and are not this tool's
    // wording, so a banned word inside one would be a false failure. None of the
    // fixtures carries one, asserted just below, so nothing is excluded here.
    const low = surface.text.toLowerCase();
    for (const word of banned) {
      if (low.includes(word)) hits.push(`${surface.label}: contains "${word}"`);
    }
    if (/rail[\s_-]*\d/i.test(surface.text)) hits.push(`${surface.label}: shows a rail number`);
  }
  assert.deepEqual(hits, [], `the internal vocabulary reached a person:\n  ${hits.join('\n  ')}`);

  // 🔴 THE CHECK IS KNOWN TO FIRE. A word scan that has never matched anything is
  // indistinguishable from one looking for the wrong words.
  const planted = [{ label: 'PLANTED', text: 'the manifest hash is in the custody layer' }];
  const plantedHits = [];
  for (const word of banned) {
    if (planted[0].text.includes(word)) plantedHits.push(word);
  }
  assert.ok(plantedHits.length >= 4, 'the word scan does not fire on a planted violation');
  assert.ok(
    FILES.every((file) => !banned.some((word) => file.name.toLowerCase().includes(word))),
    'a fixture filename carries a banned word, which would make the scan above ' +
      'report a false failure',
  );
  t.diagnostic(`surfaces scanned: ${surfaces.length} · planted words caught: ${plantedHits.length}`);
});

/**
 * Shapes that would turn a record into a verdict. ⚠️ A LINE THAT FORBIDS A PHRASE
 * IS NOT THE PHRASE, and that exclusion is load-bearing here rather than a
 * convenience: both commands are REQUIRED to say "it is not a score and it is not a
 * strength", and the fence is required to say the line is "rather than a judgement
 * about your case". A scan without the rule reports both, which is a false failure
 * on the exact sentences the doctrine demands. The shared rule is used so this file
 * cannot drift from the rail tests, and a bare violation is planted below and
 * asserted to still fire.
 *
 * ⛔ The first draft of this test used a bare `your case` and a bare `score`, and it
 * fired on the two required sentences. The fix is the pattern, never an exemption
 * for the file that carries them.
 */
// ⚠️ A COUNT SPELLED OUT IS STILL A COUNT. The first draft matched digits only and
// waved "Four of six records support you" straight through, found by the planted
// line below, which is what the planted lines are for.
const NUMBER = String.raw`(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)`;

const VERDICT = [
  { name: 'a strength claim', re: /\b(?:strengthens?|weakens?|stronger|strongest|weaker|weakest)\b/i },
  { name: 'a claim about their case', re: /\byour case (?:looks|is|was|will|seems|stands)\b/i },
  { name: 'a proof claim', re: /\b(?:proves?|proven|proof that)\b/i },
  { name: 'a prediction', re: /\blikel(?:y|ihood) (?:to|of) (?:win|succeed|be)\b/i },
  { name: 'a percentage', re: /\b\d+\s*%/ },
  { name: 'a score', re: /\bscore[ds]?\b/i },
  { name: 'a ranking', re: /\brank(?:ed|ing|s)?\b/i },
  {
    name: 'an aggregate over sources',
    re: new RegExp(String.raw`\b${NUMBER}\s+of\s+${NUMBER}\s+(?:records?|sources?)\b`, 'i'),
  },
  {
    name: 'sources agreeing',
    re: new RegExp(String.raw`\b${NUMBER}\s+(?:records?|sources?)\s+(?:agree|support|confirm)`, 'i'),
  },
];

function verdictHits(text, label) {
  const hits = [];
  for (const [index, line] of text.split('\n').entries()) {
    for (const { name, re } of VERDICT) {
      re.lastIndex = 0;
      const found = re.exec(line);
      if (!found) continue;
      if (isNegated(line, found.index)) continue;
      hits.push(`${label}:${index + 1} [${name}] ${line.trim().slice(0, 120)}`);
    }
  }
  return hits;
}

test('neither command claims a result, a score, or a strength', (t) => {
  const set = freezeASet('no-verdict');
  const checked = python(VERIFY, ['--into', set.workspace], set.home);
  assert.equal(checked.status, EXIT.ok, `verify failed:\n${checked.stdout}`);
  proven('both outputs', `${set.frozen}\n${checked.stdout}`, { floor: 1000 });

  const hits = [
    ...verdictHits(set.frozen, 'what freeze printed'),
    ...verdictHits(checked.stdout, 'what verify printed'),
  ];
  assert.deepEqual(
    hits,
    [],
    `something printed suggests a result rather than a record:\n  ${hits.join('\n  ')}`,
  );

  // 🔴 THE CHECK IS KNOWN TO FIRE, on bare phrasings with no refusal in front of
  // them. Without this the silence above would be indistinguishable from a scan
  // whose exclusion swallows everything.
  const planted = [
    'Your case looks good on this evidence.',
    'Four of six records support you.',
    'coverage: 67% across the set',
    'ranked by strength, best first',
    'This proves you were somewhere else.',
    'a score of 4 out of 6',
  ];
  const missed = planted.filter((line) => verdictHits(line, 'PLANTED').length === 0);
  assert.deepEqual(
    missed,
    [],
    `the verdict scan did not fire on: ${missed.join(' | ')}. An exclusion that ` +
      'swallows a bare violation makes the silence above meaningless.',
  );

  // ⚠️ AND THE MUTATION SET, WHICH THIS SCAN PROVABLY MISSES. Kept because a check
  // over wording cannot be complete, and a scan whose every evasion is caught claims
  // a completeness it does not have. ⛔ If all of these start being caught, this
  // assertion fails and the set has to be replaced with harder ones. The point is
  // that the limit stays stated rather than quietly disappearing.
  const evasions = [
    'The picture that emerges here is a favourable one.',
    'Most of what you have points the same way.',
    'There is a good deal here that helps.',
  ];
  const stillMissed = evasions.filter((line) => verdictHits(line, 'EVASION').length === 0);
  assert.ok(
    stillMissed.length > 0,
    'every semantic evasion is now caught, which means this scan is claiming a ' +
      'completeness a wording check cannot have. Replace the set with harder ones ' +
      'rather than deleting it.',
  );

  // And both of them say, unprompted, what the result does not establish.
  for (const [what, text] of [['freeze', set.frozen], ['verify', checked.stdout]]) {
    assert.match(
      text,
      /says the bytes are the bytes/i,
      `${what} does not say what its result does not establish. It has to be said ` +
        'unprompted, not on request',
    );
    assert.match(text, /for a lawyer to judge/i, `${what} does not route the meaning to a lawyer`);
  }
  t.diagnostic(
    `verdict shapes checked: ${VERDICT.length} · planted violations caught: ` +
      `${planted.length} · evasions this scan still misses: ${stillMissed.length} of ` +
      `${evasions.length}`,
  );
});
