// --- INICIALIZAÇÃO DE TEMA ---
function aplicarTema() {
    const btnDark = document.getElementById('toggle-dark');
    
    if (btnDark) {
        // Apenas acerta o ícone do botão com base no que o script HTML já fez
        btnDark.textContent = document.body.classList.contains('dark-mode') ? "☀️" : "🌙";

        btnDark.onclick = () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('kuromi_tema', isDark ? 'dark' : 'light');
            btnDark.textContent = isDark ? "☀️" : "🌙";
        };
    }
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

// ==========================================
// MÓDULO: COFRE DA KUROMI E RESET (GLOBAL)
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
                    alert("Erro ao ler o arquivo. Verifique se é um backup válido da Kuromi.");
                }
            };
            leitor.readAsText(arquivo);
        });
    }

    if (btnResetMaster) {
        btnResetMaster.addEventListener('click', () => {
            if (confirm("🚨 ATENÇÃO! Isso vai apagar TODAS as suas tarefas, matérias, notas e leituras para sempre.\n\nTem certeza?")) {
                localStorage.clear();
                alert("Tudo foi apagado. A Kuromi varreu a casa! O site será recarregado do zero. 🧹✨");
                window.location.reload();
            }
        });
    }
}

// ==========================================
// MÓDULO: RASTREADOR DE HUMOR (GLOBAL)
// ==========================================
function inicializarHumor() {
    let humorAtual = localStorage.getItem('kuromi_humor') || 'feliz';
    const botoesHumor = document.querySelectorAll('.btn-humor');

    function renderizarHumor() {
        botoesHumor.forEach(btn => {
            btn.classList.remove('ativo');
            if(btn.dataset.humor === humorAtual) btn.classList.add('ativo');
        });
        
        // Se a função de atualizar a Kuromi interativa existir (apenas no index.html), nós a chamamos
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
// Como este arquivo é chamado no final do <body>, não precisamos esperar o DOMContentLoaded
aplicarTema();
inicializarAvatar();
inicializarCofre(); 
inicializarHumor(); 
precarregarImagens(); // Chama o download fantasma das imagens!

// ==========================================
// MÓDULO: PRÉ-CARREGAMENTO DE IMAGENS
// ==========================================
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
        'imgs/night1.jpg', // Garante que o fundo escuro carregue rápido
        'imgs/hellokitty-read.png'
    ];
    
    // O navegador baixa a imagem na memória (cache) em segundo plano
    imagens.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}