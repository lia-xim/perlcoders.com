/* ==========================================================================
   PerlCoders — site chrome
   Mobile navigation disclosure. Nothing else runs globally; every page-level
   behaviour lives in its own module and is loaded only where it is used.
   ========================================================================== */

(function () {
  "use strict";

  var toggle = document.querySelector("[data-nav-toggle]");
  var drawer = document.getElementById("nav-drawer");

  if (toggle && drawer) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      drawer.hidden = open;
      toggle.querySelector("[data-nav-label]").textContent = open ? "Menu" : "Close";
    });

    // Escape closes the drawer and returns focus to the trigger.
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || drawer.hidden) return;
      toggle.setAttribute("aria-expanded", "false");
      drawer.hidden = true;
      toggle.querySelector("[data-nav-label]").textContent = "Menu";
      toggle.focus();
    });
  }

  // Year stamps in the footer, so nothing goes stale silently.
  var year = String(new Date().getFullYear());
  Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
    el.textContent = year;
  });

  /* Program counter: a fixed debug readout of scroll position and current
     frame. Decorative and redundant — every frame announces itself in the
     flow — so the whole element is aria-hidden and built only when a page
     declares frames. Plain rAF; no library. */
  var frames = document.querySelectorAll("[data-frame]");
  if (frames.length && window.matchMedia("(min-width: 1360px)").matches) {
    document.body.setAttribute("data-counter", "");
    var counter = document.createElement("div");
    counter.className = "pc-counter";
    counter.setAttribute("aria-hidden", "true");
    counter.innerHTML =
      '<span class="pc-counter__track"><span class="pc-counter__fill"></span></span>' +
      '<span class="pc-counter__label">run <b data-pc-pct>0%</b> · <span data-pc-frame></span></span>';
    document.body.appendChild(counter);

    var fill = counter.querySelector(".pc-counter__fill");
    var pct = counter.querySelector("[data-pc-pct]");
    var frameOut = counter.querySelector("[data-pc-frame]");
    var ticking = false;

    var update = function () {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      fill.style.height = Math.round(ratio * 100) + "%";
      pct.textContent = Math.round(ratio * 100) + "%";
      var current = null;
      var anchor = window.innerHeight * 0.4;
      Array.prototype.forEach.call(frames, function (section) {
        if (section.getBoundingClientRect().top <= anchor) current = section;
      });
      frameOut.textContent = current ? current.getAttribute("data-frame") : "boot";
    };
    var request = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    update();
  }
})();
