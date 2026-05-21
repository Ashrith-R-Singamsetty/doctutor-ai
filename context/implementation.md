# DocTutor AI — Master Implementation Spec

**Version**: 1.0  
**Status**: Ready to execute  
**Read before starting any session**: Also open `architecture.md`,
`code-standards.md`, and `progress-tracker.md` alongside this file.

---

## How to Use This File

Each step below is a single, verifiable unit of work. Before starting
a step, read its full block. After completing it, mark it done in
`progress-tracker.md` and confirm the verification check passes before
moving to the next step. Never combine two steps into one session unless
they are explicitly grouped.

---

## Goal

Build the complete DocTutor AI MVP — a web application that converts
any software documentation URL into a structured, AI-generated learning
course with lessons, exercises, quizzes, and a context-aware tutor —
following the architecture, code standards, and UI spec defined in the
context files.

---

## Design Decisions (Pre-resolved)

- Stack: Next.js 15, TypeScript strict, Tailwind, shadcn/ui, Convex,
  Clerk, Vercel AI SDK, Anthropic Claude Sonnet 4.5, Firecrawl
- Dark theme only. Color tokens in CSS variables. No hardcoded hex.
- `generateObject` + Zod for all structured AI output. No free-form
  JSON parsing.
- Lessons generate on-demand (first open), cache result in Convex.
- No background job queue. All generation is streamed synchronously.
- No vector DB in MVP. Firecrawl markdown passed directly in context.
- Firecrawl content capped at 80,000 characters before any AI call.
- Free tier: 3 courses max. Paid tier: unlimited.
- All Convex mutations verify `userId` ownership before writing.
- `npm run build` must pass after every completed step.

---

## Implementation Steps

---

### PHASE 1 — PROJECT SCAFFOLDING

---

#### Step 01 — Initialize Next.js Project

**Goal**: Get a clean Next.js 15 app running with TypeScript, Tailwind,
and shadcn/ui initialized. No feature code yet.

**Implementation Instructions**:
- Run `npx create-next-app@latest doctutor --typescript --tailwind
  --app --eslint --src-dir=false --import-alias="@/*"`
- Remove all default content from `app/page.tsx` — replace with a
  single `<h1>DocTutor AI</h1>` placeholder
- Delete `app/globals.css` default content — keep the file but empty it
- Run `npx shadcn@latest init` — choose: style `Default`, base color
  `Neutral`, CSS variables `yes`
- Install Geist font: `npm install geist`
- Configure `app/layout.tsx` to use `GeistSans` and `GeistMono`
  from the `geist` package
- Add all CSS custom property tokens from `ui-context.md` to
  `app/globals.css` under `:root`
- Set `background-color: var(--bg-base)` and `color: var(--text-primary)`
  on `body` in `globals.css`

**Verification**:
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` passes
- [ ] Page background is `#0a0a0a` in browser
- [ ] Geist font renders on the placeholder heading
- [ ] No TypeScript errors in terminal

---

#### Step 02 — Install and Configure All Dependencies

**Goal**: Install every package the project needs in one step so
dependency issues surface early and not mid-feature.

**Implementation Instructions**:
- Install production deps:
  ```
  npm install ai @ai-sdk/anthropic @firecrawl/firecrawl convex
  @clerk/nextjs zod lucide-react server-only
  ```
- Install dev deps:
  ```
  npm install -D @types/node
  ```
- Add shadcn components used across the app:
  ```
  npx shadcn add button input label card badge progress
  separator skeleton tabs textarea dialog sheet scroll-area
  ```
- Create `.env.local` with all required keys (empty values):
  ```
  NEXT_PUBLIC_CONVEX_URL=
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
  CLERK_SECRET_KEY=
  ANTHROPIC_API_KEY=
  FIRECRAWL_API_KEY=
  ```
- Create `.env.example` with the same keys and placeholder comments
  explaining where to get each one

**Verification**:
- [ ] `npm run build` passes after all installs
- [ ] All shadcn components exist in `components/ui/`
- [ ] `.env.example` committed to repo, `.env.local` in `.gitignore`
- [ ] No peer dependency warnings that affect runtime behavior

---

#### Step 03 — Configure Convex

**Goal**: Connect Convex to the project and define the complete data
schema. No queries or mutations yet — schema only.

**Implementation Instructions**:
- Run `npx convex dev` — follow prompts to create a new Convex project
- Define `convex/schema.ts` with the following tables:

  ```
  courses: {
    userId: string (indexed)
    sourceUrl: string
    title: string
    skillLevel: "beginner" | "intermediate" | "advanced"
    goal: string
    status: "importing" | "ready" | "error"
    rawDocsContent: string   // Firecrawl markdown, capped at 80k chars
    createdAt: number
  }

  topics: {
    courseId: Id<"courses"> (indexed)
    title: string
    description: string
    orderIndex: number
  }

  lessons: {
    topicId: Id<"topics"> (indexed)
    courseId: Id<"courses"> (indexed)
    title: string
    objective: string
    difficulty: "beginner" | "intermediate" | "advanced"
    generatedContent: string | null  // cached lesson markdown
    orderIndex: number
    createdAt: number
  }

  progress: {
    userId: string
    lessonId: Id<"lessons">
    courseId: Id<"courses">
    completed: boolean
    quizScore: number | null
    exerciseCompleted: boolean
    updatedAt: number
  }

  chatMessages: {
    lessonId: Id<"lessons">
    userId: string
    role: "user" | "assistant"
    content: string
    createdAt: number
  }
  ```

- Add compound indexes where needed:
  `progress`: index on `["userId", "lessonId"]`
  `chatMessages`: index on `["lessonId", "userId"]`

**Verification**:
- [ ] `npx convex dev` runs without schema errors
- [ ] All tables appear in Convex dashboard
- [ ] No TypeScript errors in `convex/schema.ts`

---

#### Step 04 — Configure Clerk Auth

**Goal**: Add authentication to the app. All pages are public by
default except `/dashboard` and `/course/*`. Sign-in redirects to
dashboard.

