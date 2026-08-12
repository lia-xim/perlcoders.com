/* ==========================================================================
   PerlCoders — comparison instruments
   --------------------------------------------------------------------------
   Two modules, both progressive. With this file blocked the page still shows
   both implementations in full and the complete dimension table; all that is
   lost is the ability to interrogate them.

     1. Cross-implementation map
        A line diff between two languages is noise — the lines were never
        going to match. So the two files are segmented by *concept* instead,
        and selecting a concept marks the corresponding lines on both sides
        and states what actually differs there.

     2. Weighting
        The reader assigns importance to each dimension and the page reports
        where their own weighting lands. This is deliberately not a score we
        publish: it is their priority ordering applied to our evidence, it is
        labelled as such, and a dimension we have no basis for cannot be
        counted no matter how heavily they weight it.
   ========================================================================== */

(function () {
  "use strict";

  /* --- 1. Cross-implementation map -------------------------------------- */
  (function crossMap() {
    var root = document.querySelector("[data-xmap]");
    if (!root) return;

    var steps = Array.prototype.slice.call(root.querySelectorAll("[data-xmap-step]"));
    var segments = Array.prototype.slice.call(root.querySelectorAll("[data-step]"));
    var notes = Array.prototype.slice.call(root.querySelectorAll("[data-xmap-note]"));
    var live = root.querySelector("[data-xmap-live]");
    if (!steps.length || !segments.length) return;

    var active = null;

    function clear() {
      segments.forEach(function (s) {
        s.classList.remove("is-hit");
        s.classList.remove("is-dim");
      });
      steps.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      notes.forEach(function (n) { n.hidden = n.getAttribute("data-xmap-note") !== "none"; });
      active = null;
      if (live) live.textContent = "Showing both implementations in full.";
    }

    function focus(key) {
      segments.forEach(function (s) {
        var hit = s.getAttribute("data-step") === key;
        s.classList.toggle("is-hit", hit);
        s.classList.toggle("is-dim", !hit);
      });
      steps.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-xmap-step") === key));
      });
      notes.forEach(function (n) { n.hidden = n.getAttribute("data-xmap-note") !== key; });
      active = key;

      if (live) {
        var count = segments.filter(function (s) { return s.getAttribute("data-step") === key; }).length;
        var label = steps.filter(function (b) { return b.getAttribute("data-xmap-step") === key; })[0];
        live.textContent = (label ? label.getAttribute("data-xmap-label") : key) +
          " — " + count + " marked passages across both implementations.";
      }
    }

    steps.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-xmap-step");
        if (active === key) clear(); else focus(key);
      });
    });

    var reset = root.querySelector("[data-xmap-reset]");
    if (reset) {
      reset.hidden = false;
      reset.addEventListener("click", clear);
    }

    clear();
  })();

  /* --- 2. Weighting ------------------------------------------------------ */
  (function weighting() {
    var root = document.querySelector("[data-weigh]");
    if (!root) return;

    var rows = Array.prototype.slice.call(root.querySelectorAll("[data-weigh-row]"));
    var out = document.querySelector("[data-weigh-out]");
    if (!rows.length || !out) return;

    var altName = root.getAttribute("data-alt-name") || "the alternative";
    var fills = {
      perl: out.querySelector('[data-w-fill="perl"]'),
      alt: out.querySelector('[data-w-fill="alt"]')
    };
    var scores = {
      perl: out.querySelector('[data-w-score="perl"]'),
      alt: out.querySelector('[data-w-score="alt"]')
    };
    var lists = {
      perl: out.querySelector('[data-w-list="perl"]'),
      alt: out.querySelector('[data-w-list="alt"]')
    };
    var verdict = out.querySelector("[data-w-verdict]");
    var excluded = out.querySelector("[data-w-excluded]");
    var live = out.querySelector("[data-w-live]");

    function weightOf(row) {
      var checked = row.querySelector('input[type="radio"]:checked');
      return checked ? parseInt(checked.value, 10) || 0 : 0;
    }

    function render() {
      var tally = { perl: 0, alternative: 0 };
      var named = { perl: [], alternative: [] };
      var uncounted = [];

      rows.forEach(function (row) {
        var w = weightOf(row);
        var lean = row.getAttribute("data-lean");
        var countable = row.getAttribute("data-countable") !== "false";
        var name = row.getAttribute("data-name") || row.getAttribute("data-dim");

        if (!countable) {
          if (w > 0) uncounted.push(name);
          return;
        }
        if (w === 0 || !(lean in tally)) return;
        tally[lean] += w;
        named[lean].push(name + (w === 2 ? " (decisive)" : ""));
      });

      var total = tally.perl + tally.alternative;
      var pctPerl = total ? Math.round((tally.perl / total) * 100) : 0;
      var pctAlt = total ? 100 - pctPerl : 0;

      if (fills.perl) fills.perl.style.width = pctPerl + "%";
      if (fills.alt) fills.alt.style.width = pctAlt + "%";
      if (scores.perl) scores.perl.textContent = tally.perl + " of " + total;
      if (scores.alt) scores.alt.textContent = tally.alternative + " of " + total;
      if (lists.perl) lists.perl.textContent = named.perl.length ? named.perl.join(" · ") : "nothing weighted";
      if (lists.alternative) lists.alternative.textContent = "";
      if (lists.alt) lists.alt.textContent = named.alternative.length ? named.alternative.join(" · ") : "nothing weighted";

      var text;
      if (total === 0) {
        text = "Nothing is weighted yet. Set what actually matters on your job and the bars will " +
               "show where the evidence we have lands — not who wins.";
      } else if (tally.perl === tally.alternative) {
        text = "Your weighting splits evenly. That is a real result, not a failure of the tool: on this " +
               "task the two are close, and the tie-breaker is the constraint you have not told us about — " +
               "usually the host you are allowed to install on.";
      } else {
        var front = tally.perl > tally.alternative ? "Perl" : altName;
        var lead = Math.abs(tally.perl - tally.alternative);
        text = "Under your weighting, more of the evidence we have points to " + front + " — by " +
               lead + " weight " + (lead === 1 ? "point" : "points") + ". That is your priority ordering " +
               "applied to our dimensions. It is not a verdict, and it changes the moment your constraints do.";
      }
      if (verdict) verdict.innerHTML = "<strong>" + (total ? "Where your weighting lands." : "Nothing weighted yet.") +
        "</strong> " + text;

      if (excluded) {
        if (uncounted.length) {
          excluded.hidden = false;
          excluded.textContent = "Not counted: " + uncounted.join(", ") +
            ". You weighted " + (uncounted.length === 1 ? "a dimension" : "dimensions") +
            " we have no basis for — no benchmark was run — so it cannot enter the tally. " +
            "We are not going to invent a value to make your weighting resolve.";
        } else {
          excluded.hidden = true;
          excluded.textContent = "";
        }
      }

      if (live) {
        live.textContent = total
          ? "Perl " + tally.perl + ", " + altName + " " + tally.alternative + " of " + total + " weight points."
          : "No dimensions weighted.";
      }
    }

    root.addEventListener("change", function (e) {
      if (e.target && e.target.type === "radio") render();
    });

    var reset = root.querySelector("[data-weigh-reset]");
    if (reset) {
      reset.hidden = false;
      reset.addEventListener("click", function () {
        rows.forEach(function (row) {
          var zero = row.querySelector('input[type="radio"][value="0"]');
          if (zero) zero.checked = true;
        });
        render();
      });
    }

    out.hidden = false;
    render();
  })();
})();
