// eyestruct walk - every route x viewport x theme in the manifest, one pass.
// Walk reuses the look capture per route; a base URL join is required unless
// each manifest path is already absolute. Proof images, not prose claims.
// Candidates land in labs/.eyes-candidates/ (disposable, session-burned);
// baselines stay adopt's job.

'use strict'

const fs = require('fs')
const path = require('path')
const manifest = require('./manifest')
const { fail } = require('./reasons')

// The candidate-name rule, exported: the ratify lane's drift-bootstrap
// copies these files into slots WITHOUT retyping the slug expression here
// (a lane that re-derives engine naming is doc drift by another name).
// The slot-name substance (the khf-wp contract, eyestruct#12): the path
// slug is the DEFAULT naming, and a manifest route row may override it
// with `slot:` - so a canon whose slots are named for the page (`home`)
// and a pipeline whose candidates name the path (`root`) never need a
// manual rename step between them. The parser carries the field through
// (unknown key: value rides the row untouched); this function is the
// ONLY reader, so the override is one truth, stated once.
function candidateName(route) {
  const slug = route.slot || (route.path === '/' ? 'root' : route.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, ''))
  return `walk__${slug}_${route.view}_${route.theme}.png`
}

function run(ctx) {
  const m = manifest.read(ctx.cwd, ctx)
  if (!m.routes.length) fail('WALK_EMPTY')
  let engine
  try {
    engine = require('./engine')
  } catch {
    fail('MISSING_PINNED_BROWSER')
  }
  const base = ctx.argv.find((a) => /^(https?:\/\/)/.test(a))
  if (!base) fail('UNKNOWN_COMMAND', 'walk needs an http(s) <base-url>')

  const results = []
  const candDir = path.join(ctx.cwd, 'labs/.eyes-candidates')
  fs.mkdirSync(candDir, { recursive: true })
  let idx = 0
  const next = () => {
    if (idx >= m.routes.length) return Promise.resolve(results)
    const route = m.routes[idx++]
    const join = (p) => (base.endsWith('/') ? base.slice(0, -1) : base) + p
    return engine
      .capture({
        url: join(route.path),
        argv: ctx.argv,
        pin: m.pin,
        viewport: route.viewport,
        theme: route.theme,
      })
      .then((cap) => {
        const file = path.join('labs/.eyes-candidates', candidateName(route))
        fs.writeFileSync(path.join(ctx.cwd, file), cap.png)
        results.push({ route, file, bytes: cap.png.length, mapped: cap.map.length })
      })
      .then(next)
  }
  return next().then((rows) => {
    if (ctx.json) process.stdout.write(JSON.stringify({ walked: rows.length, rows }, null, 2) + '\n')
    else {
      for (const r of rows) {
        process.stdout.write(`walk: ${r.route.path} ${r.route.view} ${r.route.theme} -> ${r.file} (${r.bytes}B, ${r.mapped} element(s))\n`)
      }
      process.stdout.write(`walk: ${rows.length} capture(s) in labs/.eyes-candidates/\n`)
    }
    return 0
  })
}

module.exports = { run, candidateName }
