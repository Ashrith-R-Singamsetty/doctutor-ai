"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";
import { experimental_useObject as useObject, useChat } from "@ai-sdk/react";
import type { DeepPartial, UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, AlertCircle, PlayCircle, BookOpen, Lightbulb, Code, HelpCircle, Send, Bot, Sparkles } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { LessonSchema, type LessonContent } from "@/lib/validators";

export default function LessonPage() {
  const { courseId, lessonId } = useParams<{
    courseId: Id<"courses">;
    lessonId: Id<"lessons">;
  }>();
  const lesson = useQuery(api.lessons.getLesson, { lessonId });
  const [input, setInput] = useState("");

  // 1. AI streaming for lesson content
  const { object: streamedContent, submit, isLoading: isGenerating } = useObject({
    api: "/api/lesson",
    schema: LessonSchema,
  });

  // 2. AI Tutor Chat
  const { messages, sendMessage, status } = useChat();
  const isChatting = status === "submitted" || status === "streaming";

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isChatting || !lesson?.title) return;

    sendMessage(
      { text: trimmedInput },
      {
        body: {
          courseId,
          topicTitle: lesson.title,
        },
      }
    );
    setInput("");
  };

  // Decide what content to show
  const content = useMemo((): DeepPartial<LessonContent> | null => {
    if (lesson?.status === "generated" && lesson.content) {
      try {
        return JSON.parse(lesson.content);
      } catch (e) {
        console.error("Failed to parse cached lesson content", e);
        return null;
      }
    }
    return (streamedContent as DeepPartial<LessonContent>) || null;
  }, [lesson, streamedContent]);

  if (lesson === undefined) {
    return <LessonLoadingSkeleton />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline">{lesson.status === "generated" ? "Completed" : "Drafting"}</Badge>
          <div>
            <h1 className="text-xl font-semibold">{lesson.title}</h1>
            <p className="text-sm text-muted-foreground">{lesson.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            {lesson.status === "pending" && !content && (
                <Button onClick={() => submit({ lessonId })} disabled={isGenerating}>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Lesson
                </Button>
            )}
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
            {!content && lesson.status === "pending" && !isGenerating && (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
                 <BookOpen className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                 <h2 className="text-xl font-medium">Ready to learn?</h2>
                 <p className="text-muted-foreground mb-6 max-w-sm">
                   The tutor is waiting to generate this lesson for you based on the latest documentation.
                 </p>
                 <Button size="lg" onClick={() => submit({ lessonId })} disabled={isGenerating}>
                    Generate Lesson Content
                 </Button>
              </div>
            )}

            {(content || isGenerating) && (
              <div className="space-y-12">
                {/* 1. Explanation */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-primary">
                        <BookOpen className="h-5 w-5" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Explanation</h2>
                    </div>
                    {content?.explanation ? (
                        <div className="prose prose-invert max-w-none">
                            {/* Simple text rendering for now, can add ReactMarkdown later if needed */}
                            <p className="whitespace-pre-wrap leading-relaxed">{content.explanation}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    )}
                </section>

                {/* 2. Code Example */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-primary">
                        <Code className="h-5 w-5" />
                        <h2 className="text-lg font-bold tracking-tight uppercase">Code Example</h2>
                    </div>
                    <Card className="bg-zinc-950 border-zinc-800">
                        <CardContent className="p-4 pt-4 font-mono text-sm overflow-x-auto">
                            {content?.codeExample ? (
                                <pre className="text-zinc-300">
                                    <code>{content.codeExample}</code>
                                </pre>
                            ) : (
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-50" />
                                    <Skeleton className="h-4 w-75" />
                                    <Skeleton className="h-4 w-62.5" />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* 3. Common Mistake */}
                {content?.commonMistake && (
                     <section>
                        <Card className="border-red-500/20 bg-red-500/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-red-400 text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Common Mistake
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm italic">{content.commonMistake}</p>
                            </CardContent>
                        </Card>
                     </section>
                )}

                {/* 4. Exercise */}
                {content?.exercise && (
                    <section>
                        <div className="flex items-center gap-2 mb-4 text-primary">
                            <Lightbulb className="h-5 w-5" />
                            <h2 className="text-lg font-bold tracking-tight uppercase">Your Turn</h2>
                        </div>
                        <div className="p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
                            <p className="font-medium mb-2">Instructions:</p>
                            <p className="text-muted-foreground">{content.exercise}</p>
                        </div>
                    </section>
                )}

                {content?.quiz && content.quiz.length > 0 && (
                    <QuizSection quiz={content.quiz as { question: string, options: string[], correctAnswer: number, explanation: string }[]} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - AI Tutor */}
        <div className="w-96 border-l flex flex-col h-full bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-zinc-950/50">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Classroom Assistant</h3>
                </div>
                {isChatting && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
            </div>
            
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center py-8 px-4">
                            <Bot className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm font-medium text-zinc-500">
                                Need help with {lesson.title}? Ask me any technical questions about this lesson!
                            </p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                m.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-white dark:bg-zinc-800 border shadow-sm'
                            }`}>
                                {getMessageText(m)}
                            </div>
                        </div>
                    ))}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white dark:bg-zinc-950/50">
                <form onSubmit={onChatSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        placeholder="Ask the tutor..."
                        onChange={(e) => setInput(e.target.value)}
                        className="bg-zinc-50 dark:bg-zinc-900"
                    />
                    <Button type="submit" size="icon" disabled={!input || isChatting}>
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>
        </div>
      </main>
    </div>
  );
}

function getMessageText(message: UIMessage) {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

  return text || "Thinking...";
}

function QuizSection({ quiz }: { quiz: { question: string, options: string[], correctAnswer: number, explanation: string }[] }) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState<Record<number, boolean>>({});

  return (
    <section className="space-y-6 pb-20">
      <div className="flex items-center gap-2 mb-4 text-primary">
          <HelpCircle className="h-5 w-5" />
          <h2 className="text-lg font-bold tracking-tight uppercase">Knowledge Check</h2>
      </div>
      
      <div className="space-y-6">
        {quiz.map((q, idx) => (
          <Card key={idx} className="border-zinc-800">
            <CardHeader>
              <CardDescription className="text-xs uppercase font-semibold">Question {idx + 1}</CardDescription>
              <CardTitle className="text-md leading-snug">{q?.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2">
                {q?.options?.map((option, optIdx) => (
                  <Button
                    key={optIdx}
                    variant={selectedAnswers[idx] === optIdx ? "secondary" : "outline"}
                    className={`justify-start h-auto py-3 px-4 text-left font-normal ${
                        showResults[idx] && optIdx === q.correctAnswer ? "border-green-500 bg-green-500/10" : ""
                    } ${
                        showResults[idx] && selectedAnswers[idx] === optIdx && optIdx !== q.correctAnswer ? "border-red-500 bg-red-500/10" : ""
                    }`}
                    onClick={() => !showResults[idx] && setSelectedAnswers({ ...selectedAnswers, [idx]: optIdx })}
                    disabled={showResults[idx]}
                  >
                    <span className="mr-3 text-xs opacity-50 uppercase">{String.fromCharCode(65 + optIdx)}</span>
                    {option}
                  </Button>
                ))}
              </div>

              {selectedAnswers[idx] !== undefined && !showResults[idx] && (
                 <Button className="w-full mt-4" onClick={() => setShowResults({...showResults, [idx]: true})}>
                    Check Answer
                 </Button>
              )}

              {showResults[idx] && (
                <div className={`mt-4 p-4 rounded-lg text-sm flex gap-3 ${
                    selectedAnswers[idx] === q?.correctAnswer ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
                }`}>
                    {selectedAnswers[idx] === q?.correctAnswer ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
                    <div>
                        <p className="font-bold mb-1">{selectedAnswers[idx] === q?.correctAnswer ? "Correct!" : "Not quite."}</p>
                        <p className="text-zinc-300 leading-relaxed">{q?.explanation}</p>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function LessonLoadingSkeleton() {
  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
        <div className="space-y-4">
            <Skeleton className="h-8 w-50" />
            <Skeleton className="h-4 w-100" />
        </div>
        <Skeleton className="h-100 w-full rounded-xl" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
        </div>
    </div>
  );
}
