---
name: lj-navegacao
description: Use ao conectar páginas, corrigir links, botões ou redirecionamentos, mexer na sidebar ou verificar se todas as páginas do Love Journey estão ligadas entre si. Inclui um verificador automático de links.
---

# Navegação e sidebar do Love Journey

Uma página visualmente pronta mas sem ligação correta com o restante é considerada **incompleta**.

## Verificador de links

```bash
node .claude/skills/lj-navegacao/scripts/verificar-links.mjs
```

Ele confere, em todos os `.html` da raiz e nos `.js`:

- `href`/`src` locais que apontam para arquivo inexistente (**erro**);
- redirecionamentos em JS (`location.href = "x.html"`) para página inexistente (**erro**);
- páginas que não recebem link de nenhuma outra (**aviso**);
- páginas com sidebar cujo item `active` não aponta para si mesma (**aviso**; pode ser intencional, como o Diário com IA marcando "Diários").

Rode antes e depois de qualquer mudança de navegação. Sai com código 1 se houver erro.

## Estrutura da sidebar

Ela é **copiada** em cada página (não há componente compartilhado):

```html
<aside class="sidebar">
  <div class="brand">
    <img src="./assets/imgs/jadi/img/logolove.png" alt="Logo Love Journey" class="brand-logo" />
    <h1 class="brand-name">Love Journey</h1>
  </div>
  <nav class="sidebar-nav">
    <ul>
      <li>
        <a href="./dashboard-casal.html" class="nav-link active" aria-current="page">
          <span class="icon"><i class="fa-solid fa-house"></i></span>
          Início
        </a>
      </li>
      ...
    </ul>
  </nav>
  <div class="sidebar-footer-card">...</div>
</aside>
```

| Área | Itens (ordem) | Páginas que têm essa sidebar |
|---|---|---|
| Casal | Início `dashboard-casal` · Diários `diario-do-casal` · Minhas emoções `dashboard-emocoes` · Desafios `desafios-do-casal` · Apoio `apoio` | dashboard-casal, diario-do-casal, diario-com-ia, dashboard-emocoes, desafios-do-casal, apoio |
| Profissional | Início `dashboard-profissional` · Usuários `usuarios-do-profissional` · Comunidade `comunidade` | dashboard-profissional, usuarios-do-profissional, comunidade |

Fluxo de entrada: `index.html` → `boas-vindas.html` → `login.html` → (JS) `dashboard-casal.html` ou `dashboard-profissional.html` conforme `localStorage.perfilEscolhido`.

## Regras

- Mudou um item da sidebar? **Replique em todas as páginas da área**, mantendo ordem, ícone, texto e classes idênticos.
- `class="nav-link active"` + `aria-current="page"` apenas no item da página atual.
- Links relativos com `./` (`./apoio.html`), como no restante do projeto.
- Navegação é `<a href>`; ação é `<button type="button">`. Não use `onclick` para navegar quando um link resolve.
- Para redirecionar via JS, siga o padrão existente: `location.href = './pagina.html'`.
- Não crie item novo na sidebar nem mude sua ordem sem pedido explícito (altera a aparência).
- Botões e cards que levam a outra área (ex.: card de apoio no dashboard) devem apontar para a página real, não para `#`.

## Pontos conhecidos

- `diario-com-ia.html` não tem item próprio na sidebar; é acessado por `diario-do-casal.html`.
- `acesso.html`, `comprovantes.html` e `esqueci-senha.html` são do fluxo legado e não recebem links do fluxo atual. O verificador vai avisar; não é erro a corrigir sem pedido.
