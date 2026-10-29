import './globals.css';

export const metadata = {
  title: 'The Panel — know your score before the judges do',
  description:
    'Paste a hackathon link and your project. The Panel researches every judge on the live web, simulates them with NVIDIA Nemotron on Nebius Token Factory, and tells you exactly what to fix.',
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#0e0f0c' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
