'use strict'
// release-notes - the GH release creation step's one job: extract the
// CHANGELOG section for the packaged version so the release object and
// the changelog cannot disagree. `node scripts/release-notes.cjs
// [version]`; empty output + exit 1 means the changelog has no section
// for that version, and the release job refuses to mint one without
// notes (a release with a wrong or empty body is drift, not content).

'use strict'
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const version = process.argv[2] || JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version
const changelog = fs.readFileSync(path.join(repoRoot, 'CHANGELOG.md'), 'utf8')

const heading = `## [${version}]`
const start = changelog.indexOf(heading + ' ')
if (start === -1) {
  process.stderr.write(`release-notes: no "## [${version}]" section in CHANGELOG.md - the tag and the changelog disagree\n`)
  process.exit(1)
}
const rest = changelog.slice(start + heading.length)
const next = rest.indexOf('\n## [')
if (next === -1) {
  process.stderr.write(`release-notes: "## [${version}]" is the last heading but its section is empty\n`)
  process.exit(1)
}
const section = rest.slice(0, next).trim()
if (!section) {
  process.stderr.write(`release-notes: the "## [${version}]" section is empty\n`)
  process.exit(1)
}
process.stdout.write(section + '\n')
