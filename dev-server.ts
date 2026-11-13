/// <reference types="bun" />

import { createServer } from "node:http";

const subpathPrefix = "main";
const port = 3000;

createServer(async (req, res) => {
  console.log(req.method, req.url);

  const pathname = decodeURIComponent(new URL(req.url!, `http://${req.headers.host}`).pathname);

  if (pathname.endsWith(".well-known/appspecific/com.chrom.devtools.json")) {
    res.writeHead(404).end("not found");
    return;
  }

  const file = Bun.file(
    subpathPrefix + (pathname.endsWith("/") ? pathname + "index.html" : pathname),
  );
  if (!(await file.exists())) {
    console.log('did not exist');
    res.writeHead(404).end("not found");
    return;
  }

  res.writeHead(200, { "Content-Type": file.type });
  res.end(Buffer.from(await file.arrayBuffer()));
}).listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
