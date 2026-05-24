Read `AGENTS.md` before starting.

We're integrating Firecrawl to handle documentation crawling and markdown extraction. This is the first step in the DocTutor AI pipeline.

### Firecrawl Setup
- Get a Firecrawl API key from [firecrawl.dev](https://firecrawl.dev).
- Add `FIRECRAWL_API_KEY` to `.env.local`.
- Install the Firecrawl SDK: `npm install @mendable/firecrawl-js`.
- Create `lib/firecrawl.ts` to initialize the Firecrawl client and export crawling helper functions.

### Crawl Implementation
- Implement `lib/firecrawl.ts` with a `crawlDocs` function that:
  - Takes a base URL.
  - Limits the crawl to the same domain and path prefix.
  - Restricts the crawl to 50 pages maximum.
  - Returns an array of objects containing `url` and `markdown`.
- Create `app/api/crawl/route.ts` to handle the ingestion request:
  - Validate the incoming URL using Zod.
  - Ensure the user is authenticated via Clerk.
  - Call Firecrawl to perform a synchronous crawl (for MVP).
  - Return the processed markdown sections.

### Integration
- Connect the frontend import form (to be built) to `POST /api/crawl`.
- Ensure the crawling progress is communicated to the user (e.g., using a "crawling" status in the `courses` table).
- Validate that the crawled content is clean markdown before passing it to the next stage (Curriculum Generation).

### Scoping & Limits
- **Path Scoping**: The crawler must only stay within the sub-path of the initial URL (e.g., if the user pastes `nextjs.org/docs`, it should not crawl `nextjs.org/blog`).
- **Page Limit**: Hard limit of 50 pages to control token costs and processing time.
- **Excluded Selectors**: Configure Firecrawl to skip headers, footers, and navigation elements.

### Check when done
- `FIRECRAWL_API_KEY` is verified in `.env.local`.
- `POST /api/crawl` returns a 200 with an array of markdown strings for a valid docs URL.
- The crawler correctly respects the path prefix and page limit.
- Errors (e.g., invalid URL, timeout, rate limit) are handled and returned as JSON responses.
