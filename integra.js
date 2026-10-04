/* ============================================================
   AVALIACURSOS - SISTEMA COMPLETO + FIREBASE (RESTAURADO)
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
            banco = Object.assign({ cursos: [], ministrantes: [], gerencias: [], avaliacoes: [], comentarios: [] }, doc.data());
            atualizarSistema();
        } else {
            salvarBanco();
        }
    });
}

function salvarBanco() {
    docRef.set(banco).catch((error) => console.error("Erro Firebase: ", error));
}

function novoId() { return Date.now().toString() + Math.random().toString(16).substring(2); }
function abrirModal(nome) { document.getElementById(nome)?.classList.add("active"); }
function fecharModal(nome) { document.getElementById(nome)?.classList.remove("active"); }
function escaparHTML(texto) { return String(texto||"").replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }

/* CÁLCULOS GERAIS */
function encontrarGerencia(id) { return banco.gerencias.find(g => g.id === id); }
function encontrarMinistrante(id) { return banco.ministrantes.find(m => m.id === id); }
function formatarNota(nota) { return (nota === null || isNaN(nota)) ? "—" : Number(nota).toFixed(2).replace(".", ","); }

function calcularMediaPonderada(valores) {
    const validos = valores.filter(i => i.nota !== null && !isNaN(i.nota) && i.respostas > 0);
    if (validos.length === 0) return null;
    let somaNotas = 0, totalRespostas = 0;
    validos.forEach(i => { somaNotas += i.nota * i.respostas; totalRespostas += i.respostas; });
    return somaNotas / totalRespostas;
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
    const sat = mediaDoCurso(cursoId, "satisfacao"), org = mediaDoCurso(cursoId, "organizacao"), min = mediaDoCurso(cursoId, "ministrantes");
    let soma = 0, qtd = 0;
    if (sat !== null) { soma += sat; qtd++; }
    if (org !== null) { soma += org; qtd++; }
    if (min !== null) { soma += min; qtd++; }
    return qtd === 0 ? null : soma / qtd;
}

/* ATUALIZADORES DE SELECTS */
function atualizarSelectGerencias() {
    const htmlG = banco.gerencias.length === 0 ? `<option value="">Cadastre gerência</option>` : 
                 `<option value="">Selecione uma gerência</option>` + banco.gerencias.map(g => `<option value="${g.id}">${escaparHTML(g.nome)}</option>`).join("");
    ["cursoGerencia", "cadCursoGerencia", "editarCursoGerencia"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerHTML = htmlG; });
}

function atualizarSelectMinistrantes() {
    const ordenados = [...banco.ministrantes].sort((a, b) => a.nome.localeCompare(b.nome));
    const htmlM = ordenados.length === 0 ? `<option value="">Cadastre um ministrante</option>` : 
                 `<option value="">Selecione (Ordem Alfabética)...</option>` + ordenados.map(m => `<option value="${m.id}">${escaparHTML(m.nome)}</option>`).join("");
    ["cursoMinistranteSelect", "cadMinSelect", "editarCursoMinistranteSelect"].forEach(id => { if (document.getElementById(id)) document.getElementById(id).innerHTML = htmlM; });
}

function atualizarSelectCursos() {
    if (document.getElementById("comentCursoSelect")) {
        document.getElementById("comentCursoSelect").innerHTML = `<option value="">Selecione um curso</option>` + banco.cursos.map(c => `<option value="${c.id}">${escaparHTML(c.nome)}</option>`).join("");
    }
}

/* LÓGICA MINISTRANTES (OPCIONAL E LISTAS) */
function toggleAreaMinistrantes(checkboxId, areaId) {
    const check = document.getElementById(checkboxId), area = document.getElementById(areaId);
    if (check && area) area.style.display = check.checked ? "block" : "none";
}

