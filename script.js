// 1. CONFIGURAÇÕES DO FIREBASE (Suas chaves reais)
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

// Variáveis Globais de Memória
let bdCategorias = [];
let bdProdutos = [];
let bdAcabamentos = [];

// 2. VERIFICA SE ESTÁ LOGADO
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('appInterface').style.display = 'flex';
        iniciarLeituraDoBanco(); // Puxa os dados assim que logar
    } else {
        document.getElementById('telaLogin').style.display = 'flex';
        document.getElementById('appInterface').style.display = 'none';
    }
});

function entrar() {
    auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('senha').value)
        .catch(error => document.getElementById('msgErro').style.display = 'block');
}
function sair() { auth.signOut(); }

// 3. NAVEGAÇÃO DE ABAS
function mudarAba(nomeDaAba) {
    document.querySelectorAll('.aba').forEach(aba => aba.classList.remove('ativa'));
    document.querySelectorAll('.menu button').forEach(btn => btn.classList.remove('ativo'));
    document.getElementById('aba-' + nomeDaAba).classList.add('ativa');
    event.currentTarget.classList.add('ativo');
}

function mudarSubAba(nomeSubAba) {
    document.querySelectorAll('.sub-aba').forEach(aba => aba.classList.remove('sub-ativa'));
    document.querySelectorAll('.sub-menu button').forEach(btn => btn.classList.remove('sub-ativo'));
    document.getElementById(nomeSubAba).classList.add('sub-ativa');
    document.getElementById('btn-' + nomeSubAba).classList.add('sub-ativo');
}

// ==========================================
// FASE 2: LÓGICA DE CADASTROS (ALMOXARIFADO)
// ==========================================

// Puxa os dados em tempo real do Firebase
function iniciarLeituraDoBanco() {
    // Escuta Categorias
    db.collection("categorias").onSnapshot(snap => {
        bdCategorias = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarCategorias();
        atualizarSelectsCategorias();
    });

    // Escuta Produtos Base
    db.collection("produtos_base").onSnapshot(snap => {
        bdProdutos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarProdutos();
    });

    // Escuta Acabamentos
    db.collection("acabamentos").orderBy("grupo").onSnapshot(snap => {
        bdAcabamentos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarAcabamentos();
    });
}

// --- CRUD DE CATEGORIAS ---
async function salvarCategoria() {
    const id = document.getElementById('catId').value;
    const nome = document.getElementById('catNome').value;
    if (!nome) return alert("Digite um nome para a categoria!");

    if (id) {
        await db.collection("categorias").doc(id).update({ nome: nome });
    } else {
        await db.collection("categorias").add({ nome: nome });
    }
    document.getElementById('catId').value = "";
    document.getElementById('catNome').value = "";
}

