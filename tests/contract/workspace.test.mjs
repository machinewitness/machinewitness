/**
 * tests/contract/workspace.test.mjs: the case folder, and picking up where it
 * was left off.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THIS FILE ALSO RUNS THE ENGINE'S OWN `--selftest`, AND THAT IS THE POINT OF
 * THE FIRST TEST. The engine carries a large offline check suite that NOTHING was
 * running: the gate workflow runs `ops/check_contracts.py --selftest` and never
 * the engine's. A check that no automation invokes is a check that has already
 * stopped working and has not told anyone.
 *
 * ⚠️ It is not enough to run it and look at the exit code. This project has
 * shipped a wrapper that reported green over a run which read nothing, so the
 * assertion here does what that wrapper had to learn: require the success
 * marker, fail on any reported FAILURE, and READ THE PRINTED COUNTS. A selftest
 * that examined zero routes and zero screens prints the same shape of green as
 * one that examined all of them.
 *
 * The rest drives the REAL commands in a temporary folder, because everything
 * being asserted is a filesystem effect, a mode, a file's opening paragraph, a
 * state file that moved, a pointer file that must not exist. The stateless
 * `drive` surface cannot see any of it.
 *
 * ⛔ HOME IS OVERRIDDEN FOR EVERY COMMAND. The opt-in pointer is written under
 * the home directory, and a test that opted in against the real one would leave
 * a file listing case folders on the machine of whoever ran the suite, which is
 * the exact artifact the pointer screen warns about.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { documentOrder, nodesById, optionsOf, recordNodes } from './_harness.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ENGINE = join(REPO, 'skill', 'scripts', 'triage.py');

const TMP = realpathSync(mkdtempSync(join(tmpdir(), 'mw-workspace-')));
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));

const PRETEND_HOME = join(TMP, 'pretend-home');
mkdirSync(PRETEND_HOME, { recursive: true });

/** Everything a case folder holds: five documents, two folders, two of mine. */
const EXPECTED_ENTRIES = [
  '.gitignore',
  '.mw-state.json',
  'MATTER.md',
  'PLAN.md',
  // A20. The list as something that can go in a pocket — several of these errands
  // happen in a building with no computer in it. ⛔ Uncompressed, so the rails scan
  // reads straight into its text and a verdict shape on paper is caught exactly
  // like one on a screen. It found the footer on the first run.
  'what-to-do.pdf',
  'closed-paths.md',
  // A18. The file X13 tells them to write, made for them rather than described.
  // ⚠️ Named in plain words for the same reason the two folders below were
  // renamed: `recollection.md` is a word out of a statement of claim, not a word
  // anybody uses about their own memory. The engine never reads it and never
  // writes to it twice — asserted further down, by writing into it and rerunning.
  'what-you-remember.md',
  // A23. Where anything the person volunteers lands, and it exists because ADR 0009
  // deleted the prohibition on asking. ⚠️ APPEND-ONLY: the assistant adds to the end
  // of it across sessions, so unlike the file above it is not merely never
  // rewritten by the engine — it must survive being written to by somebody else.
  // Asserted by appending and rerunning, in the engine's own self-check.
  'notes.md',
  // 🔴 RENAMED, and the rename is the point. These were `custody` and `manifest`.
  // A reader opened their own folder and found them: "custody made my stomach drop,
  // I thought it meant my children or being taken into custody." A folder
  // listing is a screen, so the words barred from a screen are barred here too.
  'frozen-copies',
  'what-was-frozen',
].sort();

/**
 * ⚖️ The jurisdictions on offer, read from the pack summary the engine itself
 * reads and verifies against a digest. ⛔ Never a list of country codes typed
 * here: that would be a second source of truth for which packs exist, and the
 * copy that goes stale is the one nobody is looking at.
 */
const JURISDICTION_CODES = (() => {
  const packs = JSON.parse(readFileSync(join(REPO, 'skill', 'data', 'packs.json'), 'utf8'));
  const codes = packs.codes ?? [];
  assert.ok(
    Array.isArray(codes) && codes.length > 0,
    'skill/data/packs.json offers no jurisdiction. Every check below that answers ' +
      'the jurisdiction screen would be reading nothing.',
  );
  return codes;
})();

/** The engine's authored screens. Their answers are not in the contract. */
const AUTHORED_OPTIONS = {
  S0: ['ok'],
  W2: ['yes', 'change'],
  // A22: W3 STATES rather than asks. Which of the two things it states is decided
  // by the contract's device-exposure question, not by an answer here. ADR 0010.
  W3: ['ok'],
  // ⚖️ W4, the jurisdiction screen. Derived, for the reason above.
  W4: [...JURISDICTION_CODES, 'not-listed'],
};

function engine(args, { cwd, env = {} } = {}) {
  return spawnSync('python3', [ENGINE, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, HOME: PRETEND_HOME, ...env },
  });
}

