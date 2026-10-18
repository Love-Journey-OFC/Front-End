(() => {
  const conta = LJ.exigirSessao('profissional');
  if (!conta) return;

  // Publicações, comentários e curtidas são compartilhados entre os profissionais deste navegador.
  const keys = {
    posts: 'loveJourney.comunidade.posts',
    comments: 'loveJourney.comunidade.comments',
    likes: 'loveJourney.comunidade.likes',
    reports: 'loveJourney.comunidade.reports',
    mine: LJ.chave('comunidade')
  };
  const currentName = () => LJ.nomeCompleto(LJ.contaAtual()) || 'Profissional';
  const escapeHtml = LJ.escapeHtml;
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR');
  const read = (key, fallback) => LJ.ler(key, fallback);
  const write = (key, value) => LJ.gravar(key, value);
  const tagColors = ['pink', 'purple', 'yellow'];
  const avatarOf = accountId => {
    const author = LJ.conta(accountId);
    return author?.perfilPublico?.foto || LJ.avatar(author ? LJ.nomeCompleto(author) : '?', '#b39ddb');
  };
  const hours = value => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

  document.addEventListener('DOMContentLoaded', () => {
    const feed = document.querySelector('.feed');
    const publishCard = document.querySelector('.publish-card');
    const textarea = publishCard.querySelector('textarea');
    const publishButton = publishCard.querySelector('.publish-button');
    const postButtons = [...publishCard.querySelectorAll('.chip-btn')];
    const filters = [...publishCard.querySelectorAll('.feed-filters .tag-button')];
    const categories = [...document.querySelectorAll('.categories-card .tag')].map(tag => tag.textContent.trim());
    const mine = read(keys.mine, { saved: [], hidden: [] });
    mine.saved ||= []; mine.hidden ||= [];
    const saveMine = () => write(keys.mine, mine);
    let selectedKind = 'Texto'; let attachedUrl = ''; let attachedFile = null; let linkValue = '';
    let activeFilter = 'Todos';

    publishCard.querySelector('img').src = avatarOf(conta.id);
    publishCard.querySelector('img').alt = `Foto de ${currentName()}`;

    const style = document.createElement('style');
    style.textContent = `.community-action-dialog{position:fixed;inset:50% auto auto 50%;transform:translate(-50%,-50%);margin:0;border:0;border-radius:18px;padding:0;width:min(500px,calc(100% - 28px));max-height:88vh;max-height:88dvh;color:#333;box-shadow:0 22px 70px #28163244}.community-action-dialog::backdrop{background:#21142c88;backdrop-filter:blur(3px)}.community-action-dialog .content{padding:24px;max-height:88vh;max-height:88dvh;overflow:auto;font-family:Poppins,sans-serif}.community-action-dialog header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px}.community-action-dialog h2{font-size:1.15rem;color:#49344f}.community-action-dialog p{color:#666;line-height:1.55;margin:8px 0}.community-action-dialog .close{border:0;background:transparent;font-size:26px;cursor:pointer}.community-action-dialog .actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:8px;margin-top:16px}.community-action-dialog button.action{border:0;border-radius:9px;padding:10px 14px;cursor:pointer;font:inherit}.community-action-dialog .primary{background:#f25287;color:white}.community-action-dialog .secondary{background:#f1edf3;color:#49344f}.community-action-dialog label{display:grid;gap:6px;margin:12px 0}.community-action-dialog textarea,.community-action-dialog select{font:inherit;padding:10px;border:1px solid #dfd5e3;border-radius:10px}.community-action-dialog textarea{min-height:90px}.post-stats button{padding:2px 4px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer}.post-stats button[aria-pressed="true"]{color:#d82262;font-weight:700}.post-media{display:block;max-width:100%;max-height:360px;margin-top:12px;border-radius:10px}.post-media-link{display:inline-block;margin-top:10px;color:var(--primary-pink);overflow-wrap:anywhere}.publish-attachment{margin-top:8px;font-size:.8rem;color:#5e7c64}.publish-content .link-draft{width:100%;margin-top:8px;padding:8px;border:1px solid #f3d0dc;border-radius:8px;font:inherit}.comment-submit{border:0;background:transparent;color:var(--primary-pink);font-weight:600;cursor:pointer;margin-left:6px}.comment-input-wrap{display:flex;align-items:center;gap:4px}.community-empty{padding:18px;text-align:center;background:#fff7fa;border-radius:12px;color:#777}.content-tab-empty{padding:12px;border-radius:10px;background:#fff7fa;color:#777;font-size:.78rem}`;
    document.head.append(style);

    const modal = document.createElement('dialog'); modal.className = 'community-action-dialog'; document.body.append(modal);
    const showDialog = (title, body, onReady) => {
      modal.innerHTML = `<div class="content"><header><h2>${escapeHtml(title)}</h2><button type="button" class="close" aria-label="Fechar">&times;</button></header><div class="body">${body}</div></div>`;
      modal.querySelector('.close').onclick = () => modal.close();
      modal.onclick = event => { if (event.target === modal) modal.close(); };
      onReady?.(modal.querySelector('.body')); modal.showModal();
    };

    const fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.hidden = true; publishCard.append(fileInput);
    const attachmentStatus = document.createElement('p'); attachmentStatus.className = 'publish-attachment'; attachmentStatus.hidden = true; publishCard.querySelector('.publish-content').insertBefore(attachmentStatus, publishCard.querySelector('.feed-filters'));
    const linkInput = document.createElement('input'); linkInput.type = 'url'; linkInput.className = 'link-draft'; linkInput.placeholder = 'Cole o link que deseja compartilhar'; linkInput.hidden = true; publishCard.querySelector('.publish-content').insertBefore(linkInput, publishCard.querySelector('.feed-filters'));

    // ------------------------------------------
    // DADOS
    // ------------------------------------------

    const posts = () => read(keys.posts, []).filter(post => post.autorId);
    const comments = () => read(keys.comments, {});
    const likes = () => read(keys.likes, {});
    const likesOf = id => (likes()[id] || []).length;
    const likedByMe = id => (likes()[id] || []).includes(conta.id);
    const commentsOf = id => comments()[id] || [];
    const autoTags = text => categories.filter(category => normalize(text).includes(normalize(category))).slice(0, 3);

    // ------------------------------------------
    // PUBLICAÇÕES
    // ------------------------------------------

    const buildComment = comment => {
      const row = document.createElement('div'); row.className = 'comment';
      const avatar = document.createElement('img'); avatar.className = 'avatar avatar-sm'; avatar.src = avatarOf(comment.autorId); avatar.alt = `Foto de ${comment.name}`;
      const body = document.createElement('div'); const author = document.createElement('strong'); author.textContent = comment.name;
      const paragraph = document.createElement('p'); paragraph.textContent = comment.text;
      const timestamp = document.createElement('small'); timestamp.textContent = `${LJ.formatarData(comment.date)} • ${hours(comment.date)}`;
      body.append(author, paragraph, timestamp); row.append(avatar, body); return row;
    };

    const buildPost = record => {
      const author = LJ.conta(record.autorId);
      const article = document.createElement('article'); article.className = 'card post-card'; article.dataset.postId = record.id; article.dataset.createdAt = record.createdAt;
      article.dataset.own = String(record.autorId === conta.id);
      const main = document.createElement('div'); main.className = 'post-main';
      const authorRow = document.createElement('div'); authorRow.className = 'post-author';
      const avatar = document.createElement('img'); avatar.className = 'avatar'; avatar.src = avatarOf(record.autorId);
      const name = author ? LJ.nomeCompleto(author) : record.autorNome;
      avatar.alt = `Foto de ${name}`;
      const authorInfo = document.createElement('div'); const strong = document.createElement('strong'); strong.textContent = name;
      const role = document.createElement('small'); role.textContent = `${author?.perfilPublico?.cargo || author?.profissional?.area || record.autorCargo || 'Profissional'} • ${LJ.tempoRelativo(record.createdAt)}`;
      authorInfo.append(strong, role); authorRow.append(avatar, authorInfo);
      const menu = document.createElement('button'); menu.className = 'post-menu'; menu.type = 'button'; menu.setAttribute('aria-label', 'Mais opções'); menu.textContent = '•••';
      const heading = document.createElement('h3'); heading.textContent = record.text.split('\n')[0].slice(0, 100) || 'Nova publicação';
      const content = document.createElement('p'); content.className = 'post-text'; content.textContent = record.text;
      main.append(authorRow, menu, heading, content);
      if (record.link) { const a = document.createElement('a'); a.className = 'post-media-link'; a.href = record.link; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = record.link; main.append(a); }
      if (record.mediaUrl) main.append(record.kind === 'Imagem' ? Object.assign(document.createElement('img'), { className: 'post-media', src: record.mediaUrl, alt: 'Imagem anexada à publicação' }) : Object.assign(document.createElement('video'), { className: 'post-media', src: record.mediaUrl, controls: true }));
      const tags = document.createElement('div'); tags.className = 'tag-group';
      [...(record.tags || []), ...(record.kind && record.kind !== 'Texto' ? [record.kind] : [])].forEach((value, i) => { const tag = document.createElement('span'); tag.className = `tag ${tagColors[i % tagColors.length]}`; tag.textContent = value; tags.append(tag); });
      const stats = document.createElement('div'); stats.className = 'post-stats';
      stats.innerHTML = `<button type="button" class="post-like" aria-label="Curtir publicação" aria-pressed="${likedByMe(record.id)}"><i aria-hidden="true" class="fa-solid fa-heart"></i> <span>${likesOf(record.id)}</span></button><button type="button" class="post-comment" aria-label="Ir para comentários"><i aria-hidden="true" class="fa-solid fa-comment"></i> <span>${commentsOf(record.id).length}</span></button>`;
      main.append(tags, stats);
      const commentArea = document.createElement('div'); commentArea.className = 'comments';
      commentsOf(record.id).forEach(comment => commentArea.append(buildComment(comment)));
      const wrap = document.createElement('div'); wrap.className = 'comment-input-wrap';
      const input = document.createElement('input'); input.type = 'text'; input.className = 'comment-input'; input.placeholder = 'Escreva um comentário...'; input.setAttribute('aria-label', 'Escreva um comentário');
      const send = document.createElement('button'); send.type = 'button'; send.className = 'comment-submit'; send.textContent = 'Enviar';
      wrap.append(input, send); commentArea.append(wrap);
      article.append(main, commentArea);
      return article;
    };

    const renderFeed = () => {
      feed.querySelectorAll('.post-card, .community-empty').forEach(el => el.remove());
      let list = posts().filter(post => !mine.hidden.includes(post.id));
      const label = normalize(activeFilter);
      if (label.includes('curt')) list.sort((a, b) => likesOf(b.id) - likesOf(a.id));
      else list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      if (label.includes('meus')) list = list.filter(post => post.autorId === conta.id);
      if (activeFilter.startsWith('categoria:')) {
        const category = normalize(activeFilter.slice('categoria:'.length));
        list = list.filter(post => normalize(`${post.text} ${(post.tags || []).join(' ')}`).includes(category));
      }
      filters.forEach(button => { const active = normalize(button.textContent.trim()) === label; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
      list.forEach(post => feed.append(buildPost(post)));
      if (!list.length) {
        const empty = document.createElement('p'); empty.className = 'community-empty';
        empty.textContent = posts().length ? 'Nenhuma publicação encontrada com esse filtro.' : 'Ainda não há publicações na comunidade. Que tal começar a conversa?';
        feed.append(empty);
      }
    };

    // ------------------------------------------
    // COLUNA LATERAL
    // ------------------------------------------

    const renderSide = () => {
      const all = posts();
      const trending = document.querySelector('.trending-card');
      trending.querySelectorAll('.trend-item, .lj-vazio').forEach(el => el.remove());
      const top = all.filter(post => commentsOf(post.id).length || likesOf(post.id)).sort((a, b) => (commentsOf(b.id).length - commentsOf(a.id).length) || (likesOf(b.id) - likesOf(a.id))).slice(0, 4);
      top.forEach(post => {
        const count = commentsOf(post.id).length;
        trending.insertAdjacentHTML('beforeend', `<div class="trend-item" data-trend="${escapeHtml(post.id)}" style="cursor:pointer"><span class="trend-icon"><i aria-hidden="true" class="fa-solid fa-circle-question"></i></span><div><strong>${escapeHtml(post.text.split('\n')[0].slice(0, 70))}</strong><small>${count} ${count === 1 ? 'resposta' : 'respostas'}</small></div></div>`);
      });
      if (!top.length) trending.insertAdjacentHTML('beforeend', '<p class="lj-vazio">As publicações com mais conversa aparecem aqui.</p>');

      const myPosts = all.filter(post => post.autorId === conta.id);
      const likedPosts = all.filter(post => likedByMe(post.id));
      const counts = [myPosts.length, likedPosts.length, 0];
      document.querySelectorAll('.content-tabs button').forEach((tab, i) => { tab.querySelector('small').textContent = `(${counts[i]})`; });
      const received = myPosts.reduce((sum, post) => sum + likesOf(post.id), 0);
      const achievements = document.querySelectorAll('.achievement-grid strong');
      [myPosts.length, received, 0].forEach((value, i) => { if (achievements[i]) achievements[i].textContent = String(value); });
      renderContentTab();
    };

    const contentTabs = [...document.querySelectorAll('.content-tabs button')];
    let contentTab = 0;
    const themes = ['theme-pink', 'theme-purple', 'theme-teal'];
    function renderContentTab() {
      contentTabs.forEach((tab, i) => { tab.classList.toggle('selected', i === contentTab); tab.setAttribute('aria-pressed', String(i === contentTab)); });
      const card = document.querySelector('.contents-card');
      card.querySelectorAll('.content-item, .content-tab-empty').forEach(el => el.remove());
      const all = posts();
      const items = contentTab === 0 ? all.filter(post => post.autorId === conta.id) : contentTab === 1 ? all.filter(post => likedByMe(post.id)) : [];
      const anchor = card.querySelector('.link-action');
      items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3).forEach((post, i) => {
        const item = document.createElement('div'); item.className = 'content-item';
        item.innerHTML = `<span class="content-thumb ${themes[i % themes.length]}"></span><div><strong></strong><small></small></div><b><i aria-hidden="true" class="fa-solid fa-heart"></i> ${likesOf(post.id)}</b>`;
        item.querySelector('.content-thumb').textContent = (post.tags || [])[0] || (post.kind !== 'Texto' ? post.kind : 'Post');
        item.querySelector('strong').textContent = post.text.split('\n')[0].slice(0, 60);
        item.querySelector('small').textContent = `Publicado em ${LJ.formatarData(post.createdAt)}`;
        card.insertBefore(item, anchor);
      });
      if (!items.length) {
        const empty = document.createElement('p'); empty.className = 'content-tab-empty';
        empty.textContent = ['Você ainda não publicou na comunidade.', 'Você ainda não curtiu publicações.', 'As avaliações dos usuários sobre seus conteúdos aparecem aqui.'][contentTab];
        card.insertBefore(empty, anchor);
      }
    }
    contentTabs.forEach((tab, i) => tab.addEventListener('click', () => { contentTab = i; renderContentTab(); }));
    document.querySelector('.contents-card .link-action')?.addEventListener('click', event => {
      event.preventDefault();
      const myPosts = posts().filter(post => post.autorId === conta.id);
      showDialog('Meus conteúdos', myPosts.length ? myPosts.map(post => `<p><strong>${escapeHtml(post.text.split('\n')[0].slice(0, 80))}</strong><br>${LJ.formatarData(post.createdAt)} · ${likesOf(post.id)} curtida(s) · ${commentsOf(post.id).length} comentário(s)</p>`).join('') : '<p>Você ainda não publicou na comunidade.</p>');
    });
    document.querySelector('.trending-card')?.addEventListener('click', event => {
      const id = event.target.closest('[data-trend]')?.dataset.trend;
      if (!id) return;
      activeFilter = 'Todos'; renderFeed();
      feed.querySelector(`[data-post-id="${CSS.escape(id)}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const renderAll = () => { renderFeed(); renderSide(); };

    // ------------------------------------------
    // PUBLICAR
    // ------------------------------------------

    const updateAttachment = () => {
      if (attachedUrl || attachedFile) {
        attachmentStatus.hidden = false;
        attachmentStatus.textContent = attachedFile ? `Anexo selecionado: ${attachedFile.name}` : `Link selecionado: ${linkValue}`;
      } else { attachmentStatus.hidden = true; attachmentStatus.textContent = ''; }
      linkInput.hidden = selectedKind !== 'Link';
    };
    postButtons.forEach(button => button.addEventListener('click', () => {
      const kind = button.textContent.trim(); selectedKind = kind;
      postButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      if (kind === 'Imagem' || kind === 'Vídeo') {
        fileInput.accept = kind === 'Imagem' ? 'image/*' : 'video/*'; fileInput.click();
      } else if (kind === 'Link') { linkInput.hidden = false; linkInput.focus(); }
      else { if (attachedUrl) URL.revokeObjectURL(attachedUrl); attachedUrl = ''; attachedFile = null; linkValue = ''; linkInput.value = ''; updateAttachment(); textarea.focus(); }
    }));
    fileInput.addEventListener('change', () => {
      if (attachedUrl) URL.revokeObjectURL(attachedUrl);
      attachedFile = fileInput.files[0] || null; attachedUrl = attachedFile ? URL.createObjectURL(attachedFile) : ''; updateAttachment();
    });
    linkInput.addEventListener('input', () => { linkValue = linkInput.value.trim(); updateAttachment(); });
    document.getElementById('btn-publish-top')?.addEventListener('click', () => { publishCard.scrollIntoView({ behavior: 'smooth', block: 'center' }); textarea.focus({ preventScroll: true }); });

    const publish = () => {
      const text = textarea.value.trim();
      if (!text) { textarea.focus(); textarea.setCustomValidity('Escreva algo antes de publicar.'); textarea.reportValidity(); textarea.addEventListener('input', () => textarea.setCustomValidity(''), { once: true }); return; }
      if (selectedKind === 'Link') {
        linkValue = linkInput.value.trim();
        try { const url = new URL(linkValue); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); linkValue = url.href; }
        catch { linkInput.setCustomValidity('Informe um link válido começando com https://'); linkInput.reportValidity(); linkInput.addEventListener('input', () => linkInput.setCustomValidity(''), { once: true }); return; }
      }
      if ((selectedKind === 'Imagem' || selectedKind === 'Vídeo') && !attachedFile) { showDialog('Selecione um anexo', '<p>Escolha um arquivo antes de publicar ou selecione Texto para publicar sem anexo.</p>'); return; }
      const record = { id: LJ.gerarId('post'), autorId: conta.id, autorNome: currentName(), text, kind: selectedKind, link: selectedKind === 'Link' ? linkValue : '', tags: autoTags(text), createdAt: new Date().toISOString() };
      write(keys.posts, [record, ...read(keys.posts, [])]);
      const mediaUrl = attachedUrl;
      textarea.value = ''; linkInput.value = ''; fileInput.value = ''; attachedUrl = ''; attachedFile = null; linkValue = ''; selectedKind = 'Texto';
      postButtons.forEach(button => button.setAttribute('aria-pressed', String(button.textContent.trim() === 'Texto'))); updateAttachment();
      activeFilter = 'Todos'; renderAll();
      // Imagem e vídeo aparecem nesta visita; não são guardados no navegador.
      if (mediaUrl) {
        const card = feed.querySelector(`[data-post-id="${CSS.escape(record.id)}"] .post-main`);
        card?.insertBefore(Object.assign(document.createElement(record.kind === 'Imagem' ? 'img' : 'video'), record.kind === 'Imagem' ? { className: 'post-media', src: mediaUrl, alt: 'Imagem anexada à publicação' } : { className: 'post-media', src: mediaUrl, controls: true }), card.querySelector('.tag-group'));
      }
    };
    publishButton.addEventListener('click', publish);
    textarea.addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') publish(); });

    // ------------------------------------------
    // INTERAÇÕES NO FEED
    // ------------------------------------------

    const addComment = post => {
      const input = post.querySelector('.comment-input'); const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const all = comments(); (all[post.dataset.postId] ||= []).push({ autorId: conta.id, name: currentName(), text, date: new Date().toISOString() });
      write(keys.comments, all); renderAll();
      feed.querySelector(`[data-post-id="${CSS.escape(post.dataset.postId)}"] .comment-input`)?.focus();
    };
    filters.forEach(button => button.addEventListener('click', () => { activeFilter = button.textContent.trim(); renderFeed(); }));
    feed.addEventListener('keydown', event => {
      if (event.key === 'Enter' && event.target.classList.contains('comment-input')) { event.preventDefault(); addComment(event.target.closest('.post-card')); }
    });
    feed.addEventListener('click', event => {
      const post = event.target.closest('.post-card'); if (!post) return;
      const id = post.dataset.postId;
      if (event.target.closest('.post-like')) {
        const all = likes(); const list = all[id] || [];
        all[id] = list.includes(conta.id) ? list.filter(value => value !== conta.id) : [...list, conta.id];
        write(keys.likes, all); renderAll(); return;
      }
      if (event.target.closest('.post-comment')) { post.querySelector('.comment-input')?.focus(); return; }
      if (event.target.closest('.post-menu')) { openPostMenu(post); return; }
      if (event.target.closest('.comment-submit')) addComment(post);
    });
    function openPostMenu(post) {
      const id = post.dataset.postId; const own = post.dataset.own === 'true'; const saved = mine.saved.includes(id);
      showDialog('Opções da publicação', `<div class="actions" style="justify-content:flex-start"><button type="button" class="action secondary" data-save>${saved ? 'Remover dos salvos' : 'Salvar publicação'}</button>${own ? '<button type="button" class="action secondary" data-delete>Excluir publicação</button>' : '<button type="button" class="action secondary" data-report>Denunciar publicação</button><button type="button" class="action secondary" data-hide>Ocultar para mim</button>'}<button type="button" class="action secondary" data-copy>Copiar link</button></div>`, body => {
        body.querySelector('[data-save]').onclick = () => { mine.saved = saved ? mine.saved.filter(value => value !== id) : [...mine.saved, id]; saveMine(); modal.close(); };
        body.querySelector('[data-hide]')?.addEventListener('click', () => { mine.hidden.push(id); saveMine(); modal.close(); renderAll(); });
        body.querySelector('[data-delete]')?.addEventListener('click', () => {
          showDialog('Excluir publicação', '<p>Quer mesmo excluir esta publicação? Ela não poderá ser recuperada.</p><div class="actions"><button type="button" class="action secondary" data-cancel>Cancelar</button><button type="button" class="action primary" data-confirm>Excluir</button></div>', content => {
            content.querySelector('[data-cancel]').onclick = () => modal.close();
            content.querySelector('[data-confirm]').onclick = () => {
              write(keys.posts, read(keys.posts, []).filter(item => item.id !== id));
              const allComments = comments(); delete allComments[id]; write(keys.comments, allComments);
              const allLikes = likes(); delete allLikes[id]; write(keys.likes, allLikes);
              modal.close(); renderAll();
            };
          });
        });
        body.querySelector('[data-report]')?.addEventListener('click', () => {
          showDialog('Denunciar publicação', '<form><label>Motivo<select name="reason"><option>Conteúdo inadequado</option><option>Spam</option><option>Assédio ou discurso de ódio</option><option>Outro</option></select></label><div class="actions"><button class="action primary" type="submit">Enviar denúncia</button></div></form>', content => content.querySelector('form').addEventListener('submit', event => {
            event.preventDefault();
            const reports = read(keys.reports, []); reports.push({ post: id, by: conta.id, reason: new FormData(event.currentTarget).get('reason'), date: new Date().toISOString() }); write(keys.reports, reports);
            showDialog('Denúncia registrada', '<p>Obrigado por ajudar a manter a comunidade segura. A denúncia foi registrada.</p>');
          }));
        });
        body.querySelector('[data-copy]').onclick = async () => {
          const url = `${location.origin}${location.pathname}#${id}`;
          try { await navigator.clipboard.writeText(url); showDialog('Link copiado', '<p>O link da publicação foi copiado.</p>'); }
          catch { showDialog('Link da publicação', `<label>Copie o endereço<input readonly value="${escapeHtml(url)}"></label>`); }
        };
      });
    }

    // Categorias da lateral filtram o feed pelo texto e pelas tags da publicação.
    document.querySelectorAll('.categories-card .tag').forEach(tag => {
      tag.setAttribute('role', 'button'); tag.tabIndex = 0;
      const filterCategory = () => { activeFilter = `categoria:${tag.textContent.trim()}`; renderFeed(); feed.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
      tag.addEventListener('click', filterCategory);
      tag.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); filterCategory(); } });
    });
    document.querySelector('.categories-card .link-action')?.addEventListener('click', event => { event.preventDefault(); activeFilter = 'Todos'; renderFeed(); });

    renderAll();
  });
})();
