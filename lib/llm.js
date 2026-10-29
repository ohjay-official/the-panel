// Nebius Token Factory client (OpenAI-compatible) with per-call cost tracking.
// Three NVIDIA Nemotron tiers, each used for the job it is best at:
//   fast  -> Nemotron 3 Nano   : parsing pages, profiling judges, JSON repair
//   mid   -> Nemotron 3 Super  : each judge agent (multi-step reasoning + tool calls)
//   heavy -> Nemotron 3 Ultra  : the moderator's final verdict (the one hard step)
import { mockChat } from './mock.js';

const BASE = (process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1').replace(/\/+$/, '');

// Prices are USD per 1M tokens (input / output) from the Token Factory catalog.
// Override with env vars if Nebius changes them.
const num = (v, d) => (v !== undefined && v !== '' && !isNaN(Number(v)) ? Number(v) : d);

export const TIERS = {
  fast: {
    model: process.env.MODEL_FAST || 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B',
    name: 'Nemotron 3 Nano',
    job: 'Parsing, profiling, JSON repair',
    in: num(process.env.PRICE_FAST_IN, 0.06),
    out: num(process.env.PRICE_FAST_OUT, 0.24),
  },
  mid: {
    model: process.env.MODEL_MID || 'nvidia/nemotron-3-super-120b-a12b',
    name: 'Nemotron 3 Super',
    job: 'Judge agents (reasoning + web tool calls)',
    in: num(process.env.PRICE_MID_IN, 0.3),
    out: num(process.env.PRICE_MID_OUT, 0.9),
  },
  heavy: {
    model: process.env.MODEL_HEAVY || 'nvidia/Nemotron-3-Ultra-550b-a55b',
    name: 'Nemotron 3 Ultra',
    job: 'Moderator verdict + ranked fixes',
    in: num(process.env.PRICE_HEAVY_IN, 1.0),
    out: num(process.env.PRICE_HEAVY_OUT, 3.0),
  },
};

export class Ledger {
  constructor() {
    this.calls = [];
    this.tavily = [];
    this.onCall = null;
    this.onTavily = null;
  }
  add(call) {
    this.calls.push(call);
    this.onCall?.(call);
  }
  addTavily(t) {
    this.tavily.push(t);
    this.onTavily?.(t);
  }
  summary() {
    const byTier = {};
    let total = 0;
    let ultraOnly = 0;
    let inTok = 0;
    let outTok = 0;
    for (const c of this.calls) {
      const t = (byTier[c.tier] ||= {
        tier: c.tier,
        name: TIERS[c.tier].name,
        model: c.model,
        job: TIERS[c.tier].job,
        calls: 0,
        inTok: 0,
        outTok: 0,
        ms: 0,
        cost: 0,
      });
      t.calls += 1;
      t.inTok += c.inTok;
      t.outTok += c.outTok;
      t.ms += c.ms;
      t.cost += c.cost;
      total += c.cost;
      inTok += c.inTok;
      outTok += c.outTok;
      ultraOnly += (c.inTok * TIERS.heavy.in + c.outTok * TIERS.heavy.out) / 1e6;
    }
    const tavilyCredits = this.tavily.reduce((s, t) => s + (t.credits || 0), 0);
    const byEndpoint = {};
    for (const t of this.tavily) byEndpoint[t.endpoint] = (byEndpoint[t.endpoint] || 0) + 1;
    return {
      tiers: ['fast', 'mid', 'heavy'].map((k) => byTier[k]).filter(Boolean),
      totalUsd: total,
      ultraOnlyUsd: ultraOnly,
      savingsPct: ultraOnly > 0 ? Math.round((1 - total / ultraOnly) * 100) : 0,
      llmCalls: this.calls.length,
      inTok,
      outTok,
      tavilyCalls: this.tavily.length,
      tavilyByEndpoint: byEndpoint,
      tavilyCreditsEst: tavilyCredits,
    };
  }
}

// Nemotron reasoning output can arrive wrapped in <think> tags; never let it reach a parser.
export function stripThink(s = '') {
  let out = String(s);
  out = out.replace(/<think>[\s\S]*?<\/think>/gi, '');
  if (/<\/think>/i.test(out)) out = out.split(/<\/think>/i).pop();
  return out.trim();
}

export function extractJSON(text) {
  const s = stripThink(text).replace(/```(?:json)?/gi, '').trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('No JSON object in model output');
  return JSON.parse(s.slice(start, end + 1));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function chat({ tier = 'fast', messages, maxTokens = 2000, temperature = 0.3, tools, ledger, label = '' }) {
  const t = TIERS[tier];
  const started = Date.now();

  if (process.env.MOCK === '1') {
    const r = await mockChat({ tier, messages, tools, label });
    ledger?.add({ label, tier, model: t.model, inTok: r.inTok, outTok: r.outTok, ms: Date.now() - started, cost: (r.inTok * t.in + r.outTok * t.out) / 1e6 });
    return r;
  }

  if (!process.env.NEBIUS_API_KEY) throw new Error('NEBIUS_API_KEY is not set');

  const body = { model: t.model, messages, max_tokens: maxTokens, temperature };
  if (tools) {
    body.tools = tools;
    body.tool_choice = 'auto';
  }

  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.NEBIUS_API_KEY}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(150000),
    });
    if (res.status === 429 || res.status >= 500) {
      await sleep(1500 * (attempt + 1));
      continue;
    }
    break;
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    const err = new Error(`Token Factory ${res.status} (${t.model}): ${txt.slice(0, 300)}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const msg = data.choices?.[0]?.message || {};
  const usage = data.usage || {};
  const inTok = usage.prompt_tokens || 0;
  const outTok = usage.completion_tokens || 0;
  ledger?.add({ label, tier, model: t.model, inTok, outTok, ms: Date.now() - started, cost: (inTok * t.in + outTok * t.out) / 1e6 });

  return { content: stripThink(msg.content || ''), toolCalls: msg.tool_calls || [], raw: msg, inTok, outTok };
}

// Parse model output as JSON; if it's broken, ask the cheap tier to repair it once.
export async function parseOrRepair(content, { ledger, label, maxTokens = 3000 }) {
  try {
    return extractJSON(content);
  } catch {
    if (!content || !content.trim()) throw new Error(`${label}: model returned no content`);
    const fix = await chat({
      tier: 'fast',
      ledger,
      label: `${label} (JSON repair)`,
      maxTokens,
      temperature: 0,
      messages: [
        { role: 'system', content: 'You repair broken or truncated JSON. Output only one valid JSON object and nothing else.' },
        { role: 'user', content: content.slice(0, 14000) },
      ],
    });
    return extractJSON(fix.content);
  }
}

export async function chatJSON(opts) {
  const r = await chat(opts);
  return parseOrRepair(r.content, opts);
}