**Implementation Instructions**:
- Wrap `app/layout.tsx` children in `<ClerkProvider>`
- Create `middleware.ts` at project root:
  - Protect routes: `/dashboard(.*)` and `/course(.*)`
  - Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`
  - Use `clerkMiddleware` from `@clerk/nextjs/server`
- Create `app/sign-in/[[...sign-in]]/page.tsx` — render
  `<SignIn>` component centered on a dark page
- Create `app/sign-up/[[...sign-up]]/page.tsx` — render
  `<SignUp>` component centered on a dark page
- Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
  to `.env.local`
- Set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and
  `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` in `.env.local`

**Verification**:
- [ ] Visiting `/dashboard` while signed out redirects to `/sign-in`
- [ ] After sign-in, user is redirected back to `/dashboard`
- [ ] `auth()` from `@clerk/nextjs/server` returns a valid userId in
  a server component on `/dashboard`
- [ ] `npm run build` passes

---

### PHASE 2 — DATA LAYER

---

#### Step 05 — Convex Queries: Courses

**Goal**: Write all Convex query and mutation functions for the
`courses` table. No UI yet.

**Implementation Instructions**:
- Create `convex/courses.ts`
- Write the following functions:

  `getCoursesByUser(userId)` — query, returns all courses for a user,
  ordered by `createdAt` descending. Indexes by `userId`.

  `getCourseById(courseId)` — query, returns single course. Does NOT
  enforce ownership — ownership is checked in the API route.

  `createCourse(userId, sourceUrl, title, skillLevel, goal)` —
  mutation, inserts a new course with `status: "importing"`,
  returns the new course ID.

  `updateCourseStatus(courseId, status)` — mutation, updates status
  field only. Used by import pipeline to mark `"ready"` or `"error"`.

  `updateCourseContent(courseId, rawDocsContent, title)` — mutation,
  stores Firecrawl markdown and final title after generation.

  `deleteCourse(courseId, userId)` — mutation, verifies userId matches
  course.userId before deleting. Also deletes all child topics,
  lessons, progress, and chatMessages for this course.

**Verification**:
- [ ] All functions are typed with `v` validators from `convex/values`
- [ ] `deleteCourse` refuses to delete if userId does not match
- [ ] No TypeScript errors in `convex/courses.ts`

---

#### Step 06 — Convex Queries: Topics and Lessons

**Goal**: Write all Convex functions for `topics` and `lessons` tables.

**Implementation Instructions**:
- Create `convex/topics.ts`:

  `getTopicsByCourse(courseId)` — query, returns all topics for a
  course ordered by `orderIndex` ascending.

  `createTopic(courseId, title, description, orderIndex)` — mutation,
  inserts a topic.

  `bulkCreateTopics(topics[])` — mutation, inserts multiple topics in
  one call. Used by roadmap generation pipeline.

- Create `convex/lessons.ts`:

  `getLessonsByTopic(topicId)` — query, returns lessons ordered by
  `orderIndex` ascending.

  `getLessonsByCourse(courseId)` — query, returns all lessons for
  a course (for progress overview).

  `getLessonById(lessonId)` — query, returns single lesson.

  `createLesson(topicId, courseId, title, objective, difficulty,
  orderIndex)` — mutation, inserts lesson with
  `generatedContent: null`.

  `bulkCreateLessons(lessons[])` — mutation, inserts multiple lessons.

  `cacheLessonContent(lessonId, content)` — mutation, writes the
  generated markdown string to `generatedContent`.

**Verification**:
- [ ] `bulkCreateTopics` and `bulkCreateLessons` work transactionally
- [ ] `getLessonById` returns `generatedContent: null` for a
  newly created lesson
- [ ] No TypeScript errors

---

#### Step 07 — Convex Queries: Progress and Chat

**Goal**: Write all Convex functions for `progress` and `chatMessages`.

**Implementation Instructions**:
- Create `convex/progress.ts`:

  `getProgressByLesson(userId, lessonId)` — query, returns progress
  record or null if not started.

  `getProgressByCourse(userId, courseId)` — query, returns all
  progress records for a user for a given course.

  `upsertProgress(userId, lessonId, courseId, fields)` — mutation,
  insert or update using the `["userId", "lessonId"]` index.
  Only updates fields that are explicitly passed.

- Create `convex/chat.ts`:

  `getMessagesByLesson(lessonId, userId)` — query, returns all messages
  ordered by `createdAt` ascending.

  `createMessage(lessonId, userId, role, content)` — mutation, inserts
  one message.

  `clearMessages(lessonId, userId)` — mutation, deletes all messages
  for a lesson/user pair. Used by "clear chat" UI button.

**Verification**:
- [ ] `upsertProgress` creates a new record if none exists
- [ ] `upsertProgress` updates an existing record without duplicating
- [ ] No TypeScript errors

---

### PHASE 3 — AI PIPELINE (lib layer)

---

#### Step 08 — Firecrawl Integration: `lib/ai/crawlDocs.ts`

**Goal**: Build the docs crawling function. Takes a URL, returns
cleaned markdown capped at 80,000 characters.

**Implementation Instructions**:
- Add `import "server-only"` at top of file
- Create `crawlDocs(url: string): Promise<CrawlResult>` where:
  ```
  type CrawlResult = {
    success: boolean
    markdown: string     // capped at 80,000 chars
    pageCount: number
    error?: string
  }
  ```
- Use `FirecrawlApp` from `@firecrawl/firecrawl`
- Crawl with `limit: 50`, `scrapeOptions: { formats: ["markdown"] }`
- Concatenate all page markdown with `\n\n---\n\n` separators
- Truncate total string to 80,000 characters — truncate from the
  bottom, preserve from the top
- Wrap in try/catch — return `{ success: false, error: message }`
  on any Firecrawl error — never throw to the route handler
- Log to console: URL, page count, final character count, truncated
  (yes/no)

**Verification**:
- [ ] Test with `https://docs.convex.dev/` — returns markdown with
  page count > 1
- [ ] Result is always ≤ 80,000 characters even for large sites
- [ ] Function does not throw — returns error shape on failure
- [ ] `server-only` import prevents accidental client-side use

---

#### Step 09 — Roadmap Generation: `lib/ai/generateRoadmap.ts`

