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
//
// The same resolution + server pair is exported (resolveServe, openServe)
// for the capture verbs that stand up their own tree (ratify/walk --serve):
// a consumer CI that hand-rolls `http-server dist & sleep 3` re-invents
// the readiness race this module already solved (server.listen resolves
// the promise - there is no sleep to tune). One resolution, one server,
// every caller.

'use strict'

const fs = require('fs')
const path = require('path')
const { flagValue } = require('./flags')
const { createServer } = require('./serve-dist')
const { fail } = require('./reasons')

/**
 * Resolve a directory argument to the served root + its _headers file,
 * with the same defaults the verb has always used: a bare `serve` reads
 * `web/dist` when it exists, and a missing --headers falls back to the
 * baked tree's sibling `public/_headers`. Named refusals only
 * (MISSING_INPUT), never a guessed path.
 */
function resolveServe({ cwd, dir, headers }) {
  const chosen = dir || (fs.existsSync(path.join(cwd, 'web', 'dist')) ? 'web/dist' : null)
  if (!chosen) {
    fail('MISSING_INPUT', 'serve needs a directory to serve (a baked web/dist reads as the default)')
  }
  const root = path.resolve(cwd, chosen)
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    fail('MISSING_INPUT', `serve: ${chosen} is not a directory I can serve`)
  }
  let headersFile = headers || null
  if (!headersFile) {
    const sibling = path.join(root, '..', 'public', '_headers')
    if (fs.existsSync(sibling)) headersFile = sibling
  }
  if (headersFile && !fs.existsSync(headersFile)) {
    fail('MISSING_INPUT', `serve: headers file does not exist: ${headersFile}`)
  }
  return { root, headersFile }
}

/**
 * Stand up a baked tree and resolve once the socket is LISTENING - the
 * readiness promise lib/serve-dist.createServer already returns. The
 * caller owns close(). This is the seam a consumer's `sleep 3` fakes.
 */
function openServe({ cwd, dir, headers, port }) {
  const { root, headersFile } = resolveServe({ cwd, dir, headers })
  return createServer({ root, headersFile, port }).then((start) => ({
    port: start.port,
    close: start.close,
    root,
    headersFile,
  }))
}

/**
 * The capture-surface resolution for the manifest-wide verbs (ratify/walk):
 * either the caller states a <base-url>, or --serve DIR stands up a baked
 * tree and hands back its loopback URL - the readiness promise, never a
 * sleep. Stating both refuses (one surface per run). Returns
 * { url, close }; close is a resolved no-op when the caller supplied the
 * URL, so the verb closes unconditionally in a finally.
 */
function captureSurface({ cwd, argv, verb, urlRe }) {
  const serveDir = flagValue(argv, '--serve')
  const urlArg = argv.find((a) => urlRe.test(a))
  if (serveDir && urlArg) {
    fail('BAD_FLAG_VALUE', `${verb} takes either a <base-url> or --serve DIR, not both - one capture surface per run`)
  }
  if (!serveDir && !urlArg) {
    fail('UNKNOWN_COMMAND', `${verb} needs a <base-url> serving the pinned surface (or --serve DIR to stand one up)`)
  }
  if (!serveDir) return Promise.resolve({ url: urlArg, close: () => Promise.resolve() })
  const headers = flagValue(argv, '--headers')
  return openServe({ cwd, dir: serveDir, headers, port: 0 }).then((s) => ({
    url: `http://127.0.0.1:${s.port}/`,
    close: () => s.close(),
  }))
}

async function run(ctx) {
  const pos = ctx.argv.filter((a) => !a.startsWith('--') && a !== flagValue(ctx.argv, '--port') && a !== flagValue(ctx.argv, '--headers'))
  const dirArg = pos[0]
  const headersArg = flagValue(ctx.argv, '--headers')
  const portArg = flagValue(ctx.argv, '--port')
  let port = 0
  if (portArg != null) {
    port = Number(portArg)
    if (!Number.isInteger(port) || port < 0 || port > 65535) {
      fail('BAD_FLAG_VALUE', `--port is not a port number: ${portArg}`)
    }
  }

  // createServer returns a PROMISE that resolves on 'listening'; the verb
  // must await it before reading the port or holding close (the pre-1.1.2
  // shape read `.port`/`.close` off the pending promise - the banner said
  // `http://127.0.0.1:undefined` and Ctrl-C threw `start.close is not a
  // function`). openServe carries the await; the verb just consumes it.
  const start = await openServe({ cwd: ctx.cwd, dir: dirArg, headers: headersArg, port })
  const servedHeaders = start.headersFile ? path.relative(ctx.cwd, start.headersFile) : '(none)'
  const view = {
    serving: `http://127.0.0.1:${start.port}`,
    root: path.relative(ctx.cwd, start.root),
    headers: servedHeaders,
    note: 'the instance primitive - point a real browser at this URL and read your own build; Ctrl-C to stop',
  }
  return new Promise((resolvePromise) => {
    // A repeat signal is a no-op: the first shutdown closes the server and
    // resolves 0. The timer is the belt-and-suspenders so a close that hangs
    // still ends the process cleanly.
    let done = false
    const shutdown = () => {
      if (done) return
      done = true
      start.close().then(() => resolvePromise(0))
      setTimeout(() => resolvePromise(0), 500).unref()
    }
    // ARMED BEFORE the banner write. The banner is the ONLY way a caller
    // learns the port, so a consumer that signals on reading it must find
    // the handler already in place. Arming after the write leaves a window
    // where the signal lands on the OS default disposition and the process
    // dies with a non-zero code instead of a clean exit 0 (measured: 59/60
    // banner-triggered SIGINTs killed the process before this reorder). The
    // node18 floor loses that race far more often than a dev box, which is
    // what flaked the prepublishOnly gate and blocked a real publish.
    process.on('SIGINT', shutdown)
    process.on('SIGTERM', shutdown)

    if (ctx.json) process.stdout.write(JSON.stringify(view, null, 2) + '\n')
    else {
      process.stdout.write(
        `serving: ${view.serving} (root=${view.root}, headers=${servedHeaders})\n` +
        'the instance primitive: point a real browser at the URL above and read your own build. Ctrl-C stops.\n')
    }
  })
}

module.exports = { run, resolveServe, openServe, captureSurface }
