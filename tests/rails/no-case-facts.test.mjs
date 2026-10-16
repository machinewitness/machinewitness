/**
 * tests/rails/no-case-facts.test.mjs. Nothing from a real matter is in this
 * repository. The structural half, which is the only half that exists.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🟡 THIS RAIL IS HALF-CHECKED AND THE MISSING HALF IS NOT AN ENGINEERING TASK.
 *
 * The gate matches CLASSES of identifier, a docket-shaped number, a badge, an
 * address, an absolute date, an evidence digest, a case-workspace path, because
 * the lesson that produced it is that a name-only scrub is not a scrub. But the
 * converse is equally true and it is live right now: **a proper name has no
 * shape.** Plant a real surname in a tracked file and the gate prints a pass.
 * That is verified below, deliberately, as a passing assertion about a hole,
 * because a test suite that quietly omitted it would leave a reader thinking this
 * rail is closed.
 *
 * The missing half is a list of real values which by design lives OUTSIDE every
 * repository and is supplied at run time. It is unwritten, and writing it belongs
 * to the owner. What this file can do (and does) is prove the mechanism works
 * the moment a list is supplied.
 *
 * The three properties every test in this directory has:
 *   NON-EMPTY INPUT   the gate's own printed file count is parsed and cross-checked
 *                     against an independent count, and a run that scanned nothing
 *                     is a failure here even if it printed green
 *   PLANTED FIXTURE   one file per identifier class, each of which must FAIL
 *   MUTATION SET      values the structural classes provably cannot catch, asserted
 *                     as passing, and named as the hole rather than hidden
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPO, proven, readRepo, scratch, tracked } from './_rails.mjs';

const GATE = join(REPO, 'ops', 'casefact_gate.sh');
const WRAPPER = join(REPO, 'ops', 'ci_casefact.sh');
const CONTRACTS = join(REPO, 'ops', 'check_contracts.py');

/** Run something and hand back everything it said, with the status. */
function run(command, args, { cwd = REPO, env = {} } = {}) {
  const out = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', ...env },
  });
  return { status: out.status, text: `${out.stdout ?? ''}\n${out.stderr ?? ''}` };
}

/**
 * A scratch directory the gate can actually read.
 *
 * ⚠️ The gate refuses any target path containing a dot-DIRECTORY, and it is right
 * to: two independent mechanisms inside it discard those lines, so it would
 * otherwise print a confident pass having read nothing. If the platform hands out
 * temporary directories under a dot-path, this test must fail loudly rather than
 * skip, a skipped rail test is indistinguishable from a passing one in a summary.
 */
function gateSafeScratch(name) {
  const dir = scratch(name);
  assert.ok(
    !/\/\.[^/]+\//.test(`${dir}/`),
    `the temporary directory contains a dot-directory (${dir}), which the gate ` +
      'refuses to scan. This test cannot run here, and refusing to skip is the point.',
  );
  return dir;
}

/* ── the gate over the real tree, with its count cross-checked ────────────── */

const gateRun = run('bash', [GATE, '--tracked', '--profile', 'legal']);

test('the gate passes over the tracked set, and says how many files it read', (t) => {
  const printed = /tracked files:\s*(\d+)/.exec(gateRun.text);
  assert.ok(printed, `the gate did not report how many files it read:\n${gateRun.text.slice(0, 800)}`);
  const reported = Number(printed[1]);
  assert.ok(reported > 0, 'the gate reported reading 0 files');

  // 🔴 An INDEPENDENT count. The gate's own number proves it did not scan zero;
  // comparing it with a second reading of the same question proves it did not scan
  // a subset. One number alone cannot tell those apart.
  const independent = proven('the tracked file set', tracked(), { floor: 50 }).length;
  assert.equal(
    reported,
    independent,
    `the gate read ${reported} files; git tracks ${independent}. A gate scanning a ` +
      'subset prints the same green as one scanning everything.',
  );

  assert.equal(gateRun.status, 0, `the gate exited ${gateRun.status}:\n${gateRun.text}`);
  assert.ok(gateRun.text.includes('✅'), 'the gate produced no success marker');
  assert.ok(!/^FATAL/m.test(gateRun.text), `the gate aborted:\n${gateRun.text}`);
  t.diagnostic(`gate read ${reported} tracked files · git ls-files agrees`);
});

