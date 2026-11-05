// lib/pool.js - the one bounded async pool (zero deps).
//
// The scan-speed lever crashtest#83 landed, ported to eyestruct's manifest-wide
// walk: independent captures (routes x views x themes) race up to N-wide instead
// of running strictly serially. The shape is the family one (poststruct's
// external probe pool): `limit` workers, each pulling the next index, results
// written back AT THE ORIGINAL INDEX so completion order never reorders the
// output - a walk's rows and candidates stay byte-stable per commit, exactly the
// determinism law the serial loop held.
//
// Process-per-look is preserved: this pool schedules WHO runs next, never HOW a
// capture runs - each capture still spawns its own pinned browser and exits.
// The default limit is 1, so an unstated run is the old serial loop.

'use strict'

const { fail } = require('./reasons')

/**
 * Run `fn(item, index)` over `items`, at most `limit` in flight, returning
 * results in the ORIGINAL order. `limit` defaults to 1 (serial); a non-integer
 * or sub-1 limit refuses BAD_FLAG_VALUE rather than improvising.
 */
async function runPool(items, limit, fn) {
  const width = limit == null ? 1 : limit
  if (!Number.isInteger(width) || width < 1) {
    fail('BAD_FLAG_VALUE', `concurrency must be an integer >= 1, got "${String(limit)}"`)
  }
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(width, items.length) }, worker))
  return results
}

module.exports = { runPool }
