/**
 * Shared TypeScript interfaces and types for DocTutor.
 */

export interface User {
  clerkId: string;
  email: string;
  name?: string;
  imageUrl?: string;
}

export type CourseStatus = "crawling" | "generating" | "ready" | "error";

export interface Course {
  userId: string;
  title: string;
  description: string;
  docsUrl: string;
  status: CourseStatus;
  error?: string;
}

export interface Topic {
  courseId: string;
  title: string;
  description: string;
  order: number;
}

export type LessonStatus = "pending" | "generated";

export interface Lesson {
  topicId: string;
  courseId: string;
  title: string;
  description?: string;
  content?: string;
  docsContext?: string;
  order: number;
  status: LessonStatus;
}

export interface Progress {
  userId: string;
  courseId: string;
  lessonId: string;
  completed: boolean;
  quizScore?: number;
  lastAccessedAt: number;
}

export interface ChatMessage {
  userId: string;
  courseId: string;
  lessonId: string;
  role: "user" | "assistant";
  content: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?: string;
}
