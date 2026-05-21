import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const headerPayload = request.headers;

    try {
      const result = await ctx.runAction(internal.clerk.fulfill, {
        payload: payloadString,
        headers: {
          "svix-id": headerPayload.get("svix-id")!,
          "svix-timestamp": headerPayload.get("svix-timestamp")!,
          "svix-signature": headerPayload.get("svix-signature")!,
        },
      });

      switch (result.type) {
        case "user.created":
        case "user.updated":
          await ctx.runMutation(internal.users.upsertFromClerk, {
            clerkId: result.data.id,
            email: result.data.email_addresses[0].email_address,
            name: `${result.data.first_name ?? ""} ${result.data.last_name ?? ""}`.trim(),
            imageUrl: result.data.image_url,
          });
          break;
        case "user.deleted":
          await ctx.runMutation(internal.users.deleteFromClerk, {
            clerkId: result.data.id!,
          });
          break;
      }

      return new Response(null, { status: 200 });
    } catch (err) {
      console.error("Webhook verification failed:", err);
      return new Response("Webhook Error", { status: 400 });
    }
  }),
});

export default http;
