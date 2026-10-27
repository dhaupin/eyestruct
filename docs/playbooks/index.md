---
permalink: playbooks/
layout: default
title: Playbooks
description: The workflows eyestruct agents run daily - first look, shipping a visual change, triaging a red gate, pinning a new browser image, and answering a visual question browserless.
---

# Playbooks

Each playbook is the short series of commands an agent runs, with the
receipts at every step. All of them stay inside the contract: named
reason-codes, append-only ledger, canon cut by CI.

## 1. First look: seeding a page's baseline

Fresh manifest, one route, one committed proof:

```text
eyestruct init --browser-image chrome@<pinned-version> --renderer resvg@2.6.2
eyestruct look file:///srv/site/index.html --viewport 1280x800 --theme dark
eyestruct adopt home/desktop-1280-dark/current.png --note "first committed baseline: local index, dark, pinned"
eyestruct gate
```

What you get: a manifest that pins the environment, a candidate PNG in
`labs/.eyes-candidates/`, an adopted (unratified) row in the ledger, and a
green gate. The baselines under `labs/.eyes/home/...` are still
proposals until CI cuts them.

## 2. Shipping a visual change

The agent-edited-a-frame flow, end to end:

```text
edit the page or the build
eyestruct look <url> --viewport 1280x800 --theme dark      (candidate)
eyestruct diff <url>                                        (mask-invariant verdict)
eyestruct adopt home/desktop-1280-dark/current.png --note "rebuilt the nav; expected because <reason>"
eyestruct gate
git commit -m "nav rebuild + baseline proposal"
```

The rule that makes this safe: a diff that ships without a ledger row
explaining it fails the pass. Agents automate the capture; the ledger row
is where the human-readable receipt lives.

## 3. Triaging a red gate

```text
run gate -> read the named code (eyestruct[...])
```

The two drift codes and their moves:

| code | the move |
|--------|--------------|
| `UNRECORDED` | capture + diff + adopt a real note; the baseline proposal is the receipt |
| `DANGLING_ROW` | a ledger row names a file git lost - restore the file or rewrite history THROUGH the ledger, never past it |

Corruption codes (`LEDGER_CORRUPT`, `MANIFEST_CORRUPT`) mean truncation or
a bad merge: restore from git, fix the merge. The reader never guesses
past a bad row, so the fix is mechanical, not investigative. See
[reason codes](/eyestruct/reasons) for the full table.

## 4. Pinning a new browser image

The manifest is the single source of truth - the lane reads the version
out of `pin.browser-image`, so a bump is one edit:

```text
edit labs/.eyes/manifest.yml -> pin.browser-image: chrome@<new-version>
dispatch eyes-ratify (workflow_dispatch)
```

What the dispatch does on a fresh pin: it will find DRIFT (the old
baselines cannot reproduce on the new pin), promote the pinned-env
captures as proposals, and commit them. The second dispatch is the
independent witness that cuts canon on the new pin. A pin bump is exactly
two dispatches, never a hasty overwrite.

## 5. Answering a visual question from memory (no browser)

The whole reason the eyes live in git: a fresh session answers with the
committed state alone:

```text
read labs/.eyes/manifest.yml            (what the pin is, which routes exist)
eyestruct ledger list                   (what changed, when, why - agent, commit, note)
```

The chain shares state via git. A fresh agent wakes up OWNING the project's
visual history the way it owns the brain - no browser session, no live
render, no guess-telling. If the answer is about pixels rather than memory,
the honest move is a new `look`, not an argument.

## 6. Adding a route to the matrix

Extending the manifest is hand-editing a strict subset (no fancy YAML):

```text
edit labs/.eyes/manifest.yml -> routes: add path / settings.yaml-pro
eyestruct walk http://localhost:4173/
```

`walk` captures every route x viewport x theme in one pass and drops all
the candidates. Route naming follows the manifest's slot
`<route>/<view>/current.png` convention; adopt the slots that deserve
baselines, gate, dispatch when canon should cut them.
