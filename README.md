# Love Journey — Front-end

Projeto estático em HTML, CSS e JavaScript. A landing page e os fluxos de acesso compartilham a mesma raiz e o mesmo conjunto de assets.

## Páginas

- `index.html` — landing page
- `acesso.html` — escolha do perfil e entrada por e-mail
- `cadastro.html` e `login.html` — criar conta e entrar
- `esqueci-senha.html` e `senha-redefinida.html` — recuperação de senha
- `comprovantes.html` — dados e documentos profissionais

## Organização

- `css/style.css` — estilos da landing page
- `css/auth.css` — estilos compartilhados do fluxo de acesso
- `css/` — estilos específicos de cada tela
- `js/main.js` — interações da landing page
- `js/` — scripts dos fluxos de acesso
- `assets/imgs/` — imagens compartilhadas pelo projeto

Abra `index.html` em um servidor estático local para navegar pelo projeto.

## Diário com IA (Gemini)

O chat usa um proxy local em Node.js para manter a chave fora do navegador. Requer Node.js 18 ou mais recente e uma chave da Gemini API com acesso ao modelo `gemini-3.8-flash`.

O servidor carrega `GEMINI_API_KEY` de `.env` automaticamente. Se precisar, também é possível definir a variável no PowerShell. Depois inicie o servidor:

```powershell
node server.mjs
```

Abra `http://127.0.0.1:4173`. A página estática aberta diretamente pelo arquivo ou em outro servidor não terá acesso ao endpoint `/api/chat`. Em hospedagem, execute o proxy Node no mesmo domínio e configure `GEMINI_API_KEY` como variável secreta do servidor. Nunca coloque a chave em arquivos JavaScript ou HTML.

As conversas são enviadas ao Gemini para gerar respostas e o histórico é mantido na página durante a sessão. A cota e a disponibilidade do nível gratuito dependem dos limites atuais da API.
