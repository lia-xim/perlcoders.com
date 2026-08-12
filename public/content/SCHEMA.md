# Content models

These are the typed content collections for PerlCoders. They are written as
TypeScript declarations because that is what the Next.js target consumes
directly — drop this file's types into `content/config.ts` (Content Collections)
or a Zod schema and the JSON in this folder validates unchanged.

`js/validate-content.js` implements the same rules at runtime so the models are
enforced in this build too. `tests/index.html` runs that validator over every
file in this folder.

Two conventions carry the editorial contract and are enforced, not advisory:

1. **`verified` is never optional on a factual claim.** A record with
   `verified: false` must render a visible unverified marker. Templates are
   forbidden from silently presenting unverified data as fact.
2. **Absent means absent.** A missing number renders as a typed slot with a
   `pendingText`, never as a zero, a dash-with-no-explanation, or an estimate.

---

## Shared

```ts
type ISODate = string;              // "2026-08-11"
type Track   = "language" | "web" | "ecosystem" | "community" | "perlcoders";
type Status  = "draft" | "review" | "published";

interface Source {
  label: string;
  url: string;                      // must be absolute
}

interface Rights {
  status: string;                   // e.g. "No rights cleared"
  note: string;
}

/** Attached only where an image is displayed. No rights, no image. */
interface Artifact {
  src: string;
  alt: string;                      // required; never decorative on this site
  rightsHolder: string | null;
  rightsStatus: string;             // e.g. "Permission granted, 2026-07-04"
  sourceUrl: string | null;
  capturedOn: ISODate | null;
}
```

---

## `EvidenceItem` — `now.json` {#evidenceitem}

The homepage current-state strip.

```ts
interface EvidenceItem {
  id: string;
  label: string;
  value: string | null;             // null ⇒ render pendingText, never a guess
  verified: boolean;
  source: string | null;            // required when verified === true
  sourceLabel: string;
  sourceHint?: string;              // where an editor should go to confirm
  checkedOn: ISODate | null;        // required when verified === true
  pendingText: string | null;       // required when value === null
}
```

**Validator rules.** `verified === true` requires both `source` and `checkedOn`.
`value === null` requires `pendingText`.

---

## `TimelineEvent` — `timeline.json` {#timelineevent}

```ts
interface TimelineEvent {
  id: string;
  date: ISODate | null;             // null only for pending slots
  displayDate: string;              // "c. 1993", "Now" — human, not parsed
  year: number;
  decade: number;                   // 1980, 1990, 2000, 2010, 2020
  track: Track;
  title: string;
  summary: string | null;
  whyItMattered: string | null;     // required on every published event
  whatRemains: string | null;       // required on every published event
  hasPage: boolean;                 // true ⇒ /timeline-event.html?id=<id> exists
  slug: string;
  isOpen?: boolean;                 // the "Now" node; at most one
  verified: boolean;
  pendingText?: string;
  sources: Source[];                // non-empty when verified === true
  artifact: Artifact | null;
}
```

**Validator rules.** `verified === true` requires at least one `Source`.
At most one event may set `isOpen`. A published event (one with a `summary`)
requires both `whyItMattered` and `whatRemains` — the Timeline does not carry
bare facts.

---

## `ArchiveItem` — `archive.json` {#archiveitem}

```ts
interface ArchiveItem {
  id: string;
  slug: string;
  name: string;
  canonicalPath: string;            // production URL, e.g. "/archive/simplering/"
  staticFile: string;               // this build's file, e.g. "archive-simplering.html"
  status: "discontinued" | "historical-reference";
  statusLabel: string;              // rendered verbatim, always visible
  kind: string;
  era: string;
  eraVerified: boolean;
  description: string;              // original and neutral; never marketing copy
  formerPurpose: {
    text: string | null;            // null ⇒ "not established", and we say so
    verified: boolean;
    note: string;                   // how we know, or that we do not
  };
  historicalUrls: string[];
  securityAdvisories: Array<{ id: string; summary: string; source: Source }>;
  advisoryNote: string;             // shown even when the array is empty
  modernEquivalent: { summary: string; link: string | null; linkLabel: string | null };
  sources: Source[];
  rights: Rights;
  downloadAllowed: boolean;         // default false; templates check this
}
```

**Validator rules.** `downloadAllowed` must be present and boolean. The archive
template renders a download control **only** when it is exactly `true`. An empty
`securityAdvisories` array still requires a non-empty `advisoryNote` so absence
is never read as safety.

