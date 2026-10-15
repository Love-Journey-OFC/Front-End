/**
 * Love Journey - Meus Usuários (interatividade)
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. BUSCA DE USUÁRIOS
    const searchInput = document.getElementById('search');
    const userItems = document.querySelectorAll('.user-item');

    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            const term = event.target.value.toLowerCase();

            userItems.forEach((item) => {
                const matches = item.innerText.toLowerCase().includes(term);
                item.classList.toggle('is-hidden', !matches);
            });
        });
    }

    // 2. ABAS DE STATUS (Todos / Em atendimento / Solicitações)
    const statusTabs = document.querySelectorAll('.status-tabs .tab-btn');

    statusTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            statusTabs.forEach((t) => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
});