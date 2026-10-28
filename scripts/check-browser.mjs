#!/usr/bin/env node
// scripts/check-browser.mjs - the opt-in chromium spot check (the second
// cheap verification hardening): the one thing curl and static leg asserts
// cannot see is the FAMILY TABLE as a real browser renders it. This lane
// loads the locally served web/dist in headless chromium and asserts the
// family-status island renders every dialect state from REAL fetches the
// browser makes against fixture-served sibling responses:
//
//   Pass state    (crashtest)  -> PASS row, numbers from the fixture file
//   Red state     (packstruct)  -> the EXPLOITED leg degrades to RED
//   404 state     (poststruct)  -> clean "HTTP 404 not serving" wording
//   Schema-2 file (second pass) -> the dialect pin refuses the row
//
// The eye row is asserted against the SERVED /status.json (fetched with
// the same HTTP client this script already has), never against hand-copied
// counts - the census stays the only place a number is written by hand.
//
// Opt-in, opt-in-law: NOT part of npm test or npm run check. Zero new
// runtime deps - puppeteer-core is already a dependency, and no chrome is
// downloaded or vendored by this script. Refusals are named, exit 2:
//
//   MISSING_PINNED_BROWSER: set EYESTRUCT_BROWSER=/path/to/chrome (the
//   same env the capture lane honors). On a machine with the puppeteer
//   cache, `puppeteer browsers install chrome` also works - the exec it
//   prints is what the env wants.
//
//   MISSING_DIST: run `npm run build --prefix web` first (this lane checks
//   the SAME dist the battery's served-contract leg serves).
//
// The server implementation is lib/serve-dist.js (the shared "what the
// host serves"), so the browser sees byte-identical serving semantics with
// the battery leg - one truth, two consumers, the serve-dist law.

import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'

const require = createRequire(import.meta.url)
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(REPO, 'web', 'dist')
const HEADERS = path.join(REPO, 'web', 'public', '_headers')

const FIXTURES = {
  // Valid PASS dialect file: the number "14" is deliberately NOT eyestruct's
  // ledger count - if the table shows 14, it rendered the SERVED fixture,
  // which is exactly what the lane exists to prove.
  'https://crashtest.creadev.org': {
    schema: 1,
    contract: 'family-status@1',
    repo: 'dhaupin/crashtest',
    site: 'https://crashtest.creadev.org/dashboard',
    docs: '',
    asOf: 'fixture',
    legs: [{ leg: 'packs', verdict: 'PASS', cases: 14, counts: { REFUSED: 14 }, ledger: 'packs/ledger.json' }],
    packs: [],
  },
  // Valid RED dialect file: an EXPLOITED row must degrade the whole leg.
  'https://packstruct.creadev.org': {
    schema: 1,
    contract: 'family-status@1',
    repo: 'dhaupin/packstruct',
    site: 'https://packstruct.creadev.org/status',
    docs: '',
    asOf: 'fixture',
    legs: [{ leg: 'conformance', verdict: 'RED', cases: 5, counts: { EXPLOITED: 3, REFUSED: 2 }, ledger: 'labs/ledger.json' }],
    packs: [],
  },
}

