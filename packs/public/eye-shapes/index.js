// eye-shapes - the eye daemon's own adversarial pack. Mirrors the family's
// pack contract (moduleCtx-armed, verdict taxonomy REFUSED / EXPLOITED /
// BOUNDED, nothing imported from the target): the pack drives the cli the
// run root hands it and judges by the observable exit contract.
//
// THE CONTRACT with the target (moduleCtx['eye-shapes']):
//
//   run(argv, { cwd })   -> execFileSync-shaped { code, stdout, stderr }
//                           for the REAL eyestruct CLI (subprocess, so the
//                           exit contract is exercised, not re-implemented)
//   tmpdir()             -> a fresh disposable fixture directory
//   writeFile(dir, rel, text)
//   read(dir, rel)       -> boolean "exists"
//   bounds               { '<attack-name>': { owner, bound } }  (ONLY for
//                           risks the target documents as accepted - absent
//                           bounds stay findings, per the family contract)
//
// Missing vocabulary fails the run loudly naming this pack - an un-armed
// pack must not read as "everything refused".

const PKG = 'packs/public/eye-shapes'

/** The moduleCtx keys this pack refuses to run without. */
const REQUIRED_KEYS = ['run', 'tmpdir', 'writeFile', 'bounds']

function take(ctx, key) {
  const value = ctx?.[key]
  if (value == null) {
    throw new TypeError(`${PKG}: moduleCtx['eye-shapes'].${key} is missing - arm the run root`)
  }
  return value
}

function initRepo(ctx, dir) {
  take(ctx, 'run')(['init', '--browser-image', 'pack-fixture:1', '--renderer', 'resvg@2.6.2'], cwd(dir))
}

function cwd(dir) {
  return { cwd: dir }
}

const CASES = [
  {
    id: 'unknown-command',
    attack: 'a verb that never existed gets a bare stack trace',
    expect: { code: 1, reason: 'UNKNOWN_COMMAND' },
    run(ctx, dir) {
      return ctx.run(['frobnicate'], cwd(dir))
    },
  },
  {
    id: 'empty-verb-refused',
    attack: 'an empty-string verb improvises help instead of refusing (the crashtest-leg receipt)',
    expect: { code: 1, reason: 'UNKNOWN_COMMAND' },
    run(ctx, dir) {
      return ctx.run([''], cwd(dir))
    },
  },
  {
    id: 'gate-no-manifest',
    attack: 'gate runs blind without a manifest',
    expect: { code: 2, reason: 'MISSING_MANIFEST' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'manifest-corrupt-pin',
    attack: 'hand-mangled manifest pin reads as valid memory',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/manifest.yml', 'pin:\n  no-browser-key: nope\nroutes:\n')
    },
    expect: { code: 2, reason: 'MANIFEST_CORRUPT' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'ledger-corrupt-json',
    attack: 'a half-written ledger is guessed past instead of refused',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/ledger.json', '{"rows": [oops')
    },
    expect: { code: 2, reason: 'LEDGER_CORRUPT' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'ledger-duplicate-ids',
    attack: 'two canon rows with one id launder a rewrite of history',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      const row = '{"id":"row-0001","ts":1,"agent":"a","commit":"c","artifact":"home/current.png","type":"adopt","note":"n"}'
      ctx.writeFile(dir, 'labs/.eyes/ledger.json', `[${row},${row}]`)
      ctx.writeFile(dir, 'labs/.eyes/home/current.png', 'pngish')
    },
    expect: { code: 2, reason: 'LEDGER_CORRUPT' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'adopt-note-required',
    attack: 'an unexplained visual change re-baselines canon',
    setup: (ctx, dir) => initRepo(ctx, dir),
    expect: { code: 1, reason: 'ADOPT_NOTE_REQUIRED' },
    run(ctx, dir) {
      return ctx.run(['adopt', 'home/current.png'], cwd(dir))
    },
  },
  {
    id: 'adopt-control-char-note',
    attack: 'a control character rides the ledger into every reader',
    setup: (ctx, dir) => initRepo(ctx, dir),
    expect: { code: 1, reason: 'UNSAFE_TEXT' },
    run(ctx, dir) {
      return ctx.run(['adopt', 'home/current.png', '--note', 'legit note\u0007 shell meta'], cwd(dir))
    },
  },
  {
    id: 'gate-unrecorded-artifact',
    attack: 'a pixel change ships with no ledger row explaining it',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/home/current.png', 'pngish')
    },
    expect: { code: 1, reason: 'UNRECORDED' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'gate-dangling-row',
    attack: 'a ledger row canonizes an artifact that no longer exists',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/ledger.json', JSON.stringify([{
        id: 'row-0001', ts: 1, agent: 'a', commit: 'c', type: 'adopt',
        artifact: 'home/ghost.png', note: 'claims a file that was never committed', ratified: false,
      }], null, 2))
    },
    expect: { code: 1, reason: 'DANGLING_ROW' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'look-missing-url',
    attack: 'a look without a target improvises one',
    setup: (ctx, dir) => initRepo(ctx, dir),
    expect: { code: 1, reason: 'UNKNOWN_COMMAND' },
    run(ctx, dir) {
      return ctx.run(['look'], cwd(dir))
    },
  },
  {
    id: 'diff-no-baseline',
    attack: 'a diff manufactures its own baseline',
    setup: (ctx, dir) => initRepo(ctx, dir),
    expect: { code: 1, reason: 'NO_BASELINE' },
    run(ctx, dir) {
      return ctx.run(['diff', 'file:///nowhere'], cwd(dir))
    },
  },
  {
    id: 'browser-missing-refusal',
    attack: 'a capability gap crashes as an error path (the vant inspect receipt)',
    setup: (ctx, dir) => initRepo(ctx, dir),
    expect: { code: 2, reason: 'MISSING_PINNED_BROWSER' },
    run(ctx, dir) {
      // Forcing a bogus exec makes this case deterministic on any machine:
      // the refusal path needs no browser, that is the whole point.
      return ctx.run(['look', 'file:///nowhere', '--browser-exec', '/no/such/chrome'], cwd(dir))
    },
  },
]