test('the wrapper propagates, and does not print the paths it scanned', () => {
  const wrapped = run('bash', [WRAPPER]);
  assert.equal(wrapped.status, 0, `the wrapper exited ${wrapped.status}:\n${wrapped.text}`);
  assert.ok(
    wrapped.text.includes('case-fact gate: clean'),
    `the wrapper reported no result:\n${wrapped.text}`,
  );
  assert.match(wrapped.text, /tracked files:\s*\d+/, 'the wrapper hides the file count');
  // Under --tracked the target list is every absolute path in the repository on one
  // line, which on a developer's machine embeds the operating-system username.
  assert.ok(
    !/^targets:/m.test(wrapped.text),
    'the wrapper printed its target list. On a public log that publishes a local path.',
  );
});

test('the structural checker fires when it should, and scanned real documents', () => {
  const self = run('python3', [CONTRACTS, '--selftest']);
  assert.equal(self.status, 0, `the structural checker's selftest failed:\n${self.text}`);
  assert.ok(/every check fired/.test(self.text), `no confirmation the checks fire:\n${self.text}`);

  const real = run('python3', [CONTRACTS]);
  assert.equal(real.status, 0, `the structural checker failed:\n${real.text}`);
  const scanned = /scanned (\d+) document/.exec(real.text);
  assert.ok(scanned, 'the structural checker did not say how many documents it read');
  assert.ok(Number(scanned[1]) > 50, `it read only ${scanned[1]} documents`);
});

/* ── planted fixtures: one per class, each must FAIL ──────────────────────── */

/**
 * 🔴 EVERY FIXTURE VALUE IS ASSEMBLED AT RUN TIME, AND THAT IS NOT AN AFFECTATION.
 *
 * This repository's own rule bars an absolute date, an address, a phone number, an
 * e-mail address, a docket number and a workspace path **from a fixture**, in as many
 * words, and the gate under test enforces exactly that over every tracked file,
 * including this one. Written as literals, these fixtures made the gate fail on their
 * own test file, in ten classes at once, on the first run.
 *
 * ⛔ The wrong fix would have been to exempt this file. The right one is that the
 * value exists only in memory while the check runs: the pieces below are inert, the
 * shapes they form are not, and the repository stays clean by the same rule it
 * enforces on everything else.
 *
 * Every value is INVENTED and belongs to nobody. A real one would import exactly the
 * leak the gate exists to prevent, and a SET of real statute sections is a
 * fingerprint even with no name attached, which is why nothing here is a redaction of
 * anything real.
 */
const pad = (n, width) => String(n).padStart(width, '0');
const joinWith = (glue, ...parts) => parts.join(glue);

const CLASS_FIXTURES = [
  {
    cls: 'absolute date',
    text: `The window in dispute is ${joinWith('-', 1990 + 29, pad(4, 2), pad(17, 2))} in the evening.\n`,
  },
  {
    cls: 'slash date',
    text: `It was reported on ${joinWith('/', pad(17, 2), pad(4, 2), 1990 + 29)} according to the file.\n`,
  },
  {
    cls: 'docket-shaped number',
    text: `Filed under ${joinWith('-', 24, 118342, pad(1, 2))} at the registry.\n`,
  },
  {
    cls: 'street address',
    text: `Attendance was at ${joinWith(' ', 118, 'Marchpane', 'Street')}, upper unit.\n`,
  },
  {
    cls: 'phone number',
    text: `Contact number on the report is ${joinWith('-', 416, 555, pad(148, 4))}.\n`,
  },
  {
    cls: 'email address',
    text: `Correspondence went to ${joinWith('@', 'intake.clerk', 'example.org')} overnight.\n`,
  },
  { cls: 'police division', text: `The matter sits with ${joinWith(' ', 31, 'Division')} for now.\n` },
  { cls: 'courtroom', text: `Set down for ${joinWith(' ', 'Courtroom', 108)} next appearance.\n` },
  { cls: 'evidence digest', text: `A digest of the exhibit: ${'de'.repeat(20)}ad\n` },
  {
    cls: 'case-workspace path',
    text: `Copied from ${joinWith('_', 'evidence', 'master')} into the working tree.\n`,
  },
  {
    cls: 'verbatim evidence filename',
    text: `The item is ${joinWith('.', 'thread-export-final', 'eml')} on the stick.\n`,
  },
];

