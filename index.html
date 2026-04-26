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

let bdCategorias =[], bdProdutos = [], bdClientes = [], bdPedidos = [], bdAcabamentos = [], bdTransacoes =[], carrinho = [];
const STATUSES =["Aguardando pagamento", "Em produção", "Acabamento", "Pronto para Retirada", "Entregue", "Cancelado / Estorno"];

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
    if (!e || !s) return;
    auth.signInWithEmailAndPassword(e, s).catch(() => document.getElementById('msgErro').classList.remove('hidden'));
}

function sair() { auth.signOut(); }

function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()})); renderCat(); renderFiltrosVitrine(); });
    db.collection("produtos").onSnapshot(s => { bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()})); renderVitrine(); renderProdTable(); });
    db.collection("clientes").orderBy("nome").onSnapshot(s => { bdClientes = s.docs.map(d => ({id: d.id, ...d.data()})); renderCliTable(); renderCliSelectCart(); });
    db.collection("acabamentos").onSnapshot(s => { bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()})); renderAcabTable(); atualizarListaAcabamentosProduto(); });
    db.collection("pedidos").orderBy("data", "desc").limit(50).onSnapshot(s => { bdPedidos = s.docs.map(d => ({id: d.id, ...d.data()})); renderPedidosFinanceiro(); renderKanbanProducao(); });
    db.collection("transacoes").orderBy("data", "desc").limit(50).onSnapshot(s => { bdTransacoes = s.docs.map(d => ({id: d.id, ...d.data()})); renderPedidosFinanceiro(); });
}

// --- FINANCEIRO ---
async function salvarMovimentacao() {
    const tipo = document.getElementById('finTipo').value;
    const desc = document.getElementById('finDesc').value;
    const valor = parseFloat(document.getElementById('finValor').value);
    if(!desc || !valor) return alert("Preencha descrição e valor!");
    await db.collection("transacoes").add({ tipo: tipo, descricao: desc, valor: valor, data: new Date() });
    document.getElementById('finDesc').value = ''; document.getElementById('finValor').value = '';
}

function renderPedidosFinanceiro() {
    const tabPedidos = document.getElementById('listaPedidosTab');
    if(tabPedidos) {
        tabPedidos.innerHTML = bdPedidos.map(p => {
            const dataObj = p.data && p.data.toDate ? p.data.toDate() : new Date(p.data);
            return `<tr class="border-b border-slate-50 hover:bg-slate-50 transition"><td class="p-4 text-slate-400 font-medium">${dataObj.toLocaleDateString('pt-BR')}</td><td class="p-4 font-bold text-slate-700">${p.clienteNome}</td><td class="p-4 font-black text-indigo-600">R$ ${(p.total || 0).toFixed(2)}</td><td class="p-4 text-center"><span class="bg-indigo-50 text-indigo-500 px-3 py-1 rounded text-[10px] font-black uppercase">${p.status}</span></td><td class="p-4 text-center"><button type="button" onclick="imprimirRecibo('${p.id}')" class="text-slate-400 hover:text-indigo-600" title="Imprimir Recibo"><i class="fa fa-print"></i></button></td></tr>`;
        }).join('');
    }

    const tabExtrato = document.getElementById('listaExtratoTab');
    if(tabExtrato) {
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        let vHoje = 0, eMes = 0, sMes = 0; let extrato =[];

        bdPedidos.forEach(p => {
            const d = p.data && p.data.toDate ? p.data.toDate() : new Date(p.data);
            const v = p.valorPago || 0; const t = p.total || 0;
            if(d >= hoje) vHoje += t;
            if(d >= inicioMes) eMes += v;
            if(v > 0) extrato.push({ data: d, desc: `Venda: ${p.clienteNome}`, valor: v, tipo: 'entrada' });
        });

        bdTransacoes.forEach(t => {
            const d = t.data && t.data.toDate ? t.data.toDate() : new Date(t.data);
            if(d >= inicioMes) { if(t.tipo === 'entrada') eMes += t.valor; else sMes += t.valor; }
            extrato.push({ data: d, desc: t.descricao, valor: t.valor, tipo: t.tipo });
        });

        document.getElementById('finVendasHoje').innerText = "R$ " + vHoje.toFixed(2);
        document.getElementById('finEntradasMes').innerText = "R$ " + eMes.toFixed(2);
        document.getElementById('finSaidasMes').innerText = "R$ " + sMes.toFixed(2);
        document.getElementById('finSaldoMes').innerText = "R$ " + (eMes - sMes).toFixed(2);

        extrato.sort((a,b) => b.data - a.data);
        tabExtrato.innerHTML = extrato.map(i => {
            const corValor = i.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500';
            const sinal = i.tipo === 'entrada' ? '+' : '-';
            return `<tr class="border-b border-slate-50 hover:bg-slate-50 transition"><td class="p-4 text-slate-400 font-medium">${i.data.toLocaleDateString('pt-BR')}</td><td class="p-4 font-bold text-slate-700">${i.desc}</td><td class="p-4 text-right font-black ${corValor}">${sinal} R$ ${i.valor.toFixed(2)}</td></tr>`;
        }).join('');
    }
}

