// tests/overlay.test.js - the element-id overlay's pure geometry (eyestruct#52).
//
// The chip math is the reason a label can never read as page content, so it is
// tested here without a browser: engine.js injects this same function into the
// page, so the drawn chip and the tested chip are one source of truth.

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { chipGeometry, makeInjectable, CHIP_ADVANCE } = require('../lib/overlay')

test('chipGeometry: a chip is at least as tall as the label and never shorter than its text', () => {
  const g = chipGeometry('#root', 11)
  assert.equal(g.chipH, 17, 'height is the font size plus padding')
  // '#root' (5 glyphs) at 11px: 5 * 11 * 0.62 ~= 34, plus 8px padding.
  assert.equal(g.chipW, 42)
  assert.ok(g.chipW >= g.chipH, 'a chip is never narrower than it is tall')
})

test('chipGeometry: a longer id yields a proportionally wider chip', () => {
  const short = chipGeometry('#a', 11)
  const long = chipGeometry('#a-much-longer-identifier', 11)
  assert.ok(long.chipW > short.chipW, 'the chip grows with the text')
})

test('chipGeometry: the text sits inside the chip, offset from its origin', () => {
  const g = chipGeometry('#root', 11)
  assert.ok(g.textX > 0 && g.textX < g.chipW, 'text starts inside the chip horizontally')
  assert.ok(g.textY > 0 && g.textY <= g.chipH, 'text baseline sits inside the chip vertically')
})

test('chipGeometry: the minimum chip is the font size when the text is tiny', () => {
  // A one-glyph id must still clear the height floor rather than collapse.
  const g = chipGeometry('#', 11)
  assert.equal(g.chipW, g.chipH, 'a minimal chip is square at the height floor')
})

test('CHIP_ADVANCE is a positive fraction of the font size', () => {
  assert.ok(CHIP_ADVANCE > 0 && CHIP_ADVANCE < 1)
})

test('makeInjectable: the injected page function carries the same geometry (no closure drift)', () => {
  // Puppeteer stringifies the page function, so the geometry must live in its
  // source. The injected copy and the in-process copy must agree exactly.
  const injected = makeInjectable((labelLimit) => { return chipGeometry('#root', labelLimit) })
  assert.deepStrictEqual(injected(11), chipGeometry('#root', 11))
  assert.deepStrictEqual(injected(20), chipGeometry('#root', 20))
})

test('makeInjectable: preserves the wrapped function\'s own arguments and body', () => {
  const injected = makeInjectable((a, b) => { return { a, b, geo: chipGeometry('#x', 11) } })
  const out = injected('one', 'two')
  assert.equal(out.a, 'one')
  assert.equal(out.b, 'two')
  assert.deepStrictEqual(out.geo, chipGeometry('#x', 11))
})

test('makeInjectable: a body with no unambiguous splice point refuses rather than guess', () => {
  // A concise arrow body has nowhere safe to inject the geometry, so the
  // helper refuses by name instead of producing a subtly broken function.
  assert.throws(() => makeInjectable((a) => a + 1), /must have a block body/)
})