test('the gate FAILS on every planted identifier class. A check that never failed is untested', (t) => {
  proven('the fixture set', CLASS_FIXTURES, { floor: 10 });
  const dir = gateSafeScratch('casefact-classes');
  const missed = [];
  for (const fixture of CLASS_FIXTURES) {
    const path = join(dir, `${fixture.cls.replace(/[^a-z]+/gi, '-')}.md`);
    writeFileSync(path, fixture.text);
    const result = run('bash', [GATE, '--profile', 'legal', path]);
    if (result.status !== 1 || !result.text.includes('❌')) {
      missed.push(`${fixture.cls} (exit ${result.status})`);
    }
  }
  assert.deepEqual(
    missed,
    [],
    `the gate did NOT catch: ${missed.join(', ')}. Each of these is a class the gate ` +
      'claims to enforce, and a class that cannot fail is not enforced.',
  );
  t.diagnostic(`identifier classes proven to fire: ${CLASS_FIXTURES.length}`);
});

/**
 * 🔴 THE BADGE CLASS, DECLARED AND INERT FOR THE WHOLE LIFE OF THE GATE, AND THIS
 * SUITE IS WHAT FOUND IT. Now revived, and proven at every shape rather than at one.
 *
 * What was wrong: the class was `#` followed by four to six digits, suppressed by a
 * stylesheet-colour drop of `#` followed by three to eight HEX digits. Every decimal
 * digit is also a hex digit, so every token the class could match also matched the
 * drop, and the drop runs first, per LINE, so a line holding nothing but a badge
 * number was discarded too. Measured at five shapes: all five silent. RAIL 1 names
 * badge numbers explicitly, so this was a rail with nothing behind it.
 *
 * What it is now: two rules in `ops/casefact_gate.sh`, splitting the problem by
 * CONTEXT because as bare tokens a colour and a badge are the same string.
 *   · a role word on the line (badge, officer, constable, an abbreviated rank)
 *     reads the token wide, three to eight digits, colour lengths included;
 *   · a BARE token fires at four and five digits, the lengths `#RGB`/`#RRGGBB`/
 *     `#RRGGBBAA` do not use, unless colour context is on the line.
 * This block is the trip-wire in the other direction: narrow either rule and one of
 * these five shapes goes quiet, which is how the class died the first time.
 *
 * ⚠️ WHY THE FILENAMES ARE SPELT OUT AND NOT DERIVED FROM THE LABEL, which is the
 * subtle half. The gate greps with -H, so the PATH is part of every line it judges,
 * and the role-word filter is applied to that whole line. A fixture for the BARE-token
 * rule whose filename contained the word badge would satisfy the OTHER rule through
 * its own path, and this test would pass while proving nothing. Not hypothetical: the
 * first scratch tree used to develop the fix was named `…-badge-probe`, and every one
 * of the hex-colour fixtures in it fired. Same for the directory name below.
 *
 * Every number is INVENTED, belongs to nobody, and is assembled at run time, this
 * file is scanned by the gate under test, and a badge-shaped literal written here
 * would now fail it. That is the class working, not a fixture problem.
 */
const BADGE_SHAPES = [
  { file: 'attendance.md', shape: 'a role word, then four digits',
    text: `Officer badge #${joinWith('', 4, '417')} attended.\n` },
  { file: 'lower-case.md', shape: 'the bare role word, then five digits',
    text: `badge #${joinWith('', 1, '2345')}\n` },
  { file: 'abbreviated.md', shape: 'an abbreviated rank, then six digits',
    text: `PC #${joinWith('', 9, '87654')} wrote the note.\n` },
  { file: 'token-only.md', shape: 'a bare token, nothing else on the line',
    text: `#${joinWith('', 4, '417')}\n` },
  { file: 'spelt-out.md', shape: 'the words spelt out, then five digits',
    text: `Badge number #${joinWith('', 5, '5123')} in the log.\n` },
];

/**
 * The other direction, and it is the one that makes the revival honest rather than
 * merely loud: a real stylesheet colour must still not fire. The `#RGB` shorthand is
 * below the badge floor, a token holding a hex letter cannot be a decimal badge, and
 * the genuinely ambiguous all-decimal ones are separated by length or by the colour
 * context around them.
 */
const HEX_COLOURS = [
  { file: 'bare-six.md', what: 'a bare six-digit token, the #RRGGBB length',
    text: `#${joinWith('', 14, 1416)}\n` },
  { file: 'with-letters.md', what: 'hex letters, which a decimal badge cannot hold',
    text: `#${joinWith('', 'abc', 123)}\n` },
  { file: 'shorthand.md', what: 'the #RGB shorthand, below the badge floor',
    text: `#${'f'.repeat(3)}\n` },
  { file: 'custom-property.css', what: 'a custom-property declaration in a stylesheet',
    text: `  --surface: #${joinWith('', 14, 1416)};\n` },
  { file: 'swatch-table.md', what: 'a design-document swatch table, four digits',
    text: `| Surface | #${joinWith('', 1234)} | from the palette |\n` },
  { file: 'declaration.css', what: 'an all-decimal #RGBA in a colour property',
    text: `span { color: #${joinWith('', 1234)} }\n` },
];

