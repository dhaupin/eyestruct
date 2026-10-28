'use strict'

// The serve-dist HTTP-shape leg (commissioned from the 2026-10-28 walk
// round: the manual probes earned named verdicts - traversal 404s, HEAD
// sanity, candidate resolution, wildcard prefix rules, miss-path header
// honesty - and the promotion rule says a walk's probes become permanent,
// or the next walk just re-finds the same bug). Behavior-only, tmp roots,
// loopback-only: no web/dist dependency, so this leg always runs, even on
// the battery's no-build CI walkers where tests/dist-server.test.js
// honest-skips.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const os = require('node:os')
const path = require('node:path')

const { createServer, parseHeadersFile, headersFor } = require('../lib/serve-dist')

function get(port, pathname, method) {
  return new Promise((resolvePromise, rejectPromise) => {
    const req = http.request(
      { host: '127.0.0.1', port, path: pathname, method: method || 'GET' },
      (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => resolvePromise({ status: res.statusCode, headers: res.headers, body }))
      }
    )
    req.on('error', rejectPromise)
    req.end()
  })
}

function tmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'serve-dist-'))
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>home</h1>')
  fs.writeFileSync(path.join(root, 'status.html'), '<h1>status</h1>')
  fs.mkdirSync(path.join(root, 'assets', 'nested'), { recursive: true })
  fs.writeFileSync(path.join(root, 'assets', 'nested', 'a.js'), 'console.log(1)')
  fs.writeFileSync(path.join(root, 'secret.txt'), 'outside only')
  return root
}

function headersFile(root, rulesText) {
  const file = path.join(root, '_headers')
  fs.writeFileSync(file, rulesText)
  return file
}

test('parseHeadersFile: the web/public grammar (block, path line, indented headers)', () => {
  const rules = parseHeadersFile(
    [
      '/status.json',
      '  Access-Control-Allow-Origin: *',
      '  Cache-Control: no-store',
      '',
      '/assets/*',
      '  cache-control: public, max-age=31536000',
    ].join('\n')
  )
  assert.equal(rules.length, 2)
  assert.deepEqual(rules[0].headers, { 'access-control-allow-origin': '*', 'cache-control': 'no-store' })
  // headersFor: an exact path matches only itself; the wildcard matches
  // the prefix WITH the slash (never a sibling like /assetish).
  assert.equal(headersFor(rules, '/status.json')['cache-control'], 'no-store')
  assert.equal(headersFor(rules, '/nope/jsin')['cache-control'], undefined)
  assert.equal(headersFor(rules, '/assets/nested/a.js')['cache-control'], 'public, max-age=31536000')
  assert.equal(headersFor(rules, '/assetsh/a.js')['cache-control'], undefined)
})

test('served shapes: a known file answers 200 with a derived content type', async () => {
  const root = tmpRoot()
  const server = await createServer({ root })
  try {
    const res = await get(server.port, '/status.html')
    assert.equal(res.status, 200)
    assert.match(res.headers['content-type'], /^text\/html/)
  } finally {
    await server.close()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('served shapes: directory routes resolve through the same candidates the host uses', async () => {
  const root = tmpRoot()
  const server = await createServer({ root })
  try {
    // /status -> status.html (extensionless fallback)
    const res = await get(server.port, '/status')
    assert.equal(res.status, 200)
    assert.match(res.headers['content-type'], /^text\/html/)
    assert.match(res.body, /<h1>status<\/h1>/)
    // / -> index.html
    const home = await get(server.port, '/')
    assert.equal(home.status, 200)
    assert.match(home.body, /<h1>home<\/h1>/)
  } finally {
    await server.close()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('served shapes: traversal never escapes the root (the decoy-in-parent proof)', async () => {
  const root = tmpRoot()
  // A decoy the escape WOULD hit if dot-segments survived normalization:
  // planted in the PARENT of the served root, never in the tree itself.
  const decoy = path.join(root, '..', 'LEAK_ME.txt')
  fs.writeFileSync(decoy, 'the tree outside the root')
  const server = await createServer({ root })
  try {
    // WHATWG URL normalization is the first brace: dot-segment encodings
    // (/%2e%2e/, /../, /assets/%2e%2e/%2e%2e/) dissolve BEFORE the handler
    // sees them, so they can only land on same-named files INSIDE the
    // root (or 404). The second brace catches the encodings URL cannot
    // see as dot-segments (indexOf '..', '\u002e.%2f..'): they decode at
    // the handler and resolve toward the parent - where the resolve-time
    // containment check turns the escape into a plain 404. Both braces
    // must hold for the decoy never to leak:
    for (const p of [
      '/%2e%2e/LEAK_ME.txt',
      '/../LEAK_ME.txt',
      '/assets/%2e%2e/%2e%2e/LEAK_ME.txt',
      '/assets/..%2f..%2fLEAK_ME.txt',
    ]) {
      const res = await get(server.port, p)
      assert.equal(res.status, 404, p)
      assert.ok(!res.body.includes('outside the root'), p)
    }
    // Documented, not hidden: a dot-segment shape collapses to a
    // same-named file INSIDE the root (URL's normalization), never to
    // the outside copy of that name.
    const sameName = await get(server.port, '/%2e%2e/secret.txt')
    assert.equal(sameName.status, 200)
    assert.ok(!sameName.body.includes('outside the root'))
  } finally {
    await server.close()
    fs.rmSync(root, { recursive: true, force: true })
    fs.rmSync(decoy, { force: true })
  }
})

test('served shapes: an unknown route 404s; a matching rule rides the MISS path', async () => {
  const root = tmpRoot()
  const headers = headersFile(root, '/status.json\n  Access-Control-Allow-Origin: *\n')
  const server = await createServer({ root, headersFile: headers })
  try {
    const res = await get(server.port, '/status.json') // rule matches, file does NOT exist
    assert.equal(res.status, 404)
    // The CORS clause's miss-path honesty: the HEADER the requested path
    // matched still ships, so a browser fetcher sees the same policy a
    // success would carry.
    assert.equal(res.headers['access-control-allow-origin'], '*')
    const noRule = await get(server.port, '/nope')
    assert.equal(noRule.status, 404)
  } finally {
    await server.close()
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('served shapes: HEAD answers the same headers with no body', async () => {
  const root = tmpRoot()
  const server = await createServer({ root })
  try {
    const res = await get(server.port, '/status', 'HEAD')
    assert.equal(res.status, 200)
    assert.match(res.headers['content-type'], /^text\/html/)
    assert.ok(Number(res.headers['content-length']) > 0)
    assert.equal(res.body, '')
  } finally {
    await server.close()
    fs.rmSync(root, { recursive: true, force: true })
  }
})
