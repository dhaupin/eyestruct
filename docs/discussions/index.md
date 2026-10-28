---
permalink: discussions/
layout: default
title: Release Posts
description: The release-post system - one announcing-vX.Y.Z.md per release, discussions-ready, lint-gated like every other docs surface.
---

# Release posts

One post per release, shaped like the family conventions in crashtest's release-post index ([crashtest's docs/discussions/index.md](https://github.com/dhaupin/crashtest/blob/main/docs/discussions/index.md); first real post: [crashtest's announcing-v1.0.0](https://github.com/dhaupin/crashtest/blob/main/docs/discussions/announcing-v1.0.0.md)). The post lives in `docs/discussions/` as versioned source so the release trail is in the same tree as the changelog it summarizes, and the file's raw markdown IS the announcement - view source, copy, strip the frontmatter, post.

Prose on these pages flows - paragraphs keep their natural length, and nothing in the toolchain re-wraps them at commit time. Hard-wrapped prose is a commit-time artifact, and it dies at every reflow of an upstream forum renderer. Tables and frontmatter keep their own natural line lengths.

## The conventions

- **One file per release, named after it.** `announcing-vX.Y.Z.md`, matching the npm version on the day the post is drafted. Never reuse a filename; if a release gets a retry, fold the delta into the same post instead.
- **Frontmatter contract.** Same four required fields every docs page gates on (`permalink`, `layout`, `title`, `description`) plus `version`. The permalink is `discussions/announcing-vX.Y.Z`.
- **Voice and facts.** The same rules every page here gates on (the style/voice checker plus the fiction-signature scanner): no marketing language, and every number and claim verified against the shipped artifact before it lands. If you cannot run it, do not write it.
- **Timing.** Draft the post against the released version, not the dev tree: cite what shipped in the npm tarball, and keep unreleased changelog rows out of it. A post describing a version that is not on npm yet is fiction by promotion. A post staged before its publish lands as a draft publicly marked "staged pending npm" in this index, and the draft marker comes off in the same commit that first serves the version - never earlier.
- **Gates.** `npm run lint:docs` runs on these files like everything else - frontmatter, heading levels, the dash and cliche scans, fiction signatures, and the Jekyll filter trap.

## The index

| post | version | live |
| --- | --- | --- |
| [announcing-v0.9.0](/eyestruct/discussions/announcing-v0.9.0) | 0.9.0 | yes |
| [announcing-v1.0.0](/eyestruct/discussions/announcing-v1.0.0) | 1.0.0 | staged pending npm |

## The claim inventory the release post cites

The release post carries the standing receipt inventory below - each claim verified against the shipped tree (CI runs the pack campaign and the crashtest leg on every push, and `lint:docs` keeps the pages honest), and re-run together on release day. When a claim goes stale, fix or drop the row and the post with it - claims do not ride on tree momentum.

| claim for the release posts | receipt on the tree |
|----------------------------|-----------------------------|
| The refusal surface is named, not guessed: 30 reason-codes across the 0-1-2 exit contract, no bare stack traces | `lib/reasons.js` (CODES + REASONS), mirrored live at [reason codes](/eyestruct/reasons) |
| The eye gate attacks itself: 35 adversarial pack cases over the real CLI, judged with the packstruct grammar and a committed packledger | `packs/public/` + `packs/eye-ledger.json`, runner `scripts/run-packs.cjs`, docs at [packs](/eyestruct/packs) |
| A second adversarial leg rides CI: 14 hostile argv batches + hostile MCP stdio frames + 6 hostile ledger variants, seeded and deterministic | `labs/scenarios/eye-cli-contract.js`, baseline `labs/crashledger.json` + `labs/hardening.md` |
| Canonical baselines are CI-cut, two-dispatch, never self-certified | `.github/workflows/eyes-ratify.yml` (proposal -> witness dispatch) |
| The pack lint lane is a discoverable verb, never a download | `eyestruct lint-packs` (`lib/lint-packs.js`, wrapper policy) |
| Interfaces are clamped, not implied: the exports map, env-var inventory, --json shapes, and the manifest + ledger schemas are frozen and leg-held | `package.json` `exports`, `docs/env.md`, `tests/contract.test.js` |

The honesty move when a claim goes stale on release day: fix or drop the row, then write the post. Claims do not ride into a published tarball on momentum, and they do not ride into a discussion announcement either.
