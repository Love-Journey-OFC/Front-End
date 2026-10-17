const form = document.getElementById('api-form');
const apiKeyInput = document.getElementById('api-key');
const modelInput = document.getElementById('model');
const promptInput = document.getElementById('prompt');
const submitButton = document.getElementById('submit-button');
const result = document.getElementById('result');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  submitButton.disabled = true;
  result.textContent = 'Chamando a API...';

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKeyInput.value.trim(),
      },
      body: JSON.stringify({
        model: modelInput.value.trim(),
        input: promptInput.value.trim(),
        store: false,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      const apiError = data.error?.message || `Erro HTTP ${response.status}`;

      if (/limit:\s*0 input tokens per minute on Free Tier/i.test(apiError)) {
        throw new Error(
          `${apiError} Este modelo não tem cota gratuita para o seu projeto. ` +
          'Tente gemini-3.8-flash ou confira os limites disponíveis em ' +
          'https://aistudio.google.com/rate-limit. Para usar este modelo, ' +
          'verifique se ele exige um projeto com faturamento ativado.'
        );
      }

      throw new Error(apiError);
    }

    if (!data.output_text) {
      throw new Error('A API respondeu, mas não retornou texto.');
    }

    result.textContent = data.output_text;
  } catch (error) {
    result.textContent = `Falha na chamada: ${error.message}`;
  } finally {
    submitButton.disabled = false;
  }
});
