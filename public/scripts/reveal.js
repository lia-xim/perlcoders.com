(function () {
  "use strict";
  var candidates = document.querySelectorAll(".sechead, .card, .evidence__item, .speclist > li, .frame, .fit__band, .pulse-entry");
  if (!candidates.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  // If this script arrives after the page has visibly painted for a while,
  // hiding already-visible content to replay its entrance would flash.
  if (window.performance && performance.now() > 2500) return;
  Array.prototype.forEach.call(candidates, function (element, index) {
    element.setAttribute("data-reveal", "");
    element.style.transitionDelay = Math.min(index % 4, 3) * 55 + "ms";
  });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -7%", threshold: .08 });
  candidates.forEach(function (element) { observer.observe(element); });
})();
