const archive = new Map([
  ["simplering", "/archive/simplering/"],
  ["easyresponder", "/archive/easyresponder/"],
  ["autopic", "/archive/autopic/"],
  ["bannerfarm", "/archive/bannerfarm/"],
  ["totalavspro", "/archive/totalavs-pro/"]
]);

function normalize(value) {
  return String(value || "").replace(/\+/g, " ").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export default function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host || "perlcoders.com"}`);
  const raw = url.searchParams.get("script");

  if (!raw || !raw.trim()) {
    response.setHeader("Location", "/archive/");
    return response.status(301).end();
  }

  const target = archive.get(normalize(raw));
  if (target) {
    response.setHeader("Location", target);
    return response.status(301).end();
  }

  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("X-Robots-Tag", "noindex, follow");
  return response.status(404).send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex, follow"><title>Archive entry not found | PerlCoders</title><body><main><h1>That historical product is not in the archive.</h1><p>The old catalogue value could not be matched. It is not redirected to the homepage because that would hide the missing resource.</p><p><a href="/archive/">Browse verified archive entries</a> · <a href="/search/">Search PerlCoders</a></p></main></body></html>`);
}
