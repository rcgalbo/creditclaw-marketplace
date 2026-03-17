# CreditClaw Cross-Platform Test Suite

Automated tests verifying that the CreditClaw skill works correctly across all supported AI agent platforms.

## What These Tests Cover

### Automated (runs locally, no accounts needed)

| Test File | What It Tests |
|-----------|---------------|
| `tests/api/registration.test.js` | Live API: POST /bots/register, GET /bot/status, error shapes |
| `tests/platforms/skill-files.test.js` | All skill files accessible from GitHub, valid JSON/YAML, correct structure |
| `tests/platforms/platform-contracts.test.js` | Per-platform format requirements, schema correctness, version consistency |

### Manual (requires platform accounts)

Each platform has `it.todo` entries documenting what needs manual verification:

| Platform | What to Verify |
|----------|---------------|
| Claude Code / Claude Cowork | Plugin installs via marketplace; agent calls register endpoint |
| OpenClaw / Moltbook | Skill drops into `~/.openclaw/skills/`; agent reads it and calls API |
| Zo Computer | SKILL.md in `Skills/` folder; agent acts on inline instructions |
| Perplexity | Agent API function calling with `functions.json` |
| Manus | SKILL.md injected as system context; agent registers |

## Running Tests

```bash
# Install dependencies
npm install

# Run everything
npm test

# API tests only (hits live creditclaw.com)
npm run test:api

# Platform/format tests only (hits GitHub raw URLs)
npm run test:platforms

# Watch mode
npm run test:watch
```

## Rate Limiting

`POST /bots/register` enforces per-IP hourly limits. If tests show:

```
[rate-limited] IP hit registration limit. retry_after_seconds=3600
```

The registration and duplicate-detection tests will skip cleanly and log a warning.
Wait 1 hour and re-run. All format/schema tests run fine regardless.

## File Layout

```
tests/
  lib/
    constants.js      # Shared URLs, patterns, platform definitions
    fetch-skill.js    # Fetch + parse skill files; YAML frontmatter parser
    api-client.js     # Thin fetch wrapper for CreditClaw API
  api/
    registration.test.js    # Live API tests
  platforms/
    skill-files.test.js     # File accessibility + format validation
    platform-contracts.test.js  # Per-platform contract tests
  README.md           # This file
```

## What Each Platform Needs

| Platform | Required Files | Install Mechanism |
|----------|---------------|-------------------|
| Claude Code | `plugin.json`, `skill.json`, `SKILL.md` | `/plugin marketplace add CreditClaw/marketplace` |
| Claude Cowork | Same as Claude Code | Same plugin system |
| OpenClaw | `skill.json`, `SKILL.md` | Drop into `~/.openclaw/skills/creditclaw/` |
| Moltbook | `skill.json`, `SKILL.md` | Same path as OpenClaw |
| Zo Computer | `skill.json`, `SKILL.md` | Drop into `Skills/` folder |
| Perplexity | `functions.json` | Load into Agent API function calling |
| Manus | `SKILL.md` | Inject as system context |

## Live API Endpoints Tested

Base URL: `https://creditclaw.com/api/v1`

| Endpoint | Method | Test |
|----------|--------|------|
| `/bots/register` | POST | Returns 201 with `bot_id`, `api_key`, `claim_token`, `owner_verification_url` |
| `/bot/status` | GET | Returns 401 for invalid key with `{"error":"unauthorized"}` |
| `/bots/register` (duplicate) | POST | Returns 409 Conflict (when not rate-limited) |

## Findings from First Run (2026-03-16)

- All 7 platform file requirements are satisfied (GitHub HTTP 200 on all files)
- API key format: `cck_live_<48 hex chars>` (not `r5_live_` as SKILL.md shows — SKILL.md needs update)
- Claim token format: human-readable word-XXXX (e.g. "pearl-J52M"), not a UUID
- Duplicate registration returns 429 rate-limit before 409 conflict when IP limit is hit
- SKILL.md description uses YAML block scalar (`>`) — parsers must handle multi-line frontmatter
