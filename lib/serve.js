// eyestruct serve - the instance primitive. Serves a baked tree over HTTP
// with the committed _headers rules applied host-shaped (exact paths,
// `*` prefixes, the miss path INCLUDED per the family status dialect's
// CORS clause) - so a coding agent can point a real browser at its own
// build output and read the pages it ships.
//
// Process ownership: like `mcp`, this verb OWNS the process until killed
// (Ctrl-C / SIGINT / SIGTERM). Exit contract: the refusal paths are named
// (MISSING_INPUT for a directory that does not exist, BAD_FLAG_VALUE for
// a --port that is not a number); a clean shutdown exits 0.
//
// The one implementation of "what the host serves" is lib/serve-dist.js -
// shared with the battery's served-contract leg and the chromium lane.
// serve rides the same code, so `eyestruct serve` and the CI lanes can
// never disagree about headers or route resolution.

'use strict'

const fs = require('fs')
const path = require('path')
const { createServer } = require('./serve-dist')
const { fail } = require('./reasons')

function run(ctx) {
  const pos = ctx.argv.filter((a) => !a.startsWith('--') && a !== flagValue(ctx.argv, '--port') && a !== flagValue(ctx.argv, '--headers'))
  const dirArg = pos[0]
  const dir = dirArg || (fs.existsSync(path.join(ctx.cwd, 'web', 'dist')) ? 'web/dist' : null)
  if (!dir) {
    fail('MISSING_INPUT', 'serve needs a directory to serve (a baked web/dist reads as the default)')
  }
  const root = path.resolve(ctx.cwd, dir)
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    fail('MISSING_INPUT', `serve: ${dir} is not a directory I can serve`)
  }
  let headersFile = flagValue(ctx.argv, '--headers')
  if (!headersFile) {
    const sibling = path.join(root, '..', 'public', '_headers')
    if (fs.existsSync(sibling)) headersFile = sibling
  }
  if (headersFile && !fs.existsSync(headersFile)) {
    fail('MISSING_INPUT', `serve: headers file does not exist: ${headersFile}`)
  }
  const portArg = flagValue(ctx.argv, '--port')
  let port = 0
  if (portArg != null) {
    port = Number(portArg)
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      fail('BAD_FLAG_VALUE', `--port is not a port number: ${portArg}`)
    }
  }

  const start = createServer({ root, headersFile: headersFile || null, port })
  const servedHeaders = headersFile ? path.relative(ctx.cwd, headersFile) : '(none)'
  const view = {
    serving: `http://127.0.0.1:${start.port}`,
    root: path.relative(ctx.cwd, root),
    headers: servedHeaders,
    note: 'the instance primitive - point a real browser at this URL and read your own build; Ctrl-C to stop',
  }
  if (ctx.json) process.stdout.write(JSON.stringify(view, null, 2) + '\n')
  else {
    process.stdout.write(
      `serving: ${view.serving} (root=${view.root}, headers=${servedHeaders})\n` +
      'the instance primitive: point a real browser at the URL above and read your own build. Ctrl-C stops.\n')
  }

  return new Promise((resolvePromise) => {
    let done = false
    const shutdown = () => {
      if (done) return
      done = true
      start.close().then(() => resolvePromise(0))
      setTimeout(() => resolvePromise(0), 500).unref()
    }
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)
    // The retry-safe close: double SIGINT must not crash the runner.
    process.on('SIGINT', () => start.close().catch(() => {}))
  })
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag)
  return i === -1 ? null : argv[i + 1]
}

module.exports = { run }
