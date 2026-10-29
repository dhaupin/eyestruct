// The labs/.eyes/ledger.json read/write memory. Append-only rows:
//   { id, ts, agent, commit, artifact, type, note, ratified?, tolerance? }
// `tolerance` (optional) receipts a pixel-eq-at-bounded-span pledge: the row
// carries the manifest profile VERBATIM (the flat shape T-T3's field ruling
// picked - the jail reads flat rows), and absent fields read strict, so old
// copies of the ledger stay readable by new code and never gain meaning.
// plus the churn-wave row type:
//   { ..., type: 'wave', artifacts: [slot/current.png, ...] }//  one note explaining N image changes landed in the same commit - so
// truth-in-ledger survives a wave of captures without N identical notes.
// Mirrors crashtest's crashledger semantics: rows explain themselves, the
// committed baseline is canon, CI fails on unexplained drift.
//
// Corrupt ledger -> LEDGER_CORRUPT (exit 2): the reader refuses loudly, it
// never guesses past a bad row (the vant inspect receipt).
// Path confinement -> UNSAFE_PATH (exit 1): artifact paths are eyes-relative
// by contract (every writer emits them that way), so a row that arrives
// absolute or carrying `..` segments is refused - write time via append, and
// read time via load, so a hand-edited ledger cannot aim gate/diff at
// anything outside the eyes home (the hardening-walk ruling, UNSAFE_PATH).

'use strict'

const fs = require('fs')
const path = require('path')
const { fail } = require('./reasons')

function ledgerPath(cwd, flags) {
  return path.resolve(cwd, flags.ledger || 'labs/.eyes/ledger.json')
}

/**
 * The eyes-relative path contract: a row artifact is a path INSIDE the eyes
 * home, written eyes-relative. Absolute paths (posix or win32 drive/UNC) and
 * any `..` segment are escapes, not paths - refused with UNSAFE_PATH at both
 * the write surface and every read surface.
 */
function artifactEscapes(p) {
  if (typeof p !== 'string' || !p.trim()) return true
  if (p.startsWith('/') || p.startsWith('\\\\') || /^[a-zA-Z]:[\\/]/.test(p)) return true
  return p.split(/[\\/]/).includes('..')
}

function refuseRowPath(where, p) {
  fail('UNSAFE_PATH', `ledger path escapes the eyes home (${where}: "${p}")`)
}

function load(file) {
  let raw = null
  try {
    raw = fs.readFileSync(file, 'utf8')
  } catch {
    return []
  }
  let rows
  try {
    rows = JSON.parse(raw)
  } catch {
    fail('LEDGER_CORRUPT', file)
  }
  if (!Array.isArray(rows)) fail('LEDGER_CORRUPT', file + ' (not an array)')
  for (const row of rows) {
    if (!row || typeof row !== 'object') fail('LEDGER_CORRUPT', file + ' (bad row)')
    const need = row.type === 'wave'
      ? ['id', 'ts', 'agent', 'commit', 'type', 'note']
      : ['id', 'ts', 'agent', 'commit', 'artifact', 'type', 'note']
    for (const k of need) {
      if (!(k in row)) fail('LEDGER_CORRUPT', file + ` (row ${row.id || '?'} missing ${k})`)
    }
    if (row.type === 'wave') {
      if (!Array.isArray(row.artifacts) || !row.artifacts.length || !row.artifacts.every((a) => typeof a === 'string' && a.trim())) {
        fail('LEDGER_CORRUPT', file + ` (row ${row.id || '?'} is a wave without a useable artifacts array)`)
      }
      for (const a of row.artifacts) {
        if (artifactEscapes(a)) refuseRowPath(`row ${row.id} wave artifact`, a)
      }
    } else if (artifactEscapes(row.artifact)) {
      refuseRowPath(`row ${row.id} artifact`, row.artifact)
    }
  }
  const seen = new Set()
  for (const row of rows) {
    if (seen.has(row.id)) fail('LEDGER_CORRUPT', file + ` (duplicate row id ${row.id})`)
    seen.add(row.id)
  }
  return rows
}

function newId(rows) {
  let n = rows.length + 1
  let id = `row-${String(n).padStart(4, '0')}`
  const taken = new Set(rows.map((r) => r.id))
  while (taken.has(id)) id = `row-${String(++n).padStart(4, '0')}`
  return id
}

const ROW_STRINGS = ['id', 'agent', 'commit', 'artifact', 'type', 'note', 'tolerance']

function assertClean(row) {
  // The text-leg guard, applied at the ONLY ledger write surface: control
  // characters in any row string are structurally impossible for a real
  // agent and poison every reader downstream (the gistory WAF rule).
  for (const key of ROW_STRINGS) {
    if (!(key in row)) continue
    const v = row[key]
    if (typeof v === 'string' && /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(v)) {
      fail('UNSAFE_TEXT', `row field "${key}" carries a control character`)
    }
  }
  if (Array.isArray(row.artifacts)) for (const a of row.artifacts) {
    if (typeof a === 'string' && /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(a)) {
      fail('UNSAFE_TEXT', 'wave row artifacts entry carries a control character')
    }
    if (artifactEscapes(a)) refuseRowPath('wave artifact on append', a)
  }
  if ('artifact' in row && artifactEscapes(row.artifact)) refuseRowPath('artifact on append', String(row.artifact))
}

/**
 * Append atomically (temp file + rename). The ledger NEVER rewrites existing
 * rows - only rows the caller appends are new, by construction.
 */
function append(file, row) {
  assertClean(row)
  const rows = load(file)
  row.id = row.id || newId(rows)
  row.ts = row.ts || (rowTs())
  rows.push(row)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // The temp file is created fresh under 'wx' (fails if ANYTHING exists at
  // the name, including a symlink): an attacker who could pre-place a symlink
  // at a guessable temp path would otherwise redirect the ledger write
  // outside the eyes home at rename time (the hardening-walk edge).
  for (;;) {
    const tmp = `${file}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`
    try {
      fs.writeFileSync(tmp, JSON.stringify(rows, null, 2) + '\n', { flag: 'wx' })
      fs.renameSync(tmp, file)
      break
    } catch (err) {
      if (err && err.code === 'EEXIST') continue // name collision only; retry with a fresh suffix
      throw err
    }
  }
  return row
}

function rowTs() {
  // Deterministic-ish stamp; the ledger records wall time, not the capture
  // (captures must be reproducible; the ledger does not).
  return Date.now()
}

/** Every artifact path that has at least one row, and rows by artifact. */
function byArtifact(rows) {
  const map = new Map()
  const cite = (key, row) => {
    const list = map.get(key) || []
    list.push(row)
    map.set(key, list)
  }
  for (const row of rows) {
    if (row.artifact) cite(row.artifact, row)
    if (Array.isArray(row.artifacts)) for (const a of row.artifacts) cite(a, row)
  }
  return map
}

module.exports = { ledgerPath, load, append, newId, byArtifact, artifactEscapes }
