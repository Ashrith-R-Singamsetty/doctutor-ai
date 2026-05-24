import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index("by_clerkId", ["clerkId"]),

  courses: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.string(),
    docsUrl: v.string(),
    status: v.union(
      v.literal("crawling"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("error")
    ),
    error: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  topics: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    order: v.number(),
  }).index("by_courseId", ["courseId"]),

  lessons: defineTable({
    topicId: v.id("topics"),
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    docsContext: v.optional(v.string()),
    order: v.number(),
    status: v.union(v.literal("pending"), v.literal("generated")),
  })
    .index("by_topicId", ["topicId"])
    .index("by_courseId", ["courseId"]),

  progress: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    completed: v.boolean(),
    quizScore: v.optional(v.number()),
    lastAccessedAt: v.number(),
  })
    .index("by_userId_courseId", ["userId", "courseId"])
    .index("by_lessonId", ["lessonId"]),

  chatMessages: defineTable({
    userId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.id("lessons"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
  }).index("by_lessonId", ["lessonId"]),
});
