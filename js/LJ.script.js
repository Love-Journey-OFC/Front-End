/**
 * Love Journey - Interatividade JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SELEÇÃO DE EMOÇÃO HOJE
    const emotionButtons = document.querySelectorAll('.emotion-item');
    let selectedEmotion = null;

    emotionButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'selected' de todos os botões
            emotionButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Adiciona ao botão clicado
            button.classList.add('selected');
            selectedEmotion = button.getAttribute('data-emotion');
        });
    });

    // 2. REGISTRAR EMOÇÃO SELECIONADA
    const btnSaveEmotion = document.getElementById('btn-save-emotion');
    const btnTopRegister = document.getElementById('btn-top-register');

    function handleRegisterEmotion() {
        if (!selectedEmotion) {
            alert('Por favor, escolha uma emoção antes de registrar!');
            return;
        }

        alert(`Emoção "${selectedEmotion}" registrada com sucesso!`);
        
        // Limpa a seleção após salvar
        emotionButtons.forEach(btn => btn.classList.remove('selected'));
        selectedEmotion = null;
    }

    if (btnSaveEmotion) btnSaveEmotion.addEventListener('click', handleRegisterEmotion);
    if (btnTopRegister) btnTopRegister.addEventListener('click', handleRegisterEmotion);

    // 3. CARROSSEL SIMPLES DE HISTÓRICO
    const carousel = document.getElementById('history-carousel');
    const btnPrev = document.getElementById('carousel-prev');
    const btnNext = document.getElementById('carousel-next');

    let currentScroll = 0;
    const scrollAmount = 160;

    if (btnNext && carousel) {
        btnNext.addEventListener('click', () => {
            currentScroll += scrollAmount;
            if (currentScroll > carousel.scrollWidth - carousel.clientWidth) {
                currentScroll = carousel.scrollWidth - carousel.clientWidth;
            }
            carousel.style.transform = `translateX(-${currentScroll}px)`;
        });
    }

    if (btnPrev && carousel) {
        btnPrev.addEventListener('click', () => {
            currentScroll -= scrollAmount;
            if (currentScroll < 0) {
                currentScroll = 0;
            }
            carousel.style.transform = `translateX(-${currentScroll}px)`;
        });
    }

    // 4. BOTÃO VER TODAS (HISTÓRICO)
    const btnViewAll = document.getElementById('btn-view-all');
    if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
            alert('Acessando o histórico completo de emoções...');
        });
    }
});