# CLAUDE.md — Love Journey

Guia para o Claude Code trabalhar neste repositório. Leia antes de qualquer alteração.

## Produto em uma frase

**Love Journey** é uma aplicação web de autoconhecimento, comunicação e educação sobre relacionamentos para jovens e adolescentes: um espaço seguro e acolhedor para registrar sentimentos, refletir com apoio de IA, fazer desafios a dois e encontrar caminhos de ajuda.

> Uma jornada para se conhecer, se entender e construir relações mais saudáveis.

Princípios: pessoas antes da tecnologia · experiência antes da complexidade · clareza antes de excesso de funcionalidades · acolhimento antes de julgamento · consistência antes de mudanças desnecessárias.

## Regra principal

**Evoluir o Love Journey, não recriá-lo.** Leia o código existente, entenda a intenção e preserve o que já funciona.

- **Não alterar o design visual sem necessidade**: cores, tipografia, espaçamentos, tamanhos, cards, sidebar, imagens, ícones, hierarquia e layout responsivo. Se a funcionalidade puder ser feita sem mexer na interface, faça assim; se precisar mexer, altere só o mínimo.
- **Mudança mínima**: card desalinhado não justifica reescrever o CSS da página; link quebrado não justifica recriar a página; integração de API não justifica mudar o layout.
- **Procure antes de criar**: estilos, funções, padrões de modal, chaves de `localStorage`, assets. Reutilize o que existe.
- Em dúvida entre duas soluções, escolha a que: altera menos código → preserva o design → mantém a arquitetura → reduz risco em outras páginas → melhora a manutenção.

## Stack e como rodar

- HTML, CSS e JavaScript puros (sem framework, sem bundler, sem `package.json`, sem testes automatizados).
- Ícones: Font Awesome 7.3.1 via cdnjs (`fa-solid ...`). Fontes via Google Fonts.
- `server.mjs`: servidor Node 18+ sem dependências que serve os arquivos estáticos **e** o proxy `/api/chat` para o Gemini.

```powershell
node server.mjs   # http://127.0.0.1:4173
```

- Copie `.env.example` para `.env` e preencha `GEMINI_API_KEY` (também lê `HOST` e `PORT` do ambiente). `.env` está no `.gitignore`.
- A raiz `/` do servidor abre `index.html` (landing).
- A lógica do chat fica em `lib/chat.mjs` e é usada por `server.mjs` (local) e por `functions/api/chat.js` (Cloudflare Pages Function). Mudanças no chat são feitas em `lib/chat.mjs`.
- Abrir os HTML direto pelo arquivo funciona para tudo, exceto o Diário com IA (precisa do `/api/chat`).
- O servidor bloqueia caminhos com segmentos iniciados por `.` (ex.: `.env`, `.git`). Preserve essa proteção.

## Mapa das páginas

Todas as páginas ficam na raiz. Cada página tem, em geral, **um CSS e um JS próprios** com o mesmo nome.

| Área | Página | CSS | JS |
|---|---|---|---|
| Landing | `index.html` | `css/index.css` | `js/main.js` |
| Acesso (fluxo atual) | `boas-vindas.html` → `login.html` / `cadastro.html` → `cadastro-profissional.html`; `recuperar-senha.html` → `senha-redefinida.html` | `css/autenticacao/*` | `js/autenticacao/*` |
| Casal — Início | `dashboard-casal.html` | `css/dashboard-casal.css` | `js/dashboard-casal.js` |
| Casal — Diários | `diario-do-casal.html` | `css/diario-do-casal.css` | `js/diario-do-casal.js` |
| Casal — Diário com IA | `diario-com-ia.html` | `css/diario-com-ia.css` | `js/diario-com-ia.js` |
| Casal — Minhas emoções | `dashboard-emocoes.html` | `css/dashboard-emocoes.css` | `js/LJ.script.js` |
| Casal — Desafios | `desafios-do-casal.html` | `css/desafios-do-casal.css` | `js/desafios-do-casal.js` |
| Casal — Apoio | `apoio.html` | `css/apoio-psicologico.css` | `js/apoio.js` |
| Profissional — Início | `dashboard-profissional.html` | `css/dashboard-profissional.css` | `js/dashboard-profissional.js` |
| Profissional — Usuários | `usuarios-do-profissional.html` | `css/usuarios-do-profissional.css` | `js/usuarios.js` |
| Profissional — Comunidade | `comunidade.html` | `css/comunidade.css` | — (ver pendências) |

