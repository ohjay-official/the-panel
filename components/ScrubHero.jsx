'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

// A scroll-scrubbed stage. The stage stays pinned while the section scrolls past, and
// scroll progress drives the scene frame by frame: the scorecard tilts up from the table,
// the event URL types itself, the criteria arrive, the judges take their seats, a scan
// passes over every cell, and red-pen marks land where points are lost.
// Unlike a video scrub there is nothing to download, and every frame is drawn crisp.

const URL_TEXT = 'nebiusglobalaihackathon.devpost.com';
const COLS = ['Technological Implementation', 'Design', 'Potential Impact', 'Quality of the Idea', 'Overall'];
const SHORT = ['Tech', 'Design', 'Impact', 'Idea', 'Overall'];
const ROWS = [
  ['Abhinav Balasubramanian', 'NVIDIA'],
  ['Dylan Bristot', 'Nebius'],
  ['Lakshya Prakash Agarwal', 'Tavily'],
  ['AbdulMajed Raja', 'Nebius'],
  ['Sayali Kandarkar', 'NVIDIA'],
  ['Jacquie Capur', 'Nebius'],
];
const RED = new Set(['1-1', '3-2', '4-0']); // cells that get a red-pen mark at the end

// Each panel owns a slice of scroll: [fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd].
// The gaps between one panel's fade-out and the next one's fade-in are deliberate dead zones,
// scene only, so two panels are never readable at the same time.
const CUES = [
  [0.0, 0.0, 0.15, 0.23],
  [0.35, 0.43, 0.57, 0.65],
  [0.77, 0.85, 1.1, 1.2],
];
const DRIFT = 22; // px of counter-scroll travel per panel

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const ramp = (p, a, b) => (b <= a ? (p >= b ? 1 : 0) : smooth(clamp((p - a) / (b - a), 0, 1)));

