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

let bdCategorias = [], bdProdutos = [], bdClientes = [], bdPedidos = [], bdAcabamentos = [];
let carrinho = [];

// Monitor de Autenticação
auth.onAuthStateChanged(user => {
    const telaLogin = document.getElementById('telaLogin');
    const appInterface = document.getElementById('appInterface');
    if (user) {
        telaLogin.classList.add('hidden');
        appInterface.classList.remove('hidden');
        iniciarLeitura();
    } else {
        telaLogin.classList.remove('hidden');
        appInterface.classList.add('hidden');
    }
});

function entrar() {
    const e = document.getElementById('email').value;
    const s = document.getElementById('senha').value;
    if(!e || !s) return;
    auth.signInWithEmailAndPassword(e, s).catch(() => document.getElementById('msgErro').classList.remove('hidden'));
}

function sair() { auth.signOut(); }

function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { 
        bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCat(); renderFiltrosVitrine();
    });
    db.collection("produtos").onSnapshot(s => { 
        bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderVitrine(); renderProdTable();
    });
    db.collection("clientes").orderBy("nome").onSnapshot(s => { 
        bdClientes = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCliTable(); renderCliSelectCart();
    });
    db.collection("acabamentos").onSnapshot(s => {
        bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderAcabTable();
    });
    db.collection("pedidos").orderBy("data", "desc").limit(50).onSnapshot(s => {
        bdPedidos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderPedidosFinanceiro();
    });
}

// --- FUNÇÕES DE APOIO ---
function mudarAba(aba, btn) {
    document.querySelectorAll('.aba-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('aba-'+aba).classList.remove('hidden');
    document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active-aba'));
    btn.classList.add('active-aba');
}

function mudarSubAba(sub, btn) {
    document.querySelectorAll('.sub-aba-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(sub).classList.remove('hidden');
    document.querySelectorAll('.sub-aba-btn').forEach(b => b.classList.remove('active-sub', 'text-indigo-600'));
    btn.classList.add('active-sub', 'text-indigo-600');
}

function fecharModal() { document.getElementById('modalW2P').classList.add('hidden'); }

// --- RENDERIZAÇÕES ---
function renderCat() {
    const tab = document.getElementById('listaCategoriasTab');
    if(!tab) return;
    tab.innerHTML = bdCategorias.map(c => `<tr class="border-b border-slate-50"><td class="p-4 font-bold text-slate-600">${c.nome}</td><td class="p-4 text-right"><button onclick="editCat('${c.id}')" class="text-indigo-500 mr-3">Editar</button><button onclick="db.collection('categorias').doc('${c.id}').delete()" class="text-red-300">✕</button></td></tr>`).join('');
    document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
}

function renderCliSelectCart() {
    const sel = document.getElementById('cartCliente');
    if(!sel) return;
    sel.innerHTML = `<option value="">Consumidor Final</option>` + bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos');
    if(!grid) return;
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    grid.innerHTML = prods.map(p => `
        <div onclick="abrirConfigurador('${p.id}')" class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl cursor-pointer transition-all group">
            <div class="h-44 bg-slate-50 rounded-2xl mb-5 bg-contain bg-no-repeat bg-center transition group-hover:scale-105" style="background-image:url('${p.foto || 'https://via.placeholder.com/200'}')"></div>
            <h4 class="font-bold text-slate-800 text-sm mb-1 truncate">${p.nome}</h4>
            <p class="text-[10px] font-bold text-slate-300 uppercase mb-4">${p.categoria}</p>
            <p class="text-xl font-black text-indigo-600">R$ ${p.preco.toFixed(2)}</p>
        </div>
    `).join('');
}

// --- LÓGICA DE CARRINHO E SINAL ---
function atualizarTotalFinal() {
    const sub = parseFloat(document.getElementById('subtotalCart').innerText.replace("R$ ","")) || 0;
    const frete = parseFloat(document.getElementById('cartFreteValor').value) || 0;
    const pago = parseFloat(document.getElementById('cartValorPago').value) || 0;
    const totalPedido = sub + frete;
    const saldo = totalPedido - pago;
    document.getElementById('totalCarrinho').innerText = "R$ " + totalPedido.toFixed(2);
    document.getElementById('cartSaldoDevedor').innerText = "R$ " + saldo.toFixed(2);
}

function toggleOpcoesPagamento() {
    const v = document.getElementById('cartPagamento').value;
    document.getElementById('divParcelas').style.display = (v === 'Credito_Parcelado') ? 'block' : 'none';
}

function toggleOpcoesEntrega() {
    const v = document.getElementById('cartEntrega').value;
    document.getElementById('divFrete').style.display = (v === 'Retirada') ? 'none' : 'block';
    atualizarTotalFinal();
}

// ... (Restante das funções de salvar e editar permanecem as mesmas)
