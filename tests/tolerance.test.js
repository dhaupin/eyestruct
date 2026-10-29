'use strict'

// The pixel-tolerance battery leg (T-T6, labs/prd-eyes.md): the comparator
// is a pure function over PNG buffers, so the battery pins it on synthetic
// plates - solid-color PNGs with a bounded few-pixel delta - at the exact
// bound edges. It NEVER pins the CDP flake itself: whether Chrome's
// one-pixel drifter fits a named profile is environment-local and stays
// khf-wp's T-T7 gate in their run root, not a CI leg.
//
// Legs:
//   - the profile grammar's jail (strict passthrough, unknown token,
//     out-of-range, half-named, spaced fragments) via the REAL manifest read
//   - the comparator at every bound edge: channel cap (at = unchanged, +1 =
//     changed), pixel fraction (at = pass, over = refused BY fail name),
//     bbox at the exact edge in BOTH orientations (the orientation-free
//     ruling, pinned), plus the excluded-mover shapes the receipts named
//   - the decoder's honesty (opaque buffers return null, never a guess)
//   - the row receipt shape under tolerance (ledger append + round-trip;
//     absent fields read strict for old copies) and gate's unchanged
//     accounting (a tolerance-bearing row explains its artifact, exit 0)

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const zlib = require('node:zlib')

const tolerance = require('../lib/tolerance')
const manifest = require('../lib/manifest')
const ledgerMod = require('../lib/ledger')
const gate = require('../lib/gate')

// ---- synthetic plates (RGBA8 PNG, filter 0 - the shape Chrome paints) -----

const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function pngChunk(type, data) {
  const head = Buffer.alloc(4)
  head.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([head, body, crc])
}

