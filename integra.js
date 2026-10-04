/* ============================================================
   AVALIACURSOS - SISTEMA COMPLETO + FIREBASE
   ============================================================ */

const firebaseConfig = {
    apiKey: "AIzaSyDPmzG_83XS91cic1s69mfe3qMEfa0sRXA",
    authDomain: "egepi-avalia-cursos.firebaseapp.com",
    projectId: "egepi-avalia-cursos",
    storageBucket: "egepi-avalia-cursos.firebasestorage.app",
    messagingSenderId: "428364538232",
    appId: "1:428364538232:web:f1f3e4a5c58d67e708288d",
    measurementId: "G-1SHS39MYP6"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const docRef = db.collection("sistema").doc("dados_gerais");

let banco = { cursos: [], ministrantes: [], gerencias: [], avaliacoes: [], comentarios: [] };
let ministrantesDoCurso = []; let ministrantesCadastrarAvaliacao = []; let ministrantesEditarCurso = [];
let meuGraficoEvolucao = null; let meuGraficoBarrasVisaoGeral = null; let meuGraficoEvolucaoGeralMin = null;
let meuGraficoGerenciasLadoALado = null; let mesFiltroCursos = ""; let mesFiltroVisaoGeral = "";

function carregarBanco() {
    docRef.onSnapshot((doc) => {
        if (doc.exists) {
            banco = doc.data();
            if (!banco.cursos) banco.cursos = [];
            if (!banco.ministrantes) banco.ministrantes = [];
            if (!banco.gerencias) banco.gerencias = [];
            if (!banco.avaliacoes) banco.avaliacoes = [];
            if (!banco.comentarios) banco.comentarios = [];
            atualizarSistema();
        } else {
            salvarBanco();
        }
    });
}

function salvarBanco() {
    docRef.set(banco).catch((error) => {
        console.error("Erro ao salvar no Firebase: ", error);
        alert("Erro de conexão. Verifique a internet.");
    });
}

function novoId() { return Date.now().toString() + Math.random().toString(16).substring(2); }

function abrirModal(nome) { document.getElementById(nome)?.classList.add("active"); }
function fecharModal(nome) { document.getElementById(nome)?.classList.remove("active"); }

/* MODAIS E SELECTS */
function atualizarSelectGerencias() {
    const selects = [document.getElementById("cursoGerencia"), document.getElementById("cadCursoGerencia"), document.getElementById("editarCursoGerencia")];
    const htmlG = banco.gerencias.length === 0 ? `<option value="">Cadastre gerência</option>` : 
                 `<option value="">Selecione uma gerência</option>` + banco.gerencias.map(g => `<option value="${g.id}">${escaparHTML(g.nome)}</option>`).join("");
    selects.forEach(s => { if (s) s.innerHTML = htmlG; });
}

function atualizarSelectMinistrantes() {
    const selects = [document.getElementById("cursoMinistranteSelect"), document.getElementById("cadMinSelect"), document.getElementById("editarCursoMinistranteSelect")];
    
    // ORDENAÇÃO ALFABÉTICA
    const ordenados = [...banco.ministrantes].sort((a, b) => a.nome.localeCompare(b.nome));
    
    const htmlM = ordenados.length === 0 ? `<option value="">Cadastre um ministrante</option>` : 
                 `<option value="">Selecione na lista alfabética...</option>` + ordenados.map(m => `<option value="${m.id}">${escaparHTML(m.nome)}</option>`).join("");
    selects.forEach(s => { if (s) s.innerHTML = htmlM; });
}

function atualizarSelectCursos() {
    const sel = document.getElementById("comentCursoSelect");
    if (sel) {
        sel.innerHTML = `<option value="">Selecione um curso</option>` + banco.cursos.map(c => `<option value="${c.id}">${escaparHTML(c.nome)}</option>`).join("");
    }
}

/* LÓGICA MINISTRANTES (OPCIONALIDADE) */
function toggleAreaMinistrantes(checkboxId, areaId) {
    const check = document.getElementById(checkboxId);
    const area = document.getElementById(areaId);
    if (check && area) { area.style.display = check.checked ? "block" : "none"; }
}

['toggleTeveMinistrantesCurso', 'toggleTeveMinistrantesCad', 'toggleTeveMinistrantesEdit'].forEach(id => {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener('change', (e) => {
            const mapArea = {
                'toggleTeveMinistrantesCurso': 'areaMinistrantesCurso',
                'toggleTeveMinistrantesCad': 'areaMinistrantesCad',
                'toggleTeveMinistrantesEdit': 'areaMinistrantesEdit'
            };
            toggleAreaMinistrantes(e.target.id, mapArea[e.target.id]);
        });
    }
});

