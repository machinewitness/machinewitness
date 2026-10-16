#!/usr/bin/env node
/**
 * cli/bin/mw.js: the terminal front door.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔴 A LAUNCHER. NOT LOGIC, AND NOT A SECOND ENGINE.
 *
 * The package declares a command called `mw` and, until this file existed, that
 * declaration pointed at nothing, so the command could not be installed or run at
 * all. This is what it points at.
 *
 * It resolves one name to one program and hands over. It does not read the
 * contract, hold state, order anything, validate an answer, or restate a refusal.
 * The engine owns traversal, branch order, resumability, refusals and path
 * containment, and it owns them in ONE place. A launcher that re-decided any of
 * that would be a second implementation of the part with legal consequences, and
 * the two would disagree eventually.
 *
 * 🔴 EVERYTHING THAT TOUCHES A PERSON'S OWN FILES IS PYTHON 3 STANDARD LIBRARY.
 * This file starts one of those programs and gets out of the way: no argument is
 * interpreted, every argument after the command name is passed through unchanged,
 * and the program's exit code becomes this program's exit code. ADR 0007 decision
 * 10, the build tool is a build tool, and it may open the door but never do the
 * work.
 *
 * WHAT IT RUNS IS DERIVED, NEVER TYPED HERE. `skill/allowlist.json` already
 * declares, per command, what it runs and whether it is for a person or for
 * somebody working on this software; that declaration is checked against
 * `skill/reference/` by `tests/rails/allowlist.test.mjs`. Deriving the dispatch
 * from it means this file cannot name a command the project does not have, or miss
 * one it does. A table typed in here would be a second copy of a mapping, the
 * defect this project has already shipped twice, once as a count that said seven
 * long after the list had reached fourteen.
 *
 * ⛔ NO ARGUMENT RUNS `init`, AND NOTHING IS LISTED BY DEFAULT. A command table is
 * a recall interface, and acute stress removes recall first: a frightened person
 * cannot pick from a list of words they have never seen. `--help` lists them,
 * because somebody who typed `--help` asked for a list. An expert typing
 * `mw freeze` gets freeze.
 *
 * ⛔ AN UNKNOWN NAME IS REFUSED BY NAME. Never quietly turned into `init`: somebody
 * who typed a command meant that command, and starting a different one while
 * saying nothing is how a person ends up believing they did something they did not.
 *
 * ⚠️ IT SAYS NOTHING ABOUT WHERE WHAT THEY TYPE GOES, DELIBERATELY. The two true
 * sentences, that the files this makes stay on this machine, and that what a
 * person types to an assistant travels to whoever runs that assistant, have to be
 * said together or not at all, and the engine's own first screen says both, in one
 * place, in wording rewritten after a reader read the short version and asked "who
 * is that? A company? The police?". Half of that pair printed here would be the
 * reassuring half on its own.
 *
 * ⚠️ REFUSALS GO TO STANDARD OUTPUT, not to the error stream, because that is where
 * every engine here puts its own and because a relay reads one stream. Consistency
 * with the programs it launches beats the shell convention.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Exit codes. 🔴 NOT INVENTED HERE: read off the programs this launches, where
 * `EXIT_REFUSED = 3` and `EXIT_USAGE = 64` are declared as module constants. A
 * launcher with a scheme of its own would make a refusal indistinguishable from a
 * mistyped command at the shell, which is precisely the distinction the engines
 * bothered to encode. `tests/commands/mw.test.mjs` reads both files and asserts
 * these two numbers still agree with them.
 */
const EXIT_REFUSED = 3;
const EXIT_USAGE = 64;

/** The interpreter, by name, off the search path. There is no other candidate. */
const INTERPRETER = 'python3';

/**
 * The engine takes a subcommand and the other programs take their own arguments
 * directly, so with nothing to forward the launcher starts the engine at its first
 * screen. ⛔ This is the ONLY argument this file ever supplies, and which program
 * counts as the engine is derived below from whatever the declaration says `init`
 * runs, never from a path written here.
 */
