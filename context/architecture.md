# Architecture Context

## Stack

| Layer       | Technology                     | Role                                              |
| ----------- | ------------------------------ | ------------------------------------------------- |
| Framework   | Next.js 15 + TypeScript        | App shell, routing, server components, API routes |
| UI          | Tailwind CSS + shadcn/ui       | Styling system and component primitives           |
| Auth        | Clerk                          | Authentication, session management, user identity |
| Database    | Convex                         | Primary database, real-time progress sync         |
| AI SDK      | Vercel AI SDK (`ai` package)   | Streaming text, structured object generation, chat |
| LLM         | Anthropic Claude Sonnet 4.5    | Roadmap generation, lesson generation, tutor chat |
| Crawling    | Firecrawl API                  | Docs URL crawling and markdown extraction         |
| Validation  | Zod                            | Schema validation for AI-generated JSON output    |
| Deployment  | Vercel                         | Hosting, edge functions, env management           |

## System Boundaries

- `app/` — Next.js App Router pages and route handlers. No business
  logic here — pages compose components, routes delegate to lib/
- `app/api/` — API route handlers. Each file handles one endpoint.
  Input validation happens here before anything else runs.
- `lib/` — All core logic: AI calls, Firecrawl integration, Convex
  query helpers. This is where the product actually lives.
- `lib/ai/` — All Vercel AI SDK calls: crawl-to-roadmap pipeline,
  lesson generator, tutor chat handler. One file per concern.
- `lib/convex/` — Convex query and mutation wrappers. No raw Convex
  calls outside this folder.
- `components/` — Shared UI components. No data fetching here — props
  only. Data flows in from server components or React Query hooks.
- `components/ui/` — shadcn/ui primitives. Never modified manually.
  Always updated via `npx shadcn add`.
- `convex/` — Convex schema, queries, and mutations. Single source of
  truth for the data model.

## Storage Model

- **Convex (primary DB)**: Users, courses, topics, lessons metadata,
  progress records, chat message history, quiz scores. All relational
  data and anything that needs real-time sync.
- **In-memory / streaming**: Raw docs markdown from Firecrawl and
  generated lesson content are held in memory during generation and
  streamed directly to the client. They are NOT stored in the DB to
  keep costs low in MVP.
- **Convex (generated content cache)**: Once a lesson is generated,
  store the output as a string field on the Lesson document so the
  user does not regenerate it on every open. Invalidate only on
  explicit user request.

## Auth and Access Model

- Every user signs in via Clerk. Clerk user ID is the foreign key
  across all Convex documents.
- Every Course belongs to exactly one user (owner). No shared courses
  in MVP.
- All Convex mutations check that `ctx.auth.userId` matches the
  document's `userId` before writing. No mutation runs unauthenticated.
- API routes extract and verify Clerk session before calling any lib
  function. A missing or invalid session returns 401 immediately.
- Firecrawl and Anthropic API keys are server-side only. Never
  referenced on the client.

## Invariants

1. **No raw AI calls in components or pages.** All LLM calls live in
   `lib/ai/`. Components receive data — they do not call AI APIs.
2. **No Convex calls outside `lib/convex/`**. All query and mutation
   logic is wrapped and exported from that folder.
3. **`generateObject` for all structured output.** Roadmap and quiz
   generation always use `generateObject` with a Zod schema — never
   parse free-form LLM text manually.
4. **Firecrawl runs once per course.** Raw markdown is extracted on
   import and cached. It is never re-crawled unless the user explicitly
   triggers a refresh.
5. **Lesson content is scoped to its docs context.** The tutor system
   prompt always includes the docs markdown for that topic. The tutor
   never answers from general knowledge alone.
6. **No background jobs in MVP.** Crawling and generation are triggered
   synchronously by user action and streamed back. No queues, no cron,
   no workers. If it needs a queue, descope it.
7. **`npm run build` must pass before any feature is considered done.**
   No shipping with TypeScript errors suppressed by `any` or `@ts-ignore`.
