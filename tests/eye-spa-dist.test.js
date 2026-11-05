'use strict'

// tests/eye-spa-dist.test.js - the eye-spa-dist negative test is permanent:
// the good fixture dist must be clean (zero EXPLOITED) and each bad dist must
// produce EXACTLY the expected EXPLOITED check id. If a refactor deletes a
// check, this fails. Fixtures are SCAFFOLDED, not committed: the battery
// builds the good dist in a temp dir and derives each bad dist from it with
// one honest mutation - so the pack's refusal surface has a permanent negative
// test with zero fixture bytes to transport.
//
// The load-bearing cases are the false-positive guards: a SPA-only tree (no
// route dirs) must NOT be flagged for the fallback shape, and a single-page
// tree must docket BOUNDED (build-stamp unverifiable) rather than fail.
//
// Behavior-only, temp dirs, no network. The pack is loaded straight from
// packs/public/eye-spa-dist, the same module the campaign runner arms.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const pack = require('../packs/public/eye-spa-dist/index.js')

// A dist-rooted fsapi over one fixture dir - the same contract the runner
// arms as moduleCtx.spaDist.
function distFs(root) {
  const safe = (rel) => (typeof rel === 'string' && !rel.startsWith('/') && !rel.split(/[\\/]/).includes('..') ? rel : null)
  return {
    root,
    exists: (rel) => { const r = safe(rel); return r != null && fs.existsSync(path.join(root, r)) },
    text: (rel) => { const r = safe(rel); try { return r == null ? null : fs.readFileSync(path.join(root, r), 'utf8') } catch { return null } },
    readdir: (rel) => { const r = safe(rel); try { return r == null ? [] : fs.readdirSync(path.join(root, r)) } catch { return [] } },
  }
}