const ENGINE_START = 'begin';

/**
 * 🔴 THE NAME IS THE DOCTRINE, not a position in a list. "No argument runs `init`"
 * is the same rule the skill definition states, so the name is written out rather
 * than taken from whichever command happens to be declared first, a reordered
 * declaration must not silently change what a bare `mw` does. If the declaration
 * does not hold it, this refuses rather than picking something.
 */
const DEFAULT_COMMAND = 'init';

const HERE = fileURLToPath(import.meta.url);
const ROOT = resolve(dirname(HERE), '..', '..');
const DECLARATION_REL = 'skill/allowlist.json';
const DECLARATION = join(ROOT, ...DECLARATION_REL.split('/'));

let status = 0;

function say(text) {
  process.stdout.write(`\n${text}\n\n`);
}

/** Print and remember. Nothing here calls `exit`: a pending write can be lost. */
function refuse(text, code = EXIT_REFUSED) {
  say(text);
  status = code;
  return null;
}

/* ── the declaration, proven before it is believed ─────────────────────────── */

/**
 * The declared commands, or a refusal. FAILS CLOSED at every step: a missing
 * file, an empty file, text that is not readable, and a declaration holding no
 * commands are four different problems and each one says which it is. An empty
 * read that returned an empty command list would look exactly like a project with
 * no commands, and this launcher would then refuse every name a person typed
 * while blaming the person.
 */
