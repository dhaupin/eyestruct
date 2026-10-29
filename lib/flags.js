// The ONE flag-value reader. Every verb's private copy of this function was
// the flag-lie class by another name: the dispatch's flag gate normalizes
// the joined spelling (--format=webp) into a bare-flag membership test and
// passes it, then the verb's hand-copied indexOf(flag) reader missed the
// joined token entirely and SILENTLY answered the default - an accepted
// spelling that does nothing, exactly the class UNKNOWN_FLAG was landed to
// kill (the 2026-10-28 round: "a flag that does nothing is a lie"). The
// shared reader closes the class by construction: separated (--ledger PATH)
// and joined (--ledger=PATH) both resolve, absence is null, and there is
// exactly one implementation to audit.
//
// Semantics intentionally unchanged from the copies it replaces: this is a
// pure reader - stated-empty values are refused by the surfaces that own
// their contracts (bin's VALUE_FLAGS screen for the strict flags, the
// engine's capture jail for the capture shapes, ADOPT_NOTE_REQUIRED for
// --note), never silently. Absence stays null: existing callers that test
// stated-ness do it against null.

'use strict'

function flagValue(argv, flag) {
  if (!Array.isArray(argv)) return null
  const i = argv.indexOf(flag)
  if (i !== -1) return argv[i + 1] == null ? null : argv[i + 1]
  const prefix = flag + '='
  const joined = argv.find((a) => typeof a === 'string' && a.startsWith(prefix))
  return joined === undefined ? null : joined.slice(prefix.length)
}

module.exports = { flagValue }
