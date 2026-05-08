// 1. Inicialização e Variáveis Globais (Áudio no topo para evitar erros de leitura)
const somGrab = new Audio('sounds/grab.mp3');
const somSnap = new Audio('sounds/snap.mp3');

const menuSelectMateria = document.getElementById('select-materia');
const disciplinasSalvas = JSON.parse(localStorage.getItem('kuromi_disciplinas')) || [];

// Popula o Dropdown do modal
disciplinasSalvas.forEach(disc => {
    const opcao = document.createElement('option');
    opcao.value = disc.nome;
    opcao.textContent = disc.nome;
    menuSelectMateria.appendChild(opcao);
});

// Adicionando opção 'Outros' permanentemente no menu
const opcaoOutros = document.createElement('option');
opcaoOutros.value = "Pessoal";
opcaoOutros.textContent = "Pessoal";
menuSelectMateria.appendChild(opcaoOutros);

// Banco de Dados simulado
let tarefas = JSON.parse(localStorage.getItem('kuromi_tarefas')) || [];

function salvarTarefas() {
    localStorage.setItem('kuromi_tarefas', JSON.stringify(tarefas));
}

// Mapeamento do DOM
const containerTarefas = document.getElementById('container-tarefas');
const btnAbrirModal = document.getElementById('btn-abrir-modal');
const btnCancelarModal = document.getElementById('btn-cancelar-modal');
const btnOrdenar = document.getElementById('btn-ordenar');
const modalOverlay = document.getElementById('modal-nova-tarefa');
const formTarefa = document.getElementById('form-tarefa');
const textoVisao = document.getElementById('texto-visao');
const botoesView = document.querySelectorAll('.btn-view');

let visualizacaoAtual = 'dia'; 
let instanciasSortableTarefas = []; 
let instanciaSortableLembrete = null; 

let humorAtual = localStorage.getItem('kuromi_humor') || 'feliz';
const botoesHumor = document.querySelectorAll('.btn-humor');

// 2. Funções de Data
function ehDestaSemana(dataString) {
    const hoje = new Date();
    const dataTarefa = new Date(dataString + 'T00:00:00');
    
    const diaSemana = hoje.getDay();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diaSemana);
    inicioSemana.setHours(0, 0, 0, 0);
    
    const fimSemana = new Date(hoje);
    fimSemana.setDate(hoje.getDate() + (6 - diaSemana));
    fimSemana.setHours(23, 59, 59, 999);
    
    return dataTarefa >= inicioSemana && dataTarefa <= fimSemana;
}

function formatarDataComDia(dataString) {
    const data = new Date(dataString + 'T00:00:00');
    const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaAbreviado = dias[data.getDay()];
    const dataFormatada = dataString.split('-').reverse().slice(0, 2).join('/');
    return `${diaAbreviado}, ${dataFormatada}`;
}

// 3. Lógica de Alternância de Visão
botoesView.forEach(botao => {
    botao.addEventListener('click', (e) => {
        botoesView.forEach(b => b.classList.remove('ativo'));
        e.target.classList.add('ativo');
        
        visualizacaoAtual = e.target.dataset.view;
        
        if (visualizacaoAtual === 'dia') textoVisao.textContent = "do Dia";
        else if (visualizacaoAtual === 'semana') textoVisao.textContent = "da Semana";
        else textoVisao.textContent = "Geral (Todas)";

        renderizarTarefas();
    });
});

function agruparPorMes(listaTarefas) {
    const grupos = {};
    listaTarefas.forEach(t => {
        const data = new Date(t.data + 'T00:00:00');
        let mesAno = data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        mesAno = mesAno.charAt(0).toUpperCase() + mesAno.slice(1);
        
        if (!grupos[mesAno]) grupos[mesAno] = [];
        grupos[mesAno].push(t);
    });
    return grupos;
}

