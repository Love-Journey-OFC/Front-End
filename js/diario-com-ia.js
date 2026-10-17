(() => {
  const input = document.getElementById('mensagem-input');
  const sendButton = document.getElementById('btn-submit');
  const messages = document.getElementById('chat-messages');
  const status = document.getElementById('status');
  const maxMessageLength = 2000;
  let sending = false;

  if (!input || !sendButton || !messages || !status) return;

  const readHistory = () => Array.from(messages.querySelectorAll('.message'))
    .map((row) => ({
      role: row.classList.contains('sent') ? 'user' : 'model',
      text: row.querySelector('.bubble p')?.textContent.trim() || ''
    }))
    .filter((item) => item.text)
    .slice(-12);

  const addMessage = (role, text) => {
    const row = document.createElement('div');
    row.className = `message ${role === 'user' ? 'sent' : 'received'}`;

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    const time = document.createElement('time');
    time.dateTime = new Date().toISOString();
    time.textContent = new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
    bubble.append(paragraph, time);

    const avatar = document.createElement('span');
    avatar.className = `avatar mini ${role === 'user' ? 'me' : 'ia'}`;
    avatar.textContent = role === 'user' ? 'Eu' : 'IA';

    if (role === 'user') row.append(bubble, avatar);
    else row.append(avatar, bubble);
    messages.append(row);
    messages.scrollTop = messages.scrollHeight;
  };

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.classList.toggle('status-error', isError);
  };

  const sendMessage = async () => {
    const text = input.value.trim();
    if (!text || sending) {
      if (!text) input.classList.add('input-error');
      return;
    }
    if (text.length > maxMessageLength) {
      setStatus('Sua mensagem pode ter até 2.000 caracteres.', true);
      return;
    }

    input.classList.remove('input-error');
    input.value = '';
    addMessage('user', text);
    sending = true;
    sendButton.disabled = true;
    input.disabled = true;
    setStatus('Estou aqui com você. Vou pensar com carinho...');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: readHistory() })
      });
      const data = await response.json().catch(() => null);
      if (!data) {
        if (response.status === 404) {
          throw new Error('O servidor do chat não está ativo neste endereço. Inicie `node server.mjs` e abra o site em http://127.0.0.1:4173.');
        }
        if (response.status === 405) {
          throw new Error('Este endereço está usando um servidor estático que bloqueia o chat. Inicie `node server.mjs` e abra http://127.0.0.1:4173/diario-com-ia.html.');
        }
        throw new Error(`O servidor do chat retornou uma resposta inválida (HTTP ${response.status}).`);
      }
      if (!response.ok) {
        if (response.status === 405) {
          throw new Error('O servidor recebeu um método não permitido. Abra o site pelo endereço http://127.0.0.1:4173/diario-com-ia.html.');
        }
        throw new Error(data.error || `O servidor do chat respondeu com erro HTTP ${response.status}.`);
      }
      if (!data.reply) throw new Error('A resposta veio vazia. Pode tentar enviar de novo?');
      addMessage('model', data.reply);
      setStatus('');
    } catch (error) {
      const message = error instanceof TypeError
        ? 'Não foi possível conectar ao servidor da IA. Inicie `node server.mjs` e abra http://127.0.0.1:4173.'
        : error.message;
      setStatus(message || 'Não foi possível conectar ao diário com IA.', true);
    } finally {
      sending = false;
      sendButton.disabled = false;
      input.disabled = false;
      input.focus();
    }
  };

  window.sendMessage = sendMessage;
  sendButton.addEventListener('click', sendMessage);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener('input', () => input.classList.remove('input-error'));
})();