/* ADICIONAR MINISTRANTES NAS LISTAS (Lógica Reutilizável) */
function manipularAdicaoMinistrante(listaTarget, selectId, callbackAtualizar) {
    const sel = document.getElementById(selectId);
    if (!sel || !sel.value) { alert("Selecione um ministrante."); return; }
    if (listaTarget.includes(sel.value)) { alert("Já adicionado."); return; }
    listaTarget.push(sel.value);
    callbackAtualizar();
}

function manipularRemocaoMinistrante(listaTarget, id, callbackAtualizar) {
    const idx = listaTarget.indexOf(id);
    if(idx > -1) listaTarget.splice(idx, 1);
    callbackAtualizar();
}

function renderizarListaTagsMinistrantes(listaIds, areaId, callbackRemoverId) {
    const area = document.getElementById(areaId);
    if (!area) return;
    area.innerHTML = listaIds.length === 0 ? `<span style="color:#94a3b8; font-size:12px;">Nenhum ministrante.</span>` : "";
    listaIds.forEach(id => {
        const m = banco.ministrantes.find(i => i.id === id);
        if (m) area.innerHTML += `<div class="selected-tag">${escaparHTML(m.nome)} <button type="button" onclick="${callbackRemoverId}('${id}')">×</button></div>`;
    });
}

function renderizarCamposNotasMinistrantes(listaIds, containerId, prefixoInputs, avaliacaoExistente = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = listaIds.length === 0 ? `<p style="color:#94a3b8; font-size:13px;">Adicione ministrantes para atribuir votos.</p>` : "";
    
    listaIds.forEach(mId => {
        const m = banco.ministrantes.find(i => i.id === mId);
        if (!m) return;
        let infoExistente = "";
        if (avaliacaoExistente && avaliacaoExistente.ministrantes) {
            const item = avaliacaoExistente.ministrantes.find(x => x.ministranteId === mId);
            if (item) infoExistente = `<div style="font-size:12px; color:#4f46e5; margin-bottom:8px;">Nota Registrada: <strong>${formatarNota(item.nota)}</strong></div>`;
        }
        
        container.innerHTML += `
            <div class="ministrante-nota-item" data-id="${mId}" style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #fafafa;">
                <strong style="display:block; margin-bottom: 4px;">${escaparHTML(m.nome)}</strong>
                ${infoExistente}
                <div class="votes-input-group" style="margin-bottom: 0;">
                    <div class="vote-col"><label>⭐ 1</label><input type="number" class="${prefixoInputs}1" min="0"></div>
                    <div class="vote-col"><label>⭐⭐ 2</label><input type="number" class="${prefixoInputs}2" min="0"></div>
                    <div class="vote-col"><label>⭐⭐⭐ 3</label><input type="number" class="${prefixoInputs}3" min="0"></div>
                    <div class="vote-col"><label>⭐⭐⭐⭐ 4</label><input type="number" class="${prefixoInputs}4" min="0"></div>
                    <div class="vote-col"><label>⭐⭐⭐⭐⭐ 5</label><input type="number" class="${prefixoInputs}5" min="0"></div>
                </div>
            </div>`;
    });
}

