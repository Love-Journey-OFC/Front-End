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

Todas as páginas carregam `css/base.css` (cores e fontes compartilhadas). As páginas internas também carregam `css/sidebar.css` (regras da sidebar comuns a todas elas).

Imagens compartilhadas ficam em `assets/imgs/`.

## Dados

O projeto não usa backend nem banco de dados. Tudo fica salvo no `localStorage` do navegador.

Nesta branch (`site-zerado`) o sistema começa **sem nenhum dado**:

- O cadastro cria uma conta de verdade no navegador (a senha é guardada só como hash) e o login confere e-mail e senha.
- Cada conta tem seus próprios diários, emoções, desafios e conversas com a IA.
- No primeiro acesso do casal, um modal pergunta o nome do(a) parceiro(a), como cada um prefere ser tratado e desde quando estão juntos.
- Profissionais cadastrados aparecem como mentores para os casais. O pedido de conversa feito pelo casal chega em "Usuários" do profissional, e os dois conversam por ali e pela página de Apoio.
- A comunidade é compartilhada entre os profissionais cadastrados no mesmo navegador.

### Testar do zero

1. `node server.mjs` e abra `http://127.0.0.1:4173`.
2. Cadastre um profissional (Sou Profissional) e preencha os dados profissionais.
3. Volte para `boas-vindas.html` e cadastre um casal (Sou Cliente) com outro e-mail. Para trocar de conta, basta entrar pela tela de login. As duas contas precisam estar **no mesmo navegador** (aba anônima não compartilha os dados).
4. Para recomeçar, limpe os dados do site no navegador (DevTools → Application → Clear site data).

A versão com dados de exemplo para demonstração fica na branch `preparacao-apresentacao`.

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
- `node scripts/verificar.mjs`: confere a sintaxe dos scripts, links, imagens e redirecionamentos, e se há chave de API no front-end. Roda também no GitHub Actions a cada push e pull request.
