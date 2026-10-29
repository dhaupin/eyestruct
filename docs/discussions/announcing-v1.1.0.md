---
permalink: discussions/announcing-v1.1.0
layout: default
title: Announcing v1.1.0
description: v1.1.0 is the release-trust fold - the tag now drives the whole publish ladder, the verifier is one family-generic file, and every finding from the post-cut walks is commissioned in-tree.
version: 1.1.0
---

# Announcing v1.1.0

This post is the staged draft for the 1.1.0 fold: every tree the moves after the 1.0.0 tag rode is now folded under the `[1.1.0]` changelog heading, and the numbers below cite that tree. The release-notes lane extracts this post verbatim when the 1.1.0 tag cuts and `eyestruct@1.1.0` lands on npm - the post comes off staged only in the commit that serves it.

## The release-trust lane

The 1.0.0 cut proved a publish step can go green while nothing asserts the published truth. 1.1.0 closes that end to end, driven by the tag:

- **Publish** rides the OIDC trusted lane with the 0.x and tag==version gates and `prepublishOnly = npm test && npm run check` in the lane itself - the gate rode the publish run, so the advocacy and the package are the same tree.
- **Release** mints the GH release object from the pushed tag with notes extracted from the changelog - the tag's title and body, with the discussion post linked and the badge provenance row appended automatically.
- **Verify** refuses to trust acts over outcomes: the ladder extracts the digests, pulls the tarballs from the registry and from the release, cross-checks the package.json version against the tag, and unpacks both to prove the content. A mismatch rejects the cut before anything downstream can bind to it.

## One verifier, the whole family

The verify step is one stdlib file (no dependencies), derived from the caller's tree rather than copied per repo: package name, version, bin path, and registry package all read from the repo being cut. Repo-specific rules ride flags only - `--exports` pins frozen export keys, `--probe` runs the consumer's own assertion, `--forbidden` extends the family defaults. Both rules ship with battery legs on every push: a synthetic foreign repo (own name, own bin, derived from its own tree) verifies with zero script edits, and a caller-stated forbidden prefix catches a smuggle the family defaults miss.

## The post-release walks, commissioned

Per the walk-exit rule, everything the post-cut walks caught is now permanent in-tree:

- **Expression injection never touches run:** - every github-context value reaches workflow scripts through `env:` blocks, never inline interpolation.
- **All refusal lists print JSON-safe** - the listInterpolation trap (`['']` collapsing to nothing) is closed across every ladder message.
- **Mixed-name pack runs no longer cross-adopt** - `packs --fresh` on a mixed-name run stays mixed (with live candidates exempt), so a name-typo pack can no longer be adopted silently.
- **The forbidden scan's dead clause is out** (with the real invariant stated in the comment, not buried in code the step could never take), plus a silent notes-overwrite class moved to `$RUNNER_TEMP` and a dead import dropped.

## Battery and surfaces unchanged by the fold

Because the fold moved the version everywhere in one commit, the frozen scene held: npm tarball (v1.0.0 receipt) verified; version 1.1.0 across package.json, package-lock.json, web/package.json and web/package-lock.json together, README status line with it, and no 1.0.0 stragglers outside era rows (docs/ci.md receipts, packstruct's exact devDep pin, the 1.0.0 tag itself).

## Install

```shell
npm install --save-dev eyestruct
```

The [getting started guide](/eyestruct/start) walks init, the first look-to-gate cycle, and what each refusal means when it happens. The 1.0.0 freeze holds in full - nothing inside 1.x changed semantics; every surface named in [Announcing v1.0.0](/eyestruct/discussions/announcing-v1.0.0) binds through 1.1.0 untouched.