// --- KANBAN DE PRODUÇÃO ---
function renderKanbanProducao() {
    const container = document.getElementById('kanbanContainer');
    if(!container) return;
    let html = '';
    STATUSES.forEach(status => {
        const pedidosDoStatus = bdPedidos.filter(p => p.status === status);
        html += `<div class="bg-slate-100 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col kanban-col border border-slate-200"><div class="flex justify-between items-center mb-4"><h3 class="font-bold text-slate-700 uppercase text-[10px] tracking-widest">${status}</h3><span class="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-1 rounded-full">${pedidosDoStatus.length}</span></div><div class="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">${pedidosDoStatus.map(p => gerarCardPedido(p)).join('')}</div></div>`;
    });
    container.innerHTML = html;
}

function gerarCardPedido(p) {
    const dataObj = p.data && p.data.toDate ? p.data.toDate() : new Date(p.data);
    const dataF = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    let options = STATUSES.map(s => `<option value="${s}" ${p.status === s ? 'selected' : ''}>${s}</option>`).join('');
    let corBorda = 'border-l-slate-400';
    if(p.status === 'Aguardando pagamento') corBorda = 'border-l-amber-400';
    if(p.status === 'Em produção') corBorda = 'border-l-blue-500';
    if(p.status === 'Acabamento') corBorda = 'border-l-indigo-500';
    if(p.status === 'Pronto para Retirada') corBorda = 'border-l-emerald-400';
    if(p.status === 'Entregue') corBorda = 'border-l-emerald-600';
    if(p.status === 'Cancelado / Estorno') corBorda = 'border-l-red-500';

    const itensHtml = (p.itens ||[]).map(i => `<p>• ${i.qtdCarrinho || 1}x (${i.qtdModal || 1} un.) ${i.nome} <span class="opacity-70">(${i.desc})</span></p>`).join('');

    return `<div class="bg-white p-4 rounded-lg shadow-sm border border-slate-200 border-l-4 ${corBorda}"><div class="flex justify-between items-start mb-2"><span class="text-[9px] font-bold text-slate-400">${dataF}</span><span class="text-[10px] font-black text-indigo-600">R$ ${(p.total || 0).toFixed(2)}</span></div><h4 class="font-bold text-slate-800 text-xs mb-2">${p.clienteNome}</h4><div class="text-[9px] text-slate-500 mb-3 space-y-1">${itensHtml}</div><div class="mt-3 pt-3 border-t border-slate-100 flex gap-2"><select onchange="mudarStatusPedido('${p.id}', this.value)" class="flex-1 p-2 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-500">${options}</select><button type="button" onclick="imprimirOSA4('${p.id}')" class="bg-slate-800 text-white px-3 rounded hover:bg-slate-700 transition" title="Imprimir OS (A4)"><i class="fa fa-file-pdf"></i></button></div></div>`;
}

async function mudarStatusPedido(id, novoStatus) {
    try { await db.collection("pedidos").doc(id).update({ status: novoStatus }); } 
    catch(e) { console.error(e); alert("Erro ao atualizar status."); }
}

