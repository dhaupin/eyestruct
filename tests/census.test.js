'use strict'

// The count-census leg (eyestruct#10 item 3). The stale-26 drift class:
// prose carries a hand-copied count ("25 reason-codes", "26 pack cases"),
// the ledger or the source table moves, the copy keeps lagging, and only a
// human-eye walk catches it. This leg makes that class die by construction
// - count-claims on the audited surfaces must equal values derived from
// the living sources of truth:
//
//   reason codes  -> Object.keys(lib/reasons.js CODES).length
//   pack cases    -> packs/eye-ledger.json rows.length
//   hostile leg   -> labs/crashledger.json findings.length (the N/N shape)
//   MCP tools     -> the TOOLS registry in lib/mcp.js (the tools/list truth)
//   CLI verbs     -> the COMMANDS table in bin/eyestruct.js
//
// Behavior-only, temp-free, no network: it reads repo files like the
// check:trifecta leg does. A count written as a word ("nine tools") is
// censused the same as a digit; the word branch is the WORD map's own
// vocabulary, not a bare letter run - non-count words before a noun
// ("the CLI verbs", "named reason-codes", "backed tools") are prose,
// not claims, and must not assert the runner. The census governs only
// claims it can derive - never invents a truth, never fakes a pass
// when its own parsing loses the shape (the registry matchers assert,
// they do not degrade). Digit claims of any size are caught; spelled
// counts above twenty must be written as digits on audited surfaces.

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const REPO = path.join(__dirname, '..')

const WORD = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
}

function num(raw) {
  const n = WORD[raw] ?? Number(raw)
  assert.ok(Number.isFinite(n), `census runner failed to normalize claim text "${raw}"`)
  return n
}

// The claim token, never hand-copied: digits of any size, or a spelled
// count from the WORD map itself (so the alternation cannot drift from
// the map the num() lookup uses).
const TOKEN = `\\d+|${Object.keys(WORD).join('|')}`

// ---- truths (each one derived from the lib/ledger, never copied) ----------

function libReasonCodes() {
  return Object.keys(require('../lib/reasons.js').CODES).length
}

function eyeLedgerRows() {
  return require('../packs/eye-ledger.json').rows.length
}

function crashFindings() {
  return require('../labs/crashledger.json').findings.length
}

function mcpTools() {
  const src = fs.readFileSync(path.join(REPO, 'lib/mcp.js'), 'utf8')
  const registry = src.match(/const TOOLS = \[[\s\S]*?\n\]/)
  assert.ok(registry, 'lib/mcp.js must carry the TOOLS registry the census derives from')
  const names = [...registry[0].matchAll(/\bname: '([a-z_]+)'/g)].map((m) => m[1])
  assert.ok(names.length > 0, 'TOOLS registry census found zero tool names - the match lost the shape')
  return names.length
}

