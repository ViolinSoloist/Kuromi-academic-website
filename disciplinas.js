let disciplinas = JSON.parse(localStorage.getItem('kuromi_disciplinas')) || [];
let idEdicaoAtual = null; 
let idDisciplinaParaNota = null; // guarda matéria cuja nota pertence a

const gridDisciplinas = document.querySelector('.grid-disciplinas');

// coisas do modal disciplina
const modalDisciplina = document.getElementById('modal-nova-disciplina');
const btnNovaDisciplina = document.getElementById('btn-nova-disciplina');
const btnCancelarDisciplina = document.getElementById('btn-cancelar-disciplina');
const formDisciplina = document.getElementById('form-disciplina');

// coisas do modal nota
const modalNota = document.getElementById('modal-nova-nota');
const btnCancelarNota = document.getElementById('btn-cancelar-nota');
const formNota = document.getElementById('form-nota');

function salvarDisciplinas() {
    localStorage.setItem('kuromi_disciplinas', JSON.stringify(disciplinas));
}

// LÓGICA MATEMÁTICA E NOTA PONDERADA
function calcularMediaPonderada(notas) {
    if (!notas || notas.length === 0) return null;
    
    const somaPesos = notas.reduce((acc, n) => acc + n.peso, 0);
    const somaNotas = notas.reduce((acc, n) => acc + (n.valor * n.peso), 0);
    
    return somaPesos > 0 ? (somaNotas / somaPesos).toFixed(1) : null;
}

// LÓGICA CÁLCULO NOTA GLOBAL
function atualizarCRA() {
    const displayCra = document.getElementById('display-cra');
    if (!displayCra) return;

    let somaMedias = 0;
    let totalMateriasComNota = 0;

    // para todas as disciplinas salvas...
    disciplinas.forEach(disc => {
        const mediaMateria = calcularMediaPonderada(disc.listaNotas);
        
        // se a matéria tem pelo menos uma nota registrada...
        if (mediaMateria !== null) {
            somaMedias += parseFloat(mediaMateria);
            totalMateriasComNota++;
        }
    });

    // CRA ou nothing (se não existir nota)
    if (totalMateriasComNota > 0) {
        const cra = (somaMedias / totalMateriasComNota).toFixed(1);
        displayCra.textContent = cra;
    } else {
        displayCra.textContent = '--';
    }
}

// CALCULAR AVISOS DE REPROVAÇÃO OU FALTA
function atualizarRisco() {
    const displayRisco = document.getElementById('display-risco');
    if (!displayRisco) return;

    let alertas = [];

    disciplinas.forEach(disc => {
        const media = calcularMediaPonderada(disc.listaNotas);
        
        // Faltas
        if (disc.faltasCometidas >= disc.limiteFaltas) {
            alertas.push(`<span style="color: #d84b6b; font-weight: bold;">⚠️ Limite de faltas em ${disc.nome}!</span>`);
        } else if (disc.faltasCometidas === disc.limiteFaltas - 1) {
            alertas.push(`⚠️ 1 falta para o limite em ${disc.nome}`);
        }

        // Notas (se já tiver alguma nota)
        if (media !== null && parseFloat(media) < parseFloat(disc.meta)) {
            alertas.push(`<span style="color: #d84b6b; font-weight: bold;">📉 Média baixa em ${disc.nome} (${media})</span>`);
        }
    });

    // UPDATE widget
    if (alertas.length > 0) {
        displayRisco.innerHTML = alertas.map(a => `<div>${a}</div>`).join('');
    } else {
        displayRisco.innerHTML = '<p>Tudo seguro por enquanto! 💜</p>';
    }
}

