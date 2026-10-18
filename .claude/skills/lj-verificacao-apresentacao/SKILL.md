---
name: lj-verificacao-apresentacao
description: Use depois de qualquer alteração no Love Journey e antes de apresentar o sistema ao cliente. Checklist para confirmar que nada visual mudou, que a navegação, as funcionalidades e o Diário com IA funcionam, e que não há erros no console.
---

# Verificação antes de entregar ou apresentar

Objetivo: garantir que o sistema está **igual ao aprovado na aparência** e funcionando de ponta a ponta.

## 1. Revisão do diff

```bash
git status
git diff --stat
git diff
```

- Toda linha alterada tem relação com o pedido?
- Alguma mudança em CSS que não foi pedida (cor, fonte, tamanho, espaçamento, `display`, `position`)? Desfaça.
- Algum arquivo sensível (`.env`) aparecendo? Não pode ser commitado.

## 2. Links e navegação

```bash
node .claude/skills/lj-navegacao/scripts/verificar-links.mjs
```

Zero erros. Os avisos conhecidos (fluxo legado, Diário com IA marcando "Diários") podem permanecer.

## 3. Servidor e IA

```bash
node server.mjs
```

- Abra `http://127.0.0.1:4173/index.html` e percorra o roteiro abaixo.
- No Diário com IA, envie uma mensagem de teste. Se aparecer "não está configurado", falta `GEMINI_API_KEY` no `.env`.

## 4. Roteiro de navegação (o mesmo da apresentação)

1. `index.html` → botão de entrada → `boas-vindas.html` → `login.html`.
2. Login como casal → `dashboard-casal.html` → cada item da sidebar: Diários, Minhas emoções, Desafios, Apoio.
3. Diários → novo registro (modal abre, salva, aparece na lista, filtro funciona) → acesso ao Diário com IA.
4. Minhas emoções → registrar emoção do dia.
5. Desafios → interagir com um desafio.
6. Apoio → conteúdo e botões.
7. Login como profissional → `dashboard-profissional.html` → Usuários → Comunidade.

Se houver navegador disponível (skill `claude-in-chrome`), faça o roteiro nele e leia o console de cada página (`read_console_messages`). Sem navegador, peça para alguém da equipe percorrer e diga exatamente o que conferir.

## 5. Console e responsividade

- Nenhum erro vermelho no console em nenhuma página.
- Conferir em ~1440 px (desktop), ~768 px (tablet) e ~390 px (celular): sidebar, cards e modais sem sobreposição nem rolagem horizontal.

## 6. Estado da demonstração

- Teste também com `localStorage` limpo (aba anônima): as telas devem mostrar os dados de exemplo, não ficar vazias.
- Antes de apresentar, limpe registros de teste que não devam aparecer para o cliente.

## 7. Relatório

Informe objetivamente: o que foi verificado, o que passou, o que falhou (com a mensagem exata) e o que não deu para verificar. Não declare "tudo funcionando" sem ter verificado.
