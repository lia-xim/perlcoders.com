/* PerlCoders analytics events.
   Page views are handled by Umami. This layer records only bounded interaction
   names and static route context. It never sends link text, form values,
   search terms, mapper input, URL query strings or hashes. */
(function () {
  "use strict";

  function track(name, data) {
    if (!window.umami || typeof window.umami.track !== "function") return;
    try { window.umami.track(name, data || {}); } catch (error) { /* analytics must never break the page */ }
  }

  function placement(element) {
    if (element.closest(".site-nav__primary")) return "header_primary";
    if (element.closest(".site-nav__utility")) return "header_utility";
    if (element.closest(".site-nav__drawer")) return "mobile_drawer";
    if (element.closest(".rebuild-strip")) return "case_study_strip";
    if (element.closest(".site-footer__legalnav")) return "footer_legal";
    if (element.closest(".site-footer")) return "footer";
    if (element.closest("main")) return "content";
    return "other";
  }

  window.pcAnalyticsTrack = track;

  document.addEventListener("click", function (event) {
    var origin = event.target && event.target.nodeType === 3 ? event.target.parentElement : event.target;
    if (!origin || typeof origin.closest !== "function") return;

    var menu = origin.closest("[data-nav-toggle]");
    if (menu) {
      track("navigation_menu_toggle", {
        language: document.documentElement.lang || "en",
        state: menu.getAttribute("aria-expanded") === "true" ? "close" : "open"
      });
      return;
    }

    var link = origin.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    var locationName = placement(link);

    if (href.indexOf("mailto:") === 0) {
      track("contact_intent", { placement: locationName, source: window.location.pathname });
      return;
    }

    var destination;
    try { destination = new URL(href, window.location.href); } catch (error) { return; }

    if (link.hasAttribute("hreflang")) {
      track("language_switch", {
        from: document.documentElement.lang || "en",
        to: link.getAttribute("hreflang") || "unknown",
        destination: destination.pathname,
        placement: locationName
      });
      return;
    }

    if (destination.hostname && destination.hostname !== window.location.hostname) {
      track("external_link_click", {
        destination_host: destination.hostname,
        placement: locationName,
        source: window.location.pathname
      });
      return;
    }

    if (locationName === "case_study_strip") {
      track("case_study_click", {
        destination: destination.pathname,
        language: document.documentElement.lang || "en"
      });
      return;
    }

    if (locationName === "header_primary" || locationName === "header_utility" || locationName === "mobile_drawer" || locationName === "footer") {
      track("navigation_click", { destination: destination.pathname, placement: locationName });
      return;
    }

    if (locationName === "content") {
      track(destination.pathname === window.location.pathname && destination.hash ? "section_jump" : "content_link_click", {
        destination: destination.pathname,
        source: window.location.pathname
      });
    }
  });
})();
