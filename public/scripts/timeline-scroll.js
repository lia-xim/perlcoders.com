/* ==========================================================================
   PerlCoders — Timeline scroll behaviour
   --------------------------------------------------------------------------
   The chronology runs top to bottom. As you scroll, three things track your
   position: the rail fills, the node you have passed turns solid, and the
   sticky meter names the decade and event you are currently in.

   Progressive by construction, in three layers:

     1. No JavaScript at all — every event is laid out, in order, fully
        readable. The rail is a plain hairline and the progress bar is
        authored `hidden`, so nothing renders in a broken half-state.
     2. JavaScript but no GSAP (CDN blocked, offline) — the module detects
        the missing library and returns without touching anything. Same
        result as layer 1.
     3. GSAP + ScrollTrigger — the rail scrubs, nodes light as they pass,
        cards fade up once.

   Reduced motion is handled by kind rather than by switching off wholesale:
   the reveal animation is a translate on an axis and goes away entirely, but
   the scroll-linked progress stays. A progress readout is a direct response
   to the reader's own scrolling, not autonomous motion, and removing it would
   cost information without removing a vestibular trigger.

   Filtering lives in js/timeline.js. This module watches for the resulting
   `hidden` changes and refreshes ScrollTrigger, so the rail stays honest
   after a filter rather than measuring a layout that no longer exists.
   ========================================================================== */

(function () {
  "use strict";

  var root = document.querySelector("[data-tlv]");
  if (!root) return;

  var events = Array.prototype.slice.call(root.querySelectorAll(".tl-event"));
  if (!events.length) return;

  var lineFill = root.querySelector("[data-tlv-line-fill]");
  var progress = root.querySelector("[data-tlv-progress]");
  var barFill = root.querySelector("[data-tlv-progress-fill]");
  var eraOut = root.querySelector("[data-tlv-era]");
  var stream = root.querySelector("[data-tlv-stream]");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Layer 2: no GSAP, no behaviour. The page is already correct without it.
  if (!window.gsap || !window.gsap.registerPlugin || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  if (progress) progress.hidden = false;

  /* ---- 1 · Rail and bar scrub ------------------------------------------ */
  if (stream && (lineFill || barFill)) {
    gsap.to([lineFill, barFill].filter(Boolean), {
      // The line grows downward, the bar grows rightward.
      height: function (_i, target) { return target === lineFill ? "100%" : null; },
      width: function (_i, target) { return target === barFill ? "100%" : null; },
      ease: "none",
      scrollTrigger: {
        trigger: stream,
        start: "top 60%",
        end: "bottom 70%",
        scrub: 0.35
      }
    });
  }

  /* ---- 2 · Node state and the sticky era readout ------------------------ */
  function label(el) {
    var title = el.querySelector(".tl-title");
    var year = el.querySelector("[data-tlv-year]");
    return {
      year: year ? year.textContent.trim() : "",
      title: title ? title.textContent.trim() : ""
    };
  }

  function announce(el) {
    if (!eraOut) return;
    var decade = el.getAttribute("data-decade");
    var l = label(el);
    eraOut.innerHTML = "";
    var b = document.createElement("b");
    b.textContent = decade ? decade + "s" : l.year;
    eraOut.appendChild(b);
    eraOut.appendChild(document.createTextNode(" · " + l.title));
  }

  events.forEach(function (el) {
    ScrollTrigger.create({
      trigger: el,
      start: "top 65%",
      end: "bottom 35%",
      onEnter: function () { el.classList.add("is-passed"); announce(el); },
      onEnterBack: function () { el.classList.add("is-passed"); announce(el); },
      onLeaveBack: function () { el.classList.remove("is-passed"); }
    });
  });

  /* ---- 3 · Reveal ------------------------------------------------------- */
  if (!reduceMotion) {
    root.setAttribute("data-animate", "true");
    events.forEach(function (el) {
      el.classList.add("is-pending");
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.45,
            ease: "power2.out",
            onStart: function () { el.classList.remove("is-pending"); },
            clearProps: "transform"
          });
        }
      });
    });
    // Anything already above the fold on load should not wait for a scroll.
    ScrollTrigger.refresh();
  }

  /* ---- 4 · Stay correct after filtering --------------------------------- */
  var pending = null;
  var observer = new MutationObserver(function () {
    window.clearTimeout(pending);
    pending = window.setTimeout(function () { ScrollTrigger.refresh(); }, 120);
  });
  events.forEach(function (el) {
    observer.observe(el, { attributes: true, attributeFilter: ["hidden"] });
  });

  // A deep link jumps past the triggers that would have fired on the way down.
  if (window.location.hash) {
    window.setTimeout(function () {
      ScrollTrigger.refresh();
      var target = document.getElementById(window.location.hash.replace(/^#/, ""));
      if (!target || !target.classList.contains("tl-event")) return;
      var index = events.indexOf(target);
      events.slice(0, index + 1).forEach(function (el) { el.classList.add("is-passed"); });
      announce(target);
    }, 200);
  }
})();