function manipularAdicaoMinistrante(listaTarget, selectId, callbackAtualizar) {
    const sel = document.getElementById(selectId);
    if (!sel || !sel.value) return alert("Selecione um ministrante.");
    if (listaTarget.includes(sel.value)) return alert("Já adicionado.");
    listaTarget.push(sel.value); callbackAtualizar();
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
        let info = avaliacaoExistente?.ministrantes?.find(x => x.ministranteId === mId);
        let htmlInfo = info ? `<div style="font-size:12px; color:#4f46e5; margin-bottom:8px;">Nota Registrada: <strong>${formatarNota(info.nota)}</strong></div>` : "";
        container.innerHTML += `
            <div style="border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #fafafa;">
                <strong style="display:block; margin-bottom: 4px;">${escaparHTML(m.nome)}</strong>
                ${htmlInfo}
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

function adicionarMinistranteAoCurso() { manipularAdicaoMinistrante(ministrantesDoCurso, "cursoMinistranteSelect", () => renderizarListaTagsMinistrantes(ministrantesDoCurso, "selecionadosMinistrantes", "rmCursoMin")); }
function rmCursoMin(id) { ministrantesDoCurso = ministrantesDoCurso.filter(x => x !== id); renderizarListaTagsMinistrantes(ministrantesDoCurso, "selecionadosMinistrantes", "rmCursoMin"); }

function adicionarMinistranteCadastrarAvaliacao() { manipularAdicaoMinistrante(ministrantesCadastrarAvaliacao, "cadMinSelect", atualizarUiMinCad); }
function rmCadMin(id) { ministrantesCadastrarAvaliacao = ministrantesCadastrarAvaliacao.filter(x => x !== id); atualizarUiMinCad(); }
function atualizarUiMinCad() {
    renderizarListaTagsMinistrantes(ministrantesCadastrarAvaliacao, "selecionadosCadMinistrantes", "rmCadMin");
    renderizarCamposNotasMinistrantes(ministrantesCadastrarAvaliacao, "cadNotasMinistrantesContainer", "cmin-n");
}

function adicionarMinistranteAoEditarCurso() { manipularAdicaoMinistrante(ministrantesEditarCurso, "editarCursoMinistranteSelect", atualizarUiMinEdit); }
function rmEditMin(id) { ministrantesEditarCurso = ministrantesEditarCurso.filter(x => x !== id); atualizarUiMinEdit(); }
function atualizarUiMinEdit() {
    renderizarListaTagsMinistrantes(ministrantesEditarCurso, "selecionadosEditarMinistrantes", "rmEditMin");
    const aval = banco.avaliacoes.find(a => a.cursoId === document.getElementById("editarCursoId").value);
    renderizarCamposNotasMinistrantes(ministrantesEditarCurso, "editarNotasMinistrantesContainer", "emin-n", aval);
}

/* RENDERS PRINCIPAIS DO SISTEMA (TUDO RESTAURADO) */
function atualizarSistema() {
    atualizarSelectGerencias();
    atualizarSelectMinistrantes();
    atualizarSelectCursos();
    
    renderizarVisaoGeral();
    mostrarCursosCards();
    
    renderizarAbaAvaliacoes();      // <-- TABELAS DE AVALIAÇÕES (Organização, Sat, Min, Comentários)
    renderizarEvolucaoMensal();     // <-- GRÁFICOS DE EVOLUÇÃO
    renderizarAbaMinistrantes();    // <-- TABELAS E GRÁFICOS DE MINISTRANTES
    renderizarAbaGerencias();       // <-- TABELAS E GRÁFICOS DE GERÊNCIAS
}

/* ABA: VISÃO GERAL */
function renderizarVisaoGeral() {
    const selectMes = document.getElementById("seletorMesVisaoGeral");
    if(!selectMes) return;
    const mesesSet = new Set();
    banco.cursos.forEach(c => c.dataInicio && mesesSet.add(c.dataInicio.substring(0,7)));
    const meses = Array.from(mesesSet).sort().reverse();
    
    const valAntigo = selectMes.value;
    selectMes.innerHTML = meses.map(m => `<option value="${m}">${m.split('-')[1]}/${m.split('-')[0]}</option>`).join("");
    if(valAntigo && meses.includes(valAntigo)) selectMes.value = valAntigo;
    
    const mesAtual = selectMes.value;
    const cursosMes = banco.cursos.filter(c => c.dataInicio && c.dataInicio.startsWith(mesAtual));
    
    let sat=[], org=[], min=[];
    cursosMes.forEach(c => {
        const s=mediaDoCurso(c.id, "satisfacao"), o=mediaDoCurso(c.id, "organizacao"), m=mediaDoCurso(c.id, "ministrantes");
        if(s!==null) sat.push(s); if(o!==null) org.push(o); if(m!==null) min.push(m);
    });
    
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : null;
    document.getElementById("vgSatMes").textContent = formatarNota(avg(sat));
    document.getElementById("vgOrgMes").textContent = formatarNota(avg(org));
    document.getElementById("vgMinMes").textContent = formatarNota(avg(min));
    
    document.getElementById("vgTotalCursos").textContent = banco.cursos.length;
    document.getElementById("vgTotalAvaliacoes").textContent = banco.avaliacoes.reduce((t,a)=>t+(Number(a.respostas)||0), 0);
    
    // Gráfico de Barras Visão Geral
    const ctx = document.getElementById('graficoBarrasVisaoGeral');
    if(ctx) {
        if(meuGraficoBarrasVisaoGeral) meuGraficoBarrasVisaoGeral.destroy();
        meuGraficoBarrasVisaoGeral = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Satisfação', 'Organização', 'Ministrantes'],
                datasets: [{
                    label: 'Média Acumulada',
                    data: [
                        avg(banco.cursos.map(c => mediaDoCurso(c.id, "satisfacao")).filter(x => x!==null)),
                        avg(banco.cursos.map(c => mediaDoCurso(c.id, "organizacao")).filter(x => x!==null)),
                        avg(banco.cursos.map(c => mediaDoCurso(c.id, "ministrantes")).filter(x => x!==null))
                    ],
                    backgroundColor: ['#4f46e5', '#10b981', '#f59e0b']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 5 } } }
        });
    }
}

/* ABA: AVALIAÇÕES ANALÍTICAS (TOTALMENTE RESTAURADA) */
function renderizarAbaAvaliacoes() {
    // 1. Organização
    const htmlOrg = `
        <table>
            <thead><tr><th>Curso</th><th>Gerência</th><th>Média Organização</th></tr></thead>
            <tbody>
                ${banco.cursos.map(c => {
                    const nota = mediaDoCurso(c.id, "organizacao");
                    return nota !== null ? `<tr><td>${escaparHTML(c.nome)}</td><td>${encontrarGerencia(c.gerenciaId)?.nome||"—"}</td><td class="rating-number">${formatarNota(nota)}</td></tr>` : '';
                }).join("")}
            </tbody>
        </table>`;
    document.getElementById("conteudo-av-org").innerHTML = htmlOrg || "<p>Sem dados.</p>";

    // 2. Satisfação
    const htmlSat = `
        <table>
            <thead><tr><th>Curso</th><th>Gerência</th><th>Média Satisfação</th></tr></thead>
            <tbody>
                ${banco.cursos.map(c => {
                    const nota = mediaDoCurso(c.id, "satisfacao");
                    return nota !== null ? `<tr><td>${escaparHTML(c.nome)}</td><td>${encontrarGerencia(c.gerenciaId)?.nome||"—"}</td><td class="rating-number">${formatarNota(nota)}</td></tr>` : '';
                }).join("")}
            </tbody>
        </table>`;
    document.getElementById("conteudo-av-sat").innerHTML = htmlSat || "<p>Sem dados.</p>";

    // 3. Ministrantes
    const htmlMin = `
        <table>
            <thead><tr><th>Ministrante</th><th>Cursos Associados</th><th>Média Geral</th></tr></thead>
            <tbody>
                ${banco.ministrantes.map(m => {
                    let soma=0, qtd=0, cursosAtuou=[];
                    banco.avaliacoes.forEach(a => {
                        const mNota = a.ministrantes?.find(x => x.ministranteId === m.id);
                        if (mNota && mNota.nota !== null) { soma += mNota.nota; qtd++; const c = banco.cursos.find(x=>x.id===a.cursoId); if(c) cursosAtuou.push(c.nome); }
                    });
                    if(qtd===0) return "";
                    return `<tr><td>${escaparHTML(m.nome)}</td><td>${cursosAtuou.join(", ")}</td><td class="rating-number">${formatarNota(soma/qtd)}</td></tr>`;
                }).join("")}
            </tbody>
        </table>`;
    document.getElementById("conteudo-av-min").innerHTML = htmlMin || "<p>Sem dados.</p>";

    // 4. Comentários
    const feed = document.getElementById("feedComentarios");
    if (feed) {
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
}

/* ABA: EVOLUÇÃO MENSAL (RESTAURADA) */
function renderizarEvolucaoMensal() {
    const meses = Array.from(new Set(banco.cursos.map(c => c.dataInicio?.substring(0,7)).filter(Boolean))).sort();
    let dSat=[], dOrg=[], dMin=[];
    
    meses.forEach(m => {
        const cursos = banco.cursos.filter(c => c.dataInicio.startsWith(m));
        const avg = cat => {
            const notas = cursos.map(c => mediaDoCurso(c.id, cat)).filter(x => x !== null);
            return notas.length ? notas.reduce((a,b)=>a+b,0)/notas.length : null;
        };
        dSat.push(avg("satisfacao")); dOrg.push(avg("organizacao")); dMin.push(avg("ministrantes"));
    });

    const ctx = document.getElementById('graficoEvolucaoMensal');
    if(ctx) {
        if(meuGraficoEvolucao) meuGraficoEvolucao.destroy();
        meuGraficoEvolucao = new Chart(ctx, {
            type: 'line',
            data: {
                labels: meses.map(m => `${m.split('-')[1]}/${m.split('-')[0]}`),
                datasets: [
                    { label: 'Satisfação', data: dSat, borderColor: '#4f46e5', tension: 0.3 },
                    { label: 'Organização', data: dOrg, borderColor: '#10b981', tension: 0.3 },
                    { label: 'Ministrantes', data: dMin, borderColor: '#f59e0b', tension: 0.3 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 5 } } }
        });
    }
    
    const selDet = document.getElementById("seletorMesDetalhe");
    if(selDet) {
        selDet.innerHTML = meses.map(m => `<option value="${m}">${m.split('-')[1]}/${m.split('-')[0]}</option>`).join("");
    }
}

/* ABA: MINISTRANTES (RESTAURADA) */
function renderizarAbaMinistrantes() {
    const listCard = document.getElementById("listaMinistrantesCards");
    const listRank = document.getElementById("rankingMinistrantesLista");
    
    let statsMin = banco.ministrantes.map(m => {
        let soma=0, qtd=0;
        banco.avaliacoes.forEach(a => {
            const mn = a.ministrantes?.find(x => x.ministranteId === m.id);
            if(mn && mn.nota !== null) { soma+=mn.nota; qtd++; }
        });
        return { id: m.id, nome: m.nome, notaGeral: qtd? soma/qtd : null, cursosQtd: qtd };
    }).filter(m => m.notaGeral !== null).sort((a,b) => b.notaGeral - a.notaGeral);

    if(listRank) {
        listRank.innerHTML = statsMin.slice(0,5).map((m, i) => `
            <div class="ranking-item">
                <span class="ranking-number">${i+1}º</span>
                <span style="flex:1; font-weight:600;">${escaparHTML(m.nome)}</span>
                <span class="ranking-score">${formatarNota(m.notaGeral)}</span>
            </div>
        `).join("") || "<p>Sem avaliações suficientes.</p>";
    }

    if(listCard) {
        listCard.innerHTML = statsMin.map(m => `
            <div class="ministrante-expand-card">
                <div class="ministrante-card-header-clickable">
                    <div style="font-weight:700;">${escaparHTML(m.nome)}</div>
                    <div style="color: #4f46e5; font-weight:800; font-size:18px;">${formatarNota(m.notaGeral)}</div>
                </div>
            </div>
        `).join("") || "<p>Nenhum dado.</p>";
    }
}

/* ABA: GERÊNCIAS (RESTAURADA) */
function renderizarAbaGerencias() {
    const cards = document.getElementById("cardsGerenciasConsolidados");
    const tbl = document.getElementById("tabelaCursosPorGerenciaHistorico");
    
    if(cards) {
        cards.innerHTML = banco.gerencias.map(g => {
            const cursosG = banco.cursos.filter(c => c.gerenciaId === g.id);
            let soma=0, qtd=0;
            cursosG.forEach(c => { const m = mediaGeralDoCurso(c.id); if(m!==null){ soma+=m; qtd++; }});
            return `
                <div class="management-card">
                    <h3 style="font-size:14px; color:#475569; margin-bottom:5px;">${escaparHTML(g.nome)}</h3>
                    <div class="management-score">${qtd ? formatarNota(soma/qtd) : "—"}</div>
                    <div style="font-size:12px; color:#94a3b8;">${cursosG.length} curso(s)</div>
                </div>`;
        }).join("");
    }
    
    if(tbl) {
        tbl.innerHTML = `
            <table>
                <thead><tr><th>Gerência</th><th>Curso</th><th>Média</th></tr></thead>
                <tbody>
                    ${banco.cursos.map(c => `<tr><td>${encontrarGerencia(c.gerenciaId)?.nome\vert{}\vert{}"—"}</td><td>${escaparHTML(c.nome)}</td><td class="rating-number">${formatarNota(mediaGeralDoCurso(c.id))}</td></tr>`).join("")}
                </tbody>
            </table>
        `;
    }
}

/* CARTÕES DE CURSOS */
function mostrarCursosCards() {
    const area = document.getElementById("listaCursosCards");
    if (!area) return;
    area.innerHTML = banco.cursos.length === 0 ? `<div class="empty-state">Nenhum curso.</div>` : banco.cursos.map(c => {
        const ger = encontrarGerencia(c.gerenciaId);
        const nomesMin = c.ministrantes && c.ministrantes.length > 0 ? c.ministrantes.map(id => encontrarMinistrante(id)?.nome).filter(Boolean).join(", ") : "Nenhum";
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
                    <div style="font-size: 13px; color: #475569;"><div><span>Ministrantes:</span> <strong>${escaparHTML(nomesMin)}</strong></div></div>
                    ${obs}
                </div>
                <div class="course-card-actions">
                    <button class="action-btn edit-btn" onclick="abrirEditarCurso('${c.id}')">✎ Editar</button>
                    <button class="action-btn delete-btn" onclick="excluirCurso('${c.id}')">🗑 Excluir</button>
                </div>
            </div>`;
    }).join("");
}

