import Link from 'next/link';
import HeroDemo from '../components/HeroDemo.jsx';
import HowItWorks from '../components/HowItWorks.jsx';

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1>Find out how the judges will score you, before you submit.</h1>
          <p className="lede">
            Paste a hackathon link and your project. The Panel studies the judges and past winners, then scores you on the event’s real criteria.
          </p>
          <div className="hero-actions">
            <Link href="/panel" className="btn btn-lg">
              Score a project
            </Link>
            <Link href="/method" className="btn btn-quiet btn-lg">
              See the method
            </Link>
          </div>
          <p className="hero-note">Works with Devpost pages and bounty listings. Free, and nothing you enter is saved.</p>
        </div>
        <div className="hero-demo">
          <HeroDemo />
        </div>
      </section>

      <section className="runs-on" aria-label="What The Panel runs on">
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
      </section>

      <section className="section">
        <div className="section-head">
          <h2>One run, five steps</h2>
          <p>Tap a step, or let it play.</p>
        </div>
        <HowItWorks />
      </section>

      <section className="section">
        <div className="section-head">
          <h2>What the rules page won’t tell you</h2>
        </div>
        <div className="trio">
          <div>
            <h3>Who is reading</h3>
            <p>Each score is written from one judge’s point of view, based on what they have built, written and judged.</p>
          </div>
          <div>
            <h3>What won before</h3>
            <p>Past winners from the same organizer show you the real bar, with links to where each one came from.</p>
          </div>
          <div>
            <h3>What to fix first</h3>
            <p>Changes are ranked by how much they should move your score against how long they take.</p>
          </div>
        </div>
        <p className="aside">
          It’s a second opinion, not a verdict. The judges are simulations built from public information, and real panels disagree. <Link href="/method">Read how it works and where it falls short.</Link>
        </p>
      </section>

      <section className="cta-band">
        <div>
          <h2>Your deadline won’t move. Your score still can.</h2>
          <p>Run The Panel on your project and get a fix list in a few minutes.</p>
        </div>
        <Link href="/panel" className="btn btn-invert btn-lg">
          Score a project
        </Link>
      </section>
    </>
  );
}
