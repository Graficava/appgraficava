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

// --- PRODUTOS (REGRAS COMPLEXAS) ---
function ajustarCamposProduto() {
    const r = document.getElementById('prodRegraPreco').value;
    document.getElementById('boxPrecoBase').style.display = (r === 'pacote' || r === 'progressivo') ? 'none' : 'block';
    document.getElementById('boxPacotes').style.display = r === 'pacote' ? 'block' : 'none';
    document.getElementById('boxProgressivo').style.display = r === 'progressivo' ? 'block' : 'none';
    document.getElementById('boxMedidas').style.display = r === 'm2' ? 'grid' : 'none';
}

function addLinhaPacote(q='', p='') {
    const div = document.createElement('div');
    div.className = "flex gap-2";
    div.innerHTML = `<input type="number" placeholder="Qtd" value="${q}" class="q w-full p-2 border rounded-lg"><input type="number" placeholder="Preço Total" value="${p}" class="p w-full p-2 border rounded-lg font-bold text-amber-600"><button onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradePacotes').appendChild(div);
}

function addLinhaProgressivo(q='', p='') {
    const div = document.createElement('div');
    div.className = "flex gap-2";
    div.innerHTML = `<input type="number" placeholder="Qtd Mín" value="${q}" class="q w-full p-2 border rounded-lg"><input type="number" placeholder="Preço Unit" value="${p}" class="p w-full p-2 border rounded-lg font-bold text-emerald-600"><button onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradeProgressivo').appendChild(div);
}

function addAtributo(nome = '', opcoes = []) {
    const div = document.createElement('div');
    div.className = "bg-white p-5 rounded-2xl border border-slate-100 shadow-sm item-atrib";
    div.innerHTML = `
        <div class="flex gap-2 mb-4">
            <input type="text" placeholder="Atributo" value="${nome}" class="atrib-nome flex-1 font-bold p-2 border-b-2 border-indigo-50 outline-none">
            <button onclick="this.parentElement.parentElement.remove()" class="text-red-300">✕</button>
        </div>
        <div class="lista-opcoes space-y-2"></div>
        <button onclick="addOpcaoAtrib(this)" class="mt-4 text-[10px] font-bold uppercase text-indigo-400">+ Add Opção</button>
    `;
    document.getElementById('listaAtributos').appendChild(div);
    if(opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(div.querySelector('button:last-child'), o.nome, o.preco));
    else addOpcaoAtrib(div.querySelector('button:last-child'));
}

function addOpcaoAtrib(btn, n = '', p = '') {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-opcao";
    div.innerHTML = `<input type="text" placeholder="Opção" value="${n}" class="op-nome flex-1 text-xs p-2 border rounded-lg bg-slate-50"><input type="number" placeholder="R$" value="${p}" class="op-preco w-20 text-xs p-2 border rounded-lg bg-slate-50 font-bold"><button onclick="this.parentElement.remove()" class="text-slate-300">✕</button>`;
    btn.previousElementSibling.appendChild(div);
}

function atualizarListaAcabamentosProduto(salvos = []) {
    const container = document.getElementById('listaCheckAcabamentos');
    if(!container) return;
    const cat = document.getElementById('prodCategoria').value;
    const filtrados = bdAcabamentos.filter(a => a.categoria === cat || a.categoria === "Geral");
    container.innerHTML = filtrados.map(a => {
        const obj = salvos.find(s => (s.id || s) === a.id);
        const checked = obj ? 'checked' : '';
        const starAtiva = (obj && obj.padrao) ? 'text-amber-400' : 'text-slate-200';
        return `<div class="flex items-center justify-between p-2 bg-white border rounded-xl"><label class="text-xs font-bold flex items-center gap-2 cursor-pointer"><input type="checkbox" class="check-acab-prod" value="${a.id}" ${checked}> ${a.nome}</label><i class="fa fa-star cursor-pointer star-padrao ${starAtiva}" onclick="this.classList.toggle('text-amber-400'); this.classList.toggle('text-slate-200')"></i></div>`;
    }).join('');
}

