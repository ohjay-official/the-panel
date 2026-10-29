import { chat, chatJSON, parseOrRepair, Ledger, TIERS } from './llm.js';
import { search, extract, crawl } from './tavily.js';

const clip = (s, n) => (s || '').slice(0, n);

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// Spread picks across companies so the bench isn't five people from one team.
function pickJudges(judges, n) {
  const groups = new Map();
  for (const j of judges) {
    const k = (j.company || 'Other').trim().toLowerCase();
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(j);
  }
  const lists = [...groups.values()];
  const picked = [];
  while (picked.length < n && lists.some((l) => l.length)) {
    for (const l of lists) if (l.length && picked.length < n) picked.push(l.shift());
  }
  return picked;
}

const BRIEF_SYS = `You extract structured facts from a hackathon or bounty page. Use only what the page says. Never invent judges, prizes or criteria. Output only JSON.`;

function briefPrompt(text) {
  return `Page content:\n"""\n${text}\n"""\n\nReturn JSON exactly in this shape:
{"name":"","organizer":"","deadline":"","summary":"one sentence on what the event wants built","requirements":["hard requirements, max 6"],"tracks":[{"name":"","description":"one sentence"}],"criteria":[{"name":"","description":"one sentence"}],"judges":[{"name":"","title":"","company":""}],"prizes":["short strings, max 8"]}
If the page lists no judges, return "judges": []. If no criteria are listed, return "criteria": [].`;
}

async function readHackathon(url, ledger, emit) {
  const pages = await extract([url], { ledger, label: 'Read hackathon page' });
  let text = pages.map((p) => p.content).join('\n\n');
  let brief = await chatJSON({
    tier: 'fast',
    ledger,
    label: 'Extract brief, criteria, judges',
    maxTokens: 4000,
    temperature: 0,
    messages: [
      { role: 'system', content: BRIEF_SYS },
      { role: 'user', content: briefPrompt(clip(text, 40000)) },
    ],
  });

  // Agentic fallback: if the page didn't give us judges or criteria, crawl the site for them.
  if (!brief.judges?.length || !brief.criteria?.length) {
    emit({ type: 'stage', id: 'scout', status: 'running', text: 'Page was thin, crawling the site for judges and criteria' });
    const crawled = await crawl(url, 'Find the judges, judging criteria, rules, tracks and prizes for this hackathon or bounty.', {
      ledger,
      label: 'Crawl site for judges/criteria',
    });
    text = [text, ...crawled.map((p) => p.content)].join('\n\n');
    brief = await chatJSON({
      tier: 'fast',
      ledger,
      label: 'Re-extract brief after crawl',
      maxTokens: 4000,
      temperature: 0,
      messages: [
        { role: 'system', content: BRIEF_SYS },
        { role: 'user', content: briefPrompt(clip(text, 50000)) },
      ],
    });
  }

  brief.tracks ||= [];
  brief.criteria ||= [];
  brief.judges = (brief.judges || []).filter((j) => j && j.name);
  brief.prizes ||= [];
  brief.requirements ||= [];
  if (!brief.criteria.length) {
    brief.criteria = [
      { name: 'Technical implementation', description: 'How well it is built' },
      { name: 'Design', description: 'Completeness and coherence of the product' },
      { name: 'Impact', description: 'Real problem, real audience' },
      { name: 'Originality', description: 'Creative, non-obvious idea' },
    ];
    brief.criteriaInferred = true;
  }
  return brief;
}

