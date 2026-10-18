(() => {
  if (!LJ.exigirSessao('cliente')) return;
  const storageKey = LJ.chave('emocoes');
  const colors = {
    happy: 'theme-pink', calm: 'theme-teal', neutral: 'theme-yellow',
    anxious: 'theme-pink-light', sad: 'theme-purple', other: 'theme-yellow'
  };
  const emojis = {
    Feliz: 'fa-face-smile', Tranquila: 'fa-face-smile', Neutra: 'fa-face-meh',
    Preocupada: 'fa-face-frown', Triste: 'fa-face-sad-tear', Calma: 'fa-face-smile-beam',
    Irritada: 'fa-face-angry', Ansiosa: 'fa-face-grimace', Animada: 'fa-face-grin-stars',
    Apaixonada: 'fa-face-grin-hearts',
    Tranquilo: 'fa-face-smile', Neutro: 'fa-face-meh', Preocupado: 'fa-face-frown', Calmo: 'fa-face-smile-beam',
    Irritado: 'fa-face-angry', Ansioso: 'fa-face-grimace', Animado: 'fa-face-grin-stars', Apaixonado: 'fa-face-grin-hearts'
  };
  const categories = [
    { label: 'Felicidade', key: 'happy', color: 'var(--primary-pink)' },
    { label: 'Tranquilidade', key: 'calm', color: 'var(--secondary-green)' },
    { label: 'Ansiedade', key: 'anxious', color: '#42a5f5' },
    { label: 'Tristeza', key: 'sad', color: '#ab47bc' },
    { label: 'Outras', key: 'other', color: '#ffa726' }
  ];
  const moodCategory = (emotion) => {
    if (['Feliz', 'Animada', 'Apaixonada', 'Animado', 'Apaixonado'].includes(emotion)) return 'happy';
    if (['Tranquila', 'Calma', 'Tranquilo', 'Calmo'].includes(emotion)) return 'calm';
    if (['Preocupada', 'Ansiosa', 'Preocupado', 'Ansioso'].includes(emotion)) return 'anxious';
    if (emotion === 'Triste') return 'sad';
    return 'other';
  };
  const localDateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parseDate = (value) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return new Date(`${value}T12:00:00`);
    const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    return match ? new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), 12) : new Date();
  };
  const formatDate = (date) => new Intl.DateTimeFormat('pt-BR').format(date);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const readState = () => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  };

  document.addEventListener('DOMContentLoaded', () => {
    const state = readState();
    state.entries = Array.isArray(state.entries) ? state.entries : [];
    const emotionButtons = [...document.querySelectorAll('.emotion-item')];
    const carousel = document.getElementById('history-carousel');
    const wrapper = document.querySelector('.history-carousel-wrapper');
    const dots = document.querySelector('.carousel-dots');
    const status = document.createElement('p');
    status.className = 'emotion-status'; status.id = 'emotion-status'; status.setAttribute('aria-live', 'polite');
    document.querySelector('.emotion-selector-card .card-instruction')?.after(status);

    state.initialized = true;
    state.triggers ||= { good: [], bad: [] };

    let selectedEmotion = null;
    let currentPage = 0;
    const today = localDateKey();
    const todayRecord = [...state.entries].reverse().find((entry) => entry.dateKey === today);
    if (todayRecord) selectEmotion(todayRecord.emotion);

    const dialog = document.createElement('dialog');
    dialog.className = 'emotion-dialog';
    dialog.innerHTML = '<form method="dialog" class="emotion-dialog-card"><header><div><p class="emotion-dialog-kicker">LOVE JOURNEY · MINHAS EMOÇÕES</p><h2></h2></div><button type="button" data-close-emotion aria-label="Fechar">×</button></header><div class="emotion-dialog-content"></div><footer class="emotion-dialog-actions"></footer></form>';
    document.body.append(dialog);
    const title = dialog.querySelector('h2');
    const content = dialog.querySelector('.emotion-dialog-content');
    const actions = dialog.querySelector('.emotion-dialog-actions');
    const openDialog = (heading, body, buttons = []) => {
      title.textContent = heading; content.innerHTML = body;
      actions.innerHTML = buttons.map((button) => `<button type="button" class="${button.primary ? 'emotion-primary' : 'emotion-secondary'}" data-action="${escapeHtml(button.action || 'close')}">${escapeHtml(button.label)}</button>`).join('');
      dialog.showModal();
    };
    const saveState = () => localStorage.setItem(storageKey, JSON.stringify(state));

    function selectEmotion(emotion) {
      selectedEmotion = emotion;
      emotionButtons.forEach((button) => {
        const selected = button.dataset.emotion === emotion;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    }

    const renderHistory = () => {
      if (!carousel) return;
      const entries = [...state.entries].sort((a, b) => parseDate(b.dateKey || b.date) - parseDate(a.dateKey || a.date));
      carousel.replaceChildren();
      if (!entries.length) carousel.innerHTML = '<p class="lj-vazio" style="flex: 1 1 100%; width: 100%"><strong>Nenhuma emoção registrada ainda.</strong>Escolha como você está se sentindo e registre o seu momento.</p>';
      entries.forEach((entry) => {
        const card = document.createElement('article');
        card.className = `history-item ${colors[moodCategory(entry.emotion)] || colors.other}`;
        card.dataset.entryId = entry.id;
        const date = document.createElement('span'); date.className = 'item-date'; date.textContent = entry.date || formatDate(parseDate(entry.dateKey));
        const icon = document.createElement('div'); icon.className = 'item-emoji'; icon.innerHTML = `<i aria-hidden="true" class="fa-regular ${emojis[entry.emotion] || 'fa-face-meh'}"></i>`;
        const name = document.createElement('h4'); name.className = 'item-title'; name.textContent = entry.emotion;
        const note = document.createElement('p'); note.className = 'item-text'; note.textContent = entry.note || 'Emoção registrada.';
        card.append(date, icon, name, note); carousel.append(card);
      });
      currentPage = Math.min(currentPage, pageCount() - 1);
      updateCarousel(); updateInsights();
    };

    function pageCount() {
      if (!carousel || !wrapper || !carousel.children.length) return 1;
      const first = carousel.querySelector('.history-item');
      const style = getComputedStyle(carousel);
      const step = (first?.getBoundingClientRect().width || 160) + (parseFloat(style.gap) || 16);
      return Math.max(1, Math.ceil(Math.max(0, carousel.scrollWidth - wrapper.clientWidth) / step) + 1);
    }

    function updateCarousel() {
      if (!carousel || !wrapper || !dots) return;
      const first = carousel.querySelector('.history-item');
      const step = (first?.getBoundingClientRect().width || 160) + (parseFloat(getComputedStyle(carousel).gap) || 16);
      const pages = pageCount();
      carousel.style.transform = `translateX(-${currentPage * step}px)`;
      dots.replaceChildren();
      for (let page = 0; page < pages; page += 1) {
        const dot = document.createElement('button'); dot.type = 'button'; dot.className = `dot-nav${page === currentPage ? ' active' : ''}`;
        dot.setAttribute('aria-label', `Ir para página ${page + 1} do histórico`); dot.setAttribute('aria-current', String(page === currentPage));
        dot.addEventListener('click', () => { currentPage = page; updateCarousel(); }); dots.append(dot);
      }
      const previous = document.getElementById('carousel-prev');
      const next = document.getElementById('carousel-next');
      if (previous) previous.disabled = currentPage === 0;
      if (next) next.disabled = currentPage >= pages - 1;
    }

    function updateInsights() {
      const recent = [...state.entries].filter((entry) => (entry.dateKey || localDateKey(parseDate(entry.date))) >= localDateKey(new Date(Date.now() - 6 * 86400000)));
      const weekly = document.querySelector('.chart-matrix');
      if (weekly) {
        weekly.replaceChildren();
        const todayDate = new Date();
        const start = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate() - 6);
        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const rowFor = { happy: 0, calm: 1, other: 2, anxious: 3, sad: 3 };
        for (let index = 0; index < 7; index += 1) {
          const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
          const key = localDateKey(date);
          const entry = [...state.entries].reverse().find((item) => item.dateKey === key);
          const column = document.createElement('div'); column.className = 'chart-col';
          const category = entry ? moodCategory(entry.emotion) : '';
          const dotColor = category === 'happy' ? 'pink' : category === 'calm' ? 'teal' : category === 'anxious' ? 'blue' : category === 'sad' ? 'purple' : 'yellow';
          for (let row = 0; row < 4; row += 1) {
            const mark = document.createElement('span');
            mark.className = category && rowFor[category] === row ? `dot ${dotColor}` : 'dot-space';
            if (category && rowFor[category] === row) mark.title = entry.emotion;
            column.append(mark);
          }
          const label = document.createElement('span'); label.className = 'day-label'; label.textContent = dayLabels[date.getDay()];
          column.append(label); weekly.append(column);
        }
      }

      const counts = Object.fromEntries(categories.map((category) => [category.key, 0]));
      state.entries.forEach((entry) => { counts[moodCategory(entry.emotion)] += 1; });
      const total = state.entries.length || 1;
      const percentages = categories.map((category) => Math.round(counts[category.key] / total * 100));
      const donut = document.querySelector('.donut-chart');
      if (donut) {
        let cursor = 0;
        const stops = categories.map((category, index) => { const startAt = cursor; cursor += percentages[index]; return `${category.color} ${startAt}% ${cursor}%`; });
        donut.style.background = state.entries.length ? `conic-gradient(${stops.join(', ')})` : '#f1edf3';
        donut.setAttribute('role', 'img'); donut.setAttribute('aria-label', 'Distribuição das emoções registradas');
      }
      document.querySelectorAll('.category-list li').forEach((row, index) => {
        row.querySelector('.cat-name').textContent = categories[index].label;
        row.querySelector('.cat-percentage').textContent = `${percentages[index]}%`;
      });
      const leader = categories.reduce((best, current) => counts[current.key] > counts[best.key] ? current : best, categories[0]);
      const stateText = document.querySelector('.state-text p');
      if (stateText) stateText.textContent = state.entries.length ? `Nos registros, ${leader.label.toLocaleLowerCase('pt-BR')} aparece com mais frequência.` : 'Registre uma emoção para começar a acompanhar seus padrões.';
      const quote = document.querySelector('.journey-card .quote-text');
      if (quote) quote.textContent = state.entries.length >= 5 ? '"Você já sentiu dias difíceis, mas também viveu muitos dias incríveis."' : '"Cada registro ajuda você a enxergar a sua própria jornada."';
      const weeklyCopy = document.querySelector('.weekly-mood-card .card-instruction');
      if (weeklyCopy) weeklyCopy.textContent = `${recent.length} registro${recent.length === 1 ? '' : 's'} nos últimos 7 dias.`;
    }

    const saveEntry = (note) => {
      if (!selectedEmotion) { status.textContent = 'Escolha uma emoção antes de registrar.'; document.querySelector('.emotion-selector-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const now = new Date();
      state.entries.push({ id: `emotion-${Date.now()}`, emotion: selectedEmotion, note: note.trim() || 'Emoção registrada.', dateKey: localDateKey(now), date: formatDate(now), createdAt: now.toISOString() });
      saveState(); renderHistory(); selectEmotion(null); status.textContent = 'Sua emoção foi registrada.';
      window.setTimeout(() => { status.textContent = ''; }, 2500);
    };

    emotionButtons.forEach((button) => button.addEventListener('click', () => { selectEmotion(button.dataset.emotion); status.textContent = ''; }));
    const openRegistration = () => {
      if (!selectedEmotion) { status.textContent = 'Escolha uma emoção para registrar seu momento.'; document.querySelector('.emotion-selector-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); emotionButtons[0]?.focus(); return; }
      openDialog('Registrar emoção', `<p>Você está se sentindo <strong>${escapeHtml(selectedEmotion.toLocaleLowerCase('pt-BR'))}</strong>. Se quiser, conte um pouco sobre o momento.</p><label class="emotion-field">Observação (opcional)<textarea name="emotion-note" rows="4" maxlength="500" placeholder="O que aconteceu ou do que você precisa agora?"></textarea></label>`, [{ label: 'Salvar registro', primary: true, action: 'save' }, { label: 'Cancelar' }]);
    };
    document.getElementById('btn-save-emotion')?.addEventListener('click', openRegistration);
    document.getElementById('btn-top-register')?.addEventListener('click', openRegistration);

    dialog.querySelector('[data-close-emotion]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
    actions.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action;
      if (!action || action === 'close') { dialog.close(); return; }
      if (action === 'save') { saveEntry(content.querySelector('[name="emotion-note"]')?.value || ''); dialog.close(); }
      if (action.startsWith('delete:')) {
        const id = action.slice('delete:'.length); state.entries = state.entries.filter((entry) => entry.id !== id); saveState(); renderHistory(); openHistory();
      }
      if (action === 'export') {
        const rows = [['Data', 'Emoção', 'Observação'], ...state.entries.map((entry) => [entry.date || formatDate(parseDate(entry.dateKey)), entry.emotion, entry.note || ''])];
        const csv = rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
        const link = Object.assign(document.createElement('a'), { href: url, download: 'love-journey-emocoes.csv' });
        link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    });

    const openHistory = (filter = 'Todas') => {
      const options = ['Todas', ...new Set(state.entries.map((entry) => entry.emotion))];
      openDialog('Histórico de emoções', `<label class="emotion-field">Filtrar por emoção<select name="history-filter">${options.map((option) => `<option ${option === filter ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></label><div class="all-emotion-history"></div>`, [{ label: 'Exportar CSV', action: 'export' }, { label: 'Fechar' }]);
      const select = content.querySelector('[name="history-filter"]');
      const list = content.querySelector('.all-emotion-history');
      const renderRows = () => {
        const records = [...state.entries].filter((entry) => select.value === 'Todas' || entry.emotion === select.value).sort((a, b) => parseDate(b.dateKey || b.date) - parseDate(a.dateKey || a.date));
        list.innerHTML = records.length ? records.map((entry) => `<article class="all-emotion-record"><div><strong>${escapeHtml(entry.emotion)}</strong><small>${escapeHtml(entry.date || formatDate(parseDate(entry.dateKey)))}</small><p>${escapeHtml(entry.note || '')}</p></div><button type="button" data-delete-history="${escapeHtml(entry.id)}" aria-label="Excluir registro de ${escapeHtml(entry.emotion)}">Excluir</button></article>`).join('') : '<p>Nenhum registro para este filtro.</p>';
      };
      select.addEventListener('change', renderRows); renderRows();
      list.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-delete-history]');
        if (!remove) return;
        state.entries = state.entries.filter((entry) => entry.id !== remove.dataset.deleteHistory); saveState(); renderHistory(); renderRows();
      });
    };
    document.getElementById('btn-view-all')?.addEventListener('click', () => openHistory());
    document.querySelector('.history-carousel')?.addEventListener('click', (event) => {
      const card = event.target.closest('.history-item'); if (!card) return;
      const entry = state.entries.find((item) => item.id === card.dataset.entryId); if (!entry) return;
      openDialog(entry.emotion, `<p><strong>${escapeHtml(entry.date || formatDate(parseDate(entry.dateKey)))}</strong></p><p>${escapeHtml(entry.note || 'Emoção registrada.')}</p>`, [{ label: 'Fechar' }]);
    });

    document.getElementById('carousel-prev')?.addEventListener('click', () => { currentPage = Math.max(0, currentPage - 1); updateCarousel(); });
    document.getElementById('carousel-next')?.addEventListener('click', () => { currentPage = Math.min(pageCount() - 1, currentPage + 1); updateCarousel(); });
    window.addEventListener('resize', updateCarousel);
    document.querySelector('.journey-card .link-action')?.addEventListener('click', () => document.getElementById('grafico')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));

    dialog.addEventListener('close', () => { content.innerHTML = ''; });
    // ------------------------------------------
    // TRATAMENTO (feminino/masculino) E GATILHOS
    // ------------------------------------------

    const treatment = LJ.contaAtual()?.casal?.tratamento || 'feminino';
    if (treatment === 'masculino') {
      const masculine = { Tranquila: 'Tranquilo', Neutra: 'Neutro', Preocupada: 'Preocupado', Calma: 'Calmo', Irritada: 'Irritado', Ansiosa: 'Ansioso', Animada: 'Animado', Apaixonada: 'Apaixonado' };
      emotionButtons.forEach((button) => {
        const word = masculine[button.dataset.emotion];
        if (!word) return;
        button.dataset.emotion = word;
        button.querySelector('.label').textContent = word;
      });
      document.querySelectorAll('.chart-legend .legend-item, .legend-item').forEach((item) => {
        const last = item.lastChild;
        if (last?.nodeType === Node.TEXT_NODE && masculine[last.textContent.trim()]) last.textContent = ` ${masculine[last.textContent.trim()]}`;
      });
      const instruction = document.querySelector('.triggers-card .card-instruction');
      if (instruction) instruction.textContent = instruction.textContent.replace('sobrecarregada', 'sobrecarregado');
      const badLabel = document.querySelector('.trigger-label.bad');
      if (badLabel?.lastChild) badLabel.lastChild.textContent = badLabel.lastChild.textContent.replace('ansiosa', 'ansioso');
    }

    const triggerGroups = [...document.querySelectorAll('.triggers-card .tag-group')];
    const triggerKinds = ['good', 'bad'];
    const renderTriggers = () => {
      triggerGroups.forEach((group, index) => {
        const kind = triggerKinds[index];
        group.replaceChildren();
        state.triggers[kind].forEach((value) => {
          const tag = document.createElement('span'); tag.className = 'tag'; tag.textContent = value; group.append(tag);
        });
        const add = document.createElement('button');
        add.type = 'button'; add.className = 'tag'; add.dataset.editTriggers = kind;
        add.textContent = state.triggers[kind].length ? 'Editar' : '+ Adicionar';
        add.style.cursor = 'pointer'; add.style.font = 'inherit';
        group.append(add);
      });
    };
    document.querySelector('.triggers-card')?.addEventListener('click', (event) => {
      const kind = event.target.closest('[data-edit-triggers]')?.dataset.editTriggers;
      if (!kind) return;
      const title = kind === 'good' ? 'O que te faz bem' : 'O que pode te deixar ' + LJ.flexao(treatment, 'ansiosa', 'ansioso');
      openDialog(title, `<label class="emotion-field">Separe por vírgula<textarea name="triggers" rows="3" maxlength="300" placeholder="${kind === 'good' ? 'Ex.: música, caminhar, conversar com amigos' : 'Ex.: cobranças, falta de sono'}">${escapeHtml(state.triggers[kind].join(', '))}</textarea></label>`, [{ label: 'Salvar', primary: true, action: `triggers:${kind}` }, { label: 'Cancelar' }]);
    });
    actions.addEventListener('click', (event) => {
      const action = event.target.closest('[data-action]')?.dataset.action || '';
      if (!action.startsWith('triggers:')) return;
      const kind = action.slice('triggers:'.length);
      state.triggers[kind] = (content.querySelector('[name="triggers"]')?.value || '').split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8);
      saveState(); renderTriggers(); dialog.close();
    });

    renderTriggers();
    renderHistory();
  });
})();