// --- MODAL PDV ---
function abrirConfigurador(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdPrecoBase').value = p.preco || 0;
    document.getElementById('modalProdRegra').value = p.regraPreco;
    document.getElementById('modalHeaderImg').style.backgroundImage = `url('${p.foto || 'https://via.placeholder.com/400'}')`;
    
    const divMedidas = document.getElementById('modalCorpoMedidas');
    const regra = p.regraPreco;

    if(regra === 'm2') {
        divMedidas.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Largura (m)</label><input type="number" id="w2pLargura" value="1.00" step="0.01" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded-2xl bg-slate-50 font-black"></div>
            <div class="space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Altura (m)</label><input type="number" id="w2pAltura" value="1.00" step="0.01" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded-2xl bg-slate-50 font-black"></div>
            <div class="space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Quantidade</label><input type="number" id="w2pQtd" value="1" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded-2xl bg-slate-50 font-black"></div>
        `;
    } else if(regra === 'pacote') {
        let opts = (p.pacotes || []).map(pct => `<option value="${pct.qtd}" data-preco="${pct.preco}">${pct.qtd} un - R$ ${pct.preco.toFixed(2)}</option>`).join('');
        divMedidas.innerHTML = `<div class="col-span-2 space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Escolha o Pacote</label><select id="w2pPacote" onchange="calcularPrecoAoVivo()" class="w-full p-4 border rounded-2xl bg-slate-50 font-black">${opts}</select></div>`;
    } else {
        divMedidas.innerHTML = `<div class="col-span-2 space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded-2xl bg-slate-50 font-black"></div>`;
    }

    document.getElementById('modalCorpoVariacoes').innerHTML = (p.atributos || []).map(a => `
        <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">${a.nome}</label>
            <select class="sel-var w-full p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-sm" onchange="calcularPrecoAoVivo()">
                ${a.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+ R$ ${o.preco.toFixed(2)})</option>`).join('')}
            </select>
        </div>
    `).join('');

    const acabPermitidos = p.acabamentos || [];
    document.getElementById('modalCorpoAcabamentos').innerHTML = acabPermitidos.map(obj => {
        const a = bdAcabamentos.find(x => x.id === (obj.id || obj));
        if(!a) return '';
        const sel = obj.padrao ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-100';
        return `<button onclick="this.classList.toggle('bg-indigo-600'); this.classList.toggle('text-white'); calcularPrecoAoVivo()" data-id="${a.id}" data-preco="${a.venda}" data-regra="${a.regra}" class="acab-btn-modal p-3 rounded-xl border font-bold text-xs transition-all ${sel}">${a.nome} (+ R$ ${a.venda.toFixed(2)})</button>`;
    }).join('');

    document.getElementById('modalW2P').classList.remove('hidden');
    calcularPrecoAoVivo();
}

function calcularPrecoAoVivo() {
    const regra = document.getElementById('modalProdRegra').value;
    const base = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    let extraVar = 0;
    document.querySelectorAll('.sel-var').forEach(s => extraVar += parseFloat(s.value));

    let qtd = 1; let totalBase = 0; let m2 = 1;

    if(regra === 'm2') {
        const l = parseFloat(document.getElementById('w2pLargura').value) || 0;
        const a = parseFloat(document.getElementById('w2pAltura').value) || 0;
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        m2 = l * a;
        totalBase = (base + extraVar) * m2 * qtd;
    } else if(regra === 'pacote') {
        const sel = document.getElementById('w2pPacote');
        qtd = parseInt(sel.value) || 1;
        totalBase = (parseFloat(sel.options[sel.selectedIndex]?.dataset.preco) || 0) + (extraVar * qtd);
    } else {
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        totalBase = (base + extraVar) * qtd;
    }

    let totalAcab = 0;
    document.querySelectorAll('.acab-btn-modal.bg-indigo-600').forEach(btn => {
        const pA = parseFloat(btn.dataset.preco);
        const rA = btn.dataset.regra;
        if(rA === 'm2') totalAcab += pA * m2 * qtd;
        else if(rA === 'lote') totalAcab += pA;
        else totalAcab += pA * qtd;
    });

    document.getElementById('modalSubtotal').innerText = "R$ " + (totalBase + totalAcab).toFixed(2);
}

function confirmarAdicaoCarrinho() {
    const p = bdProdutos.find(x => x.id === document.getElementById('modalProdId').value);
    const totalItem = parseFloat(document.getElementById('modalSubtotal').innerText.replace("R$ ",""));
    const qtd = document.getElementById('w2pQtd')?.value || 1;
    let varsEscolhidas = [];
    document.querySelectorAll('.sel-var').forEach(s => varsEscolhidas.push(s.options[s.selectedIndex].text.split(" (+")[0]));
    carrinho.push({ nome: p.nome, valor: totalItem, desc: `${qtd} un. | ${varsEscolhidas.join(' | ')}` });
    fecharModal(); renderCarrinho();
}

// --- CARRINHO E SINAL ---
function renderCarrinho() {
    const div = document.getElementById('listaCarrinho');
    if(!div) return;
    let sub = 0;
    div.innerHTML = carrinho.map((item, i) => {
        sub += item.valor;
        return `<div class="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100"><div class="max-w-[70%]"><p class="font-bold text-slate-800 text-xs">${item.nome}</p><p class="text-[9px] font-medium text-slate-400">${item.desc}</p></div><div class="text-right"><p class="font-black text-indigo-600 text-sm">R$ ${item.valor.toFixed(2)}</p><button onclick="carrinho.splice(${i},1);renderCarrinho()" class="text-[9px] font-bold text-red-400 uppercase">Remover</button></div></div>`;
    }).join('');
    document.getElementById('subtotalCart').innerText = "R$ " + sub.toFixed(2);
    atualizarTotalFinal();
}

function atualizarTotalFinal() {
    const sub = parseFloat(document.getElementById('subtotalCart').innerText.replace("R$ ","")) || 0;
    const frete = parseFloat(document.getElementById('cartFreteValor').value) || 0;
    const pago = parseFloat(document.getElementById('cartValorPago').value) || 0;
    const totalPedido = sub + frete;
    const saldo = totalPedido - pago;
    document.getElementById('totalCarrinho').innerText = "R$ " + totalPedido.toFixed(2);
    document.getElementById('cartSaldoDevedor').innerText = "R$ " + saldo.toFixed(2);
}

// --- RESTANTE DAS FUNÇÕES (CADASTROS E NAVEGAÇÃO) ---
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
function renderCat() { document.getElementById('listaCategoriasTab').innerHTML = bdCategorias.map(c => `<tr class="border-b border-slate-50"><td class="p-4 font-bold text-slate-600">${c.nome}</td><td class="p-4 text-right"><button onclick="editCat('${c.id}')" class="text-indigo-500 mr-3">Editar</button><button onclick="db.collection('categorias').doc('${c.id}').delete()" class="text-red-300">✕</button></td></tr>`).join(''); document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join(''); document.getElementById('acabCategoria').innerHTML = document.getElementById('prodCategoria').innerHTML; }
function renderProdTable() { document.getElementById('listaProdutosTab').innerHTML = bdProdutos.map(p => `<tr class="border-b border-slate-50 hover:bg-slate-50 transition"><td class="p-5 font-bold">${p.nome}</td><td class="p-5 text-slate-400 text-[10px] uppercase">${p.regraPreco}</td><td class="p-5 text-center"><button onclick="editProd('${p.id}')" class="text-indigo-500 mr-4 font-bold text-xs uppercase">Editar</button><button onclick="db.collection('produtos').doc('${p.id}').delete()" class="text-red-300 font-bold text-xs">X</button></td></tr>`).join(''); }
function renderCliSelectCart() { document.getElementById('cartCliente').innerHTML = `<option value="">Consumidor Final</option>` + bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join(''); }
function toggleOpcoesPagamento() { document.getElementById('divParcelas').style.display = (document.getElementById('cartPagamento').value === 'Credito_Parcelado') ? 'block' : 'none'; }
function toggleOpcoesEntrega() { const v = document.getElementById('cartEntrega').value; document.getElementById('divFrete').style.display = (v === 'Retirada') ? 'none' : 'block'; atualizarTotalFinal(); }
