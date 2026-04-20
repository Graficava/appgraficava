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
const db = firebase.firestore();
const auth = firebase.auth();

let bdProdutos = [], bdAcabamentos = [], bdClientes = [], bdCategorias = [];
let carrinho = [];

// ACESSO E SEGURANÇA
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('appInterface').style.display = 'flex';
        // Trava de Funcionário
        if (user.email !== 'seuemail@admin.com') { // Troque pelo seu e-mail
            document.getElementById('menu-cadastros').style.display = 'none';
            document.getElementById('menu-financeiro').style.display = 'none';
        }
        iniciarLeitura();
    } else {
        document.getElementById('telaLogin').style.display = 'flex';
        document.getElementById('appInterface').style.display = 'none';
    }
});

function entrar() { auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('senha').value); }
function sair() { auth.signOut(); }

function iniciarLeitura() {
    db.collection("produtos").onSnapshot(s => { bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()})); renderProd(); renderVitrine(); });
    db.collection("clientes").onSnapshot(s => { bdClientes = s.docs.map(d => ({id: d.id, ...d.data()})); renderCli(); });
    db.collection("acabamentos").onSnapshot(s => { bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()})); renderAcab(); });
    db.collection("categorias").onSnapshot(s => { bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()})); renderCat(); });
}

// LÓGICA DA VITRINE E MODAL DE BALCÃO
function renderVitrine() {
    const grid = document.getElementById('gradeProdutos');
    grid.innerHTML = bdProdutos.map(p => `
        <div class="produto-card" onclick="abrirConfigurador('${p.id}')">
            <h4>${p.nome}</h4>
            <small>${p.categoria}</small>
        </div>
    `).join('');
}

function abrirConfigurador(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('modalNomeProd').innerText = p.nome;
    const container = document.getElementById('modalOpcoesConfig');
    container.innerHTML = "";

    if (p.tipo === 'grafico') {
        // Seleção de Cor para Cartões/Panfletos
        container.innerHTML = `
            <label>Selecione a Cor:</label>
            <div class="form-grid">
                <button class="btn-opc" onclick="carregarGradeCor('${id}', '4x0')">4x0</button>
                <button class="btn-opc" onclick="carregarGradeCor('${id}', '4x1')">4x1</button>
                <button class="btn-opc" onclick="carregarGradeCor('${id}', '4x4')">4x4</button>
            </div>
            <div id="gradeResult" style="margin-top:20px;"></div>
        `;
    } else if (p.tipo === 'apostila') {
        // Layout Estilo Imprifácil
        container.innerHTML = `
            <div class="form-grid">
                <div class="input-group"><label>Tamanho</label><select id="w2pTam" onchange="calcularApostila()"><option value="1">A4</option><option value="0.6">A5</option></select></div>
                <div class="input-group"><label>Lados</label><select id="w2pLados" onchange="calcularApostila()"><option value="1">Só Frente</option><option value="0.8">Frente e Verso</option></select></div>
                <div class="input-group"><label>Qtd Folhas</label><input type="number" id="w2pQtd" value="1" oninput="calcularApostila()"></div>
            </div>
            <div class="input-group" style="margin-top:10px;"><label>Orientação do Furo (Informativo)</label><select id="w2pFuro"><option>Superior</option><option>Lateral Esquerda</option></select></div>
        `;
    }

    document.getElementById('modalW2P').style.display = 'flex';
    calcularPrecoAoVivo();
}

// CADASTRO DE MATRIZ DE PREÇO (ADMIN)
function addLinhaMatriz(qtd='', p0='', p1='', p4='') {
    const div = document.createElement('div');
    div.className = 'form-linha';
    div.innerHTML = `
        <input type="number" class="mqtd" placeholder="Qtd" value="${qtd}">
        <input type="number" class="m4x0" placeholder="R$ 4x0" value="${p0}">
        <input type="number" class="m4x1" placeholder="R$ 4x1" value="${p1}">
        <input type="number" class="m4x4" placeholder="R$ 4x4" value="${p4}">
        <button onclick="this.parentElement.remove()">x</button>
    `;
    document.getElementById('listaGradeCores').appendChild(div);
}

async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    let matriz = [];
    document.querySelectorAll('#listaGradeCores .form-linha').forEach(l => {
        matriz.push({
            qtd: l.querySelector('.mqtd').value,
            '4x0': l.querySelector('.m4x0').value,
            '4x1': l.querySelector('.m4x1').value,
            '4x4': l.querySelector('.m4x4').value
        });
    });

    const dados = {
        nome: document.getElementById('prodNome').value,
        tipo: document.getElementById('prodTipo').value,
        categoria: document.getElementById('prodCategoria').value,
        matriz: matriz
    };

    if(id) await db.collection("produtos").doc(id).update(dados);
    else await db.collection("produtos").add(dados);
    alert("Salvo!");
}

// Funções auxiliares de renderização (Clientes, Acabamentos, etc)
function mudarAba(a) { document.querySelectorAll('.aba').forEach(x => x.classList.remove('ativa')); document.getElementById('aba-'+a).classList.add('ativa'); }
function fecharModal() { document.getElementById('modalW2P').style.display = 'none'; }
