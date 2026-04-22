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

let bdCategorias = [], bdProdutos = [], bdClientes = [], bdPedidos = [], bdAcabamentos =[];
let carrinho =[];

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
    const e = document.getElementById('email')?.value || '';
    const s = document.getElementById('senha')?.value || '';
    if(!e || !s) return;
    auth.signInWithEmailAndPassword(e, s).catch(() => document.getElementById('msgErro')?.classList.remove('hidden'));
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
        renderAcabTable(); atualizarListaAcabamentosProduto();
    });
    db.collection("pedidos").orderBy("data", "desc").limit(50).onSnapshot(s => {
        bdPedidos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderPedidosFinanceiro();
    });
}

// --- PRODUTOS E ATRIBUTOS ---
function ajustarCamposProduto() {
    const r = document.getElementById('prodRegraPreco')?.value;
    const pre = document.getElementById('boxPrecoBase');
    const pac = document.getElementById('boxPacotes');
    const pro = document.getElementById('boxProgressivo');
    const med = document.getElementById('boxMedidas');
    if(pre) pre.style.display = (r === 'pacote' || r === 'progressivo') ? 'none' : 'block';
    if(pac) pac.style.display = r === 'pacote' ? 'block' : 'none';
    if(pro) pro.style.display = r === 'progressivo' ? 'block' : 'none';
    if(med) med.style.display = r === 'm2' ? 'grid' : 'none';
}

function addLinhaPacote(q='', p='') {
    const div = document.createElement('div');
    div.className = "flex gap-2";
    div.innerHTML = `<input type="number" placeholder="Qtd" value="${q}" class="q w-full p-2 border rounded text-xs"><input type="number" placeholder="Total R$" value="${p}" class="p w-full p-2 border rounded font-bold text-amber-600 text-xs"><button onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradePacotes')?.appendChild(div);
}

function addLinhaProgressivo(q='', p='') {
    const div = document.createElement('div');
    div.className = "flex gap-2";
    div.innerHTML = `<input type="number" placeholder="Qtd Mín" value="${q}" class="q w-full p-2 border rounded text-xs"><input type="number" placeholder="Unit R$" value="${p}" class="p w-full p-2 border rounded font-bold text-emerald-600 text-xs"><button onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradeProgressivo')?.appendChild(div);
}

function addOpcaoAtrib(container, n = '', p = '') {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-opcao";
    div.innerHTML = `<input type="text" placeholder="Opção" value="${n}" class="op-nome flex-1 text-xs p-2 border rounded bg-slate-50"><input type="number" placeholder="R$" value="${p}" class="op-preco w-20 text-xs p-2 border rounded bg-slate-50 font-bold"><button onclick="this.parentElement.remove()" class="text-slate-300 hover:text-red-500">✕</button>`;
    container.appendChild(div);
}

function addAtributo(nome = '', opcoes =[]) {
    const div = document.createElement('div');
    div.className = "bg-white p-4 rounded border border-slate-100 shadow-sm item-atrib";
    div.innerHTML = `<div class="flex gap-2 mb-3"><input type="text" placeholder="Grupo (ex: Papel)" value="${nome}" class="atrib-nome flex-1 font-bold text-sm p-2 border-b-2 border-indigo-50 outline-none"><button onclick="this.parentElement.parentElement.remove()" class="text-red-300">✕</button></div><div class="lista-opcoes space-y-2"></div><button type="button" class="btn-add-op mt-3 text-[10px] font-bold uppercase text-indigo-400">+ Add Opção</button>`;
    document.getElementById('listaAtributos')?.appendChild(div);
    const containerOpcoes = div.querySelector('.lista-opcoes');
    div.querySelector('.btn-add-op').onclick = () => addOpcaoAtrib(containerOpcoes);
    if(opcoes && opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(containerOpcoes, o.nome, o.preco));
    else addOpcaoAtrib(containerOpcoes);
}

function addAtributoManual() { addAtributo('', []); }

