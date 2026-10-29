// eyestruct look / diff - the capture verbs (the look-diff law).
// Process-per-look: spawn the pinned browser, capture, annotate, EXIT.
// look writes a CANDIDATE artifact outside labs/.eyes/ (gitignored, disposable);
// the committed baseline is owned by adopt + the CI lane only. The ledger is
// never touched by look/diff - proposals come from `adopt --note`.

'use strict'

const fs = require('fs')
const path = require('path')
const { fail } = require('./reasons')
const manifest = require('./manifest')
const ledgerMod = require('./ledger')

function requireEngine() {
  try {
    const engine = require('./engine')
    if (typeof engine.capture !== 'function') throw new Error('capture missing')
    return engine
  } catch (err) {
    fail('MISSING_PINNED_BROWSER', `capture engine not available (${err.message})`)
  }
}

// The capture-output flags (creadev #19/#20): --full-page, --format,
// --quality. Values are validated in engine.capture (the ONE implementation
// - the jail sits before findExec, so a bad value never demands a browser);
// these verbs only read them and carry truth outward (like the file
// extension, which must say what actually painted the frame).
function captureOutputArgs(argv) {
  return {
    format: flagValue(argv, '--format'),
    quality: flagValue(argv, '--quality'),
    fullPage: argv.includes('--full-page'),
    ext: flagValue(argv, '--format') === 'webp' ? 'webp' : 'png',
  }
}

function candidatePath(cwd, url, capture) {
  let host = 'local', slug = 'page'
  try {
    const u = new URL(url, 'file://local')
    host = (u.protocol === 'file:' ? 'file' : u.hostname) || 'local'
    slug = (u.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'page').slice(0, 40)
  } catch {}
  const ext = capture === 'webp' ? 'webp' : 'png'
  const name = `${host}__${slug}_${Date.now()}.${ext}`
  return path.join(cwd, 'labs/.eyes-candidates', name)
}

function runLook(ctx) {
  const m = manifest.read(ctx.cwd, ctx)
  const url = ctx.argv.find((a) => /^(https?:\/\/|file:\/\/)/.test(a))
  if (!url) fail('UNKNOWN_COMMAND', 'look needs an http(s) or file:// <url>')
  const engine = requireEngine()
  // Clean capture (creadev #18) + output shape (creadev #19/#20): these
  // flags only loosen what a CANDIDATE may be - canon never rides look.
  const noOverlay = ctx.argv.includes('--no-overlay')
  const out = captureOutputArgs(ctx.argv)
  return engine.capture({
    url,
    argv: ctx.argv,
    pin: m.pin,
    viewport: flagValue(ctx.argv, '--viewport') || '1280x800',
    theme: flagValue(ctx.argv, '--theme'),
    region: flagValue(ctx.argv, '--region'),
    noOverlay,
    ...out,
  }).then((cap) => {
    fs.mkdirSync(path.join(ctx.cwd, 'labs/.eyes-candidates'), { recursive: true })
    const file = candidatePath(ctx.cwd, url, out.ext)
    fs.writeFileSync(file, cap.png)
    const bytes = fs.statSync(file).size
    if (bytes < 1024) fail('CAPTURE_TOO_SKELETAL', `capture is ${bytes} bytes - likely a blank frame`)
    const view = {
      file: path.relative(ctx.cwd, file),
      bytes,
      elementsMapped: cap.map.length,
      exec: cap.exec,
      version: cap.version,
      map: ctx.json ? cap.map : undefined,
      note: 'candidate artifact; baseline + ledger go through adopt',
    }
    if (ctx.json) process.stdout.write(JSON.stringify(view, null, 2) + '\n')
    else {
      process.stdout.write(
        `look: ${view.file} (${bytes}B, ${cap.map.length} element(s) mapped, ${noOverlay ? 'clean frame - overlay off' : cap.overlayCount + ' overlay label(s)'})\n` +
        `map: ${cap.map.slice(0, 8).map((e) => '#' + e.id).join(' ')}${cap.map.length > 8 ? ' ...' : ''}\n`)
    }
    return 0
  })
}

