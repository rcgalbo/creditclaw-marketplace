/**
 * Utility: fetch a skill file from GitHub and return its text + parsed form.
 */

import { SKILL_FILES } from "./constants.js";

/**
 * Fetch a single skill file by its logical name.
 *
 * @param {string} fileKey - key from SKILL_FILES (e.g. "skill.json")
 * @returns {Promise<{ url: string, status: number, text: string, json?: unknown }>}
 */
export async function fetchSkillFile(fileKey) {
  const url = SKILL_FILES[fileKey];
  if (!url) throw new Error(`Unknown skill file key: ${fileKey}`);

  const res = await fetch(url, {
    headers: { "User-Agent": "creditclaw-test-suite/1.0" },
  });

  const text = res.ok ? await res.text() : "";
  let json = undefined;

  if (res.ok && fileKey.endsWith(".json")) {
    try {
      json = JSON.parse(text);
    } catch {
      // leave json undefined — test will catch this
    }
  }

  return { url, status: res.status, text, json };
}

/**
 * Parse SKILL.md frontmatter (YAML block between --- delimiters).
 *
 * Handles simple scalar values and YAML block scalars (> and |).
 * For block scalars, the value is the full indented text block joined as one line.
 *
 * @param {string} markdown
 * @returns {Record<string, string> | null}
 */
export function parseSkillFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const lines = match[1].split("\n");
  const frontmatter = {};
  let currentKey = null;
  let blockLines = [];

  for (const line of lines) {
    // Top-level key: not indented
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      // Flush any pending block scalar
      if (currentKey && blockLines.length > 0) {
        frontmatter[currentKey] = blockLines.join(" ").trim();
        blockLines = [];
      }

      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      currentKey = line.slice(0, colonIdx).trim();
      const rawValue = line.slice(colonIdx + 1).trim();

      if (rawValue === ">" || rawValue === "|") {
        // Block scalar — value comes from following indented lines
        blockLines = [];
      } else {
        frontmatter[currentKey] = rawValue;
        currentKey = null; // single-line value, done
      }
    } else {
      // Indented continuation line (block scalar body or nested object)
      if (currentKey && (line.trim() !== "")) {
        blockLines.push(line.trim());
      }
    }
  }

  // Flush final block scalar
  if (currentKey && blockLines.length > 0) {
    frontmatter[currentKey] = blockLines.join(" ").trim();
  }

  return frontmatter;
}

/**
 * Check whether a SKILL.md section heading exists.
 *
 * @param {string} markdown
 * @param {string} heading - e.g. "## Quick Start"
 * @returns {boolean}
 */
export function hasSection(markdown, heading) {
  return markdown.includes(heading);
}
