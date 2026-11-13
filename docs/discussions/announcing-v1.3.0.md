---
permalink: discussions/announcing-v1.3.0
layout: default
title: Announcing v1.3.0
description: v1.3.0 moves the landing site onto the current family matrix, React 19 and Vite 8 on the prestruct 1.5.0 engine, with no change to the published tarball.
version: 1.3.0
---

# Announcing v1.3.0

eyestruct is eyes for production agents: capture, diff, adopt, and ratify what a surface actually looks like. v1.3.0 moves the `/web` landing site onto the family matrix that prestruct 1.5.0 published, and it is the first published version to carry the self-serve capture surface. The CLI surface, the reason codes, the MCP tools, and the schemas are unchanged.

```bash
npm i -g eyestruct
```

## The capture surface ships here

`ratify --serve DIR` and `walk --serve DIR` stand up the baked tree themselves instead of demanding an external server, so a consumer CI no longer hand-rolls `http-server dist & sleep 3` and the readiness race that comes with it. The verb resolves the directory with the same defaults `serve` uses and waits on the server's own readiness promise, so there is no sleep to tune. The changelog records this work under 1.2.0, but 1.2.0 was never tagged or published on its own, so v1.3.0 is where it reaches npm. The same release fixes `serve` reading `.port` and `.close` off the pending readiness promise, which had printed `http://127.0.0.1:undefined` and thrown on the first Ctrl-C.

## The site moves to the family matrix

The landing site now runs React 19 and Vite 8, on the prestruct 1.5.0 engine: `react`/`react-dom` `^18.3.1 -> ^19.3.1`, `vite` `^5.4.0 -> ^8.3.7`, `@vitejs/plugin-react` `^4.3.1 -> ^6.3.0`, and `prestruct` `^1.3.0 -> ^1.5.0`. The site bakes nine pages with a clean audit on the new matrix, and the `ssr.noExternal` router seam is unchanged: the engine's externalized default still splits the router on this host, so the pin stays.

## Vite 8 is rolldown-based

Two config edits follow from the engine change. `web/vite.config.js` now carries `manualChunks` as a function, since the object form that Vite 7 and earlier accepted is rejected, and it drops `minify: 'esbuild'`, because esbuild is unbundled and oxc is the default minifier. These are the same two edits prestruct 1.5.0 documents for anyone cherry-picking the matrix.

## The web lane declares a Node floor

`web/package.json` sets `engines.node >=20.19`, the floor Vite 8 declares. The repo's own battery still runs on Node 18 and 20; only the site build needs the newer floor. This is the repo's own toolchain and landing site, and it does not ride the published tarball.

## Links

- Repo and docs: https://github.com/dhaupin/eyestruct / https://docs.creadev.org/eyestruct
- Changelog: https://github.com/dhaupin/eyestruct/blob/main/CHANGELOG.md
- Issues: https://github.com/dhaupin/eyestruct/issues
