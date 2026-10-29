'use client';

import { useEffect, useRef, useState } from 'react';

const STEP_MS = 6500;

// Real past winners from Nebius-run events, with their public sources.
const WINNERS = [
  {
    project: 'MediSimplifier',
    event: 'Nebius Serverless AI Builders Challenge, 1st',
    note: 'Rewrote hospital discharge notes in plain language and published its full bill: $320.',
    url: 'https://nebius.com/blog/posts/serverless-ai-builders-challenge-winners',
  },
  {
    project: 'Injester',
    event: 'Nebius.Build SF, 1st',
    note: 'Turned messy websites into clean data for agents, with accuracy going from 2 of 5 to 5 of 5.',
    url: 'https://cerebralvalley.ai/e/nebius-build-sf/hackathon/gallery',
  },
  {
    project: 'Balagan',
    event: 'Nebius Serverless AI Builders Challenge, 3rd',
    note: 'Stress-tested teams of agents: 225 trials in 63 seconds for $3.64.',
    url: 'https://nebius.com/blog/posts/serverless-ai-builders-challenge-winners',
  },
];

const STEPS = [
  { title: 'Read the event', text: 'Rules, tracks, criteria, prizes and the judge list, pulled from the page you paste.' },
  { title: 'Study past winners', text: 'What the same organizer rewarded before, each one linked to its source.' },
  { title: 'Profile each judge', text: 'What their public work says they care about, and what would lose their vote.' },
  { title: 'Score your project', text: 'Every judge is its own agent. It scores each criterion and checks your claims on the web.' },
  { title: 'Get the fix list', text: 'A moderator settles disagreements, predicts a score and ranks what to change first.' },
];

export default function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !('IntersectionObserver' in window)) return setVisible(true);
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || !visible || reduce) return;
    const t = setTimeout(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearTimeout(t);
  }, [active, paused, visible, tick]);

  const go = (i) => {
    setActive(i);
    setTick((t) => t + 1);
  };

  return (
    <div className="how" ref={ref} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <ol className="how-steps" role="tablist" aria-label="Steps in a run">
        {STEPS.map((s, i) => (
          <li key={s.title}>
            <button
              role="tab"
              id={`how-tab-${i}`}
              aria-selected={active === i}
              aria-controls="how-panel"
              className={`how-step ${active === i ? 'on' : ''} ${i < active ? 'past' : ''}`}
              onClick={() => go(i)}
            >
              <span className="how-num">{i + 1}</span>
              <span className="how-text">
                <b>{s.title}</b>
                <span>{s.text}</span>
              </span>
              {active === i && (
                <span className="how-progress" aria-hidden="true">
                  <span key={`${active}-${tick}`} style={{ animationDuration: `${STEP_MS}ms`, animationPlayState: paused || !visible ? 'paused' : 'running' }} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ol>
      <div className="how-stage" id="how-panel" role="tabpanel" aria-labelledby={`how-tab-${active}`}>
        <div key={active} className="how-scene">
          {active === 0 && <SceneEvent />}
          {active === 1 && <SceneWinners />}
          {active === 2 && <SceneJudge />}
          {active === 3 && <SceneScore />}
          {active === 4 && <SceneFixes />}
        </div>
      </div>
    </div>
  );
}

function SceneEvent() {
  const rows = [
    ['Event', 'Nebius x NVIDIA Global AI Hackathon'],
    ['Tracks', '4: Coding and Agentic Engineering, Best Apps and Agents, Personal AI, Physical AI'],
    ['Criteria', '4: Technological Implementation, Design, Potential Impact, Quality of the Idea'],
    ['Judges', '23 from NVIDIA, Nebius and Tavily'],
    ['Must have', 'Runs on Nebius Token Factory or AI Cloud, uses an NVIDIA open model, public repo, video under 3 minutes'],
  ];
  return (
    <div className="scene">
      <div className="scene-label">Extracted from the Devpost page</div>
      <dl className="scene-dl">
        {rows.map(([k, v], i) => (
          <div key={k} className="rise" style={{ animationDelay: `${i * 140}ms` }}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SceneWinners() {
  return (
    <div className="scene">
      <div className="scene-label">Past winners at Nebius events</div>
      <ul className="scene-winners">
        {WINNERS.map((w, i) => (
          <li key={w.project} className="rise" style={{ animationDelay: `${i * 180}ms` }}>
            <div>
              <b>{w.project}</b>
              <small>{w.event}</small>
            </div>
            <p>{w.note}</p>
            <a href={w.url} target="_blank" rel="noreferrer">
              Source
            </a>
          </li>
        ))}
      </ul>
      <p className="scene-foot rise" style={{ animationDelay: '600ms' }}>
        The pattern: each one showed a real number, not a promise.
      </p>
    </div>
  );
}

function SceneJudge() {
  return (
    <div className="scene">
      <div className="scene-label">A judge profile, shown by role</div>
      <div className="scene-card rise">
        <b>Forward deployed engineer, Tavily</b>
        <p className="faint small" style={{ margin: '2px 0 12px' }}>
          Built from a public talk at a Builders and Brews event
        </p>
        <div className="scene-two">
          <div>
            <span className="scene-k">Likely to reward</span>
            <ul>
              <li className="rise" style={{ animationDelay: '200ms' }}>Agents that decide when to search</li>
              <li className="rise" style={{ animationDelay: '320ms' }}>Using extract and crawl, not only search</li>
              <li className="rise" style={{ animationDelay: '440ms' }}>Answers with citations</li>
            </ul>
          </div>
          <div>
            <span className="scene-k">Could lose their vote</span>
            <ul>
              <li className="rise flag" style={{ animationDelay: '560ms' }}>Search calls hard-coded into every step</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneScore() {
  const lines = [
    { k: 'read', t: 'Reading your README and demo page' },
    { k: 'tool', t: 'web_search("tools that simulate hackathon judges")' },
    { k: 'read', t: 'Comparing against past winners' },
    { k: 'score', t: 'Scoring Technological Implementation' },
    { k: 'score', t: 'Scoring Design' },
    { k: 'score', t: 'Scoring Potential Impact' },
    { k: 'score', t: 'Scoring Quality of the Idea' },
  ];
  return (
    <div className="scene">
      <div className="scene-label">One judge agent at work</div>
      <ol className="scene-log">
        {lines.map((l, i) => (
          <li key={i} className={`rise log-${l.k}`} style={{ animationDelay: `${i * 380}ms` }}>
            {l.t}
          </li>
        ))}
      </ol>
    </div>
  );
}

function SceneFixes() {
  const fixes = [
    ['Put the measured cost per run in your README', 'Low effort', 'High impact'],
    ['Show a live run in the first 20 seconds of the video', 'Low effort', 'High impact'],
    ['Use Tavily extract on source pages, not only search', 'Medium effort', 'Medium impact'],
  ];
  return (
    <div className="scene">
      <div className="scene-label">The kind of fix list you get</div>
      <ol className="scene-fixes">
        {fixes.map(([f, e, i], n) => (
          <li key={f} className="rise" style={{ animationDelay: `${n * 200}ms` }}>
            <span className="fx-n">{n + 1}</span>
            <span className="fx-t">{f}</span>
            <span className="fx-tags">
              <em>{e}</em>
              <em className="hi">{i}</em>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
