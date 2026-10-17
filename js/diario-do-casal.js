(() => {
  const dialog = document.getElementById('new-entry-dialog');
  const form = document.getElementById('new-entry-form');
  const entriesGrid = document.querySelector('.entries-grid');
  const filterButtons = document.querySelectorAll('.filter-group .tag-button');
  const photoInput = document.getElementById('entry-photo');
  const photoPreview = document.getElementById('entry-photo-preview');
  const formMessage = document.getElementById('entry-form-message');
  const storageKey = 'love-journey-diary-entries';
  const categoryDetails = {
    'Reflexões': { icon: 'fa-comment-dots', theme: 'theme-purple' },
    'Sonhos': { icon: 'fa-moon', theme: 'theme-teal' },
    'Desabafos': { icon: 'fa-comment', theme: 'theme-yellow' },
    'Gratidão': { icon: 'fa-hands-praying', theme: 'theme-pink' }
  };

  if (!dialog || !form || !entriesGrid) return;

  const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const getEntryCategory = (entry) => {
    const title = entry.querySelector('.item-title')?.textContent || '';
    const normalizedTitle = normalize(title);
    return Object.keys(categoryDetails).find((category) => normalizedTitle.includes(normalize(category).slice(0, 5))) || '';
  };

  const applyFilter = (category) => {
    entriesGrid.querySelectorAll('.entry-item').forEach((entry) => {
      entry.hidden = category !== 'Todos' && normalize(getEntryCategory(entry)) !== normalize(category);
    });
    filterButtons.forEach((button) => {
      button.classList.toggle('active', normalize(button.textContent.trim()) === normalize(category));
    });
  };

  const buildEntry = ({ category, content, date, photo }) => {
    const details = categoryDetails[category] || categoryDetails['Reflexões'];
    const article = document.createElement('article');
    article.className = `entry-item ${details.theme}`;
    article.dataset.userEntry = 'true';

    const top = document.createElement('div');
    top.className = 'entry-top';
    const heading = document.createElement('h4');
    heading.className = 'item-title';
    const icon = document.createElement('i');
    icon.className = `fa-solid ${details.icon}`;
    icon.setAttribute('aria-hidden', 'true');
    heading.append(icon, document.createTextNode(` ${category}`));
    const heart = document.createElement('span');
    heart.className = 'item-heart';
    heart.innerHTML = '<i class="fa-solid fa-heart" aria-hidden="true"></i>';
    top.append(heading, heart);

    const text = document.createElement('p');
    text.className = 'item-text';
    text.textContent = content;
    const children = [top, text];
    if (photo) {
      const image = document.createElement('img');
      image.src = photo;
      image.alt = `Foto do registro: ${category}`;
      children.push(image);
    }
    const dateLabel = document.createElement('span');
    dateLabel.className = 'item-date';
    dateLabel.textContent = date;
    article.append(...children, dateLabel);
    return article;
  };

  const compressPhoto = async (file) => {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob) throw new Error('Não foi possível processar esta foto.');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler esta foto.'));
      reader.readAsDataURL(blob);
    });
  };

  const loadSavedEntries = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      saved.forEach((entry) => entriesGrid.prepend(buildEntry(entry)));
    } catch (error) {
      console.warn('Não foi possível carregar os registros salvos.', error);
    }
  };

  document.getElementById('btn-new-entry')?.addEventListener('click', () => {
    dialog.showModal();
    document.getElementById('entry-category').focus();
  });

  dialog.querySelectorAll('[data-close-entry]').forEach((button) => {
    button.addEventListener('click', () => dialog.close());
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    form.reset();
    photoPreview.hidden = true;
    photoPreview.removeAttribute('src');
    formMessage.textContent = '';
  });

  photoInput.addEventListener('change', () => {
    formMessage.textContent = '';
    const file = photoInput.files[0];
    if (!file) {
      photoPreview.hidden = true;
      photoPreview.removeAttribute('src');
      return;
    }
    if (!file.type.startsWith('image/')) {
      photoInput.value = '';
      formMessage.textContent = 'Selecione um arquivo de imagem.';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      photoInput.value = '';
      photoPreview.hidden = true;
      formMessage.textContent = 'A foto deve ter no máximo 10 MB.';
      return;
    }
    photoPreview.src = URL.createObjectURL(file);
    photoPreview.hidden = false;
  });

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.textContent.trim()));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formMessage.textContent = '';
    const data = new FormData(form);
    const entry = {
      category: data.get('category'),
      content: data.get('content').trim(),
      date: new Intl.DateTimeFormat('pt-BR').format(new Date())
    };
    if (!entry.content) return;

    const photo = photoInput.files[0];
    try {
      if (photo) entry.photo = await compressPhoto(photo);
    } catch (error) {
      formMessage.textContent = error.message;
      return;
    }

    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    saved.unshift(entry);
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch (error) {
      console.warn('Não foi possível salvar o registro neste dispositivo.', error);
    }
    entriesGrid.prepend(buildEntry(entry));
    applyFilter('Todos');
    dialog.close();
  });

  loadSavedEntries();
})();
