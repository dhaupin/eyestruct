// eye-spa-dist - capture-correctness for a built React/Vite (SPA) dist.
// The browserless half of the capture lane, and the React/Vite analogue of
// poststruct's prestruct-shapes: pixels are the pinned-browser lane's job,
// but the BUILD has promises that are checkable with zero network and zero
// HTML execution - and a page that breaks one of them captures blank, drifts
// between routes, or serves a stale shell. This pack makes those checkable
// before a single pixel is compared.
//
// What it verifies about a target dist:
//
//   1. app mount present exactly once - #root is the capture root. Zero
//      mounts is a blank capture; more than one is an ambiguous root.
//   2. the built bundle is referenced - a mount with no entry script never
//      hydrates, so the capture is a dead frame.
//   3. no un-replaced build placeholders survive - %VITE_*% / __VITE_*__
//      tokens and the shell's placeholder title/host mean the inject pass
//      never ran (the tree is serving the template).
//   4. one build stamp across the tree - the hashed entry bundle is the
//      build stamp (the Vite analogue of prestruct's deploy-id): every baked
//      page must reference the SAME bundle hash, or a partial bake left
//      stale pages in dist.
//   5. the fallback shape agrees with the bake - a prerendered tree that also
//      ships the /* /index.html 200 SPA fallback is the documented infinite-
//      redirect loop (eyestruct's own web/dist/_redirects names it).
//
// THE CONTRACT with the target (moduleCtx['eye-spa-dist']):
//   spaDist.root          -> absolute path to the built dist, or null (the
//                            pack then dockets one BOUNDED row, never a pass)
//   spaDist.exists(rel) / text(rel) / readdir(rel) -> the tree fs helpers
//
// Verdict taxonomy (family): BOUNDED / PASSED / EXPLOITED.

'use strict'

const PKG = 'packs/public/eye-spa-dist'

/** The moduleCtx keys this pack refuses to run without. */
const REQUIRED_KEYS = ['spaDist']

