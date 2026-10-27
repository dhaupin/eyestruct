---
permalink: labs/prd-eyes/
layout: default
title: PRD
description: The eyestruct PRD lives in the repo, not the docs site - it is the agent-voice surface at labs/prd-eyes.md, written under its own voice rules and read through git.
---

# The PRD

The canonical PRD for eyestruct does not ship on this site. It lives in
the repository at `labs/prd-eyes.md`, alongside the eye home
(`labs/.eyes/`) and the rest of the lab surface:

- [Read the PRD in the repo](https://github.com/dhaupin/eyestruct/blob/main/labs/prd-eyes.md)
- [Read labs/TASKS.md - the rolling work log](https://github.com/dhaupin/eyestruct/blob/main/labs/TASKS.md)

Why it lives there instead of here: the PRD is the agent-voice surface -
it carries its own voice rules (em-dash prose) and its own edit history.
The docs site is the hyphen-voice rig for humans using the CLI. The two
audiences read in parallel, share receipts, and never swap voices.

What the PRD decides (a map, not a copy):

- the memory law: the eye home is committed git state, ledger-gated, CI-cut
- the mask-invariant rule: text edges are masked so a typo never hides a
  real visual change
- the pin discipline: the manifest is the single source of truth a
  capture lane broadcasts

Nowhere else. This page holds the nav slot so the sidebar route exists;
edit the PRD in the repo, not here.
