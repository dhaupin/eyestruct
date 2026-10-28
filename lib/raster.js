// eyestruct raster - the raster gate. Strict parse + render + byte-size
// sanity for every artifact committed as visual evidence. If no renderer is
// available the gate refuses honestly (MISSING_RENDER, exit 2) - it NEVER
// fake-passes, because "loads" and "renders" are separate assertions and
// only the second is sight (the unrenderable-stone receipt).
//
// The canvas cap (RASTER_CANVAS, joined 2026-11-01): an SVG can DECLARE an
// enormous render canvas (width="200000"), and a renderer handed those
// bytes allocates before it can complain - a committed bomb rides CI
// (the raster:icon leg renders committed SVGs on every push). The declared
// size is refused BY NAME before the renderer ever loads.

'use strict'

const fs = require('fs')
const { fail } = require('./reasons')

function run(ctx) {
  const files = ctx.argv.filter((a) => !a.startsWith('--') && !isFlagValue(ctx.argv, a))
  if (!files.length) fail('UNKNOWN_COMMAND', 'raster needs at least one file')

  // Input truth FIRST: a stated input that cannot be read is a named
  // refusal no matter what renderer the machine has (the first publish
  // attempt ran the battery on a renderer-less Termux and \"MISSING_RENDER\"
  // used to answer for missing/directory inputs too - input refusals were
  // machine-dependent, which every hostile-input leg and the pack verdict
  // ledger need never be). Renderer capability is judged AFTER the inputs
  // are known-readable; a valid input with no renderer still refuses
  // MISSING_RENDER exactly as before.
  const sources = []
  for (const file of files) {
    let svg
    try {
      svg = fs.readFileSync(file, 'utf8')
    } catch (err) {
      // A stated input that cannot be read is a named capability refusal,
      // never the generic internal-error fallback - the same shape
      // LEDGER_MISSING makes for the stated --ledger path.
      fail('MISSING_INPUT', `${file} (${err && err.code ? err.code : String(err)})`)
    }
    sources.push({ file, svg })
  }

  // The canvas cap rides the INPUT stage: a declared bomb refuses by name
  // before the renderer module even loads, on every machine (a renderer-less
  // box owes the same verdict - named refusals are never machine-dependent,
  // the MISSING_RENDER receipt). viewBox-only declarations bound through
  // their span; the dims array carries the provenance tag for the message.
  for (const { file, svg } of sources) {
    const size = declaredCanvasPx(svg)
    if (size && !canvasWithinCap(size)) refuseGiantCanvas(file, size)
  }

  let Renderer
  try {
    ;({ Resvg: Renderer } = require('@resvg/resvg-js'))
  } catch {
    fail('MISSING_RENDER')
  }

  const results = []
  for (const { file, svg } of sources) {
    let png
    try {
      png = new Renderer(svg, {}).render().asPng()
    } catch (err) {
      fail('RASTER_BAD_XML', `${file}: ${err.message}`)
    }
    if (png.length < 512) fail('RASTER_TRIVIAL', `${file}: rendered ${png.length} bytes`)
    results.push({ file, opaque: png.length })
  }
  if (ctx.json) process.stdout.write(JSON.stringify({ ok: true, results }, null, 2) + '\n')
  else for (const r of results) process.stdout.write(`raster OK  ${r.file}  (${r.opaque} bytes opaque)\n`)
  return 0
}

// Canvas-declaration parsing, honest about what it can bound: bare numbers
// and the ressvg-convertible units are px-converted; percentages declare a
// size relative to a viewport raster does not have, so they stay out of the
// cap's knowledge (resvg bounds them to its own defaults, not to a declared
// bomb). viewBox governs when width/height are absent.
const UNITS = { px: 1, pt: 96 / 72, pc: 16, in: 96, mm: 96 / 25.4, cm: 96 / 2.54, em: 16, ex: 8, rem: 16 }

function declaredCanvasPx(svg) {
  const root = svg.match(/<svg\b[^>]*>/)
  if (!root) return null
  const attr = (name) => {
    const m = root[0].match(new RegExp(`${name}\\s*=\\s*"([^"<>"]+)"`, 'i'))
    return m ? m[1].trim() : null
  }
  const toPx = (raw) => {
    const m = String(raw).match(/^\s*(-?\d+(?:\.\d+)?)\s*([a-z%]*)\s*$/i)
    if (!m || Number(m[1]) < 0) return null
    const unit = (m[2] || 'px').toLowerCase()
    const scale = UNITS[unit]
    return scale == null ? null : Number(m[1]) * scale
  }
  let w = attr('width'), h = attr('height')
  if (w != null || h != null) {
    w = (w != null && toPx(w)) || null
    h = (h != null && toPx(h)) || null
    if (w || h) return { dims: [w, h].filter((v) => v != null) }
  }
  const vb = attr('viewBox')
  if (!vb) return null
  const parts = vb.trim().split(/[\s,]+/).map(Number)
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0)) return null
  return { dims: [parts[2], parts[3], 'viewBox'] }
}

const MAX_DIMENSION_PX = 12000
const MAX_AREA_PX = 3.2e7 // 4-byte RGBA ceiling: ~126 MB of canvas

function refuseGiantCanvas(file, size, capExtra) {
  const dims = size.dims.map((v) => (typeof v === 'number' ? Math.round(v).toLocaleString('en-US') : v)).join(' x ')
  fail('RASTER_CANVAS', `${capExtra || ''}${file} declares a canvas of ${dims} px - the raster cap is ${MAX_DIMENSION_PX.toLocaleString('en-US')} px per dimension and ${(MAX_AREA_PX / 1e6).toFixed(1)}M px area`)
}

function canvasWithinCap(size) {
  const dims = size.dims.filter((v) => typeof v === 'number')
  if (dims.some((v) => v > MAX_DIMENSION_PX)) return false
  if (dims.length >= 2 && dims[0] * dims[1] > MAX_AREA_PX) return false
  return true
}

function isFlagValue(argv, a) {
  const i = argv.indexOf(a)
  return i > 0 && argv[i - 1].startsWith('--') && !argv[i - 1].includes('=')
}

module.exports = { run }
