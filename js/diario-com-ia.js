// ATENÇÃO: não deixe a chave da API escrita aqui quando publicar o site.
// Qualquer pessoa consegue ver o JavaScript do navegador e usar a sua chave.
const apikey = "";

async function sendMessage() {
    const message = document.getElementById('mensagem-input');

    if (!message.value.trim()) {
        message.classList.add('input-error');
        return;
    }

    message.classList.remove('input-error');

    const status = document.getElementById('status');
    const btnSubmit = document.getElementById('btn-submit');

    status.textContent = 'Carregando...';
    btnSubmit.disabled = true;
    message.disabled = true;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apikey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: message.value
                                }
                            ]
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `Erro HTTP: ${response.status}`);
        }

        const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!resposta) {
            throw new Error('A API não retornou uma resposta.');
        }

        status.textContent = resposta;

    } catch (error) {
        console.error('Erro detalhado:', error);
        status.textContent = `Ocorreu um erro: ${error.message}`;
    } finally {
        btnSubmit.disabled = false;
        message.disabled = false;
    }
}