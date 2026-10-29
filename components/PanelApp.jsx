'use client';

import { useEffect, useRef, useState } from 'react';
import Matrix from './Matrix.jsx';

const STAGES = [
  { id: 'scout', label: 'Read the event' },
  { id: 'project', label: 'Read your project' },
  { id: 'winners', label: 'Look up past winners' },
  { id: 'research', label: 'Research the judges' },
  { id: 'judging', label: 'Score your project' },
  { id: 'verdict', label: 'Settle disagreements' },
];

const SELF = {
  hackathonUrl: 'https://nebiusglobalaihackathon.devpost.com/',
  projectUrl: 'https://github.com/ohjay-official/the-panel',
  projectText:
    'The Panel scores a hackathon project before submission. It reads the event page with Tavily, looks up the organizer’s past winners, researches each judge on the web, and runs every judge as a separate NVIDIA Nemotron agent served by Nebius Token Factory. Each judge scores the project on the official criteria and can call a web search tool to check claims. A moderator model compares the judges, predicts a score, and ranks fixes. Every model call is metered so the user sees tokens, time and cost per run.',
};

const usd = (n) => (n < 0.01 ? `$${n.toFixed(4)}` : `$${n.toFixed(3)}`);
const k = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const STATE_TEXT = { running: 'Working', done: 'Done' };

