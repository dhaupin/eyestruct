---
permalink: playbooks/first-look/
layout: default
title: First look
description: Seeding a page's baseline - init, one route, one committed proof, and a green gate.
---

# First look: seeding a page's baseline

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

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/playbooks/' | relative_url }}">all playbooks</a></p>
</div>
