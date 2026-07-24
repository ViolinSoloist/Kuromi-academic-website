// ---------- INICIALIZAÇÃO DE TEMA (sincroniza com toggle) ------------------
function aplicarTema() {
    const checkboxDark = document.getElementById('toggle-dark-checkbox');
    
    if (checkboxDark) {
        // se for tema escuro, botão toggle aparece como tal
        checkboxDark.checked = document.body.classList.contains('dark-mode');

        // LISTEN: TOGGLE
        checkboxDark.onchange = () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('kuromi_tema', isDark ? 'dark' : 'light');
        };
    }
}

// ---------- AVATAR -------------------
function inicializarAvatar() {
    const imgAvatar = document.getElementById('avatar-img');
    const avatarSalvo = localStorage.getItem('kuromi_avatar');
    
    if (imgAvatar) {
        imgAvatar.src = avatarSalvo || 'imgs/cool-kuromi.jpg';
        
        // if (input de arquivo) { ativa a troca }
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

// ==========================================
// COFRE E RESET (GLOBAL)
// ==========================================
function inicializarCofre() {
    const btnExportar = document.getElementById('btn-exportar');
    const btnImportarTrigger = document.getElementById('btn-importar-trigger');
    const inputImportar = document.getElementById('input-importar');
    const btnResetMaster = document.getElementById('btn-reset-master');

    if (btnExportar) {
        btnExportar.addEventListener('click', () => {
            const todosDados = {};
            for (let i = 0; i < localStorage.length; i++) {
                const chave = localStorage.key(i);
                todosDados[chave] = localStorage.getItem(chave);
            }
            const dataSnapshot = JSON.stringify(todosDados, null, 2);
            const blob = new Blob([dataSnapshot], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `backup_kuromi_${new Date().toLocaleDateString()}.json`;
            link.click();
            URL.revokeObjectURL(url);
            alert("Backup concluído! Guarde seu arquivo JSON com carinho. 💜");
        });
    }

    if (btnImportarTrigger && inputImportar) {
        btnImportarTrigger.addEventListener('click', () => inputImportar.click());
        inputImportar.addEventListener('change', (event) => {
            const arquivo = event.target.files[0];
            if (!arquivo) return;
            const leitor = new FileReader();
            leitor.onload = (e) => {
                try {
                    const dadosImportados = JSON.parse(e.target.result);
                    if (confirm("Isso irá substituir todos os dados atuais por este backup. Continuar?")) {
                        localStorage.clear();
                        for (const chave in dadosImportados) {
                            localStorage.setItem(chave, dadosImportados[chave]);
                        }
                        alert("Dados restaurados com sucesso! A página irá recarregar.");
                        window.location.reload();
                    }
                } catch (erro) {
                    alert("Erro ao ler o arquivo. Verifique se é um backup válido da Kuromi (arquivo JSON).");
                }
            };
            leitor.readAsText(arquivo);
        });
    }

    if (btnResetMaster) {
        btnResetMaster.addEventListener('click', () => {
            if (confirm("Isso vai apagar TODAS as suas tarefas, matérias, notas e leituras para sempre.\n\nTem certeza?")) {
                localStorage.clear();
                alert("Tudo foi apagado. A Kuromi varreu a casa! O site será recarregado do zero. 🧹✨");
                window.location.reload();
            }
        });
    }
}

// =============================
// RASTREADOR DE HUMOR (GLOBAL)
// =============================
function inicializarHumor() {
    let humorAtual = localStorage.getItem('kuromi_humor') || 'feliz';
    const botoesHumor = document.querySelectorAll('.btn-humor');

    function renderizarHumor() {
        botoesHumor.forEach(btn => {
            btn.classList.remove('ativo');
            if(btn.dataset.humor === humorAtual) btn.classList.add('ativo');
        });
        
        // if (função de atualizar a Kuromi interativa) exists (apenas no index.html) then nós a chamamos
        if (typeof atualizarKuromi === 'function') {
            atualizarKuromi();
        }
    }

    botoesHumor.forEach(btn => {
        btn.addEventListener('click', (e) => {
            humorAtual = e.currentTarget.dataset.humor;
            localStorage.setItem('kuromi_humor', humorAtual);
            renderizarHumor();
        });
    });

    renderizarHumor();
}

// --- INICIALIZAÇÃO IMEDIATA ---
// este arquivo é chamado no final do <body>, portanto não é necessário esperar o DOMContentLoaded
aplicarTema();
inicializarAvatar();
inicializarCofre(); 
inicializarHumor(); 
inicializarNomeUsuario();
precarregarImagens(); // carrega imagens sem precisar estar num local com elas

// ================================
// NOME DE USUÁRIO EDITÁVEL
// ================================
function inicializarNomeUsuario() {
    const spanNome = document.getElementById('nome-usuario');
    
    if (spanNome) {
        // try: busca o nome se existe
        const nomeSalvo = localStorage.getItem('kuromi_nome');
        
        // se existe, escreve o nome salvo, se não, vai pro fallback
        if (nomeSalvo) {
            spanNome.innerHTML = `Oie, ${nomeSalvo}! <i class="fa-solid fa-cat" style="color: var(--roxo-kuromi-escuro)"></i>`;
        }

        // adiciona event que possibilita trocar de nome
        spanNome.addEventListener('click', () => {
            // se já tem nome, aparece, se não fica vazio (no quadrante)
            const novoNome = prompt("Qual é o seu nome? 💜", nomeSalvo || "");
            
            // verificação de entrada válida
            if (novoNome !== null && novoNome.trim() !== "") {
                const nomeLimpo = novoNome.trim(); // TRIM
                localStorage.setItem('kuromi_nome', nomeLimpo); // salva no STORAGE
                spanNome.innerHTML = `Oie, ${nomeLimpo}! <i class="fa-solid fa-cat" style="color: var(--roxo-kuromi-escuro)"></i>`; // update
            }
        });

        // efeito visual
        spanNome.addEventListener('mouseenter', () => spanNome.style.opacity = '0.7');
        spanNome.addEventListener('mouseleave', () => spanNome.style.opacity = '1');
    }
}

// ===================================
// PRÉ-CARREGAMENTO DE IMAGENS (evita FOUC)
// ===================================
function precarregarImagens() {
    const imagens = [
        'imgs/kuromi_bleh.png',
        'imgs/kuromi_sleep.png',
        'imgs/kuromi_skate.png',
        'imgs/moosic.png',
        'imgs/hellokittyknife.png',
        'imgs/Kuromi_yell.png',
        'imgs/Kuromi_walking.png',
        'imgs/sus.png',
        'imgs/night1.jpg', // fundo escuro carrega rápido
        'imgs/hellokitty-read.png'
    ];
    
    // navegador baixa a imagem no cache (segundo plano)
    imagens.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}