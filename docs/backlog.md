# Backlog — Love Journey

Pendências levantadas na análise do repositório em 18/10/2026 (branch `main`, commit `c5bbae5`).

Escopo: o Love Journey é um front-end sem backend nem banco de dados. Os dados ficam no `localStorage`; o único serviço no servidor é o proxy do Diário com IA.

Prioridades:

- **P0**: corrigir antes da apresentação ao cliente. Correções pequenas que **não mudam a aparência**.
- **P1**: próxima sprint. Afetam funcionalidade, segurança ou manutenção.
- **P2**: evolução do produto e da arquitetura. Exigem alinhamento com a equipe.

Regra para todos os itens: seguir a skill `lj-alteracao-segura` e validar com `lj-verificacao-apresentacao`.

---

## P0 — Antes da apresentação

### BL-01 · Logo quebrado em Recuperar senha e Senha redefinida — **Resolvido em 18/10/2026**
- **Onde:** `recuperar-senha.html:105`, `senha-redefinida.html:49`
- **Problema:** as páginas apontam para `./assets/imgs/autenticacao/logo-icone.png`, mas a pasta `assets/imgs/autenticacao/` está vazia. O arquivo existe em `assets/imgs/logo-icone.png`.
- **Correção:** ajustar o `src` nos dois arquivos. A imagem volta a aparecer e nada mais muda.
- **Aceite:** o verificador de links não aponta erros e o logo aparece nas duas telas.

### BL-02 · Página Comunidade sem interatividade
- **Onde:** `comunidade.html`, `js/comunidade.js:76`
- **Problema:** `comunidade.html` não carrega nenhum script, então os 16 botões da página (filtros, curtir, comentar etc.) não fazem nada. Além disso, `js/comunidade.js` tem um **erro de sintaxe** na linha 76 (`missing ) after argument list`). Só adicionar o `<script>` vai gerar erro no console.
- **Correção:** corrigir o parêntese na linha 76, validar com `node --check js/comunidade.js` e incluir `<script src="./js/comunidade.js"></script>` antes de `</body>`, como nas outras páginas.
- **Aceite:** sem erros no console; filtros, publicações e comentários funcionam e persistem em `loveJourney.comunidade.*`; o visual da página não muda.
- **Risco:** o script pode criar elementos com classes que ainda não têm estilo. Conferir na tela antes de apresentar. Se algo aparecer diferente, deixar este item para depois da apresentação.
- **Status: resolvido em 18/10/2026.** Sintaxe corrigida, script incluído e contadores ajustados para manter os números do card (o script recontava os comentários visíveis e trocava "16" por "2"). Testado: curtir, comentar, filtro "Meus posts" e persistência após recarregar, sem erros no console. Única mudança visível: o botão de texto "Enviar" ao lado do campo de comentário, criado pelo próprio script.

### BL-03 · Configurar e testar o Diário com IA no ambiente da demo
- **Onde:** `.env`, `server.mjs`
- **Problema:** o chat depende de `GEMINI_API_KEY` no `.env` e do servidor Node rodando. Abrindo o HTML direto ou por outro servidor, o chat não responde.
- **Correção:** confirmar a chave, rodar `node server.mjs` e enviar uma mensagem de teste em `http://127.0.0.1:4173/diario-com-ia.html`. Ter uma resposta de exemplo preparada caso a cota gratuita acabe (erro 429).
- **Aceite:** uma mensagem enviada recebe resposta durante o ensaio.
- **Status: resolvido em 18/10/2026.** Chave configurada no `.env` e mensagem de teste respondida pelo Gemini. Em um dos testes o Gemini devolveu HTTP 503 (instabilidade momentânea do Google); a tela mostra uma mensagem amigável e a nova tentativa funcionou. Na apresentação, se acontecer, basta reenviar.

### BL-04 · Limpar dados de teste do navegador da apresentação
- **Onde:** `localStorage` (chaves `loveJourney.*`, `love-journey-diary-entries`, `perfilEscolhido`)
- **Problema:** registros criados em testes ficam salvos e aparecem para o cliente.
- **Correção:** apresentar em uma janela anônima ou limpar o armazenamento do site antes. Conferir se as telas carregam os dados de exemplo.
- **Status: pendente (ação manual no dia).** Abrir a demo em janela anônima.