function stateOf(cwd, env = {}) {
  const run = engine(['state'], { cwd, env });
  assert.equal(run.status, 0, `state failed in ${cwd}:\n${run.stdout}\n${run.stderr}`);
  const start = run.stdout.indexOf('{');
  assert.ok(start >= 0, `state printed no JSON:\n${run.stdout}`);
  return JSON.parse(run.stdout.slice(start));
}

function modeOf(path) {
  return statSync(path).mode & 0o777;
}

/**
 * Drive the real commands from screen 0 to the plan, answering the folder screen
 * with `folder`. `forced` pins named contract nodes; everything else takes the
 * first answer offered, which is read from the contract rather than typed here.
 *
 * `home` overrides HOME for this walk alone. ⚠️ Needed because the pointer is no
 * longer opt-in: two walks with different device-exposure answers write different
 * things under the home folder, and sharing one would let the first walk's file
 * satisfy the second walk's assertion.
 *
 * `screens` collects everything the engine printed, because two of the assertions
 * are about what a person was TOLD rather than about a file. Doing something to
 * their machine without saying so would be a worse version of this feature.
 */
function walk({ start, folder, forced = {}, home = PRETEND_HOME }) {
  let cwd = start;
  const env = { HOME: home };
  const begun = engine(['begin'], { cwd, env });
  assert.equal(begun.status, 0, `begin failed:\n${begun.stdout}\n${begun.stderr}`);

  const visited = [];
  const screens = [begun.stdout];
  for (let guard = 0; guard < 200; guard += 1) {
    const state = stateOf(cwd, env);
    const parked = state.parked_on;
    visited.push(parked);
    if (parked === 'PLAN') return { cwd, state, visited, screens };

    let reply;
    if (parked === 'W1') reply = folder;
    else if (AUTHORED_OPTIONS[parked]) [reply] = AUTHORED_OPTIONS[parked];
    else {
      assert.ok(nodesById.has(parked), `the engine parked on an unknown screen: ${parked}`);
      reply = forced[parked] ?? optionsOf(parked)[0];
    }

    const answered = engine(['answer', reply], { cwd, env });
    screens.push(answered.stdout);
    assert.equal(
      answered.status,
      0,
      `answering ${JSON.stringify(reply)} at ${parked} failed:\n${answered.stdout}\n${answered.stderr}`,
    );
    // ⚠️ Confirming the folder MOVES the state into it, so every later command is
    // run from there. This is not test convenience: it is the same step a person
    // takes, and the assertion that nothing was left behind depends on it.
    if (parked === 'W2' && reply === 'yes') cwd = folder;
  }
  assert.fail('the walk did not reach the plan within 200 steps');
}

/* ── the engine's own checks, actually run ────────────────────────────────── */

test('the engine’s own selftest passes, and says what it examined', () => {
  const run = engine(['--selftest'], { cwd: REPO });
  const out = `${run.stdout}\n${run.stderr}`;

  assert.equal(run.status, 0, `triage.py --selftest exited ${run.status}:\n${out}`);
  assert.ok(out.includes('✅'), `the selftest produced no success marker:\n${out}`);
  assert.ok(!/FAILURE/.test(out), `the selftest reported a failure:\n${out}`);

  // ⚠️ READ THE COUNTS. A run that examined nothing prints the same green.
  const counts = {
    nodes: /contract\s+(\d+) nodes/.exec(out),
    exclusions: /·\s+(\d+) exclusions/.exec(out),
    routes: /routes\s+(\d+) routing-distinct/.exec(out),
    screens: /screens\s+(\d+) rendered/.exec(out),
    volumes: /volumes seen\s+(\d+) via/.exec(out),
  };
  for (const [what, found] of Object.entries(counts)) {
    assert.ok(found, `the selftest did not report how many ${what} it examined:\n${out}`);
    assert.ok(Number(found[1]) > 0, `the selftest examined 0 ${what}`);
  }
  assert.ok(
    Number(counts.screens[1]) > Number(counts.nodes[1]),
    'fewer screens than nodes were rendered. Something was skipped',
  );
});

/* ── what the folder holds ───────────────────────────────────────────────── */

const CASE_ROOT = join(TMP, 'a-session');
mkdirSync(CASE_ROOT, { recursive: true });
const CASE_FOLDER = join(CASE_ROOT, 'case-01');

// One walk, several assertions. Driving the whole flow costs a process per
// answer, so it is done once and inspected rather than repeated per test.
/**
 * One record question is answered `no`, chosen from the contract rather than
 * named here. Without it PLAN.md could be a list of every question that exists
 * and the "derived, not hard-coded" assertion would prove nothing.
 */
const DECLINED_RECORD = recordNodes[recordNodes.length - 1];

