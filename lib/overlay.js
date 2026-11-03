// lib/overlay.js - the element-id overlay's pure geometry (eyestruct#52).
//
// The overlay is drawn inside page.evaluate, but its shape math is pure: given
// an id text and the label font size, where the chip and its text sit. Keeping
// it here makes the shape unit-testable without a browser; engine.js splices
// CHIP_GEOMETRY_SRC into the injected function so the drawn chip and the
// tested chip are one source of truth (puppeteer stringifies the page
// function, so the geometry must live inside its own source - a closure would
// be lost).
//
// The chip exists so a label never reads as page content: a #root-sized
// element once drew a bare pink "#root" at the page's top-left that a vision
// reader mistook for rendered markup. A solid badge makes the annotation
// unmistakable.

'use strict'

// Monospace glyph advance as a fraction of font size (labelLimit). Chrome's
// default monospace is ~0.6em; 0.62 leaves a hair of slack.
const CHIP_ADVANCE = 0.62

// The drawable geometry, as a source string for injection into
// page.evaluate. A function declaration (hoisted, so its position in the
// spliced source never matters).
const CHIP_GEOMETRY_SRC = `function chipGeometry(text, labelLimit) {
  const chipH = labelLimit + 6
  const chipW = Math.max(chipH, Math.round(text.length * labelLimit * ${CHIP_ADVANCE}) + 8)
  return { chipW, chipH, textX: 4, textY: labelLimit + 1 }
}`

// The same function, callable in-process (the unit test's subject).
const chipGeometry = new Function(`${CHIP_GEOMETRY_SRC}; return chipGeometry`)()

// Puppeteer stringifies the page function, so a closure over chipGeometry is
// lost in the page context. Splice the geometry into the function's own source
// instead: the drawn chip and the unit-tested chip stay one source of truth,
// with no in-page eval a CSP could block. A block-bodied function is required
// (the engine's page function is one) - a concise or object-literal body has no
// unambiguous splice point, so it refuses rather than guess. The hoisted
// function declaration makes the splice point - just inside the opening brace -
// order-independent.
function makeInjectable(fn) {
  const src = fn.toString()
  const arrow = src.indexOf('=>')
  let brace
  if (arrow === -1) {
    brace = src.indexOf('{') // classic function declaration/expression
  } else {
    if (!src.slice(arrow + 2).trimStart().startsWith('{')) {
      throw new Error('makeInjectable: the page function must have a block body')
    }
    brace = src.indexOf('{', arrow)
  }
  if (brace === -1) throw new Error('makeInjectable: no function body found')
  return new Function('return ' + src.slice(0, brace) + '{' + CHIP_GEOMETRY_SRC + '\n' + src.slice(brace + 1))()
}

module.exports = { chipGeometry, makeInjectable, CHIP_GEOMETRY_SRC, CHIP_ADVANCE }
