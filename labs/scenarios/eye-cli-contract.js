// labs/scenarios/eye-cli-contract.js - eyestruct's crashtest scenario.
//
// Attacks the REAL CLI (bin/eyestruct.js) as subprocesses - the same
// in-process-adjacent discipline the pack runner and the smoke battery
// use (no network, disposable temp dirs, fixed attack batches so the
// seed never changes what fires). The judgment contract:
//
//   never a bare stack trace; every nonzero exit carries a named
//   eyestruct[REASON_CODE]; the stdio transport only ever emits
//   JSON-lines; corrupted memory is refused, never guessed past.
//
// Verdicts: REFUSED = the contract held under the whole attack batch;
// EXPLOITED = any invocation crashed, improvised, or printed a stack
// frame (the attack achieved its goal). Evidence names the offending
// batch first so the fix is one read, never a bisect.

'use strict'

const { spawn, execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const BIN = path.join(__dirname, '..', '..', 'bin', 'eyestruct.js')

function tempRepo() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'eyestruct-crash-'))
}

function runCli(argv, cwd) {
  let out
  try {
    out = { code: 0, stdout: execFileSync(process.execPath, [BIN, ...argv], { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }) }
  } catch (err) {
    out = { code: err.status == null ? 2 : err.status, stdout: err.stdout || '', stderr: err.stderr || '' }
  }
  return out
}

function vulnerability(argv, out, extra) {
  const stderr = String(out.stderr || '')
  const bareStack = /(^|\n)\s*at /.test(stderr) || /eyestruct: internal error/.test(stderr)
  if (out.code === 0 && extra === 'EXPECT-NONZERO') {
    return `batch ${JSON.stringify(argv.slice(0, 3))}... exited 0 on hostile input`
  }
  if (out.code !== 0 && !stderr.includes('eyestruct[')) {
    return `batch ${JSON.stringify(argv.slice(0, 3))}... exited ${out.code} with no named reason code${bareStack ? ' (bare stack trace)' : ''}`
  }
  if (bareStack) return `batch ${JSON.stringify(argv.slice(0, 3))}... printed a stack frame`
  if (/(ENOENT|EHOST|EACCES|Error:)/.test(stderr) && !stderr.includes('eyestruct[')) {
    return `batch ${JSON.stringify(argv.slice(0, 3))}... leaked a raw error past the named-refusal contract`
  }
  return null // contract held for this batch
}

