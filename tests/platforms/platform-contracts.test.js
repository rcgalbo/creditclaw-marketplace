/**
 * Platform contract tests.
 *
 * Each platform section defines what it expects from the skill distribution.
 * These tests are format/contract checks that run without platform accounts.
 *
 * Manual verification steps are documented inline for platforms that
 * require actual account access.
 */

import { describe, it, expect } from "vitest";
import { fetchSkillFile, parseSkillFrontmatter } from "../lib/fetch-skill.js";

// ---------------------------------------------------------------------------
// Claude Code + Claude Cowork
// Install: /plugin marketplace add rcgalbo/creditclaw-marketplace
//          /plugin install creditclaw@creditclaw
// ---------------------------------------------------------------------------
describe("Claude Code / Claude Cowork — plugin contract", () => {
  it("marketplace.json source.repo is accessible on GitHub", async () => {
    // The marketplace JSON points to rcgalbo/creditclaw-skill.
    // Verify the repo root is reachable.
    const res = await fetch(
      "https://github.com/rcgalbo/creditclaw-skill",
      { redirect: "follow" }
    );
    expect(res.status).toBe(200);
  });

  it("plugin.json repository field format is correct", async () => {
    // Claude Code resolves plugins via GitHub — repo must be owner/name format
    const fs = await import("fs");
    const marketplace = JSON.parse(
      fs.readFileSync(
        "/home/rcgalbo/wayy-research/creditclaw-marketplace/.claude-plugin/marketplace.json",
        "utf-8"
      )
    );
    const plugin = marketplace.plugins[0];
    expect(plugin.source.repo).toMatch(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/);
  });

  it("SKILL.md allowed-tools contains 'WebFetch' (required for API calls)", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    const fm = parseSkillFrontmatter(text);
    expect(fm["allowed-tools"]).toContain("WebFetch");
  });

  it("SKILL.md allowed-tools contains 'Bash' (required for curl registration)", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    const fm = parseSkillFrontmatter(text);
    expect(fm["allowed-tools"]).toContain("Bash");
  });

  // MANUAL VERIFICATION REQUIRED:
  // 1. In a Claude Code session: /plugin marketplace add rcgalbo/creditclaw-marketplace
  // 2. /plugin install creditclaw@creditclaw
  // 3. Ask: "Register me with CreditClaw as bot 'my-agent', email me@example.com"
  // 4. Verify: agent calls POST /bots/register and returns bot_id + claim_url
  it.todo("manual: plugin installs and agent can register via SKILL.md instructions");
  it.todo("manual: agent uses mcp__playwright__browser_evaluate for browser decrypt");
});

// ---------------------------------------------------------------------------
// OpenClaw + Moltbook
// Install path: ~/.openclaw/skills/creditclaw/
// Files needed: SKILL.md, skill.json at that path
// ---------------------------------------------------------------------------
describe("OpenClaw / Moltbook — skill install contract", () => {
  it("skill.json openclaw block is present and valid", async () => {
    const { json } = await fetchSkillFile("skill.json");
    expect(json.openclaw).toBeTruthy();
    expect(json.openclaw.name).toBe("creditclaw");
    expect(json.openclaw.requires.env).toContain("CREDITCLAW_API_KEY");
  });

  it("SKILL.md frontmatter metadata.openclaw.requires.env is defined", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    // The frontmatter block contains the openclaw env requirement
    expect(text).toContain("CREDITCLAW_API_KEY");
    expect(text).toContain("openclaw:");
  });

  it("skill.json version matches plugin.json version", async () => {
    const [skill, plugin] = await Promise.all([
      fetchSkillFile("skill.json"),
      fetchSkillFile(".claude-plugin/plugin.json"),
    ]);
    expect(skill.json.version).toBe(plugin.json.version);
  });

  // MANUAL VERIFICATION REQUIRED:
  // 1. Install OpenClaw locally
  // 2. mkdir -p ~/.openclaw/skills/creditclaw
  // 3. Copy skill.json and skills/creditclaw/SKILL.md into that directory
  // 4. Set CREDITCLAW_API_KEY env var
  // 5. Start OpenClaw and ask it to check CreditClaw status
  // 6. Verify: agent reads SKILL.md, calls GET /bot/status, returns wallet info
  it.todo("manual: openclaw reads skill from ~/.openclaw/skills/ and uses API");
  it.todo("manual: moltbook same install path as openclaw");
});