Fluxo: `index.html` → `boas-vindas.html` → `login.html`. Após o login, `js/autenticacao/login.js` redireciona para `dashboard-profissional.html` ou `dashboard-casal.html` conforme `localStorage.perfilEscolhido`. O perfil também trafega por `?perfil=cliente|profissional`.

O fluxo de acesso usa `css/autenticacao/` + `js/autenticacao/`. Uma versão antiga duplicada (`acesso.html`, `comprovantes.html`, `esqueci-senha.html` e seus CSS/JS) foi removida em 18/10/2026.

## Sidebar e navegação

O markup da sidebar está **copiado em cada página**. No CSS, as regras idênticas em todas as páginas internas (`.sidebar-nav ul`, `.nav-link:hover`, `.nav-link.active`, `.sidebar-footer-card h3/p`) ficam em `css/sidebar.css`; o restante (largura, espaçamentos, responsividade) varia por página e continua no CSS de cada uma. Estrutura:

```html
<aside class="sidebar">
  <div class="brand"> ...logo + "Love Journey"... </div>
  <nav class="sidebar-nav"><ul>
    <li><a href="./dashboard-casal.html" class="nav-link active" aria-current="page">
      <span class="icon"><i class="fa-solid fa-house"></i></span> Início</a></li>
    ...
  </ul></nav>
  <div class="sidebar-footer-card"> ... </div>
</aside>
```

- **Sidebar do casal**: Início, Diários, Minhas emoções, Desafios, Apoio. O Diário com IA é acessado a partir de `diario-do-casal.html` e da própria página.
- **Sidebar do profissional**: Início, Usuários, Comunidade.
- Ao alterar um item, **replique em todas as páginas da mesma área** e mantenha `active` + `aria-current="page"` só na página atual.
- Links usam caminho relativo com `./` (`./apoio.html`). Siga esse padrão.
- Uma página visualmente pronta mas sem ligação correta com as outras está **incompleta**. Ao terminar, confira sidebar, cards, botões, links de voltar e redirecionamentos em JS (`location.href`).

## Identidade visual

- Tom: acolhedor, leve, seguro, jovem, sem ser infantil. Evite aparência de template gerado por IA: excesso de gradientes, sombras, cards desnecessários, ícones decorativos aleatórios, textos genéricos.
- **Sem emojis na interface** (sidebar, navegação, cards, botões, títulos). Use Font Awesome ou SVG. O commit `7b98b6c` trocou todos os emojis por ícones; não os reintroduza. Exceção: conteúdo escrito pelo usuário.
- Paleta de referência da marca: rosa `#F0808C` / `#E06070`, verde `#4CAF77` / `#3D8F60`, amarelo `#F2C94C`.
- **Todas as cores e fontes ficam em `css/base.css`**, carregado por todas as páginas, em três conjuntos com nomes próprios:
  - páginas internas: `--primary-pink: #f25287`, `--secondary-green: #48a982`, `--bg-sidebar`, `--font-family` (Poppins) etc.;
  - fluxo de acesso: `--rosa: #F0808C`, `--verde: #4CAF77`, `--fonte-titulo` (Baloo 2), `--fonte-texto` (Poppins) etc.;
  - landing: `--pink`, `--green`, `--yellow` etc. (fonte Nunito).
- Os valores diferem entre os conjuntos **por decisão da equipe**: não iguale as cores entre telas. Para mudar uma cor, altere em `css/base.css`.
- O Diário com IA redefine alguns tokens no próprio `:root` (`--card-radius`, `--card-shadow`, `--purple-text`, `--dark-pink`, `--border-pink`).

## CSS

