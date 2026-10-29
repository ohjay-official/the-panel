// Tavily: the web access layer. The Panel uses four endpoints:
//   /extract -> read the hackathon page and the project's repo/demo
//   /crawl   -> fallback when the page alone doesn't list judges/criteria (agent decides)
//   /search  -> research each judge's public footprint
//   /search  -> judge agents call it as a tool to verify claims / check novelty
import { mockTavily } from './mock.js';

const BASE = 'https://api.tavily.com';

// Credit estimates (Tavily pricing docs): basic search = 1, basic extract = 1 per 5 URLs,
// crawl ~= extraction credits for pages returned (+ mapping when instructions are given).
function estimateCredits(endpoint, body, data) {
  if (endpoint === 'search') return body.search_depth === 'advanced' ? 2 : 1;
  if (endpoint === 'extract') return Math.max(1, Math.ceil((body.urls?.length || 1) / 5));
  if (endpoint === 'crawl') {
    const pages = data?.results?.length || 1;
    return Math.ceil(pages / 5) + (body.instructions ? Math.ceil(pages / 10) * 2 : Math.ceil(pages / 10));
  }
  return 1;
}

async function call(endpoint, body, { ledger, label }) {
  const started = Date.now();
  let data;
  if (process.env.MOCK === '1') {
    data = await mockTavily(endpoint, body);
  } else {
    if (!process.env.TAVILY_API_KEY) throw new Error('TAVILY_API_KEY is not set');
    const res = await fetch(`${BASE}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`Tavily /${endpoint} ${res.status}: ${txt.slice(0, 200)}`);
    }
    data = await res.json();
  }
  ledger?.addTavily({
    endpoint,
    label,
    ms: Date.now() - started,
    credits: estimateCredits(endpoint, body, data),
    detail: body.query || body.url || (body.urls || []).join(', '),
  });
  return data;
}

export async function search(query, { max = 5, ledger, label } = {}) {
  const data = await call('search', { query, search_depth: 'basic', max_results: max }, { ledger, label });
  return (data.results || []).map((r) => ({ title: r.title, url: r.url, content: (r.content || '').slice(0, 900) }));
}

export async function extract(urls, { ledger, label } = {}) {
  const data = await call('extract', { urls, extract_depth: 'basic' }, { ledger, label });
  return (data.results || []).map((r) => ({ url: r.url, content: r.raw_content || '' }));
}

export async function crawl(url, instructions, { ledger, label, limit = 8 } = {}) {
  const data = await call('crawl', { url, max_depth: 1, limit, instructions }, { ledger, label });
  return (data.results || []).map((r) => ({ url: r.url, content: r.raw_content || '' }));
}
