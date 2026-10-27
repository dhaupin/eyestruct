/**
 * pages/Privacy.jsx - eyestruct's privacy statement, fleshed out from the
 * stub. The tool is local-first: no server to collect anything. This page
 * keeps the same honesty for the site itself, including the one remote
 * fetch the live-status pages make.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

export default function Privacy() {
  usePageMeta({
    path: '/privacy',
    title: 'Privacy | eyestruct',
    description: 'What this site collects: nothing. No server, no accounts, no hidden states to find - plus the one GitHub-origin fetch the status page makes.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <h1>Privacy</h1>

        <h2>The tool</h2>
        <p>
          eyestruct runs on your machine. It has no server, no accounts, and
          no telemetry: captures are stored where you commit them (your
          labs/.eyes/ directory, your git history), and the only state that
          survives between looks is git state. It makes no network calls on
          its own behalf; traffic happens only because a command you ran
          navigated to a URL you chose.
        </p>

        <h2>This site</h2>
        <p>
          The site collects nothing. Pages are static files: no analytics,
          no cookies, no forms, no tracking states to find, no account
          system. One browser-local preference is stored - your light/dark
          theme choice, saved under a localStorage key. It never leaves the
          browser.
        </p>

        <h2>The one remote fetch</h2>
        <p>
          The <Link to="/status">live status</Link> page adds one exception,
          and this statement says so plainly: after load, the page fetches
          two committed JSON files
          (<code>packs/eye-ledger.json</code>, <code>labs/crashledger.json</code>)
          from <code>raw.githubusercontent.com</code>. That request goes to
          GitHub's servers like any file view; GitHub sees your IP address
          and handles it under their privacy policy. No other page fetches
          anything, and no data leaves the browser on this site's behalf.
        </p>

        <h2>What commits record</h2>
        <p>
          If you run eyestruct in CI or commit its artifacts, remember they
          may be public (or shared with whoever can read your logs): a
          capture image contains whatever your page rendered, and a ledger
          note contains what you typed. Treat both like the other files in
          your repo - do not commit what you would not publish.
        </p>

        <h2>Contact</h2>
        <p>
          Open an issue on the <a href="https://github.com/dhaupin/eyestruct">
          repository</a> or reach the maintainers through
          <a href="https://creadev.org"> creadev.org</a>.
        </p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back home</Link>
        </p>
      </div>
    </section>
  )
}
