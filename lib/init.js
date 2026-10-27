// eyestruct init - write the first labs/.eyes/ state (manifest pin + empty
// ledger). The manifest is hand-editable after; the pin rows it seeds are
// the baseline identity every diff is meaningful inside of.

'use strict'

const fs = require('fs')
const path = require('path')
const manifest = require('./manifest')
const ledgerMod = require('./ledger')
const bundle = require('./bundle')
const { fail } = require('./reasons')

function run(ctx) {
  const browserImage = flagValue(ctx.argv, '--browser-image')
  const renderer = flagValue(ctx.argv, '--renderer')
  const bundleTarball = flagValue(ctx.argv, '--browser-bundle')
  // The vendored checksummed bundle lane (issue #4): init stays
  // browserless - one sha pass + one tar call, an exec-path receipt -
  // and the pin records bundle@<prefix> for the capture verbs.
  let bundleRecording = null
  let bundleReceipt = null
  if (bundleTarball != null) {
    const install = bundle.install(bundleTarball)
    bundleRecording = `bundle@${install.prefix}`
    bundleReceipt = install
  }
  const file = manifest.write(ctx.cwd, ctx, { browserImage, renderer, browserBundle: bundleRecording })
  const ledgerFile = ledgerMod.ledgerPath(ctx.cwd, ctx)
  if (!fs.existsSync(ledgerFile)) {
    fs.mkdirSync(path.dirname(ledgerFile), { recursive: true })
    fs.writeFileSync(ledgerFile, '[]\n')
  }
  if (ctx.json) {
    process.stdout.write(JSON.stringify({
      ok: true,
      manifest: file,
      ledger: ledgerFile,
      ...(bundleReceipt ? { bundle: { exec: bundleReceipt.exec, sha256: bundleReceipt.sha, cachedAt: bundleReceipt.dir, reused: bundleReceipt.reused } } : {}),
    }, null, 2) + '\n')
  } else {
    process.stdout.write(`wrote ${path.relative(ctx.cwd, file)} + empty ledger\n`)
    if (bundleReceipt) {
      process.stdout.write(
        `bundle: ${bundleReceipt.reused ? 'reused' : 'installed'} ${path.basename(bundleTarball)} \n` +
        `  sha256 ${bundleReceipt.sha} (recording bundle@${bundleReceipt.prefix})\n` +
        `  exec ${bundleReceipt.exec}\n`)
    }
  }
  return 0
}

function flagValue(argv, flag) {
  const i = argv.indexOf(flag)
  return i === -1 ? null : argv[i + 1]
}

module.exports = { run }
