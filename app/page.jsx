'use client';

import { useEffect, useRef, useState } from 'react';

const STAGES = [
  { id: 'scout', label: 'Scout the event' },
  { id: 'project', label: 'Read your project' },
  { id: 'research', label: 'Research the judges' },
  { id: 'judging', label: 'Judges score you' },
  { id: 'verdict', label: 'Moderator rules' },
];

const EXAMPLE = {
  hackathonUrl: 'https://nebiusglobalaihackathon.devpost.com/',
  projectUrl: 'https://github.com/ohjay-official/the-panel',
  projectText:
    'The Panel: paste a hackathon link and your project. It reads the event with Tavily, researches each judge on the live web, simulates every judge as a Nemotron 3 Super agent that can search to verify claims, and a Nemotron 3 Ultra moderator returns a predicted score and a ranked fix list. Nano handles parsing. Every call is metered so you see the cost per run.',
};

const initials = (s = '') =>
  s
    .split(/[\s·]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const usd = (n) => (n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(3)}`);
const k = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default function Home() {
  const [form, setForm] = useState({ hackathonUrl: '', projectUrl: '', projectUrl2: '', projectText: '', judgeCount: 4, roleOnly: false, passcode: '' });
  const [cfg, setCfg] = useState(null);
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState({});
  const [brief, setBrief] = useState(null);
  const [judges, setJudges] = useState([]);
  const [verdict, setVerdict] = useState(null);
  const [cost, setCost] = useState(null);
  const [log, setLog] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => {});
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const patchJudge = (id, patch) => setJudges((js) => js.map((j) => (j.id === id ? { ...j, ...(typeof patch === 'function' ? patch(j) : patch) } : j)));

  function handle(ev) {
    switch (ev.type) {
      case 'stage':
        setStages((s) => ({ ...s, [ev.id]: { status: ev.status, text: ev.text } }));
        break;
      case 'brief':
        setBrief(ev.brief);
        break;
      case 'judges':
        setJudges(ev.judges.map((j) => ({ ...j, searches: [] })));
        break;
      case 'profile':
        patchJudge(ev.id, { profile: ev.profile });
        break;
      case 'judge_search':
        patchJudge(ev.id, (j) => ({ searches: [...(j.searches || []), ev.query] }));
        break;
      case 'judge_result':
        patchJudge(ev.id, { result: ev.result });
        break;
      case 'verdict':
        setVerdict(ev.verdict);
        break;
      case 'cost':
        setCost(ev.summary);
        break;
      case 'call':
        setLog((l) => [...l, { kind: 'llm', ...ev.call }]);
        break;
      case 'tavily':
        setLog((l) => [...l, { kind: 'tavily', ...ev.t }]);
        break;
      case 'error':
        setError(ev.message);
        break;
      default:
        break;
    }
  }

  async function run(e) {
    e?.preventDefault();
    setRunning(true);
    setError('');
    setStages({});
    setBrief(null);
    setJudges([]);
    setVerdict(null);
    setCost(null);
    setLog([]);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    try {
      const res = await fetch('/api/panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonUrl: form.hackathonUrl.trim(),
          projectUrls: [form.projectUrl, form.projectUrl2].map((s) => s.trim()).filter(Boolean),
          projectText: form.projectText,
          judgeCount: Number(form.judgeCount),
          roleOnly: form.roleOnly,
          passcode: form.passcode,
        }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `Request failed (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            handle(JSON.parse(line));
          } catch {}
        }
      }
      if (buf.trim()) {
        try {
          handle(JSON.parse(buf));
        } catch {}
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }

  function copyFixes() {
    if (!verdict) return;
    const md = [
      `# The Panel: ${brief?.name || 'verdict'}`,
      `Predicted score: ${verdict.predicted_score}/100 (${verdict.finish})`,
      '',
      verdict.verdict,
      '',
      '## Fix list',
      ...(verdict.fixes || []).map((f, i) => `${i + 1}. **${f.fix}** (effort: ${f.effort}, impact: ${f.impact})\n   ${f.why}`),
    ].join('\n');
    navigator.clipboard?.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  const started = running || Object.keys(stages).length > 0 || error;

  return (
    <main className="wrap">
      <header className="top">
        <div className="mark">
          The <i>Panel</i>
        </div>
        <div className="tag">Nemotron × Token Factory × Tavily</div>
      </header>

      <section className="hero">
        <h1>
          Know your score <em>before</em> the judges do.
        </h1>
        <p>
          Paste a hackathon link and your project. The Panel reads the rules, researches every judge on the live web, simulates each one as an agent, and tells you exactly what to fix before you submit.
        </p>
      </section>

      <form className="card form" onSubmit={run}>
        <div>
          <label htmlFor="h">Hackathon or bounty URL</label>
          <input id="h" type="url" required placeholder="https://something.devpost.com" value={form.hackathonUrl} onChange={set('hackathonUrl')} />
        </div>
        <div className="row">
          <div>
            <label htmlFor="p1">Project repo or demo URL</label>
            <input id="p1" type="url" placeholder="https://github.com/you/project" value={form.projectUrl} onChange={set('projectUrl')} />
          </div>
          <div>
            <label htmlFor="p2">Second link (optional)</label>
            <input id="p2" type="url" placeholder="Live demo, Devpost draft, docs" value={form.projectUrl2} onChange={set('projectUrl2')} />
          </div>
        </div>
        <div>
          <label htmlFor="t">Describe your project</label>
          <textarea id="t" placeholder="What it does, who it's for, how it uses the sponsor's tech. Paste your README or Devpost description." value={form.projectText} onChange={set('projectText')} />
          <div className="hint">Use a link, a description, or both. The judges only score what they can see.</div>
        </div>
        <div className="row">
          <div>
            <label htmlFor="n">Judges on the bench</label>
            <select id="n" value={form.judgeCount} onChange={set('judgeCount')}>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} judges
                </option>
              ))}
            </select>
          </div>
          {cfg?.passcode ? (
            <div>
              <label htmlFor="pc">Passcode</label>
              <input id="pc" type="password" value={form.passcode} onChange={set('passcode')} />
            </div>
          ) : (
            <div className="toggles" style={{ alignSelf: 'end', paddingBottom: 10 }}>
              <label className="check" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)' }}>
                <input type="checkbox" checked={form.roleOnly} onChange={set('roleOnly')} /> Role-only mode (no names)
              </label>
            </div>
          )}
        </div>
        {cfg?.passcode && (
          <label className="check" style={{ margin: 0, textTransform: 'none', letterSpacing: 0, fontFamily: 'var(--sans)' }}>
            <input type="checkbox" checked={form.roleOnly} onChange={set('roleOnly')} /> Role-only mode (no names)
          </label>
        )}
        <div className="actions">
          <button className="btn" type="submit" disabled={running}>
            {running ? 'Panel in session…' : 'Convene the panel'}
          </button>
          <button
            type="button"
            className="linkish"
            onClick={() => setForm((f) => ({ ...f, hackathonUrl: EXAMPLE.hackathonUrl, projectUrl: EXAMPLE.projectUrl, projectText: EXAMPLE.projectText }))}
          >
            Try it on itself →
          </button>
        </div>
        {cfg && (!cfg.ready.nebius || !cfg.ready.tavily) && (
          <div className="err">Server is missing {!cfg.ready.nebius ? 'NEBIUS_API_KEY ' : ''}{!cfg.ready.tavily ? 'TAVILY_API_KEY' : ''}.</div>
        )}
      </form>

      <div ref={resultsRef} />

      {started && (
        <section className="section">
          <div className="section-h">
            <h2>Session</h2>
            <span className="tag">{running ? 'live' : error ? 'stopped' : 'adjourned'}</span>
          </div>
          <div className="stages">
            {STAGES.map((s) => {
              const st = stages[s.id];
              return (
                <div key={s.id} className={`stage ${st?.status || ''}`}>
                  <span className="dot" />
                  <span>
                    {s.label}
                    {st?.text ? <span style={{ color: 'var(--faint)' }}> — {st.text}</span> : null}
                  </span>
                </div>
              );
            })}
          </div>
          {error && <div className="alert">{error}</div>}
        </section>
      )}

      {brief && (
        <section className="section">
          <div className="section-h">
            <h2>The brief</h2>
            <span className="tag">via Tavily extract</span>
          </div>
          <div className="card">
            <dl className="kv">
              <dt>Event</dt>
              <dd>
                <b>{brief.name}</b> {brief.organizer ? `· ${brief.organizer}` : ''} {brief.deadline ? `· ${brief.deadline}` : ''}
              </dd>
              {brief.summary && (
                <>
                  <dt>Wants</dt>
                  <dd>{brief.summary}</dd>
                </>
              )}
              <dt>Criteria</dt>
              <dd className="chips">
                {brief.criteria.map((c) => (
                  <span key={c.name} className="chip b" title={c.description}>
                    {c.name}
                  </span>
                ))}
                {brief.criteriaInferred && <span className="chip">inferred</span>}
              </dd>
              {brief.tracks?.length > 0 && (
                <>
                  <dt>Tracks</dt>
                  <dd className="chips">
                    {brief.tracks.map((t) => (
                      <span key={t.name} className="chip">
                        {t.name}
                      </span>
                    ))}
                  </dd>
                </>
              )}
              {brief.prizes?.length > 0 && (
                <>
                  <dt>Prizes</dt>
                  <dd className="chips">
                    {brief.prizes.slice(0, 6).map((p) => (
                      <span key={p} className="chip">
                        {p}
                      </span>
                    ))}
                  </dd>
                </>
              )}
              <dt>Judges</dt>
              <dd>{brief.judges.length} listed</dd>
            </dl>
          </div>
        </section>
      )}

      {judges.length > 0 && (
        <section className="section">
          <div className="section-h">
            <h2>The bench</h2>
            <span className="tag">Nano profiles · Super judges</span>
          </div>
          <div className="bench">
            {judges.map((j) => (
              <JudgeCard key={j.id} j={j} />
            ))}
          </div>
        </section>
      )}

      {verdict && (
        <>
          <section className="section">
            <div className="section-h">
              <h2>The verdict</h2>
              <span className="tag">Ultra moderator</span>
            </div>
            <div className="verdict">
              <div>
                <div className="score-big">
                  {verdict.predicted_score}
                  <small>/100</small>
                </div>
                <div className="finish">{verdict.finish}</div>
                {verdict.best_track && verdict.best_track !== 'n/a' && <div className="mini" style={{ marginTop: 10 }}>Best track: <b>{verdict.best_track}</b></div>}
              </div>
              <div>
                <p className="verdict-text">{verdict.verdict}</p>
                {verdict.strengths?.length > 0 && (
                  <div className="chips">
                    {verdict.strengths.map((s) => (
                      <span key={s} className="chip b">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {verdict.debate?.length > 0 && (
            <section className="section">
              <div className="section-h">
                <h2>Deliberation</h2>
                <span className="tag">simulated</span>
              </div>
              <div className="debate">
                {verdict.debate.map((d, i) => (
                  <div key={i} className={`line ${/moderator/i.test(d.speaker) ? 'mod' : ''}`}>
                    <div className="who">{d.speaker}</div>
                    <div className="said">{d.line}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {verdict.fixes?.length > 0 && (
            <section className="section">
              <div className="section-h">
                <h2>Fix before you submit</h2>
                <button className="btn ghost" onClick={copyFixes}>
                  {copied ? 'Copied' : 'Copy as markdown'}
                </button>
              </div>
              <div className="fixes">
                {verdict.fixes.map((f, i) => (
                  <div key={i} className="fix">
                    <div>
                      <div className="fix-title">{f.fix}</div>
                      <div className="fix-why">{f.why}</div>
                      <div className="fix-tags">
                        <span className="chip">effort: {f.effort}</span>
                        <span className="chip b">impact: {f.impact}</span>
                        {(f.raised_by || []).map((r) => (
                          <span key={r} className="chip">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {(cost || log.length > 0) && (
        <section className="section">
          <div className="section-h">
            <h2>Receipt</h2>
            <span className="tag">every call metered</span>
          </div>
          <div className="card receipt">
            {cost && (
              <>
                <div className="scroll-x">
                  <table>
                    <thead>
                      <tr>
                        <th>Model / job</th>
                        <th className="n">Calls</th>
                        <th className="n">Tokens in/out</th>
                        <th className="n">Time</th>
                        <th className="n">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cost.tiers.map((t) => (
                        <tr key={t.tier}>
                          <td>
                            {t.name} <span className="model">{t.model}</span>
                            <span className="model">{t.job}</span>
                          </td>
                          <td className="n">{t.calls}</td>
                          <td className="n">
                            {k(t.inTok)} / {k(t.outTok)}
                          </td>
                          <td className="n">{(t.ms / 1000).toFixed(1)}s</td>
                          <td className="n">{usd(t.cost)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td>
                          Tavily <span className="model">{Object.entries(cost.tavilyByEndpoint).map(([e, c]) => `/${e} ×${c}`).join('  ')}</span>
                        </td>
                        <td className="n">{cost.tavilyCalls}</td>
                        <td className="n">~{cost.tavilyCreditsEst} credits</td>
                        <td className="n" />
                        <td className="n" />
                      </tr>
                      <tr className="total">
                        <td>Total model spend</td>
                        <td className="n">{cost.llmCalls}</td>
                        <td className="n">
                          {k(cost.inTok)} / {k(cost.outTok)}
                        </td>
                        <td className="n" />
                        <td className="n">{usd(cost.totalUsd)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="savings">
                  <div className="stat">
                    <div className="v">{usd(cost.totalUsd)}</div>
                    <div className="k">This run, routed</div>
                  </div>
                  <div className="stat">
                    <div className="v">{usd(cost.ultraOnlyUsd)}</div>
                    <div className="k">Same run, Ultra only</div>
                  </div>
                  <div className="stat">
                    <div className="v g">{cost.savingsPct}%</div>
                    <div className="k">Saved by routing</div>
                  </div>
                </div>
              </>
            )}
            {log.length > 0 && (
              <div className="log">
                {log.map((l, i) =>
                  l.kind === 'llm' ? (
                    <div key={i}>
                      <span className="t">{l.model.split('/').pop()}</span> · {l.label} · {l.inTok}→{l.outTok} tok · {(l.ms / 1000).toFixed(1)}s · {usd(l.cost)}
                    </div>
                  ) : (
                    <div key={i}>
                      <span className="t">tavily /{l.endpoint}</span> · {l.label} · {(l.ms / 1000).toFixed(1)}s
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <footer className="foot">
        <div>
          Judges are simulations built from public professional information, with sources linked. They are not the real people and are not affiliated with or endorsed by them. Use role-only mode to drop names.
        </div>
        {cfg && (
          <div>
            Models: {Object.values(cfg.tiers).map((t) => t.model).join(' · ')} on Nebius Token Factory. Web data by Tavily.
          </div>
        )}
      </footer>
    </main>
  );
}

function JudgeCard({ j }) {
  const p = j.profile;
  const r = j.result;
  return (
    <article className="judge">
      <div className="judge-head">
        <div className="avatar">{initials(j.display)}</div>
        <div>
          <div className="judge-name">{j.display}</div>
          <div className="judge-role">
            {j.title} · {j.company}
          </div>
        </div>
        {r && !r.error && (
          <div className="overall">
            {r.overall}
            <small>/10</small>
          </div>
        )}
      </div>

      {!p && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="skeleton" style={{ width: '90%' }} />
          <div className="skeleton" style={{ width: '70%' }} />
        </div>
      )}

      {p && (
        <>
          <div className="mini">{p.summary}</div>
          {p.values?.length > 0 && (
            <div className="mini">
              <b>Rewards:</b> {p.values.join(' · ')}
            </div>
          )}
          {p.evidence?.length > 0 && (
            <div className="evidence">
              {p.evidence.slice(0, 3).map((e, i) => (
                <a key={i} href={e.url} target="_blank" rel="noreferrer">
                  ↗ {e.claim}
                </a>
              ))}
            </div>
          )}
          {p.confidence === 'low' && <div className="mini" style={{ color: 'var(--faint)' }}>Thin public footprint, inferred mostly from role.</div>}
        </>
      )}

      {j.searches?.map((q, i) => (
        <div key={i} className="searching">
          ⌕ verifying: “{q}”
        </div>
      ))}

      {p && !r && (
        <div style={{ display: 'grid', gap: 8 }}>
          <div className="mini" style={{ color: 'var(--faint)' }}>Scoring…</div>
          <div className="skeleton" />
        </div>
      )}

      {r?.error && <div className="err">Judge failed: {r.error}</div>}

      {r && !r.error && (
        <>
          <div className="bars">
            {r.scores.map((s) => (
              <div key={s.criterion} className="bar" title={s.reason}>
                <span className="bar-label">{s.criterion}</span>
                <span className="bar-num">{s.score}</span>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${Math.max(0, Math.min(10, s.score)) * 10}%` }} />
                </div>
              </div>
            ))}
          </div>
          {r.take && <div className="take">{r.take}</div>}
          <div className="mini">
            <b>Loved:</b> {r.loved}
          </div>
          <div className="mini">
            <b>Concern:</b> {r.concern}
          </div>
          <div className="mini">
            <b>Fix:</b> {r.fix}
          </div>
          {r.requirement_gaps?.length > 0 && <div className="err">Possible requirement gaps: {r.requirement_gaps.join('; ')}</div>}
        </>
      )}
    </article>
  );
}