// --- IMPRESSÃO ---
function imprimirReciboDireto(idPedido, objPedido) {
    const p = objPedido || bdPedidos.find(x => x.id === idPedido);
    if(!p) return;
    const janela = window.open('', '', 'width=350,height=800');
    const dataObj = p.data && p.data.toDate ? p.data.toDate() : new Date(p.data);
    const dataStr = dataObj.toLocaleDateString('pt-BR') + ' ' + dataObj.toLocaleTimeString('pt-BR');
    
    let html = `
        <html><head><style>
            body { font-family: monospace; width: 80mm; margin: 0; padding: 10px; color: #000; font-size: 12px; }
            .center { text-align: center; } .bold { font-weight: bold; } .linha { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; font-size: 12px; border-collapse: collapse; } th, td { text-align: left; padding: 2px 0; vertical-align: top; } .right { text-align: right; }
            img.logo { max-width: 150px; margin: 0 auto 10px auto; display: block; }
            @media print { .page-break { page-break-before: always; } }
            .prod-item { font-size: 14px; font-weight: bold; margin-bottom: 4px; } .prod-desc { font-size: 12px; margin-bottom: 10px; padding-left: 10px; }
        </style></head><body>
        <img src="https://i.postimg.cc/GtwRkLBF/gva-pr-ERP-26.png" class="logo" alt="GVA Gráfica" />
        <div class="center bold" style="font-size: 14px;">Gráfica Venom Arts LTDA</div>
        <div class="center" style="font-size: 10px; margin-bottom: 10px;">CNPJ: 17.184.159/0001-06<br>IM: 2231694 | IE: 14.623.58-2<br>Rua Lopes Trovão nº 474 Lojas 202 e 201<br>Icaraí, Niterói - RJ 24220-071<br>www.graficava.com.br<br>WhatsApp: 21 99993-0190<br>Insta: @grafica.venomarts</div>
        <div class="linha"></div><div class="center bold" style="font-size: 14px;">Pedido: ${idPedido.substring(0,6).toUpperCase()}</div><div class="center">Data: ${dataStr}</div><div class="linha"></div><div>Cliente: ${p.clienteNome}</div><div class="linha"></div>
        <table><tr><th>Qtd/Item</th><th class="right">Valor</th></tr>${(p.itens ||[]).map(i => `<tr><td>${i.qtdCarrinho || 1}x (${i.qtdModal || 1} un.) ${i.nome}<br><small>${i.desc}</small></td><td class="right">R$ ${((i.valorModal || 0) * (i.qtdCarrinho || 1)).toFixed(2)}</td></tr>`).join('')}</table>
        <div class="linha"></div><div class="right bold">Subtotal: R$ ${((p.total || 0) + (p.desconto || 0)).toFixed(2)}</div><div class="right">Desconto: R$ ${(p.desconto || 0).toFixed(2)}</div><div class="right bold">Total: R$ ${(p.total || 0).toFixed(2)}</div><div class="right">Valor Pago: R$ ${(p.valorPago || 0).toFixed(2)}</div><div class="right bold">Saldo: R$ ${(p.saldoDevedor || 0).toFixed(2)}</div>
        <div class="linha"></div><div class="center">Obrigado pela preferência!</div>
        <div class="page-break"></div>
        <div class="center bold" style="font-size: 16px; margin-bottom: 10px;">VIA DA PRODUÇÃO</div><div class="center bold" style="font-size: 14px;">Pedido: ${idPedido.substring(0,6).toUpperCase()}</div><div class="center">Data: ${dataStr}</div><div class="linha"></div><div class="bold" style="font-size: 14px;">Cliente: ${p.clienteNome}</div><div class="linha"></div>
        ${(p.itens ||[]).map(i => `<div class="prod-item">[ ] ${i.qtdCarrinho || 1}x (${i.qtdModal || 1} un.) ${i.nome}</div><div class="prod-desc">${i.desc.replace(/\|/g, '<br>')}</div>`).join('')}
        <div class="linha"></div><div class="center">Fim da Ordem de Serviço</div>
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script></body></html>
    `;
    janela.document.write(html); janela.document.close();
}

function imprimirRecibo(idPedido) { imprimirReciboDireto(idPedido, null); }

