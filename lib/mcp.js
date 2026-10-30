// eyestruct mcp - the stdio MCP surface. THE PRINCIPLE: the CLI is the
// contract, the MCP server is a decoding of it - same verbs, same named
// reason-codes, same exit CONTRACT semantics mapped to MCP tool errors,
// and never a process exit inside a server (`fail()` throws FailError;
// the boundary here converts it, exactly like bin/eyestruct.js does).
//
// Transport: newline-delimited JSON-RPC 2.0 over stdio (the MCP stdio
// transport shape). Zero dependencies; the verbs are the library modules
// the CLI itself calls - one writer of truth per store, always.
//
// Perception follows the CORE LAW (smallest artifact that answers the
// question): `look` returns the element map + meta by DEFAULT; the pixels
// ride as image content only when the client asks (include_image). An
// image-capable model burns the pixels when it needs them; a metric-only
// query never pays for them.
//
// Tools:
//   look(url, viewport?, theme?, region?, include_image?)
//   diff(url, against?, viewport?, theme?)
//   adopt(artifact, note)          -> unratified proposal, canon CI-cut
//   ratify(base_url)               -> re-capture vs baseline (CI-cut proof)
//   ledger_list(route?) | ledger_show(id)
//   gate() | raster(files[]?) | walk(base_url)

'use strict'

const crypto = require('node:crypto')
const fs = require('fs')
const path = require('path')
const { flagValue } = require('./flags')

const { FailError } = require('./reasons')

// The newline-delimited transport's pending-buffer ceiling: the transport
// refuses BEFORE accumulation rather than growing an unbounded string.
const FRAME_CAP = 1024 * 1024

function readStdinLines(onLine, onEnd, onOverflow) {
  let chunk = ''
  let overflowed = false
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (d) => {
    if (overflowed) return
    chunk += d
    // The pending buffer is BOUNDED: a client that pipes bytes without a
    // newline is not sending a message, it is drowning the transport -
    // unbounded string growth here was an OOM the newline-delimited contract
    // never asked for (the frame-bomb walk round). 1 MiB is a very generous
    // ceiling for a tools/call frame (urls, paths, flag strings); anything
    // longer refuses by name before accumulation.
    if (chunk.length > FRAME_CAP) {
      overflowed = true
      chunk = ''
      if (onOverflow) onOverflow(FRAME_CAP)
      return
    }
    let i
    while ((i = chunk.indexOf('\n')) !== -1) {
      const line = chunk.slice(0, i).trim()
      chunk = chunk.slice(i + 1)
      if (line) onLine(line)
    }
  })
  process.stdin.on('end', onEnd)
}

function manifestRead(cwd, ctx) {
  return require('./manifest').read(cwd, ctx || {})
}

function engine() {
  const engine = require('./engine')
  if (typeof engine.capture !== 'function') throw new FailError('MISSING_PINNED_BROWSER')
  return engine
}

// --- Verb decodings (library-level, never a subprocess) --------------------

const DEFAULT_VIEWPORT = '1280x800'
const DEFAULT_BASE_URL = 'http://localhost:5178'

