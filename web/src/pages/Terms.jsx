/**
 * pages/Terms.jsx - eyestruct's terms, fleshed out from the two-paragraph
 * stub. Short by design: the MIT license in the repo carries the real legal
 * weight; this page states the surface facts in plain language.
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

        <h2>What this is</h2>
        <p>
          eyestruct is MIT-licensed software; the license text in the
          <a href="https://github.com/dhaupin/eyestruct"> repository </a>
          governs use of the tool. This site is documentation. It is provided
          as-is, without warranty of any kind, and nothing on it is an offer,
          a contract, or support.
        </p>

        <h2>The license</h2>
        <p>
          MIT means you may use, copy, modify, merge, publish, distribute,
          sublicense, and sell eyestruct, subject to the existing copyright
          and permission notice riding along. The copyright belongs to the
          project's authors; contributions are made under the same license.
        </p>

        <h2>No warranty</h2>
        <p>
          The software is furnished "as is", without warranty of any kind,
          express or implied - including merchantability, fitness for a
          particular purpose, and non-infringement. The authors are not
          liable for any claim, damages, or other liability arising from the
          software, its use, or the other dealings in it. The same disclaimer
          applies to this site and its content.
        </p>

        <h2>What the tool captures</h2>
        <p>
          eyestruct captures screenshots only of URLs you point it at, stores
          them where you commit them, and sends nothing anywhere on its own.
          Baseline images can carry whatever your pages render - treat
          committed labs/.eyes/ artifacts as content you chose to store. The
          committed ledgers (pack verdicts, attack results) become part of
          your git history exactly like any other file you commit.
        </p>

        <h2>No support contract</h2>
        <p>
          There is none. Issues and pull requests on the repository carry
          good-faith best effort: they are reviewed when reviewed, and nothing
          here promises a fix, a timeline, or a response. A pinned browser
          image may arrive with its own version and license terms - check that
          project's terms before adopting it into CI.
        </p>

        <h2>Attribution</h2>
        <p>
          The docs pages and this site may copy freely with the usual notice;
          family-recognized struct-shape artifacts are shared tools, and each
          repo in the family carries its own license text as the governing
          document.
        </p>

        <p style={{ marginTop: 26 }}>
          <Link to="/" className="btn btn-ghost">Back home</Link>
        </p>
      </div>
    </section>
  )
}
