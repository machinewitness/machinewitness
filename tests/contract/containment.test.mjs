/**
 * tests/contract/containment.test.mjs: the folder refusals.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * 🔴 WHY THIS EXISTS, IN ONE SENTENCE: an earlier draft defended the case folder
 * with four brand names and a `.gitignore`, and four brand names miss a custom
 * sync root, a network mount, a symlink, and a rename, any one of which puts a
 * person's own evidence somewhere it is quietly copied off their machine.
 *
 * So every assertion here is about a MOUNT PROPERTY or a RESOLVED SYMLINK, and
 * one of them checks outright that no vendor name appears in the refusal.
 *
 * SIX REFUSALS, one test each, plus the control:
 *   1. inside the tool's own install tree
 *   2. a volume served over a network, by filesystem type and source
 *   3. a volume a program serves rather than a disk, by filesystem family
 *   4. a symlink that resolves into any of those
 *   5. a folder whose volume cannot be established at all
 *   6. inside a version-controlled project, the tree ABOVE the install, which
 *      the install-tree refusal cannot reach. `INSTALL_ROOT` is the parent of
 *      `scripts/`, which is right; it simply says nothing about the project the
 *      install may be sitting in, so a case folder at a repository's own root was
 *      ACCEPTED. One commit then copies the person's own file into a published
 *      tree, dated and attributed, and no version-control tool can un-publish it.
 *   0. a plain local folder is ALLOWED, without this, "refuses everything" and
 *      "refuses the right things" are indistinguishable, and a check that
 *      refuses everything is not a check.
 *
 * ⚠️ THE MOUNT TABLE IS INJECTED, NOT FAKED THROUGH THE ENVIRONMENT. A network
 * volume and a sync client cannot be created in a test without privileges, so
 * the engine takes the table as an argument and the fixtures below describe one.
 * There is deliberately NO environment variable and no flag for this: a switch
 * that makes the check pass is a switch that makes it worthless. The mount
 * points in every fixture are REAL directories created here, because the engine
 * matches an entry by device as well as by prefix and will not accept a table
 * that disagrees with the filesystem.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SCRIPTS = join(REPO, 'skill', 'scripts');

/** The tool's own install tree, as the engine computes it: skill/. */
const INSTALL_ROOT = join(REPO, 'skill');

/**
 * ⚠️ `realpathSync`, not the raw temp path. On macOS the system temp directory is
 * itself reached through a symlink, and the engine resolves symlinks before it
 * judges anything, so a fixture built on the unresolved path would describe a
 * mount point that covers nothing, and every test here would "pass" by hitting
 * the unestablished refusal instead of the one it names.
 */
const TMP = realpathSync(mkdtempSync(join(tmpdir(), 'mw-containment-')));
process.on('exit', () => rmSync(TMP, { recursive: true, force: true }));

/** Words a refusal may never contain, the same list the engine enforces. */
const BANNED = ['manifest', 'hash', 'custody', 'layer', 'classification', 'adversarial'];

/**
 * A vendor list used ONLY to assert that the engine's own reasoning never names
 * one. These are not detection strings and the engine must not contain them.
 */
const VENDOR_SHAPED = ['dropbox', 'onedrive', 'icloud', 'gdrive', 'google drive', 'box.com'];

/**
 * The probe. It IMPORTS the engine rather than running it as a script, which is
 * the only way to reach `resolve_workspace` with an injected table, and is why
 * a Python bytecode cache appears under skill/scripts/ once this suite has run.
 */
const PROBE = `
import json, sys
sys.path.insert(0, ${JSON.stringify(SCRIPTS)})
import triage

request = json.loads(sys.argv[1])

def facts(raw):
    if raw is None:
        return None
    return [
        triage.MountFact(m["point"], m["source"], m["fstype"], tuple(m["options"]), m["origin"])
        for m in raw
    ]

call = request.get("call", "resolve")
out = {}

if call == "resolve":
    try:
        got = triage.resolve_workspace(request["path"], mounts=facts(request.get("mounts")))
        out = {"allowed": True, "resolved": str(got), "message": None, "code": 0}
    except triage.Refusal as exc:
        out = {"allowed": False, "resolved": None, "message": str(exc), "code": exc.code}

elif call == "parse":
    parsed = triage.parse_mount_table(request["text"], request["origin"])
    out = {
        "entries": [
            {
                "point": f.point,
                "source": f.source,
                "fstype": f.fstype,
                "options": list(f.options),
                "origin": f.origin,
                "verdict": triage.classify_mount(f),
            }
            for f in parsed
        ]
    }

elif call == "table":
    entries, mechanism = triage.read_mount_table()
    out = {"count": len(entries), "mechanism": mechanism}

else:
    raise SystemExit(f"unknown probe call {call!r}")

sys.stdout.write(json.dumps(out))
`;