test('the revived badge class FIRES at every shape, and not on a stylesheet colour', (t) => {
  proven('the badge shapes', BADGE_SHAPES, { floor: 5 });
  proven('the colour shapes', HEX_COLOURS, { floor: 6 });
  // ⚠️ No role word and no colour word in this directory name, see above.
  const dir = gateSafeScratch('casefact-hash-tokens');

  const silent = [];
  for (const shape of BADGE_SHAPES) {
    const path = join(dir, shape.file);
    writeFileSync(path, shape.text);
    const result = run('bash', [GATE, '--profile', 'legal', path]);
    if (result.status !== 1 || !result.text.includes('❌')) {
      silent.push(`${shape.shape} (exit ${result.status})`);
    }
  }
  assert.deepEqual(
    silent,
    [],
    `the badge class did NOT fire on: ${silent.join('; ')}. This class has already been ` +
      'dead once, silently, because a suppression pattern swallowed every token it could ' +
      'match. ⛔ Do not resolve this by deleting a shape.',
  );

  const falsePositives = [];
  for (const colour of HEX_COLOURS) {
    const path = join(dir, colour.file);
    writeFileSync(path, colour.text);
    const result = run('bash', [GATE, '--profile', 'legal', path]);
    if (result.status !== 0) falsePositives.push(`${colour.what} (exit ${result.status})`);
  }
  assert.deepEqual(
    falsePositives,
    [],
    `a real stylesheet colour now fails the gate: ${falsePositives.join('; ')}. The badge ` +
      'rules are deliberately noisy, but a class that reddens on every design document ' +
      'gets switched off, which is how it stops protecting anything.',
  );
  t.diagnostic(
    `badge shapes proven to fire: ${BADGE_SHAPES.length} · ` +
      `stylesheet colours proven silent: ${HEX_COLOURS.length}`,
  );
});

test('the gate refuses to report a pass over an empty tracked set', () => {
  // 🔴 Fail closed, proven by execution. A copy of the gate in an empty repository
  // has nothing to scan, and the one thing it must not do is print green.
  const root = gateSafeScratch('empty-repo');
  mkdirSync(join(root, 'ops'), { recursive: true });
  copyFileSync(GATE, join(root, 'ops', 'casefact_gate.sh'));
  copyFileSync(join(REPO, 'ops', 'policy_exempt.re'), join(root, 'ops', 'policy_exempt.re'));
  const init = run('git', ['init', '-q'], { cwd: root });
  assert.equal(init.status, 0, `could not create a scratch repository:\n${init.text}`);

  const result = run('bash', [join(root, 'ops', 'casefact_gate.sh'), '--tracked'], { cwd: root });
  assert.equal(result.status, 2, `an empty scan exited ${result.status}, not 2:\n${result.text}`);
  assert.match(result.text, /Refusing to report PASS on an empty scan/, 'no refusal was printed');
  assert.ok(!result.text.includes('✅'), 'an empty scan printed a success marker');
});

/* ── the mutation set: what the classes provably cannot catch ─────────────── */

/**
 * ⛔ SYNTHETIC. `Quorrindale` is not a family name anybody uses, and the rest are
 * paraphrases with no identifier in them at all. They are here to demonstrate the
 * hole, and the hole is the point of the row in RAIL_MATRIX.md.
 */
const EVASIONS = [
  { what: 'a surname', text: 'The complainant is Quorrindale and the statement is short.\n' },
  { what: 'a relative date window', text: 'It happened the Tuesday after the long weekend.\n' },
  { what: 'a charge in words', text: 'He is charged with taking property that was not his.\n' },
  { what: 'a place in words', text: 'The building is the tall one behind the transit station.\n' },
  // ⚠️ THE RESIDUAL GAP IN THE REVIVED BADGE CLASS, asserted rather than described.
  // A bare six-digit token with no role word on the line is byte-identical to a #RRGGBB
  // colour, and the colour is the commoner thing by a wide margin, so the bare rule stops
  // at five digits and this one stays silent. Rule A (a role word on the line) is what
  // covers it, and a role word is present in every realistic case-fact sentence. This entry
  // exists so the gap is a measured fact and not a claim in a comment.
  {
    what: 'a six-digit token with nothing on the line to say it is not a colour',
    text: `The number recorded was #${joinWith('', 55, 1230)} and nothing else.\n`,
  },
];

