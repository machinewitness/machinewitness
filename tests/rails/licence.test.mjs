/**
 * tests/rails/licence.test.mjs. The licence is the verbatim permissive one, and the
 * holder is never a person.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 TWO SEPARATE FAILURES, AND BOTH HAVE HAPPENED IN THIS PROJECT'S OWN HISTORY.
 *
 *  1. A PARAPHRASED LICENCE. A licence file that says roughly the right thing is not
 *     a licence. Automated tooling, package registries, forge detection and every
 *     downstream re-licensing decision key on the exact text; a reworded clause makes
 *     the terms a matter of argument at the moment they need to be a matter of
 *     record. So the text is compared word for word against the canonical form, with
 *     only line WRAPPING allowed to differ.
 *
 *  2. THE HOLDER BECOMING A PERSON'S NAME. The licence requires its notice to
 *     propagate into every downstream copy, so a maintainer's real name in that line
 *     is published permanently, in every clone and every cache, by the licence's own
 *     terms. This is the single highest-consequence line in the repository for
 *     anonymity, and it is one careless edit away at all times.
 *
 * The canonical text is embedded below rather than derived, because it IS a constant
 * of the world: there is nothing in this repository to derive it from, and deriving
 * it from the file under test would make the comparison self-justifying.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { REPO, listUnder, proven, readRepo } from './_rails.mjs';

/** The holder, and the one thing it must never become. */
const HOLDER = 'Machine Witness contributors';

/**
 * The canonical body, as paragraphs. Line wrapping is normalised away before
 * comparison; every word, every comma and every capital is not.
 */
const CANONICAL = [
  'MIT License',
  'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
  'The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
];

/** Paragraphs, with hard wrapping collapsed to single spaces. */
function paragraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter((p) => p.length > 0);
}

const raw = proven('LICENSE', readRepo('LICENSE'), { floor: 900 });
const paras = proven('the paragraphs of LICENSE', paragraphs(raw), { floor: 5 });

/**
 * ⛔ A NAME-SHAPED HOLDER. Two capitalised words in a row, which is what a personal
 * name looks like, and which the intended holder is not, because `contributors` is
 * lower case. Structural, so it catches a name nobody thought to look for.
 */
const NAME_SHAPED = /Copyright\s*\(c\)\s*\d{4}\s+(?:[A-Z][a-z]+\s+){1,3}[A-Z][a-z]+\s*$/;

test('the licence file is the canonical text, word for word', () => {
  const [title, ...rest] = paras;
  assert.equal(title, CANONICAL[0], 'the licence does not open with the canonical title');

  const copyrightLine = rest[0];
  assert.ok(copyrightLine, 'the licence carries no copyright line');

  const body = rest.slice(1);
  assert.deepEqual(
    body,
    CANONICAL.slice(1),
    'the licence body is not the canonical text. A paraphrase makes the terms a ' +
      'matter of argument at the moment they need to be a matter of record.',
  );
});

test('the holder is the project, and is not shaped like a person’s name', () => {
  const copyrightLine = paras[1];
  assert.match(
    copyrightLine,
    new RegExp(`^Copyright \\(c\\) \\d{4} ${HOLDER}$`),
    `the copyright line is "${copyrightLine}". It must be exactly the year and ` +
      `"${HOLDER}".`,
  );
  assert.ok(
    !NAME_SHAPED.test(copyrightLine),
    `the holder looks like a personal name: ${copyrightLine}. The licence requires ` +
      'its notice to propagate into every downstream copy, so a real name there is ' +
      'published permanently by the licence\'s own terms.',
  );
});

test('every declared licence in the tree says the same thing', () => {
  const pkg = JSON.parse(readRepo('package.json'));
  assert.equal(pkg.license, 'MIT', `package.json declares ${pkg.license}`);

  const skill = readRepo('skill/SKILL.src.md');
  const front = /^---\n([\s\S]*?)\n---/.exec(skill);
  assert.ok(front, 'the skill definition has no front matter');
  assert.match(front[1], /^license:\s*MIT$/m, 'the skill definition declares a different licence');

  const allowlist = JSON.parse(readRepo('skill/allowlist.json'));
  assert.ok(allowlist, 'the allowlist did not parse');
});

test('there is exactly one licence file, and no second copy to drift', () => {
  const copies = [
    ...listUnder('.', ['LICENSE']),
  ].filter((rel) => /(?:^|\/)LICEN[CS]E(?:\.\w+)?$/.test(rel) && !rel.startsWith('node_modules/'));
  proven('the licence files found', copies, { floor: 1 });
  assert.deepEqual(
    copies,
    ['LICENSE'],
    `more than one licence file exists: ${copies.join(', ')}. Two copies of a licence ` +
      'drift, and the one somebody reads is whichever they found first.',
  );
});

/* ── planted fixtures: each must FAIL ─────────────────────────────────────── */

test('the checker fires on a modified holder, a paraphrase, and a name', () => {
  const year = /Copyright \(c\) (\d{4})/.exec(raw)?.[1];
  assert.ok(year, 'no year in the copyright line. The fixture cannot be built from the real file');

  const FIXTURES = [
    {
      what: 'a personal name as the holder',
      text: raw.replace(HOLDER, 'Jordan Quorrindale'),
      check: (text) => new RegExp(`^Copyright \\(c\\) \\d{4} ${HOLDER}$`).test(paragraphs(text)[1]),
    },
    {
      what: 'a name-SHAPED holder, caught structurally',
      text: raw.replace(HOLDER, 'Alex Quorrindale'),
      check: (text) => !NAME_SHAPED.test(paragraphs(text)[1]),
    },
    {
      what: 'a paraphrased permission clause',
      text: raw.replace('free of charge', 'at no cost'),
      check: (text) => {
        try {
          assert.deepEqual(paragraphs(text).slice(2), CANONICAL.slice(1));
          return true;
        } catch {
          return false;
        }
      },
    },
    {
      what: 'a dropped warranty paragraph',
      text: raw.split(/\n\s*\n/).slice(0, -1).join('\n\n'),
      check: (text) => {
        try {
          assert.deepEqual(paragraphs(text).slice(2), CANONICAL.slice(1));
          return true;
        } catch {
          return false;
        }
      },
    },
    {
      what: 'a different licence altogether',
      text: 'Apache License\n\nVersion 2.0, January 2004\n',
      check: (text) => paragraphs(text)[0] === CANONICAL[0],
    },
  ];
  proven('the fixture set', FIXTURES, { floor: 5 });

  const missed = [];
  for (const fixture of FIXTURES) {
    // The fixture must be DIFFERENT from the real file, or the check proves nothing.
    assert.notEqual(fixture.text, raw, `the fixture for ${fixture.what} is the real file`);
    if (fixture.check(fixture.text)) missed.push(fixture.what);
  }
  assert.deepEqual(
    missed,
    [],
    `the licence checks did NOT catch: ${missed.join(', ')}. A check that cannot fail ` +
      'is not a check.',
  );

  // …and the real file still passes every one of them, so the fixtures are not
  // simply breaking the checker for everything.
  for (const fixture of FIXTURES) {
    assert.ok(fixture.check(raw), `the real licence fails the check for ${fixture.what}`);
  }
  assert.ok(REPO.length > 0, 'the repository root is empty. The scan is broken');
});
