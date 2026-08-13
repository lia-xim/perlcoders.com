/* ==========================================================================
   PerlCoders — homepage world choreography
   --------------------------------------------------------------------------
   The scroll story of the landing page. Three moves, nothing else:

     1. Boot: a single entrance sequence when the page loads — eyebrow,
        headline, body, then the era axis nodes in trace order. Runs once,
        under 1.2 seconds, never on reduced motion.
     2. Seams: the 2px signal edge on ink chapters draws itself from the
        left as the chapter enters. CSS resting state is the full line, so
        a blocked script or an old browser shows the finished seam.
     3. Diagram: the request-path SVG draws its connection lines once when
        it becomes visible.

   Layered like the timeline module: no JS → complete page; JS without GSAP
   → complete page; GSAP present → the three moves above. No pinning, no
   scroll-jacking, transform/opacity only.
   ========================================================================== */

(function () {
  "use strict";

  if (!window.gsap) return;
  var gsap = window.gsap;
  var hasST = Boolean(window.ScrollTrigger);
  if (hasST) gsap.registerPlugin(window.ScrollTrigger);

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return; // resting state is the finished state everywhere

  /* ---- 1 · Boot sequence ------------------------------------------------ */
  /* Only when the script arrives early enough to choreograph the first
     impression. On a slow connection the page has already painted — playing
     the entrance then would yank visible content backwards, which is worse
     than no entrance. */
  var hero = window.performance && performance.now() < 2500
    ? document.querySelector("[data-od-id='hero']")
    : null;
  if (hero) {
    var eyebrow = hero.querySelector(".masthead__eyebrow");
    var headline = hero.querySelector("h1");
    var body = hero.querySelector(".masthead__body");
    var actions = hero.querySelector(".masthead__actions");
    var nodes = hero.querySelectorAll(".era__node");
    var specimen = hero.querySelector(".specimen");
    var cue = hero.querySelector(".masthead__cue");

    var boot = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.55 } });
    boot
      .from(eyebrow, { y: 12, opacity: 0 }, 0)
      .from(headline, { y: 22, opacity: 0 }, 0.08)
      .from([body, actions], { y: 16, opacity: 0, stagger: 0.08 }, 0.22)
      .from(nodes, { x: -14, opacity: 0, stagger: 0.07, duration: 0.4 }, 0.3)
      .from([specimen, cue], { y: 18, opacity: 0, stagger: 0.1 }, 0.5);
  }

  /* ---- 2 · Seams --------------------------------------------------------- */
  if (hasST) {
    document.querySelectorAll(".band--cut").forEach(function (band) {
      gsap.fromTo(band, { "--seam": 0 }, {
        "--seam": 1,
        ease: "none",
        scrollTrigger: {
          trigger: band,
          start: "top 92%",
          end: "top 45%",
          scrub: 0.4
        }
      });
    });
  }

  /* ---- 3 · Diagram lines -------------------------------------------------- */
  if (hasST) {
    document.querySelectorAll(".diagram__svg").forEach(function (svg) {
      var lines = svg.querySelectorAll(".dg-line");
      if (!lines.length) return;
      lines.forEach(function (line) {
        var length = 0;
        try { length = line.getTotalLength(); } catch (e) { return; }
        if (!length) return;
        gsap.fromTo(line,
          { strokeDasharray: length, strokeDashoffset: length },
          {
            strokeDashoffset: 0,
            duration: 0.9,
            ease: "power1.inOut",
            scrollTrigger: { trigger: svg, start: "top 80%", once: true },
            onComplete: function () { gsap.set(line, { clearProps: "strokeDasharray,strokeDashoffset" }); }
          }
        );
      });
    });
  }
})();