### BL-05 · Link "política de privacidade" sem destino
- **Onde:** `cadastro.html:161` (`href="#"`)
- **Problema:** o link não leva a lugar nenhum; ao clicar, a página volta ao topo.
- **Correção para a demo:** evitar clicar durante a apresentação. A correção definitiva está em BL-17.
- **Status: resolvido em 18/10/2026.** O link abre um modal com a política de privacidade (versão preliminar), no mesmo padrão do modal de detalhes do diário e com as cores do fluxo de acesso. Não marca o checkbox nem muda a URL; testado no desktop e em 390 px.

---

## P1 — Próxima sprint

### BL-06 · Login e cadastro são simulados
- **Onde:** `js/autenticacao/login.js:333` (`// SIMULAÇÃO`), `js/autenticacao/cadastro.js`, `js/autenticacao/esqueci-senha.js`
- **Problema:** qualquer e-mail e senha válidos no formato entram no sistema. O perfil (casal ou profissional) vem só de `localStorage.perfilEscolhido`. A recuperação de senha também não envia e-mail.
- **Próximo passo:** definir o backend de autenticação (ex.: Supabase Auth ou API própria), com sessão e proteção das páginas internas.
- **Status: descartado em 18/10/2026.** Fora do escopo: o projeto não terá backend nem banco de dados; login e dados continuam simulados no navegador.

### BL-07 · Não existe "Sair" (logout)
- **Onde:** todas as páginas internas
- **Problema:** não há opção de encerrar a sessão nem de trocar de perfil sem limpar o navegador.
- **Próximo passo:** definir com Design onde a ação entra (ex.: `sidebar-footer-card`) antes de implementar, porque altera a interface.
- **Status: descartado em 18/10/2026.** Decisão da equipe: não será feito.

### BL-08 · Páginas internas acessíveis sem login
- **Onde:** dashboards, diários, apoio, comunidade
- **Problema:** basta digitar a URL. Depende de BL-06.
- **Status: descartado em 18/10/2026.** Fora do escopo: o projeto não terá backend nem banco de dados; login e dados continuam simulados no navegador.

### BL-09 · Dados apenas no navegador
- **Onde:** todos os scripts de página
- **Problema:** diários, emoções, desafios e conversas com a IA ficam só no `localStorage`. Somem ao limpar o navegador e não sincronizam entre dispositivos ou entre as duas pessoas do casal.
- **Próximo passo:** modelar entidades (usuário, casal, registro de diário, emoção, desafio, conversa, profissional e vínculo) e migrar para um banco, mantendo a separação interface / lógica / dados.
- **Status: descartado em 18/10/2026.** Fora do escopo: o projeto não terá backend nem banco de dados; login e dados continuam simulados no navegador.

### BL-10 · Arquivo de teste chama o Gemini pelo navegador
- **Onde:** `js/teste.js`
- **Problema:** chama `generativelanguage.googleapis.com` direto do front, o que exporia a chave. Não está carregado em nenhuma página, mas pode ser reaproveitado por engano.
- **Próximo passo:** remover após confirmar com a equipe.
- **Status: resolvido em 18/10/2026.** `js/teste.js` removido.

### BL-11 · Deploy não executa o proxy da IA
- **Onde:** configuração de hospedagem (não existe `wrangler.toml`)
- **Problema:** Cloudflare Pages serve só arquivos estáticos; `server.mjs` não roda lá, então `/api/chat` não existe em produção. Se o output for a raiz do repositório, `.git` e arquivos de servidor podem ser publicados.
- **Próximo passo:** criar uma Pages Function/Worker para `/api/chat` com `GEMINI_API_KEY` como secret e definir um output directory só com os arquivos públicos.
- **Status: resolvido em 18/10/2026 (falta configurar o painel).** Lógica do chat extraída para `lib/chat.mjs`, usada por `server.mjs` e pela nova Pages Function `functions/api/chat.js`. Criado `scripts/build-pages.mjs`, que gera `dist/` só com os arquivos públicos. Falta no painel do Cloudflare: build command `node scripts/build-pages.mjs`, output `dist` e secret `GEMINI_API_KEY` (ver README).

### BL-12 · Servidor abre o Diário com IA na raiz
- **Onde:** `server.mjs` (`pathname === "/" ? "diario-com-ia.html"`)
- **Problema:** `http://127.0.0.1:4173/` abre o diário em vez da landing `index.html`.
- **Próximo passo:** confirmar com a equipe se era intencional para testes; se não, apontar para `index.html`.
- **Status: resolvido em 18/10/2026.** A raiz agora abre `index.html`.