async function profileJudge(j, brief, { ledger, roleOnly }) {
  const query = roleOnly
    ? `${j.company} ${j.title} priorities developers ${new Date().getFullYear()}`
    : `"${j.name}" ${j.company} ${j.title}`;
  const results = await search(query, { max: 5, ledger, label: `Research ${roleOnly ? j.title : j.name}` });
  const sources = results.map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`).join('\n\n');

  const who = roleOnly ? `a ${j.title} at ${j.company}` : `${j.name}, ${j.title} at ${j.company}`;
  const profile = await chatJSON({
    tier: 'fast',
    ledger,
    label: `Profile ${roleOnly ? j.title : j.name}`,
    maxTokens: 2500,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'You build a short, evidence-based profile of what a hackathon judge is likely to value, using ONLY the sources given plus their stated role. Sources may be about a different person with the same name; ignore anything that does not clearly match the role and company. If evidence is thin, say so and infer from the role only. Output only JSON.',
      },
      {
        role: 'user',
        content: `Judge: ${who}\nEvent: ${brief.name} (${brief.organizer})\n\nSources:\n${sources || '(no results)'}\n\nReturn JSON:
{"summary":"1-2 sentences on their background","values":["3-4 things they will reward"],"red_flags":["2-3 things that will lose their vote"],"evidence":[{"claim":"short","source":1}],"confidence":"high|medium|low"}
"source" is the number of the source that supports the claim. Use at most 4 evidence items.`,
      },
    ],
  });

  profile.evidence = (profile.evidence || [])
    .map((e) => ({ claim: e.claim, url: results[(Number(e.source) || 0) - 1]?.url }))
    .filter((e) => e.claim && e.url);
  profile.sources = results.map((r) => ({ title: r.title, url: r.url }));
  return profile;
}

async function readProject(input, ledger) {
  const urls = (input.projectUrls || []).filter(Boolean).slice(0, 3);
  let fetched = [];
  if (urls.length) {
    try {
      fetched = await extract(urls, { ledger, label: 'Read project repo/demo' });
    } catch (e) {
      fetched = [];
    }
  }
  const parts = [];
  if (input.projectText) parts.push(`Builder's description:\n${clip(input.projectText, 8000)}`);
  for (const f of fetched) parts.push(`From ${f.url}:\n${clip(f.content, 9000)}`);
  const text = parts.join('\n\n');
  if (text.trim().length < 80) throw new Error('Could not read enough about the project. Paste a description or a public repo URL.');
  return { text: clip(text, 20000), urls: fetched.map((f) => f.url) };
}

const SEARCH_TOOL = [
  {
    type: 'function',
    function: {
      name: 'web_search',
      description:
        'Search the live web. Use it to check whether similar tools already exist (originality) or to verify a factual claim the project makes. Only call it if the answer would change your score.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'A short web search query' } },
        required: ['query'],
      },
    },
  },
];

