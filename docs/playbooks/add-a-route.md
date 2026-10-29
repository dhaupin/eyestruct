---
permalink: playbooks/add-a-route/
layout: default
title: Adding a route
description: Extending the manifest's route matrix by hand, then walk over the whole thing.
---

# Adding a route to the matrix

Extending the manifest is hand-editing a strict subset (no fancy YAML):

```text
edit labs/.eyes/manifest.yml -> routes: add a row (path / view / theme / viewport)
eyestruct walk http://localhost:4173/
```

`walk` captures every route x viewport x theme in one pass and drops all
the candidates. Route naming follows the manifest's slot
`<route>/<view>/current.png` convention; adopt the slots that deserve
baselines, gate, dispatch when canon should cut them.

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/playbooks/' | relative_url }}">all playbooks</a></p>
</div>