### BL-13 · Diário com IA sem item próprio na sidebar
- **Onde:** sidebar do casal (6 páginas)
- **Problema:** o acesso é só por `diario-do-casal.html`; dentro do Diário com IA, o item ativo é "Diários".
- **Próximo passo:** decisão de produto/design. Adicionar item muda a sidebar em todas as páginas.
- **Status: descartado em 18/10/2026.** Decisão da equipe: não será feito.

### BL-14 · README desatualizado
- **Onde:** `README.md`
- **Problema:** cita `css/style.css`, que não existe, descreve só o fluxo de acesso e não lista as páginas internas.
- **Próximo passo:** atualizar com base no mapa de páginas do `CLAUDE.md`.
- **Status: resolvido em 18/10/2026.** README reescrito com mapa de páginas, como rodar, dados e deploy.

---

## P2 — Evolução e manutenção

### BL-15 · Fluxo de acesso duplicado (legado)
- **Onde:** `acesso.html`, `comprovantes.html`, `esqueci-senha.html`, `css/auth.css`, `css/comprovantes.css`, `css/esqueci-senha.css`, `js/script.js`, `js/comprovantes.js`, `js/esqueci-senha.js`
- **Problema:** existe um segundo conjunto de telas de acesso que nenhuma página do fluxo atual usa. `acesso.html` e `esqueci-senha.html` não recebem links; `comprovantes.html` só é citado por `js/cadastro.js`, que também não é usado.
- **Próximo passo:** confirmar com a equipe e remover, ou documentar se alguma tela ainda for necessária.
- **Status: resolvido em 18/10/2026.** `acesso.html`, `comprovantes.html`, `esqueci-senha.html` e seus CSS/JS removidos após confirmar que nenhuma página do fluxo atual os referenciava.

### BL-16 · Arquivos sem uso
- **Onde:** `css/cadastro.css`, `css/login.css`, `css/senha-redefinida.css`, `js/cadastro.js`, `js/login.js` (`js/teste.js` já removido em BL-10)
- **Problema:** nenhum HTML referencia esses arquivos. Aumentam o risco de editar o arquivo errado.
- **Próximo passo:** remover junto com BL-15.
- **Status: resolvido em 18/10/2026.** Arquivos sem uso removidos junto com BL-15.

### BL-17 · Página de política de privacidade e termos
- **Onde:** `cadastro.html:161`
- **Problema:** não existe página de privacidade. O público é jovem e adolescente e o sistema coleta desabafos pessoais e conversas enviadas ao Gemini, então isso é importante (LGPD, consentimento de responsáveis para menores).
- **Próximo passo:** produzir o conteúdo com a equipe e criar a página no padrão visual do fluxo de acesso.
- **Status: parcialmente resolvido em 18/10/2026.** Existe uma versão preliminar no modal do cadastro (BL-05). Falta a equipe revisar e validar o texto (LGPD, consentimento de responsáveis) e decidir se também haverá termos de uso.

### BL-18 · Sidebar e tokens copiados em cada página
- **Onde:** 9 páginas internas e seus CSS
- **Problema:** cada página repete o markup da sidebar e declara o próprio `:root`. Qualquer ajuste precisa ser replicado à mão, o que gera divergências.
- **Próximo passo:** extrair um CSS base (tokens + sidebar) e, se fizer sentido, injetar a sidebar via JS ou template, sem mudar o visual. Refatoração: só depois da apresentação.
- **Status: resolvido em 18/10/2026.** Todas as cores e fontes foram para `css/base.css` (três conjuntos: páginas internas, fluxo de acesso e landing, com os mesmos valores de antes). As 5 regras da sidebar idênticas nas 9 páginas internas foram para `css/sidebar.css`; as que variam por página ficaram onde estavam. Verificado comparando o estilo calculado e a posição de todos os elementos das 16 páginas antes e depois: nenhuma diferença.

### BL-19 · Paleta e tipografia divergentes da identidade
- **Onde:** CSS das páginas internas, `css/index.css`, `css/autenticacao/autenticacao.css`
- **Problema:** a identidade define rosa `#F0808C`/`#E06070`, verde `#4CAF77`/`#3D8F60`, amarelo `#F2C94C`, Baloo 2 + Poppins. As páginas internas usam `#f25287`/`#48a982` e Poppins; a landing usa Nunito; só o fluxo de autenticação segue a identidade.
- **Próximo passo:** decisão de Design (Cibelly) sobre qual versão vale. **Não alterar sem aprovação**, porque muda a aparência.
- **Status: descartado em 18/10/2026.** Decisão da equipe: as cores e fontes de cada tela permanecem como estão.

