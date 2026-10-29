// Offline mock (MOCK=1) so the full pipeline and UI can be tested without spending credits.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function mockChat({ messages, tools, label }) {
  await wait(250);
  const usage = { inTok: 1800, outTok: 450 };
  let content = '{}';
  let toolCalls = [];

  if (label.startsWith('Extract brief') || label.startsWith('Re-extract')) {
    content = JSON.stringify({
      name: 'Mock Global AI Hackathon',
      organizer: 'Mock Cloud',
      deadline: '30 Oct 2026',
      summary: 'Build a working AI app on open models.',
      requirements: ['Use an open model', 'Public repo with OSS license', '3-min demo video'],
      tracks: [{ name: 'Best Apps and Agents', description: 'Apps people actually use' }],
      criteria: [
        { name: 'Technological Implementation', description: 'How well it is built' },
        { name: 'Design', description: 'Complete product' },
        { name: 'Potential Impact', description: 'Real problem, real audience' },
        { name: 'Quality of the Idea', description: 'Creative, non-obvious' },
      ],
      judges: [
        { name: 'Ada Lovelace', title: 'DevRel Lead', company: 'Mock Cloud' },
        { name: 'Alan Turing', title: 'Staff AI Engineer', company: 'Mock GPU' },
        { name: 'Grace Hopper', title: 'Forward Deployed Engineer', company: 'Mock Search' },
        { name: 'Linus T', title: 'Product Manager', company: 'Mock Cloud' },
      ],
      prizes: ['$20,000 grand prize', '$3,000 best use of search'],
    });
  } else if (label.startsWith('Profile')) {
    content = '<think>reasoning...</think>' + JSON.stringify({
      summary: 'Developer advocate who writes cookbooks with measured costs.',
      values: ['Reproducibility', 'Measured cost per run', 'Real users'],
      red_flags: ['Generic chatbots', 'Unverifiable claims'],
      evidence: [{ claim: 'Publishes cookbooks with cost per run', source: 1 }],
      confidence: 'medium',
    });
  } else if (label.startsWith('Judge:')) {
    const alreadySearched = messages.some((m) => m.role === 'tool');
    if (tools && !alreadySearched && label.includes('Ada')) {
      toolCalls = [{ id: 'call_1', type: 'function', function: { name: 'web_search', arguments: JSON.stringify({ query: 'AI hackathon judge simulator tool' }) } }];
      content = '';
    } else {
      content = '```json\n' + JSON.stringify({
        scores: [
          { criterion: 'Technological Implementation', score: 7, reason: 'Clean model routing with visible costs.' },
          { criterion: 'Design', score: 6, reason: 'Works end to end but rough edges.' },
          { criterion: 'Potential Impact', score: 7, reason: 'Clear audience of hackathon builders.' },
          { criterion: 'Quality of the Idea', score: 8, reason: 'Meta and memorable.' },
        ],
        overall: 7,
        loved: 'The live cost receipt.',
        concern: 'Judge simulation accuracy is unproven.',
        fix: 'Backtest against a past hackathon with known winners.',
        take: 'Impressed by the concept, wants proof it predicts real outcomes.',
        requirement_gaps: [],
      }) + '\n```';
    }
  } else if (label.startsWith('Moderator')) {
    content = JSON.stringify({
      predicted_score: 74,
      finish: 'Finalist',
      best_track: 'Best Apps and Agents',
      verdict: 'Strong, memorable concept with real stack depth. It loses points until it proves its predictions match reality.',
      debate: [
        { speaker: 'Ada Lovelace', line: 'The cost receipt is exactly what our cookbooks show. I am in.' },
        { speaker: 'Alan Turing', line: 'Clever, but where is the evidence the scores are calibrated?' },
        { speaker: 'Grace Hopper', line: 'Using crawl and extract, not just search, is the right call.' },
        { speaker: 'Moderator', line: 'Ruling: add a backtest on a past hackathon and it moves to contender.' },
      ],
      fixes: [
        { fix: 'Backtest on a past hackathon with public winners', why: 'Moves Impact and Idea', raised_by: ['Alan Turing'], effort: 'medium', impact: 'high' },
        { fix: 'Add a 30-second onboarding example', why: 'Moves Design', raised_by: ['Ada Lovelace'], effort: 'low', impact: 'medium' },
      ],
      strengths: ['Visible model routing', 'Deep Tavily usage'],
    });
    usage.inTok = 5200;
    usage.outTok = 1400;
  }
  return { content: content.replace(/<think>[\s\S]*?<\/think>/g, ''), toolCalls, raw: { content, tool_calls: toolCalls }, ...usage };
}

export async function mockTavily(endpoint, body) {
  await wait(150);
  if (endpoint === 'search') {
    return {
      results: [
        { title: `Result for ${body.query}`, url: 'https://example.com/a', content: 'Example snippet about the judge and their talks.' },
        { title: 'Second result', url: 'https://example.com/b', content: 'More context.' },
      ],
    };
  }
  if (endpoint === 'extract') {
    return { results: (body.urls || []).map((u) => ({ url: u, raw_content: `Mock page content for ${u}. Judges: Ada Lovelace (DevRel Lead, Mock Cloud). Criteria: Technological Implementation, Design.` })) };
  }
  if (endpoint === 'crawl') {
    return { results: [{ url: body.url, raw_content: 'Crawled content' }] };
  }
  return {};
}
