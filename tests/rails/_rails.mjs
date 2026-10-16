/**
 * tests/rails/_rails.mjs: shared plumbing for the rail tests.
 *
 * ⚠️ NOT A TEST FILE, deliberately. `node --test` discovers `*.test.mjs`; this is
 * `_rails.mjs`, so it is imported and never run as a suite. Same reason as
 * `tests/contract/_harness.mjs`.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 THREE PROPERTIES EVERY RAIL TEST IN THIS DIRECTORY MUST HAVE. They are
 * implemented here so that no individual test can quietly do without one.
 *
 *  1. NON-EMPTY INPUT, OR ABORT. `grep … || pass` is green on an empty input,
 *     because "not found" and "nothing read" are the same output. Every scan
 *     here goes through `proven()`, which throws on an empty target rather than
 *     returning a clean result. This is the exact failure that put this project's
 *     continuous integration green over a run that read ZERO BYTES, in an
 *     already-pushed repository, inside the wrapper written to report that
 *     failure.
 *
 *  2. A PLANTED VIOLATING FIXTURE, AND IT MUST FAIL. A test that has never
 *     failed has never been tested. Every checker in this file is a pure
 *     function over text, so each rail test runs it twice: over the real target,
 *     asserting silence, and over a planted violation, asserting it fires.
 *
 *  3. A MUTATION SET, AND EXECUTION WHERE BEHAVIOUR IS TESTABLE. A planted
 *     literal proves only that the scanner sees that literal. So each rail test
 *     carries semantic evasions (synonyms, indirect phrasing) and where the
 *     behaviour can be run, it is run and judged on what it DID rather than on
 *     what it says.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ⛔ A RED TEST IN THIS DIRECTORY IS CORRECT. Three rails have no feature to
 * enforce yet. Their tests are written against the real thing, marked with
 * `expectedRed`, and each carries a trip-wire that FAILS the day its target
 * appears, so the day the feature lands, the suite demands the rail rather than
 * inheriting a green. Do not point one at a stub to make it pass; a test that
 * passes because its target is absent is this project's headline failure mode.
 */

import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  contract,
  documentOrder,
  driveRoute,
  enumerateRoutes,
  nodesById,
  optionsOf,
  recordNodes,
} from '../contract/_harness.mjs';

export { contract, documentOrder, nodesById, optionsOf, recordNodes };

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ENGINE = join(REPO, 'skill', 'scripts', 'triage.py');
export const GATE = join(REPO, 'skill', 'scripts', 'capture_audit.py');
export const FREEZE = join(REPO, 'skill', 'scripts', 'freeze.py');
export const VERIFY = join(REPO, 'skill', 'scripts', 'verify.py');
export const ALLOWLIST_PATH = join(REPO, 'skill', 'allowlist.json');

/* ── 1. NON-EMPTY INPUT, OR ABORT ─────────────────────────────────────────── */

/**
 * Prove a scan target is real before anything judges it. Throws rather than
 * returning, so a caller cannot accidentally treat an empty target as clean.
 */
export function proven(label, value, { floor = 1 } = {}) {
  if (typeof value === 'string') {
    assert.ok(
      value.length >= floor,
      `ABORT, ${label} is ${value.length} characters (needs ${floor}). ` +
        'An absence assertion over an empty input is worthless, so this fails ' +
        'rather than passing.',
    );
    return value;
  }
  assert.ok(Array.isArray(value), `ABORT, ${label} is not a list or a string`);
  assert.ok(
    value.length >= floor,
    `ABORT, ${label} holds ${value.length} item(s) (needs ${floor}). ` +
      'Nothing would have been read, and the result would have looked identical ' +
      'to a clean one.',
  );
  return value;
}

/* ── the repository, as git sees it ───────────────────────────────────────── */

let trackedCache = null;
/** Every tracked path, repo-relative. What the gate scans and what would publish. */
export function tracked() {
  if (trackedCache) return trackedCache;
  const run = spawnSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' });
  assert.equal(run.status, 0, `git ls-files failed: ${run.stderr}`);
  const files = run.stdout.split('\n').map((l) => l.trim()).filter(Boolean);
  trackedCache = proven('the tracked file set', files, { floor: 50 });
  return trackedCache;
}

export function readRepo(rel) {
  const path = join(REPO, rel);
  assert.ok(existsSync(path), `${rel} does not exist`);
  return readFileSync(path, 'utf8');
}

/** Files under `rel`, recursively, repo-relative, sorted. Empty if absent. */
export function listUnder(rel, extensions = null) {
  const root = join(REPO, rel);
  if (!existsSync(root)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      // ⚠️ `node_modules` is NOT skipped: one check looks for a dependency tree
      // shipped inside the skill, and skipping the name would make that check unable
      // to fail. `.git` is skipped because it is object storage, not source.
      if (entry.name === '__pycache__' || entry.name === '.DS_Store' || entry.name === '.git') {
        continue;
      }
      const child = join(dir, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile()) {
        const relPath = relative(REPO, child).split(sep).join('/');
        if (!extensions || extensions.some((e) => relPath.endsWith(e))) out.push(relPath);
      }
    }
  };
  walk(root);
  return out.sort();
}