### BL-20 · Chave de armazenamento fora do padrão
- **Onde:** `js/diario-do-casal.js` (`love-journey-diary-entries`)
- **Problema:** as outras chaves usam `loveJourney.*`.
- **Próximo passo:** padronizar só junto com a migração para o backend (BL-09), para não perder dados já salvos.
- **Status: descartado em 18/10/2026.** Sem migração para backend, a chave fica como está para não perder dados salvos.

### BL-21 · Testes e verificação automatizados
- **Problema:** não há testes nem lint. Hoje existe apenas o verificador de links (`node .claude/skills/lj-navegacao/scripts/verificar-links.mjs`).
- **Próximo passo:** adicionar `node --check` dos scripts e o verificador de links em um passo de CI. Avaliar testes de ponta a ponta (ex.: Playwright) do roteiro principal.
- **Status: resolvido em 18/10/2026.** `scripts/verificar.mjs` confere a sintaxe de todos os scripts, links/imagens/redirecionamentos e se há chave de API no front-end. Roda no GitHub Actions (`.github/workflows/verificacao.yml`) a cada push e pull request, junto com o build do Cloudflare. Testes de ponta a ponta (ex.: Playwright) ficam para quando houver necessidade.

### BL-22 · Revisão de acessibilidade
- **Problema:** não houve revisão sistemática de contraste, foco visível, navegação por teclado nos modais (`<dialog>`) e textos alternativos das imagens de conteúdo.
- **Próximo passo:** auditoria com Lighthouse/axe por página, corrigindo sem alterar o visual aprovado.
- **Status: resolvido em 18/10/2026 (parte sem mudança visual).** Varredura das 16 páginas: imagens com `alt`, botões e links com texto acessível, campos com rótulo e modais nativos (`<dialog>`, que já tratam foco e tecla Esc). Corrigido: ícones da sidebar das 6 páginas do casal agora são `aria-hidden`, como nas demais. Contraste não foi alterado porque mudaria as cores.

### BL-23 · Página de Apoio com canais reais
- **Onde:** `apoio.html`, `js/apoio.js`
- **Problema:** conferir se os profissionais e recursos exibidos são exemplos ou reais e se há canais oficiais de ajuda (CVV 188, Ligue 180, SAMU 192, Polícia 190) com números verificados.
- **Próximo passo:** validar o conteúdo com a PO (Beatriz).
- **Status: parcialmente resolvido em 18/10/2026.** As respostas "O que fazer em conflitos?" e "Quando pedir ajuda profissional?" agora listam os canais gratuitos 24h (CVV 188, Central de Atendimento à Mulher 180, Disque 100, SAMU 192, Polícia 190), dentro do modal e no estilo que já existia. Falta a equipe decidir se os mentores (perfis de exemplo) continuam na versão final.

### BL-24 · Persistência e privacidade das conversas com a IA
- **Onde:** `js/diario-com-ia.js`, `server.mjs`
- **Problema:** o histórico fica em texto puro no `localStorage` e as mensagens vão para o Gemini. Falta deixar isso claro para o usuário e oferecer "apagar conversa".
- **Próximo passo:** oferecer "apagar conversa" e um aviso curto na tela, alinhados com Design. O modal de privacidade do cadastro já explica o envio ao Gemini.

### BL-25 · Modais abrindo no canto da tela
- **Onde:** `css/diario-do-casal.css` (`.diary-detail-dialog`), `css/diario-com-ia.css` (`.ai-dialog`), `css/dashboard-emocoes.css` (`.emotion-dialog`), `css/apoio-psicologico.css` (`.support-dialog`), `css/dashboard-profissional.css` (modal de editar perfil)
- **Problema:** o reset `* { margin: 0 }` de cada página anula a centralização nativa do `<dialog>`, e esses 5 modais abrem colados no canto superior esquerdo. Os outros modais do sistema já se centralizam com posicionamento próprio.
- **Correção:** adicionar `margin: auto` na regra de cada um desses modais (o mesmo que o modal de privacidade do cadastro já usa).
- **Atenção:** muda a posição dos modais na tela; aguarda aprovação.

---

## Resumo

| Prioridade | Itens |
|---|---|
| P0 | BL-01 a BL-05 |
| P1 | BL-06 a BL-14 |
| P2 | BL-15 a BL-25 |
| Descartados | BL-06, BL-07, BL-08, BL-09, BL-13, BL-19, BL-20 |
