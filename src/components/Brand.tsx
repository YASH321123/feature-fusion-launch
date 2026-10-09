import { Link } from "@tanstack/react-router";

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-[17px] font-bold tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <svg viewBox="0 0 24 24" className="w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m8 6-6 6 6 6M16 6l6 6-6 6M14 4l-4 16" />
        </svg>
      </span>
      <span className="font-display">
        Codebase <em className="not-italic text-accent-foreground">Mentor</em>
      </span>
    </Link>
  );
}

export function Btn({ variant = "ghost", className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost"; }) {
  const v = variant === "primary" ? "bg-gradient-primary text-primary-foreground border-transparent shadow-glow" : "bg-secondary text-secondary-foreground border-border hover:border-primary";
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-px disabled:opacity-50 ${v} ${className}`} />;
}