function imprimirOSA4(idPedido) {
    const p = bdPedidos.find(x => x.id === idPedido);
    if(!p) return;
    const janela = window.open('', '', 'width=800,height=900');
    const dataObj = p.data && p.data.toDate ? p.data.toDate() : new Date(p.data);
    const dataStr = dataObj.toLocaleDateString('pt-BR') + ' às ' + dataObj.toLocaleTimeString('pt-BR');
    let html = `
        <html><head><style>
            @page { size: A4; margin: 15mm; } body { font-family: Arial, sans-serif; color: #333; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { max-height: 50px; } .title { font-size: 24px; font-weight: bold; color: #0f172a; text-transform: uppercase; }
            .info-box { border: 1px solid #ccc; padding: 15px; border-radius: 8px; margin-bottom: 20px; background: #f9fafb; }
            .item-box { border: 2px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid; }
            .item-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
            .item-desc { font-size: 14px; margin-bottom: 10px; } .check-box { display: inline-block; width: 15px; height: 15px; border: 1px solid #000; margin-right: 5px; vertical-align: middle; }
            .task-list { margin-top: 10px; font-size: 14px; } .task-item { margin-bottom: 8px; }
        </style></head><body>
        <div class="header"><img src="https://i.postimg.cc/GtwRkLBF/gva-pr-ERP-26.png" class="logo" alt="GVA Gráfica" /><div style="text-align: right;"><div class="title">ORDEM DE SERVIÇO</div><div style="font-size: 18px; font-weight: bold;">#${p.id.substring(0,6).toUpperCase()}</div></div></div>
        <div class="info-box"><strong>Cliente:</strong> ${p.clienteNome}<br><strong>Data do Pedido:</strong> ${dataStr}<br><strong>Status Atual:</strong> ${p.status}</div>
        <h3 style="text-transform: uppercase; color: #64748b;">Itens para Produção</h3>
        ${(p.itens ||[]).map((i, index) => `<div class="item-box"><div class="item-title">Item ${index + 1}: ${i.qtdCarrinho || 1}x (${i.qtdModal || 1} un.) ${i.nome}</div><div class="item-desc">${i.desc.replace(/\|/g, '<br>')}</div><div class="task-list"><div class="task-item"><span class="check-box"></span> Arte Aprovada / RIP</div><div class="task-item"><span class="check-box"></span> Impressão Concluída</div><div class="task-item"><span class="check-box"></span> Acabamento Finalizado</div><div class="task-item"><span class="check-box"></span> Conferência e Embalagem</div></div></div>`).join('')}
        <script>setTimeout(() => { window.print(); window.close(); }, 500);</script></body></html>
    `;
    janela.document.write(html); janela.document.close();
}

// --- ATRIBUTOS E PRODUTOS ---
function addOpcaoAtrib(container, n = '', p = '', fixo = false) {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-opcao items-center";
    const chk = fixo ? 'checked' : '';
    div.innerHTML = `<input type="text" placeholder="Opção" value="${n}" class="op-nome flex-1 text-xs p-2 border border-slate-200 rounded bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500"><input type="number" placeholder="R$" value="${p}" class="op-preco w-20 text-xs p-2 border border-slate-200 rounded bg-slate-50 font-bold outline-none focus:ring-2 focus:ring-indigo-500"><label class="text-[9px] font-bold text-slate-400 flex items-center gap-1"><input type="checkbox" class="op-fixo" ${chk}> Fixo</label><button type="button" onclick="this.parentElement.remove()" class="text-slate-300 hover:text-red-500">✕</button>`;
    container.appendChild(div);
}

function addAtributo(nome = '', opcoes =[]) {
    const div = document.createElement('div');
    div.className = "bg-white p-4 rounded border border-slate-100 shadow-sm item-atrib";
    div.innerHTML = `<div class="flex gap-2 mb-3"><input type="text" placeholder="Grupo (ex: Papel)" value="${nome}" class="atrib-nome flex-1 font-bold text-sm p-2 border-b-2 border-indigo-50 outline-none focus:border-indigo-500"><button type="button" onclick="this.parentElement.parentElement.remove()" class="text-red-300">✕</button></div><div class="lista-opcoes space-y-2"></div><button type="button" class="btn-add-op mt-3 text-[10px] font-bold uppercase text-indigo-400 hover:text-indigo-600">+ Add Opção</button>`;
    document.getElementById('listaAtributos').appendChild(div);
    const containerOpcoes = div.querySelector('.lista-opcoes');
    div.querySelector('.btn-add-op').onclick = () => addOpcaoAtrib(containerOpcoes);
    if (opcoes && opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(containerOpcoes, o.nome, o.preco, o.fixo));
    else addOpcaoAtrib(containerOpcoes);
}