// Funções Específicas de Ministrantes
function adicionarMinistranteAoCurso() { manipularAdicaoMinistrante(ministrantesDoCurso, "cursoMinistranteSelect", atualizarUiMinistrantesCurso); }
function removerMinistranteDoCurso(id) { manipularRemocaoMinistrante(ministrantesDoCurso, id, atualizarUiMinistrantesCurso); }
function atualizarUiMinistrantesCurso() { renderizarListaTagsMinistrantes(ministrantesDoCurso, "selecionadosMinistrantes", "removerMinistranteDoCurso"); }

function adicionarMinistranteCadastrarAvaliacao() { manipularAdicaoMinistrante(ministrantesCadastrarAvaliacao, "cadMinSelect", atualizarUiMinistrantesCad); }
function removerMinistranteCadastrarAvaliacao(id) { manipularRemocaoMinistrante(ministrantesCadastrarAvaliacao, id, atualizarUiMinistrantesCad); }
function atualizarUiMinistrantesCad() {
    renderizarListaTagsMinistrantes(ministrantesCadastrarAvaliacao, "selecionadosCadMinistrantes", "removerMinistranteCadastrarAvaliacao");
    renderizarCamposNotasMinistrantes(ministrantesCadastrarAvaliacao, "cadNotasMinistrantesContainer", "cmin-n");
}

function adicionarMinistranteAoEditarCurso() { manipularAdicaoMinistrante(ministrantesEditarCurso, "editarCursoMinistranteSelect", atualizarUiMinistrantesEdit); }
function removerMinistranteEditarCurso(id) { manipularRemocaoMinistrante(ministrantesEditarCurso, id, atualizarUiMinistrantesEdit); }
function atualizarUiMinistrantesEdit() {
    renderizarListaTagsMinistrantes(ministrantesEditarCurso, "selecionadosEditarMinistrantes", "removerMinistranteEditarCurso");
    const aval = banco.avaliacoes.find(a => a.cursoId === document.getElementById("editarCursoId").value);
    renderizarCamposNotasMinistrantes(ministrantesEditarCurso, "editarNotasMinistrantesContainer", "emin-n", aval);
}

function abrirModalCurso() {
    document.getElementById("formCurso")?.reset();
    ministrantesDoCurso = [];
    atualizarUiMinistrantesCurso();
    document.getElementById("toggleTeveMinistrantesCurso").checked = true;
    toggleAreaMinistrantes("toggleTeveMinistrantesCurso", "areaMinistrantesCurso");
    abrirModal("modalCurso");
}

function abrirModalMinistrante() { document.getElementById("formMinistrante")?.reset(); abrirModal("modalMinistrante"); }
function abrirModalGerencia() { document.getElementById("formGerencia")?.reset(); abrirModal("modalGerencia"); }

function abrirEditarCurso(id) {
    const curso = banco.cursos.find(c => c.id === id);
    const avaliacao = banco.avaliacoes.find(a => a.cursoId === id);
    if (!curso) return;

    document.getElementById("editarCursoId").value = curso.id;
    document.getElementById("editarCursoNome").value = curso.nome;
    document.getElementById("editarCursoGerencia").value = curso.gerenciaId;
    document.getElementById("editarCursoDataInicio").value = curso.dataInicio || "";
    document.getElementById("editarCursoDataFim").value = curso.dataFim || "";
    document.getElementById("editarCursoInscritos").value = curso.inscritos || "";
    document.getElementById("editarCursoCertificados").value = curso.certificados || "";
    document.getElementById("editarCursoObservacoes").value = curso.observacoes || "";

    // Ministrantes lógica
    const temMin = (curso.ministrantes && curso.ministrantes.length > 0);
    document.getElementById("toggleTeveMinistrantesEdit").checked = temMin;
    toggleAreaMinistrantes("toggleTeveMinistrantesEdit", "areaMinistrantesEdit");
    ministrantesEditarCurso = temMin ? [...curso.ministrantes] : [];
    atualizarUiMinistrantesEdit();

    if (avaliacao) {
        document.getElementById("editarAvaliacaoRespostas").value = avaliacao.respostas || "";
        document.getElementById("editarAtivarSat").checked = avaliacao.satisfacao !== null;
        document.getElementById("editarAtivarOrg").checked = avaliacao.organizacao !== null;
        document.getElementById("edtSatMediaCalc").textContent = formatarNota(avaliacao.satisfacao);
        document.getElementById("edtOrgMediaCalc").textContent = formatarNota(avaliacao.organizacao);
    }
    abrirModal("modalEditarCurso");
}