function atualizarListaAcabamentosProduto(salvos =[]) {
    const container = document.getElementById('listaCheckAcabamentos');
    const catSelect = document.getElementById('prodCategoria');
    if(!container || !catSelect) return;
    const cat = catSelect.value;
    const filtrados = bdAcabamentos.filter(a => a.categoria === cat || a.categoria === "Geral");
    container.innerHTML = filtrados.map(a => {
        const obj = salvos.find(s => (s.id || s) === a.id);
        const checked = obj ? 'checked' : '';
        const starAtiva = (obj && obj.padrao) ? 'text-amber-400' : 'text-slate-200';
        return `<div class="flex items-center justify-between p-2 bg-white border rounded"><label class="text-[10px] font-bold flex items-center gap-2 cursor-pointer"><input type="checkbox" class="check-acab-prod" value="${a.id}" ${checked}> ${a.nome}</label><i class="fa fa-star cursor-pointer star-padrao ${starAtiva}" onclick="this.classList.toggle('text-amber-400'); this.classList.toggle('text-slate-200')"></i></div>`;
    }).join('');
}

async function salvarProduto() {
    const id = document.getElementById('prodId')?.value;
    
    let atributos =[];
    document.querySelectorAll('.item-atrib').forEach(caixa => {
        let ops =[];
        caixa.querySelectorAll('.item-opcao').forEach(l => {
            const n = l.querySelector('.op-nome')?.value;
            const p = parseFloat(l.querySelector('.op-preco')?.value) || 0;
            if(n) ops.push({ nome: n, preco: p });
        });
        const nomeAtrib = caixa.querySelector('.atrib-nome')?.value;
        if(nomeAtrib) atributos.push({ nome: nomeAtrib, opcoes: ops });
    });

    let acabList =[];
    document.querySelectorAll('.check-acab-prod:checked').forEach(chk => {
        const star = chk.closest('div').querySelector('.star-padrao');
        acabList.push({ id: chk.value, padrao: star.classList.contains('text-amber-400') });
    });

    let pacotes =[];
    document.querySelectorAll('#listaGradePacotes > div').forEach(d => {
        const q = parseInt(d.querySelector('.q')?.value); 
        const p = parseFloat(d.querySelector('.p')?.value);
        if(q && p) pacotes.push({ qtd: q, preco: p });
    });

    let progressivo =[];
    document.querySelectorAll('#listaGradeProgressivo > div').forEach(d => {
        const q = parseInt(d.querySelector('.q')?.value); 
        const p = parseFloat(d.querySelector('.p')?.value);
        if(q && p) progressivo.push({ q: q, p: p });
    });

    const d = {
        nome: document.getElementById('prodNome')?.value || '',
        categoria: document.getElementById('prodCategoria')?.value || '',
        regraPreco: document.getElementById('prodRegraPreco')?.value || 'unidade',
        preco: parseFloat(document.getElementById('prodPreco')?.value) || 0,
        foto: document.getElementById('prodFoto')?.value || '',
        ref: document.getElementById('prodRef')?.value || '',
        material: document.getElementById('prodMaterial')?.value || '',
        gramatura: document.getElementById('prodGramatura')?.value || '',
        prazo: parseInt(document.getElementById('prodPrazo')?.value) || 0,
        larguraBobina: parseFloat(document.getElementById('prodLargBobina')?.value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax')?.value) || 0,
        compMax: parseFloat(document.getElementById('prodCompMax')?.value) || 0,
        atributos: atributos,
        acabamentos: acabList,
        pacotes: pacotes,
        progressivo: progressivo
    };

    if(!d.nome) return alert("O Nome do produto é obrigatório!");

    try {
        if(id) await db.collection("produtos").doc(id).update(d);
        else await db.collection("produtos").add(d);
        alert("Produto salvo com sucesso!");
        location.reload();
    } catch (e) {
        console.error(e);
        alert("Erro ao salvar produto no banco.");
    }
}

function editProd(id) {
    const p = bdProdutos.find(x => x.id === id);
    if(!p) return;
    
    if(document.getElementById('prodId')) document.getElementById('prodId').value = p.id;
    if(document.getElementById('prodNome')) document.getElementById('prodNome').value = p.nome || '';
    if(document.getElementById('prodCategoria')) document.getElementById('prodCategoria').value = p.categoria || '';
    if(document.getElementById('prodRegraPreco')) document.getElementById('prodRegraPreco').value = p.regraPreco || 'unidade';
    if(document.getElementById('prodPreco')) document.getElementById('prodPreco').value = p.preco || 0;
    if(document.getElementById('prodFoto')) document.getElementById('prodFoto').value = p.foto || '';
    if(document.getElementById('prodRef')) document.getElementById('prodRef').value = p.ref || '';
    if(document.getElementById('prodMaterial')) document.getElementById('prodMaterial').value = p.material || '';
    if(document.getElementById('prodGramatura')) document.getElementById('prodGramatura').value = p.gramatura || '';
    if(document.getElementById('prodPrazo')) document.getElementById('prodPrazo').value = p.prazo || 0;
    if(document.getElementById('prodLargBobina')) document.getElementById('prodLargBobina').value = p.larguraBobina || 0;
    if(document.getElementById('prodLargMax')) document.getElementById('prodLargMax').value = p.larguraMax || 0;
    if(document.getElementById('prodCompMax')) document.getElementById('prodCompMax').value = p.compMax || 0;
    
    const divAtrib = document.getElementById('listaAtributos');
    if(divAtrib) { divAtrib.innerHTML = ''; if(p.atributos) p.atributos.forEach(a => addAtributo(a.nome, a.opcoes)); }
    
    const divPac = document.getElementById('listaGradePacotes');
    if(divPac) { divPac.innerHTML = ''; if(p.pacotes) p.pacotes.forEach(pct => addLinhaPacote(pct.qtd, pct.preco)); }

    const divProg = document.getElementById('listaGradeProgressivo');
    if(divProg) { divProg.innerHTML = ''; if(p.progressivo) p.progressivo.forEach(prg => addLinhaProgressivo(prg.q, prg.p)); }

    ajustarCamposProduto();
    atualizarListaAcabamentosProduto(p.acabamentos ||[]);
    mudarSubAba('sub-prod', document.querySelectorAll('.sub-aba-btn')[1]);
}

// --- PDV E MODAL ---
function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos');
    if(!grid) return;
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    grid.innerHTML = prods.map(p => `
        <div onclick="abrirConfigurador('${p.id}')" class="bg-white p-6 rounded border border-slate-200 shadow-sm hover:shadow-xl cursor-pointer transition-all group">
            <div class="h-44 bg-slate-50 rounded mb-5 bg-contain bg-no-repeat bg-center transition group-hover:scale-105" style="background-image:url('${p.foto || 'https://via.placeholder.com/200'}')"></div>
            <h4 class="font-bold text-slate-800 text-sm mb-1 truncate">${p.nome}</h4>
            <p class="text-[10px] font-bold text-slate-400 uppercase mb-4">${p.categoria}</p>
            <p class="text-xl font-black text-indigo-600">R$ ${p.preco.toFixed(2)}</p>
        </div>
    `).join('');
}

