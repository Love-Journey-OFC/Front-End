---
name: lj-diario-ia
description: Use ao mexer no Diário com IA, no proxy server.mjs, no prompt do Gemini ou ao integrar qualquer API externa no Love Journey. Cobre segurança de chaves, contrato do /api/chat, erros e o comportamento esperado da IA.
---

# Diário com IA e integrações de API

## Arquitetura

```
diario-com-ia.html + js/diario-com-ia.js
        │  POST /api/chat  { messages: [{ role: "user"|"model", text }] }
        ▼
server.mjs (Node 18+, sem dependências)  ── GEMINI_API_KEY do .env/ambiente
        │  generateContent (modelo gemini-3.8-flash)
        ▼
Gemini  →  { reply }  ou  { error: "mensagem em português" }
```

Rodar: `node server.mjs` → `http://127.0.0.1:4173` (a raiz abre `diario-com-ia.html`). Sem chave, o endpoint responde 503 com mensagem amigável, e a página deve continuar utilizável.

## Regras de segurança (inegociáveis)

- **Chave nunca no front-end.** Nada de chave em `.html`, `.js` ou commit. `.env` está no `.gitignore`; só `.env.example` (sem valor) é versionado.
- `js/teste.js` chama o Gemini direto do navegador. **Não use como referência** e não o carregue em página nenhuma.
- Toda API nova segue o mesmo modelo: rota no `server.mjs` + segredo em variável de ambiente + validação de entrada + limite de tamanho + timeout.
- Mantenha as proteções do servidor: limite de 24 KB por requisição, 12 mensagens, 2.000 caracteres por mensagem, 15 req/min por IP, timeout de 45 s e bloqueio de caminhos com `.` (protege `.env` e `.git`).
- Não registre no console o conteúdo das mensagens do usuário (são desabafos pessoais). O servidor só registra o status HTTP.

## Contrato de erros

O servidor devolve `{ error }` já em português e acolhedor, e o front exibe esse texto no status. Ao adicionar um caso de erro:

- traduza o status (429 limite, 401/403 configuração, 504 demora, 502 falha) para uma frase simples, sem jargão;
- no front, mantenha o padrão existente: desabilitar input e botão durante o envio, reabilitar no `finally`, mostrar erro com `status-error`, distinguir falha de rede (`TypeError`) de erro do servidor.

## Comportamento da IA

O `systemInstruction` em `server.mjs` define a persona. Ao editar, **preserve**:

- português brasileiro, tom caloroso, natural e conciso;
- ajudar a nomear sentimentos e refletir, sem julgar nem tomar partido;
- **não se apresentar como psicóloga ou terapeuta** e não substituir apoio profissional;
- em relato de violência, coerção, medo ou risco: priorizar segurança e indicar alguém de confiança e serviços de apoio/emergência;
- não pedir dados pessoais identificáveis;
- não dar ordens nem prometer resultados.

A IA é **apoio à reflexão, não diagnóstico**. Qualquer texto novo na tela do diário deve manter isso claro.

## Deploy

Hospedagem estática (Cloudflare Pages) não executa `server.mjs`. Para o chat funcionar publicado, é preciso o proxy Node no mesmo domínio ou uma Function/Worker equivalente com `GEMINI_API_KEY` como secret. Na apresentação local, confirme que a chave está no `.env` e faça uma mensagem de teste antes.