// 4. Efeitos Visuais
function criarPurpurina(x, y) {
    const cores = ['#D5C6E0', '#FAD4D8', '#FFFFFF', '#4A3B52'];
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.classList.add('particula');
        
        const cor = cores[Math.floor(Math.random() * cores.length)];
        p.style.backgroundColor = cor;
        p.style.width = p.style.height = Math.random() * 8 + 'px';
        p.style.left = x + 'px';
        p.style.top = y + 'px';
        
        p.style.setProperty('--x', (Math.random() - 0.5) * 100 + 'px');
        p.style.setProperty('--y', (Math.random() - 0.5) * 100 + 'px');
        
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 800);
    }
}

// 5. Motor de Renderização
function renderizarTarefas(animarOrdem = false) {
    containerTarefas.innerHTML = '';
    
    // Destrói APENAS os motores das tarefas
    instanciasSortableTarefas.forEach(s => s.destroy());
    instanciasSortableTarefas = [];

    let tarefasParaExibir = [];
    
    if (visualizacaoAtual === 'semana') {
        tarefasParaExibir = tarefas.filter(t => ehDestaSemana(t.data));
    } else if (visualizacaoAtual === 'todas') {
        tarefasParaExibir = [...tarefas].sort((a, b) => new Date(a.data) - new Date(b.data));
    } else if (visualizacaoAtual === 'dia') {
        const dataDeHoje = new Date();
        const dataLocal = new Date(dataDeHoje.getTime() - (dataDeHoje.getTimezoneOffset() * 60000));
        const dataString = dataLocal.toISOString().split('T')[0];
        
        tarefasParaExibir = tarefas.filter(t => t.data === dataString);

        // --- INÍCIO DA LÓGICA EXCLUSIVA DO DIA ---
        const headerDia = document.createElement('div');
        headerDia.classList.add('header-dia');
        
        const opcoesData = { weekday: 'long', day: 'numeric', month: 'long' };
        let dataFormatada = dataDeHoje.toLocaleDateString('pt-BR', opcoesData);

        headerDia.innerHTML = `
            <h2>${dataFormatada}</h2>
            <div class="container-interativo">
                <img src="imgs/kuromi_bleh.png" id="kuromi-interativa-img" class="imagem-header-dia" style="margin: 0; animation: flutuar 3s ease-in-out infinite; width: 100px;" alt="Kuromi">
                <div class="balao-fala">
                    <p id="kuromi-interativa-fala"></p>
                    <p id="fato-curioso" class="fato-curioso-texto" style="font-size: 0.75rem; margin: 0; opacity: 0.7; border-top: 1px dashed var(--roxo-kuromi-suave); padding-top: 8px; margin-top: 8px;">Buscando um fato curioso na história... ⏳</p>
                </div>
            </div>
        `;
        containerTarefas.appendChild(headerDia);

        const mes = String(dataDeHoje.getMonth() + 1).padStart(2, '0');
        const dia = String(dataDeHoje.getDate()).padStart(2, '0');
        
        fetch(`https://pt.wikipedia.org/api/rest_v1/feed/onthisday/events/${mes}/${dia}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.events && data.events.length > 0) {
                    const evento = data.events[Math.floor(Math.random() * data.events.length)];
                    document.getElementById('fato-curioso').innerHTML = `<strong>Neste dia (${evento.year}):</strong> ${evento.text}`;
                } else {
                    document.getElementById('fato-curioso').textContent = "Hoje é um dia perfeito para escrever a sua própria história! 💜";
                }
            })
            .catch(() => {
                document.getElementById('fato-curioso').textContent = "Hoje é um dia maravilhoso para focar em você! 💜";
            });
            if (tarefasParaExibir.length === 0) {
                const semTarefas = document.createElement('p');
                semTarefas.style = "text-align: center; opacity: 0.6; font-weight: bold; margin-top: 40px;";
                semTarefas.textContent = "Nenhuma tarefa pra hoje! A Kuromi diz pra você ir descansar 💜";
                containerTarefas.appendChild(semTarefas);
            } else {
                const gridUnico = document.createElement('div');
                gridUnico.classList.add('grid-dia-expandido'); 
                preencherGrid(gridUnico, tarefasParaExibir, animarOrdem, true); 
                containerTarefas.appendChild(gridUnico);
                
                // Adiciona o motor isolado ao array correto
                instanciasSortableTarefas.push(ativarSortable(gridUnico));
            }
            
        atualizarKuromi();
        atualizarGraficoProgresso();
        return; 
    }

    if (visualizacaoAtual === 'todas') {
        const gruposMes = agruparPorMes(tarefasParaExibir);
        for (const [mes, tarefasMes] of Object.entries(gruposMes)) {
            const divisor = document.createElement('div');
            divisor.classList.add('divisor-mes');
            divisor.innerHTML = `<span>${mes}</span>`;
            containerTarefas.appendChild(divisor);

            const gridMes = document.createElement('div');
            gridMes.classList.add('grid-tarefas-isolado');
            preencherGrid(gridMes, tarefasMes, animarOrdem, false);
            containerTarefas.appendChild(gridMes);

            instanciasSortableTarefas.push(ativarSortable(gridMes));
        }
    } else if (visualizacaoAtual === 'semana') {
        if (tarefasParaExibir.length === 0) {
            containerTarefas.innerHTML = '<p style="text-align: center; opacity: 0.6; font-weight: bold; margin-top: 40px;">Semana livre! 💜</p>';
            atualizarGraficoProgresso();
            return;
        }

        const gridUnico = document.createElement('div');
        gridUnico.classList.add('grid-tarefas-isolado');
        preencherGrid(gridUnico, tarefasParaExibir, animarOrdem, false);
        containerTarefas.appendChild(gridUnico);
        
        instanciasSortableTarefas.push(ativarSortable(gridUnico));
    }

    atualizarGraficoProgresso();
}

function preencherGrid(elementoGrid, lista, animarOrdem, isDiaView = false) {
    lista.forEach((tarefa, index) => {
        const card = document.createElement('div');
        card.classList.add('card-tarefa');

        if (tarefa.disciplina === "Pessoal") card.classList.add('pessoal');
        if (isDiaView) card.classList.add('expandido');
        if (tarefa.concluida) card.classList.add('concluida');
        
        card.dataset.id = tarefa.id;

        if (animarOrdem) {
            card.classList.add('card-animado');
            card.style.animationDelay = `${index * 0.08}s`; 
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="disciplina-badge" style="font-size: 0.85rem; font-weight: bold; opacity: 0.7;">${tarefa.disciplina || 'Pessoal'}</span>
                <span style="font-size: 0.75rem; background: var(--fundo-principal); padding: 3px 8px; border-radius: 8px; border: 1px solid var(--roxo-kuromi-suave);">
                    ${formatarDataComDia(tarefa.data)}
                </span>
            </div>
            <div style="display: flex; align-items: center;">
                <input type="checkbox" class="checkbox-concluir" ${tarefa.concluida ? 'checked' : ''}>
                <span class="texto-detalhe" style="font-size: 1.1rem; flex-grow: 1;">${tarefa.detalhe}</span>
            </div>
        `;

        const checkbox = card.querySelector('.checkbox-concluir');
        checkbox.addEventListener('change', () => {
            const tarefaGlobal = tarefas.find(t => t.id === tarefa.id);
            if(tarefaGlobal) tarefaGlobal.concluida = checkbox.checked;
            salvarTarefas(); 
            renderizarTarefas(); 
        });

        elementoGrid.appendChild(card);
    });
}