// The agent-eyes verb (the instance loop): one capture, saved as a PNG a
// coding agent can open with its own vision, plus the element map it
// already yields. Candidate-only, ledger untouched, canon stays CI-cut.
function runSpot(ctx) {
  const m = manifest.read(ctx.cwd, ctx)
  const url = ctx.argv.find((a) => /^(https?:\/\/|file:\/\/)/.test(a))
  if (!url) fail('UNKNOWN_COMMAND', 'spot needs an http(s) or file:// <url>')
  const engine = requireEngine()
  // Same flags as look (creadev #18/#19/#20): the frame an agent reads
  // should be the page, in the shape the loop wants, at the size it needs.
  const noOverlay = ctx.argv.includes('--no-overlay')
  const out = captureOutputArgs(ctx.argv)
  return engine.capture({
    url,
    argv: ctx.argv,
    pin: m.pin,
    viewport: flagValue(ctx.argv, '--viewport') || '1280x800',
    theme: flagValue(ctx.argv, '--theme'),
    region: flagValue(ctx.argv, '--region'),
    noOverlay,
    ...out,
  }).then((cap) => {
    fs.mkdirSync(path.join(ctx.cwd, 'labs/.eyes-candidates'), { recursive: true })
    let host = 'local'
    let slug = 'page'
    try {
      const u = new URL(url, 'file://local')
      host = (u.protocol === 'file:' ? 'file' : u.hostname) || 'local'
      slug = (u.pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'page').slice(0, 40)
    } catch {}
    const file = path.join(ctx.cwd, 'labs/.eyes-candidates', `spot-${host}__${slug}_${Date.now()}.${out.ext}`)
    fs.writeFileSync(file, cap.png)
    const bytes = fs.statSync(file).size
    if (bytes < 1024) fail('CAPTURE_TOO_SKELETAL', `capture is ${bytes} bytes - likely a blank frame`)
    const rel = path.relative(ctx.cwd, file)
    if (ctx.json) {
      process.stdout.write(JSON.stringify({ file: rel, bytes, elementsMapped: cap.map.length, exec: cap.exec, note: 'candidate artifact; open this PNG with your own vision - the loop is serve -> spot -> read -> act -> re-spot' }, null, 2) + '\n')
    } else {
      process.stdout.write(
        `spot: ${rel} (${bytes}B, ${cap.map.length} element(s) mapped)\n` +
        `read this PNG with your own vision - the loop: serve -> spot -> read -> act -> re-spot\n`)
    }
    return 0
  })
}

function runDiff(ctx) {
  const m = manifest.read(ctx.cwd, ctx)
  const url = ctx.argv.find((a) => /^(https?:\/\/|file:\/\/)/.test(a))
  if (!url) fail('UNKNOWN_COMMAND', 'diff needs an http(s) or file:// <url>')
  const eyesDir = path.dirname(m.file)
  const baselineRel = flagValue(ctx.argv, '--against')
  // --against names an artifact like the ledger does (eyes-relative);
  // absolute paths and explicit labs/.eyes/-relative paths also work.
  let baselineFile
  if (!baselineRel) {
    // Default --against is the manifest's first route slot, not a bare
    // labs/.eyes/current.png nothing ever writes.
    const first = m.routes[0]
    if (!first) fail('NO_BASELINE', 'the manifest declares no routes, so there is no default baseline either')
    baselineFile = path.join(eyesDir, require('./ratify').slotDir(first), 'current.png')
  } else {
    // Same confinement the ledger reader and the MCP tool both enforce
    // (UNSAFE_PATH): the baseline is an eyes-relative artifact path, never
    // an absolute path and never carrying .. segments. The check sits
    // BEFORE the engine load on purpose - an escape refusal must not
    // demand a pinned browser to say its name.
    if (ledgerMod.artifactEscapes(baselineRel)) {
      fail('UNSAFE_PATH', `the diff baseline stays eyes-relative (against: "${String(baselineRel)}")`)
    }
    baselineFile = path.join(eyesDir, baselineRel)
  }
  if (!fs.existsSync(baselineFile)) {
    fail('NO_BASELINE', `${path.relative(ctx.cwd, baselineFile)} - capture with \`look\`, then \`adopt\` a baseline first`)
  }
  const engine = requireEngine()
  return engine.capture({
    url,
    argv: ctx.argv,
    pin: m.pin,
    viewport: flagValue(ctx.argv, '--viewport') || '1280x800',
    theme: flagValue(ctx.argv, '--theme'),
    region: flagValue(ctx.argv, '--region'),
  }).then((cap) => {
    const baseBytes = fs.statSync(baselineFile).size
    const freshBytes = cap.png.length
    const bytesDiffer = baseBytes !== freshBytes
    const verdict = bytesDiffer ? 'DIFFERS' : 'SAME'
    if (ctx.json) {
      process.stdout.write(JSON.stringify({
        verdict, bytes: { baseline: baseBytes, fresh: freshBytes },
        elementsMapped: cap.map.length,
        note: 'pixel canon stays CI-cut; a local DIFFERS becomes truth only via adopt',
      }, null, 2) + '\n')
    } else {
      process.stdout.write(
        `diff vs ${path.relative(ctx.cwd, baselineFile)}: ${verdict} (baseline ${baseBytes}B vs fresh ${freshBytes}B, ${cap.map.length} mapped)\n`)
    }
    return bytesDiffer ? 1 : 0
  })
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag)
  return i === -1 ? null : argv[i + 1]
}

module.exports = { runLook, runSpot, runDiff }
