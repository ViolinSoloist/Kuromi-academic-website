/**
 * CORE.JS - Funções Globais da Kuromi
 * Este arquivo contém lógicas que funcionam em todas as páginas.
 */

// --- INICIALIZAÇÃO DE TEMA ---
function aplicarTema() {
    const btnDark = document.getElementById('toggle-dark');
    if (localStorage.getItem('kuromi_tema') === 'dark') {
        document.body.classList.add('dark-mode');
        if (btnDark) btnDark.textContent = "☀️";
    }
    // Adicione isso no final do seu core.js
    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'toggle-dark') {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('kuromi_tema', isDark ? 'dark' : 'light');
            e.target.textContent = isDark ? "☀️" : "🌙";
        }
    });
}

// --- LÓGICA DO AVATAR ---
function inicializarAvatar() {
    const imgAvatar = document.getElementById('avatar-img');
    const avatarSalvo = localStorage.getItem('kuromi_avatar');
    
    if (imgAvatar) {
        imgAvatar.src = avatarSalvo || 'imgs/cool-kuromi.jpg';
        
        // Se houver um input de arquivo, ativa a troca
        const inputAvatar = document.getElementById('input-avatar');
        if (inputAvatar) {
            imgAvatar.parentElement.onclick = () => inputAvatar.click();
            inputAvatar.onchange = (e) => {
                const arquivo = e.target.files[0];
                if (arquivo && arquivo.size < 2 * 1024 * 1024) {
                    const leitor = new FileReader();
                    leitor.onload = (ev) => {
                        const base64 = ev.target.result;
                        localStorage.setItem('kuromi_avatar', base64);
                        imgAvatar.src = base64;
                    };
                    leitor.readAsDataURL(arquivo);
                }
            };
        }
    }
}

// Executa ao carregar qualquer página
document.addEventListener('DOMContentLoaded', () => {
    aplicarTema();
    inicializarAvatar();
});