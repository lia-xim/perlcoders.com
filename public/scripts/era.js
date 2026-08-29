/* ==========================================================================
   PerlCoders — era axis
   --------------------------------------------------------------------------
   Four dated nodes drive one specimen panel. This is the homepage's single
   purposeful interaction, and it is the site's own instrument rather than a
   generic tab strip: the rail is the same trace the Timeline draws, and the
   node labels are real events from content/timeline.json.

   Progressive by construction:
     · Without this file every specimen is in the document, in chronological
       order, each under its own legend. Nothing is hidden behind script.
     · With it, one specimen shows at a time and a real tablist carries the
       state — roving tabindex, arrow keys, Home and End.
     · Under prefers-reduced-motion there is no automatic step at all; the
       axis lands on the current era and the historical ones are one key away.

   The headline never waits on any of this: the h1 is plain markup above.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.querySelector("[data-era]");
  var spec = document.querySelector("[data-specimen]");
  if (!root || !spec) return;

  var tabs = Array.prototype.slice.call(root.querySelectorAll("[data-era-btn]"));
  var panes = Array.prototype.slice.call(spec.querySelectorAll("[data-specimen-pane]"));
  if (!tabs.length || !panes.length) return;

  var live = document.querySelector("[data-era-live]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stepped = false;

  function select(key, announce) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-era-btn") === key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panes.forEach(function (p) {
      p.hidden = p.getAttribute("data-specimen-pane") !== key;
    });
    if (announce && live) {
      var current = tabs.filter(function (t) { return t.getAttribute("data-era-btn") === key; })[0];
      if (current) {
        live.textContent = document.documentElement.lang === "de"
          ? "Gezeigt wird " + current.getAttribute("data-era-label") + "."
          : "Showing " + current.getAttribute("data-era-label") + ".";
      }
    }
  }

  spec.setAttribute("data-enhanced", "true");

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      stepped = true;           // a deliberate choice cancels the pending step
      select(tab.getAttribute("data-era-btn"), true);
      if (window.pcAnalyticsTrack) window.pcAnalyticsTrack("era_select", {
        era: tab.getAttribute("data-era-btn"), input: "click", language: document.documentElement.lang || "en"
      });
    });

    tab.addEventListener("keydown", function (e) {
      var next = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + tabs.length) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      stepped = true;
      select(tabs[next].getAttribute("data-era-btn"), true);
      tabs[next].focus();
      if (window.pcAnalyticsTrack) window.pcAnalyticsTrack("era_select", {
        era: tabs[next].getAttribute("data-era-btn"), input: "keyboard", language: document.documentElement.lang || "en"
      });
    });
  });

  if (reduceMotion) {
    // No motion, no automatic step. Land on the current era; the historical
    // specimens are one arrow key away and the hint says so.
    select("2026", false);
    return;
  }

  // One shot, never a loop: the trace advances from the CGI pattern to the
  // current one exactly once, then stops. Any interaction cancels it first.
  select("1997", false);
  window.setTimeout(function () {
    if (stepped) return;
    stepped = true;
    select("2026", true);
  }, 2600);

  root.addEventListener("pointerdown", function () { stepped = true; }, { once: true });
})();
