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

// Auth State
auth.onAuthStateChanged(user => {
    document.getElementById('telaLogin').classList.toggle('hidden', !!user);
    document.getElementById('appInterface').classList.toggle('hidden', !user);
    if (user) iniciarLeitura();
});

function entrar() {
    const e = document.getElementById('email').value;
    const s = document.getElementById('senha').value;
    auth.signInWithEmailAndPassword(e, s).catch(err => {
        document.getElementById('msgErro').classList.remove('hidden');
    });
}

function sair() { auth.signOut(); }

function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { 
        bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCadastrosFiltros();
    });
    db.collection("produtos").onSnapshot(s => { 
        bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderVitrine();
        renderListaProdutosCad();
    });
}

// --- CADASTRO DE PRODUTOS ---
function addAtributo(nome = '', opcoes = []) {
    const div = document.createElement('div');
    div.className = "bg-white p-4 rounded-lg shadow-sm border border-blue-200 caixa-atributo";
    div.innerHTML = `
        <div class="flex gap-2 mb-2">
            <input type="text" placeholder="Nome (Ex: Papel)" value="${nome}" class="atrib-nome flex-1 font-bold p-1 border-b">
            <button onclick="this.parentElement.parentElement.remove()" class="text-red-500">×</button>
        </div>
        <div class="lista-opcoes space-y-1"></div>
        <button onclick="addOpcaoAtrib(this)" class="text-xs font-bold text-blue-500 mt-2">+ Add Valor Extra</button>
    `;
    document.getElementById('listaAtributos').appendChild(div);
    if(opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(div.querySelector('.text-xs'), o.nome, o.preco));
}

function addOpcaoAtrib(btn, n = '', p = '') {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-opcao";
    div.innerHTML = `
        <input type="text" placeholder="Ex: Couché" value="${n}" class="op-nome flex-1 text-sm p-1 border rounded">
        <input type="number" placeholder="R$ extra" value="${p}" class="op-preco w-20 text-sm p-1 border rounded">
        <button onclick="this.parentElement.remove()">×</button>
    `;
    btn.previousElementSibling.appendChild(div);
}

async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    let atributos = [];
    document.querySelectorAll('.caixa-atributo').forEach(caixa => {
        let ops = [];
        caixa.querySelectorAll('.item-opcao').forEach(l => {
            ops.push({ nome: l.querySelector('.op-nome').value, preco: parseFloat(l.querySelector('.op-preco').value) || 0 });
        });
        atributos.push({ nome: caixa.querySelector('.atrib-nome').value, opcoes: ops });
    });

    const dados = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        foto: document.getElementById('prodFoto').value,
        atributos: atributos
    };

    if(id) await db.collection("produtos").doc(id).update(dados); 
    else await db.collection("produtos").add(dados);
    
    alert("Produto Salvo!");
    limparFormProd();
}

function renderListaProdutosCad() {
    document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4 font-semibold">${p.nome}</td>
            <td class="p-4 text-center">
                <button onclick="editProd('${p.id}')" class="text-blue-600 mr-2">Editar</button>
                <button onclick="db.collection('produtos').doc('${p.id}').delete()" class="text-red-600">X</button>
            </td>
        </tr>
    `).join('');
}

// --- LOJA ---
function renderVitrine() {
    document.getElementById('gradeProdutos').innerHTML = bdProdutos.map(p => `
        <div onclick="abrirConfigurador('${p.id}')" class="bg-white p-4 rounded-xl border hover:shadow-md cursor-pointer transition">
            <div class="h-32 bg-gray-100 rounded-lg mb-3 bg-cover bg-center" style="background-image:url('${p.foto}')"></div>
            <h4 class="font-bold text-sm truncate">${p.nome}</h4>
            <p class="text-indigo-600 font-black text-lg">R$ ${p.preco.toFixed(2)}</p>
        </div>
    `).join('');
}

function abrirConfigurador(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdPrecoBase').value = p.preco;
    document.getElementById('modalHeaderImg').style.backgroundImage = `url('${p.foto}')`;
    
    document.getElementById('modalCorpoVariacoes').innerHTML = (p.atributos || []).map(a => `
        <div class="space-y-1">
            <label class="text-xs font-bold text-gray-400 uppercase">${a.nome}</label>
            <select class="sel-var w-full p-3 border rounded-xl bg-gray-50" onchange="calcularPrecoAoVivo()">
                ${a.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+R$ ${o.preco})</option>`).join('')}
            </select>
        </div>
    `).join('');

    document.getElementById('modalW2P').classList.remove('hidden');
    calcularPrecoAoVivo();
}

function calcularPrecoAoVivo() {
    let base = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    let extra = 0;
    document.querySelectorAll('.sel-var').forEach(s => extra += parseFloat(s.value));
    let qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
    let total = (base + extra) * qtd;
    document.getElementById('modalSubtotal').innerText = "R$ " + total.toFixed(2);
}

// --- NAVEGAÇÃO ---
function mudarAba(aba) {
    document.querySelectorAll('.aba-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('aba-'+aba).classList.remove('hidden');
    document.querySelectorAll('.aba-btn').forEach(btn => btn.classList.remove('bg-indigo-50', 'text-indigo-700'));
    event.currentTarget.classList.add('bg-indigo-50', 'text-indigo-700');
}

function mudarSubAba(sub) {
    document.querySelectorAll('.sub-aba-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(sub).classList.remove('hidden');
}

function fecharModal() { document.getElementById('modalW2P').classList.add('hidden'); }
function renderCadastrosFiltros() {
    document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
}
function limparFormProd() {
    document.getElementById('prodId').value = '';
    document.getElementById('prodNome').value = '';
    document.getElementById('prodPreco').value = '';
    document.getElementById('listaAtributos').innerHTML = '';
}