function cliVerbs() {
  const src = fs.readFileSync(path.join(REPO, 'bin/eyestruct.js'), 'utf8')
  const table = src.match(/const COMMANDS = \{[\s\S]*?\n\}/)
  assert.ok(table, 'bin/eyestruct.js must carry the COMMANDS table the census derives from')
  // One verb per table line: `'name'`-quoted or bare, bound to require()
  // or an arrow. Comment lines cannot match this shape.
  const names = [...table[0].matchAll(/^\s+'?([a-z][a-z-]+)'?:\s*(?:require|\()/gm)].map((m) => m[1])
  assert.ok(names.length > 0, 'COMMANDS table census found zero verbs - the match lost the shape')
  return names.length
}

const TRUTHS = {
  'reason-codes': libReasonCodes(),
  'pack cases': eyeLedgerRows(),
  'hostile findings': crashFindings(),
  'mcp tools': mcpTools(),
  'cli verbs': cliVerbs(),
}

// ---- surfaces (issue #10: the hand-copy targets of the stale-26 class) ----

const SURFACES = [
  'docs/ci.md',
  'docs/discussions/index.md',
  'web/ssr.config.js',
  'docs/packs.md',
  'docs/mcp.md',
  'docs/cli.md',
  // The web pages joined after the nitpick round caught the stale count
  // twice on unaudited surfaces (Home + Packs carried "34 pack cases" while
  // the committed eye-ledger reads 35 - the page copy drifted, CI never
  // could see it). The docs pages were already held; the landing pages
  // carry the same claim classes, so they ride the same census now.
  'web/src/pages/Home.jsx',
  'web/src/pages/Packs.jsx',
  'web/src/pages/Agents.jsx',
  'web/src/pages/Status.jsx',
]

// A claim spec: a global regex plus a claim(m) extraction. Every match of
// `re` on an audited surface must agree with TRUTHS[kind] or the copy is
// stale and the leg names file/line/claim/truth. Future claim kinds are
// one entry here, one truth above, and the drift class stays dead.
const CLAIMS = [
  {
    kind: 'reason-codes',
    re: new RegExp(`\\b(${TOKEN}) reason-?codes?\\b`, 'g'),
    claim: (m) => num(m[1]),
  },
  {
    kind: 'pack cases',
    re: new RegExp(`\\b(${TOKEN}) (?:adversarial )?pack (?:cases|verdicts)\\b`, 'g'),
    claim: (m) => num(m[1]),
  },
  {
    // The N/N hostile shape ("52/52 hostile-attack leg", "52/52 REFUSED"):
    // both halves must equal the committed findings count.
    kind: 'hostile findings',
    re: /(\d+)\/(\d+)\s*(?:REFUSED|hostile|crash)/g,
    claim: (m) => {
      const [a, b] = [num(m[1]), num(m[2])]
      return a === b ? a : `${a}/${b}`
    },
  },
  {
    kind: 'mcp tools',
    re: new RegExp(`\\b(${TOKEN}) (?:MCP )?tools\\b`, 'g'),
    claim: (m) => num(m[1]),
  },
  {
    kind: 'cli verbs',
    re: new RegExp(`\\b(${TOKEN}) (?:CLI )?verbs\\b`, 'g'),
    claim: (m) => num(m[1]),
  },
]

function truthFor(kind) {
  assert.ok(Object.prototype.hasOwnProperty.call(TRUTHS, kind), `census spec bug: unknown kind "${kind}"`)
  return TRUTHS[kind]
}

// The surface scan: every stale claim as {file, line, text, claimed, kind}.
function census() {
  const stale = []
  for (const surface of SURFACES) {
    const file = path.join(REPO, surface)
    assert.ok(fs.existsSync(file), `census surface missing from the tree: ${surface}`)
    const body = fs.readFileSync(file, 'utf8')
    for (const spec of CLAIMS) {
      spec.re.lastIndex = 0
      let m
      while ((m = spec.re.exec(body)) !== null) {
        const claimed = spec.claim(m)
        if (claimed !== truthFor(spec.kind)) {
          const line = body.slice(0, m.index).split('\n').length
          stale.push({ file: surface, line, kind: spec.kind, text: m[0].trim(), claimed: String(claimed) })
        }
      }
    }
  }
  return stale
}

test('census: the truths the leg derives are non-empty and agree with the receipted counts', () => {
  assert.equal(TRUTHS['reason-codes'], 31, 'lib/reasons.js CODES census must stay 31 until a counted change lands (ADOPT_TARGET_NOT_ARTIFACT joined 2026-10-29 as the slot-vs-artifact refusal, carrier receipted in eye-adapter)')
  assert.equal(TRUTHS['pack cases'], 37, 'packs/eye-ledger.json rows census must stay 37 until a counted change lands (the clean-capture-flag-rides-the-carrier case joined eye-adapter 2026-10-29, creadev #18; the adopt-slot-directory-refused case joined the same day as #17)')
  assert.equal(TRUTHS['hostile findings'], 52, 'labs/crashledger.json findings census must stay 52 until a counted change lands')
  assert.equal(TRUTHS['mcp tools'], 10, 'lib/mcp.js TOOLS census must stay 10 until a counted change lands (spot joined 2026-10-28 with the agents-vision loop, one minor bump)')
  assert.equal(TRUTHS['cli verbs'], 13, 'bin/eyestruct.js COMMANDS census must stay 13 until a counted change lands (serve + spot joined 2026-10-28, one minor bump)')
})

test('census: no audited surface carries a stale count-claim', () => {
  const stale = census()
  const fmt = (r) => `${r.file}:${r.line} carries "${r.text}" as ${r.claimed}, truth is ${truthFor(r.kind)} (${r.kind})`
  assert.deepEqual(
    stale.map(fmt),
    [],
    stale.length ? `stale count-claims found:\n${stale.map(fmt).join('\n')}` : ''
  )
})

test('version truth: package.json is the single version source, and the living surfaces cannot drift from it', () => {
  // The stale-README class (the 0.9.0 release-day catches): a living
  // surface hand-copies the CURRENT version, the release moves, and the
  // copy keeps lagging. Two classes are pinned here; the LAWFUL others
  // stay out of scope - range pins (^1.0.0) bind 1.x compatibility, not
  // the current version, and dated era rows (changelog sections, the
  // freeze posts, the freeze-at-1.0.0 contract lines) keep their era
  // wording by design.
  const root = require('../package.json').version
  assert.ok(/^\d+\.\d+\.\d+/.test(root), 'census runner: root package.json version did not parse')

  // web/package.json: a second hand-synced truth must equal the root.
  const web = require('../web/package.json')
  assert.equal(web.version, root, 'web/package.json version drifted from root package.json - the release commit moves them together, and the leg now holds the moving')

  // README status line: the current-version claim derives from root.
  const readme = fs.readFileSync(path.join(REPO, 'README.md'), 'utf8')
  const status = readme.match(/Status: \*\*(\d+\.\d+\.\d+)/)
  assert.ok(status, 'README must carry a "Status: **X.Y.Z, ..." line for the version pin (the pin relocates WITH the claim if the copy moves)')
  assert.equal(status[1], root, 'README status line carries a stale version - move it in the same commit as root package.json, or drop the number')
})
