/**
 * pages/Why.jsx - why eyestruct exists: a UI change ships unchecked because
 * nobody in the loop looked. The deep grammar lives in the docs; this is the
 * human-readable face.
 */
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const DOCS = 'https://docs.creadev.org/eyestruct'

export default function Why() {
  usePageMeta({
    path: '/why',
    title: 'Why | eyestruct',
    description:
      'A UI change ships unchecked because nobody in the loop looked. Why production agents need eyes and a committed visual memory instead of a screenshot nobody diffs.',
  })
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">why</p>
          <h1>
            A change nobody looked at <span className="accent">is a change nobody checked.</span>
          </h1>
          <p className="lede">
            Screenshots are cheap; a screenshot nobody diffs is worthless.
            eyestruct gives agents and CI the same thing: a deterministic look,
            a committed baseline, and a gate that fails loudly when the pixels
            move without an explanation.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" to="/what">What eyestruct is</Link>
            <a className="btn btn-ghost" href={`${DOCS}/`}>Read the docs</a>
            <a className="btn btn-ghost" href="https://github.com/dhaupin/eyestruct">See the repo</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">The problem: pixels move silently</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            A UI regression is the class of bug no unit test catches: the build
            is green, the assertions pass, and the page renders wrong. A human
            reviewer sees the diff only if someone looked. An agent that ships
            code cannot see the page it just changed.
          </p>
          <p className="lede" style={{ marginTop: 8 }}>
            The fix is not more screenshots. It is a committed visual memory:
            a baseline in the repo, a deterministic capture that reproduces
            exactly, and a gate that treats unexplained drift as a failure, the
            same way crashtest treats a new exploit.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">The thesis: canon is CI-cut</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            A local capture is a proposal, never the truth. Baselines are cut
            by the pinned-image lane in CI, so the committed memory is
            reproducible and a local machine cannot quietly rewrite what the
            team agrees the page looks like.
          </p>
          <p className="lede" style={{ marginTop: 8 }}>
            The same memory serves two lanes: the CI lane catches regressions,
            and an agent's instance lane lets a coding agent watch its own work
            while it builds. Candidate-only there too - the canon stays CI-cut
            even when the agent is the one looking.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <h2 className="section-title">Who it is for</h2>
          <p className="lede" style={{ marginTop: 8 }}>
            Anyone shipping a UI they cannot fully test: the CI that must fail
            on a visual regression, the agent that has to see what it changed,
            and the maintainer who wants a committed record of what every page
            looked like on every wave.
          </p>
          <p style={{ marginTop: 22 }}>
            <Link to="/what" className="btn btn-ghost">Next: what eyestruct is</Link>
          </p>
        </div>
      </section>
    </>
  )
}
