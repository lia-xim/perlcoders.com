/* ==========================================================================
   PerlCoders — legacy redirect resolver
   --------------------------------------------------------------------------
   Pure, table-driven, no side effects. Runs in the browser and in Node.

   Contract, in order of precedence:
     1. Exact 410 paths.
     2. 410 prefixes.
     3. Query rules for catalogue pages (/main/scripts*.html?script=…).
        - known value   -> 301 to the Archive resource
        - unknown value -> 404. NEVER the homepage. This is the whole point.
        - missing param -> whatever `onMissingParam` says (301 to /archive/)
     4. Exact path rules.
     5. Fall through to 404.

   The rules live in content/redirects.json. No product name appears in this
   file, so adding an Archive entry is a content change, not a code change.
   ========================================================================== */

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PCRedirect = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var DEFAULT_ORIGIN = "https://perlcoders.com";

  /** Decode once, tolerating malformed percent-escapes instead of throwing. */
  function safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch (e) {
      return value;
    }
  }

  /**
   * Normalize a legacy catalogue identifier so that every historical spelling
   * of the same product collapses to one key.
   *
   *   "TotalAVS%20Pro" -> "totalavspro"
   *   "TotalAVS+Pro"   -> "totalavspro"
   *   "  SimpleRing "  -> "simplering"
   */
  function normalizeKey(raw) {
    if (raw === null || raw === undefined) return "";
    var s = String(raw);
    s = s.replace(/\+/g, " ");
    s = safeDecode(s);
    s = s.toLowerCase();
    s = s.replace(/[^a-z0-9]+/g, "");
    return s;
  }

  /** Split an input into { path, query } without requiring an absolute URL. */
  function parse(input, origin) {
    var base = origin || DEFAULT_ORIGIN;
    var url;
    try {
      url = new URL(String(input), base);
    } catch (e) {
      return null;
    }
    // Normalize the path: collapse duplicate slashes, keep the trailing slash.
    var path = url.pathname.replace(/\/{2,}/g, "/");
    return { path: path, params: url.searchParams, hash: url.hash };
  }

  function gone(reason) {
    return { status: 410, target: "/410/", reason: reason, rule: "gone" };
  }

  function notFound(reason, hint) {
    return { status: 404, target: "/404/", reason: reason, hint: hint || null, rule: "not-found" };
  }

  /**
   * @param {string} input  A legacy URL or path, e.g. "/main/scripts.html?script=SimpleRing"
   * @param {object} table  The parsed content/redirects.json
   * @returns {{status:number, target:string, reason:string, rule:string, hint?:string}}
   */
  function resolve(input, table) {
    if (!table) throw new Error("redirect table is required");
    var parsed = parse(input, table.origin);
    if (!parsed) return notFound("Unparseable URL", "malformed");

    var path = parsed.path;
    var i;

    // 1. Exact 410s.
    var goneExact = table.goneExact || [];
    for (i = 0; i < goneExact.length; i++) {
      if (goneExact[i].path === path) return gone(goneExact[i].reason);
    }

    // 2. 410 prefixes.
    var gonePrefixes = table.gonePrefixes || [];
    for (i = 0; i < gonePrefixes.length; i++) {
      if (path.indexOf(gonePrefixes[i].prefix) === 0) return gone(gonePrefixes[i].reason);
    }

    // 3. Query rules.
    var queryRules = table.queryRules || [];
    for (i = 0; i < queryRules.length; i++) {
      var rule = queryRules[i];
      if ((rule.paths || []).indexOf(path) === -1) continue;

      var raw = parsed.params.get(rule.param);
      if (raw === null || String(raw).trim() === "") {
        var miss = rule.onMissingParam || { status: 404, target: "/404/" };
        return {
          status: miss.status,
          target: miss.target,
          reason: "Catalogue page requested without a `" + rule.param + "` parameter",
          rule: rule.id + ":missing-param"
        };
      }

      var key = rule.matching === "exact" ? String(raw) : normalizeKey(raw);
      var target = Object.prototype.hasOwnProperty.call(rule.map, key) ? rule.map[key] : null;

      if (target) {
        return {
          status: 301,
          target: target,
          reason: "Legacy catalogue identifier resolved to its Archive resource",
          rule: rule.id + ":match",
          key: key
        };
      }

      var unknown = rule.onUnknownValue || { status: 404, target: "/404/" };
      // Guard rail, enforced here as well as in the tests: an unrecognised
      // identifier must not be swept to the homepage.
      if (unknown.target === "/" || unknown.target === "") {
        return notFound("Unknown catalogue identifier", "archive-lookup");
      }
      return {
        status: unknown.status,
        target: unknown.target,
        reason: "Unknown `" + rule.param + "` value — not present in the Archive",
        rule: rule.id + ":unknown-value",
        hint: unknown.hint || "archive-lookup",
        key: key
      };
    }

    // 4. Exact path rules.
    var pathRules = table.pathRules || [];
    for (i = 0; i < pathRules.length; i++) {
      if (pathRules[i].from === path) {
        return {
          status: pathRules[i].status,
          target: pathRules[i].to,
          reason: "Legacy path rule",
          rule: "path:" + pathRules[i].from
        };
      }
    }

    // 5. Nothing matched.
    return notFound("No rule matched", "no-rule");
  }

  /**
   * Emit the table as host redirect configuration. Static hosts cannot branch
   * on a query parameter with a plain rewrite file, so query rules are emitted
   * as edge/middleware pseudo-config and flagged. See README → Legacy routing.
   */
  function toHostConfig(table, flavour) {
    var lines = [];
    (table.goneExact || []).forEach(function (g) { lines.push(g.path + "  /410/  410"); });
    (table.gonePrefixes || []).forEach(function (g) { lines.push(g.prefix + "*  /410/  410"); });
    (table.pathRules || []).forEach(function (p) { lines.push(p.from + "  " + p.to + "  " + p.status); });
    (table.queryRules || []).forEach(function (r) {
      Object.keys(r.map).forEach(function (k) {
        r.paths.forEach(function (p) {
          lines.push("# query-conditional: " + p + "?" + r.param + "=" + k + " -> " + r.map[k] + " 301");
        });
      });
    });
    return "# " + (flavour || "generic") + " redirect rules — generated from content/redirects.json\n" + lines.join("\n") + "\n";
  }

  return { resolve: resolve, normalizeKey: normalizeKey, toHostConfig: toHostConfig };
});
