import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createLessons = mutation({
  args: {
    courseId: v.id("courses"),
    lessons: v.array(
      v.object({
        topicId: v.id("topics"),
        title: v.string(),
        description: v.optional(v.string()),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== user._id) {
      throw new Error("Access denied");
    }

    const lessonIds = [];
    for (const lesson of args.lessons) {
      const id = await ctx.db.insert("lessons", {
        courseId: args.courseId,
        status: "pending",
        ...lesson,
      });
      lessonIds.push(id);
    }
    return lessonIds;
  },
});

export const getLessonsByTopic = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_topicId", (q) => q.eq("topicId", args.topicId))
      .collect();
  },
});

export const getLessonsByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("lessons")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});
