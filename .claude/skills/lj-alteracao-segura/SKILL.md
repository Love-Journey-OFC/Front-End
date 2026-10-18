---
name: lj-alteracao-segura
description: Use antes de QUALQUER edição em HTML, CSS ou JS do Love Journey (correção de bug, ajuste de layout, nova funcionalidade, refatoração). Garante que a aparência e o estilo geral não mudem e que a alteração seja a menor possível.
---

# Alteração segura no Love Journey

A aparência do Love Journey é aprovada e **não pode mudar**. Toda alteração deve ser invisível para quem não procura por ela, exceto o comportamento que foi pedido.

## Modo congelado (apresentação ao cliente)

Enquanto o sistema estiver perto de uma apresentação, valem estas regras extras:

- Só corrigir o que foi pedido ou o que está claramente quebrado.
- Nada de refatoração, renomeação, reorganização de pastas, extração de CSS compartilhado ou remoção de arquivos legados.
- Nenhuma mudança em cores, fontes, tamanhos, espaçamentos, sombras, bordas, imagens, ícones, ordem de elementos ou textos visíveis que não tenha sido pedida.
- Se a correção exigir mudança visual, **pare e pergunte** antes, explicando exatamente o que vai mudar na tela.
- Prefira mexer em JS ou atributos (`href`, `id`, `aria-*`) a mexer em CSS.

## Antes de editar

1. Identifique a página e seus arquivos: `<pagina>.html`, `css/<pagina>.css`, `js/<pagina>.js` (exceções na tabela do `CLAUDE.md`, ex.: `dashboard-emocoes.html` → `js/LJ.script.js`, `apoio.html` → `css/apoio-psicologico.css`, fluxo de login → `css/autenticacao/` e `js/autenticacao/`).
2. Leia o trecho envolvido nos três arquivos. Descubra de onde vem o estilo com `Grep` pela classe.
3. Confirme se o mesmo elemento existe em outras páginas (sidebar, cards, modais estão **copiados** em cada página). Decida se a correção vale para uma ou para todas.
4. Escreva para si a menor alteração que corrige a **causa**.

## Durante a edição

- Use `Edit` com trechos pequenos. Nunca reescreva um arquivo inteiro com `Write`.
- CSS: use as variáveis do `:root` do próprio arquivo (`--primary-pink`, `--secondary-green`, `--font-family`, `--card-radius`...). Não traga tokens de outro arquivo nem valores novos. Sem `!important`.
- Classe nova só se nenhuma existente servir; copie o visual de um componente que já existe na mesma página.
- Responsividade: se tocar em layout, confira os `@media` do arquivo (os mais usados: 1200, 900, 768, 600, 480 px) e ajuste em todos os pontos necessários.
- Sem emojis na interface. Ícones são Font Awesome (`<i class="fa-solid fa-..."></i>`), já carregado em todas as páginas.
- Siga o estilo do arquivo: aspas, indentação e nomes no idioma já usado (classes em inglês nas páginas internas, `fonte-*` no fluxo de acesso).

## Depois de editar

- `git diff` e revise: alguma linha mexe em aparência sem ter sido pedido? Desfaça.
- Rode a skill `lj-verificacao-apresentacao` (ou ao menos o verificador de links de `lj-navegacao`).
- Informe: o que mudou, arquivos tocados, o que ficou pendente.

## Sinais de alerta (pare e pergunte)

- A correção parece exigir reescrever uma seção inteira.
- Duas páginas mostram o mesmo componente com estilos diferentes e você quer "padronizar".
- Você quer unificar cores ou fontes (os tokens variam por arquivo de propósito).
- Você quer apagar arquivo que parece não usado.