- Ordem de carregamento: `css/base.css` → `css/sidebar.css` (só páginas internas) → CSS da página. Página nova segue a mesma ordem.
- Antes de criar estilo novo, procure no CSS da página e nas páginas irmãs (ex.: o mesmo componente em outro dashboard).
- Use as variáveis de `css/base.css` em vez de cores soltas. Use o conjunto da área da página (interna, acesso ou landing).
- Só leve uma regra para `css/sidebar.css` se ela for idêntica em todas as páginas internas; regra que varia fica na página.
- Cada CSS de página zera margens com `* { margin: 0 }`. Isso desfaz a centralização nativa do `<dialog>`: todo modal novo precisa de `margin: auto` (ou posicionamento explícito).
- Evite `!important` e sobrescrever estilos sem entender a origem.
- Responsividade: confira desktop, tablet e celular. Não corrija o desktop quebrando o mobile.

## JavaScript

- Scripts por página, sem módulos. Padrões comuns: IIFE ou `DOMContentLoaded`, `querySelector`, `<dialog>` criado em JS para modais, função `escapeHtml` antes de inserir texto do usuário via `innerHTML`.
- **Persistência é `localStorage`, por decisão do projeto**: não haverá backend nem banco de dados. Não proponha nem implemente APIs de dados, autenticação real ou serviços como Supabase. O único código de servidor é o proxy do Diário com IA. As chaves usam o prefixo `loveJourney.*`: `dashboardCasal`, `dashboardEmotions`, `desafiosCasal`, `diarioIA`, `forumCasal`, `apoio`, `profissional`, `comunidade.*`. Exceção: o diário do casal usa `love-journey-diary-entries` (não renomear, para não perder dados salvos). Ao criar estado novo, siga o prefixo e trate `JSON.parse` com `try/catch`.
- Sempre escape conteúdo do usuário antes de renderizar em HTML.
- Funções pequenas, nomes claros, feedback ao usuário (status com `aria-live`, estados de loading, vazio e erro).

## Diário com IA (Gemini)

- Front: `js/diario-com-ia.js` faz `fetch('/api/chat')` com `{ messages: [{ role: 'user'|'model', text }] }` e recebe `{ reply }` ou `{ error }`. O histórico fica em `localStorage` (`loveJourney.diarioIA`).
- Back: `lib/chat.mjs` → `generateReply`, chamado por `server.mjs` e `functions/api/chat.js`. Modelo `gemini-3.8-flash`; limites de 12 mensagens, 2.000 caracteres por mensagem, 24 KB por requisição, 15 requisições por minuto por IP, timeout de 45 s. Erros voltam em português, prontos para exibir.
- O `systemInstruction` em `lib/chat.mjs` define a persona: acolhedora, em português, sem julgamentos, **não se apresenta como psicóloga nem substitui apoio profissional**, prioriza segurança em relatos de violência ou risco, não pede dados pessoais. Ao editar esse texto, preserve essas garantias.
- **A chave nunca vai para o front-end.** Nada de `GEMINI_API_KEY` em HTML/JS. Qualquer nova integração de API segue o mesmo modelo: proxy no servidor + variável de ambiente.
- A IA é apoio à reflexão, nunca diagnóstico. Textos da interface devem deixar isso claro.

## Página de Apoio

`apoio.html` é a área de caminhos de ajuda. Precisa estar acessível pela sidebar de todas as páginas do casal e ser tratada com linguagem responsável e acolhedora. `dashboard-casal.js` também redireciona para ela.

## Linguagem e conteúdo

- Interface e textos em **português brasileiro**: acolhedor, simples, jovem, humano, educativo, nunca julgador. Evite tom técnico ou formal.
- Público: jovens e adolescentes, muitas vezes em momentos sensíveis. Revise textos novos com isso em mente.

## HTML

