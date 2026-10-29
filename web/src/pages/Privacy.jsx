/**
 * pages/Privacy.jsx - eyestruct's privacy statement, converged on the
 * family canonical legal-page form (eyestruct#7's written five-point
 * structure): short version first, the tool section (no telemetry,
 * findings stay yours, install traffic), this website, third parties
 * named, data retention, questions - plain language, one non-empty h1.
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

        <p className="eyebrow">
          The short version: we collect nothing, we keep nothing, and every
          remote fetch this site or the tool makes is named on this page.
        </p>
        <p className="web-version">
          Web version 2026-10-28. The long form is this page plus the facts
          in the <a href="https://github.com/dhaupin/eyestruct">repository</a>
          {' '}- the tool's code is the receipt; read the network calls in
          <code> lib/engine.js</code> to check us.
        </p>

        <h2>The tool</h2>
        <p>
          eyestruct runs on your machine. No server, no accounts, no
          telemetry: captures are stored where you commit them (your
          <code> labs/.eyes/</code> directory, your git history), and the
          only state that survives between looks is git state. The tool
          makes no network calls on its own behalf - traffic happens only
          because a command you ran navigates to a URL you chose, and its
          findings stay yours: nothing is sent anywhere by eyestruct.
        </p>
        <p>
          One traffic source every install carries, named plainly:
          <code> npm install eyestruct</code> fetches the package and its
          runtime dependency (<code>puppeteer-core</code>) from the npm
          registry, and a pinned browser fetches from wherever you point it
          (npm or a bundle URL you supplied). Those servers see the request
          the same way any package download works; they handle it under
          their policies, and none of it is routed or arranged by us.
        </p>

        <h2>This website</h2>
        <p>
          The site collects nothing. Pages are static files: no analytics,
          no cookies, no forms, no tracking states to find, no account
          system. One browser-local preference is stored - your light/dark
          theme choice, saved under a localStorage key. It never leaves the
          browser.
        </p>
        <p>
          The <Link to="/status">live status</Link> page adds the fetches
          this site makes, named plainly: after load, its gate card fetches
          two committed JSON files
          (<code>packs/eye-ledger.json</code>, <code>labs/crashledger.json</code>)
          from <code>raw.githubusercontent.com</code>, and its family card
          fetches each of the four family sites' served
          <code> /status.json</code>. All of them are read-only loads after
          page load. The two raw files go to GitHub like any file view
          (GitHub sees your IP address and handles it under their privacy
          policy); the four family requests go to the same creadev.org
          rig hosting the sites themselves. No other page fetches
          anything, and no data leaves the browser on this site's behalf.
        </p>

        <h2>Third parties - named</h2>
        <ul>
          <li><strong>Hosting:</strong> this site is served as static files from Cloudflare Pages (creadev.org's rig). Cloudflare serves the pages and sees normal request logs - we never received a copy and asked for none.</li>
          <li><strong>Registry:</strong> npmjs.org serves package installs (see the tool section).</li>
          <li><strong>Code host:</strong> GitHub serves this repo, the raw files the status page fetches, and the docs Pages lane.</li>
        </ul>
        <p>
          Three named parties, none of them us-side collectors: static
          hosting, package registry, git host. No ad networks, no analytics
          vendors, no scripts from strangers.
        </p>

        <h2>Data retention</h2>
        <p>
          We retain nothing, because we never took possession of anything:
          there is no backend bucket, no user table, no email list. What
          you commit (captures, ledgers, notes) stays in your repository
          under your retention policy - a capture contains whatever your
          page rendered and a note contains what you typed, so treat both
          like any other file you would or would not publish. Your theme
          choice lives in your browser until you clear it.
        </p>

        <h2>Questions</h2>
        <p>
          Open an issue on the <a href="https://github.com/dhaupin/eyestruct">
          repository</a> or reach the maintainers through
          <a href="https://creadev.org"> creadev.org</a>. Privacy questions
          get the same named-answer treatment as the tool's refusals: we
          cite the code path, not a reassurance.
        </p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back home</Link>
        </p>
      </div>
    </section>
  )
}
