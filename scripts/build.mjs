#!/usr/bin/env node
/**
 * scripts/build.mjs: the contract build, and the provider generator.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NODE IS A BUILD TOOL ONLY. Nothing this script needs may end up on a user
 * path. Every user-path script in this repository is Python 3 stdlib, offline.
 * ROADMAP §7 · STATE D10 · D32.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * JOB (a): THE CONTRACT BUILD.  skill/data/tree.yaml -> tree.json + tree.sha256
 *
 *   Why this exists, so nobody undoes it: Python's standard library has no YAML
 *   parser, Node core has none, and the dependency policy is ZERO RUNTIME
 *   DEPENDENCIES (RAIL 11. Must work fully offline, no install step). So the
 *   engine that ships to users CANNOT parse YAML at all. It reads tree.json and
 *   verifies tree.sha256, refusing on mismatch. An ad-hoc partial YAML parser
 *   would put contract fidelity at the exact place fidelity is load-bearing.
 *   STATE decision D20 · PHASE_1 deliverable 1.
 *
 *   🔴 THE PAIR IS A RUNTIME INPUT, NOT MERELY AN OUTPUT. The engine runs from
 *   inside the INSTALLED provider tree and resolves its contract relative to
 *   itself, so JOB (b) copies both files into every generated tree's data/ as
 *   well. Emitting them only to skill/data/ leaves a tree that cannot start.
 *
 *   🔴 PARSER CHOICE, `yaml` (eemeli), pinned to an EXACT version in
 *   devDependencies, never dependencies.
 *
 *   Chosen for YAML 1.2 core-schema behaviour, which is a correctness
 *   requirement here rather than a preference:
 *
 *     - In YAML **1.1**, bare `yes`, `no`, `on`, `off`, `y`, `n` all resolve to
 *       BOOLEANS. tree.yaml's branch keys are the strings "yes" / "no" /
 *       "unsure", and the branch map key is `branch:` rather than `on:`,
 *       precisely to survive a 1.1 parser. That quoting is a deliberate guard
 *       in the contract, not an accident of style. Do not unquote it.
 *     - `yaml` v2 defaults to YAML **1.2 core schema**, where ONLY
 *       `true`/`false` are booleans. We pass `version: '1.2'` and
 *       `schema: 'core'` explicitly anyway, so the behaviour is asserted rather
 *       than inherited from a default that a future minor could revisit.
 *     - `uniqueKeys` (on by default) makes a duplicated node key a build
 *       failure instead of a silent last-wins overwrite.
 *     - It has ZERO transitive dependencies, so the build-time surface is one
 *       package, which is auditable by hand.
 *     - `tests/contract/tree.test.mjs` proves the no-coercion property. It is
 *       not taken on trust: a parser that coerced `yes` to `true` would produce
 *       the object key "true", and the test asserts "yes" is present and "true"
 *       is absent.
 *
 *   ⛔ tree.yaml is THE CONTRACT and is never amended by this script, or by any
 *   agent. Amendment procedure: `AGENTS.md` section 7.
 *
 * JOB (b): PROVIDER GENERATION.
 *
 *   skill/ is the single source of truth. `.claude/`, `.codex/` and `plugin/`
 *   are GENERATED and must never be hand-edited (STATE D3). Three placeholders,
 *   two providers, one lockfile, deliberately not a template engine.
 *
 *     {{scripts_path}}    provider-relative path the agent uses to run scripts
 *     {{command_prefix}}  the single human-facing command
 *     {{command_hint}}    the command list, DERIVED from SKILL.src.md's own
 *                         Commands table and cross-checked against the files in
 *                         skill/reference/. Never written out by hand, a prose
 *                         count of a contract is a defect this project has
 *                         already shipped once (root CLAUDE.md §9 row 13).
 *
 *   skills-lock.json records a sha256 per source file AND per generated file,
 *   so a hand-edit of either fails tests/contract/generated.test.mjs.
 *
 * IDEMPOTENT: a second run produces zero diff. Generated skill trees are removed
 * before they are rewritten, so a deleted source file also disappears downstream.
 *
 * FAILS CLOSED. Every check proves its input is non-empty before judging it: a
 * gate that scans nothing prints the same green as a clean tree.
 */

