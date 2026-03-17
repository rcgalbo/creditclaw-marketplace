/**
 * Skill file accessibility and format validation tests.
 *
 * Tests that every file required by each platform is:
 *   1. Publicly accessible from GitHub (HTTP 200)
 *   2. Parseable (valid JSON where applicable)
 *   3. Structurally correct for the platform's requirements
 *
 * No platform accounts needed. Tests run fully offline from the API.
 *
 * Run with: npx vitest run tests/platforms/skill-files.test.js
 */

import { describe, it, expect } from "vitest";
import { fetchSkillFile, parseSkillFrontmatter, hasSection } from "../lib/fetch-skill.js";
import { PLATFORM_REQUIREMENTS } from "../lib/constants.js";

// ---------------------------------------------------------------------------
// skill.json — shared across openclaw, moltbook, zo-computer, claude platforms
// ---------------------------------------------------------------------------
describe("skill.json — structure and content", () => {
  let skillJson;

  it("is accessible (HTTP 200)", async () => {
    const { status } = await fetchSkillFile("skill.json");
    expect(status).toBe(200);
  });

  it("is valid JSON", async () => {
    const { json } = await fetchSkillFile("skill.json");
    skillJson = json;
    expect(json).toBeTruthy();
    expect(typeof json).toBe("object");
  });

  it("has required top-level fields", async () => {
    const { json } = await fetchSkillFile("skill.json");
    for (const field of ["name", "version", "description", "api_base", "credentials", "platforms"]) {
      expect(json, `missing field: ${field}`).toHaveProperty(field);
    }
  });

  it("name is 'creditclaw'", async () => {
    const { json } = await fetchSkillFile("skill.json");
    expect(json.name).toBe("creditclaw");
  });

  it("api_base points to live API", async () => {
    const { json } = await fetchSkillFile("skill.json");
    expect(json.api_base).toBe("https://creditclaw.com/api/v1");
  });

  it("platforms array includes all expected targets", async () => {
    const { json } = await fetchSkillFile("skill.json");
    const expected = ["claude-code", "claude-cowork", "openclaw", "moltbook", "zo-computer", "manus"];
    for (const p of expected) {
      expect(json.platforms, `missing platform: ${p}`).toContain(p);
    }
  });

  it("credentials.api_key has env_var and required=true", async () => {
    const { json } = await fetchSkillFile("skill.json");
    const cred = json?.credentials?.api_key;
    expect(cred).toBeTruthy();
    expect(cred.env_var).toBe("CREDITCLAW_API_KEY");
    expect(cred.required).toBe(true);
  });

  it("openclaw block specifies CREDITCLAW_API_KEY env requirement", async () => {
    const { json } = await fetchSkillFile("skill.json");
    const envReqs = json?.openclaw?.requires?.env;
    expect(Array.isArray(envReqs)).toBe(true);
    expect(envReqs).toContain("CREDITCLAW_API_KEY");
  });
});

// ---------------------------------------------------------------------------
// .claude-plugin/plugin.json — Claude Code + Claude Cowork
// ---------------------------------------------------------------------------
describe(".claude-plugin/plugin.json — Claude Code / Claude Cowork format", () => {
  it("is accessible (HTTP 200)", async () => {
    const { status } = await fetchSkillFile(".claude-plugin/plugin.json");
    expect(status).toBe(200);
  });

  it("is valid JSON", async () => {
    const { json } = await fetchSkillFile(".claude-plugin/plugin.json");
    expect(json).toBeTruthy();
  });

  it("has required plugin fields: name, description, version, author, homepage", async () => {
    const { json } = await fetchSkillFile(".claude-plugin/plugin.json");
    for (const field of ["name", "description", "version", "author", "homepage"]) {
      expect(json, `missing field: ${field}`).toHaveProperty(field);
    }
  });

  it("name matches 'creditclaw'", async () => {
    const { json } = await fetchSkillFile(".claude-plugin/plugin.json");
    expect(json.name).toBe("creditclaw");
  });

  it("version string is semver-like", async () => {
    const { json } = await fetchSkillFile(".claude-plugin/plugin.json");
    expect(json.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("homepage points to creditclaw.com", async () => {
    const { json } = await fetchSkillFile(".claude-plugin/plugin.json");
    expect(json.homepage).toMatch(/creditclaw\.com/);
  });
});

// ---------------------------------------------------------------------------
// marketplace.json — Claude Code plugin marketplace registry
// ---------------------------------------------------------------------------
describe(".claude-plugin/marketplace.json — marketplace registry format", () => {
  // This file lives in the marketplace repo, not the skill repo — test locally
  it("local marketplace.json is valid JSON", async () => {
    const fs = await import("fs");
    const raw = fs.readFileSync(
      "/home/rcgalbo/wayy-research/creditclaw-marketplace/.claude-plugin/marketplace.json",
      "utf-8"
    );
    const json = JSON.parse(raw);
    expect(json).toBeTruthy();
  });

  it("marketplace.json has name, owner, and plugins array", async () => {
    const fs = await import("fs");
    const json = JSON.parse(
      fs.readFileSync(
        "/home/rcgalbo/wayy-research/creditclaw-marketplace/.claude-plugin/marketplace.json",
        "utf-8"
      )
    );
    expect(json).toHaveProperty("name");
    expect(json).toHaveProperty("owner");
    expect(Array.isArray(json.plugins)).toBe(true);
    expect(json.plugins.length).toBeGreaterThan(0);
  });

  it("creditclaw plugin entry points to correct GitHub repo", async () => {
    const fs = await import("fs");
    const json = JSON.parse(
      fs.readFileSync(
        "/home/rcgalbo/wayy-research/creditclaw-marketplace/.claude-plugin/marketplace.json",
        "utf-8"
      )
    );
    const plugin = json.plugins.find((p) => p.name === "creditclaw");
    expect(plugin).toBeTruthy();
    expect(plugin.source.repo).toMatch(/CreditClaw\/skill/);
  });
});

// ---------------------------------------------------------------------------
// SKILL.md — used by openclaw, moltbook, zo-computer, manus, and all Claude platforms
// ---------------------------------------------------------------------------
describe("SKILL.md — content and format", () => {
  let text;

  it("is accessible (HTTP 200)", async () => {
    const { status } = await fetchSkillFile("skills/creditclaw/SKILL.md");
    expect(status).toBe(200);
  });

  it("has valid YAML frontmatter", async () => {
    const result = await fetchSkillFile("skills/creditclaw/SKILL.md");
    text = result.text;
    const fm = parseSkillFrontmatter(text);
    expect(fm).toBeTruthy();
  });

  it("frontmatter has name field equal to 'creditclaw'", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    const fm = parseSkillFrontmatter(text);
    expect(fm.name).toBe("creditclaw");
  });

  it("frontmatter has allowed-tools field (required by Claude plugin format)", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    const fm = parseSkillFrontmatter(text);
    expect(fm["allowed-tools"]).toBeTruthy();
  });

  it("API base URL appears in document body", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    expect(text).toContain("https://creditclaw.com/api/v1");
  });

  it("contains registration endpoint documentation", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    expect(text).toContain("/bots/register");
  });

  it("contains /bot/status endpoint documentation", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    expect(text).toContain("/bot/status");
  });

  it("contains Quick Start section", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    expect(hasSection(text, "## Quick Start")).toBe(true);
  });

  it("contains browser decrypt pattern (AES-256-GCM)", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    expect(text).toContain("AES-GCM");
  });

  it("documents the 'never log/display decrypted card data' constraint", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    expect(text.toLowerCase()).toMatch(/never.*(log|store|display)/);
  });

  it("platform-specific notes section covers all 4 platform groups", async () => {
    if (!text) ({ text } = await fetchSkillFile("skills/creditclaw/SKILL.md"));
    expect(text).toContain("Claude Code");
    expect(text).toContain("OpenClaw");
    expect(text).toContain("Zo Computer");
    expect(text).toContain("Manus");
  });
});

