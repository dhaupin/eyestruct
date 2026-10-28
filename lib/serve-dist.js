// lib/serve-dist.js - a zero-dependency static server for the web build,
// shared by TWO consumers so "what the host serves" has exactly one
// implementation:
//
//   tests/dist-server.test.js  (the battery's served-contract leg)
//   scripts/check-browser.mjs  (the opt-in chromium spot check)
//
// It applies the committed web/public/_headers rules the way a real host
// applies them - exact-path entries, `*` wildcard prefixes (e.g.
// `/assets/*`), the miss path INCLUDED (so a request for /status.json that
// does not exist still carries the rule's headers, per the family status
// dialect's CORS clause). Files only from inside the served root; a
// resolved path that escapes the root refuses as a plain 404.

'use strict'

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

// web/public/_headers grammar, host-shaped: blocks separated by blank
// lines; the first line is a path (exact, or ending in `/*` for a prefix
// rule); the rest are indented `Key: value` header lines.
function parseHeadersFile(text) {
  const rules = []
  let current = null
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) {
      current = null
      continue
    }
    if (line.startsWith('#')) continue
    if (rawLine.startsWith(' ') || rawLine.startsWith('\t')) {
      if (!current) continue
      const i = line.indexOf(':')
      if (i > 0) current.headers[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim()
    } else {
      current = { path: line, headers: {} }
      rules.push(current)
    }
  }
  return rules
}

function headersFor(rules, pathname) {
  const out = {}
  for (const rule of rules) {
    const hit = rule.path.endsWith('/*')
      ? pathname.startsWith(rule.path.slice(0, -1))
      : rule.path === pathname
    if (hit) Object.assign(out, rule.headers)
  }
  return out
}

function contentTypeFor(file) {
  const ext = path.extname(file).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json') return 'application/json'
  if (ext === '.svg') return 'image/svg+xml'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  if (ext === '.ico') return 'image/x-icon'
  if (ext === '.txt') return 'text/plain; charset=utf-8'
  if (ext === '.webmanifest') return 'application/manifest+json'
  return 'application/octet-stream'
}

/**
 * createServer({ root, headersFile }) -> { port, close() }
 * Serves the dist tree over HTTP (ephemeral port) with the committed
 * _headers rules applied. Directory-style routes (`/status` -> the
 * prerendered `status.html`) resolve the way the hosted form does.
 */
function createServer({ root, headersFile, port: listenPort }) {
  const resolvedRoot = path.resolve(root)
  const rules = headersFile
    ? parseHeadersFile(fs.readFileSync(headersFile, 'utf8'))
    : []
  return new Promise((resolvePromise, rejectPromise) => {
    const server = http.createServer((req, res) => {
      let pathname
      try {
        pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      } catch {
        pathname = ''
      }
      const ruleHeaders = headersFor(rules, pathname)
      const servedFor = rules.some(
        (r) => (r.path.endsWith('/*') && pathname.startsWith(r.path.slice(0, -1))) || r.path === pathname
      )
      // Miss-path header honesty: a rule that matched the REQUESTED path
      // applies even when the file turns out missing (the CORS clause).
      const missHeaders = !servedFor ? {} : ruleHeaders

      let file = path.resolve(resolvedRoot, '.' + pathname)
      if (file !== resolvedRoot && !file.startsWith(resolvedRoot + path.sep)) {
        res.writeHead(404, { 'Content-Type': 'text/plain', ...missHeaders })
        res.end('not found')
        return
      }
      let candidates = [file]
      if (file === resolvedRoot) candidates.push(path.join(resolvedRoot, 'index.html'))
      if (!path.extname(file)) candidates.push(file + '.html', path.join(file, 'index.html'))
      // The containment contract covers WHAT the path resolves to, not just
      // where it sits: lstatSync (NOT statSync) so a symlink inside the root
      // that points at an arbitrary host file is refused - a committed
      // untrusted tree must not turn the loopback server into a file reader.
      file = candidates.find((c) => { try { return fs.lstatSync(c).isFile() } catch { return false } })
      if (!file) {
        res.writeHead(404, { 'Content-Type': 'text/plain', ...missHeaders })
        res.end('not found')
        return
      }
      // Read-time lstat too: between the candidate scan and the fetch the
      // entry could be swapped for a symlink - refuse the swap, never
      // follow it out of the root.
      let lstat = null
      try { lstat = fs.lstatSync(file) } catch {}
      if (!lstat || !lstat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain', ...missHeaders })
        res.end('not found')
        return
      }
      const body = fs.readFileSync(file)
      res.writeHead(200, {
        'Content-Type': contentTypeFor(file),
        'Content-Length': body.length,
        ...ruleHeaders,
      })
      res.end(req.method === 'HEAD' ? undefined : body)
    })
    server.on('error', rejectPromise)
    server.listen(listenPort || 0, '127.0.0.1', () => resolvePromise({ port: server.address().port, close: () => new Promise((r) => server.close(r)) }))
  })
}

module.exports = { parseHeadersFile, headersFor, createServer }
