# The Panel

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

The Panel shows how each judge is likely to score your hackathon project before you submit it.

Paste the event link and your project. The Panel reads the rules, looks up the organizer's past winners, researches each judge, and runs every judge as a separate NVIDIA Nemotron agent that scores you on the event's own criteria. A moderator model settles the disagreements, predicts a score, and ranks the changes most likely to raise it.

Built for the **Nebius x NVIDIA Global AI Hackathon**, Best Apps and Agents track.

- **Live site:** https://the-panel-eta.vercel.app
- **Demo video:** _link added at submission_

## Why I built it

I enter a lot of hackathons and bounties. I'm a technical writer and bounty hunter in Nigeria. Before this hackathon I wanted to know who the 23 judges were and what they had rewarded before. Getting that answer took hours of reading talks, posts and old winner lists. The Panel does that reading and turns it into a scorecard, so you can fix the weak spots before the deadline.

## What a run does

1. **Reads the event.** Tavily `/extract` pulls the page. Nemotron Nano extracts rules, tracks, criteria, prizes and judges. If judges or criteria are missing, Tavily `/crawl` searches the rest of the site.
2. **Reads your project.** Tavily `/extract` on your repo and demo links, plus your description.
3. **Looks up past winners.** Tavily `/search` for the organizer's earlier winners. Nano keeps only winners a source actually names and links each to its source.
4. **Researches each judge.** One Tavily `/search` per judge. Nano writes a short, cited profile of what they are likely to reward.
5. **Scores.** Each judge is a separate agent on the mid-size Nemotron model. It scores every official criterion from 1 to 10 and can call a `web_search` tool (Tavily) up to twice to check a claim or test originality. The model decides when to search.
6. **Settles.** The moderator compares the judges, writes out where they disagreed, predicts a score out of 100, compares you with the past winners, and ranks fixes by impact against effort.

Every step streams to the page as it happens.

## How it uses Nemotron on Nebius Token Factory

| Tier | Direct Token Factory model | Job |
|---|---|---|
| Small | `nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B` | Extract the brief, judges and past winners. Write judge profiles. Repair broken JSON. |
| Mid-size | `nvidia/nemotron-3-super-120b-a12b` | One agent per judge, with tool calls. |
| Moderator | `nvidia/Nemotron-3-Ultra-550b-a55b` | Reconcile the panel, predict the score, rank fixes. |

Every call records tokens in and out, time, and cost at the per-token price. The cost table at the end of a run also shows what the same run would cost if every call used the top tier.

### Access note

Token Factory asks for billing details before it issues an API key, and Nigeria, where I live, is not in its billing country list. So the app supports two routes to the same Nebius-hosted models:

- **Direct:** set `NEBIUS_API_KEY`. Calls go to `https://api.tokenfactory.nebius.com/v1` with the models above.
- **Through OpenRouter, Nebius only:** set `OPENROUTER_API_KEY`. Every request is pinned to OpenRouter's Nebius provider with `allow_fallbacks: false`, and the app rejects any response not served by Nebius. On this route Nebius offers `nvidia/nemotron-3-nano-30b-a3b` for the small tier and `nvidia/nemotron-3.5-super-vl` for the judges and moderator. Ultra is not offered there.

With a direct key set, the app uses the direct route automatically.

**Status at submission:** I could not get a key by either route before the deadline. Token Factory has no billing option for Nigeria, and OpenRouter sign-up failed its bot check from my network. So the live demo runs in **sample mode**: the full pipeline, streaming interface and cost receipt run on built-in placeholder data, and every result is labelled as a sample. Add either key in Vercel and the same deployment runs live on Nemotron with no code changes.

## The site

| Page | What it is |
|---|---|
| `/` | What The Panel does, with the real empty rubric for this hackathon |
| `/panel` | The tool |
| `/method` | Every step, which model runs it, how scores are set, and the limits |
| `/privacy` | What happens to what you enter (nothing is stored) |
| `/terms` | Terms of use |

## Run it yourself

1. Get a Tavily key at [app.tavily.com](https://app.tavily.com) and either a Token Factory key at [tokenfactory.nebius.com](https://tokenfactory.nebius.com) or an [OpenRouter](https://openrouter.ai) key.
2. Clone and install:
   ```bash
   git clone https://github.com/ohjay-official/the-panel && cd the-panel
   npm install
   cp .env.example .env.local   # add your keys
   npm run dev                  # http://localhost:3000
   ```
3. With no keys, the app runs in **sample mode**: it uses built-in placeholder data and labels every result as sample data.

**Deploy on Vercel:** import the repo and add `TAVILY_API_KEY` plus either `NEBIUS_API_KEY` or `OPENROUTER_API_KEY`. The API route allows up to 300 seconds per run.

Optional settings in `.env.example`: model IDs (`MODEL_FAST`, `MODEL_MID`, `MODEL_HEAVY`), prices (`PRICE_*`), runs per hour per IP (`RUNS_PER_HOUR`), and a `RUN_PASSCODE`.

## Limits

- Judges are simulations built from public information. They are not the real people, and nothing here is endorsed by them. You can switch to roles instead of names.
- Thin public footprints produce thin profiles, and those are marked.
- The tool has not yet been tested against the published results of a past hackathon, so treat the predicted score as a second opinion.
- It only scores what you show it.

## Project structure

```
app/                 Pages: home, panel, method, privacy, terms
app/api/panel        Streaming endpoint, input checks, rate limit
app/api/config       Which models and keys the server has
components/          Score matrix, the tool UI, navigation
lib/pipeline.js      The run: event, project, winners, judges, scoring, moderator
lib/llm.js           Token Factory or OpenRouter (Nebius only), model tiers, cost ledger
lib/tavily.js        Tavily extract, crawl and search
lib/mock.js          Sample mode data
```

## Feedback on Nebius Token Factory and NVIDIA tools

1. **Billing countries exclude eligible hackathon participants.** The hackathon is open to Nigeria, but Token Factory's billing form has no Nigeria option, and no API key can be created until billing is saved. A participant from an eligible country can register for the hackathon and still be unable to make a single API call. Suggestion: let hackathon or Builder Program credits unlock a key without billing, or add a credits-only account type.
2. **The billing step blocks the whole console.** After sign-up, the billing form appears before the API keys page, so there is no way to try even the small free trial. Showing the key page first, with usage capped at the trial credit, would let people start building while billing is sorted.
3. **Model availability differs by route.** Through OpenRouter, Nebius serves Nemotron 3 Nano and Nemotron 3.5 Super VL but not Nemotron 3 Super or Ultra. Matching the catalog across routes, or listing the differences in the docs, would help builders who depend on those routes.

## License

MIT. See [LICENSE](LICENSE).
