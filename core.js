// --- INICIALIZAÇÃO DE TEMA (NOVO TOGGLE) ---
function aplicarTema() {
    const checkboxDark = document.getElementById('toggle-dark-checkbox');
    
    if (checkboxDark) {
        // 1. Sincroniza visualmente: se o script anti-flashbang (do HTML) 
        // já ativou o dark mode, o switch deve aparecer marcado.
        checkboxDark.checked = document.body.classList.contains('dark-mode');

        // 2. Escuta a mudança do interruptor
        checkboxDark.onchange = () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            localStorage.setItem('kuromi_tema', isDark ? 'dark' : 'light');
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
inicializarNomeUsuario();
precarregarImagens(); // Chama o download fantasma das imagens!

// ==========================================
// MÓDULO: NOME DE USUÁRIO EDITÁVEL
// ==========================================
function inicializarNomeUsuario() {
    const spanNome = document.getElementById('nome-usuario');
    
    if (spanNome) {
        // 1. Tenta buscar o nome salvo no cofre (localStorage)
        const nomeSalvo = localStorage.getItem('kuromi_nome');
        
        // 2. Se existir, escreve o nome salvo. Se não, deixa apenas o nome. 
        // Nota: O HTML já começa com "Oie, Kuromi! 💜" como fallback padrão.
        if (nomeSalvo) {
            spanNome.textContent = `Oie, ${nomeSalvo}! 💜`;
        }

        // 3. Adiciona o evento de clique para permitir a edição
        spanNome.addEventListener('click', () => {
            // Abre uma caixinha de pergunta (prompt)
            // Se já tiver nome salvo, ele aparece preenchido. Se não, fica em branco.
            const novoNome = prompt("Qual é o seu nome? 💜", nomeSalvo || "");
            
            // Verifica se a pessoa digitou algo e não clicou em "Cancelar"
            if (novoNome !== null && novoNome.trim() !== "") {
                const nomeLimpo = novoNome.trim(); // Tira espaços em branco extras
                localStorage.setItem('kuromi_nome', nomeLimpo); // Salva no cofre
                spanNome.textContent = `Oie, ${nomeLimpo}! 💜`; // Atualiza na tela na hora
            }
        });

        // Efeito visual fofo ao passar o mouse
        spanNome.addEventListener('mouseenter', () => spanNome.style.opacity = '0.7');
        spanNome.addEventListener('mouseleave', () => spanNome.style.opacity = '1');
    }
}

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