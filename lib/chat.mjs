// Lógica do Diário com IA compartilhada entre server.mjs (local) e a
// Cloudflare Pages Function em functions/api/chat.js (produção).

export const maxRequestBytes = 24_000;
const model = "gemini-3.8-flash";
const maxHistoryItems = 12;
const maxMessageCharacters = 2_000;

const systemInstruction = `Você é a companhia acolhedora do Diário com IA do Love Journey. Responda sempre em português brasileiro, com empatia, atenção e respeito, como nos exemplos de conversa da tela. Ajude a pessoa a nomear sentimentos e entender a situação amorosa sem julgar, presumir fatos ou tomar partido sem contexto. Valide a experiência emocional sem afirmar que todo sentimento prova uma conclusão. Faça perguntas abertas quando ajudarem; ofereça sugestões práticas, gentis e equilibradas para comunicação, limites, confiança e autocuidado. Não dê ordens nem prometa resultados. Não se apresente como psicóloga ou terapeuta e não substitua apoio profissional. Se houver relato de violência, coerção, medo ou risco imediato, priorize segurança, incentive procurar alguém de confiança e serviços locais de emergência ou apoio. Seja calorosa, natural e concisa, sem listas longas por padrão. Não solicite dados pessoais identificáveis.`;

export const createRateLimiter = () => {
  const requestCounts = new Map();
  return (ip) => {
    const now = Date.now();
    const previous = requestCounts.get(ip);
    const current =
      !previous || now - previous.startedAt >= 60_000
        ? { startedAt: now, count: 0 }
        : previous;
    current.count += 1;
    requestCounts.set(ip, current);
    if (requestCounts.size > 5000) requestCounts.clear();
    return current.count <= 15;
  };
};

export const rateLimitError = {
  error:
    "Você enviou várias mensagens em pouco tempo. Aguarde um minuto e tente novamente.",
};

export const parsePayload = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    throw Object.assign(new Error("Não foi possível ler a mensagem."), {
      status: 400,
    });
  }
};

// Recebe o corpo já lido e devolve { status, body } para a resposta JSON.
export const generateReply = async (payload, apiKey) => {
  if (!apiKey) {
    return {
      status: 503,
      body: {
        error:
          "O diário com IA ainda não está configurado. Defina a chave Gemini no ambiente do servidor.",
      },
    };
  }

  try {
    if (
      !Array.isArray(payload?.messages) ||
      payload.messages.length === 0 ||
      payload.messages.length > maxHistoryItems
    ) {
      return { status: 400, body: { error: "Histórico de conversa inválido." } };
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
      return {
        status: 400,
        body: { error: "Envie uma mensagem antes de continuar." },
      };
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
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
        return {
          status: 429,
          body: {
            error:
              "O limite gratuito do Gemini foi atingido por enquanto. Aguarde e tente novamente.",
          },
        };
      }
      if ([401, 403].includes(geminiResponse.status)) {
        return {
          status: 503,
          body: {
            error:
              "A chave ou o acesso do Gemini precisa ser verificado no servidor.",
          },
        };
      }
      return {
        status: 502,
        body: {
          error:
            "O Gemini não conseguiu responder agora. Tente novamente em instantes.",
        },
      };
    }
    const candidate = result.candidates?.[0];
    const reply = candidate?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    if (!reply) {
      return {
        status: 502,
        body: {
          error:
            "Não recebi uma resposta do Gemini. Tente reformular sua mensagem.",
        },
      };
    }
    if (candidate.finishReason === "MAX_TOKENS") {
      return {
        status: 502,
        body: {
          error:
            "A resposta excedeu o limite do Gemini. Peça uma resposta mais breve.",
        },
      };
    }
    return { status: 200, body: { reply } };
  } catch (error) {
    if (error.name === "TimeoutError") {
      return {
        status: 504,
        body: {
          error: "O Gemini está demorando para responder. Tente novamente.",
        },
      };
    }
    return {
      status: error.status || 500,
      body: {
        error: error.message || "Não foi possível processar sua mensagem.",
      },
    };
  }
};
