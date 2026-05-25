import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const course = await ctx.db.get(args.courseId);
    if (!course || course.userId !== user._id) {
      return null;
    }

    return course;
  },
});

export const updateCourseStatus = mutation({
  args: {
    courseId: v.id("courses"),
    status: v.union(
      v.literal("crawling"),
      v.literal("generating"),
      v.literal("ready"),
      v.literal("error")
    ),
    error: v.optional(v.string()),
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

    await ctx.db.patch(args.courseId, {
      status: args.status,
      error: args.status === "error" ? args.error ?? null : null,
    });
  },
});

export const updateCourseContent = mutation({
  args: {
    courseId: v.id("courses"),
    content: v.string(),
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

    await ctx.db.patch(args.courseId, {
      rawDocsContent: args.content,
    });
  },
});

export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    docsUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    return await ctx.db.insert("courses", {
      userId: user._id,
      title: args.title,
      description: args.description,
      docsUrl: args.docsUrl,
      status: "crawling",
    });
  },
});