function probe(request, env = {}) {
  const run = spawnSync('python3', ['-c', PROBE, JSON.stringify(request)], {
    encoding: 'utf8',
    // ⚠️ Bytecode caching OFF. The probe imports the engine out of `skill/scripts/`,
    // and the interpreter's default is to write a compiled copy beside it, so this
    // test was leaving a `__pycache__` directory in the source tree on every run. It
    // is ignored by version control, which is exactly why nobody noticed: a test that
    // modifies the tree it is testing is a test that can affect the next one. Placed
    // before the caller's own settings so a caller can still override it.
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', ...env },
  });
  assert.equal(run.error, undefined, `could not run the probe: ${run.error?.message}`);
  assert.equal(
    run.status,
    0,
    `the probe exited ${run.status}.\n  stdout ${run.stdout}\n  stderr ${run.stderr}`,
  );
  assert.ok(
    run.stdout && run.stdout.trim().length > 0,
    `the probe produced no output.\n  stderr ${run.stderr}`,
  );
  return JSON.parse(run.stdout);
}

/** A real directory, so a fixture mount point agrees with the filesystem. */
function dir(...parts) {
  const path = join(TMP, ...parts);
  mkdirSync(path, { recursive: true });
  return path;
}

const mount = (point, fstype, source, options, origin = 'linux-mountinfo') => ({
  point,
  fstype,
  source,
  options,
  origin,
});

/**
 * The fixture table. One real temp root declared as an ordinary local disk, and
 * three volumes under it declared as things this engine must refuse. Every point
 * is a real directory.
 */
const LOCAL_ROOT = dir('root');
const NET_VOLUME = dir('root', 'from-a-server');
const PROGRAM_VOLUME = dir('root', 'served-by-a-program');
const ODD_VOLUME = dir('root', 'something-else');
const PLAIN = dir('root', 'plain');

/**
 * ⚠️ THE NETWORK ENTRY'S SOURCE LOOKS LOCAL ON PURPOSE. A remote-looking source
 * is a second, independent property, and if this fixture used one then deleting
 * the filesystem-family check would leave every network test still passing, the
 * source shape would catch it and nothing would report the loss. It is covered
 * by its own test below, with an ordinary filesystem type.
 */
const FIXTURE = [
  mount(LOCAL_ROOT, 'ext4', '/dev/sda2', ['rw', 'relatime']),
  mount(NET_VOLUME, 'cifs', '/dev/sdb1', ['rw', 'vers=3.0']),
  mount(PROGRAM_VOLUME, 'fuse.a-provider-daemon', 'a-provider-daemon', ['rw', 'nosuid']),
  mount(ODD_VOLUME, 'notafilesystemweknow', '/dev/sdz9', ['rw']),
];

function refusalFor(path, mounts = FIXTURE, env = {}) {
  const result = probe({ call: 'resolve', path, mounts }, env);
  assert.equal(
    result.allowed,
    false,
    `${path} was ALLOWED and must not be. Resolved to ${result.resolved}`,
  );
  assert.ok(result.message && result.message.trim().length > 0, 'the refusal said nothing');
  return result.message;
}

function assertNoInternalVocabulary(message, where) {
  const low = message.toLowerCase();
  for (const word of BANNED) {
    assert.ok(!low.includes(word), `${where} shows the internal word "${word}" to a person`);
  }
  assert.ok(!/rail[\s_-]*\d/i.test(message), `${where} shows a rail number to a person`);
}

/* ── 0. THE CONTROL. Without this, every test below is satisfied by a check
      that refuses everything. ─────────────────────────────────────────────── */