module.exports = {
  name: 'eye-cli-contract',
  description: 'Hostile argv, hostile stdio-MCP frames, and hostile ledger files against the real eyestruct CLI - the exit contract must hold under all of them',
  attacks: [
    {
      name: 'hostile-argv-contract',
      async run() {
        const cwd = tempRepo()
        const BATCHES = [
          ['frobnicate'],                          // unknown verb
          [''],                                    // empty verb
          ['LOOK'],                                 // case abuse
          ['gate', 'extra', 'args'],               // arity abuse
          ['ledger', 'list', '--ledger='],         // empty flag value
          ['gate', '--json', '--json'],            // flag repetition
          ['look', 'http://example.invalid', '--viewport', 'banana', '--browser-exec', '/no/such/chrome'],
          ['raster', __filename, '--renderer', 'resvg@999'],
          ['ledger', 'list', '--ledger', '/no/such/root-lab.json'],
          ['adopt'],
          ['adopt', 'x', '--note'],
          ['--'],
          ['---flag-only'],
          // Oversized argv - kept under Linux's MAX_ARG_STRLEN (128KiB): a
          // larger batch never reaches the CLI at all (execFileSync E2BIG,
          // raw OS stderr, no verdict about the contract is possible) and
          // the first run mislabeled that harness limit as an exploit.
          ['gate', 'x'.repeat(100 * 1024)],
        ]
        let took = 0
        const holes = []
        for (const argv of BATCHES) {
          took++
          const out = runCli(argv, cwd)
          const hole = vulnerability(argv, out, 'EXPECT-NONZERO')
          if (hole) holes.push(hole)
        }
        fs.rmSync(cwd, { recursive: true, force: true })
        if (holes.length) {
          return { verdict: 'EXPLOITED', detail: holes[0], attack: 'hostile-argv-contract', tookRequests: took, evidence: { holes } }
        }
        return { verdict: 'REFUSED', detail: `${BATCHES.length} hostile argv batches: every nonzero exit carried a named eyestruct[REASON_CODE], zero stack frames`, attack: 'hostile-argv-contract', tookRequests: took }
      },
    },
    {
      name: 'mcp-stdio-flood',
      async run() {
        const cwd = tempRepo()
        const child = spawn(process.execPath, [BIN, 'mcp'], { cwd, stdio: ['pipe', 'pipe', 'pipe'] })
        // The exit receipt is registered at spawn - the transport can end
        // before the post-flood checks finish, and a listener attached
        // after a fired 'close' never resolves (the first run's HUNG row
        // was exactly that bug in THIS attack, receipts: the bisect probes
        // all closed clean in 300ms). Hangup exit 0 is clean; 1 means a
        // refusal rode the exit code (a tool verdict, not a crash); any
        // other exit or the kill timer is a hole.
        const exitReceipt = new Promise((resolve) => {
          child.on('close', (code) => resolve(code))
        })
        const FRAMES = [
          { jsonrpc: '2.0', id: 1, method: 'initialize', params: {} },            // the one legitimate shape
          'not json at all',                                                       // garbage line
          JSON.stringify({ jsonrpc: '2.0', id: 2 }),                               // missing method
          '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"adopt","arguments":{"artifact":"a","__proto__":{"polluted":true}}}}', // pollution hill, as raw JSON
          { jsonrpc: '2.0', method: 'frames/flood-huge', params: { blob: 'q'.repeat(200 * 1024) }, id: 4 }, // oversized
          JSON.stringify({ jsonrpc: '2.0', method: null, id: 5 }),                 // null method
          JSON.stringify({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: null }), // null params
          JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'gate' } }), // gate without seed
        ]
        const holes = []
        const outLines = []
        let buf = ''
        child.stdout.setEncoding('utf8')
        child.stdout.on('data', (chunk) => {
          buf += chunk
          let idx
          while ((idx = buf.indexOf('\n')) !== -1) {
            outLines.push(buf.slice(0, idx))
            buf = buf.slice(idx + 1)
          }
        })
        const idle = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

        // The legit frame waits for its exact response; garbage floods wait
        // for any stderr settlement. Protocol shape: id frames answered,
        // dicts stay dicts, stack frames never appear - the smoke battery
        // pins the happy path, this attack pins the hostile path.
        child.stdin.write(JSON.stringify(FRAMES[0]) + '\n')
        await idle(500)
        child.stdin.end(
          FRAMES.slice(1).map((f) => (typeof f === 'string' ? f : JSON.stringify(f))).join('\n') + '\n',
        )
        await idle(1200)

        let took = 0
        for (const line of outLines) {
          took++
          let parsed = null
          try {
            parsed = JSON.parse(line)
          } catch {
            holes.push(`stdout emitted a non-JSON line: ${line.slice(0, 80)}`)
            continue
          }
          if (parsed && typeof parsed !== 'object') {
            holes.push(`stdout emitted a scalar instead of a JSON-RPC message`)
          }
          if (line.includes('\n    at ') || /eyestruct: internal error/.test(line)) {
            holes.push('a stack frame leaked through the transport')
          }
        }
        if (({}).polluted !== undefined) holes.push('parent scope was polluted through the params hill')
        await idle(400)
        const killTimer = setTimeout(() => { try { child.kill('SIGKILL') } catch {} }, 5000)
        const exitCode = await exitReceipt
        clearTimeout(killTimer)
        if (!(exitCode === 0 || exitCode === 1)) {
          holes.push(`transport ended on a non-contract exit (${String(exitCode)}) after stdin hangup`)
        }
        fs.rmSync(cwd, { recursive: true, force: true })
        if (holes.length) {
          return { verdict: 'EXPLOITED', detail: holes[0], attack: 'mcp-stdio-flood', tookRequests: took, evidence: { lines: outLines.length, holes } }
        }
        return { verdict: 'REFUSED', detail: `${outLines.length} responses to ${FRAMES.length} frames: every stdout line was a JSON object, no stack frames, clean exit on hangup`, attack: 'mcp-stdio-flood', tookRequests: took }
      },
    },
    {
      name: 'ledger-hostile-parse',
      async run() {
        const cwd = tempRepo()
        const eyeDir = path.join(cwd, 'labs', '.eyes')
        fs.mkdirSync(path.join(eyeDir, 'home'), { recursive: true })
        const manifest = 'pin:\n  browser-image: crash-fixture:1\n  renderer: resvg@2.6.2\nroutes:\n  - path: /\n    name: home\n    view: desktop-1280\n'
        fs.writeFileSync(path.join(eyeDir, 'manifest.yml'), manifest)
        fs.writeFileSync(path.join(eyeDir, 'home', 'current.png'), 'pngish')
        const variants = [
          '{not json',
          '{"rows":[1,2,3]}',                                                                        // object where array lives
          '[{"id":null,"ts":1}]',                                                                    // null id
          '[{"id":"row-0001","ts":1,"__proto__":{"poisoned":true}},{"id":"row-0002","ts":2,"__proto__":{"poisoned":true}}]', // pollution rows
          JSON.stringify(Array.from({ length: 5000 }, () => ({ id: 'row-0001', ts: 1, agent: 'flood', commit: 'c', artifact: 'home/current.png', type: 'look', note: 'mass duplicate ids - history laundering at scale' }))), // 5000 rows, all one id
          '\\ufeff["row"]',                                                                            // BOM prefix
        ]
        let took = 0
        const holes = []
        for (const ledger of variants) {
          took++
          fs.writeFileSync(path.join(eyeDir, 'ledger.json'), ledger)
          const out = runCli(['gate'], cwd)
          const stderr = String(out.stderr || '')
          const bare = /(^|\n)\s*at /.test(stderr) || /eyestruct: internal error/.test(stderr)
          if (out.code === 0) {
            holes.push(`ledger variant ${JSON.stringify(ledger.slice(0, 40))}... was guessed past (gate exited 0)`)
          } else if (!stderr.includes('eyestruct[')) {
            holes.push(`ledger variant ${JSON.stringify(ledger.slice(0, 40))}... refused with no named code: ${stderr.slice(0, 120)}`)
          } else if (bare) {
            holes.push(`ledger variant ${JSON.stringify(ledger.slice(0, 40))}... refused but printed a stack frame`)
          }
        }
        if (({}).poisoned !== undefined) holes.push('proto-pollution reached the runner scope')
        fs.rmSync(cwd, { recursive: true, force: true })
        if (holes.length) {
          return { verdict: 'EXPLOITED', detail: holes[0], attack: 'ledger-hostile-parse', tookRequests: took, evidence: { holes } }
        }
        return { verdict: 'REFUSED', detail: `${variants.length} hostile ledger variants: every one refused with a named eyestruct[REASON_CODE], zero stack frames, zero pollution`, attack: 'ledger-hostile-parse', tookRequests: took }
      },
    },
  ],
}
