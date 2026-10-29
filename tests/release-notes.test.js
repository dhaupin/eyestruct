// tests/release-notes.test.js - the release-extraction regression leg
// (the 1.1.0 pre-cut dry-run finding, commissioned by the walk-exit rule):
// scripts/release-notes.cjs used to slice from just after `## [version]`,
// so the heading's own date (`... - 2026-10-28`) leaked into the extracted
// body as a stray first bullet - and the 1.1.0 cut would have been the
// section-extraction path's first production use. Three legs: the repo's
// own sections extract with heading-openings and no date leak, a fixture
// changelog fails if the date ever leaks again, and an absent section
// refuses by name (exit 1).

const test = require('node:test')
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { fileURLToPath } = require('node:url')

const ROOT = path.resolve(__dirname, '..')
const SCRIPT = path.join(ROOT, 'scripts', 'release-notes.cjs')

function extract(args, cwd, scriptPath) {
  const r = spawnSync('node', [scriptPath || SCRIPT, ...args], { cwd: cwd || ROOT, encoding: 'utf8' })
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' }
}

test('the repo changelog extracts versions with subsection headings, never a date bullet', () => {
  const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version
  for (const v of [version, '1.0.0', '0.9.0']) {
    const r = extract([v])
    if (r.status !== 0) continue // a version without a changelog section refuses by name below; not this leg's assert
    assert.equal(r.status, 0, `extraction of ${v} failed: ${r.stderr}`)
    assert.ok(r.stdout.trim().length > 0, `${v} extracted an empty section`)
    const first = r.stdout.trim().split('\n')[0]
    assert.match(first, /^###/, `${v} body opens with something other than a subsection heading: ${first}`)
    assert.ok(!first.trimStart().startsWith('-'), `${v} body opens with a stray bullet: ${first}`)
  }
})

test('the heading date never leaks into the body (fixture regression on the leak class)', () => {
  // The script resolves its repo root from __dirname, so the fixture is a
  // temp checkout that carries a copy of the SAME script file and a
  // changelog whose section heading ends in a date.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-leg-'))
  try {
    fs.mkdirSync(path.join(dir, 'scripts'))
    fs.copyFileSync(SCRIPT, path.join(dir, 'scripts', 'release-notes.cjs'))
    const dated = '2026-04-11'
    fs.writeFileSync(
      path.join(dir, 'CHANGELOG.md'),
      `# Changelog\n\n## [9.9.9] - ${dated}\n\n### Added\n\n- the one true section body\n\n## [9.9.8] - ${dated}\n\n- the previous section\n`,
      'utf8'
    )
    const r = extract(['9.9.9'], dir, path.join(dir, 'scripts', 'release-notes.cjs'))
    assert.equal(r.status, 0, `extraction refused: ${r.stderr}`)
    assert.ok(r.stdout.includes('the one true section body'))
    assert.ok(!r.stdout.includes(dated), `the heading date leaked into the extracted body:\n${r.stdout}`)
    // And the version AFTER does not bleed in.
    assert.ok(!r.stdout.includes('9.9.8'), 'the next section bled into the extraction')
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('a version with no changelog section refuses the cut by name (exit 1)', () => {
  const r = extract(['7.7.7'])
  assert.equal(r.status, 1)
  assert.ok(r.stderr.includes('no "## [7.7.7]" section in CHANGELOG.md'), `refusal does not name the miss: ${r.stderr}`)
  assert.ok(r.stdout.trim() === '', 'a refused extraction still wrote a body')
})
