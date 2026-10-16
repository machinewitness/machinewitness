/**
 * tests/rails/_manifests.mjs: the published manifests, as one scannable surface.
 *
 * ⚠️ NOT A TEST FILE, deliberately. `node --test` discovers `*.test.mjs`; this is
 * imported by two of them, the same way `_rails.mjs` and `_harness.mjs` are. It
 * exists because two different checks read the same files, and *which files are the
 * manifests* is a fact, a fact written out twice is the defect this project keeps
 * rediscovering, so it is written out once, here, and derived rather than typed.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHY THE MANIFESTS ARE THEIR OWN SURFACE, AND THE HARDEST ONE TO GET RIGHT.
 *
 * A plugin listing is the FIRST thing a person meets. It is read before anything is
 * installed, before a screen is rendered, and before one word of doctrine reaches
 * them, so every mitigation that makes the vocabulary rule genuinely difficult
 * elsewhere is absent here. There is no filename to keep, no citation to preserve,
 * no shell history to consider, and the audience is not an agent. It is marketing
 * copy, and it can simply be written in words a frightened person already knows.
 *
 * That is exactly how the breach happened: internal workspace vocabulary was lifted
 * verbatim into a public listing, and two of the words appeared in the `tags`, which
 * ARE the discovery surface.
 *
 * ⛔ SO THERE ARE NO EXEMPTIONS HERE AND NOWHERE TO PUT ONE. Not a negation rule
 * either: a listing has no business forbidding anything, so a line that names a
 * barred word is a listing that uses it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';

import { proven, readRepo, tracked } from './_rails.mjs';

/**
 * A published manifest, by shape rather than by name, so a manifest added later is
 * covered without anybody editing a list.
 *
 *   the plugin manifests   anything under a `.claude-plugin/` directory, at any
 *                          depth, the marketplace listing and both plugin
 *                          descriptions live there
 *   the package manifest   `package.json`. It is a listing too: its `description`
 *                          is what a package registry shows, and it carries the
 *                          same doctrine load as the others
 *
 * ⚠️ `package-lock.json` is NOT in here. It is generated, nobody reads it, and
 * including it would add tens of thousands of lines to every scan for nothing.
 */
const PLUGIN_MANIFEST = /(?:^|\/)\.claude-plugin\/[A-Za-z0-9_-]+\.json$/;
const PACKAGE_MANIFEST = 'package.json';

/** Repo-relative paths of every published manifest, sorted. Derived from git. */
export function manifestPaths() {
  const found = tracked().filter(
    (rel) => PLUGIN_MANIFEST.test(rel) || rel === PACKAGE_MANIFEST,
  );
  // 🔴 THE FLOOR IS THE POINT. There are a marketplace listing, two plugin
  // descriptions and a package description; a set smaller than that means the
  // derivation stopped matching and every absence assertion below would be green
  // over nothing read.
  return proven('the published manifests', found.sort(), { floor: 4 });
}

/** `[{ label, text }]`, each proven non-empty before anything judges it. */
export function manifestBlocks() {
  return manifestPaths().map((rel) => ({
    label: rel,
    text: proven(rel, readRepo(rel), { floor: 100 }),
  }));
}

/** Every `description` string in a manifest, joined. The copy a person reads. */
export function descriptionsIn(rel) {
  const parsed = JSON.parse(readRepo(rel));
  const found = [];
  const walk = (node) => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (node === null || typeof node !== 'object') return;
    for (const [key, value] of Object.entries(node)) {
      if (key === 'description' && typeof value === 'string') found.push(value);
      else walk(value);
    }
  };
  walk(parsed);
  return proven(`the descriptions in ${rel}`, found, { floor: 1 }).join('\n');
}

/* ── the barred vocabulary, read out of the engine rather than restated ────── */

const ENGINE_REL = 'skill/scripts/triage.py';

/**
 * The words that may not reach anything a person reads, taken from the engine's own
 * constant.
 *
 * 🔴 NOT TYPED IN A TEST. The engine already owns this list, it asserts the same
 * words are absent from every screen it can render, and a second copy in a test
 * would keep passing after somebody changed the first. Reading it here also means
 * this check covers a word ADDED to the engine's list without anybody remembering
 * that the listing is a surface too.
 *
 * The constant is a multi-line tuple, so it is read as one, and the count is floored:
 * a regular expression that stopped matching would otherwise hand back an empty list
 * and every scan below would report clean.
 */
export function barredWords() {
  const source = proven(ENGINE_REL, readRepo(ENGINE_REL), { floor: 5000 });
  const block = /^BANNED_IN_SCREENS\s*=\s*\(([\s\S]*?)^\)/m.exec(source);
  assert.ok(block, `${ENGINE_REL} no longer declares BANNED_IN_SCREENS as a tuple`);
  const words = [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return proven(`the words BANNED_IN_SCREENS holds in ${ENGINE_REL}`, words, { floor: 5 });
}

/**
 * The engine's own rail-number pattern, lifted as the regular expression it is.
 *
 * The two languages spell this pattern identically, so it is read rather than
 * translated, a translation is a second copy with a chance of being wrong. The
 * caller proves it fires on a planted rail number, which is what makes reading it
 * safe rather than merely clever.
 */
export function railNumberShape() {
  const source = proven(ENGINE_REL, readRepo(ENGINE_REL), { floor: 5000 });
  const line = /^RAIL_NUMBER\s*=\s*re\.compile\(r"([^"]+)"/m.exec(source);
  assert.ok(line, `${ENGINE_REL} no longer declares RAIL_NUMBER as a compiled pattern`);
  return new RegExp(line[1], 'i');
}

/**
 * One pattern per barred word, in the shape the shared scanner takes.
 *
 * ⚠️ PLAIN SUBSTRING, CASE-INSENSITIVE, matching the engine exactly, it tests
 * `word in text.lower()`. That is deliberately stricter than a word boundary would
 * be: it catches the -ing and -es forms of every entry without the list having to
 * carry them, which is how the listing's own breach would have been caught.
 */
export function barredPatterns() {
  const patterns = barredWords().map((word) => ({
    name: `the word "${word}", which has to be explained before it means anything`,
    re: new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
  }));
  patterns.push({ name: 'a rail number', re: railNumberShape() });
  return proven('the barred-vocabulary pattern table', patterns, { floor: 6 });
}

/**
 * A real manifest with one word planted in its own description, ready to scan.
 *
 * 🔴 A COPY OF THE REAL FILE, not a hand-written stub. The point is to show the scan
 * fires on the exact surface it guards, in the exact place the breach happened, a
 * fixture invented for the occasion would only prove the scanner sees a string.
 * The mutation is asserted to have actually changed the text, because a replacement
 * that silently matched nothing would hand back the clean file and the check would
 * look as though it had fired on nothing.
 */
export function withPlantedWord(rel, word) {
  const original = proven(rel, readRepo(rel), { floor: 100 });
  const doctored = original.replace(/("description"\s*:\s*")/, `$1${word} `);
  assert.notEqual(
    doctored,
    original,
    `nothing was planted in ${rel}: it holds no "description" field to plant into, ` +
      'so this fixture would have handed back the clean file and the scan would have ' +
      'been asked to find a word that was never there.',
  );
  return [{ label: `PLANTED ${word} in ${rel}`, text: doctored }];
}