/* LÓGICA DE DADOS E CÁLCULOS */
function encontrarGerencia(id) { return banco.gerencias.find(g => g.id === id); }
function encontrarMinistrante(id) { return banco.ministrantes.find(m => m.id === id); }
function formatarNota(nota) { return (nota === null || isNaN(nota)) ? "—" : Number(nota).toFixed(2).replace(".", ","); }

function calcularMediaPonderada(valores) {
    const validos = valores.filter(i => i.nota !== null && !isNaN(i.nota) && i.respostas > 0);
    if (validos.length === 0) return null;
    let somaNotas = 0, totalRespostas = 0;
    validos.forEach(i => { somaNotas += i.nota * i.respostas; totalRespostas += i.respostas; });
    return totalRespostas === 0 ? null : somaNotas / totalRespostas;
}

function mediaDoCurso(cursoId, categoria) {
    const avaliacoes = banco.avaliacoes.filter(a => a.cursoId === cursoId);
    const valores = [];
    avaliacoes.forEach(a => {
        if (categoria === "satisfacao" && a.satisfacao !== null) valores.push({ nota: a.satisfacao, respostas: a.respostas });
        if (categoria === "organizacao" && a.organizacao !== null) valores.push({ nota: a.organizacao, respostas: a.respostas });
        if (categoria === "ministrantes" && a.ministrantes && a.ministrantes.length > 0) {
            a.ministrantes.forEach(m => valores.push({ nota: m.nota, respostas: a.respostas }));
        }
    });
    return calcularMediaPonderada(valores);
}

function mediaGeralDoCurso(cursoId) {
    const sat = mediaDoCurso(cursoId, "satisfacao");
    const org = mediaDoCurso(cursoId, "organizacao");
    const min = mediaDoCurso(cursoId, "ministrantes");
    
    let soma = 0, qtd = 0;
    if (sat !== null) { soma += sat; qtd++; }
    if (org !== null) { soma += org; qtd++; }
    if (min !== null) { soma += min; qtd++; } // Se não tiver ministrantes, min é null, ignorado na média.
    
    return qtd === 0 ? null : soma / qtd;
}

function validarSomaVotos(respostas, valArray, titulo) {
    const soma = valArray.reduce((a,b)=>a+b, 0);
    if (soma !== respostas) {
        alert(`Soma de votos em "${titulo}" (${soma}) diferente do total de respostas (${respostas}).`);
        return false;
    }
    return true;
}

/* RENDERS PRINCIPAIS */
function atualizarSistema() {
    atualizarSelectGerencias();
    atualizarSelectMinistrantes();
    atualizarSelectCursos();
    renderizarVisaoGeral();
    mostrarCursosCards();
    renderizarEvolucaoMensal();
    renderizarAbaAvaliacoes();
}

