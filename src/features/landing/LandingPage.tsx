import { lazy, Suspense } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Asterisk,
  Box,
  Check,
  MousePointer2,
  Route,
  Sparkles,
} from 'lucide-react'
import './LandingPage.css'

const LandingThreeScene = lazy(() =>
  import('./LandingThreeScene').then((module) => ({
    default: module.LandingThreeScene,
  })),
)

type LandingPageProps = {
  onEnter: () => void
}

const capabilities = [
  {
    number: '01',
    icon: MousePointer2,
    title: 'Draw at thought-speed.',
    copy: 'Drop shapes, type directly, and connect the dots without fighting menus.',
    accent: 'lime',
  },
  {
    number: '02',
    icon: Route,
    title: 'Keep every idea in motion.',
    copy: 'Resize, reroute, recolor, and reshape while the canvas stays fluid.',
    accent: 'coral',
  },
  {
    number: '03',
    icon: Box,
    title: 'Own the whole workspace.',
    copy: 'Everything is saved locally, ready to export, and always yours.',
    accent: 'blue',
  },
]

export function LandingPage({ onEnter }: LandingPageProps) {
  return (
    <main className="landing-page">
      <section className="landing-hero" id="top">
        <Suspense fallback={<div className="landing-scene landing-scene--loading" />}>
          <LandingThreeScene />
        </Suspense>
        <div className="landing-noise" aria-hidden="true" />

        <nav className="landing-nav" aria-label="Landing navigation">
          <a className="landing-logo" href="#top" aria-label="Diagram Studio home">
            <span><Asterisk size={18} strokeWidth={3} /></span>
            <strong>Diagram<br />Studio</strong>
          </a>
          <div className="landing-nav__links">
            <a href="#why">Why it works</a>
            <a href="#motion">Inside the motion</a>
          </div>
          <button type="button" className="nav-launch" onClick={onEnter}>
            Open studio <ArrowRight size={15} />
          </button>
        </nav>

        <div className="hero-copy">
          <div className="hero-eyebrow">
            <span className="live-dot" />
            A local-first visual workspace
          </div>
          <h1>
            Make your ideas
            <em>impossible to miss.</em>
          </h1>
          <p className="hero-lede">
            A fast, expressive diagram canvas for turning messy thinking into
            systems people understand at a glance.
          </p>
          <div className="hero-actions">
            <button type="button" className="primary-cta" onClick={onEnter}>
              Start creating
              <span><ArrowRight size={19} /></span>
            </button>
            <a href="#why" className="text-link">
              See what makes it different <ArrowDown size={15} />
            </a>
          </div>
          <div className="hero-proof">
            <div className="proof-stack" aria-hidden="true">
              <span>DS</span><span>3D</span><span>01</span>
            </div>
            <p><strong>Zero setup.</strong> Your first diagram is one click away.</p>
          </div>
        </div>

        <div className="scene-label scene-label--top">
          <span>LIVE 3D CANVAS</span>
          <Sparkles size={13} />
        </div>
        <div className="scene-label scene-label--bottom">
          Move your pointer
          <span className="pointer-line" />
        </div>

        <a className="scroll-mark" href="#why" aria-label="Scroll to explore">
          <span>Scroll to explore</span>
          <ArrowDown size={15} />
        </a>
      </section>

      <div className="landing-marquee" aria-hidden="true">
        <div>
          <span>THINK</span><Asterisk /><span>MAP</span><Asterisk />
          <span>CONNECT</span><Asterisk /><span>CREATE</span><Asterisk />
          <span>THINK</span><Asterisk /><span>MAP</span><Asterisk />
          <span>CONNECT</span><Asterisk /><span>CREATE</span><Asterisk />
        </div>
      </div>

      <section className="landing-manifesto" id="why">
        <div className="section-kicker">
          <span>01</span>
          Why Diagram Studio
        </div>
        <div className="manifesto-heading">
          <h2>Less tool.<br /><em>More thought.</em></h2>
          <p>
            Diagramming should feel like sketching on a whiteboard, with the
            precision of a serious design tool. We built the space in between.
          </p>
        </div>

        <div className="capability-grid">
          {capabilities.map(({ number, icon: Icon, title, copy, accent }) => (
            <article className={`capability-card capability-card--${accent}`} key={number}>
              <div className="capability-card__top">
                <span>{number}</span>
                <Icon size={25} strokeWidth={1.7} />
              </div>
              <h3>{title}</h3>
              <p>{copy}</p>
              <div className="card-path" aria-hidden="true">
                <i /><i /><i />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="motion-section" id="motion">
        <div className="motion-art" aria-hidden="true">
          <div className="motion-orbit motion-orbit--one" />
          <div className="motion-orbit motion-orbit--two" />
          <div className="motion-core"><Asterisk size={54} /></div>
          <span className="motion-node motion-node--one">MAP</span>
          <span className="motion-node motion-node--two">LINK</span>
          <span className="motion-node motion-node--three">SHIP</span>
        </div>
        <div className="motion-copy">
          <div className="section-kicker section-kicker--dark">
            <span>02</span>
            Inside the motion
          </div>
          <h2>Built to feel<br /><em>alive.</em></h2>
          <p>
            The landing scene is not a video. It is a live Three.js world that
            reacts to you in real time.
          </p>
          <ul>
            <li><Check size={16} /> Nodes breathe and float independently</li>
            <li><Check size={16} /> Signals travel across every connection</li>
            <li><Check size={16} /> The scene tilts with your pointer</li>
          </ul>
        </div>
      </section>

      <section className="landing-final">
        <span className="final-spark final-spark--one"><Asterisk /></span>
        <span className="final-spark final-spark--two"><Asterisk /></span>
        <p>YOUR NEXT CLEAR IDEA STARTS HERE</p>
        <h2>Ready to make<br /><em>it visible?</em></h2>
        <button type="button" className="primary-cta primary-cta--dark" onClick={onEnter}>
          Open the canvas
          <span><ArrowRight size={19} /></span>
        </button>
      </section>

      <footer className="landing-footer">
        <div className="landing-logo landing-logo--footer">
          <span><Asterisk size={18} strokeWidth={3} /></span>
          <strong>Diagram Studio</strong>
        </div>
        <p>Think freely. Map clearly. Ship confidently.</p>
        <span>Local-first / Open canvas</span>
      </footer>
    </main>
  )
}
