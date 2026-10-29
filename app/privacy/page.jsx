export const metadata = {
  title: 'Privacy policy',
  description: 'What The Panel does with the links and text you enter.',
};

export default function Privacy() {
  return (
    <article>
      <div className="page-head">
        <h1>Privacy policy</h1>
        <p className="updated">Last updated 29 October 2026</p>
      </div>
      <div className="prose" style={{ marginTop: 32 }}>

      <p>
        The Panel is a small open source tool run by Oh-Jay. This page explains what happens to the information you give it. The short version: it has no accounts, keeps no database, and does not save your runs.
      </p>

      <h2>What you send</h2>
      <p>When you start a run, the site sends three things to its server:</p>
      <ul>
        <li>the event page link,</li>
        <li>up to two project links,</li>
        <li>the project description you type.</li>
      </ul>
      <p>Don’t paste passwords, API keys or anything else you would not want a third party to read.</p>

      <h2>Who processes it</h2>
      <p>To produce a scorecard, the server passes that information to these services:</p>
      <ul>
        <li>
          <strong>Tavily</strong>, which fetches the pages you link and runs web searches about the event, its judges and past winners.
        </li>
        <li>
          <strong>Nebius Token Factory</strong>, which runs the NVIDIA Nemotron models that read the pages and write the scores. On this deployment, requests may reach Nebius through <strong>OpenRouter</strong>, which forwards them.
        </li>
        <li>
          <strong>Vercel</strong>, which hosts the site and keeps standard request logs such as IP address and time.
        </li>
      </ul>
      <p>Each of these services handles data under its own privacy policy. The Panel does not sell or share your information with anyone else.</p>

      <h2>What is kept</h2>
      <ul>
        <li>Your results exist only in your browser tab. Close or reload the page and they are gone.</li>
        <li>The server does not write your links, description or results to any database or file.</li>
        <li>To limit abuse, the server counts runs per IP address in memory for one hour. The count is not saved and is cleared whenever the server restarts.</li>
        <li>The site sets no cookies and runs no analytics or advertising trackers.</li>
      </ul>

      <h2>People named in a scorecard</h2>
      <p>
        Judge profiles are built from public, professional information found by web search, and each claim links to its source. They are simulations, not statements by or about the real person’s views. If you are named in a profile and want something corrected, or want to be shown by role only, open an issue on the project’s GitHub page and it will be handled.
      </p>

      <h2>Children</h2>
      <p>The Panel is meant for people old enough to enter hackathons under their own country’s rules. It is not directed at children.</p>

      <h2>Changes</h2>
      <p>If this policy changes, the new version will be posted here with a new date.</p>

      <h2>Contact</h2>
      <p>
        Questions or requests: open an issue at <a href="https://github.com/ohjay-official/the-panel/issues">github.com/ohjay-official/the-panel/issues</a>.
      </p>
      </div>
    </article>
  );
}