const WALK = walk({
  start: CASE_ROOT,
  folder: CASE_FOLDER,
  // `H4 = no` narrows to preservation only; `H2 = yes` closes a path. Both are
  // needed for closed-paths.md to have anything in it to check.
  forced: { H1: 'yes', H2: 'yes', H4: 'no', [DECLINED_RECORD]: 'no' },
});

test('the folder holds exactly what it says it will, and is readable only by its owner', () => {
  assert.equal(WALK.state.your_folder, CASE_FOLDER, 'the confirmed folder is not the one asked for');
  const entries = readdirSorted(CASE_FOLDER);
  assert.deepEqual(entries, EXPECTED_ENTRIES, `the folder holds ${entries.join(', ')}`);
  assert.equal(modeOf(CASE_FOLDER), 0o700, `the folder is ${modeOf(CASE_FOLDER).toString(8)}`);
  for (const name of ['MATTER.md', 'PLAN.md', 'closed-paths.md', '.mw-state.json', '.gitignore']) {
    assert.equal(
      modeOf(join(CASE_FOLDER, name)),
      0o600,
      `${name} is ${modeOf(join(CASE_FOLDER, name)).toString(8)}, not 600`,
    );
  }
});

/**
 * ⚖️ W4, the jurisdiction screen. ADR 0008 decisions 3, 4 and 5.
 *
 * Three things are asserted and each one is a decision rather than bookkeeping:
 * that it costs the person no NEW FILE in their own folder, that the options are
 * the packs that exist rather than a typed country list, and that choosing one is
 * not presented as the jurisdiction being supported.
 */
test('the jurisdiction is asked once, recorded in the working note, and adds no file', () => {
  assert.ok(
    WALK.visited.includes('W4'),
    `the jurisdiction screen was never shown: ${WALK.visited.join(' -> ')}`,
  );
  // 🔴 NO NEW WORKSPACE FILE. It rides in the state file the engine already keeps,
  // so the folder layout, its derived count and the screen that describes it are
  // all untouched. `EXPECTED_ENTRIES` above is the assertion; this names why.
  assert.deepEqual(readdirSorted(CASE_FOLDER), EXPECTED_ENTRIES);

  const where = WALK.state.where_you_told_me_you_are;
  assert.ok(
    [...JURISDICTION_CODES, 'not-listed'].includes(where),
    `the working note records ${JSON.stringify(where)} as a jurisdiction`,
  );

  // …and it is asked exactly once. Asking a frightened person to remember a
  // two-letter code they were shown once is the defect this replaces.
  const asked = WALK.visited.filter((n) => n === 'W4').length;
  assert.equal(asked, 1, `the jurisdiction was asked ${asked} times`);
});

test('the jurisdiction screen offers the packs that exist, and claims nothing for them', () => {
  const screen = engine(['screen'], { cwd: CASE_FOLDER });
  assert.equal(screen.status, 0, `screen failed:\n${screen.stdout}\n${screen.stderr}`);

  // Re-park a throwaway session on W4 by walking a fresh folder and stopping there.
  const start = join(TMP, 'jurisdiction-screen');
  mkdirSync(start, { recursive: true });
  const folder = join(start, 'their-folder');
  const begun = engine(['begin'], { cwd: start });
  assert.equal(begun.status, 0, `begin failed:\n${begun.stdout}\n${begun.stderr}`);

  let cwd = start;
  let rendered = null;
  for (let guard = 0; guard < 200; guard += 1) {
    const parked = stateOf(cwd).parked_on;
    if (parked === 'W4') {
      const shown = engine(['screen'], { cwd });
      assert.equal(shown.status, 0, `screen failed at W4:\n${shown.stdout}\n${shown.stderr}`);
      rendered = shown.stdout;
      break;
    }
    assert.notEqual(parked, 'PLAN', 'reached the plan without ever parking on W4');
    let reply;
    if (parked === 'W1') reply = folder;
    else if (AUTHORED_OPTIONS[parked]) [reply] = AUTHORED_OPTIONS[parked];
    else reply = optionsOf(parked)[0];
    const answered = engine(['answer', reply], { cwd });
    assert.equal(answered.status, 0, `answering at ${parked} failed:\n${answered.stderr}`);
    if (parked === 'W2') cwd = folder;
  }
  assert.ok(rendered && rendered.length > 200, 'the W4 screen rendered nothing to read');

  for (const code of JURISDICTION_CODES) {
    assert.ok(rendered.includes(code), `the pack ${code} exists and is not offered`);
  }
  assert.ok(
    rendered.includes('not-listed'),
    'the screen offers no way to say "mine is not on that list", which makes it a ' +
      'question a person outside the listed jurisdictions cannot answer',
  );

  // ⚖️ THE SAFETY RULE, ON THE SCREEN. Selecting a jurisdiction is not a claim
  // that the jurisdiction is supported: zero packs are reviewed, Canada included,
  // so every choice lands in the degraded path and the screen has to say so.
  assert.ok(
    rendered.includes('not checked by a lawyer'),
    'the jurisdiction screen does not say that the local material is unreviewed. ' +
      'A person choosing their own country reads their own line, so the review ' +
      'state belongs beside the option and not only in a note underneath it.',
  );
  // ⛔ And it must not answer a legal question in the act of asking.
  for (const forbidden of ['you are entitled', 'the law says', 'you must', 'you are allowed']) {
    assert.ok(
      !rendered.toLowerCase().includes(forbidden),
      `the jurisdiction screen states a legal position: ${forbidden}`,
    );
  }
});

