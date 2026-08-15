import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = fileURLToPath(new URL("./public", import.meta.url));
const port = Number(process.env.PORT || 4789);
const host = process.env.HOST || "0.0.0.0";
const apiPort = 8080;

const api = spawn(process.execPath, ["/app/api/index.mjs"], {
  env: { ...process.env, PORT: String(apiPort), NODE_ENV: "production" },
  stdio: ["ignore", "inherit", "inherit"],
});

api.on("exit", (code) => {
  if (code && !process.exitCode) process.exitCode = code;
});

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' https://fonts.gstatic.com; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function writeHeaders(response, extra = {}) {
  response.writeHead(200, { ...securityHeaders, ...extra });
}

async function proxyApi(request, response) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  try {
    const upstream = await fetch(`http://127.0.0.1:${apiPort}${request.url}`, {
      method: request.method,
      headers: { "content-type": request.headers["content-type"] || "" },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : body,
    });
    const payload = Buffer.from(await upstream.arrayBuffer());
    response.writeHead(upstream.status, {
      ...securityHeaders,
      "content-type": upstream.headers.get("content-type") || "application/json",
      "cache-control": "no-store",
    });
    response.end(payload);
  } catch {
    response.writeHead(503, { ...securityHeaders, "content-type": "application/json" });
    response.end(JSON.stringify({ error: "Local API is unavailable" }));
  }
}

const server = createServer((request, response) => {
  if (!request.url) {
    response.writeHead(400, securityHeaders);
    response.end();
    return;
  }
  if (request.url.startsWith("/api/")) {
    void proxyApi(request, response);
    return;
  }
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { ...securityHeaders, allow: "GET, HEAD" });
    response.end();
    return;
  }

  const pathname = decodeURIComponent(request.url.split("?")[0]);
  const candidate = normalize(join(root, pathname === "/" ? "index.html" : pathname));
  if (!candidate.startsWith(root) || !existsSync(candidate) || !statSync(candidate).isFile()) {
    const fallback = join(root, "index.html");
    writeHeaders(response, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    createReadStream(fallback).pipe(response);
    return;
  }

  writeHeaders(response, {
    "content-type": mimeTypes[extname(candidate)] || "application/octet-stream",
    "cache-control": extname(candidate) === ".html" ? "no-store" : "public, max-age=31536000, immutable",
  });
  if (request.method === "HEAD") {
    response.end();
  } else {
    createReadStream(candidate).pipe(response);
  }
});

const shutdown = () => {
  api.kill("SIGTERM");
  server.close(() => process.exit(0));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
server.listen(port, host);