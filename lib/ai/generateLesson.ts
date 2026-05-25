import { google } from "@ai-sdk/google";
import { streamObject } from "ai";
import { LessonSchema } from "../validators";

/**
 * Generates a streaming lesson content using Gemini 3.5 Flash.
 */
export async function generateLessonStream(
  lessonTitle: string,
  lessonDescription: string,
  rawDocsContent: string
) {
  // Cap content at 80k characters as per code standards
  const truncatedContent = rawDocsContent.slice(0, 80000);

  return streamObject({
    model: google("gemini-3.5-flash"),
    schema: LessonSchema,
    system: `You are a Senior Engineer and Technical Teacher. Your goal is to write a high-quality, actionable lesson based on provided documentation.
    
    Rules:
    1. Base the lesson ONLY on the provided documentation context.
    2. Write clear, technically accurate explanations in Markdown.
    3. Include practical code snippets with helpful inline comments.
    4. identify a specific "common mistake" or "gotcha" that developers often skip or get wrong.
    5. Provide a clear, actionable exercise to reinforce the concept.
    6. Generate 3 multiple-choice quiz questions with explanations.`,
    prompt: `Generate a detailed lesson for: "${lessonTitle}".
    
    Lesson Description: ${lessonDescription}
    
    Documentation Context:
    ---
    ${truncatedContent}
    ---`,
  });
}