// ---------------------------------------------
// SISTEMA DE LEMBRETES (Independente)
// ---------------------------------------------
let lembretes = JSON.parse(localStorage.getItem('kuromi_lembretes')) || [];

const containerLembretes = document.getElementById('lista-lembretes-container');
const modalLembrete = document.getElementById('modal-novo-lembrete');
const btnNovoLembrete = document.getElementById('btn-novo-lembrete');
const btnCancelarLembrete = document.getElementById('btn-cancelar-lembrete');
const formLembrete = document.getElementById('form-lembrete');

function renderizarLembretes() {
    containerLembretes.innerHTML = '';

    // Se já existia um motor de arrasto, limpe-o antes de recriar
    if (instanciaSortableLembrete) {
        instanciaSortableLembrete.destroy();
        instanciaSortableLembrete = null;
    }

    if (lembretes.length === 0) {
        containerLembretes.innerHTML = `
            <p style="text-align: center; font-size: 0.9rem;">Já bebeu água hoje?</p>
            <img src="imgs/sus.png" class="img-lembrete-vazio">
        `;
    } else {
        const gridLembretes = document.createElement('div');
        gridLembretes.id = "grid-lembretes-sortable";

        lembretes.forEach(lemb => {
            const div = document.createElement('div');
            div.classList.add('item-lembrete');
            div.dataset.id = lemb.id;
            div.textContent = lemb.texto;
            gridLembretes.appendChild(div);
        });

        containerLembretes.appendChild(gridLembretes);
        
        // Regista isoladamente o motor de física dos lembretes
        instanciaSortableLembrete = ativarSortable(gridLembretes, true); 
    }
}