function declaredCommands() {
  if (!existsSync(DECLARATION)) {
    return refuse(
      `I cannot start: ${DECLARATION_REL} is missing.\n` +
        `  looked in  ${DECLARATION}\n` +
        'That file is what tells me which programs exist. The install is ' +
        'incomplete, do not work around it.',
    );
  }
  const text = readFileSync(DECLARATION, 'utf8');
  if (text.trim().length === 0) {
    return refuse(`I cannot start: ${DECLARATION_REL} is empty.`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return refuse(`I cannot start: ${DECLARATION_REL} is not readable: ${err.message}`);
  }
  const commands = Array.isArray(parsed?.commands) ? parsed.commands : [];
  if (commands.length === 0) {
    return refuse(
      `I cannot start: ${DECLARATION_REL} lists no commands, so I do not know what ` +
        'I would be starting.',
    );
  }
  return commands;
}

/**
 * The program a command runs, or `null` if it has none here.
 *
 * A single Python file under the scripts directory, present on disk, is the whole
 * of what this launcher will start. Anything else, a declaration that says a
 * command has no program of its own, a list of several tools, a command for
 * somebody working on this software rather than for a person, resolves to
 * nothing, and the caller says so in plain words instead of guessing.
 */
const SCRIPT = /^skill\/scripts\/[A-Za-z0-9_]+\.py$/;

function programOf(entry) {
  if (entry?.path_class !== 'user') return null;
  const runs = typeof entry?.runs === 'string' ? entry.runs.trim() : '';
  if (!SCRIPT.test(runs)) return null;
  const path = join(ROOT, ...runs.split('/'));
  return existsSync(path) ? path : null;
}

/* ── what a person reads ──────────────────────────────────────────────────── */

function help(commands) {
  const width = Math.max(...commands.map((c) => c.name.length));
  const lines = [
    'mw, keep the record that already exists about your own life intact, before it',
    '     is overwritten. Your own devices, your own accounts, your own exports.',
    '     It produces a record. It never produces a verdict.',
    '',
    '  mw            start here. There is nothing else you have to know.',
    '',
    'You asked for the list, so here it is. Each name is set out in the file beside',
    'it, and every one of them starts from the same place: the walk-through above.',
    '',
  ];
  for (const command of commands) {
    lines.push(`  ${command.name.padEnd(width)}   ${command.reference ?? ''}`.trimEnd());
  }
  process.stdout.write(`${lines.join('\n')}\n`);
}

function unknown(name) {
  return refuse(
    `I do not know a command called ${JSON.stringify(name)}, and I am not going to ` +
      'guess which one you meant.\n' +
      '  for the list   mw --help\n' +
      '  to just start  mw\n' +
      'Nothing has been read, copied or changed.',
    EXIT_USAGE,
  );
}

function noProgramHere(entry) {
  if (entry.path_class === 'contributor') {
    return refuse(
      `${JSON.stringify(entry.name)} is for somebody working on this software, not ` +
        'for somebody using it, and it is run from a copy of the source rather than ' +
        'from here.\n' +
        `  it runs        ${entry.runs}\n` +
        `  set out in     ${entry.reference ?? '(none)'}\n` +
        'If you are here to keep your own records, run  mw',
      EXIT_USAGE,
    );
  }
  return refuse(
    `${JSON.stringify(entry.name)} has no program of its own. It is something the ` +
      'assistant reads and tells you, so there is nothing here for me to start.\n' +
      `  set out in     ${entry.reference ?? '(none)'}\n` +
      'To go through it yourself, run  mw',
    EXIT_USAGE,
  );
}

function interpreterMissing() {
  return refuse(
    `I need ${INTERPRETER} and I cannot find it on this machine.\n` +
      'Everything that touches your own files is written in Python 3, which is free ' +
      'and is already on most machines.\n' +
      `  to check        type  ${INTERPRETER} --version  in a terminal\n` +
      '  on a Mac        typing it once offers to install it for you\n' +
      'Once it is there, none of this needs the internet again.\n' +
      'I have not read, copied or changed anything.',
  );
}

/* ── dispatch ─────────────────────────────────────────────────────────────── */

const HELP = new Set(['--help', '-h', 'help']);

function main(argv) {
  const commands = declaredCommands();
  if (commands === null) return;

  const byName = (name) => commands.find((command) => command.name === name);

  const started = byName(DEFAULT_COMMAND);
  if (!started) {
    refuse(
      `I cannot start: ${DECLARATION_REL} does not declare a command called ` +
        `${JSON.stringify(DEFAULT_COMMAND)}, which is the one a bare \`mw\` runs. ` +
        'I will not substitute another one.',
    );
    return;
  }

  // 🔴 NO ARGUMENT RUNS `init`. Never a list, never a menu.
  const first = argv.length === 0 ? DEFAULT_COMMAND : argv[0];
  const forwarded = argv.length === 0 ? [] : argv.slice(1);

  if (HELP.has(first)) {
    help(commands);
    return;
  }

  const entry = byName(first);
  if (!entry) {
    unknown(first);
    return;
  }

  const program = programOf(entry);
  if (program === null) {
    noProgramHere(entry);
    return;
  }

  // Which program is the engine is derived, not written down: it is whatever the
  // command a bare `mw` runs runs. Only that one is handed a starting subcommand.
  const engine = programOf(started);
  const args = program === engine && forwarded.length === 0 ? [ENGINE_START] : forwarded;

  const run = spawnSync(INTERPRETER, [program, ...args], {
    stdio: 'inherit',
    // Bytecode caching would write into the install tree just because somebody ran
    // this. Nothing on a user path is declared to write there, and a person's
    // machine should look the same after a run as before it.
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
  });

  if (run.error) {
    if (run.error.code === 'ENOENT') {
      interpreterMissing();
      return;
    }
    refuse(
      `I could not start ${INTERPRETER}: ${run.error.message}\n` +
        'I have not read, copied or changed anything.',
    );
    return;
  }

  if (run.status === null) {
    // Stopped rather than finished, most often somebody pressing the key that
    // interrupts a program. Said plainly, because a silent non-zero looks like a
    // refusal and this is not one.
    say(`${INTERPRETER} was stopped before it finished (${run.signal}).`);
    status = EXIT_REFUSED;
    return;
  }

  // 🔴 UNCHANGED. A refusal that arrived as a zero would be a gate turned into a
  // phrase, and the engines use distinct codes so that a rejected answer, a
  // refusal and a mistyped command can be told apart by whatever called them.
  status = run.status;
}

main(process.argv.slice(2));
process.exitCode = status;
