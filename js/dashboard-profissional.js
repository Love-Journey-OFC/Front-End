(() => {
  const conta = LJ.exigirSessao('profissional');
  if (!conta) return;

  const key = LJ.chave('profissional');
  const info = conta.profissional || {};
  const createdAt = new Intl.DateTimeFormat('pt-BR', { month: '2-digit', year: 'numeric' }).format(new Date(conta.criadaEm || Date.now()));
  // O perfil começa com o que a pessoa informou no cadastro.
  const defaults = {
    nome: LJ.nomeCompleto(conta),
    cargo: info.area || 'Profissional',
    proposito: '',
    especialidades: '',
    publico: '',
    temas: '',
    sobre: '',
    frase: '',
    disponibilidade: '',
    atendimento: '',
    idioma: 'Português (Brasil)',
    valor: 'A combinar',
    jornada: [
      info.formacao && `${info.formacao} — ${info.experiencia || ''}`.replace(/ — $/, ''),
      `Início no Love Journey — ${createdAt}`
    ].filter(Boolean).join('\n'),
    questionario: ['', '', '', '', '']
  };
  let data = { ...defaults };
  try { data = { ...data, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}

  document.addEventListener('DOMContentLoaded', () => {
    const name = document.querySelector('.profile-name');
    const role = document.querySelector('.profile-role');
    const about = document.querySelector('.about-text');
    const sections = [...document.querySelectorAll('.dashboard-grid .col-main > .card')];
    const tagFields = { 1: 'especialidades', 2: 'publico', 3: 'temas' };
    const renderTags = (card, value, field) => {
      const group = card?.querySelector('.tag-group'); if (!group) return;
      const colors = ['pink', 'green', 'purple', 'yellow'];
      const items = String(value || '').split(',').map(v => v.trim()).filter(Boolean);
      group.innerHTML = items.map((v, i) => `<span class="tag ${colors[i % colors.length]}">${escapeHtml(v)}</span>`).join('')
        || `<button type="button" class="tag pink" data-edit="${field}" style="cursor:pointer;font:inherit">+ Adicionar</button>`;
    };
    const render = () => {
      if (name) name.textContent = data.nome;
      if (role) role.textContent = data.cargo;
      const [purpose, approach] = document.querySelectorAll('.profile-card .profile-text');
      if (purpose) purpose.textContent = data.proposito || 'Conte em "Editar informações" qual é o seu propósito como profissional.';
      if (approach) { approach.textContent = ''; approach.style.display = 'none'; }
      const photo = document.querySelector('.profile-photo');
      if (photo) { photo.src = data.foto || LJ.avatar(data.nome, '#b39ddb'); photo.alt = `Foto de ${data.nome}`; }
      if (about) about.textContent = data.sobre || 'Escreva um pouco sobre você para os usuários conhecerem seu trabalho.';
      const quote = document.querySelector('.about-card .quote-box');
      if (quote) { quote.style.display = data.frase ? '' : 'none'; quote.querySelector('.quote-text').textContent = data.frase ? `"${data.frase}"` : ''; }
      Object.entries(tagFields).forEach(([index, field]) => renderTags(sections[index], data[field], field));
      const values = [data.disponibilidade || 'Não informada', data.atendimento || 'Não informado', data.idioma || 'Não informado', data.valor || 'A combinar'];
      document.querySelectorAll('.info-card .info-item div span').forEach((span, i) => { span.textContent = values[i]; });
      const timeline = document.querySelector('.timeline');
      if (timeline) timeline.innerHTML = data.jornada.split('\n').filter(Boolean).map(line => {
        const [title, date] = line.split(' — '); return `<div class="timeline-item"><span class="dot-point"></span><div><strong>${escapeHtml(title)}</strong><small>${escapeHtml(date || '')}</small></div></div>`;
      }).join('') || '<p class="lj-vazio">Adicione as etapas da sua formação e experiência.</p>';
    };
    const modal = document.createElement('dialog'); modal.className = 'profile-editor';
    modal.innerHTML = `<form method="dialog" class="profile-editor-card"><header><h2>Editar perfil profissional</h2><button type="button" class="close" aria-label="Fechar">×</button></header><div class="editor-fields"></div><footer><button type="button" class="cancel">Cancelar</button><button type="submit" class="save">Salvar alterações</button></footer></form>`;
    document.body.append(modal);
    const style = document.createElement('style'); style.textContent = `.profile-editor{border:0;border-radius:20px;padding:0;margin:auto;width:min(620px,calc(100% - 28px));max-height:90vh;color:#302a39;box-shadow:0 20px 70px #25143544}.profile-editor::backdrop{background:#24183388;backdrop-filter:blur(3px)}.profile-editor-card{padding:24px;max-height:90vh;overflow:auto;font-family:inherit}.profile-editor header,.profile-editor footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.profile-editor h2{font-size:1.25rem;margin:0 0 18px}.profile-editor header button{border:0;background:none;font-size:28px;cursor:pointer}.profile-editor label{display:block;font-size:.9rem;font-weight:600;margin:12px 0}.profile-editor input,.profile-editor textarea{box-sizing:border-box;display:block;width:100%;padding:11px;border:1px solid #ddd5e5;border-radius:10px;font:inherit;margin-top:5px}.profile-editor textarea{min-height:84px;resize:vertical}.profile-editor footer{justify-content:flex-end;margin-top:18px}.profile-editor footer button{border:0;border-radius:10px;padding:11px 16px;cursor:pointer}.profile-editor .save{background:#7545a5;color:white}.profile-editor .cancel{background:#f1edf5;color:#46394e}`;
    document.head.append(style);
    const questions = [...document.querySelectorAll('.question-list .question-item')].map(item => item.textContent.trim());
    const optional = new Set(['proposito', 'disponibilidade', 'atendimento', 'idioma', 'valor', 'frase', 'especialidades', 'publico', 'temas', 'sobre', 'jornada']);
    const long = new Set(['proposito', 'sobre', 'jornada']);
    const definitions = {
      perfil: [['nome', 'Nome'], ['cargo', 'Título profissional'], ['proposito', 'Seu propósito'], ['foto', 'Foto (opcional)'], ['disponibilidade', 'Disponibilidade (ex.: Online • 09:00 - 18:00)'], ['atendimento', 'Atendimento (ex.: Presencial e online)'], ['idioma', 'Idioma'], ['valor', 'Valor de consulta']],
      especialidades: [['especialidades', 'Separe as especialidades por vírgula']],
      publico: [['publico', 'Separe os públicos por vírgula']],
      temas: [['temas', 'Separe os temas por vírgula']],
      sobre: [['sobre', 'Sobre mim'], ['frase', 'Frase que te inspira (opcional)']],
      jornada: [['jornada', 'Uma etapa por linha (título — data)']],
      questionario: questions.map((question, i) => [`questionario.${i}`, question])
    };
    const fields = modal.querySelector('.editor-fields');
    const valueOf = field => field.startsWith('questionario.') ? data.questionario[Number(field.split('.')[1])] || '' : data[field] || '';
    let editingType = 'perfil';
    function openEditor(type = 'perfil') {
      editingType = type;
      const formFields = definitions[type] || definitions.perfil;
      fields.innerHTML = formFields.map(([field, label]) => {
        if (field === 'foto') return `<label>${label}<input name="foto" type="file" accept="image/*"></label>`;
        const isLong = long.has(field) || field.startsWith('questionario.');
        return `<label>${escapeHtml(label)}${isLong ? `<textarea name="${field}">${escapeHtml(valueOf(field))}</textarea>` : `<input name="${field}" value="${escapeHtml(valueOf(field))}"${optional.has(field) ? '' : ' required'}>`}</label>`;
      }).join('');
      modal.querySelector('h2').textContent = type === 'perfil' ? 'Editar perfil profissional' : `Editar ${({ especialidades: 'especialidades', publico: 'público atendido', temas: 'temas de interesse', sobre: 'sobre mim', jornada: 'minha jornada', questionario: 'questionário de perfil' })[type]}`;
      modal.showModal();
    }
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => openEditor());
    document.querySelectorAll('.col-main .icon-btn').forEach((button, i) => button.addEventListener('click', () => openEditor(['especialidades', 'publico', 'temas', 'sobre'][i])));
    document.querySelector('.timeline-card .icon-btn')?.addEventListener('click', () => openEditor('jornada'));
    document.querySelector('.dashboard-grid')?.addEventListener('click', event => {
      const edit = event.target.closest('[data-edit]');
      if (edit) openEditor(edit.dataset.edit);
    });
    document.querySelectorAll('.question-list .question-item').forEach(item => {
      item.setAttribute('role', 'button'); item.tabIndex = 0; item.style.cursor = 'pointer';
      item.addEventListener('click', () => openEditor('questionario'));
      item.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openEditor('questionario'); } });
    });
    modal.querySelector('.close').onclick = modal.querySelector('.cancel').onclick = () => modal.close();
    modal.addEventListener('click', e => { if (e.target === modal) modal.close(); });
    modal.querySelector('form').addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      for (const [field, value] of formData) {
        if (field === 'foto') { if (value?.size) data.foto = await toDataUrl(value); continue; }
        if (field.startsWith('questionario.')) data.questionario[Number(field.split('.')[1])] = String(value).trim();
        else data[field] = String(value).trim();
      }
      try { localStorage.setItem(key, JSON.stringify(data)); } catch { delete data.foto; localStorage.setItem(key, JSON.stringify(data)); }
      // Perfil público: o que os casais veem nos mentores.
      const [first, ...rest] = data.nome.split(/\s+/);
      LJ.atualizarConta(conta.id, {
        nome: first || conta.nome, sobrenome: rest.join(' '),
        perfilPublico: { cargo: data.cargo, sobre: data.sobre || data.proposito, especialidades: data.especialidades, foto: data.foto || '' }
      });
      render(); modal.close();
    });
    const toDataUrl = async file => {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 320 / Math.max(bitmap.width, bitmap.height));
      const canvas = Object.assign(document.createElement('canvas'), { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return canvas.toDataURL('image/jpeg', 0.85);
    };
    document.querySelector('.questionnaire-card .link-action')?.addEventListener('click', event => {
      event.preventDefault();
      const answered = questions.map((question, i) => [question, data.questionario[i]]).filter(([, answer]) => answer);
      fields.innerHTML = answered.length ? answered.map(([question, answer]) => `<p><strong>${escapeHtml(question)}</strong><br>${escapeHtml(answer)}</p>`).join('') : '<p>Você ainda não respondeu o questionário. Clique em uma pergunta para começar.</p>';
      modal.querySelector('h2').textContent = 'Respostas do questionário';
      modal.showModal();
    });
    document.querySelector('.profile-card .btn-block')?.addEventListener('click', () => {
      const content = `${data.nome}\n${data.cargo}\n\n${data.proposito}\n\n${data.sobre}\n\nEspecialidades: ${data.especialidades}\n\nJornada:\n${data.jornada}`;
      const file = new Blob([content], { type: 'text/plain' }); const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: 'curriculo-profissional.txt' }); link.click(); URL.revokeObjectURL(link.href);
    });
    render();
  });
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
})();
