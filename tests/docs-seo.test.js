'use strict'

// The docs SEO seam test (eyestruct#23). The docs head is owned by the
// freestruct post-build layer (docs/_freestruct/inject-brand.html + the
// Jekyll layout's head): the layout must NOT hand-write the og/canonical
// set, or the engine's missing-only gate skips its own og block and a
// configured og.image starves on every page (freestruct#46; crashtest#42 is
// the worked example). This leg runs the REAL pinned freestruct engine over
// a synthetic _site - no Ruby, no network - and pins both states: no image
// configured (no og:image ships, honestly) and the image day (og:image +
// twitter:image reach the page). It also pins the URL shape: site.url is
// ORIGIN-ONLY, so the engine joins url + basePath + slug once, never twice
// (the /eyestruct/eyestruct/ doubling that 404s in the live sitemap/feed).

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const REPO = path.resolve(__dirname, '..')
const FREESTRUCT_BIN = path.join(REPO, 'node_modules', 'freestruct', 'bin', 'freestruct.mjs')

// The engine is a devDep; skip honestly when the install is absent rather
// than fail a tree that simply has not run `npm ci`.
const haveEngine = fs.existsSync(FREESTRUCT_BIN)

// A page as docs/_layouts/default.html emits it now: title on the ' | '
// pipe, a description, NO og/canonical (the engine owns that seam).
const PAGE = [
  '<!DOCTYPE html><html lang="en"><head>',
  '<meta charset="UTF-8">',
  '<title>Getting Started | eyestruct</title>',
  '<meta name="description" content="a page description">',
  '<link rel="icon" type="image/svg+xml" href="/eyestruct/icon.svg">',
  '</head><body>hi</body></html>',
].join('\n')

function fixture({ ogImage }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-seo-'))
  fs.mkdirSync(path.join(root, 'docs', '_freestruct'), { recursive: true })
  fs.mkdirSync(path.join(root, 'docs', '_site'), { recursive: true })
  fs.copyFileSync(
    path.join(REPO, 'docs', 'freestruct.config.yml'),
    path.join(root, 'docs', 'freestruct.config.yml')
  )
  fs.copyFileSync(
    path.join(REPO, 'docs', '_freestruct', 'inject-brand.html'),
    path.join(root, 'docs', '_freestruct', 'inject-brand.html')
  )
  if (ogImage) {
    const p = path.join(root, 'docs', 'freestruct.config.yml')
    const s = fs.readFileSync(p, 'utf8').replace(
      /^og:\n(\s+type: article\n)/m,
      'og:\n$1  image: ' + ogImage + '\n'
    )
    fs.writeFileSync(p, s)
  }
  fs.writeFileSync(path.join(root, 'docs', '_site', 'index.html'), PAGE)
  return root
}

function run(root) {
  execFileSync('node', [FREESTRUCT_BIN, 'docs/_site'], { cwd: root, stdio: 'pipe' })
  return fs.readFileSync(path.join(root, 'docs', '_site', 'index.html'), 'utf8')
}

test('docs seo: with no og.image configured the engine ships no og:image (honest, not a 404 card)', { skip: !haveEngine }, () => {
  const html = run(fixture({}))
  assert.equal(/property="og:image"/.test(html), false, 'no og:image when the config carries none')
  assert.equal(/name="twitter:image"/.test(html), false, 'no twitter:image when the config carries none')
  // The set that DOES ship still lands, owned by the engine now.
  assert.match(html, /property="og:title" content="Getting Started \| eyestruct Docs"/)
  assert.match(html, /property="og:type" content="article"/)
  assert.match(html, /name="twitter:card" content="summary_large_image"/)
})

test('docs seo: the day og.image lands it reaches the page (the layout split no longer starves it)', { skip: !haveEngine }, () => {
  const img = 'https://eyestruct.creadev.org/og-image.png'
  const html = run(fixture({ ogImage: img }))
  assert.match(html, new RegExp('property="og:image" content="' + img + '"'))
  assert.match(html, new RegExp('name="twitter:image" content="' + img + '"'))
})

test('docs seo: the engine joins url + basePath + slug once - never the /eyestruct/eyestruct/ doubling', { skip: !haveEngine }, () => {
  const html = run(fixture({}))
  assert.match(html, /rel="canonical" href="https:\/\/docs\.creadev\.org\/eyestruct\/"/)
  assert.match(html, /property="og:url" content="https:\/\/docs\.creadev\.org\/eyestruct\/"/)
  assert.equal(/eyestruct\/eyestruct\//.test(html), false, 'the site.url path + basePath must not double')
})

// The regression source: the Jekyll layout hand-writing the og/canonical set
// is what made hasOg true and starved the engine's og block. Jekyll rendering
// needs Ruby, so pin the layout SOURCE statically - one head owner (the
// engine), and the layout keeps only what the engine does not own.
test('docs seo: the Jekyll layout hands og/canonical to the engine (no hand-written second head)', () => {
  const layout = fs.readFileSync(path.join(REPO, 'docs', '_layouts', 'default.html'), 'utf8')
  assert.equal(/property="og:/.test(layout), false, 'the layout must not hand-write og: tags')
  assert.equal(/rel="canonical"/.test(layout), false, 'the layout must not hand-write canonical')
  assert.equal(/name="twitter:/.test(layout), false, 'the layout must not hand-write twitter: tags')
  // <title> rides the ' | ' pipe so extractTitle does not double it into og:title.
  assert.match(layout, /<title>\{\{ page\.title \| default: site\.title \}\} \| \{\{ site\.title \}\}<\/title>/)
})
