import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { notFound } from "next/navigation";
import { TopicCard } from "@/components/TopicCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Id } from "@/convex/_generated/dataModel";

interface CoursePageProps {
  params: Promise<{ courseId: string }>;
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { courseId } = await params;
  const typedCourseId = courseId as Id<"courses">;

  // 1. Fetch Course
  const course = await fetchQuery(api.courses.getCourse, {
    courseId: typedCourseId,
  });

  if (!course) {
    return notFound();
  }

  // 2. Fetch Topics and Lessons
  const topics = await fetchQuery(api.topics.getTopics, {
    courseId: typedCourseId,
  });

  const lessons = await fetchQuery(api.lessons.getLessonsByCourse, {
    courseId: typedCourseId,
  });

  // Organize lessons by topic
  const lessonsByTopic = topics.reduce((acc, topic) => {
    acc[topic._id] = lessons.filter((l) => l.topicId === topic._id).sort((a,b) => a.order - b.order);
    return acc;
  }, {} as Record<string, typeof lessons>);

  return (
    <div className="flex flex-col h-screen bg-black text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 p-6 bg-zinc-950/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 border-blue-500/20">
                Course Roadmap
              </Badge>
              {course.status !== "ready" && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider animate-pulse bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  {course.status}...
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-linear-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              {course.title}
            </h1>
            <p className="text-zinc-400 max-w-2xl text-lg leading-relaxed">
              {course.description}
            </p>
          </div>
          <div className="text-sm font-medium text-zinc-500 pb-1">
            {lessons.length} Lessons • {topics.length} Modules
          </div>
        </div>
      </header>

      {/* Roadmap Content */}
      <ScrollArea className="flex-1">
        <main className="max-w-5xl mx-auto py-10 px-6">
          {course.status === "error" ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
              <h2 className="text-xl font-bold text-red-400 mb-2">Generation Failed</h2>
              <p className="text-zinc-400">{course.error || "An unexpected error occurred."}</p>
            </div>
          ) : topics.length === 0 && course.status === "ready" ? (
             <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center">
                <p className="text-zinc-500">No content generated for this course yet.</p>
             </div>
          ) : (
            <div className="grid gap-6">
              {topics.sort((a,b) => a.order - b.order).map((topic) => (
                <TopicCard
                  key={topic._id}
                  title={topic.title}
                  description={topic.description}
                  order={topic.order}
                  lessons={lessonsByTopic[topic._id] || []}
                  courseId={courseId}
                />
              ))}
            </div>
          )}
        </main>
      </ScrollArea>
    </div>
  );
}
