---
permalink: playbooks/ship-visual-change/
layout: default
title: Shipping a visual change
description: The agent-edited-a-frame flow end to end - candidate, mask-invariant diff, explained adopt, gate.
---

# Shipping a visual change

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

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/playbooks/' | relative_url }}">all playbooks</a></p>
</div>