async function runJudge(j, profile, brief, project, { ledger, emit, roleOnly }) {
  const display = j.display;
  const criteria = brief.criteria.map((c) => `- ${c.name}: ${c.description}`).join('\n');
  const tracks = brief.tracks.map((t) => `- ${t.name}: ${t.description}`).join('\n');

  const messages = [
    {
      role: 'system',
      content: `You simulate how one hackathon judge would score a submission, based only on their public professional profile. You are not the real person and must not claim to be. Be tough, specific and fair. Calibrate: 5 = typical entry, 7 = strong, 8 = finalist, 9-10 = rare. Judge only what is actually demonstrated or described, not what is promised. You may call web_search at most twice.`,
    },
    {
      role: 'user',
      content: `EVENT: ${brief.name} by ${brief.organizer}
What they want: ${brief.summary}
Hard requirements:
${(brief.requirements || []).map((r) => `- ${r}`).join('\n') || '- (none listed)'}
Tracks:
${tracks || '- (none listed)'}
Official criteria:
${criteria}

JUDGE: ${roleOnly ? `${j.title} at ${j.company}` : `${j.name}, ${j.title} at ${j.company}`}
Profile: ${profile.summary}
Rewards: ${(profile.values || []).join('; ')}
Red flags: ${(profile.red_flags || []).join('; ')}

SUBMISSION:
"""
${project.text}
"""

When done, return only JSON:
{"scores":[{"criterion":"<official criterion name>","score":1-10,"reason":"one specific sentence"}],"overall":1-10,"loved":"the single thing this judge likes most","concern":"the single biggest problem for this judge","fix":"one concrete change that would raise this judge's score","take":"one sentence describing this judge's likely reaction, written in third person","requirement_gaps":["any hard requirement that looks unmet"]}`,
    },
  ];

  let toolsOn = true;
  const searches = [];
  for (let round = 0; round < 3; round++) {
    let r;
    const useTools = toolsOn && round < 2;
    try {
      r = await chat({ tier: 'mid', messages, tools: useTools ? SEARCH_TOOL : undefined, maxTokens: 4000, temperature: 0.4, ledger, label: `Judge: ${display}` });
    } catch (e) {
      // Some endpoints reject tool schemas; fall back to a plain call rather than failing the run.
      if (useTools && e.status === 400) {
        toolsOn = false;
        round--;
        continue;
      }
      throw e;
    }

    if (useTools && r.toolCalls.length) {
      messages.push({ role: 'assistant', content: r.raw.content || '', tool_calls: r.toolCalls });
      for (const tc of r.toolCalls.slice(0, 2)) {
        let q = '';
        try {
          q = JSON.parse(tc.function?.arguments || '{}').query || '';
        } catch {}
        let results = [];
        if (q) {
          emit({ type: 'judge_search', id: j.id, query: q });
          searches.push(q);
          try {
            results = await search(q, { max: 4, ledger, label: `${display} verifies` });
          } catch {}
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(results.map((x) => ({ title: x.title, url: x.url, snippet: clip(x.content, 500) }))) });
      }
      continue;
    }

    const result = await parseOrRepair(r.content, { ledger, label: `Judge: ${display}` });
    result.searches = searches;
    result.overall = Number(result.overall) || 0;
    result.scores = (result.scores || []).map((s) => ({ ...s, score: Number(s.score) || 0 }));
    return result;
  }
  throw new Error(`Judge ${display} did not finish`);
}

async function moderate(brief, bench, project, { ledger }) {
  const panel = bench
    .map(
      (b) =>
        `### ${b.display} (${b.title}, ${b.company})\nOverall ${b.result.overall}/10\nScores: ${b.result.scores.map((s) => `${s.criterion} ${s.score} (${s.reason})`).join(' | ')}\nLoved: ${b.result.loved}\nConcern: ${b.result.concern}\nFix: ${b.result.fix}\nRequirement gaps: ${(b.result.requirement_gaps || []).join('; ') || 'none'}`
    )
    .join('\n\n');

  return chatJSON({
    tier: 'heavy',
    ledger,
    label: 'Moderator verdict',
    maxTokens: 6000,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content:
          'You are the moderator of a simulated judging panel. You reconcile the judges, resolve disagreements on the merits, and tell the builder exactly what to change before the deadline. Be blunt and concrete. Output only JSON.',
      },
      {
        role: 'user',
        content: `EVENT: ${brief.name}. Criteria: ${brief.criteria.map((c) => c.name).join(', ')}. Tracks: ${brief.tracks.map((t) => t.name).join(', ') || 'n/a'}. Prizes: ${brief.prizes.join('; ')}

SUBMISSION (excerpt):
"""
${clip(project.text, 6000)}
"""

PANEL:
${panel}

Return JSON:
{"predicted_score":0-100,"finish":"Grand prize contender|Finalist|Strong entry|Middle of the pack|Unlikely to place","best_track":"track name or n/a","verdict":"2-3 blunt sentences","debate":[{"speaker":"<judge display name or Moderator>","line":"one sentence"}],"fixes":[{"fix":"concrete action","why":"which criterion it moves and why","raised_by":["judge display names"],"effort":"low|medium|high","impact":"low|medium|high"}],"strengths":["max 3"]}
The debate is 5-8 lines where judges push back on each other about the biggest disagreement, ending with the Moderator ruling. Use the exact display names above. Order fixes by impact per effort, max 6.`,
      },
    ],
  });
}

