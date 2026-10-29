import './globals.css';
import Link from 'next/link';
import Nav from '../components/Nav.jsx';
import Mark from '../components/Mark.jsx';
import Preloader from '../components/Preloader.jsx';
import { Public_Sans, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

// Self-hosted at build time, so visitors' browsers never contact Google.
const body = Public_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-body', display: 'swap' });
const display = Space_Grotesk({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-mono', display: 'swap' });

const SITE = process.env.SITE_URL || 'https://the-panel-eta.vercel.app';

export const metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'The Panel', template: '%s | The Panel' },
  description:
    'Score a hackathon project against the event’s own criteria and the people judging it. The Panel reads the rules, researches each judge and past winners, and tells you what to change before you submit.',
  openGraph: {
    title: 'The Panel',
    description: 'See how each judge is likely to score your hackathon project, and what to change before you submit.',
    type: 'website',
  },
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b0f0e' };

// Runs before paint: marks that JavaScript is on (so scroll reveals can start hidden),
// and after the intro has played, lets later in-site visits skip the intro delay.
const BOOT = "document.documentElement.classList.add('js');setTimeout(function(){document.documentElement.setAttribute('data-loaded','1')},1800)";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT }} />
      </head>
      <body>
        <Preloader />
        <a className="visually-hidden" href="#main">
          Skip to content
        </a>
        <header className="site-header">
          <div className="wrap">
            <Link href="/" className="brand">
              <Mark />
              The Panel
            </Link>
            <Nav />
          </div>
        </header>
        <main id="main" className="wrap">
          {children}
        </main>
        <footer className="site-footer">
          <div className="wrap">
            <div className="foot-top">
              <Link href="/" className="brand">
                <Mark />
                The Panel
              </Link>
              <div className="foot-links">
                <Link href="/panel">Score a project</Link>
                <Link href="/method">Method</Link>
                <Link href="/privacy">Privacy policy</Link>
                <Link href="/terms">Terms and conditions</Link>
                <a href="https://github.com/ohjay-official/the-panel">Source code</a>
              </div>
            </div>
            <p className="foot-copy">
              Built by <a href="https://x.com/Oh_Jay0">Oh-Jay</a> for the Nebius x NVIDIA Global AI Hackathon, 2026. Open source under the MIT license.
            </p>
            <p className="foot-copy">Judge profiles are simulations based on public professional information. The people named are not involved with this site and have not endorsed it.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
