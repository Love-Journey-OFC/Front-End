import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const model = "gemini-3.8-flash";
const maxRequestBytes = 24_000;
const maxHistoryItems = 12;
const maxMessageCharacters = 2_000;
const requestCounts = new Map();

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

const systemInstruction = `Você é a companhia acolhedora do Diário com IA do Love Journey. Responda sempre em português brasileiro, com empatia, atenção e respeito, como nos exemplos de conversa da tela. Ajude a pessoa a nomear sentimentos e entender a situação amorosa sem julgar, presumir fatos ou tomar partido sem contexto. Valide a experiência emocional sem afirmar que todo sentimento prova uma conclusão. Faça perguntas abertas quando ajudarem; ofereça sugestões práticas, gentis e equilibradas para comunicação, limites, confiança e autocuidado. Não dê ordens nem prometa resultados. Não se apresente como psicóloga ou terapeuta e não substitua apoio profissional. Se houver relato de violência, coerção, medo ou risco imediato, priorize segurança, incentive procurar alguém de confiança e serviços locais de emergência ou apoio. Seja calorosa, natural e concisa, sem listas longas por padrão. Não solicite dados pessoais identificáveis.`;

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
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw Object.assign(new Error("Não foi possível ler a mensagem."), {
      status: 400,
    });
  }
};

const allowRequest = (request, response) => {
  const now = Date.now();
  const ip = request.socket.remoteAddress || "unknown";
  const previous = requestCounts.get(ip);
  const current =
    !previous || now - previous.startedAt >= 60_000
      ? { startedAt: now, count: 0 }
      : previous;
  current.count += 1;
  requestCounts.set(ip, current);
  if (requestCounts.size > 5000) requestCounts.clear();
  if (current.count > 15) {
    sendJson(response, 429, {
      error:
        "Você enviou várias mensagens em pouco tempo. Aguarde um minuto e tente novamente.",
    });
    return false;
  }
  return true;
};

const handleChat = async (request, response) => {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Método não permitido." });
    return;
  }
  if (!allowRequest(request, response)) return;
  if (!process.env.GEMINI_API_KEY) {
    sendJson(response, 503, {
      error:
        "O diário com IA ainda não está configurado. Defina a chave Gemini no ambiente do servidor.",
    });
    return;
  }

  try {
    const payload = await readJson(request);
    if (
      !Array.isArray(payload.messages) ||
      payload.messages.length === 0 ||
      payload.messages.length > maxHistoryItems
    ) {
      sendJson(response, 400, { error: "Histórico de conversa inválido." });
      return;
    }
    let messages = payload.messages.map((message) => ({
      role: message?.role,
      parts: [
        {
          text:
            typeof message?.text === "string"
              ? message.text.trim().slice(0, maxMessageCharacters)
              : "",
        },
      ],
    }));
    while (messages[0]?.role === "model") messages.shift();
    messages = messages.reduce((history, message) => {
      const previous = history[history.length - 1];
      if (previous?.role === message.role)
        previous.parts[0].text += `\n${message.parts[0].text}`;
      else history.push(message);
      return history;
    }, []);
    if (
      messages.some(
        (message) =>
          !["user", "model"].includes(message.role) || !message.parts[0].text,
      ) ||
      messages[messages.length - 1].role !== "user"
    ) {
      sendJson(response, 400, {
        error: "Envie uma mensagem antes de continuar.",
      });
      return;
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: messages,
          generationConfig: {
            thinkingConfig: { thinkingLevel: "low" },
            maxOutputTokens: 1_200,
          },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );
    const result = await geminiResponse.json().catch(() => ({}));
    if (!geminiResponse.ok) {
      console.error("Gemini API returned HTTP", geminiResponse.status);
      if (geminiResponse.status === 429) {
        sendJson(response, 429, {
          error:
            "O limite gratuito do Gemini foi atingido por enquanto. Aguarde e tente novamente.",
        });
      } else if ([401, 403].includes(geminiResponse.status)) {
        sendJson(response, 503, {
          error:
            "A chave ou o acesso do Gemini precisa ser verificado no servidor.",
        });
      } else {
        sendJson(response, 502, {
          error:
            "O Gemini não conseguiu responder agora. Tente novamente em instantes.",
        });
      }
      return;
    }
    const candidate = result.candidates?.[0];
    const reply = candidate?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!reply) {
      sendJson(response, 502, {
        error:
          "Não recebi uma resposta do Gemini. Tente reformular sua mensagem.",
      });
      return;
    }
    if (candidate.finishReason === "MAX_TOKENS") {
      sendJson(response, 502, {
        error:
          "A resposta excedeu o limite do Gemini. Peça uma resposta mais breve.",
      });
      return;
    }
    sendJson(response, 200, { reply });
  } catch (error) {
    if (error.name === "TimeoutError") {
      sendJson(response, 504, {
        error: "O Gemini está demorando para responder. Tente novamente.",
      });
      return;
    }
    sendJson(response, error.status || 500, {
      error: error.message || "Não foi possível processar sua mensagem.",
    });
  }
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
  const relativePath =
    pathname === "/" ? "diario-com-ia.html" : pathname.slice(1);
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