test('MATTER.md opens with what it is, before it says anything else', () => {
  const body = readFileSync(join(CASE_FOLDER, 'MATTER.md'), 'utf8');
  const answersAt = body.indexOf('## What you have answered so far');
  assert.ok(answersAt > 0, 'MATTER.md records no answers');
  for (const needed of [
    'stays on this machine',
    'never read into an assistant prompt',
    'Do not paste it into any AI service',
  ]) {
    const at = body.indexOf(needed);
    assert.ok(at >= 0, `MATTER.md does not say "${needed}"`);
    assert.ok(at < answersAt, `MATTER.md says "${needed}" below the answers, not above them`);
  }
  // It is the person's own record, so their answers really are in it.
  const firstQuestion = nodesById.get(documentOrder[0]).ask;
  assert.ok(body.includes(firstQuestion), 'MATTER.md dropped the first question');
});

test('closed-paths.md carries closed paths and reasons, and no account of the matter', () => {
  const body = readFileSync(join(CASE_FOLDER, 'closed-paths.md'), 'utf8');
  assert.match(body, /Left off your list/, 'no closed path is explained');
  assert.match(body, /do not have a lawyer yet/, 'having no lawyer closes paths and is not recorded');
  assert.ok(!body.includes('You said'), 'closed-paths.md carries the answers as well');

  // Nothing from the timing questions belongs in it. Those are matter facts,
  // and this file is closed paths and reasons only.
  const timing = documentOrder.filter((id) => 'sets' in (nodesById.get(id) ?? {}));
  for (const id of timing) {
    const answer = WALK.state.flags[nodesById.get(id).sets];
    if (typeof answer !== 'string' || answer.length < 4) continue;
    assert.ok(
      !body.includes(answer),
      `closed-paths.md repeats an answer about the matter: "${answer}"`,
    );
  }
});

