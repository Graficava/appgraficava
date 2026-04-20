const firebaseConfig = {
    apiKey: "AIzaSyC4pkjSYpuz4iF0ijF50VxaZ2npsYCi7II",
    authDomain: "app-graficava.firebaseapp.com",
    databaseURL: "https://app-graficava-default-rtdb.firebaseio.com",
    projectId: "app-graficava",
    storageBucket: "app-graficava.firebasestorage.app",
    messagingSenderId: "37941958808",
    appId: "1:37941958808:web:b321e78b2191fd1d83d8ed"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let bdCategorias = [], bdProdutos = [], bdAcabamentos = [];

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('appInterface').style.display = 'flex';
        iniciarLeitura();
    } else {
        document.getElementById('telaLogin').style.display = 'flex';
        document.getElementById('appInterface').style.display = 'none';
    }
});

function entrar() {
    const e = document.getElementById('email').value;
    const s = document.getElementById('senha').value;
    auth.signInWithEmailAndPassword(e, s).catch(() => alert("Erro no login. Verifique e-mail e senha."));
}
function sair() { auth.signOut(); }

function mudarAba(aba) {
    document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('ativo'));
    document.getElementById('aba-' + aba).classList.add('ativa');
    event.currentTarget.classList.add('ativo');
}

function mudarSubAba(sub) {
    document.querySelectorAll('.sub-aba').forEach(a => a.classList.remove('sub-ativa'));
    document.querySelectorAll('.sub-menu button').forEach(b => b.classList.remove('sub-ativo'));
    document.getElementById(sub).classList.add('sub-ativa');
    document.getElementById('btn-' + sub).classList.add('sub-ativo');
}

function ajustarCamposProduto() {
    const tipo = document.getElementById('prodTipo').value;
    const regraPreco = document.getElementById('prodRegraPreco').value;

    const divCor = document.getElementById('grp-cor');
    const divTamanho = document.getElementById('grp-tamanho');
    const boxMedidas = document.getElementById('boxMedidas');
    const labelPreco = document.getElementById('labelPreco');

    if (tipo === 'visual') {
        if(divCor) divCor.style.display = 'none';
        if(divTamanho) divTamanho.style.display = 'none';
    } else {
        if(divCor) divCor.style.display = 'block';
        if(divTamanho) divTamanho.style.display = 'block';
    }

    if (regraPreco === 'm2') {
        if(boxMedidas) boxMedidas.style.display = 'grid'; 
        if(labelPreco) labelPreco.innerText = "Preço por m² (R$)";
    } else {
        if(boxMedidas) boxMedidas.style.display = 'none';
        if(labelPreco) labelPreco.innerText = "Preço Unitário (R$)";
    }
}
document.addEventListener('DOMContentLoaded', ajustarCamposProduto);

function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => {
        bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCat();
    });
    db.collection("produtos").onSnapshot(s => {
        bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderProd();
    });
    db.collection("acabamentos").onSnapshot(s => {
        bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderAcab();
        atualizarListaAcabamentosProduto(); 
    });
}

async function salvarCategoria() {
    const id = document.getElementById('catId').value;
    const nome = document.getElementById('catNome').value;
    if (!nome) return alert("Digite o nome da categoria!");

    if (id) await db.collection("categorias").doc(id).update({nome});
    else await db.collection("categorias").add({nome});
    document.getElementById('catId').value = ""; document.getElementById('catNome').value = "";
}

