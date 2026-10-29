import Link from 'next/link';
import Matrix from '../components/Matrix.jsx';

const CRITERIA = ['Technological Implementation', 'Design', 'Potential Impact', 'Quality of the Idea'];
const BENCH = [
  { id: 'a', name: 'Staff AI Engineer', role: 'NVIDIA' },
  { id: 'b', name: 'Founding product marketer', role: 'Nebius Token Factory' },
  { id: 'c', name: 'Forward deployed engineer', role: 'Tavily' },
  { id: 'd', name: 'Developer relations lead', role: 'Nebius' },
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>See how each judge is likely to score your hackathon project.</h1>
          <p className="lede">
            Paste the event link and your project. The Panel reads the rules, looks up the judges and past winners, and scores your submission against the event’s own criteria.
          </p>
          <div className="hero-actions">
            <Link href="/panel" className="btn">
              Score a project
            </Link>
            <Link href="/method" className="btn btn-quiet">
              How it works
            </Link>
          </div>
        </div>
        <figure style={{ margin: 0 }}>
          <div className="sheet sheet-pad">
            <Matrix criteria={CRITERIA} rows={BENCH} caption="Empty rubric for the Nebius x NVIDIA Global AI Hackathon" />
          </div>
          <figcaption className="figure-caption">
            The real rubric and four of the judging roles for the Nebius x NVIDIA Global AI Hackathon, read from its Devpost page. A run fills in each cell.
          </figcaption>
        </figure>
      </section>

      <section className="section">
        <h2>What happens when you run it</h2>
        <ol className="steps">
          <li>
            <div>
              <strong>Read the event</strong>
              <span>Pulls the rules, tracks, judging criteria, prizes and judge list from the page you paste.</span>
            </div>
          </li>
          <li>
            <div>
              <strong>Look up past winners</strong>
              <span>Finds what the same organizer rewarded before, with links to where that came from.</span>
            </div>
          </li>
          <li>
            <div>
              <strong>Research each judge</strong>
              <span>Builds a short profile from their public work: what they have written, built and judged.</span>
            </div>
          </li>
          <li>
            <div>
              <strong>Score your project</strong>
              <span>Each judge is run as a separate agent that scores you on every criterion and can search the web to check your claims.</span>
            </div>
          </li>
          <li>
            <div>
              <strong>Settle the disagreements</strong>
              <span>A moderator compares the judges, sets a predicted score, and ranks the changes most likely to raise it.</span>
            </div>
          </li>
        </ol>
      </section>

      <section className="section two-col">
        <div>
          <h2 style={{ marginBottom: 14 }}>What you get back</h2>
          <ul className="prose" style={{ paddingLeft: '1.2em' }}>
            <li>A score from each judge on each official criterion, with a one-line reason.</li>
            <li>What each judge would like most, what would worry them, and one change for each.</li>
            <li>How your project compares to the organizer’s past winners.</li>
            <li>A ranked list of fixes, marked by effort and likely impact.</li>
            <li>A receipt showing every model call, its tokens, time and cost.</li>
          </ul>
        </div>
        <div>
          <h2 style={{ marginBottom: 14 }}>What it can’t do</h2>
          <div className="prose">
            <p>
              The judges here are simulations built from public information. They are not the real people, and a real panel can disagree with them. Judges with little public work are marked as low confidence.
            </p>
            <p>
              The Panel only scores what you show it. If your repo or description leaves something out, the judges will too.
            </p>
            <p>
              <Link href="/method">Read the full method</Link>, including which model does each step and how scores are set.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 style={{ marginBottom: 14 }}>Why it exists</h2>
        <div className="prose">
          <p>
            I enter a lot of hackathons and bounties. Before this one, I wanted to know who the 23 judges were and what they had rewarded in the past. Getting that answer took hours of reading talks, posts and old winner lists.
          </p>
          <p>The Panel does that reading for you and turns it into a scorecard, so you can fix the weak spots before the deadline instead of after the results.</p>
          <p className="faint">Oh-Jay, technical writer and bounty hunter, Nigeria</p>
        </div>
      </section>
    </>
  );
}