**Goal**: Takes docs markdown + skill level + goal, returns a fully
typed roadmap via `generateObject` with Zod validation.

**Implementation Instructions**:
- Add `import "server-only"` at top
- Define Zod schemas:
  ```
  const LessonSchema = z.object({
    id: z.string(),
    title: z.string(),
    objective: z.string(),
    difficulty: z.enum(["beginner","intermediate","advanced"])
  })

  const TopicSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    lessons: z.array(LessonSchema)
  })

  const RoadmapSchema = z.object({
    courseTitle: z.string(),
    topics: z.array(TopicSchema)
  })
  ```
  Export `RoadmapSchema` and its inferred type `Roadmap`.

- Call `generateObject` with:
  - Model: `anthropic("claude-sonnet-4-5")`
  - Schema: `RoadmapSchema`
  - `maxTokens: 4000`
  - System prompt: instructs Claude to act as a curriculum designer,
    use only the provided docs as source of truth, never invent topics
    not present in the docs, order topics from fundamentals to advanced
  - User prompt: includes skill level, goal, and the docs markdown

- Return the validated object directly — no post-processing needed
  because Zod guarantees the shape

- Log token usage: `console.log("[roadmap] tokens:", usage)`

**Verification**:
- [ ] Returns correctly typed `Roadmap` object for Next.js docs
- [ ] Topic order goes from fundamentals to advanced (manual check)
- [ ] No lesson titles reference concepts not present in the docs
- [ ] TypeScript infers the return type correctly without casting

---

#### Step 10 — Lesson Generation: `lib/ai/generateLesson.ts`

**Goal**: Takes a lesson definition + relevant docs context, streams
a complete lesson markdown document.

**Implementation Instructions**:
- Add `import "server-only"` at top
- Create `generateLesson(params: GenerateLessonParams)` where:
  ```
  type GenerateLessonParams = {
    lessonTitle: string
    objective: string
    difficulty: string
    docsContext: string  // relevant section of raw docs markdown
    topicTitle: string
  }
  ```
- Use `streamText` from Vercel AI SDK
- Model: `anthropic("claude-sonnet-4-5")`
- `maxTokens: 2000`
- System prompt: scopes Claude to docs-only answers, instructs it
  to never reference APIs not in the docs context, instructs it to
  use beginner-friendly language for the opening explanation even on
  advanced lessons
- User prompt: structured template requesting:
  1. ## Overview (2–3 sentences)
  2. ## Explanation (plain language, then technical detail)
  3. ## Code Example (with inline comments)
  4. ## Common Mistake (one real mistake developers make)
  5. ## Exercise (one hands-on task the user must complete)
  6. ## Quiz (exactly 3 multiple-choice questions as a JSON block
     at the end — format defined in prompt)

- Return the `streamText` result object — the route handler calls
  `.toDataStreamResponse()` on it

**Verification**:
- [ ] Streaming response renders progressively in browser
- [ ] All 6 sections present in generated lesson output
- [ ] Quiz JSON block is parseable at the end of the stream
- [ ] No hallucinated API methods when tested against Tailwind docs

---

#### Step 11 — Tutor Chat: `lib/ai/tutorChat.ts`

**Goal**: Returns a streaming chat response scoped to the lesson and
docs context.

**Implementation Instructions**:
- Add `import "server-only"` at top
- Create `tutorChat(params: TutorChatParams)` where:
  ```
  type TutorChatParams = {
    messages: CoreMessage[]     // from Vercel AI SDK
    lessonTitle: string
    lessonContent: string       // cached generated content
    docsContext: string         // raw docs markdown for this topic
  }
  ```
- Use `streamText` with `anthropic("claude-sonnet-4-5")`
- `maxTokens: 800` — tutor answers should be short
- System prompt rules:
  - Answer only using the lesson content and docs context provided
  - If the answer is not in the context, say: "I don't see that
    covered in this section of the docs — you may want to check
    [topic name] directly."
  - Keep answers short: max 3 paragraphs or a short code snippet
  - Always end with one follow-up suggestion if relevant
  - Never answer general programming questions unrelated to the
    current lesson topic

- Return the `streamText` result — route handler calls
  `.toDataStreamResponse()`

**Verification**:
- [ ] Tutor answer stays on-topic for the lesson context
- [ ] Responds correctly to "what does this code do?" questions
  about the lesson's code example
- [ ] Returns the fallback message when asked about out-of-scope topics

---

### PHASE 4 — API ROUTES

---

#### Step 12 — API Route: `POST /api/crawl`

**Goal**: Accepts a docs URL, runs Firecrawl, returns markdown and
page count. Auth required.

**Implementation Instructions**:
- Create `app/api/crawl/route.ts`
- Input Zod schema:
  ```
  z.object({ url: z.string().url() })
  ```
- Steps in handler:
  1. Parse and validate body — 400 on failure
  2. Verify Clerk session via `auth()` — 401 if no userId
  3. Validate that URL is http or https — reject file:// etc.
  4. Call `crawlDocs(url)` from `lib/ai/crawlDocs.ts`
  5. If crawl fails, return `{ error: "Failed to crawl documentation.
     Check that the URL is publicly accessible." }` with 422
  6. Return `{ markdown, pageCount }` with 200
- Never expose the raw Firecrawl error to the client

**Verification**:
- [ ] Returns 401 when called without auth header
- [ ] Returns 400 for a non-URL body
- [ ] Returns markdown for `https://docs.convex.dev/`
- [ ] Returns 422 for a valid URL that is not publicly accessible

---

#### Step 13 — API Route: `POST /api/import`

**Goal**: Orchestrates the full import pipeline — crawl, generate
roadmap, write to Convex. Returns the new course ID.

**Implementation Instructions**:
- Create `app/api/import/route.ts`
- Input Zod schema:
  ```
  z.object({
    url: z.string().url(),
    skillLevel: z.enum(["beginner","intermediate","advanced"]),
    goal: z.string().min(10).max(300)
  })
  ```