import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const SKILL_NAME = 'machine-witness';

// D12: the human surface is ONE command. Same token on both providers, a second
// vocabulary for the same action is a recall interface, which is what /mw exists
// to remove.
const COMMAND_PREFIX = '/mw';

const PROVIDERS = [
  { id: 'claude', root: '.claude' },
  { id: 'codex', root: '.codex' },
];

// plugin/ is a byte-identical mirror of the .claude/ tree, so the packaged
// plugin and the in-repo skill cannot drift.
const MIRROR_FROM = '.claude';
const MIRROR_TO = 'plugin';

const SRC_SKILL = 'skill';
const SRC_ENTRY = 'skill/SKILL.src.md';
const CONTRACT_YAML = 'skill/data/tree.yaml';
const CONTRACT_JSON = 'skill/data/tree.json';
const CONTRACT_SHA = 'skill/data/tree.sha256';
const LOCKFILE = 'skills-lock.json';

// JOB (c). The jurisdiction packs live OUTSIDE skill/, so the engine cannot see
// them from inside an installed provider tree. This pair is how they arrive.
const PACKS_DIR = 'jurisdictions';
const PACKS_JSON = 'skill/data/packs.json';
const PACKS_SHA = 'skill/data/packs.sha256';

// Contract outputs. Inputs to the lock's `generated` set, never its `source` set.
const GENERATED_IN_SKILL = new Set([CONTRACT_JSON, CONTRACT_SHA, PACKS_JSON, PACKS_SHA]);

/* ── helpers ──────────────────────────────────────────────────────────────── */

function fail(message) {
  process.stderr.write(`\nbuild: FATAL ${message}\n\n`);
  process.exit(1);
}

/** Repo-relative POSIX path. Used as every key in skills-lock.json. */
function rel(...parts) {
  return parts.join('/');
}

function abs(relPath) {
  return join(REPO, ...relPath.split('/'));
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

function readBytes(relPath) {
  const p = abs(relPath);
  if (!existsSync(p)) fail(`missing required input: ${relPath}`);
  const buf = readFileSync(p);
  if (buf.length === 0) fail(`required input is EMPTY: ${relPath}`);
  return buf;
}

/** Recursive listing of repo-relative POSIX paths under `relDir`, sorted. */
function listFiles(relDir) {
  const root = abs(relDir);
  if (!existsSync(root)) return [];
  const out = [];
  const walk = (dirRel) => {
    const entries = readdirSync(abs(dirRel), { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const e of entries) {
      if (e.name === '.DS_Store') continue;
      // Same reason, one step further: IMPORTING a Python script creates this, .gitignore keeps
      // it out of git, and copying it here would make skills-lock.json name files git does not have.
      if (e.name === '__pycache__') continue;
      const childRel = rel(dirRel, e.name);
      if (e.isDirectory()) walk(childRel);
      else if (e.isFile()) out.push(childRel);
    }
  };
  walk(relDir);
  return out.sort();
}

function writeOut(relPath, contents) {
  const p = abs(relPath);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, contents);
}

const PLACEHOLDERS = ['scripts_path', 'command_prefix', 'command_hint'];

function substitute(text, vars, whereRel) {
  let out = text;
  for (const key of PLACEHOLDERS) {
    out = out.split(`{{${key}}}`).join(vars[key]);
  }
  // Fail closed on an unknown placeholder rather than shipping a literal
  // `{{...}}` into an allowed-tools pattern or a command a user is told to run.
  const leftover = out.match(/\{\{[^}\n]{1,64}\}\}/);
  if (leftover) {
    fail(`unsubstituted placeholder ${leftover[0]} survived into ${whereRel}`);
  }
  return out;
}

/* ── (a) THE CONTRACT BUILD ───────────────────────────────────────────────── */

