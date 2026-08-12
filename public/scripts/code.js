/* ==========================================================================
   PerlCoders — code surface helpers
   Copy-to-clipboard on blobs. The button is authored hidden and is only
   revealed when the API is actually available, so no control is shown that
   cannot work. Nothing else on the page depends on this file.
   ========================================================================== */

(function () {
  "use strict";

  if (!navigator.clipboard || !window.isSecureContext) return;

  var buttons = document.querySelectorAll("[data-copy]");
  Array.prototype.forEach.call(buttons, function (btn) {
    var targetId = btn.getAttribute("data-copy");
    var target = document.getElementById(targetId);
    if (!target) return;

    btn.hidden = false;

    btn.addEventListener("click", function () {
      navigator.clipboard.writeText(target.textContent.replace(/\s+$/, "") + "\n").then(
        function () { flash("Copied"); },
        function () { flash("Copy failed"); }
      );
    });

    function flash(label) {
      var original = btn.getAttribute("data-label") || "Copy";
      btn.textContent = label;
      var live = document.querySelector("[data-copy-live]");
      if (live) live.textContent = label + " — " + (target.getAttribute("data-copy-name") || "code block");
      window.setTimeout(function () { btn.textContent = original; }, 1800);
    }
  });
})();