- Steps in handler:
  1. Validate input — 400 on failure
  2. Verify Clerk auth — 401 if not signed in
  3. Count user's existing courses via Convex — if ≥ 3 and user is
     on free tier, return 403 with message: "Free tier limit reached.
     Upgrade to import more courses."
  4. Create a new course record in Convex with `status: "importing"`
     — get back `courseId`
  5. Call `crawlDocs(url)` — if fails, update course to
     `status: "error"` and return 422
  6. Call `generateRoadmap(markdown, skillLevel, goal)`
  7. Write roadmap to Convex: `updateCourseContent`, then
     `bulkCreateTopics`, then `bulkCreateLessons` (with
     `generatedContent: null`)
  8. Update course to `status: "ready"`
  9. Return `{ courseId }` with 200
- The entire pipeline runs synchronously — stream progress updates
  using `TransformStream` so the client can show a live log (see Step 21)

**Verification**:
- [ ] End-to-end: POST with a valid Next.js docs URL creates a course
  with topics and lessons in Convex
- [ ] Returns 403 when free user already has 3 courses
- [ ] Course status becomes "error" if Firecrawl fails
- [ ] All created lessons have `generatedContent: null`

---

#### Step 14 — API Route: `POST /api/lesson/[lessonId]`

**Goal**: Returns a streaming lesson. Generates fresh if uncached,
returns cached content if already generated.

**Implementation Instructions**:
- Create `app/api/lesson/[lessonId]/route.ts`
- Steps in handler:
  1. Verify Clerk auth — 401 if not signed in
  2. Fetch lesson from Convex by `lessonId`
  3. Verify user owns the parent course — 403 if not
  4. If `lesson.generatedContent` is not null, return it as a plain
     text stream (wrap in `ReadableStream` to keep the client-side
     `useCompletion` hook happy)
  5. If null: fetch the parent course's `rawDocsContent`, call
     `generateLesson(params)`, pipe the stream to the response AND
     simultaneously collect the full text to cache in Convex via
     `cacheLessonContent(lessonId, fullText)` using a
     `TransformStream`

**Verification**:
- [ ] First call generates and streams content
- [ ] Second call for the same lesson returns instantly (cached)
- [ ] Cached content is identical to streamed content
- [ ] Returns 403 when a user tries to access another user's lesson

---

#### Step 15 — API Route: `POST /api/chat`

**Goal**: Streaming tutor chat endpoint. Scoped to a lesson.

**Implementation Instructions**:
- Create `app/api/chat/route.ts`
- Input Zod schema:
  ```
  z.object({
    messages: z.array(z.object({
      role: z.enum(["user","assistant"]),
      content: z.string()
    })),
    lessonId: z.string()
  })
  ```
- Steps in handler:
  1. Validate input — 400 on failure
  2. Verify Clerk auth — 401
  3. Fetch lesson from Convex — 404 if not found
  4. Verify user owns parent course — 403
  5. Fetch lesson's parent course `rawDocsContent` for context
  6. Call `tutorChat({ messages, lessonTitle, lessonContent,
     docsContext })`
  7. Persist user's latest message to Convex `chatMessages` table
     (fire-and-forget mutation, do not await before streaming)
  8. Return `.toDataStreamResponse()`

**Verification**:
- [ ] `useChat` hook on the frontend receives streamed tokens
- [ ] Returns 403 for lessons not owned by the user
- [ ] User message is saved to Convex after the call

---

#### Step 16 — API Route: `POST /api/progress/complete`

**Goal**: Marks a lesson as complete and saves quiz score.

**Implementation Instructions**:
- Create `app/api/progress/complete/route.ts`
- Input Zod schema:
  ```
  z.object({
    lessonId: z.string(),
    quizScore: z.number().min(0).max(3).optional(),
    exerciseCompleted: z.boolean().optional()
  })
  ```
- Verify auth, verify ownership of the lesson's parent course
- Call `upsertProgress` Convex mutation
- Return `{ success: true }`

**Verification**:
- [ ] Creates a new progress record on first call
- [ ] Updates existing record on second call — no duplicate rows
- [ ] Returns 403 for lessons not owned by the user

---

### PHASE 5 — PAGE AND COMPONENT LAYER

---

#### Step 17 — Root Layout and Navigation

**Goal**: Build the persistent app shell — top navigation bar with
logo, user avatar, and sign-out. Apply global font and background.

**Implementation Instructions**:
- Update `app/layout.tsx`:
  - Wrap in `<ClerkProvider>`
  - Apply `font-sans` and `font-mono` CSS variables to `<html>`
  - Background is `bg-[--bg-base]` via `body` class
- Create `components/Navbar.tsx`:
  - Logo: "DocTutor" text in `text-[--text-primary]` with a small
    purple dot accent after it
  - Right side: `<UserButton>` from Clerk when signed in, or
    Sign in / Sign up links when signed out
  - Fixed to top, `border-b border-[--border-default]`,
    `bg-[--bg-base]/80 backdrop-blur-sm`
  - Height: `h-14`
- Use `<Navbar>` in `app/layout.tsx` above `{children}`

**Verification**:
- [ ] Navbar appears on all pages
- [ ] Clerk UserButton renders and clicking it shows sign-out option
- [ ] Navbar is sticky on scroll
- [ ] Background blur effect visible when content scrolls under navbar

---

#### Step 18 — Landing Page (`app/page.tsx`)

**Goal**: Marketing landing page for signed-out users. Signed-in
users are redirected to `/dashboard`.

**Implementation Instructions**:
- Check auth state server-side — if signed in, `redirect("/dashboard")`
- Build a centered single-column layout:
  - Hero: Large headline "Paste docs. Get a course."  
    Subheadline: "Turn any software documentation into a structured
    learning path with AI-generated lessons, exercises, and a
    built-in tutor."
  - CTA button: "Start learning free" → `/sign-up`
  - Example roadmap preview: a static mockup (hardcoded) showing
    a Tailwind CSS roadmap with 4 topics and their lesson titles —
    use real Tailwind topic names to make it feel authentic
  - Section: "Works with any docs" — show logos or text labels for
    Next.js, Vercel, Tailwind, Convex, Supabase, Prisma
  - Footer: minimal — copyright line only

