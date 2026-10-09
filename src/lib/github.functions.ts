import { createServerFn } from "@tanstack/react-start";
import { extractZip, parseGithubUrl, type FileMap } from "./zip";

type Result = { ok: true; name: string; files: FileMap } | { ok: false; error: string };

/**
 * Downloads a public repo archive from codeload.github.com on the server.
 * This avoids the browser CORS issues and the 60 req/hour GitHub API limit
 * that made the old per-file import fail.
 */
export const importGithubRepo = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => {
    if (typeof d?.url !== "string" || d.url.length > 300) throw new Error("Invalid URL");
    return d;
  })
  .handler(async ({ data }): Promise<Result> => {
    const parsed = parseGithubUrl(data.url);
    if (!parsed) return { ok: false, error: "Enter a URL like https://github.com/owner/repository" };
    const { owner, repo, branch } = parsed;
    const refs = branch ? [branch] : ["HEAD", "main", "master"];
    let res: Response | null = null;
    for (const ref of refs) {
      const r = await fetch(`https://codeload.github.com/${owner}/${repo}/zip/${encodeURIComponent(ref)}`, {
        headers: { "User-Agent": "codebase-mentor" },
      });
      if (r.ok) { res = r; break; }
    }
    if (!res) return { ok: false, error: "Repository not found, private, or the branch doesn't exist." };
    const len = Number(res.headers.get("content-length") || 0);
    if (len > 40 * 1024 * 1024) return { ok: false, error: "Repository is too large (over 40 MB)." };
    const buf = new Uint8Array(await res.arrayBuffer());
    if (buf.byteLength > 40 * 1024 * 1024) return { ok: false, error: "Repository is too large (over 40 MB)." };
    try {
      const files = extractZip(buf);
      if (!Object.keys(files).length) return { ok: false, error: "No supported source files were found." };
      return { ok: true, name: `${owner}/${repo}`, files };
    } catch {
      return { ok: false, error: "Could not read the repository archive." };
    }
  });