// 6. Motor Sortable Blindado
function ativarSortable(elementoContainer, ehLembrete = false) {
    const sortable = new Sortable(elementoContainer, {
        animation: 250,
        easing: "cubic-bezier(0.25, 1, 0.5, 1)", 
        forceFallback: true, 
        fallbackOnBody: true, 
        fallbackClass: "sortable-drag",
        ghostClass: "sortable-ghost",
        
        filter: ".checkbox-concluir",
        preventOnFilter: false,

        onChoose: () => {
            if (somGrab) somGrab.play().catch(() => {});
            document.body.classList.add('arrastando-ativo');
        },
        
        onUnchoose: () => document.body.classList.remove('arrastando-ativo'),
        
        onEnd: function (evt) {
            document.body.classList.remove('arrastando-ativo');
            
            const x = evt.originalEvent.clientX;
            const y = evt.originalEvent.clientY;
            const soltouNoArquivo = document.elementFromPoint(x, y)?.closest('#menu-arquivo');
            
            const idTarget = Number(evt.item.dataset.id);

            if (soltouNoArquivo) {
                if (somSnap) somSnap.play().catch(() => {});
                criarPurpurina(x, y);
                
                if (ehLembrete) {
                    lembretes = lembretes.filter(l => l.id !== idTarget);
                    localStorage.setItem('kuromi_lembretes', JSON.stringify(lembretes));
                    setTimeout(() => renderizarLembretes(), 10);
                } else {
                    tarefas = tarefas.filter(t => t.id !== idTarget);
                    setTimeout(() => renderizarTarefas(), 10);
                }
                return;
            }
            
            if (ehLembrete) {
                const item = lembretes.splice(evt.oldIndex, 1)[0];
                lembretes.splice(evt.newIndex, 0, item);
                localStorage.setItem('kuromi_lembretes', JSON.stringify(lembretes));
            } else {
                if (somSnap) somSnap.play().catch(() => {});
                criarPurpurina(x, y);

                const novaOrdemVisual = Array.from(document.querySelectorAll('.card-tarefa')).map(card => Number(card.dataset.id));
                const tarefasOcultas = tarefas.filter(t => !novaOrdemVisual.includes(t.id));
                const tarefasReorganizadas = novaOrdemVisual.map(id => tarefas.find(t => t.id === id));
                
                tarefas = [...tarefasReorganizadas, ...tarefasOcultas];
                salvarTarefas();
            }
        }
    });
    
    return sortable; // NOVO: Devolve o motor para a função que o chamou poder guardá-lo
}

// 5. Eventos do Modal de Lembrete
btnNovoLembrete.addEventListener('click', () => modalLembrete.classList.remove('oculto'));
btnCancelarLembrete.addEventListener('click', () => modalLembrete.classList.add('oculto'));

formLembrete.addEventListener('submit', (e) => {
    e.preventDefault();
    const texto = document.getElementById('input-texto-lembrete').value;
    
    lembretes.push({ id: Date.now(), texto: texto });
    localStorage.setItem('kuromi_lembretes', JSON.stringify(lembretes));
    
    renderizarLembretes();
    modalLembrete.classList.add('oculto');
    formLembrete.reset();
});