function buildContract() {
  const rawBuf = readBytes(CONTRACT_YAML);
  const raw = rawBuf.toString('utf8');

  const tree = parseYaml(raw, {
    version: '1.2', // ⛔ NOT 1.1: see the parser-choice note in the header.
    schema: 'core', // only true/false are booleans; `yes`/`no`/`on` stay strings
    uniqueKeys: true, // a duplicated node key is a build failure, not last-wins
  });

  if (tree === null || typeof tree !== 'object' || Array.isArray(tree)) {
    fail(`${CONTRACT_YAML} did not parse to a mapping`);
  }

  // Non-empty-input proof, derived from the raw bytes rather than from the
  // parser, so a parser that silently returned {} cannot pass this.
  const rawTopKeys = [...raw.matchAll(/^([A-Za-z_][A-Za-z0-9_]*):\s*(?:#.*)?$/gm)].map(
    (m) => m[1],
  );
  if (rawTopKeys.length === 0) fail(`found no top-level keys in ${CONTRACT_YAML}`);
  const missing = rawTopKeys.filter((k) => !Object.hasOwn(tree, k));
  if (missing.length > 0) {
    fail(`parse dropped top-level key(s) present in the YAML text: ${missing.join(', ')}`);
  }

  const json = `${JSON.stringify(tree, null, 2)}\n`;
  writeOut(CONTRACT_JSON, json);

  // Digest of the exact bytes written. `shasum -a 256 -c tree.sha256` verifies
  // it from skill/data/; a Python consumer takes field 0 of the single line.
  const digest = sha256(Buffer.from(json, 'utf8'));
  writeOut(CONTRACT_SHA, `${digest}  tree.json\n`);

  return { tree, rawTopKeys, digest, jsonBytes: Buffer.byteLength(json, 'utf8') };
}

/* ── (c) THE JURISDICTION PACK BUILD ──────────────────────────────────────── */

/**
 * jurisdictions/<code>/pack.yaml  ->  skill/data/packs.json + packs.sha256
 *
 * ⚖️ ADR 0008 decisions 4 and 6. Same mechanism as JOB (a), for the same reason:
 * nothing on a user path can parse YAML, so the engine reads JSON and verifies a
 * digest. ⛔ Not an ad-hoc parser. A silent misparse here is a legal-capability
 * flag read the wrong way round.
 *
 * 🔴 ONLY THREE BLOCKS ARE EMITTED: `meta`, `review`, `capabilities`.
 *
 * That is a safety property and not a size optimisation. The engine's whole
 * question is *may this pack be used at all*, and the answer lives in those three
 * blocks. Every other block in a pack holds legal ANSWERS, and every one of them
 * currently reads UNANSWERED. By never emitting them, the engine cannot render a
 * legal answer even if a later change asked it to: it does not have one. A wave
 * that genuinely needs hazard wording adds that block deliberately, gated on
 * `review.state`, in a diff that says so.
 *
 * 🔴 AND THE OPTION LIST IS DERIVED HERE, from the directory listing, so there is
 * no second source of truth for which jurisdictions exist. A typed list would go
 * stale in exactly one direction: offering a jurisdiction whose pack was removed,
 * or omitting one that was added, and the person who finds out is the person
 * being helped. Directories beginning `_` or `.` are dropped, which is what makes
 * `_template` unselectable structurally rather than by name.
 */
function buildPacks() {
  const root = abs(PACKS_DIR);
  if (!existsSync(root)) fail(`missing required input directory: ${PACKS_DIR}/`);

  const dirs = readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && !e.name.startsWith('.'))
    .map((e) => e.name)
    .sort();

  // Fail closed. A pack build that found nothing would emit an empty option list,
  // and the engine would report "no jurisdiction is available" as though that were
  // a fact about the world rather than a build that read nothing.
  if (dirs.length === 0) {
    fail(`${PACKS_DIR}/ holds no jurisdiction directory (only templates and dot-entries)`);
  }

  const packs = {};
  for (const code of dirs) {
    const yamlRel = rel(PACKS_DIR, code, 'pack.yaml');
    const raw = readBytes(yamlRel).toString('utf8');
    const parsed = parseYaml(raw, { version: '1.2', schema: 'core', uniqueKeys: true });
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      fail(`${yamlRel} did not parse to a mapping`);
    }

    for (const block of ['meta', 'review', 'capabilities']) {
      const value = parsed[block];
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        fail(`${yamlRel} has no \`${block}:\` mapping. The engine cannot decide whether ` +
          'this pack may be used, so it must not be offered at all');
      }
    }

    // ⚠️ The directory name and the pack's own code must agree. Two spellings of
    // one jurisdiction pairs a tool with no pack, and the engine would report a
    // missing review state rather than an inconsistency.
    const declared = parsed.meta.jurisdiction;
    if (declared !== code) {
      fail(
        `${yamlRel} declares meta.jurisdiction ${JSON.stringify(declared)} but sits in ` +
          `${PACKS_DIR}/${code}/. They must be identical.`,
      );
    }

    // ⛔ Whitelisted, not filtered. A block added to a pack later does not reach a
    // user path by default; it reaches one when somebody names it here.
    packs[code] = {
      meta: parsed.meta,
      review: parsed.review,
      capabilities: parsed.capabilities,
    };
  }

  const payload = {
    schema: 1,
    what_this_is:
      'The machine-readable half of every jurisdiction pack, emitted by ' +
      'scripts/build.mjs from jurisdictions/<code>/pack.yaml. meta, review and ' +
      'capabilities ONLY: no legal answer is emitted here, so the engine cannot ' +
      'render one. ADR 0008 decision 6.',
    generated_from: PACKS_DIR,
    // The one list the engine offers a person, derived rather than typed.
    codes: dirs,
    packs,
  };

  const json = `${JSON.stringify(payload, null, 2)}\n`;
  writeOut(PACKS_JSON, json);
  const digest = sha256(Buffer.from(json, 'utf8'));
  // Bare sibling filename, so the pair verifies from inside any copy's own data/.
  writeOut(PACKS_SHA, `${digest}  packs.json\n`);

  const unreviewed = dirs.filter((c) => packs[c].review.state !== 'reviewed');
  return { codes: dirs, digest, unreviewed, jsonBytes: Buffer.byteLength(json, 'utf8') };
}

