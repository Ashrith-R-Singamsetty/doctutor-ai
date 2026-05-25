import { google } from "@ai-sdk/google";
import { streamText, type ModelMessage } from "ai";

/**
 * AI Tutor Chat Configuration
 * 
 * This module handles the real-time AI tutor interactions within the classroom.
 * It uses the documentation context associated with the course to answer
 * student questions accurately within the context of the specific technology.
 */

export async function createTutorStream({
  messages,
  docsContext,
  topicTitle,
  courseTitle,
}: {
  messages: ModelMessage[];
  docsContext: string;
  topicTitle: string;
  courseTitle: string;
}) {
  return streamText({
    model: google("gemini-3.5-flash"),
    system: `You are an expert AI Tutor helping a student learn ${courseTitle}.
    Specifically, they are currently on the topic: "${topicTitle}".
    
    Maintain a helpful, encouraging, and technical tone. 
    Use the provided documentation context to answer questions accurately.
    If the answer is not in the context, use your general knowledge but clearly state 
    if it's a general concept rather than specific to the documentation provided.
    
    Context from the documentation:
    ---
    ${docsContext}
    ---
    
    Guidelines:
    1. Keep answers concise but thorough.
    2. Use markdown for code snippets and formatting.
    3. If the student is stuck on a quiz or exercise, don't give the answer immediately. 
       Instead, provide a hint or explain the underlying concept.
    4. Focus on helping them understand "why" things work, not just "how".`,
    messages,
    maxOutputTokens: 1200,
  });
}
