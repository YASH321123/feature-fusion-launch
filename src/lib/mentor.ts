import type { FileMap } from "./zip";

export const demoFiles: FileMap = {
  "src/App.tsx": `import { useState } from 'react';\nimport LoginForm from './LoginForm';\nimport Dashboard from './Dashboard';\n\nexport default function App() {\n  const [user, setUser] = useState<string | null>(null);\n\n  return user ? (\n    <Dashboard user={user} />\n  ) : (\n    <LoginForm onLogin={setUser} />\n  );\n}`,
  "src/LoginForm.tsx": `type LoginFormProps = {\n  onLogin: (username: string) => void;\n};\n\nexport default function LoginForm({ onLogin }: LoginFormProps) {\n  function handleSubmit(event: React.FormEvent) {\n    event.preventDefault();\n    onLogin('student@example.com');\n  }\n\n  return (\n    <form onSubmit={handleSubmit}>\n      <h1>Welcome back</h1>\n      <button type="submit">Sign in</button>\n    </form>\n  );\n}`,
  "src/Dashboard.tsx": `import { fetchProjects } from './api';\n\ntype DashboardProps = { user: string };\n\nexport default function Dashboard({ user }: DashboardProps) {\n  const projects = fetchProjects();\n\n  return (\n    <main>\n      <h1>Hello, {user}</h1>\n      <p>You have {projects.length} projects.</p>\n    </main>\n  );\n}`,
  "src/api.ts": `export function fetchProjects() {\n  // Demo data; replace with a real API request.\n  return [\n    { id: 1, name: 'Portfolio site' },\n    { id: 2, name: 'Study planner' },\n  ];\n}`,
  "package.json": `{\n  "name": "student-dashboard",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": { "dev": "vite", "build": "tsc && vite build" },\n  "dependencies": { "react": "^18.2.0", "react-dom": "^18.2.0" },\n  "devDependencies": { "typescript": "^5.0.0", "vite": "^5.0.0" }\n}`,
  "README.md": `# Student Dashboard\n\nA small React + TypeScript example project.\n\n## Getting started\n1. Install dependencies with npm install.\n2. Start the dev server with npm run dev.\n\n## Structure\n- src/App.tsx controls the login/dashboard view.\n- src/LoginForm.tsx contains the demo login form.\n- src/Dashboard.tsx displays the project dashboard.\n- src/api.ts provides local demo data.`,
};

const LANG: Record<string, string> = {
  tsx: "TypeScript JSX", ts: "TypeScript", js: "JavaScript", jsx: "JavaScript JSX", json: "JSON", md: "Markdown",
  py: "Python", html: "HTML", css: "CSS", java: "Java", cpp: "C++", go: "Go", rs: "Rust", rb: "Ruby", php: "PHP",
};
export const ext = (f: string) => f.split(".").pop()?.toLowerCase() ?? "";
export const langOf = (f: string) => LANG[ext(f)] ?? ext(f).toUpperCase();
export const fileIcon = (f: string) =>
  /\.(tsx?|jsx?)$/.test(f) ? "◈" : f.endsWith(".json") ? "◇" : f.endsWith(".md") ? "▤" : f.endsWith(".css") ? "◉" : "⌘";

export type Level = "Beginner" | "Intermediate" | "Advanced";

export function importsOf(src: string): string[] {
  const out: string[] = [];
  const re = /(?:import\s[^'"]*?from\s*|import\s*\(?\s*|require\(\s*)['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src))) out.push(m[1]);
  const py = /^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm;
  while ((m = py.exec(src))) out.push(m[1] || m[2]);
  return out;
}

export function functionsOf(src: string): string[] {
  const re = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\(|def\s+(\w+)|class\s+(\w+))/g;
  const out = new Set<string>();
  let m;
  while ((m = re.exec(src))) out.add(m[1] || m[2] || m[3] || m[4]);
  return [...out].slice(0, 10);
}

const KNOWN: Record<string, string> = {
  "src/App.tsx": "The main entry component. It keeps the logged-in user in state and shows Dashboard when someone is logged in, otherwise LoginForm.",
  "src/LoginForm.tsx": "A small form. On submit it stops the page from reloading and calls onLogin with a fixed demo user.",
  "src/Dashboard.tsx": "Greets the user and shows how many projects fetchProjects() returns.",
  "src/api.ts": "Provides fetchProjects(), which returns hard-coded sample data instead of calling a real server.",
  "package.json": "Describes the project: its name, scripts (dev, build) and the libraries it depends on.",
  "README.md": "Human-written documentation explaining what the project is and how to run it.",
};

