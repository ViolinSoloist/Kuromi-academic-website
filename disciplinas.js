let disciplinas = JSON.parse(localStorage.getItem('kuromi_disciplinas')) || [];
let idEdicaoAtual = null; 
let idDisciplinaParaNota = null; // Guarda a qual matéria a nota pertence

const gridDisciplinas = document.querySelector('.grid-disciplinas');

// Elementos Modal Disciplina
const modalDisciplina = document.getElementById('modal-nova-disciplina');
const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
const btnCancelarDisciplina = document.getElementById('btn-cancelar-disciplina');
const formDisciplina = document.getElementById('form-disciplina');

// Elementos Modal Nota
const modalNota = document.getElementById('modal-nova-nota');
const btnCancelarNota = document.getElementById('btn-cancelar-nota');
const formNota = document.getElementById('form-nota');

function salvarDisciplinas() {
    localStorage.setItem('kuromi_disciplinas', JSON.stringify(disciplinas));
}

// Lógica Matemática da Média Ponderada
function calcularMediaPonderada(notas) {
    if (!notas || notas.length === 0) return null;
    
    const somaPesos = notas.reduce((acc, n) => acc + n.peso, 0);
    const somaNotas = notas.reduce((acc, n) => acc + (n.valor * n.peso), 0);
    
    return somaPesos > 0 ? (somaNotas / somaPesos).toFixed(1) : null;
}

// Função para calcular e atualizar o CRA (Média Global)
function atualizarCRA() {
    const displayCra = document.getElementById('display-cra');
    if (!displayCra) return;

    let somaMedias = 0;
    let totalMateriasComNota = 0;

    // Varre todas as disciplinas do banco
    disciplinas.forEach(disc => {
        const mediaMateria = calcularMediaPonderada(disc.listaNotas);
        
        // Só contabiliza no CRA se a matéria já tiver pelo menos uma nota registrada
        if (mediaMateria !== null) {
            somaMedias += parseFloat(mediaMateria);
            totalMateriasComNota++;
        }
    });

    // Calcula e exibe o CRA, ou mostra '--' se não houver notas no semestre
    if (totalMateriasComNota > 0) {
        const cra = (somaMedias / totalMateriasComNota).toFixed(1);
        displayCra.textContent = cra;
    } else {
        displayCra.textContent = '--';
    }
}

// Função para calcular alertas de Risco de Reprovação
function atualizarRisco() {
    const displayRisco = document.getElementById('display-risco');
    if (!displayRisco) return;

    let alertas = [];

    disciplinas.forEach(disc => {
        const media = calcularMediaPonderada(disc.listaNotas);
        
        // 1. Análise de Faltas
        if (disc.faltasCometidas >= disc.limiteFaltas) {
            alertas.push(`<span style="color: #d84b6b; font-weight: bold;">⚠️ Limite de faltas em ${disc.nome}!</span>`);
        } else if (disc.faltasCometidas === disc.limiteFaltas - 1) {
            alertas.push(`⚠️ 1 falta para o limite em ${disc.nome}`);
        }

        // 2. Análise de Notas (Só alerta se ela já tiver inserido alguma nota)
        if (media !== null && parseFloat(media) < parseFloat(disc.meta)) {
            alertas.push(`<span style="color: #d84b6b; font-weight: bold;">📉 Média baixa em ${disc.nome} (${media})</span>`);
        }
    });

    // Atualiza o Widget
    if (alertas.length > 0) {
        displayRisco.innerHTML = alertas.map(a => `<div>${a}</div>`).join('');
    } else {
        displayRisco.innerHTML = '<p>Tudo seguro por enquanto! 💜</p>';
    }
}

