---
name: lj-funcionalidade-local
description: Use ao adicionar ou corrigir interatividade nas páginas do Love Journey (botões, filtros, formulários, modais, registros do diário, emoções, desafios, comunidade, contas e conversas) usando JavaScript puro e localStorage, sem alterar a aparência.
---

# Funcionalidades no front-end (JS + localStorage)

O projeto não terá backend nem banco de dados (decisão da equipe): todo estado é salvo no `localStorage`. Não proponha APIs de dados, autenticação real ou Supabase. As funcionalidades devem usar **o HTML e o CSS que já existem**; o JS só dá vida ao que está na tela.

> Esta é a versão da branch `site-zerado`: sem dados de exemplo, com contas reais no navegador. A branch `preparacao-apresentacao` mantém os dados de exemplo para gravação e demonstração.

## Contas e sessão: `js/conta.js` (objeto global `LJ`)

Carregado antes do script de cada página de acesso e de cada página interna.

- `LJ.criarConta`, `LJ.autenticar`, `LJ.redefinirSenha`: senha guardada só como hash SHA-256.
- `LJ.iniciarSessao(conta)`, `LJ.contaAtual()`.
- `LJ.exigirSessao('cliente' | 'profissional')`: **primeira linha de todo script de página interna**. Sem sessão, vai para o login; perfil errado, vai para o painel certo.
- `LJ.chave('nome')`: chave do `localStorage` **por usuário** (`loveJourney.<idDaConta>.nome`). Todo dado pessoal usa essa função, para duas contas no mesmo navegador não se misturarem.
- `LJ.atualizarConta(id, mudancas)`: dados que outras contas precisam ler (perfil do casal, perfil público do profissional).
- Rede entre contas: `LJ.profissionais()`, `LJ.criarPedido`, `LJ.pedidos()`, `LJ.mensagens(pedidoId)`, `LJ.enviarMensagem`.
- Utilitários: `LJ.escapeHtml`, `LJ.avatar(nome, cor)` (imagem com a inicial), `LJ.flexao(tratamento, 'Tranquila', 'Tranquilo')`, `LJ.chaveData()`, `LJ.formatarData()`, `LJ.tempoRelativo()`.

## Onde fica cada coisa

| Dado | Onde |
|---|---|
| Contas (`perfil`, nome, e-mail, hash, `casal`, `profissional`, `perfilPublico`) | `loveJourney.contas` |
| Sessão | `loveJourney.sessao` |
| Pedidos de conversa casal → profissional | `loveJourney.pedidos` |
| Mensagens dos pedidos | `loveJourney.conversas` |
| Publicações, comentários e curtidas da comunidade (compartilhados) | `loveJourney.comunidade.posts`, `.comments`, `.likes` |
| Fórum do dashboard do casal (compartilhado) | `loveJourney.forumCasal` |
| Dashboard do casal, fotos, diário, emoções, desafios, Diário com IA, apoio | `LJ.chave('dashboardCasal' / 'fotos' / 'diario' / 'emocoes' / 'desafiosCasal' / 'diarioIA' / 'apoio')` |
| Perfil, notas e favoritos do profissional; salvos/ocultos da comunidade | `LJ.chave('profissional' / 'notasUsuarios' / 'favoritosUsuarios' / 'comunidade')` |

## Padrões a seguir (copie do arquivo vizinho)

- Script envolto em IIFE `(() => { ... })();` ou em `DOMContentLoaded`; sai cedo se não houver sessão ou se o elemento não existir.
- Leitura segura com `LJ.ler(chave, padrao)` ou `try/catch` em volta do `JSON.parse`.
- Conteúdo digitado pelo usuário **sempre** passa por `escapeHtml` antes de ir para `innerHTML`, ou use `textContent`.
- Modais: `<dialog>` com `showModal()`, reaproveitando as classes que já têm estilo na página (`couple-dialog`, `diary-detail-dialog`, `emotion-dialog`, `support-dialog`...). Não invente classe de modal sem estilo.
- **Sem dados de exemplo**: nada de nomes, números ou registros fixos no HTML. Tudo vem da conta ou dos registros salvos.
- **Estado vazio**: quando não há registros, use `<p class="lj-vazio"><strong>Título.</strong>Texto acolhedor.</p>` (`css/estados.css`); para um botão de ação dentro dele, `class="lj-vazio-acao"`. Dentro de grids, acrescente `style="grid-column: 1 / -1"`.
- Para esconder um elemento que tem `display` no CSS, use `element.style.display = 'none'`; o atributo `hidden` é ignorado nesses casos.
- Datas: `LJ.chaveData()` para `AAAA-MM-DD` e `LJ.formatarData()` para exibir.
- Textos com gênero ("Tranquila", "ansiosa", "sozinha") seguem `conta.casal.tratamento` via `LJ.flexao`.
- Ícones: classes Font Awesome, nunca emojis.

## Regras

- Não mude a marcação visual existente para facilitar o JS. Se precisar de um gancho, prefira `id` ou `data-*` novos, que não afetam o estilo.
- Elemento criado via JS deve usar as mesmas classes dos elementos equivalentes, para ficar idêntico.
- Não altere regras de CSS existentes (nem as injetadas pelos scripts); só acrescente.
- Estados vazios e de erro com texto acolhedor (ver `lj-conteudo-acolhedor`).
- Teste com `localStorage` limpo, com duas contas (casal e profissional) e com dados já salvos.
- Nada de bibliotecas novas por CDN sem pedido.
