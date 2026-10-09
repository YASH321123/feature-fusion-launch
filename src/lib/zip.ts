import { unzipSync } from "fflate";

export type FileMap = Record<string, string>;

const ALLOWED = /\.(tsx?|jsx?|mjs|cjs|py|html?|css|scss|json|md|java|kt|c|cc|cpp|h|hpp|go|rs|rb|php|swift|sql|sh|yml|yaml|toml|vue|svelte)$/i;
const EXCLUDED =
  /(^|\/)(node_modules|vendor|dist|build|\.git|coverage|\.next|target|__pycache__|\.venv)(\/|$)|(^|\/)(\.env[^/]*|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|bun\.lockb?)$/i;

export const MAX_FILES = 80;
export const MAX_FILE_BYTES = 100_000;

/** Extract supported text files from a ZIP. Strips a single shared top folder (GitHub archives). */
export function extractZip(data: Uint8Array): FileMap {
  const decoder = new TextDecoder();
  const entries = unzipSync(data, {
    filter: (f) =>
      !f.name.endsWith("/") && ALLOWED.test(f.name) && !EXCLUDED.test(f.name) && f.originalSize < MAX_FILE_BYTES,
  });
  const names = Object.keys(entries);
  const tops = new Set(names.map((n) => n.split("/")[0]));
  const strip = tops.size === 1 && names.every((n) => n.includes("/"));
  const out: FileMap = {};
  names
    .sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b))
    .slice(0, MAX_FILES)
    .forEach((n) => {
      const path = strip ? n.split("/").slice(1).join("/") : n;
      if (path) out[path] = decoder.decode(entries[n]);
    });
  return out;
}

export function parseGithubUrl(input: string): { owner: string; repo: string; branch?: string } | null {
  const m = input.trim().match(/github\.com[/:]([^/\s]+)\/([^/#?\s]+)(?:\/tree\/([^#?\s]+))?/i);
  if (!m) {
    const short = input.trim().match(/^([\w.-]+)\/([\w.-]+)$/);
    return short ? { owner: short[1], repo: short[2].replace(/\.git$/, "") } : null;
  }
  return { owner: m[1], repo: m[2].replace(/\.git$/, ""), branch: m[3] };
}
