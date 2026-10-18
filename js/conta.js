// ============================================
// LOVE JOURNEY — conta.js
// Contas, sessão e dados por usuário (tudo no localStorage deste navegador)
// ============================================

(() => {
  const KEYS = {
    contas: "loveJourney.contas",
    sessao: "loveJourney.sessao",
    pedidos: "loveJourney.pedidos",
    conversas: "loveJourney.conversas",
  };

  const ler = (chave, padrao) => {
    try {
      const valor = JSON.parse(localStorage.getItem(chave));
      return valor ?? padrao;
    } catch {
      return padrao;
    }
  };

  const gravar = (chave, valor) =>
    localStorage.setItem(chave, JSON.stringify(valor));

  const gerarId = (prefixo) =>
    `${prefixo}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const normalizarEmail = (email) => String(email || "").trim().toLowerCase();

  const escapeHtml = (valor) =>
    String(valor ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);

  // Hash da senha: nunca guardamos a senha em texto puro.
  const hashSenha = async (email, senha) => {
    const texto = `love-journey:${normalizarEmail(email)}:${senha}`;
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(texto);
      const digest = await crypto.subtle.digest("SHA-256", bytes);
      return [...new Uint8Array(digest)]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    // Contexto sem crypto.subtle (ex.: alguns acessos por arquivo)
    let h = 2166136261;
    for (let i = 0; i < texto.length; i++) {
      h ^= texto.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return `fnv-${(h >>> 0).toString(16)}`;
  };

  const erro = (campo, mensagem) => Object.assign(new Error(mensagem), { campo });

  // ------------------------------------------
  // CONTAS
  // ------------------------------------------

  const contas = () => ler(KEYS.contas, []);

  const conta = (id) => contas().find((item) => item.id === id) || null;

  const buscarPorEmail = (email) =>
    contas().find((item) => item.email === normalizarEmail(email)) || null;

  const salvarConta = (atualizada) => {
    const lista = contas();
    const indice = lista.findIndex((item) => item.id === atualizada.id);
    if (indice >= 0) lista[indice] = atualizada;
    else lista.push(atualizada);
    gravar(KEYS.contas, lista);
    return atualizada;
  };

  const atualizarConta = (id, mudancas) => {
    const atual = conta(id);
    if (!atual) return null;
    return salvarConta({ ...atual, ...mudancas });
  };

  const criarConta = async ({ perfil, nome, sobrenome, email, senha, cnpj }) => {
    if (buscarPorEmail(email)) {
      throw erro("email", "Já existe uma conta com este e-mail. Entre pela tela de login.");
    }
    const nova = {
      id: gerarId("conta"),
      perfil: perfil === "profissional" ? "profissional" : "cliente",
      nome: String(nome || "").trim(),
      sobrenome: String(sobrenome || "").trim(),
      email: normalizarEmail(email),
      senhaHash: await hashSenha(email, senha),
      cnpj: perfil === "profissional" ? String(cnpj || "").trim() : "",
      criadaEm: new Date().toISOString(),
      // Profissional só fica completo depois dos dados profissionais.
      cadastroCompleto: perfil !== "profissional",
    };
    salvarConta(nova);
    return nova;
  };

  const autenticar = async (email, senha) => {
    const encontrada = buscarPorEmail(email);
    if (!encontrada) {
      throw erro("email", "Não encontramos uma conta com este e-mail.");
    }
    if (encontrada.senhaHash !== (await hashSenha(email, senha))) {
      throw erro("senha", "Senha incorreta. Tente novamente.");
    }
    return encontrada;
  };

  const redefinirSenha = async (email, senha) => {
    const encontrada = buscarPorEmail(email);
    if (!encontrada) throw erro("email", "Não encontramos uma conta com este e-mail.");
    return salvarConta({ ...encontrada, senhaHash: await hashSenha(email, senha) });
  };

  // ------------------------------------------
  // SESSÃO
  // ------------------------------------------

  const iniciarSessao = (alvo) =>
    gravar(KEYS.sessao, { contaId: alvo.id, desde: new Date().toISOString() });

  const encerrarSessao = () => localStorage.removeItem(KEYS.sessao);

  const contaAtual = () => {
    const sessao = ler(KEYS.sessao, null);
    return sessao ? conta(sessao.contaId) : null;
  };

  const paginaInicial = (alvo) =>
    alvo?.perfil === "profissional" ? "dashboard-profissional.html" : "dashboard-casal.html";

  // Páginas internas: sem sessão, volta para o login; perfil errado, vai para o painel certo.
  const exigirSessao = (perfil) => {
    const atual = contaAtual();
    if (!atual) {
      location.replace("login.html");
      return null;
    }
    if (perfil && atual.perfil !== perfil) {
      location.replace(paginaInicial(atual));
      return null;
    }
    return atual;
  };

  // ------------------------------------------
  // DADOS POR USUÁRIO
  // ------------------------------------------

  const chave = (nome) => {
    const atual = contaAtual();
    return `loveJourney.${atual ? atual.id : "anonimo"}.${nome}`;
  };

  // ------------------------------------------
  // NOMES, TRATAMENTO E AVATAR
  // ------------------------------------------

  const nomeCompleto = (alvo) =>
    [alvo?.nome, alvo?.sobrenome].filter(Boolean).join(" ").trim();

  const primeiroNome = (alvo) => String(alvo?.nome || "").trim().split(/\s+/)[0] || "";

  // tratamento: "feminino" | "masculino"; escolhe a forma da palavra.
  const flexao = (tratamento, feminino, masculino) =>
    tratamento === "masculino" ? masculino : feminino;

  const avatar = (nome, fundo = "#f8a5c2") => {
    const inicial = escapeHtml((String(nome || "?").trim()[0] || "?").toUpperCase());
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><rect width="120" height="120" fill="${fundo}"/><text x="60" y="78" font-family="Poppins, Arial, sans-serif" font-size="54" font-weight="600" text-anchor="middle" fill="#ffffff">${inicial}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  // ------------------------------------------
  // CASAL
  // ------------------------------------------

  const casal = (alvo = contaAtual()) => alvo?.casal || null;

  const nomesDoCasal = (alvo = contaAtual()) => {
    const eu = primeiroNome(alvo);
    const parceiro = String(casal(alvo)?.parceiro?.nome || "").trim().split(/\s+/)[0];
    return parceiro ? `${eu} e ${parceiro}` : eu;
  };

  // ------------------------------------------
  // REDE ENTRE CONTAS (mentores, pedidos e conversas)
  // ------------------------------------------

  const profissionais = () =>
    contas().filter((item) => item.perfil === "profissional" && item.cadastroCompleto);

  const pedidos = () => ler(KEYS.pedidos, []);
  const salvarPedidos = (lista) => gravar(KEYS.pedidos, lista);

  const criarPedido = ({ paraContaId, formato, periodo, mensagem }) => {
    const atual = contaAtual();
    const lista = pedidos();
    const existente = lista.find(
      (item) => item.deContaId === atual.id && item.paraContaId === paraContaId
    );
    if (existente) return existente;
    const novo = {
      id: gerarId("pedido"),
      deContaId: atual.id,
      paraContaId,
      formato: formato || "Online",
      periodo: periodo || "",
      mensagem: String(mensagem || "").trim(),
      status: "pendente",
      criadoEm: new Date().toISOString(),
    };
    lista.push(novo);
    salvarPedidos(lista);
    if (novo.mensagem) enviarMensagem(novo.id, novo.mensagem);
    return novo;
  };

  const conversas = () => ler(KEYS.conversas, {});

  const mensagens = (pedidoId) => conversas()[pedidoId] || [];

  const enviarMensagem = (pedidoId, texto) => {
    const todas = conversas();
    todas[pedidoId] ||= [];
    const mensagem = {
      autorId: contaAtual()?.id,
      texto: String(texto || "").trim(),
      em: new Date().toISOString(),
    };
    todas[pedidoId].push(mensagem);
    gravar(KEYS.conversas, todas);
    return mensagem;
  };

  // ------------------------------------------
  // DATAS
  // ------------------------------------------

  const chaveData = (data = new Date()) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;

  const formatarData = (valor) =>
    new Intl.DateTimeFormat("pt-BR").format(
      typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? new Date(`${valor}T12:00:00`)
        : new Date(valor)
    );

  const tempoRelativo = (valor) => {
    const minutos = Math.max(0, Math.round((Date.now() - new Date(valor)) / 60000));
    if (minutos < 1) return "agora";
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.round(minutos / 60);
    if (horas < 24) return `${horas} h`;
    return formatarData(valor);
  };

  window.LJ = {
    ler, gravar, gerarId, escapeHtml, chave,
    contas, conta, buscarPorEmail, salvarConta, atualizarConta, criarConta,
    autenticar, redefinirSenha,
    iniciarSessao, encerrarSessao, contaAtual, exigirSessao, paginaInicial,
    nomeCompleto, primeiroNome, flexao, avatar, casal, nomesDoCasal,
    profissionais, pedidos, salvarPedidos, criarPedido, mensagens, enviarMensagem,
    chaveData, formatarData, tempoRelativo,
  };
})();
