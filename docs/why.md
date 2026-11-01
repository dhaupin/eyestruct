---
permalink: why/
layout: default
title: Why eyestruct
description: A UI change ships unchecked because nobody in the loop looked. Why production agents need eyes and a committed visual memory instead of a screenshot nobody diffs.
nav_order: 8
---

# Why eyestruct

A UI change ships unchecked because nobody in the loop looked. eyestruct gives
agents and CI the same thing: a deterministic look, a committed baseline, and a
gate that fails loudly when the pixels move without an explanation.

## The problem: pixels move silently

A UI regression is the class of bug no unit test catches: the build is green,
the assertions pass, and the page renders wrong. A human reviewer sees the diff
only if someone looked. An agent that ships code cannot see the page it just
changed.

The fix is not more screenshots. It is a committed visual memory: a baseline in
the repo, a deterministic capture that reproduces exactly, and a gate that
treats unexplained drift as a failure, the same way crashtest treats a new
exploit.

## The thesis: canon is CI-cut

A local capture is a proposal, never the truth. Baselines are cut by the
pinned-image lane in CI, so the committed memory is reproducible and a local
machine cannot quietly rewrite what the team agrees the page looks like.

The same memory serves two lanes: the CI lane catches regressions, and an
agent's instance lane lets a coding agent watch its own work while it builds.
Candidate-only there too - the canon stays CI-cut even when the agent is the
one looking.

## Who it is for

Anyone shipping a UI they cannot fully test: the CI that must fail on a visual
regression, the agent that has to see what it changed, and the maintainer who
wants a committed record of what every page looked like on every wave.

<div class="crosslinks">
<p><strong>Next:</strong>
<a href="{{ '/what/' | relative_url }}">what eyestruct is</a> ·
<a href="{{ '/about/' | relative_url }}">about the project</a></p>
</div>