export default function PanelApp() {
  const [form, setForm] = useState({ hackathonUrl: '', projectUrl: '', projectUrl2: '', projectText: '', judgeCount: 4, roleOnly: false, passcode: '' });
  const [cfg, setCfg] = useState(null);
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState({});
  const [brief, setBrief] = useState(null);
  const [judges, setJudges] = useState([]);
  const [winners, setWinners] = useState(null);
  const [verdict, setVerdict] = useState(null);
  const [cost, setCost] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [sampleRun, setSampleRun] = useState(false);
  const resultsRef = useRef(null);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg(null));
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
      case 'winners':
        setWinners(ev.winners);
        break;
      case 'verdict':
        setVerdict(ev.verdict);
        break;
      case 'cost':
        setCost(ev.summary);
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
    setWinners(null);
    setVerdict(null);
    setCost(null);
    setSampleRun(!!cfg?.mock);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

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
        throw new Error(j.error || `The server returned an error (${res.status}). Try again in a minute.`);
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
      setError(err.message || 'The run stopped before it finished. Try again.');
    } finally {
      setRunning(false);
    }
  }

  function copyFixes() {
    if (!verdict) return;
    const md = [
      `# Scorecard: ${brief?.name || 'hackathon'}`,
      sampleRun ? '(Sample data, not a real result.)' : `Predicted score: ${verdict.predicted_score}/100 (${verdict.finish})`,
      '',
      verdict.verdict,
      '',
      '## Changes to make',
      ...(verdict.fixes || []).map((f, i) => `${i + 1}. ${f.fix} (effort: ${f.effort}, impact: ${f.impact}). ${f.why}`),
    ].join('\n');
    navigator.clipboard?.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const criteria = brief?.criteria?.map((c) => c.name) || [];
  const matrixRows = judges.map((j) => {
    const r = j.result;
    const scores = {};
    const reasons = {};
    if (r && !r.error) {
      for (const s of r.scores || []) {
        const key = criteria.find((c) => c.toLowerCase() === String(s.criterion).toLowerCase()) || s.criterion;
        scores[key] = s.score;
        reasons[key] = s.reason;
      }
    }
    return {
      id: j.id,
      name: j.display,
      role: `${j.title}, ${j.company}`,
      scores,
      reasons,
      overall: r && !r.error ? r.overall : undefined,
      pending: r?.error ? 'Failed' : !r && running ? (j.profile ? 'Scoring' : 'Reading') : '',
    };
  });
  const started = running || Object.keys(stages).length > 0 || !!error;

  return (
    <>
      <div className="tool-head">
        <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)' }}>Score a project</h1>
        <p>Paste the event link and tell the panel what you built. A run takes a few minutes. Nothing you enter is saved.</p>
      </div>

      {cfg?.mock && (
        <div className="notice warn" style={{ marginBottom: 20, maxWidth: 820 }}>
          <p>
            <strong>Sample mode.</strong> This server has no model key yet, so runs use built-in sample data. The names and scores you see are placeholders, not a real assessment.
          </p>
        </div>
      )}

      <form className="sheet sheet-pad form-grid" onSubmit={run}>
        <div>
          <label className="field-label" htmlFor="h">
            Event page
          </label>
          <input id="h" type="url" required placeholder="https://example.devpost.com" value={form.hackathonUrl} onChange={set('hackathonUrl')} />
          <div className="field-help">A Devpost page, bounty listing, or any page with the rules and judges.</div>
        </div>
        <div className="form-row">
          <div>
            <label className="field-label" htmlFor="p1">
              Project repo or demo
            </label>
            <input id="p1" type="url" placeholder="https://github.com/you/project" value={form.projectUrl} onChange={set('projectUrl')} />
          </div>
          <div>
            <label className="field-label" htmlFor="p2">
              Another link <span className="faint">(optional)</span>
            </label>
            <input id="p2" type="url" placeholder="Live demo, docs, or a draft write-up" value={form.projectUrl2} onChange={set('projectUrl2')} />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="t">
            What you built
          </label>
          <textarea id="t" placeholder="Who it’s for, what it does, and how it uses the sponsor’s tools. Your README or submission text works well." value={form.projectText} onChange={set('projectText')} />
          <div className="field-help">Add a link, a description, or both. Judges only score what they can read.</div>
        </div>
        <div className="form-row">
          <div>
            <label className="field-label" htmlFor="n">
              Judges to seat
            </label>
            <select id="n" value={form.judgeCount} onChange={set('judgeCount')}>
              {[2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n} judges
                </option>
              ))}
            </select>
            <div className="field-help">More judges take longer and cost more per run.</div>
          </div>
          <div style={{ alignSelf: 'center' }}>
            <label className="check">
              <input type="checkbox" checked={form.roleOnly} onChange={set('roleOnly')} />
              <span>
                Use roles instead of names
                <span className="field-help" style={{ display: 'block', marginTop: 2 }}>
                  Judges appear as “AI engineer at NVIDIA” rather than by name.
                </span>
              </span>
            </label>
          </div>
        </div>
        {cfg?.passcode && (
          <div style={{ maxWidth: 360 }}>
            <label className="field-label" htmlFor="pc">
              Passcode
            </label>
            <input id="pc" type="password" value={form.passcode} onChange={set('passcode')} />
          </div>
        )}
        <div className="form-actions">
          <button className="btn" type="submit" disabled={running}>
            {running ? 'Scoring…' : 'Score my project'}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={running}
            onClick={() => setForm((f) => ({ ...f, hackathonUrl: SELF.hackathonUrl, projectUrl: SELF.projectUrl, projectText: SELF.projectText }))}
          >
            Fill in The Panel itself
          </button>
        </div>
      </form>

      <div ref={resultsRef} />

      {started && (
        <section className="result-block" aria-live="polite">
          <h2>{running ? 'Scoring your project' : error ? 'The run stopped' : sampleRun ? 'Sample run finished' : 'Scored'}</h2>
          {sampleRun && <p className="sub">Everything below is sample data. Add a model key to the server for a real result.</p>}
          <ol className="run-steps">
            {STAGES.map((s) => {
              const st = stages[s.id];
              return (
                <li key={s.id} className={st?.status || ''}>
                  <span className="state">{STATE_TEXT[st?.status] || 'Waiting'}</span>
                  <span className="what">
                    {s.label}
                    {st?.text ? `: ${st.text}` : ''}
                  </span>
                </li>
              );
            })}
          </ol>
          {error && (
            <div className="notice warn" style={{ marginTop: 16 }}>
              <p>{error}</p>
            </div>
          )}
        </section>
      )}

      {brief && (
        <section className="result-block">
          <h2>The event</h2>
          <div className="sheet sheet-pad">
            <dl className="brief">
              <dt>Name</dt>
              <dd>
                {brief.name}
                {brief.organizer ? `, run by ${brief.organizer}` : ''}
                {brief.deadline ? `. Deadline ${brief.deadline}` : ''}
              </dd>
              {brief.summary && (
                <>
                  <dt>Looking for</dt>
                  <dd>{brief.summary}</dd>
                </>
              )}
              <dt>Criteria</dt>
              <dd>
                {brief.criteria.map((c) => (
                  <span key={c.name} className="tagline" title={c.description}>
                    {c.name}
                  </span>
                ))}
                {brief.criteriaInferred && <span className="faint">The page listed no criteria, so these are general ones.</span>}
              </dd>
              {brief.tracks?.length > 0 && (
                <>
                  <dt>Tracks</dt>
                  <dd>{brief.tracks.map((t) => t.name).join(', ')}</dd>
                </>
              )}
              {brief.requirements?.length > 0 && (
                <>
                  <dt>Must have</dt>
                  <dd>
                    <ul style={{ margin: 0, paddingLeft: '1.1em' }}>
                      {brief.requirements.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  </dd>
                </>
              )}
              {brief.prizes?.length > 0 && (
                <>
                  <dt>Prizes</dt>
                  <dd>{brief.prizes.slice(0, 6).join('; ')}</dd>
                </>
              )}
            </dl>
          </div>
        </section>
      )}

      {judges.length > 0 && criteria.length > 0 && (
        <section className="result-block">
          <h2>Scorecard</h2>
          <p className="sub">Scores out of 10. Hover or long-press a cell for the judge’s reason.</p>
          <div className="sheet sheet-pad">
            <Matrix criteria={criteria} rows={matrixRows} caption="Scores by judge and criterion" />
          </div>
        </section>
      )}

      {winners && (
        <section className="result-block">
          <h2>Past winners from this organizer</h2>
          {winners.winners.length === 0 ? (
            <p className="sub">No winners from earlier events by this organizer turned up with a source we could link. The judges scored without this comparison.</p>
          ) : (
            <>
              {winners.patterns?.length > 0 && <p className="sub">What they had in common: {winners.patterns.join(' ')}</p>}
              <div className="sheet table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Event</th>
                      <th>What they built</th>
                      <th>Why it stood out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winners.winners.map((w, i) => (
                      <tr key={i}>
                        <td>
                          <a href={w.url} target="_blank" rel="noreferrer">
                            {w.project}
                          </a>
                          {w.place ? <div className="faint small">{w.place}</div> : null}
                        </td>
                        <td>{w.event}</td>
                        <td>{w.built}</td>
                        <td>{w.why || <span className="faint">Not stated in the source</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {judges.length > 0 && (
        <section className="result-block">
          <h2>Judge notes</h2>
          <div className="judge-notes">
            {judges.map((j) => (
              <JudgeNote key={j.id} j={j} running={running} />
            ))}
          </div>
        </section>
      )}

      {verdict && (
        <>
          <section className="result-block">
            <h2>Verdict</h2>
            <div className="sheet sheet-pad verdict">
              <div>
                {sampleRun ? (
                  <div className="big-score" style={{ fontSize: 48 }}>Sample</div>
                ) : (
                  <div className="big-score">
                    {verdict.predicted_score}
                    <span>/100</span>
                  </div>
                )}
                {!sampleRun && <div className="finish">{verdict.finish}</div>}
                {verdict.best_track && verdict.best_track !== 'n/a' && <div className="muted small">Best fit: {verdict.best_track}</div>}
              </div>
              <div>
                <p className="verdict-text">{verdict.verdict}</p>
                {verdict.strengths?.length > 0 && <p className="muted small">Working in your favor: {verdict.strengths.join('; ')}.</p>}
              </div>
            </div>
          </section>

          {verdict.vs_winners?.length > 0 && winners?.winners?.length > 0 && (
            <section className="result-block">
              <h2>Against past winners</h2>
              <div className="sheet table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Winner</th>
                      <th>What won it</th>
                      <th>Where you stand</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verdict.vs_winners.map((v, i) => (
                      <tr key={i}>
                        <td>{v.winner}</td>
                        <td>{v.they_did}</td>
                        <td>{v.gap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {verdict.debate?.length > 0 && (
            <section className="result-block">
              <h2>Where the judges disagreed</h2>
              <div className="transcript">
                {verdict.debate.map((d, i) => (
                  <div key={i} className={/moderator/i.test(d.speaker) ? 'mod' : ''}>
                    <span className="who">{d.speaker}</span>
                    <span className="said">{d.line}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {verdict.fixes?.length > 0 && (
            <section className="result-block">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                <h2>Changes to make before you submit</h2>
                <button className="btn btn-quiet btn-small" onClick={copyFixes}>
                  {copied ? 'Copied' : 'Copy as Markdown'}
                </button>
              </div>
              <div className="sheet table-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th className="num">#</th>
                      <th>Change</th>
                      <th>Why</th>
                      <th>Effort</th>
                      <th>Impact</th>
                      <th>Raised by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verdict.fixes.map((f, i) => (
                      <tr key={i}>
                        <td className="num">{i + 1}</td>
                        <td>
                          <strong>{f.fix}</strong>
                        </td>
                        <td>{f.why}</td>
                        <td>{f.effort}</td>
                        <td>{f.impact}</td>
                        <td>{(f.raised_by || []).join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}

      {cost && (
        <section className="result-block">
          <h2>Cost of this run</h2>
          <p className="sub">
            Every model call is metered at the provider’s per-token price.
            {sampleRun ? ' These numbers come from sample data.' : ''}
          </p>
          <div className="sheet table-scroll">
            <table className="data">
              <thead>
                <tr>
                  <th>Model and job</th>
                  <th className="num">Calls</th>
                  <th className="num">Tokens in / out</th>
                  <th className="num">Time</th>
                  <th className="num">Cost</th>
                </tr>
              </thead>
              <tbody>
                {cost.tiers.map((t) => (
                  <tr key={t.tier}>
                    <td>
                      <strong>{t.name}</strong>
                      <div className="faint small">{t.job}</div>
                      <code>{t.model}</code>
                    </td>
                    <td className="num">{t.calls}</td>
                    <td className="num">
                      {k(t.inTok)} / {k(t.outTok)}
                    </td>
                    <td className="num">{(t.ms / 1000).toFixed(1)}s</td>
                    <td className="num">{usd(t.cost)}</td>
                  </tr>
                ))}
                <tr>
                  <td>
                    <strong>Tavily web data</strong>
                    <div className="faint small">
                      {Object.entries(cost.tavilyByEndpoint)
                        .map(([e, c]) => `${c} ${e} call${c === 1 ? '' : 's'}`)
                        .join(', ')}
                    </div>
                  </td>
                  <td className="num">{cost.tavilyCalls}</td>
                  <td className="num">about {cost.tavilyCreditsEst} credits</td>
                  <td className="num" />
                  <td className="num" />
                </tr>
                <tr className="total">
                  <td>Total model cost</td>
                  <td className="num">{cost.llmCalls}</td>
                  <td className="num">
                    {k(cost.inTok)} / {k(cost.outTok)}
                  </td>
                  <td className="num" />
                  <td className="num">{usd(cost.totalUsd)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          {cost.savingsPct > 0 && (
            <p className="muted small" style={{ marginTop: 10 }}>
              Running every call on the largest model would have cost {usd(cost.ultraOnlyUsd)}. Routing quick jobs to the small model saved {cost.savingsPct}%.
            </p>
          )}
        </section>
      )}
    </>
  );
}

function JudgeNote({ j, running }) {
  const p = j.profile;
  const r = j.result;
  return (
    <article className="judge-note">
      <div>
        <h3>{j.display}</h3>
        <div className="role">
          {j.title}, {j.company}
        </div>
        {r && !r.error && (
          <div className="overall-score">
            {r.overall}
            <span> / 10 overall</span>
          </div>
        )}
      </div>
      <div>
        {!p && running && <p className="faint">Researching this judge…</p>}
        {p && (
          <>
            <p className="muted" style={{ marginBottom: 8 }}>
              {p.summary}
              {p.confidence === 'low' ? ' Little public information, so this profile leans on the role.' : ''}
            </p>
            {p.values?.length > 0 && (
              <p className="small" style={{ marginBottom: 8 }}>
                <strong>Likely to reward:</strong> {p.values.join('; ')}.
              </p>
            )}
          </>
        )}
        {j.searches?.map((q, i) => (
          <p key={i} className="verify" style={{ marginBottom: 6 }}>
            <b>Checked on the web:</b> {q}
          </p>
        ))}
        {p && !r && running && <p className="faint">Scoring…</p>}
        {r?.error && <p className="error-text">This judge could not finish: {r.error}</p>}
        {r && !r.error && (
          <>
            {r.take && <p className="take">{r.take}</p>}
            <dl>
              <dt>Likes</dt>
              <dd>{r.loved}</dd>
              <dt>Worried by</dt>
              <dd>{r.concern}</dd>
              <dt>Change</dt>
              <dd>{r.fix}</dd>
              {r.requirement_gaps?.length > 0 && (
                <>
                  <dt>Missing</dt>
                  <dd className="flag">{r.requirement_gaps.join('; ')}</dd>
                </>
              )}
            </dl>
          </>
        )}
        {p?.evidence?.length > 0 && (
          <ol className="sources" aria-label="Sources for this profile">
            {p.evidence.slice(0, 3).map((e, i) => (
              <li key={i}>
                <a href={e.url} target="_blank" rel="noreferrer">
                  {e.claim}
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}
