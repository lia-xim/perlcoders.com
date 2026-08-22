# PerlCoders Page Action Matrix

Each indexable URL has one primary user job. Actions are based on repository/live evidence on 2026-08-22, not assumed rankings.

| Canonical URL | Primary user job | Action | Evidence state |
|---|---|---|---|
| `/` | Choose the relevant PerlCoders section or tool. | Keep; clarify routes through hubs. | Verified |
| `/now/` | Find current, maintained Perl practice. | Strengthen as guides ship. | Supported |
| `/now/modern-perl-http-client/` | Choose a Perl HTTP client for stated constraints. | Strengthen with primary docs; keep untested badge. | Supported |
| `/now/cron-jobs/` | Make recurring jobs operationally safe. | Keep; same-intent legacy replacement. | Verified |
| `/rescue/` | Choose a safe maintenance path for inherited CGI systems. | Strengthen internal links. | Supported |
| `/rescue/cgi-guestbook/` | Recognise risk classes in a bounded CGI example. | Keep; independent review still desirable. | Supported |
| `/rescue/cgi-to-psgi/` | Plan a behaviour-preserving CGI-to-PSGI migration. | Strengthen from Rescue hub. | Supported |
| `/compare/` | Understand the comparison method and pick a task-scoped comparison. | Keep. | Verified |
| `/compare/perl-vs-python-text-pipelines/` | Decide between Perl and Python for one log-shaping task. | Keep; no benchmark claim. | Supported |
| `/timeline/` | Explore sourced programmable-web events by era. | Keep. | Verified |
| `/timeline/cgi-pm-removed/` | Understand why CGI.pm left Perl core. | Keep. | Verified |
| `/labs/` | Select an auditable local-first tool or report. | Strengthen with rules link. | Verified |
| `/labs/legacy-url-mapper/` | Group a legacy URL inventory without uploading it. | Keep; add direct method path. | Verified |
| `/labs/url-normalisation-rules/` | Reproduce and challenge every Mapper rule. | Publish and measure. | Experiment |
| `/labs/reports/crawl-budget/` | Design a measurement of legacy-catalogue crawl cost. | Keep; no fabricated result. | Supported |
| `/archive/` | Find a rights-safe historical product record. | Strengthen with decision method. | Verified |
| `/archive/methodology/` | Understand how restore/redirect/404/410/hold decisions are made. | Publish and measure. | Experiment |
| `/archive/simplering/` | Resolve the documented SimpleRing legacy intent. | Keep precise redirect target. | Verified |
| `/archive/totalnews/` | Resolve the documented TotalNews legacy intent. | Keep precise redirect target. | Verified |
| `/archive/simlegallery/` | Resolve the documented, misspelled SimleGallery intent. | Keep precise redirect target. | Verified |
| `/archive/wedding-registry/` | Resolve the documented WeddingRegistry intent. | Keep precise redirect target. | Verified |
| `/archive/urlspider/` | Resolve the documented URLSpider intent. | Keep precise redirect target. | Verified |
| `/archive/linkchecker/` | Resolve the documented LinkChecker intent. | Keep precise redirect target. | Verified |
| `/archive/easyresponder/` | Resolve the exact product-name URL while showing the evidence gap. | Keep; remove product-specific risk inference. | Hypothesis |
| `/archive/autopic/` | Resolve the exact product-name URL while showing the evidence gap. | Keep; remove product-specific risk inference. | Hypothesis |
| `/archive/bannerfarm/` | Resolve the exact product-name URL while showing the evidence gap. | Keep; remove product-specific risk inference. | Hypothesis |
| `/archive/totalavs-pro/` | Resolve encoded name variants without guessing the purpose. | Keep. | Hypothesis |
| `/pulse/` | Find edited publication updates and open calls. | Keep. | Supported |
| `/pulse/2026-08/` | Read the relaunch record and current evidence requests. | Keep. | Verified |
| `/about/` | Verify current ownership, mission and historical boundary. | Keep. | Verified |
| `/editorial-policy/` | Understand sourcing, correction and disclosure rules. | Keep. | Verified |
| `/contribute/` | Submit a question, correction or rights-described artifact. | Keep as the common next step. | Verified |
| `/code-of-conduct/` | Understand participation and reporting expectations. | Keep. | Verified |
| `/legal-notice/` | Identify the current provider and editorial responsibility. | Keep. | Verified |
| `/privacy/` | Understand actual data processing and tool residency. | Keep aligned with code. | Verified |
| `/terms/` | Understand use and contribution boundaries. | Keep. | Verified |
| `/cookies/` | Verify that the current build writes no cookies or storage. | Keep aligned with code. | Verified |
| `/accessibility/` | Understand tested accessibility scope and report a barrier. | Keep. | Verified |

## Non-indexable utility and error surfaces

| URL/class | Job | Action |
|---|---|---|
| `/search/` | Filter the local site index. | Keep `noindex,follow`; refresh entries when routes ship. |
| `/404.html` and unknown paths | Explain that no equivalent was found. | Keep noindex and truthful navigation. |
| `/410/` and retired endpoint rewrites | Explain intentional permanent removal. | Keep noindex/410. |
| Unknown legacy product values | Preserve uncertainty. | Return 404/noindex; never catch-all redirect. |

## Cannibalisation and pruning decision

The two new pages have different jobs from their parent tool and archive hub: one documents deterministic normalisation; the other documents editorial/rights decisions after normalisation. No current page performs either job in full. Reconstructed product pages remain under observation: without GSC or qualified-link evidence, deindexing or consolidation is not proven.
