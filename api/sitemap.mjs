import { buildSitemap } from "../src/lib/sitemap.js";

export default function handler(_request, response) {
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  return response.status(200).send(buildSitemap());
}
