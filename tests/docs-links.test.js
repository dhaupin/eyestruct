'use strict'

// The docs internal-link convention (the bug the strict link check surfaced).
//
// Every docs page is served under /eyestruct (site.baseurl), so an internal
// link must be either ROOT-ABSOLUTE (`/eyestruct/cli`) or explicitly
// SAME-DIRECTORY (`./announcing-v0.9.0`, from discussions/index.md). A bare
// page-relative link is the trap: `[ci](ci)` from `docs/cli.md` resolves, once
// the page builds as `cli/index.html`, to `/eyestruct/cli/ci` - a real 404
// that shipped green for as long as the link check was off (the basePath
// false-positives masked it). This leg holds the convention without Ruby: it
// reads the markdown and refuses a bare relative target.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const REPO = path.resolve(__dirname, '..')
const DOCS = path.join(REPO, 'docs')

// A markdown inline link: [text](target). Not an image (!), not a reference
// definition. The target is everything up to the first ')'; this corpus has
// no parenthesised targets.
const LINK = /(^|[^!])\[[^\]]*\]\(([^)]+)\)/g

function markdownFiles(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) { markdownFiles(p, acc); continue }
    if (e.name.endsWith('.md')) acc.push(p)
  }
  return acc
}

// An internal link is one that is not a scheme (http:, mailto:, ...), not
// protocol-relative, and not an anchor.
function internalTargets(src) {
  const out = []
  let m
  while ((m = LINK.exec(src)) !== null) {
    const target = m[2].trim().split('#')[0]
    if (!target) continue
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) continue
    out.push(target)
  }
  return out
}

test('every docs internal link is root-absolute or same-directory (never a bare relative target)', () => {
  const offenders = []
  for (const file of markdownFiles(DOCS)) {
    for (const target of internalTargets(fs.readFileSync(file, 'utf8'))) {
      const ok = target.startsWith('/') || target.startsWith('./') || target.startsWith('../')
      if (!ok) offenders.push(`${path.relative(REPO, file)} -> (${target}) is a bare relative link; use /eyestruct/... or ./...`)
    }
  }
  assert.deepEqual(offenders, [], `docs internal links must be root-absolute or explicit:\n${offenders.join('\n')}`)
})

test('the link convention bites: a bare page-relative target is refused', () => {
  // The exact pre-fix shape: [ci](ci) from docs/cli.md, which resolved to
  // /eyestruct/cli/ci once the page built as cli/index.html.
  const offenders = (src) => internalTargets(src).filter((t) => !(t.startsWith('/') || t.startsWith('./') || t.startsWith('../')))
  assert.deepEqual(offenders('see [ci](ci)'), ['ci'], 'a bare relative target must be flagged')
  assert.deepEqual(offenders('see [ci](/eyestruct/ci)'), [], 'a root-absolute target is fine')
  assert.deepEqual(offenders('see [a](./announcing-v0.9.0)'), [], 'an explicit same-directory target is fine')
  assert.deepEqual(offenders('see [a](https://example.com/x)'), [], 'an external target is out of scope')
})