/* ── the allowlist ────────────────────────────────────────────────────────── */

let allowlistCache = null;
export function allowlist() {
  if (allowlistCache) return allowlistCache;
  const bytes = readFileSync(ALLOWLIST_PATH);
  proven('skill/allowlist.json', bytes.toString('utf8'), { floor: 1000 });
  allowlistCache = JSON.parse(bytes.toString('utf8'));
  return allowlistCache;
}

/* ── 2. STATIC CAPABILITY EXTRACTION ──────────────────────────────────────── */

/**
 * Every shape that acquires a capability, in Python and in JavaScript. The JavaScript
 * half was written speculatively, against a command-line entry point that did not exist
 * yet; `cli/bin/mw.js` now exists, it IS JavaScript, and it starts a child process, so
 * that half is live rather than anticipatory.
 *
 * ⚠️ Comments are NOT stripped. Over-reporting forces a declaration or a reword;
 * under-reporting is how a capability hides. The engine's own text carries none
 * of the network tokens, so the conservative reading costs nothing here.
 */
const CAPABILITY_PATTERNS = [
  {
    cls: 'subprocess',
    re: /\b(?:subprocess\.(?:run|Popen|call|check_output|check_call)|os\.(?:system|popen|exec[a-z]+|spawn[a-z]+)|pty\.spawn|shutil\.which|commands\.getoutput)\b/g,
  },
  {
    cls: 'subprocess',
    re: /\b(?:child_process|spawnSync|execSync|execFileSync|execFile|spawnFileSync)\b/g,
  },
  {
    cls: 'network',
    re: /\b(?:socket|urllib|httplib|ftplib|smtplib|poplib|imaplib|telnetlib|xmlrpc|requests|aiohttp|urlopen|webbrowser|asyncio|ssl)\b/g,
  },
  {
    cls: 'network',
    re: /\b(?:XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon)\b|\bnode:(?:https?|net|tls|dns|dgram)\b|\bfetch\s*\(|https?:\/\/[a-z0-9.-]+/gi,
  },
  {
    cls: 'write',
    re: /\.write_text|\.write_bytes|\.mkdir\b|os\.makedirs\b|os\.mkdir\b|os\.remove\b|os\.unlink\b|\.unlink\b|os\.rename\b|os\.replace\b|shutil\.(?:copy2|copy|copyfile|copytree|move|rmtree)|os\.chmod\b|os\.chown\b|tempfile\.(?:mkdtemp|mkstemp|NamedTemporaryFile|TemporaryDirectory)/g,
  },
  {
    cls: 'write',
    re: /\b(?:writeFileSync|appendFileSync|createWriteStream|mkdirSync|mkdtempSync|rmSync|rmdirSync|unlinkSync|renameSync|copyFileSync|chmodSync)\b/g,
  },
  {
    cls: 'indirect',
    re: /__import__|\bimportlib\b|(?<![\w.])eval\s*\(|(?<![\w.])exec\s*\(|(?<![\w.])compile\s*\(|new\s+Function\s*\(|\bgetattr\s*\(\s*(?:os|sys|subprocess|socket|shutil|importlib|builtins)\b/g,
  },
];

/** `open(…, "w")` and friends. A read-mode open is not a write capability. */
const OPEN_FOR_WRITE = /\bopen\s*\([^)\n]*["'][rbt]*[wax+][rbt+]*["']/g;

/**
 * `getattr(os, "getuid", None)` is a literal name and is therefore perfectly
 * visible to a static reading. It is a portability probe, not an evasion. But it
 * would slip past the primary patterns, which look for `os.getuid`. So a LITERAL
 * attribute lookup is rewritten to its dotted form before the patterns run, which
 * makes `getattr(os, "system")` fail as an undeclared child process rather than
 * as an unclassified oddity.
 *
 * ⚠️ The closing quote must be followed by a comma or a closing bracket, so a
 * name ASSEMBLED from pieces (`getattr(os, "sys" + "tem")`) is left alone and
 * caught by the indirect pattern, which is where it belongs. Narrowing this any
 * further would fix a false positive by exempting a file; this fixes it by class.
 */
const GETATTR_LITERAL = /\bgetattr\s*\(\s*([A-Za-z_][\w.]*)\s*,\s*["']([A-Za-z_]\w*)["'](?=\s*[,)])/g;

/**
 * Extract every capability site from a list of repo-relative source files.
 * Returns `{ sites, byKey, files }` where a key is `class:token@file`: the
 * granularity of a CAPABILITY, not of a line, because what is being declared is
 * "this file may spawn a process", not "line 2313 may".
 */
export function capabilitySites(files) {
  return extractSites(files.map((rel) => ({ file: rel, text: readRepo(rel) })));
}

/**
 * The same extraction over text handed in directly, so a planted violation can
 * be run through the identical code path as the real tree. A fixture checked by
 * a second implementation proves nothing about the first.
 */
export function extractSites(blocks) {
  proven('the source blocks handed to the extractor', blocks);
  const sites = [];
  for (const { file: rel, text } of blocks) {
    proven(`the source of ${rel}`, text, { floor: 1 });
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const original = lines[i];
      const line = original.replace(GETATTR_LITERAL, (_, obj, name) => `${obj}.${name}`);
      for (const { cls, re } of CAPABILITY_PATTERNS) {
        re.lastIndex = 0;
        let m;
        while ((m = re.exec(line)) !== null) {
          sites.push({ cls, token: m[0], file: rel, line: i + 1, text: original.trim() });
        }
      }
      OPEN_FOR_WRITE.lastIndex = 0;
      if (OPEN_FOR_WRITE.test(line)) {
        sites.push({ cls: 'write', token: 'open(w)', file: rel, line: i + 1, text: original.trim() });
      }
    }
  }
  const byKey = new Map();
  for (const site of sites) {
    const key = `${site.cls}:${site.token}@${site.file}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(site);
  }
  return { sites, byKey, files: blocks.map((b) => b.file) };
}

/**
 * The diff, both directions.
 *
 *   undeclared    a capability the code has and this file does not admit to
 *   dead          a declaration with no site behind it, an allowlist growing to
 *                 describe capabilities the code does not have is a rubber stamp
 *                 forming, and it is the risk this file was written to carry
 *   network       any outbound shape at all
 *   indirect      a capability reached by building a name at run time. NOT
 *                 declarable, because a declaration for it could not be checked
 */
export function diffAgainstDeclaration(extracted, declared) {
  const undeclared = [];
  const network = [];
  const indirect = [];
  for (const [key, sites] of extracted.byKey) {
    const [cls] = key.split(':', 1);
    if (cls === 'network') { network.push({ key, sites }); continue; }
    if (cls === 'indirect') { indirect.push({ key, sites }); continue; }
    if (!declared.has(key)) undeclared.push({ key, sites });
  }
  const dead = [...declared.keys()].filter((key) => !extracted.byKey.has(key));
  return { undeclared, dead, network, indirect };
}

/** The declared keys, in the same shape the extractor produces. */
export function declaredKeys(list = allowlist()) {
  const keys = new Map();
  for (const entry of list.subprocesses ?? []) {
    keys.set(`subprocess:${entry.call}@${entry.in}`, entry);
  }
  for (const entry of list.filesystem_writes ?? []) {
    keys.set(`write:${entry.call}@${entry.in}`, entry);
  }
  return keys;
}

/* ── constants that live in the programs, never in a test ─────────────────── */

/**
 * The quoted strings of a single-line module constant, read out of a program's own
 * source.
 *
 * ⛔ NOT TYPED IN A TEST. The engine's comment on `WORKSPACE_DIRS` says the two
 * folder names exist because the internal words for them frightened a reader who
 * opened their own folder, and that anything reading or writing them takes them
 * from that constant. A test that hard-coded one would keep passing after somebody
 * changed it, which is the one thing that arrangement is meant to make impossible.
 */
export function constantsIn(rel, name) {
  const source = proven(`the source of ${rel}`, readRepo(rel), { floor: 500 });
  const line = new RegExp(String.raw`^${name}\s*=\s*(.+)$`, 'm').exec(source);
  assert.ok(line, `${rel} no longer declares ${name} on one line`);
  const values = [...line[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  return proven(`the values of ${name} in ${rel}`, values, { floor: 1 });
}

/** The two folder names a person sees in their own folder. From the engine. */
export function workspaceDirs() {
  return proven(
    'the folder names in the engine constant',
    constantsIn('skill/scripts/triage.py', 'WORKSPACE_DIRS'),
    { floor: 2 },
  );
}

/** The engine's working note, by the name the engine gives it. */
export function stateFilename() {
  return constantsIn('skill/scripts/triage.py', 'STATE_FILENAME')[0];
}

/** Where the go-ahead is kept inside a person's folder. From the gate's own constant. */
export function goAheadPath(workspace) {
  const [, recordDir] = workspaceDirs();
  const name = constantsIn('skill/scripts/capture_audit.py', 'PERMISSION_FILENAME')[0];
  return join(workspace, recordDir, name);
}

/**
 * Make a folder one of ours and obtain a real go-ahead in it for one source and one
 * operation. Returns the path of the go-ahead on disk.
 *
 * 🔴 BOTH HALVES ARE PRODUCED BY THE REAL PROGRAMS, and that is the point rather
 * than convenience. The check refuses a working note written by hand, correctly,
 * because a note written by hand is a record of nothing, so a fixture that forged
 * one would be testing the forgery instead of the tool. The engine adopts the
 * folder; the real check issues the go-ahead; this function writes neither file.
 *
 * ⚠️ It is a FIXTURE, not a bypass. Nothing here weakens the check: the go-ahead it
 * produces is bound to that one source, that one operation, that one folder, that
 * one contract and this moment, exactly as a person's would be. Every refusal is
 * proven separately, against the same real check, in
 * `tests/rails/capture-audit-binding.test.mjs`.
 */
export function goAhead(workspace, source, operation, options = {}) {
  const { home = null, arrivedAs = 'already-on-your-device' } = options;
  const [, recordDir] = workspaceDirs();
  mkdirSync(join(workspace, recordDir), { recursive: true });

  const env = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' };
  if (home) env.HOME = home;

  const begun = spawnSync('python3', [ENGINE, 'begin', '--workspace', workspace], {
    cwd: workspace,
    encoding: 'utf8',
    env,
  });
  assert.equal(
    begun.status,
    0,
    `the engine would not adopt ${workspace} as a folder of its own:\n${begun.stdout}\n${begun.stderr}`,
  );

  const issued = spawnSync(
    'python3',
    [
      GATE,
      'audit',
      '--workspace',
      workspace,
      '--source',
      source,
      '--operation',
      operation,
      '--arrived-as',
      arrivedAs,
      '--might-hold-intimate-media',
      'no',
      '--closed-by-your-conditions',
      'no',
    ],
    { cwd: workspace, encoding: 'utf8', env },
  );
  assert.equal(
    issued.status,
    0,
    `no go-ahead was issued for ${operation} on ${source}:\n${issued.stdout}\n${issued.stderr}`,
  );

  // 🔴 PROVE IT IS ON DISK AND NOT EMPTY. A fixture that silently produced nothing
  // would make every refusal below it unfalsifiable. The command would refuse for
  // want of a go-ahead and the test would read it as the gate working.
  const path = goAheadPath(workspace);
  assert.ok(existsSync(path), `the go-ahead was not written at ${path}`);
  proven('the go-ahead on disk', readFileSync(path, 'utf8'), { floor: 100 });
  return path;
}

/* ── 3. HUMAN-FACING TEXT ─────────────────────────────────────────────────── */

const TMP = realpathSync(mkdtempSync(join(tmpdir(), 'mw-rails-')));
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));

export function scratch(name) {
  const dir = join(TMP, name);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Every screen the engine can render, over every routing-distinct path through
 * the contract. Enumerated by graph walk, never by example.
 */
let renderedCache = null;
export function renderedScreens() {
  if (renderedCache) return renderedCache;
  const routes = proven('the enumerated routes', enumerateRoutes());
  const screens = [];
  for (const route of routes) {
    for (const screen of driveRoute(route).screens) {
      screens.push({ node: screen.node, step: screen.step, rendered: screen.rendered });
    }
  }
  renderedCache = proven('the rendered screens', screens, { floor: 20 });
  return renderedCache;
}

export function renderedText() {
  return proven('the rendered text', renderedScreens().map((s) => s.rendered).join('\n'), {
    floor: 4000,
  });
}

/**
 * ⚖️ The jurisdiction codes on offer, read from the pack summary the engine itself
 * reads and verifies. Never typed here: a list of country codes in a test file is
 * a second source of truth for which packs exist, and the copy that goes stale is
 * the one nobody is looking at.
 */
export function jurisdictionCodes() {
  const packs = JSON.parse(readRepo('skill/data/packs.json'));
  return proven('the jurisdiction codes on offer', packs.codes ?? []);
}

/**
 * A real walk of the real commands, in a throwaway folder with a throwaway home,
 * returning every byte the person would see AND every file left in their folder.
 *
 * ⛔ HOME is redirected. The opt-in pointer is written under the home directory,
 * and a test that opted in against the real one would leave a file listing case
 * folders on the machine of whoever ran the suite.
 */
let walkCache = null;
export function realWalk() {
  if (walkCache) return walkCache;
  const home = scratch('pretend-home');
  const start = scratch('a-session');
  const folder = join(start, 'their-folder');
  const env = { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' };

  const run = (args, cwd) =>
    spawnSync('python3', [ENGINE, ...args], { cwd, encoding: 'utf8', env });

  let cwd = start;
  const printed = [];
  const begun = run(['begin'], cwd);
  assert.equal(begun.status, 0, `begin failed:\n${begun.stdout}\n${begun.stderr}`);
  printed.push(begun.stdout);

  // Force the answers that make the walk cover the most ground: a condition, a
  // no-contact condition, and no lawyer, so closed paths exist to be written.
  const forced = { H1: 'yes', H2: 'yes', H4: 'no' };
  const declined = recordNodes[recordNodes.length - 1];
  forced[declined] = 'no';

  for (let guard = 0; guard < 200; guard += 1) {
    const state = run(['state'], cwd);
    assert.equal(state.status, 0, `state failed:\n${state.stdout}\n${state.stderr}`);
    const parked = JSON.parse(state.stdout.slice(state.stdout.indexOf('{'))).parked_on;
    if (parked === 'PLAN') {
      walkCache = {
        folder,
        home,
        printed: proven('the real walk output', printed.join('\n'), { floor: 4000 }),
        artifacts: readdirSync(folder)
          .filter((name) => statSync(join(folder, name)).isFile())
          .sort()
          .map((name) => ({ name, body: readFileSync(join(folder, name), 'utf8') })),
        entries: readdirSync(folder).sort(),
        declined,
      };
      proven('the folder contents', walkCache.artifacts, { floor: 4 });
      return walkCache;
    }
    let reply;
    if (parked === 'W1') reply = folder;
    else if (parked === 'W2') reply = 'yes';
    else if (parked === 'W3') reply = 'ok';   // A22: it states, it does not ask
    // ⚖️ W4 is the jurisdiction screen. Its options come from the packs, not from
    // the contract, so `optionsOf` (which reads contract nodes) has nothing for it.
    // Read from the same digest-verified file the engine reads, never typed here.
    else if (parked === 'W4') reply = jurisdictionCodes()[0];
    else if (parked === 'S0') reply = 'ok';
    else reply = forced[parked] ?? optionsOf(parked)[0];

    const answered = run(['answer', reply], cwd);
    assert.equal(
      answered.status,
      0,
      `answering ${JSON.stringify(reply)} at ${parked} failed:\n${answered.stdout}\n${answered.stderr}`,
    );
    printed.push(answered.stdout);
    if (parked === 'W2' && reply === 'yes') cwd = folder;
  }
  assert.fail('the real walk did not reach the plan within 200 steps');
  return null;
}

/**
 * A real freeze and a real verify, in a throwaway folder with a throwaway home.
 *
 * 🔴 WHY THIS EXISTS. `realWalk()` drives the engine and nothing else, so for as long as
 * the hard tier was built from it alone, the four copy rails covered `triage.py` and left
 * out both commands that touch the person's own evidence, everything `freeze` and
 * `verify` PRINT, every record file `freeze` writes, and the names it creates in their
 * folder. The gap was coverage rather than a live breach, which is exactly the kind of
 * gap that survives: nothing failed while nothing was read.
 *
 * ⛔ A FOLDER LISTING IS A SCREEN, and it is the one screen that cannot be taken back
 * once it is on somebody's disk, a person who opens their own folder a month later reads
 * whatever these commands named. That is why the workspace directories are plain words,
 * and it is why the recursive listing is returned here as scannable text.
 *
 * ⚠️ THE COPIED BYTES ARE DELIBERATELY NOT RETURNED. `frozen-copies/<set>/…` is the
 * person's own file, copied verbatim; scanning it would scan the INPUT rather than the
 * software's words, and a vocabulary hit there would be a hit on somebody's own document.
 * Their NAMES are in scope and arrive through the listing.
 *
 * ⚠️ The fixture files are named and worded neutrally on purpose. They appear in the
 * listing and inside the record, so a fixture named after anything would inject its own
 * vocabulary into a check meant to be reading the software's.
 */
let sealCache = null;
export function realSeal() {
  if (sealCache) return sealCache;
  const base = scratch('a-sealing');
  const home = join(base, 'pretend-home');
  const origin = join(base, 'their-files');
  const workspace = join(base, 'their-folder');
  for (const dir of [home, origin, workspace]) mkdirSync(dir, { recursive: true });
  writeFileSync(join(origin, 'a-note.txt'), 'one line, and then a second line\n');
  writeFileSync(join(origin, 'another-note.txt'), 'a short body\n');

  // Two go-aheads, one per operation, because the binding is per operation, and both
  // issued by the real check, exactly as `goAhead` documents.
  goAhead(workspace, origin, 'freeze', { home });
  goAhead(workspace, workspace, 'verify', { home });

  const env = { ...process.env, HOME: home, PYTHONDONTWRITEBYTECODE: '1' };
  const run = (script, args) =>
    spawnSync('python3', [script, ...args], { cwd: base, encoding: 'utf8', env });

  const frozen = run(FREEZE, [origin, '--into', workspace, '--name', 'a-set']);
  assert.equal(frozen.status, 0, `freeze failed:\n${frozen.stdout}\n${frozen.stderr}`);
  const checked = run(VERIFY, ['--into', workspace]);
  assert.equal(checked.status, 0, `verify failed:\n${checked.stdout}\n${checked.stderr}`);

  const [copiesDir, recordDir] = workspaceDirs();
  const records = readdirSync(join(workspace, recordDir))
    .sort()
    .filter((name) => statSync(join(workspace, recordDir, name)).isFile())
    .map((name) => ({
      name: `${recordDir}/${name}`,
      body: readFileSync(join(workspace, recordDir, name), 'utf8'),
    }));

  const listing = [];
  const walkNames = (dir, prefix) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const shown = prefix ? `${prefix}/${entry.name}` : entry.name;
      listing.push(shown);
      if (entry.isDirectory()) walkNames(join(dir, entry.name), shown);
    }
  };
  walkNames(workspace, '');

  sealCache = {
    workspace,
    home,
    printed: proven('what freeze and verify printed', `${frozen.stdout}\n${checked.stdout}`, {
      floor: 400,
    }),
    records: proven('the record files freeze wrote', records, { floor: 3 }),
    listing: proven('the listing the two commands left behind', listing, { floor: 6 }),
  };
  // The copies really were made, so the listing is of a real sealed set rather than of an
  // empty folder that happened to have the right shape.
  assert.ok(
    listing.some((name) => name.startsWith(`${copiesDir}/`)),
    `nothing was copied into ${copiesDir}/, so this listing establishes nothing`,
  );
  return sealCache;
}

/**
 * Everything a person could read, in two tiers. The tiers exist because they
 * take different exclusions, and collapsing them is how a copy check ends up
 * either useless or dishonest.
 *
 *   hard   what the software actually shows: rendered screens, everything the
 *          real commands printed, the engine AND both commands that touch the
 *          person's own evidence, every file left in the person's folder, and the
 *          NAMES of everything created there.
 *          ⛔ NO EXCLUSIONS ARE POSSIBLE HERE, and none are taken.
 *   copy   the documentation a person or a lawyer may read. Takes exclusions,
 *          and each one is stated at its site.
 */
export function hardHumanText() {
  const walk = realWalk();
  const seal = realSeal();
  const parts = [
    { label: 'rendered screens', text: renderedText() },
    { label: 'what the real commands printed', text: walk.printed },
    ...walk.artifacts.map((a) => ({ label: `their folder: ${a.name}`, text: a.body })),
    { label: 'their folder listing', text: walk.entries.join('\n') },
    { label: 'what freeze and verify printed', text: seal.printed },
    ...seal.records.map((r) => ({ label: `their folder: ${r.name}`, text: r.body })),
    { label: 'their folder listing after a real freeze and verify', text: seal.listing.join('\n') },
  ];
  for (const part of parts) proven(part.label, part.text, { floor: 1 });
  return proven('the hard human-facing text', parts, { floor: 10 });
}

/**
 * Documentation a person, a lawyer or a contributor may read. Derived by glob and
 * from the tracked set, never typed, so a file added to any of these trees is
 * covered without anybody editing a list.
 *
 * ⚠️ The generated provider trees are NOT in here, deliberately: they are
 * byte-identical copies of `skill/`, locked by digest and asserted equal in
 * `tests/contract/generated.test.mjs`, so scanning them would triple every count
 * and report the same finding three times.
 */
export function copyDocs() {
  const roots = [
    ...tracked().filter((f) => /^[A-Z_]+\.md$/.test(f)),
    ...listUnder('skill/reference', ['.md']),
    'skill/SKILL.src.md',
    ...listUnder('jurisdictions', ['.md']),
    ...listUnder('legal', ['.md']),
    ...listUnder('docs', ['.md']),
  ];
  const unique = [...new Set(roots)].sort();
  return proven('the human-readable documentation set', unique, { floor: 10 }).map((rel) => ({
    label: rel,
    text: readRepo(rel),
  }));
}

/* ── scanning, with stated exclusions ─────────────────────────────────────── */

/**
 * A line that FORBIDS the thing it names is not the thing it names. A rail
 * cannot ban a phrase without writing it, and a limits document cannot say what
 * it will not do without saying it.
 *
 * ⚠️ This is the single exclusion that makes a copy check possible at all, and it
 * is also the one that could swallow a real hit. Every test that uses it plants
 * a bare violation with no negation and asserts it still fires.
 */
const NEGATION = /(⛔|\bnever\b|\bno\b|\bnot\b|\bnothing\b|\bban(?:ned|s)?\b|\bforbid|\bbar(?:red|s)?\b|\brefus|\binstead of\b|\brather than\b|\bavoid|\bcannot\b|\bcan't\b|\bwithout\b|\bplanted\b|\bfixture\b)/i;

/**
 * A LIST-INTRODUCING COLON, and nothing else that looks like one.
 *
 * The colon must END its token, followed by whitespace, by a markdown emphasis or
 * quote character, or by the end of the text. So `Banned in copy and UI:` anchors,
 * while `https://…` and `12:30` do not, and neither does a bare `::`.
 */
const LIST_COLON = /:(?=$|[\s*_"'`”’)\]])/g;

/**
 * A PUNCTUATION MARK THAT STARTS A NEW INDEPENDENT CLAUSE, rather than one that
 * continues an enumeration. This distinction is the whole fix, and getting it wrong in
 * either direction is expensive:
 *
 *   `What not to touch, and it will prove your innocence`   two clauses. `not` governs
 *                                                            the first. MUST fire.
 *   `No price, tier, trial, quota, seat, key, or account`    one prohibition over a
 *                                                            list. `No` governs all of
 *                                                            it. MUST NOT fire.
 *
 * A bare comma cannot tell those apart, the first draft of this fix used one and fired
 * on THIRTEEN of the project's own ban lists, in the contributing guide, two decision
 * records, the doctrine, the README, the skill definition and four jurisdiction packs.
 * So the comma has to be followed by something that opens a clause: a coordinating
 * conjunction, or a subject pronoun or demonstrative. An enumeration's next item is a
 * bare noun phrase and matches neither.
 *
 * ⚠️ Deliberately NOT here: `not`, `no` and `never`, which do open clauses in this
 * project's prose (`record, not a result`), but they are negation markers themselves,
 * so treating them as boundaries would cut off the marker the exclusion needs.
 *
 * ⚠️ And the punctuation is a comma or a semicolon only, NOT a dash. The doctrine reads
 * *…being there on day one for nothing, and by the time one starts, the short-loop
 * records are gone.* on the line above *A paywall on evidence preservation is a paywall
 * on the truth surviving*, which is a refusal with no marker of its own. Treating the
 * dash as an opener fired on it. Narrowed here rather than exempting the file, and
 * nothing needed the dash: every planted violation is joined with a comma.
 */
const CLAUSE_OPENER = new RegExp(
  String.raw`[,;]\s*(?=(?:and|but|or|nor|so|yet|then)\s` +
    String.raw`|(?:it|they|you|we|he|she|this|that|these|those|there|nobody|nothing|no[- ]one)\s)`,
  'gi',
);

/**
 * 🔴 THE SPAN A MARKER CAN GOVERN. This is the whole rule, and the second half of it
 * was a live defect rather than a design.
 *
 * FIRST HALF, the marker must come BEFORE the match. The original version tested the
 * whole line and exempted `It will show you were not there`, a bare promise whose own
 * grammar contains a negation. A prohibition is written before the thing it prohibits,
 * so requiring the marker in the PRECEDING text separates *forbidding a phrase* from
 * *phrasing something in the negative*.
 *
 * SECOND HALF, and a marker governs its own clause, not the rest of the line. Because
 * the first half was line-scoped, ANY negation word earlier on a line made every
 * promise later on that line invisible:
 *
 *     This will prove your innocence completely.                       → fired
 *     What not to touch, and it will prove your innocence completely.  → SILENT
 *
 * 🔴 That is not hypothetical. A shipped over-claim (*so nobody can claim tampering*)
 * sat in the skill definition on a line beginning *…what not to touch…*, and this
 * exclusion swallowed it. It was found by eye. And the blind spot sat exactly where an
 * over-claim is most likely to be written, because natural prose about what a tool
 * REFUSES carries a negation marker almost by definition, so every paragraph
 * describing a limit was an unscanned paragraph.
 *
 * So the scope is the clause the match sits in, plus the clause that INTRODUCES it:
 *
 *   1. A list-introducing colon anchors, and the text up to and including it stays in
 *      scope whole. `Banned in name, domain, copy, UI, sales conversation, and
 *      testimonial: acquit · cleared · exonerate` is ONE prohibition and its list, and
 *      every ban list this project writes has that shape. Five of the project's own
 *      exclusions are that sentence. Segmenting it at its commas would fire on all of
 *      them, which is how a check ends up needing exemptions on precisely the files
 *      that define the rule.
 *   2. After that colon, only the LAST clause governs, see `CLAUSE_OPENER` for what
 *      starts one, and why a bare comma is not it.
 *
 * ⚠️ RESIDUALS, STATED. This is a text rule over natural language and it is deliberately
 * the coarser of the two available readings:
 *
 *   · A marker earlier in the SAME clause still suppresses. `We never say this will
 *     prove your innocence` is one clause, and that is the case the exclusion is for.
 *   · A marker in a DIFFERENT SENTENCE on the same line still suppresses, because a
 *     sentence terminator is deliberately NOT a boundary. Markdown hard-wraps, and a
 *     document that forbids a phrase in one sentence and quotes it in the next is the
 *     legitimate shape; a decision record in this tree reads *This is not a new promise
 *     … The engine exploits a guarantee that already exists*, and a decision record may
 *     not be retro-edited. Narrowing to the sentence would fire on it.
 *   · A new clause joined with NO punctuation at all (`what not to touch and it will
 *     prove your innocence`) still suppresses.
 *
 * Every consumer of this rule plants a bare violation AND a violation placed after a
 * marker in an earlier clause, and asserts both still fire.
 */
export function governingClause(preceding) {
  const text = String(preceding);
  let anchor = 0;
  let m;
  LIST_COLON.lastIndex = 0;
  while ((m = LIST_COLON.exec(text)) !== null) anchor = m.index + 1;
  const tail = text.slice(anchor);
  let clause = -1;
  CLAUSE_OPENER.lastIndex = 0;
  while ((m = CLAUSE_OPENER.exec(tail)) !== null) clause = m.index + m[0].length;
  return clause < 0 ? text : text.slice(0, anchor) + tail.slice(clause);
}

/**
 * A negation marker ANYWHERE in the text, with no scoping at all.
 *
 * ⚠️ NOT the exclusion rule, and never to be used as one. This is what the rule USED
 * to be, and the defect. It is exported so a consumer can prove its fixtures both ways
 * in one place: that a marker really does precede the match, so the old line-scoped rule
 * would have swallowed it, AND that the clause rule fires anyway. Without the first half
 * a fixture with no marker in it would pass and establish nothing.
 */
export function hasNegationMarker(text) {
  return NEGATION.test(String(text));
}

export function isNegated(line, matchIndex = null) {
  const preceding = matchIndex === null ? line : line.slice(0, matchIndex);
  return hasNegationMarker(governingClause(preceding));
}

/**
 * Run a pattern table over labelled text blocks.
 * `negationExempt` applies the rule above, per line. Off by default: the hard
 * tier takes no exclusions.
 */
export function scan(blocks, patterns, { negationExempt = false, skipLine = null } = {}) {
  proven('the blocks handed to the scanner', blocks);
  proven('the pattern table handed to the scanner', patterns);
  const hits = [];
  let linesRead = 0;
  for (const block of blocks) {
    const lines = String(block.text).split('\n');
    /**
     * ⚠️ IN A TABLE, THE COLUMN'S MEANING IS IN THE HEADER, NOT IN THE CELL.
     *
     * `| Any statistic about how common false accusations are | RAIL 8 |` is a row in
     * a table headed `| Never, in any jurisdiction | Rail |`, under a heading reading
     * *Bans that hold everywhere*. The row is a prohibition and nothing on the row
     * says so. Four real files tripped this check for exactly that reason.
     *
     * So for a table ROW (and only for a table row) the negation scope is widened
     * to the table's own header line and the heading above it. ⛔ Deliberately NOT
     * done for prose: a document whose title contains the word `No` would exempt
     * every line in it, which is a hole rather than a rule.
     */
    let heading = '';
    let tableHeader = '';
    let inTable = false;
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        heading = trimmed;
        inTable = false;
        tableHeader = '';
      } else if (trimmed.startsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHeader = trimmed;
        }
      } else {
        inTable = false;
        tableHeader = '';
      }
      linesRead += 1;
      if (skipLine && skipLine(line, block)) continue;
      for (const { name, re } of patterns) {
        re.lastIndex = 0;
        const m = re.exec(line);
        if (!m) continue;
        /**
         * ⚠️ THE PRECEDING LINE IS PART OF THE SCOPE, because markdown hard-wraps
         * sentences. The skill definition says *Nothing captured is / uploaded, and
         * no telemetry, analytics, version check, or crash report exists*, the
         * refusal is on one line and the words it refuses are on the next. A
         * line-scoped rule reported that as a reporting surface. Found by running the
         * check, not by reading it.
         *
         * Residual, stated: a genuine violation written on the line after a refusal is
         * exempted. Every consumer of this rule plants a bare violation on its own and
         * asserts it still fires.
         */
        const previous = i > 0 ? lines[i - 1] : '';
        const context = inTable
          ? `${heading}\n${tableHeader}\n${previous}\n${line.slice(0, m.index)}`
          : `${previous}\n${line.slice(0, m.index)}`;
        const at = context.length;
        if (negationExempt && isNegated(context, at)) continue;
        hits.push({
          name,
          match: m[0],
          index: m.index,
          where: block.label,
          line: i + 1,
          raw: line,
          text: line.trim(),
          // The exact scope the exclusion would have judged, so a caller can
          // re-evaluate the SAME decision rather than a reconstruction of it.
          negationScope: context,
          negationAt: at,
        });
      }
    }
  }
  assert.ok(
    linesRead > 0,
    'ABORT, the scanner read zero lines. "Not found" and "nothing read" are the ' +
      'same output to a text search, so this fails rather than reporting clean.',
  );
  return { hits, linesRead };
}

/** A one-line report of a hit, short enough to read in a failure message. */
export function report(hits) {
  return hits
    .map((h) => `  ${h.where}:${h.line} [${h.name}] ${h.match}, ${h.text.slice(0, 110)}`)
    .join('\n');
}

/** Plant text in a throwaway file and hand it back as a scannable block. */
export function planted(label, text) {
  const dir = scratch('planted');
  const path = join(dir, `${label.replace(/[^a-z0-9-]/gi, '_')}.txt`);
  writeFileSync(path, text);
  return [{ label: `PLANTED ${label}`, text: readFileSync(path, 'utf8') }];
}

/* ── expected-red rails ───────────────────────────────────────────────────── */

/**
 * Register a rail whose feature does not exist yet.
 *
 * Two tests, deliberately:
 *
 *   the `todo` one RUNS the real assertion and fails visibly, with the reason and
 *   the owning wave printed beside it. `node --test` counts it under `todo`, so
 *   the summary line is truthful. It says how many rails are red rather than
 *   folding them into a pass.
 *
 *   the second one asserts the assertion STILL THROWS. That is the trip-wire: the
 *   day the feature lands, this goes red and demands the rail be promoted, rather
 *   than the suite quietly inheriting a green nobody checked.
 */
export function expectedRed(name, { reason, wave, assertion }) {
  test(name, { todo: `EXPECTED RED: ${reason} Feature lands in: ${wave}.` }, assertion);

  test(`${name}, trip-wire: still red, and must be promoted when it is not`, () => {
    let threw = null;
    try {
      assertion();
    } catch (err) {
      threw = err;
    }
    assert.ok(
      threw,
      `The assertion above now PASSES, so this rail is no longer red.\n` +
        `  ${reason}\n` +
        `  Owning wave: ${wave}\n` +
        'Promote the row in RAIL_MATRIX.md, remove the expectedRed wrapper, and ' +
        'let the real test stand on its own. ⛔ Do not delete this trip-wire to ' +
        'silence it, it exists because a rail that turns green without anybody ' +
        'noticing is indistinguishable from one that was never enforced.',
    );
  });
}
