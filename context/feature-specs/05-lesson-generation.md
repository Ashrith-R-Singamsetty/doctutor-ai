Read `AGENTS.md` before starting.

We're implementing the AI lesson generation pipeline. This stage handles the on-demand generation of detailed lesson content when a user clicks into a lesson from the roadmap.

### Convex Logic
- Update `convex/lessons.ts`:
  - `getLesson`: Fetch a single lesson by ID with auth and ownership check.
  - `saveLessonContent`: Mutation to update `content` and set status to `generated`.
  - Ensure `docsContext` is available (this should have been populated during roadmap generation or fetched from crawled data).

### AI Lesson Generation
- Create `lib/ai/generateLesson.ts`:
  - Implement `generateLesson` function using Vercel AI SDK `streamObject`.
  - Use `LessonSchema` from `lib/validators.ts`.
  - **Input**: Lesson title, topic description, and the relevant documentation markdown context.
  - **Persona**: "Senior Engineer and Technical Teacher".
  - **Requirements**:
    - `explanation`: Clear, concise technical explanation.
    - `codeExample`: Practical code snippet with inline comments.
    - `commonMistake`: A "gotcha" or frequent error related to this specific topic.
    - `exercise`: A small, actionable exercise for the user to try.
    - `quiz`: Array of 3 multiple-choice questions with explanations.

### API Route
- Create `app/api/lesson/route.ts`:
  - **Method**: `POST`.
  - **Body**: `{ lessonId: string }`.
  - **Auth**: Verify Clerk session and Convex ownership.
  - **Logic**:
    - Fetch the lesson from Convex to get its context.
    - Call `streamObject` using Gemini 3.5 Flash.
    - Stream the response to the frontend.
    - *Optional Integration*: Use a background process or client-side callback to save the final generated JSON back to Convex so it is cached for future visits.

### Lesson UI
- Create `app/courses/[courseId]/lessons/[lessonId]/page.tsx`:
  - Use `useQuery` or `fetchQuery` to get the lesson.
  - If status is `pending`:
    - Display a loading state (e.g., "AI is drafting your lesson...").
    - Call the API route and use `streamObject` results to update the UI in real-time.
  - If status is `generated`:
    - Render the cached content immediately.
  - **Layout**:
    - Sidebar with Course/Topic navigation.
    - Main content area with Markdown rendering for the explanation and code blocks.
    - Interactive Quiz section (multiple choice).
    - Exercise section with a completion toggle.
    - Placeholder for the AI Tutor (Feature 06).

### Check when done
- Lessons generate on-demand on the first click.
- Content streams into the UI properly.
- Quiz results are not necessarily saved yet (that's Feature 07), but the UI works.
- Lesson content is successfully cached in Convex `lessons` table after generation.
- Production build passes.