test('a plain folder on an ordinary local disk is allowed', () => {
  const wanted = join(PLAIN, 'case-01');
  const result = probe({ call: 'resolve', path: wanted, mounts: FIXTURE });
  assert.equal(
    result.allowed,
    true,
    `an ordinary local folder was refused, so every refusal below is vacuous:\n${result.message}`,
  );
  assert.equal(result.resolved, wanted, 'the allowed path is not the path asked for');
});

test('the engine can read this machine’s real mount table, and it is not empty', () => {
  // The fixtures prove the classifier. This proves the READER, which is the half
  // a fixture cannot reach: on a platform with no reader the engine refuses
  // every folder, and that must be a visible fact rather than a surprise.
  const table = probe({ call: 'table' });
  assert.ok(
    table.count > 0,
    `read no mount entries on ${process.platform}. Mechanism reported: ${table.mechanism}. ` +
      'Every folder would be refused as unestablished.',
  );
  assert.match(table.mechanism, /list of mounted volumes/);
});

/* ── 1. THE INSTALL TREE ──────────────────────────────────────────────────── */

test('refuses a folder inside the tool’s own install tree, and says why', () => {
  const message = refusalFor(join(INSTALL_ROOT, 'data', 'a-case'), null);
  assert.match(message, /install/i, 'the refusal does not say it is the install folder');
  assert.ok(message.includes(INSTALL_ROOT), 'the refusal does not name the install tree');
  assertNoInternalVocabulary(message, 'the install-tree refusal');
});

/* ── 2. A NETWORK VOLUME ──────────────────────────────────────────────────── */

test('refuses a network volume by filesystem type, and states the reason', () => {
  const message = refusalFor(join(NET_VOLUME, 'case-01'));
  assert.match(message, /leaves this machine/, 'the refusal does not say the files would leave');
  assert.ok(message.includes('cifs'), 'the refusal does not name the property it acted on');
  assert.ok(message.includes(NET_VOLUME), 'the refusal does not name the volume');
  assertNoInternalVocabulary(message, 'the network refusal');
});

test('refuses a volume whose SOURCE names another machine, whatever its type says', () => {
  // Detection is by property, and a remote source is a property. A vendor could
  // ship any filesystem type; it cannot hide that the mount comes from a host.
  const point = dir('root', 'looks-ordinary');
  const message = refusalFor(join(point, 'case-01'), [
    mount(LOCAL_ROOT, 'ext4', '/dev/sda2', ['rw']),
    mount(point, 'ext4', 'someone-else-machine:/exported', ['rw']),
  ]);
  assert.match(message, /leaves this machine/);
  assert.ok(message.includes('someone-else-machine:/exported'), 'the refusal hides the source');
});

test('on macOS, a volume the system does not report as local is refused', () => {
  // `local` is a mount option macOS sets for every real local volume. Its
  // absence is a property of the mount, not a guess about a folder name.
  const point = dir('root', 'not-marked-local');
  const message = refusalFor(join(point, 'case-01'), [
    mount(LOCAL_ROOT, 'apfs', '/dev/disk3s5', ['local', 'journaled'], 'darwin-mount'),
    mount(point, 'apfs', 'something', ['journaled', 'nobrowse'], 'darwin-mount'),
  ]);
  assert.match(message, /does not report as local|leaves this machine/);
});

/* ── 3. A VOLUME A PROGRAM SERVES, the sync-root case ────────────────────── */

test('refuses a volume a program serves rather than a disk, by family', () => {
  const message = refusalFor(join(PROGRAM_VOLUME, 'case-01'));
  assert.match(
    message,
    /a program stands between you and the files/,
    'the refusal does not explain what a program-served folder is',
  );
  assert.match(message, /sync client|cloud drive/, 'the refusal does not name the hazard');
  assert.ok(message.includes(PROGRAM_VOLUME), 'the refusal does not name the volume');
  assertNoInternalVocabulary(message, 'the program-served refusal');
});

test('no refusal names a vendor. Detection is by property, and so is the wording', () => {
  const messages = [
    refusalFor(join(NET_VOLUME, 'case-01')),
    refusalFor(join(PROGRAM_VOLUME, 'case-01')),
    refusalFor(join(ODD_VOLUME, 'case-01')),
    refusalFor(join(INSTALL_ROOT, 'x'), null),
  ];
  for (const message of messages) {
    const low = message.toLowerCase();
    for (const vendor of VENDOR_SHAPED) {
      assert.ok(!low.includes(vendor), `a refusal names a vendor: "${vendor}"`);
    }
  }
});

