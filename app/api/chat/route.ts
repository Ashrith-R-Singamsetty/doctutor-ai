import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { createTutorStream } from "@/lib/ai/tutorChat";

const ChatRequestSchema = z.object({
  messages: z.array(
    z.custom<UIMessage>(
      (value): value is UIMessage =>
        typeof value === "object" &&
        value !== null &&
        "role" in value &&
        "parts" in value
    )
  ),
  courseId: z.string().min(1),
  topicTitle: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validated = ChatRequestSchema.safeParse(body);
    if (!validated.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, courseId, topicTitle } = validated.data;
    const course = await fetchQuery(api.courses.getCourse, {
      courseId: courseId as Id<"courses">,
    });

    if (!course) {
      return Response.json({ error: "Course not found" }, { status: 404 });
    }

    const result = await createTutorStream({
      messages: await convertToModelMessages(messages),
      docsContext: course.rawDocsContent || "",
      topicTitle,
      courseTitle: course.title,
    });

    return result.toUIMessageStreamResponse();
  } catch (err: unknown) {
    console.error("Tutor chat failed:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
