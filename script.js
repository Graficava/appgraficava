const firebaseConfig = {
    apiKey: "AIzaSyC4pkjSYpuz4iF0ijF50VxaZ2npsYCi7II",
    authDomain: "app-graficava.firebaseapp.com",
    projectId: "app-graficava",
    storageBucket: "app-graficava.firebasestorage.app",
    messagingSenderId: "37941958808",
    appId: "1:37941958808:web:b321e78b2191fd1d83d8ed"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let bdCategorias = [], bdProdutos = [], bdAcabamentos = [], bdClientes = [];
let carrinho = [];

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

function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()})); renderCat(); });
    db.collection("produtos").onSnapshot(s => { bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()})); renderVitrine(); renderProd(); });
    db.collection("acabamentos").onSnapshot(s => { bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()})); renderAcab(); });
    db.collection("clientes").orderBy("nome").onSnapshot(s => { bdClientes = s.docs.map(d => ({id: d.id, ...d.data()})); renderCli(); });
}

// --- CADASTRO PRODUTOS ---
function addAtributo(nomeAtrib = '', opcoes = []) {
    const div = document.createElement('div');
    div.className = 'caixa-atributo';
    div.innerHTML = `
        <div class="form-linha">
            <input type="text" class="atrib-nome" placeholder="Ex: Papel" value="${nomeAtrib}">
            <button onclick="this.parentElement.parentElement.remove()">x</button>
        </div>
        <div class="lista-opcoes"></div>
        <button onclick="addOpcaoAtrib(this)">+ Opção</button>
    `;
    document.getElementById('listaAtributos').appendChild(div);
    if(opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(div.querySelector('button'), o.nome, o.preco));
}

function addOpcaoAtrib(btn, n = '', p = '') {
    const div = document.createElement('div');
    div.className = 'form-linha';
    div.innerHTML = `<input type="text" class="op-nome" placeholder="Nome" value="${n}"><input type="number" class="op-preco" placeholder="R$ Extra" value="${p}"><button onclick="this.parentElement.remove()">x</button>`;
    btn.previousElementSibling.appendChild(div);
}

async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    let atributos = [];
    document.querySelectorAll('.caixa-atributo').forEach(caixa => {
        let ops = [];
        caixa.querySelectorAll('.lista-opcoes .form-linha').forEach(l => {
            ops.push({ nome: l.querySelector('.op-nome').value, preco: parseFloat(l.querySelector('.op-preco').value) || 0 });
        });
        atributos.push({ nome: caixa.querySelector('.atrib-nome').value, opcoes: ops });
    });

    const dados = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        regraPreco: document.getElementById('prodRegraPreco').value,
        foto: document.getElementById('prodFoto').value,
        atributos: atributos
    };

    if(id) await db.collection("produtos").doc(id).update(dados); else await db.collection("produtos").add(dados);
    alert("Salvo!"); location.reload();
}

// --- LOJA ---
function renderVitrine() {
    const grid = document.getElementById('gradeProdutos');
    grid.innerHTML = bdProdutos.map(p => `
        <div class="produto-card" onclick="abrirConfigurador('${p.id}')">
            <div class="img-vitrine" style="background-image:url('${p.foto}')"></div>
            <h4>${p.nome}</h4>
            <p>R$ ${p.preco.toFixed(2)}</p>
        </div>
    `).join('');
}

function abrirConfigurador(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdPrecoBase').value = p.preco;
    
    // Variacoes
    const divVar = document.getElementById('modalCorpoVariacoes');
    divVar.innerHTML = (p.atributos || []).map(a => `
        <div class="input-group">
            <label>${a.nome}</label>
            <select class="sel-var" onchange="calcularPrecoAoVivo()">
                ${a.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+R$ ${o.preco})</option>`).join('')}
            </select>
        </div>
    `).join('');

    document.getElementById('modalW2P').style.display = 'flex';
    calcularPrecoAoVivo();
}

function calcularPrecoAoVivo() {
    let total = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    document.querySelectorAll('.sel-var').forEach(s => total += parseFloat(s.value));
    document.getElementById('modalSubtotal').innerText = "R$ " + total.toFixed(2);
}

// --- AUXILIARES ---
function mudarAba(a) { document.querySelectorAll('.aba').forEach(x => x.classList.remove('ativa')); document.getElementById('aba-'+a).classList.add('ativa'); }
function mudarSubAba(s) { document.querySelectorAll('.sub-aba').forEach(x => x.classList.remove('sub-ativa')); document.getElementById(s).classList.add('sub-ativa'); }
function fecharModal() { document.getElementById('modalW2P').style.display = 'none'; }
function entrar() { auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('senha').value); }
function sair() { auth.signOut(); }
function renderCat() { document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join(''); }
function renderProd() { document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `<tr><td>${p.nome}</td><td>${p.regraPreco}</td><td><button onclick="db.collection('produtos').doc('${p.id}').delete()">x</button></td></tr>`).join(''); }
