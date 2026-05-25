import { z } from "zod";

/**
 * Zod schemas for API input validation and AI output validation.
 */

export const RoadmapSchema = z.object({
  title: z.string(),
  description: z.string(),
  topics: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      order: z.number(),
      lessons: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          order: z.number(),
        })
      ),
    })
  ),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;

export const CrawlRequestSchema = z.object({
  url: z.string().url(),
});

export const CrawlResponseSchema = z.array(
  z.object({
    url: z.string().url(),
    markdown: z.string(),
  })
);

export const LessonSchema = z.object({
  explanation: z.string(),
  codeExample: z.string(),
  commonMistake: z.string(),
  exercise: z.string(),
  quiz: z.array(
    z.object({
      question: z.string(),
      options: z.array(z.string()),
      correctAnswer: z.number(),
      explanation: z.string(),
    })
  ).length(3),
});

export type LessonContent = z.infer<typeof LessonSchema>;