// The Vite/React app mount. React's template ships `<div id="root"></div>`;
// a prerendered build leaves the same element carrying its rendered children.
// Attribute order is not assumed.
const MOUNT_RE = /<div\s+[^>]*\bid\s*=\s*["']root["'][^>]*>/i

// The entry bundle Vite emits: a module script under the assets dir. The
// hashed filename IS the build stamp, so this captures the whole src.
const ENTRY_SCRIPT_RE = /<script\s+[^>]*\bsrc\s*=\s*["']([^"']*\/assets\/[^"']+\.js)["']/gi

// Un-replaced build tokens. `%VITE_*%` is Vite's HTML env-replacement syntax
// and `__VITE_*__` its runtime form; the two shell tokens are the prestruct
// template's placeholders (the same strings prestruct-shapes pins). Any one
// surviving into dist means the inject pass never ran.
const PLACEHOLDER_RES = [
  { re: /%VITE_[A-Z0-9_]+%/g, what: 'Vite HTML env token (%VITE_*)' },
  { re: /__VITE_[A-Z0-9_]+__/g, what: 'Vite runtime env token (__VITE_*)' },
  { re: /yoursite\.com/g, what: 'shell placeholder canonical host' },
  { re: /<title>Site<\/title>/gi, what: 'shell placeholder title' },
]

function take(ctx, key) {
  const value = ctx?.[key]
  if (value == null) throw new TypeError(`${PKG}: moduleCtx['eye-spa-dist'].${key} is missing - arm the run root`)
  return value
}

function walkHtml(readdir, relPrefix) {
  const out = []
  let names = []
  try { names = readdir(relPrefix || '') } catch { names = [] }
  for (const name of names) {
    const rel = relPrefix ? `${relPrefix}/${name}` : name
    if (/\.(html|htm)$/i.test(name)) out.push(rel)
    else out.push(...walkHtml(readdir, rel))
  }
  return out.sort()
}

function mountCount(html) {
  return (html.match(new RegExp(MOUNT_RE.source, 'gi')) || []).length
}

function entryBundle(html) {
  ENTRY_SCRIPT_RE.lastIndex = 0
  return ENTRY_SCRIPT_RE.exec(html)?.[1] ?? null
}

/** The SPA fallback rule (`/* /index.html 200`) in a Cloudflare `_redirects`. */
function declaresSpaFallback(text) {
  if (!text) return false
  return /^\s*\/\*\s+\/index\.html\s+200\s*$/m.test(text)
}

class Verdicts {
  constructor() { this.rows = []; this.ok = true }
  passed(id, detail) { this.rows.push({ pack: PKG.replace('packs/public/', ''), id, verdict: 'PASSED', detail: String(detail || '').slice(0, 220) }) }
  bounded(id, bound, detail) { this.rows.push({ pack: PKG.replace('packs/public/', ''), id, verdict: 'BOUNDED', bound, detail: String(detail || '').slice(0, 220) }) }
  failed(id, fault) {
    this.ok = false
    this.rows.push({ pack: PKG.replace('packs/public/', ''), id, verdict: 'EXPLOITED', detail: String(fault.problem || JSON.stringify(fault)).slice(0, 220), fault })
  }
}

function run(ctx) {
  for (const key of REQUIRED_KEYS) take(ctx, key)
  const v = new Verdicts()
  const tree = ctx.spaDist

  if (!tree || tree.root == null) {
    v.bounded('spa/dist-absent', 'target-dist-absent', 'no built SPA dist armed (set SPA_DIST) - nothing was audited, nothing was passed')
    return { ok: v.ok, rows: v.rows }
  }

  const pages = walkHtml(tree.readdir, '')
  if (!pages.length) {
    v.bounded('spa/dist-absent', 'output-empty', `no .html under ${tree.root} - build first; the pack cannot audit what was never built`)
    return { ok: v.ok, rows: v.rows }
  }

  const html = new Map()
  for (const page of pages) html.set(page, tree.text(page) || '')

  // --- 1. the app mount is present exactly once on the entry page ---
  const indexHtml = html.get('index.html')
  if (indexHtml == null) {
    v.failed('spa/entry-page-missing', {
      problem: 'no index.html at the dist root - a built SPA dist always emits one; nothing declares the app mount',
      pages,
    })
  } else {
    const mounts = mountCount(indexHtml)
    if (mounts === 0) {
      v.failed('spa/app-mount-missing', {
        problem: 'index.html carries no #root app mount - the capture root is absent, so a capture gets a blank frame',
      })
    } else if (mounts > 1) {
      v.failed('spa/app-mount-missing', {
        problem: `index.html carries ${mounts} #root mounts - the capture root is ambiguous`,
        mounts,
      })
    } else {
      v.passed('spa/app-mount-missing', 'index.html carries exactly one #root app mount')
    }
  }

  // --- 2. the built bundle is referenced (the mount actually hydrates) ---
  if (indexHtml != null) {
    if (!entryBundle(indexHtml)) {
      v.failed('spa/bundle-not-referenced', {
        problem: 'index.html references no built entry bundle (no module script under /assets/) - a mount with no bundle never hydrates, so the capture is a dead frame',
      })
    } else {
      v.passed('spa/bundle-not-referenced', 'index.html references the built entry bundle')
    }
  }

  // --- 3. no un-replaced build placeholders survive ---
  const leaks = []
  for (const page of pages) {
    for (const { re, what } of PLACEHOLDER_RES) {
      re.lastIndex = 0
      const hits = html.get(page).match(re)
      if (hits) leaks.push({ page, what, sample: hits[0] })
    }
  }
  if (leaks.length) {
    v.failed('spa/placeholder-leaked', {
      problem: 'a build placeholder survived into dist - the inject pass never ran and the tree is serving the template',
      leaks,
    })
  } else {
    v.passed('spa/placeholder-leaked', `${pages.length} page(s): no un-replaced build placeholders`)
  }

  // --- 4. one build stamp across the tree (the hashed entry bundle) ---
  const stamps = new Map()
  for (const page of pages) {
    const bundle = entryBundle(html.get(page))
    if (bundle != null) stamps.set(page, bundle)
  }
  if (stamps.size < 2) {
    // A single page (or no page carrying a bundle) makes "one build across
    // the tree" unverifiable - docket the bound, never a fake pass.
    v.bounded('spa/build-stamp-drift', 'single-page-or-no-bundle', `only ${stamps.size} page(s) reference an entry bundle - a cross-page build-stamp claim needs at least two`)
  } else {
    const distinct = new Set(stamps.values())
    if (distinct.size > 1) {
      v.failed('spa/build-stamp-drift', {
        problem: 'pages reference different entry bundles - a partial bake left stale pages in dist (the tree is not one build)',
        bundles: [...distinct].sort(),
      })
    } else {
      v.passed('spa/build-stamp-drift', `${stamps.size} page(s) reference the same entry bundle - one build`)
    }
  }

  // --- 5. the fallback shape agrees with the bake ---
  const redirects = tree.exists('_redirects') ? tree.text('_redirects') : null
  // "Prerendered" = a route dir (not the assets dir) carries its own index.html.
  const routePages = pages.filter((p) => p !== 'index.html' && /\/index\.html$/i.test(p))
  if (redirects == null) {
    v.bounded('spa/fallback-vs-prerender', 'no-redirect-contract', 'no _redirects in the tree - the host serves the fallback (or not) outside what this pack can see')
  } else if (routePages.length && declaresSpaFallback(redirects)) {
    v.failed('spa/fallback-vs-prerender', {
      problem: 'a prerendered tree also ships the /* /index.html 200 SPA fallback - the documented infinite-redirect loop (CF Pretty URLs rewrites the route, the fallback rewrites to /index.html, which redirects back)',
      routePages,
    })
  } else {
    v.passed('spa/fallback-vs-prerender', routePages.length ? `prerendered (${routePages.length} route page(s)) with no SPA fallback - the fallback shape agrees with the bake` : 'SPA-only tree; the fallback shape is not contradicted by a prerender')
  }

  return { ok: v.ok, rows: v.rows }
}

module.exports = { run, CASES: [], PKG, REQUIRED_KEYS }