/* ── (b) PROVIDER GENERATION ──────────────────────────────────────────────── */

/**
 * Pull the command list out of SKILL.src.md's own Commands table, in table
 * order. Counting from the document that ships beats counting from a constant:
 * the two cannot disagree if only one of them exists.
 */
function commandsFromTable(srcMd) {
  const lines = srcMd.split('\n');
  const blocks = [];
  let current = null;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('|') && t.endsWith('|') && t.length > 1) {
      current ??= [];
      current.push(t);
    } else if (current) {
      blocks.push(current);
      current = null;
    }
  }
  if (current) blocks.push(current);

  const cellsOf = (row) =>
    row
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

  const isSeparator = (row) => cellsOf(row).every((c) => /^:?-{2,}:?$/.test(c));

  for (const block of blocks) {
    if (block.length < 3) continue;
    const header = cellsOf(block[0]).map((c) => c.toLowerCase());
    if (!header.some((c) => c.includes('command'))) continue;
    if (!isSeparator(block[1])) continue;

    const commands = [];
    for (const row of block.slice(2)) {
      if (isSeparator(row)) continue;
      const name = cleanCommandCell(cellsOf(row)[0]);
      if (name) commands.push(name);
    }
    if (commands.length > 0) return commands;
  }
  fail(
    `could not find a Commands table in ${SRC_ENTRY}. ` +
      'Expected a markdown table whose header row names a "Command" column.',
  );
  return [];
}

