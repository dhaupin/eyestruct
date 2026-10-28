// rrdom-esm-redirect - the vite plugin that keeps the prestruct prerender pass
// on ONE react-router instance.
//
// The seam: prestruct's engine loads StaticRouter OUTSIDE Vite's SSR module
// registry (plain `import('react-router-dom')` in prerender.js), while the app
// layout loads INSIDE it via ssrLoadModule. react-router-dom 7 gives its
// node.default to the CJS dist/index.js, which Vite's SSR transform hands an
// empty exports namespace; routing the registry copy to dist/index.mjs content
// alone still leaves TWO module instances (registry copy vs Node-native copy),
// and on react-router 7 each instance mints its OWN React contexts - so the
// engine's router context never reaches the tree and every route dies with
// "useLocation() may be used only in the context of a <Router> component".
//
// The one cache both sides share is Node's ESM cache, keyed by exact file URL:
// the engine's import resolves to file://.../dist/index.mjs. This plugin serves
// the registry a small module that NATIVE-imports that same URL (through a
// Function-constructed dynamic import the ssr transform cannot statically
// rewrite) and re-exports its names - so the registry's react-router binding
// IS the engine's module, contexts included. The client build is untouched
// (the load hook only fires when opts.ssr is true).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MJS_PATH = path.join(HERE, '..', 'node_modules', 'react-router-dom', 'dist', 'index.mjs')

function shimCode() {
  const fileUrl = `file://${MJS_PATH}`
  // The Function constructor keeps this from being rewritten: when the module
  // body is evaluated inside Vite's ssrLoadModule runner, `import(u)` here is
  // Node's native dynamic import, landing in the SAME ESM cache the engine's
  // own `import('react-router-dom')` resolved to. Both sides then hold one
  // instance -> one set of React contexts.
  return `
const __rrdom__ = await (new Function('u', 'return import(u)'))(${JSON.stringify(fileUrl)});
export const {
Await, BrowserRouter, Form, HashRouter, HydratedRouter, Link, Links, MemoryRouter,
NavLink, Navigate, Outlet, PrefetchPageLinks, Route, Router, RouterProvider, Routes,
ScrollRestoration, Scripts, StaticRouter, StaticRouterProvider, createBrowserRouter,
createHashRouter, createMemoryRouter, createSearchParams, createStaticHandler,
createStaticRouter, generatePath, isRouteErrorResponse, matchPath, matchRoutes,
parsePath, redirect, redirectDocument, resolvePath, renderMatches,
useActionData, useAsyncError, useAsyncValue, useBeforeUnload, useBlocker,
useFetcher, useFetchers, useFormAction, useHref, useInRouterContext,
useLinkClickHandler, useLoaderData, useLocation, useMatch, useMatches,
useNavigate, useNavigation, useNavigationType, useOutlet, useOutletContext,
useParams, useResolvedPath, useRevalidator, useRouteError, useRouteLoaderData,
useRoutes, useSearchParams, useSubmit, useViewTransitionState,
} = __rrdom__;
export default __rrdom__;
`
}

export function rrdomEsmRedirect() {
  return {
    name: 'rrdom-esm-redirect',
    enforce: 'post',
    load(id, opts) {
      // Only the SSR pass (prestruct prerender / vite.ssrLoadModule).
      if (opts?.ssr !== true) return null
      // Endswith, not equality: vite may load it under a query suffix.
      if (!id.endsWith('react-router-dom/dist/index.js')) return null
      if (!fs.existsSync(MJS_PATH)) return null // honest pass-through, never a guessed transform
      return { code: shimCode() }
    },
  }
}
