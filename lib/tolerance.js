// eyestruct tolerance - the pixel-tolerance lane (R-C2, eyestruct#11).
// khf-wp's measured receipts (dhaupin/khf-wp#1, the T-T7/T-T9 intake) are the
// numbers this module exists to consume: Chrome's CDP paint is not
// byte-stable over photographic textures, so a slot whose manifest row
// carries a tolerance profile is compared at the PIXEL level under named
// bounds instead of at the byte level - the canon cut stays ledger
// accounting at `gate`, and the pledge class is receipted in every row the
// tolerant compare touches (T-T2/T-T3, labs/prd-eyes.md).
//
// THE THREE RULES, NAMED ONCE (T-T2):
//
// 1. A pixel is CHANGED when any channel's absolute delta EXCEEDS the
//    profile's `channel` bound (0-255). Deltas at or under the cap are not
//    a change - the profile's cap IS the strictness.
// 2. The slot PASSES when the changed-pixel fraction of the whole plate is
//    <= the profile's `pixels` bound (0-1, e.g. 1e-5), AND the changed
//    set's bbox span fits the profile's `bbox` box.
// 3. The bbox box is ORIENTATION-FREE to match the receipts as measured:
//    the profile names two dims (khf-wp: 96x320, 4x4, 16x1216, 168x340),
//    and the PASSING rule is pairwise-sorted - the span's two extents
//    (sorted small/large) must each fit the profile's dims (sorted
//    small/large). A full-width text band fits a `16x1216` cap the same
//    way a tall thin band does; a dislodged wide mover like khf-wp's
//    venue-rental cover crop (span 174x564) exceeds every quoted cap.
//    A moved-edge drifter the size of the cap is tolerance-correct; a
//    displaced blob is not - the union window it stretches is exactly
//    what the bbox cap bounds.
//
// THE GRAMMAR (T-T1, all-or-nothing): a route row's `tolerance:` value is
// either `strict` (default when absent) or ONE token naming all three
// bounds:
//
//   tolerance: strict
//   tolerance: channel:4,pixels:1e-5,bbox:96x320
//
// Anything else - an unknown token, an out-of-range bound, a profile
// naming some bounds and not others - refuses MANIFEST_CORRUPT at the
// manifest read (the existing jail; no new reason code, T-T4's
// counted-change ruling is deliberately zero). Spaces are not allowed
// inside the profile: the route tokenizer reads one token per key, so a
// spaced profile leaks its fragments as phantom keys and the manifest
// jail refuses that shape by name too.
//
// This module is PURE: no fs, no browser, no ledger. ratify and diff call
// it with two PNG buffers; the battery (tests/tolerance.test.js) pins it
// on synthetic plates at the exact bound edges - never the CDP flake
// itself (T-T6).

'use strict'

const zlib = require('node:zlib')
const { fail } = require('./reasons')

// ---- the parser (the jail the manifest read rides) ------------------------

const PROFILE_RE = /^channel:(\d+),pixels:(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?),bbox:(\d+)x(\d+)$/i

/**
 * Parse a route row's `tolerance:` value. `strict` (or absent - the caller
 * checks) is the shipped byte-equality behavior, stated rather than
 * assumed; a profile must name all three bounds in one token.
 * Refuses MANIFEST_CORRUPT by name on any shape violation.
 */
function parse(value) {
  if (value === undefined || value === null || value === '') {
    return { mode: 'strict' }
  }
  if (typeof value !== 'string') {
    fail('MANIFEST_CORRUPT', `tolerance must be a string (strict | channel:<0-255>,pixels:<0-1>,bbox:<WxH>)`)
  }
  const v = value.trim()
  if (v === 'strict') return { mode: 'strict' }
  const m = PROFILE_RE.exec(v)
  if (!m) {
    fail(
      'MANIFEST_CORRUPT',
      `tolerance must be "strict" or "channel:<0-255>,pixels:<0-1>,bbox:<WxH>" as ONE token (no spaces) -> "${v}"`
    )
  }
  const channel = Number(m[1])
  const pixels = Number(m[2])
  const bw = Number(m[3])
  const bh = Number(m[4])
  if (!(channel >= 0 && channel <= 255)) {
    fail('MANIFEST_CORRUPT', `tolerance channel bound must be an integer 0-255 -> "${v}"`)
  }
  if (!(pixels > 0 && pixels <= 1)) {
    fail('MANIFEST_CORRUPT', `tolerance pixels bound must be >0 and <=1 (a fraction, e.g. 1e-5) -> "${v}"`)
  }
  if (!(bw >= 1) || !(bh >= 1)) {
    fail('MANIFEST_CORRUPT', `tolerance bbox dims must be integers >= 1 -> "${v}"`)
  }
  return { mode: 'profile', channel, pixels, bw, bh }
}

/** The route-row reader: absent or "strict" is strict, else the profile. */
function profileOf(route) {
  return route && route.tolerance ? parse(route.tolerance) : { mode: 'strict' }
}

// ---- the decoder (RGBA8 PNG, interlace 0; anything else is opaque) --------

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}

/**
 * Decode one PNG buffer into RGBA rows. Chrome's captures (the only plates
 * this lane ever compares) are 8-bit, non-interlaced, color type 2 or 6 -
 * anything else returns null and the caller reports the bytes unverified
 * rather than guessing past them (the never-a-guessed-parse law).
 */