function cleanCommandCell(cell) {
  let s = String(cell ?? '').trim();
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // [label](link) -> label
  s = s.replace(/[`*_]/g, ''); // code spans, emphasis
  s = s.replace(/\{\{command_prefix\}\}/g, ''); // "{{command_prefix}} init" -> "init"
  s = s.trim().replace(/^\/+/, ''); // "/mw init" -> "mw init"
  s = s.replace(/^mw\s+/, ''); // "mw init" -> "init"
  const m = s.match(/^([a-z][a-z0-9-]*)/);
  return m ? m[1] : null;
}

function referenceCommands() {
  const files = listFiles(rel(SRC_SKILL, 'reference')).filter((f) => f.endsWith('.md'));
  if (files.length === 0) fail(`skill/reference/ holds no .md files, nothing to generate`);
  return files.map((f) => f.split('/').pop().replace(/\.md$/, '')).sort();
}

function generateProviders(commandHint) {
  const srcFiles = listFiles(SRC_SKILL).filter((f) => !GENERATED_IN_SKILL.has(f));
  if (srcFiles.length === 0) fail(`${SRC_SKILL}/ is empty, nothing to generate`);

  // 🔴 THE TWO CONTRACT OUTPUTS ARE RUNTIME INPUTS AND MUST REACH EVERY PROVIDER
  // TREE. They are not SOURCE. They are rebuilt from tree.yaml on every run, so
  // they stay out of the lock's `source` set, but the generated tree is what a
  // user installs and what the engine runs from: `allowed-tools` is
  // `Bash(python3 <that tree>/scripts/*)`, so the engine resolves its contract
  // relative to ITSELF, reads data/tree.json, verifies data/tree.sha256 and
  // REFUSES on mismatch (header JOB (a) · ADR 0007 decision 6 · STATE D20). A
  // provider tree holding only tree.yaml cannot start at all, because nothing on
  // a user path can parse YAML.
  //
  // They are COPIED from skill/data/, never re-derived here, so a provider copy
  // cannot disagree with the canonical pair. tree.sha256 names its sibling
  // `tree.json` by bare filename, so it verifies from inside each copy's own
  // data/ directory as well as from skill/data/.
  //
  // ⚖️ The pack pair rides the same road, for the same reason: `jurisdictions/`
  // is NOT under skill/, so an installed provider tree has no route to it. Their
  // digest names `packs.json` by bare filename, so it verifies from inside each
  // copy's own data/ directory too.
  const contractOutputs = [CONTRACT_JSON, CONTRACT_SHA, PACKS_JSON, PACKS_SHA];
  // Non-empty proof before copying: a gate that copies nothing looks the same as
  // one that copied a good file.
  for (const f of contractOutputs) readBytes(f);
  const copyFiles = [...srcFiles, ...contractOutputs].sort();

  const generated = [];

  for (const provider of PROVIDERS) {
    const skillDir = rel(provider.root, 'skills', SKILL_NAME);
    const scriptsPath = rel(skillDir, 'scripts');
    const vars = {
      scripts_path: scriptsPath,
      command_prefix: COMMAND_PREFIX,
      command_hint: commandHint,
    };

    // Remove before rewriting so a deleted source file also disappears here.
    rmSync(abs(skillDir), { recursive: true, force: true });

    for (const srcRel of copyFiles) {
      const tail = srcRel.slice(`${SRC_SKILL}/`.length);
      const outRel = srcRel === SRC_ENTRY ? rel(skillDir, 'SKILL.md') : rel(skillDir, tail);
      const bytes = readFileSync(abs(srcRel));

      // ⛔ NEVER substitute inside skill/data/. The contract is copied
      // byte-for-byte; a template pass over it would corrupt it silently.
      const isContractData = tail.startsWith('data/');
      const isMarkdown = extname(outRel) === '.md';

      if (isMarkdown && !isContractData) {
        writeOut(outRel, substitute(bytes.toString('utf8'), vars, outRel));
      } else {
        const text = bytes.toString('utf8');
        for (const key of PLACEHOLDERS) {
          if (text.includes(`{{${key}}}`)) {
            fail(
              `${srcRel} is copied verbatim (not templated) but contains {{${key}}}. ` +
                'Only .md files outside skill/data/ are substituted.',
            );
          }
        }
        writeOut(outRel, bytes);
      }
      generated.push(outRel);
    }
  }

  // plugin/ mirrors .claude/ byte-for-byte.
  const mirrorSrcDir = rel(MIRROR_FROM, 'skills', SKILL_NAME);
  const mirrorOutDir = rel(MIRROR_TO, 'skills', SKILL_NAME);
  rmSync(abs(mirrorOutDir), { recursive: true, force: true });
  const mirrored = listFiles(mirrorSrcDir);
  if (mirrored.length === 0) fail(`nothing to mirror from ${mirrorSrcDir}`);
  for (const srcRel of mirrored) {
    const tail = srcRel.slice(`${mirrorSrcDir}/`.length);
    const outRel = rel(mirrorOutDir, tail);
    writeOut(outRel, readFileSync(abs(srcRel)));
    generated.push(outRel);
  }

  return { srcFiles, generated: generated.sort() };
}

/* ── main ─────────────────────────────────────────────────────────────────── */

const contract = buildContract();
const packs = buildPacks();

const srcMd = readBytes(SRC_ENTRY).toString('utf8');
const tableCommands = commandsFromTable(srcMd);
const refCommands = referenceCommands();

const onlyInTable = tableCommands.filter((c) => !refCommands.includes(c)).sort();
const onlyInRefs = refCommands.filter((c) => !tableCommands.includes(c)).sort();
if (onlyInTable.length > 0 || onlyInRefs.length > 0) {
  fail(
    `SKILL.src.md's Commands table and skill/reference/ disagree.\n` +
      `  table (${tableCommands.length}): ${tableCommands.join(' ')}\n` +
      `  files (${refCommands.length}): ${refCommands.join(' ')}\n` +
      `  only in table: ${onlyInTable.join(' ') || '(none)'}\n` +
      `  only in files: ${onlyInRefs.join(' ') || '(none)'}`,
  );
}

const commandHint = tableCommands.join('|');
const { srcFiles, generated } = generateProviders(commandHint);

// skills-lock.json: a content hash per source AND per generated file, so a
// hand-edit of either side fails tests/contract/generated.test.mjs.
const sortedRecord = (paths) => {
  const out = {};
  for (const p of [...paths].sort()) out[p] = sha256(readFileSync(abs(p)));
  return out;
};

const lock = {
  version: 1,
  algorithm: 'sha256',
  generator: 'scripts/build.mjs',
  skill: SKILL_NAME,
  command_prefix: COMMAND_PREFIX,
  commands: tableCommands,
  providers: PROVIDERS.map((p) => p.id),
  mirrors: { [MIRROR_TO]: MIRROR_FROM },
  source: sortedRecord(srcFiles),
  generated: sortedRecord([CONTRACT_JSON, CONTRACT_SHA, PACKS_JSON, PACKS_SHA, ...generated]),
};
writeOut(LOCKFILE, `${JSON.stringify(lock, null, 2)}\n`);

/* ── report the counts. A green that does not say what it scanned is worth
      nothing, root CLAUDE.md §8. ───────────────────────────────────────── */

const perProvider = PROVIDERS.map(
  (p) =>
    `${p.root} ${generated.filter((g) => g.startsWith(`${p.root}/`)).length}`,
).join(' · ');

process.stdout.write(
  [
    `build: contract   ${CONTRACT_YAML} -> ${CONTRACT_JSON}  ` +
      `${contract.rawTopKeys.length} top-level keys · ${contract.jsonBytes} bytes`,
    `build: digest     sha256 ${contract.digest}  -> ${CONTRACT_SHA}`,
    // ⚖️ The unreviewed count is printed on purpose, every run. It is currently
    // equal to the total, and the day it stops being is the day a pack became
    // usable, which is not a thing that should have to be discovered.
    `build: packs      ${PACKS_DIR}/ -> ${PACKS_JSON}  ${packs.codes.length} pack(s) ` +
      `(${packs.codes.join(' ')}) · ${packs.jsonBytes} bytes · ` +
      `${packs.unreviewed.length} UNREVIEWED (${packs.unreviewed.join(' ') || 'none'})`,
    `build: digest     sha256 ${packs.digest}  -> ${PACKS_SHA}`,
    `build: commands   ${tableCommands.length} in the Commands table == ` +
      `${refCommands.length} in skill/reference/`,
    `build: generated  ${perProvider} · ${MIRROR_TO} ` +
      `${generated.filter((g) => g.startsWith(`${MIRROR_TO}/`)).length}  (mirror of ${MIRROR_FROM})`,
    `build: lock       ${LOCKFILE}  source ${Object.keys(lock.source).length} · ` +
      `generated ${Object.keys(lock.generated).length}`,
    '',
  ].join('\n'),
);
