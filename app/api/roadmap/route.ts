import { auth } from "@clerk/nextjs/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { generateRoadmap } from "@/lib/ai/generateRoadmap";
import { RoadmapSchema } from "@/lib/validators";
import { z } from "zod";
import { Id } from "@/convex/_generated/dataModel";

const RoadmapRequestSchema = z.object({
  courseId: z.string(),
  crawledData: z.array(
    z.object({
      url: z.string(),
      markdown: z.string(),
    })
  ),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = RoadmapRequestSchema.safeParse(body);

    if (!validated.success) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId, crawledData } = validated.data;
    const typedCourseId = courseId as Id<"courses">;

    // 1. Update status to generating
    await fetchMutation(api.courses.updateCourseStatus, {
      courseId: typedCourseId,
      status: "generating",
    });

    // 2. Prepare content for AI
    const fullMarkdown = crawledData.map((d) => `URL: ${d.url}\n\n${d.markdown}`).join("\n\n---\n\n");
    
    // 3. Generate Roadmap
    const roadmap = await generateRoadmap("Course", fullMarkdown);

    // 4. Persistence to Convex
    const topicIds = await fetchMutation(api.topics.createTopics, {
      courseId: typedCourseId,
      topics: roadmap.topics.map((t) => ({
        title: t.title,
        description: t.description,
        order: t.order,
      })),
    });

    // Flatten lessons and link to topicIds
    const lessonsToCreate = roadmap.topics.flatMap((topic, topicIdx) => 
      topic.lessons.map((lesson) => ({
        topicId: topicIds[topicIdx],
        courseId: typedCourseId,
        title: lesson.title,
        description: lesson.description,
        order: lesson.order,
      }))
    );

    await fetchMutation(api.lessons.createLessons, {
      courseId: typedCourseId,
      lessons: lessonsToCreate,
    });

    // 5. Finalize status
    await fetchMutation(api.courses.updateCourseStatus, {
      courseId: typedCourseId,
      status: "ready",
    });

    return Response.json({ data: { courseId } });
  } catch (err: unknown) {
    console.error("Roadmap generation failed:", err);
    
    // Attempt to mark as error in Convex if we have a courseId
    try {
        const body = await req.clone().json();
        if (body.courseId) {
            await fetchMutation(api.courses.updateCourseStatus, {
                courseId: body.courseId as Id<"courses">,
                status: "error",
                error: "Failed to generate roadmap. Please try again.",
            });
        }
    } catch (e) {
        // Ignore secondary error
    }

    return Response.json(
      { error: "Internal server error during generation" },
      { status: 500 }
    );
  }
}
