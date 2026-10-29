'use client';

import { useEffect, useRef, useState } from 'react';

// The hero plays what a run does, using only real facts from the Nebius x NVIDIA Devpost page.
// It never shows a score: the cells end on "Your project", because only a real run can fill them.
const URL_TEXT = 'nebiusglobalaihackathon.devpost.com';
const CRITERIA = ['Technological Implementation', 'Design', 'Potential Impact', 'Quality of the Idea'];
const SHORT = ['Tech', 'Design', 'Impact', 'Idea', 'Overall'];
const JUDGES = [
  { name: 'Staff AI Engineer', org: 'NVIDIA' },
  { name: 'Founding product marketer', org: 'Nebius Token Factory' },
  { name: 'Forward deployed engineer', org: 'Tavily' },
  { name: 'Developer relations lead', org: 'Nebius' },
];
const STATUS = {
  typing: 'Opening the event page',
  criteria: 'Reading the judging criteria',
  judges: 'Seating the judges',
  scan: 'Researching judges and past winners',
  ready: 'Ready for your project',
};

export default function HeroDemo() {
  const [typed, setTyped] = useState(0);
  const [cols, setCols] = useState(0);
  const [rows, setRows] = useState(0);
  const [scan, setScan] = useState(-1);
  const [phase, setPhase] = useState('typing');
  const timers = useRef([]);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setTyped(URL_TEXT.length);
      setCols(CRITERIA.length);
      setRows(JUDGES.length);
      setPhase('ready');
      return;
    }
    let cancelled = false;
    const at = (ms, fn) => timers.current.push(setTimeout(() => !cancelled && fn(), ms));

    function play() {
      setTyped(0);
      setCols(0);
      setRows(0);
      setScan(-1);
      setPhase('typing');
      let t = 300;
      for (let i = 1; i <= URL_TEXT.length; i++) at((t += 38), () => setTyped(i));
      at((t += 350), () => setPhase('criteria'));
      for (let i = 1; i <= CRITERIA.length; i++) at((t += 260), () => setCols(i));
      at((t += 300), () => setPhase('judges'));
      for (let i = 1; i <= JUDGES.length; i++) at((t += 260), () => setRows(i));
      at((t += 300), () => setPhase('scan'));
      const cells = JUDGES.length * (CRITERIA.length + 1);
      for (let i = 0; i < cells; i++) at((t += 70), () => setScan(i));
      at((t += 250), () => {
        setScan(-1);
        setPhase('ready');
      });
      at((t += 4200), play);
    }
    play();
    return () => {
      cancelled = true;
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, []);

  const ncol = CRITERIA.length + 1;
  return (
    <div className="demo" aria-label="Animated example of The Panel reading the Nebius x NVIDIA Global AI Hackathon">
      <div className="demo-bar">
        <span className="demo-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="demo-url">
          {URL_TEXT.slice(0, typed)}
          {phase === 'typing' && <span className="caret" aria-hidden="true" />}
        </span>
      </div>
      <div className="demo-body">
        <div className="demo-grid" style={{ gridTemplateColumns: `minmax(96px, 1.25fr) repeat(${ncol}, minmax(0, 1fr))` }}>
          <div className="demo-corner">Judge</div>
          {[...CRITERIA, 'Overall'].map((c, i) => (
            <div key={c} className={`demo-col ${i < cols || (i === CRITERIA.length && cols === CRITERIA.length) ? 'in' : ''}`} title={c}>
              <span className="long">{c}</span>
              <span className="short">{SHORT[i]}</span>
            </div>
          ))}
          {JUDGES.map((j, r) => (
            <Row key={j.name} j={j} r={r} shown={r < rows} ncol={ncol} scan={scan} ready={phase === 'ready'} />
          ))}
        </div>
      </div>
      <div className="demo-status" aria-live="off">
        <span className={`demo-pulse ${phase === 'ready' ? 'done' : ''}`} aria-hidden="true" />
        {STATUS[phase]}
      </div>
    </div>
  );
}

function Row({ j, r, shown, ncol, scan, ready }) {
  return (
    <>
      <div className={`demo-judge ${shown ? 'in' : ''}`}>
        <b>{j.name}</b>
        <small>{j.org}</small>
      </div>
      {Array.from({ length: ncol }, (_, c) => {
        const idx = r * ncol + c;
        const overall = c === ncol - 1;
        return (
          <div key={c} className={`demo-cell ${shown ? 'in' : ''} ${scan === idx ? 'scan' : ''} ${scan > idx ? 'seen' : ''} ${overall ? 'overall' : ''} ${ready && overall ? 'ask' : ''}`}>
            {ready && overall && r === 0 ? <span>Yours</span> : null}
          </div>
        );
      })}
    </>
  );
}
