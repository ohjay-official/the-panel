import { TIERS } from '../../../lib/llm.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    tiers: Object.fromEntries(Object.entries(TIERS).map(([k, v]) => [k, { model: v.model, name: v.name, job: v.job, in: v.in, out: v.out }])),
    ready: {
      nebius: !!process.env.NEBIUS_API_KEY || process.env.MOCK === '1',
      tavily: !!process.env.TAVILY_API_KEY || process.env.MOCK === '1',
    },
    passcode: !!process.env.RUN_PASSCODE,
    mock: process.env.MOCK === '1',
  });
}
