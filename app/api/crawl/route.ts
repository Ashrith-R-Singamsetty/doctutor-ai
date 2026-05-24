import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CrawlRequestSchema } from "@/lib/validators";
import { crawlDocs } from "@/lib/firecrawl";

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Validate input
    const body = await req.json();
    const result = CrawlRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid URL provided", details: result.error.format() },
        { status: 400 }
      );
    }

    const { url } = result.data;

    // 3. Perform crawl
    console.log(`[Crawl] Starting crawl for: ${url} (User: ${userId})`);
    const docs = await crawlDocs(url);

    if (docs.length === 0) {
      return NextResponse.json(
        { error: "No documentation content found at the provided URL." },
        { status: 404 }
      );
    }

    // 4. Return results (Strictly follows { data: T } standard)
    return NextResponse.json({
      data: docs,
    });

  } catch (error: unknown) {
    console.error("[Crawl Error]", error);
    
    // Handle specific Firecrawl errors if needed
    const message = error instanceof Error ? error.message : "Internal Server Error";
    
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