**Verification**:
- [ ] Signed-in users are redirected to `/dashboard` immediately
- [ ] CTA button navigates to `/sign-up`
- [ ] Page renders correctly at mobile and desktop widths

---

#### Step 19 — Dashboard Page (`app/dashboard/page.tsx`)

**Goal**: Shows the user's courses as a grid of cards with progress
indicators. Entry point to the app for signed-in users.

**Implementation Instructions**:
- Server component — fetch courses from Convex using `userId` from
  `auth()`
- Layout: sidebar nav on the left (w-56), main content area on the right
- Sidebar nav items:
  - Dashboard (active state with purple left border)
  - No other links in MVP
  - User avatar and email at the bottom using Clerk `currentUser()`
- Main area:
  - Heading: "My Courses"
  - "Import docs" button (primary) → opens import modal or navigates
    to `/import`
  - If no courses: empty state — illustration using Lucide icon
    (`BookOpen`, h-10 w-10, `--text-muted`), text "No courses yet.
    Paste a docs URL to get started.", CTA button
  - If courses exist: responsive grid (1 col mobile, 2 col md,
    3 col lg) of `<CourseCard>` components

- Create `components/CourseCard.tsx`:
  - Shows: course title, source URL (truncated), skill level badge,
    creation date, lesson completion count (e.g. "3 / 12 lessons")
  - Status indicator: small colored dot — orange for "importing",
    green for "ready", red for "error"
  - Hover state: subtle border brightens to `--accent-primary`
  - Click: navigates to `/course/[courseId]`
  - Three-dot menu (Lucide `MoreHorizontal`) → dropdown with
    "Delete course" option — confirm dialog before deletion

**Verification**:
- [ ] Empty state renders correctly for a new user
- [ ] Course cards render with accurate lesson counts from Convex
- [ ] Delete course removes the card immediately (optimistic UI)
- [ ] Status dot shows correct color for each status

---

#### Step 20 — Import Page (`app/import/page.tsx`)

**Goal**: The URL input form. User pastes a docs URL, selects skill
level and goal, submits.

**Implementation Instructions**:
- Create as a client component (`"use client"`)
- Form layout (centered, max-w-lg):
  - Section heading: "Import documentation"
  - URL input: placeholder "https://nextjs.org/docs", full width
  - Skill level: three toggle buttons (Beginner / Intermediate /
    Advanced) — not a dropdown — highlight active with accent bg
  - Goal textarea: placeholder "e.g. I want to build a full-stack
    app with server actions and Postgres in 2 weeks", max 300 chars,
    character counter below
  - Import button: full width, primary
- On submit: POST to `/api/import`
- After submit: transition to a progress log view (see Step 21)
- Validation: URL must be non-empty and a valid URL before submit
  button is enabled. Goal must be at least 10 characters.
- Back link: "← Back to dashboard" at top

**Verification**:
- [ ] Import button is disabled until URL and goal are valid
- [ ] Character counter updates in real time for goal textarea
- [ ] All three skill level buttons work — only one selected at a time
- [ ] Navigates away from import form when submission starts

---

#### Step 21 — Import Progress Stream UI

**Goal**: After submitting the import form, show a live streaming
progress log while the crawl and roadmap generation runs.

**Implementation Instructions**:
- After form submit, switch the page to a progress log view
  (same page, conditional render)
- POST to `/api/import` — the route streams newline-delimited JSON
  progress events, e.g.:
  ```
  { "step": "crawling", "message": "Fetching documentation pages..." }
  { "step": "crawling", "message": "Found 34 pages" }
  { "step": "generating", "message": "Analyzing topic structure..." }
  { "step": "generating", "message": "Writing roadmap..." }
  { "step": "saving", "message": "Saving course..." }
  { "step": "done", "courseId": "abc123" }
  ```
- Read the stream using `ReadableStream` in the browser — update a
  `string[]` state array with each new message
- Render each message as a new line in a `<ScrollArea>` — monospace
  font (`--font-mono`), `text-sm`, `text-[--text-muted]`
- Show a pulsing dot next to the latest line while still streaming
- On `step: "done"`: wait 1 second, then `router.push("/course/[courseId]")`
- On error: show error message with a "Try again" button

**Verification**:
- [ ] Log lines appear one by one as the pipeline runs
- [ ] Pulsing dot moves to the latest line
- [ ] Auto-redirects to course page on completion
- [ ] Error message appears if the API returns an error status

---

#### Step 22 — Course / Roadmap Page (`app/course/[courseId]/page.tsx`)

**Goal**: Shows the full roadmap for a course — all topics and
lessons — with completion state.

**Implementation Instructions**:
- Server component — fetch course, topics, lessons, and progress
  from Convex
- Verify the course belongs to the current user — 404 page if not
- If `course.status === "importing"`: show a skeleton roadmap
  with a "Generating your roadmap…" status message. Auto-refresh
  every 3 seconds using a client component wrapper.
- Layout (centered, max-w-3xl):
  - Course title as `<h1>`
  - Skill level badge + goal text below title
  - Metadata row: source URL link, creation date, total lesson count
  - Topic sections: each topic is a collapsible section (open by
    default) with topic title and description
  - Inside each topic: ordered list of `<LessonRow>` components
- Create `components/LessonRow.tsx`:
  - Left border colored by progress state (subtle / accent / success)
  - Lesson title, objective text (muted, small), difficulty badge
  - Completion checkmark icon on the right when complete
  - Quiz score badge when available (e.g. "3/3 ✓")
  - Click: navigates to `/course/[courseId]/lesson/[lessonId]`

**Verification**:
- [ ] All topics and lessons render in correct order
- [ ] Completed lessons show green left border
- [ ] Clicking a lesson row navigates to the lesson page
- [ ] Course with "importing" status shows loading skeleton

---

#### Step 23 — Lesson Page (`app/course/[courseId]/lesson/[lessonId]/page.tsx`)

**Goal**: The core learning view. Streams the lesson, renders it,
shows exercise, quiz, and AI tutor sidebar.

**Implementation Instructions**:
- Client component (`"use client"`) — needs streaming hooks
- On mount: POST to `/api/lesson/[lessonId]` and stream response
  using `useCompletion` from `ai/react`