async function toolLook(cwd, args) {
  const m = manifestRead(cwd, {})
  const url = args.url
  if (!url) throw new FailError('UNKNOWN_COMMAND', 'look needs an http(s) or file:// url')
  const includeImage = !!args.include_image
  let file = null
  const cap = await engine().capture({
    url,
    argv: [],
    pin: m.pin,
    viewport: args.viewport || DEFAULT_VIEWPORT,
    theme: args.theme,
    region: args.region,
    noOverlay: !!args.no_overlay,
    format: args.format,
    quality: args.quality,
    fullPage: !!args.full_page,
  })
  const candDir = path.join(cwd, 'labs/.eyes-candidates')
  fs.mkdirSync(candDir, { recursive: true })
  // Unique per capture: Date.now() % 100000 reused ONE name for ~100s, so
  // two looks inside the window silently overwrote each other's candidate
  // evidence (the walk finding, fixed). randomBytes names - the same recipe
  // the ledger's temp writer uses - keep every candidate its own receipt.
  if (includeImage) {
    const base = `mcp-look-${crypto.randomBytes(6).toString('hex')}.${args.format === 'webp' ? 'webp' : 'png'}`
    fs.writeFileSync(path.join(candDir, base), cap.png)
    file = path.join(candDir, base)
  }
  const content = [{
    type: 'text',
    text: JSON.stringify({
      verdict: 'captured',
      bytes: cap.png.length,
      elementsMapped: cap.map.length,
      version: cap.version,
      map: cap.map,
      note: 'candidate artifact; baseline + ledger go through adopt',
    }, null, 2),
  }]
  if (includeImage) {
    content.push({ type: 'image', data: Buffer.from(cap.png).toString('base64'), mimeType: 'image/png' })
  }
  return content
}

async function toolDiff(cwd, args) {
  const m = manifestRead(cwd, {})
  const url = args.url || DEFAULT_BASE_URL + '/'
  const eyesDir = path.dirname(m.file)
  let baselineFile
  if (args.against) {
    // Same confinement the CLI's ledger reader enforces (UNSAFE_PATH): the
    // baseline is an eyes-relative artifact path, never an absolute path and
    // never carrying .. segments - a client-supplied escape must refuse by
    // name, not hand diff an arbitrary file on disk.
    if (require('./ledger').artifactEscapes(args.against)) {
      throw new FailError('UNSAFE_PATH', `the diff baseline stays eyes-relative (against: "${String(args.against)}")`)
    }
    baselineFile = path.join(eyesDir, args.against)
  } else {
    // The default baseline is the manifest's first route slot, named by
    // ratify.slotDir - THE shared canon-slot reader (the third hand-copy
    // of the derivation used to live here as slotOfFirst; names arrived at
    // through one reader, never re-derived per lane). An empty manifest
    // keeps its named refusal (the guard slotOfFirst carried).
    if (!m.routes.length) throw new FailError('NO_BASELINE', 'manifest declares no routes')
    baselineFile = path.join(eyesDir, require('./ratify').slotDir(m.routes[0]), 'current.png')
  }
  if (!fs.existsSync(baselineFile)) throw new FailError('NO_BASELINE', path.relative(cwd, baselineFile))
  const cap = await engine().capture({
    url,
    argv: [],
    pin: m.pin,
    viewport: args.viewport || DEFAULT_VIEWPORT,
    theme: args.theme,
  })
  const baseBytes = fs.statSync(baselineFile).size
  // Byte equality, not byte-COUNT equality: the tool's own contract says
  // SAME means the captures are byte-identical, and two different pixel
  // states can share a PNG length (the toolDiff doc line promised byte
  // equality; the walk found the implementation carrying only lengths). The
  // full read is the honest verdict.
  const same = Buffer.from(cap.png).equals(fs.readFileSync(baselineFile))
  return [{
    type: 'text',
    text: JSON.stringify({
      verdict: same ? 'SAME' : 'DIFFERS',
      bytes: { baseline: baseBytes, fresh: cap.png.length },
      elementsMapped: cap.map.length,
      note: same
        ? 'fresh capture matches the committed baseline byte for byte (memory is honest)'
        : 'drift! the NEXT step is diff/adopt in the CLI - a local DIFFERS becomes canon only via adopt + CI-cut',
    }, null, 2),
  }]
}

function toolAdopt(cwd, args) {
  const ledger = require('./ledger')
  if (!args.artifact) throw new FailError('UNKNOWN_COMMAND', 'adopt needs the artifact target (route/view or slot/current.png)')
  const note = args.note // enforce at the same surface the CLI does
  if (!note || !note.trim()) throw new FailError('ADOPT_NOTE_REQUIRED')
  const row = ledger.append(ledger.ledgerPath(cwd, {}), {
    type: 'adopt',
    agent: require('./identity').agent(),
    commit: require('./identity').commit(),
    artifact: args.artifact,
    note,
    ratified: false,
  })
  return [{ type: 'text', text: JSON.stringify({ proposed: row.id, ratified: false }, null, 2) }]
}