function addAtributoManual() { addAtributo('',[]); }

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
    div.innerHTML = `<input type="text" placeholder="Ex: 1.000 Cartões" value="${q}" class="q w-full p-2 border border-slate-200 rounded text-xs outline-none focus:ring-2 focus:ring-amber-500"><input type="number" placeholder="Total R$" value="${p}" class="p w-full p-2 border border-slate-200 rounded font-bold text-amber-600 text-xs outline-none focus:ring-2 focus:ring-amber-500"><button type="button" onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradePacotes').appendChild(div);
}

function addLinhaProgressivo(q='', p='') {
    const div = document.createElement('div');
    div.className = "flex gap-2";
    div.innerHTML = `<input type="number" placeholder="Qtd Mín" value="${q}" class="q w-full p-2 border border-slate-200 rounded text-xs outline-none focus:ring-2 focus:ring-emerald-500"><input type="number" placeholder="Unit R$" value="${p}" class="p w-full p-2 border border-slate-200 rounded font-bold text-emerald-600 text-xs outline-none focus:ring-2 focus:ring-emerald-500"><button type="button" onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradeProgressivo').appendChild(div);
}

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
        return `<div class="flex items-center justify-between p-2 bg-white border border-slate-200 rounded"><label class="text-[10px] font-bold flex items-center gap-2 cursor-pointer"><input type="checkbox" class="check-acab-prod" value="${a.id}" ${checked}> ${a.nome}</label><i class="fa fa-star cursor-pointer star-padrao ${starAtiva}" onclick="this.classList.toggle('text-amber-400'); this.classList.toggle('text-slate-200')"></i></div>`;
    }).join('');
}

async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    let atributos =[];
    document.querySelectorAll('.item-atrib').forEach(caixa => {
        let ops =[];
        caixa.querySelectorAll('.item-opcao').forEach(l => {
            const n = l.querySelector('.op-nome').value;
            const p = parseFloat(l.querySelector('.op-preco').value) || 0;
            const f = l.querySelector('.op-fixo').checked;
            if (n) ops.push({ nome: n, preco: p, fixo: f });
        });
        const nomeAtrib = caixa.querySelector('.atrib-nome').value;
        if (nomeAtrib) atributos.push({ nome: nomeAtrib, opcoes: ops });
    });

    let acabList =[];
    document.querySelectorAll('.check-acab-prod:checked').forEach(chk => {
        const star = chk.closest('div').querySelector('.star-padrao');
        acabList.push({ id: chk.value, padrao: star.classList.contains('text-amber-400') });
    });

    let pacotes =[];
    document.querySelectorAll('#listaGradePacotes > div').forEach(d => {
        const q = d.querySelector('.q').value; 
        const p = parseFloat(d.querySelector('.p').value);
        if (q && p) pacotes.push({ qtd: q, preco: p });
    });

    let progressivo =[];
    document.querySelectorAll('#listaGradeProgressivo > div').forEach(d => {
        const q = parseInt(d.querySelector('.q').value); 
        const p = parseFloat(d.querySelector('.p').value);
        if (q && p) progressivo.push({ q: q, p: p });
    });

    const d = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        subcategoria: document.getElementById('prodSubcategoria').value || '',
        tipo: document.getElementById('prodTipo').value,
        regraPreco: document.getElementById('prodRegraPreco').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        foto: document.getElementById('prodFoto').value || '',
        ref: document.getElementById('prodRef').value || '',
        material: document.getElementById('prodMaterial').value || '',
        gramatura: document.getElementById('prodGramatura').value || '',
        prazo: parseInt(document.getElementById('prodPrazo').value) || 0,
        larguraBobina: parseFloat(document.getElementById('prodLargBobina').value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 0,
        compMax: parseFloat(document.getElementById('prodComp
