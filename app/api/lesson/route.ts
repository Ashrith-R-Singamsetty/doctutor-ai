import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { generateLessonStream } from "@/lib/ai/generateLesson";
import { LessonContent } from "@/lib/validators";
import { z } from "zod";
import { Id } from "@/convex/_generated/dataModel";

const LessonRequestSchema = z.object({
  lessonId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const validated = LessonRequestSchema.safeParse(body);

    if (!validated.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId } = validated.data;
    const typedLessonId = lessonId as Id<"lessons">;

    // Fetch lesson and context
    const lesson = await fetchQuery(api.lessons.getLesson, { lessonId: typedLessonId });
    if (!lesson) {
      return Response.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (!lesson.rawDocsContent) {
      return Response.json({ error: "Documentation context missing for this course" }, { status: 400 });
    }

    // Call AI stream
    const result = await generateLessonStream(
      lesson.title,
      lesson.description || "",
      lesson.rawDocsContent
    );

    void result.object
      .then(async (object: LessonContent) => {
        await fetchMutation(api.lessons.saveLessonContent, {
          lessonId: typedLessonId,
          content: JSON.stringify(object),
        });
      })
      .catch((err: unknown) => {
        console.error("Failed to save generated lesson:", err);
      });

    return result.toTextStreamResponse({
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  } catch (err: unknown) {
    console.error("Lesson generation failed:", err);
    return Response.json(
      { error: "Internal server error during lesson generation" },
      { status: 500 }
    );
  }
}