async function toolRatify(cwd, args) {
  const m = manifestRead(cwd, {})
  if (!m.routes.length) throw new FailError('WALK_EMPTY')
  const base = args.base_url || DEFAULT_BASE_URL
  const engineImpl = engine()
  const verified = []
  const unverified = []
  for (const route of m.routes) {
    const slug = (route.path === '/' ? 'home' : route.path.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')) || 'page'
    const slot = `${slug}/${route.view}`
    const baseline = path.join(path.dirname(m.file), slot, 'current.png')
    if (!fs.existsSync(baseline)) { unverified.push({ slot, reason: 'NO_BASELINE' }); continue }
    const cap = await engineImpl.capture({ url: (base.endsWith('/') ? base.slice(0, -1) : base) + route.path, argv: [], pin: m.pin, viewport: route.viewport, theme: route.theme })
    const same = Buffer.from(cap.png).equals(fs.readFileSync(baseline))
    if (!same) { unverified.push({ slot, reason: 'DIFFERS' }); continue }
    const ledger = require('./ledger')
    const row = ledger.append(ledger.ledgerPath(cwd, {}), {
      type: 'ratify',
      agent: require('./identity').agent(),
      commit: require('./identity').commit(),
      artifact: `${slot}/current.png`,
      note: `reproduced byte-identical (${fs.statSync(baseline).size}B) in the pinned environment (mcp)`,
      pin: m.pin['browser-image'],
      verified: true,
    })
    verified.push({ slot, row: row.id })
  }
  return [{
    type: 'text',
    text: JSON.stringify({ verdict: unverified.length ? 'NOT_REPRODUCIBLE' : 'REPRODUCED', verified, unverified }, null, 2),
  }]
}

function toolLedgerList(cwd, args) {
  const ledger = require('./ledger')
  let rows = ledger.load(ledger.ledgerPath(cwd, {}))
  if (args && args.route) rows = rows.filter((r) => r.artifact && String(r.artifact).includes(args.route))
  return [{ type: 'text', text: JSON.stringify(rows.map((r) => ({ id: r.id, type: r.type, artifact: r.artifact, note: r.note, ratified: r.ratified, verified: r.verified })), null, 2) }]
}

function toolLedgerShow(cwd, args) {
  const ledger = require('./ledger')
  const rows = ledger.load(ledger.ledgerPath(cwd, {}))
  // Same split the CLI owns: a missing id is a shape problem, a stated id
  // nothing carries is ROW_MISSING (a lookup miss, not DANGLING_ROW).
  if (!args.id) throw new FailError('UNKNOWN_COMMAND', 'ledger_show needs the row id')
  const row = rows.find((r) => r.id === args.id)
  if (!row) throw new FailError('ROW_MISSING', String(args.id))
  return [{ type: 'text', text: JSON.stringify(row, null, 2) }]
}

function toolGate(cwd) {
  const gate = require('./gate')
  const captured = captureStdoutQuietly(() => gate.run({ cwd, json: true }))
  let parsed = null
  try { parsed = JSON.parse(captured.out) } catch { /* keep the raw shape */ }
  return [{ type: 'text', text: JSON.stringify({ code: captured.code, gate: parsed || captured.out.trim() }, null, 2) }]
}

function toolRaster(cwd, args) {
  const raster = require('./raster')
  const files = (args && Array.isArray(args.files)) ? args.files : []
  const captured = captureStdoutQuietly(() => raster.run({ cwd, json: true, argv: files }))
  return [{ type: 'text', text: JSON.stringify({ code: captured.code, out: captured.out.trim() }, null, 2) }]
}

async function toolWalk(cwd, args) {
  const m = manifestRead(cwd, {})
  if (!m.routes.length) throw new FailError('WALK_EMPTY')
  const base = args.base_url || DEFAULT_BASE_URL
  const engineImpl = engine()
  // The candidate name is WALK'S named reader (walk.candidateName), never a
  // re-derived inline copy: this tool used to re-derive the slug pattern and
  // was BLIND to the slot: override - the MCP lane and the CLI lane named the
  // same routes differently, which is the drift the one-reader rule exists to
  // kill. The slot: shape itself is parser-jailed (MANIFEST_CORRUPT), so the
  // value reaching here is a page name, not a pathometas injection.
  const candidate = require('./walk').candidateName
  const rows = []
  for (const route of m.routes) {
    const url = /^(https?:\/\/)/i.test(route.path) ? route.path : (base.endsWith('/') ? base.slice(0, -1) : base) + route.path
    const cap = await engineImpl.capture({ url, argv: [], pin: m.pin, viewport: route.viewport, theme: route.theme })
    const candDir = path.join(cwd, 'labs/.eyes-candidates')
    fs.mkdirSync(candDir, { recursive: true })
    const file = path.join(candDir, candidate(route))
    fs.writeFileSync(file, cap.png)
    rows.push({ route: route.path, view: route.view, file: path.relative(cwd, file), bytes: cap.png.length, mapped: cap.map.length })
  }
  return [{ type: 'text', text: JSON.stringify({ walked: rows.length, rows }, null, 2) }]
}

// The agent-eyes MCP verb (the instance loop): one capture, ALWAYS saved to
// a file path the agent can open with its own vision on a later turn - the
// difference from look is the loop contract, not the pixels. Candidate-only;
// the canon stays CI-cut (the two-dispatch rule).
async function toolSpot(cwd, args) {
  const m = manifestRead(cwd, {})
  const url = args.url
  if (!url) throw new FailError('UNKNOWN_COMMAND', 'spot needs an http(s) or file:// url')
  const cap = await engine().capture({
    url,
    argv: [],
    pin: m.pin,
    viewport: args.viewport || DEFAULT_VIEWPORT,
    theme: args.theme,
    region: args.region,
    noOverlay: !!args.no_overlay,
    format: args.format,
    quality: args.quality,
    fullPage: !!args.full_page,
    settle: !!args.settle,
  })
  const candDir = path.join(cwd, 'labs/.eyes-candidates')
  fs.mkdirSync(candDir, { recursive: true })
  const base = `spot-mcp-${crypto.randomBytes(6).toString('hex')}.${args.format === 'webp' ? 'webp' : 'png'}`
  const file = path.join(candDir, base)
  fs.writeFileSync(file, cap.png)
  const content = [{
    type: 'text',
    text: JSON.stringify({
      verdict: 'captured',
      file: path.relative(cwd, file),
      bytes: cap.png.length,
      elementsMapped: cap.map.length,
      version: cap.version,
      map: cap.map,
      note: 'candidate artifact; open this PNG with your own vision - the loop is serve -> spot -> read -> act -> re-spot (canon stays CI-cut)',
    }, null, 2),
  }]
  if (args.include_image) {
    content.push({ type: 'image', data: Buffer.from(cap.png).toString('base64'), mimeType: 'image/png' })
  }
  return content
}

const TOOLS = [
  {
    name: 'look',
    description: 'Capture real pixels of a surface through the pinned browser: one pass yields the element map (+ optional image), never a second render',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'http(s) or file:// target' },
        viewport: { type: 'string', description: 'WxH (default 1280x800)' },
        theme: { type: 'string', enum: ['dark', 'light'] },
        region: { type: 'string', description: 'CSS selector for the cheap layer' },
        include_image: { type: 'boolean', description: 'pay the pixel cost: attach the PNG' },
        no_overlay: { type: 'boolean', description: 'clean capture: omit the element-id overlay from the pixels; the element map still returns' },
        full_page: { type: 'boolean', description: 'capture the full document height at the viewport width (the map lifts past the fold); review artifact, weak baseline' },
        format: { type: 'string', enum: ['png', 'webp'], description: 'output format (default png)' },
        quality: { type: 'integer', description: 'webp lossy quality 1-100 (refused with png)' },
      },
      required: ['url'],
    },
    run: toolLook,
  },
  {
    name: 'diff',
    description: 'Fresh capture vs committed baseline; SAME/DIFFERS by byte equality inside the pin',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        against: { type: 'string', description: 'eyes-relative artifact path (default the manifest first route)' },
        viewport: { type: 'string' },
        theme: { type: 'string', enum: ['dark', 'light'] },
      },
    },
    run: toolDiff,
  },
  {
    name: 'adopt',
    description: 'Propose a baseline change. Canon is CI-cut: proposals ride ratified:false until the pinned environment reproduces them',
    inputSchema: {
      type: 'object',
      properties: { artifact: { type: 'string' }, note: { type: 'string' } },
      required: ['artifact', 'note'],
    },
    run: toolAdopt,
  },
  {
    name: 'ratify',
    description: 'Re-capture every manifested route in the pinned env; byte-identical slots ride append-only ratify rows (CI-cut proof)',
    inputSchema: {
      type: 'object',
      properties: { base_url: { type: 'string' } },
    },
    run: toolRatify,
  },
  {
    name: 'ledger_list',
    description: 'The committed memory: every ledger row, optional artifact filter',
    inputSchema: { type: 'object', properties: { route: { type: 'string' } } },
    run: toolLedgerList,
  },
  {
    name: 'ledger_show',
    description: 'One ledger row, complete',
    inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] },
    run: toolLedgerShow,
  },
  {
    name: 'gate',
    description: 'The CI job: exit-contract verdict on unexplained labs/.eyes drift',
    inputSchema: { type: 'object' },
    run: toolGate,
  },
  {
    name: 'raster',
    description: 'Strict parse + render + byte-size sanity for committed renderables (SVG stones)',
    inputSchema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string' } } } },
    run: toolRaster,
  },
  {
    name: 'walk',
    description: 'Every route x viewport x theme in the manifest, one pass, proof images in labs/.eyes-candidates/',
    inputSchema: { type: 'object', properties: { base_url: { type: 'string' } } },
    run: toolWalk,
  },
  {
    name: 'spot',
    description: 'The agents-vision loop step: one capture saved to a file path the agent re-opens with its own vision (serve -> spot -> read -> act -> re-spot); candidate-only',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'http(s) or file:// target' },
        viewport: { type: 'string', description: 'WxH (default 1280x800)' },
        theme: { type: 'string', enum: ['dark', 'light'] },
        region: { type: 'string', description: 'CSS selector for the cheap layer' },
        include_image: { type: 'boolean', description: 'also attach the PNG inline' },
        no_overlay: { type: 'boolean', description: 'clean capture: omit the element-id overlay from the pixels; the element map still returns' },
        full_page: { type: 'boolean', description: 'capture the full document height at the viewport width; review artifact, weak baseline' },
        settle: { type: 'boolean', description: 'walk the document to the bottom and wait for lazy images before capturing (instance-lane only; fixes blank below-fold content)' },
        format: { type: 'string', enum: ['png', 'webp'], description: 'output format (default png)' },
        quality: { type: 'integer', description: 'webp lossy quality 1-100 (refused with png)' },
      },
      required: ['url'],
    },
    run: toolSpot,
  },
]