function renderizarVisaoGeral() {
    // Mesma lógica anterior, mantida íntegra
    const selectMes = document.getElementById("seletorMesVisaoGeral");
    if(!selectMes) return;
    
    const mesesSet = new Set();
    banco.cursos.forEach(c => c.dataInicio && mesesSet.add(c.dataInicio.substring(0,7)));
    const mesesOrdenados = Array.from(mesesSet).sort().reverse();
    
    const valAntigo = selectMes.value;
    selectMes.innerHTML = mesesOrdenados.map(m => `<option value="${m}">${m.split('-')[1]}/${m.split('-')[0]}</option>`).join("");
    if(valAntigo && mesesOrdenados.includes(valAntigo)) selectMes.value = valAntigo;
    
    const mesAtual = selectMes.value;
    const cursosMes = banco.cursos.filter(c => c.dataInicio && c.dataInicio.startsWith(mesAtual));
    
    let sat=[], org=[], min=[];
    cursosMes.forEach(c => {
        const s=mediaDoCurso(c.id, "satisfacao"), o=mediaDoCurso(c.id, "organizacao"), m=mediaDoCurso(c.id, "ministrantes");
        if(s) sat.push(s); if(o) org.push(o); if(m) min.push(m);
    });
    
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
    document.getElementById("vgSatMes").textContent = formatarNota(avg(sat));
    document.getElementById("vgOrgMes").textContent = formatarNota(avg(org));
    document.getElementById("vgMinMes").textContent = formatarNota(avg(min));
    
    document.getElementById("vgTotalCursos").textContent = banco.cursos.length;
    document.getElementById("vgTotalAvaliacoes").textContent = banco.avaliacoes.reduce((t,a)=>t+(Number(a.respostas)||0), 0);
}

function mostrarCursosCards() {
    const area = document.getElementById("listaCursosCards");
    if (!area) return;
    area.innerHTML = banco.cursos.length === 0 ? `<div class="empty-state">Nenhum curso.</div>` : banco.cursos.map(c => {
        const ger = encontrarGerencia(c.gerenciaId);
        const nomesMin = c.ministrantes && c.ministrantes.length > 0 ? c.ministrantes.map(id => encontrarMinistrante(id)?.nome).filter(Boolean).join(", ") : "Nenhum Ministrante";
        const media = mediaGeralDoCurso(c.id);
        const obs = c.observacoes ? `<div class="course-observation"><strong>Obs:</strong> ${escaparHTML(c.observacoes)}</div>` : "";
        
        return `
            <div class="course-card-unit">
                <div class="course-card-header">
                    <h2 class="course-card-title">${escaparHTML(c.nome)}</h2>
                    <div class="course-metrics-group">
                        <div class="metric-box"><span class="metric-box-label">Gerência</span><strong class="metric-box-value">${ger?.nome||"—"}</strong></div>
                        <div class="metric-box"><span class="metric-box-label">Média</span><strong class="metric-box-value highlight">${formatarNota(media)}</strong></div>
                    </div>
                </div>
                <div class="course-card-details">
                    <div style="font-size: 13px; color: #475569;">
                        <div><span>Ministrantes:</span> <strong>${escaparHTML(nomesMin)}</strong></div>
                    </div>
                    ${obs}
                </div>
                <div class="course-card-actions">
                    <button class="action-btn edit-btn" onclick="abrirEditarCurso('${c.id}')">✎ Editar</button>
                    <button class="action-btn delete-btn" onclick="excluirCurso('${c.id}')">🗑 Excluir</button>
                </div>
            </div>`;
    }).join("");
}

/* ABA AVALIAÇÕES - COMENTÁRIOS E EDIÇÃO */
function renderizarAbaAvaliacoes() {
    const feed = document.getElementById("feedComentarios");
    if (!feed) return;
    feed.innerHTML = banco.comentarios.length === 0 ? `<div class="empty-state">Sem comentários.</div>` : banco.comentarios.map(c => {
        const cur = banco.cursos.find(x => x.id === c.cursoId);
        return `
            <div class="comment-card">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <strong>${cur ? escaparHTML(cur.nome) : "—"}</strong>
                    <button class="action-btn edit-btn" onclick="prepararEdicaoComentario('${c.id}')">✎ Editar</button>
                </div>
                <div style="font-size:12px; color:#4f46e5; margin-bottom:8px;">Categoria: ${c.tipo}</div>
                <p style="font-size:13px; margin:0;">${escaparHTML(c.texto)}</p>
            </div>`;
    }).join("");
}