async function main() {
  // -- capability gate 1: a build to serve ------------------------------
  // The prerender writes route directories: status/index.html, not status.html.
  if (!fs.existsSync(path.join(DIST, 'status', 'index.html'))) {
    console.error('check:browser[MISSING_DIST]: web/dist has no status/ route - run `npm run build --prefix web` first')
    process.exit(2)
  }

  // -- capability gate 2: a chromium to drive ---------------------------
  // The CLI capture lane's env var, honored first; a manifest pin would be
  // the second rung but the manifest schema is the CLI's, and this lane
  // stays opt-in tooling until that sharing is wanted.
  let execPath = process.env.EYESTRUCT_BROWSER || ''
  if (execPath && !fs.existsSync(execPath)) {
    console.error(`check:browser[MISSING_PINNED_BROWSER]: EYESTRUCT_BROWSER is set but does not exist: ${execPath}`)
    process.exit(2)
  }
  if (!execPath) {
    // The puppeteer cache is the machine's own install history - the same
    // discovery order the capture resolution order step 4 documents. Not
    // vendored, never downloaded here.
    const cacheDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.cache', 'puppeteer')
    try {
      const found = execFileSyncChrome(cacheDir)
      if (found) execPath = found
    } catch {
      // no cache, fine - the refusal below says it plainly
    }
  }
  if (!execPath) {
    console.error(
      'check:browser[MISSING_PINNED_BROWSER]: no chromium resolvable - ' +
      'set EYESTRUCT_BROWSER=/path/to/chrome (the same env the capture lane honors), ' +
      'or `puppeteer browsers install chrome` on a machine with node + the puppeteer cache'
    )
    process.exit(2)
  }

  const { createServer } = require(path.join(REPO, 'lib', 'serve-dist.js'))
  const puppeteer = require('puppeteer-core')

  const server = await createServer({ root: DIST, headersFile: HEADERS })
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1100, height: 900 })

  // passNo flips between the two page loads: pass 1 exercises PASS + RED
  // + clean-404; pass 2 exercises the schema-2 refusal state (the dialect
  // pin refuses, the row degrades, never guesses).
  let passNo = 1
  await page.setRequestInterception(true)
  page.on('request', (req) => {
    const url = new URL(req.url())
    const origin = `${url.protocol}//${url.host}`
    if (url.pathname !== '/status.json') return req.continue()
    // The own origin gets the SERVED dist file (byte-identical truth, no
    // live internet - the lane is fully deterministic and offline).
    if (origin === 'https://eyestruct.creadev.org') {
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-cache' },
        body: JSON.stringify(own),
      })
      return
    }
    if (FIXTURES[origin]) {
      req.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(FIXTURES[origin]),
      })
      return
    }
    if (origin === 'https://poststruct.creadev.org') {
      req.respond(
        passNo === 1
          ? {
              // The clean-404 state WITH the CORS clause headers - the
              // exact reason the clause exists (an honest miss at the
              // reader, never an opaque network failure).
              status: 404,
              contentType: 'application/json',
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ error: 'not found' }),
            }
          : {
              // Pass 2: the schema-2 refusal state.
              status: 200,
              contentType: 'application/json',
              headers: { 'Access-Control-Allow-Origin': '*' },
              body: JSON.stringify({ schema: 2, contract: 'family-status@2' }),
            },
      )
      return
    }
    req.continue()
  })

  // The served truth for the own row, read with the same server session.
  const own = await getLocalJson(server.port)

  const target = `http://127.0.0.1:${server.port}/status`
  const failures = []

  // ---- pass 1: PASS / RED / 404 --------------------------------------
  passNo = 1
  await renderAndCollect(`${target} (pass 1)`, failures)
  // ---- pass 2: the schema-2 refusal state ----------------------------
  passNo = 2
  await renderAndCollect(`${target} (pass 2, schema-2)`, failures)

  await browser.close()
  await server.close()

  if (failures.length) {
    for (const f of failures) console.error(`check:browser[FAIL]: ${f}`)
    process.exit(1)
  }
  console.log('check:browser: PASS - 4 dialect states rendered in a real browser')
  console.log(`  chromium: ${execPath}`)
  console.log('  pass 1: eyestruct served row + crashtest PASS fixture + packstruct RED fixture + poststruct HTTP 404 wording')
  console.log('  pass 2: schema-2 sibling degrades to the unsupported-dialect row')

  async function renderAndCollect(label, into) {
    await page.goto(target, { waitUntil: 'networkidle2', timeout: 30000 })
    await page.waitForSelector('table.family-status tbody tr', { timeout: 15000 })
    const rows = await page.$$eval('table.family-status tbody tr', (els) =>
      els.map((tr) => tr.innerText.replace(/\s+/g, ' ').trim())
    )
    const flat = rows.join(' | ')

    check(`rows`, rows.length, 4, into, label)
    // Own row: built from the SERVED file's truth, not a hand count.
    const expectedOwn = own.legs.map((l) => `${l.leg} ${l.cases} ${l.verdict}`).join(' · ')
    check(`own row carries the served dialect leg summary`, rows.some((r) => r.includes(expectedOwn)), true, into, label)
    check(`own packs ledger count matches served`, rows.some((r) => r.includes(`${own.packs.reduce((n, p) => n + (p.cases || 0), 0)} cases`)), true, into, label)
    // Crashtest PASS fixture: the deliberately-foreign "14" proves row
    // content comes from the SERVED fixture file, not from local ledgers.
    check(`crashtest row renders the served fixture cases`, rows.some((r) => r.includes('packs 14 PASS')), true, into, label)
    // Packstruct RED fixture: the EXPLOITED leg degrades the whole row.
    check(`packstruct row renders RED from the EXPLOITED fixture`, rows.some((r) => r.includes('conformance 5 RED')), true, into, label)
    // Poststruct: pass 1 renders the honest miss wording (the clean 404,
    // with ACAO per the CORS clause); pass 2 renders the schema-2 refusal.
    if (passNo === 1) {
      check(`poststruct renders the clean 404 wording`, rows.some((r) => r.includes('not serving the dialect yet') && r.includes('404')), true, into, label)
    } else {
      check(`poststruct degrades on schema-2`, rows.some((r) => r.includes('unsupported dialect')), true, into, label)
    }
  }
}

function getLocalJson(port) {
  return new Promise((resolvePromise, rejectPromise) => {
    http
      .get({ host: '127.0.0.1', port, path: '/status.json' }, (res) => {
        let body = ''
        res.on('data', (c) => (body += c))
        res.on('end', () => {
          if (res.statusCode !== 200) return rejectPromise(new Error(`served /status.json HTTP ${res.statusCode}`))
          try {
            resolvePromise(JSON.parse(body))
          } catch (err) {
            rejectPromise(err)
          }
        })
      })
      .on('error', rejectPromise)
  })
}

function check(name, actual, expected, into, label) {
  const ok = actual === expected
  if (!ok) into.push(`${label}: ${name} - got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    console.error(`check:browser[FAIL]: ${message}`)
    process.exit(1)
  }
}

function execFileSyncChrome(cacheDir) {
  // The puppeteer cache layout: <cacheDir>/chrome/<version>/chrome-linux64/chrome
  if (!fs.existsSync(cacheDir)) return ''
  const walk = (dir, depth) => {
    if (depth > 4) return ''
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name === 'chrome') return path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const hit = walk(path.join(dir, entry.name), depth + 1)
        if (hit) return hit
      }
    }
    return ''
  }
  for (const channel of fs.readdirSync(cacheDir)) {
    const hit = walk(path.join(cacheDir, channel), 0)
    if (hit) return hit
  }
  return ''
}

main().catch((err) => {
  console.error(`check:browser[FAIL]: ${err && err.stack ? err.stack.split('\n').slice(0, 3).join('\n') : err}`)
  process.exit(1)
})