export async function runPanel(input, emit) {
  const ledger = new Ledger();
  ledger.onCall = (c) => emit({ type: 'call', call: c });
  ledger.onTavily = (t) => emit({ type: 'tavily', t });
  const roleOnly = !!input.roleOnly;
  const n = Math.max(2, Math.min(6, Number(input.judgeCount) || 4));

  emit({ type: 'models', tiers: Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, { model: v.model, name: v.name, job: v.job }])) });

  // 1. Scout the event
  emit({ type: 'stage', id: 'scout', status: 'running', text: 'Reading the hackathon page' });
  const brief = await readHackathon(input.hackathonUrl, ledger, emit);
  emit({ type: 'brief', brief });
  emit({ type: 'stage', id: 'scout', status: 'done', text: `Found ${brief.criteria.length} criteria and ${brief.judges.length} judges` });

  // 2. Read the project (in parallel with judge research)
  emit({ type: 'stage', id: 'project', status: 'running', text: 'Reading your project' });
  const projectP = readProject(input, ledger).then((p) => {
    emit({ type: 'stage', id: 'project', status: 'done', text: `Read ${p.urls.length} link(s)${input.projectText ? ' + your description' : ''}` });
    return p;
  });

  // 3. Seat the bench
  let picks = pickJudges(brief.judges, n);
  if (!picks.length) {
    picks = [
      { name: 'Technical judge', title: 'Senior Engineer', company: brief.organizer || 'Sponsor' },
      { name: 'Product judge', title: 'Product Lead', company: brief.organizer || 'Sponsor' },
      { name: 'DevRel judge', title: 'Developer Advocate', company: brief.organizer || 'Sponsor' },
    ].slice(0, n);
  }
  const bench = picks.map((j, i) => ({
    ...j,
    id: `j${i}`,
    display: roleOnly ? `${j.title} · ${j.company}` : j.name,
  }));
  emit({ type: 'judges', judges: bench.map(({ id, display, title, company }) => ({ id, display, title, company })) });

  emit({ type: 'stage', id: 'research', status: 'running', text: `Researching ${bench.length} judges on the live web` });
  await mapLimit(bench, 3, async (b) => {
    try {
      b.profile = await profileJudge(b, brief, { ledger, roleOnly });
    } catch (e) {
      b.profile = { summary: `Limited public info; inferred from role (${e.message.slice(0, 80)}).`, values: [], red_flags: [], evidence: [], sources: [], confidence: 'low' };
    }
    emit({ type: 'profile', id: b.id, profile: b.profile });
  });
  emit({ type: 'stage', id: 'research', status: 'done', text: 'Judge profiles built' });

  const project = await projectP;

  // 4. Judges deliberate independently
  emit({ type: 'stage', id: 'judging', status: 'running', text: 'Judges are scoring your project' });
  await mapLimit(bench, 3, async (b) => {
    try {
      b.result = await runJudge(b, b.profile, brief, project, { ledger, emit, roleOnly });
    } catch (e) {
      b.result = { error: e.message, scores: [], overall: 0 };
    }
    emit({ type: 'judge_result', id: b.id, result: b.result });
  });
  const seated = bench.filter((b) => !b.result.error);
  if (!seated.length) throw new Error(`Every judge failed: ${bench[0]?.result?.error || 'unknown error'}`);
  emit({ type: 'stage', id: 'judging', status: 'done', text: `${seated.length} of ${bench.length} judges scored` });

  // 5. Moderator rules
  emit({ type: 'stage', id: 'verdict', status: 'running', text: 'Moderator is reconciling the panel' });
  const verdict = await moderate(brief, seated, project, { ledger });
  verdict.predicted_score = Math.max(0, Math.min(100, Number(verdict.predicted_score) || 0));
  emit({ type: 'verdict', verdict });
  emit({ type: 'stage', id: 'verdict', status: 'done', text: 'Verdict in' });

  emit({ type: 'cost', summary: ledger.summary() });
  emit({ type: 'done' });
}