function prepararEdicaoComentario(id) {
    const c = banco.comentarios.find(x => x.id === id);
    if(!c) return;
    document.getElementById("comentIdEdit").value = c.id;
    document.getElementById("comentCursoSelect").value = c.cursoId;
    document.getElementById("comentTipoSelect").value = c.tipo;
    document.getElementById("comentTextoInput").value = c.texto;
    
    document.getElementById("btnSalvarComentario").textContent = "Atualizar Comentário";
    document.getElementById("btnCancelarEdicao").style.display = "block";
}

function cancelarEdicaoComentario() {
    document.getElementById("formAdicionarComentario").reset();
    document.getElementById("comentIdEdit").value = "";
    document.getElementById("btnSalvarComentario").textContent = "Salvar Comentário";
    document.getElementById("btnCancelarEdicao").style.display = "none";
}

function excluirCurso(id) {
    if(!confirm("Excluir este curso e avaliações?")) return;
    banco.cursos = banco.cursos.filter(c => c.id !== id);
    banco.avaliacoes = banco.avaliacoes.filter(a => a.cursoId !== id);
    salvarBanco();
}

function escaparHTML(texto) { return String(texto||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

/* EVENTOS INICIAIS */
document.addEventListener("DOMContentLoaded", function() {
    carregarBanco();
    
    // Toggle Sidebar
    document.getElementById("btnToggleSidebar")?.addEventListener("click", () => {
        document.getElementById("sidebar")?.classList.toggle("collapsed");
    });

    // Navegação Abas
    document.querySelectorAll(".menu-item[data-page]").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".menu-item[data-page], .page").forEach(e => e.classList.remove("active"));
            this.classList.add("active");
            document.getElementById("page-" + this.dataset.page)?.classList.add("active");
        });
    });

    document.querySelectorAll(".sub-nav-tab").forEach(btn => {
        btn.addEventListener("click", function() {
            document.querySelectorAll(".sub-nav-tab, .sub-page").forEach(e => e.classList.remove("active"));
            this.classList.add("active");
            document.getElementById("subpage-" + this.dataset.subpage)?.classList.add("active");
        });
    });

    // Submeter Novo Ministrante (Maiúsculo Automático)
    document.getElementById("formMinistrante")?.addEventListener("submit", e => {
        e.preventDefault();
        const nome = document.getElementById("ministranteNome").value.trim().toUpperCase();
        if(!nome || banco.ministrantes.some(m => m.nome === nome)) return alert("Inválido ou já existe.");
        banco.ministrantes.push({ id: novoId(), nome });
        salvarBanco(); fecharModal("modalMinistrante");
    });

    // Submeter Gerência
    document.getElementById("formGerencia")?.addEventListener("submit", e => {
        e.preventDefault();
        const nome = document.getElementById("gerenciaNome").value.trim();
        if(!nome || banco.gerencias.some(g => g.nome.toLowerCase() === nome.toLowerCase())) return alert("Inválido ou já existe.");
        banco.gerencias.push({ id: novoId(), nome });
        salvarBanco(); fecharModal("modalGerencia");
    });

    // Submeter Comentário (Novo ou Edição)
    document.getElementById("formAdicionarComentario")?.addEventListener("submit", e => {
        e.preventDefault();
        const idEdit = document.getElementById("comentIdEdit").value;
        const cursoId = document.getElementById("comentCursoSelect").value;
        const tipo = document.getElementById("comentTipoSelect").value;
        const texto = document.getElementById("comentTextoInput").value.trim();

        if (idEdit) {
            const c = banco.comentarios.find(x => x.id === idEdit);
            if(c) { c.cursoId = cursoId; c.tipo = tipo; c.texto = texto; }
        } else {
            banco.comentarios.push({ id: novoId(), cursoId, tipo, texto, data: new Date().toISOString().substring(0,10) });
        }
        salvarBanco(); cancelarEdicaoComentario();
    });

    // Desativar scroll nos inputs tipo number
    document.addEventListener("wheel", e => { if (document.activeElement.type === "number") document.activeElement.blur(); });
});