---

## `Story` — `stories.json` {#story}

```ts
interface Story {
  id: string;
  slug: string;
  path: string;
  section: "now" | "compare" | "timeline" | "rescue" | "labs";
  type: "guide" | "comparison" | "rescue" | "timeline-story" | "report";
  title: string;
  dek: string;
  readingMinutes: number;
  published: ISODate | null;        // null while status !== "published"
  reviewed: ISODate | null;
  status: Status;
  authors: string[];
  tags: string[];
  codeTested: boolean;              // shown on the page; do not set true casually
  commentsEnabled: boolean;
  contextterUsed?: boolean;         // triggers the disclosure component
  featured: boolean;
}
```

**Validator rules.** `status === "published"` requires `published` and
`reviewed`. Only published stories may appear in `sitemap.xml` or `feed.xml`.

---

## `Comparison` — `compare.json` {#comparison}

```ts
interface Dimension {
  id: string;
  label: string;
  perl: string | null;
  alternative: string | null;
  leaning: "perl" | "alternative" | "even" | "unknown";
  confidence: "high" | "medium" | "low" | "none";
  basis: string;                    // required; how we reached this
}

interface Comparison {
  id: string;
  slug: string;
  title: string;
  alternative: { name: string; version: string | null; versionVerified: boolean };
  task: { statement: string; constraints: string[] };
  decisionSummary: string;
  choosePerlWhen: string[];
  chooseAlternativeWhen: string[];
  environment: {
    os: string | null; cpu: string | null;
    perl: string | null; alternative: string | null;
    verified: boolean; pendingText?: string;
  };
  dimensions: Dimension[];
  results: {
    status: "not-run" | "recorded";
    note: string;
    rows: Array<{ label: string; perl: string; alternative: string; unit: string; runs: number }>;
  };
  methodology: string[];
  limitations: string[];            // required and non-empty
  reviewed: ISODate;
  correctionUrl: string;
  discussionUrl: string;
  status: Status;
}
```

**Validator rules.** `limitations` must be non-empty. There is no rating,
score or star field in this model, by design. `confidence: "none"` requires
`leaning: "unknown"` and null values — a dimension cannot lean without a basis.

---

## `Lab` — `labs.json` {#lab}

```ts
interface Lab {
  id: string;
  slug: string;
  path: string;
  name: string;
  status: "prototype" | "stable" | "planned";
  summary: string;
  dataResidency: { local: boolean; serverCalls: boolean; statement: string };
  inputs: Array<{ id: string; label: string; type: string; required: boolean; note: string }>;
  limits: string[];                 // required and non-empty for non-planned labs
  methodology: string[];
  exports: Array<{ format: string; label: string }>;
  reviewed: ISODate | null;
  reportPath: string | null;
  featured: boolean;
}
```

**Validator rules.** `dataResidency.statement` is required and is rendered
above the tool, before any input. A lab with `status !== "planned"` requires a
non-empty `limits` array.

---

## `PulseIssue` — `pulse.json` {#pulseissue}

```ts
interface PulseIssue {
  id: string;
  slug: string;
  path: string;
  number: number;
  title: string;
  date: ISODate;
  status: Status;
  summary: string;
  entries: Array<{ kind: "editorial" | "call" | "note" | "answer"; title: string; body: string }>;
}
```

There is deliberately **no** member count, reaction count, view count or
activity feed in this model. If a future release adds community metrics they
must come from real recorded events, and the field must carry the same
`verified` discipline as everything else.

---

## `RedirectTable` — `redirects.json` {#redirecttable}

```ts
interface RedirectTable {
  origin: string;
  queryRules: Array<{
    id: string;
    paths: string[];
    param: string;
    matching: "normalized" | "exact";
    map: Record<string, string>;
    onMissingParam: { status: number; target: string };
    onUnknownValue: { status: number; target: string; hint?: string };
  }>;
  pathRules: Array<{ from: string; status: number; to: string }>;
  gonePrefixes: Array<{ prefix: string; reason: string }>;
  goneExact: Array<{ path: string; reason: string }>;
  noindex: string[];
}
```

**Validator rules.** No `onUnknownValue.target` may be `/` — an unrecognised
legacy identifier must never resolve to the homepage. `tests/index.html`
asserts this directly.
