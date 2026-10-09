import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Brand, Btn } from "@/components/Brand";
import { importGithubRepo } from "@/lib/github.functions";
import { extractZip, type FileMap } from "@/lib/zip";
import { answer, buildQuiz, demoFiles, explainFile, fileIcon, graph, langOf, review, ext, type Level } from "@/lib/mentor";

const TABS = {
  overview: ["▦", "Overview", "Project overview", "A guided tour of your project."],
  files: ["⌘", "File explorer", "File explorer", "Browse the source and learn what each file does."],
  chat: ["✳", "Ask your code", "Ask your code", "A project-aware helper for your code questions."],
  graph: ["⌁", "Dependency map", "Dependency map", "Explore import relationships in this project."],
  review: ["⌕", "Code review", "Code review", "Potential issues to investigate — not guaranteed bugs."],
  learn: ["◉", "Learning mode", "Learning mode", "Build your understanding one question at a time."],
  import: ["＋", "Import project", "Import a project", "Bring a ZIP archive or public GitHub repository."],
} as const;
type Tab = keyof typeof TABS;

export const Route = createFileRoute("/app")({
  validateSearch: (s: Record<string, unknown>): { tab: Tab } => ({
    tab: (s["tab"] as string) in TABS ? (s["tab"] as Tab) : "overview",
  }),
  head: () => ({
    meta: [
      { title: "Workspace — Codebase Mentor" },
      { name: "description", content: "Explore files, ask questions, map dependencies, review code and take quizzes on any project." },
      { property: "og:title", content: "Workspace — Codebase Mentor" },
      { property: "og:description", content: "Your codebase learning workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Workspace,
});

type Msg = { role: "user" | "bot"; text: string };

function Workspace() {
  const { tab } = Route.useSearch();
  const nav = useNavigate({ from: "/app" });
  const go = (t: Tab) => nav({ search: { tab: t } });
  const [files, setFiles] = useState<FileMap>(demoFiles);
  const [name, setName] = useState("demo-project");
  const [isDemo, setIsDemo] = useState(true);
  const [current, setCurrent] = useState("src/App.tsx");
  const [chat, setChat] = useState<Msg[]>([]);

  const load = (f: FileMap, n: string) => {
    setFiles(f); setName(n); setIsDemo(false); setChat([]);
    setCurrent(Object.keys(f).find((x) => /readme/i.test(x)) ?? Object.keys(f)[0]);
    toast.success(`Loaded ${Object.keys(f).length} files from ${n}`);
    go("overview");
  };
  const ask = (q: string) => {
    setChat((c) => [...c, { role: "user", text: q }, { role: "bot", text: answer(q, files, current, isDemo) }]);
    go("chat");
  };
  const openFile = (f: string) => { setCurrent(f); go("files"); };
  const ctx = { files, current, isDemo, openFile, ask, go };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-6">
          <Brand />
          <div className="flex gap-2">
            <Link to="/"><Btn>← Home</Btn></Link>
            <Btn variant="primary" onClick={() => go("import")}>＋ Import</Btn>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-7">
        <div className="mb-6">
          <div className="text-[11px] font-extrabold tracking-[0.15em] text-accent-foreground">WORKSPACE / {tab.toUpperCase()}</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{TABS[tab][2]}</h1>
          <p className="text-muted-foreground">{TABS[tab][3]}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="flex gap-1 overflow-auto rounded-xl border border-border bg-card p-3 md:block">
            {(Object.keys(TABS) as Tab[]).map((t) => (
              <button key={t} onClick={() => go(t)} className={`flex w-full min-w-max items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${tab === t ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}>
                <span className="w-4 text-center">{TABS[t][0]}</span>{TABS[t][1]}
              </button>
            ))}
            <div className="mt-4 hidden border-t border-border pt-4 md:block">
              <div className="px-2 text-[10px] tracking-widest text-muted-foreground">CURRENT PROJECT</div>
              <div className="mt-2 truncate px-2 text-sm font-semibold">📁 {name}</div>
              <div className="px-2 text-xs text-success">● {isDemo ? "Built-in demo" : "Imported"}</div>
              {!isDemo && <button className="mt-2 px-2 text-xs text-muted-foreground underline" onClick={() => { setFiles(demoFiles); setName("demo-project"); setIsDemo(true); setCurrent("src/App.tsx"); setChat([]); }}>Back to demo</button>}
            </div>
          </aside>
          <main className="min-w-0">
            {tab === "overview" && <Overview {...ctx} />}
            {tab === "files" && <Files {...ctx} setCurrent={setCurrent} />}
            {tab === "chat" && <Chat {...ctx} chat={chat} />}
            {tab === "graph" && <Graph {...ctx} />}
            {tab === "review" && <Review files={files} />}
            {tab === "learn" && <Learn files={files} isDemo={isDemo} />}
            {tab === "import" && <Import onLoad={load} />}
          </main>
        </div>
      </div>
    </div>
  );
}

type Ctx = { files: FileMap; current: string; isDemo: boolean; openFile: (f: string) => void; ask: (q: string) => void; go: (t: Tab) => void };

function Panel({ title, children, right }: { title: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 font-semibold">{title}{right}</div>
      {children}
    </section>
  );
}
const Tag = ({ children, ok }: { children: React.ReactNode; ok?: boolean }) => (
  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${ok ? "border-success/30 bg-success/10 text-success" : "border-primary/30 bg-accent text-accent-foreground"}`}>{children}</span>
);
const Chip = (p: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={`rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-secondary-foreground transition hover:border-primary ${p.className ?? ""}`} />
);

function Tree({ files, current, onPick, filter = "" }: { files: FileMap; current: string; onPick: (f: string) => void; filter?: string }) {
  const list = Object.keys(files).filter((f) => f.toLowerCase().includes(filter.toLowerCase())).sort();
  if (!list.length) return <div className="p-2 text-sm text-muted-foreground">No matching files</div>;
  return (
    <div className="max-h-[420px] overflow-auto font-mono text-xs">
      {list.map((f) => (
        <div key={f} onClick={() => onPick(f)} style={{ paddingLeft: 6 + (f.split("/").length - 1) * 12 }}
          className={`cursor-pointer truncate rounded py-1.5 pr-2 ${f === current ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"}`}>
          {fileIcon(f)} {f.split("/").pop()}
          {f.includes("/") && <span className="ml-2 opacity-40">{f.split("/").slice(0, -1).join("/")}</span>}
        </div>
      ))}
    </div>
  );
}

function Overview({ files, isDemo, openFile, ask, go, current }: Ctx) {
  const list = Object.keys(files);
  const exts = list.reduce<Record<string, number>>((a, f) => ((a[ext(f)] = (a[ext(f)] || 0) + 1), a), {});
  const size = list.reduce((n, f) => n + files[f].length, 0);
  const path = list.filter((f) => /readme|package\.json|main|index|app/i.test(f)).concat(list).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);
  return (
    <div className="space-y-4">
      {isDemo && <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">✦ <b>Demo project:</b> built-in sample content. Import your own repo from the Import tab.</div>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Source files", list.length, "Files loaded"], ["Languages", Object.keys(exts).length, Object.entries(exts).slice(0, 3).map(([e, n]) => `${e} (${n})`).join(" · ")], ["Project size", (size / 1024).toFixed(1) + " KB", "Text content"], ["Status", isDemo ? "Demo" : "Imported", "Analyzed locally"]].map(([l, v, s]) => (
          <div key={l as string} className="rounded-xl border border-border bg-card p-4">
            <span className="text-xs text-muted-foreground">{l}</span>
            <strong className="mt-1 block font-display text-2xl">{v}</strong>
            <small className="block truncate text-xs text-success">{s}</small>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-4">
          <Panel title="⌘  Start here">
            <div className="p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{isDemo ? "A small React + TypeScript student dashboard. App chooses between a login form and a dashboard based on user state." : explainFile(current, files[current] ?? "").short}</p>
              <div className="my-4 flex flex-wrap gap-2">{Object.keys(exts).slice(0, 4).map((e) => <Tag key={e}>{langOf("x." + e)}</Tag>)}<Tag ok>{list.length} files loaded</Tag></div>
              <Btn variant="primary" onClick={() => go("files")}>Explore source files →</Btn>
            </div>
          </Panel>
          <Panel title="◉  Suggested learning path">
            <div className="p-3 text-sm">
              {path.map((f, i) => <div key={f} onClick={() => openFile(f)} className="cursor-pointer rounded px-2 py-2 text-muted-foreground hover:bg-accent">{"①②③④"[i]} Read <b className="text-foreground">{f}</b></div>)}
              <div onClick={() => go("graph")} className="cursor-pointer rounded px-2 py-2 text-muted-foreground hover:bg-accent">→ View the dependency map</div>
            </div>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="⌁  Project structure"><div className="p-3"><Tree files={files} current={current} onPick={openFile} /></div></Panel>
          <Panel title="✳  Quick question">
            <div className="flex flex-wrap gap-2 p-4">
              <Chip onClick={() => ask("Explain this project in simple English.")}>Explain this project</Chip>
              <Chip onClick={() => ask("Which files should I understand first?")}>What should I read first?</Chip>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Highlight({ line }: { line: string }) {
  const parts = line.split(/(\/\/.*$|#.*$|'[^']*'|"[^"]*"|`[^`]*`|\b(?:import|from|export|default|function|const|let|var|return|if|else|type|new|throw|async|await|true|false|null|class|def|for|while|interface)\b)/g);
  return <>{parts.map((p, i) => {
    if (!p) return null;
    if (/^(\/\/|#)/.test(p)) return <span key={i} className="text-tok-com">{p}</span>;
    if (/^['"`]/.test(p)) return <span key={i} className="text-tok-str">{p}</span>;
    if (/^\w+$/.test(p) && i % 2 === 1) return <span key={i} className="text-tok-key">{p}</span>;
    return <span key={i}>{p.split(/(\b\w+(?=\())/g).map((q, j) => j % 2 ? <span key={j} className="text-tok-fn">{q}</span> : q)}</span>;
  })}</>;
}

function Files({ files, current, setCurrent, ask }: Ctx & { setCurrent: (f: string) => void }) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Level>("Beginner");
  const f = files[current] !== undefined ? current : Object.keys(files)[0];
  const code = files[f] ?? "";
  const ex = explainFile(f, code, level);
  return (
    <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
      <Panel title="⌘  Explorer" right={<Tag>{Object.keys(files).length} files</Tag>}>
        <div className="p-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files..." className="mb-3 w-full rounded-lg border border-input bg-code px-3 py-2 text-sm outline-none focus:border-primary" />
          <Tree files={files} current={f} onPick={setCurrent} filter={q} />
        </div>
      </Panel>
      <div className="min-w-0 space-y-4">
        <Panel title={<span className="truncate">◈ {f}</span>} right={<Btn className="px-2.5 py-1.5 text-xs" onClick={() => { navigator.clipboard?.writeText(code); toast.success("Source copied"); }}>Copy</Btn>}>
          <div className="flex justify-between border-b border-border px-4 py-2 text-xs text-muted-foreground"><span>{langOf(f)}</span><span>{code.split("\n").length} lines</span></div>
          <pre className="max-h-[420px] overflow-auto bg-code p-4 font-mono text-xs leading-6 text-muted-foreground">
            {code.split("\n").map((l: string, i: number) => <div key={i} className="min-w-max"><span className="inline-block w-9 select-none pr-4 text-right opacity-40">{i + 1}</span><Highlight line={l} /></div>)}
          </pre>
          <div className="p-4">
            <div className="rounded-lg border border-primary/30 bg-accent p-3 text-xs leading-relaxed text-accent-foreground"><b>Mentor note:</b> {ex.short}</div>
            <Btn variant="primary" className="mt-3" onClick={() => ask(`Explain the file ${f}`)}>Explain this file ✳</Btn>
          </div>
        </Panel>
        <Panel title="✳  File explanation">
          <div className="p-4">
            <div className="flex gap-2">{(["Beginner", "Intermediate", "Advanced"] as Level[]).map((l) => <Chip key={l} onClick={() => setLevel(l)} className={level === l ? "border-primary text-accent-foreground" : ""}>{l}</Chip>)}</div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">{ex.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Chat({ chat, ask }: Ctx & { chat: Msg[] }) {
  const [v, setV] = useState("");
  const qs = ["Explain this project in simple English.", "Which files should I understand first?", "Where is the login logic implemented?", "How does the frontend communicate with the backend?", "Find potential bugs in this code."];
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <Panel title="✳  Codebase Mentor" right={<Tag>Local assistant</Tag>}>
        <div className="flex h-[440px] flex-col gap-3 overflow-auto p-4">
          {!chat.length && <div className="max-w-[85%] rounded-xl bg-secondary p-3 text-sm">Hey! 👋 Ask me about any loaded file, where to start, APIs, login logic, or potential bugs.</div>}
          {chat.map((m, i) => (
            <div key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-xl p-3 text-sm leading-relaxed ${m.role === "user" ? "self-end bg-gradient-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>{m.text}</div>
          ))}
        </div>
        <form className="flex gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { ask(v.trim()); setV(""); } }}>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder="Ask a question about your code..." className="flex-1 rounded-lg border border-input bg-code px-3 py-2 text-sm outline-none focus:border-primary" />
          <Btn variant="primary">Send ↑</Btn>
        </form>
      </Panel>
      <Panel title="Suggested questions">
        <div className="space-y-2 p-4">{qs.map((q) => <Chip key={q} className="block w-full text-left" onClick={() => ask(q)}>{q}</Chip>)}</div>
      </Panel>
    </div>
  );
}

function Graph({ files, openFile }: Ctx) {
  const { names, edges } = useMemo(() => graph(files), [files]);
  const cols = Math.min(4, Math.max(1, Math.ceil(Math.sqrt(names.length))));
  const pos = Object.fromEntries(names.map((n: string, i: number) => [n, { x: 30 + (i % cols) * 170, y: 30 + Math.floor(i / cols) * 80 }])) as Record<string, { x: number; y: number }>;
  const W = 30 + cols * 170, H = 40 + Math.ceil(names.length / cols) * 80;
  return (
    <Panel title="⌁  Import relationship graph" right={<Tag>{edges.length} links</Tag>}>
      <div className="overflow-auto p-4">
        {names.length ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[560px]" style={{ width: "100%" }}>
            {edges.map(([a, b], i) => { const p = pos[a], q = pos[b]; return <path key={i} d={`M${p.x + 70} ${p.y + 19} C${(p.x + q.x) / 2 + 70} ${p.y + 60}, ${(p.x + q.x) / 2 + 70} ${q.y - 20}, ${q.x + 70} ${q.y + 19}`} fill="none" stroke="var(--primary)" strokeOpacity=".6" strokeWidth="1.5" />; })}
            {names.map((n) => (
              <g key={n} className="cursor-pointer" onClick={() => openFile(n)}>
                <rect x={pos[n].x} y={pos[n].y} width="140" height="38" rx="9" fill="var(--secondary)" stroke="var(--border)" />
                <text x={pos[n].x + 70} y={pos[n].y + 23} textAnchor="middle" fill="var(--foreground)" fontSize="11">{n.split("/").pop()!.slice(0, 20)}</text>
              </g>
            ))}
          </svg>
        ) : <p className="text-sm text-muted-foreground">No code files to map.</p>}
        <p className="mt-3 rounded-lg border border-primary/30 bg-accent p-3 text-xs text-accent-foreground">Links come from relative import statements. Click a box to open the file.</p>
      </div>
    </Panel>
  );
}

function Review({ files }: { files: FileMap }) {
  const [n, setN] = useState(0);
  const items = useMemo(() => review(files), [files, n]);
  const sev = { high: "bg-destructive/15 text-destructive", medium: "bg-warning/15 text-warning", low: "bg-accent text-accent-foreground" };
  return (
    <Panel title="⌕  Potential issues" right={<Tag>{items.length} findings</Tag>}>
      <div>
        {items.length ? items.map((x, i) => (
          <div key={i} className="flex gap-3 border-b border-border p-4">
            <span className={`h-fit rounded px-2 py-0.5 text-[10px] font-bold ${sev[x.sev]}`}>{x.sev.toUpperCase()}</span>
            <div className="text-sm"><h3 className="font-semibold">{x.msg}</h3><p className="text-muted-foreground">📄 {x.f}</p><p className="mt-1 text-muted-foreground"><b className="text-foreground">Next step:</b> {x.fix}</p></div>
          </div>
        )) : <p className="p-4 text-sm text-muted-foreground">No risky patterns detected. This doesn't prove the code is bug-free.</p>}
        <div className="p-4"><Btn onClick={() => { setN(n + 1); toast("Scan refreshed"); }}>↻ Refresh scan</Btn></div>
      </div>
    </Panel>
  );
}

function Learn({ files, isDemo }: { files: FileMap; isDemo: boolean }) {
  const quiz = useMemo(() => buildQuiz(files, isDemo), [files, isDemo]);
  const [i, setI] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const q = quiz[i % quiz.length]!;
  return (
    <Panel title="◉  Quiz" right={<Tag ok>Score {score} / {i + (pick !== null ? 1 : 0)}</Tag>}>
      <div className="p-5">
        <div className="text-xs text-muted-foreground">Question {(i % quiz.length) + 1} of {quiz.length}</div>
        <h3 className="mb-4 mt-1 text-lg font-semibold">{q.q}</h3>
        <div className="grid gap-2">
          {q.opts.map((o, j) => {
            const st = pick === null ? "hover:border-primary" : j === q.a ? "border-success bg-success/10" : j === pick ? "border-destructive bg-destructive/10" : "opacity-60";
            return <button key={j} disabled={pick !== null} onClick={() => { setPick(j); if (j === q.a) setScore(score + 1); }} className={`rounded-lg border border-border bg-secondary p-3 text-left text-sm transition ${st}`}>{o}</button>;
          })}
        </div>
        {pick !== null && (
          <>
            <div className="mt-4 rounded-lg border border-primary/30 bg-accent p-3 text-sm text-accent-foreground"><b>{pick === q.a ? "Correct! Nice work." : "Not quite."}</b> {q.why}</div>
            <Btn variant="primary" className="mt-3" onClick={() => { setI(i + 1); setPick(null); }}>Next question →</Btn>
          </>
        )}
      </div>
    </Panel>
  );
}

function Import({ onLoad }: { onLoad: (f: FileMap, n: string) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [zipMsg, setZipMsg] = useState("");
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const fetchRepo = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const r = await importGithubRepo({ data: { url } });
      if (r.ok) onLoad(r.files, r.name); else setErr(r.error);
    } catch {
      setErr("Couldn't reach GitHub. Check your connection and try again.");
    } finally { setBusy(false); }
  };
  const handleZip = async (file?: File) => {
    if (!file) return;
    if (!/\.zip$/i.test(file.name)) return setZipMsg("Please choose a .zip archive.");
    if (file.size > 25 * 1024 * 1024) return setZipMsg("ZIP exceeds the 25 MB limit.");
    setZipMsg("Reading archive…");
    try {
      const f = extractZip(new Uint8Array(await file.arrayBuffer()));
      if (!Object.keys(f).length) return setZipMsg("No supported source files found in this ZIP.");
      onLoad(f, file.name.replace(/\.zip$/i, ""));
    } catch { setZipMsg("This file couldn't be read as a ZIP."); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="⌘  Import public GitHub repo">
        <form onSubmit={fetchRepo} className="p-4">
          <label className="text-xs text-muted-foreground">Repository URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} required placeholder="https://github.com/owner/repository" className="mb-3 mt-1 w-full rounded-lg border border-input bg-code px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <Btn variant="primary" disabled={busy}>{busy ? "Downloading…" : "Fetch repository →"}</Btn>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {["facebook/react", "vercel/swr", "pallets/flask"].map((r) => <Chip key={r} type="button" onClick={() => setUrl(`https://github.com/${r}`)}>{r}</Chip>)}
          </div>
          {err && <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{err}</div>}
          <p className="mt-3 text-xs text-muted-foreground">Downloads the whole repo in one request — no GitHub rate-limit errors. Up to 80 source files are loaded.</p>
        </form>
      </Panel>
      <Panel title="↑  Upload source ZIP">
        <div className="p-4">
          <div onClick={() => input.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); handleZip(e.dataTransfer.files[0]); }}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition ${drag ? "border-primary bg-accent" : "border-border"}`}>
            <div className="text-3xl">⇧</div>
            <h3 className="mt-2 font-semibold">Drop your project ZIP here</h3>
            <p className="text-xs text-muted-foreground">or click to browse · max 25 MB</p>
            <input ref={input} type="file" accept=".zip" hidden onChange={(e) => handleZip(e.target.files?.[0])} />
          </div>
          {zipMsg && <p className="mt-3 text-sm text-muted-foreground">{zipMsg}</p>}
          <p className="mt-3 text-xs text-muted-foreground">Files are read in your browser and never executed.</p>
        </div>
      </Panel>
    </div>
  );
}
