#!/usr/bin/env node
/**
 * scripts/make-icons.mjs - regenerates the eyestruct icon set from the
 * committed brand art (public/eyestruct-logo.jpg, dark surface, 2048x2048).
 *
 * Honest build: the ink band is TRACED from the art (potrace on a thresholded
 * mask), and the accent iris + tick are MEASURED from the accent-pixel
 * geometry (centroid, ring radii, tick capsule) - no eyeballed vector.
 * Outputs:
 *   public/icon.svg           tile (works on both surfaces - the mark sits
 *                             on its own dark tile, same as the brand
 *                             sheet's 32px previews)
 *   public/icon-512.png  public/icon-192.png
 *   public/apple-touch-icon.png (180)   public/favicon-32.png
 *   scripts/brand-mark.json   the traced path + measured metrics, so
 *                             scripts/og-image.mjs can inline the same mark
 *   ../docs/icon.svg          byte-identical tile for the docs site
 *
 * Reproduce (build-local helpers, no lockfile change):
 *   cd web
 *   npm i --no-save sharp potrace @resvg/resvg-js
 *   node scripts/make-icons.mjs
 */
import { Resvg } from '@resvg/resvg-js'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const sharp = require('sharp')
const potrace = require('potrace')

const HERE = path.dirname(fileURLToPath(import.meta.url))
const PUB = path.join(HERE, '..', 'public')
const DOCS = path.join(HERE, '..', '..', 'docs')
const ART = path.join(PUB, 'eyestruct-logo.jpg')

const INK = '#e7eaf1'          // family ink (dark-surface white)
const ACCENT = '#6d8cff'       // family accent (dark mode)
const TILE_BG = '#10131a'      // family paper

// --- 1. load + classify ----------------------------------------------------
const WORK = 1024
const { data, info } = await sharp(ART)
  .resize(WORK, WORK)
  .raw()
  .toBuffer({ resolveWithObject: true })

const at = (x, y) => {
  const i = (y * info.width + x) * info.channels
  return [data[i], data[i + 1], data[i + 2]]
}
const inkMask = Buffer.alloc(WORK * WORK)      // 255 = traced ink
const accentList = []
for (let y = 0; y < WORK; y++) {
  for (let x = 0; x < WORK; x++) {
    const [r, g, b] = at(x, y)
    const blueish = b - r > 50 && b > 140
    const light = r + g + b > 330
    if (blueish) {
      accentList.push(x, y)
    } else if (light) {
      inkMask[y * WORK + x] = 255
    }
  }
}

// --- 2. trace the ink band -------------------------------------------------
const inkPng = await sharp(inkMask, { raw: { width: WORK, height: WORK, channels: 1 } })
  .png()
  .toBuffer()
const traced = await new Promise((resolve, reject) => {
  potrace.trace(inkPng, { threshold: 128, turdSize: 8, optTolerance: 0.4, blackOnWhite: true },
    (err, svg) => (err ? reject(err) : resolve(svg)))
})
const paths = [...traced.matchAll(/ d="([^"]+)"/g)].map((m) => m[1]).filter((d) => d.length > 1)
if (!paths.length) throw new Error('potrace produced no paths')

