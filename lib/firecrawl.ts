import FirecrawlApp from "@mendable/firecrawl-js";
import { CrawlResponseSchema } from "./validators";
import { CrawledDoc } from "./types";

const getApp = () => {
  if (!process.env.FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not set in environment variables");
  }
  return new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY,
  });
};

/**
 * Crawls a documentation site and returns the markdown content of up to 50 pages.
 * Limits the crawl to the same domain and path prefix as the base URL.
 */
export async function crawlDocs(baseUrl: string): Promise<CrawledDoc[]> {
  const app = getApp();
  const crawlResponse = await app.crawl(baseUrl, {
    limit: 50,
    scrapeOptions: {
      formats: ["markdown"],
      onlyMainContent: true, // Skip headers, footers, and nav
    },
    allowExternalLinks: false,
    // The path prefix scoping is usually handled by firecrawl's default behavior 
    // when a path is provided.
  });

  if (crawlResponse.status !== "completed") {
    throw new Error(`Firecrawl job failed with status: ${crawlResponse.status}`);
  }

  if (!crawlResponse.data) {
    return [];
  }
  
  // Mapping the response to our expected format
  const docs = crawlResponse.data
    .filter((doc) => doc.markdown)
    .map((doc) => ({
      url: doc.metadata?.url || baseUrl,
      markdown: doc.markdown as string,
    }));

  return CrawlResponseSchema.parse(docs);
}
