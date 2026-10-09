import type { FileMap } from "./zip";

export type PreviewProject = { supported: true; template: "react-ts" | "vanilla"; files: FileMap; dependencies: Record<string, string>; activeFile: string } | { supported: false; reason: string };

export function preparePreview(source: FileMap): PreviewProject {
  let dependencies: Record<string, string> = {};
  try { dependencies = JSON.parse(source["package.json"] ?? "{}").dependencies ?? {}; } catch { /* Detect from source when manifest is invalid. */ }
  if (dependencies.next || dependencies["@tanstack/react-start"] || dependencies.nuxt) {
    return { supported: false, reason: "This project needs a server to run. Its source is available in File explorer, but it cannot run in this browser preview." };
  }
  const files = Object.fromEntries(Object.entries(source).filter(([path]) => !/(^|\/)(package\.json|.*config\.[^/]+|.*\.md|.*\.test\.[^/]+)$/.test(path)).map(([path, code]) => [`/${path}`, code]));
  const app = Object.keys(source).find((path) => /(^|\/)App\.(tsx|jsx|js)$/.test(path));
  const entry = Object.keys(source).find((path) => /^(src\/)?(main|index)\.(tsx|jsx|js)$/.test(path));
  const react = Boolean(dependencies.react || app);
  if (react && (entry || app)) {
    const css = Object.keys(source).filter((path) => /\.css$/.test(path) && !/\.module\.css$/.test(path));
    files["/index.html"] = source["index.html"]?.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi, "") ?? '<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div></body></html>';
    files["/index.tsx"] = entry ? `import './${entry}';` : `import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport App from './${app}';\n${css.map((path) => `import './${path}';`).join("\n")}\ncreateRoot(document.getElementById('root')).render(<App />);`;
    return { supported: true, template: "react-ts", files, dependencies: { react: "^18.2.0", "react-dom": "^18.2.0", ...dependencies }, activeFile: `/${app ?? entry}` };
  }
  const html = Object.keys(source).find((path) => /(^|\/)index\.html?$/.test(path)) ?? Object.keys(source).find((path) => /\.html?$/.test(path));
  if (html) {
    files["/index.html"] = source[html];
    if (!files["/index.js"]) files["/index.js"] = "";
    return { supported: true, template: "vanilla", files, dependencies, activeFile: "/index.html" };
  }
  return { supported: false, reason: "No browser entry found. Live preview supports React apps and HTML/CSS/JavaScript websites. Python, command-line tools and server-only projects need their own runtime." };
}