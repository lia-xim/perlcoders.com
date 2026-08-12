export default function handler(_request, response) {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  response.setHeader("X-Robots-Tag", "noindex, follow");
  response.setHeader("Cache-Control", "public, max-age=3600");
  return response.status(410).send(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex, follow"><title>Gone (410) | PerlCoders</title><body><main><h1>This historical endpoint is permanently gone.</h1><p>Executable CGI, commerce, account and download surfaces from the former company are not restored. No accounts, support relationship, software rights or safe binaries transferred with the domain.</p><p><a href="/archive/">Read the neutral archive</a> · <a href="/about/">Ownership disclosure</a></p></main></body></html>`);
}