// --- The JSON-RPC surface ---------------------------------------------------

const SERVER_INFO = { name: 'eyestruct', version: require('../package.json').version }
const PROTOCOL_VERSION = '2024-11-05'

function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }, null, 0) + '\n')
}

function toolErr(id, code, message) {
  process.stdout.write(JSON.stringify({
    jsonrpc: '2.0', id,
    result: { isError: true, content: [{ type: 'text', text: message }] },
  }, null, 0) + '\n')
}

let stopped = false

/**
 * CLI verbs print to the stream; inside a JSON-RPC tunnel that stdout is
 * FRAMING, not output. Capture it, return to the caller as part of the tool
 * result, and keep the transport honest - a stray console line inside the
 * stdio channel would read as a JSON-RPC parse error on the client side.
 */
function captureStdoutQuietly(fn) {
  const realWrite = process.stdout.write
  const bufferedOutput = []
  process.stdout.write = function (string, a, b, c) {
    bufferedOutput.push(String(string))
    return true
  }
  let code = 0
  try {
    code = Number(fn()) || 0
  } finally {
    process.stdout.write = realWrite
  }
  return { code: code, out: bufferedOutput.join('') }
}

function startServer(cwd) {
  // Promise resolves on transport EOF, so the CLI boundary stays the owner
  // of process lifetime (the bin awaits it, then applies the exit contract).
  // The overflow close resolves 1: a refusal drop, not a clean EOF - the
  // reply already named the cause on the stream.
  return new Promise((resolve) => {
    readStdinLines((line) => {
    if (stopped) return
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'parse error (a request line was not JSON)' } }, null, 0) + '\n')
      return
    }
    // A frame that parses as JSON but is not a JSON-RPC object (a bare
    // `null`, an array, a string) is refused by NAME on the same stream -
    // the stdin callback must never throw, because an uncaught exception
    // here kills the whole server mid-session (the hardening-walk fixing
    // of the catch-class pair: null frame + tools/call without params).
    if (!msg || typeof msg !== 'object' || Array.isArray(msg) || typeof msg.method !== 'string') {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: (msg && typeof msg === 'object' && !Array.isArray(msg) && msg.id) || null, error: { code: -32600, message: 'invalid request: not a JSON-RPC 2.0 message with a string method' } }, null, 0) + '\n')
      return
    }
    const { id, method, params } = msg
    if (method === 'initialize') {
      reply(id, { protocolVersion: PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: SERVER_INFO })
      return
    }
    if (method === 'notifications/initialized') {
      // A JSON-RPC notification: intentionally un-answered. Staying
      // silent here is the protocol, not a bug.
      return
    }
    if (method === 'ping') {
      reply(id, {})
      return
    }
    if (method === 'tools/list') {
      reply(id, {
        tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
      })
      return
    }
    if (method === 'tools/call') {
      const p = (params && typeof params === 'object' && !Array.isArray(params)) ? params : null
      if (!p) {
        toolErr(id, '-32602', 'tools/call needs a params object naming a tool')
        return
      }
      const tool = TOOLS.find((t) => t.name === p.name)
      if (!tool) {
        toolErr(id, '-32602', `unknown tool: ${typeof p.name === 'string' ? p.name : '?'}`)
        return
      }
      const toolArgs = (p.arguments && typeof p.arguments === 'object' && !Array.isArray(p.arguments)) ? p.arguments : {}
      Promise.resolve()
        .then(() => tool.run(cwd, toolArgs))
        .then((content) => reply(id, { content }))
        .catch((err) => {
          if (err instanceof FailError) toolErr(id, '-32603', err.message)
          else toolErr(id, '-32603', `internal error: ${err && err.message}`)
        })
      return
    }
    toolErr(id, '-32601', `unknown method: ${method}`)
  }, () => {
    resolve(0)
  }, (cap) => {
    // The frame bomb: bytes without a newline are a broken client, not a
    // message. One named reply, then the transport stops reading - a well-
    // behaved client never sends a line this long (the tools take urls,
    // paths, and flag strings, a fraction of the 1 MiB cap).
    stopped = true
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0', id: null,
      error: { code: -32700, message: `parse error: the transport refuses frames over the ${(cap / 1024 / 1024).toFixed(0)} MiB newline buffer cap - send one newline-delimited request per line, not an unterminated byte flood` },
    }, null, 0) + '\n')
    resolve(1)
  })
  })
}

module.exports = { startServer, TOOLS, SERVER_INFO }

if (require.main === module) {
  startServer(process.cwd() || '.')
}