export function explainFile(f: string, src: string, level: Level = "Beginner") {
  const imps = importsOf(src);
  const fns = functionsOf(src);
  const lines = src.split("\n").length;
  const short =
    KNOWN[f] && src === demoFiles[f]
      ? KNOWN[f]
      : f.endsWith(".md")
        ? "Documentation written for people reading the project."
        : f.endsWith("package.json")
          ? "Project manifest listing scripts and dependencies."
          : `A ${langOf(f)} file with ${lines} lines${fns.length ? `, defining ${fns.slice(0, 3).join(", ")}` : ""}${imps.length ? ` and using ${imps.length} import${imps.length > 1 ? "s" : ""}` : ""}.`;
  const points: string[] = [];
  if (level === "Beginner") {
    points.push(imps.length ? "Lines starting with import bring in code from other files or libraries." : "This file doesn't pull in other files.");
    if (fns.length) points.push(`Look for these named pieces: ${fns.join(", ")}. Each is a reusable chunk of logic.`);
    points.push(`Read top to bottom — it's ${lines} lines long.`);
  } else if (level === "Intermediate") {
    if (imps.length) points.push(`Dependencies: ${imps.join(", ")}.`);
    if (fns.length) points.push(`Declarations: ${fns.join(", ")}.`);
    if (/useState|useEffect/.test(src)) points.push("Uses React hooks to hold state or run side effects.");
    if (/export default/.test(src)) points.push("Has a default export — other files import it by any name.");
  } else {
    if (/fetch\(|axios/.test(src)) points.push("Performs network I/O — check error handling, retries and cancellation.");
    if (/useEffect/.test(src)) points.push("Has effects — verify dependency arrays and cleanup.");
    points.push(`Coupling: ${imps.length} inbound import statements; consider whether responsibilities are cohesive.`);
    if (!/test|spec/.test(f)) points.push("No test file detected alongside; consider adding coverage.");
  }
  return { short, points };
}

export type Finding = { sev: "high" | "medium" | "low"; f: string; msg: string; fix: string };
export function review(files: FileMap): Finding[] {
  const out: Finding[] = [];
  for (const [f, s] of Object.entries(files)) {
    if (/(password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]{6,}['"]/i.test(s))
      out.push({ sev: "high", f, msg: "Possible hard-coded secret or password.", fix: "Move it to an environment variable or secret manager and rotate it if real." });
    if (/\beval\s*\(/.test(s)) out.push({ sev: "high", f, msg: "eval() can execute arbitrary code.", fix: "Use explicit parsing or a safe dispatch table." });
    if (/dangerouslySetInnerHTML|\.innerHTML\s*=/.test(s)) out.push({ sev: "medium", f, msg: "Raw HTML injection can lead to XSS.", fix: "Sanitize input or render as text." });
    if (f.endsWith("LoginForm.tsx") && s.includes("student@example.com"))
      out.push({ sev: "medium", f, msg: "Fixed demo identity used instead of real authentication.", fix: "Implement server-side authentication and validation." });
    if (/fetch\(/.test(s) && !/catch|try\s*{/.test(s)) out.push({ sev: "medium", f, msg: "Network request without visible error handling.", fix: "Handle failed responses and show an error state." });
    if (f.endsWith("api.ts") && s.includes("return [")) out.push({ sev: "low", f, msg: "API module returns hard-coded data.", fix: "When connecting a server, add loading and error handling." });
    if (/console\.log\(/.test(s)) out.push({ sev: "low", f, msg: "console.log left in source.", fix: "Remove debug logging or use a logger." });
    if (/\bTODO\b|\bFIXME\b/.test(s)) out.push({ sev: "low", f, msg: "TODO/FIXME marker found.", fix: "Confirm whether work remains and track it." });
  }
  return out;
}

export function graph(files: FileMap) {
  const names = Object.keys(files).filter((f) => /\.(tsx?|jsx?|mjs|py|vue|svelte)$/.test(f)).slice(0, 24);
  const edges: [string, string][] = [];
  for (const a of names) {
    const dir = a.split("/").slice(0, -1).join("/");
    for (const imp of importsOf(files[a])) {
      if (!imp.startsWith(".")) continue;
      const parts = [...(dir ? dir.split("/") : []), ...imp.split("/")];
      const stack: string[] = [];
      for (const p of parts) p === ".." ? stack.pop() : p !== "." && stack.push(p);
      const base = stack.join("/");
      const target = names.find((n) => n === base || n.replace(/\.\w+$/, "") === base || n.replace(/\/index\.\w+$/, "") === base);
      if (target && target !== a) edges.push([a, target]);
    }
  }
  return { names, edges };
}

export function answer(q: string, files: FileMap, current: string, isDemo: boolean): string {
  const s = q.toLowerCase();
  const list = Object.keys(files);
  const named = list.find((f) => s.includes(f.toLowerCase()) || s.includes(f.split("/").pop()!.toLowerCase()));
  if (s.includes("first") || s.includes("start")) {
    const order = list
      .filter((f) => /readme|package\.json|main|index|app/i.test(f))
      .concat(list)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5);
    return `A good reading order:\n${order.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nStart with the README and entry files, then follow the imports.`;
  }
  if (s.includes("login") || s.includes("auth")) {
    const hits = list.filter((f) => /login|auth|session|sign/i.test(f + files[f].slice(0, 4000)));
    return hits.length ? `Login/auth related code appears in:\n${hits.slice(0, 6).map((f) => "• " + f).join("\n")}` : "I couldn't find login or authentication code in the loaded files.";
  }
  if (s.includes("bug") || s.includes("issue") || s.includes("problem")) {
    const r = review(files);
    return r.length ? `Potential issues (not confirmed bugs):\n${r.slice(0, 6).map((x) => `• [${x.sev}] ${x.f}: ${x.msg}`).join("\n")}` : "My quick scan found no common risky patterns. That doesn't prove the code is bug-free.";
  }
  if (s.includes("backend") || s.includes("frontend") || s.includes("api") || s.includes("fetch")) {
    const hits = list.filter((f) => /fetch\(|axios|api/i.test(files[f]));
    return hits.length ? `These files talk to data sources or APIs:\n${hits.slice(0, 6).map((f) => "• " + f).join("\n")}${isDemo ? "\n\nIn the demo, api.ts returns hard-coded data — there's no real server." : ""}` : "No network or API calls were detected.";
  }
  if (named || s.includes("explain") || s.includes("project")) {
    const f = named ?? current;
    if (!named && s.includes("project")) {
      const readme = list.find((x) => /readme\.md$/i.test(x));
      return `This project has ${list.length} files.${readme ? `\n\nFrom ${readme}:\n${files[readme].slice(0, 400)}` : ""}\n\nOpen the File explorer to dig in.`;
    }
    const e = explainFile(f, files[f] ?? "");
    return `About ${f}:\n\n${e.short}\n\n${e.points.map((p) => "• " + p).join("\n")}`;
  }
  return `This project has ${list.length} files. Try asking about a specific file, where to start, login logic, APIs, or potential bugs.`;
}

export type Quiz = { q: string; opts: string[]; a: number; why: string };
export const demoQuiz: Quiz[] = [
  { q: "What decides whether App.tsx shows Dashboard or LoginForm?", opts: ["The project filename", "Whether the user state has a value", "The package version", "A server response"], a: 1, why: "A truthy user renders Dashboard; otherwise LoginForm." },
  { q: "What does fetchProjects() in src/api.ts do?", opts: ["Calls a REST API", "Connects to a database", "Returns hard-coded sample projects", "Reads a ZIP file"], a: 2, why: "It returns a literal array with two demo projects." },
  { q: "What does LoginForm call after its demo submit?", opts: ["setTimeout", "onLogin callback", "fetchProjects", "localStorage"], a: 1, why: "App passes setUser as onLogin, so the callback updates App state." },
];

export function buildQuiz(files: FileMap, isDemo: boolean): Quiz[] {
  if (isDemo) return demoQuiz;
  const qs: Quiz[] = [];
  const list = Object.keys(files);
  const exts = [...new Set(list.map(langOf))];
  for (const f of list.filter((f) => functionsOf(files[f]).length).slice(0, 4)) {
    const fn = functionsOf(files[f])[0];
    const others = list.filter((x) => x !== f).sort(() => 0.5 - Math.random()).slice(0, 3);
    if (others.length < 2) continue;
    const opts = [...others, f].sort(() => 0.5 - Math.random());
    qs.push({ q: `Which file defines "${fn}"?`, opts, a: opts.indexOf(f), why: `${fn} is declared in ${f}.` });
  }
  if (exts.length) {
    const top = exts[0];
    const opts = [top, "COBOL", "Fortran", "Haskell"].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4).sort();
    qs.push({ q: "Which language appears in this project?", opts, a: opts.indexOf(top), why: `${top} files were detected by extension.` });
  }
  return qs.length ? qs : demoQuiz;
}