// ink bounding box (from mask, not the path - same geometry)
let minX = WORK, maxX = -1, minY = WORK, maxY = -1
for (let y = 0; y < WORK; y++) {
  for (let x = 0; x < WORK; x++) {
    if (inkMask[y * WORK + x]) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}

// --- 3. measure the accent iris + tick --------------------------------------
const acc = []
for (let i = 0; i < accentList.length; i += 2) acc.push({ x: accentList[i], y: accentList[i + 1] })
let aMinX = WORK, aMaxX = -1, aMinY = WORK, aMaxY = -1, cxA = 0, cyA = 0
for (const p of acc) {
  aMinX = Math.min(aMinX, p.x); aMaxX = Math.max(aMaxX, p.x)
  aMinY = Math.min(aMinY, p.y); aMaxY = Math.max(aMaxY, p.y)
  cxA += p.x; cyA += p.y
}
cxA /= acc.length; cyA /= acc.length
const ringOuterRadius = (aMaxY - aMinY) / 2
// vertical run at the centroid column: measures ring thickness (top band + bottom band - hole)
let run = 0
for (let y = Math.floor(cyA); y <= aMaxY; y++) {
  const [r, g, b] = at(Math.round(cxA), y)
  if (b - r > 50 && b > 140) run++
  else if (run) break
}
const ringThickness = run * 2
const tickHalfLen = (aMaxX - aMinX) / 2                     // ring + tick share cy; longest accent horizontally
// tick thickness: vertical run of accent at x = tick end minus ring reach
const tickProbeX = Math.round(cxA + tickHalfLen - (aMaxX - cxA) * 0.05)
let tickThick = 0
for (let y = Math.floor(cyA) - 60; y <= Math.floor(cyA) + 60; y++) {
  const [r, g, b] = at(tickProbeX, y)
  if (b - r > 50 && b > 140) tickThick++
}
const tickHalfWidth = Math.max(tickThick, 6) / 2

// --- 4. compose the tile (64 viewBox, content box 6..58) ---------------------
const SCALE = 48 / Math.max(maxX - minX, maxY - minY)
const ox = 32 - ((minX + maxX) / 2) * SCALE
const oy = 32 - ((minY + maxY) / 2) * SCALE
const pathEls = paths.map((d) => `<path d="${d}" fill="${INK}" fill-rule="evenodd"/>`).join('\n  ')
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="14" fill="${TILE_BG}"/>
<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${SCALE.toFixed(5)})">
  ${pathEls}
  <circle cx="${cxA.toFixed(1)}" cy="${cyA.toFixed(1)}" r="${(ringOuterRadius - ringThickness / 2).toFixed(1)}" fill="none" stroke="${ACCENT}" stroke-width="${ringThickness.toFixed(1)}"/>
  <rect x="${(cxA - tickHalfLen).toFixed(1)}" y="${(cyA - tickHalfWidth).toFixed(1)}" width="${(tickHalfLen * 2).toFixed(1)}" height="${(tickHalfWidth * 2).toFixed(1)}" rx="${tickHalfWidth.toFixed(1)}" fill="${ACCENT}"/>
</g>
</svg>
`

fs.writeFileSync(path.join(PUB, 'icon.svg'), iconSvg)
fs.writeFileSync(path.join(DOCS, 'icon.svg'), iconSvg)

// authored-mark JSON for the og-image generator
fs.writeFileSync(path.join(HERE, 'brand-mark.json'), JSON.stringify({
  viewBox: 64,
  paths,
  iris: {
    cx: +((cxA * SCALE + ox) / 1).toFixed(2), // 64-space metrics below; keep raw too
    raw: {
      workSize: WORK,
      cx: +cxA.toFixed(1), cy: +cyA.toFixed(1),
      midRadius: +(ringOuterRadius - ringThickness / 2).toFixed(1),
      thickness: +ringThickness.toFixed(1),
      tickHalfLen: +tickHalfLen.toFixed(1), tickHalfWidth: +tickHalfWidth.toFixed(1),
    },
  },
  inkMask: { minX, maxX, minY, maxY },
  transform: { ox: +ox.toFixed(2), oy: +oy.toFixed(2), scale: +SCALE.toFixed(5) },
}, null, 2) + '\n')

// --- 5. rasterize the PNG ladder --------------------------------------------
const pngRoot = new Resvg(iconSvg, { fitTo: { mode: 'width', value: 512 } })
  .render().asPng()
const sizes = { 'icon-512.png': 512, 'icon-192.png': 192, 'apple-touch-icon.png': 180, 'favicon-32.png': 32 }
for (const [name, size] of Object.entries(sizes)) {
  await sharp(pngRoot).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(PUB, name))
}

console.log('ink bbox:', { minX, maxX, minY, maxY })
console.log('iris:', { cxA: cxA.toFixed(1), cyA: cyA.toFixed(1), ringOuterRadius: ringOuterRadius.toFixed(1), ringThickness: ringThickness.toFixed(1), tickHalfLen: tickHalfLen.toFixed(1), tickHalfWidth: tickHalfWidth.toFixed(1) })
console.log('paths:', paths.length, '| scale', SCALE.toFixed(5), 'origin', ox.toFixed(1), oy.toFixed(1))
console.log('icon set written (svg + 4 png + brand-mark.json + docs copy)')
