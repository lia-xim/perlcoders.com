/* ==========================================================================
   PerlCoders Labs — Legacy URL Mapper
   --------------------------------------------------------------------------
   Local-first. No network call is made with your input; there is no fetch,
   no beacon, no storage write anywhere in this file. Verify it — that is the
   point of shipping the source unminified.

   The analysis core (normalize / group / classify / toCsv) is exported so
   the test harness can assert against it without a DOM.
   ========================================================================== */

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PCMapper = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TRACKING = [
    "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id",
    "gclid", "fbclid", "msclkid", "yclid", "igshid", "mc_cid", "mc_eid", "_ga", "ref_src"
  ];

  function isTracking(name) {
    var n = name.toLowerCase();
    if (TRACKING.indexOf(n) > -1) return true;
    return n.indexOf("utm_") === 0;
  }

  function safeDecode(v) {
    try { return decodeURIComponent(String(v).replace(/\+/g, " ")); } catch (e) { return String(v); }
  }

  /**
   * Normalize one URL. Deliberately conservative: it never invents a scheme
   * for a path-only input and never drops a non-tracking parameter.
   */
  function normalize(raw) {
    var original = String(raw).trim();
    if (!original || original.charAt(0) === "#") return null;

    // Reject before parsing rather than after. `new URL('/x', base)` happily
    // accepts almost anything as a path, so a line like "htp:/typo here" would
    // otherwise be normalised into a plausible-looking path and disappear into
    // a group. Silently swallowing a malformed line is the worst failure mode
    // a migration tool can have.
    if (/\s/.test(original)) {
      return { ok: false, original: original, error: "Contains whitespace — percent-encode it or split the line" };
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(original) && !/^https?:\/\//i.test(original)) {
      return { ok: false, original: original, error: "Unsupported or malformed URL scheme" };
    }

    var url, pathOnly = false;
    try {
      if (/^https?:\/\//i.test(original)) {
        url = new URL(original);
      } else {
        pathOnly = true;
        url = new URL(original.charAt(0) === "/" ? original : "/" + original, "http://placeholder.invalid");
      }
    } catch (e) {
      return {
        ok: false,
        original: original,
        error: "Could not be parsed as a URL or path"
      };
    }

    var host = pathOnly ? "" : url.hostname.toLowerCase();
    var port = pathOnly ? "" : url.port;
    if ((url.protocol === "http:" && port === "80") || (url.protocol === "https:" && port === "443")) port = "";

    var path = url.pathname.replace(/\/{2,}/g, "/");

    var kept = [];
    var stripped = [];
    url.searchParams.forEach(function (value, name) {
      var entry = { name: name, value: safeDecode(value) };
      if (isTracking(name)) stripped.push(entry); else kept.push(entry);
    });
    kept.sort(function (a, b) {
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase()) ||
             a.value.localeCompare(b.value);
    });

    var signature = kept.map(function (p) { return p.name.toLowerCase(); }).join("&");
    var valueKey = kept.map(function (p) { return p.name.toLowerCase() + "=" + p.value.toLowerCase(); }).join("&");

    var normalized = (pathOnly ? "" : url.protocol + "//" + host + (port ? ":" + port : "")) +
      path + (kept.length ? "?" + kept.map(function (p) {
        return p.name + "=" + p.value;
      }).join("&") : "");

    return {
      ok: true,
      original: original,
      host: host,
      path: path,
      params: kept,
      trackingStripped: stripped,
      signature: signature,
      valueKey: valueKey,
      normalized: normalized,
      groupKey: (host || "") + path + "?" + signature
    };
  }

  /**
   * Group and classify. Status meanings are documented on the Lab page and
   * repeated in the CSV, because a status without a reason is not auditable.
   */
  function analyze(text) {
    var lines = String(text || "").split(/\r?\n/);
    var records = [];
    var invalid = [];

    lines.forEach(function (line) {
      var r = normalize(line);
      if (r === null) return;
      if (!r.ok) { invalid.push(r); return; }
      records.push(r);
    });

    var groupIndex = {};
    var groups = [];
    records.forEach(function (r) {
      if (!Object.prototype.hasOwnProperty.call(groupIndex, r.groupKey)) {
        groupIndex[r.groupKey] = groups.length;
        groups.push({
          id: "G" + String(groups.length + 1).padStart(3, "0"),
          key: r.groupKey,
          host: r.host,
          path: r.path,
          signature: r.signature,
          records: [],
          distinctValues: {},
          distinctCount: 0
        });
      }
      var g = groups[groupIndex[r.groupKey]];
      g.records.push(r);
      if (!Object.prototype.hasOwnProperty.call(g.distinctValues, r.valueKey)) {
        g.distinctValues[r.valueKey] = 0;
        g.distinctCount++;
      }
      g.distinctValues[r.valueKey]++;
    });

    groups.forEach(function (g) {
      if (g.distinctCount > 1) {
        g.status = "review";
        g.reason = g.distinctCount + " distinct parameter value sets share this path and parameter signature. " +
                   "Collapsing them to one target would be a many-to-one redirect — decide per value.";
        g.proposedTarget = "";
      } else if (g.records.length > 1) {
        g.status = "duplicate";
        g.reason = g.records.length + " input URLs normalise to the same address. Keep one canonical form; redirect the rest.";
        g.proposedTarget = g.records[0].normalized;
      } else {
        g.status = "auto";
        g.reason = "Single URL, single value set. No collapse is implied by this list — the target still needs to exist.";
        g.proposedTarget = g.records[0].normalized;
      }
    });

    var stats = {
      input: records.length + invalid.length,
      parsed: records.length,
      invalid: invalid.length,
      groups: groups.length,
      review: groups.filter(function (g) { return g.status === "review"; }).length,
      duplicate: groups.filter(function (g) { return g.status === "duplicate"; }).length,
      auto: groups.filter(function (g) { return g.status === "auto"; }).length,
      trackingStripped: records.reduce(function (n, r) { return n + r.trackingStripped.length; }, 0)
    };

    return { records: records, invalid: invalid, groups: groups, stats: stats };
  }

  function csvCell(v) {
    var s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCsv(result) {
    var head = [
      "group_id", "status", "reason", "original_url", "normalized_url", "host",
      "path", "param_signature", "group_size", "distinct_value_sets",
      "tracking_stripped", "proposed_target", "decision"
    ];
    var rows = [head.join(",")];

    result.groups.forEach(function (g) {
      g.records.forEach(function (r) {
        rows.push([
          g.id, g.status, g.reason, r.original, r.normalized, r.host, r.path,
          r.signature, g.records.length, g.distinctCount,
          r.trackingStripped.map(function (t) { return t.name; }).join(" "),
          g.proposedTarget, "MANUAL REVIEW REQUIRED"
        ].map(csvCell).join(","));
      });
    });

    result.invalid.forEach(function (r) {
      rows.push(["", "invalid", r.error, r.original, "", "", "", "", "", "", "", "", "MANUAL REVIEW REQUIRED"]
        .map(csvCell).join(","));
    });

    return rows.join("\n") + "\n";
  }

  /* ---- DOM binding ----------------------------------------------------- */
  function mount() {
    var form = document.querySelector("[data-mapper]");
    if (!form) return;

    var input = form.querySelector("#mapper-urls");
    var sample = form.querySelector("[data-mapper-sample]");
    var clear = form.querySelector("[data-mapper-clear]");
    var out = document.querySelector("[data-mapper-out]");
    var statsEl = document.querySelector("[data-mapper-stats]");
    var tableWrap = document.querySelector("[data-mapper-table]");
    var empty = document.querySelector("[data-mapper-empty]");
    var errors = document.querySelector("[data-mapper-errors]");
    var exportBtn = document.querySelector("[data-mapper-export]");
    var live = document.querySelector("[data-mapper-live]");
    var last = null;

    function setStat(id, value) {
      var el = statsEl.querySelector('[data-stat="' + id + '"]');
      if (el) el.textContent = value;
    }

    function render(result) {
      last = result;
      out.hidden = false;

      setStat("input", result.stats.input);
      setStat("groups", result.stats.groups);
      setStat("review", result.stats.review);
      setStat("invalid", result.stats.invalid);

      if (!result.groups.length && !result.invalid.length) {
        empty.hidden = false;
        tableWrap.hidden = true;
        exportBtn.disabled = true;
        live.textContent = "No URLs recognised in the input.";
        return;
      }
      empty.hidden = true;
      tableWrap.hidden = false;
      exportBtn.disabled = false;

      var body = tableWrap.querySelector("tbody");
      body.innerHTML = "";

      result.groups.forEach(function (g) {
        g.records.forEach(function (r, i) {
          var tr = document.createElement("tr");

          var th = document.createElement("th");
          th.scope = "row";
          th.className = "mono";
          th.textContent = i === 0 ? g.id : "";
          tr.appendChild(th);

          var tdStatus = document.createElement("td");
          if (i === 0) {
            var span = document.createElement("span");
            span.className = "status-cell";
            span.setAttribute("data-status", g.status);
            span.textContent = g.status === "auto" ? "Unambiguous"
              : g.status === "review" ? "Manual review"
              : "Duplicate";
            tdStatus.appendChild(span);
          }
          tr.appendChild(tdStatus);

          var tdUrl = document.createElement("td");
          tdUrl.className = "mono";
          tdUrl.style.wordBreak = "break-all";
          tdUrl.textContent = r.original;
          tr.appendChild(tdUrl);

          var tdNorm = document.createElement("td");
          tdNorm.className = "mono";
          tdNorm.style.wordBreak = "break-all";
          tdNorm.textContent = r.normalized;
          tr.appendChild(tdNorm);

          var tdReason = document.createElement("td");
          tdReason.textContent = i === 0 ? g.reason : "";
          tr.appendChild(tdReason);

          body.appendChild(tr);
        });
      });

      errors.innerHTML = "";
      if (result.invalid.length) {
        var h = document.createElement("p");
        h.className = "small";
        h.innerHTML = "<strong>" + result.invalid.length + " line(s) could not be parsed.</strong> " +
          "They are kept in the CSV export with status <code>invalid</code> so nothing disappears silently.";
        errors.appendChild(h);
        var ul = document.createElement("ul");
        ul.className = "urlvariants";
        result.invalid.slice(0, 12).forEach(function (r) {
          var li = document.createElement("li");
          li.textContent = r.original + " — " + r.error;
          ul.appendChild(li);
        });
        errors.appendChild(ul);
        errors.hidden = false;
      } else {
        errors.hidden = true;
      }

      live.textContent = result.stats.parsed + " URLs parsed into " + result.stats.groups +
        " groups. " + result.stats.review + " need manual review.";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      render(analyze(input.value));
    });

    if (sample) {
      sample.addEventListener("click", function () {
        input.value = sample.getAttribute("data-mapper-sample");
        render(analyze(input.value));
      });
    }

    if (clear) {
      clear.addEventListener("click", function () {
        input.value = "";
        out.hidden = true;
        live.textContent = "Cleared.";
        input.focus();
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener("click", function () {
        if (!last) return;
        var blob = new Blob([toCsv(last)], { type: "text/csv;charset=utf-8" });
        var a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "legacy-url-map.csv";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      });
    }
  }

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
    else mount();
  }

  return { normalize: normalize, analyze: analyze, toCsv: toCsv, TRACKING: TRACKING };
});
