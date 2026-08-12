/* ==========================================================================
   PerlCoders — homepage interactions
   Three independent enhancements. Each one checks for its own markup and
   does nothing if it is absent. All three are progressive: the page is
   complete and readable with this file blocked.
   ========================================================================== */

(function () {
  "use strict";


  /* --- 1. Then / Now spread: tabbed topics --------------------------------
     A real tablist with roving tabindex and arrow-key support. Without JS
     every panel is visible in document order under its own heading. */
  (function thenNow() {
    var list = document.querySelector("[data-spread-tabs]");
    if (!list) return;

    var tabs = list.querySelectorAll("[role='tab']");
    if (!tabs.length) return;

    function select(index) {
      Array.prototype.forEach.call(tabs, function (tab, i) {
        var on = i === index;
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
    }

    Array.prototype.forEach.call(tabs, function (tab, i) {
      tab.addEventListener("click", function () { select(i); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") next = 0;
        if (e.key === "End") next = tabs.length - 1;
        if (next === null) return;
        e.preventDefault();
        select(next);
        tabs[next].focus();
      });
    });

    select(0);
  })();

  /* --- 2. Choose a language ----------------------------------------------
     Content comes from a JSON block in the page, not from this file. The
     verdict deliberately reports a confidence level and a "when this is the
     wrong call" line. There is no winner announcement. */
  (function chooser() {
    var root = document.querySelector("[data-chooser]");
    if (!root) return;

    var dataEl = document.getElementById("chooser-data");
    if (!dataEl) return;

    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }

    var options = root.querySelectorAll("[data-chooser-opt]");
    var verdict = root.querySelector("[data-verdict]");
    if (!options.length || !verdict) return;

    var slots = {
      task: verdict.querySelector("[data-slot='task']"),
      fit: verdict.querySelector("[data-slot='fit']"),
      summary: verdict.querySelector("[data-slot='summary']"),
      perl: verdict.querySelector("[data-slot='perl']"),
      other: verdict.querySelector("[data-slot='other']"),
      otherName: verdict.querySelector("[data-slot='otherName']"),
      caveat: verdict.querySelector("[data-slot='caveat']"),
      link: verdict.querySelector("[data-slot='link']"),
      segs: verdict.querySelectorAll("[data-seg]"),
      confLabel: verdict.querySelector("[data-slot='confLabel']")
    };

    function fill(id) {
      var v = data[id];
      if (!v) return;

      slots.task.textContent = v.task;
      slots.fit.textContent = v.fit;
      slots.summary.textContent = v.summary;
      slots.caveat.textContent = v.caveat;
      slots.otherName.textContent = v.alternative;

      slots.perl.innerHTML = "";
      v.perlWhen.forEach(function (t) {
        var li = document.createElement("li");
        li.textContent = t;
        slots.perl.appendChild(li);
      });

      slots.other.innerHTML = "";
      v.alternativeWhen.forEach(function (t) {
        var li = document.createElement("li");
        li.textContent = t;
        slots.other.appendChild(li);
      });

      Array.prototype.forEach.call(slots.segs, function (seg, i) {
        seg.setAttribute("data-on", String(i < v.confidence));
      });
      slots.confLabel.textContent = v.confidenceLabel;

      if (v.href) {
        slots.link.href = v.href;
        slots.link.hidden = false;
        slots.link.querySelector("[data-slot='linkLabel']").textContent = v.linkLabel;
      } else {
        slots.link.hidden = true;
      }

      verdict.hidden = false;
    }

    Array.prototype.forEach.call(options, function (opt) {
      opt.addEventListener("click", function () {
        Array.prototype.forEach.call(options, function (o) {
          o.setAttribute("aria-pressed", String(o === opt));
        });
        fill(opt.getAttribute("data-chooser-opt"));
      });
    });
  })();
})();
