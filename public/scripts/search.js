/* ==========================================================================
   PerlCoders — site search
   --------------------------------------------------------------------------
   The index is the rendered list. Every page on the site is in the document
   before this file runs, so a reader without scripting gets the complete
   site index rather than an empty results pane. This module filters that
   list, keeps ?q= in sync so a result set is linkable, and marks matches.

   No network request is made. There is no search backend to leak a query to.
   ========================================================================== */

(function () {
  "use strict";

  var form = document.querySelector("[data-search]");
  if (!form) return;

  var input = document.getElementById("q");
  var list = document.querySelector("[data-results]");
  var countEl = document.querySelector("[data-result-count]");
  var liveEl = document.querySelector("[data-search-live]");
  var emptyEl = document.querySelector("[data-search-empty]");
  var termEl = document.querySelector("[data-search-term]");
  if (!input || !list) return;

  var results = Array.prototype.slice.call(list.querySelectorAll(".result"));

  // Cache the original markup once so repeated filtering never compounds
  // the <mark> wrappers.
  var records = results.map(function (el) {
    return {
      el: el,
      haystack: (el.textContent || "").toLowerCase(),
      targets: Array.prototype.slice.call(el.querySelectorAll("[data-mark]")).map(function (t) {
        return { node: t, html: t.innerHTML, text: t.textContent };
      })
    };
  });

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function highlight(rec, term) {
    rec.targets.forEach(function (t) {
      if (!term) { t.node.innerHTML = t.html; return; }
      var re = new RegExp("(" + escapeRe(term) + ")", "ig");
      t.node.innerHTML = escapeHtml(t.text).replace(re, "<mark>$1</mark>");
    });
  }

  function apply(term, push) {
    var q = String(term || "").trim().toLowerCase();
    var shown = 0;

    records.forEach(function (rec) {
      var ok = !q || rec.haystack.indexOf(q) > -1;
      rec.el.hidden = !ok;
      if (ok) { shown++; highlight(rec, q); }
    });

    if (countEl) {
      countEl.textContent = q
        ? shown + " of " + records.length + " pages match"
        : records.length + " pages · full site index";
    }
    if (termEl) termEl.textContent = q ? '"' + term.trim() + '"' : "everything";
    if (emptyEl) emptyEl.hidden = shown !== 0;
    if (liveEl) {
      liveEl.textContent = q
        ? shown + " results for " + term.trim() + "."
        : "Showing the full site index, " + records.length + " pages.";
    }

    if (push && window.history && window.history.replaceState) {
      var url = q ? "?q=" + encodeURIComponent(term.trim()) : window.location.pathname;
      window.history.replaceState(null, "", url);
    }
  }

  // Restore from the URL so a result set can be shared.
  var initial = new URLSearchParams(window.location.search).get("q") || "";
  if (initial) input.value = initial;
  apply(initial, false);

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    apply(input.value, true);
  });

  var t = null;
  input.addEventListener("input", function () {
    window.clearTimeout(t);
    t = window.setTimeout(function () { apply(input.value, true); }, 180);
  });
})();
