---
permalink: mcp/
layout: default
title: MCP reference
description: The stdio MCP surface - ten tools decoding the CLI verbs, newline-delimited JSON-RPC 2.0 over stdio, same named reason-codes mapped to tool errors. The CLI is the contract, the server is its decoding.
---

# MCP reference

`eyestruct mcp` speaks newline-delimited JSON-RPC 2.0 over stdio - the MCP
stdio transport shape - with zero dependencies. The principle printed in
the server source: the CLI is the contract, the MCP server is a decoding
of it. Same verbs, same named reason-codes, same exit-contract semantics
mapped to tool errors, and never a process exit inside a server.

## The session shape

A client sends one JSON object per line; the server answers one per line.
The methods it handles:

| method | server behavior |
|--------|-----------------|
| `initialize` | answers `protocolVersion`, tool capabilities, and `serverInfo` (`eyestruct` / package version) |
| `notifications/initialized` | intentionally un-answered - a notification is the protocol, not a dropped reply |
| `ping` | answers an empty result |
| `tools/list` | the ten tools with names, descriptions, and JSON Schema `inputSchema`s |
| `tools/call` | runs the named tool, returns `content` blocks; errors return `isError: true` with the named reason as text |
| anything else | the named method is refused with a structured `unknown method` error |

The transport stays honest: verbs that normally print to stdout print
JSON-RPC *framing* every line, so inside the stream tool output is
captured by the server and returned as tool result text - a stray console
line in a stdio channel would read as a parse error on the client side.

Malformed input gets a JSON-RPC parse error answering to `id: null`,
never a crash and never a guess: unknown tool names, unknown methods, and
unsupported fields refuse loudly at the boundary.

## The tools

Ten tools decode the CLI verbs (the count and shape live in
`lib/mcp.js`'s `TOOLS` registry). Every refusal that a CLI verb would give
the shell arrives as a tool error carrying the same
`eyestruct[CODE]: explanation` text.

| tool | arguments | notes |
|------|-----------|-------|
| `look` | `url`, `viewport`, `theme`, `region`, `include_image`, `no_overlay`, `full_page`, `format`, `quality` | one capture pass yields the element map plus meta with the image attached only when asked - the core law: smallest artifact that answers the question; plain-capture defaults: `url` `http://localhost:5178/`, `viewport` 1280x800; `no_overlay` is the clean frame - the pixels never carry the element-id overlay, the map still computes (creadev #18); `full_page` grows the frame to the full document height at the viewport width, `format` picks `png|webp`, `quality` is the webp-only integer 1-100 (creadev #19/#20 - canon never rides these) |
| `diff` | `url`, `against`, `viewport`, `theme` | fresh capture vs committed baseline; verdict `SAME`/`DIFFERS` by byte equality inside the pin (a slot with a tolerance profile is judged at the pixel level under that profile, measured numbers attached); `url` defaults to `http://localhost:5178/` |
| `adopt` | `artifact`, `note` | unratified proposal (`ratified:false`); canon stays CI-cut, exactly like the CLI |
| `ratify` | `base_url` | re-captures every manifested route in the pinned env; byte-identical slots ride append-only ratify rows, and a slot with a tolerance profile rides a pixel-eq-at-bounded-span row that carries the profile verbatim. `walk` and `ratify` without `base_url` target `http://localhost:5178` (the app-side dev-server default) - state a `base_url` for anything else |
| `ledger_list` | `route` | the committed memory, optional artifact filter |
| `ledger_show` | `id` | one ledger row, complete |
| `gate` | none | the CI pass: exit-contract verdict on unexplained drift, returned as machine JSON with the exit code |
| `raster` | `files` | strict parse + render + byte sanity for committed renderables |
| `walk` | `base_url` | every route x viewport x theme, one pass; candidates land in `labs/.eyes-candidates/` |
| `spot` | `url`, `viewport`, `theme`, `region`, `include_image`, `no_overlay`, `full_page`, `settle`, `format`, `quality` | the instance-loop step: one capture, ALWAYS saved as a file path the agent re-opens with its own vision on a later turn (`labs/.eyes-candidates/`); the image itself rides inline only when asked; same capture defaults and output-shape options as `look` (`full_page`/`settle`/`format`/`quality` ride the same shared engine jail, creadev #19/#20, issue #27 - `settle` walks the document and waits for below-fold lazy images so a lazy image is not returned blank). `serve` stays CLI-only - it owns a port for its lifetime, and the MCP server already owns the stream |

## The core law at the tool surface

`look` returns the element map and meta by DEFAULT - the pixels ride as
image content only when the client sets `include_image`. An
image-capable model burns the pixels when it needs them; a metric-only
query never pays for them. That is the perception QoS ordering from the
PRD, wired at the tool boundary rather than left to caller discipline.

The same law shapes `diff`: it compares against the manifest's first
route unless `against` names an eyes-relative artifact path.

## Error mapping

| CLI refusal | MCP surface |
|-------------|-------------|
| reason-code refusal (exit 1 + 2 classes, e.g. `ADOPT_NOTE_REQUIRED`) | `tools/call` result with `isError: true` and the `eyestruct[CODE]` text |
| CLI exit code 0 | result content blocks, machine-shaped JSON |
| unknown tool / unknown method | the structured `unknown ...` error, no process exit |
| non-JSON request line | JSON-RPC parse error answering `id: null` |

The named-codes contract is identical to the CLI's - the full list lives
at [reason codes](/eyestruct/reasons).

## What the tools touch

Same files the CLI touches, nothing more: `labs/.eyes/` (manifest,
baselines, ledger - read or appended by `adopt`/`ratify`), the
gitignored `labs/.eyes-candidates/` for probe artifacts, and the pinned
browser the manifest names. One writer of truth per store: the tools are
the library modules the CLI itself calls, never a subprocess detour, so
the ledger's atomic append and corruption refusals cannot be bypassed
from the tool side.

## Host wiring

Add the server with whatever mechanism the host uses for stdio servers;
the command is `eyestruct mcp` (or `npx eyestruct mcp`). Nothing listens
on a port, nothing reads environment beyond the CLI's usual flags - the
same `EYESTRUCT_BROWSER` / `--browser-exec` / manifest pin / cache
discovery order applies to browser-backed tools.

## Where this comes from

This page mirrors `lib/mcp.js` (the `TOOLS` registry feeds `tools/list`
verbatim). When a tool name, argument, or behavior and this page
disagree, the source wins and this page gets a fix on the next edit -
same rule the [CLI reference](/eyestruct/cli) carries.

## The 1.0.0 stability contract

The ten-tool stdio surface freezes at 1.0.0 until 2.x. Within 1.x the
`TOOLS` registry in `lib/mcp.js` holds the same semver law the CLI holds:
no tool name, argument, or schema semantic is removed or changed -
removals and semantic changes ride a major bump only, additions land as
minors with this page updated in the same commit (spot joined that way,
2026-10-28, with the agents-vision loop). The `initialize` protocol shape
and the error-mapping table above are part of the same frozen surface.
The count census in the battery keeps any prose tool claim equal to
`TOOLS.length`, so an eleventh tool can never arrive with a "ten tools"
sentence still standing.
