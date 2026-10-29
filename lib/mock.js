// Sample mode (no API keys, or MOCK=1). Everything here is placeholder data and the UI labels it as such.
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CRITERIA = ['Technological Implementation', 'Design', 'Potential Impact', 'Quality of the Idea'];

export async function mockChat({ messages, tools, label }) {
  await wait(300);
  const usage = { inTok: 1800, outTok: 450 };
  let content = '{}';
  let toolCalls = [];

  if (label.startsWith('Extract brief') || label.startsWith('Re-extract')) {
    content = JSON.stringify({
      name: 'Sample hackathon',
      organizer: 'Sample organizer',
      deadline: '',
      summary: 'Placeholder brief used in sample mode.',
      requirements: ['Use an open model', 'Public repo with an open source license', 'Demo video under 3 minutes'],
      tracks: [{ name: 'Apps and agents', description: 'Apps people would use' }],
      criteria: CRITERIA.map((name) => ({ name, description: '' })),
      judges: [
        { name: 'Sample judge 1', title: 'Developer advocate', company: 'Sample cloud' },
        { name: 'Sample judge 2', title: 'AI engineer', company: 'Sample GPU maker' },
        { name: 'Sample judge 3', title: 'Product manager', company: 'Sample search API' },
        { name: 'Sample judge 4', title: 'Solutions engineer', company: 'Sample cloud' },
      ],
      prizes: ['Sample grand prize'],
    });
  } else if (label.startsWith('Extract past winners')) {
    content = JSON.stringify({
      winners: [
        { event: 'Sample challenge', project: 'Sample winner A', place: '1st', built: 'Placeholder winner used in sample mode.', why: 'Reported measured cost and accuracy.', source: 1 },
        { event: 'Sample challenge', project: 'Sample winner B', place: '2nd', built: 'Placeholder winner used in sample mode.', why: '', source: 2 },
      ],
      patterns: ['Sample pattern: winners reported measured results.'],
    });
  } else if (label.startsWith('Profile')) {
    content =
      '<think>sample</think>' +
      JSON.stringify({
        summary: 'Sample profile. In a live run this comes from web sources about the judge.',
        values: ['Sample value one', 'Sample value two'],
        red_flags: ['Sample red flag'],
        evidence: [{ claim: 'Sample evidence line', source: 1 }],
        confidence: 'low',
      });
  } else if (label.startsWith('Judge:')) {
    const searched = messages.some((m) => m.role === 'tool');
    if (tools && !searched && label.includes('1')) {
      toolCalls = [{ id: 'call_1', type: 'function', function: { name: 'web_search', arguments: JSON.stringify({ query: 'sample verification search' }) } }];
      content = '';
    } else {
      const n = Number((label.match(/(\d)/) || [0, 1])[1]);
      content =
        '```json\n' +
        JSON.stringify({
          scores: CRITERIA.map((criterion, i) => ({ criterion, score: 4 + ((n + i) % 5), reason: 'Sample reason.' })),
          overall: 5 + (n % 3),
          loved: 'Sample note.',
          concern: 'Sample note.',
          fix: 'Sample note.',
          take: 'Sample reaction.',
          requirement_gaps: [],
        }) +
        '\n```';
    }
  } else if (label.startsWith('Moderator')) {
    content = JSON.stringify({
      predicted_score: 0,
      finish: 'Sample',
      best_track: 'n/a',
      verdict: 'This is sample output. Add a model key to the server to get a real verdict.',
      debate: [
        { speaker: 'Sample judge 1', line: 'Sample line.' },
        { speaker: 'Sample judge 2', line: 'Sample line.' },
        { speaker: 'Moderator', line: 'Sample ruling.' },
      ],
      fixes: [{ fix: 'Sample fix', why: 'Sample reason', raised_by: ['Sample judge 1'], effort: 'low', impact: 'medium' }],
      strengths: [],
      vs_winners: [{ winner: 'Sample winner A', they_did: 'Sample', gap: 'Sample' }],
    });
    usage.inTok = 5200;
    usage.outTok = 1400;
  }
  return { content: content.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, ''), toolCalls, raw: { content, tool_calls: toolCalls }, ...usage };
}

export async function mockTavily(endpoint, body) {
  await wait(200);
  if (endpoint === 'search') {
    return {
      results: [
        { title: 'Sample source 1', url: 'https://example.com/sample-1', content: 'Sample text.' },
        { title: 'Sample source 2', url: 'https://example.com/sample-2', content: 'Sample text.' },
      ],
    };
  }
  if (endpoint === 'extract') {
    return { results: (body.urls || []).map((u) => ({ url: u, raw_content: `Sample page content for ${u}. This is placeholder text long enough to be read as a project description in sample mode.` })) };
  }
  if (endpoint === 'crawl') return { results: [{ url: body.url, raw_content: 'Sample crawled content' }] };
  return {};
}
