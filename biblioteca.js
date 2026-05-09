// 1. Variáveis Globais e Base de Dados
let leituras = JSON.parse(localStorage.getItem('kuromi_leituras')) || [];
const disciplinasSalvas = JSON.parse(localStorage.getItem('kuromi_disciplinas')) || [];
let idEdicaoLeitura = null;

const containerLeituras = document.getElementById('container-leituras');
const modalLeitura = document.getElementById('modal-nova-leitura');
const formLeitura = document.getElementById('form-leitura');
const btnNovaLeitura = document.getElementById('btn-nova-leitura');
const btnCancelarLeitura = document.getElementById('btn-cancelar-leitura');
const selectMateria = document.getElementById('select-materia-leitura');

// 2. Preencher Dropdown de Disciplinas (O mesmo padrão do Dashboard)
disciplinasSalvas.forEach(disc => {
    const opcao = document.createElement('option');
    opcao.value = disc.nome;
    opcao.textContent = disc.nome;
    selectMateria.appendChild(opcao);
});
const opcaoOutros = document.createElement('option');
opcaoOutros.value = "Pessoal";
opcaoOutros.textContent = "Pessoal";
selectMateria.appendChild(opcaoOutros);

function salvarLeituras() {
    localStorage.setItem('kuromi_leituras', JSON.stringify(leituras));
}

// 3. Atualizar Widgets Laterais
function atualizarWidgetsLeitura() {
    let totalPaginasLidas = 0;
    let leiturasEmAndamento = [];

    leituras.forEach(livro => {
        totalPaginasLidas += livro.paginasLidas;
        if (livro.paginasLidas > 0 && livro.paginasLidas < livro.totalPaginas) {
            leiturasEmAndamento.push(livro);
        }
    });

    // Atualiza o totalizador
    document.getElementById('display-paginas-lidas').textContent = totalPaginasLidas;

    // Atualiza o Widget de Leitura Atual
    const displayAtual = document.getElementById('display-leitura-atual');
    if (leiturasEmAndamento.length > 0) {
        // Mostra o livro que ela atualizou mais recentemente ou tem maior foco
        const atual = leiturasEmAndamento[0]; 
        const progresso = Math.round((atual.paginasLidas / atual.totalPaginas) * 100);
        displayAtual.innerHTML = `
            <strong>${atual.titulo}</strong><br>
            <span style="font-size: 0.8rem; opacity: 0.8;">Progresso: ${progresso}%</span>
        `;
    } else {
        displayAtual.innerHTML = '<p>Nenhum livro em andamento no momento. 💜</p>';
    }
}

