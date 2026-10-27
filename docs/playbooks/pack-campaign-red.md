---
permalink: playbooks/pack-campaign-red/
layout: default
title: Red pack campaign
description: Triage for a failed npm run packs - NEW row, REGRESSION, RETIRED rows, and the adopt-diff-review dance.
---

# Triaging a red pack campaign

The pack lane fails on push for three named row-drift classes (the runner
prints the class and the case key on every line, `pack:id`):

| the runner says | what it means | the move |
|-------------------|-----------------|------------|
| `NEW <pack:id> -> <verdict>` | a case that produced a verdict, which the committed `packs/eye-ledger.json` has no row for | run the case yourself, judge the verdict on its merits, then adopt (below) |
| `REGRESSION <pack:id>: <old> -> <new>` | a previously adopted row's verdict changed - refused became exploited is the loud one | never adopt blind: reproduce, find the behavior change, fix the CLI or the case |
| `RETIRED row(s) no case produces: <keys>` | ledger rows the tree no longer produces - a case was renamed or deleted | either restore the case id or retire the row through an adopt commit |

## The adopt dance (run-packs.cjs's actual rule)

`npm run packs -- --adopt` rewrites `packs/eye-ledger.json` to the current
verdicts wholesale - that is its contract. It is not a "pass" verb; it is a
re-baseline verb, and the review that makes it honest is the ledger diff:

```text
npm run packs                      # read the drift lines first
npm run packs -- --adopt           # rebaseline: every row carries the current verdict
git diff packs/eye-ledger.json     # THE review artifact
```

Commit only when every changed and added row in that diff is expected and
explainable in the commit message. A `--adopt` commit is receipt-bearing:
the diff must not carry a verdict change nobody can name. A REGRESSION the
diff reveals after the fact gets handled like any campaign red: the
responsibility for reading before committing is yours, the ledger just
makes skipping visible in review.

## Why the lane is red-on-write

The runner is zero-dependency and subprocess-only (the real
`bin/eyestruct.js`, disposable fixture dirs), so a verdict belongs to the
pack's case, not to the machine that ran it. That is why the ledger row is
pinned to a case id (`pack:id`) and an adopted row cannot silently change
verdict later - the same discipline the eye ledger enforces on the visual
memory, pointed at the CLI's own refusals. Grammar violations of a pack
itself are refused at load by the packstruct rules before any case runs
(see [packs](/eyestruct/packs) for the authoring surface).

<div class="crosslinks">
<p><strong>More in these docs:</strong>
<a href="{{ '/playbooks/' | relative_url }}">all playbooks</a></p>
</div>
