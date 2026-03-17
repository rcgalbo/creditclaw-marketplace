import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    reporters: ["verbose"],
    // Run sequentially to avoid flooding the CreditClaw registration endpoint
    sequence: { concurrent: false },
  },
});
