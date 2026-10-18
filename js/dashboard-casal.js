(() => {
  const conta = LJ.exigirSessao('cliente');
  if (!conta) return;

  const storageKey = LJ.chave('dashboardCasal');
  const photosKey = LJ.chave('fotos');
  const forumKey = 'loveJourney.forumCasal';
  const today = LJ.chaveData();
  const icons = {
    Feliz: 'fa-face-smile', Tranquila: 'fa-face-smile', Tranquilo: 'fa-face-smile',
    Neutra: 'fa-face-meh', Neutro: 'fa-face-meh', Preocupada: 'fa-face-frown',
    Preocupado: 'fa-face-frown', Triste: 'fa-face-sad-tear'
  };
  // Escala usada no gráfico e na compatibilidade (5 = melhor).
  const scores = { Feliz: 5, Tranquila: 4, Tranquilo: 4, Neutra: 3, Neutro: 3, Preocupada: 2, Preocupado: 2, Triste: 1 };
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const selected = new Map();
    const current = read(storageKey, { emotions: [], connected: true, reservations: [] });
    current.emotions ||= []; current.reservations ||= [];
    let couple = LJ.contaAtual().casal || null;

    const dialog = document.createElement('dialog');
    dialog.className = 'couple-dialog';
    document.body.append(dialog);

    const styles = document.createElement('style');
    styles.textContent = `
      .couple-dialog{position:fixed;inset:50% auto auto 50%;transform:translate(-50%,-50%);margin:0;border:0;border-radius:18px;padding:0;width:min(560px,calc(100% - 28px));max-height:88vh;max-height:88dvh;color:#333;box-shadow:0 22px 70px #28163244}
      .couple-dialog::backdrop{background:#21142c88;backdrop-filter:blur(3px)}
      .couple-dialog .dialog-content{padding:24px;max-height:88vh;overflow:auto;font-family:Poppins,sans-serif}
      .couple-dialog header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:16px}
      .couple-dialog h2{font-size:1.2rem;line-height:1.35;margin:0;color:#49344f}
      .couple-dialog p{margin:8px 0;color:#666;line-height:1.6}
      .couple-dialog .dialog-close{border:0;background:transparent;font-size:26px;line-height:1;cursor:pointer;color:#725c78}
      .couple-dialog label{display:grid;gap:6px;margin:12px 0;font-size:.9rem;font-weight:600}
      .couple-dialog input,.couple-dialog textarea,.couple-dialog select{box-sizing:border-box;width:100%;padding:11px;border:1px solid #dfd5e3;border-radius:10px;font:inherit}
      .couple-dialog textarea{min-height:88px;resize:vertical}
      .couple-dialog .dialog-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
      .couple-dialog .dialog-actions button,.couple-dialog .topic-open{border:0;border-radius:10px;padding:10px 15px;cursor:pointer;font:inherit}
      .couple-dialog .dialog-primary{background:#48a982;color:#fff}.couple-dialog .dialog-secondary{background:#f1edf3;color:#45384a}
      .couple-dialog .topic-open{display:block;width:100%;text-align:left;background:#fff5f8;margin:8px 0;color:#48364c}
      .couple-dialog .topic-open small{display:block;color:#777;margin-top:4px}
      .couple-dialog .thread-message{padding:10px 12px;background:#f7f4f8;border-radius:10px;margin:8px 0}
      .couple-dialog .thread-message strong{display:block;font-size:.84rem;color:#69447b}
      .couple-dialog .thread-message p{margin:4px 0 0}
      .couple-dialog .dialog-row{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}
      .couple-dialog .dialog-hint{font-size:.8rem;color:#777;font-weight:400}
      .emotion-status{margin-top:8px;font-size:.8rem;color:#55715f}.connect-disconnected{background:#888!important}
      @media (max-width:520px){.couple-dialog .dialog-row{grid-template-columns:1fr}}
    `;
    document.head.append(styles);

    const openDialog = (title, body, onReady, { closable = true } = {}) => {
      dialog.innerHTML = `<div class="dialog-content"><header><h2>${title}</h2>${closable ? '<button type="button" class="dialog-close" aria-label="Fechar">&times;</button>' : ''}</header><div class="dialog-body">${body}</div></div>`;
      dialog.querySelector('.dialog-close')?.addEventListener('click', () => dialog.close());
      dialog.onclick = event => { if (closable && event.target === dialog) dialog.close(); };
      dialog.oncancel = event => { if (!closable) event.preventDefault(); };
      if (onReady) onReady(dialog.querySelector('.dialog-body'));
      dialog.showModal();
    };
    const closeButton = (label = 'Fechar') => `<div class="dialog-actions"><button class="dialog-primary" type="button" data-close-dialog>${label}</button></div>`;
    dialog.addEventListener('click', event => { if (event.target.closest('[data-close-dialog]')) dialog.close(); });

    const persist = () => localStorage.setItem(storageKey, JSON.stringify(current));

    // ------------------------------------------
    // PESSOAS DO CASAL
    // ------------------------------------------

    const people = () => ({
      eu: { name: LJ.primeiroNome(LJ.contaAtual()) || 'Você', treatment: couple?.tratamento || 'feminino' },
      parceiro: { name: couple?.parceiro?.nome?.trim().split(/\s+/)[0] || 'Parceiro(a)', treatment: couple?.parceiro?.tratamento || 'masculino' }
    });
    const labelsFor = treatment => ['Feliz', LJ.flexao(treatment, 'Tranquila', 'Tranquilo'), LJ.flexao(treatment, 'Neutra', 'Neutro'), LJ.flexao(treatment, 'Preocupada', 'Preocupado'), 'Triste'];
    const roles = ['eu', 'parceiro'];
    const photos = () => read(photosKey, {});

    const renderNames = () => {
      const p = people();
      document.querySelector('.header-subtitle').textContent = `Olá, ${couple?.parceiro?.nome ? `${p.eu.name} e ${p.parceiro.name}` : p.eu.name}`;
      document.querySelectorAll('.person').forEach((personElement, index) => {
        const person = p[roles[index]];
        personElement.querySelector('.person-name').firstChild.textContent = `${person.name} `;
        personElement.querySelectorAll('.emotion-item .label').forEach((label, i) => { label.textContent = labelsFor(person.treatment)[i]; });
      });
      document.querySelectorAll('.mood-person strong').forEach((el, index) => { el.textContent = p[roles[index]].name; });
      document.querySelectorAll('.chart-legend .legend-item').forEach((el, index) => { el.lastChild.textContent = ` ${p[roles[index]].name}`; });
      const saved = photos();
      document.querySelectorAll('.person-profile').forEach((profile, index) => {
        const role = roles[index]; const person = p[role];
        const image = profile.querySelector('.avatar');
        image.src = saved[role] || LJ.avatar(person.name, index ? '#80cbc4' : '#f8a5c2');
        image.alt = role === 'eu' ? `Foto de ${person.name}` : `Foto de ${person.name}`;
        profile.querySelector('strong').textContent = person.name;
      });
    };

    const updateMood = (role, emotion) => {
      const index = roles.indexOf(role);
      const mood = document.querySelectorAll('.mood-person')[index];
      if (!mood) return;
      mood.querySelector('small').textContent = emotion || 'Sem registro';
      mood.querySelector('.mood-face i').className = `fa-regular ${icons[emotion] || 'fa-face-meh'}`;
      const selection = document.querySelectorAll('.person')[index];
      if (selection && emotion) {
        const status = selection.querySelector('.emotion-status') || document.createElement('small');
        status.className = 'emotion-status';
        status.textContent = `Registrada hoje: ${emotion}`;
        if (!status.isConnected) selection.append(status);
      }
    };

    // ------------------------------------------
    // SEMANA, GRÁFICO E COMPATIBILIDADE
    // ------------------------------------------

    const weekDates = () => {
      const now = new Date();
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
      return Array.from({ length: 7 }, (_, i) => LJ.chaveData(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
    };
    const emotionOn = (role, date) => current.emotions.find(item => item.person === role && item.date === date)?.emotion;

    const renderChart = () => {
      const xs = [0, 30, 60, 90, 120, 150, 200];
      const dates = weekDates();
      ['.line-ana', '.line-lucas'].forEach((selector, index) => {
        const points = dates.map((date, i) => {
          const emotion = emotionOn(roles[index], date);
          return emotion ? `${xs[i]},${60 - scores[emotion] * 10}` : null;
        }).filter(Boolean);
        document.querySelector(selector)?.setAttribute('points', points.length === 1 ? `${points[0]} ${points[0]}` : points.join(' '));
      });
    };

    const renderCompatibility = () => {
      const days = weekDates().map(date => [emotionOn('eu', date), emotionOn('parceiro', date)]).filter(([a, b]) => a && b);
      const percent = days.length ? Math.round(days.reduce((sum, [a, b]) => sum + (100 - Math.abs(scores[a] - scores[b]) * 25), 0) / days.length) : 0;
      const ring = document.querySelector('.compat-card .ring');
      ring.style.setProperty('--porcentagem', percent);
      ring.querySelector('span').textContent = `${percent}%`;
      document.querySelector('.compat-text').textContent = !days.length
        ? 'Registrem as emoções de vocês dois no mesmo dia para acompanhar a sintonia do casal.'
        : percent >= 75 ? 'Vocês estão em sintonia emocional. Sigam se apoiando nos próximos dias.'
        : percent >= 50 ? 'Vocês estão se entendendo. Conversem sobre o que cada um precisa.'
        : 'Os sentimentos estão diferentes nesta semana. Que tal uma conversa com calma?';
    };

    // Um dia conta como atividade quando o casal registrou algo nele.
    const renderActivities = () => {
      const activityDates = new Set([
        ...current.emotions.map(item => item.date),
        ...read(LJ.chave('diario'), []).map(item => item.dateKey),
        ...(read(LJ.chave('emocoes'), {}).entries || []).map(item => item.dateKey),
        ...Object.values(read(LJ.chave('desafiosCasal'), {}).log || {}).flat()
      ]);
      const dates = weekDates();
      let done = 0;
      document.querySelectorAll('.week-day').forEach((day, i) => {
        const isDone = activityDates.has(dates[i]);
        done += isDone ? 1 : 0;
        day.classList.toggle('done', isDone);
        day.querySelector('.check').innerHTML = isDone ? '<i aria-hidden="true" class="fa-solid fa-check"></i>' : '';
      });
      document.querySelector('.progress-card .card-instruction').textContent = `${done} de 7 atividades concluídas. ${done >= 7 ? 'Semana completa!' : 'Que tal completar uma atividade hoje?'}`;
      const bar = document.querySelector('.progress-card .progress-bar');
      bar.setAttribute('aria-valuenow', String(done));
      bar.querySelector('.progress-fill').style.width = `${Math.round(done / 7 * 100)}%`;
      document.querySelector('.progress-count').textContent = `${done}/7`;
    };

    const renderAll = () => {
      renderNames();
      roles.forEach(role => updateMood(role, emotionOn(role, today)));
      renderChart(); renderCompatibility(); renderActivities(); renderConnection();
    };

    // ------------------------------------------
    // CONFIGURAÇÃO DO CASAL
    // ------------------------------------------

    const openCoupleSetup = (firstTime = false) => {
      const p = couple || {};
      const option = (value, label, chosen) => `<option value="${value}" ${chosen === value ? 'selected' : ''}>${label}</option>`;
      openDialog(firstTime ? 'Vamos conhecer vocês' : 'Dados do casal', `
        ${firstTime ? `<p>Olá, ${LJ.escapeHtml(LJ.primeiroNome(LJ.contaAtual()))}! Conte quem está com você nesta jornada. Você pode mudar essas informações depois em <strong>Perfil e conexão</strong>.</p>` : ''}
        <form>
          <label>Nome do(a) parceiro(a)<input name="partnerName" required maxlength="60" value="${LJ.escapeHtml(p.parceiro?.nome || '')}" placeholder="Nome de quem está com você"></label>
          <div class="dialog-row">
            <label>Como falamos com você?<select name="myTreatment">${option('feminino', 'No feminino', p.tratamento || 'feminino')}${option('masculino', 'No masculino', p.tratamento)}</select></label>
            <label>E com seu(sua) parceiro(a)?<select name="partnerTreatment">${option('feminino', 'No feminino', p.parceiro?.tratamento)}${option('masculino', 'No masculino', p.parceiro?.tratamento || 'masculino')}</select></label>
          </div>
          <label>Juntos desde (opcional)<input name="since" type="date" max="${today}" value="${LJ.escapeHtml(p.juntosDesde || '')}"></label>
          <div class="dialog-row">
            <label>Sua foto (opcional)<input name="myPhoto" type="file" accept="image/*"></label>
            <label>Foto do(a) parceiro(a) (opcional)<input name="partnerPhoto" type="file" accept="image/*"></label>
          </div>
          <div class="dialog-actions">${firstTime ? '' : '<button type="button" class="dialog-secondary" data-close-dialog>Cancelar</button>'}<button type="submit" class="dialog-primary">Salvar</button></div>
        </form>`, body => {
        const form = body.querySelector('form');
        form.addEventListener('submit', async event => {
          event.preventDefault();
          const data = new FormData(form);
          couple = {
            tratamento: data.get('myTreatment'),
            parceiro: { nome: data.get('partnerName').trim(), tratamento: data.get('partnerTreatment') },
            juntosDesde: data.get('since') || ''
          };
          LJ.atualizarConta(conta.id, { casal: couple });
          const saved = photos();
          for (const [field, role] of [['myPhoto', 'eu'], ['partnerPhoto', 'parceiro']]) {
            const file = data.get(field);
            if (file?.size) saved[role] = await toDataUrl(file);
          }
          try { localStorage.setItem(photosKey, JSON.stringify(saved)); } catch { /* foto grande demais: segue sem ela */ }
          dialog.close(); renderAll();
        });
      }, { closable: !firstTime });
    };

    const toDataUrl = async file => {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
      const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', 0.85);
    };

    // ------------------------------------------
    // CHECKLIST DE EMOÇÕES
    // ------------------------------------------

    document.querySelectorAll('.person').forEach((personElement, index) => {
      const role = roles[index];
      personElement.querySelectorAll('.emotion-item').forEach(button => {
        button.addEventListener('click', () => {
          personElement.querySelectorAll('.emotion-item').forEach(option => {
            option.classList.remove('selected'); option.setAttribute('aria-pressed', 'false');
          });
          button.classList.add('selected'); button.setAttribute('aria-pressed', 'true');
          selected.set(role, button.querySelector('.label').textContent.trim());
        });
      });
    });

    const markTodaySelection = () => {
      document.querySelectorAll('.person').forEach((personElement, index) => {
        const emotion = emotionOn(roles[index], today);
        personElement.querySelectorAll('.emotion-item').forEach(button => {
          const isSelected = Boolean(emotion) && button.querySelector('.label').textContent.trim() === emotion;
          button.classList.toggle('selected', isSelected); button.setAttribute('aria-pressed', String(isSelected));
          if (isSelected) selected.set(roles[index], emotion);
        });
      });
    };

    const registerButton = document.querySelector('.checklist-card > .btn-block');
    registerButton?.addEventListener('click', () => {
      const p = people();
      if (!selected.size) {
        openDialog('Escolham como estão se sentindo', `<p>Selecione ao menos uma emoção para ${LJ.escapeHtml(p.eu.name)} ou ${LJ.escapeHtml(p.parceiro.name)} antes de registrar.</p>${closeButton('Entendi')}`);
        return;
      }
      for (const [role, emotion] of selected) {
        const existing = current.emotions.findIndex(item => item.date === today && item.person === role);
        const record = { date: today, person: role, emotion, savedAt: new Date().toISOString() };
        if (existing >= 0) current.emotions[existing] = record;
        else current.emotions.unshift(record);
      }
      persist(); renderAll();
      const saved = [...selected.entries()].map(([role, emotion]) => `${LJ.escapeHtml(p[role].name)}: ${LJ.escapeHtml(emotion)}`).join(' · ');
      openDialog('Registro salvo', `<p>As emoções de hoje foram atualizadas.</p><p><strong>${saved}</strong></p><p>O registro ficará salvo neste dispositivo.</p>${closeButton()}`);
    });

    // ------------------------------------------
    // PERFIL E CONEXÃO
    // ------------------------------------------

    const connectButton = document.querySelector('.profile-card > .btn-block');
    function renderConnection() {
      if (!connectButton) return;
      const hasPartner = Boolean(couple?.parceiro?.nome);
      connectButton.classList.toggle('connect-disconnected', hasPartner && !current.connected);
      connectButton.innerHTML = !hasPartner
        ? '<i aria-hidden="true" class="fa-solid fa-user-plus"></i> Adicionar parceiro(a)'
        : current.connected
          ? '<i aria-hidden="true" class="fa-solid fa-check"></i> Conectados'
          : '<i aria-hidden="true" class="fa-solid fa-link"></i> Conexão pausada';
      document.querySelector('.connect-icon i').className = `fa-solid ${hasPartner && current.connected ? 'fa-link' : 'fa-link-slash'}`;
    }
    connectButton?.addEventListener('click', () => {
      if (!couple?.parceiro?.nome) { openCoupleSetup(); return; }
      const names = LJ.escapeHtml(LJ.nomesDoCasal(LJ.contaAtual()));
      const since = couple.juntosDesde ? `<p>Juntos desde ${LJ.formatarData(couple.juntosDesde)}.</p>` : '';
      openDialog('Conexão do casal', `<p>${current.connected ? `${names} estão conectados. Os registros compartilhados deste painel ficam associados a este vínculo.` : 'A conexão está pausada. Reative-a para continuar usando os recursos compartilhados.'}</p>${since}<div class="dialog-actions"><button type="button" class="dialog-secondary" data-edit-couple>Editar dados do casal</button><button type="button" class="dialog-primary" data-toggle-connection>${current.connected ? 'Pausar conexão' : 'Reativar conexão'}</button></div>`, body => {
        body.querySelector('[data-edit-couple]').onclick = () => openCoupleSetup();
        body.querySelector('[data-toggle-connection]').onclick = () => { current.connected = !current.connected; persist(); renderConnection(); dialog.close(); };
      });
    });

    // ------------------------------------------
    // MENTORES (profissionais cadastrados)
    // ------------------------------------------

    const mentorList = document.querySelector('[data-mentor-list]');
    const renderMentors = () => {
      const mentors = LJ.profissionais().slice(0, 2);
      mentorList.replaceChildren();
      if (!mentors.length) {
        mentorList.innerHTML = '<p class="lj-vazio"><strong>Nenhum mentor por aqui ainda.</strong>Quando profissionais criarem a conta no Love Journey, eles aparecem aqui.</p>';
        return;
      }
      mentors.forEach(mentor => {
        const name = LJ.nomeCompleto(mentor);
        const role = [mentor.profissional?.area, mentor.perfilPublico?.cargo].filter(Boolean)[0] || 'Profissional';
        const request = LJ.pedidos().find(item => item.deContaId === conta.id && item.paraContaId === mentor.id);
        const row = document.createElement('div');
        row.className = 'mentor theme-pink-light';
        row.innerHTML = `<img class="avatar-sm" alt=""><div class="mentor-info"><strong class="mentor-name"></strong><p class="mentor-role"></p><p class="mentor-rating"></p></div><button type="button" class="btn btn-secondary btn-sm">Ver perfil</button>`;
        row.querySelector('img').src = mentor.perfilPublico?.foto || LJ.avatar(name, '#b39ddb');
        row.querySelector('img').alt = `Foto de ${name}`;
        row.querySelector('.mentor-name').textContent = name;
        row.querySelector('.mentor-role').textContent = role;
        row.querySelector('.mentor-rating').innerHTML = request ? (request.status === 'aceito' ? '<i aria-hidden="true" class="fa-solid fa-comments"></i> Em conversa' : '<i aria-hidden="true" class="fa-solid fa-paper-plane"></i> Pedido de conversa enviado') : '<i aria-hidden="true" class="fa-solid fa-star"></i> Novo no Love Journey';
        row.querySelector('button').addEventListener('click', () => openMentor(mentor));
        mentorList.append(row);
      });
    };
    const openMentor = mentor => {
      const name = LJ.escapeHtml(LJ.nomeCompleto(mentor));
      const info = mentor.profissional || {};
      const request = LJ.pedidos().find(item => item.deContaId === conta.id && item.paraContaId === mentor.id);
      const details = [info.area, info.formacao, info.experiencia].filter(Boolean).map(LJ.escapeHtml).join(' · ');
      if (request) {
        openDialog(`Perfil de ${name}`, `<p><strong>${details || 'Profissional'}</strong></p><p>${request.status === 'aceito' ? 'Seu pedido foi aceito.' : 'Seu pedido de conversa já foi enviado. Aguarde o retorno do profissional.'} Acompanhe e responda as mensagens na página de Apoio.</p><div class="dialog-actions"><button type="button" class="dialog-secondary" data-close-dialog>Fechar</button><button type="button" class="dialog-primary" data-go-support>Abrir conversa</button></div>`, body => { body.querySelector('[data-go-support]').onclick = () => { window.location.href = './apoio.html'; }; });
        return;
      }
      openDialog(`Perfil de ${name}`, `<p><strong>${details || 'Profissional'}</strong></p>${mentor.perfilPublico?.sobre ? `<p>${LJ.escapeHtml(mentor.perfilPublico.sobre)}</p>` : ''}<p>Solicite uma conversa para receber orientação sobre relacionamento e bem-estar emocional.</p><form><label>Melhor período<select name="periodo"><option>Manhã</option><option>Tarde</option><option>Noite</option></select></label><label>Mensagem<textarea name="mensagem" placeholder="Conte brevemente o que gostaria de conversar"></textarea></label><div class="dialog-actions"><button type="button" class="dialog-secondary" data-close-dialog>Cancelar</button><button type="submit" class="dialog-primary">Solicitar conversa</button></div></form>`, body => {
        const form = body.querySelector('form');
        form.addEventListener('submit', event => {
          event.preventDefault();
          const formData = new FormData(form);
          LJ.criarPedido({ paraContaId: mentor.id, formato: 'Online', periodo: formData.get('periodo'), mensagem: formData.get('mensagem') });
          current.reservations.push({ mentor: mentor.id, period: formData.get('periodo'), date: new Date().toISOString() });
          persist(); renderMentors();
          openDialog('Pedido registrado', `<p>Seu pedido de conversa com <strong>${name}</strong> foi enviado.</p><p>Período indicado: ${LJ.escapeHtml(formData.get('periodo'))}.</p>${closeButton()}`);
        });
      });
    };
    document.querySelector('.mentors-card > .btn-block')?.addEventListener('click', () => { window.location.href = './apoio.html'; });

    // ------------------------------------------
    // FÓRUM (compartilhado entre os casais deste navegador)
    // ------------------------------------------

    const forumButton = document.querySelector('.forum-card > .btn-block');
    const renderForumCounts = () => {
      const all = read(forumKey, {});
      document.querySelectorAll('.forum-card .topic').forEach(topic => {
        const title = topic.querySelector('p').textContent.trim();
        topic.querySelector('small').innerHTML = `<i aria-hidden="true" class="fa-solid fa-comment"></i> ${(all[title] || []).length}`;
      });
    };
    const openThread = (topic) => {
      const replies = read(forumKey, {})[topic] || [];
      openDialog(LJ.escapeHtml(topic), `<div class="thread-list">${replies.length ? replies.map(item => `<div class="thread-message"><strong>${LJ.escapeHtml(item.name)} · ${LJ.escapeHtml(item.date)}</strong><p>${LJ.escapeHtml(item.text)}</p></div>`).join('') : '<p>Ainda não há comentários neste tópico. Inicie a conversa.</p>'}</div><form><label>Seu comentário<textarea name="comment" required maxlength="500" placeholder="Escreva um comentário respeitoso..."></textarea></label><div class="dialog-actions"><button type="button" class="dialog-secondary" data-close-dialog>Fechar</button><button type="submit" class="dialog-primary">Comentar</button></div></form>`, body => {
        const form = body.querySelector('form');
        form.addEventListener('submit', event => {
          event.preventDefault(); const text = new FormData(form).get('comment').trim(); if (!text) return;
          const comments = read(forumKey, {}); comments[topic] ||= [];
          comments[topic].push({ name: LJ.nomesDoCasal(LJ.contaAtual()), date: new Intl.DateTimeFormat('pt-BR').format(new Date()), text });
          localStorage.setItem(forumKey, JSON.stringify(comments)); renderForumCounts(); openThread(topic);
        });
      });
    };
    forumButton?.addEventListener('click', () => openDialog('Conversas da comunidade', '<p>Escolha um tópico para ler e adicionar comentários.</p><div class="topic-picker"></div>', body => {
      const all = read(forumKey, {});
      document.querySelectorAll('.forum-card .topic').forEach(topic => {
        const title = topic.querySelector('p').textContent.trim();
        const button = document.createElement('button'); button.type = 'button'; button.className = 'topic-open';
        const label = document.createElement('span'); label.textContent = title;
        const count = document.createElement('small'); count.textContent = `${(all[title] || []).length} comentário(s)`;
        button.append(label, count); button.onclick = () => openThread(title); body.querySelector('.topic-picker').append(button);
      });
    }));

    renderAll(); markTodaySelection(); renderMentors(); renderForumCounts();
    if (!couple?.parceiro?.nome) openCoupleSetup(true);
  });
})();