// 4. Renderizar os Cards da Biblioteca
function renderizarLeituras() {
    containerLeituras.innerHTML = '';

    leituras.forEach(livro => {
        const card = document.createElement('div');
        card.classList.add('card-leitura');

        // Cálculo de Progresso
        const porcentagem = Math.min(Math.round((livro.paginasLidas / livro.totalPaginas) * 100), 100);
        
        // Definição de Status
        let statusClasse = 'status-pendente';
        let statusTexto = 'Não Iniciado';
        if (porcentagem > 0 && porcentagem < 100) {
            statusClasse = 'status-lendo';
            statusTexto = 'Lendo...';
        } else if (porcentagem === 100) {
            statusClasse = 'status-concluido';
            statusTexto = 'Concluído!';
        }

        card.innerHTML = `
            <div>
                <div class="leitura-header">
                    <div>
                        <span class="disciplina-badge" style="font-size: 0.75rem; font-weight: bold; opacity: 0.6;">${livro.disciplina}</span>
                        <div class="leitura-titulo">${livro.titulo}</div>
                        ${livro.autor ? `<div class="leitura-autor">${livro.autor}</div>` : ''}
                    </div>
                    <span class="status-badge ${statusClasse}">${statusTexto}</span>
                </div>
                
                <div class="container-progresso">
                    <div class="info-progresso">
                        <span>Progresso</span>
                        <span>${livro.paginasLidas} / ${livro.totalPaginas} pág. (${porcentagem}%)</span>
                    </div>
                    <div class="barra-fundo">
                        <div class="barra-preenchimento" style="width: ${porcentagem}%;"></div>
                    </div>
                </div>
            </div>

            <div class="acoes-leitura">
                <button class="btn-atualizar-pag btn-editar" title="Editar">Editar</button>
                <div style="display: flex; gap: 5px;">
                    <button class="btn-atualizar-pag btn-add-pagina" title="Adicionar +10 Páginas Lidas">+10 pág</button>
                    <button class="btn-atualizar-pag btn-deletar" style="color: #d84b6b; border-color: #ffb3ba;" title="Excluir">×</button>
                </div>
            </div>
        `;

        // Evento: Adicionar 10 páginas rápido
        card.querySelector('.btn-add-pagina').addEventListener('click', () => {
            if (livro.paginasLidas + 10 <= livro.totalPaginas) {
                livro.paginasLidas += 10;
            } else {
                livro.paginasLidas = livro.totalPaginas; // Limita ao máximo
            }
            salvarLeituras();
            renderizarLeituras();
        });

        // Evento: Editar
        card.querySelector('.btn-editar').addEventListener('click', () => {
            idEdicaoLeitura = livro.id;
            document.getElementById('select-materia-leitura').value = livro.disciplina;
            document.getElementById('input-titulo-leitura').value = livro.titulo;
            document.getElementById('input-autor').value = livro.autor || '';
            document.getElementById('input-paginas-total').value = livro.totalPaginas;
            document.getElementById('input-paginas-lidas').value = livro.paginasLidas;
            
            modalLeitura.querySelector('h2').textContent = "Editar Leitura ✍️";
            modalLeitura.classList.remove('oculto');
        });

        // Evento: Deletar
        card.querySelector('.btn-deletar').addEventListener('click', () => {
            if(confirm("Excluir esta leitura da biblioteca?")) {
                leituras = leituras.filter(l => l.id !== livro.id);
                salvarLeituras();
                renderizarLeituras();
            }
        });

        containerLeituras.appendChild(card);
    });

    atualizarWidgetsLeitura();
}

// 5. Eventos do Formulário
btnNovaLeitura.addEventListener('click', () => modalLeitura.classList.remove('oculto'));

btnCancelarLeitura.addEventListener('click', () => {
    modalLeitura.classList.add('oculto');
    formLeitura.reset();
    idEdicaoLeitura = null;
    modalLeitura.querySelector('h2').textContent = "Nova Leitura 📚";
});

formLeitura.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const disciplina = document.getElementById('select-materia-leitura').value;
    const titulo = document.getElementById('input-titulo-leitura').value;
    const autor = document.getElementById('input-autor').value;
    const totalPag = parseInt(document.getElementById('input-paginas-total').value);
    const lidasPag = parseInt(document.getElementById('input-paginas-lidas').value);

    if (lidasPag > totalPag) {
        alert("O número de páginas lidas não pode ser maior que o total do livro!");
        return;
    }

    if (idEdicaoLeitura) {
        const index = leituras.findIndex(l => l.id === idEdicaoLeitura);
        leituras[index] = { ...leituras[index], disciplina, titulo, autor, totalPaginas: totalPag, paginasLidas: lidasPag };
        idEdicaoLeitura = null;
    } else {
        leituras.push({
            id: Date.now(),
            disciplina: disciplina,
            titulo: titulo,
            autor: autor,
            totalPaginas: totalPag,
            paginasLidas: lidasPag
        });
    }

    salvarLeituras();
    renderizarLeituras();
    
    modalLeitura.classList.add('oculto');
    formLeitura.reset();
    modalLeitura.querySelector('h2').textContent = "Nova Leitura 📚";
});

// Inicializar a página
renderizarLeituras();

// ================
// RESET MASTER
// ================
const btnResetMaster = document.getElementById('btn-reset-master');
if (btnResetMaster) {
    btnResetMaster.addEventListener('click', () => {
        if (confirm("🚨 ATENÇÃO! Isso vai apagar TODAS as suas tarefas, matérias, notas e leituras para sempre.\n\nTem certeza?")) {
            // Limpa o banco de dados inteiro do navegador
            localStorage.clear();
            alert("Tudo foi apagado. A Kuromi varreu a casa! O site será recarregado do zero. 🧹✨");
            // Recarrega a página para voltar ao estado de fábrica
            window.location.reload();
        }
    });
}
