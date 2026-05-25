"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { BookOpen, Sparkles, Wand2, Loader2 } from "lucide-react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

function normalizeDocumentationUrl(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) return null;

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }
    parsedUrl.hash = "";
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function formatCourseFailure(error: unknown) {
  if (error instanceof Error) {
    return [
      "Course generation failed after the course was created.",
      `Message: ${error.message}`,
      error.stack ? `Stack: ${error.stack}` : null,
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, 4000);
  }

  return "Course generation failed after the course was created.";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  
  const createCourse = useMutation(api.courses.createCourse);
  const updateCourseStatus = useMutation(api.courses.updateCourseStatus);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedUrl = normalizeDocumentationUrl(url);
    if (!normalizedUrl) {
      setIsLoading(false);
      setStatus("Enter a valid http or https documentation URL.");
      return;
    }

    let courseId: Id<"courses"> | null = null;
    try {
      setIsLoading(true);
      setStatus("Analyzing documentation...");

      // 1. Create the course record
      courseId = await createCourse({
        title: "Generating...", // Temporary title
        description: "Preparing your learning roadmap...",
        docsUrl: normalizedUrl,
      });

      // 2. Crawl the documentation
      setStatus("Crawling docs (using Firecrawl)...");
      const crawlRes = await fetch("/api/crawl", {
        method: "POST",
        body: JSON.stringify({ url: normalizedUrl }),
      });
      
      const crawlData = await crawlRes.json();
      if (!crawlRes.ok) throw new Error(crawlData.error || "Failed to crawl");

      // 3. Generate the roadmap
      setStatus("AI is building your roadmap...");
      const roadmapRes = await fetch("/api/roadmap", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          crawledData: crawlData.data,
        }),
      });

      const roadmapData = await roadmapRes.json();
      if (!roadmapRes.ok) throw new Error(roadmapData.error || "Failed to generate roadmap");

      // 4. Redirect to course page
      router.push(`/courses/${courseId}`);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setStatus(errorMessage);
      if (courseId) {
        try {
          await updateCourseStatus({
            courseId,
            status: "error",
            error: formatCourseFailure(err),
          });
        } catch (updateErr) {
          console.error("Failed to mark course as failed:", updateErr);
        }
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Header */}
      <header className="px-6 py-4 border-b border-zinc-900 flex justify-between items-center backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 group cursor-default">
          <div className="bg-blue-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <span className="font-bold text-xl tracking-tight">DocTutor<span className="text-blue-500">AI</span></span>
        </div>
        <div>
          {isLoaded && !isSignedIn ? (
            <SignInButton mode="modal">
              <Button variant="ghost" className="hover:bg-zinc-900">Sign In</Button>
            </SignInButton>
          ) : null}
          {isLoaded && isSignedIn ? (
            <div className="flex items-center gap-4">
               <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="text-zinc-400 hover:text-white">Dashboard</Button>
               <UserButton />
            </div>
          ) : null}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px]" />

        <div className="max-w-3xl w-full space-y-12 text-center relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-sm text-blue-400 font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next Generation Learning</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-tight italic">
              Learn anything from <span className="bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500">Documentation</span>.
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
              Drop a docs URL and we&apos;ll transform it into a structured course with interactive lessons, code examples, and an AI tutor.
            </p>
          </div>

          <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-sm shadow-2xl overflow-hidden group">
            <CardHeader className="pb-0 pt-8">
              <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-zinc-500">Documentation URL</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              <form onSubmit={handleGenerate} className="flex flex-col md:flex-row gap-3">
                <label htmlFor="documentation-url" className="sr-only">Documentation URL</label>
                <Input 
                  id="documentation-url"
                  placeholder="https://nextjs.org/docs" 
                  className="bg-zinc-900/50 border-zinc-800 h-12 focus-visible:ring-blue-500 rounded-xl"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                />
                <Button 
                  disabled={isLoading || !url} 
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {status}
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Course
                    </>
                  )}
                </Button>
              </form>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Gemini 3.5 Flash</span>
                <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Firecrawl Search</span>
                <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> Interactive Quizzes</span>
              </div>
            </CardContent>
            {/* Transition progress bar */}
            {isLoading && (
               <div className="h-1 bg-zinc-900 w-full overflow-hidden">
                  <div className="h-full bg-blue-600 animate-progress origin-left" />
               </div>
            )}
          </Card>

          <div className="pt-8">
            <p className="text-zinc-500 text-sm">
              Popular: <button onClick={() => setUrl("https://convex.dev/docs")} className="text-zinc-400 hover:text-blue-400 transition-colors">Convex Docs</button>, 
              <button onClick={() => setUrl("https://nextjs.org/docs")} className="ml-2 text-zinc-400 hover:text-blue-400 transition-colors">Next.js</button>, 
              <button onClick={() => setUrl("https://tailwindcss.com/docs")} className="ml-2 text-zinc-400 hover:text-blue-400 transition-colors">Tailwind CSS</button>
            </p>
          </div>
        </div>
      </main>

      <footer className="px-6 py-8 border-t border-zinc-900 text-center text-zinc-600 text-xs">
        &copy; 2026 DocTutor AI. Built for the future of learning.
      </footer>
    </div>
  );
}
