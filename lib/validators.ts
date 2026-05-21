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
    })
  ),
});

export type Roadmap = z.infer<typeof RoadmapSchema>;