function renderizarCategorias() {
    const lista = document.getElementById('listaCategorias');
    lista.innerHTML = bdCategorias.map(c => `
        <tr>
            <td>${c.nome}</td>
            <td style="text-align:right;">
                <button class="btn-acao-edit" onclick="editarCategoria('${c.id}', '${c.nome}')"><i class="fa fa-pen"></i></button>
                <button class="btn-acao-del" onclick="deletarDoc('categorias', '${c.id}')"><i class="fa fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function editarCategoria(id, nome) {
    document.getElementById('catId').value = id;
    document.getElementById('catNome').value = nome;
}

function atualizarSelectsCategorias() {
    const options = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('prodCategoria').innerHTML = options;
    document.getElementById('acabCategoria').innerHTML = `<option value="Geral (Aparece em todos)">Geral (Aparece em todos)</option>` + options;
}

// --- TABELAS DE PREÇOS (Faixas de Escalonamento) ---
function addFaixaPreco(containerId, qtd = 1, preco = 0) {
    const container = document.getElementById(containerId);
    const div = document.createElement('div');
    div.className = 'faixa-preco-row';
    div.innerHTML = `
        <div><label style="font-size:11px;">A partir da Qtd/Metro:</label><br><input type="number" class="f-qtd" min="1" step="0.01" value="${qtd}"></div>
        <div><label style="font-size:11px;">Valor Unitário (R$):</label><br><input type="number" class="f-preco" step="0.001" value="${preco}"></div>
        <button class="btn-remover-faixa" onclick="this.parentElement.remove()">X</button>
    `;
    container.appendChild(div);
}

function lerTabelaPrecos(containerId) {
    const linhas = document.getElementById(containerId).querySelectorAll('.faixa-preco-row');
    let precos = [];
    linhas.forEach(linha => {
        let q = parseFloat(linha.querySelector('.f-qtd').value);
        let p = parseFloat(linha.querySelector('.f-preco').value);
        if (!isNaN(q) && !isNaN(p)) precos.push({ qtd: q, valor: p });
    });
    return precos.sort((a, b) => a.qtd - b.qtd);
}

function carregarTabelaPrecos(containerId, arrayPrecos) {
    document.getElementById(containerId).innerHTML = '';
    if (!arrayPrecos || arrayPrecos.length === 0) {
        addFaixaPreco(containerId, 1, 0);
    } else {
        arrayPrecos.forEach(f => addFaixaPreco(containerId, f.qtd, f.valor));
    }
}

// Inicializa a primeira linha vazia ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    addFaixaPreco('precos-produto', 1, 0);
    addFaixaPreco('precos-acabamento', 1, 0);
});

// --- CRUD DE PRODUTOS BASE ---
async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    const arrayPrecos = lerTabelaPrecos('precos-produto');
    const dados = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        regra: document.getElementById('prodRegra').value,
        qtdsFixas: document.getElementById('prodQtds').value,
        precos: arrayPrecos
    };

    if (!dados.nome) return alert("Nome do produto é obrigatório.");

    if (id) await db.collection("produtos_base").doc(id).update(dados);
    else await db.collection("produtos_base").add(dados);
    limparFormProduto();
}

function renderizarProdutos() {
    const lista = document.getElementById('listaProdutos');
    lista.innerHTML = bdProdutos.map(p => `
        <tr>
            <td><b>${p.nome}</b><br><small style="color:#718096">${p.categoria}</small></td>
            <td>${p.regra}</td>
            <td style="text-align:right;">
                <button class="btn-acao-edit" onclick="editarProduto('${p.id}')"><i class="fa fa-pen"></i></button>
                <button class="btn-acao-del" onclick="deletarDoc('produtos_base', '${p.id}')"><i class="fa fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function editarProduto(id) {
    const p = bdProdutos.find(item => item.id === id);
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodNome').value = p.nome;
    document.getElementById('prodCategoria').value = p.categoria;
    document.getElementById('prodRegra').value = p.regra;
    document.getElementById('prodQtds').value = p.qtdsFixas || "";
    carregarTabelaPrecos('precos-produto', p.precos);
    window.scrollTo(0, 0);
}

function limparFormProduto() {
    document.getElementById('prodId').value = "";
    document.getElementById('prodNome').value = "";
    document.getElementById('prodQtds').value = "";
    carregarTabelaPrecos('precos-produto', []);
}

// --- CRUD DE ACABAMENTOS (A GRADE) ---
async function salvarAcabamento() {
    const id = document.getElementById('acabId').value;
    const arrayPrecos = lerTabelaPrecos('precos-acabamento');
    const dados = {
        nome: document.getElementById('acabNome').value,
        grupo: document.getElementById('acabGrupo').value,
        categoria: document.getElementById('acabCategoria').value,
        regra: document.getElementById('acabRegra').value,
        custo: parseFloat(document.getElementById('acabCusto').value) || 0,
        prazo: parseInt(document.getElementById('acabPrazo').value) || 0,
        precos: arrayPrecos
    };

    if (!dados.nome) return alert("Nome da opção é obrigatório.");

    if (id) await db.collection("acabamentos").doc(id).update(dados);
    else await db.collection("acabamentos").add(dados);
    limparFormAcabamento();
}

function renderizarAcabamentos() {
    const lista = document.getElementById('listaAcabamentos');
    const busca = document.getElementById('buscaAcab')?.value.toLowerCase() || "";
    const filtrados = bdAcabamentos.filter(a => a.nome.toLowerCase().includes(busca) || a.grupo.toLowerCase().includes(busca));

    lista.innerHTML = filtrados.map(a => {
        let precoInicial = (a.precos && a.precos.length > 0) ? a.precos[0].valor : 0;
        let textoPreco = (a.precos && a.precos.length > 1) ? "Escalonado" : `R$ ${precoInicial.toFixed(2)}`;
        
        return `
        <tr>
            <td><small>${a.categoria}</small></td>
            <td><b>${a.nome}</b><br><span class="col-grupo">${a.grupo || 'Opcional Solto'}</span></td>
            <td style="color:#2F855A; font-weight:bold;">${textoPreco}</td>
            <td><small style="color:#718096">${a.regra}</small></td>
            <td style="text-align:right;">
                <button class="btn-acao-edit" onclick="editarAcabamento('${a.id}')"><i class="fa fa-pen"></i></button>
                <button class="btn-acao-del" onclick="deletarDoc('acabamentos', '${a.id}')"><i class="fa fa-trash"></i></button>
            </td>
        </tr>
    `}).join('');
}

function filtrarAcabamentos() { renderizarAcabamentos(); }

function editarAcabamento(id) {
    const a = bdAcabamentos.find(item => item.id === id);
    document.getElementById('acabId').value = a.id;
    document.getElementById('acabNome').value = a.nome;
    document.getElementById('acabGrupo').value = a.grupo || "";
    document.getElementById('acabCategoria').value = a.categoria;
    document.getElementById('acabRegra').value = a.regra;
    document.getElementById('acabCusto').value = a.custo || 0;
    document.getElementById('acabPrazo').value = a.prazo || 0;
    carregarTabelaPrecos('precos-acabamento', a.precos);
    window.scrollTo(0, 0);
}

function limparFormAcabamento() {
    document.getElementById('acabId').value = "";
    document.getElementById('acabNome').value = "";
    document.getElementById('acabGrupo').value = "";
    document.getElementById('acabCusto').value = "0.00";
    document.getElementById('acabPrazo').value = "0";
    carregarTabelaPrecos('precos-acabamento', []);
}

// Função utilitária genérica para apagar
function deletarDoc(colecao, id) {
    if (confirm("Deseja realmente apagar este item do banco de dados?")) {
        db.collection(colecao).doc(id).delete();
    }
}
