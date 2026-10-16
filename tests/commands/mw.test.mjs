/**
 * tests/commands/mw.test.mjs. The terminal front door, judged on what it DID.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHAT THIS FILE EXISTS TO MAKE IMPOSSIBLE.
 *
 *  1. A COMMAND THAT CANNOT RUN. The package declared a command called `mw` and the
 *     file it pointed at did not exist, so installing the package produced a command
 *     that failed on every invocation. Nothing noticed, because nothing executed it.
 *     Every assertion here runs the real launcher.
 *
 *  2. A REFUSAL THAT ARRIVES AS A ZERO. The engines encode distinct exit codes so
 *     that a rejected answer, a refusal and a mistyped command can be told apart by
 *     whatever called them. A launcher that swallowed a non-zero would turn a gate
 *     into a phrase, so the codes are not merely asserted to be non-zero, they are
 *     compared with the code the SAME program returns when it is run directly.
 *     Unchanged means equal, and equal is checkable.
 *
 *  3. A MENU. No argument runs `init`, and a command table is never printed by
 *     default: a table is a recall interface and acute stress removes recall first.
 *     The strongest available form of that assertion is byte-identity, what the
 *     bare command prints is exactly what the engine prints, so the launcher
 *     provably added nothing at all.
 *
 *  4. A STACK TRACE IN FRONT OF A FRIGHTENED PERSON. A missing interpreter is the
 *     most likely real failure on a stranger's machine, and it is a first-class
 *     refusal here: plain words, a route out, and an explicit statement that nothing
 *     has been read or changed.
 *
 * ⚠️ NOTHING IS RUN IN THE REPOSITORY. The engine keeps its session in the folder it
 * is standing in until a person confirms one, so every run below is in a throwaway
 * directory with a throwaway home. A test that ran it here would leave somebody's
 * session file in the source tree.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPO, isNegated, proven, readRepo, scan, scratch } from '../rails/_rails.mjs';
import { barredPatterns } from '../rails/_manifests.mjs';

/* ── what the package says it installs ─────────────────────────────────────── */

const pkg = JSON.parse(proven('package.json', readRepo('package.json'), { floor: 100 }));
const LAUNCHER_REL = proven('the command the package declares', Object.keys(pkg.bin ?? {}), {
  floor: 1,
}).map((name) => pkg.bin[name])[0];
const LAUNCHER = join(REPO, ...LAUNCHER_REL.split('/'));

const ENGINE = join(REPO, 'skill', 'scripts', 'triage.py');
const FREEZE = join(REPO, 'skill', 'scripts', 'freeze.py');
const VERIFY = join(REPO, 'skill', 'scripts', 'verify.py');
const AUDIT = join(REPO, 'skill', 'scripts', 'capture_audit.py');

/** Every command the declaration names, in declaration order. */
const DECLARED = proven(
  'the declared commands',
  JSON.parse(readRepo('skill/allowlist.json')).commands ?? [],
  { floor: 11 },
);
const NAMES = DECLARED.map((command) => command.name);

/* ── plumbing ──────────────────────────────────────────────────────────────── */

let runs = 0;

/**
 * Run the launcher. `path` replaces the search path, which is how the missing
 * interpreter is produced. The launcher itself is started by absolute path, so it
 * still runs while `python3` becomes unfindable.
 */
