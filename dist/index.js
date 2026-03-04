// server/index.ts
import { createServer } from "http";
import { parse } from "url";
import next from "next";
var dev = process.env.NODE_ENV !== "production";
var port = parseInt(process.env.PORT || "5000", 10);
var app = next({ dev });
var handle = app.getRequestHandler();
app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, "0.0.0.0", () => {
    console.log(`> Ready on http://0.0.0.0:${port}`);
  });
});
