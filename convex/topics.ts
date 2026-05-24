import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createTopics = mutation({
  args: {
    courseId: v.id("courses"),
    topics: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
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

    const topicIds = [];
    for (const topic of args.topics) {
      const id = await ctx.db.insert("topics", {
        courseId: args.courseId,
        ...topic,
      });
      topicIds.push(id);
    }
    return topicIds;
  },
});

export const getTopics = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== user._id) return [];

    return await ctx.db
      .query("topics")
      .withIndex("by_courseId", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});
