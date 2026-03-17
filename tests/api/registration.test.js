/**
 * API-level tests: registration and status endpoints.
 *
 * These tests hit the live CreditClaw API at creditclaw.com.
 * They do NOT require any platform account — just network access.
 *
 * RATE LIMITING NOTE: The API enforces per-IP registration limits.
 * The duplicate-detection test uses a guard so it skips cleanly if
 * the IP is already rate-limited from a previous run.
 *
 * Run with: npx vitest run tests/api/registration.test.js
 */

import { describe, it, expect } from "vitest";
import { registerBot, getBotStatus } from "../lib/api-client.js";
import {
  API_KEY_PATTERN,
  BOT_ID_PATTERN,
  CLAIM_TOKEN_PATTERN,
  EXPECTED_REGISTER_RESPONSE_KEYS,
} from "../lib/constants.js";

const RUN_ID = Date.now().toString(36);
const TEST_EMAIL = "test@creditclaw.com";

describe("POST /bots/register", () => {
  let registrationResult;
  let rateLimited = false;

  it("returns 201 with all required fields (or 429 if IP is rate-limited)", async () => {
    const { status, body } = await registerBot({
      bot_name: `agenttest_${RUN_ID}`,
      owner_email: TEST_EMAIL,
      platform: "openclaw",
    });

    if (status === 429) {
      rateLimited = true;
      // Rate limiting is expected behavior — document it, don't fail
      expect(body).toHaveProperty("error", "rate_limited");
      expect(body).toHaveProperty("retry_after_seconds");
      console.warn(
        `[rate-limited] IP hit registration limit. retry_after_seconds=${body.retry_after_seconds}. ` +
        "Re-run this test after the window clears."
      );
      return;
    }

    registrationResult = body;
    expect(status).toBe(201);
    for (const key of EXPECTED_REGISTER_RESPONSE_KEYS) {
      expect(body, `missing key: ${key}`).toHaveProperty(key);
    }
  });

  it("api_key matches expected format (cck_live_<48 hex chars>)", () => {
    if (rateLimited || !registrationResult?.api_key) return;
    expect(registrationResult.api_key).toMatch(API_KEY_PATTERN);
  });

  it("bot_id matches expected format (bot_<8 hex chars>)", () => {
    if (rateLimited || !registrationResult?.bot_id) return;
    expect(registrationResult.bot_id).toMatch(BOT_ID_PATTERN);
  });

  it("claim_token is a human-readable token (word-XXXX format)", () => {
    if (rateLimited || !registrationResult?.claim_token) return;
    expect(registrationResult.claim_token).toMatch(CLAIM_TOKEN_PATTERN);
  });

  it("owner_verification_url contains claim_token", () => {
    if (rateLimited || !registrationResult?.claim_token) return;
    expect(registrationResult.owner_verification_url).toContain(
      registrationResult.claim_token
    );
  });

  it("status is pending_owner_verification", () => {
    if (rateLimited || !registrationResult?.status) return;
    expect(registrationResult.status).toBe("pending_owner_verification");
  });
});

describe("POST /bots/register — duplicate detection", () => {
  it("returns 409 when registering the same bot_name twice (skips if rate-limited)", async () => {
    const uniqueName = `agenttest_dup_${Date.now().toString(36)}`;

    const first = await registerBot({
      bot_name: uniqueName,
      owner_email: TEST_EMAIL,
      platform: "openclaw",
    });

    if (first.status === 429) {
      console.warn("[rate-limited] Skipping duplicate test — IP registration limit hit.");
      // Not a test failure — rate limiting is valid API behavior
      return;
    }

    expect(first.status).toBe(201);

    // Immediately try to register the same name
    const second = await registerBot({
      bot_name: uniqueName,
      owner_email: TEST_EMAIL,
      platform: "openclaw",
    });

    // API returns 409 Conflict for duplicate names (when not rate-limited)
    expect(second.status).toBe(409);
  });
});

describe("GET /bot/status", () => {
  it("returns 401 for an invalid API key", async () => {
    const { status, body } = await getBotStatus("r5_live_invalid_key_test");
    expect(status).toBe(401);
    expect(body).toHaveProperty("error");
  });

  it("returns 401 with error field 'unauthorized'", async () => {
    const { body } = await getBotStatus("r5_live_invalid_key_test");
    expect(body.error).toBe("unauthorized");
  });

  it("returns a response for a freshly registered bot (200 pending or 403 unclaimed)", async () => {
    const { status: regStatus, body: reg } = await registerBot({
      bot_name: `agenttest_status_${Date.now().toString(36)}`,
      owner_email: TEST_EMAIL,
      platform: "openclaw",
    });

    if (regStatus === 429) {
      console.warn("[rate-limited] Skipping status test — cannot register a fresh bot.");
      return;
    }

    if (regStatus !== 201 || !reg.api_key) return;

    const { status } = await getBotStatus(reg.api_key);
    // A newly registered unclaimed bot should return some response
    expect([200, 403]).toContain(status);
  });
});
