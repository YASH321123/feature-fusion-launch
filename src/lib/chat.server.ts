import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.server";

const MODEL = "openai/gpt-6-astra";
const MAX_CONTEXT = 150_000;

type Body = { files: Record<string, string>; projectName: string; current?: string; messages: { role: "user" | "assistant"; content: string }[] };

function buildContext(b: Body) {
  const names = Object.keys(b.files);
  let out = `Project: ${b.projectName}\nFiles (${names.length}):\n${names.join("\n")}\n\n`;
  const ordered = [...names].sort((a, c) => score(c) - score(a));
  for (const f of ordered) {
    const chunk = `===== ${f} =====\n${b.files[f]}\n\n`;
    if (out.length + chunk.length > MAX_CONTEXT) { out += `===== ${f} ===== (omitted, too large for context)\n`; continue; }
    out += chunk;
  }
  return out;
  function score(f: string) {
    return (/readme/i.test(f) ? 5 : 0) + (/package\.json|main\.|index\.|app\./i.test(f) ? 3 : 0) + (f === b.current ? 4 : 0) - (/test|spec/i.test(f) ? 3 : 0);
  }
}

export async function handleChat(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return new Response("AI is not configured.", { status: 500 });
  let body: Body;
  try { body = await request.json(); } catch { return new Response("Bad request", { status: 400 }); }
  if (!body?.files || !Array.isArray(body.messages) || !body.messages.length) return new Response("Bad request", { status: 400 });

  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });

  const instructions = `You are Codebase Mentor, a patient senior engineer helping a developer understand an unfamiliar codebase.
Answer using ONLY the project source provided below; reference concrete file paths and function names. If something isn't in the files, say so.
When asked to explain the project, give a thorough, well-structured explanation in Markdown: purpose, tech stack, folder structure, key files and what each does, how data/control flows between them (entry point → components → data), how to run it, notable patterns, potential issues, and a suggested reading order for a beginner.
Use clear headings and bullet points. Explain jargon simply.

${buildContext(body)}`;

  const messages: ModelMessage[] = body.messages.slice(-12).map((m) => ({ role: m.role, content: String(m.content).slice(0, 8000) }));

  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] },
    },
  });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(ctrl) {
      try {
        for await (const part of result.fullStream) {
          if (part.type === "text-delta") ctrl.enqueue(enc.encode(part.text));
          else if (part.type === "error") throw part.error;
        }
      } catch (e: unknown) {
        const status = (e as { statusCode?: number })?.statusCode;
        const msg = status === 402 ? "AI credits are used up for this workspace. Add credits in workspace billing to keep chatting."
          : status === 429 ? "The AI is busy right now. Please wait a moment and try again."
          : request.signal.aborted ? "" : "The AI couldn't answer this time. Please try again.";
        if (msg) ctrl.enqueue(enc.encode(`\n\n⚠️ ${msg}`));
      } finally { ctrl.close(); }
    },
  });
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" });
  const rid = runIdFetch.getRunId?.();
  if (rid) headers.set("X-Lovable-AIG-Run-ID", rid);
  return new Response(stream, { headers });
}
