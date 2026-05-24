Read `AGENTS.md` before starting.

We're implementing the core AI roadmap generation pipeline. This stage takes the crawled markdown and transforms it into a structured curriculum in Convex.

### Convex CRUD
- Create `convex/courses.ts`:
  - `getCourse`: Fetch a course by ID with ownership check.
  - `updateCourseStatus`: Update status (`generating`, `ready`, `error`).
- Create `convex/topics.ts`:
  - `createTopics`: Mutation to batch insert topics for a course.
  - `getTopics`: Query to list topics for a course.
- Create `convex/lessons.ts`:
  - `createLessons`: Mutation to batch insert lessons linked to topics.
  - `getLessonsByTopic`: Query to list lessons for a specific topic.

**Security**: Every mutation must verify `userId` against the authenticated user.

### AI Roadmap Generation
- Create `lib/ai/generateRoadmap.ts`:
  - Implement `generateRoadmap` function using Vercel AI SDK `generateObject`.
  - Use `RoadmapSchema` from `lib/validators.ts`.
  - Input: Array of crawled markdown sections.
  - Logic: 
    - Concatenate markdown, capping at 80,000 characters.
    - System prompt defines the "Expert Tutor" persona.
    - Output must be a logical progression from beginner to advanced.

### API Route
- Create `app/api/roadmap/route.ts`:
  - Input: `courseId` and the `crawledData`.
  - Auth: Verify Clerk session.
  - Implementation:
    - Update course status to `generating`.
    - Call `generateRoadmap`.
    - Batch insert topics and lessons into Convex.
    - Update course status to `ready`.
  - Response: Consistent `{ data: { courseId } }` shape.

### Roadmap UI
- Create `app/courses/[courseId]/page.tsx`:
  - Display course title and description.
  - Render a list of topics using `TopicCard` components.
  - Inside each topic, list Lesson links with progress indicators.
  - Use `Suspense` for loading states while fetching Convex data.

### Check when done
- `lib/ai/generateRoadmap.ts` successfully generates a valid JSON roadmap.
- `POST /api/roadmap` populates `topics` and `lessons` tables in Convex correctly.
- Courses are only accessible by their owners.
- The UI correctly displays the generated structure.
- Errors during generation are captured and stored in the `courses.error` field.
