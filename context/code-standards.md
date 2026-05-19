# Code Standards

## General

- Keep modules small and single-purpose. If a file is doing two things,
  it should be two files.
- Fix root causes — do not layer workarounds or add conditionals to
  paper over broken logic
- Do not mix data fetching, business logic, and rendering in the same
  file
- Prefer explicit over clever. Code is read far more than it is written.
- Delete dead code immediately. Commented-out code is noise — use git.

## TypeScript

- Strict mode is required. `tsconfig.json` must have `"strict": true`.
- Never use `any`. Use `unknown` for truly unknown shapes and narrow
  explicitly.
- All AI-generated JSON must pass through a Zod schema before use.
  Do not trust raw LLM output as typed.
- Define shared types in `lib/types.ts`. Do not duplicate type
  definitions across files.
- Prefer `interface` for object shapes that represent a domain concept.
  Use `type` for unions, aliases, and utility compositions.

## Next.js

- Default to React Server Components. Only add `"use client"` when
  the component requires browser state, event handlers, or Vercel AI
  SDK streaming hooks.
- Keep route handlers in `app/api/` focused on one endpoint and one
  responsibility. No route handler should be longer than ~60 lines —
  delegate to `lib/` if it is.
- Use `"use server"` for Server Actions only when appropriate. Prefer
  route handlers for AI streaming endpoints because Server Actions do
  not support streaming responses cleanly.
- Never put secrets, API keys, or server-only code in a `"use client"`
  file. Use the `server-only` package in any `lib/` module that
  touches external APIs.
- Loading states: use `loading.tsx` at the route level and
  `<Suspense>` boundaries inside pages. Never block the entire page
  for a single async operation.

## Styling

- Use CSS custom property tokens defined in `ui-context.md` and
  `:root` in `globals.css`. No hardcoded hex values anywhere in
  component files.
- Tailwind utility classes only — no custom CSS files except
  `globals.css` for token definitions.
- Do not use inline `style=` props for colors or spacing. Use Tailwind
  classes.
- Follow the border radius scale in `ui-context.md`. Do not invent
  new radius values.
- Dark mode only. No `dark:` variant prefixes needed — the entire
  app is dark. Do not add light mode support in MVP.

## API Routes

- First line of every route handler: validate and parse the request
  body with Zod. Return `400` immediately on invalid input.
- Second check: extract and verify Clerk session. Return `401` on
  missing or invalid auth.
- Third check (for mutations): verify the requesting user owns the
  resource they are touching. Return `403` on ownership mismatch.
- All route handlers return a consistent shape:
  - Success: `{ data: T }`
  - Error: `{ error: string, code?: string }`
- For streaming routes (lesson generation, tutor chat): use
  `toDataStreamResponse()` from Vercel AI SDK. Do not manually
  construct streaming responses.
- Never expose raw Anthropic or Firecrawl error messages to the client.
  Log them server-side, return a safe user-facing message.

## AI Calls

- All AI calls go through `lib/ai/`. No direct `anthropic()` or
  `generateText()` calls in route handlers or components.
- Always set a `maxTokens` cap on every AI call. Never leave it
  unbounded.
- Always pass a `system` prompt that scopes the model to the docs
  context. Never let the tutor answer from general knowledge alone.
- For roadmap and quiz generation: use `generateObject` with a Zod
  schema. This is non-negotiable — it is the only safe way to consume
  structured LLM output.
- Firecrawl content is capped at 80,000 characters before being passed
  to any prompt. Truncate from the bottom, preserve the top.
- Log token usage server-side for every call. This is how you catch
  runaway cost before it becomes a problem.

## Data and Storage

- Metadata and relational data belong in Convex.
- Large generated text (lesson content) is stored as a string field
  on the Lesson document after first generation — not re-fetched from
  the AI on every load.
- Raw Firecrawl markdown is stored temporarily during the import flow
  and then discarded once the roadmap is generated. It is not persisted
  long-term in MVP.
- Never store API keys, tokens, or secrets in Convex documents.
- All Convex mutations include a `userId` ownership check as the first
  operation.

## File Organization

- `app/` — Pages and route handlers only. No logic.
- `app/api/` — One file per endpoint. Input validation and auth only.
- `lib/ai/` — AI pipeline functions: `generateRoadmap.ts`,
  `generateLesson.ts`, `tutorChat.ts`, `crawlDocs.ts`
- `lib/convex/` — Typed wrappers around Convex queries and mutations
- `lib/types.ts` — Shared TypeScript interfaces and types
- `lib/validators.ts` — Zod schemas for API input validation and
  AI output schemas
- `components/` — Shared presentational components. One component
  per file. Named exports.
- `components/ui/` — shadcn/ui only. Never edit manually.
- `convex/` — Schema, queries, mutations. One file per domain entity.
