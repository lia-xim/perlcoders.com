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
})();