function renderizarDisciplinas() {
    gridDisciplinas.innerHTML = '';

    disciplinas.forEach(disc => {
        const media = calcularMediaPonderada(disc.listaNotas);
        const card = document.createElement('div');
        card.classList.add('card-disciplina', 'caixa-com-adesivo');
        
        let htmlFaltas = '';
        for (let i = 0; i < disc.limiteFaltas; i++) {
            htmlFaltas += (i < disc.faltasCometidas) ? '<div class="falta-marcada"></div>' : '<div class="falta-vazia"></div>';
        }

        // Constrói o HTML visual da lista de provas já feitas
        let htmlListaNotas = '';
        if (disc.listaNotas && disc.listaNotas.length > 0) {
            htmlListaNotas = `<div class="lista-notas">` + disc.listaNotas.map(n => `
                <div class="item-nota">
                    <div class="titulo-peso">
                        <strong>${n.titulo}</strong>
                        <span class="peso-badge">Peso: ${n.peso}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="valor-destaque">${n.valor.toFixed(1)}</span>
                        <button class="btn-remover-nota" data-nota-id="${n.id}">×</button>
                    </div>
                </div>
            `).join('') + `</div>`;
        }

        card.innerHTML = `
            <div class="disciplina-header">
                <h2>${disc.nome}</h2>
                <div style="display: flex; gap: 8px;">
                    <button class="botao-secundario-pequeno btn-editar">Editar</button>
                    <button class="botao-secundario-pequeno btn-deletar" style="border-color: #ffb3ba;">Excluir</button>
                </div>
            </div>
            
            <div class="disciplina-corpo">
                <div class="coluna-esquerda">
                    <div class="bloco-info">
                        <div class="info-titulo">
                            <span>Faltas (${disc.faltasCometidas}/${disc.limiteFaltas})</span>
                            <button class="btn-adicionar-falta" title="Adicionar Falta">+</button>
                        </div>
                        <div class="trilha-faltas">${htmlFaltas}</div>
                    </div>

                    <div class="bloco-info">
                        <div class="info-titulo">
                            <span>Média Atual</span>
                            <button class="btn-abrir-modal-nota" title="Registrar Nova Nota" style="background: var(--roxo-kuromi-suave); border:none; border-radius:50%; width:24px; height:24px; cursor: url('imgs/kuromi-pointer.png') 0 0, pointer; display:flex; align-items:center; justify-content:center; font-weight:bold;">+</button>
                        </div>
                        <div class="display-nota">
                            <span class="nota-valor">${media || '--'}</span>
                            <span class="nota-meta">Meta: ${disc.meta}</span>
                        </div>
                    </div>
                </div>

                <div class="coluna-direita">
                    <div class="info-titulo" style="margin-bottom: 5px;">
                        <span>Avaliações</span>
                        <span style="font-size: 0.75rem; opacity: 0.6; font-weight: normal;">
                            ${(disc.listaNotas || []).length} registro(s)
                        </span>
                    </div>
                    ${htmlListaNotas || '<div style="opacity: 0.5; font-size: 0.85rem; text-align: center; margin-top: 20px;">Nenhuma nota registrada.</div>'}
                </div>
            </div>
        `;

        // Abrir Modal de Adicionar Nota
        card.querySelector('.btn-abrir-modal-nota').addEventListener('click', () => {
            idDisciplinaParaNota = disc.id;
            modalNota.classList.remove('oculto');
        });

        // Evento de Editar (Abre o modal preenchido)
        card.querySelector('.btn-editar').addEventListener('click', () => {
            idEdicaoAtual = disc.id;
            document.getElementById('input-nome-materia').value = disc.nome;
            document.getElementById('input-limite-faltas').value = disc.limiteFaltas;
            document.getElementById('input-meta-nota').value = disc.meta;
            
            // NOVO: Puxa as faltas cometidas para o campo de edição
            document.getElementById('input-faltas-cometidas').value = disc.faltasCometidas;
            
            modalDisciplina.querySelector('h2').textContent = "Editar Disciplina";
            modalDisciplina.classList.remove('oculto');
        });

        card.querySelectorAll('.btn-remover-nota').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const notaId = Number(e.target.dataset.notaId);
                
                // Filtra a lista de notas da disciplina para remover a selecionada
                disc.listaNotas = disc.listaNotas.filter(n => n.id !== notaId);
                
                salvarDisciplinas();
                renderizarDisciplinas(); // Redesenha para atualizar média e CRA
            });
        });

        // Evento de Deletar
        card.querySelector('.btn-deletar').addEventListener('click', () => {
            if(confirm("Deseja mesmo excluir esta disciplina?")) {
                disciplinas = disciplinas.filter(d => d.id !== disc.id);
                salvarDisciplinas();
                renderizarDisciplinas();
            }
        });

        // Evento de Adicionar Falta
        card.querySelector('.btn-adicionar-falta').addEventListener('click', () => {
            if (disc.faltasCometidas < disc.limiteFaltas) {
                disc.faltasCometidas++;
                salvarDisciplinas();
                renderizarDisciplinas();
            }
        });

        gridDisciplinas.appendChild(card);
    });
    atualizarCRA();
    atualizarRisco();
}