test('the operating system’s own provider folder is refused, whatever is inside it', () => {
  // Provider-agnostic and system-defined: every provider mounts under it and
  // none is named. Supplements the table, because on some releases a provider's
  // mount is not in the table at all.
  if (process.platform === 'darwin') {
    const home = dir('pretend-home');
    const inside = join(home, 'Library', 'CloudStorage', 'Some-Provider', 'case-01');
    mkdirSync(dirname(inside), { recursive: true });
    const message = refusalFor(inside, FIXTURE, { HOME: home });
    assert.match(message, /cloud provider/i);
    assert.ok(message.includes('CloudStorage'), 'the refusal does not name the system folder');
  } else if (process.platform === 'linux') {
    const inside = `/run/user/${process.getuid()}/gvfs/some-provider/case-01`;
    const message = refusalFor(inside, FIXTURE);
    assert.match(message, /cloud provider|remote and cloud/i);
  } else {
    assert.fail(`no provider-folder expectation is written for ${process.platform}`);
  }
});

/* ── 4. A SYMLINK THAT RESOLVES INTO EITHER ───────────────────────────────── */

test('refuses a symlink that resolves into a network volume', () => {
  const target = join(NET_VOLUME, 'case-01');
  mkdirSync(target, { recursive: true });
  const link = join(dir('links'), 'looks-local-1');
  rmSync(link, { force: true });
  symlinkSync(target, link);

  const message = refusalFor(link);
  assert.match(message, /leaves this machine/, 'the symlink was judged on the name it was given');
  assert.ok(
    message.includes(target),
    'the refusal reports the link rather than where it actually goes',
  );
});

test('refuses a symlink that resolves into the install tree', () => {
  const target = join(INSTALL_ROOT, 'data');
  const link = join(dir('links'), 'looks-local-2');
  rmSync(link, { force: true });
  symlinkSync(target, link);

  const message = refusalFor(link, null);
  assert.match(message, /install/i);
  assert.ok(message.includes(INSTALL_ROOT), 'the refusal does not name the install tree');
});

test('refuses a symlink that resolves into a program-served volume', () => {
  const target = join(PROGRAM_VOLUME, 'case-01');
  mkdirSync(target, { recursive: true });
  const link = join(dir('links'), 'looks-local-3');
  rmSync(link, { force: true });
  symlinkSync(target, link);

  const message = refusalFor(link);
  assert.match(message, /a program stands between you and the files/);
});

/* ── 5. UNDETECTABLE, refuses rather than assuming safe ──────────────────── */

test('refuses when there is no mount table to read at all', () => {
  const message = refusalFor(join(PLAIN, 'case-01'), []);
  assert.match(message, /cannot establish what that folder sits on/);
  assert.match(
    message,
    /not the same as it being safe/,
    'the refusal does not say why not-established is not a pass',
  );
  assertNoInternalVocabulary(message, 'the unestablished refusal');
});

test('refuses when the table covers other volumes but not this path', () => {
  const elsewhere = dir('root', 'a-different-volume');
  const message = refusalFor(join(PLAIN, 'case-01'), [
    mount(elsewhere, 'ext4', '/dev/sdb1', ['rw']),
  ]);
  assert.match(message, /cannot establish what that folder sits on/);
});

test('refuses a filesystem type it does not recognise, rather than passing it', () => {
  const message = refusalFor(join(ODD_VOLUME, 'case-01'));
  assert.match(message, /cannot establish what that folder sits on/);
  assert.ok(
    message.includes('notafilesystemweknow'),
    'the refusal does not say which type it could not classify',
  );
});

/* ── 6. INSIDE A VERSION-CONTROLLED PROJECT ───────────────────────────────────

   🔴 THE GAP THIS CLOSES, MEASURED. The install-tree refusal covers
   `skill/**` and nothing above it, so `<repo>/a-case` reached the confirmation
   screen and offered to create itself at the top of a repository. As did a
   symlink pointing at that repository, which proves symlink resolution was
   working and the refusal simply had nothing to fire on.

   ⚠️ EVERY FIXTURE HERE PASSES `null` FOR THE MOUNT TABLE, so none of these can
   pass by hitting the unestablished refusal instead. The reason asserted is the
   version-control one, by its own words. ─────────────────────────────────────── */

