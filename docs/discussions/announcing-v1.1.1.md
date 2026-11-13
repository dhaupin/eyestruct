---
permalink: discussions/announcing-v1.1.1/
layout: default
title: Announcing v1.1.1
description: v1.1.1 is a patch on the 1.1.0 line - the CLI surface is unchanged; the family floors move, the docs gain the breadcrumb trail, and the site follows the family shell.
version: 1.1.1
---

# Announcing v1.1.1

eyestruct is eyes for production agents: capture, diff, adopt, and ratify what a surface actually looks like. v1.1.1 is a patch on the 1.1.0 line. The CLI surface, the reason codes, the MCP tools, and the schemas are unchanged - this cut carries the family floor moves, a discovery-surface opt-in, and the site catching up to the family shell. This post ships with the v1.1.1 tag: npm has the tarball by the time you read it.

```bash
npm i -g eyestruct
```

## What landed

**The family floors move.** The `prestruct` declaration floor is now `^1.3.0` (the SSRF-guard security round) - `scripts/check-prestruct-pins.cjs` refuses any declaration below it, and the guard's own battery gains the inverse case (the old `^1.2.0` floor now fails). The family devDependency pins advance to the current cuts in the same pass: `crashtest` `^1.1.0 -> ^1.3.0`, `freestruct` `^1.2.0 -> ^1.3.0`, `packstruct` `1.0.0 -> 1.1.0`, and `poststruct` leaves the raw GitHub SHA for the published `1.1.0`. Lockfiles re-resolved to match. None of these ride the published tarball - they are the repo's own toolchain - but the floors are what a consumer's tree is held to.

**The docs site gains the breadcrumb trail.** `docs/freestruct.config.yml` turns on `breadcrumb: true`, so each docs page emits a schema.org BreadcrumbList from the URL tree (freestruct carries auto-breadcrumbs since 1.1.0). The product site's `web/ssr.config.js` carries the same flag, active on the prestruct engine feature.

**The site follows the family shell.** The `/status` family island now lists every other family member (it had drifted, missing `gamestruct` and `memstruct`), with the CSP `connect-src` gaining their origins so the rows can actually render. The mobile nav fits the phone viewport (the header overflowed and the burger sat off-screen below 640px - the badge hides first, the gaps tighten, and the wordmark may shrink, so every control stays reachable), and the PWA manifest's chrome color moves to the light default the rest of the site already wore.

## Also in this round

The `.gitignore` docs block carries the in-tree Jekyll and pagefind products, so a local docs build leaves no untracked noise. `.github/dependabot.yml` lands with the family flow (weekly Monday, grouped minor/patch, the `github-actions` ecosystem). A `staging` fast-forward sync job keeps the integration branch a true mirror of `main`.

## Links

- Repo and docs: https://github.com/dhaupin/eyestruct / https://docs.creadev.org/eyestruct
- Reason codes: https://docs.creadev.org/eyestruct/reasons
- Changelog: https://github.com/dhaupin/eyestruct/blob/main/CHANGELOG.md
- Issues: https://github.com/dhaupin/eyestruct/issues
