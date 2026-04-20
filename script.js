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

// LOGIN
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
    auth.signInWithEmailAndPassword(e, s).catch(() => alert("Erro no login"));
}
function sair() { auth.signOut(); }

// NAVEGAÇÃO
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

// LÓGICA DE EXIBIÇÃO DE CAMPOS (O que você pediu)
function ajustarCamposProduto() {
    const tipo = document.getElementById('prodTipo').value;
    const regraPreco = document.getElementById('prodRegraPreco').value;

    // Esconde/Mostra Cor e Tamanho (Só para Gráfico e Outros)
    if (tipo === 'visual') {
        document.getElementById('grp-cor').style.display = 'none';
        document.getElementById('grp-tamanho').style.display = 'none';
    } else {
        document.getElementById('grp-cor').style.display = 'block';
        document.getElementById('grp-tamanho').style.display = 'block';
    }

    // Esconde/Mostra Medidas de Bobina (Só para m2)
    if (regraPreco === 'm2') {
        document.getElementById('boxMedidas').style.display = 'grid';
        document.getElementById('labelPreco').innerText = "Preço por m² (R$)";
    } else {
        document.getElementById('boxMedidas').style.display = 'none';
        document.getElementById('labelPreco').innerText = "Preço Unitário (R$)";
    }
}

// BANCO DE DADOS
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
    });
}

// SALVAR CATEGORIA
async function salvarCategoria() {
    const id = document.getElementById('catId').value;
    const nome = document.getElementById('catNome').value;
    if (id) await db.collection("categorias").doc(id).update({nome});
    else await db.collection("categorias").add({nome});
    document.getElementById('catId').value = ""; document.getElementById('catNome').value = "";
}

function renderCat() {
    const lista = document.getElementById('listaCategorias');
    lista.innerHTML = bdCategorias.map(c => `<tr><td>${c.nome}</td><td><button onclick="editCat('${c.id}','${c.nome}')">Ed</button></td></tr>`).join('');
    const selects = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('prodCategoria').innerHTML = selects;
    document.getElementById('acabCategoria').innerHTML = selects;
}
function editCat(id, n) { document.getElementById('catId').value = id; document.getElementById('catNome').value = n; }

// SALVAR PRODUTO (Aqui resolvemos o problema de não cadastrar)
async function salvarProduto() {
    const id = document.getElementById('prodId').value;
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
        larguraMax: document.getElementById('prodLargMax').value,
        compMax: document.getElementById('prodCompMax').value
    };

    try {
        if (id) await db.collection("produtos").doc(id).update(dados);
        else await db.collection("produtos").add(dados);
        alert("Produto salvo!");
        limparFormProduto();
    } catch (e) { alert("Erro ao salvar"); }
}

function renderProd() {
    document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `
        <tr><td>${p.nome}</td><td>${p.tipo}</td><td>R$ ${p.preco}</td>
        <td><button onclick="editProd('${p.id}')">Editar</button></td></tr>`).join('');
}

function editProd(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodTipo').value = p.tipo;
    document.getElementById('prodNome').value = p.nome;
    document.getElementById('prodPreco').value = p.preco;
    ajustarCamposProduto();
}

function limparFormProduto() {
    document.getElementById('prodId').value = "";
    document.getElementById('prodNome').value = "";
    document.getElementById('prodPreco').value = "";
}

// SALVAR ACABAMENTO
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
    if (id) await db.collection("acabamentos").doc(id).update(dados);
    else await db.collection("acabamentos").add(dados);
    limparFormAcabamento();
}

function renderAcab() {
    document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `
        <tr><td>${a.nome}</td><td>R$ ${a.venda}</td>
        <td><button onclick="editAcab('${a.id}')">Ed</button></td></tr>`).join('');
}

function editAcab(id) {
    const a = bdAcabamentos.find(x => x.id === id);
    document.getElementById('acabId').value = a.id;
    document.getElementById('acabNome').value = a.nome;
    document.getElementById('acabPrecoVenda').value = a.venda;
}

function limparFormAcabamento() { document.getElementById('acabId').value = ""; document.getElementById('acabNome').value = ""; }