Estrutura semântica (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`), `<button>` para ações e `<a>` para navegação, `alt` em imagens, `aria-label` em botões só com ícone. Assets ficam em `assets/imgs/<pasta-do-autor-ou-área>/` (`jadi/`, `cibelly/`, `felipe/`...); alguns nomes têm espaços e acentos, então referencie-os exatamente como estão.

## Deploy, Git e Cloudflare

- Hospedagem: **Cloudflare Pages**, configurado no painel (não existe `wrangler.toml`):
  - Build command: `node scripts/build-pages.mjs` · Build output directory: `dist`.
  - O build copia só os `.html` da raiz, `assets/`, `css/` e `js/` para `dist/` (ignorado no Git). `.git`, `.env`, `docs/`, `.claude/`, `lib/` e `server.mjs` não são publicados.
  - `functions/api/chat.js` vira o endpoint `/api/chat` em produção. Configure `GEMINI_API_KEY` como secret do projeto (Settings → Variables and Secrets).
  - Página nova na raiz entra no build automaticamente; pasta pública nova precisa ser adicionada em `publicDirs` no script.
- Em erro de tamanho ou arquivo inesperado no deploy, confira primeiro Output Directory e o conteúdo de `dist/`, antes de mexer em imagens ou páginas.
- Nunca modificar ou remover `.git` como parte de build.
- Mensagens de commit seguem `feat: ...` em português.

## Aplicativo Android (repositório `Mobile`)

- O app fica no repositório [Love-Journey-OFC/Mobile](https://github.com/Love-Journey-OFC/Mobile), clonado ao lado deste (`GitHub/Front-End` e `GitHub/Mobile`). Ele empacota **este** front-end com Capacitor: roda `scripts/build-pages.mjs` daqui e copia o `dist/`. Não duplique páginas, CSS ou JS lá.
- Por isso, mudanças em `scripts/build-pages.mjs`, nos links de Font Awesome/Google Fonts ou em fontes novas afetam o app: o script de preparo do Mobile falha se encontrar um CDN ou fonte que não conhece.
- No app, `js/diario-com-ia.js` detecta `window.Capacitor` e chama a API de produção (`https://front-end-4cu.pages.dev/api/chat`); `CapacitorHttp` evita CORS. Nenhuma chave vai para o app. Se o domínio de produção mudar, atualize essa URL.

## Pendências conhecidas

Não corrija por conta própria sem ser pedido, mas leve em conta e mencione quando for relevante:

A lista completa e o status de cada item ficam em `docs/backlog.md`. Principais:

- A política de privacidade do cadastro (modal em `cadastro.html`) é uma versão preliminar e precisa de revisão da equipe.
- Os mentores da página de Apoio são perfis de exemplo.

## Skills do projeto

Em `.claude/skills/`. Use a que se aplica antes de começar:

- `lj-alteracao-segura`: **sempre**, antes de editar qualquer arquivo. Inclui o modo congelado para apresentações.
- `lj-navegacao`: links, sidebar, redirecionamentos. Tem o verificador `node .claude/skills/lj-navegacao/scripts/verificar-links.mjs`.

Verificação completa (sintaxe, links e chaves no front-end), a mesma do GitHub Actions: `node scripts/verificar.mjs`.
- `lj-funcionalidade-local`: interatividade com JS + `localStorage`, modais, formulários.
- `lj-diario-ia`: Diário com IA, `lib/chat.mjs`, `server.mjs`, Function do Cloudflare, prompt do Gemini, novas APIs.
- `lj-conteudo-acolhedor`: textos visíveis e temas sensíveis.
- `lj-verificacao-apresentacao`: checklist depois de alterar e antes de apresentar.

## Processo para cada tarefa

1. **Entender**: leia o HTML, o CSS e o JS da página envolvida e, se for navegação, as páginas irmãs.
2. **Mapear**: de onde vem o estilo, qual script controla o elemento, se o problema é de HTML, CSS, JS, rota, API ou configuração.
3. **Planejar** a menor alteração que corrige a causa, sem remendo visual.
4. **Implementar** preservando o design.
5. **Verificar**: funcionamento, console sem erros, responsividade, sidebar e links, integração e efeitos colaterais em outras páginas.
6. **Explicar** de forma objetiva: o que mudou, quais arquivos, o que ficou pendente e se alguma configuração externa (chave, deploy) ainda precisa ser feita.

## Equipe

Beatriz (Product Owner & Full Stack), Anderson (Scrum Master & Full Stack), Felipe (Front-end & Full Stack), Cibelly (Front-end & UI Designer), Miguel (Front-end & Full Stack), Jadi (Financeiro & Full Stack), Esther (Front-end & Full Stack).

Roadmap: 2027 MVP · 2028 expansão de funcionalidades · 2029 referência em relacionamento e autoconhecimento para jovens.
