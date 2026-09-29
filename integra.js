/* ============================================================
   AVALIACURSOS - BANCO DE DADOS NA NUVEM (FIREBASE)
   ============================================================ */

/* ============================================================
   AVALIACURSOS - BANCO DE DADOS NA NUVEM (FIREBASE)
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
let meuGraficoEvolucaoSat = null; let meuGraficoEvolucaoOrg = null; let meuGraficoGerenciasLadoALado = null;
let mesFiltroCursos = ""; let mesFiltroVisaoGeral = "";

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
        alert("Erro de conexão com o banco de dados.");
    });
}

function salvarBanco() {
    docRef.set(banco).catch((error) => {
        console.error("Erro ao salvar no Firebase: ", error);
        alert("Erro de ligação ao banco de dados.");
    });
}

function novoId() {
    return Date.now().toString() + Math.random().toString(16).substring(2);
}

function abrirModal(nomeModal) {
    const modal = document.getElementById(nomeModal);
    if (modal) modal.classList.add("active");
}

function fecharModal(nomeModal) {
    const modal = document.getElementById(nomeModal);
    if (modal) modal.classList.remove("active");
}

function abrirModalCurso() {
    const form = document.getElementById("formCurso");
    if (form) form.reset();
    ministrantesDoCurso = [];
    atualizarSelectGerencias();
    atualizarSelectMinistrantes();
    mostrarMinistrantesDoCurso();
    abrirModal("modalCurso");
}

function abrirModalMinistrante() {
    const form = document.getElementById("formMinistrante");
    if (form) form.reset();
    abrirModal("modalMinistrante");
}

function abrirModalGerencia() {
    const form = document.getElementById("formGerencia");
    if (form) form.reset();
    abrirModal("modalGerencia");
}

function abrirModalAvaliacao() {
    if (banco.cursos.length === 0) {
        alert("Cadastre um curso antes de registrar avaliações.");
        return;
    }
    const form = document.getElementById("formAvaliacao");
    if (form) form.reset();

    atualizarSelectCursos();

    const sat = document.getElementById("ativarSatisfacao");
    const min = document.getElementById("ativarMinistrantes");
    const org = document.getElementById("ativarOrganizacao");

    if (sat) sat.checked = true;
    if (min) min.checked = true;
    if (org) org.checked = true;

    const divSat = document.getElementById("campoSatisfacao");
    const divMin = document.getElementById("campoMinistrantes");
    const divOrg = document.getElementById("campoOrganizacao");

    if (divSat) divSat.style.display = "block";
    if (divMin) divMin.style.display = "block";
    if (divOrg) divOrg.style.display = "block";

    const notasMin = document.getElementById("notasMinistrantes");
    if (notasMin) {
        notasMin.innerHTML = "";
        adicionarNotaMinistrante();
    }

    abrirModal("modalAvaliacao");
}

function validarSomaVotos(respostas, n1, n2, n3, n4, n5, categoriaNome) {
    const soma = n1 + n2 + n3 + n4 + n5;
    if (soma !== respostas) {
        alert(`A soma dos votos em "${categoriaNome}" (${soma}) é diferente do total de respostas informado (${respostas}). Corrija antes de salvar.`);
        return false;
    }
    return true;
}

function adicionarMinistranteAoCurso() {
    const select = document.getElementById("cursoMinistranteSelect");
    if (!select) return;
    const ministranteId = select.value;

    if (!ministranteId) { alert("Selecione um ministrante."); return; }
    if (ministrantesDoCurso.includes(ministranteId)) { alert("Esse ministrante já foi adicionado."); return; }

    ministrantesDoCurso.push(ministranteId);
    mostrarMinistrantesDoCurso();
}

function mostrarMinistrantesDoCurso() {
    const area = document.getElementById("selecionadosMinistrantes");
    if (!area) return;
    area.innerHTML = "";

    if (ministrantesDoCurso.length === 0) {
        area.innerHTML = `<span style="color:#94a3b8; font-size:12px;">Nenhum ministrante selecionado.</span>`;
        return;
    }

    ministrantesDoCurso.forEach(id => {
        const m = banco.ministrantes.find(item => item.id === id);
        if (!m) return;
        const tag = document.createElement("div");
        tag.className = "selected-tag";
        tag.innerHTML = `${escaparHTML(m.nome)} <button type="button" onclick="removerMinistranteDoCurso('${id}')">×</button>`;
        area.appendChild(tag);
    });
}

function removerMinistranteDoCurso(id) {
    ministrantesDoCurso = ministrantesDoCurso.filter(item => item !== id);
    mostrarMinistrantesDoCurso();
}

function adicionarNotaMinistrante() {
    const area = document.getElementById("notasMinistrantes");
    if (!area) return;

    const linha = document.createElement("div");
    linha.className = "form-row nota-ministrante";
    linha.style.marginBottom = "10px";
    linha.style.width = "100%";

    let opcoes = '<option value="">Selecione o Ministrante</option>';
    banco.ministrantes.forEach(m => {
        opcoes += `<option value="${m.id}">${escaparHTML(m.nome)}</option>`;
    });

    linha.innerHTML = `
        <div class="ministrante-avaliacao-item" style="border: 1px solid #e5e7eb; padding: 10px; border-radius: 8px; width: 100%;">
            <select class="nota-ministrante-nome" required style="margin-bottom: 10px; width: 100%;">${opcoes}</select>
            <div class="votes-input-group" style="margin-bottom: 0;">
                <div class="vote-col"><label>⭐ 1</label><input type="number" class="min-n1" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐ 2</label><input type="number" class="min-n2" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐ 3</label><input type="number" class="min-n3" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐⭐ 4</label><input type="number" class="min-n4" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐⭐⭐ 5</label><input type="number" class="min-n5" min="0" placeholder="0"></div>
            </div>
        </div>
    `;
    area.appendChild(linha);
}

function adicionarMinistranteCadastrarAvaliacao() {
    const select = document.getElementById("cadMinSelect");
    if (!select) return;
    const id = select.value;

    if (!id) { alert("Selecione um ministrante."); return; }
    if (ministrantesCadastrarAvaliacao.includes(id)) { alert("Este ministrante já foi selecionado."); return; }

    ministrantesCadastrarAvaliacao.push(id);
    mostrarMinistrantesCadastrarAvaliacao();
    renderizarCamposNotasMinistrantesCad();
}

function removerMinistranteCadastrarAvaliacao(id) {
    ministrantesCadastrarAvaliacao = ministrantesCadastrarAvaliacao.filter(item => item !== id);
    mostrarMinistrantesCadastrarAvaliacao();
    renderizarCamposNotasMinistrantesCad();
}

function mostrarMinistrantesCadastrarAvaliacao() {
    const area = document.getElementById("selecionadosCadMinistrantes");
    if (!area) return;
    area.innerHTML = "";

    if (ministrantesCadastrarAvaliacao.length === 0) {
        area.innerHTML = `<span style="color:#94a3b8; font-size:12px;">Nenhum ministrante selecionado.</span>`;
        return;
    }

    ministrantesCadastrarAvaliacao.forEach(id => {
        const m = banco.ministrantes.find(item => item.id === id);
        if (!m) return;
        const tag = document.createElement("div");
        tag.className = "selected-tag";
        tag.innerHTML = `${escaparHTML(m.nome)} <button type="button" onclick="removerMinistranteCadastrarAvaliacao('${id}')">×</button>`;
        area.appendChild(tag);
    });
}

function renderizarCamposNotasMinistrantesCad() {
    const container = document.getElementById("cadNotasMinistrantesContainer");
    if (!container) return;
    container.innerHTML = "";

    if (ministrantesCadastrarAvaliacao.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8; font-size:13px;">Selecione ministrantes no Bloco 2 para atribuir votos.</p>`;
        return;
    }

    ministrantesCadastrarAvaliacao.forEach(mId => {
        const m = banco.ministrantes.find(item => item.id === mId);
        if (!m) return;
        const div = document.createElement("div");
        div.className = "ministrante-cad-item";
        div.dataset.ministranteId = mId;
        div.style.cssText = "border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #fafafa;";
        div.innerHTML = `
            <strong style="display:block; margin-bottom: 8px; color: #1e293b;">${escaparHTML(m.nome)}</strong>
            <div class="votes-input-group" style="margin-bottom: 0;">
                <div class="vote-col"><label>⭐ 1</label><input type="number" class="cmin-n1" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐ 2</label><input type="number" class="cmin-n2" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐ 3</label><input type="number" class="cmin-n3" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐⭐ 4</label><input type="number" class="cmin-n4" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐⭐⭐ 5</label><input type="number" class="cmin-n5" min="0" placeholder="0"></div>
            </div>
        `;
        container.appendChild(div);
    });
}

function resetarFormularioCadastrarAvaliacao() {
    const form = document.getElementById("formCadastrarAvaliacaoCompleta");
    if (form) form.reset();
    ministrantesCadastrarAvaliacao = [];
    mostrarMinistrantesCadastrarAvaliacao();
    renderizarCamposNotasMinistrantesCad();
}

function adicionarMinistranteAoEditarCurso() {
    const select = document.getElementById("editarCursoMinistranteSelect");
    if (!select) return;
    const id = select.value;

    if (!id) { alert("Selecione um ministrante."); return; }
    if (ministrantesEditarCurso.includes(id)) { alert("Este ministrante já foi adicionado."); return; }

    ministrantesEditarCurso.push(id);
    mostrarMinistrantesEditarCurso();
    renderizarCamposNotasMinistrantesEditar();
}

function removerMinistranteEditarCurso(id) {
    ministrantesEditarCurso = ministrantesEditarCurso.filter(item => item !== id);
    mostrarMinistrantesEditarCurso();
    renderizarCamposNotasMinistrantesEditar();
}

function mostrarMinistrantesEditarCurso() {
    const area = document.getElementById("selecionadosEditarMinistrantes");
    if (!area) return;
    area.innerHTML = "";

    if (ministrantesEditarCurso.length === 0) {
        area.innerHTML = `<span style="color:#94a3b8; font-size:12px;">Nenhum ministrante selecionado.</span>`;
        return;
    }

    ministrantesEditarCurso.forEach(id => {
        const m = banco.ministrantes.find(item => item.id === id);
        if (!m) return;
        const tag = document.createElement("div");
        tag.className = "selected-tag";
        tag.innerHTML = `${escaparHTML(m.nome)} <button type="button" onclick="removerMinistranteEditarCurso('${id}')">×</button>`;
        area.appendChild(tag);
    });
}

function renderizarCamposNotasMinistrantesEditar(avaliacaoExistente) {
    const container = document.getElementById("editarNotasMinistrantesContainer");
    if (!container) return;
    container.innerHTML = "";

    if (ministrantesEditarCurso.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8; font-size:13px;">Selecione ministrantes para atribuir votos.</p>`;
        return;
    }

    ministrantesEditarCurso.forEach(mId => {
        const m = banco.ministrantes.find(item => item.id === mId);
        if (!m) return;
        let notaSalva = 0;
        if (avaliacaoExistente && avaliacaoExistente.ministrantes) {
            const itemM = avaliacaoExistente.ministrantes.find(i => i.ministranteId === mId);
            if (itemM) notaSalva = itemM.nota || 0;
        }

        const div = document.createElement("div");
        div.className = "ministrante-edt-item";
        div.dataset.ministranteId = mId;
        div.style.cssText = "border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; margin-bottom: 12px; background: #fafafa;";
        div.innerHTML = `
            <strong style="display:block; margin-bottom: 4px; color: #1e293b;">${escaparHTML(m.nome)}</strong>
            <div style="font-size: 12px; color: #4f46e5; margin-bottom: 8px;">Nota Registrada: <strong>${formatarNota(notaSalva)}</strong></div>
            <div class="votes-input-group" style="margin-bottom: 0;">
                <div class="vote-col"><label>⭐ 1</label><input type="number" class="emin-n1" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐ 2</label><input type="number" class="emin-n2" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐ 3</label><input type="number" class="emin-n3" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐⭐ 4</label><input type="number" class="emin-n4" min="0" placeholder="0"></div>
                <div class="vote-col"><label>⭐⭐⭐⭐⭐ 5</label><input type="number" class="emin-n5" min="0" placeholder="0"></div>
            </div>
        `;
        container.appendChild(div);
    });
}

function abrirEditarCurso(id) {
    const curso = banco.cursos.find(c => c.id === id);
    if (!curso) return;

    const avaliacao = banco.avaliacoes.find(a => a.cursoId === id);

    const selectGerencia = document.getElementById("editarCursoGerencia");
    if (selectGerencia) {
        selectGerencia.innerHTML = "";
        banco.gerencias.forEach(g => {
            selectGerencia.innerHTML += `<option value="${g.id}">${escaparHTML(g.nome)}</option>`;
        });
        selectGerencia.value = curso.gerenciaId;
    }

    const selectMinistrante = document.getElementById("editarCursoMinistranteSelect");
    if (selectMinistrante) {
        selectMinistrante.innerHTML = `<option value="">Selecione um ministrante</option>`;
        banco.ministrantes.forEach(m => {
            selectMinistrante.innerHTML += `<option value="${m.id}">${escaparHTML(m.nome)}</option>`;
        });
    }

    document.getElementById("editarCursoId").value = curso.id;
    document.getElementById("editarCursoNome").value = curso.nome;
    document.getElementById("editarCursoDataInicio").value = curso.dataInicio || curso.data || "";
    document.getElementById("editarCursoDataFim").value = curso.dataFim || curso.data || "";
    document.getElementById("editarCursoInscritos").value = curso.inscritos;
    document.getElementById("editarCursoCertificados").value = curso.certificados;

    ministrantesEditarCurso = [...(curso.ministrantes || [])];
    mostrarMinistrantesEditarCurso();

    if (avaliacao) {
        document.getElementById("editarAvaliacaoRespostas").value = avaliacao.respostas || "";
        document.getElementById("editarAtivarSat").checked = avaliacao.satisfacao !== null;
        document.getElementById("editarAtivarMin").checked = avaliacao.ministrantes && avaliacao.ministrantes.length > 0;
        document.getElementById("editarAtivarOrg").checked = avaliacao.organizacao !== null;
        document.getElementById("edtSatMediaCalc").textContent = formatarNota(avaliacao.satisfacao);
        document.getElementById("edtOrgMediaCalc").textContent = formatarNota(avaliacao.organizacao);
    }

    renderizarCamposNotasMinistrantesEditar(avaliacao);
    abrirModal("modalEditarCurso");
}

function atualizarSelectGerencias() {
    const selects = [
        document.getElementById("cursoGerencia"), 
        document.getElementById("cadCursoGerencia")
    ];

    selects.forEach(select => {
        if (!select) return;

        if (banco.gerencias.length === 0) {
            select.innerHTML = `<option value="">Cadastre uma gerência primeiro</option>`;
            return;
        }

        select.innerHTML = `<option value="">Selecione uma gerência</option>`;
        banco.gerencias.forEach(g => {
            select.innerHTML += `<option value="${g.id}">${escaparHTML(g.nome)}</option>`;
        });
    });
}

function atualizarSelectMinistrantes() {
    const selects = [
        document.getElementById("cursoMinistranteSelect"), 
        document.getElementById("cadMinSelect"),
        document.getElementById("editarCursoMinistranteSelect")
    ];

    selects.forEach(select => {
        if (!select) return;

        if (banco.ministrantes.length === 0) {
            select.innerHTML = `<option value="">Cadastre um ministrante primeiro</option>`;
            return;
        }

        select.innerHTML = `<option value="">Selecione um ministrante</option>`;
        banco.ministrantes.forEach(m => {
            select.innerHTML += `<option value="${m.id}">${escaparHTML(m.nome)}</option>`;
        });
    });
}

function atualizarSelectCursos() {
    const selects = [
        document.getElementById("avaliacaoCurso"),
        document.getElementById("comentCursoSelect")
    ];

    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = `<option value="">Selecione um curso</option>`;
        banco.cursos.forEach(c => {
            select.innerHTML += `<option value="${c.id}">${escaparHTML(c.nome)}</option>`;
        });
    });
}

function encontrarCurso(id) { return banco.cursos.find(c => c.id === id); }
function encontrarGerencia(id) { return banco.gerencias.find(g => g.id === id); }
function encontrarMinistrante(id) { return banco.ministrantes.find(m => m.id === id); }

function calcularMediaPonderada(valores) {
    const validos = valores.filter(i => i.nota !== null && !isNaN(i.nota) && i.respostas > 0);
    if (validos.length === 0) return null;

    let somaNotas = 0;
    let totalRespostas = 0;

    validos.forEach(i => {
        somaNotas += i.nota * i.respostas;
        totalRespostas += i.respostas;
    });

    if (totalRespostas === 0) return null;
    return somaNotas / totalRespostas;
}

function mediaDoCurso(cursoId, categoria) {
    const avaliacoes = banco.avaliacoes.filter(a => a.cursoId === cursoId);
    const valores = [];

    avaliacoes.forEach(a => {
        if (categoria === "satisfacao" && a.satisfacao !== null) {
            valores.push({ nota: a.satisfacao, respostas: a.respostas });
        }
        if (categoria === "organizacao" && a.organizacao !== null) {
            valores.push({ nota: a.organizacao, respostas: a.respostas });
        }
        if (categoria === "ministrantes" && a.ministrantes) {
            a.ministrantes.forEach(m => {
                valores.push({ nota: m.nota, respostas: a.respostas });
            });
        }
    });

    return calcularMediaPonderada(valores);
}

function mediaGeralDoCurso(cursoId) {
    const notas = [];
    const sat = mediaDoCurso(cursoId, "satisfacao");
    const min = mediaDoCurso(cursoId, "ministrantes");
    const org = mediaDoCurso(cursoId, "organizacao");

    if (sat !== null) notas.push(sat);
    if (min !== null) notas.push(min);
    if (org !== null) notas.push(org);

    if (notas.length === 0) return null;
    return notas.reduce((t, n) => t + n, 0) / notas.length;
}

function mediaDoMinistrante(ministranteId) {
    const valores = [];
    banco.avaliacoes.forEach(a => {
        if (a.ministrantes) {
            a.ministrantes.forEach(m => {
                if (m.ministranteId === ministranteId) {
                    valores.push({ nota: m.nota, respostas: a.respostas });
                }
            });
        }
    });
    return calcularMediaPonderada(valores);
}

function mediaDaGerencia(gerenciaId) {
    const cursos = banco.cursos.filter(c => c.gerenciaId === gerenciaId);
    const valores = [];

    cursos.forEach(c => {
        const media = mediaGeralDoCurso(c.id);
        if (media === null) return;

        const respostas = banco.avaliacoes
            .filter(a => a.cursoId === c.id)
            .reduce((t, a) => t + Number(a.respostas), 0);

        if (respostas > 0) {
            valores.push({ nota: media, respostas: respostas });
        }
    });

    return calcularMediaPonderada(valores);
}

function formatarNota(nota) {
    if (nota === null || nota === undefined || isNaN(nota)) return "—";
    return Number(nota).toFixed(2).replace(".", ",");
}

function formatarPeriodo(curso) {
    if (curso.dataInicio && curso.dataFim) {
        return formatarData(curso.dataInicio) + " até " + formatarData(curso.dataFim);
    } else if (curso.data) {
        return formatarData(curso.data); 
    }
    return "—";
}

function formatarData(data) {
    if (!data) return "—";
    const partes = data.split("-");
    if (partes.length !== 3) return data;
    return partes[2] + "/" + partes[1] + "/" + partes[0];
}

function obterDataMaisRecenteLancamento() {
    let datas = [];
    banco.cursos.forEach(c => {
        if (c.dataFim) datas.push(c.dataFim);
        else if (c.dataInicio) datas.push(c.dataInicio);
        else if (c.data) datas.push(c.data);
    });
    if (datas.length === 0) return formatarData(new Date().toISOString().substring(0, 10));
    datas.sort().reverse();
    return formatarData(datas[0]);
}

function atualizarSistema() {
    atualizarSelectGerencias();
    atualizarSelectMinistrantes();
    atualizarSelectCursos();
    popularSeletorMesVisaoGeral();
    renderizarVisaoGeral();
    popularSeletorMesCursos();
    mostrarCursosCards();
    renderizarAbaMinistrantes();
    renderizarAbaAvaliacoes();
    renderizarAbaGerencias();
    popularSeletorMeses();
    renderizarGraficoEvolucao();
}

function popularSeletorMesVisaoGeral() {
    const select = document.getElementById("seletorMesVisaoGeral");
    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = "";

    const mesesSet = new Set();
    banco.cursos.forEach(c => {
        const dataRef = c.dataInicio || c.data;
        if (dataRef) mesesSet.add(dataRef.substring(0, 7));
    });

    const mesesOrdenados = Array.from(mesesSet).sort().reverse();
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    if (mesesOrdenados.length === 0) {
        select.innerHTML = `<option value="">Nenhum mês</option>`;
        return;
    }

    mesesOrdenados.forEach(mA => {
        const [ano, mes] = mA.split("-");
        const nomeFormatado = `${nomesMeses[parseInt(mes) - 1]} ${ano}`;
        select.innerHTML += `<option value="${mA}">${nomeFormatado}</option>`;
    });

    select.value = valorAtual || mesFiltroVisaoGeral || mesesOrdenados[0] || "";
    mesFiltroVisaoGeral = select.value;
}

function renderizarVisaoGeral() {
    const mesSel = mesFiltroVisaoGeral;
    const dataUltima = obterDataMaisRecenteLancamento();

    document.getElementById("tituloNotasTotaisData").textContent = `NOTAS TOTAIS (ANO ATÉ: ${dataUltima})`;

    const cursosMes = banco.cursos.filter(c => {
        const dataRef = c.dataInicio || c.data;
        return dataRef && dataRef.startsWith(mesSel);
    });

    let satMesArr = [], minMesArr = [], orgMesArr = [];
    cursosMes.forEach(c => {
        const sat = mediaDoCurso(c.id, "satisfacao");
        const min = mediaDoCurso(c.id, "ministrantes");
        const org = mediaDoCurso(c.id, "organizacao");
        if (sat !== null) satMesArr.push(sat);
        if (min !== null) minMesArr.push(min);
        if (org !== null) orgMesArr.push(org);
    });

    const calcAvg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    document.getElementById("vgSatMes").textContent = formatarNota(calcAvg(satMesArr));
    document.getElementById("vgMinMes").textContent = formatarNota(calcAvg(minMesArr));
    document.getElementById("vgOrgMes").textContent = formatarNota(calcAvg(orgMesArr));

    const areaGerMes = document.getElementById("vgResumoGerenciaMes");
    if (areaGerMes) {
        areaGerMes.innerHTML = banco.gerencias.map(g => {
            const cursosG = cursosMes.filter(c => c.gerenciaId === g.id);
            let notas = [];
            cursosG.forEach(c => {
                const m = mediaGeralDoCurso(c.id);
                if (m !== null) notas.push(m);
            });
            return `
                <div class="score-row">
                    <span>${escaparHTML(g.nome)}</span>
                    <strong>${formatarNota(calcAvg(notas))}</strong>
                </div>
            `;
        }).join("");
    }

    document.getElementById("vgTotalCursos").textContent = banco.cursos.length;
    
    const minUnicos = new Set();
    banco.cursos.forEach(c => (c.ministrantes || []).forEach(m => minUnicos.add(m)));
    document.getElementById("vgTotalMinistrantes").textContent = minUnicos.size;

    const gerGDAG = banco.gerencias.find(g => g.nome.toUpperCase().includes("GDAG"));
    const gerGEE = banco.gerencias.find(g => g.nome.toUpperCase().includes("GEE"));

    document.getElementById("vgCursosGDAG").textContent = gerGDAG ? banco.cursos.filter(c => c.gerenciaId === gerGDAG.id).length : 0;
    document.getElementById("vgCursosGEE").textContent = gerGEE ? banco.cursos.filter(c => c.gerenciaId === gerGEE.id).length : 0;

    const totalResp = banco.avaliacoes.reduce((t, a) => t + Number(a.respostas || 0), 0);
    document.getElementById("vgTotalAvaliacoes").textContent = totalResp;

    let satAcum = [], minAcum = [], orgAcum = [];
    banco.cursos.forEach(c => {
        const sat = mediaDoCurso(c.id, "satisfacao");
        const min = mediaDoCurso(c.id, "ministrantes");
        const org = mediaDoCurso(c.id, "organizacao");
        if (sat !== null) satAcum.push(sat);
        if (min !== null) minAcum.push(min);
        if (org !== null) orgAcum.push(org);
    });

    const satFinal = calcAvg(satAcum);
    const minFinal = calcAvg(minAcum);
    const orgFinal = calcAvg(orgAcum);

    document.getElementById("vgSatAcumulado").textContent = formatarNota(satFinal);
    document.getElementById("vgMinAcumulado").textContent = formatarNota(minFinal);
    document.getElementById("vgOrgAcumulado").textContent = formatarNota(orgFinal);

    const areaGerAcum = document.getElementById("vgGerenciasAcumulado");
    let notaGDAG = null, notaGEE = null;
    if (areaGerAcum) {
        areaGerAcum.innerHTML = banco.gerencias.map(g => {
            const m = mediaDaGerencia(g.id);
            if (gerGDAG && g.id === gerGDAG.id) notaGDAG = m;
            if (gerGEE && g.id === gerGEE.id) notaGEE = m;
            return `
                <div class="score-row">
                    <span>${escaparHTML(g.nome)}</span>
                    <strong>${formatarNota(m)}</strong>
                </div>
            `;
        }).join("");
    }

    const canvas = document.getElementById("graficoBarrasVisaoGeral");
    if (canvas && typeof Chart !== "undefined") {
        const ctx = canvas.getContext("2d");
        if (meuGraficoBarrasVisaoGeral) meuGraficoBarrasVisaoGeral.destroy();

        meuGraficoBarrasVisaoGeral = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Satisfação', 'Ministrantes', 'Organização', 'GDAG', 'GEE'],
                datasets: [{
                    label: 'Média Acumulada',
                    data: [satFinal || 0, minFinal || 0, orgFinal || 0, notaGDAG || 0, notaGEE || 0],
                    backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { min: 1, max: 5 } },
                plugins: { legend: { display: false } }
            }
        });
    }
}

function popularSeletorMesCursos() {
    const select = document.getElementById("seletorMesCursos");
    if (!select) return;

    const valorAtual = select.value;
    select.innerHTML = `<option value="">Todos os meses</option>`;

    const mesesSet = new Set();
    banco.cursos.forEach(c => {
        const dataRef = c.dataInicio || c.data;
        if (dataRef) mesesSet.add(dataRef.substring(0, 7));
    });

    const mesesOrdenados = Array.from(mesesSet).sort().reverse();
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    mesesOrdenados.forEach(mA => {
        const [ano, mes] = mA.split("-");
        const nomeFormatado = `${nomesMeses[parseInt(mes) - 1]} ${ano}`;
        select.innerHTML += `<option value="${mA}">${nomeFormatado}</option>`;
    });

    select.value = valorAtual || mesFiltroCursos || "";
}

function mostrarCursosCards() {
    const area = document.getElementById("listaCursosCards");
    if (!area) return;

    let lista = [...banco.cursos];
    if (mesFiltroCursos) {
        lista = lista.filter(c => {
            const dataRef = c.dataInicio || c.data;
            return dataRef && dataRef.startsWith(mesFiltroCursos);
        });
    }

    if (lista.length === 0) {
        area.innerHTML = `<div class="empty-state">Nenhum curso encontrado.</div>`;
        return;
    }

    area.innerHTML = lista.map(curso => {
        const gerencia = encontrarGerencia(curso.gerenciaId);
        const nomesMin = (curso.ministrantes || [])
            .map(id => encontrarMinistrante(id))
            .filter(Boolean)
            .map(i => i.nome)
            .join(", ");

        const avaliacao = banco.avaliacoes.find(a => a.cursoId === curso.id);
        const respostas = avaliacao ? avaliacao.respostas : "—";
        const media = mediaGeralDoCurso(curso.id);

        return `
            <div class="course-card-unit">
                <div class="course-card-header">
                    <div>
                        <h2 class="course-card-title">${escaparHTML(curso.nome)}</h2>
                        <span class="course-card-subtitle">MÉDIA DO CURSO</span>
                    </div>

                    <div class="course-metrics-group">
                        <div class="metric-box">
                            <span class="metric-box-label">Gerência:</span>
                            <strong class="metric-box-value">${gerencia ? escaparHTML(gerencia.nome) : "—"}</strong>
                        </div>
                        <div class="metric-box">
                            <span class="metric-box-label">Média (Escala 1 a 5)</span>
                            <strong class="metric-box-value highlight">${formatarNota(media)}</strong>
                        </div>
                        <div class="metric-box">
                            <span class="metric-box-label">Inscritos:</span>
                            <strong class="metric-box-value">${curso.inscritos}</strong>
                        </div>
                        <div class="metric-box">
                            <span class="metric-box-label">Certificados:</span>
                            <strong class="metric-box-value">${curso.certificados}</strong>
                        </div>
                        <div class="metric-box">
                            <span class="metric-box-label">Respostas:</span>
                            <strong class="metric-box-value">${respostas}</strong>
                        </div>
                    </div>
                </div>

                <div class="course-card-details">
                    <strong style="display:block; margin-bottom: 5px; color:#1e293b;">Detalhes do Curso</strong>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569;">
                        <div><span>Ministrantes:</span> <strong>${escaparHTML(nomesMin || "Nenhum")}</strong></div>
                        <div><span>Data:</span> <strong>${formatarPeriodo(curso)}</strong></div>
                    </div>
                </div>

                <div class="course-card-actions">
                    <button type="button" class="action-btn edit-btn" onclick="abrirEditarCurso('${curso.id}')">✎ Editar</button>
                    <button type="button" class="action-btn delete-btn" onclick="excluirCurso('${curso.id}')">🗑 Excluir</button>
                </div>
            </div>
        `;
    }).join("");
}

// NOVA FUNÇÃO: Excluir Ministrante
function excluirMinistrante(id) {
    const m = encontrarMinistrante(id);
    if (!m) return;
    
    // Verifica se o ministrante está em algum curso
    const cursosVinculados = banco.cursos.filter(c => (c.ministrantes || []).includes(id));
    
    if (cursosVinculados.length > 0) {
        const nomesCursos = cursosVinculados.map(c => c.nome).join(', ');
        if (!confirm(`O ministrante "${m.nome}" está vinculado ao(s) curso(s): ${nomesCursos}.\n\nTem certeza que deseja excluí-lo? (Ele será removido desses cursos e das notas de avaliação)`)) {
            return;
        }
    } else {
        if (!confirm(`Tem certeza que deseja excluir o ministrante "${m.nome}" permanentemente?`)) return;
    }

    // Remove do banco de ministrantes
    banco.ministrantes = banco.ministrantes.filter(item => item.id !== id);
    
    // Remove das listas dos cursos
    banco.cursos.forEach(c => {
        if (c.ministrantes) {
            c.ministrantes = c.ministrantes.filter(mId => mId !== id);
        }
    });
    
    // Remove das avaliações cadastradas
    banco.avaliacoes.forEach(a => {
        if (a.ministrantes) {
            a.ministrantes = a.ministrantes.filter(mItem => mItem.ministranteId !== id);
        }
    });

    // Limpa das seleções ativas (se o usuário estiver cadastrando/editando no momento)
    ministrantesDoCurso = ministrantesDoCurso.filter(mId => mId !== id);
    ministrantesCadastrarAvaliacao = ministrantesCadastrarAvaliacao.filter(mId => mId !== id);
    ministrantesEditarCurso = ministrantesEditarCurso.filter(mId => mId !== id);
    
    mostrarMinistrantesDoCurso();
    mostrarMinistrantesCadastrarAvaliacao();
    mostrarMinistrantesEditarCurso();

    salvarBanco();
    atualizarSistema();
}

function renderizarAbaMinistrantes() {
    const canvas = document.getElementById("graficoEvolucaoGeralMinistrantes");
    if (canvas && typeof Chart !== "undefined") {
        const ctx = canvas.getContext("2d");

        const dadosMensais = {};
        banco.cursos.forEach(c => {
            const dataRef = c.dataInicio || c.data;
            if (!dataRef) return;
            const mA = dataRef.substring(0, 7);
            if (!dadosMensais[mA]) dadosMensais[mA] = [];
            const minMedia = mediaDoCurso(c.id, "ministrantes");
            if (minMedia !== null) dadosMensais[mA].push(minMedia);
        });

        const meses = Object.keys(dadosMensais).sort();
        const nomesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const labels = [], valores = [];

        meses.forEach(mA => {
            const [ano, mes] = mA.split("-");
            labels.push(`${nomesAbrev[parseInt(mes) - 1]}`);
            const avg = dadosMensais[mA].length ? (dadosMensais[mA].reduce((a, b) => a + b, 0) / dadosMensais[mA].length).toFixed(2) : null;
            valores.push(avg);
        });

        if (meuGraficoEvolucaoGeralMin) meuGraficoEvolucaoGeralMin.destroy();
        meuGraficoEvolucaoGeralMin = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels.length ? labels : ["Sem dados"],
                datasets: [{ label: 'Média Ministrantes', data: valores, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.3 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5 } } }
        });
    }

    const rankingArea = document.getElementById("rankingMinistrantesLista");
    if (rankingArea) {
        const listaRank = banco.ministrantes.map(m => {
            return { id: m.id, nome: m.nome, media: mediaDoMinistrante(m.id) };
        }).sort((a, b) => (b.media || 0) - (a.media || 0));

        if (listaRank.length === 0) {
            rankingArea.innerHTML = `<div class="empty-state">Nenhum ministrante cadastrado.</div>`;
        } else {
            rankingArea.innerHTML = listaRank.map((item, index) => `
                <div class="ranking-item">
                    <div class="ranking-number">${index + 1}</div>
                    <div style="flex:1;">
                        <strong>${escaparHTML(item.nome)}</strong>
                        <div style="font-size: 11px; color:#64748b;">Ranking: #${index + 1}</div>
                    </div>
                    <div class="ranking-score">${formatarNota(item.media)}</div>
                </div>
            `).join("");
        }
    }

    const areaCards = document.getElementById("listaMinistrantesCards");
    if (areaCards) {
        if (banco.ministrantes.length === 0) {
            areaCards.innerHTML = `<div class="empty-state">Nenhum ministrante cadastrado.</div>`;
            return;
        }

        areaCards.innerHTML = banco.ministrantes.map(m => {
            const cursosM = banco.cursos.filter(c => (c.ministrantes || []).includes(m.id));
            const media = mediaDoMinistrante(m.id);

            return `
                <div class="ministrante-expand-card" id="cardMin-${m.id}">
                    <div class="ministrante-card-header-clickable" onclick="toggleExpandMinistrante('${m.id}')">
                        <div>
                            <strong style="font-size: 15px; color: #1e293b;">${escaparHTML(m.nome)} ∨</strong>
                            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Nota Geral: <strong>${formatarNota(media)}</strong></div>
                            <div style="font-size: 12px; color: #64748b;">Cursos Vinculados: ${cursosM.length}</div>
                        </div>
                        <div style="font-size: 20px; font-weight: 700; color: #4f46e5;">${formatarNota(media)}</div>
                    </div>

                    <div class="ministrante-card-details-body" id="detailsMin-${m.id}" style="display:none; padding: 12px; border-top: 1px solid #e2e8f0; background: #f8fafc;">
                        <strong style="font-size: 12px; color: #475569; display: block; margin-bottom: 8px;">Cursos Ministrados e Notas:</strong>
                        ${cursosM.length === 0 ? '<span style="font-size:12px; color:#94a3b8;">Nenhum curso associado.</span>' : 
                            cursosM.map(c => {
                                const av = banco.avaliacoes.find(a => a.cursoId === c.id);
                                let notaC = "—";
                                if (av && av.ministrantes) {
                                    const itemM = av.ministrantes.find(i => i.ministranteId === m.id);
                                    if (itemM) notaC = formatarNota(itemM.nota);
                                }
                                return `
                                    <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px dashed #cbd5e1;">
                                        <span>${escaparHTML(c.nome)}</span>
                                        <strong>Nota: ${notaC}</strong>
                                    </div>
                                `;
                            }).join("")
                        }
                        
                        <!-- BOTÃO DE EXCLUIR O MINISTRANTE ADICIONADO AQUI -->
                        <div style="margin-top: 12px; border-top: 1px dashed #cbd5e1; padding-top: 12px; text-align: right;">
                            <button type="button" class="action-btn delete-btn" style="padding: 6px 12px; font-size: 12px;" onclick="excluirMinistrante('${m.id}')">🗑 Excluir Ministrante</button>
                        </div>

                    </div>
                </div>
            `;
        }).join("");
    }
}

function toggleExpandMinistrante(id) {
    const el = document.getElementById(`detailsMin-${id}`);
    if (el) {
        el.style.display = el.style.display === "none" ? "block" : "none";
    }
}

function renderizarAbaAvaliacoes() {
    const totalRespMin = banco.avaliacoes.reduce((t, a) => t + (a.ministrantes ? Number(a.respostas || 0) : 0), 0);
    document.getElementById("avMinTotalRespostas").textContent = totalRespMin;

    const minNotasAll = [];
    banco.avaliacoes.forEach(a => { if (a.ministrantes) a.ministrantes.forEach(m => minNotasAll.push({ nota: m.nota, respostas: a.respostas })); });
    document.getElementById("avMinNotaGeral").textContent = formatarNota(calcularMediaPonderada(minNotasAll));

    const tbNomes = document.getElementById("tabelaAvMinistrantesNomes");
    if (tbNomes) {
        tbNomes.innerHTML = `
            <table>
                <thead><tr><th>Ministrante</th><th style="text-align:right;">Satisfação / Nota</th></tr></thead>
                <tbody>
                    ${banco.ministrantes.map(m => `
                        <tr>
                            <td>${escaparHTML(m.nome)}</td>
                            <td style="text-align:right;"><strong>${formatarNota(mediaDoMinistrante(m.id))}</strong></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    }

    const cardsMensalMin = document.getElementById("cardsAvMinistrantesMensal");
    if (cardsMensalMin) {
        const dadosM = {};
        banco.cursos.forEach(c => {
            const dataRef = c.dataInicio || c.data;
            if (!dataRef) return;
            const mA = dataRef.substring(0, 7);
            if (!dadosM[mA]) dadosM[mA] = { minSet: new Set(), notas: [] };
            (c.ministrantes || []).forEach(m => dadosM[mA].minSet.add(m));
            const minM = mediaDoCurso(c.id, "ministrantes");
            if (minM !== null) dadosM[mA].notas.push(minM);
        });

        const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        cardsMensalMin.innerHTML = Object.keys(dadosM).sort().reverse().map(mA => {
            const [ano, mes] = mA.split("-");
            const nomeMes = `${nomesMeses[parseInt(mes) - 1]}`;
            const avg = dadosM[mA].notas.length ? (dadosM[mA].notas.reduce((a,b)=>a+b,0)/dadosM[mA].notas.length) : null;
            return `
                <div class="stat-card">
                    <strong>${nomeMes}</strong>
                    <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:12px;">
                        <span>Qtd. Ministrantes: <strong>${dadosM[mA].minSet.size}</strong></span>
                        <span>Nota de Todos: <strong>${formatarNota(avg)}</strong></span>
                    </div>
                </div>
            `;
        }).join("");
    }

    renderizarSubAbaCategoria("sat", "satisfacao", "avSatNotaGeral", "avSatTotalRespostas", "tbSatPorMes", "tbSatPorGerencia", "graficoEvolucaoSat");
    renderizarSubAbaCategoria("org", "organizacao", "avOrgNotaGeral", "avOrgTotalRespostas", "tbOrgPorMes", "tbOrgPorGerencia", "graficoEvolucaoOrg");

    const feed = document.getElementById("feedComentarios");
    if (feed) {
        if (banco.comentarios.length === 0) {
            feed.innerHTML = `<div class="empty-state">Nenhum comentário cadastrado.</div>`;
        } else {
            feed.innerHTML = banco.comentarios.map(c => {
                const curso = encontrarCurso(c.cursoId);
                const ger = curso ? encontrarGerencia(curso.gerenciaId) : null;
                return `
                    <div class="comment-card">
                        <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                            <strong>${curso ? escaparHTML(curso.nome) : "—"}</strong>
                            <small>${c.data || "—"}</small>
                        </div>
                        <div style="font-size:12px; color:#4f46e5; margin-bottom:8px;">Gerência: ${ger ? escaparHTML(ger.nome) : "—"} | Categoria: ${c.tipo || "Geral"}</div>
                        <p style="font-size:13px; color:#334155; margin:0;">${escaparHTML(c.texto)}</p>
                    </div>
                `;
            }).join("");
        }
    }
}

function renderizarSubAbaCategoria(prefixo, categoria, elNota, elResp, elMes, elGer, canvasId) {
    const avalValidas = banco.avaliacoes.filter(a => a[categoria] !== null);
    const totalResp = avalValidas.reduce((t, a) => t + Number(a.respostas || 0), 0);
    const valoresArr = avalValidas.map(a => ({ nota: a[categoria], respostas: a.respostas }));

    document.getElementById(elNota).textContent = formatarNota(calcularMediaPonderada(valoresArr));
    document.getElementById(elResp).textContent = totalResp;

    const dadosM = {};
    banco.cursos.forEach(c => {
        const dataRef = c.dataInicio || c.data;
        if (!dataRef) return;
        const mA = dataRef.substring(0, 7);
        if (!dadosM[mA]) dadosM[mA] = [];
        const mCat = mediaDoCurso(c.id, categoria);
        if (mCat !== null) dadosM[mA].push(mCat);
    });

    const nomesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const areaMes = document.getElementById(elMes);
    if (areaMes) {
        areaMes.innerHTML = Object.keys(dadosM).sort().reverse().map(mA => {
            const [ano, mes] = mA.split("-");
            const avg = dadosM[mA].length ? (dadosM[mA].reduce((a,b)=>a+b,0)/dadosM[mA].length) : null;
            return `<div class="score-row"><span>${nomesAbrev[parseInt(mes)-1]}</span><strong>${formatarNota(avg)}</strong></div>`;
        }).join("");
    }

    const areaGer = document.getElementById(elGer);
    if (areaGer) {
        areaGer.innerHTML = banco.gerencias.map(g => {
            const cursosG = banco.cursos.filter(c => c.gerenciaId === g.id);
            let vals = [];
            cursosG.forEach(c => {
                const mCat = mediaDoCurso(c.id, categoria);
                if (mCat !== null) vals.push(mCat);
            });
            const avg = vals.length ? (vals.reduce((a,b)=>a+b,0)/vals.length) : null;
            return `<div class="score-row"><span>${escaparHTML(g.nome)}</span><strong>${formatarNota(avg)}</strong></div>`;
        }).join("");
    }

    const canvas = document.getElementById(canvasId);
    if (canvas && typeof Chart !== "undefined") {
        const ctx = canvas.getContext("2d");
        const meses = Object.keys(dadosM).sort();
        const labels = [], serie = [];
        meses.forEach(mA => {
            const [ano, mes] = mA.split("-");
            labels.push(nomesAbrev[parseInt(mes)-1]);
            const avg = dadosM[mA].length ? (dadosM[mA].reduce((a,b)=>a+b,0)/dadosM[mA].length).toFixed(2) : null;
            serie.push(avg);
        });

        let chartVar = prefixo === "sat" ? meuGraficoEvolucaoSat : meuGraficoEvolucaoOrg;
        if (chartVar) chartVar.destroy();

        const newChart = new Chart(ctx, {
            type: 'line',
            data: { labels: labels.length ? labels : ["Sem dados"], datasets: [{ label: 'Nota', data: serie, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.1)', fill: true, tension: 0.3 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5 } } }
        });

        if (prefixo === "sat") meuGraficoEvolucaoSat = newChart;
        else meuGraficoEvolucaoOrg = newChart;
    }
}

function renderizarAbaGerencias() {
    const areaCards = document.getElementById("cardsGerenciasConsolidados");
    if (areaCards) {
        if (banco.gerencias.length === 0) {
            areaCards.innerHTML = `<div class="empty-state">Nenhuma gerência cadastrada.</div>`;
        } else {
            areaCards.innerHTML = banco.gerencias.map(g => {
                const cursosG = banco.cursos.filter(c => c.gerenciaId === g.id);
                const mediaG = mediaDaGerencia(g.id);
                return `
                    <div class="management-card">
                        <strong>${escaparHTML(g.nome)}</strong>
                        <div class="management-score">${formatarNota(mediaG)}</div>
                        <span>${cursosG.length} curso(s)</span>
                    </div>
                `;
            }).join("");
        }
    }

    const canvas = document.getElementById("graficoEvolucaoGerenciasLadoALado");
    if (canvas && typeof Chart !== "undefined") {
        const ctx = canvas.getContext("2d");

        const dadosMensais = {};
        banco.cursos.forEach(c => {
            const dataRef = c.dataInicio || c.data;
            if (!dataRef) return;
            const mA = dataRef.substring(0, 7);
            if (!dadosMensais[mA]) dadosMensais[mA] = {};
            const mC = mediaGeralDoCurso(c.id);
            if (mC !== null) {
                if (!dadosMensais[mA][c.gerenciaId]) dadosMensais[mA][c.gerenciaId] = [];
                dadosMensais[mA][c.gerenciaId].push(mC);
            }
        });

        const meses = Object.keys(dadosMensais).sort();
        const nomesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const labels = meses.map(mA => {
            const [ano, mes] = mA.split("-");
            return nomesAbrev[parseInt(mes) - 1];
        });

        const datasets = banco.gerencias.map((g, idx) => {
            const cores = ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981'];
            const valores = meses.map(mA => {
                const arr = dadosMensais[mA][g.id] || [];
                return arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : 0;
            });
            return {
                label: g.nome,
                data: valores,
                backgroundColor: cores[idx % cores.length],
                borderRadius: 4
            };
        });

        if (meuGraficoGerenciasLadoALado) meuGraficoGerenciasLadoALado.destroy();
        meuGraficoGerenciasLadoALado = new Chart(ctx, {
            type: 'bar',
            data: { labels: labels.length ? labels : ["Sem dados"], datasets: datasets },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5 } } }
        });
    }

    const areaCursosG = document.getElementById("metCursosPorGerencia");
    if (areaCursosG) {
        areaCursosG.innerHTML = banco.gerencias.map(g => {
            const count = banco.cursos.filter(c => c.gerenciaId === g.id).length;
            return `<div class="score-row"><span>${escaparHTML(g.nome)}</span><strong>${count}</strong></div>`;
        }).join("");
    }

    const areaAvMinG = document.getElementById("metAvaliacoesEnoMinistrantesPorGerencia");
    if (areaAvMinG) {
        areaAvMinG.innerHTML = banco.gerencias.map(g => {
            const cursosG = banco.cursos.filter(c => c.gerenciaId === g.id);
            const minSet = new Set();
            cursosG.forEach(c => (c.ministrantes || []).forEach(m => minSet.add(m)));
            return `<div class="score-row"><span>${escaparHTML(g.nome)}</span><strong>${minSet.size} Ministrantes</strong></div>`;
        }).join("");
    }

    const tabelaG = document.getElementById("tabelaCursosPorGerenciaHistorico");
    if (tabelaG) {
        tabelaG.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Gerência</th>
                        <th>Curso</th>
                        <th>Satisfação</th>
                        <th>Ministrantes</th>
                        <th>Organização</th>
                        <th>Média do curso</th>
                    </tr>
                </thead>
                <tbody>
                    ${banco.gerencias.map(g => {
                        const cursosG = banco.cursos.filter(c => c.gerenciaId === g.id);
                        if (cursosG.length === 0) {
                            return `<tr><td><strong>${escaparHTML(g.nome)}</strong></td><td colspan="5">Nenhum curso cadastrado.</td></tr>`;
                        }
                        return cursosG.map(c => `
                            <tr>
                                <td>${escaparHTML(g.nome)}</td>
                                <td>${escaparHTML(c.nome)}</td>
                                <td class="rating-number">${formatarNota(mediaDoCurso(c.id, "satisfacao"))}</td>
                                <td class="rating-number">${formatarNota(mediaDoCurso(c.id, "ministrantes"))}</td>
                                <td class="rating-number">${formatarNota(mediaDoCurso(c.id, "organizacao"))}</td>
                                <td class="rating-number">${formatarNota(mediaGeralDoCurso(c.id))}</td>
                            </tr>
                        `).join("");
                    }).join("")}
                </tbody>
            </table>
        `;
    }
}

function popularSeletorMeses() {
    const select = document.getElementById("seletorMesDetalhe");
    if (!select) return;

    select.innerHTML = "";
    const mesesSet = new Set();
    banco.cursos.forEach(c => {
        const dataRef = c.dataInicio || c.data;
        if (dataRef) mesesSet.add(dataRef.substring(0, 7));
    });

    const mesesOrdenados = Array.from(mesesSet).sort().reverse();
    if (mesesOrdenados.length === 0) {
        select.innerHTML = `<option value="">Nenhum mês disponível</option>`;
        return;
    }

    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    mesesOrdenados.forEach(mA => {
        const [ano, mes] = mA.split("-");
        select.innerHTML += `<option value="${mA}">${nomesMeses[parseInt(mes) - 1]} ${ano}</option>`;
    });
}

function renderizarGraficoEvolucao() {
    const canvas = document.getElementById("graficoEvolucaoMensal");
    if (!canvas || typeof Chart === "undefined") return;

    const ctx = canvas.getContext("2d");
    const dadosMensais = {};

    banco.cursos.forEach(curso => {
        const dataRef = curso.dataInicio || curso.data;
        if (!dataRef) return;
        const mA = dataRef.substring(0, 7);
        if (!dadosMensais[mA]) dadosMensais[mA] = [];
        dadosMensais[mA].push(curso.id);
    });

    const meses = Object.keys(dadosMensais).sort();
    const labelsMeses = [];
    const serieMediaGeral = [], serieSatisfacao = [], serieMinistrantes = [], serieOrganizacao = [];
    const nomesAbrev = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    meses.forEach(mA => {
        const [ano, mes] = mA.split("-");
        labelsMeses.push(`${nomesAbrev[parseInt(mes) - 1]}/${ano.substring(2)}`);

        let totalSat = [], totalMin = [], totalOrg = [], totalGeral = [];
        dadosMensais[mA].forEach(cId => {
            const sat = mediaDoCurso(cId, "satisfacao");
            const min = mediaDoCurso(cId, "ministrantes");
            const org = mediaDoCurso(cId, "organizacao");
            const ger = mediaGeralDoCurso(cId);
            if (sat !== null) totalSat.push(sat);
            if (min !== null) totalMin.push(min);
            if (org !== null) totalOrg.push(org);
            if (ger !== null) totalGeral.push(ger);
        });

        const avg = arr => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : null;
        serieMediaGeral.push(avg(totalGeral));
        serieSatisfacao.push(avg(totalSat));
        serieMinistrantes.push(avg(totalMin));
        serieOrganizacao.push(avg(totalOrg));
    });

    if (meuGraficoEvolucao) meuGraficoEvolucao.destroy();
    meuGraficoEvolucao = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labelsMeses.length ? labelsMeses : ["Sem dados"],
            datasets: [
                { label: 'Média Geral', data: serieMediaGeral, borderColor: '#4f46e5', tension: 0.3 },
                { label: 'Satisfação', data: serieSatisfacao, borderColor: '#f59e0b', tension: 0.3 },
                { label: 'Ministrantes', data: serieMinistrantes, borderColor: '#10b981', tension: 0.3 },
                { label: 'Organização', data: serieOrganizacao, borderColor: '#06b6d4', tension: 0.3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 1, max: 5 } } }
    });
}

function verDetalhesDoMes() {
    const select = document.getElementById("seletorMesDetalhe");
    if (!select || !select.value) { alert("Selecione um mês com dados."); return; }

    const mesAno = select.value;
    const [ano, mes] = mesAno.split("-");
    const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    document.getElementById("tituloDetalhamentoMes").textContent = `Detalhamento: ${nomesMeses[parseInt(mes) - 1]} ${ano}`;

    const cursosDoMes = banco.cursos.filter(c => {
        const dataRef = c.dataInicio || c.data;
        return dataRef && dataRef.startsWith(mesAno);
    });

    let sats = [], mins = [], orgs = [], geral = [], gdagNotas = [], geeNotas = [];
    let totalResp = 0, totalCert = 0;
    let minUnicos = new Set();

    cursosDoMes.forEach(c => {
        const sat = mediaDoCurso(c.id, "satisfacao");
        const min = mediaDoCurso(c.id, "ministrantes");
        const org = mediaDoCurso(c.id, "organizacao");
        const ger = mediaGeralDoCurso(c.id);

        if (sat !== null) sats.push(sat);
        if (min !== null) mins.push(min);
        if (org !== null) orgs.push(org);
        if (ger !== null) geral.push(ger);

        const gerObj = encontrarGerencia(c.gerenciaId);
        if (gerObj && ger !== null) {
            const nG = gerObj.nome.toUpperCase();
            if (nG.includes("GDAG")) gdagNotas.push(ger);
            if (nG.includes("GEE")) geeNotas.push(ger);
        }

        const resp = banco.avaliacoes.filter(a => a.cursoId === c.id).reduce((t, a) => t + Number(a.respostas || 0), 0);
        totalResp += resp;
        totalCert += Number(c.certificados || 0);
        (c.ministrantes || []).forEach(m => minUnicos.add(m));
    });

    const calcAvg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    document.getElementById("detMediaGeral").textContent = formatarNota(calcAvg(geral));
    document.getElementById("detSatisfacao").textContent = formatarNota(calcAvg(sats));
    document.getElementById("detMinistrantes").textContent = formatarNota(calcAvg(mins));
    document.getElementById("detOrganizacao").textContent = formatarNota(calcAvg(orgs));
    document.getElementById("detGDAG").textContent = formatarNota(calcAvg(gdagNotas));
    document.getElementById("detGEE").textContent = formatarNota(calcAvg(geeNotas));
    document.getElementById("detCursosRealizados").textContent = cursosDoMes.length;
    document.getElementById("detTotalRespostas").textContent = totalResp;

    let tx = totalCert > 0 ? ((totalResp / totalCert) * 100).toFixed(0) + "%" : "0%";
    document.getElementById("detTaxaResposta").textContent = tx;
    document.getElementById("detTaxaSub").textContent = `${totalCert} Certif. / ${totalResp} Respostas`;
    document.getElementById("detTotalMinistrantes").textContent = minUnicos.size;

    const container = document.getElementById("tabelaCursosMes");
    if (cursosDoMes.length === 0) {
        container.innerHTML = `<p style="color:#94a3b8; font-size:13px;">Nenhum curso realizado neste mês.</p>`;
    } else {
        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nome do Curso</th><th>Nota Curso</th><th>Gerência</th><th>Inscritos</th><th>Certificados</th><th>Respostas</th><th>Taxa %</th>
                    </tr>
                </thead>
                <tbody>
                    ${cursosDoMes.map(c => {
                        const gerObj = encontrarGerencia(c.gerenciaId);
                        const mediaC = mediaGeralDoCurso(c.id);
                        const resp = banco.avaliacoes.filter(a => a.cursoId === c.id).reduce((t, a) => t + Number(a.respostas || 0), 0);
                        const cert = Number(c.certificados || 0);
                        const txc = cert > 0 ? ((resp / cert) * 100).toFixed(0) + "%" : "—";
                        return `
                            <tr>
                                <td><strong>${escaparHTML(c.nome)}</strong></td>
                                <td class="rating-number">${formatarNota(mediaC)}</td>
                                <td>${gerObj ? escaparHTML(gerObj.nome) : "—"}</td>
                                <td>${c.inscritos}</td>
                                <td>${c.certificados}</td>
                                <td>${resp}</td>
                                <td><strong>${txc}</strong></td>
                            </tr>
                        `;
                    }).join("")}
                </tbody>
            </table>
        `;
    }

    document.getElementById("visaoGeralDashboard").style.display = "none";
    document.getElementById("visaoDetalhadaMes").style.display = "block";
}

function voltarParaVisaoGeral() {
    document.getElementById("visaoDetalhadaMes").style.display = "none";
    document.getElementById("visaoGeralDashboard").style.display = "block";
}

function excluirCurso(id) {
    if (!confirm("Tem certeza que deseja excluir este curso?")) return;
    banco.cursos = banco.cursos.filter(c => c.id !== id);
    banco.avaliacoes = banco.avaliacoes.filter(a => a.cursoId !== id);
    salvarBanco();
    atualizarSistema();
}

function escaparHTML(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

document.addEventListener("DOMContentLoaded", function () {
    carregarBanco();

    document.querySelectorAll(".menu-item[data-page]").forEach(btn => {
        btn.addEventListener("click", function () {
            const pag = this.dataset.page;
            document.querySelectorAll(".menu-item[data-page]").forEach(i => i.classList.remove("active"));
            this.classList.add("active");
            document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
            const target = document.getElementById("page-" + pag);
            if (target) target.classList.add("active");
            atualizarSistema();
        });
    });

    document.querySelectorAll(".sub-nav-tab").forEach(btn => {
        btn.addEventListener("click", function () {
            const sub = this.dataset.subpage;
            document.querySelectorAll(".sub-nav-tab").forEach(i => i.classList.remove("active"));
            this.classList.add("active");
            document.querySelectorAll(".sub-page").forEach(p => p.classList.remove("active"));
            const target = document.getElementById("subpage-" + sub);
            if (target) target.classList.add("active");
        });
    });

    const selVisaoGeral = document.getElementById("seletorMesVisaoGeral");
    if (selVisaoGeral) {
        selVisaoGeral.addEventListener("change", function () {
            mesFiltroVisaoGeral = this.value;
            renderizarVisaoGeral();
        });
    }

    const selCursos = document.getElementById("seletorMesCursos");
    if (selCursos) {
        selCursos.addEventListener("change", function () {
            mesFiltroCursos = this.value;
            mostrarCursosCards();
        });
    }

    const formComent = document.getElementById("formAdicionarComentario");
    if (formComent) {
        formComent.addEventListener("submit", function (e) {
            e.preventDefault();
            const cursoId = document.getElementById("comentCursoSelect").value;
            const tipo = document.getElementById("comentTipoSelect").value;
            const texto = document.getElementById("comentTextoInput").value.trim();

            if (!cursoId || !texto) return;

            banco.comentarios.push({
                id: novoId(),
                cursoId: cursoId,
                tipo: tipo,
                texto: texto,
                data: formatarData(new Date().toISOString().substring(0, 10))
            });

            salvarBanco();
            formComent.reset();
            renderizarAbaAvaliacoes();
            alert("Comentário salvo com sucesso!");
        });
    }

    const formCadCompleta = document.getElementById("formCadastrarAvaliacaoCompleta");
    if (formCadCompleta) {
        formCadCompleta.addEventListener("submit", function (e) {
            e.preventDefault();

            const nome = document.getElementById("cadCursoNome").value.trim();
            const gerenciaId = document.getElementById("cadCursoGerencia").value;
            const dataInicio = document.getElementById("cadCursoDataInicio").value;
            const dataFim = document.getElementById("cadCursoDataFim").value;
            const inscritos = Number(document.getElementById("cadCursoInscritos").value) || 0;
            const certificados = Number(document.getElementById("cadCursoCertificados").value) || 0;
            const respostas = Number(document.getElementById("cadAvaliacaoRespostas").value);

            if (!nome || !gerenciaId || !dataInicio || !dataFim || respostas < 1) {
                alert("Preencha todos os campos obrigatórios."); return;
            }
            if (ministrantesCadastrarAvaliacao.length === 0) {
                alert("Adicione pelo menos um ministrante ao curso no Bloco 2."); return;
            }

            let satisfacao = null, organizacao = null, notasMinistrantes = [];

            if (document.getElementById("cadAtivarSat").checked) {
                let n1 = parseInt(document.getElementById("cadSatNota1").value) || 0;
                let n2 = parseInt(document.getElementById("cadSatNota2").value) || 0;
                let n3 = parseInt(document.getElementById("cadSatNota3").value) || 0;
                let n4 = parseInt(document.getElementById("cadSatNota4").value) || 0;
                let n5 = parseInt(document.getElementById("cadSatNota5").value) || 0;

                if (!validarSomaVotos(respostas, n1, n2, n3, n4, n5, "Satisfação")) return;
                satisfacao = (n1*1 + n2*2 + n3*3 + n4*4 + n5*5) / respostas;
            }

            if (document.getElementById("cadAtivarOrg").checked) {
                let n1 = parseInt(document.getElementById("cadOrgNota1").value) || 0;
                let n2 = parseInt(document.getElementById("cadOrgNota2").value) || 0;
                let n3 = parseInt(document.getElementById("cadOrgNota3").value) || 0;
                let n4 = parseInt(document.getElementById("cadOrgNota4").value) || 0;
                let n5 = parseInt(document.getElementById("cadOrgNota5").value) || 0;

                if (!validarSomaVotos(respostas, n1, n2, n3, n4, n5, "Organização")) return;
                organizacao = (n1*1 + n2*2 + n3*3 + n4*4 + n5*5) / respostas;
            }

            if (document.getElementById("cadAtivarMin").checked) {
                const itens = document.querySelectorAll(".ministrante-cad-item");
                let erroMin = false;

                itens.forEach(item => {
                    const mId = item.dataset.ministranteId;
                    const mObj = banco.ministrantes.find(i => i.id === mId);
                    let n1 = parseInt(item.querySelector(".cmin-n1").value) || 0;
                    let n2 = parseInt(item.querySelector(".cmin-n2").value) || 0;
                    let n3 = parseInt(item.querySelector(".cmin-n3").value) || 0;
                    let n4 = parseInt(item.querySelector(".cmin-n4").value) || 0;
                    let n5 = parseInt(item.querySelector(".cmin-n5").value) || 0;

                    if (!validarSomaVotos(respostas, n1, n2, n3, n4, n5, `Ministrante: ${mObj ? mObj.nome : ''}`)) {
                        erroMin = true; return;
                    }
                    notasMinistrantes.push({ ministranteId: mId, nota: (n1*1 + n2*2 + n3*3 + n4*4 + n5*5)/respostas });
                });

                if (erroMin) return;
            }

            const cursoId = novoId();
            banco.cursos.push({
                id: cursoId, nome: nome, gerenciaId: gerenciaId, dataInicio: dataInicio, dataFim: dataFim,
                inscritos: inscritos, certificados: certificados, ministrantes: [...ministrantesCadastrarAvaliacao]
            });

            banco.avaliacoes.push({
                id: novoId(), cursoId: cursoId, respostas: respostas, satisfacao: satisfacao,
                organizacao: organizacao, ministrantes: notasMinistrantes
            });

            salvarBanco();
            alert("Lançamento completo salvo com sucesso!");
            resetarFormularioCadastrarAvaliacao();
            atualizarSistema();
        });
    }

    const formEditarCurso = document.getElementById("formEditarCurso");
    if (formEditarCurso) {
        formEditarCurso.addEventListener("submit", function (e) {
            e.preventDefault();

            const id = document.getElementById("editarCursoId").value;
            const nome = document.getElementById("editarCursoNome").value.trim();
            const gerenciaId = document.getElementById("editarCursoGerencia").value;
            const dataInicio = document.getElementById("editarCursoDataInicio").value;
            const dataFim = document.getElementById("editarCursoDataFim").value;
            const inscritos = Number(document.getElementById("editarCursoInscritos").value) || 0;
            const certificados = Number(document.getElementById("editarCursoCertificados").value) || 0;
            const respostas = Number(document.getElementById("editarAvaliacaoRespostas").value) || 0;

            if (!nome || !gerenciaId || !dataInicio || !dataFim || ministrantesEditarCurso.length === 0) {
                alert("Preencha todos os campos obrigatórios."); return;
            }

            const curso = banco.cursos.find(c => c.id === id);
            if (curso) {
                curso.nome = nome; curso.gerenciaId = gerenciaId; curso.dataInicio = dataInicio;
                curso.dataFim = dataFim; curso.inscritos = inscritos; curso.certificados = certificados;
                curso.ministrantes = [...ministrantesEditarCurso];
            }

            let avaliacao = banco.avaliacoes.find(a => a.cursoId === id);
            if (!avaliacao) { avaliacao = { id: novoId(), cursoId: id }; banco.avaliacoes.push(avaliacao); }
            avaliacao.respostas = respostas;

            if (document.getElementById("editarAtivarSat").checked) {
                let n1 = parseInt(document.getElementById("edtSatNota1").value) || 0;
                let n2 = parseInt(document.getElementById("edtSatNota2").value) || 0;
                let n3 = parseInt(document.getElementById("edtSatNota3").value) || 0;
                let n4 = parseInt(document.getElementById("edtSatNota4").value) || 0;
                let n5 = parseInt(document.getElementById("edtSatNota5").value) || 0;
                if (!validarSomaVotos(respostas, n1, n2, n3, n4, n5, "Satisfação")) return;
                avaliacao.satisfacao = (n1*1 + n2*2 + n3*3 + n4*4 + n5*5) / respostas;
            } else avaliacao.satisfacao = null;

            if (document.getElementById("editarAtivarOrg").checked) {
                let n1 = parseInt(document.getElementById("edtOrgNota1").value) || 0;
                let n2 = parseInt(document.getElementById("edtOrgNota2").value) || 0;
                let n3 = parseInt(document.getElementById("edtOrgNota3").value) || 0;
                let n4 = parseInt(document.getElementById("edtOrgNota4").value) || 0;
                let n5 = parseInt(document.getElementById("edtOrgNota5").value) || 0;
                if (!validarSomaVotos(respostas, n1, n2, n3, n4, n5, "Organização")) return;
                avaliacao.organizacao = (n1*1 + n2*2 + n3*3 + n4*4 + n5*5) / respostas;
            } else avaliacao.organizacao = null;

            if (document.getElementById("editarAtivarMin").checked) {
                let notasM = [];
                const itens = document.querySelectorAll(".ministrante-edt-item");
                let erroMin = false;

                itens.forEach(item => {
                    const mId = item.dataset.ministranteId;
                    const mObj = banco.ministrantes.find(i => i.id === mId);
                    let n1 = parseInt(item.querySelector(".emin-n1").value) || 0;
                    let n2 = parseInt(item.querySelector(".emin-n2").value) || 0;
                    let n3 = parseInt(item.querySelector(".emin-n3").value) || 0;
                    let n4 = parseInt(item.querySelector(".emin-n4").value) || 0;
                    let n5 = parseInt(item.querySelector(".emin-n5").value) || 0;

                    if (!validarSomaVotos(respostas, n1, n2, n3, n4, n5, `Ministrante: ${mObj ? mObj.nome : ''}`)) {
                        erroMin = true; return;
                    }
                    notasM.push({ ministranteId: mId, nota: (n1*1 + n2*2 + n3*3 + n4*4 + n5*5)/respostas });
                });

                if (erroMin) return;
                avaliacao.ministrantes = notasM;
            } else avaliacao.ministrantes = [];

            salvarBanco();
            alert("Curso e avaliação atualizados!");
            fecharModal("modalEditarCurso");
            atualizarSistema();
        });
    }

    const formMin = document.getElementById("formMinistrante");
    if (formMin) {
        formMin.addEventListener("submit", function (e) {
            e.preventDefault();
            const nome = document.getElementById("ministranteNome").value.trim();
            if (!nome) return;

            const existe = banco.ministrantes.some(m => m.nome.toLowerCase() === nome.toLowerCase());
            if (existe) {
                alert("Este ministrante já está cadastrado.");
                return;
            }

            banco.ministrantes.push({ id: novoId(), nome: nome });
            salvarBanco();
            fecharModal("modalMinistrante");
            atualizarSistema(); // Isso vai atualizar as caixas de seleção instantaneamente!
        });
    }

    const formGer = document.getElementById("formGerencia");
    if (formGer) {
        formGer.addEventListener("submit", function (e) {
            e.preventDefault();
            const nome = document.getElementById("gerenciaNome").value.trim();
            if (!nome) return;

            const existe = banco.gerencias.some(g => g.nome.toLowerCase() === nome.toLowerCase());
            if (existe) { alert("Essa gerência já está cadastrada."); return; }

            banco.gerencias.push({ id: novoId(), nome: nome });
            salvarBanco();
            fecharModal("modalGerencia");
            atualizarSistema();
        });
    }

    const btnLimpar = document.getElementById("btnLimparDados");
    if (btnLimpar) {
        btnLimpar.addEventListener("click", function () {
            if (!confirm("Tem certeza que deseja apagar todos os dados?")) return;
            localStorage.removeItem("AvaliaCursosDados");
            banco = { cursos: [], ministrantes: [], gerencias: [], avaliacoes: [], comentarios: [] };
            atualizarSistema();
        });
    }

    atualizarSistema();
});