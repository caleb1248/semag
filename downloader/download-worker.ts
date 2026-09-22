/// <reference lib="WebWorker" />

import { untarBuffer } from "./untar-worker";

/**
 * Blob URLs are minted here and handed to the page as one path -> URL object.
 * They stay alive for the lifetime of the worker's global scope (i.e. the page),
 * so the page can just point fetch/XHR/img at them.
 */
let objectUrls: Record<string, string> = {};

/** Content types by extension, so blobs carry the MIME type the game expects. */
const contentTypes: Record<string, string> = {
  ".js": "application/javascript",
  ".json": "application/json",
  ".html": "text/html",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ogg": "audio/ogg",
  ".ico": "image/x-icon",
  ".wasm": "application/wasm",
  ".glb": "model/gltf-binary",
  ".track": "text/plain",
  ".woff2": "font/woff2",
};

/** Strip the leading `./` or `/` so tar names and request paths agree. */
function normalizePath(path: string): string {
  return path.replace(/^\.?\//, "");
}

function contentType(path: string): string {
  const dot = path.lastIndexOf(".");
  return (dot === -1 ? undefined : contentTypes[path.substring(dot)]) ?? "application/octet-stream";
}

async function loadArchive(tgz: ArrayBuffer): Promise<Record<string, string>> {
  const decompressor = new DecompressionStream("gzip");
  const decompressed = new Response(tgz).body!.pipeThrough(decompressor);
  const tar = await new Response(decompressed).arrayBuffer();

  console.log("tar bytelength:", tar.byteLength);

  // Reloading replaces the previous archive, so its URLs are dead weight.
  for (const url of Object.values(objectUrls)) URL.revokeObjectURL(url);
  objectUrls = {};

  for await (const f of untarBuffer(tar)) {
    // Directories, links and special files carry no data worth storing.
    if (f.type !== "0" && f.type !== "") continue;

    const path = normalizePath(f.name);
    objectUrls[path] = URL.createObjectURL(new Blob([f.buffer], { type: contentType(path) }));
  }

  return objectUrls;
}

type IncomingMessage = { type: "load"; buffer: ArrayBuffer };

self.addEventListener("message", async (e: MessageEvent<IncomingMessage>) => {
  const message = e.data;

  switch (message.type) {
    case "load": {
      try {
        const urls = await loadArchive(message.buffer);
        const count = Object.keys(urls).length;
        console.log("done extracting", count, "files");
        self.postMessage({ type: "loaded", count, urls });
      } catch (err) {
        console.error("Error during extraction:", err);
        for (const url of Object.values(objectUrls)) URL.revokeObjectURL(url);
        objectUrls = {};
        self.postMessage({ type: "error", message: String(err) });
      }
      break;
    }
  }
});
