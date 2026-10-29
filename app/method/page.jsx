import Link from 'next/link';
import { TIERS, PROVIDER } from '../../lib/llm.js';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Method',
  description: 'How The Panel reads an event, researches judges and past winners, scores a project, and where it can be wrong.',
};

export default function Method() {
  const viaOpenRouter = PROVIDER === 'openrouter';
  return (
    <article>
      <div className="page-head">
        <h1>Method</h1>
        <p>What happens during a run, which model does each part, and the limits to keep in mind when you read a scorecard.</p>
      </div>
      <div className="doc-layout" style={{ marginTop: 40 }}>
        <nav className="toc" aria-label="On this page">
          <ol>
            <li>
              <a href="#the-steps-in-a-run">The steps in a run</a>
            </li>
            <li>
              <a href="#which-model-does-what">Which model does what</a>
            </li>
            <li>
              <a href="#web-data">Web data</a>
            </li>
            <li>
              <a href="#how-scores-are-set">How scores are set</a>
            </li>
            <li>
              <a href="#cost-tracking">Cost tracking</a>
            </li>
            <li>
              <a href="#limits">Limits</a>
            </li>
            <li>
              <a href="#judges-and-privacy">Judges and privacy</a>
            </li>
            <li>
              <a href="#source-code">Source code</a>
            </li>
          </ol>
        </nav>
        <div className="prose">
      <h2 id="the-steps-in-a-run" style={{ marginTop: 0 }}>The steps in a run</h2>
      <ol>
        <li>
          <strong>Read the event.</strong> Tavily extracts the page you paste. A small model pulls out the rules, tracks, judging criteria, prizes and judges. If the page lists no judges or criteria, the tool crawls the rest of the site for them.
        </li>
        <li>
          <strong>Read your project.</strong> Tavily extracts your repo and demo links. Your description is added as written.
        </li>
        <li>
          <strong>Look up past winners.</strong> Two web searches look for earlier winners from the same organizer. The small model keeps only winners a source actually names, and links each one to that source.
        </li>
        <li>
          <strong>Research the judges.</strong> One web search per judge. The small model writes a short profile of what they are likely to reward and what would lose their vote, citing the search results. Results that seem to be about a different person with the same name are ignored.
        </li>
        <li>
          <strong>Score.</strong> Each judge runs as its own agent on the mid-size model, three at a time. It sees the event brief, its own profile, the past winners and your project, and scores every official criterion from 1 to 10. It can call a web search up to twice to check a claim or see whether similar tools exist.
        </li>
        <li>
          <strong>Settle.</strong> The moderator reads every judge’s scores and notes, writes out where they disagreed and how that resolves, predicts a score out of 100, and ranks the changes by impact against effort.
        </li>
      </ol>

      <h2 id="which-model-does-what">Which model does what</h2>
      <p>
        All model calls go to NVIDIA Nemotron models served by Nebius Token Factory.
        {viaOpenRouter
          ? ' This deployment reaches them through OpenRouter, pinned to the Nebius provider with fallbacks turned off, because Token Factory billing is not available in Nigeria where the tool was built. Any response not served by Nebius is rejected.'
          : ''}
      </p>
      <div className="sheet table-scroll" style={{ marginBottom: 20 }}>
        <table className="data">
          <thead>
            <tr>
              <th>Tier</th>
              <th>Model</th>
              <th>Used for</th>
              <th className="num">Price per 1M tokens (in / out)</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(TIERS).map(([key, t]) => (
              <tr key={key}>
                <td>{key === 'fast' ? 'Small' : key === 'mid' ? 'Mid-size' : 'Moderator'}</td>
                <td>
                  {t.name}
                  <div>
                    <code>{t.model}</code>
                  </div>
                </td>
                <td>{t.job}</td>
                <td className="num">
                  ${t.in.toFixed(2)} / ${t.out.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The small model handles high-volume reading and extraction. The mid-size model handles reasoning with tool calls. The moderator step is the only one that has to weigh every other output at once, so it gets the strongest model available.
      </p>

      <h2 id="web-data">Web data</h2>
      <p>Tavily supplies every piece of outside information:</p>
      <ul>
        <li>
          <strong>Extract</strong> reads the event page and your project links.
        </li>
        <li>
          <strong>Crawl</strong> runs only when the event page is missing judges or criteria.
        </li>
        <li>
          <strong>Search</strong> finds past winners and judge profiles, and is offered to each judge as a tool it can choose to call.
        </li>
      </ul>

      <h2 id="how-scores-are-set">How scores are set</h2>
      <p>
        Judges are told to score only what is shown, not what is promised, and to use a fixed scale: 5 is a typical entry, 7 is strong, 8 is a finalist, and 9 or 10 is rare. The moderator’s score out of 100 is its own judgment after reading the panel, not an average.
      </p>

      <h2 id="cost-tracking">Cost tracking</h2>
      <p>
        Every model call records its input and output tokens and its time. Cost is tokens multiplied by the per-token prices in the table above. The receipt at the end of a run also shows what the same run would cost if every call used the most expensive tier, so the saving from routing is visible.
      </p>

      <h2 id="limits">Limits</h2>
      <ul>
        <li>The judges are simulations built from public information. A real panel can and will disagree.</li>
        <li>Judges with little public work get thin profiles. Those are marked as relying on the role.</li>
        <li>Search can surface the wrong person or an old event. Every claim links to its source so you can check it.</li>
        <li>The tool has not yet been tested against the published results of a past hackathon, so treat the predicted score as a second opinion rather than a forecast.</li>
        <li>It only reads what you give it. Private repos and missing descriptions lead to low scores.</li>
      </ul>

      <h2 id="judges-and-privacy">Judges and privacy</h2>
      <p>
        Profiles use only public, professional information and are shown with their sources. You can switch to roles instead of names before a run. Nothing from a run is stored. See the <Link href="/privacy">privacy policy</Link>.
      </p>

      <h2 id="source-code">Source code</h2>
      <p>
        The full code is on <a href="https://github.com/ohjay-official/the-panel">GitHub</a> under the MIT license, including the prompts each model receives.
      </p>
        </div>
      </div>
    </article>
  );
}
