---
permalink: playbooks/red-gate-triage/
layout: default
title: Red-gate triage
description: Reading a failed eye gate - the two drift codes, their moves, and the corruption-distance rule.
---

# Triaging a red gate

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

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/playbooks/' | relative_url }}">all playbooks</a></p>
</div>
