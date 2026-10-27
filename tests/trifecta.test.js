// tests/trifecta.test.js - behavior coverage for the trifecta freshness leg
// (scripts/check-trifecta.cjs). House style: node:test, behavior-only, temp
// dirs, no network. The fixture is a miniature repo whose four artifacts
// AGREE with its tree; each case then breaks exactly one claim and expects
// exactly one named refusal - drift is refused, never guessed.

const { test } = require('node:test')
const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { runTri } = require('../scripts/check-trifecta.cjs')

const BIN = `#!/usr/bin/env node
const COMMANDS = {
  init: require('../lib/init'),
  look: require('../lib/look').runLook,
  walk: require('../lib/walk'),
}
function usage() {
  return 'commands... look <url> [--viewport WxH] [--region SEL] init walk'
}
`

const README = `# fixture

\`\`\`text
eyestruct init
eyestruct look <url> [--viewport WxH]
eyestruct walk <base-url>
\`\`\`

Status: live, exercised. See [AGENTS.md](AGENTS.md). Surfaces:
[docs start](https://docs.creadev.org/eyestruct/start),
[docs cli](https://docs.creadev.org/eyestruct/cli) - the workshop is
[Creadev.org](https://creadev.org).
`

const AGENTS = `- Battery: \`.github/workflows/battery.yml\` (npm test + npm run lint:docs).
- Receipts to cite: 2 reason-codes (lib/reasons.js), 2 pack verdicts
  (packs/eye-ledger.json), the 2/2 hostile leg (labs/crashledger.json),
  2 adversarial packs in packs/public.
`

const CHANGELOG_OK = `# Changelog

## [Unreleased]

### Added (2026-10-27)
- The capture seam ships: \`lib/engine.js\` drives the pinned chrome.

## [0.9.0] - 2026-10-26

### Added
- The verbs page: \`docs/verbs.md\` usage lines matching bin dispatch exactly.
`

const CHANGELOG_NO_DATED = `# Changelog

## [Unreleased]

### Added
- The capture seam ships: \`lib/engine.js\` drives the pinned chrome.
`

function baseFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'trifecta-'))
  const w = (rel, body) => {
    const p = path.join(root, rel)
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, body)
  }
  w('bin/eyestruct.js', BIN)
  w('lib/reasons.js', "module.exports = { CODES: { NOPE: null, BARE: null } }")
  w('packs/eye-ledger.json', JSON.stringify({ rows: [{ id: 'row-0001' }, { id: 'row-0002' }] }))
  w('packs/public/a-pack/pack.json', '{}')
  w('packs/public/b-pack/pack.json', '{}')
  w('labs/crashledger.json', JSON.stringify({ findings: [{ id: 'f1' }, { id: 'f2' }] }))
  w('package.json', JSON.stringify({
    name: 'fixture', scripts: { test: 'node --test tests/*.test.js', 'lint:docs': 'node x' },
  }))
  w('.github/workflows/battery.yml', 'name: battery\non: [push]\n')
  w('README.md', README)
  w('AGENTS.md', AGENTS)
  w('CHANGELOG.md', CHANGELOG_OK)
  w('docs/start.md', '# start\n')
  w('docs/cli.md', '# cli\n')
  w('lib/engine.js', "'use strict'\nmodule.exports = {}\n")
  return root
}

const write = (root, rel, body) => fs.writeFileSync(path.join(root, rel), body)

test('the agreeing fixture passes every leg of the walk', () => {
  const root = baseFixture()
  const r = runTri({ root })
  assert.strictEqual(r.ok, true, JSON.stringify(r.stale))
  assert.ok(r.lines.some((l) => l.includes('dispatch census')))
  assert.ok(r.lines.some((l) => l.includes('receipt inventory')))
  assert.ok(r.lines.some((l) => l.includes('Creadev.org named')))
  // verbs.md is cited in the HISTORICAL 0.9.0 section only - the file is
  // gone, the era claim is honest history, and the walk must not nag.
  assert.ok(!r.stale.some((s) => s.includes('docs/verbs.md')), 'historical sections are receipts of their era')
  fs.rmSync(root, { recursive: true, force: true })
})

test('a phantom verb/flag in the README fence is refused by name', () => {
  const root = baseFixture()
  write(root, 'README.md', README.replace('eyestruct walk <base-url>', 'eyestruct flynn\n	eyestruct sync --route X'))
  const r = runTri({ root })
  assert.strictEqual(r.ok, false)
  assert.ok(r.stale.some((s) => s.includes('PHANTOM_VERB') && s.includes('flynn')))
  assert.ok(r.stale.some((s) => s.includes('PHANTOM_FLAG') && s.includes('--route')))
  fs.rmSync(root, { recursive: true, force: true })
})

test('a receipt count that disagrees with the tree lands RECEIPT_DRIFT', () => {
  const root = baseFixture()
  write(root, 'AGENTS.md', AGENTS.replace('2 reason-codes', '7 reason-codes'))
  const r = runTri({ root })
  assert.strictEqual(r.ok, false)
  assert.ok(r.stale.some((s) => s.includes('RECEIPT_DRIFT') && s.includes('reason-code')))
  fs.rmSync(root, { recursive: true, force: true })
})

test('an Unreleased-cited artifact missing from disk lands GHOST_PATH', () => {
  const root = baseFixture()
  write(root, 'CHANGELOG.md', CHANGELOG_OK.replace('`lib/engine.js`', '`lib/ghost.js`'))
  const r = runTri({ root })
  assert.strictEqual(r.ok, false)
  assert.ok(r.stale.some((s) => s.includes('GHOST_PATH') && s.includes('lib/ghost.js')))
  fs.rmSync(root, { recursive: true, force: true })
})

test('losing the dated Added heading lands NO_DATED_ADDED', () => {
  const root = baseFixture()
  write(root, 'CHANGELOG.md', CHANGELOG_NO_DATED)
  const r = runTri({ root })
  assert.strictEqual(r.ok, false)
  assert.ok(r.stale.some((s) => s.includes('NO_DATED_ADDED')))
  fs.rmSync(root, { recursive: true, force: true })
})

test('without a .git dir the hash check skips instead of failing the walk', () => {
  const root = baseFixture()
  write(root, 'CHANGELOG.md', CHANGELOG_OK.replace('`lib/engine.js`', '`lib/engine.js` (receipts: `deadbeef`)'))
  const r = runTri({ root })
  assert.strictEqual(r.ok, true, JSON.stringify(r.stale))
  assert.ok(!r.stale.some((s) => s.includes('GHOST_COMMIT')), 'no .git -> no history to argue with')
  fs.rmSync(root, { recursive: true, force: true })
})