/** The marker at the top of a version-controlled project. */
const MARKER = '.git';

/** A project whose marker is a DIRECTORY, an ordinary checkout. */
const PROJECT = dir('projects', 'a-project');
mkdirSync(join(PROJECT, MARKER), { recursive: true });

/**
 * A project whose marker is a FILE. A submodule and a linked worktree both carry
 * a file holding a pointer instead of a directory, so a check that tested only
 * for a directory would wave both of them through, and a submodule is a
 * published tree exactly like its parent.
 */
const SUBPROJECT = dir('projects', 'a-part-of-another-project');
writeFileSync(join(SUBPROJECT, MARKER), 'gitdir: ../somewhere-else\n');

/** No project above the fixtures the other tests rely on. Asserted, not assumed. */
function markerAbove(path) {
  let probe = path;
  for (;;) {
    const marker = join(probe, MARKER);
    if (existsSync(marker)) return marker;
    let there = false;
    try {
      lstatSync(marker);
      there = true;
    } catch {
      there = false;
    }
    if (there) return marker;
    const up = dirname(probe);
    if (up === probe) return null;
    probe = up;
  }
}

test('the version-control fixtures are the only projects in this suite’s temp tree', () => {
  // Without this, the control below could be passing because nothing was ever
  // planted, and the refusals could be firing on an unrelated project above TMP.
  assert.equal(markerAbove(TMP), null, `something above ${TMP} is a project. Every test here is unsound`);
  assert.equal(markerAbove(PLAIN), null, `the control folder ${PLAIN} sits inside a project`);
  assert.equal(markerAbove(PROJECT), join(PROJECT, MARKER), 'the marker directory was not planted');
  assert.equal(markerAbove(SUBPROJECT), join(SUBPROJECT, MARKER), 'the marker file was not planted');
});

test('refuses a folder directly inside a version-controlled project', () => {
  const message = refusalFor(join(PROJECT, 'case-01'), null);
  assert.match(
    message,
    /keeps its own history/,
    'the refusal does not say what is wrong with that folder',
  );
  assert.ok(message.includes(PROJECT), 'the refusal does not name the project it found');
  assert.ok(message.includes(join(PROJECT, MARKER)), 'the refusal does not say what it acted on');
  // ⛔ It must be actionable by someone frightened, not merely correct.
  assert.match(message, /Pick a folder outside that project/, 'the refusal says what, not what to do');
  assertNoInternalVocabulary(message, 'the version-control refusal');
  for (const claim of ['secure', 'protected', 'safe']) {
    assert.ok(
      !message.toLowerCase().includes(claim),
      `the version-control refusal describes something as "${claim}"`,
    );
  }
});

test('refuses a folder nested deep inside a version-controlled project', () => {
  // The marker is four folders up, and none of the folders between carries one.
  const deep = join(PROJECT, 'src', 'a', 'b', 'case-01');
  const message = refusalFor(deep, null);
  assert.match(message, /keeps its own history/);
  assert.ok(message.includes(PROJECT), 'the refusal names the folder asked for, not the project above it');
});

test('refuses a project whose marker is a FILE, not a directory', () => {
  // A submodule and a linked worktree are both this shape.
  const message = refusalFor(join(SUBPROJECT, 'case-01'), null);
  assert.match(message, /keeps its own history/);
  assert.ok(message.includes(join(SUBPROJECT, MARKER)), 'the refusal does not name the marker file');
});

test('refuses a symlink that resolves into a version-controlled project', () => {
  const target = join(PROJECT, 'notes', 'case-01');
  const link = join(dir('links'), 'looks-local-4');
  rmSync(link, { force: true });
  symlinkSync(target, link);

  const message = refusalFor(link, null);
  assert.match(message, /keeps its own history/, 'the symlink was judged on the name it was given');
  assert.ok(message.includes(target), 'the refusal reports the link rather than where it actually goes');
});

