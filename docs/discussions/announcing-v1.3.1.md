---
permalink: discussions/announcing-v1.3.1
layout: default
title: Announcing v1.3.1
description: v1.3.1 is a packaging fix that makes the committed packs ride the published tarball, so a pinned install delivers the six eye packs the family arms its verdicts from.
version: 1.3.1
---

# Announcing v1.3.1

eyestruct is eyes for production agents: capture, diff, adopt, and ratify what a surface actually looks like. v1.3.1 is a packaging fix. The CLI surface, the reason codes, the MCP tools, and the schemas are unchanged. What changed is that the packs now ship.

```bash
npm i -g eyestruct
```

## A committed pack is only as useful as its delivery

The family arms every verdict by an exact npm pin: a consumer installs `eyestruct` at a fixed version and reads `node_modules/eyestruct/packs/public/<pack>`. That makes delivery the whole point. `package.json` `files` excluded `packs/`, so `npm pack` shipped zero pack bytes and `npm i eyestruct` installed `{bin, lib, LICENSE, README.md, CHANGELOG.md, package.json}` with no `packs/` directory. A `github:` dependency honors `files` too, so it had the same hole. The six eye packs, the eye-spa-dist capture lane, the eye-adapter schema carrier, the eye-ci-gate spine, the eye-shapes adversarial pack, the eye-bundle lane, and the eye-text-leg poststruct integration, were committed and green yet undeliverable.

## What changed

`packs/` joins the `files` whitelist, so all six pack directories now ride the tarball. `tests/distribution.test.js` pins the contract in two halves: `files` carries `packs`, and every committed pack directory is delivered. The publish lane's verify job passes `--allowed "packs/"`, because the family-default served-tarball scan forbids `packs/` by prefix and would otherwise refuse the new bytes; `tests/release-verify.test.js` runs the same ladder with the flag the lane passes.

## Links

- Repo and docs: https://github.com/dhaupin/eyestruct / https://docs.creadev.org/eyestruct
- Packs: https://docs.creadev.org/eyestruct/packs
- Changelog: https://github.com/dhaupin/eyestruct/blob/main/CHANGELOG.md
- Issues: https://github.com/dhaupin/eyestruct/issues
