import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Brand, Btn } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Codebase Mentor — Understand any codebase" },
      { name: "description", content: "Explore files, see how code connects, spot issues and learn any codebase. Import a GitHub repo or ZIP." },
      { property: "og:title", content: "Codebase Mentor — Understand any codebase" },
      { property: "og:description", content: "Your programming mentor for unfamiliar projects. Import a GitHub repo or ZIP and start learning." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  ["⌘", "Explore every file", "Navigate a clean project tree, search filenames, and inspect source without getting lost."],
  ["✳", "Explain code simply", "Beginner, intermediate or advanced explanations of functions, imports and structure."],
  ["⌁", "See how files connect", "Visualize import relationships and how components fit together."],
  ["⌕", "Spot potential issues", "Scan for hard-coded secrets, eval, XSS risks, missing error handling and more."],
  ["◉", "Learn as you explore", "Test your understanding with quizzes generated from the loaded project."],
  ["↗", "Start from any project", "Try the demo, drop a ZIP, or import any public GitHub repository."],
];
const steps = [
  ["01", "Bring your code", "Open the demo, upload a ZIP archive, or paste a public GitHub repository URL."],
  ["02", "Explore the structure", "Browse files, inspect source, and follow import relationships."],
  ["03", "Ask, learn, improve", "Ask questions, review potential issues, and check your knowledge with a quiz."],
];
const langs = ["TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C / C++", "Ruby", "PHP", "HTML / CSS", "SQL", "Swift"];

function Landing() {
  const nav = useNavigate();
  const open = (tab: "overview" | "import") => nav({ to: "/app", search: { tab } });
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-6">
          <Brand />
          <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#languages" className="hover:text-foreground">Languages</a>
          </nav>
          <div className="flex items-center gap-2"><ThemeToggle /><Btn variant="primary" onClick={() => open("overview")}>Get started ↗</Btn></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
          <span className="size-2 rounded-full bg-success" /> YOUR AI-POWERED CODE COMPANION
        </span>
        <h1 className="mx-auto mb-5 mt-6 max-w-4xl text-5xl font-bold leading-[1.05] tracking-tighter md:text-7xl">
          Understand any codebase.<br /><span className="text-gradient">Build with confidence.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Your programming mentor for unfamiliar projects. Explore files, understand how everything connects, and learn to think like a developer.
        </p>
        <div className="my-7 flex flex-wrap justify-center gap-3">
          <Btn variant="primary" onClick={() => open("import")}>⌘ Analyze your project →</Btn>
          <Btn onClick={() => open("overview")}>▷ Explore live demo</Btn>
        </div>
        <p className="text-xs text-muted-foreground">No sign-up needed · Works with any public GitHub repo</p>

        <div className="mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border border-border bg-card text-left shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-full bg-destructive" /><span className="size-2.5 rounded-full bg-warning" /><span className="size-2.5 rounded-full bg-success" />
            <span className="ml-3">codebase-mentor / demo-project</span>
          </div>
          <div className="grid min-h-64 grid-cols-[150px_1fr] md:grid-cols-[190px_1fr_280px]">
            <div className="border-r border-border p-3 font-mono text-xs text-muted-foreground">
              <div className="mb-2 text-[10px] tracking-widest">EXPLORER</div>
              {["⌄ 📁 src", "  ◈ App.tsx", "  ◈ api.ts", "  ◈ Dashboard.tsx", "  ◈ LoginForm.tsx", "◇ package.json", "▤ README.md"].map((t, i) => (
                <div key={t} className={`whitespace-pre rounded px-1.5 py-1 ${i === 1 ? "bg-accent text-accent-foreground" : ""}`}>{t}</div>
              ))}
            </div>
            <pre className="bg-code p-4 font-mono text-xs leading-7 text-muted-foreground">
              <span className="text-tok-key">import</span> {"{ useState }"} <span className="text-tok-key">from</span> <span className="text-tok-str">'react'</span>;{"\n\n"}
              <span className="text-tok-key">export default function</span> <span className="text-tok-fn">App</span>() {"{"}{"\n"}
              {"  "}<span className="text-tok-key">const</span> [user, setUser] = <span className="text-tok-fn">useState</span>(<span className="text-tok-key">null</span>);{"\n"}
              {"  "}<span className="text-tok-key">return</span> user ? {"<"}<span className="text-tok-fn">Dashboard</span> /{">"} : {"<"}<span className="text-tok-fn">LoginForm</span> /{">"};{"\n"}
              {"}"}
            </pre>
            <div className="hidden border-l border-border p-4 text-xs md:block">
              <div className="mb-3 font-semibold">✳ Codebase Mentor</div>
              <div className="rounded-lg bg-secondary p-3 leading-relaxed text-muted-foreground">
                <b className="text-foreground">What does App.tsx do?</b><br /><br />It's the main entry. Logged in? Show Dashboard. Otherwise, show LoginForm.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <Head kicker="LESS GUESSING. MORE BUILDING." title={<>Your new superpower is <span className="text-gradient">understanding.</span></>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(([i, t, d]) => (
            <article key={t} className="rounded-xl border border-border bg-card p-6 transition hover:border-primary">
              <div className="mb-4 grid size-10 place-items-center rounded-lg bg-accent text-lg text-accent-foreground">{i}</div>
              <h3 className="mb-2 font-semibold">{t}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{d}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-7xl px-6 py-20">
        <Head kicker="A CLEAR PATH FORWARD" title={<>From unfamiliar to <span className="text-gradient">understood.</span></>} />
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div key={n} className="rounded-xl border border-border bg-card p-6">
              <div className="font-display text-3xl font-bold text-gradient">{n}</div>
              <h3 className="mb-2 mt-3 font-semibold">{t}</h3>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="languages" className="mx-auto max-w-7xl px-6 py-20">
        <Head kicker="POLYGLOT BY DEFAULT" title={<>Works with the languages <span className="text-gradient">you use.</span></>} />
        <div className="flex flex-wrap justify-center gap-3">
          {langs.map((l) => <span key={l} className="rounded-full border border-border bg-card px-4 py-2 text-sm">{l}</span>)}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="rounded-2xl border border-primary/30 bg-accent p-10 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Ready to understand your next project?</h2>
          <p className="mt-2 text-muted-foreground">Paste a GitHub link and start exploring in seconds.</p>
          <Btn variant="primary" className="mt-6" onClick={() => open("import")}>Import a repository →</Btn>
        </div>
      </section>

      <footer className="border-t border-border/40">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-6 py-8 text-sm text-muted-foreground">
          <Brand />
          <span>Built for curious developers · <Link to="/app" search={{ tab: "overview" }} className="hover:text-foreground">Open workspace</Link></span>
        </div>
      </footer>
    </div>
  );
}

function Head({ kicker, title }: { kicker: string; title: React.ReactNode }) {
  return (
    <div className="mb-10 text-center">
      <div className="text-xs font-extrabold tracking-[0.15em] text-accent-foreground">{kicker}</div>
      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
    </div>
  );
}