test('the engine answers this by reading the filesystem, not by running a version-control tool', () => {
  // ⛔ A subprocess would need the tool installed, would run whatever is on the
  // path, and would read the person's own configuration to answer. One entry is
  // the whole question.
  const source = readEngine();
  const detector = source.slice(source.indexOf('def version_controlled_project'));
  assert.ok(detector.length > 200, 'could not isolate the detector in the engine source');
  const body = detector.slice(0, detector.indexOf('\ndef resolve_workspace'));
  assert.ok(body.length > 100, 'could not isolate the detector body');
  for (const word of ['subprocess', 'shutil.which', 'os.system', 'popen', 'run(']) {
    assert.ok(
      !body.toLowerCase().includes(word),
      `the version-control check shells out: it mentions "${word}"`,
    );
  }
});

/* ── the readers, one fixture per real table format ───────────────────────── */

test('all three mount-table formats parse, and each is classified by property', () => {
  const cases = [
    {
      origin: 'linux-mountinfo',
      text:
        '25 0 8:2 / / rw,relatime shared:1 - ext4 /dev/sda2 rw\n' +
        '99 25 0:71 / /mnt/team rw,relatime shared:9 - cifs //a-server/team rw,vers=3.1.1\n' +
        '77 25 0:88 / /home/someone/synced rw,nosuid - fuse.a-daemon a-daemon rw\n' +
        '78 25 0:89 / /mnt/with\\040a\\040space rw - ext4 /dev/sdc1 rw\n',
      expect: [
        ['/', 'ext4', null],
        ['/mnt/team', 'cifs', 'network'],
        ['/home/someone/synced', 'fuse.a-daemon', 'program'],
        ['/mnt/with a space', 'ext4', null],
      ],
    },
    {
      origin: 'linux-mounts',
      text: '/dev/sda2 / ext4 rw,relatime 0 0\n//a-server/team /mnt/team cifs rw,vers=3.1.1 0 0\n',
      expect: [
        ['/', 'ext4', null],
        ['/mnt/team', 'cifs', 'network'],
      ],
    },
    {
      origin: 'darwin-mount',
      text:
        '/dev/disk3s5 on / (apfs, local, journaled)\n' +
        '//someone@a-server/team on /Volumes/team (smbfs, nodev, nosuid, mounted by someone)\n' +
        'a-daemon on /Users/someone/synced (macfuse, nodev, nosuid)\n' +
        'map auto_home on /System/Volumes/Data/home (autofs, automounted, nobrowse)\n',
      expect: [
        ['/', 'apfs', null],
        ['/Volumes/team', 'smbfs', 'network'],
        ['/Users/someone/synced', 'macfuse', 'program'],
        ['/System/Volumes/Data/home', 'autofs', 'network'],
      ],
    },
  ];

  let checked = 0;
  for (const { origin, text, expect } of cases) {
    const { entries } = probe({ call: 'parse', text, origin });
    assert.equal(
      entries.length,
      expect.length,
      `${origin}: parsed ${entries.length} entries, expected ${expect.length}`,
    );
    for (let i = 0; i < expect.length; i += 1) {
      const [point, fstype, verdictClass] = expect[i];
      assert.equal(entries[i].point, point, `${origin} entry ${i}: wrong mount point`);
      assert.equal(entries[i].fstype, fstype, `${origin} entry ${i}: wrong filesystem type`);
      const got = entries[i].verdict === null ? null : entries[i].verdict[0];
      assert.equal(
        got,
        verdictClass,
        `${origin} ${point} (${fstype}) classified as ${JSON.stringify(entries[i].verdict)}`,
      );
      checked += 1;
    }
  }
  assert.ok(checked >= 10, `only ${checked} table entries classified`);
});

test('the engine holds no vendor name to detect with', () => {
  // ⛔ The detection sets are filesystem TYPES and mount-source SHAPES. If a
  // vendor string ever appears in the engine, someone has swapped a property
  // check for a name check and the four-brand-string failure is back.
  const source = readEngine();
  const low = source.toLowerCase();
  for (const vendor of VENDOR_SHAPED) {
    assert.ok(!low.includes(vendor), `skill/scripts/triage.py names a vendor: "${vendor}"`);
  }
});

function readEngine() {
  const run = spawnSync('cat', [join(SCRIPTS, 'triage.py')], { encoding: 'utf8' });
  assert.equal(run.status, 0, 'could not read the engine');
  assert.ok(run.stdout.length > 1000, 'the engine source is suspiciously small');
  return run.stdout;
}
