/**
 * Shared constants for the CreditClaw cross-platform test suite.
 * All URLs and expected shapes are derived from live API probing.
 */

export const SKILL_REPO_BASE = "https://raw.githubusercontent.com/CreditClaw/skill/main";
export const API_BASE = "https://creditclaw.com/api/v1";

/**
 * File URLs that each platform needs to be able to fetch.
 * Keyed by the path they appear at in the repo.
 */
export const SKILL_FILES = {
  "skill.json":                    `${SKILL_REPO_BASE}/skill.json`,
  "skills/creditclaw/SKILL.md":    `${SKILL_REPO_BASE}/skills/creditclaw/SKILL.md`,
  ".claude-plugin/plugin.json":    `${SKILL_REPO_BASE}/.claude-plugin/plugin.json`,
  "integrations/perplexity/functions.json": `${SKILL_REPO_BASE}/integrations/perplexity/functions.json`,
};

/**
 * Per-platform: which files must be accessible + what format matters.
 */
export const PLATFORM_REQUIREMENTS = {
  "claude-code": {
    requiredFiles: ["skill.json", ".claude-plugin/plugin.json", "skills/creditclaw/SKILL.md"],
    installMechanism: "plugin marketplace (CreditClaw/marketplace)",
    testable: "format-validation", // can't automate plugin install
  },
  "claude-cowork": {
    requiredFiles: ["skill.json", ".claude-plugin/plugin.json", "skills/creditclaw/SKILL.md"],
    installMechanism: "same plugin system as Claude Code",
    testable: "format-validation",
  },
  "openclaw": {
    requiredFiles: ["skill.json", "skills/creditclaw/SKILL.md"],
    installPath: "~/.openclaw/skills/",
    testable: "format-validation",
  },
  "moltbook": {
    requiredFiles: ["skill.json", "skills/creditclaw/SKILL.md"],
    installPath: "~/.openclaw/skills/", // same as openclaw
    testable: "format-validation",
  },
  "zo-computer": {
    requiredFiles: ["skill.json", "skills/creditclaw/SKILL.md"],
    installPath: "Skills/",
    testable: "format-validation",
  },
  "perplexity": {
    requiredFiles: ["integrations/perplexity/functions.json"],
    installMechanism: "Agent API function calling",
    testable: "schema-validation",
  },
  "manus": {
    requiredFiles: ["skills/creditclaw/SKILL.md"],
    installMechanism: "SKILL.md injected as context",
    testable: "format-validation",
  },
};

/**
 * Expected structure of a valid registration response.
 * Derived from live API probe 2026-03-16.
 */
export const EXPECTED_REGISTER_RESPONSE_KEYS = [
  "bot_id",
  "api_key",
  "claim_token",
  "status",
  "owner_verification_url",
  "important",
];

export const API_KEY_PATTERN = /^cck_live_[a-f0-9]{48}$/;
export const BOT_ID_PATTERN = /^bot_[a-f0-9]{8}$/;
// claim_token is human-readable: e.g. "pearl-J52M"
export const CLAIM_TOKEN_PATTERN = /^[a-z]+-[A-Z0-9]{4}$/;
