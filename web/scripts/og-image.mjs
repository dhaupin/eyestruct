#!/usr/bin/env node
/**
 * scripts/og-image.mjs - regenerates web/public/og-image.png (1200x630).
 *
 * Receipts rule: the numbers baked into the card (34 pack verdicts,
 * 52/52 hostile attacks) are current-tree facts, re-checked with:
 *
 *   node -e "const p=require('./packs/eye-ledger.json');
 *            const c=require('./labs/crashledger.json');
 *            console.log(p.rows.length, c.findings.length)"
 *
 * bumped on each release, same list the discussions-index claim inventory
 * carries. The card uses the family token palette (no new colors).
 *
 * Reproduce (no lockfile change - the font is a build-local helper):
 *   cd web
 *   npm i --no-save dejavu-fonts-ttf      # ships the .ttf files resvg needs
 *   node scripts/og-image.mjs
 */
import { Resvg } from '@resvg/resvg-js'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const resolveTtf = (name) =>
  path.join(path.dirname(require.resolve('dejavu-fonts-ttf/package.json')), 'ttf', name)

const A = '#45cf83', P = '#121011', S = '#181515', RAISED = '#211b19',
      INK = '#ece6df', SOFT = '#a89c92', MOSS = '#8fbe6f', LINE = '#2b2521'

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${P}"/>
  <rect width="1200" height="8" fill="${A}"/>
  <rect x="60" y="90" width="1080" height="450" rx="16" fill="${S}" stroke="${LINE}" stroke-width="2"/>
  <g transform="translate(120,170)">
    <rect x="0" y="0" width="112" height="112" rx="24" fill="${RAISED}" stroke="${LINE}" stroke-width="2"/>
    <circle cx="56" cy="56" r="34" fill="none" stroke="${A}" stroke-width="7"/>
    <circle cx="56" cy="56" r="13" fill="${A}"/>
  </g>
  <text x="270" y="196" font-family="DejaVu Sans" font-size="72" font-weight="bold" fill="${INK}"><tspan fill="${A}">eye</tspan>struct</text>
  <text x="270" y="246" font-family="DejaVu Sans" font-size="26" fill="${SOFT}">eyes for production agents - gated like code</text>
  <text x="120" y="340" font-family="DejaVu Sans" font-size="24" fill="${SOFT}">One short process per look. The only surviving state is git state:</text>
  <text x="120" y="376" font-family="DejaVu Sans Mono" font-size="23" fill="${INK}">labs/.eyes/  -  committed baselines, append-only ledger</text>
  <text x="120" y="416" font-family="DejaVu Sans Mono" font-size="23" fill="${INK}">eyestruct <tspan fill="${A}">look</tspan> -&gt; <tspan fill="${A}">diff</tspan> -&gt; <tspan fill="${A}">gate</tspan>    (CI refuses what no note explains)</text>
  <text x="120" y="478" font-family="DejaVu Sans" font-size="20" fill="${MOSS}">34 pack verdicts - 0 exploited</text>
  <text x="430" y="478" font-family="DejaVu Sans" font-size="20" fill="${MOSS}">52/52 hostile attacks refused</text>
  <text x="742" y="478" font-family="DejaVu Sans" font-size="20" fill="${SOFT}">canon cut by CI, never by agents</text>
  <text x="120" y="516" font-family="DejaVu Sans" font-size="19" fill="${SOFT}">docs.creadev.org/eyestruct   github.com/dhaupin/eyestruct   Creadev.org</text>
</svg>`

const png = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: {
    loadSystemFonts: false,
    fontFiles: [resolveTtf('DejaVuSans.ttf'), resolveTtf('DejaVuSans-Bold.ttf'), resolveTtf('DejaVuSansMono.ttf')],
    defaultFontFamily: 'DejaVu Sans',
  },
}).render().asPng()

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og-image.png')
fs.writeFileSync(out, png)
console.log(`wrote ${out} (${png.length} bytes)`)
