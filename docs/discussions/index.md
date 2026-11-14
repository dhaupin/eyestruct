---
permalink: discussions/
layout: default
title: Release Announcements
description: The release-announcement index - one announcing-vX.Y.Z.md per published release, the file IS the announcement, and this page is the trail of what shipped and when.
---

# Release announcements

Every published release gets one announcement, and this page is their index: the trail of what eyestruct shipped and when. Each announcement lives in `docs/discussions/` as versioned source, so the release trail sits in the same tree as the changelog it summarizes, and the file's raw markdown IS the announcement - view source, copy, strip the frontmatter, and it is ready for GitHub Discussions.

The format follows the family conventions ([crashtest's release-post index](https://github.com/dhaupin/crashtest/blob/main/docs/discussions/index.md) carries the first real post, [crashtest's announcing-v1.0.0](https://github.com/dhaupin/crashtest/blob/main/docs/discussions/announcing-v1.0.0.md)).

Prose on these pages flows - paragraphs keep their natural length, and nothing in the toolchain re-wraps them at commit time. Hard-wrapped prose is a commit-time artifact, and it dies at every reflow of an upstream forum renderer. Tables and frontmatter keep their own natural line lengths.

## The conventions

- **One file per release, named after it.** `announcing-vX.Y.Z.md`, matching the npm version on the day the post is drafted. Never reuse a filename; if a release gets a retry, fold the delta into the same post instead.
- **Frontmatter contract.** Same four required fields every docs page gates on (`permalink`, `layout`, `title`, `description`) plus `version`. The permalink is `discussions/announcing-vX.Y.Z/` - the trailing slash matters: Jekyll emits an extensionless file for a dotted, slashless slug, and freestruct's scanner never sees those, so the page drops out of the sitemap and the whole head seam. Every announcement carries the slash.
- **Voice and facts.** The same rules every page here gates on (the style/voice checker plus the fiction-signature scanner): no marketing language, and every number and claim verified against the shipped artifact before it lands. If you cannot run it, do not write it.
- **Timing.** Draft the post against the released version, not the dev tree: cite what shipped in the npm tarball, and keep unreleased changelog rows out of it. A post describing a version that is not on npm yet is fiction by promotion. A post staged before its publish lands as a draft publicly marked "staged pending npm" in this index, and the draft marker comes off in the same commit that first serves the version - never earlier.
- **Gates.** `npm run lint:docs` runs on these files like everything else - frontmatter, heading levels, the dash and cliche scans, fiction signatures, and the Jekyll filter trap.

## The announcements

One row per published release, newest first. The date is the day the tarball landed on npm; a release with no row is a release with no announcement, which is the honest state, not a gap to paper over.

| release | published | what it carried |
| --- | --- | --- |
| [Announcing v1.3.2](/eyestruct/discussions/announcing-v1.3.2/) | 2026-11-13 | the serve SIGINT race fixed at the source - a Ctrl-C landing as the banner prints now exits 0, held by a regression test proven to bite |
| [Announcing v1.3.1](/eyestruct/discussions/announcing-v1.3.1/) | 2026-11-13 | the packs ride the published tarball again - a packaging fix, so `npm i eyestruct` carries the eye packs it documents |
| [Announcing v1.3.0](/eyestruct/discussions/announcing-v1.3.0/) | 2026-11-13 | the family-matrix site move, and the capture surface: `eyestruct serve` and the committed `labs/.eyes/` visual memory, on the published line |
| [Announcing v1.1.1](/eyestruct/discussions/announcing-v1.1.1/) | 2026-11-13 | a patch on the 1.1.0 line - the family floors move, a discovery-surface opt-in, and the site catching up to the family shell |
| [Announcing v1.1.0](/eyestruct/discussions/announcing-v1.1.0/) | 2026-11-06 | the release-trust lane - the staged-to-shipped fold and the notes lane that extracts the announcement verbatim when the tag cuts |
| [Announcing v1.0.0](/eyestruct/discussions/announcing-v1.0.0/) | 2026-10-28 | the freeze release - every consumer-bindable surface named and held by a battery leg, so 1.x adds without removing |
| [Announcing v0.9.0](/eyestruct/discussions/announcing-v0.9.0/) | 2026-10-28 | the spine under gates: deterministic looks, a committed visual memory, and CI that refuses unexplained drift with a named reason-code |

## The claim inventory the release post cites

The release post carries the standing receipt inventory below - each claim verified against the shipped tree (CI runs the pack campaign and the crashtest leg on every push, and `lint:docs` keeps the pages honest), and re-run together on release day. When a claim goes stale, fix or drop the row and the post with it - claims do not ride on tree momentum.

| claim for the release posts | receipt on the tree |
|----------------------------|-----------------------------|
| The refusal surface is named, not guessed: 31 reason-codes across the 0-1-2 exit contract, no bare stack traces | `lib/reasons.js` (CODES + REASONS), mirrored live at [reason codes](/eyestruct/reasons) |
| The eye gate attacks itself: 47 adversarial pack cases over the real CLI, judged with the packstruct grammar and a committed packledger | `packs/public/` + `packs/eye-ledger.json`, runner `scripts/run-packs.cjs`, docs at [packs](/eyestruct/packs) |
| A second adversarial leg rides CI: 14 hostile argv batches + hostile MCP stdio frames + 6 hostile ledger variants, seeded and deterministic | `labs/scenarios/eye-cli-contract.js`, baseline `labs/crashledger.json` + `labs/hardening.md` |
| Canonical baselines are CI-cut, two-dispatch, never self-certified | `.github/workflows/eyes-ratify.yml` (proposal -> witness dispatch) |
| The pack lint lane is a discoverable verb, never a download | `eyestruct lint-packs` (`lib/lint-packs.js`, wrapper policy) |
| Interfaces are clamped, not implied: the exports map, env-var inventory, --json shapes, and the manifest + ledger schemas are frozen and leg-held | `package.json` `exports`, `docs/env.md`, `tests/contract.test.js` |

The honesty move when a claim goes stale on release day: fix or drop the row, then write the post. Claims do not ride into a published tarball on momentum, and they do not ride into a discussion announcement either.
