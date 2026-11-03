// tests/auth.test.js - header/cookie injection for authenticated captures
// (eyestruct#54). Behavior-only, temp dirs, no browser, no network: the auth
// material is pure parsing + resolution, so it is proven without the pinned
// browser the CI job does not have.
//
// The law under test: a header file that half-parses is a lie about what was
// sent, so every malformed line refuses BY NAME; and a secret value never
// travels outward - only the count does.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const auth = require('../lib/auth')

function tmpFile(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'eye-auth-'))
  const file = path.join(dir, 'hdrs')
  fs.writeFileSync(file, body)
  return file
}

test('parseHeaderLines: literal "Name: value" lines become ordered pairs', () => {
  const pairs = auth.parseHeaderLines('Cookie: sess=abc\nX-Lab: eyes\n')
  assert.deepStrictEqual(pairs, [
    { name: 'Cookie', value: 'sess=abc' },
    { name: 'X-Lab', value: 'eyes' },
  ])
})

test('parseHeaderLines: blank lines and # comments are skipped', () => {
  const pairs = auth.parseHeaderLines('# the session cookie\n\nCookie: a=1\n\n# trailing\nX: y\n')
  assert.deepStrictEqual(pairs, [
    { name: 'Cookie', value: 'a=1' },
    { name: 'X', value: 'y' },
  ])
})

test('parseHeaderLines: a line with no colon refuses by name (BAD_FLAG_VALUE)', () => {
  assert.throws(() => auth.parseHeaderLines('not a header\n'), (e) => e.code === 'BAD_FLAG_VALUE' && /line 1/.test(e.message))
})

test('parseHeaderLines: an invalid header name refuses by name', () => {
  assert.throws(() => auth.parseHeaderLines('Bad Name: v\n'), (e) => e.code === 'BAD_FLAG_VALUE' && /invalid header name/.test(e.message))
})

test('parseHeaderLines: an empty value refuses by name', () => {
  assert.throws(() => auth.parseHeaderLines('Cookie:\n'), (e) => e.code === 'BAD_FLAG_VALUE' && /empty value/.test(e.message))
})

test('parseHeaderLines: an embedded control character refuses as UNSAFE_TEXT (no request splitting)', () => {
  // A raw CR/LF is consumed by the line split (it can never reach a value),
  // but a NUL or TAB inside a value would poison a downstream request - refused.
  assert.throws(() => auth.parseHeaderLines('X: a\u0000b\n'), (e) => e.code === 'UNSAFE_TEXT')
  assert.throws(() => auth.parseHeaderLines('X: a\tb\n'), (e) => e.code === 'UNSAFE_TEXT')
})

test('parseHeaderLines: a CRLF in the file is two lines, not one value with a newline', () => {
  // The line split neutralizes CRLF injection: "X: a\r\nInjected: b" parses as
  // two headers the file author wrote, never as one value smuggling a header.
  const pairs = auth.parseHeaderLines('X: a\r\nInjected: b\n')
  assert.deepStrictEqual(pairs, [
    { name: 'X', value: 'a' },
    { name: 'Injected', value: 'b' },
  ])
})

test('parseCookie: the friendly form is one Cookie pair, passed through verbatim', () => {
  assert.deepStrictEqual(auth.parseCookie('sess=abc; theme=dark'), { name: 'Cookie', value: 'sess=abc; theme=dark' })
})

test('parseCookie: empty and control-bearing values refuse by name', () => {
  assert.throws(() => auth.parseCookie('   '), (e) => e.code === 'BAD_FLAG_VALUE')
  assert.throws(() => auth.parseCookie('a=b\u0000c'), (e) => e.code === 'UNSAFE_TEXT')
})

test('resolveAuth: reads the file (cwd-relative) then appends --cookie', () => {
  const file = tmpFile('Cookie: file=1\nX-A: b\n')
  const pairs = auth.resolveAuth({ headerFile: file, cookie: 'extra=2', cwd: os.tmpdir() })
  assert.deepStrictEqual(pairs, [
    { name: 'Cookie', value: 'file=1' },
    { name: 'X-A', value: 'b' },
    { name: 'Cookie', value: 'extra=2' },
  ])
})

test('resolveAuth: a missing header file refuses MISSING_INPUT (never a silent signed-out capture)', () => {
  assert.throws(() => auth.resolveAuth({ headerFile: '/no/such/hdrs', cwd: os.tmpdir() }), (e) => e.code === 'MISSING_INPUT')
})

test('resolveAuth: no flags means no pairs (the signed-out default is unchanged)', () => {
  assert.deepStrictEqual(auth.resolveAuth({ cwd: os.tmpdir() }), [])
})

test('headerObject: repeated Cookie headers join with "; " (a browser sends one Cookie header)', () => {
  const obj = auth.headerObject([
    { name: 'Cookie', value: 'a=1' },
    { name: 'X-Y', value: 'z' },
    { name: 'Cookie', value: 'b=2' },
  ])
  assert.deepStrictEqual(obj, { Cookie: 'a=1; b=2', 'X-Y': 'z' })
})

test('headerObject: a non-Cookie repeat takes the last value', () => {
  const obj = auth.headerObject([{ name: 'X-A', value: '1' }, { name: 'X-A', value: '2' }])
  assert.deepStrictEqual(obj, { 'X-A': '2' })
})
