/* ==========================================================================
   PerlCoders — Timeline filters
   The events are real markup in document order. This module only hides and
   shows them, keeps a live count, and syncs the query string so a filtered
   view is linkable. With JS blocked the full chronology is still readable.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.querySelector("[data-timeline]");
  if (!root) return;

  var events = Array.prototype.slice.call(root.querySelectorAll(".tl-event"));
  var trackInputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-track]"));
  var decadeInputs = Array.prototype.slice.call(document.querySelectorAll("[data-filter-decade]"));
  var countEl = document.querySelector("[data-tl-count]");
  var resetBtn = document.querySelector("[data-tl-reset]");
  var liveEl = document.querySelector("[data-tl-live]");

  function selected(inputs) {
    return inputs.filter(function (i) { return i.checked; }).map(function (i) { return i.value; });
  }

  function apply(pushState) {
    var tracks = selected(trackInputs);
    var decades = selected(decadeInputs);
    var shown = 0;

    events.forEach(function (el) {
      var track = el.getAttribute("data-track");
      var decade = el.getAttribute("data-decade");
      var ok = (!tracks.length || tracks.indexOf(track) > -1) &&
               (!decades.length || decades.indexOf(decade) > -1);
      el.hidden = !ok;
      if (ok) shown++;
    });

    if (countEl) countEl.textContent = shown + " of " + events.length + " events";
    if (liveEl) liveEl.textContent = shown + " events shown.";
    if (resetBtn) resetBtn.hidden = !(tracks.length || decades.length);

    if (pushState && window.history && window.history.replaceState) {
      var params = new URLSearchParams();
      if (tracks.length) params.set("track", tracks.join(","));
      if (decades.length) params.set("decade", decades.join(","));
      var qs = params.toString();
      window.history.replaceState(null, "", qs ? "?" + qs : window.location.pathname);
    }
  }

  // Restore state from the URL so a filtered Timeline can be shared.
  (function restore() {
    var params = new URLSearchParams(window.location.search);
    var tracks = (params.get("track") || "").split(",").filter(Boolean);
    var decades = (params.get("decade") || "").split(",").filter(Boolean);
    trackInputs.forEach(function (i) { i.checked = tracks.indexOf(i.value) > -1; });
    decadeInputs.forEach(function (i) { i.checked = decades.indexOf(i.value) > -1; });
  })();

  trackInputs.concat(decadeInputs).forEach(function (input) {
    input.addEventListener("change", function () { apply(true); });
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      trackInputs.concat(decadeInputs).forEach(function (i) { i.checked = false; });
      apply(true);
    });
  }

  apply(false);

  // Deep-linked event: reveal it regardless of filter state and move focus.
  // Uses scrollTo rather than scrollIntoView so embedded previews keep working.
  var hash = window.location.hash.replace(/^#/, "");
  if (hash) {
    var target = document.getElementById(hash);
    if (target && target.classList.contains("tl-event")) {
      target.hidden = false;
      target.setAttribute("data-open", "true");
      var y = target.getBoundingClientRect().top + window.pageYOffset - 96;
      window.scrollTo({ top: y, behavior: "auto" });
      var link = target.querySelector("a");
      if (link) link.focus({ preventScroll: true });
    }
  }

})();
