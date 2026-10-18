(() => {
  const conta = LJ.exigirSessao('cliente');
  if (!conta) return;
  const storageKey = LJ.chave('apoio');
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  };
  const state = readState();
  const saveState = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  const dialog = document.createElement('dialog');
  dialog.className = 'support-dialog';
  dialog.innerHTML = '<form method="dialog" class="support-dialog-card"><header><div><p class="support-kicker">LOVE JOURNEY · APOIO</p><h2></h2></div><button type="button" class="support-close" aria-label="Fechar">×</button></header><div class="support-dialog-content"></div><footer class="support-dialog-actions"></footer></form>';
  document.body.append(dialog);
  const heading = dialog.querySelector('h2');
  const content = dialog.querySelector('.support-dialog-content');
  const actions = dialog.querySelector('.support-dialog-actions');
  const openDialog = (title, body, buttons = []) => {
    heading.textContent = title;
    content.innerHTML = body;
    actions.innerHTML = buttons.map((button) => `<button type="${button.submit ? 'submit' : 'button'}" class="${button.primary ? 'support-primary' : 'support-secondary'}" data-action="${escapeHtml(button.action || 'close')}">${escapeHtml(button.label)}</button>`).join('');
    dialog.showModal();
  };
  const closeDialog = () => dialog.close();
  dialog.querySelector('.support-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) closeDialog(); });
  actions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action]');
    if (button && !button.hasAttribute('type') || button?.dataset.action === 'close') closeDialog();
  });

  const addContact = (formData) => {
    state.contacts = state.contacts || [];
    state.contacts.push({ name: formData.get('name').trim(), relation: formData.get('relation'), phone: formData.get('phone').trim(), note: formData.get('note').trim() });
    saveState();
    openDialog('Contato salvo', '<p>Seu contato de apoio foi adicionado a este dispositivo.</p>', [{ label: 'Entendi', primary: true }]);
    renderContacts();
  };
  const renderContacts = () => {
    let section = document.querySelector('[data-contact-section]');
    if (!section || !state.contacts?.length) return;
    section.hidden = false;
    section.innerHTML = `<div class="card-header"><h3>Meus contatos de apoio</h3></div><div class="support-contact-list">${state.contacts.map((contact, index) => `<article class="support-contact"><div><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.relation)}${contact.phone ? ` · ${escapeHtml(contact.phone)}` : ''}</small>${contact.note ? `<p>${escapeHtml(contact.note)}</p>` : ''}</div><button type="button" class="support-remove" data-remove-contact="${index}" aria-label="Remover ${escapeHtml(contact.name)}">Remover</button></article>`).join('')}</div>`;
  };
  document.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove-contact]');
    if (remove) {
      state.contacts.splice(Number(remove.dataset.removeContact), 1); saveState(); renderContacts(); return;
    }
    const favorite = event.target.closest('.favorite');
    if (favorite) {
      const name = favorite.closest('.mentor-card')?.dataset.mentorId;
      state.favorites = state.favorites || [];
      const index = state.favorites.indexOf(name);
      if (index < 0) state.favorites.push(name); else state.favorites.splice(index, 1);
      favorite.setAttribute('aria-pressed', String(index < 0));
      favorite.classList.toggle('is-favorite', index < 0); saveState(); return;
    }
    const profile = event.target.closest('[data-mentor-profile]');
    if (profile) {
      const mentor = LJ.conta(profile.closest('.mentor-card').dataset.mentorId);
      if (!mentor) return;
      const info = mentor.profissional || {};
      const request = requestTo(mentor.id);
      const details = [info.area, info.formacao, info.experiencia].filter(Boolean).map(escapeHtml).join(' · ');
      if (request) { openConversation(mentor, request); return; }
      openDialog(LJ.nomeCompleto(mentor), `<p><strong>${details || 'Profissional'}</strong></p>${mentor.perfilPublico?.sobre ? `<p>${escapeHtml(mentor.perfilPublico.sobre)}</p>` : ''}`, [{ label: 'Agendar conversa', primary: true, action: 'schedule' }, { label: 'Fechar' }]);
      actions.querySelector('[data-action="schedule"]')?.addEventListener('click', () => openSchedule(mentor.id)); return;
    }
    const showAll = event.target.closest('[data-show-all]');
    if (showAll) {
      const type = showAll.dataset.showAll;
      if (type === 'mentors') {
        const favorites = state.favorites || [];
        const mentors = LJ.profissionais();
        openDialog(favorites.length ? 'Mentores e favoritos' : 'Nossos mentores', mentors.length ? `<p>${mentors.map((mentor) => `${escapeHtml(LJ.nomeCompleto(mentor))} — ${escapeHtml(mentor.profissional?.area || 'Profissional')}${favorites.includes(mentor.id) ? ' · Favorito' : ''}`).join('<br>')}</p><p>Use o coração para guardar seus favoritos.</p>` : '<p>Ainda não há mentores cadastrados. Quando profissionais criarem a conta no Love Journey, eles aparecem aqui.</p>');
      } else {
        openDialog('Recursos e conteúdos', `<div class="support-resource-list">${[...document.querySelectorAll('.resource-card')].map((card) => `<p><strong>${escapeHtml(card.querySelector('.item-title').textContent.trim())}</strong> · ${escapeHtml(card.querySelector('.resource-type').textContent.trim())}</p>`).join('')}</div><p>Selecione um conteúdo na página para abrir um resumo e uma sugestão prática.</p>`);
      }
      return;
    }
    const talk = event.target.closest('[data-talk]');
    if (talk) {
      if (talk.dataset.talk === 'mentor') openSchedule();
      if (talk.dataset.talk === 'partner') openDialog('Conversa com seu parceiro', '<p>Escolha um momento tranquilo e fale a partir do que você sente, sem presumir a intenção da outra pessoa.</p><div class="support-prompt"><strong>Você pode começar assim:</strong><p>“Quero conversar sobre algo importante para mim. Podemos separar um tempo para nos ouvir com calma?”</p></div>', [{ label: 'Copiar sugestão', primary: true, action: 'copy' }, { label: 'Fechar' }]);
      if (talk.dataset.talk === 'chat') openDialog('Chat de apoio', '<p>Este protótipo não está conectado a uma equipe de atendimento ao vivo. Você pode escrever o que gostaria de dizer e salvar uma anotação privada nesta demonstração.</p><label class="support-label">Sua mensagem<textarea name="support-message" rows="4" placeholder="Escreva no seu ritmo..."></textarea></label>', [{ label: 'Salvar anotação', primary: true, action: 'save-note' }, { label: 'Fechar' }]);
      return;
    }
    const help = event.target.closest('[data-help]');
    if (help) { const item = helpAnswers[help.dataset.help]; openDialog(item.title, item.body); return; }
    const resource = event.target.closest('[data-resource]');
    if (resource) { showResource(resource); return; }
  });
  document.addEventListener('keydown', (event) => {
    const resource = event.target.closest?.('[data-resource]');
    if (resource && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); showResource(resource); }
  });
  dialog.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (actions.querySelector('[data-action="save-contact"]')) addContact(new FormData(event.currentTarget));
  });
  actions.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'save-note') {
      const note = content.querySelector('[name="support-message"]').value.trim();
      if (!note) { content.querySelector('textarea').focus(); return; }
      state.notes = state.notes || []; state.notes.push({ text: note, date: new Date().toISOString() }); saveState();
      openDialog('Anotação salva', '<p>Sua anotação foi guardada neste dispositivo.</p>');
    }
    if (action === 'copy') {
      const text = content.querySelector('.support-prompt p')?.textContent || '';
      if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(() => openDialog('Sugestão copiada', '<p>Agora você pode colar a frase onde preferir.</p>')).catch(() => openDialog('Sugestão para copiar', `<div class="support-prompt"><p>${escapeHtml(text)}</p></div>`));
      else openDialog('Sugestão para copiar', `<div class="support-prompt"><p>${escapeHtml(text)}</p></div>`);
    }
  });

  function openContactForm() {
    openDialog('Novo contato de apoio', '<p>Adicione alguém de confiança para encontrar essas informações facilmente quando precisar.</p><label class="support-label">Nome<input name="name" required maxlength="80" placeholder="Nome da pessoa"></label><label class="support-label">Relação<select name="relation"><option>Amigo(a)</option><option>Familiar</option><option>Profissional</option><option>Outro</option></select></label><label class="support-label">Telefone (opcional)<input name="phone" type="tel" maxlength="30" placeholder="(00) 00000-0000"></label><label class="support-label">Observação (opcional)<textarea name="note" rows="2" maxlength="180" placeholder="Quando ou como essa pessoa pode ajudar"></textarea></label>', [{ label: 'Salvar contato', primary: true, action: 'save-contact' }, { label: 'Cancelar' }]);
    actions.querySelector('[data-action="save-contact"]').addEventListener('click', (event) => { event.preventDefault(); const form = dialog.querySelector('form'); if (form.reportValidity()) addContact(new FormData(form)); });
  }
  function openSchedule(mentorId = '') {
    const mentors = LJ.profissionais().filter((mentor) => !requestTo(mentor.id));
    if (!mentors.length) {
      openDialog('Pedir uma conversa', LJ.profissionais().length ? '<p>Você já enviou pedidos para todos os mentores disponíveis. Aguarde o retorno.</p>' : '<p>Ainda não há mentores cadastrados. Quando profissionais criarem a conta no Love Journey, você poderá pedir uma conversa por aqui.</p>', [{ label: 'Entendi', primary: true }]);
      return;
    }
    const chosen = mentors.find((mentor) => mentor.id === mentorId);
    openDialog('Pedir uma conversa', `<p>Envie um pedido de conversa${chosen ? ` para <strong>${escapeHtml(LJ.nomeCompleto(chosen))}</strong>` : ' para um mentor'}. O profissional verá o pedido na área de usuários.</p><label class="support-label">Mentor<select name="mentor">${mentors.map((mentor) => `<option value="${escapeHtml(mentor.id)}" ${mentor.id === mentorId ? 'selected' : ''}>${escapeHtml(LJ.nomeCompleto(mentor))}</option>`).join('')}</select></label><label class="support-label">Formato<select name="format"><option>Online</option><option>Presencial</option></select></label><label class="support-label">Melhor período<select name="period"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label><label class="support-label">O que gostaria de conversar? (opcional)<textarea name="topic" rows="3" maxlength="300" placeholder="Conte um pouco, se se sentir à vontade"></textarea></label>`, [{ label: 'Enviar pedido', primary: true, action: 'save-schedule' }, { label: 'Cancelar' }]);
    actions.querySelector('[data-action="save-schedule"]').addEventListener('click', (event) => {
      event.preventDefault(); const form = dialog.querySelector('form');
      const data = Object.fromEntries(new FormData(form));
      LJ.criarPedido({ paraContaId: data.mentor, formato: data.format, periodo: data.period, mensagem: data.topic });
      const mentor = LJ.conta(data.mentor);
      openDialog('Pedido enviado', `<p>Seu pedido de conversa com <strong>${escapeHtml(LJ.nomeCompleto(mentor))}</strong> foi enviado.</p><p>Formato: ${escapeHtml(data.format)} · Período: ${escapeHtml(data.period)}.</p>`);
      renderMentors();
    });
  }

  // Conversa com o mentor: as mensagens ficam no mesmo lugar que o profissional lê.
  function openConversation(mentor, request) {
    const thread = LJ.mensagens(request.id);
    const time = (value) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
    const rows = thread.map((message) => `<div class="support-prompt"><strong>${message.autorId === conta.id ? 'Você' : escapeHtml(LJ.nomeCompleto(mentor))} · ${time(message.em)}</strong><p>${escapeHtml(message.texto)}</p></div>`).join('');
    const status = request.status === 'aceito' ? 'Atendimento iniciado.' : 'Pedido enviado. Aguardando a resposta do profissional.';
    openDialog(`Conversa com ${LJ.nomeCompleto(mentor)}`, `<p>${status}</p>${rows || '<p>Ainda não há mensagens nesta conversa.</p>'}<label class="support-label">Sua mensagem<textarea name="reply" rows="3" maxlength="1000" placeholder="Escreva para o profissional..."></textarea></label>`, [{ label: 'Enviar', primary: true, action: 'send-reply' }, { label: 'Fechar' }]);
    actions.querySelector('[data-action="send-reply"]').addEventListener('click', () => {
      const field = content.querySelector('[name="reply"]');
      const text = field.value.trim();
      if (!text) { field.focus(); return; }
      LJ.enviarMensagem(request.id, text);
      openConversation(mentor, LJ.pedidos().find((item) => item.id === request.id) || request);
    });
  }

  // Mentores = profissionais com conta no Love Journey.
  const requestTo = (mentorId) => LJ.pedidos().find((item) => item.deContaId === conta.id && item.paraContaId === mentorId);
  function renderMentors() {
    const grid = document.querySelector('.mentors-grid');
    if (!grid) return;
    const favorites = state.favorites || [];
    const mentors = LJ.profissionais();
    grid.replaceChildren();
    if (!mentors.length) {
      grid.innerHTML = '<div class="lj-vazio" style="grid-column: 1 / -1"><strong>Nenhum mentor por aqui ainda.</strong>Quando profissionais criarem a conta no Love Journey, eles aparecem aqui para você pedir uma conversa.</div>';
      return;
    }
    mentors.slice(0, 3).forEach((mentor) => {
      const name = LJ.nomeCompleto(mentor);
      const isFavorite = favorites.includes(mentor.id);
      const card = document.createElement('article');
      card.className = 'mentor-card theme-pink-light';
      card.dataset.mentorId = mentor.id;
      card.innerHTML = `<button class="favorite${isFavorite ? ' is-favorite' : ''}" type="button" aria-pressed="${isFavorite}"><i aria-hidden="true" class="fa-solid fa-heart"></i></button><img class="avatar-md" alt=""><h4 class="item-title"></h4><p class="item-text"></p><small class="mentor-focus"></small><button class="btn btn-secondary btn-sm btn-block" type="button" data-mentor-profile>Ver perfil</button>`;
      card.querySelector('.favorite').setAttribute('aria-label', `Favoritar ${name}`);
      card.querySelector('img').src = mentor.perfilPublico?.foto || LJ.avatar(name, '#b39ddb');
      card.querySelector('img').alt = `Mentor(a) ${name}`;
      card.querySelector('.item-title').textContent = name;
      card.querySelector('.item-text').textContent = mentor.profissional?.area || 'Profissional';
      const request = requestTo(mentor.id);
      card.querySelector('.mentor-focus').textContent = request ? (request.status === 'aceito' ? 'Em conversa' : 'Pedido enviado') : (mentor.perfilPublico?.especialidades?.split(',')[0]?.trim() || 'Relacionamentos');
      if (request) card.querySelector('[data-mentor-profile]').textContent = 'Ver conversa';
      grid.append(card);
    });
  }
  renderMentors();
  function showResource(card) {
    const title = card.querySelector('.item-title').textContent.trim();
    const resource = resourceContent[title] || { summary: 'Um material para apoiar conversas mais cuidadosas e o autoconhecimento.', prompt: 'Que pequeno passo posso experimentar hoje?' };
    openDialog(title, `<p>${escapeHtml(resource.summary)}</p><div class="support-prompt"><strong>Para refletir</strong><p>${escapeHtml(resource.prompt)}</p></div><p class="support-demo-note">Resumo demonstrativo · conteúdo completo não está conectado nesta versão.</p>`);
  }

  // Canais oficiais e gratuitos no Brasil (atendimento 24h)
  const helpChannels = '<div class="support-prompt"><strong>Canais gratuitos, 24 horas</strong><p>CVV (apoio emocional): 188 ou cvv.org.br<br>Central de Atendimento à Mulher: 180<br>Direitos Humanos, incluindo crianças e adolescentes: 100<br>SAMU: 192 · Polícia Militar: 190</p></div>';

  const helpAnswers = {
    jealousy: { title: 'Como lidar com ciúmes?', body: '<p>Ciúmes pode sinalizar insegurança, medo ou uma necessidade que merece atenção. Tente nomear o que sentiu e o que desencadeou isso antes de agir.</p><p>Converse usando exemplos concretos e pedidos claros, sem transformar a conversa em acusação. Se o sentimento estiver afetando sua rotina ou levando a controle, buscar apoio profissional pode ajudar.</p>' },
    conflict: { title: 'O que fazer em conflitos?', body: '<p>Se a conversa estiver muito intensa, proponha uma pausa e combine quando vão retomá-la. Na volta, foquem em um assunto por vez e descrevam o impacto da situação em vocês.</p><p>Procurem um acordo que respeite os limites de ambos. Se houver medo, ameaça ou violência, priorize sua segurança e procure alguém de confiança e serviços locais de apoio.</p>' + helpChannels },
    communication: { title: 'Como melhorar a comunicação?', body: '<p>Escolha um momento em que os dois possam prestar atenção. Fale em primeira pessoa sobre sentimentos e necessidades, e depois confirme o que entendeu do outro.</p><div class="support-prompt"><strong>Exemplo</strong><p>“Quando aconteceu…, eu me senti… e gostaria de…”</p></div>' },
    professional: { title: 'Quando pedir ajuda profissional?', body: '<p>Você pode buscar ajuda quando o sofrimento persistir, os conflitos se repetirem, a relação afetar sua saúde ou vocês sentirem dificuldade para conversar com segurança.</p><p>O apoio profissional não exige que a situação esteja no limite. Procure uma pessoa qualificada e, se houver risco imediato, acione serviços de emergência da sua região.</p>' + helpChannels }
  };
  const resourceContent = {
    'Como lidar com sentimentos difíceis': { summary: 'Reconhecer e nomear o que você sente pode ajudar a responder com mais cuidado. Não é preciso resolver tudo de uma vez.', prompt: 'O que estou sentindo agora e do que preciso neste momento?' },
    'Comunicação que aproxima': { summary: 'Escuta ativa, curiosidade e pedidos claros ajudam a criar conversas mais acolhedoras.', prompt: 'Como posso demonstrar que ouvi antes de responder?' },
    'É saudável pedir espaço?': { summary: 'Pedir uma pausa pode ser saudável quando há clareza sobre o motivo e quando a conversa será retomada.', prompt: 'Que limite me ajudaria a cuidar de mim sem interromper o diálogo?' },
    '5 hábitos para uma relação saudável': { summary: 'Pequenos hábitos de respeito, presença, reparação e reconhecimento ajudam a sustentar uma relação.', prompt: 'Qual gesto simples de cuidado posso praticar esta semana?' },
    'Hábitos para um relacionamento saudável': { summary: 'A qualidade de uma relação se constrói no cotidiano, com atenção às necessidades e aos limites de cada pessoa.', prompt: 'O que tem feito nossa relação se sentir segura e recíproca?' }
  };

  document.getElementById('btn-new-contact')?.addEventListener('click', openContactForm);
  document.querySelectorAll('.favorite').forEach((button) => {
    const name = button.closest('.mentor-card')?.querySelector('.item-title')?.textContent.trim();
    const active = (state.favorites || []).includes(name);
    button.setAttribute('aria-pressed', String(active)); button.classList.toggle('is-favorite', active);
  });
  renderContacts();
})();
