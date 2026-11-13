// extracts a .har file into a target directory

import { mkdir } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

const harFile = "funny-school.github.io.har"; // Replace with the path to your HAR file
const outputDirectory = "extracted";

type HarEntry = {
  request?: {
    method?: string;
    url?: string;
  };
  response?: {
    content?: {
      text?: string;
      encoding?: string;
    };
  };
};

type HarFile = {
  log?: {
    entries?: HarEntry[];
  };
};

const har = (await Bun.file(harFile).json()) as HarFile;
const entries = har.log?.entries ?? [];
const outputRoot = resolve(outputDirectory);

function pathForUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  const pathname = decodeURIComponent(url.pathname);
  const path = pathname === "/" || pathname.endsWith("/") ? `${pathname}index.html` : pathname;
  const destination = resolve(outputRoot, `.${path}`);

  // Do not allow malformed URLs or encoded traversal to write outside the
  // output directory.
  const pathFromOutputRoot = relative(outputRoot, destination);
  if (pathFromOutputRoot === ".." || pathFromOutputRoot.startsWith(`..${sep}`)) {
    throw new Error(`Refusing to write outside output directory: ${requestUrl}`);
  }

  return destination;
}

let extracted = 0;

for (const entry of entries) {
  if (entry.request?.method?.toUpperCase() !== "GET" || !entry.request.url) {
    continue;
  }

  const content = entry.response?.content;
  if (content?.text === undefined) {
    console.warn(`Skipping GET without a response body: ${entry.request.url}`);
    continue;
  }

  const destination = pathForUrl(entry.request.url);
  await mkdir(resolve(destination, ".."), { recursive: true });

  const body =
    content.encoding?.toLowerCase() === "base64"
      ? Uint8Array.from(atob(content.text), (character) => character.charCodeAt(0))
      : content.text;

  await Bun.write(destination, body);
  extracted++;
  console.log(`${entry.request.url} -> ${destination}`);
}

console.log(`Extracted ${extracted} GET response${extracted === 1 ? "" : "s"}.`);