function decodePng(buf) {
  try {
    if (!buf || !Buffer.isBuffer(buf) || buf.length < 45 || !buf.subarray(0, 8).equals(SIGNATURE)) return null
    let off = 8
    let w = 0
    let h = 0
    let bitDepth = 0
    let colorType = 0
    const idat = []
    while (off + 12 <= buf.length) {
      const len = buf.readUInt32BE(off)
      if (len < 0 || off + 12 + len > buf.length) return null
      const type = buf.toString('latin1', off + 4, off + 8)
      const data = buf.subarray(off + 8, off + 8 + len)
      if (type === 'IHDR') {
        w = data.readUInt32BE(0)
        h = data.readUInt32BE(4)
        bitDepth = data[8]
        colorType = data[9]
        if (data[10] !== 0 || data[11] !== 0 || data[12] !== 0) return null
      } else if (type === 'IDAT') {
        idat.push(data)
      } else if (type === 'IEND') {
        break
      }
      off += 12 + len
    }
    if (!w || !h || !idat.length) return null
    if (bitDepth !== 8) return null
    if (colorType !== 2 && colorType !== 6) return null
    const stride = w * (colorType === 6 ? 4 : 3)
    const raw = zlib.inflateSync(Buffer.concat(idat))
    if (raw.length < (stride + 1) * h) return null
    const out = Buffer.alloc(w * h * 4)
    const prev = Buffer.alloc(stride)
    for (let y = 0; y < h; y++) {
      const rowAt = y * (stride + 1)
      const f = raw[rowAt]
      if (f > 4) return null
      const cur = Buffer.from(raw.subarray(rowAt + 1, rowAt + 1 + stride))
      for (let x = 0; x < stride; x++) {
        const left = x >= (colorType === 6 ? 4 : 3) ? cur[x - (colorType === 6 ? 4 : 3)] : 0
        const up = prev[x]
        const ul = x >= (colorType === 6 ? 4 : 3) ? prev[x - (colorType === 6 ? 4 : 3)] : 0
        if (f === 1) cur[x] = (cur[x] + left) & 0xff
        else if (f === 2) cur[x] = (cur[x] + up) & 0xff
        else if (f === 3) cur[x] = (cur[x] + ((left + up) >> 1)) & 0xff
        else if (f === 4) cur[x] = (cur[x] + paeth(left, up, ul)) & 0xff
      }
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4
        const i = x * (colorType === 6 ? 4 : 3)
        out[o] = cur[i]
        out[o + 1] = cur[i + 1]
        out[o + 2] = cur[i + 2]
        out[o + 3] = colorType === 6 ? cur[i + 3] : 255
      }
      copyInto(prev, cur)
    }
    return { w, h, data: out }
  } catch {
    return null
  }
}

function copyInto(dst, src) {
  for (let i = 0; i < src.length; i++) dst[i] = src[i]
}

// ---- the comparator -------------------------------------------------------

/**
 * Compare two PNG buffers under a parsed profile (parse()'s profile shape).
 *
 * Returns, in order of honesty:
 *   null                      - either side is not an RGBA8-parsable PNG or
 *                               the plates differ in size: the caller
 *                               reports the slot unverified (byte shapes
 *                               say their own verdict; a profile never
 *                               guesses past an opaque buffer)
 *   { pass: true,  measured } - inside the named bounds
 *   { pass: false, measured, fail: 'fraction' | 'bbox' }
 *                               - OUT of profile; the measured numbers ride
 *                               the caller's refusal text (T-T4)
 *
 * measured: { maxDelta, changed, fraction, bw, bh } - the compare's own
 * numbers, and the ONLY numbers a tolerance row's note or a refusal may
 * quote about the capture pair.
 */
function compare(oldBuf, freshBuf, prof) {
  const a = decodePng(oldBuf)
  const b = decodePng(freshBuf)
  if (!a || !b || a.w !== b.w || a.h !== b.h) return null
  const n = a.w * a.h
  let changed = 0
  let maxDelta = 0
  let minX = 0
  let maxX = -1
  let minY = 0
  let maxY = -1
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    let d = 0
    for (let c = 0; c < 4; c++) {
      let v = a.data[i + c] - b.data[i + c]
      if (v < 0) v = -v
      if (v > d) d = v
    }
    if (d > prof.channel) {
      changed++
      if (d > maxDelta) maxDelta = d
      const x = j % a.w
      const y = (j - x) / a.w
      if (maxX < 0) {
        minX = maxX = x
        minY = maxY = y
      } else {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  const measured = changed === 0
    ? { maxDelta: 0, changed: 0, fraction: 0, bw: 0, bh: 0 }
    : {
        maxDelta,
        changed,
        fraction: changed / n,
        bw: maxX - minX + 1,
        bh: maxY - minY + 1,
      }
  if (changed === 0) return { pass: true, measured }
  // The fraction bound, then the bbox bound: the span's sorted extents must
  // each fit the profile's sorted dims (rule 3 above - orientation-free).
  if (measured.fraction > prof.pixels) return { pass: false, measured, fail: 'fraction' }
  const span = [measured.bw, measured.bh].sort((x, y) => x - y)
  const cap = [prof.bw, prof.bh].sort((x, y) => x - y)
  if (span[0] > cap[0] || span[1] > cap[1]) return { pass: false, measured, fail: 'bbox' }
  return { pass: true, measured }
}

module.exports = { parse, profileOf, decodePng, compare }
