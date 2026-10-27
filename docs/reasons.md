---
permalink: reasons/
layout: default
title: Reason codes
description: Every named refusal eyestruct can emit - the 0-1-2 exit contract, the full reason-code table, and how failures print. No bare stack traces ever leave the CLI.
---

# Reason codes

Failures never improvise: every nonzero exit prints a NAME and a one-line
explanation, in prose and in `--json`. The shape is always the same:

```text
eyestruct[CODE]: one-line explanation - extra context when the CLI has it
```

The exit contract has three levels:

| exit | meaning |
|-------|-----------|
| `0` | green, or a result fully explained |
| `1` | drift or refusal with a reason-code |
| `2` | setup or capability trouble (missing manifest, missing pinned browser) |

Inside the library, `fail()` throws; only the CLI boundary owns the
process and converts the error into the exit contract. That is why an
in-process caller (the MCP server, the test battery) dies with a named
error instead of killing the whole runner.

## Capability and setup (exit 2)

| code | one-line meaning |
|--------|--------------------|
| `MISSING_MANIFEST` | no `labs/.eyes/manifest.yml` - run `eyestruct init` first |
| `MANIFEST_CORRUPT` | the manifest does not parse as the pin + route matrix schema |
| `LEDGER_CORRUPT` | the ledger file is not parseable append-only JSON rows |
| `LEDGER_MISSING` | the stated `--ledger` path does not exist - run init or point at a real ledger file |
| `MISSING_PINNED_BROWSER` | the pinned browser is not installed on this machine |
| `MISSING_RENDER` | no raster renderer available (install the optional @resvg/resvg-js package) |
| `PACKSTRUCT_MISSING` | packstruct is not installed in this repo - the pack lint lane never downloads one at request time |
| `MCP_POST_MVP` | the MCP surface lands after the CLI receipts are proven |

## Drift and refusals (exit 1)

| code | one-line meaning |
|--------|--------------------|
| `UNKNOWN_COMMAND` | not an eyestruct command |
| `UNRECORDED` | a committed `labs/.eyes/` artifact has no ledger row explaining it |
| `DANGLING_ROW` | a ledger row references an artifact that no longer exists |
| `PIN_MISMATCH` | capture ran on a pin other than the manifest baseline pin |
| `ADOPT_NOTE_REQUIRED` | adopt requires `--note` explaining the change |
| `UNSAFE_TEXT` | a text field carries a control character that would poison downstream readers |
| `NO_BASELINE` | no committed baseline to diff against - capture with `look` then `adopt` |
| `BAD_FLAG_VALUE` | the flag is present but carries an empty value - give it a value or drop the flag |
| `BAD_VIEWPORT` | viewport must be WxH within the sane range |
| `BAD_THEME` | theme must be dark or light |
| `CAPTURE_BLOCKED` | the pinned browser could not complete the capture |
| `CAPTURE_TOO_SKELETAL` | the capture is implausibly small (a blank frame is not a look) |
| `CROP_TARGET_MISSING` | the `--region` selector matched nothing on the page |
| `CROP_TOO_BIG` | the `--region` selector is over the cheap-layer size cap |
| `RASTER_BAD_XML` | the artifact does not parse as strict SVG or XML |
| `RASTER_TRIVIAL` | the artifact rendered to nothing or an implausibly small payload |
| `WALK_EMPTY` | the manifest declares no routes to walk |

## Triage cheat sheet

| you saw | likely cause | next move |
|-----------|----------------|---------------|
| `UNRECORDED` | pixels changed without an `adopt` row | run `look` + `diff`, then `adopt --note` for the real change |
| `DANGLING_ROW` | the row explains a file git no longer has | restore the file or rewrite history through the ledger, never past it |
| `LEDGER_CORRUPT` / `MANIFEST_CORRUPT` | truncation or a bad merge | fix the file from git; the reader never guesses past a bad row |
| `MISSING_PINNED_BROWSER` | machine has no pinned chrome | install the manifest's `pin.browser-image` version |
| `PACKSTRUCT_MISSING` | packstruct devDep missing | `npm i -D packstruct@<exact>` |

This page mirrors `lib/reasons.js` - the CODES + REASONS tables it emits
from. Disagreement means the page is stale and the lib wins.
