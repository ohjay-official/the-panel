import { runPanel } from '../../../lib/pipeline.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Light per-instance rate limit so a public demo can't drain the credits.
const hits = new Map();
const LIMIT = Number(process.env.RUNS_PER_HOUR || 12);
function allowed(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  if (list.length >= LIMIT) return false;
  list.push(now);
  hits.set(ip, list);
  return true;
}

const isUrl = (s) => {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export async function POST(req) {
  let input;
  try {
    input = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (process.env.RUN_PASSCODE && input.passcode !== process.env.RUN_PASSCODE) {
    return Response.json({ error: 'Wrong passcode' }, { status: 401 });
  }
  if (!isUrl(input.hackathonUrl || '')) return Response.json({ error: 'Enter a valid hackathon URL' }, { status: 400 });
  input.projectUrls = (input.projectUrls || []).map((u) => String(u).trim()).filter(isUrl).slice(0, 3);
  input.projectText = String(input.projectText || '').slice(0, 10000);
  if (!input.projectUrls.length && input.projectText.trim().length < 80) {
    return Response.json({ error: 'Add a public repo/demo URL or a project description (80+ characters)' }, { status: 400 });
  }

  const ip = (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  if (!allowed(ip)) return Response.json({ error: 'Rate limit reached. Try again in an hour.' }, { status: 429 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(e) + '\n'));
        } catch {}
      };
      try {
        await runPanel(input, emit);
      } catch (e) {
        emit({ type: 'error', message: e.message || String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
