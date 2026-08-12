export type PageKind = "website" | "article" | "techArticle" | "collection" | "legal";

export interface PageDefinition {
  source: string;
  path: string;
  title: string;
  description: string;
  robots?: string;
  kind: PageKind;
  scripts?: string[];
  published?: string;
  modified?: string;
}

export const pages: PageDefinition[] = [
  { source: "index", path: "/", title: "PerlCoders — practical Perl, language decisions and the programmable web", description: "An independent technical publication and tool lab: practical Perl, honest language comparisons, web-automation tools and a sourced history of the programmable web.", kind: "website", scripts: ["era", "home"] },
  { source: "now", path: "/now/", title: "Now — Perl as it is used in 2026 | PerlCoders", description: "Current Perl practice: releases, core modules, tooling and working code. Published guides plus everything currently in the backlog, with its real status.", kind: "collection" },
  { source: "guide-modern-perl-http-client", path: "/now/modern-perl-http-client/", title: "Making HTTP requests in Perl in 2026 | PerlCoders", description: "HTTP::Tiny is in core and does more than people expect. Mojo::UserAgent earns its dependency when you need concurrency or a DOM. Where the line actually falls.", kind: "techArticle", published: "2026-08-11", modified: "2026-08-12" },
  { source: "rescue-cgi-guestbook", path: "/rescue/cgi-guestbook/", title: "Script Rescue: a 1998 CGI guestbook, read line by line | PerlCoders", description: "Four vulnerability classes in ninety lines of 1998 CGI, then a rewrite that keeps the behaviour and drops the execution model.", kind: "techArticle", published: "2026-08-11", modified: "2026-08-12" },
  { source: "compare", path: "/compare/", title: "Compare — honest, task-scoped language comparisons | PerlCoders", description: "Language comparisons scoped to one task, with explainable decision dimensions, stated confidence, published methodology and named limitations. No star ratings.", kind: "collection" },
  { source: "compare-perl-vs-python-text-pipelines", path: "/compare/perl-vs-python-text-pipelines/", title: "Perl or Python for a log-shaping pipeline? | PerlCoders", description: "One task, two implementations, five explainable dimensions and three named limitations. No benchmark was run, and the page says so.", kind: "techArticle", scripts: ["compare"], published: "2026-08-11", modified: "2026-08-12" },
  { source: "timeline", path: "/timeline/", title: "Timeline — the programmable web, annotated and sourced | PerlCoders", description: "Seventeen events from Perl 1.0 to now, across five tracks, each with why it mattered, what remains today, and a visible verification state.", kind: "collection", scripts: ["timeline", "timeline-motion"] },
  { source: "timeline-event", path: "/timeline/cgi-pm-removed/", title: "The year CGI.pm left core — Timeline | PerlCoders", description: "Perl 5.22 removed CGI.pm from the standard distribution in 2015. Removing a module from core is a maintenance decision, not a verdict on the code.", kind: "article", published: "2026-08-11", modified: "2026-08-12" },
  { source: "labs", path: "/labs/", title: "Labs — local-first tools and the reports that explain them | PerlCoders", description: "Browser-only tools for web-automation work. Every lab states where your data goes, what it cannot do, and how it reached its output.", kind: "collection" },
  { source: "labs-legacy-url-mapper", path: "/labs/legacy-url-mapper/", title: "Legacy URL Mapper — Labs | PerlCoders", description: "A local-first browser tool that normalises legacy URLs, groups query-string patterns, flags duplicates and many-to-one collapses, and exports an auditable CSV.", kind: "website", scripts: ["url-mapper"] },
  { source: "labs-report-crawl-budget", path: "/labs/reports/crawl-budget/", title: "What a legacy query-string catalogue costs you in crawl budget | PerlCoders Labs", description: "Method and sample design for measuring the crawl cost of a legacy query-string catalogue — and an explicit statement of which numbers do not exist yet.", kind: "techArticle", published: "2026-08-11", modified: "2026-08-12" },
  { source: "archive", path: "/archive/", title: "Archive — historical software references | PerlCoders", description: "Neutral historical references for software formerly distributed by the original PerlCoders company. Nothing here is available, supported or recommended.", kind: "collection" },
  { source: "archive-simplering", path: "/archive/simplering/", title: "SimpleRing — historical software reference | PerlCoders Archive", description: "Historical software reference, discontinued. A Perl CGI script formerly distributed by the original PerlCoders company. Not available, not supported, not recommended.", kind: "article" },
  { source: "archive-easyresponder", path: "/archive/easyresponder/", title: "EasyResponder — historical software reference | PerlCoders Archive", description: "Historical software reference, discontinued. A Perl CGI script formerly distributed by the original PerlCoders company. Not available, not supported, not recommended.", kind: "article" },
  { source: "archive-autopic", path: "/archive/autopic/", title: "AutoPic — historical software reference | PerlCoders Archive", description: "Historical software reference, discontinued. A Perl CGI script formerly distributed by the original PerlCoders company. Not available, not supported, not recommended.", kind: "article" },
  { source: "archive-bannerfarm", path: "/archive/bannerfarm/", title: "BannerFarm — historical software reference | PerlCoders Archive", description: "Historical software reference, discontinued. A Perl CGI script formerly distributed by the original PerlCoders company. Not available, not supported, not recommended.", kind: "article" },
  { source: "archive-totalavs-pro", path: "/archive/totalavs-pro/", title: "TotalAVS Pro — historical software reference | PerlCoders Archive", description: "Historical software reference, discontinued. Purpose not established: we have a product name and one legacy URL, and we are not going to guess at the rest.", kind: "article" },
  { source: "pulse", path: "/pulse/", title: "Pulse — an edited periodical, not an activity feed | PerlCoders", description: "Pulse is an edited periodical: questions answered, corrections applied, and open calls for help. No member counts, no reaction counts, no leaderboard.", kind: "collection" },
  { source: "pulse-2026-08", path: "/pulse/2026-08/", title: "Pulse 01 — Relaunch | PerlCoders", description: "What this publication is, what it will not do, and the three things we most need help with.", kind: "article", published: "2026-08-11", modified: "2026-08-12" },
  { source: "about", path: "/about/", title: "About, history and disclosure | PerlCoders", description: "Who runs PerlCoders in 2026, what it is not, how claims are verified, and a full disclosure of the relationship with Contextter.", kind: "website" },
  { source: "editorial-policy", path: "/editorial-policy/", title: "Editorial policy | PerlCoders", description: "How PerlCoders sources, verifies, corrects and discloses. The rules that decide what gets published and what stays empty.", kind: "legal" },
  { source: "code-of-conduct", path: "/code-of-conduct/", title: "Code of conduct | PerlCoders", description: "The behaviour expected in every channel PerlCoders operates, how to report a problem, and what happens next.", kind: "legal" },
  { source: "contribute", path: "/contribute/", title: "Ask, correct, contribute | PerlCoders", description: "Ask a question, submit a correction, or submit a historical artifact with rights information. Everything is reviewed by an editor; nothing is published automatically.", kind: "website", scripts: ["forms"] },
  { source: "search", path: "/search/", title: "Search | PerlCoders", description: "Search the PerlCoders site index. Filtering happens in your browser; no query is sent anywhere.", robots: "noindex, follow", kind: "website", scripts: ["search"] },
  { source: "legal-notice", path: "/legal-notice/", title: "Legal notice | PerlCoders", description: "Provider identification under §5 DDG and §18 MStV, plus the editorial responsibility statement.", kind: "legal" },
  { source: "privacy", path: "/privacy/", title: "Privacy policy | PerlCoders", description: "What this site collects, what it does not, and what the local-first tools guarantee. GDPR information under Articles 13 and 14.", kind: "legal" },
  { source: "terms", path: "/terms/", title: "Terms of use | PerlCoders", description: "The terms under which this site is provided, what the Labs tools do and do not warrant, and how contributions are licensed.", kind: "legal" },
  { source: "cookies", path: "/cookies/", title: "Cookies and storage | PerlCoders", description: "This site sets no cookies. What it does use is browser storage for interface preferences, and here is exactly which keys and why.", kind: "legal" },
  { source: "accessibility", path: "/accessibility/", title: "Accessibility statement | PerlCoders", description: "What this site targets, what has been tested, what has not, and how to report a barrier.", kind: "legal" },
  { source: "410", path: "/410/", title: "Gone (410) | PerlCoders", description: "This endpoint is permanently gone and will not return. Here is exactly which category it falls into and why.", robots: "noindex, follow", kind: "website" }
];

export const pageByPath = new Map(pages.map((page) => [page.path, page]));