// ---------------------------------------------------------------------------
// Perplexity functions.json — Agent API function calling schema
// ---------------------------------------------------------------------------
describe("integrations/perplexity/functions.json — OpenAI function calling format", () => {
  let functions;

  it("is accessible (HTTP 200)", async () => {
    const { status } = await fetchSkillFile("integrations/perplexity/functions.json");
    expect(status).toBe(200);
  });

  it("is valid JSON and is an array", async () => {
    const { json } = await fetchSkillFile("integrations/perplexity/functions.json");
    functions = json;
    expect(Array.isArray(json)).toBe(true);
  });

  it("has at least 3 function definitions", async () => {
    if (!functions) ({ json: functions } = await fetchSkillFile("integrations/perplexity/functions.json"));
    expect(functions.length).toBeGreaterThanOrEqual(3);
  });

  it("every function has type='function', name, description, and parameters", async () => {
    if (!functions) ({ json: functions } = await fetchSkillFile("integrations/perplexity/functions.json"));
    for (const fn of functions) {
      expect(fn.type).toBe("function");
      expect(fn.name).toBeTruthy();
      expect(fn.description).toBeTruthy();
      expect(fn.parameters).toBeTruthy();
    }
  });

  it("creditclaw_checkout function exists and has required fields", async () => {
    if (!functions) ({ json: functions } = await fetchSkillFile("integrations/perplexity/functions.json"));
    const checkout = functions.find((f) => f.name === "creditclaw_checkout");
    expect(checkout).toBeTruthy();
    const required = checkout.parameters?.required ?? [];
    for (const field of ["merchant_name", "item_name", "amount_cents"]) {
      expect(required, `${field} should be required`).toContain(field);
    }
  });

  it("creditclaw_status function exists", async () => {
    if (!functions) ({ json: functions } = await fetchSkillFile("integrations/perplexity/functions.json"));
    const status = functions.find((f) => f.name === "creditclaw_status");
    expect(status).toBeTruthy();
  });

  it("amount_cents is typed as integer (not string)", async () => {
    if (!functions) ({ json: functions } = await fetchSkillFile("integrations/perplexity/functions.json"));
    const checkout = functions.find((f) => f.name === "creditclaw_checkout");
    const amountProp = checkout?.parameters?.properties?.amount_cents;
    expect(amountProp?.type).toBe("integer");
  });
});

// ---------------------------------------------------------------------------
// Per-platform coverage summary (informational)
// ---------------------------------------------------------------------------
describe("platform coverage — all required files accessible", () => {
  for (const [platform, config] of Object.entries(PLATFORM_REQUIREMENTS)) {
    it(`${platform}: all ${config.requiredFiles.length} required files return HTTP 200`, async () => {
      const results = await Promise.all(
        config.requiredFiles.map((f) => fetchSkillFile(f))
      );
      for (const { url, status } of results) {
        expect(status, `${url} returned ${status}`).toBe(200);
      }
    });
  }
});
