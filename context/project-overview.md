# DocTutor AI

## Overview

DocTutor AI turns any software documentation URL into a structured,
interactive learning course. A developer pastes a docs URL, picks their
skill level and goal, and gets a personalized roadmap with AI-generated
lessons, exercises, quizzes, and a context-aware tutor — all grounded
in the actual documentation. It solves the gap between "here are the
docs" and "I know how to use this."

## Goals

1. A user can go from pasting a docs URL to reading their first lesson
   in under 60 seconds
2. Every lesson is grounded in the real documentation — no hallucinated
   APIs, no generic filler
3. The AI tutor can answer follow-up questions without leaving the
   lesson context

## Core User Flow

1. User signs in via Clerk
2. User pastes a documentation URL on the import page
3. User selects skill level (beginner / intermediate / advanced) and
   states their learning goal in plain text
4. App crawls the docs via Firecrawl and generates a structured roadmap
   using Claude — this takes 15–30 seconds and streams progress to the UI
5. User lands on the roadmap page — a visual list of topics and lessons
   ordered from fundamentals to advanced
6. User opens a lesson — content streams in (explanation, code example,
   common mistake, exercise)
7. User completes the exercise and quiz inline
8. User can ask the AI tutor questions at any point inside the lesson
9. Progress is saved to Convex — user can return and resume at any time

## Features

### Docs Ingestion
- Paste any public documentation URL
- Firecrawl crawls up to 50 pages and returns clean markdown
- Domain and format validation before crawling starts

### Curriculum Generation
- Claude generates a JSON roadmap via `generateObject` with Zod schema
  validation — no free-form parsing
- Roadmap is scoped to the user's skill level and stated goal
- Topics ordered by conceptual dependency, not just docs page order

### Lesson Generation
- Each lesson generated on-demand when the user opens it (streamed)
- Includes: plain explanation, code example with inline comments,
  one common mistake, one hands-on exercise, three quiz questions
- Lesson is regenerated fresh if the user explicitly requests it

### AI Tutor
- Chat panel inside each lesson powered by `useChat` from Vercel AI SDK
- System context includes the lesson content and the raw docs markdown
  for that topic
- Tutor is scoped to the lesson — it does not answer unrelated questions

### Progress Tracking
- Completed lessons, quiz scores, and exercise completion stored in
  Convex per user per course
- Roadmap page shows completion state at a glance

## Scope

### In Scope
- Public documentation URLs only
- Web app (no mobile, no CLI)
- Single docs URL per course
- English language docs only
- Text and code content — no video, PDF, or image-heavy docs
- Freemium model: free tier with usage caps, paid tier unlimited

### Out of Scope (MVP)
- File uploads (PDF, local docs)
- Team or collaborative features
- Native mobile app
- Code execution sandbox
- Multi-source courses (combining multiple docs URLs)
- Marketplace or shared course library
- Certificates or assessments
- Arbitrary non-developer documentation

## Success Criteria

1. A signed-in user can go from URL input to first lesson in under
   60 seconds on the Next.js docs
2. Generated roadmap correctly orders fundamentals before advanced topics
   for at least 5 real docs targets without manual correction
3. AI tutor answers stay grounded in docs context — zero hallucinated
   API method names in 20 consecutive test sessions
4. User can close the browser and return to find their progress intact
5. `npm run build` passes with zero TypeScript errors
