// lib/auth.js - header/cookie injection for authenticated captures (eyestruct#54).
//
// The instance lane (look/spot/diff/walk) can capture a page only as the
// browser sees it signed-out. A dashboard behind a server-side session cookie
// then shows the gate page forever, so the interesting views can never be
// baselined. This module is the same primitive `serve --headers` already has,
// aimed at a live URL: a FILE of literal `Name: value` lines (the secret stays
// off the command line and out of shell history) or the friendly single-cookie
// `--cookie "name=value"`.
//
// It does NOT make eyestruct an auth client: no flows, no token refresh, no
// knowledge of any scheme - just the headers a human's logged-in browser would
// send. The canon lane (ratify) never rides these flags, so a committed
// baseline can never carry a session secret.

'use strict'

const fs = require('fs')
const { fail } = require('./reasons')

// RFC 7230 token: the characters a header field-name may use. A name outside
// this set (a space, a colon, a control char) is a malformed line, refused by
// name rather than silently dropped.
const TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/
// Any C0 control (including CR/LF/TAB) in a value would let a crafted file
// inject a second header or split the request - refused before it is used.
const CONTROL_RE = /[\u0000-\u001f\u007f]/

/**
 * Parse a header file's text into ordered { name, value } pairs.
 * Blank lines and `#` comments are skipped; every other line must be
 * `Name: value`. Malformed lines refuse by name - a header file that half
 * parses is a lie about what was sent.
 */
function parseHeaderLines(text, source) {
  const where = source ? ` (${source})` : ''
  const pairs = []
  const lines = String(text).split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]
    if (raw.trim() === '' || raw.trimStart().startsWith('#')) continue
    const idx = raw.indexOf(':')
    if (idx === -1) {
      fail('BAD_FLAG_VALUE', `--headers line ${i + 1} is not "Name: value"${where}`)
    }
    const name = raw.slice(0, idx).trim()
    const value = raw.slice(idx + 1).trim()
    if (!TOKEN_RE.test(name)) {
      fail('BAD_FLAG_VALUE', `--headers line ${i + 1} has an invalid header name "${name}"${where}`)
    }
    if (value === '') {
      fail('BAD_FLAG_VALUE', `--headers line ${i + 1} ("${name}") carries an empty value${where}`)
    }
    if (CONTROL_RE.test(value)) {
      fail('UNSAFE_TEXT', `--headers line ${i + 1} ("${name}") carries a control character`)
    }
    pairs.push({ name, value })
  }
  return pairs
}

/**
 * The friendly single-header case: `--cookie "a=1; b=2"` becomes one Cookie
 * pair. The value is passed through verbatim (cookies are opaque), only
 * empty and control-bearing values are refused.
 */
function parseCookie(value) {
  const v = String(value == null ? '' : value).trim()
  if (v === '') fail('BAD_FLAG_VALUE', '--cookie carries an empty value - give it name=value or drop the flag')
  if (CONTROL_RE.test(v)) fail('UNSAFE_TEXT', '--cookie carries a control character')
  return { name: 'Cookie', value: v }
}

/**
 * Resolve the instance lane's auth material into ordered pairs. The file (if
 * stated) is read and parsed, then --cookie (if stated) is appended. The
 * caller never sees the values echoed back - the count is the only outward
 * truth, so a secret can never leak into a log or a --json view.
 */
function resolveAuth({ headerFile, cookie, cwd }) {
  const pairs = []
  if (headerFile) {
    const abs = require('path').isAbsolute(headerFile) ? headerFile : require('path').join(cwd || process.cwd(), headerFile)
    let text
    try {
      text = fs.readFileSync(abs, 'utf8')
    } catch (err) {
      fail('MISSING_INPUT', `--headers file is not readable: ${headerFile} (${err.code || err.message})`)
    }
    pairs.push(...parseHeaderLines(text, headerFile))
  }
  if (cookie) pairs.push(parseCookie(cookie))
  return pairs
}

/**
 * Fold ordered pairs into the object setExtraHTTPHeaders wants. Repeated
 * Cookie headers JOIN with "; " (a browser sends one Cookie header, so two
 * sources are one header); any other repeated name takes the last value, the
 * way a later assignment would.
 */
function headerObject(pairs) {
  const out = {}
  for (const { name, value } of pairs) {
    if (name.toLowerCase() === 'cookie' && out[name] !== undefined) {
      out[name] = out[name] + '; ' + value
    } else {
      out[name] = value
    }
  }
  return out
}

module.exports = { parseHeaderLines, parseCookie, resolveAuth, headerObject }
