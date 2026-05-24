import { v } from "convex/values";
import { Webhook } from "svix";
import { internalAction } from "./_generated/server";
import { WebhookEvent } from "@clerk/nextjs/server";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET!;

export const fulfill = internalAction({
  args: {
    headers: v.object({
      svix_id: v.string(),
      svix_timestamp: v.string(),
      svix_signature: v.string(),
    }),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    if (!WEBHOOK_SECRET) {
      throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to shop environment variables");
    }

    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
      evt = wh.verify(args.payload, {
        "svix-id": args.headers.svix_id,
        "svix-timestamp": args.headers.svix_timestamp,
        "svix-signature": args.headers.svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      throw new Error("Error verifying webhook");
    }

    return evt;
  },
});