// Chame na inicialização
renderizarLembretes();

// 7. Eventos de Botões e Modais
btnOrdenar.addEventListener('click', () => {
    if (somSnap) somSnap.play().catch(e => console.log('Áudio bloqueado'));
    tarefas.sort((a, b) => new Date(a.data) - new Date(b.data));
    renderizarTarefas(true);
});

function abrirModal() { modalOverlay.classList.remove('oculto'); }
function fecharModal() { modalOverlay.classList.add('oculto'); formTarefa.reset(); }

btnAbrirModal.addEventListener('click', abrirModal);
btnCancelarModal.addEventListener('click', fecharModal);

// 2. Atualize a função de Submissão do Formulário
formTarefa.addEventListener('submit', function(evento) {
    evento.preventDefault(); 
    const selectMateria = document.getElementById('select-materia');
    const materia = selectMateria ? selectMateria.value : "Pessoal";
    const titulo = document.getElementById('input-titulo').value;
    const data = document.getElementById('input-data').value;

    tarefas.push({
        id: Date.now(),
        disciplina: materia,
        detalhe: titulo,
        data: data,
        concluida: false
    });

    salvarTarefas(); // SALVA NO BANCO
    renderizarTarefas();
    fecharModal();
});

// Inicia a aplicação
renderizarTarefas();

// ==========================================
// MÓDULO POMODORO
// ==========================================
const TEMPO_PADRAO = 25 * 60; 
let tempoRestante = TEMPO_PADRAO;
let intervaloTimer = null;

const displayPomodoro = document.getElementById('display-pomodoro');
const btnPlay = document.getElementById('btn-pomodoro-play');
const btnPause = document.getElementById('btn-pomodoro-pause');
const btnReset = document.getElementById('btn-pomodoro-reset');
const widgetPomodoro = document.querySelector('.widget.pomodoro');

function formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;
}

function atualizarDisplayPomodoro() {
    displayPomodoro.textContent = formatarTempo(tempoRestante);
}

btnPlay.addEventListener('click', () => {
    if (!intervaloTimer) {
        btnPlay.classList.add('oculto');
        btnPause.classList.remove('oculto');
        widgetPomodoro.classList.add('pomodoro-rodando');
        
        intervaloTimer = setInterval(() => {
            tempoRestante--;
            atualizarDisplayPomodoro();
            
            if (tempoRestante <= 0) {
                clearInterval(intervaloTimer);
                intervaloTimer = null;
                
                btnPause.classList.add('oculto');
                btnPlay.classList.remove('oculto');
                widgetPomodoro.classList.remove('pomodoro-rodando');
                
                if (somSnap) somSnap.play().catch(e => console.log('Áudio bloqueado'));
                alert("Tempo esgotado! Excelente foco. Vá beber uma água com a Kuromi! 💜");
                
                tempoRestante = TEMPO_PADRAO;
                atualizarDisplayPomodoro();
            }
        }, 1000);
    }
});

btnPause.addEventListener('click', () => {
    clearInterval(intervaloTimer);
    intervaloTimer = null;
    
    btnPause.classList.add('oculto');
    btnPlay.classList.remove('oculto');
    widgetPomodoro.classList.remove('pomodoro-rodando');
});

btnReset.addEventListener('click', () => {
    clearInterval(intervaloTimer);
    intervaloTimer = null;
    tempoRestante = TEMPO_PADRAO;
    
    btnPause.classList.add('oculto');
    btnPlay.classList.remove('oculto');
    widgetPomodoro.classList.remove('pomodoro-rodando');
    
    atualizarDisplayPomodoro();
});

atualizarDisplayPomodoro();

