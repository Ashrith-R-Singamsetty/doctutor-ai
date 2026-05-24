import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, CheckCircle2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Lesson {
    _id: string;
    title: string;
    description?: string;
    status: "pending" | "generated";
}

interface TopicCardProps {
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  courseId: string;
}

export function TopicCard({ title, description, order, lessons, courseId }: TopicCardProps) {
  return (
    <Card className="mb-6 border-zinc-800 bg-zinc-900/50">
      <CardHeader>
        <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800 text-xs font-medium text-zinc-400">
                {order}
            </span>
            <CardTitle className="text-xl font-bold tracking-tight text-zinc-100">{title}</CardTitle>
        </div>
        <CardDescription className="text-zinc-400">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...lessons].sort((a,b) => a.title.localeCompare(b.title)).map((lesson) => (
            <Link 
              key={lesson._id}
              href={`/courses/${courseId}/lessons/${lesson._id}`}
              className="group flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950 hover:border-blue-500/50 hover:bg-zinc-900 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border",
                    lesson.status === "generated" ? "border-green-500/30 bg-green-500/10 text-green-500" : "border-zinc-800 bg-zinc-900 text-zinc-500"
                )}>
                  {lesson.status === "generated" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-zinc-200 group-hover:text-blue-400 transition-colors">
                    {lesson.title}
                  </h4>
                  {lesson.description && (
                    <p className="text-xs text-zinc-500 line-clamp-1">{lesson.description}</p>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