function renderCat() {
    document.getElementById('listaCategorias').innerHTML = bdCategorias.map(c => `<tr><td>${c.nome}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editCat('${c.id}','${c.nome}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('categorias', '${c.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join('');
    
    const selects = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('prodCategoria').innerHTML = selects;
    document.getElementById('acabCategoria').innerHTML = `<option value="Geral (Aparece em todos)">Geral (Aparece em todos)</option>` + selects;
    atualizarListaAcabamentosProduto(); 
}
function editCat(id, n) { document.getElementById('catId').value = id; document.getElementById('catNome').value = n; }

// --- LÓGICA DE CHECKBOXES BLINDADA ---
function atualizarListaAcabamentosProduto(selecionadosSalvos = []) {
    const catSelect = document.getElementById('prodCategoria');
    const container = document.getElementById('listaCheckAcabamentos');
    
    if (!catSelect || !container) return;
    const categoriaSelecionada = catSelect.value;

    if (bdAcabamentos.length === 0) {
        container.innerHTML = '<small style="color:#718096;">Nenhum acabamento encontrado no banco de dados...</small>';
        return;
    }

    // Filtra os acabamentos com proteção contra erros
    const acabamentosFiltrados = bdAcabamentos.filter(a => {
        const cat = a.categoria || ""; // Se for vazio/antigo, evita que o sistema trave
        return cat === categoriaSelecionada || cat.includes("Geral");
    });

    if(acabamentosFiltrados.length === 0) {
        container.innerHTML = '<small style="color:#718096;">Nenhum acabamento para esta categoria.</small>';
        return;
    }

    // Garante que é um array para não dar erro no includes
    const salvos = Array.isArray(selecionadosSalvos) ? selecionadosSalvos : [];

    container.innerHTML = acabamentosFiltrados.map(a => {
        const estaMarcado = salvos.includes(a.id) ? 'checked' : '';
        return `
            <label>
                <input type="checkbox" class="check-acab-prod" value="${a.id}" ${estaMarcado}> 
                ${a.nome} <small style="color:#A0AEC0; margin-left:5px;">(${a.grupo || 'Solto'})</small>
            </label>
        `;
    }).join('');
}

async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    
    const checkboxes = document.querySelectorAll('.check-acab-prod:checked');
    const acabamentosPermitidos = Array.from(checkboxes).map(c => c.value);

    const dados = {
        tipo: document.getElementById('prodTipo').value,
        categoria: document.getElementById('prodCategoria').value,
        nome: document.getElementById('prodNome').value,
        foto: document.getElementById('prodFoto').value,
        cor: document.getElementById('prodCor').value,
        material: document.getElementById('prodMaterial').value,
        tamanho: document.getElementById('prodTamanho').value,
        prazo: document.getElementById('prodPrazo').value,
        regraPreco: document.getElementById('prodRegraPreco').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 1.50,
        compMax: parseFloat(document.getElementById('prodCompMax').value) || 100,
        acabamentos: acabamentosPermitidos 
    };

    if (!dados.nome) return alert("Nome do produto é obrigatório!");

    if (id) await db.collection("produtos").doc(id).update(dados);
    else await db.collection("produtos").add(dados);
    
    limparFormProduto();
    alert("Produto salvo com sucesso!");
}

function renderProd() {
    document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `
        <tr><td><b>${p.nome}</b><br><small style="color:#718096">${p.categoria}</small></td>
        <td>${p.tipo === 'visual' ? 'Com. Visual' : p.tipo}</td>
        <td style="color:#2F855A; font-weight:bold;">R$ ${p.preco.toFixed(2)}</td>
        <td style="text-align:right;"><button class="btn-acao-edit" onclick="editProd('${p.id}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('produtos', '${p.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join('');
}

function editProd(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodTipo').value = p.tipo;
    document.getElementById('prodCategoria').value = p.categoria;
    document.getElementById('prodNome').value = p.nome;
    document.getElementById('prodFoto').value = p.foto || '';
    document.getElementById('prodCor').value = p.cor || 'N/A';
    document.getElementById('prodMaterial').value = p.material || '';
    document.getElementById('prodTamanho').value = p.tamanho || '';
    document.getElementById('prodPrazo').value = p.prazo || '';
    document.getElementById('prodRegraPreco').value = p.regraPreco;
    document.getElementById('prodPreco').value = p.preco;
    document.getElementById('prodLargMax').value = p.larguraMax || 1.50;
    document.getElementById('prodCompMax').value = p.compMax || 100;
    
    ajustarCamposProduto();
    atualizarListaAcabamentosProduto(p.acabamentos || []);
    
    window.scrollTo(0,0);
}

function limparFormProduto() {
    document.getElementById('prodId').value = ""; document.getElementById('prodNome').value = "";
    document.getElementById('prodFoto').value = ""; document.getElementById('prodMaterial').value = "";
    document.getElementById('prodTamanho').value = ""; document.getElementById('prodPrazo').value = "";
    document.getElementById('prodPreco').value = "0.00";
    ajustarCamposProduto();
    atualizarListaAcabamentosProduto();
}

async function salvarAcabamento() {
    const id = document.getElementById('acabId').value;
    const dados = {
        nome: document.getElementById('acabNome').value,
        grupo: document.getElementById('acabGrupo').value,
        categoria: document.getElementById('acabCategoria').value,
        regra: document.getElementById('acabRegra').value,
        venda: parseFloat(document.getElementById('acabPrecoVenda').value) || 0,
        custo: parseFloat(document.getElementById('acabCusto').value) || 0
    };

    if (!dados.nome) return alert("O nome do acabamento é obrigatório!");

    if (id) await db.collection("acabamentos").doc(id).update(dados);
    else await db.collection("acabamentos").add(dados);
    limparFormAcabamento();
}

function renderAcab() {
    document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `
        <tr><td><b>${a.nome}</b><br><small style="color:#718096">${a.grupo || 'Solto'}</small></td>
        <td style="color:#2F855A; font-weight:bold;">R$ ${a.venda.toFixed(2)}</td>
        <td style="text-align:right;"><button class="btn-acao-edit" onclick="editAcab('${a.id}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('acabamentos', '${a.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join('');
}

function editAcab(id) {
    const a = bdAcabamentos.find(x => x.id === id);
    document.getElementById('acabId').value = a.id;
    document.getElementById('acabNome').value = a.nome;
    document.getElementById('acabGrupo').value = a.grupo || '';
    document.getElementById('acabCategoria').value = a.categoria;
    document.getElementById('acabRegra').value = a.regra;
    document.getElementById('acabPrecoVenda').value = a.venda;
    document.getElementById('acabCusto').value = a.custo;
    window.scrollTo(0,0);
}

function limparFormAcabamento() { 
    document.getElementById('acabId').value = ""; document.getElementById('acabNome').value = ""; 
    document.getElementById('acabGrupo').value = ""; document.getElementById('acabPrecoVenda').value = "0.00";
    document.getElementById('acabCusto').value = "0.00";
}

function deletarDoc(colecao, id) {
    if (confirm("Apagar este item para sempre?")) db.collection(colecao).doc(id).delete();
}
