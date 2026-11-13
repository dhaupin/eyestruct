---
permalink: discussions/announcing-v1.3.2/
layout: default
title: Announcing v1.3.2
description: v1.3.2 fixes a shutdown race in serve, so a SIGINT that lands as the banner appears now exits 0, with a regression test proven to bite.
version: 1.3.2
---

# Announcing v1.3.2

eyestruct is eyes for production agents: capture, diff, adopt, and ratify what a surface actually looks like. v1.3.2 fixes one bug in the `serve` verb. The CLI surface, the reason codes, the MCP tools, and the schemas are unchanged.

```bash
npm i -g eyestruct
```

## The race

`serve` owns its process until you stop it, and its exit contract is a clean exit 0 on SIGINT. It armed its `SIGINT` and `SIGTERM` handlers only after writing the banner, and the banner is the one line a caller reads to learn the port. A consumer that signals on reading it could therefore beat the handler: the signal fell through to the OS default disposition and the process died with a non-zero code instead of a clean exit 0. Measured against the shipped tree, 59 of 60 banner-triggered SIGINTs killed the process.

## The fix

The handlers are now armed before the banner write, so the banner is never observable without a live shutdown handler. Re-measured, 60 of 60 exit 0. A SIGINT that arrives before the server is up still terminates by signal, which is correct: the port is not knowable yet, and the caller has nothing to shut down.

## The test that bites

A new case in `tests/smoke.test.js` signals in the same tick the first stdout byte arrives, five rounds, and asserts a clean exit 0. It was proven to bite: reverting `lib/serve.js` to the pre-fix ordering turns it red, three runs of three. That is the house law here, a new law ships with a test that fails without it.

## Links

- Repo and docs: https://github.com/dhaupin/eyestruct / https://docs.creadev.org/eyestruct
- Changelog: https://github.com/dhaupin/eyestruct/blob/main/CHANGELOG.md
- Issues: https://github.com/dhaupin/eyestruct/issues
