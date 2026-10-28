'use strict'

// The served-contract leg (the cheap independent verification the status
// dialect workflow needed): assert what the web lane SERVES agrees with
// what the committed ledgers GENERATE, through a real HTTP client against
// a real server implementation - not by reading files straight.
//
// Split, honestly:
//   always-run part  - the committed web/public/_headers carries the
//                      family status dialect's /status.json clauses;
//                      (local-only part) the dist copy, when a build
//                      exists, serves the generator's exact output.
//   localhost part   - lib/serve-dist.js (the ONE implementation of "what
//                      the host serves", shared with the opt-in chromium
//                      lane) serves web/dist; the battery asserts the
//                      served /status.json equals the generator output,
//                      the prerendered status page carries the island
//                      hooks, and the deployed assets carry the reader.
//
// web/dist is a web-lane artifact, NOT committed and NOT built by the
// battery, so on CI the localhost part honest-skips with the exact build
// command - the same never-fake-pass law the raster gate carries.
// Behavior-only, temp dirs, no network (localhost only), node >=18.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')

const repoRoot = path.join(__dirname, '..')
const HEADERS_FILE = path.join(repoRoot, 'web', 'public', '_headers')
const DIST = path.join(repoRoot, 'web', 'dist')

// The one ESM emitter, dynamically imported so the CJS battery and node 18
// (no require(esm)) both load it fine.
async function emitter() {
  return (await import('../web/scripts/build-status.mjs')).build
}

function get(port, pathname) {
  return new Promise((resolvePromise, rejectPromise) => {
    http
      .get({ host: '127.0.0.1', port, path: pathname }, (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => resolvePromise({ status: res.statusCode, headers: res.headers, body }))
      })
      .on('error', rejectPromise)
  })
}

test('dist: the committed _headers carries the family status dialect clauses', () => {
  const clauses = fs.readFileSync(HEADERS_FILE, 'utf8')
  // The /status.json block: ACAO ALWAYS (the dialect pages browser-fetch
  // this file cross-origin - the live receipt behind the CORS clause) and
  // content type pinned (never a guessed mimetype on a generated file).
  const block = clauses.split(/\r?\n\s*\r?\n/).find((b) => /^\/status\.json$/m.test(b))
  assert.ok(block, 'web/public/_headers must carry a /status.json block')
  assert.match(block, /access-control-allow-origin:\s*\*/i)
  assert.match(block, /content-type:\s*application\/json/i)
})

test('served dist: the served status.json equals the generator truth and satisfies the dialect', { skip: ifNoDist() }, async () => {
  const { createServer } = require('../lib/serve-dist')
  const build = await emitter()
  const server = await createServer({ root: DIST, headersFile: HEADERS_FILE })
  try {
    const res = await get(server.port, '/status.json')
    assert.equal(res.status, 200)
    assert.match(res.headers['content-type'], /^application\/json/)
    // The dialect clauses ride the served file, not just the repo file.
    assert.equal(res.headers['access-control-allow-origin'], '*')
    assert.match(res.headers['cache-control'], /no-cache/)
    // The stale-dist killer: whatever serves must equal what the committed
    // ledgers generate RIGHT NOW, byte-for-byte semantically (never a
    // lagging copy - the drift class this repo kills by construction).
    const served = JSON.parse(res.body)
    assert.deepEqual(served, build())
    assert.equal(served.contract, 'family-status@1')
    assert.ok(Array.isArray(served.legs) && served.legs.length > 0)
    assert.ok(Array.isArray(served.packs))
  } finally {
    await server.close()
  }
})

test('served dist: the prerendered status page carries the island hooks', { skip: ifNoDist() }, async () => {
  const { createServer } = require('../lib/serve-dist')
  const server = await createServer({ root: DIST, headersFile: HEADERS_FILE })
  try {
    const page = await get(server.port, '/status')
    assert.equal(page.status, 200)
    assert.match(page.headers['content-type'], /^text\/html/)
    assert.match(page.body, /<title>Live status \| eyestruct<\/title>/)
    // The island hook + its honest fallback text - what crawlers see, and
    // what the chromium lane replaces with real rows.
    assert.match(page.body, /data-pre-island="family-status"/)
    assert.match(page.body, /Reading the family/)
  } finally {
    await server.close()
  }
})

test('served dist: the deployed assets carry the family reader', { skip: ifNoDist() }, async () => {
  const { createServer } = require('../lib/serve-dist')
  const server = await createServer({ root: DIST, headersFile: HEADERS_FILE })
  try {
    const page = await get(server.port, '/status')
    const bundlePath = (page.body.match(/src="(\/assets\/[^"]+\.js)"/) || [])[1]
    assert.ok(bundlePath, 'the prerendered status page must reference its JS bundle')
    let bundle = ''
    for (const chunk of chunkLines(fs.readFileSync(path.join(DIST, bundlePath), 'utf8'))) bundle += chunk
    // The static sibling map the island fetches from - all four members,
    // and the dialect pin it refuses on.
    assert.ok(bundle.includes('family-status@1'))
    for (const origin of ['crashtest.creadev.org', 'poststruct.creadev.org', 'packstruct.creadev.org']) {
      assert.ok(bundle.includes(origin), `bundle must carry the ${origin} fetch origin`)
    }
    assert.ok(bundle.includes('/status.json'))
  } finally {
    await server.close()
  }
})

// If no dist exists, say exactly how to get one - an honest skip, never a
// fake pass (and never a mystery skip).
function ifNoDist() {
  // The prerender writes route directories: status/index.html, not status.html.
  return fs.existsSync(path.join(DIST, 'status', 'index.html'))
    ? false
    : `web/dist not built (run: npm run build --prefix web) - the served-contract leg runs against a real build`
}

function chunkLines(text) {
  return text.match(/[\s\S]{1,65536}/g) || []
}