function page({ title = 'fixture app', mount = '<div id="root" data-server-rendered="true"><h1>hi</h1></div>', bundle = '/assets/index-abc123.js', canonical = 'https://example.test' } = {}) {
  const script = bundle ? `\n    <script type="module" crossorigin src="${bundle}"></script>` : ''
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>${title}</title>
    <link rel="canonical" href="${canonical}" />
  </head>
  <body>
    ${mount}${script}
  </body>
</html>
`
}

function write(root, rel, body) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, body)
}

// The good dist: one prerendered route page + the entry page, both on the
// same bundle, no placeholders, no SPA fallback in the redirect contract.
function goodDist() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eye-spa-dist-'))
  write(root, 'index.html', page({ canonical: 'https://example.test' }))
  write(root, 'about/index.html', page({ title: 'About', canonical: 'https://example.test/about' }))
  write(root, 'assets/index-abc123.js', 'console.log("fixture")\n')
  write(root, '_redirects', '# prerendered tree, no SPA fallback\n')
  return root
}

function run(root) {
  return pack.run({ spaDist: distFs(root) })
}

function exploitedIds(res) {
  return res.rows.filter((r) => r.verdict === 'EXPLOITED').map((r) => r.id)
}

test('the good fixture dist drives the pack clean (0 exploited)', () => {
  const res = run(goodDist())
  assert.equal(res.ok, true, JSON.stringify(res.rows))
  assert.deepEqual(exploitedIds(res), [])
  assert.ok(res.rows.length >= 5, 'the pack must emit its full row set')
})

test('a missing #root app mount is the named EXPLOITED (blank capture root)', () => {
  const root = goodDist()
  write(root, 'index.html', page({ mount: '<div class="app"></div>' }))
  assert.deepEqual(exploitedIds(run(root)), ['spa/app-mount-missing'])
})

test('two #root mounts are the named EXPLOITED (ambiguous capture root)', () => {
  const root = goodDist()
  write(root, 'index.html', page({ mount: '<div id="root"></div><div id="root"></div>' }))
  assert.deepEqual(exploitedIds(run(root)), ['spa/app-mount-missing'])
})

test('a mount with no entry bundle is the named EXPLOITED (dead frame)', () => {
  const root = goodDist()
  write(root, 'index.html', page({ bundle: null }))
  assert.deepEqual(exploitedIds(run(root)), ['spa/bundle-not-referenced'])
})

test('an un-replaced %VITE_*% placeholder is the named EXPLOITED (inject never ran)', () => {
  const root = goodDist()
  write(root, 'index.html', page().replace('<title>fixture app</title>', '<title>%VITE_APP_TITLE%</title>'))
  assert.deepEqual(exploitedIds(run(root)), ['spa/placeholder-leaked'])
})

test('the shell placeholder title is the named EXPLOITED (template served as-is)', () => {
  const root = goodDist()
  write(root, 'index.html', page().replace('<title>fixture app</title>', '<title>Site</title>'))
  assert.deepEqual(exploitedIds(run(root)), ['spa/placeholder-leaked'])
})

test('two different entry bundles across pages are the named EXPLOITED (partial bake)', () => {
  const root = goodDist()
  write(root, 'about/index.html', page({ title: 'About', bundle: '/assets/index-STALE99.js' }))
  assert.deepEqual(exploitedIds(run(root)), ['spa/build-stamp-drift'])
})

test('a prerendered tree shipping the SPA fallback is the named EXPLOITED (redirect loop)', () => {
  const root = goodDist()
  write(root, '_redirects', '/*    /index.html   200\n')
  assert.deepEqual(exploitedIds(run(root)), ['spa/fallback-vs-prerender'])
})

test('a dist with no index.html is the named EXPLOITED (nothing declares the mount)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eye-spa-dist-'))
  write(root, 'about/index.html', page({ title: 'About' }))
  assert.deepEqual(exploitedIds(run(root)), ['spa/entry-page-missing'])
})

// --- the false-positive guards ---

test('a single-page dist dockets BOUNDED for the build stamp, never a fake pass', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eye-spa-dist-'))
  write(root, 'index.html', page())
  write(root, 'assets/index-abc123.js', 'console.log("fixture")\n')
  const res = run(root)
  assert.equal(res.ok, true, JSON.stringify(res.rows))
  const stamp = res.rows.find((r) => r.id === 'spa/build-stamp-drift')
  assert.equal(stamp.verdict, 'BOUNDED')
  assert.equal(stamp.bound, 'single-page-or-no-bundle')
})

test('a SPA-only tree (no route dirs) is NOT flagged for the fallback shape', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eye-spa-dist-'))
  write(root, 'index.html', page())
  write(root, 'assets/index-abc123.js', 'console.log("fixture")\n')
  write(root, '_redirects', '/*    /index.html   200\n')
  assert.deepEqual(exploitedIds(run(root)), [])
  const fb = run(root).rows.find((r) => r.id === 'spa/fallback-vs-prerender')
  assert.equal(fb.verdict, 'PASSED')
})

test('an absent dist dockets exactly one BOUNDED row, never a pass', () => {
  const res = pack.run({ spaDist: { root: null, exists: () => false, text: () => null, readdir: () => [] } })
  assert.equal(res.ok, true)
  assert.deepEqual(res.rows.map((r) => r.verdict), ['BOUNDED'])
  assert.equal(res.rows[0].id, 'spa/dist-absent')
})

test('a missing contract key refuses loudly, naming the pack', () => {
  assert.throws(() => pack.run({}), /eye-spa-dist.*spaDist/)
})

// --- the dogfood leg: this repo's own built web lane ---

// web/dist is a web-lane artifact, NOT committed and NOT built by the
// battery, so on CI this honest-skips with the exact build command - the
// same never-fake-pass law the served-dist leg carries. When it IS built
// (locally, or in the docs lane), the repo's own dist must drive the pack
// clean - the eyestruct#60 dogfood: the capture-correctness carrier proves
// itself on a real React/Vite bake, not only on the scaffolded fixture.
const DIST = path.join(__dirname, '..', 'web', 'dist')

test('dogfood: the repo\'s own built web/dist drives the pack clean', { skip: !fs.existsSync(path.join(DIST, 'index.html')) && 'web/dist not built - run `npm run build:web`' }, () => {
  const res = run(DIST)
  assert.equal(res.ok, true, JSON.stringify(res.rows))
  assert.deepEqual(exploitedIds(res), [])
})