- Layout: two columns — main content (flex-1), tutor sidebar (w-80,
  hidden on mobile with toggle button)
- Main column:
  - Breadcrumb: Course title → Topic title → Lesson title
  - Lesson title as `<h1>`
  - Objective pill badge
  - Streaming lesson content rendered as markdown (use a
    `<MarkdownRenderer>` component — see Step 24)
  - While streaming: show blinking cursor at the end of rendered text
  - After streaming completes: parse the Quiz JSON block from the
    end of the content and render `<QuizSection>` (see Step 25)
  - "Mark as complete" button — calls `/api/progress/complete`
  - Navigation footer: "← Previous lesson" / "Next lesson →"
- Tutor sidebar: `<TutorChat>` component (see Step 26)

**Verification**:
- [ ] Lesson content streams in progressively
- [ ] Quiz renders after streaming completes
- [ ] "Mark as complete" updates the lesson row color on the roadmap
  page when navigating back
- [ ] Previous/Next navigation works correctly at start and end of topic

---

#### Step 24 — Markdown Renderer Component

**Goal**: Render AI-generated lesson markdown with proper styling —
code blocks, inline code, headings, and lists.

**Implementation Instructions**:
- Install: `npm install react-markdown rehype-highlight highlight.js`
- Create `components/MarkdownRenderer.tsx`
- Use `<ReactMarkdown>` with custom component overrides:
  - `code`: if `inline`, render as `<code>` with
    `bg-[--code-bg] text-[--accent-primary] px-1 py-0.5 rounded text-sm`
  - `pre`: render as a styled code block with `--code-bg` background,
    language label top-right, copy button on hover (copies code
    to clipboard using `navigator.clipboard.writeText`)
  - `h2`: `text-xl font-semibold text-[--text-primary] mt-8 mb-3`
  - `h3`: `text-lg font-semibold text-[--text-primary] mt-6 mb-2`
  - `p`: `text-[--text-primary] leading-7 mb-4`
  - `ul`/`ol`: standard spacing, `--text-primary`
  - `li`: `mb-1 leading-7`
  - `strong`: `font-semibold text-[--text-primary]`
- Accept a `streaming?: boolean` prop — when true, append a blinking
  cursor after the last rendered element

**Verification**:
- [ ] Code blocks render with dark background and copy button
- [ ] Copy button copies code to clipboard and shows a brief
  "Copied!" confirmation
- [ ] Headings and paragraphs have correct spacing
- [ ] Blinking cursor appears at end when `streaming={true}`

---

#### Step 25 — Quiz Section Component

**Goal**: Renders the 3 multiple-choice questions from the lesson's
quiz JSON block. Handles answer selection, submission, and scoring.

**Implementation Instructions**:
- Create `components/QuizSection.tsx`
- Accept `quiz: QuizQuestion[]` and `lessonId: string` as props
- Quiz question type:
  ```
  type QuizQuestion = {
    question: string
    options: string[]       // always 4 options
    correctIndex: number
  }
  ```
- Parse the JSON block from the end of the lesson markdown — strip
  the markdown code fence before parsing
- Render: section heading "Check your understanding", 3 questions,
  each with 4 radio button options
- State: track selected answer per question
- "Submit answers" button — disabled until all 3 answered
- On submit: reveal correct/wrong per question (green highlight for
  correct, red for wrong), show score summary (e.g. "You got 2/3")
- On submit: POST to `/api/progress/complete` with `quizScore`

**Verification**:
- [ ] All 3 questions render with 4 options each
- [ ] Submit button disabled until all questions answered
- [ ] Correct answers highlighted green, wrong ones red after submit
- [ ] Score is persisted to Convex after submission
- [ ] Quiz cannot be re-submitted after first submission

---

#### Step 26 — AI Tutor Chat Component

**Goal**: A persistent chat sidebar on the lesson page. Uses
`useChat` from Vercel AI SDK.

**Implementation Instructions**:
- Create `components/TutorChat.tsx` as a client component
- Use `useChat` from `ai/react` with `api="/api/chat"` and
  `body={{ lessonId }}`
- Layout (full height of sidebar, flex column):
  - Header: "AI Tutor" label + `SparklesIcon` (Lucide) + "Clear
    chat" button (triggers `clearMessages` Convex mutation)
  - Message list (`<ScrollArea>` flex-1): renders each message as
    a chat bubble — user on the right (accent bg), assistant on the
    left (surface-raised bg)
  - Auto-scroll to bottom on new message
  - Input area (pinned to bottom): text input + send button
  - While assistant is responding: last bubble shows a typing
    indicator (three pulsing dots)
- Load existing messages from Convex on mount — pass them as
  `initialMessages` to `useChat`
- Append new assistant messages to Convex `chatMessages` table
  after each response

**Verification**:
- [ ] Messages stream in token by token
- [ ] Typing indicator shows while waiting for response
- [ ] Clear chat button empties the message list
- [ ] Chat history persists — reopening the lesson shows previous
  messages
- [ ] Auto-scrolls to the latest message

---

### PHASE 6 — STATE, ERROR HANDLING, AND UX POLISH

---

#### Step 27 — Loading Skeletons

**Goal**: Every async page has a loading state that reflects the
actual layout — no spinners or blank screens.

**Implementation Instructions**:
- Create `app/dashboard/loading.tsx` — skeleton version of the
  course card grid (3 placeholder cards with `animate-pulse`)
- Create `app/course/[courseId]/loading.tsx` — skeleton version
  of the roadmap (title block, 3 topic sections with 4 lesson rows)
- Create `app/course/[courseId]/lesson/[lessonId]/loading.tsx` —
  skeleton for two-column lesson layout
- Use `<Skeleton>` from shadcn/ui for all placeholder elements
- Skeletons must match the real layout dimensions closely — users
  should not see layout shift when data loads

**Verification**:
- [ ] Dashboard loading skeleton matches the real grid layout
- [ ] No visible layout shift when real data replaces skeletons
- [ ] Skeletons use `--bg-surface-raised` as the pulse color

---

#### Step 28 — Error Boundaries and Empty States

