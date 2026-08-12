/* ==========================================================================
   PerlCoders — content schema validation
   The runtime counterpart to content/SCHEMA.md. In the Next.js target these
   become Zod schemas at build time; here they run in the test harness and in
   Node. Same rules, same failures.
   ========================================================================== */

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PCValidate = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function isDate(v) { return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v); }
  function isArr(v) { return Object.prototype.toString.call(v) === "[object Array]"; }
  function nonEmpty(v) { return isArr(v) && v.length > 0; }

  function push(errs, id, msg) { errs.push(id + ": " + msg); }

  function evidence(doc) {
    var errs = [];
    (doc.items || []).forEach(function (it) {
      if (typeof it.verified !== "boolean") push(errs, it.id, "`verified` must be boolean");
      if (it.verified && !it.source) push(errs, it.id, "verified:true requires `source`");
      if (it.verified && !isDate(it.checkedOn)) push(errs, it.id, "verified:true requires an ISO `checkedOn`");
      if (it.value === null && !it.pendingText) push(errs, it.id, "value:null requires `pendingText`");
    });
    return errs;
  }

  function timeline(doc) {
    var errs = [];
    var open = 0;
    var trackIds = (doc.tracks || []).map(function (t) { return t.id; });
    (doc.events || []).forEach(function (ev) {
      if (trackIds.indexOf(ev.track) === -1) push(errs, ev.id, "unknown track `" + ev.track + "`");
      if (typeof ev.verified !== "boolean") push(errs, ev.id, "`verified` must be boolean");
      if (ev.verified && !nonEmpty(ev.sources)) push(errs, ev.id, "verified:true requires at least one source");
      if (ev.summary && !ev.whyItMattered) push(errs, ev.id, "published event requires `whyItMattered`");
      if (ev.summary && !ev.whatRemains) push(errs, ev.id, "published event requires `whatRemains`");
      if (!ev.summary && !ev.pendingText) push(errs, ev.id, "event without a summary requires `pendingText`");
      if (ev.isOpen) open++;
      if (ev.artifact && !ev.artifact.alt) push(errs, ev.id, "artifact requires `alt`");
      if (ev.artifact && !ev.artifact.rightsStatus) push(errs, ev.id, "artifact requires `rightsStatus`");
      (ev.sources || []).forEach(function (s) {
        if (!/^https?:\/\//.test(s.url) && s.url.charAt(0) !== "/") push(errs, ev.id, "source url must be absolute or root-relative");
      });
    });
    if (open > 1) push(errs, "timeline", "at most one event may set isOpen — found " + open);
    return errs;
  }

  function archive(doc) {
    var errs = [];
    (doc.items || []).forEach(function (it) {
      if (typeof it.downloadAllowed !== "boolean") push(errs, it.id, "`downloadAllowed` must be boolean");
      if (!it.statusLabel) push(errs, it.id, "`statusLabel` is required and is always rendered");
      if (!it.advisoryNote) push(errs, it.id, "`advisoryNote` is required even when there are no advisories");
      if (!it.formerPurpose) push(errs, it.id, "`formerPurpose` is required");
      else if (!it.formerPurpose.note) push(errs, it.id, "`formerPurpose.note` must explain how we know, or that we do not");
      if (!it.rights || !it.rights.status) push(errs, it.id, "`rights.status` is required");
      if (!nonEmpty(it.historicalUrls)) push(errs, it.id, "at least one historical URL is required");
    });
    return errs;
  }

  function stories(doc) {
    var errs = [];
    var sectionIds = (doc.sections || []).map(function (s) { return s.id; });
    (doc.items || []).forEach(function (it) {
      if (sectionIds.indexOf(it.section) === -1) push(errs, it.id, "unknown section `" + it.section + "`");
      if (it.status === "published") {
        if (!isDate(it.published)) push(errs, it.id, "published story requires an ISO `published` date");
        if (!isDate(it.reviewed)) push(errs, it.id, "published story requires an ISO `reviewed` date");
      }
      if (typeof it.codeTested !== "boolean") push(errs, it.id, "`codeTested` must be boolean");
    });
    return errs;
  }

  function comparison(doc) {
    var errs = [];
    (doc.items || []).forEach(function (it) {
      if (!nonEmpty(it.limitations)) push(errs, it.id, "`limitations` must be non-empty");
      if (!nonEmpty(it.methodology)) push(errs, it.id, "`methodology` must be non-empty");
      if (!isDate(it.reviewed)) push(errs, it.id, "`reviewed` must be an ISO date");
      (it.dimensions || []).forEach(function (d) {
        if (!d.basis) push(errs, it.id + "/" + d.id, "dimension requires a `basis`");
        if (d.confidence === "none" && d.leaning !== "unknown") {
          push(errs, it.id + "/" + d.id, "confidence:none requires leaning:unknown");
        }
        if (Object.prototype.hasOwnProperty.call(d, "rating") || Object.prototype.hasOwnProperty.call(d, "stars")) {
          push(errs, it.id + "/" + d.id, "rating/star fields are not permitted in this model");
        }
      });
      if (it.results && it.results.status === "recorded" && !nonEmpty(it.results.rows)) {
        push(errs, it.id, "results.status:recorded requires rows");
      }
    });
    return errs;
  }

  function labs(doc) {
    var errs = [];
    (doc.items || []).forEach(function (it) {
      if (!it.dataResidency || !it.dataResidency.statement) {
        push(errs, it.id, "`dataResidency.statement` is required and renders above the tool");
      }
      if (it.status !== "planned" && !nonEmpty(it.limits)) {
        push(errs, it.id, "a shipped lab requires a non-empty `limits` array");
      }
      if (it.status !== "planned" && !nonEmpty(it.methodology)) {
        push(errs, it.id, "a shipped lab requires a `methodology`");
      }
    });
    return errs;
  }

  function pulse(doc) {
    var errs = [];
    var banned = ["memberCount", "reactions", "views", "likes", "onlineNow"];
    (doc.issues || []).forEach(function (it) {
      if (!isDate(it.date)) push(errs, it.id, "`date` must be an ISO date");
      if (!nonEmpty(it.entries)) push(errs, it.id, "an issue requires entries");
      banned.forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(it, k)) push(errs, it.id, "`" + k + "` is not permitted — no fabricated social proof");
      });
    });
    return errs;
  }

  function redirects(doc) {
    var errs = [];
    (doc.queryRules || []).forEach(function (r) {
      if (!r.onUnknownValue) push(errs, r.id, "`onUnknownValue` is required");
      else if (r.onUnknownValue.target === "/" || r.onUnknownValue.target === "") {
        push(errs, r.id, "an unknown legacy identifier must never resolve to the homepage");
      }
      if (!nonEmpty(r.paths)) push(errs, r.id, "`paths` must be non-empty");
      Object.keys(r.map || {}).forEach(function (k) {
        if (k !== k.toLowerCase() || /[^a-z0-9]/.test(k)) {
          push(errs, r.id, "map key `" + k + "` is not in normalized form");
        }
      });
    });
    return errs;
  }

  var VALIDATORS = {
    "now.json": evidence,
    "timeline.json": timeline,
    "archive.json": archive,
    "stories.json": stories,
    "compare.json": comparison,
    "labs.json": labs,
    "pulse.json": pulse,
    "redirects.json": redirects
  };

  function validate(fileName, doc) {
    var fn = VALIDATORS[fileName];
    if (!fn) return ["unknown content file: " + fileName];
    return fn(doc);
  }

  return { validate: validate, validators: VALIDATORS };
});
