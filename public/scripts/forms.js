(function () {
  "use strict";
  var forms = document.querySelectorAll("[data-validated-form]");
  if (!forms.length) return;

  function message(form, kind, label, body) {
    var status = form.querySelector("[data-form-status]");
    if (!status) return;
    status.hidden = false;
    status.className = "formstatus formstatus--" + kind;
    status.setAttribute("role", kind === "err" ? "alert" : "status");
    var labelNode = status.querySelector("[data-form-status-label]");
    var bodyNode = status.querySelector("[data-form-status-body]");
    if (labelNode) labelNode.textContent = label;
    if (bodyNode) bodyNode.textContent = body;
  }

  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var honeypot = form.querySelector("[data-honeypot] input");
      if (honeypot && honeypot.value) {
        message(form, "err", "Submission blocked", "The spam field was filled. Email the address on the About page if you are a person.");
        return;
      }
      if (!form.reportValidity()) return;

      var consent = form.querySelector("[data-consent]");
      if (consent && !consent.checked) {
        message(form, "err", "Not ready", "Confirm the handling note before continuing.");
        consent.focus();
        return;
      }

      var lines = [];
      new FormData(form).forEach(function (value, key) {
        if (key === "website" || key === "consent" || !String(value).trim()) return;
        lines.push(key.replace(/[-_]/g, " ") + ":\n" + String(value).trim());
      });
      var formName = form.getAttribute("data-form-name") || form.id || "Contribution";
      var subject = "PerlCoders — " + formName;
      var body = lines.join("\n\n") + "\n\nSent from " + window.location.href;

      message(form, "ok", "Ready in your email app", "Nothing was uploaded by this page. Sending remains your decision.");
      window.location.href = "mailto:info@matthiasramahi.de?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  });
})();