// ==========================================
// MÓDULO DE PROGRESSO (GRÁFICO)
// ==========================================
function atualizarGraficoProgresso() {
    const grafico = document.getElementById('grafico-progresso');
    const textoPorcentagem = document.getElementById('porcentagem-texto');
    const legenda = document.getElementById('legenda-progresso');

    if (!grafico || tarefas.length === 0) {
        if(legenda) legenda.textContent = "Nenhuma tarefa cadastrada 💜";
        return;
    }

    const total = tarefas.length;
    const concluidas = tarefas.filter(t => t.concluida).length;
    const porcentagem = Math.round((concluidas / total) * 100);

    grafico.style.setProperty('--p', porcentagem);
    textoPorcentagem.textContent = `${porcentagem}%`;
    legenda.textContent = `${concluidas} de ${total} tarefas concluídas`;
}

// ==========================================
// AÇÃO DE CLIQUE: ARQUIVO CONCLUÍDO (Limpeza em Massa)
// ==========================================
const btnMenuArquivo = document.getElementById('menu-arquivo');

btnMenuArquivo.addEventListener('click', () => {
    // Verifica se existe alguma tarefa com o status concluida: true
    const tarefasConcluidas = tarefas.filter(t => t.concluida);

    if (tarefasConcluidas.length > 0) {
        // Pede uma confirmação fofa
        if (confirm(`A Kuromi encontrou ${tarefasConcluidas.length} tarefa(s) concluída(s). Deseja limpar todas elas do seu painel? 🧹💜`)) {
            
            // Mantém no array apenas as tarefas que NÃO estão concluídas
            tarefas = tarefas.filter(t => !t.concluida);
            salvarTarefas();
            
            // Efeitos sonoros e visuais no centro da tela
            if (somSnap) somSnap.play().catch(() => {});
            criarPurpurina(window.innerWidth / 2, window.innerHeight / 2);
            
            // Redesenha a tela e atualiza o gráfico
            renderizarTarefas();
            atualizarGraficoProgresso();
        }
    } else {
        // Feedback visual se ela clicar sem ter nada concluído
        alert("Sua mesa já está limpinha! Nenhuma tarefa concluída para arquivar no momento. ✨");
    }
});

// ==========================================
// MÓDULO: COFRE DA KUROMI (BACKUP)
// ==========================================

const btnExportar = document.getElementById('btn-exportar');
const btnImportarTrigger = document.getElementById('btn-importar-trigger');
const inputImportar = document.getElementById('input-importar');

// 1. FUNÇÃO EXPORTAR: Pega TUDO do localStorage e cria um arquivo JSON
btnExportar.addEventListener('click', () => {
    const todosDados = {};
    // Percorre todas as chaves salvas no navegador
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        todosDados[chave] = localStorage.getItem(chave);
    }

    const dataSnapshot = JSON.stringify(todosDados, null, 2);
    const blob = new Blob([dataSnapshot], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // Cria um link temporário para download
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_kuromi_${new Date().toLocaleDateString()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    alert("Backup concluído! Guarde seu arquivo JSON com carinho. 💜");
});

// 2. FUNÇÃO IMPORTAR: Lê o JSON e sobrescreve o localStorage
btnImportarTrigger.addEventListener('click', () => inputImportar.click());

inputImportar.addEventListener('change', (event) => {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    const leitor = new FileReader();
    leitor.onload = (e) => {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            
            if (confirm("Isso irá substituir todos os dados atuais por este backup. Continuar?")) {
                localStorage.clear(); // Limpa o atual
                for (const chave in dadosImportados) {
                    localStorage.setItem(chave, dadosImportados[chave]);
                }
                alert("Dados restaurados com sucesso! A página irá recarregar.");
                window.location.reload(); // Recarrega para aplicar as mudanças
            }
        } catch (erro) {
            alert("Erro ao ler o arquivo. Verifique se é um backup válido da Kuromi.");
        }
    };
    leitor.readAsText(arquivo);
});

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
// MÓDULO: MODO FOCO E RÁDIO KUROMI
// ==========================================
const btnZen = document.getElementById('btn-zen');
const containerRadio = document.getElementById('container-radio');
const iframeRadio = document.getElementById('radio-kuromi');

// O ID 'jfKfPfyJRdk' é a live 24/7 de Lofi Hip Hop
// O '?autoplay=1' força o vídeo a começar sozinho quando o link é carregado
const linkRadioAoVivo = "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&controls=1&disablekb=1&fs=0&modestbranding=1";

