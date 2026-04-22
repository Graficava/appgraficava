// ... Mantenha as configurações de Firebase e Auth ...

let bdAcabamentos = [];

function iniciarLeitura() {
    // ... Categorias, Produtos, Clientes ...
    db.collection("acabamentos").onSnapshot(s => {
        bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderAcabTable();
        atualizarListaAcabamentosProduto();
    });
    // ... Pedidos ...
}

// --- LÓGICA DE PRODUTOS (RESTAURADA) ---
function ajustarCamposProduto() {
    const r = document.getElementById('prodRegraPreco').value;
    document.getElementById('boxPrecoBase').style.display = (r === 'pacote' || r === 'progressivo') ? 'none' : 'block';
    document.getElementById('boxPacotes').style.display = r === 'pacote' ? 'block' : 'none';
    document.getElementById('boxProgressivo').style.display = r === 'progressivo' ? 'block' : 'none';
    document.getElementById('boxMedidas').style.display = r === 'm2' ? 'grid' : 'none';
}

function addLinhaPacote(q='', p='') {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-pacote";
    div.innerHTML = `<input type="number" placeholder="Qtd" value="${q}" class="q w-full p-2 border rounded-lg"><input type="number" placeholder="Preço Total" value="${p}" class="p w-full p-2 border rounded-lg font-bold text-amber-600"><button onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradePacotes').appendChild(div);
}

function addLinhaProgressivo(q='', p='') {
    const div = document.createElement('div');
    div.className = "flex gap-2 item-prog";
    div.innerHTML = `<input type="number" placeholder="Qtd Mín" value="${q}" class="q w-full p-2 border rounded-lg"><input type="number" placeholder="Preço Unit" value="${p}" class="p w-full p-2 border rounded-lg font-bold text-emerald-600"><button onclick="this.parentElement.remove()" class="text-red-300">✕</button>`;
    document.getElementById('listaGradeProgressivo').appendChild(div);
}

function atualizarListaAcabamentosProduto(salvos = []) {
    const container = document.getElementById('listaCheckAcabamentos');
    const cat = document.getElementById('prodCategoria').value;
    const filtrados = bdAcabamentos.filter(a => a.categoria === cat || a.categoria === "Geral");
    
    container.innerHTML = filtrados.map(a => {
        const obj = salvos.find(s => (s.id || s) === a.id);
        const checked = obj ? 'checked' : '';
        const starAtiva = (obj && obj.padrao) ? 'text-amber-400' : 'text-slate-200';
        return `
            <div class="flex items-center justify-between p-2 bg-white border rounded-xl">
                <label class="text-xs font-bold flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" class="check-acab-prod" value="${a.id}" ${checked}> ${a.nome}
                </label>
                <i class="fa fa-star cursor-pointer star-padrao ${starAtiva}" onclick="this.classList.toggle('text-amber-400'); this.classList.toggle('text-slate-200')"></i>
            </div>
        `;
    }).join('');
}

// --- MODAL PDV (CÁLCULOS COMPLEXOS) ---
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

    // Variações
    document.getElementById('modalCorpoVariacoes').innerHTML = (p.atributos || []).map(a => `
        <div class="space-y-1">
            <label class="text-[10px] font-bold text-slate-400 uppercase">${a.nome}</label>
            <select class="sel-var w-full p-4 border rounded-2xl bg-slate-50 font-bold text-sm" onchange="calcularPrecoAoVivo()">
                ${a.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+ R$ ${o.preco.toFixed(2)})</option>`).join('')}
            </select>
        </div>
    `).join('');

    // Acabamentos
    const acabPermitidos = p.acabamentos || [];
    document.getElementById('modalCorpoAcabamentos').innerHTML = acabPermitidos.map(obj => {
        const a = bdAcabamentos.find(x => x.id === (obj.id || obj));
        if(!a) return '';
        const sel = obj.padrao ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-100';
        return `<button onclick="toggleAcabamentoModal(this)" data-id="${a.id}" data-preco="${a.venda}" data-regra="${a.regra}" class="acab-btn-modal p-3 rounded-xl border font-bold text-xs transition-all ${sel}">${a.nome} (+ R$ ${a.venda.toFixed(2)})</button>`;
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
    } else if(regra === 'progressivo') {
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        const p = bdProdutos.find(x => x.id === document.getElementById('modalProdId').value);
        let precoUnit = base;
        if(p.progressivo) {
            let faixas = [...p.progressivo].sort((a,b) => b.q - a.q);
            let faixa = faixas.find(f => qtd >= f.q);
            if(faixa) precoUnit = faixa.p;
        }
        totalBase = (precoUnit + extraVar) * qtd;
    } else {
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        totalBase = (base + extraVar) * qtd;
    }

    // Acabamentos no Modal
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

// --- CARRINHO E SINAL ---
function atualizarTotalFinal() {
    const sub = parseFloat(document.getElementById('subtotalCart').innerText.replace("R$ ","")) || 0;
    const frete = parseFloat(document.getElementById('cartFreteValor').value) || 0;
    const pago = parseFloat(document.getElementById('cartValorPago').value) || 0;
    
    const totalPedido = sub + frete;
    const saldo = totalPedido - pago;

    document.getElementById('totalCarrinho').innerText = "R$ " + totalPedido.toFixed(2);
    document.getElementById('cartSaldoDevedor').innerText = "R$ " + saldo.toFixed(2);
    
    // Estilo do saldo
    const divSaldo = document.getElementById('cartSaldoDevedor');
    if(saldo > 0) divSaldo.className = "text-sm font-black text-red-500 p-2";
    else divSaldo.className = "text-sm font-black text-emerald-500 p-2";
}

async function enviarPedido() {
    if(carrinho.length === 0) return alert("Carrinho vazio!");
    
    const idCli = document.getElementById('cartCliente').value;
    const total = parseFloat(document.getElementById('totalCarrinho').innerText.replace("R$ ",""));
    const pago = parseFloat(document.getElementById('cartValorPago').value) || 0;
    const saldo = total - pago;

    const pedido = {
        clienteId: idCli || "Consumidor Final",
        clienteNome: idCli ? bdClientes.find(x => x.id === idCli).nome : "Consumidor Final",
        itens: carrinho,
        total: total,
        valorPago: pago,
        saldoDevedor: saldo,
        data: new Date(),
        status: saldo <= 0 ? "Pago" : "Pagamento Parcial"
    };

    await db.collection("pedidos").add(pedido);
    
    // Se usou saldo do cliente, abate do cadastro
    if(idCli && document.getElementById('cartPagamento').value === "Saldo_Cliente") {
        const c = bdClientes.find(x => x.id === idCli);
        await db.collection("clientes").doc(idCli).update({ credito: (c.credito || 0) - pago });
    }

    alert("PEDIDO SALVO!\nTotal: R$ " + total.toFixed(2) + "\nSaldo Restante: R$ " + saldo.toFixed(2));
    carrinho = [];
    document.getElementById('cartValorPago').value = 0;
    renderCarrinho();
}
