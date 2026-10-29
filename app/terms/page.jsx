import Link from 'next/link';

export const metadata = {
  title: 'Terms and conditions',
  description: 'The terms for using The Panel.',
};

export default function Terms() {
  return (
    <article className="prose" style={{ paddingTop: 48 }}>
      <h1 style={{ fontSize: 'clamp(32px, 4.6vw, 46px)', marginBottom: 12 }}>Terms and conditions</h1>
      <p className="faint">Last updated 29 October 2026</p>

      <p>By using The Panel you agree to these terms. If you don’t agree, please don’t use the site.</p>

      <h2>What The Panel is</h2>
      <p>
        The Panel is a free, open source tool that estimates how a hackathon or bounty submission might be scored. It uses AI models and public web information to simulate judges. It is run by Oh-Jay as an individual and is not a company.
      </p>

      <h2>No guarantees</h2>
      <p>
        Scores, profiles and advice are estimates. They can be wrong, out of date, or based on the wrong search result. They do not predict or influence any real judging decision. Use them as one input among many, and check anything important against the source links and the official rules.
      </p>

      <h2>Not affiliated</h2>
      <p>
        The Panel was built for the Nebius x NVIDIA Global AI Hackathon and uses services from Nebius, NVIDIA, Tavily and others. It is not operated, endorsed or reviewed by them, by any hackathon organizer, or by any person shown as a judge. Simulated judges are not the real people and do not speak for them.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use the tool to harass, pressure or contact judges about their simulated profiles,</li>
        <li>submit other people’s private or confidential information,</li>
        <li>overload the service with automated requests or try to get around its rate limits,</li>
        <li>present a simulated score as an official result.</li>
      </ul>
      <p>Runs may be limited or turned off at any time to keep costs and abuse under control.</p>

      <h2>Your content</h2>
      <p>
        You keep all rights to what you enter. You confirm you are allowed to share it, and you allow the tool to send it to the services listed in the <Link href="/privacy">privacy policy</Link> for the single purpose of producing your scorecard.
      </p>

      <h2>The code</h2>
      <p>
        The source code is available under the MIT license on <a href="https://github.com/ohjay-official/the-panel">GitHub</a>. That license covers the code. These terms cover the hosted site.
      </p>

      <h2>Liability</h2>
      <p>
        The site is provided as is, without warranties of any kind. To the extent the law allows, Oh-Jay is not liable for any loss arising from using it or relying on its output, including any hackathon result.
      </p>

      <h2>Changes</h2>
      <p>These terms may be updated. The date at the top shows the latest version. Continuing to use the site after a change means you accept it.</p>

      <h2>Contact</h2>
      <p>
        Open an issue at <a href="https://github.com/ohjay-official/the-panel/issues">github.com/ohjay-official/the-panel/issues</a>.
      </p>
    </article>
  );
}
