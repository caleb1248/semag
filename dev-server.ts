import { join } from "path";
const subpathPrefix = "kcartylop";

Bun.serve({
  port: 3000,
  fetch(req) {
    if (req.url.endsWith(".well-known/appspecific/com.chrom.devtools.json")) {
      return new Response("not found", { status: 404 });
    }
    if (req.url.endsWith("/")) {
      return new Response(Bun.file(subpathPrefix + new URL(req.url).pathname + "index.html"));
    }
    return new Response(Bun.file(subpathPrefix + new URL(req.url).pathname));
  },
});

console.log("Server running at http://localhost:3000");