function renderizarDisciplinas() {
    gridDisciplinas.innerHTML = '';

    // BE PRETTY IF DISCIPLINAS IS EMPTY
    if (disciplinas.length === 0) {
        gridDisciplinas.innerHTML = `
            <div class="estado-vazio">
                <img src="imgs/kuromi_bleh.png" alt="Sem disciplinas">
                <p>Nenhuma disciplina por aqui! 📚<br>Adicione uma nova no botão "+" ali em cima.</p>
            </div>
        `;
        atualizarCRA();
        atualizarRisco();
        return; // interrompe para evitar renderizar itens inexistentes
    }
    // -----------------------------------

    disciplinas.forEach(disc => {
        const media = calcularMediaPonderada(disc.listaNotas);
        const card = document.createElement('div');
        card.classList.add('card-disciplina', 'caixa-com-adesivo');
        
        let htmlFaltas = '';
        for (let i = 0; i < disc.limiteFaltas; i++) {
            htmlFaltas += (i < disc.faltasCometidas) ? '<div class="falta-marcada"></div>' : '<div class="falta-vazia"></div>';
        }

        // html de provas já realizadas (notas)
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
                    <button class="botao-secundario-pequeno btn-deletar" style="border-color: #ffb3ba;"><i class="fa-solid fa-trash-can" style="color: #ffb3ba;"></i></button>
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

        // ABRIR MODAL: adicionar nota
        card.querySelector('.btn-abrir-modal-nota').addEventListener('click', () => {
            idDisciplinaParaNota = disc.id;
            modalNota.classList.remove('oculto');
        });

        // EDITAR (abre o modal preenchido)
        card.querySelector('.btn-editar').addEventListener('click', () => {
            idEdicaoAtual = disc.id;
            document.getElementById('input-nome-materia').value = disc.nome;
            document.getElementById('input-limite-faltas').value = disc.limiteFaltas;
            document.getElementById('input-meta-nota').value = disc.meta;
            
            // puxa faltas cometidas para poder ser editável
            document.getElementById('input-faltas-cometidas').value = disc.faltasCometidas;
            
            modalDisciplina.querySelector('h2').textContent = "Editar Disciplina";
            modalDisciplina.classList.remove('oculto');
        });

        card.querySelectorAll('.btn-remover-nota').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const notaId = Number(e.target.dataset.notaId);
                
                // filtra notas para remover a selecionada
                disc.listaNotas = disc.listaNotas.filter(n => n.id !== notaId);
                
                salvarDisciplinas();
                renderizarDisciplinas(); // atualizar média e CRA
            });
        });

        // ------------------- EVENTOS ---------------------
        // deletar
        card.querySelector('.btn-deletar').addEventListener('click', () => {
            if(confirm("Deseja mesmo excluir esta disciplina?")) {
                disciplinas = disciplinas.filter(d => d.id !== disc.id);
                salvarDisciplinas();
                renderizarDisciplinas();
            }
        });

        // add. falta
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

// salvar formulário da disciplina
formDisciplina.addEventListener('submit', (e) => {
    e.preventDefault();
    const nome = document.getElementById('input-nome-materia').value;
    const limite = parseInt(document.getElementById('input-limite-faltas').value);
    const faltas = parseInt(document.getElementById('input-faltas-cometidas').value); 
    const meta = parseFloat(document.getElementById('input-meta-nota').value).toFixed(1);

    if (faltas > limite) {
        alert("Ops! O número de faltas cometidas não pode ser maior que o limite da matéria.");
        return;
    }

    if (idEdicaoAtual) {
        const index = disciplinas.findIndex(d => d.id === idEdicaoAtual);
        disciplinas[index].nome = nome;
        disciplinas[index].limiteFaltas = limite;
        disciplinas[index].faltasCometidas = faltas; // update: faltas
        disciplinas[index].meta = meta;
        idEdicaoAtual = null;
    } else {
        disciplinas.push({
            id: Date.now(),
            nome: nome,
            limiteFaltas: limite,
            faltasCometidas: faltas, // salva valor inicial (default = 0)
            meta: meta,
            listaNotas: []
        });
    }

    salvarDisciplinas();
    renderizarDisciplinas();
    fecharModalDisciplina();
});

// salvar formulário de nota
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
    document.getElementById('input-faltas-cometidas').value = "0"; // reseta visualmente para 0
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

// ------------------- SEARCH (disciplinas)
const inputBusca = document.getElementById('input-busca');
if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.card-disciplina');
        
        cards.forEach(card => {
            // pega nome da disciplina dentro da tag <h2>
            const titulo = card.querySelector('h2').textContent.toLowerCase();
            
            // IF título inclui termo pesquisado, mostra (display block), else esconde (display none)
            if (titulo.includes(termo)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}