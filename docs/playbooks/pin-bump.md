---
permalink: playbooks/pin-bump/
layout: default
title: Pin bumps
description: Bumping pin.browser-image - the manifest edit, the proposal dispatch, and the witness dispatch.
---

# Pinning a new browser image

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

Full chrome, not `chrome-headless-shell`. The pin may name either build, but
`spot`/`look` capture reliably on full chrome (`chrome@<version>`, driven with
new headless); `chrome-headless-shell` is puppeteer's old-headless binary and
can fail every capture with `Navigating frame was detached`. The engine now
picks the headless mode from the binary name and retries once, but a pin that
names full chrome avoids the flip entirely (eyestruct #53).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/playbooks/' | relative_url }}">all playbooks</a></p>
</div>
