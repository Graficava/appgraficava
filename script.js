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

// Monitor de Login
auth.onAuthStateChanged(user => {
    document.getElementById('telaLogin').classList.toggle('hidden', !!user);
    document.getElementById('appInterface').classList.toggle('hidden', !user);
    if (user) iniciarLeitura();
});

function entrar() {
    const e = document.getElementById('email').value;
    const s = document.getElementById('senha').value;
    auth.signInWithEmailAndPassword(e, s).catch(() => document.getElementById('msgErro').classList.remove('hidden'));
}

function sair() { auth.signOut(); }

// Leitura de Dados em Tempo Real
function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { 
        bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCat(); 
        renderFiltrosVitrine();
    });
    db.collection("produtos").onSnapshot(s => { 
        bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderVitrine();
        renderProdTable();
    });
    db.collection("clientes").orderBy("nome").onSnapshot(s => { 
        bdClientes = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCliTable();
        renderCliSelectCart();
    });
}

// --- CADASTRO: CLIENTES ---
async function salvarCliente() {
    const d = {
        nome: document.getElementById('cliNome').value,
        documento: document.getElementById('cliDoc').value,
        telefone: document.getElementById('cliTel').value,
        endereco: document.getElementById('cliEnd').value
    };
    if(!d.nome) return alert("Nome é obrigatório");
    await db.collection("clientes").add(d);
    alert("Cliente Cadastrado!");
    document.querySelectorAll('#sub-cli input').forEach(i => i.value = '');
}

