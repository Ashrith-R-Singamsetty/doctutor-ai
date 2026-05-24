import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { RoadmapSchema, type Roadmap } from "../validators";

/**
 * Generates a structured roadmap from crawled documentation using Gemini 3.5 Flash.
 */
export async function generateRoadmap(
  title: string,
  crawledContent: string
): Promise<Roadmap> {
  // Cap content at ~80k characters as per code standards to control context/cost
  const truncatedContent = crawledContent.slice(0, 80000);

  const { object } = await generateObject({
    model: google("gemini-3.5-flash"),
    schema: RoadmapSchema,
    system: `You are an Expert Documentation Tutor. Your goal is to transform raw documentation into a structured, logical learning roadmap.
    
    Rules:
    1. Analyze the provided documentation carefully.
    2. Create a title and description for the course based on the content.
    3. Organize the content into logical "Topics" (modules).
    4. Within each Topic, define specific "Lessons" that follow a beginner-to-advanced progression.
    5. Each topic and lesson must have a clear, helpful description.
    6. Ensure the roadmap covers the core concepts of the library/framework represented in the docs.
    7. Avoid fluff; stay focused on practical learning paths.`,
    prompt: `Generate a detailed learning roadmap for "${title}" based on the following documentation content:
    
    ---
    ${truncatedContent}
    ---`,
  });

  return object;
}
