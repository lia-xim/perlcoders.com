# PerlCoders

PerlCoders is an independent editorial publication and browser-based tool lab about modern Perl, maintainable web systems, and the history of the programmable web. This repository contains the complete production site for [perlcoders.com](https://perlcoders.com/).

The current project is a transparent relaunch under new ownership. It is not the former PerlCoders company, is not affiliated with the Perl Foundation, and does not restore historical customer accounts, downloads, licences, or support relationships.

## Stack

- Astro 5 with fully static output
- TypeScript
- GSAP and ScrollTrigger for progressive, reduced-motion-aware timeline movement
- Self-hosted IBM Plex Sans, IBM Plex Mono, and Newsreader fonts
- Vercel redirects and serverless handlers for truthful legacy URL responses
- No analytics, ad scripts, tracking pixels, third-party fonts, or hidden form endpoint

## Local development

```bash
corepack pnpm install
corepack pnpm dev
```

Production verification:

```bash
corepack pnpm verify
corepack pnpm preview
corepack pnpm qa:browser
```

`verify` runs Astro diagnostics, the production build, metadata and internal-link checks. Browser QA uses the locally installed Microsoft Edge executable; set `PERLCODERS_QA_URL` to test a different preview or deployment URL.

## Information architecture

- `/now/` — current, reviewed technical guides
- `/rescue/` — bounded legacy-system rescue work
- `/compare/` — explicit decision comparisons
- `/timeline/` — sourced history of Perl and the web
- `/labs/` — local-first browser tools and reproducible reports
- `/archive/` — neutral records of former PerlCoders products, never downloads
- `/pulse/` — dated editorial update notes

Search is intentionally local and excluded from the sitemap. Historical executable, commerce, account, and download paths return `410 Gone`. Known editorial URLs redirect to the nearest canonical page; unknown legacy script identifiers return a real `404`.

## Editorial and privacy rules

Claims that can become stale carry a reviewed date and should link to a primary source where possible. Unverified history stays visibly unverified. The archive documents the old site without implying product ownership, availability, safety, or support.

The labs run in the browser. Contribution forms validate locally and prepare a structured email in the visitor's mail application; the website does not upload or store the form data. See the public [editorial policy](https://perlcoders.com/editorial-policy/) and [privacy page](https://perlcoders.com/privacy/) for the published rules.

## Legacy import helper

The production source is already included. To repeat the one-time import from an authorized local export, set an explicit path:

```powershell
$env:PERLCODERS_LEGACY_SOURCE='D:\path\to\legacy-export'
corepack pnpm import:legacy
```

Never import old executables, customer data, commercial downloads, or material without publication rights.

## Deployment

The project targets Vercel. `vercel.json` contains the legacy redirect and response policy plus security and immutable-asset headers. No runtime secret is required.

```bash
vercel build
vercel deploy --prod
```

Before attaching the production domain, verify the canonical host, DNS, redirects, `404`/`410` behavior, security headers, sitemap, feed, and the current ownership disclosure.

## Licence and contributions

The repository is public for transparency and issue reporting. Source and original editorial content remain all rights reserved unless a file says otherwise; see [LICENSE.md](./LICENSE.md). Corrections with primary sources are welcome through GitHub issues.