**Goal**: Every page has a graceful fallback for errors and empty data.

**Implementation Instructions**:
- Create `app/error.tsx` — global error boundary. Shows a centered
  error card with: "Something went wrong" heading, a safe error
  message, and a "Reload page" button. Log the error to console.
- Create `app/course/[courseId]/error.tsx` — course-specific error.
  Shows "This course couldn't be loaded" with a back to dashboard link.
- Create `app/not-found.tsx` — 404 page matching the dark theme.
- Add empty states for:
  - Dashboard with zero courses (Step 19 covers this)
  - Course with zero lessons generated (edge case — show
    "No lessons were generated. Try importing again.")
  - Tutor chat with no messages — show suggested starter prompts:
    "Explain the code example", "What's a common mistake here?",
    "Give me a harder exercise"

**Verification**:
- [ ] Navigating to a non-existent course ID shows the course error
- [ ] Navigating to `/nonexistent` shows the 404 page
- [ ] Tutor starter prompts are clickable and pre-fill the input

---

#### Step 29 — Toast Notifications

**Goal**: Surface success and error feedback for user actions.

**Implementation Instructions**:
- Add shadcn/ui toast: `npx shadcn add toast`
- Add `<Toaster>` to `app/layout.tsx`
- Use `useToast` in client components for:
  - "Course imported successfully" — on redirect to course page
  - "Lesson marked as complete" — on progress save
  - "Course deleted" — on course deletion
  - "Failed to load lesson. Please try again." — on lesson fetch error
  - "Failed to send message." — on tutor chat error
- Toast duration: 3 seconds for success, 5 seconds for errors
- Position: bottom-right

**Verification**:
- [ ] Success toast appears after marking a lesson complete
- [ ] Error toast appears when lesson generation fails
- [ ] Toasts do not stack more than 3 at a time

---

#### Step 30 — Responsive Layout (Mobile)

**Goal**: Core flows work on mobile. Not pixel-perfect — just functional.

**Implementation Instructions**:
- Dashboard: sidebar collapses to a top bar on mobile (hamburger menu
  using shadcn `<Sheet>`)
- Import page: already single-column — verify padding on small screens
- Roadmap page: already single-column — verify topic sections collapse
  correctly on mobile
- Lesson page: tutor sidebar hidden by default on mobile — a floating
  button (`MessageCircle` icon, fixed bottom-right) opens it as a
  `<Sheet>` drawer
- Test at 390px viewport width (iPhone 14 Pro)

**Verification**:
- [ ] All pages render without horizontal scroll at 390px
- [ ] Tutor chat is accessible on mobile via the floating button
- [ ] Dashboard sidebar nav accessible via hamburger menu on mobile

---

### PHASE 7 — AUTH HARDENING AND USAGE LIMITS

---

#### Step 31 — Free Tier Enforcement

**Goal**: Free users cannot import more than 3 courses. All checks
happen server-side.

**Implementation Instructions**:
- In `POST /api/import`: before creating the course, query Convex
  for `getCoursesByUser(userId).length`
- If count ≥ 3: return 403 with JSON:
  ```
  { error: "Free tier limit reached.", code: "FREE_TIER_LIMIT" }
  ```
- On the import page: handle `FREE_TIER_LIMIT` error code — show a
  modal or inline message: "You've reached the 3-course limit on the
  free plan. Delete an existing course or upgrade to continue."
- On the dashboard: show a subtle "3/3 courses used" progress bar
  below the "Import docs" button when at the limit. Disable the
  button and change its label to "Limit reached"

**Verification**:
- [ ] User with 3 courses cannot import a 4th — gets clear message
- [ ] Import button disabled on dashboard when at limit
- [ ] Deleting a course re-enables the import button

---

#### Step 32 — Ownership Guards (Audit Pass)

**Goal**: Audit every API route and Convex mutation to confirm
ownership is verified before any read or write.

**Implementation Instructions**:
- Go through every API route file in `app/api/`:
  - `POST /api/import` — creates course owned by the user ✓
  - `POST /api/lesson/[lessonId]` — verify lesson → topic → course →
    course.userId === requestUserId
  - `POST /api/chat` — verify lesson ownership (same chain)
  - `POST /api/progress/complete` — verify lesson ownership
- Go through every Convex mutation:
  - `deleteCourse` — userId check ✓ (Step 05)
  - `cacheLessonContent` — does NOT check userId (it runs server-side
    from the API route which already verified) — document this clearly
  - `upsertProgress` — add userId check: the userId in the progress
    record must equal the mutation caller's userId
- Write a comment at the top of every route handler summarizing its
  auth and ownership requirements

**Verification**:
- [ ] Manually test: user A cannot fetch user B's lesson via API
- [ ] Manually test: user A cannot mark user B's lesson as complete
- [ ] All route handler files have the auth summary comment

---

### PHASE 8 — ENVIRONMENT AND DEPLOYMENT

---

#### Step 33 — Environment Variable Audit

**Goal**: Every environment variable is documented, all secrets are
server-side only, and the app fails fast if a required variable is
missing.

**Implementation Instructions**:
- Create `lib/env.ts`:
  ```
  import "server-only"

  function requireEnv(key: string): string {
    const value = process.env[key]
    if (!value) throw new Error(`Missing required env var: ${key}`)
    return value
  }

  export const env = {
    ANTHROPIC_API_KEY: requireEnv("ANTHROPIC_API_KEY"),
    FIRECRAWL_API_KEY: requireEnv("FIRECRAWL_API_KEY"),
    CLERK_SECRET_KEY: requireEnv("CLERK_SECRET_KEY"),
  }
  ```
- Import `env` from `lib/env.ts` in all server-side lib files instead
  of referencing `process.env` directly
- Update `.env.example` with current complete list of all variables
  and descriptions of where to get them

**Verification**:
- [ ] Starting the server without `ANTHROPIC_API_KEY` throws a clear
  error message at startup, not a cryptic runtime error
- [ ] No `process.env.ANTHROPIC_API_KEY` references outside `lib/env.ts`
- [ ] `.env.example` is complete and accurate

---

#### Step 34 — Vercel Deployment Configuration

