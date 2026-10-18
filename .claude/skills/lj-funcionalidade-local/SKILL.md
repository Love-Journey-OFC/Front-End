---
name: lj-funcionalidade-local
description: Use ao adicionar ou corrigir interatividade nas páginas do Love Journey (botões, filtros, formulários, modais, registros do diário, emoções, desafios, comunidade) usando JavaScript puro e localStorage, sem alterar a aparência.
---

# Funcionalidades no front-end (JS + localStorage)

O projeto não terá backend nem banco de dados (decisão da equipe): todo estado é salvo no `localStorage`. Não proponha APIs de dados, autenticação real ou Supabase. As funcionalidades devem usar **o HTML e o CSS que já existem**; o JS só dá vida ao que está na tela.

## Onde fica cada coisa

| Página | Script | Chave de armazenamento |
|---|---|---|
| dashboard-casal | `js/dashboard-casal.js` | `loveJourney.dashboardCasal` |
| diario-do-casal | `js/diario-do-casal.js` | `love-journey-diary-entries` (exceção ao prefixo; não renomear, quebraria dados salvos) |
| diario-com-ia | `js/diario-com-ia.js` | `loveJourney.diarioIA` |
| dashboard-emocoes | `js/LJ.script.js` | `loveJourney.dashboardEmotions` |
| desafios-do-casal | `js/desafios-do-casal.js` | `loveJourney.desafiosCasal` |
| apoio | `js/apoio.js` | `loveJourney.apoio` |
| dashboard-profissional | `js/dashboard-profissional.js` | `loveJourney.profissional` |
| comunidade | `js/comunidade.js` (**não carregado no HTML**) | `loveJourney.comunidade.*` |
| login/cadastro | `js/autenticacao/*.js` | `perfilEscolhido` |

Chave nova: `loveJourney.<nomeDaArea>`.

## Padrões a seguir (copie do arquivo vizinho)

- Script envolto em IIFE `(() => { ... })();` ou em `DOMContentLoaded`; sai cedo se o elemento não existir (`if (!form) return;`).
- Leitura segura:
  ```js
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  };
  ```
- Conteúdo digitado pelo usuário **sempre** passa por `escapeHtml` antes de ir para `innerHTML`, ou use `textContent`. A função já existe nos scripts; copie a mesma assinatura.
- Modais: `<dialog>` com `showModal()`. Ou existe no HTML (`#new-entry-dialog` no diário) ou é criado em JS reaproveitando classes que já têm estilo no CSS da página (ex.: `diary-detail-dialog`, `emotion-dialog`). Não invente classe de modal sem estilo.
- Feedback: elemento de status com `aria-live="polite"`, classe de erro já existente (`status-error`, `input-error`), botão `disabled` durante o processamento.
- Datas: `localDateKey()` para `AAAA-MM-DD` e `Intl.DateTimeFormat('pt-BR')` para exibir.
- Ícones de categoria/emoção: classes Font Awesome (`fa-face-smile`, `fa-moon`...), nunca emojis.
- Dados de exemplo do HTML: alguns scripts importam os cards estáticos na primeira carga (`state.initialized`). Preserve esse comportamento para a tela não ficar vazia na apresentação.

## Regras

- Não mude a marcação visual existente para facilitar o JS. Se precisar de um gancho, prefira `id` ou `data-*` novos, que não afetam o estilo.
- Elemento criado via JS deve usar as mesmas classes dos elementos estáticos equivalentes, para ficar idêntico.
- Não mude o formato de dados já salvo. Se precisar, leia o formato antigo e converta ao carregar.
- Estados vazios e de erro com texto acolhedor (ver `lj-conteudo-acolhedor`).
- Teste com `localStorage` limpo e com dados já salvos.
- Nada de bibliotecas novas por CDN sem pedido.
