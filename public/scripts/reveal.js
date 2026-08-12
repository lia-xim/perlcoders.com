(function () {
  "use strict";
  var candidates = document.querySelectorAll(".sechead, .card, .tl-event, .evidence__item, .speclist > li");
  if (!candidates.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
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