if (btnZen) {
    btnZen.addEventListener('click', () => {
        // 1. Alterna a classe que limpa o ecrã (Modo Zen)
        document.body.classList.toggle('zen-mode');
        const isZen = document.body.classList.contains('zen-mode');
        
        if (isZen) {
            // 2. Entrando no Modo Foco
            btnZen.innerHTML = "🔙 Sair do Foco";
            btnZen.style.backgroundColor = "var(--rosa-melody)";
            btnZen.style.color = "var(--roxo-kuromi-escuro)";
            
            // Exibe o player e injeta o link para começar a música automaticamente
            if (containerRadio) {
                containerRadio.classList.remove('oculto');
                iframeRadio.src = linkRadioAoVivo;
            }
        } else {
            // 3. Saindo do Modo Foco
            btnZen.innerHTML = "🧘 Modo Foco";
            btnZen.style.backgroundColor = ""; // Volta ao padrão do CSS
            btnZen.style.color = "";
            
            // Esconde o player e "destrói" o link para a música parar imediatamente
            if (containerRadio) {
                containerRadio.classList.add('oculto');
                iframeRadio.src = "";
            }
        }
    });
}

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

// ==========================================
// MÓDULO: RASTREADOR DE HUMOR E KUROMI INTERATIVA
// ==========================================

function atualizarKuromi() {
    const imgKuromi = document.getElementById('kuromi-interativa-img');
    const falaKuromi = document.getElementById('kuromi-interativa-fala');
    
    if (!imgKuromi || !falaKuromi) return; // Só tenta atualizar se a visão do 'Dia' estiver aberta
    
    const hora = new Date().getHours();
    let imagem = 'imgs/kuromi_bleh.png'; 
    let mensagem = '';

    // Lógica Dinâmica baseada no Humor e na Hora
    if (humorAtual === 'estressada') {
        imagem = 'imgs/Kuromi-rightPeek.png'; 
        mensagem = "Respira fundo, Lara! Que tal ligar o Modo Foco e colocar a nossa Rádio Lofi tocar? 🎧";
    } else if (humorAtual === 'cansada') {
        imagem = 'imgs/Kuromi_walking.png'; 
        mensagem = "Se está exausta, faça apenas o essencial hoje. Descansar também é ser produtiva! 💤";
    } else if (humorAtual === 'foco') {
        imagem = 'imgs/kuromi_skate.png';
        mensagem = "Olhar de predadora! Vamos gabaritar essas tarefas e dominar o mundo. 🎯";
    } else {
        // Se estiver "Feliz" (ou por padrão), reage à hora do dia
        if (hora >= 5 && hora < 12) {
            mensagem = "Bom dia, flor do dia! O café já está pronto? Vamos conquistar o mundo hoje! ☕";
        } else if (hora >= 12 && hora < 18) {
            mensagem = "Boa tarde! Continue firme, você está indo muito bem! 🚀";
        } else if (hora >= 18 && hora < 23) {
            mensagem = "Boa noite! Quase na hora de descansar essa mente brilhante. 🌙";
        } else {
            mensagem = "Lara, vai dormir! A faculdade não vale as suas olheiras. Desliga isso agora! 🦉";
            imagem = 'imgs/Kuromi-rightPeek.png'; // Kuromi dando bronca
        }
    }

    imgKuromi.src = imagem;
    falaKuromi.textContent = mensagem;
}

function renderizarHumor() {
    botoesHumor.forEach(btn => {
        btn.classList.remove('ativo');
        if(btn.dataset.humor === humorAtual) btn.classList.add('ativo');
    });
    atualizarKuromi(); // Atualiza a fala da Kuromi na hora
}

botoesHumor.forEach(btn => {
    btn.addEventListener('click', (e) => {
        humorAtual = e.currentTarget.dataset.humor;
        localStorage.setItem('kuromi_humor', humorAtual);
        renderizarHumor();
    });
});

// Inicializa
renderizarHumor();

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