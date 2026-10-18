# Love Journey — Front-end

Aplicação web de autoconhecimento, comunicação e educação sobre relacionamentos para jovens e adolescentes. Feita em HTML, CSS e JavaScript, com um servidor Node.js que serve as páginas e faz a ponte com a IA do Diário.

## Como rodar

Requer Node.js 18 ou mais recente.

```powershell
copy .env.example .env   # preencha GEMINI_API_KEY
node server.mjs
```

Abra `http://127.0.0.1:4173`.

As páginas também abrem direto pelo arquivo ou em outro servidor estático, mas o Diário com IA só funciona pelo `server.mjs`, que expõe o endpoint `/api/chat`.

## Páginas

| Área | Página | Estilo | Script |
|---|---|---|---|
| Landing | `index.html` | `css/index.css` | `js/main.js` |
| Boas-vindas | `boas-vindas.html` | `css/autenticacao/autenticacao.css` | `js/autenticacao/script.js` |
| Entrar | `login.html` | `css/autenticacao/login.css` | `js/autenticacao/login.js` |
| Cadastro | `cadastro.html` | `css/autenticacao/cadastro.css` | `js/autenticacao/cadastro.js` |
| Dados profissionais | `cadastro-profissional.html` | `css/autenticacao/comprovantes.css` | `js/autenticacao/comprovantes.js` |
| Recuperar senha | `recuperar-senha.html` | `css/autenticacao/esqueci-senha.css` | `js/autenticacao/esqueci-senha.js` |
| Senha redefinida | `senha-redefinida.html` | `css/autenticacao/senha-redefinida.css` | — |
| Casal — Início | `dashboard-casal.html` | `css/dashboard-casal.css` | `js/dashboard-casal.js` |
| Casal — Diários | `diario-do-casal.html` | `css/diario-do-casal.css` | `js/diario-do-casal.js` |
| Casal — Diário com IA | `diario-com-ia.html` | `css/diario-com-ia.css` | `js/diario-com-ia.js` |
| Casal — Minhas emoções | `dashboard-emocoes.html` | `css/dashboard-emocoes.css` | `js/LJ.script.js` |
| Casal — Desafios | `desafios-do-casal.html` | `css/desafios-do-casal.css` | `js/desafios-do-casal.js` |
| Casal — Apoio | `apoio.html` | `css/apoio-psicologico.css` | `js/apoio.js` |
| Profissional — Início | `dashboard-profissional.html` | `css/dashboard-profissional.css` | `js/dashboard-profissional.js` |
| Profissional — Usuários | `usuarios-do-profissional.html` | `css/usuarios-do-profissional.css` | `js/usuarios.js` |
| Profissional — Comunidade | `comunidade.html` | `css/comunidade.css` | `js/comunidade.js` |

Fluxo de entrada: `index.html` → `boas-vindas.html` → `login.html` → `dashboard-casal.html` ou `dashboard-profissional.html`, conforme o perfil escolhido.

Os arquivos `acesso.html`, `comprovantes.html`, `esqueci-senha.html`, `css/auth.css` e os demais CSS/JS soltos na raiz de `css/` e `js/` sem par na tabela pertencem a uma versão anterior do fluxo de acesso (ver `docs/backlog.md`).

Imagens compartilhadas ficam em `assets/imgs/`.

## Dados

O projeto não usa backend nem banco de dados. Login e cadastro são simulados, e diários, emoções, desafios, comunidade e conversas com a IA ficam salvos no `localStorage` do navegador.

## Diário com IA (Gemini)

O chat passa por um proxy no servidor para manter a chave fora do navegador. A lógica fica em `lib/chat.mjs` e usa o modelo `gemini-3.8-flash`:

- **Local:** `server.mjs` lê `GEMINI_API_KEY` do `.env` (ou do ambiente).
- **Produção:** `functions/api/chat.js` (Cloudflare Pages Function) lê `GEMINI_API_KEY` dos secrets do projeto.

Observações:

- Nunca coloque a chave em arquivos HTML ou JavaScript do front-end.
- As mensagens são enviadas ao Gemini para gerar as respostas; o histórico fica no navegador.
- A cota do nível gratuito depende dos limites atuais da API. O Gemini às vezes fica indisponível por alguns instantes; a tela mostra uma mensagem amigável e basta tentar de novo.

## Deploy (Cloudflare Pages)

No projeto do Cloudflare Pages ligado a este repositório:

1. **Build command:** `node scripts/build-pages.mjs`
2. **Build output directory:** `dist`
3. **Settings → Variables and Secrets:** adicione `GEMINI_API_KEY` como *Secret* (Production e Preview).
4. Faça um novo deploy.

O build publica apenas as páginas, `assets/`, `css/` e `js/`. A pasta `functions/` é detectada automaticamente pelo Pages e cria o endpoint `/api/chat`.

## Para quem desenvolve

- `CLAUDE.md`: regras do projeto, identidade visual e mapa técnico.
- `docs/backlog.md`: pendências priorizadas.
- `node .claude/skills/lj-navegacao/scripts/verificar-links.mjs`: confere links, imagens e redirecionamentos de todas as páginas.
