# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

Phase 6 (AI Tutor) - In progress: validating scoped tutor behavior in the lesson page.

## Current Goal

Validate `POST /api/chat` and the lesson-page tutor experience against generated lesson context.

## Completed

- Context files authored and finalized (all 6 docs)
- 01-design-system: Install and configure shadcn/ui and basic components
- Scaffolded Next.js 16 app with TypeScript
- Configured Tailwind CSS v4 and removed Next.js default boilerplate
- Installed base shadcn/ui components (Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea)
- Verified production build (`npm run build`) passes on base scaffold
- 02-convex-clerk-setup: Integrated Convex and Clerk (Auth, Webhooks, Middleware)
- 03-firecrawl-implementation: Implemented `lib/firecrawl.ts` and `POST /api/crawl`.
- Fixed root layout structure to comply with Next.js App Router rules.
- 04-roadmap-generation: Implemented AI roadmap pipeline using Gemini 3.5 Flash, Convex schema, and core UI.
- Standardized Convex action/mutation validation (fixed hyphenated keys issue).
- Verified type safety across the roadmap generation unit (zero `any` types).
- Synchronized `development` and `main` branches.
- Authored feature spec for `05-lesson-generation`.
- 05-lesson-generation: Implemented streaming lesson generation with docs context and caching. [Done]
- Resolved all syntax, build, and lint issues for production readiness. [Done]
- Fixed AI SDK v6 chat integration on the lesson page and tutor API route. [Done]
- Verified and fixed still-valid inline review findings for tutor chat, lesson generation persistence, lesson null states, import failures, and Convex lesson access. [Done]

## In Progress

- Phase 6 (AI Tutor): Continue validating scoped tutor behavior in the lesson page.

## Next Up

- Implement progress tracking mutations and quiz validation.
- Dashboard course list and course deletion.

## Open Questions

- **Token cost control**: Firecrawl returns up to 50 pages. Average
  docs page is ~1,500 tokens. At 50 pages that is 75,000 tokens in
  context for roadmap generation. Is this acceptable cost at MVP scale,
  or do we chunk and summarize first? Decision needed before building
  the roadmap generation step.

- **Lesson caching strategy**: If a user opens a lesson, we generate
  and cache it. If the docs URL is updated upstream, the cached lesson
  is stale. For MVP, do we just never invalidate (simplest), or add a
  manual "regenerate" button per lesson? Lean toward manual regenerate
  button — resolve before building lesson caching.

- **Free tier limits**: How many courses does a free user get? How many
  lessons per course? Needs a decision before building the usage cap
  logic. Suggested starting point: 3 courses / unlimited lessons on
  free tier. Revisit after launch based on actual API cost per course.

- **Firecrawl crawl depth**: Should we crawl sub-paths only (same
  domain, same path prefix) or the full domain? Crawling the full
  Next.js domain would include blog, showcase, etc. — not useful for
  learning. Need to enforce path-prefix scoping in the crawl call.
  Resolve before building crawl endpoint.

- **Empty lesson state**: If a crawled docs page has minimal content
  (e.g. a changelog or nav page), the generated lesson will be thin.
  Do we skip topics below a content threshold, or let them generate
  and show a "limited content" label? Decide before lesson generation.

## Architecture Decisions

- **Convex over Postgres**: Chosen because real-time progress sync
  is core to the UX and Convex handles it without a separate WebSocket
  layer. Also aligns with existing stack familiarity. Trade-off: less
  flexible querying, but acceptable for MVP data access patterns.

- **No vector DB in MVP**: Firecrawl markdown is passed directly in
  the lesson/tutor prompt context (truncated at 80k chars). This is
  sufficient for MVP because individual docs sections are small enough
  to fit in context. If docs are too large to fit, we will add chunking
  and Convex vector search in a later phase — not now.

- **On-demand lesson generation with caching**: Lessons are not
  pre-generated for the entire roadmap on import. They generate on
  first open and are cached in Convex. This keeps import fast (<30s)
  and avoids generating lessons the user never reads.

- **Single LLM for all tasks (Gemini 3.5 Flash)**: Using one model
  for roadmap, lesson, and tutor rather than mixing models. Simplifies
  cost tracking and debugging. If tutor chat needs to be cheaper at
  scale, swap to a model like Haiku for chat only — not now.

- **Firecrawl over custom crawler**: Docs sites have wildly varying
  HTML structure. Building a robust crawler is a product in itself.
  Firecrawl abstracts this away. Cost per crawl is acceptable for MVP
  volume.

## Session Notes

- Context files were generated from the DocTutor AI PRD. The PRD
  scoped too broadly — these context files deliberately cut scope to
  the core URL → roadmap → lesson → tutor loop only.
- First target docs for testing during build: Next.js docs
  (nextjs.org/docs), Tailwind CSS, Convex docs. These are well-structured
  and representative of the target audience.
- The most important thing to get right early is the roadmap generation
  prompt. Spend time on prompt quality before building UI around it.
  Bad AI output cannot be fixed with better UI.
