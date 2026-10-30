// tests/jekyll-filters.test.js - the build-time Liquid construct leg.
//
// scripts/check-jekyll-filters.cjs refuses two classes of source-level Liquid
// that only fail at Jekyll BUILD time, so the failure is named in lint:docs
// with a file:line instead of in Jekyll's stack trace:
//   1. a single-arg string filter called with two arguments (crashtest#23);
//   2. an unknown tag ({% seo %} in prose, poststruct 2026-10-29).
// Four legs: the repo's own docs pass, an unknown tag refuses by name, a
// {% raw %}-wrapped literal is exempt, and the two-arg filter rule still
// refuses (the regression guard for the original class). Fixtures are temp
// dirs; no network.

'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const SCRIPT = path.join(ROOT, 'scripts', 'check-jekyll-filters.cjs')

function run(root) {
  const r = spawnSync(process.execPath, [SCRIPT, root], { encoding: 'utf8' })
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' }
}

function fixture(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'jekyll-filters-leg-'))
  for (const [name, body] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), body)
  }
  return dir
}

test("the repo's own docs pass (no build-time Liquid construct)", () => {
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: ROOT, encoding: 'utf8' })
  assert.equal(r.status, 0, `docs refused: ${r.stderr}`)
  assert.match(r.stdout, /JEKYLL FILTERS: PASS/)
})

test('an unknown tag refuses by name with a file:line', () => {
  const dir = fixture({ 'a.md': 'intro line\nhere is {% seo %} in prose\n' })
  const r = run(dir)
  assert.equal(r.status, 1)
  assert.match(r.stderr, /a\.md:2 unknown Liquid tag "seo"/)
  assert.match(r.stderr, /\{% raw %\}/)
})

test('a {% raw %}-wrapped literal tag is exempt', () => {
  const dir = fixture({ 'a.md': 'ok {% raw %}{% seo %}{% endraw %} done\n' })
  const r = run(dir)
  assert.equal(r.status, 0, r.stderr)
})

test('the two-argument single-arg filter rule still refuses', () => {
  const dir = fixture({ 'a.md': "{{ page.url | remove: '/x', '' }}\n" })
  const r = run(dir)
  assert.equal(r.status, 1)
  assert.match(r.stderr, /a\.md:1 Liquid "remove" takes exactly one argument/)
})

test('a known tag passes (the core set is not over-refused)', () => {
  const dir = fixture({ 'a.md': '{% if page.title %}x{% endif %}\n{% include nav.html %}\n' })
  const r = run(dir)
  assert.equal(r.status, 0, r.stderr)
})
