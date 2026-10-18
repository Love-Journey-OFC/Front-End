document.addEventListener('DOMContentLoaded', () => {
  const conta = LJ.exigirSessao('profissional');
  if (!conta) return;
  const list = document.querySelector('.user-list');
  if (!list) return;

  const notesKey = LJ.chave('notasUsuarios');
  const favoritesKey = LJ.chave('favoritosUsuarios');
  const search = document.getElementById('search');
  const tabs = [...document.querySelectorAll('.status-tabs .tab-btn')];
  const messages = document.querySelector('.messages');
  const composer = document.querySelector('.message-input input');
  const avatarColors = ['purple', 'blue', 'pink', 'orange', 'gray', 'navy', 'dark'];
  const escapeHtml = LJ.escapeHtml;
  let filter = 'Todos';
  let onlyFavorites = false;
  let selectedId = null;

  // Usuários = pedidos de conversa enviados para este profissional.
  const myRequests = () => LJ.pedidos().filter(item => item.paraContaId === conta.id).sort((a, b) => new Date(lastActivity(b)) - new Date(lastActivity(a)));
  const lastActivity = request => LJ.mensagens(request.id).at(-1)?.em || request.criadoEm;
  const requester = request => (request.deContaId ? LJ.conta(request.deContaId) : null);
  const displayName = request => {
    const account = requester(request);
    return account ? LJ.nomesDoCasal(account) || LJ.nomeCompleto(account) : request.nome || 'Usuário';
  };
  const colorFor = request => avatarColors[[...request.id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % avatarColors.length];
  const statusOf = request => (request.status === 'aceito' ? { label: '● Em atendimento', css: 'busy', tag: 'Em atendimento' } : { label: 'Solicitação de conversa', css: 'request', tag: 'Solicitação' });
  const notes = () => LJ.ler(notesKey, {});
  const favorites = () => LJ.ler(favoritesKey, []);
  const updateRequest = (id, changes) => LJ.salvarPedidos(LJ.pedidos().map(item => (item.id === id ? { ...item, ...changes } : item)));

  // ------------------------------------------
  // LISTA
  // ------------------------------------------

  function renderList() {
    const all = myRequests();
    const pending = all.filter(item => item.status !== 'aceito');
    const counts = [all.length, all.length - pending.length, pending.length];
    tabs.forEach((tab, i) => { tab.querySelector('small').textContent = `(${counts[i]})`; });

    const term = (search?.value || '').toLocaleLowerCase('pt-BR');
    const favs = favorites();
    const visible = all.filter(item => {
      const statusMatch = filter === 'Todos' || (filter === 'Em atendimento' ? item.status === 'aceito' : item.status !== 'aceito');
      return statusMatch && (!onlyFavorites || favs.includes(item.id)) && displayName(item).toLocaleLowerCase('pt-BR').includes(term);
    });

    list.replaceChildren();
    visible.forEach(request => {
      const status = statusOf(request);
      const last = LJ.mensagens(request.id).at(-1);
      const item = document.createElement('div');
      item.className = `user-item${request.id === selectedId ? ' selected' : ''}`;
      item.dataset.requestId = request.id;
      item.innerHTML = `<span class="avatar ${colorFor(request)}"></span><div class="user-info"><b></b><small class="user-status ${status.css}"></small><p></p></div><em></em><button class="favorite${favs.includes(request.id) ? ' is-favorite' : ''}" aria-label="Favoritar" aria-pressed="${favs.includes(request.id)}"><i aria-hidden="true" class="fa-solid fa-heart"></i></button><span class="chevron">›</span>`;
      item.querySelector('.avatar').textContent = displayName(request)[0].toUpperCase();
      item.querySelector('b').textContent = displayName(request);
      item.querySelector('.user-status').textContent = status.label;
      item.querySelector('p').textContent = last?.texto || 'Pedido de conversa enviado';
      item.querySelector('em').textContent = LJ.tempoRelativo(lastActivity(request));
      list.append(item);
    });
    if (!all.length) list.innerHTML = '<p class="lj-vazio"><strong>Nenhum usuário ainda.</strong>Quando um casal pedir uma conversa com você pela página de Apoio, ele aparece aqui.</p>';
    else if (!visible.length) list.innerHTML = '<p class="lj-vazio">Nenhum usuário encontrado com esse filtro.</p>';
    renderRequestsCard(pending);
  }

  search?.addEventListener('input', renderList);
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active')); tab.classList.add('active');
    filter = tab.firstChild.textContent.trim(); renderList();
  }));
  list.addEventListener('click', e => {
    const favorite = e.target.closest('.favorite');
    const item = e.target.closest('.user-item');
    if (favorite && item) {
      e.stopPropagation();
      const favs = favorites(); const id = item.dataset.requestId;
      LJ.gravar(favoritesKey, favs.includes(id) ? favs.filter(value => value !== id) : [...favs, id]);
      renderList(); return;
    }
    if (item) select(item.dataset.requestId);
  });

  // ------------------------------------------
  // CONVERSA E DETALHES
  // ------------------------------------------

  function select(id) {
    selectedId = id;
    renderList(); renderConversation(); renderDetails();
    composer?.focus();
  }

  function selectedRequest() { return myRequests().find(item => item.id === selectedId) || null; }

  function renderConversation() {
    const request = selectedRequest();
    const header = document.querySelector('.conversation-user');
    const avatar = header.querySelector('.avatar');
    if (!request) {
      messages.innerHTML = '<p class="lj-vazio">Selecione uma pessoa na lista para ver a conversa.</p>';
      return;
    }
    const name = displayName(request); const status = statusOf(request);
    avatar.className = `avatar large ${colorFor(request)}`; avatar.textContent = name[0].toUpperCase();
    header.querySelector('h3').innerHTML = `${escapeHtml(name)} <i aria-hidden="true" class="fa-solid fa-check"></i>`;
    const info = header.querySelector('p');
    info.firstChild.textContent = `${request.formato || 'Online'}${request.periodo ? ` • ${request.periodo}` : ''} `;
    info.querySelector('.user-status').className = `user-status ${request.status === 'aceito' ? 'online' : 'offline'}`;
    info.querySelector('.user-status').textContent = request.status === 'aceito' ? '● Em atendimento' : '● Aguardando resposta';
    header.querySelector('.tag').innerHTML = `<i aria-hidden="true" class="fa-solid fa-user"></i> ${status.tag}`;

    messages.replaceChildren();
    const thread = LJ.mensagens(request.id);
    thread.forEach(message => {
      const mine = message.autorId === conta.id;
      const row = document.createElement('div'); row.className = `message ${mine ? 'sent' : 'received'}`;
      const bubble = document.createElement('div'); bubble.className = 'bubble';
      const p = document.createElement('p'); p.textContent = message.texto;
      const time = document.createElement('time'); time.textContent = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(message.em));
      bubble.append(p, time);
      if (!mine) { const mini = document.createElement('span'); mini.className = `avatar mini ${colorFor(request)}`; mini.textContent = name[0].toUpperCase(); row.append(mini); }
      row.append(bubble); messages.append(row);
    });
    if (!thread.length) messages.innerHTML = `<p class="lj-vazio">${request.status === 'aceito' ? 'Envie a primeira mensagem para iniciar a conversa.' : 'Este pedido ainda não tem mensagens. Responda para iniciar o atendimento.'}</p>`;
    messages.scrollTop = messages.scrollHeight;
  }

  function renderDetails() {
    const request = selectedRequest();
    const history = document.querySelector('.history-card');
    history.querySelectorAll('.history-item, .lj-vazio').forEach(el => el.remove());
    const summary = document.querySelector('.profile-summary');
    const stats = document.querySelector('.evolution-stats');
    const polyline = document.querySelector('.evolution-chart polyline');
    const dots = document.querySelector('.evolution-chart g');
    const notesText = document.querySelector('.notes-card .about-text');
    const about = summary.nextElementSibling.querySelector('.about-text');
    const answers = [...document.querySelectorAll('.answers dd')];
    if (!request) {
      history.insertAdjacentHTML('beforeend', '<p class="lj-vazio">O histórico aparece ao escolher alguém da lista.</p>');
      stats.innerHTML = '<p class="stat-line"><i aria-hidden="true" class="fa-solid fa-calendar-days"></i> Nenhum acompanhamento selecionado</p>';
      polyline.setAttribute('points', ''); dots.replaceChildren();
      return;
    }
    const name = displayName(request); const account = requester(request); const thread = LJ.mensagens(request.id);

    const events = [[request.criadoEm, 'Primeiro contato • Solicitação de conversa']];
    if (request.aceitoEm) events.push([request.aceitoEm, 'Atendimento iniciado']);
    if (thread.length) events.push([thread.at(-1).em, `Última mensagem • ${thread.length} ${thread.length === 1 ? 'mensagem' : 'mensagens'} no total`]);
    events.sort((a, b) => new Date(b[0]) - new Date(a[0])).forEach(([date, text]) => {
      history.insertAdjacentHTML('beforeend', `<div class="history-item"><strong>${LJ.formatarData(date)}</strong><p>${escapeHtml(text)}</p></div>`);
    });

    // Mensagens por dia nos últimos 7 dias.
    const days = Array.from({ length: 7 }, (_, i) => LJ.chaveData(new Date(Date.now() - (6 - i) * 86400000)));
    const perDay = days.map(day => thread.filter(message => LJ.chaveData(new Date(message.em)) === day).length);
    const max = Math.max(1, ...perDay);
    const xs = [5, 55, 105, 155, 205, 255, 295];
    const points = perDay.map((count, i) => [xs[i], Math.round(80 - count / max * 62)]);
    polyline.setAttribute('points', thread.length ? points.map(p => p.join(',')).join(' ') : '');
    dots.innerHTML = thread.length ? points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" />`).join('') : '';
    const activeDays = new Set(thread.map(message => LJ.chaveData(new Date(message.em)))).size;
    stats.innerHTML = `<p class="stat-line"><i aria-hidden="true" class="fa-solid fa-calendar-days"></i> ${activeDays} ${activeDays === 1 ? 'dia' : 'dias'} de conversa</p><p class="stat-line"><i aria-hidden="true" class="fa-solid fa-circle-check"></i> ${thread.length} ${thread.length === 1 ? 'mensagem' : 'mensagens'}</p><p class="stat-line"><i aria-hidden="true" class="fa-solid fa-clock"></i> Desde ${LJ.formatarData(request.criadoEm)}</p>`;

    notesText.textContent = notes()[request.id] || 'Nenhuma observação ainda. Clique em Editar para anotar.';

    const avatar = summary.querySelector('.avatar');
    avatar.className = `avatar large ${colorFor(request)}`; avatar.textContent = name[0].toUpperCase();
    summary.querySelector('strong').innerHTML = `${escapeHtml(name)} <i aria-hidden="true" class="fa-solid fa-check"></i>`;
    const since = account?.casal?.juntosDesde ? ` • juntos desde ${LJ.formatarData(account.casal.juntosDesde)}` : '';
    summary.querySelector('p').textContent = account ? `${account.casal?.parceiro?.nome ? 'Casal' : 'Usuário'}${since}` : 'Contato adicionado por você';
    summary.querySelector('.tag').innerHTML = `<i aria-hidden="true" class="fa-solid fa-user"></i> ${statusOf(request).tag}`;
    about.textContent = request.mensagem || 'A pessoa não escreveu uma mensagem no pedido.';

    const filled = [request.mensagem, account?.casal?.parceiro?.nome ? 'Relacionamento' : '', request.formato].filter(Boolean);
    answers[0].textContent = request.mensagem || 'Não informado';
    answers[1].textContent = account?.casal?.parceiro?.nome ? 'Relacionamento e vida a dois' : 'Não informado';
    answers[2].textContent = [request.formato, request.periodo].filter(Boolean).join(', ') || 'Não informado';
    const progress = document.querySelector('.q-progress');
    progress.querySelector('.progress-bar').setAttribute('aria-valuenow', String(filled.length));
    progress.querySelector('.progress-fill').style.width = `${Math.round(filled.length / 3 * 100)}%`;
    progress.querySelector('small').textContent = `${filled.length}/3`;
  }

  function sendMessage() {
    const value = composer?.value.trim();
    const request = selectedRequest();
    if (!value) return;
    if (!request) { composer.value = ''; renderConversation(); return; }
    if (request.status !== 'aceito') updateRequest(request.id, { status: 'aceito', aceitoEm: new Date().toISOString() });
    LJ.enviarMensagem(request.id, value);
    composer.value = '';
    renderList(); renderConversation(); renderDetails();
  }
  document.querySelector('.message-input button')?.addEventListener('click', sendMessage);
  composer?.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); } });

  // ------------------------------------------
  // SOLICITAÇÕES
  // ------------------------------------------

  function renderRequestsCard(pending) {
    const body = document.querySelector('.requests-body');
    body.querySelector('.avatar-stack').innerHTML = pending.slice(0, 2).map(request => `<span class="avatar ${colorFor(request)}">${escapeHtml(displayName(request)[0].toUpperCase())}</span>`).join('');
    const names = pending.map(displayName);
    body.querySelector('p').innerHTML = !pending.length ? 'Nenhuma solicitação nova.'
      : `<b>${escapeHtml(names.slice(0, 2).join(', '))}${names.length > 2 ? ` e mais ${names.length - 2} ${names.length - 2 === 1 ? 'pessoa' : 'pessoas'}` : ''}</b> ${pending.length === 1 ? 'quer' : 'querem'} iniciar uma conversa com você.`;
    body.querySelector('.btn').style.display = pending.length ? '' : 'none';
  }
  const accept = request => {
    updateRequest(request.id, { status: 'aceito', aceitoEm: new Date().toISOString() });
    select(request.id);
  };
  document.querySelector('.requests-body .btn')?.addEventListener('click', () => {
    const request = myRequests().find(item => item.status !== 'aceito');
    if (request) accept(request);
  });
  document.querySelector('.requests-card .link-action')?.addEventListener('click', e => {
    e.preventDefault();
    const pending = myRequests().filter(item => item.status !== 'aceito');
    dialog('Solicitações de conversa', pending.length ? pending.map(request => `<label><input type="checkbox" name="aceitar" value="${escapeHtml(request.id)}" checked> ${escapeHtml(displayName(request))} — ${escapeHtml(request.mensagem || 'sem mensagem')}</label>`).join('') : '<p>Nenhuma solicitação pendente.</p>', data => {
      const ids = data.getAll('aceitar');
      ids.forEach(id => updateRequest(id, { status: 'aceito', aceitoEm: new Date().toISOString() }));
      if (ids[0]) select(ids[0]); else renderList();
    }, pending.length ? 'Aceitar selecionadas' : 'Fechar');
  });

  // ------------------------------------------
  // DIÁLOGOS
  // ------------------------------------------

  function dialog(title, fields, onSave, saveLabel = 'Salvar') {
    const d = document.createElement('dialog'); d.className = 'user-action-dialog';
    d.innerHTML = `<form method="dialog"><h2>${title}</h2>${fields}<div class="actions"><button type="button" data-cancel>Cancelar</button><button type="submit">${saveLabel}</button></div></form>`;
    if (!document.getElementById('user-action-style')) { const s = document.createElement('style'); s.id = 'user-action-style'; s.textContent = '.user-action-dialog{border:0;border-radius:16px;padding:24px;width:min(480px,calc(100% - 32px));box-shadow:0 20px 60px #24183355}.user-action-dialog::backdrop{background:#24183388}.user-action-dialog form{display:grid;gap:12px}.user-action-dialog h2{margin:0 0 6px}.user-action-dialog label{display:grid;gap:5px}.user-action-dialog input,.user-action-dialog textarea,.user-action-dialog select{font:inherit;padding:10px;border:1px solid #ddd;border-radius:9px}.user-action-dialog textarea{min-height:80px}.user-action-dialog .actions{display:flex;justify-content:flex-end;gap:8px}.user-action-dialog button{border:0;border-radius:8px;padding:10px 15px;cursor:pointer}.user-action-dialog button[type=submit]{background:#7650a5;color:white}.favorite.is-favorite{color:#e34e83!important}.favorite.is-favorite i{font-weight:900}'; document.head.append(s); }
    document.body.append(d); d.showModal(); d.querySelector('[data-cancel]').onclick = () => { d.close(); d.remove(); }; d.addEventListener('click', e => { if (e.target === d) { d.close(); d.remove(); } });
    d.querySelector('form').addEventListener('submit', e => { e.preventDefault(); onSave(new FormData(e.currentTarget)); d.close(); d.remove(); });
  }

  // Contato manual: alguém que o profissional atende fora do Love Journey.
  document.getElementById('btn-new-user')?.addEventListener('click', () => dialog('Adicionar usuário', '<label>Nome<input name="nome" required maxlength="60"></label><label>Mensagem inicial (opcional)<textarea name="mensagem" placeholder="Olá, gostaria de conversar..."></textarea></label>', data => {
    const nome = data.get('nome').trim(); if (!nome) return;
    const request = { id: LJ.gerarId('pedido'), deContaId: null, nome, paraContaId: conta.id, formato: 'Online', periodo: '', mensagem: data.get('mensagem').trim(), status: 'aceito', aceitoEm: new Date().toISOString(), criadoEm: new Date().toISOString() };
    LJ.salvarPedidos([...LJ.pedidos(), request]);
    select(request.id);
  }));
  document.querySelector('.search-row .btn-light')?.addEventListener('click', () => dialog('Filtros de usuários', `<label>Status<select name="status">${['Todos', 'Em atendimento', 'Solicitações'].map(option => `<option ${option === filter ? 'selected' : ''}>${option}</option>`).join('')}</select></label><label><input type="checkbox" name="favoritos" ${onlyFavorites ? 'checked' : ''}> Apenas favoritos</label>`, data => {
    filter = data.get('status'); onlyFavorites = data.has('favoritos');
    tabs.forEach(t => t.classList.toggle('active', t.firstChild.textContent.trim() === filter));
    renderList();
  }));
  const editNotes = () => {
    const request = selectedRequest();
    if (!request) { dialog('Observações', '<p>Selecione uma pessoa na lista para registrar observações.</p>', () => {}, 'Entendi'); return; }
    dialog(`Observações sobre ${escapeHtml(displayName(request))}`, `<label>Observações<textarea name="obs">${escapeHtml(notes()[request.id] || '')}</textarea></label>`, data => {
      LJ.gravar(notesKey, { ...notes(), [request.id]: data.get('obs').trim() }); renderDetails();
    });
  };
  document.querySelector('.notes-card .link-action')?.addEventListener('click', editNotes);
  document.querySelector('.details-title .link-action')?.addEventListener('click', editNotes);
  document.querySelector('.details-column .btn-soft')?.addEventListener('click', () => {
    const request = selectedRequest();
    const rows = [...document.querySelectorAll('.answers dt')].map((dt, i) => `<p><b>${escapeHtml(dt.textContent.trim())}:</b> ${escapeHtml(document.querySelectorAll('.answers dd')[i].textContent.trim())}</p>`).join('');
    dialog('Questionário', request ? rows : '<p>Selecione uma pessoa na lista para ver as respostas.</p>', () => {}, 'Fechar');
  });
  document.querySelectorAll('.conversation-actions button').forEach(btn => btn.addEventListener('click', () => {
    const request = selectedRequest();
    dialog(btn.getAttribute('aria-label') || 'Opções', request ? `<p>Chamadas de áudio e vídeo ainda não estão disponíveis. Combine o encontro com ${escapeHtml(displayName(request))} pela conversa.</p>` : '<p>Selecione uma pessoa na lista primeiro.</p>', () => {}, 'Entendi');
  }));

  renderList(); renderConversation(); renderDetails();
  const first = myRequests()[0];
  if (first) select(first.id);
});