export default function ScrubHero() {
  const sec = useRef(null);
  const board = useRef(null);
  const url = useRef(null);
  const meter = useRef(null);
  const beam = useRef(null);
  const cue = useRef(null);
  const panels = useRef([]);
  const cols = useRef([]);
  const rows = useRef([]);
  const cells = useRef([]);

  useEffect(() => {
    const el = sec.current;
    if (!el) return;
    let target = 0;
    let at = 0;
    let raf = 0;
    let lastPainted = -1;

    const read = () => {
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      target = span > 0 ? clamp(-r.top / span, 0, 1) : 0;
    };

    const paint = (p) => {
      // Panels: imperative cross-fades with a small counter-scroll drift.
      panels.current.forEach((pe, i) => {
        if (!pe) return;
        const c = CUES[i];
        const enter = ramp(p, c[0], c[1]);
        const leave = ramp(p, c[2], c[3]);
        const o = enter * (1 - leave);
        const y = (1 - enter) * DRIFT - leave * DRIFT;
        pe.style.opacity = o;
        pe.style.transform = `translate3d(0,${y}px,0)`;
        pe.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
        pe.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      });
      if (meter.current) meter.current.style.transform = `scaleX(${p})`;
      if (cue.current) cue.current.style.opacity = 1 - ramp(p, 0, 0.06);

      // The sheet rises from a flat, tilted card on the table to face the reader.
      const lift = smooth(clamp(p / 0.62, 0, 1));
      const rx = 58 - 46 * lift;
      const rz = -16 + 13 * lift;
      const s = 0.84 + 0.16 * lift + 0.05 * ramp(p, 0.8, 1);
      const ty = 10 - 12 * lift;
      if (board.current) board.current.style.transform = `translate3d(-50%, calc(-50% + ${ty}vh), 0) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${s})`;

      // The URL types in over the first panel.
      if (url.current) url.current.textContent = URL_TEXT.slice(0, Math.round(URL_TEXT.length * ramp(p, 0.02, 0.22)));

      // Criteria arrive one by one, then the judges take their seats.
      cols.current.forEach((ce, i) => ce && (ce.style.opacity = ramp(p, 0.14 + i * 0.03, 0.2 + i * 0.03)));
      rows.current.forEach((re, i) => {
        if (!re) return;
        const v = ramp(p, 0.3 + i * 0.045, 0.37 + i * 0.045);
        re.style.opacity = 0.08 + 0.92 * v;
        re.style.transform = `translate3d(${(1 - v) * -14}px,0,0)`;
      });

      // A scan passes down the sheet and marks each cell as read.
      const scan = clamp((p - 0.56) / 0.24, 0, 1);
      if (beam.current) {
        beam.current.style.top = `${scan * 100}%`;
        beam.current.style.opacity = scan > 0 && scan < 1 ? 1 : 0;
      }
      const n = ROWS.length * COLS.length;
      cells.current.forEach((ce, k) => {
        if (!ce) return;
        const r = Math.floor(k / COLS.length);
        const c = k % COLS.length;
        const read = scan * n > r * COLS.length + c + 0.5;
        const red = RED.has(`${r}-${c}`) && p > 0.86 + (r % 3) * 0.02;
        ce.className = `b-cell${read ? ' read' : ''}${c === COLS.length - 1 ? ' total' : ''}${red ? ' red' : ''}`;
      });
    };

    // Ease the drawn position toward the scroll position instead of snapping to it,
    // which turns a jumpy scrub into a smooth one.
    const frame = () => {
      const gap = target - at;
      if (Math.abs(gap) > 0.0004) at += gap * 0.115;
      else at = target;
      if (at !== lastPainted) {
        paint(at);
        lastPainted = at;
      }
      raf = requestAnimationFrame(frame);
    };

    read();
    at = target;
    paint(at);
    window.addEventListener('scroll', read, { passive: true });
    window.addEventListener('resize', read);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', read);
      window.removeEventListener('resize', read);
    };
  }, []);

  return (
    <section className="scrub" ref={sec} aria-label="Introduction">
      <div className="scrub-stage">
        <div className="scene" aria-hidden="true">
          <div className="board" ref={board}>
            <div className="b-url">
              <span className="b-dots">
                <i />
                <i />
                <i />
              </span>
              <span ref={url} className="b-url-text" />
            </div>
            <div className="b-grid">
              <div className="b-corner">Judge</div>
              {COLS.map((c, i) => (
                <div key={c} className="b-col" ref={(e) => (cols.current[i] = e)}>
                  <span className="long">{c}</span>
                  <span className="short">{SHORT[i]}</span>
                </div>
              ))}
              {ROWS.map(([name, co], r) => (
                <div key={name} className="b-row" ref={(e) => (rows.current[r] = e)}>
                  <div className="b-name">
                    <b>{name}</b>
                    <span>{co}</span>
                  </div>
                  {COLS.map((c, ci) => (
                    <div key={c} className="b-cell" ref={(e) => (cells.current[r * COLS.length + ci] = e)} />
                  ))}
                </div>
              ))}
              <i className="b-beam" ref={beam} />
            </div>
          </div>
        </div>
        <div className="veil" />
        <div className="grain" />
        <i className="meter" ref={meter} />

        <div className="panels">
          <div className="panel" ref={(e) => (panels.current[0] = e)}>
            <p className="eyebrow">Built for the Nebius x NVIDIA Global AI Hackathon</p>
            <h1>
              See your score
              <br />
              before the judges do.
            </h1>
            <p className="sub">Paste a hackathon link and your project. The Panel reads the rules, studies every judge and past winner, and scores you on the real criteria.</p>
            <div className="cta">
              <Link href="/panel" className="btn btn-lg">
                Score a project
              </Link>
            </div>
          </div>
          <div className="panel" ref={(e) => (panels.current[1] = e)}>
            <p className="eyebrow">The panel</p>
            <h2 className="h1">
              Twenty-three judges.
              <br />
              One rubric.
            </h2>
            <p className="sub">Twelve from Nebius, eight from NVIDIA, three from Tavily. Each one is researched on the web, then scores you as a separate Nemotron agent.</p>
            <div className="cta">
              <a href="#judges" className="btn btn-lg">
                Meet the judges
              </a>
            </div>
          </div>
          <div className="panel" ref={(e) => (panels.current[2] = e)}>
            <p className="eyebrow">The verdict</p>
            <h2 className="h1">
              Fix what costs
              <br />
              you points.
            </h2>
            <p className="sub">A moderator settles where the judges disagree, predicts your score, and ranks the changes worth making before the deadline.</p>
            <div className="cta">
              <Link href="/panel" className="btn btn-lg">
                Score a project
              </Link>
            </div>
          </div>
        </div>
        <p className="scroll-cue" aria-hidden="true" ref={cue}>
          Scroll
        </p>
      </div>
    </section>
  );
}