test('PLAN.md is derived from the answers, and leads with counsel when there is none', () => {
  const body = readFileSync(join(CASE_FOLDER, 'PLAN.md'), 'utf8');
  assert.match(body, /^# What to do, in order/, 'PLAN.md has no heading');
  assert.match(body, /Get a lawyer\. Today\./, 'the no-lawyer plan does not lead with counsel');
  assert.ok(
    !body.includes('You have not answered all the questions yet'),
    'PLAN.md is still the placeholder after reaching the plan',
  );
  // ⛔ Derived: a record the person said no to gets no action to do.
  //
  // ⚠️ Scoped to the ORDERED ACTION LIST, which is the first block. A later block
  // deliberately lists every question that was asked and marks the ones that are
  // not on the list, that is the non-ranked checklist the engine renders instead
  // of the contract's totals, and it is meant to name them.
  const actions = body.split('─'.repeat(72))[0];
  assert.ok(actions.length > 100, 'could not isolate the ordered action list in PLAN.md');
  const declined = WALK.state.records_you_said_no_to ?? [];
  assert.deepEqual(
    declined,
    [DECLINED_RECORD],
    'the walk did not decline the record it was told to, so this check proves nothing',
  );
  for (const id of declined) {
    assert.ok(
      !actions.includes(nodesById.get(id).ask),
      `PLAN.md tells the person to act on ${id}, which they answered no to`,
    );
    assert.ok(
      body.includes(nodesById.get(id).ask),
      `${id} is missing from PLAN.md entirely. The checklist names every question asked`,
    );
  }
});

test('neither file written to disk tells them to walk a path their answer closed', () => {
  // The contradiction reached three surfaces: the question screen, PLAN.md and
  // closed-paths.md. The screens are covered in verbatim.test.mjs; these are the
  // two that persist on the person's own machine, which is what makes them worse.
  //
  // ⚠️ The sentence split is a SECOND implementation of the engine's rule on
  // purpose. Importing the engine's marker list would make this agree by
  // construction.
  const MARKERS = ['do not', "don't", 'never', 'must not', 'stop'];
  const sentences = (t) => t.trim().split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

  const documents = [
    ['closed-paths.md', readFileSync(join(CASE_FOLDER, 'closed-paths.md'), 'utf8')],
    ['PLAN.md', readFileSync(join(CASE_FOLDER, 'PLAN.md'), 'utf8')],
  ];
  const [, closedFile] = documents[0];
  const closed = recordNodes.filter((id) => closedFile.includes(nodesById.get(id).ask));
  assert.ok(closed.length > 0, 'the walk closed no path, so this check proves nothing');

  let checked = 0;
  for (const id of closed) {
    const note = nodesById.get(id).warning;
    if (typeof note !== 'string' || note.trim().length === 0) continue;
    const forbids = sentences(note).filter((s) =>
      MARKERS.some((m) => s.toLowerCase().includes(m)),
    );
    const instructs = sentences(note).filter((s) => !forbids.includes(s));
    assert.ok(forbids.length > 0, `${id}'s note forbids nothing, nothing to preserve`);
    assert.ok(instructs.length > 0, `${id}'s note instructs nothing, nothing to withhold`);
    for (const [name, body] of documents) {
      for (const sentence of instructs) {
        assert.ok(
          !body.includes(sentence),
          `${name} tells them to go and get ${id}, which their own answer closed: ` +
            `"${sentence}". It is saved on their machine, so it is worse there than ` +
            'on a screen.',
        );
      }
      for (const sentence of forbids) {
        assert.ok(
          body.includes(sentence),
          `${name} dropped the half of ${id}'s note that forbids: "${sentence}"`,
        );
      }
      checked += 1;
    }
  }
  assert.equal(checked, closed.length * documents.length, 'a document went unchecked');
});

test('the end of the flow says the work is saved, and names the files and the folder', () => {
  // "If I'd closed that terminal window I'd have believed the whole thing was
  // gone." Nothing in the flow named a file, named a folder, or said the work had
  // been written down at all.
  const shown = engine(['screen'], { cwd: CASE_FOLDER });
  assert.equal(shown.status, 0, `could not show the last screen:\n${shown.stderr}`);
  const readable = ['PLAN.md', 'MATTER.md', 'closed-paths.md'];
  for (const surface of [
    ['the last screen', shown.stdout],
    ['PLAN.md', readFileSync(join(CASE_FOLDER, 'PLAN.md'), 'utf8')],
  ]) {
    const [where, body] = surface;
    assert.match(body, /saved/i, `${where} never says the work is saved`);
    assert.ok(body.includes(CASE_FOLDER), `${where} does not say which folder it is in`);
    for (const name of readable) {
      assert.ok(body.includes(name), `${where} does not name ${name}`);
    }
    // ⛔ The engine's own two entries are not offered as things to open.
    assert.ok(
      !body.includes('.mw-state.json'),
      `${where} offers the engine's own working note as something to read`,
    );
    // …and the two folders they WILL find on opening it are named, now that their
    // names are plain enough to say. Not naming what somebody is about to find is
    // how the old name came as a shock.
    for (const theirs of ['frozen-copies', 'what-was-frozen']) {
      assert.ok(body.includes(theirs), `${where} does not name ${theirs}`);
    }
  }
});

test('the .gitignore says what it is not, in the file itself', () => {
  const body = readFileSync(join(CASE_FOLDER, '.gitignore'), 'utf8');
  assert.match(body, /^\*$/m, 'the .gitignore does not actually ignore everything');
  assert.match(body, /NOT A PROTECTION/i, 'the .gitignore claims to be a boundary, or says nothing');
  for (const cannotStop of ['by force', 'backs this computer up', 'search that indexes']) {
    assert.ok(body.includes(cannotStop), `the .gitignore does not admit it cannot stop a ${cannotStop}`);
  }
});

test('nothing the person reads in that folder shows the internal vocabulary', () => {
  const banned = ['manifest', 'hash', 'custody', 'layer', 'classification', 'adversarial'];

  // 🔴 THE NAMES FIRST. A folder listing is a screen, and it is the one screen
  // that cannot be taken back. It sits on the person's own disk. Read off what
  // was really created, not off a list in this file.
  const entries = readdirSorted(CASE_FOLDER);
  assert.ok(entries.length > 0, 'the folder is empty, so this check reads nothing');
  for (const entry of entries) {
    for (const word of banned) {
      assert.ok(
        !entry.toLowerCase().includes(word),
        `the folder holds an entry named "${entry}", which puts the internal word ` +
          `"${word}" in front of the person the moment they open it`,
      );
    }
  }

  let scanned = 0;
  for (const name of ['MATTER.md', 'PLAN.md', 'closed-paths.md', '.gitignore']) {
    const body = readFileSync(join(CASE_FOLDER, name), 'utf8').toLowerCase();
    assert.ok(body.trim().length > 0, `${name} is empty`);
    for (const word of banned) {
      assert.ok(!body.includes(word), `${name} shows the internal word "${word}"`);
    }
    assert.ok(!/rail[\s_-]*\d/i.test(body), `${name} shows a rail number`);
    scanned += 1;
  }
  assert.equal(scanned, 4, 'scanned the wrong number of documents');
});

/* ── the state moved in, and nothing was left behind ─────────────────────── */

test('the working note kept before the folder existed is gone from where it was', () => {
  assert.ok(
    existsSync(join(CASE_FOLDER, '.mw-state.json')),
    'the state file is not in the case folder',
  );
  assert.ok(
    !existsSync(join(CASE_ROOT, '.mw-state.json')),
    'a second copy of the answers was left outside the case folder. ' +
      'The resume search looks in the current folder FIRST, so that copy would win every time.',
  );
});

/* ── 🔴 the session must survive the state file moving ────────────────────────

   THE MEASURED FAILURE, from a walk-through by someone with no technical
   training. They confirmed a case folder, answered the very next screen the
   ordinary way, and were told the tool could not find their case folder. They
   concluded that answering a question the tool had asked them had destroyed it.

   ⚠️ `walk()` above cannot see this, and the comment inside it says why without
   realising it: it changes directory into the case folder after confirming,
   "the same step a person takes". A person does not take that step. So this test
   deliberately never leaves the folder it started in.
   ───────────────────────────────────────────────────────────────────────────── */

test('the screen after the folder moves carries a line that works, and the bare form recovers', () => {
  const root = join(TMP, 'never-changes-directory');
  mkdirSync(root, { recursive: true });
  const folder = join(root, 'holds-the-case');
  walkToFolderScreen(root);

  assert.equal(engine(['answer', folder], { cwd: root }).status, 0, 'the folder was refused');
  const confirmed = engine(['answer', 'yes'], { cwd: root });
  assert.equal(confirmed.status, 0, `confirming failed:\n${confirmed.stdout}`);
  assert.ok(existsSync(join(folder, '.mw-state.json')), 'the state did not move into the folder');

  // Half one: the screen the person is now looking at hands over the whole line.
  assert.ok(
    confirmed.stdout.includes(`--workspace ${folder}`),
    'the screen after the folder moved does not print the folder on the line it ' +
      `tells the person to run:\n${confirmed.stdout}`,
  );

  // Half two: that line works, run from where they were already standing.
  // A22: W3 states rather than asks, so the reply is an acknowledgement. ⛔ Read
  // out of the option table rather than typed — this said 'no' and passed only while
  // the pointer was a question.
  const carried = engine(
    ['answer', '--workspace', folder, AUTHORED_OPTIONS.W3[0]],
    { cwd: root },
  );
  assert.equal(carried.status, 0, `the line the screen printed did not work:\n${carried.stdout}`);
  assert.notEqual(
    stateOf(folder).parked_on,
    'W3',
    'acknowledging the pointer screen left the session on the same screen',
  );

  // …and the bare form, which cannot work, RECOVERS rather than frightens.
  const bare = engine(['answer', 'no'], { cwd: root });
  assert.equal(bare.status, 4, `expected the "nothing to resume" code, got ${bare.status}`);
  assert.match(bare.stdout, /Nothing has been deleted/, 'it does not say the folder is intact');
  assert.ok(
    bare.stdout.includes('answer --workspace YOUR-FOLDER no'),
    `it does not print the command the person was actually running:\n${bare.stdout}`,
  );
  assert.ok(!bare.stdout.includes('looked in  '), 'the double space is still there');
});

/* ── resume ──────────────────────────────────────────────────────────────── */

test('resume finds the folder from inside it, and from a folder below it', () => {
  const fromInside = engine(['screen'], { cwd: CASE_FOLDER });
  assert.equal(fromInside.status, 0, `resume from inside failed:\n${fromInside.stderr}`);
  assert.ok(fromInside.stdout.trim().length > 0, 'resume from inside printed nothing');

  const below = join(CASE_FOLDER, 'frozen-copies');
  const fromBelow = engine(['screen'], { cwd: below });
  assert.equal(fromBelow.status, 0, `resume from a folder below failed:\n${fromBelow.stderr}`);
  assert.equal(
    fromBelow.stdout,
    fromInside.stdout,
    'resuming from a folder below showed a different screen',
  );
});

test('resume from an unrelated folder ASKS, and never says start again', () => {
  const elsewhere = join(TMP, 'somewhere-else');
  mkdirSync(elsewhere, { recursive: true });
  const run = engine(['screen'], { cwd: elsewhere });

  assert.equal(run.status, 4, `expected the "nothing to resume" code, got ${run.status}`);
  const out = run.stdout;
  assert.match(out, /could not find your case folder/i, 'the ask does not say what is missing');
  assert.match(out, /Tell me where your case folder is/, 'it does not ask for the folder');
  assert.match(out, /\.mw-state\.json/, 'it does not say what it looked for');
  assert.ok(
    !/start at the beginning instead/i.test(out),
    'an interrupted person is being told to start over, which answers everything twice',
  );
});

/* ── the pointer: decided by the contract's device-exposure question ──────── */

/**
 * A22 / ADR 0010. The pointer used to be an opt-in question and is now derived, so
 * these two tests derive the deciding answers rather than typing them: an amendment
 * that renames the question or its options moves both with it.
 *
 * ⛔ `exposes` is an answer whose branch SETS `device_exposed`; `clear` is one that
 * does not. If the contract stops having either, the tests below say so instead of
 * quietly asserting nothing.
 */
const EXPOSURE = (() => {
  for (const id of documentOrder) {
    const node = nodesById.get(id) ?? {};
    for (const [answer, entry] of Object.entries(node.branch ?? {})) {
      if (entry?.set?.device_exposed) {
        const clear = optionsOf(id).find(
          (option) => !node.branch?.[option]?.set?.device_exposed,
        );
        return { id, exposes: answer, clear };
      }
    }
  }
  return null;
})();

test('the contract still has a question that decides device exposure, with both answers', () => {
  assert.ok(EXPOSURE, 'no node sets device_exposed, so the pointer is off for everybody');
  assert.ok(EXPOSURE.exposes, `${EXPOSURE.id} has no answer that sets device_exposed`);
  assert.ok(
    EXPOSURE.clear,
    `every answer at ${EXPOSURE.id} sets device_exposed, so the pointer can never be ` +
      'written and the branch that writes it is unreachable',
  );
});

test('an exposed device writes nothing at all under the home folder', () => {
  const root = join(TMP, 'device-exposed');
  mkdirSync(root, { recursive: true });
  const folder = join(root, 'case-01');
  const home = join(TMP, 'home-exposed');
  const run = walk({
    start: root,
    folder,
    forced: { [EXPOSURE.id]: EXPOSURE.exposes },
    home,
  });
  assert.equal(
    run.state.path_written_down_in_your_home_folder,
    false,
    'a session where a device may be looked at recorded the path as written down',
  );
  assert.ok(
    !existsSync(join(home, '.machine-witness')),
    'a file listing case folders was written for somebody whose device may be examined',
  );
  // …and the screen said so, rather than doing it silently. RAIL 9.
  const said = run.screens.join('\n');
  assert.match(
    said,
    /not writing your folder.s location anywhere/i,
    'nothing on screen told them the path was being withheld',
  );
  assert.match(
    said,
    /not a neutral act/i,
    'the withheld screen does not warn that moving material once somebody has a ' +
      'warrant is not neutral',
  );
});

/* ── a case folder inside a version-controlled project, through the real commands

   🔴 THE CONTROL IS THE HALF THAT MATTERS. `containment.test.mjs` proves the
   refusal fires; if the rule were too broad the engine would refuse every folder
   and the product would be dead, and a suite of refusals cannot tell the two
   apart. So the first test below walks the REAL commands, not the stateless
   `drive` surface, which has no disk and therefore no folder screen, and
   requires an ordinary folder outside any project to be created in full.
   ───────────────────────────────────────────────────────────────────────────── */

/** The marker at the top of a version-controlled project. */
const MARKER = '.git';

/**
 * The nearest project at or above a path, or null. Deliberately duplicated from
 * containment.test.mjs rather than shared: both are the same eight-line question
 * put to the operating system, and a test helper imported from another test file
 * would run that file's suite a second time.
 */
function markerAbove(path) {
  let probe = path;
  for (;;) {
    if (existsSync(join(probe, MARKER))) return join(probe, MARKER);
    const up = dirname(probe);
    if (up === probe) return null;
    probe = up;
  }
}

/**
 * Drive the real commands from `begin` until the engine parks on the screen that
 * asks where the files go, and stop there. Cheaper than a walk to the plan, and
 * that one screen is the whole subject of these two tests.
 */
function walkToFolderScreen(start) {
  const begun = engine(['begin'], { cwd: start });
  assert.equal(begun.status, 0, `begin failed:\n${begun.stdout}\n${begun.stderr}`);
  for (let guard = 0; guard < 200; guard += 1) {
    const parked = stateOf(start).parked_on;
    if (parked === 'W1') return;
    let reply;
    if (AUTHORED_OPTIONS[parked]) [reply] = AUTHORED_OPTIONS[parked];
    else {
      assert.ok(nodesById.has(parked), `the engine parked on an unknown screen: ${parked}`);
      reply = optionsOf(parked)[0];
    }
    const answered = engine(['answer', reply], { cwd: start });
    assert.equal(
      answered.status,
      0,
      `answering ${JSON.stringify(reply)} at ${parked} failed:\n${answered.stdout}\n${answered.stderr}`,
    );
  }
  assert.fail('the real commands never reached the folder screen');
}

test('THE CONTROL, an ordinary folder outside any project is still created, in full', () => {
  const root = join(TMP, 'ordinary');
  mkdirSync(root, { recursive: true });
  // Asserted, not assumed: if the temp tree were inside a project this control
  // would be testing the refusal and reporting it as a pass.
  assert.equal(markerAbove(root), null, `${root} sits inside a project. This control is unsound`);

  const folder = join(root, 'case-01');
  walkToFolderScreen(root);

  const offered = engine(['answer', folder], { cwd: root });
  assert.equal(
    offered.status,
    0,
    `an ordinary folder was refused at the folder screen:\n${offered.stdout}\n${offered.stderr}`,
  );
  assert.ok(
    offered.stdout.includes(`I will create ${folder}`),
    `the confirmation screen does not offer that folder:\n${offered.stdout}`,
  );
  assert.equal(stateOf(root).parked_on, 'W2', 'the engine did not reach the confirmation screen');

  const created = engine(['answer', 'yes'], { cwd: root });
  assert.equal(created.status, 0, `confirming failed:\n${created.stdout}\n${created.stderr}`);
  assert.deepEqual(
    readdirSorted(folder),
    EXPECTED_ENTRIES,
    'an ordinary folder was accepted but not filled in',
  );
  assert.equal(modeOf(folder), 0o700, `the folder is ${modeOf(folder).toString(8)}`);
  assert.equal(stateOf(folder).your_folder, folder, 'the state does not record the folder');
});

test('the real commands refuse a folder inside a project, and stay on the question', () => {
  const project = join(TMP, 'a-project');
  mkdirSync(join(project, MARKER), { recursive: true });
  const start = join(TMP, 'asking-from-outside');
  mkdirSync(start, { recursive: true });
  walkToFolderScreen(start);

  const refused = engine(['answer', join(project, 'case-01')], { cwd: start });
  assert.equal(
    refused.status,
    3,
    `expected the refusal exit code, got ${refused.status}:\n${refused.stdout}\n${refused.stderr}`,
  );
  assert.match(refused.stdout, /keeps its own history/, 'the refusal does not state the reason');
  assert.ok(refused.stdout.includes(project), 'the refusal does not name the project it found');
  assert.match(refused.stdout, /Pick a folder outside that project/, 'it says what, not what to do');
  assert.ok(
    !existsSync(join(project, 'case-01')),
    'the refused folder was created inside the project anyway',
  );

  // ⛔ Parked where it was. A refusal that advanced the session would leave the
  // person with no way back to the only question they can still answer.
  assert.equal(stateOf(start).parked_on, 'W1', 'a refused path moved the session on anyway');

  // …and the same session then accepts an ordinary folder, so the refusal is a
  // refusal of that path and not of the screen.
  const ordinary = join(start, 'case-01');
  const accepted = engine(['answer', ordinary], { cwd: start });
  assert.equal(
    accepted.status,
    0,
    `the folder screen stopped working after a refusal:\n${accepted.stdout}\n${accepted.stderr}`,
  );
  assert.equal(stateOf(start).parked_on, 'W2');
});

test('a clear device writes one line, once, readable only by its owner, and the ask then offers it', () => {
  const optRoot = join(TMP, 'device-clear');
  mkdirSync(optRoot, { recursive: true });
  const optFolder = join(optRoot, 'case-01');
  // ⚠️ ITS OWN HOME. Every walk in this file now writes here, so sharing one would
  // make "exactly one line" an assertion about how many tests ran.
  const optHome = join(TMP, 'home-clear');
  const opted = walk({
    start: optRoot,
    folder: optFolder,
    forced: { [EXPOSURE.id]: EXPOSURE.clear },
    home: optHome,
  });
  assert.equal(
    opted.state.path_written_down_in_your_home_folder,
    true,
    'a session where no device may be looked at did not write the path down',
  );
  // …and it told them, rather than doing it quietly. RAIL 9.
  assert.match(
    opted.screens.join('\n'),
    /is itself a record/i,
    'nothing on screen told them the file naming their case folder exists',
  );

  const pointer = join(optHome, '.machine-witness', 'workspaces');
  assert.ok(existsSync(pointer), 'a clear device wrote no pointer file');
  const lines = readFileSync(pointer, 'utf8').split('\n').filter((l) => l.trim().length > 0);
  assert.deepEqual(lines, [optFolder], `the pointer holds ${JSON.stringify(lines)}`);
  assert.equal(modeOf(pointer), 0o600, `the pointer file is ${modeOf(pointer).toString(8)}, not 600`);

  const elsewhere = join(TMP, 'somewhere-else-again');
  mkdirSync(elsewhere, { recursive: true });
  const run = engine(['screen'], { cwd: elsewhere, env: { HOME: optHome } });
  assert.equal(run.status, 4);
  assert.ok(run.stdout.includes(optFolder), 'the ask does not offer the folder it wrote down');
});

function readdirSorted(path) {
  const run = spawnSync('ls', ['-A', path], { encoding: 'utf8' });
  assert.equal(run.status, 0, `could not list ${path}`);
  return run.stdout.split('\n').map((l) => l.trim()).filter(Boolean).sort();
}
