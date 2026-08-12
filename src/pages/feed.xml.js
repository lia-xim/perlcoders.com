import rss from "@astrojs/rss";
import { pages } from "../data/pages";

export async function GET(context) {
  const items = pages
    .filter((page) => page.published)
    .sort((a, b) => b.published.localeCompare(a.published))
    .map((page) => ({
      title: page.title.replace(/ \| PerlCoders(?: Archive| Labs)?$/, ""),
      description: page.description,
      pubDate: new Date(`${page.published}T12:00:00Z`),
      link: page.path
    }));

  return rss({
    title: "PerlCoders",
    description: "Practical Perl, honest language comparisons, web-automation tools and a sourced history of the programmable web.",
    site: context.site,
    items,
    customData: "<language>en</language>"
  });
}
