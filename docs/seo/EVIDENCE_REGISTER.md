# PerlCoders SEO Evidence Register

Reviewed: 2026-08-22
Scope: repository plus live HTTP/DNS checks. No paid API call was made.

## Verified

| ID | Claim | Evidence | Consequence |
|---|---|---|---|
| V1 | The apex homepage returns 200 from Vercel with HSTS, CSP, nosniff, frame denial, referrer and permissions policies. | Live response headers, 2026-08-22. | Keep the apex as the canonical host. |
| V2 | The live build is indexable and its robots file allows crawling and references the sitemap index. | Live `/robots.txt`, 2026-08-22. | Do not add a noindex gate. |
| V3 | The pre-change live sitemap contained 36 canonical, indexable URLs; search, 404 and 410 surfaces were excluded. | Live `/sitemap-0.xml` and local registry. | New canonical pages must enter the generated sitemap automatically. |
| V4 | Known product query URLs return precise 301 responses; an unknown product returns 404/noindex; retired executable paths return 410/noindex. | Live HTTP checks and `scripts/validate-recovery.mjs`. | Preserve precise actions and reject a homepage catch-all. |
| V5 | Four live resolver actions (EasyResponder, AutoPic, BannerFarm, TotalAVS Pro) were absent from the required action manifest. | Resolver map compared with `config/legacy-url-actions.json`. | Add explicit rows without inventing a reviewer or historical product facts. |
| V6 | Core content is present in static HTML; JavaScript is enhancement-only except for the local-first Mapper and search interaction. | Built HTML and page scripts. | Search engines and non-script users receive the editorial content. |
| V7 | No local Perl runtime is available for an executable example test. | Local command discovery, 2026-08-22. | Keep `codeTested:false`; add primary documentation, not a false test badge. |
| V8 | The accepted portfolio assignment remains Contextter, while PerlCoders is operated as a standalone publication archetype. | Portfolio dossier and Contextter project profile. | No strategy mutation and no portfolio link network. |

## Supported

| ID | Claim | Support | Boundary |
|---|---|---|---|
| S1 | Publishing the exact Mapper rules improves auditability and serves a distinct method intent. | Existing P0 content backlog, exported analysis core and browser QA. | Measure discovery and tool progression; do not claim search demand yet. |
| S2 | Publishing the Archive action method improves rights-safe historical resolution. | Operating contract, action manifest, rights evidence and existing archive disclaimers. | It explains decisions; it does not manufacture former-company continuity. |
| S3 | Existing hub pages are the right internal-link parents for the two method pages. | Site hierarchy and current navigation. | Links stay contextual inside Archive and Labs. |

## Hypotheses

| ID | Hypothesis | Needed evidence |
|---|---|---|
| H1 | The method pages will earn impressions for legacy URL mapping and redirect-decision queries. | GSC page/query data after sufficient crawl time. |
| H2 | Some reconstructed archive entries may be too thin to retain independently. | GSC impressions/clicks, qualified links and correction submissions per URL. |
| H3 | A tested Perl dependency/Unicode maintenance reference should be the next editorial guide. | Reproducible failing fixture, local/CI Perl matrix and reviewer availability. |
| H4 | The current `www` failure is a Vercel host-assignment problem rather than DNS propagation. | Vercel domain ownership/project inspection; DNS already resolves to a Vercel-generated CNAME. |

## Experiments

| ID | Change | Primary metric | Stop/adjust rule |
|---|---|---|---|
| E1 | Publish `/labs/url-normalisation-rules/`. | Impressions and clicks; Mapper visits from the page. | Merge into the tool page if it receives no distinct demand or creates cannibalisation. |
| E2 | Publish `/archive/methodology/`. | Impressions; archive-entry progression; evidence submissions. | Keep as governance documentation even if organic demand is low; avoid further archive fan-out without evidence. |
| E3 | Add primary module docs to the HTTP guide. | Corrections and engagement, not ranking promises. | Update claims when maintained docs change. |

## Rejected

- Blanket legacy-to-homepage redirects.
- Copying former-company text, code, downloads, screenshots, logos, customers or authors.
- Treating generic CGI-era vulnerability classes as facts about an uninspected named product.
- New keyword, PAA, city or archive fan-out without a distinct user job and evidence.
- Paid DataForSEO refresh without new approval.
- Portfolio-wide reciprocal or exact-match links.
- Invented reviewer names, approval timestamps, benchmarks or Perl execution claims.
