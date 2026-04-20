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

// --- CADASTROS ---
async function salvarCliente() {
    const d = {
        nome: document.getElementById('cliNome').value,
        documento: document.getElementById('cliDoc').value,
        telefone: document.getElementById('cliTel').value,
        endereco: document.getElementById('cliEnd').value
    };
    if(!d.nome) return alert("Nome obrigatório");
    await db.collection("clientes").add(d);
    alert("Cliente salvo!");
    document.querySelectorAll('#sub-cli input').forEach(i => i.value = '');
}

function renderCliTable() {
    document.getElementById('listaClientesTab').innerHTML = bdClientes.map(c => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-5 font-semibold text-slate-700">${c.nome}</td>
            <td class="p-5 text-slate-400">${c.documento || '-'}</td>
            <td class="p-5 text-center"><button onclick="db.collection('clientes').doc('${c.id}').delete()" class="text-red-300 hover:text-red-600 transition">✕</button></td>
        </tr>
    `).join('');
}

async function salvarCategoria() {
    const n = document.getElementById('catNome').value;
    if(n) await db.collection("categorias").add({nome: n});
    document.getElementById('catNome').value = '';
}

function renderCat() {
    document.getElementById('listaCategoriasTab').innerHTML = bdCategorias.map(c => `
        <tr class="border-b border-slate-50">
            <td class="p-4 font-medium">${c.nome}</td>
            <td class="p-4 text-right"><button onclick="db.collection('categorias').doc('${c.id}').delete()" class="text-red-400">Remover</button></td>
        </tr>
    `).join('');
    document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
}

// --- PRODUTOS E VARIAÇÕES ---
function addAtributo(nome = '', opcoes = []) {
    const div = document.createElement('div');
    div.className = "bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm item-atrib";
    div.innerHTML = `
        <div class="flex gap-2 mb-4">
            <input type="text" placeholder="Atributo (ex: Papel)" value="${nome}" class="atrib-nome flex-1 font-bold p-2 border-b-2 border-indigo-50 outline-none focus:border-indigo-500 transition-all">
            <button onclick="this.parentElement.parentElement.remove()" class="text-red-400">✕</button>
        </div>
        <div class="lista-opcoes space-y-2"></div>
        <button onclick="addOpcaoAtrib(this)" class="mt-4 text-[10px] font-bold uppercase text-indigo-400 hover:text-indigo-600">+ Adicionar Opção</button>
    `;
    document.getElementById('listaAtributos').appendChild(div);
    if(opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(div.querySelector('.mt-4'), o.nome, o.preco));
    else addOpcaoAtrib(div.querySelector('.mt-4'));
}

function addOpcaoAtrib(btn, n = '', p = '') {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-opcao animate-fadeIn";
    div.innerHTML = `
        <input type="text" placeholder="Ex: Couché 250g" value="${n}" class="op-nome flex-1 text-xs p-2 border border-slate-100 rounded-lg bg-slate-50">
        <input type="number" placeholder="R$" value="${p}" class="op-preco w-20 text-xs p-2 border border-slate-100 rounded-lg bg-slate-50 font-bold">
        <button onclick="this.parentElement.remove()" class="text-slate-300 hover:text-red-500">✕</button>
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
    alert("Produto salvo!");
    location.reload();
}

function renderProdTable() {
    document.getElementById('listaProdutosTab').innerHTML = bdProdutos.map(p => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-5 font-bold text-slate-700">${p.nome}</td>
            <td class="p-5 text-slate-400 text-xs uppercase font-semibold">${p.categoria}</td>
            <td class="p-5 text-center">
                <button onclick="editProd('${p.id}')" class="text-indigo-500 mr-4 font-bold text-xs">EDITAR</button>
                <button onclick="db.collection('produtos').doc('${p.id}').delete()" class="text-red-300 font-bold text-xs">X</button>
            </td>
        </tr>
    `).join('');
}

function editProd(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodNome').value = p.nome;
    document.getElementById('prodCategoria').value = p.categoria;
    document.getElementById('prodPreco').value = p.preco;
    document.getElementById('prodFoto').value = p.foto;
    document.getElementById('listaAtributos').innerHTML = '';
    if(p.atributos) p.atributos.forEach(a => addAtributo(a.nome, a.opcoes));
    mudarSubAba('sub-prod', document.querySelectorAll('.sub-aba-btn')[1]);
}

// --- LOJA PDV ---
function renderFiltrosVitrine() {
    const div = document.getElementById('menuFiltroCat');
    div.innerHTML = `<button onclick="renderVitrine('Todos')" class="px-5 py-2 bg-white border border-slate-100 rounded-full font-bold text-xs shadow-sm hover:bg-indigo-600 hover:text-white transition">Todos</button>` + 
        bdCategorias.map(c => `<button onclick="renderVitrine('${c.nome}')" class="px-5 py-2 bg-white border border-slate-100 rounded-full font-bold text-xs shadow-sm hover:bg-indigo-600 hover:text-white transition">${c.nome}</button>`).join('');
}

function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos');
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    grid.innerHTML = prods.map(p => `
        <div onclick="abrirConfigurador('${p.id}')" class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 cursor-pointer transition-all group">
            <div class="h-44 bg-slate-50 rounded-2xl mb-5 bg-contain bg-no-repeat bg-center transition-transform group-hover:scale-105" style="background-image:url('${p.foto || 'https://via.placeholder.com/200'}')"></div>
            <h4 class="font-bold text-slate-800 text-sm mb-1 truncate">${p.nome}</h4>
            <p class="text-[10px] font-bold text-slate-300 uppercase mb-4">${p.categoria}</p>
            <p class="text-xl font-black text-indigo-600">R$ ${p.preco.toFixed(2)}</p>
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
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">${a.nome}</label>
            <select class="sel-var w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500" onchange="calcularPrecoAoVivo()">
                ${a.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+ R$ ${o.preco.toFixed(2)})</option>`).join('')}
            </select>
        </div>
    `).join('');

    document.getElementById('modalW2P').classList.remove('hidden');
    document.getElementById('w2pQtd').value = 1;
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
    const totalItem = parseFloat(document.getElementById('modalSubtotal').innerText.replace("R$ ",""));
    const qtd = document.getElementById('w2pQtd').value;
    
    let varsEscolhidas = [];
    document.querySelectorAll('.sel-var').forEach(s => {
        varsEscolhidas.push(s.options[s.selectedIndex].text.split(" (+")[0]);
    });

    carrinho.push({ 
        nome: p.nome, 
        valor: totalItem, 
        desc: `${qtd} un. | ${varsEscolhidas.join(' | ')}` 
    });
    
    fecharModal();
    renderCarrinho();
}

// --- CARRINHO E FINANCEIRO ---
function renderCarrinho() {
    const div = document.getElementById('listaCarrinho');
    let sub = 0;
    div.innerHTML = carrinho.map((item, i) => {
        sub += item.valor;
        return `
            <div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-fadeIn">
                <div class="max-w-[70%]">
                    <p class="font-bold text-slate-800 text-xs">${item.nome}</p>
                    <p class="text-[9px] font-medium text-slate-400 leading-tight">${item.desc}</p>
                </div>
                <div class="text-right">
                    <p class="font-black text-indigo-600 text-sm">R$ ${item.valor.toFixed(2)}</p>
                    <button onclick="carrinho.splice(${i},1);renderCarrinho()" class="text-[9px] font-bold text-red-400 hover:text-red-600 uppercase">Remover</button>
                </div>
            </div>
        `;
    }).join('');
    document.getElementById('subtotalCart').innerText = "R$ " + sub.toFixed(2);
    atualizarTotalFinal();
}

function atualizarTotalFinal() {
    const sub = parseFloat(document.getElementById('subtotalCart').innerText.replace("R$ ","")) || 0;
    const frete = parseFloat(document.getElementById('cartFreteValor').value) || 0;
    const total = sub + frete;
    document.getElementById('totalCarrinho').innerText = "R$ " + total.toFixed(2);
}

function toggleOpcoesPagamento() {
    const v = document.getElementById('cartPagamento').value;
    document.getElementById('divParcelas').style.display = (v === 'Credito_Parcelado') ? 'block' : 'none';
}

function toggleOpcoesEntrega() {
    const v = document.getElementById('cartEntrega').value;
    document.getElementById('divFrete').style.display = (v === 'Retirada') ? 'none' : 'block';
    if(v === 'Retirada') document.getElementById('cartFreteValor').value = 0;
    atualizarTotalFinal();
}

function renderCliSelectCart() {
    const opts = bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    document.getElementById('cartCliente').innerHTML = `<option value="">Consumidor Final</option>` + opts;
}

function enviarPedido() {
    if(carrinho.length === 0) return alert("Carrinho vazio!");
    const total = document.getElementById('totalCarrinho').innerText;
    alert(`PEDIDO FINALIZADO!\nTotal: ${total}\nForma: ${document.getElementById('cartPagamento').value}`);
    carrinho = [];
    renderCarrinho();
}

// --- NAVEGAÇÃO ---
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
