// Cloudflare Pages Function: /api/chat em produção.
// Configure GEMINI_API_KEY como secret no projeto do Pages.
import {
  createRateLimiter,
  generateReply,
  maxRequestBytes,
  parsePayload,
  rateLimitError,
} from "../../lib/chat.mjs";

// Limite por instância do Worker (melhor esforço, como no server.mjs).
const allowRequest = createRateLimiter();

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });

export const onRequestPost = async ({ request, env }) => {
  if (!allowRequest(request.headers.get("CF-Connecting-IP") || "unknown")) {
    return json(429, rateLimitError);
  }
  if (!env.GEMINI_API_KEY) {
    const { status, body } = await generateReply(null, "");
    return json(status, body);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxRequestBytes) {
    return json(413, { error: "A conversa enviada é muito longa." });
  }
  let payload;
  try {
    payload = parsePayload(text);
  } catch (error) {
    return json(error.status, { error: error.message });
  }
  const { status, body } = await generateReply(payload, env.GEMINI_API_KEY);
  return json(status, body);
};

export const onRequest = () => json(405, { error: "Método não permitido." });