function abrirModalCurso() {
    document.getElementById("formCurso")?.reset();
    ministrantesDoCurso = []; atualizarUiMinistrantesCurso();
    document.getElementById("toggleTeveMinistrantesCurso").checked = true;
    toggleAreaMinistrantes("toggleTeveMinistrantesCurso", "areaMinistrantesCurso");
    abrirModal("modalCurso");
}
function atualizarUiMinistrantesCurso() { renderizarListaTagsMinistrantes(ministrantesDoCurso, "selecionadosMinistrantes", "rmCursoMin"); }

function abrirModalMinistrante() { document.getElementById("formMinistrante")?.reset(); abrirModal("modalMinistrante"); }
function abrirModalGerencia() { document.getElementById("formGerencia")?.reset(); abrirModal("modalGerencia"); }

function abrirEditarCurso(id) {
    const curso = banco.cursos.find(c => c.id === id), avaliacao = banco.avaliacoes.find(a => a.cursoId === id);
    if (!curso) return;

    document.getElementById("editarCursoId").value = curso.id;
    document.getElementById("editarCursoNome").value = curso.nome;
    document.getElementById("editarCursoGerencia").value = curso.gerenciaId;
    document.getElementById("editarCursoDataInicio").value = curso.dataInicio || "";
    document.getElementById("editarCursoDataFim").value = curso.dataFim || "";
    document.getElementById("editarCursoObservacoes").value = curso.observacoes || "";

    const temMin = (curso.ministrantes && curso.ministrantes.length > 0);
    document.getElementById("toggleTeveMinistrantesEdit").checked = temMin;
    toggleAreaMinistrantes("toggleTeveMinistrantesEdit", "areaMinistrantesEdit");
    ministrantesEditarCurso = temMin ? [...curso.ministrantes] : [];
    atualizarUiMinEdit();

    if (avaliacao) {
        document.getElementById("editarAvaliacaoRespostas").value = avaliacao.respostas || "";
        document.getElementById("editarAtivarSat").checked = avaliacao.satisfacao !== null;
        document.getElementById("editarAtivarOrg").checked = avaliacao.organizacao !== null;
        document.getElementById("edtSatMediaCalc").textContent = formatarNota(avaliacao.satisfacao);
        document.getElementById("edtOrgMediaCalc").textContent = formatarNota(avaliacao.organizacao);
    }
    abrirModal("modalEditarCurso");
}