/** Build an RGBA8 PNG; paint(x, y) returns [r, g, b, a]. */
function plate(w, h, paint) {
  const stride = w * 4
  const raw = Buffer.alloc((stride + 1) * h)
  const set = paint || (() => [20, 40, 60, 255])
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0
    for (let x = 0; x < w; x++) {
      const px = set(x, y)
      const o = y * (stride + 1) + 1 + x * 4
      raw[o] = px[0]
      raw[o + 1] = px[1]
      raw[o + 2] = px[2]
      raw[o + 3] = px[3]
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/** plateA + exactly the listed changed pixels ([x, y, [r,g,b,a]]), or a paint fn. */
function variant(base, w, h, pixels) {
  if (typeof pixels === 'function') return plate(w, h, pixels)
  return plate(w, h, (x, y) => {
    const hit = pixels.find((p) => p[0] === x && p[1] === y)
    if (hit) return hit[2]
    return [20, 40, 60, 255]
  })
}

function tmpdir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-tol-'))
}

// ---- the parser (the manifest jail's grammar) ------------------------------

test('tolerance parse: strict and absent are the same strict mode', () => {
  assert.deepEqual(tolerance.parse('strict'), { mode: 'strict' })
  assert.deepEqual(tolerance.parse(''), { mode: 'strict' })
  assert.deepEqual(tolerance.parse(undefined), { mode: 'strict' })
})

test('tolerance parse: a valid profile carries all three bounds', () => {
  const p = tolerance.parse('channel:4,pixels:1e-5,bbox:96x320')
  assert.equal(p.mode, 'profile')
  assert.equal(p.channel, 4)
  assert.equal(p.pixels, 1e-5)
  assert.equal(p.bw, 96)
  assert.equal(p.bh, 320)
})

test('tolerance parse: unknown token, out-of-range bound, half-named all refuse BY NAME', () => {
  for (const bad of [
    'vibes',
    'channel:999,pixels:1e-5,bbox:4x4',
    'channel:-1,pixels:1e-5,bbox:4x4',
    'channel:4,pixels:2,bbox:4x4',
    'channel:4,pixels:0,bbox:4x4',
    'channel:4,pixels:1e-5,bbox:0x4',
    'channel:4,pixels:1e-5',
    'channel:4,bbox:4x4',
    'pixels:1e-5,bbox:4x4',
    'channel:4, pixels:1e-5,bbox:4x4',
  ]) {
    assert.throws(() => tolerance.parse(bad), (e) => e.code === 'MANIFEST_CORRUPT', `expected refusal for "${bad}"`)
  }
})

// ---- the manifest read jail (the route-row surface) ------------------------

function writeManifest(dir, rowTail) {
  const text = `pin:\n  browser-image: t:1\n  renderer: resvg@2\nroutes:\n  - path: /  view: desktop-1280  theme: dark  viewport: 1280x800${rowTail}\n`
  fs.mkdirSync(path.join(dir, 'labs', '.eyes'), { recursive: true })
  const file = path.join(dir, 'labs', '.eyes', 'manifest.yml')
  fs.writeFileSync(file, text)
  return dir
}

test('manifest jail: a valid tolerance row reads verbatim; the profile jail fires on every bad shape', () => {
  const ok = writeManifest(tmpdir(), '  tolerance: channel:4,pixels:1e-5,bbox:96x320')
  const read = manifest.read(ok, {})
  assert.equal(read.routes[0].tolerance, 'channel:4,pixels:1e-5,bbox:96x320')

  const strictRow = writeManifest(tmpdir(), '  tolerance: strict')
  assert.equal(manifest.read(strictRow, {}).routes[0].tolerance, 'strict')

  for (const bad of [
    '  tolerance: vibes',
    '  tolerance: channel:999,pixels:1e-5,bbox:4x4',
    '  tolerance: channel:4,pixels:1e-5',
    '  tolerance: channel:4, pixels:1e-5,bbox:4x4',
  ]) {
    const dir = writeManifest(tmpdir(), bad)
    assert.throws(() => manifest.read(dir, {}), (e) => e.code === 'MANIFEST_CORRUPT', `expected jail on "${bad}"`)
  }

  // Unrelated extra keys keep today's tolerant behavior (unchanged surface).
  const extra = writeManifest(tmpdir(), '  note-key: whatever')
  assert.equal(manifest.read(extra, {}).routes[0]['note-key'], 'whatever')
})

// ---- the comparator at the edges ------------------------------------------

test('comparator: identical plates pass with zero changed', () => {
  const a = plate(1280, 800)
  const r = tolerance.compare(a, a, tolerance.parse('channel:4,pixels:1e-5,bbox:96x320'))
  assert.ok(r.pass)
  assert.equal(r.measured.changed, 0)
  assert.equal(r.measured.maxDelta, 0)
})

test('comparator: channel cap edge - AT the cap is not a change, +1 is', () => {
  const prof = tolerance.parse('channel:4,pixels:1e-5,bbox:4x4')
  const at = variant(null, 1280, 800, [[100, 200, [24, 40, 60, 255]]]) // red 20 -> 24
  const r = tolerance.compare(plate(1280, 800), at, prof)
  assert.ok(r.pass, 'delta == channel is NOT a change')
  assert.equal(r.measured.changed, 0)

  const over = variant(null, 1280, 800, [[100, 200, [25, 40, 60, 255]]]) // delta 5
  const r2 = tolerance.compare(plate(1280, 800), over, prof)
  assert.ok(r2.pass, 'one changed px fits 1e-5 of 1024000 and a 4x4 box')
  assert.equal(r2.measured.changed, 1)
  assert.equal(r2.measured.maxDelta, 5)
})

test('comparator: pixel fraction edge - AT the bound passes, over refuses with the fraction fail name', () => {
  const prof = tolerance.parse('channel:4,pixels:1e-5,bbox:96x320') // 1e-5 of 500x200 = 1 px
  const at = variant(null, 500, 200, [[10, 10, [70, 40, 60, 255]]])
  assert.ok(tolerance.compare(plate(500, 200), at, prof).pass)

  const over = variant(null, 500, 200, [[10, 10, [70, 40, 60, 255]], [50, 10, [70, 40, 60, 255]]])
  const r = tolerance.compare(plate(500, 200), over, prof)
  assert.equal(r.pass, false)
  assert.equal(r.fail, 'fraction')
})

test('comparator: bbox edge - the span at the cap passes, one beyond refuses BY name', () => {
  const prof = tolerance.parse('channel:4,pixels:1e-5,bbox:4x4')
  const at = variant(null, 1280, 800, [[10, 10, [70, 40, 60, 255]], [13, 13, [70, 40, 60, 255]]]) // 4x4
  assert.ok(tolerance.compare(plate(1280, 800), at, prof).pass)

  const over = variant(null, 1280, 800, [[10, 10, [70, 40, 60, 255]], [12, 14, [70, 40, 60, 255]]]) // 3x5
  const r = tolerance.compare(plate(1280, 800), over, prof)
  assert.equal(r.pass, false)
  assert.equal(r.fail, 'bbox')
})

test('comparator: the bbox box is orientation-free - a full-width band fits 16x1216 either way', () => {
  const prof = tolerance.parse('channel:16,pixels:2e-4,bbox:16x1216')
  // Sparse bands (one pixel in six of EACH axis) keep the changed FRACTION
  // under the AA profile's 2e-4 cap (609 px of 3,240,000 = 1.88e-4) so the
  // bbox ruling is what these legs exercise - khf-wp's own AA family read
  // 30-116 px. A 1800x1800 plate holds both shapes.
  const band = (w, h, xMax, yMax) => variant(null, w, h, (x, y) => ((x < xMax && y < yMax && x % 6 === 0 && y % 6 === 0) || (x === xMax - 1 && y === 0) || (x === 0 && y === yMax - 1) ? [70, 40, 60, 255] : [20, 40, 60, 255]))
  // Horizontal band: extends 1216 wide, 16 tall (the desktop AA shape).
  const wide = band(1800, 1800, 1216, 16)
  // The same extent transposed: 16 wide, 1216 tall.
  const tall = band(1800, 1800, 16, 1216)
  const squareProf = tolerance.parse('channel:16,pixels:2e-4,bbox:1216x16')

  const r = tolerance.compare(plate(1800, 1800), tall, prof)
  assert.ok(r.pass, 'a tall thin band fits a 16x1216 cap (orientation-free)')
  assert.equal(r.measured.bw, 16)
  assert.equal(r.measured.bh, 1216)

  const r2 = tolerance.compare(plate(1800, 1800), wide, prof)
  assert.ok(r2.pass, 'the same extent transposed fits the same cap')
  assert.equal(r2.measured.bw, 1216)
  assert.equal(r2.measured.bh, 16)

  const r3 = tolerance.compare(plate(1800, 1800), wide, squareProf)
  assert.ok(r3.pass, 'the cap pair is orientation-free symmetric')
})

test('comparator: the excluded-mover shapes refuse - the receipts are why the caps are not bigger', () => {
  // khf-wp's venue-rental cover crop read a span of 174x564 - no quoted
  // paint-noise cap absorbs it (their exclusion ruling, T-T9).
  const prof = tolerance.parse('channel:4,pixels:1e-5,bbox:96x320')
  const mover = variant(null, 1440, 900, (x, y) => ((x === 10 && y === 10) || (x === 183 && y === 573) ? [70, 40, 60, 255] : [20, 40, 60, 255]))
  const r = tolerance.compare(plate(1440, 900), mover, prof)
  assert.equal(r.pass, false)
  assert.equal(r.fail, 'bbox')
  assert.equal(r.measured.bw, 174)
  assert.equal(r.measured.bh, 564)

  // A displaced blob: two far-apart pixels whose union window exceeds the cap.
  const blobProf = tolerance.parse('channel:2,pixels:1e-5,bbox:4x4')
  const blob = variant(null, 1280, 800, [[0, 0, [70, 40, 60, 255]], [40, 0, [70, 40, 60, 255]]])
  const r2 = tolerance.compare(plate(1280, 800), blob, blobProf)
  assert.equal(r2.pass, false)
  assert.equal(r2.fail, 'bbox')
})

test('comparator: alpha and all-channel drift count (any channel, not just RGB)', () => {
  const prof = tolerance.parse('channel:4,pixels:1e-5,bbox:4x4')
  const alphaDrift = variant(null, 1280, 800, [[100, 200, [20, 40, 60, 200]]])
  const r = tolerance.compare(plate(1280, 800), alphaDrift, prof)
  assert.equal(r.measured.changed, 1, 'alpha 255 -> 200 exceeds the 4-cap, so the pixel changed')
})

// ---- the decoder's honesty ------------------------------------------------

test('decoder: opaque buffers return null - the caller reports unverified, never a guess', () => {
  assert.equal(tolerance.decodePng(Buffer.from('pngish')), null)
  assert.equal(tolerance.decodePng(Buffer.alloc(0)), null)
  // IHDR with a bit depth Chrome never captures (16-bit): refused by shape.
  const bad = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', Buffer.from([0, 0, 0, 1, 0, 0, 0, 1, 16, 6, 0, 0, 0])),
    pngChunk('IDAT', zlib.deflateSync(Buffer.alloc(16))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
  assert.equal(tolerance.decodePng(bad), null)
})

// ---- the row receipt shape under tolerance + gate's unchanged accounting ---

test('ledger: a tolerance row appends, round-trips, and carries the profile verbatim', () => {
  const dir = tmpdir()
  const file = path.join(dir, 'ledger.json')
  const profile = 'channel:4,pixels:1e-5,bbox:96x320'
  const row = ledgerMod.append(file, {
    type: 'ratify',
    agent: 't',
    commit: 'c',
    artifact: 'home/current.png',
    note: 'reproduced pixel-eq under tolerance',
    tolerance: profile,
    verified: true,
  })
  const loaded = ledgerMod.load(file)
  assert.equal(loaded.length, 1)
  assert.equal(loaded[0].tolerance, profile)
  assert.equal(row.id, loaded[0].id)
})

test('ledger: absent tolerance fields read strict - old copies stay readable', () => {
  const dir = tmpdir()
  const file = path.join(dir, 'ledger.json')
  ledgerMod.append(file, { type: 'adopt', agent: 't', commit: 'c', artifact: 'a.png', note: 'n' })
  const [row] = ledgerMod.load(file)
  assert.equal(row.tolerance, undefined)
})

test('ledger: a control character in the tolerance field is refused like every row string', () => {
  const file = path.join(tmpdir(), 'ledger.json')
  assert.throws(
    () => ledgerMod.append(file, { type: 'ratify', agent: 't', commit: 'c', artifact: 'a.png', note: 'n', tolerance: 'channel:4,\u0007pixels:1e-5' }),
    (e) => e.code === 'UNSAFE_TEXT'
  )
})

test('gate: accounting is unchanged - a tolerance-bearing row still explains its artifact (exit 0)', () => {
  const dir = tmpdir()
  manifest.write(dir, {}, { browserImage: 't:1', renderer: 'resvg@2' })
  const eyesHome = path.join(dir, 'labs', '.eyes')
  fs.mkdirSync(path.join(eyesHome, 'home'), { recursive: true })
  fs.writeFileSync(path.join(eyesHome, 'home', 'current.png'), Buffer.from('pngish'))
  const file = ledgerMod.ledgerPath(dir, {})
  ledgerMod.append(file, {
    type: 'adopt',
    agent: 't',
    commit: 'c',
    artifact: 'home/current.png',
    note: 'the baseline',
    tolerance: 'channel:4,pixels:1e-5,bbox:96x320',
    ratified: false,
  })
  const out = []
  const ctx = { cwd: dir, argv: [] }
  const origWrite = process.stdout.write.bind(process.stdout)
  process.stdout.write = (chunk) => { out.push(String(chunk)); return true }
  let r
  try {
    r = gate.run(ctx)
  } finally {
    process.stdout.write = origWrite
  }
  assert.equal(r, 0, `gate must stay exit 0 over a tolerance-bearing row (out: ${out.join('')})`)
})