function mw(args, { cwd, home, path = null } = {}) {
  const env = { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' };
  if (path !== null) env.PATH = path;
  runs += 1;
  return spawnSync(process.execPath, [LAUNCHER, ...args], {
    cwd,
    encoding: 'utf8',
    env,
    timeout: 60000,
  });
}

/** The same thing without the launcher: the program, run directly. */
function direct(script, args, { cwd, home }) {
  return spawnSync('python3', [script, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' },
    timeout: 60000,
  });
}

/** A throwaway place to stand, with a throwaway home. */
function somewhere(name) {
  const root = scratch(`mw-${name}`);
  const home = scratch(`mw-${name}-home`);
  return { cwd: root, home };
}

/* ── it exists, and it is what the package points at ──────────────────────── */

test('the package names a launcher and the file is really there', (t) => {
  assert.ok(
    existsSync(LAUNCHER),
    `${LAUNCHER_REL} does not exist, so the declared command cannot run at all. That ` +
      'was the state of this repository before this file was written, and nothing ' +
      'noticed because nothing executed it.',
  );
  proven(LAUNCHER_REL, readRepo(LAUNCHER_REL), { floor: 1000 });
  t.diagnostic(`the declared command runs ${LAUNCHER_REL}`);
});

/* ── the exit codes are the engines', not the launcher's ──────────────────── */

/** A module-level integer constant, out of a program's own source. */
function intConstant(rel, name, pattern) {
  const source = proven(rel, readRepo(rel), { floor: 500 });
  const found = pattern.exec(source);
  assert.ok(found, `${rel} no longer declares ${name} as a plain integer on one line`);
  return Number(found[1]);
}

test('the launcher’s exit codes are read off the programs it starts, not invented', (t) => {
  // 🔴 BOTH SIDES READ FROM SOURCE. A test that typed 3 and 64 would agree with the
  // launcher by construction and would say nothing about whether the launcher agrees
  // with the engines, which is the only property that matters, because a caller tells
  // a refusal from a mistyped command by the number alone.
  const engines = ['skill/scripts/triage.py', 'skill/scripts/freeze.py', 'skill/scripts/verify.py'];
  const refused = new Set();
  const usage = new Set();
  for (const rel of engines) {
    refused.add(intConstant(rel, 'EXIT_REFUSED', /^EXIT_REFUSED\s*=\s*(\d+)/m));
    usage.add(intConstant(rel, 'EXIT_USAGE', /^EXIT_USAGE\s*=\s*(\d+)/m));
  }
  assert.equal(refused.size, 1, `the engines disagree on the refusal code: ${[...refused]}`);
  assert.equal(usage.size, 1, `the engines disagree on the usage code: ${[...usage]}`);

  const launcherRefused = intConstant(
    LAUNCHER_REL,
    'EXIT_REFUSED',
    /^const EXIT_REFUSED\s*=\s*(\d+);/m,
  );
  const launcherUsage = intConstant(LAUNCHER_REL, 'EXIT_USAGE', /^const EXIT_USAGE\s*=\s*(\d+);/m);
  assert.equal(launcherRefused, [...refused][0], 'the launcher has its own refusal code');
  assert.equal(launcherUsage, [...usage][0], 'the launcher has its own usage code');
  t.diagnostic(
    `refusal ${launcherRefused} and usage ${launcherUsage}, agreed across ` +
      `${engines.length} programs and the launcher`,
  );
});

/**
 * 🔴 "THIS REALLY IS THE ENGINE'S FIRST SCREEN", IN ONE PLACE.
 *
 * ⚠️ This was a phrase quoted out of the opening paragraph — `two true things` —
 * written into FOUR separate assertions in this file. Rewording that paragraph
 * broke all four at once, which is the drift class this repository has shipped
 * twice: a prose copy of something authored somewhere else.
 *
 * So it is structural now. The counter is `1 / ~N` on the first screen and both
 * of its numbers are derived from the contract, so this cannot drift with the
 * copy — and it is a STRONGER claim than the phrase was, because a phrase could
 * survive on a screen that was not the first one.
 */
const FIRST_SCREEN = /^\s*1 \/ ~\d+\s*$/m;

/* ── 1. NO ARGUMENT REACHES `init`, AND ADDS NOTHING ──────────────────────── */

const bareRun = (() => {
  const place = somewhere('bare');
  return { place, run: mw([], place) };
})();

const directRun = (() => {
  const place = somewhere('direct');
  return { place, run: direct(ENGINE, ['begin'], place) };
})();

test('no argument reaches the engine, and prints exactly what the engine prints', (t) => {
  assert.equal(
    bareRun.run.status,
    0,
    `the bare command failed:\n${bareRun.run.stdout}\n${bareRun.run.stderr}`,
  );
  proven('what the bare command printed', bareRun.run.stdout, { floor: 500 });
  assert.equal(
    directRun.run.status,
    0,
    `the engine would not start directly:\n${directRun.run.stdout}\n${directRun.run.stderr}`,
  );

  // 🔴 BYTE-IDENTICAL, from two different directories. This is the whole "it is a
  // launcher, not logic" claim in one assertion: the launcher added no banner, no
  // menu, no summary and no reordering, and it did not leak the directory it was run
  // from into the output either.
  assert.equal(
    bareRun.run.stdout,
    directRun.run.stdout,
    'the bare command and the engine print different things, so the launcher is ' +
      'adding or removing something. It is a relay: the engine owns every word a ' +
      'person reads.',
  );

  // …and it really is the first screen, not an empty success.
  assert.match(
    bareRun.run.stdout,
    FIRST_SCREEN,
    'the bare command did not reach the engine’s first screen',
  );
  // …carrying the half of the privacy statement that RAIL 10 requires. ⛔ Checked
  // by MEANING, not by the paragraph's wording: the first screen exists to say
  // this, so a first screen that had stopped saying it would be the defect.
  assert.match(
    bareRun.run.stdout,
    /stay on this machine/i,
    'the first screen no longer says the files stay on this machine',
  );
  assert.ok(
    bareRun.run.stderr.trim().length === 0,
    `the bare command wrote to the error stream: ${bareRun.run.stderr.trim().slice(0, 200)}. ` +
      'A person in trouble reads whatever the terminal shows, and an interpreter ' +
      'warning above the first screen is the first thing they would see.',
  );
  t.diagnostic(`the bare command printed ${bareRun.run.stdout.length} characters, and the engine printed the same`);
});

test('no argument prints no list of commands, and --help prints all of them', (t) => {
  // A menu lists the lot. An incidental appearance of one name. The engine prints the
  // path of its own program, which is called after one of them, is not a menu, so the
  // rule is stated as a count rather than as a ban on a word.
  const inBare = NAMES.filter((name) => bareRun.run.stdout.includes(name));
  assert.ok(
    inBare.length < 3,
    `the bare command names ${inBare.length} of the ${NAMES.length} commands ` +
      `(${inBare.join(', ')}), which reads as a menu. A frightened person cannot pick ` +
      'from a list of words they have never seen, and acute stress removes recall ' +
      'first, so the table is the expert’s vocabulary and it is never shown by default.',
  );

  const place = somewhere('help');
  const asked = mw(['--help'], place);
  assert.equal(asked.status, 0, `--help failed:\n${asked.stdout}\n${asked.stderr}`);
  const listed = NAMES.filter((name) => asked.stdout.includes(name));
  assert.deepEqual(
    NAMES.filter((name) => !listed.includes(name)),
    [],
    `--help does not list every command. Somebody who typed --help asked for the list, ` +
      'and a partial one is worse than none: it reads as though the missing ones do ' +
      'not exist.',
  );
  t.diagnostic(
    `names in the bare output: ${inBare.length} of ${NAMES.length} · names under ` +
      `--help: ${listed.length} of ${NAMES.length}`,
  );
});

/* ── 2. AN EXPLICIT COMMAND REACHES THAT PROGRAM AND NO OTHER ─────────────── */

test('an explicit command reaches that program, identified by the program’s own name', (t) => {
  // Each program prints its own name in its own usage line, so the output identifies
  // which one was started. ⛔ Not asserted by inspecting the launcher's argument
  // building, that would be a test of the code rather than of what happened.
  const cases = [
    { command: 'freeze', marker: /usage: freeze\.py\b/ },
    { command: 'verify', marker: /usage: verify\.py\b/ },
    { command: 'capture-audit', marker: /usage: capture-audit\b/ },
  ];
  proven('the reached-program cases', cases, { floor: 3 });
  for (const { command, marker } of cases) {
    const place = somewhere(`reach-${command}`);
    const run = mw([command], place);
    const printed = `${run.stdout}${run.stderr}`;
    assert.match(
      printed,
      marker,
      `mw ${command} did not reach ${command}:\n${printed.slice(0, 400)}`,
    );
  }

  // …and an argument after the command name is passed on untouched: `verify` is a
  // subcommand of the engine, so this only produces the engine's contract summary if
  // the launcher forwarded the word rather than interpreting it.
  const place = somewhere('passthrough');
  const forwarded = mw(['init', 'verify'], place);
  assert.equal(forwarded.status, 0, `mw init verify failed:\n${forwarded.stdout}\n${forwarded.stderr}`);
  assert.match(
    forwarded.stdout,
    /^contract\s+\S+tree\.json/m,
    `an argument after the command name was not passed through:\n${forwarded.stdout.slice(0, 300)}`,
  );
  t.diagnostic(`programs reached by name: ${cases.map((c) => c.command).join(', ')} · arguments forwarded verbatim`);
});

/**
 * 🔴 AND EVERY COMMAND DECLARED TO RUN THE ENGINE REALLY REACHES IT: derived from the
 * declaration rather than listed, which is the point.
 *
 * `layers` was declared as running nothing at all while its reference document said *run
 * the engine and relay what it prints*, so `mw layers` answered that the command had no
 * program of its own, about the one command that walks the record questions. The
 * declaration is corrected; this is what stops the correction from being a claim. Because
 * the set is derived, a command moved into or out of it is covered without anybody
 * editing a list, and a command that silently stops reaching the engine fails here.
 */
test('every command declared to run the engine reaches the engine’s first screen', (t) => {
  const engineCommands = DECLARED.filter(
    (command) => (command.runs ?? '').trim() === 'skill/scripts/triage.py',
  ).map((command) => command.name);
  proven('the commands declared to run the engine', engineCommands, { floor: 4 });

  const missed = [];
  for (const name of engineCommands) {
    const place = somewhere(`engine-${name}`);
    const run = mw([name], place);
    if (run.status !== 0 || !FIRST_SCREEN.test(run.stdout)) {
      missed.push(`${name}: exit ${run.status}, ${run.stdout.slice(0, 120).replace(/\n/g, ' ')}`);
    }
  }
  assert.deepEqual(
    missed,
    [],
    `a command declared to run the engine did not reach it:\n  ${missed.join('\n  ')}\n` +
      '⛔ Either the declaration names a program the launcher will not start, or the ' +
      'launcher stopped resolving it. Both look identical to a person: they type a real ' +
      'command and are told it does not do anything.',
  );
  t.diagnostic(`commands that reached the engine: ${engineCommands.join(', ')}`);
});

/* ── 3. AN UNKNOWN COMMAND IS REFUSED BY NAME ─────────────────────────────── */

test('an unknown command is refused by name, and is never turned into init', (t) => {
  const place = somewhere('unknown');
  const typo = 'frezee';
  const run = mw([typo], place);

  assert.notEqual(run.status, 0, 'an unknown command exited zero');
  assert.ok(run.stdout.includes(typo), `the refusal does not name what was typed:\n${run.stdout}`);
  assert.doesNotMatch(
    run.stdout,
    FIRST_SCREEN,
    'an unknown command started the walk-through anyway. Somebody who typed a command ' +
      'meant that command, and quietly running a different one is how a person ends up ' +
      'believing they did something they did not.',
  );

  // ⛔ AND IT LEFT NOTHING BEHIND. Starting the engine creates a session file where it
  // is standing, so an empty directory afterwards is proof that nothing ran.
  assert.deepEqual(
    readdirSync(place.cwd),
    [],
    'a refused command still created something in the directory it was run from',
  );
  t.diagnostic(`unknown command refused with ${run.status}, naming ${JSON.stringify(typo)}`);
});

/* ── 4. A NON-ZERO FROM THE PROGRAM ARRIVES UNCHANGED ─────────────────────── */

test('every non-zero code the programs produce arrives at the shell unchanged', (t) => {
  // 🔴 UNCHANGED MEANS EQUAL TO THE DIRECT RUN, and that is what is asserted, not
  // merely "non-zero". Three different codes, from three different paths, including a
  // real refusal from the hard exclusion.
  const cases = [
    { what: 'a refusal', command: ['freeze', '--excluded-class'], script: FREEZE, args: ['--excluded-class'] },
    { what: 'a usage message', command: ['freeze'], script: FREEZE, args: [] },
    { what: 'a usage message', command: ['verify'], script: VERIFY, args: [] },
    { what: 'an argument error', command: ['capture-audit'], script: AUDIT, args: [] },
  ];
  proven('the exit-code cases', cases, { floor: 4 });

  const seen = [];
  for (const { what, command, script, args } of cases) {
    const throughLauncher = mw(command, somewhere(`code-${command.join('-')}`));
    const onItsOwn = direct(script, args, somewhere(`code-direct-${command.join('-')}`));
    assert.notEqual(
      onItsOwn.status,
      0,
      `${script} exited zero on its own for ${what}, so this case proves nothing`,
    );
    assert.equal(
      throughLauncher.status,
      onItsOwn.status,
      `mw ${command.join(' ')} exited ${throughLauncher.status} where the program itself ` +
        `exits ${onItsOwn.status}. ${what} must survive the trip: a refusal that arrives ` +
        'as a different number is a refusal a caller cannot recognise, and one that ' +
        'arrives as a zero is a gate turned into a phrase.',
    );
    seen.push(`${command.join(' ')} -> ${throughLauncher.status}`);
  }
  t.diagnostic(`codes passed through unchanged: ${seen.join(' · ')}`);
});

/* ── 5. A COMMAND WITH NO PROGRAM SAYS SO, AND STARTS NOTHING ─────────────── */

test('a command with no program of its own says so, and starts nothing instead', (t) => {
  // Derived from the declaration rather than listed here: every command whose declared
  // `runs` is not a single script under the scripts directory.
  const withoutProgram = DECLARED.filter(
    (command) => !/^skill\/scripts\/[A-Za-z0-9_]+\.py$/.test((command.runs ?? '').trim()),
  );
  proven('the commands with no program of their own', withoutProgram, { floor: 1 });

  for (const command of withoutProgram) {
    const place = somewhere(`noprogram-${command.name}`);
    const run = mw([command.name], place);
    assert.notEqual(run.status, 0, `mw ${command.name} exited zero without doing anything`);
    assert.ok(
      run.stdout.includes(command.name),
      `the answer for ${command.name} does not name it:\n${run.stdout}`,
    );
    assert.doesNotMatch(
      run.stdout,
      FIRST_SCREEN,
      `mw ${command.name} started the walk-through instead of saying it has no program`,
    );
    assert.deepEqual(
      readdirSync(place.cwd),
      [],
      `mw ${command.name} created something in the directory it was run from`,
    );
  }
  t.diagnostic(
    `commands with no program of their own: ${withoutProgram.map((c) => c.name).join(', ')}`,
  );
});

/* ── 6. A MISSING INTERPRETER IS A REFUSAL, NOT A STACK TRACE ─────────────── */

const NO_INTERPRETER = (() => {
  const place = somewhere('no-interpreter');
  return { place, run: mw([], { ...place, path: join(place.cwd, 'nothing-here') }) };
})();

test('a missing interpreter is a refusal in plain words, with a route out of it', (t) => {
  const { run } = NO_INTERPRETER;
  const printed = `${run.stdout}${run.stderr}`;
  proven('what a missing interpreter printed', printed, { floor: 100 });

  const refused = Number(
    /^const EXIT_REFUSED\s*=\s*(\d+);/m.exec(readRepo(LAUNCHER_REL))?.[1],
  );
  assert.equal(run.status, refused, `a missing interpreter exited ${run.status}`);

  // ⛔ NOT A STACK TRACE. This is the most likely real failure on a stranger's machine
  // and the person reading it is frightened.
  for (const shape of [/\bat [A-Za-z_$][\w$.]*\s*\(/, /^\s*at .*:\d+:\d+/m, /Traceback/, /\bENOENT\b/]) {
    assert.doesNotMatch(printed, shape, `the refusal shows machinery: ${shape}`);
  }

  // …and it carries the three things that make a refusal actionable: what is missing,
  // how to check, and that nothing was touched.
  for (const needed of [/python3/, /--version/, /\bnot read\b/i]) {
    assert.match(printed, needed, `the refusal does not say ${needed}`);
  }
  t.diagnostic(`missing interpreter: exit ${run.status}, ${printed.trim().split('\n').length} lines, no machinery`);
});

/* ── 7. THE LAUNCHER'S OWN WORDS ──────────────────────────────────────────── */

/**
 * 🔴 THE ONE EXCLUSION, AND IT IS STRUCTURAL RATHER THAN CONVENIENT.
 *
 * A command name and the path of its reference document are IDENTIFIERS. A person has
 * to type `layers` exactly, so `--help` cannot list that command without printing the
 * string, and one of the eleven declared names contains a barred word. That is a real
 * collision between the fixed command vocabulary and the rule, and it is not this
 * launcher's to resolve: renaming a command changes the declaration, the reference
 * filename, the skill definition's own table and the build that checks the three
 * against each other.
 *
 * So identifiers are removed before the prose is judged, exactly as the engine strips
 * the two real paths out of a screen before its own vocabulary check, failing a gate
 * on a string the program did not author is a false failure, and a false failure trains
 * people to ignore the gate.
 *
 * ⛔ IT IS NARROWED TO IDENTIFIERS, NOT TO FILES OR TO LINES, and the two assertions
 * below are what keep it honest: the exclusion must actually suppress something (or it
 * is vestigial), everything it suppresses must be a name or a reference path (or it is
 * hiding prose), and a barred word planted in the launcher's own sentences must still
 * fire.
 */
const IDENTIFIERS = [
  ...NAMES,
  ...DECLARED.map((command) => command.reference).filter(Boolean),
].sort((a, b) => b.length - a.length);

function withoutIdentifiers(text) {
  let out = text;
  for (const identifier of IDENTIFIERS) out = out.split(identifier).join(' ');
  return out;
}

test('nothing the launcher says on its own needs explaining before it means anything', (t) => {
  // 🔴 THE LAUNCHER'S OWN STRINGS, NOT THE ENGINE'S. Every run collected here is one
  // where the launcher answered without starting anything, so what is scanned is only
  // what this file authored. The barred words come from the engine's own constant, so a
  // word added there covers this surface too.
  const place = somewhere('vocabulary');
  const raw = [
    { label: 'mw --help', text: mw(['--help'], place).stdout },
    { label: 'mw <unknown>', text: mw(['frezee'], somewhere('vocab-unknown')).stdout },
    { label: 'a command with no program', text: mw(['clock'], somewhere('vocab-clock')).stdout },
    { label: 'a command for a contributor', text: mw(['gate'], somewhere('vocab-gate')).stdout },
    { label: 'a missing interpreter', text: NO_INTERPRETER.run.stdout },
  ];
  for (const block of raw) proven(block.label, block.text, { floor: 50 });
  const authored = raw.map((block) => ({
    label: block.label,
    text: proven(`${block.label} (prose only)`, withoutIdentifiers(block.text), { floor: 40 }),
  }));

  const { hits, linesRead } = scan(authored, barredPatterns());
  assert.ok(linesRead > 20, `only ${linesRead} lines of the launcher’s own output read`);
  assert.deepEqual(
    hits.map((h) => `${h.where}:${h.line} [${h.name}] ${h.match}`),
    [],
    'the launcher shows a word that has to be explained before it means anything:\n' +
      hits.map((h) => `  ${h.where}: ${h.text}`).join('\n') +
      '\n⛔ Jargon before value is a prediction failure, and this is the first thing a ' +
      'person sees at a terminal.',
  );

  /* ── the exclusion, proven live and proven non-swallowing ─────────────────── */

  // (a) It suppresses something real. If nothing in the launcher's output carries a
  //     barred word inside an identifier, then stripping identifiers buys nothing and
  //     the assertion above is passing for the wrong reason.
  const unstripped = scan(raw, barredPatterns()).hits;
  assert.ok(
    unstripped.length > 0,
    'no launcher output carries a barred word at all any more, even inside a command ' +
      'name, so this exclusion is vestigial. Remove it deliberately rather than ' +
      'leaving an unused exclusion in a check.',
  );

  // (b) And everything it suppresses really is an identifier. A hit whose line still
  //     carries the word once the names are removed would be prose wearing an
  //     exemption, which is what must never pass.
  const unaccounted = unstripped.filter(
    (hit) => withoutIdentifiers(hit.raw).toLowerCase().includes(hit.match.toLowerCase()),
  );
  assert.deepEqual(
    unaccounted.map((h) => `${h.where}:${h.line} ${h.match}, ${h.text}`),
    [],
    'a barred word survives in the launcher’s prose once command names and reference ' +
      'paths are removed, so the exclusion is covering something it was not written for.',
  );

  // (c) And a barred word planted in the launcher's own sentence still fires.
  const words = barredPatterns();
  const planted = [
    { label: 'PLANTED prose', text: withoutIdentifiers('I could not read the custody manifest.') },
  ];
  assert.ok(
    scan(planted, words).hits.length >= 2,
    'a barred word planted in a launcher-shaped sentence was not caught, so the scan ' +
      'as configured proves nothing about the sentences it passed',
  );
  t.diagnostic(
    `barred words suppressed as identifiers: ${unstripped.length}, all accounted for ` +
      `· identifiers stripped: ${IDENTIFIERS.length}`,
  );

  // ⛔ And it promises nothing about how anything turns out.
  const PROMISE = [
    { name: 'a result', re: /\bacquit\w*|\bexonerat\w+|\bvindicat\w+|\bcleared\b|\bbeat the charge\b|\bprove\s+your\s+innocen\w+\b|\bguarantee\w*/i },
  ];
  const promises = scan(authored, PROMISE).hits.filter(
    (h) => !isNegated(h.negationScope, h.negationAt),
  );
  assert.deepEqual(
    promises.map((h) => `${h.where}: ${h.match}`),
    [],
    'the launcher promises a result. The promise is an intact record, and nothing else ' +
      'is available to promise.',
  );
  t.diagnostic(
    `the launcher’s own output scanned: ${authored.length} surfaces, ${linesRead} lines`,
  );
});

/* ── 8. IT LEAVES THE INSTALL TREE ALONE ──────────────────────────────────── */

test('running a program did not change the tree the program lives in', (t) => {
  assert.ok(runs > 20, `only ${runs} launcher runs, so this assertion has little to see`);

  // ⚠️ THIS IS A SUITE-WIDE PROPERTY, NOT AN ATTRIBUTABLE ONE, AND SAYING SO MATTERS.
  // Every test file shares one source tree, so this cannot prove WHICH run wrote here.
  // it can only say that after this file's runs, nothing has. The attributable proof
  // that the launcher writes nothing into the repository is the write ledger in
  // `tests/rails/offline.test.mjs`, which is per-run and isolated.
  //
  // ⛔ If this fails, do not assume it was the launcher. Look for a spawn without the
  // interpreter's caching switched off: one already existed, in the containment test's
  // probe, and it dirtied the tree on every run of the suite for as long as it existed.
  const cached = join(REPO, 'skill', 'scripts', '__pycache__');
  assert.ok(
    !existsSync(cached),
    `${cached} exists after this file's ${runs} runs. Something in the suite writes a ` +
      'compiled copy beside the programs. A test that modifies the tree it tests can ' +
      'affect the next test, and version control ignores the directory, which is ' +
      'precisely why it goes unnoticed.',
  );
  t.diagnostic(`launcher runs in this file: ${runs} · nothing cached beside the programs`);
});
