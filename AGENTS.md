<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- GitHub import downloads the repo ZIP from codeload.github.com in a server function (src/lib/github.functions.ts) — avoids browser CORS and GitHub API rate limits.
- noUncheckedIndexedAccess is off in tsconfig — the code analysis helpers index file maps heavily.
- "Ask your code" streams AI answers from /api/chat (src/lib/chat.server.ts) with loaded files as context; local rule-based answers are the fallback when AI fails.
- Theme state lives in a shared provider and uses semantic CSS tokens; only the appearance preference is kept in browser storage.
- Live project execution uses a lazily loaded Sandpack browser sandbox after explicit consent; preview edits remain separate from imported analysis files.