// The tolerance-profile carrier cases (eyestruct#11's T-T5, filed 2026-10-29
// ahead of the lib per the bridge/carrier ruling): the manifest-declared
// per-slot profile grammar is a route-row shape, so its jail cases mount in
// the pack that owns the manifest-corrupt class BEFORE the lib that
// implements the lane refuses to land. The row shape (T-T1, labs/prd-eyes.md):
// `tolerance:` takes `strict` (default) or ALL THREE bounds at once -
// `channel:0-255, pixels:0-1, bbox:WxH` (khf-wp's measured receipts; a
// half-named profile is a half-honesty and refuses).

function rowManifest(tolerancePiece) {
  return `pin:\n  browser-image: pack-fixture:1\n  renderer: resvg@2.6.2\nroutes:\n  - path: /  view: desktop-1280  theme: dark  viewport: 1280x800${tolerancePiece}\n`
}

const TOLERANCE_CASES = [
  {
    id: 'tolerance-unknown-token',
    attack: 'a tolerance profile whose token names no grammar reads as a valid mode',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/manifest.yml', rowManifest('  tolerance: vibes'))
    },
    expect: { code: 2, reason: 'MANIFEST_CORRUPT' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'tolerance-bound-out-of-range',
    attack: 'a tolerance profile with an out-of-range bound parses as a mode (channel caps at 255)',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/manifest.yml', rowManifest('  tolerance: channel:999,pixels:1e-5,bbox:4x4'))
    },
    expect: { code: 2, reason: 'MANIFEST_CORRUPT' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'tolerance-half-named',
    attack: 'a tolerance profile that names some bounds and not others passes the jail (the half-honesty class)',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/manifest.yml', rowManifest('  tolerance: channel:4,pixels:1e-5'))
    },
    expect: { code: 2, reason: 'MANIFEST_CORRUPT' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
  {
    id: 'tolerance-strict-parses-through',
    attack: 'an explicit strict tolerance row trips the manifest jail (strict is a mode, not an unknown token)',
    setup(ctx, dir) {
      initRepo(ctx, dir)
      ctx.writeFile(dir, 'labs/.eyes/manifest.yml', rowManifest('  tolerance: strict'))
      // The route parsed and the gate reached its accounting: the artifact
      // exists and no row explains it, so the jail held AND the run is
      // behavior, not corruption.
      ctx.writeFile(dir, 'labs/.eyes/home/current.png', 'pngish')
    },
    expect: { code: 1, reason: 'UNRECORDED' },
    run(ctx, dir) {
      return ctx.run(['gate'], cwd(dir))
    },
  },
]

CASES.push(...TOLERANCE_CASES)

/**
 * Browser-class attacks: the pack runs browserless in CI to stay
 * deterministic (no pinned image in a plain job). The accepted-risk bound
 * below must exist in the run root's ctx.bounds or the pack refuses to
 * skip - a silent skip poisons the taxonomy.
 */
const BROWSER_CLASS_CASES = [
  {
    id: 'capture-skeletal-blank-frame',
    attack: 'a blank shell frame is accepted as a look',
    detail: 'requires a pinned browser; covered live by the behavior test battery and by eye-ci-gate under the pinned-image lane',
  },
  {
    id: 'crop-target-missing',
    attack: 'a --region selector matching nothing renders full frame instead of refusing',
    detail: 'requires a pinned browser; covered live by the behavior test battery',
  },
]

/**
 * Self-leg cases: the repo's own committed eye set (labs/.eyes) is canon
 * this pack also defends - so it gets attacked here, read-only, from the
 * tree root through the real CLI. No temp dirs, no seeds: the shipped
 * baseline must pass its own gate, and the CLI must read its own ledger
 * honestly. If the committed set ever drifts unexplained, these rows fail
 * the campaign - the fix lands as a ledger row, not console archaeology.
 */
const SELF_CASES = [
  {
    id: 'self-gate-passes',
    detail: 'gate over the committed labs/.eyes exits 0 - canon is explained',
    args: ['gate'],
  },
  {
    id: 'self-ledger-list-parses',
    detail: 'ledger list over the committed set exits 0 with real rows, no stack frames',
    args: ['ledger', 'list'],
  },
]

function run(ctx) {
  const bounds = take(ctx, 'bounds')
  const browserBound = bounds['browser-class-in-ci']
  const rows = []
  let ok = true

  for (const tc of CASES) {
    const dir = take(ctx, 'tmpdir')()
    try {
      if (tc.setup) tc.setup(ctx, dir)
      const out = tc.run(ctx, dir)
      const stderr = String(out.stderr || '')
      if (out.code === tc.expect.code && stderr.includes(`eyestruct[${tc.expect.reason}]`)) {
        rows.push({ pack: 'eye-shapes', id: tc.id, verdict: 'REFUSED', reason: tc.expect.reason, exit: out.code })
      } else {
        ok = false
        rows.push({ pack: 'eye-shapes', id: tc.id, verdict: 'EXPLOITED', expected: tc.expect, got: { code: out.code, stderr: stderr.slice(0, 200) } })
      }
    } catch (err) {
      ok = false
      rows.push({ pack: 'eye-shapes', id: tc.id, verdict: 'EXPLOITED', error: String(err && err.message).slice(0, 200) })
    }
    if (ctx.dispose) ctx.dispose(dir)
  }

  // The self-leg: read-only attacks on the repo's own canon. Same try/catch
  // shape as the seeded battery; verdict PASSED (the defense held on real
  // state) instead of REFUSED (a shell refused nothing - there was no shell).
  for (const tc of SELF_CASES) {
    try {
      const out = take(ctx, 'run')(tc.args)
      const stderr = String(out.stderr || '')
      const bare = /(^|\n)\s*at /.test(stderr) || /eyestruct: internal error/.test(stderr)
      if (out.code === 0 && !bare && String(out.stdout || '').trim().length > 0) {
        rows.push({ pack: 'eye-shapes', id: tc.id, verdict: 'PASSED', detail: tc.detail })
      } else {
        ok = false
        rows.push({ pack: 'eye-shapes', id: tc.id, verdict: 'EXPLOITED', expected: { code: 0, contract: 'named refusal or clean pass, never a stack trace' }, got: { code: out.code, stderr: stderr.slice(0, 200), stdoutLen: String(out.stdout || '').length } })
      }
    } catch (err) {
      ok = false
      rows.push({ pack: 'eye-shapes', id: tc.id, verdict: 'EXPLOITED', error: String(err && err.message).slice(0, 200) })
    }
  }

  // Browser-class rows: REFUSABLE only through the documented bound.
  if (!browserBound || !browserBound.owner || !browserBound.bound) {
    ok = false
    rows.push({ pack: 'eye-shapes', id: 'browser-class-bound', verdict: 'EXPLOITED', error: 'the browser-class skip is undocketed - bounds["browser-class-in-ci"] needs owner + bound' })
  } else {
    for (const tc of BROWSER_CLASS_CASES) {
      rows.push({ pack: 'eye-shapes', id: tc.id, verdict: 'BOUNDED', owner: browserBound.owner, bound: browserBound.bound, detail: tc.detail })
    }
  }

  return { ok, rows }
}

module.exports = { run, CASES, SELF_CASES, PKG, REQUIRED_KEYS }
