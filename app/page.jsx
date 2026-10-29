import Link from 'next/link';
import HeroDemo from '../components/HeroDemo.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import JudgesBand from '../components/JudgesBand.jsx';
import Reveal from '../components/Reveal.jsx';

const HEADLINE = 'Find out how the judges will score you, before you submit.';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <div className="hero-tag fade-in" style={{ '--d': 0 }}>
            <i aria-hidden="true" />
            Built for the Nebius x NVIDIA Global AI Hackathon
          </div>
          <h1 aria-label={HEADLINE}>
            {HEADLINE.split(' ').map((w, i) => (
              <span key={i} aria-hidden="true">
                <span className="w" style={{ '--i': i }}>
                  {w}
                </span>{' '}
              </span>
            ))}
          </h1>
          <p className="lede fade-in" style={{ '--d': 650 }}>
            Paste a hackathon link and your project. The Panel studies the judges and past winners, then scores you on the event’s real criteria.
          </p>
          <div className="hero-actions fade-in" style={{ '--d': 800 }}>
            <Link href="/panel" className="btn btn-lg">
              Score a project <span className="arrow-box" aria-hidden="true" />
            </Link>
            <Link href="/method" className="btn btn-quiet btn-lg">
              See the method
            </Link>
          </div>
          <p className="hero-note fade-in" style={{ '--d': 950 }}>
            Works with Devpost pages and bounty listings. Free, and nothing you enter is saved.
          </p>
        </div>
        <div className="fade-in" style={{ '--d': 400 }}>
          <HeroDemo />
        </div>
      </section>

      <Reveal className="runs-on" aria-label="What The Panel runs on">
        <div>
          <b>NVIDIA Nemotron</b>
          <span>The models that read, judge and moderate</span>
        </div>
        <div>
          <b>Nebius Token Factory</b>
          <span>Where those models run</span>
        </div>
        <div>
          <b>Tavily</b>
          <span>Live web pages and search</span>
        </div>
      </Reveal>

      <div className="section">
        <JudgesBand />
      </div>

      <Reveal className="section">
        <div className="section-head">
          <h2>One run, five steps</h2>
          <p>Tap a step, or let it play through.</p>
        </div>
        <HowItWorks />
      </Reveal>

      <Reveal className="section">
        <div className="section-head">
          <h2>What the rules page won’t tell you</h2>
        </div>
        <div className="glow-cards stagger">
          <article className="glow-card" style={{ '--i': 0 }}>
            <span className="gc-index">Judges</span>
            <h3>Who is reading</h3>
            <p>Each score is written from one judge’s point of view, based on what they have built, written and judged.</p>
          </article>
          <article className="glow-card" style={{ '--i': 1 }}>
            <span className="gc-index">Past winners</span>
            <h3>What won before</h3>
            <p>Winners from the same organizer show you the real bar, each one linked to where it came from.</p>
          </article>
          <article className="glow-card" style={{ '--i': 2 }}>
            <span className="gc-index">Fix list</span>
            <h3>What to fix first</h3>
            <p>Changes are ranked by how much they should move your score against how long they take.</p>
          </article>
        </div>
        <p className="aside">
          It’s a second opinion, not a verdict. The judges are simulations built from public information, and real panels disagree. <Link href="/method">Read how it works and where it falls short.</Link>
        </p>
      </Reveal>

      <Reveal className="cta-band">
        <div>
          <h2>Your deadline won’t move. Your score still can.</h2>
          <p>Run The Panel on your project and get a ranked fix list in a few minutes.</p>
        </div>
        <Link href="/panel" className="btn btn-lg">
          Score a project <span className="arrow-box" aria-hidden="true" />
        </Link>
      </Reveal>
    </>
  );
}