function renderCliTable() {
    document.getElementById('listaClientesTab').innerHTML = bdClientes.map(c => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4 font-bold text-gray-700">${c.nome}</td>
            <td class="p-4 text-gray-400">${c.documento || '-'}</td>
            <td class="p-4 text-center">
                <button onclick="db.collection('clientes').doc('${c.id}').delete()" class="text-red-500 hover:scale-125 transition inline-block">×</button>
            </td>
        </tr>
    `).join('');
}

// --- CADASTRO: CATEGORIAS ---
async function salvarCategoria() {
    const nome = document.getElementById('catNome').value;
    if(!nome) return;
    await db.collection("categorias").add({nome: nome});
    document.getElementById('catNome').value = '';
}

function renderCat() {
    document.getElementById('listaCategoriasTab').innerHTML = bdCategorias.map(c => `
        <tr class="border-b">
            <td class="p-4">${c.nome}</td>
            <td class="p-4 text-right"><button onclick="db.collection('categorias').doc('${c.id}').delete()" class="text-red-500">Excluir</button></td>
        </tr>
    `).join('');
    document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
}

// --- CADASTRO: PRODUTOS ---
function addAtributo(nome = '', opcoes = []) {
    const div = document.createElement('div');
    div.className = "bg-white p-4 rounded-2xl border border-indigo-200 shadow-sm item-atrib";
    div.innerHTML = `
        <div class="flex gap-2 mb-3">
            <input type="text" placeholder="Nome (Ex: Papel)" value="${nome}" class="atrib-nome flex-1 font-black p-2 border-b-2 border-indigo-100 outline-none">
            <button onclick="this.parentElement.parentElement.remove()" class="text-red-500 font-black">×</button>
        </div>
        <div class="lista-opcoes space-y-2"></div>
        <button onclick="addOpcaoAtrib(this)" class="mt-3 text-[10px] font-black uppercase text-indigo-500 hover:underline">+ Add Opção de Valor</button>
    `;
    document.getElementById('listaAtributos').appendChild(div);
    if(opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(div.querySelector('.mt-3'), o.nome, o.preco));
}

function addOpcaoAtrib(btn, n = '', p = '') {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-opcao";
    div.innerHTML = `
        <input type="text" placeholder="Opção" value="${n}" class="op-nome flex-1 text-xs p-2 border rounded-lg bg-gray-50">
        <input type="number" placeholder="R$" value="${p}" class="op-preco w-20 text-xs p-2 border rounded-lg bg-gray-50 font-bold">
        <button onclick="this.parentElement.remove()" class="text-gray-300 hover:text-red-500">×</button>
    `;
    btn.previousElementSibling.appendChild(div);
}

async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    let atributos = [];
    document.querySelectorAll('.item-atrib').forEach(caixa => {
        let ops = [];
        caixa.querySelectorAll('.item-opcao').forEach(l => {
            ops.push({ nome: l.querySelector('.op-nome').value, preco: parseFloat(l.querySelector('.op-preco').value) || 0 });
        });
        atributos.push({ nome: caixa.querySelector('.atrib-nome').value, opcoes: ops });
    });

    const d = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        foto: document.getElementById('prodFoto').value,
        atributos: atributos
    };

    if(id) await db.collection("produtos").doc(id).update(d); else await db.collection("produtos").add(d);
    alert("Produto Salvo!");
    location.reload();
}

function renderProdTable() {
    document.getElementById('listaProdutosTab').innerHTML = bdProdutos.map(p => `
        <tr class="border-b hover:bg-gray-50">
            <td class="p-4 font-black text-indigo-900">${p.nome}</td>
            <td class="p-4 text-gray-400 uppercase text-[10px]">${p.categoria}</td>
            <td class="p-4 text-center">
                <button onclick="db.collection('produtos').doc('${p.id}').delete()" class="bg-red-50 text-red-500 px-3 py-1 rounded-lg text-xs font-black">EXCLUIR</button>
            </td>
        </tr>
    `).join('');
}

// --- PDV: LOJA E CONFIGURADOR ---
function renderFiltrosVitrine() {
    const div = document.getElementById('menuFiltroCat');
    div.innerHTML = `<button onclick="renderVitrine('Todos')" class="px-4 py-2 bg-white border rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition">Todos</button>` + 
        bdCategorias.map(c => `<button onclick="renderVitrine('${c.nome}')" class="px-4 py-2 bg-white border rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition">${c.nome}</button>`).join('');
}

function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos');
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    grid.innerHTML = prods.map(p => `
        <div onclick="abrirConfigurador('${p.id}')" class="bg-white p-5 rounded-3xl border border-transparent shadow-sm hover:border-indigo-600 hover:shadow-xl cursor-pointer transition-all group overflow-hidden">
            <div class="h-40 bg-gray-100 rounded-2xl mb-4 bg-contain bg-no-repeat bg-center group-hover:scale-110 transition" style="background-image:url('${p.foto || 'https://via.placeholder.com/200'}')"></div>
            <h4 class="font-black text-indigo-900 leading-tight mb-1 truncate">${p.nome}</h4>
            <p class="text-[10px] font-black text-gray-300 uppercase mb-3">${p.categoria}</p>
            <p class="text-2xl font-black text-indigo-600">R$ ${p.preco.toFixed(2)}</p>
        </div>
    `).join('');
}

function abrirConfigurador(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdPrecoBase').value = p.preco;
    document.getElementById('modalHeaderImg').style.backgroundImage = `url('${p.foto || 'https://via.placeholder.com/400'}')`;
    
    document.getElementById('modalCorpoVariacoes').innerHTML = (p.atributos || []).map(a => `
        <div class="space-y-1">
            <label class="text-[10px] font-black text-gray-400 uppercase">${a.nome}</label>
            <select class="sel-var w-full p-4 border rounded-2xl bg-gray-50 font-bold" onchange="calcularPrecoAoVivo()">
                ${a.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+R$ ${o.preco.toFixed(2)})</option>`).join('')}
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

function confirmarAdicaoCarrinho() {
    const p = bdProdutos.find(x => x.id === document.getElementById('modalProdId').value);
    const total = parseFloat(document.getElementById('modalSubtotal').innerText.replace("R$ ",""));
    const qtd = document.getElementById('w2pQtd').value;
    
    let vars = [];
    document.querySelectorAll('.sel-var').forEach(s => {
        const txt = s.options[s.selectedIndex].text.split(" (+")[0];
        vars.push(txt);
    });

    carrinho.push({ nome: p.nome, valor: total, desc: `${qtd} un. | ${vars.join(' | ')}` });
    fecharModal();
    renderCarrinho();
}

function renderCarrinho() {
    const div = document.getElementById('listaCarrinho');
    let total = 0;
    div.innerHTML = carrinho.map((item, i) => {
        total += item.valor;
        return `
            <div class="flex justify-between items-start bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 animate-fadeIn">
                <div>
                    <p class="font-black text-indigo-900 text-sm">${item.nome}</p>
                    <p class="text-[10px] font-bold text-indigo-400">${item.desc}</p>
                </div>
                <div class="text-right">
                    <p class="font-black text-indigo-600 text-sm">R$ ${item.valor.toFixed(2)}</p>
                    <button onclick="carrinho.splice(${i},1);renderCarrinho()" class="text-[9px] font-black text-red-400 uppercase">Remover</button>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('totalCarrinho').innerText = "R$ " + total.toFixed(2);
    document.getElementById('subtotalCart').innerText = "R$ " + total.toFixed(2);
}

function renderCliSelectCart() {
    document.getElementById('cartCliente').innerHTML = `<option value="">Selecionar Cliente</option>` + bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function enviarPedido() {
    if(carrinho.length === 0) return alert("Carrinho vazio!");
    alert("PEDIDO GERADO COM SUCESSO!");
    carrinho = [];
    renderCarrinho();
}

// --- NAVEGAÇÃO GERAL ---
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
