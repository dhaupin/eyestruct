/**
 * pages/Terms.jsx - eyestruct's terms, converged on the family canonical
 * legal-page form (eyestruct#7, the five-point structure written in the
 * issue body): eyebrow line, a dated web-version line with the long form
 * pointed at the repo, then use / purpose / ownership / fair use /
 * changes - plain language, no theater, one non-empty h1.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

export default function Terms() {
  usePageMeta({
    path: '/terms',
    title: 'Terms | eyestruct',
    description: 'Terms of use for eyestruct and this site: MIT-licensed tool, no warranty, no support contract, you own what you capture.',
  })
  return (
    <section className="section" style={{ paddingTop: 56 }}>
      <div className="wrap legal">
        <h1>Terms</h1>

        <p className="eyebrow">
          Plain language, no theater: what you may do, what nobody promises,
          and where the binding text actually lives.
        </p>
        <p className="web-version">
          Web version 2026-10-28. The long form is the MIT license text in
          the <a href="https://github.com/dhaupin/eyestruct">repository</a> -
          this page describes it, it does not replace it.
        </p>

        <h2>Use of the site and the tool</h2>
        <p>
          You may use eyestruct and read this site. The tool is
          MIT-licensed software: the license text in the repository governs
          the tool, and this page governs the site around it. Nothing on
          the site or the tool is an offer, a contract, or support.
        </p>

        <h2>What it is for</h2>
        <p>
          eyestruct captures a screenshot of a URL you choose, records what
          changed, and commits the evidence into your repository so CI can
          gate on drift. It exists to give production agents and their
          operators proof of what a page looked like - not to surveil,
          scrape, or publish anything you did not point it at.
        </p>

        <h2>What you own</h2>
        <p>
          You own your captures, your baselines, and your ledger rows.
          Anything eyestruct writes lands in your working tree and becomes
          part of your git history exactly like any other file you commit.
          The software itself stays under its MIT license - you may use,
          copy, modify, merge, publish, distribute, sublicense, and sell it
          subject to the license's copyright and notice lines. Contributions
          are made under the same license.
        </p>

        <h2>Fair use of this site</h2>
        <p>
          The site is documentation: copy from it freely with the usual
          notice, don't present it as your own product's wording, and don't
          use it to imply endorsement. The software is furnished "as is",
          without warranty of any kind, express or implied - merchantability,
          fitness for a particular purpose, non-infringement - for the site
          and its content as much as the tool. There is no support contract:
          issues and pull requests are reviewed when reviewed, and nothing
          here promises a fix, a timeline, or a response.
        </p>

        <h2>Third parties you bring</h2>
        <p>
          A pinned browser image, a bundle tarball, or any other artifact
          you hand eyestruct may arrive with its own version and license
          terms - check that project's terms before adopting it into CI.
          eyestruct refuses what refuses to name itself, but refusals are
          not legal checks, and the third party's license governs what you
          vendored.
        </p>

        <h2>Changes</h2>
        <p>
          The tool's license and the site's content can change with the
          repo; material changes land as commits anyone can diff, and the
          web-version line at the top moves when this page's meaning does.
          Continued use after a change means the changed terms, same as any
          site on the web - but for the tool itself, the license text your
          version shipped with is what governs that version.
        </p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back home</Link>
        </p>
      </div>
    </section>
  )
}