function abrirConfigurador(id) {
    const p = bdProdutos.find(x => x.id === id);
    if(!p) return;
    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdPrecoBase').value = p.preco || 0;
    document.getElementById('modalProdRegra').value = p.regraPreco;
    document.getElementById('modalHeaderImg').style.backgroundImage = `url('${p.foto || 'https://via.placeholder.com/400'}')`;
    
    const divMedidas = document.getElementById('modalCorpoMedidas');
    const regra = p.regraPreco;

    if(regra === 'm2') {
        divMedidas.innerHTML = `
            <div class="space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Largura (m)</label><input type="number" id="w2pLargura" value="1.00" step="0.01" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded bg-slate-50 font-black"></div>
            <div class="space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Altura (m)</label><input type="number" id="w2pAltura" value="1.00" step="0.01" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded bg-slate-50 font-black"></div>
            <div class="space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Quantidade</label><input type="number" id="w2pQtd" value="1" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded bg-slate-50 font-black"></div>
        `;
    } else if(regra === 'pacote') {
        let opts = (p.pacotes ||[]).map(pct => `<option value="${pct.qtd}" data-preco="${pct.preco}">${pct.qtd} un - R$ ${pct.preco.toFixed(2)}</option>`).join('');
        divMedidas.innerHTML = `<div class="col-span-2 space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Escolha o Pacote</label><select id="w2pPacote" onchange="calcularPrecoAoVivo()" class="w-full p-4 border rounded bg-slate-50 font-black">${opts}</select></div>`;
    } else {
        divMedidas.innerHTML = `<div class="col-span-2 space-y-1"><label class="text-[10px] font-bold text-slate-400 uppercase">Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()" class="w-full p-4 border rounded bg-slate-50 font-black"></div>`;
    }

    document.getElementById('modalCorpoVariacoes').innerHTML = (p.atributos ||[]).map(a => `
        <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">${a.nome}</label>
            <select class="sel-var w-full p-4 border rounded bg-slate-50 font-bold text-sm" onchange="calcularPrecoAoVivo()">
                ${a.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+ R$ ${o.preco.toFixed(2)})</option>`).join('')}
            </select>
        </div>
    `).join('');

    const acabPermitidos = p.acabamentos ||[];
    document.getElementById('modalCorpoAcabamentos').innerHTML = acabPermitidos.map(obj => {
        const a = bdAcabamentos.find(x => x.id === (obj.id || obj));
        if(!a) return '';
        const sel = obj.padrao ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-100';
        return `<button onclick="this.classList.toggle('bg-indigo-600'); this.classList.toggle('text-white'); calcularPrecoAoVivo()" data-id="${a.id}" data-preco="${a.venda}" data-regra="${a.regra}" class="acab-btn-modal p-3 rounded border font-bold text-xs transition-all ${sel}">${a.nome} (+ R$ ${a.venda.toFixed(2)})</button>`;
    }).join('');

    document.getElementById('modalW2P').classList.remove('hidden');
    calcularPrecoAoVivo();
}

function calcularPrecoAoVivo() {
    const idProd = document.getElementById('modalProdId').value;
    const p = bdProdutos.find(x => x.id === idProd);
    const regra = document.getElementById('modalProdRegra').value;
    const base = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    
    let extraVar = 0;
    document.querySelectorAll('.sel-var').forEach(s => extraVar += parseFloat(s.value));

    let qtd = 1; let totalBase = 0; let m2 = 1;

    if(regra === 'm2') {
        const l = parseFloat(document.getElementById('w2pLargura')?.value) || 0;
        const a = parseFloat(document.getElementById('w2pAltura')?.value) || 0;
        qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
        
        const menorLado = Math.min(l, a);
        const aviso = document.getElementById('avisoBobina');
        if(p && p.larguraBobina > 0 && menorLado > p.larguraBobina) {
            aviso.classList.remove('hidden');
        } else if(aviso) {
            aviso.classList.add('hidden');
        }
        
        m2 = l * a; 
        totalBase = (base + extraVar) * m2 * qtd;
    } else if(regra === 'pacote') {
        const sel = document.getElementById('w2pPacote');
        qtd = parseInt(sel?.value) || 1;
        totalBase = (parseFloat(sel?.options[sel.selectedIndex]?.dataset.preco) || 0) + (extraVar * qtd);
    } else if(regra === 'progressivo') {
        qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
        let precoUnit = base;
        if(p && p.progressivo) {
            let faixas = [...p.progressivo].sort((a,b) => b.q - a.q);
            let faixa = faixas.find(f => qtd >= f.q);
            if(faixa) precoUnit = faixa.p;
        }
        totalBase = (precoUnit + extraVar) * qtd;
    } else {
        qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
        totalBase = (base + extraVar) * qtd;
    }

    let totalAcab = 0;
    document.querySelectorAll('.acab-btn-modal.bg-indigo-600').forEach(btn => {
        const pA = parseFloat(btn.dataset.preco); const rA = btn.dataset.regra;
        if(rA === 'm2') totalAcab += pA * m2 * qtd; else if(rA === 'lote') totalAcab += pA; else totalAcab += pA * qtd;
    });

    document.getElementById('modalSubtotal').innerText = "R$ " + (totalBase + totalAcab).toFixed(2);
}

// --- RESTANTE GERAL ---
function confirmarAdicaoCarrinho() {
    const p = bdProdutos.find(x => x.id === document.getElementById('modalProdId').value);
    const totalItem = parseFloat(document.getElementById('modalSubtotal').innerText.replace("R$ ",""));
    const qtd = document.getElementById('w2pQtd')?.value || 1;
    let varsEscolhidas =[];
    document.querySelectorAll('.sel-var').forEach(s => varsEscolhidas.push(s.options[s.selectedIndex].text.split(" (+")[0]));
    carrinho.push({ nome: p.nome, valor: totalItem, desc: `${qtd} un. | ${varsEscolhidas.join(' | ')}` });
    fecharModal(); renderCarrinho();
}

function renderCarrinho() {
    const div = document.getElementById('listaCarrinho');
    if(!div) return;
    let sub = 0;
    div.innerHTML = carrinho.map((item, i) => {
        sub += item.valor;
        return `<div class="flex justify-between items-center bg-slate-50 p-4 rounded border border-slate-100"><div class="w-[70%]"><p class="font-bold text-slate-800 text-xs">${item.nome}</p><p class="text-[9px] font-medium text-slate-400 mt-1">${item.desc}</p></div><div class="text-right"><p class="font-black text-indigo-600 text-sm">R$ ${item.valor.toFixed(2)}</p><button onclick="carrinho.splice(${i},1);renderCarrinho()" class="text-[9px] font-bold text-red-400 uppercase mt-1 hover:text-red-600 transition">Remover</button></div></div>`;
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

function mudarAba(aba, btn) { document.querySelectorAll('.aba-content').forEach(el => el.classList.add('hidden')); document.getElementById('aba-'+aba).classList.remove('hidden'); document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('active-aba')); if(btn) btn.classList.add('active-aba'); }
function mudarSubAba(sub, btn) { document.querySelectorAll('.sub-aba-content').forEach(el => el.classList.add('hidden')); document.getElementById(sub).classList.remove('hidden'); document.querySelectorAll('.sub-aba-btn').forEach(b => b.classList.remove('active-sub', 'text-indigo-600')); if(btn) btn.classList.add('active-sub', 'text-indigo-600'); }
function fecharModal() { document.getElementById('modalW2P').classList.add('hidden'); }
function renderCat() { const tab = document.getElementById('listaCategoriasTab'); if(tab) tab.innerHTML = bdCategorias.map(c => `<tr class="border-b border-slate-50"><td class="p-4 font-bold text-slate-600">${c.nome}</td><td class="p-4 text-right"><button onclick="editCat('${c.id}')" class="text-indigo-500 mr-3">Editar</button><button onclick="db.collection('categorias').doc('${c.id}').delete()" class="text-red-300">✕</button></td></tr>`).join(''); const catSelect = document.getElementById('prodCategoria'); if(catSelect) catSelect.innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join(''); const acabCat = document.getElementById('acabCategoria'); if(acabCat) acabCat.innerHTML = catSelect.innerHTML; }
function renderCliSelectCart() { const cartCli = document.getElementById('cartCliente'); if(cartCli) cartCli.innerHTML = `<option value="">Consumidor Final</option>` + bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join(''); }
function toggleOpcoesPagamento() { document.getElementById('divParcelas').style.display = (document.getElementById('cartPagamento').value === 'Credito_Parcelado') ? 'block' : 'none'; }
function toggleOpcoesEntrega() { const v = document.getElementById('cartEntrega').value; document.getElementById('divFrete').style.display = (v === 'Retirada') ? 'none' : 'block'; atualizarTotalFinal(); }
function renderAcabTable() { const tab = document.getElementById('listaAcabamentosTab'); if(tab) tab.innerHTML = bdAcabamentos.map(a => `<tr class="border-b border-slate-50"><td class="p-4 font-bold text-slate-600">${a.nome} (${a.grupo})</td><td class="p-4 text-center"><button onclick="db.collection('acabamentos').doc('${a.id}').delete()" class="text-red-300">✕</button></td></tr>`).join(''); }
function renderFiltrosVitrine() { const div = document.getElementById('menuFiltroCat'); if(!div) return; div.innerHTML = `<button onclick="renderVitrine('Todos')" class="px-5 py-2 bg-white border border-slate-200 rounded font-bold text-xs hover:bg-slate-800 hover:text-white transition shadow-sm">Todos</button>` + bdCategorias.map(c => `<button onclick="renderVitrine('${c.nome}')" class="px-5 py-2 bg-white border border-slate-200 rounded font-bold text-xs hover:bg-slate-800 hover:text-white transition shadow-sm">${c.nome}</button>`).join(''); }
function renderPedidosFinanceiro() { const tab = document.getElementById('listaPedidosTab'); if(!tab) return; tab.innerHTML = bdPedidos.map(p => `<tr class="border-b border-slate-50 hover:bg-slate-50 transition"><td class="p-4 text-slate-400 font-medium">${p.data.toDate().toLocaleDateString('pt-BR')}</td><td class="p-4 font-bold text-slate-700">${p.clienteNome}</td><td class="p-4 font-black text-indigo-600">R$ ${p.total.toFixed(2)}</td><td class="p-4 text-center"><span class="bg-indigo-50 text-indigo-500 px-3 py-1 rounded text-[10px] font-black uppercase">${p.status}</span></td></tr>`).join(''); }
async function salvarAcabamento() { const d = { nome: document.getElementById('acabNome')?.value, grupo: document.getElementById('acabGrupo')?.value, categoria: document.getElementById('acabCategoria')?.value, regra: document.getElementById('acabRegra')?.value, venda: parseFloat(document.getElementById('acabPrecoVenda')?.value) || 0, custo: parseFloat(document.getElementById('acabCusto')?.value) || 0 }; await db.collection("acabamentos").add(d); location.reload(); }
function atualizarInfoCreditoCarrinho() { const idCli = document.getElementById('cartCliente').value; const label = document.getElementById('labelCreditoCli'); if(!idCli) { label.innerText = "Saldo: R$ 0.00"; label.className = "text-emerald-500 font-bold"; return; } const c = bdClientes.find(x => x.id === idCli); const credito = c.credito || 0; label.innerText = `Saldo: R$ ${credito.toFixed(2)}`; label.className = credito >= 0 ? "text-emerald-500 font-bold" : "text-red-500 font-bold"; }
function renderProdTable() { const tab = document.getElementById('listaProdutosTab'); if(!tab) return; tab.innerHTML = bdProdutos.map(p => `<tr class="border-b border-slate-50 hover:bg-slate-50 transition"><td class="p-4 font-bold text-slate-700">${p.nome}</td><td class="p-4 text-slate-400 text-[10px] uppercase">${p.regraPreco}</td><td class="p-4 text-center"><button onclick="editProd('${p.id}')" class="text-indigo-500 mr-3 font-bold text-[10px] uppercase">Editar</button><button onclick="db.collection('produtos').doc('${p.id}').delete()" class="text-red-300 font-bold text-[10px]">X</button></td></tr>`).join(''); }
function renderCliTable() { const tab = document.getElementById('listaClientesTab'); if(!tab) return; tab.innerHTML = bdClientes.map(c => `<tr class="border-b border-slate-50 hover:bg-slate-50"><td class="p-4 font-bold text-slate-700">${c.nome}</td><td class="p-4 font-bold ${c.credito >= 0 ? 'text-emerald-500' : 'text-red-500'}">R$ ${(c.credito || 0).toFixed(2)}</td><td class="p-4 text-center space-x-3"><button onclick="editCli('${c.id}')" class="text-slate-400 text-[10px] font-black uppercase hover:text-indigo-500">Editar</button><button onclick="db.collection('clientes').doc('${c.id}').delete()" class="text-red-300 hover:text-red-500">✕</button></td></tr>`).join(''); }
async function salvarCategoria() { const id = document.getElementById('catId').value; const nome = document.getElementById('catNome').value; if(!nome) return; if(id) await db.collection("categorias").doc(id).update({nome: nome}); else await db.collection("categorias").add({nome: nome}); document.getElementById('catId').value = ''; document.getElementById('catNome').value = ''; }
function editCat(id) { const c = bdCategorias.find(x => x.id === id); document.getElementById('catId').value = c.id; document.getElementById('catNome').value = c.nome; }
async function enviarPedido() { if(carrinho.length === 0) return alert("Carrinho vazio!"); const idCli = document.getElementById('cartCliente').value; const total = parseFloat(document.getElementById('totalCarrinho').innerText.replace("R$ ","")); const pago = parseFloat(document.getElementById('cartValorPago').value) || 0; const saldo = total - pago; const pedido = { clienteId: idCli || "Consumidor Final", clienteNome: idCli ? bdClientes.find(x => x.id === idCli).nome : "Consumidor Final", itens: carrinho, total: total, valorPago: pago, saldoDevedor: saldo, data: new Date(), status: saldo <= 0 ? "Pago" : "Pagamento Parcial" }; await db.collection("pedidos").add(pedido); if(idCli && document.getElementById('cartPagamento').value === "Saldo_Cliente") { const c = bdClientes.find(x => x.id === idCli); await db.collection("clientes").doc(idCli).update({ credito: (c.credito || 0) - pago }); } alert("PEDIDO SALVO!"); carrinho =
