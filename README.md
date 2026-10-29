# The Panel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Know your hackathon score before the judges do.**

You paste a hackathon (or bounty) link and your project. The Panel then does five things:

1. **Reads** the event with Tavily: rules, tracks, criteria, prizes and the judge list.
2. **Researches** every judge on the live web and builds a cited profile of what they reward.
3. **Simulates** each judge as an NVIDIA Nemotron agent that scores you against the official criteria. Each judge can search the web to check your claims or test your originality.
4. **Moderates**: a Nemotron Ultra moderator settles the disagreements between judges and predicts your score.
5. **Hands you** a ranked fix list, plus a receipt showing what every model call cost.

Built for the **Nebius x NVIDIA Global AI Hackathon** (Best Apps and Agents track).

**Live demo:** _add Vercel URL_ · **Demo video:** _add YouTube URL_

---

## Why this exists

Thousands of builders enter hackathons and bounty programs every month. Most lose for reasons they could have fixed in an hour:

- a requirement they missed
- a judge's priority they never knew about
- a demo that never states the one number the sponsor cares about

Before entering this hackathon, I spent hours by hand researching 23 judges and past winners. I'm a Web3 technical writer and bounty hunter, ranked #1 in content for Superteam Nigeria. The Panel does that research in about two minutes, for a few cents.

## How it uses Nemotron on Nebius Token Factory

Every model call goes to **Nebius Token Factory** through its OpenAI-compatible API (`https://api.tokenfactory.nebius.com/v1`). Each Nemotron tier gets the job it is best at:

| Tier | Model ID | Job in The Panel | Why this model |
|---|---|---|---|
| Fast | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` | Extract the brief, criteria and judges from messy pages. Build judge profiles from search results. Repair broken JSON. | High-volume structured extraction. This is the cheapest tier and is fast enough to keep the UI live. |
| Mid | `nvidia/nemotron-3-super-120b-a12b` | One agent per judge. Scores against the official criteria and calls the `web_search` tool to check claims or originality. | Built for multi-agent, tool-calling work. The judges run 3 at a time. |
| Heavy | `nvidia/Nemotron-3-Ultra-550b-a55b` | The moderator. Reconciles the judges, writes the debate, predicts the score and ranks the fixes. | The one step that needs serious reasoning over all the other outputs, so it is the only Ultra call per run. |

**Access note.** Token Factory requires billing details before issuing an API key, and Nigeria (where I live) isn't in its billing country list, so I couldn't get a direct key. The app therefore supports two routes to the same Nebius-hosted models:

- **Direct:** set `NEBIUS_API_KEY` and calls go to `api.tokenfactory.nebius.com`. The model IDs are in the table above.
- **Via OpenRouter, Nebius-only:** set `OPENROUTER_API_KEY`. Every request is pinned to OpenRouter's **Nebius** provider with `allow_fallbacks: false`, and the app rejects any response not served by Nebius. On this route, the models Nebius serves there are `nvidia/nemotron-3-nano-30b-a3b` (fast tier) and `nvidia/nemotron-3.5-super-vl` (judges and moderator). Ultra isn't offered by Nebius on OpenRouter.

The live demo uses the OpenRouter route. With a direct key, the app switches to the direct route automatically.

Every call is metered: tokens in and out, latency, and cost from the Token Factory per-token price. The **Receipt** panel then compares what you actually paid against what the same run would cost if every call used Ultra.

**Measured on a real run:** _fill in after first live run: total $, Ultra-only $, % saved, seconds end to end_

## How it uses Tavily

| Endpoint | Where |
|---|---|
| `/extract` | Reads the hackathon page, plus your repo and demo links. |
| `/crawl` | Used only if the page doesn't list judges or criteria. The agent then crawls the site with instructions to find them. |
| `/search` | Runs once per judge to research their public footprint. Every claim in a profile links to its source. |
| `/search` as a **tool** | Each judge agent decides on its own whether to search. Examples: "does a tool like this already exist?" or "is this claim true?" The search is never hard-coded. |

## Architecture

```
Browser ──POST /api/panel──▶ Next.js route (Vercel, streaming NDJSON)
                                 │
   1. Tavily /extract (event) ──▶ Nemotron Nano: brief, criteria, judges
        └─ thin page? ──▶ Tavily /crawl ──▶ Nano re-extract
   2. Tavily /extract (project)          ┐ run in parallel
   3. Tavily /search × judges ──▶ Nano   ┘ cited profiles
   4. Nemotron Super judge agents (×N, tool: web_search ──▶ Tavily)
   5. Nemotron Ultra moderator ──▶ score, debate, ranked fixes
                                 │
                     every step streams to the UI live, with cost metering
```

## Run it yourself (5 minutes)

1. Get a Nebius Token Factory API key at [tokenfactory.nebius.com](https://tokenfactory.nebius.com) and a Tavily API key at [app.tavily.com](https://app.tavily.com).
2. If you can't get billing on Token Factory, use an [OpenRouter](https://openrouter.ai) key instead (`OPENROUTER_API_KEY`). It is pinned to Nebius.
3. Clone the repo and install:
   ```bash
   git clone https://github.com/ohjay-official/the-panel && cd the-panel
   npm install
   cp .env.example .env.local   # paste your two keys
   npm run dev                  # http://localhost:3000
   ```
4. To try it with no API calls at all, run `npm run mock`, or just leave the keys out (it falls back to demo mode).

**Deploying to Vercel:** import the repo, then add `TAVILY_API_KEY` and either `NEBIUS_API_KEY` or `OPENROUTER_API_KEY` as environment variables. No other configuration is needed. The API route allows up to 300 seconds per run.

**Config:** you can override model IDs (`MODEL_FAST`, `MODEL_MID`, `MODEL_HEAVY`), prices (`PRICE_*`), the rate limit (`RUNS_PER_HOUR`) and an optional `RUN_PASSCODE`. See `.env.example`.

## Ethics and limits

- Judges are **simulations** built only from public professional information, and every evidence line links to its source. They are not the real people, and nothing here is endorsed by them.
- **Role-only mode** drops all names and simulates "a DevRel lead at X" instead.
- Predictions are a sharp second opinion, not a guarantee. Thin public footprints are flagged as low confidence.
- The judges score only what your submission shows. That is the point.

## Project structure

```
app/page.jsx            UI (streams the session live)
app/api/panel/route.js  Streaming endpoint, validation, rate limit
lib/pipeline.js         The five-stage agent pipeline
lib/llm.js              Token Factory client, Nemotron tiers, cost ledger
lib/tavily.js           Tavily extract / crawl / search
lib/mock.js             Offline mock for MOCK=1
```

## Feedback on Nebius Token Factory and NVIDIA Nemotron

_To fill in from the build: specific friction, with model ID, request and expected vs actual result._

## License

MIT. See [LICENSE](LICENSE).
