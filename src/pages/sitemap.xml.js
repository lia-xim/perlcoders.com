import { buildSitemap } from "../lib/sitemap.js";

export async function GET() {
  return new Response(buildSitemap(), {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
}