test('the structural classes let a name and a paraphrase straight through, stated, not hidden', (t) => {
  proven('the evasion set', EVASIONS, { floor: 5 });
  const dir = gateSafeScratch('casefact-evasions');
  const caught = [];
  for (const evasion of EVASIONS) {
    const path = join(dir, `${evasion.what.replace(/[^a-z]+/gi, '-')}.md`);
    writeFileSync(path, evasion.text);
    const result = run('bash', [GATE, '--profile', 'legal', path]);
    if (result.status !== 0) caught.push(`${evasion.what} (exit ${result.status})`);
  }
  assert.deepEqual(
    caught,
    [],
    `the gate caught ${caught.join(', ')}, which the rail matrix records as UNCATCHABLE ` +
      'by the structural classes. Either the gate improved, in which case update the ' +
      'row, deliberately, or this test is measuring something else.',
  );
  t.diagnostic(
    `values the structural classes cannot catch: ${EVASIONS.length}. ` +
      'This rail is half-checked and the matrix row says so.',
  );
});

test('the gate says out loud that the real-value list was not supplied', () => {
  assert.match(
    gateRun.text,
    /MW_DENYLIST not set/,
    'the gate did not warn that it ran on structural classes only. That warning is ' +
      'the most load-bearing line in the output: without it a green reads as a clean ' +
      'tree, and a green over structural classes alone is not one.',
  );
});

test('and the missing half WORKS the moment a list is supplied', () => {
  // The mechanism, proven with a throwaway list of invented values held outside the
  // repository, which is where the real one has to live and where it is not yet.
  const dir = gateSafeScratch('denylist-proof');
  const target = join(dir, 'planted.md');
  writeFileSync(target, EVASIONS[0].text);
  const denylist = join(dir, 'invented-values.txt');
  writeFileSync(denylist, 'Quorrindale\n');

  const withList = run('bash', [GATE, '--profile', 'legal', target], {
    env: { MW_DENYLIST: denylist },
  });
  assert.equal(
    withList.status,
    1,
    `with a list supplied the gate exited ${withList.status}, not 1:\n${withList.text}`,
  );
  assert.match(withList.text, /RUNTIME DENYLIST HIT/, 'the real-value class did not report');

  // …and it refuses a list kept inside the repository, which would import the leak.
  const inside = join(REPO, 'ops', 'never-commit-this.txt');
  const refused = run('bash', [GATE, '--profile', 'legal', target], {
    env: { MW_DENYLIST: inside },
  });
  assert.equal(refused.status, 2, 'the gate accepted a denylist path inside the repository');
  assert.match(refused.text, /must live OUTSIDE this repo/, 'no refusal was printed');
});

/* ── the gate command's own scope, which is half of what keeps this rail honest ─ */

test('the gate reference scopes itself to what publishes, in its first paragraph', () => {
  const body = proven('skill/reference/gate.md', readRepo('skill/reference/gate.md'), {
    floor: 2000,
  });
  assert.ok(!/STATUS:\s*stub/i.test(body), 'gate.md is still marked a stub');

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !p.startsWith('#'));
  proven('the paragraphs of gate.md', paragraphs);
  const first = paragraphs[0];

  for (const needed of [/repositor/i, /public/i]) {
    assert.ok(
      needed.test(first),
      `gate.md's first paragraph does not scope the command (${needed} missing):\n${first}`,
    );
  }
  assert.ok(
    /lawyer|counsel/i.test(first),
    "gate.md's first paragraph does not say what it is NOT for. A package going to " +
      'counsel IS matter facts, and one gate over both either rejects everything ' +
      `useful or gets weakened until it proves nothing:\n${first}`,
  );
  assert.ok(
    /handoff verifier/i.test(body),
    'gate.md never names the handoff verifier, so somebody will reach for this gate ' +
      'instead of the tool that owns a package going to a lawyer',
  );
  // ⛔ And it must never offer the easy way out.
  assert.ok(
    /Never offer to weaken/i.test(body),
    'gate.md does not refuse to weaken the gate. "Switch that class off" is the ' +
      'first suggestion anybody makes when a run comes back red.',
  );
});
