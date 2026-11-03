// tests/engine-headless.test.js - the headless-mode policy + failure
// diagnostics for the capture engine (eyestruct#53). Browser-free and
// pure: the mode chosen from a binary name, the one-flip retry order, the
// detach classifier, and the CAPTURE_BLOCKED detail are all exported
// functions, so the policy is a test rather than a hope. The real capture
// path stays covered by the browser-gated smoke leg.

const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')

const engine = require('../lib/engine')

test('headlessModeFor: chrome-headless-shell is driven with the OLD-headless "shell" mode', () => {
  assert.equal(engine.headlessModeFor('/x/chrome-headless-shell-linux64/chrome-headless-shell'), 'shell')
  assert.equal(engine.headlessModeFor('chrome-headless-shell'), 'shell')
})

test('headlessModeFor: full chrome is driven with new headless (true)', () => {
  assert.equal(engine.headlessModeFor('/x/chrome-linux64/chrome'), true)
  assert.equal(engine.headlessModeFor('/usr/bin/chromium'), true)
})

test('captureModes: the binary\'s own mode first, then the other ONCE', () => {
  assert.deepStrictEqual(engine.captureModes('shell'), ['shell', true])
  assert.deepStrictEqual(engine.captureModes(true), [true, 'shell'])
})

test('isDetachedFrameError: the frame-detach family is recognized, a plain failure is not', () => {
  assert.ok(engine.isDetachedFrameError(new Error('Navigating frame was detached')))
  assert.ok(engine.isDetachedFrameError(new Error('Target closed')))
  assert.ok(engine.isDetachedFrameError('frame was detached from target'))
  assert.ok(!engine.isDetachedFrameError(new Error('net::ERR_CONNECTION_REFUSED')))
  assert.ok(!engine.isDetachedFrameError(new Error('capture is blank')))
})

test('describeCaptureFailure: names the binary and carries the browser message', () => {
  const s = engine.describeCaptureFailure(new Error('net::ERR_NAME_NOT_RESOLVED'), '/x/chrome-linux64/chrome')
  assert.match(s, /^chrome: net::ERR_NAME_NOT_RESOLVED/)
})

test('describeCaptureFailure: a detach adds the chrome-headless-shell hint (the issue #53 fix path)', () => {
  const s = engine.describeCaptureFailure(new Error('Navigating frame was detached'), '/x/chrome-headless-shell')
  assert.match(s, /frame was torn down/)
  assert.match(s, /chrome-headless-shell/)
  assert.match(s, /puppeteer browsers install chrome/)
})

test('describeCaptureFailure: a stderr tail rides along on one line (a font/lib crash is diagnosable)', () => {
  const s = engine.describeCaptureFailure(new Error('boom'), '/x/chrome', 'Cannot load default config file\nSegmentation fault (core dumped)')
  assert.match(s, /browser stderr: Cannot load default config file \| Segmentation fault \(core dumped\)/)
})

test('describeCaptureFailure: no stderr means no stderr clause', () => {
  const s = engine.describeCaptureFailure(new Error('boom'), '/x/chrome', '')
  assert.ok(!/browser stderr/.test(s))
})
