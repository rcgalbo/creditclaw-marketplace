/**
 * Thin HTTP client for the CreditClaw API.
 * No SDK, no auth libraries — just fetch.
 */

import { API_BASE } from "./constants.js";

/**
 * Register a bot. Returns the full response body and HTTP status.
 *
 * @param {{ bot_name: string, owner_email: string, platform: string }} payload
 * @returns {Promise<{ status: number, body: unknown }>}
 */
export async function registerBot(payload) {
  const res = await fetch(`${API_BASE}/bots/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

/**
 * GET /bot/status with the given API key.
 *
 * @param {string} apiKey
 * @returns {Promise<{ status: number, body: unknown }>}
 */
export async function getBotStatus(apiKey) {
  const res = await fetch(`${API_BASE}/bot/status`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
