// 1. SUAS CHAVES DO FIREBASE
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

let bdCategorias = [];
let bdProdutos = [];
let bdAcabamentos = [];

// 2. LOGIN
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('appInterface').style.display = 'flex';
        iniciarLeituraDoBanco();
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

// 3. MENUS
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

// Mostra ou Esconde os Limites da Plotter se não for M2
function toggleLimites() {
    const regra = document.getElementById('prodRegra').value;
    document.getElementById('divLimitesPlotter').style.display = (regra === 'm2') ? 'grid' : 'none';
}

// ==========================================
// CRUD SIMPLIFICADO
// ==========================================
function iniciarLeituraDoBanco() {
    db.collection("categorias").onSnapshot(snap => {
        bdCategorias = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarCategorias();
        atualizarSelectsCategorias();
    });
    db.collection("produtos_base").onSnapshot(snap => {
        bdProdutos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarProdutos();
    });
    db.collection("acabamentos").orderBy("grupo").onSnapshot(snap => {
        bdAcabamentos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderizarAcabamentos();
    });
}

// --- CATEGORIAS ---
async function salvarCategoria() {
    const id = document.getElementById('catId').value;
    const nome = document.getElementById('catNome').value;
    if (!nome) return alert("Digite um nome!");

    if (id) await db.collection("categorias").doc(id).update({ nome: nome });
    else await db.collection("categorias").add({ nome: nome });
    
    document.getElementById('catId').value = ""; document.getElementById('catNome').value = "";
}

function renderizarCategorias() {
    document.getElementById('listaCategorias').innerHTML = bdCategorias.map(c => `
        <tr><td>${c.nome}</td><td style="text-align:right;">
        <button class="btn-acao-edit" onclick="editarCategoria('${c.id}', '${c.nome}')"><i class="fa fa-pen"></i></button>
        <button class="btn-acao-del" onclick="deletarDoc('categorias', '${c.id}')"><i class="fa fa-trash"></i></button></td></tr>
    `).join('');
}

function editarCategoria(id, nome) { document.getElementById('catId').value = id; document.getElementById('catNome').value = nome; }

function atualizarSelectsCategorias() {
    const options = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('prodCategoria').innerHTML = options;
    document.getElementById('acabCategoria').innerHTML = `<option value="Geral">Geral (Todas)</option>` + options;
}

// --- PRODUTOS BASE ---
async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    const dados = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        regra: document.getElementById('prodRegra').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 0,
        comprimentoMax: parseFloat(document.getElementById('prodCompMax').value) || 0
    };

    if (!dados.nome) return alert("Nome do produto é obrigatório.");

    if (id) await db.collection("produtos_base").doc(id).update(dados);
    else await db.collection("produtos_base").add(dados);
    limparFormProduto();
}

function renderizarProdutos() {
    document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `
        <tr>
            <td><b>${p.nome}</b><br><small style="color:#718096">${p.categoria}</small></td>
            <td>${p.regra}</td>
            <td>R$ ${parseFloat(p.preco || 0).toFixed(2)}</td>
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
    document.getElementById('prodPreco').value = p.preco || 0;
    document.getElementById('prodLargMax').value = p.larguraMax || 1.50;
    document.getElementById('prodCompMax').value = p.comprimentoMax || 100;
    toggleLimites();
}

function limparFormProduto() {
    document.getElementById('prodId').value = ""; document.getElementById('prodNome').value = "";
    document.getElementById('prodPreco').value = "0.00"; 
    document.getElementById('prodLargMax').value = "1.50"; document.getElementById('prodCompMax').value = "100.00";
}

// --- ACABAMENTOS ---
async function salvarAcabamento() {
    const id = document.getElementById('acabId').value;
    const dados = {
        nome: document.getElementById('acabNome').value,
        grupo: document.getElementById('acabGrupo').value,
        categoria: document.getElementById('acabCategoria').value,
        regra: document.getElementById('acabRegra').value,
        precoVenda: parseFloat(document.getElementById('acabPrecoVenda').value) || 0,
        custo: parseFloat(document.getElementById('acabCusto').value) || 0
    };

    if (!dados.nome) return alert("Nome do acabamento é obrigatório.");

    if (id) await db.collection("acabamentos").doc(id).update(dados);
    else await db.collection("acabamentos").add(dados);
    limparFormAcabamento();
}

function renderizarAcabamentos() {
    document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `
        <tr>
            <td><small>${a.categoria}</small></td>
            <td><b>${a.nome}</b><br><span class="col-grupo">${a.grupo || 'Solto'}</span></td>
            <td style="color:#2F855A; font-weight:bold;">R$ ${parseFloat(a.precoVenda || 0).toFixed(2)}</td>
            <td><small style="color:#718096">${a.regra}</small></td>
            <td style="text-align:right;">
                <button class="btn-acao-edit" onclick="editarAcabamento('${a.id}')"><i class="fa fa-pen"></i></button>
                <button class="btn-acao-del" onclick="deletarDoc('acabamentos', '${a.id}')"><i class="fa fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function editarAcabamento(id) {
    const a = bdAcabamentos.find(item => item.id === id);
    document.getElementById('acabId').value = a.id;
    document.getElementById('acabNome').value = a.nome;
    document.getElementById('acabGrupo').value = a.grupo || "";
    document.getElementById('acabCategoria').value = a.categoria;
    document.getElementById('acabRegra').value = a.regra;
    document.getElementById('acabPrecoVenda').value = a.precoVenda || 0;
    document.getElementById('acabCusto').value = a.custo || 0;
}

function limparFormAcabamento() {
    document.getElementById('acabId').value = ""; document.getElementById('acabNome').value = "";
    document.getElementById('acabGrupo').value = ""; document.getElementById('acabPrecoVenda').value = "0.00";
    document.getElementById('acabCusto').value = "0.00";
}

function deletarDoc(colecao, id) {
    if (confirm("Apagar este item?")) db.collection(colecao).doc(id).delete();
}