// Lógica de Salvar o Formulário da Disciplina
// Lógica de Salvar o Formulário da Disciplina
formDisciplina.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('input-nome-materia').value;
    const limite = parseInt(document.getElementById('input-limite-faltas').value);
    const faltas = parseInt(document.getElementById('input-faltas-cometidas').value); // Captura as faltas
    const meta = parseFloat(document.getElementById('input-meta-nota').value).toFixed(1);

    // Trava de Segurança Matemática
    if (faltas > limite) {
        alert("Ops! O número de faltas cometidas não pode ser maior que o limite da matéria.");
        return; // Interrompe a função aqui e não salva
    }

    if (idEdicaoAtual) {
        const index = disciplinas.findIndex(d => d.id === idEdicaoAtual);
        disciplinas[index].nome = nome;
        disciplinas[index].limiteFaltas = limite;
        disciplinas[index].faltasCometidas = faltas; // Atualiza as faltas
        disciplinas[index].meta = meta;
        idEdicaoAtual = null;
    } else {
        disciplinas.push({
            id: Date.now(),
            nome: nome,
            limiteFaltas: limite,
            faltasCometidas: faltas, // Salva o valor inicial (geralmente 0)
            meta: meta,
            listaNotas: []
        });
    }

    salvarDisciplinas();
    renderizarDisciplinas();
    fecharModalDisciplina();
});

// Lógica de Salvar o Formulário de Nota
formNota.addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = document.getElementById('input-titulo-nota').value;
    const valor = parseFloat(document.getElementById('input-valor-nota').value);
    const peso = parseFloat(document.getElementById('input-peso-nota').value);

    const index = disciplinas.findIndex(d => d.id === idDisciplinaParaNota);
    if (index !== -1) {
        if (!disciplinas[index].listaNotas) disciplinas[index].listaNotas = [];
        
        disciplinas[index].listaNotas.push({
            id: Date.now(),
            titulo: titulo,
            valor: valor,
            peso: peso
        });
        
        salvarDisciplinas();
        renderizarDisciplinas();
    }
    
    fecharModalNota();
});

function fecharModalDisciplina() {
    modalDisciplina.classList.add('oculto');
    modalDisciplina.querySelector('h2').textContent = "Nova Disciplina 📚";
    formDisciplina.reset();
    document.getElementById('input-faltas-cometidas').value = "0"; // Reseta visualmente para 0
    idEdicaoAtual = null;
}

function fecharModalNota() {
    modalNota.classList.add('oculto');
    formNota.reset();
    idDisciplinaParaNota = null;
}

btnNovaDisciplina.addEventListener('click', () => modalDisciplina.classList.remove('oculto'));
btnCancelarDisciplina.addEventListener('click', fecharModalDisciplina);
btnCancelarNota.addEventListener('click', fecharModalNota);

renderizarDisciplinas();

const btnDark = document.getElementById('toggle-dark');
// Verifica se já estava no dark mode antes
if (localStorage.getItem('kuromi_tema') === 'dark') {
    document.body.classList.add('dark-mode');
    btnDark.textContent = "☀️";
}

btnDark.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('kuromi_tema', isDark ? 'dark' : 'light');
    btnDark.textContent = isDark ? "☀️" : "🌙";
});

// ==========================================
// MÓDULO: FOTO DE PERFIL (AVATAR)
// ==========================================
const imgAvatar = document.getElementById('avatar-img');
const inputAvatar = document.getElementById('input-avatar');

if (imgAvatar && inputAvatar) {
    // 1. Carrega a imagem salva ou a padrão da Kuromi
    const avatarSalvo = localStorage.getItem('kuromi_avatar');
    if (avatarSalvo) {
        imgAvatar.src = avatarSalvo;
    } else {
        imgAvatar.src = 'imgs/cool-kuromi.jpg'; // A imagem padrão se não houver nenhuma
    }

    // 2. Clicar no avatar abre a janela para escolher um arquivo
    imgAvatar.parentElement.addEventListener('click', () => {
        inputAvatar.click();
    });

    // 3. Quando escolher um arquivo, converte para Base64 e salva
    inputAvatar.addEventListener('change', (e) => {
        const arquivo = e.target.files[0];
        
        if (arquivo) {
            // Trava de segurança: O localStorage tem um limite de espaço (~5MB). 
            // Bloqueamos fotos gigantes para não corromper o arquivo de backup.
            if (arquivo.size > 2 * 1024 * 1024) { // 2 Megabytes
                alert("Essa foto é muito pesada! Escolha uma imagem com menos de 2MB. 💜");
                return;
            }

            const leitor = new FileReader();
            leitor.onload = (eventoBase64) => {
                const base64String = eventoBase64.target.result;
                
                // Atualiza a imagem na tela
                imgAvatar.src = base64String;
                
                // Salva no "Cofre" do navegador
                localStorage.setItem('kuromi_avatar', base64String);
                
                // Dispara purpurina de comemoração
                criarPurpurina(window.innerWidth / 2, window.innerHeight / 2);
            };
            
            // Inicia a leitura do arquivo como uma URL de Dados (Base64)
            leitor.readAsDataURL(arquivo);
        }
    });
}