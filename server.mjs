import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRateLimiter,
  generateReply,
  maxRequestBytes,
  parsePayload,
  rateLimitError,
} from "./lib/chat.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const envFile = await readFile(path.join(root, ".env"), "utf8").catch(() => "");
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^\s*GEMINI_API_KEY\s*=\s*(.*?)\s*$/);
  if (!match || process.env.GEMINI_API_KEY) continue;
  const value = match[1].replace(/^(['"])(.*)\1$/, "$2");
  if (value && !value.startsWith("#")) process.env.GEMINI_API_KEY = value;
}
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);
const allowRequest = createRateLimiter();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

const sendJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(body));
};

const readJson = async (request) => {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxRequestBytes)
      throw Object.assign(new Error("A conversa enviada é muito longa."), {
        status: 413,
      });
    chunks.push(chunk);
  }
  return parsePayload(Buffer.concat(chunks).toString("utf8"));
};

const handleChat = async (request, response) => {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }
  if (!allowRequest(request.socket.remoteAddress || "unknown")) {
    sendJson(response, 429, rateLimitError);
    return;
  }
  if (!process.env.GEMINI_API_KEY) {
    const { status, body } = await generateReply(null, "");
    sendJson(response, status, body);
    return;
  }

  let payload;
  try {
    payload = await readJson(request);
  } catch (error) {
    sendJson(response, error.status || 500, {
      error: error.message || "Não foi possível processar sua mensagem.",
    });
    return;
  }
  const { status, body } = await generateReply(
    payload,
    process.env.GEMINI_API_KEY,
  );
  sendJson(response, status, body);
};

const server = createServer(async (request, response) => {
  const url = new URL(
    request.url,
    `http://${request.headers.host || "localhost"}`,
  );
  if (url.pathname === "/api/chat") {
    await handleChat(request, response);
    return;
  }
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405);
    response.end("Method Not Allowed");
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400);
    response.end("Bad Request");
    return;
  }
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = path.resolve(root, relativePath);
  if (
    !filePath.startsWith(`${root}${path.sep}`) ||
    relativePath.split(/[\\/]/).some((part) => part.startsWith("."))
  ) {
    response.writeHead(404);
    response.end("Not Found");
    return;
  }
  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) throw new Error("Not a file");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type":
        mimeTypes[path.extname(filePath).toLowerCase()] ||
        "application/octet-stream",
      "Content-Length": body.length,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(404);
    response.end("Not Found");
  }
});

server.listen(port, host, () => {
  console.log(`Love Journey disponível em http://${host}:${port}`);
});
