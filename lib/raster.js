// eyestruct raster - the raster gate. Strict parse + render + byte-size
// sanity for every artifact committed as visual evidence. If no renderer is
// available the gate refuses honestly (MISSING_RENDER, exit 2) - it NEVER
// fake-passes, because "loads" and "renders" are separate assertions and
// only the second is sight (the unrenderable-stone receipt).

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

function isFlagValue(argv, a) {
  const i = argv.indexOf(a)
  return i > 0 && argv[i - 1].startsWith('--') && !argv[i - 1].includes('=')
}

module.exports = { run }
