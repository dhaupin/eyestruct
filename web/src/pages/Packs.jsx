/**
 * pages/Packs.jsx - the adversarial-surface reference, promoted from the
 * landing's "the eye polices itself" section. This is the human-readable
 * face of packs/eye-ledger.json + labs/crashledger.json; deep grammar and
 * authoring details live in the docs packs page.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const DOCS = 'https://docs.creadev.org/eyestruct'

export default function Packs() {
  usePageMeta({
    path: '/packs',
    title: 'Packs | eyestruct',
    description:
      'The adversarial surface: 37 pack cases over the real CLI, a 52/52 hostile-attack leg, and a committed verdict ledger a regression fails loudly.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">packs</p>
          <h1>
            The eye polices itself, <span className="accent">on every push.</span>
          </h1>
          <p className="lede">
            A pack is a self-contained bundle that loads into the runner,
            drives the real CLI as its vocabulary, and hosts hostile scenarios
            against it. Nothing inside a pack imports the target - every
            attack is a subprocess with real exit codes.
          </p>
          <div className="cta-row">
            <a className="btn btn-primary" href={`${DOCS}/packs/`}>Full pack grammar</a>
            <a className="btn btn-ghost" href="#taxonomy">Verdict taxonomy</a>
            <a className="btn btn-ghost" href="#ledger">The committed ledgers</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The attack surface, live</h2>
          <p className="sub">
            37 adversarial pack cases over the real CLI, a second leg of 52
            hostile attacks (seeded, deterministic), and a committed verdict
            ledger: a NEW exploited case or any verdict regression fails CI.
          </p>
          <div className="table-wrap">
            <table className="attacks">
              <thead>
                <tr><th>attack class</th><th>what it tries</th><th>verdict</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td className="mod">ledger tampering</td>
                  <td><span className="what">corrupt JSON, duplicate ids,
                  control-char payloads</span><div className="why">the reader
                  refuses loudly, never improvises past a bad row</div></td>
                  <td><span className="verdict-ok">REFUSED</span></td>
                </tr>
                <tr>
                  <td className="mod">manifest corruption</td>
                  <td><span className="what">strict hand-editable subset
                  violations</span><div className="why">a bad manifest is a
                  setup error (exit 2), named at the field</div></td>
                  <td><span className="verdict-ok">REFUSED</span></td>
                </tr>
                <tr>
                  <td className="mod">unexplained memory</td>
                  <td><span className="what">drift with no ledger row, or a row
                  whose file git lost</span><div className="why">UNRECORDED /
                  DANGLING_ROW name it; the fix is mechanical</div></td>
                  <td><span className="verdict-ok">REFUSED</span></td>
                </tr>
                <tr>
                  <td className="mod">note-free adopts</td>
                  <td><span className="what">adopt without --note</span>
                  <div className="why">the explanation is captured at write
                  time, not reconstructed after</div></td>
                  <td><span className="verdict-ok">REFUSED</span></td>
                </tr>
                <tr>
                  <td className="mod">hostile archive bundles</td>
                  <td><span className="what">missing tarballs, chrome-less
                  archives, tampered cache markers, checksum forgeries</span>
                  <div className="why">the vendored browser lane verifies
                  its receipt (sha256 in the manifest + integrity marker)
                  before the exec is ever resolved</div></td>
                  <td><span className="verdict-ok">REFUSED</span></td>
                </tr>
                <tr>
                  <td className="mod">hostile argv + stdio</td>
                  <td><span className="what">14 hostile argv batches; MCP
                  frames that are garbage, proto-polluted, oversized, or
                  null-methoded; 6 hostile ledger file variants</span>
                  <div className="why">fixed batch list and seed (0xE1E5) -
                  the same commit always fires the same attacks</div></td>
                  <td><span className="verdict-ok">52/52 REFUSED</span></td>
                </tr>
                <tr>
                  <td className="mod">browser-class without a browser</td>
                  <td><span className="what">capture attacks that need a
                  headless image inside a browserless campaign</span>
                  <div className="why">covered live by the battery's
                  browser-cached machines, not faked in the campaign</div></td>
                  <td><span className="verdict-mid">BOUNDED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="field-report">
            The counts above are current-tree receipts, not marketing: the pack
            ledger sits at <code>packs/eye-ledger.json</code>, the crashtest
            baseline at <code>labs/crashledger.json</code>, the full battery
            map at <a href={`${DOCS}/ci/`}>the CI guide</a>, and the verdict
            taxonomy with the authoring surface at <a href={`${DOCS}/packs/`}>packs</a>.
          </p>
        </div>
      </section>

      <section className="section" id="taxonomy">
        <div className="wrap">
          <h2>The verdict taxonomy</h2>
          <p className="sub">
            Every scenario lands in exactly one of four buckets. Adoption is
            explicit - a new verdict only enters the ledger through a reviewed
            commit, never a silent rebuild.
          </p>
          <div className="grid">
            <div className="card">
              <h3><span className="verdict-ok">REFUSED</span></h3>
              <p>The CLI said no, cleanly, with its named code. A regression
              here is loud, not quiet.</p>
            </div>
            <div className="card">
              <h3><span className="verdict-mid">BOUNDED</span></h3>
              <p>The damage was contained to a documented limit - a byte cap,
              a fixture lifespan. Bounds live in the packledger, not in prose.</p>
            </div>
            <div className="card">
              <h3><span className="verdict-ok">PASSED</span></h3>
              <p>The safe path works end to end: captures, merges, gates,
              roundtrips.</p>
            </div>
            <div className="card">
              <h3><span className="verdict-bad">EXPLOITED</span></h3>
              <p>The attack landed. A new EXPLOITED or the regression of any
              previously recorded row fails CI.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="ledger">
        <div className="wrap">
          <h2>Running the lane</h2>
          <p className="sub">
            The runner drives the real binary inside disposable fixture dirs,
            then checks the result. Exit 0 on green, 1 on findings.
          </p>
          <pre className="code"><span className="cm"># run every pack, enforce the packledger</span>{'\n'}<span className="k">npm</span> run packs{'\n\n'}<span className="cm"># adopt new rows (never rewrites existing verdicts)</span>{'\n'}<span className="k">npm</span> run packs -- <span className="k">--adopt</span>{'\n\n'}<span className="cm"># manifest + entry + id-census grammar (packstruct)</span>{'\n'}<span className="k">npm</span> run lint:packs{'\n\n'}<span className="cm"># conformance audit against the family runner shape</span>{'\n'}<span className="k">npm</span> run conform:packs</pre>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/status">See the live verdicts</Link>
            <a className="btn btn-ghost" href={`${DOCS}/packs/`}>Write a pack</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/packstruct">packstruct</a>
          </div>
        </div>
      </section>
    </>
  )
}