/* EDIÇÃO DE COMENTÁRIOS */
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

/* EVENTOS INICIAIS DA PÁGINA */
document.addEventListener("DOMContentLoaded", function() {
    carregarBanco();
    
    // Listeners do Menu
    document.getElementById("btnToggleSidebar")?.addEventListener("click", () => document.getElementById("sidebar")?.classList.toggle("collapsed"));
    
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

    // Toggles de Área de Ministrantes Opcionais
    ['toggleTeveMinistrantesCurso', 'toggleTeveMinistrantesCad', 'toggleTeveMinistrantesEdit'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('change', (e) => {
            const mapArea = {'toggleTeveMinistrantesCurso': 'areaMinistrantesCurso', 'toggleTeveMinistrantesCad': 'areaMinistrantesCad', 'toggleTeveMinistrantesEdit': 'areaMinistrantesEdit'};
            toggleAreaMinistrantes(e.target.id, mapArea[e.target.id]);
        });
    });

    // Submits (Maiúsculas automáticas no ministrante)
    document.getElementById("formMinistrante")?.addEventListener("submit", e => {
        e.preventDefault();
        const nome = document.getElementById("ministranteNome").value.trim().toUpperCase();
        if(!nome || banco.ministrantes.some(m => m.nome === nome)) return alert("Inválido ou já existe.");
        banco.ministrantes.push({ id: novoId(), nome });
        salvarBanco(); fecharModal("modalMinistrante");
    });

    document.getElementById("formGerencia")?.addEventListener("submit", e => {
        e.preventDefault();
        const nome = document.getElementById("gerenciaNome").value.trim();
        if(!nome || banco.gerencias.some(g => g.nome.toLowerCase() === nome.toLowerCase())) return alert("Inválido ou já existe.");
        banco.gerencias.push({ id: novoId(), nome });
        salvarBanco(); fecharModal("modalGerencia");
    });

    document.getElementById("formAdicionarComentario")?.addEventListener("submit", e => {
        e.preventDefault();
        const idEdit = document.getElementById("comentIdEdit").value, cursoId = document.getElementById("comentCursoSelect").value;
        const tipo = document.getElementById("comentTipoSelect").value, texto = document.getElementById("comentTextoInput").value.trim();
        if (idEdit) { const c = banco.comentarios.find(x => x.id === idEdit); if(c) { c.cursoId = cursoId; c.tipo = tipo; c.texto = texto; } } 
        else { banco.comentarios.push({ id: novoId(), cursoId, tipo, texto, data: new Date().toISOString().substring(0,10) }); }
        salvarBanco(); cancelarEdicaoComentario();
    });

    // Desativar Rato nos inputs numéricos
    document.addEventListener("wheel", e => { if (document.activeElement.type === "number") document.activeElement.blur(); });
});
