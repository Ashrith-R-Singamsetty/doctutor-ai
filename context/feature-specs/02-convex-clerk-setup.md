Read `AGENTS.md` before starting.

We're integrating Convex for the real-time backend and Clerk for authentication.

### Convex Setup
- Install `convex` and `@convex-dev/clerk`.
- Run `npx convex dev` to initialize the project and create the `convex/` directory.
- Create `convex/schema.ts` with a basic users table to store Clerk IDs.
- Create `convex/http.ts` to handle Clerk `user.created` and `user.updated` webhooks for database syncing.
- Create `components/providers/convex-client-provider.tsx` to wrap the app with `ClerkProvider` and `ConvexProviderWithClerk`.

### Clerk Setup
- Install `@clerk/nextjs`.
- Configure `middleware.ts` to protect all routes except public landing pages and the Convex webhook endpoint.
- Create `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/sign-up/[[...sign-up]]/page.tsx`.
- Ensure environment variables for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`, and `CONVEX_DEPLOYMENT` are configured.
- Define `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` in `.env.local`.

### Integration
- Configure the Convex JWT template in Clerk named `convex`.
- Update the `convex/` functions to use `ctx.auth.getUserIdentity()` for authenticated access.
- Wrap the root `layout.tsx` with the `ConvexClientProvider`.

### Check when done
- `npm run dev` starts both Next.js and Convex without errors.
- Unauthorized users are redirected to the sign-in page.
- Logged-in users can successfully call a test Convex query.
- Environment variables are verified in the local `.env.local` file.