**Goal**: Deploy the app to Vercel and confirm it works in production.

**Implementation Instructions**:
- Push repo to GitHub
- Create a new Vercel project linked to the repo
- Add all environment variables to Vercel project settings —
  copy from `.env.local`
- Add Convex production deployment URL as `NEXT_PUBLIC_CONVEX_URL`
- Run `npx convex deploy` to push the schema to the Convex production
  project
- Set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
  to the Clerk production app keys (not development)
- Add the Vercel production domain to Clerk's allowed origins
- Confirm Firecrawl API key is the production key (not the free
  tier dev key)
- After deploy: run through the full core flow manually on the
  production URL

**Verification**:
- [ ] Vercel deployment succeeds with zero build errors
- [ ] Full flow works on the production URL: sign up → import docs
  → roadmap → lesson → tutor
- [ ] No environment variable errors in Vercel function logs
- [ ] Convex dashboard shows production data after a test import

---

### PHASE 9 — QUALITY AND FINAL CHECKS

---

#### Step 35 — TypeScript Strict Audit

**Goal**: Zero TypeScript errors, zero `any` types, zero suppressed
errors before launch.

**Implementation Instructions**:
- Run `npx tsc --noEmit` — fix every error before continuing
- Search for `any` across all non-generated files: `grep -r ": any"
  --include="*.ts" --include="*.tsx" .` — replace each with a
  proper type
- Search for `@ts-ignore` and `@ts-expect-error` — remove all or
  justify in a comment why it is absolutely necessary
- Search for `eslint-disable` comments — remove all
- Confirm `tsconfig.json` has `"strict": true`

**Verification**:
- [ ] `npx tsc --noEmit` exits with code 0
- [ ] Zero `any` types in non-generated files
- [ ] Zero suppression comments

---

#### Step 36 — Core Flow End-to-End Test (Manual)

**Goal**: Walk through every user-facing flow manually and confirm
it works correctly on the production URL.

**Test Script**:
1. Visit landing page — confirm redirect to `/dashboard` when signed in
2. Sign up as a new user — confirm redirect to dashboard with empty state
3. Click "Import docs" — confirm import page loads
4. Paste `https://tailwindcss.com/docs` — select Beginner, enter goal
5. Confirm progress stream shows live log lines
6. Confirm redirect to roadmap page with topics and lessons
7. Click first lesson — confirm it streams progressively
8. Read the lesson, complete the exercise mentally, submit the quiz
9. Confirm quiz score saves and lesson shows "complete" state
10. Navigate back to roadmap — confirm lesson shows green left border
11. Open tutor chat — ask "What is the most important concept here?"
12. Confirm tutor responds with relevant, scoped answer
13. Delete the course from dashboard — confirm it disappears
14. Create a second and third course — confirm the fourth is blocked

**Verification**:
- [ ] All 14 steps pass without unexpected errors or blank states
- [ ] No console errors during any step
- [ ] Performance: roadmap generation completes in under 45 seconds

---

#### Step 37 — Performance Baseline

**Goal**: Ensure the app is fast enough to not be embarrassing at
launch.

**Implementation Instructions**:
- Run Lighthouse on the landing page and dashboard
- Target scores: Performance > 80, Accessibility > 90
- If Performance < 80:
  - Add `next/image` for any images
  - Add `loading="lazy"` to below-fold content
  - Move large client components behind `dynamic()` with
    `{ ssr: false }` if not needed for initial render
- Confirm `generateStaticParams` is not needed (all pages are
  user-specific, so no static generation)
- Confirm no unnecessary `"use client"` on server-renderable components

**Verification**:
- [ ] Lighthouse Performance ≥ 80 on landing page
- [ ] Lighthouse Accessibility ≥ 90 on all pages
- [ ] Dashboard loads in under 1.5s (Convex query is fast)

---

## Feature Expansion (Post-MVP — Do Not Build Now)

The following are documented here so they do not creep into MVP scope.
Reference this list when planning v1.1.

- **38** — Skill level picker on the roadmap page (re-generate roadmap
  for a different level without re-importing)
- **39** — Lesson regenerate button (force fresh AI generation,
  invalidate cache)
- **40** — Export roadmap as PDF or Markdown file
- **41** — Bookmarks — save specific lessons for later review
- **42** — Multi-doc courses — merge two docs URLs into one roadmap
- **43** — Convex vector index for semantic lesson search (replace
  full-context approach for large docs)
- **44** — Project generator — after completing a roadmap, suggest
  3 real-world projects to build, with step-by-step lessons
- **45** — Search across all lessons in a course
- **46** — Stripe integration — paid plan with unlimited courses
- **47** — AI tutor memory — persist tutor context across all lessons
  in a course, not just per-lesson
- **48** — Public roadmap sharing — generate a read-only shareable
  link for a course
- **49** — "Curated docs" landing page — pre-imported popular docs
  (Next.js, Tailwind, Convex) that any user can start instantly
  without spending an import
- **50** — Analytics dashboard — token usage per course, time spent
  per lesson, quiz pass rates — for the product owner to review
- **51** — Team plan — shared courses within an organization,
  admin-managed invite links
- **52** — Slack / Discord notification when a long-running import
  completes (for the cases where generation takes >60 seconds)
- **53** — Docs freshness check — detect if the source URL has changed
  since import and prompt the user to re-import

---

## Verification Checklist Before Launch

- [ ] All Steps 01–37 marked complete in `progress-tracker.md`
- [ ] `npm run build` passes with zero errors
- [ ] `npx tsc --noEmit` exits clean
- [ ] Zero `any` types in non-generated source files
- [ ] All 14 steps of the end-to-end manual test pass on production URL
- [ ] `.env.example` is complete and accurate
- [ ] No API keys hardcoded anywhere in source
- [ ] Convex production schema matches development schema
- [ ] Clerk production app has correct allowed origins
- [ ] Lighthouse Performance ≥ 80 and Accessibility ≥ 90

---

*To start a build session: open this file + `progress-tracker.md` +
`architecture.md`. Find the first uncompleted step. Read its full
block. Build exactly what it says. Verify. Update `progress-tracker.md`.
Move to the next step.*
