/**
 * pages/Agents.jsx - the agents landing: how a coding agent SEES, works,
 * and validates with eyestruct's own vision loop. Marketing that keeps the
 * honest-data rule: every capability named here is a shipped surface
 * (docs/cli.md, docs/mcp.md, docs/playbooks/agents-vision.md), and the
 * canon claims point at their governing docs, not at this page.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const DOCS = 'https://docs.creadev.org/eyestruct'
const MCP_SPOT_CALL =
  '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"spot","arguments":{"url":"http://127.0.0.1:4173/status"}}}'

export default function Agents() {
  usePageMeta({
    path: '/agents',
    title: 'Agents | eyestruct',
    description:
      'The agents-vision loop: serve the baked tree, spot it, read the pixels with your own vision, act, re-spot. One command, one capture, a file path you can open - candidate-only, canon stays CI-cut.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">for agents</p>
          <h1>
            Give your coding agent <span className="accent">eyes</span> - and
            a memory.
          </h1>
          <p className="lede">
            A UI change ships unchecked because nobody in the loop looked.
            eyestruct closes that: one command captures real pixels of what
            you just built and hands you the file path, the agent reads it
            with its own vision, fixes what it saw, and re-spots until the
            page reads clean. Claims stay prose. Receipts stay pixels.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/packs">See the packs</Link>
            <a className="btn btn-ghost" href={`${DOCS}/playbooks/agents-vision/`}>Read the playbook</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>The loop, five steps</h2>
          <p className="sub">
            The same round a careful human reviewer would run - rendered,
            looked at, fixed, re-verified - as native commands the agent
            already owns.
          </p>
          <div className="pipeline">
            <div className="pipe-step">
              <div className="pipe-n">1</div>
              <div><strong>SERVE</strong> <span>- point the instance
              primitive at the built tree: it serves with the same host shape
              the deployment carries, headers included. No private preview,
              no tree you didn't bake.</span></div>
            </div>
            <div className="pipe-step">
              <div className="pipe-n">2</div>
              <div><strong>SPOT</strong> <span>- one command, one capture:
              <code> eyestruct spot &lt;url&gt;</code> writes
              <code> labs/.eyes-candidates/spot-*.png</code> and prints the
              path plus the element map.</span></div>
            </div>
            <div className="pipe-step">
              <div className="pipe-n">3</div>
              <div><strong>READ</strong> <span>- the agent opens the PNG with
              its own vision (or walks the mapped element ids). Never prose
              claiming pixels - pixels claiming pixels, from the same render
              that mapped them.</span></div>
            </div>
            <div className="pipe-step">
              <div className="pipe-n">4</div>
              <div><strong>ACT</strong> <span>- fix what the capture showed,
              not what the code hoped. A table not rendering, text clipped,
              contrast mud - all visible at the eyeballs layer.</span></div>
            </div>
            <div className="pipe-step">
              <div className="pipe-n">5</div>
              <div><strong>RE-SPOT</strong> <span>- re-run until the capture
              reads clean. The round is finished when the pixels agree, not
              when the patch is written.</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Two surfaces, one capture</h2>
          <p className="sub">
            Call it from a shell during a build, or from an MCP session. The
            pixels are identical; pick the handle your loop has.
          </p>
          <pre className="code"><span className="cm"># the CLI: two verbs carry the whole loop</span>{'\n'}<span className="k">eyestruct</span> serve web/dist{'\n'}<span className="k">eyestruct</span> spot http://127.0.0.1:4173/status</pre>
          <pre className="code"><span className="cm"># the MCP stdio server - tools/call returns the file path + element map</span>{'\n'}{MCP_SPOT_CALL}</pre>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Built for unattended builds</h2>
          <div className="grid">
            <div className="card">
              <h3><span className="glyph">◈</span> candidates, never canon</h3>
              <p>A spot capture is evidence, not truth: it never writes the
              ledger, and the baseline canon stays CI-cut. The
              two-dispatch rule holds even when the eyeballs are a machine's.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">◉</span> one pass, many artifacts</h3>
                          <p>The tool hands you the pixels AND the element map from one
              capture - one render that answers both "what does it look
              like" and "what is on it". When pixels and map come from the
              same pass, they can never disagree about each other.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">✗</span> refusals with a fix</h3>
              <p>Missing browser, dead tree, skeletal frame - every failure
              is a named code (eyestruct[MISSING_PINNED_BROWSER] or
              CAPTURE_TOO_SKELETAL) with its fix printed, never a stack
              trace to interpret at 2 a.m.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">✓</span> works in a browserless CI VM</h3>
              <p>Receipted: the full loop ran root-free in the most hostile
              place any of this lives. Serve route discovery, baked-tree
              serving, and the capture round - all verified headless.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Give it a browser</h2>
          <p className="sub">
            The capture-engine resolution order, first hit wins - the same
            order every browser-backed surface shares:
          </p>
          <div className="grid">
            <div className="card"><h3><span className="glyph">1</span> --browser-exec or EYESTRUCT_BROWSER</h3><p>A path you control. The whole surface honors both.</p></div>
            <div className="card"><h3><span className="glyph">2</span> the manifest pin</h3><p>The pin your <code>init</code> recorded in <code>labs/.eyes/manifest</code> - the machine's standing choice.</p></div>
            <div className="card"><h3><span className="glyph">3</span> puppeteer's local cache, offline default</h3><p>If this machine's chrome cache already has one, it drives. No network is required or used.</p></div>
          </div>
          <div className="cta-row">
            <a className="btn btn-ghost" href={`${DOCS}/playbooks/agents-vision/`}>The mechanics in full</a>
            <a className="btn btn-ghost" href={`${DOCS}/cli/`}>CLI reference</a>
            <a className="btn btn-ghost" href={`${DOCS}/mcp/`}>MCP reference</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2>Where this goes</h2>
          <p className="sub">
            The same committed memory serves three consumers, near to far -
            shipped, next, and the road beyond (design rulings in the PRD;
            receipts rule every claim, including the unbuilt ones):
          </p>
          <div className="grid">
            <div className="card">
              <h3><span className="glyph">✓</span> Now: the loop above</h3>
              <p>CI gates the canon; serve/spot gives the agent live sight
              while it builds. Both receipts-culture shipped - everything on
              this page names a surface you can run today.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">→</span> Now: adapters</h3>
              <p>The same contract where agents already work: the MCP stdio
              surface is the first adapter, and
              <code> eyestruct-adapter@1</code> (<code>lib/index.js</code>) is
              the second - platforms import the truth instead of forking it.
              Hosted-builder adapters: designed, in flight.</p>
            </div>
            <div className="card">
              <h3><span className="glyph">◉</span> The pinnacle: real-time</h3>
              <p>Eyes inside the chat session - bridges/connectors that see
              everything the agent touches, live, not on demand. The loop is
              the seed; event-driven sight is the road.
              <em> Designed future, not shipped.</em></p>
            </div>
          </div>
        </div>
      </section>

      <div className="section section-split">
        <div className="split-card">
          <h3>Not one-off vision. Visual memory.</h3>
          <p>Generic screenshot tools throw the pixels away; eyestruct
          commits a visual history in labs/.eyes/ and gates CI on it. The
          spot loop rides the same rig: what the agent sees today joins the
          memory the CI lane polices tomorrow.</p>
          <div className="cta-row"><Link className="btn btn-ghost" to="/">The whole story</Link></div>
        </div>
        <div className="split-card">
          <h3>Get it</h3>
          <p><code>npm install --save-dev eyestruct</code> then the two verbs
          above. 13 CLI verbs, 10 MCP tools, zero daemons - process-per-look
          all the way down.</p>
          <div className="cta-row"><Link className="btn btn-ghost" to="/status">Live status</Link></div>
        </div>
      </div>
    </>
  )
}