// ---------------------------------------------------------------------------
// Zo Computer
// Install path: Skills/ folder in the agent workspace
// ---------------------------------------------------------------------------
describe("Zo Computer — Skills/ folder contract", () => {
  it("SKILL.md has description field suitable for Zo's context injection", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    const fm = parseSkillFrontmatter(text);
    // Description should be non-trivial — Zo uses it as the skill summary
    expect(fm.description.length).toBeGreaterThan(50);
  });

  it("SKILL.md body contains enough API documentation to act without external docs", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    // Must have endpoints, request format, and response format inline
    expect(text).toContain("curl");
    expect(text).toContain("Authorization: Bearer");
    expect(text).toContain("Content-Type: application/json");
  });

  // MANUAL VERIFICATION REQUIRED:
  // 1. Create Skills/creditclaw.md in Zo workspace
  // 2. Copy SKILL.md content
  // 3. Ask Zo to register with CreditClaw
  // 4. Verify: Zo reads the skill, calls register endpoint
  it.todo("manual: zo computer reads skill from Skills/ folder");
});

// ---------------------------------------------------------------------------
// Perplexity Agent API — function calling
// ---------------------------------------------------------------------------
describe("Perplexity — Agent API function calling contract", () => {
  it("functions.json is valid OpenAI function-calling schema", async () => {
    const { json } = await fetchSkillFile("integrations/perplexity/functions.json");
    // OpenAI schema: array of { type: "function", name, description, parameters: { type: "object", properties, required } }
    for (const fn of json) {
      expect(fn.type).toBe("function");
      expect(fn.parameters.type).toBe("object");
      expect(fn.parameters.properties).toBeTruthy();
    }
  });

  it("no function has a 'required' field that references a non-existent property", async () => {
    const { json } = await fetchSkillFile("integrations/perplexity/functions.json");
    for (const fn of json) {
      const props = Object.keys(fn.parameters.properties ?? {});
      const required = fn.parameters.required ?? [];
      for (const req of required) {
        expect(props, `${fn.name}: required field '${req}' not in properties`).toContain(req);
      }
    }
  });

  // MANUAL VERIFICATION REQUIRED:
  // 1. Create a Perplexity Agent with functions.json loaded
  // 2. Ask: "Check my CreditClaw wallet status" (with CREDITCLAW_API_KEY set)
  // 3. Verify: agent calls creditclaw_status function → GET /bot/status
  it.todo("manual: perplexity agent calls creditclaw_status with correct Authorization header");
  it.todo("manual: perplexity agent calls creditclaw_checkout with all required fields");
});

// ---------------------------------------------------------------------------
// Manus
// Integration: SKILL.md injected as system context
// ---------------------------------------------------------------------------
describe("Manus — SKILL.md context injection contract", () => {
  it("SKILL.md is under 8000 tokens (safe for context injection)", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    // Rough estimate: 1 token ~ 4 chars. 8000 tokens ~ 32000 chars
    expect(text.length).toBeLessThan(32000);
  });

  it("SKILL.md contains self-contained instructions (no external links required to act)", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    // All endpoint paths, request bodies, and response shapes must be inline
    expect(text).toContain("POST");
    expect(text).toContain("GET");
    expect(text).toContain("bot_id");
    expect(text).toContain("api_key");
    expect(text).toContain("claim_token");
  });

  it("error handling table covers the cases Manus needs to know about", async () => {
    const { text } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    expect(text).toContain("401");
    expect(text).toContain("403");
    expect(text).toContain("CAPTCHA");
  });

  // MANUAL VERIFICATION REQUIRED:
  // 1. In Manus, add SKILL.md as system context / knowledge
  // 2. Ask: "Register me with CreditClaw"
  // 3. Verify: Manus reads instructions from context, calls register endpoint
  it.todo("manual: manus reads SKILL.md from context and registers successfully");
});
