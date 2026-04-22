// ... Mantenha as configurações de Firebase e Variáveis iniciais ...
let bdPedidos = []; // Nova variável para pedidos

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
    // Nova leitura: Pedidos
    db.collection("pedidos").orderBy("data", "desc").limit(50).onSnapshot(s => {
        bdPedidos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderPedidosFinanceiro();
    });
}

// --- SALVAR PEDIDO NO BANCO ---
async function enviarPedido() {
    if(carrinho.length === 0) return alert("Carrinho vazio!");
    
    const idCli = document.getElementById('cartCliente').value;
    const pagamento = document.getElementById('cartPagamento').value;
    const total = parseFloat(document.getElementById('totalCarrinho').innerText.replace("R$ ",""));
    const dataHora = new Date();

    const pedido = {
        clienteId: idCli || "Consumidor Final",
        clienteNome: idCli ? bdClientes.find(x => x.id === idCli).nome : "Consumidor Final",
        itens: carrinho,
        pagamento: pagamento,
        parcelas: pagamento === 'Credito_Parcelado' ? document.getElementById('cartParcelas').value : 1,
        frete: parseFloat(document.getElementById('cartFreteValor').value) || 0,
        total: total,
        data: dataHora,
        status: "Pendente"
    };

    try {
        // 1. Gravar Pedido
        await db.collection("pedidos").add(pedido);

        // 2. Lógica de Crédito (Se cliente selecionado)
        if(idCli && idCli !== "") {
            const clienteRef = db.collection("clientes").doc(idCli);
            const clienteAtual = bdClientes.find(x => x.id === idCli);
            let novoSaldo = clienteAtual.credito || 0;

            if(pagamento === "Saldo_Cliente") {
                if(novoSaldo < total) {
                    alert("Saldo insuficiente! O pedido foi salvo, mas o saldo ficará negativo.");
                }
                novoSaldo -= total; // Abate do saldo
            }
            
            await clienteRef.update({ credito: novoSaldo });
        }

        alert("PEDIDO GRAVADO E FINALIZADO!");
        carrinho = [];
        renderCarrinho();
    } catch (err) {
        console.error(err);
        alert("Erro ao salvar pedido.");
    }
}

// --- HISTÓRICO DO CLIENTE ---
function verHistoricoCliente(idCli) {
    const cliente = bdClientes.find(x => x.id === idCli);
    const pedidosCli = bdPedidos.filter(p => p.clienteId === idCli);
    
    document.getElementById('histNomeCli').innerText = `Pedidos de: ${cliente.nome}`;
    const corpo = document.getElementById('corpoHistoricoCli');
    
    if(pedidosCli.length === 0) {
        corpo.innerHTML = "<p class='text-center text-slate-400 py-10'>Nenhum pedido encontrado.</p>";
    } else {
        corpo.innerHTML = pedidosCli.map(p => `
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div class="flex justify-between font-bold text-indigo-900 mb-2">
                    <span>${p.data.toDate().toLocaleDateString('pt-BR')}</span>
                    <span>R$ ${p.total.toFixed(2)}</span>
                </div>
                <p class="text-[10px] text-slate-400 uppercase font-black">${p.pagamento.replace('_',' ')}</p>
                <div class="mt-2 text-xs text-slate-500">
                    ${p.itens.map(i => `• ${i.nome} (${i.desc})`).join('<br>')}
                </div>
            </div>
        `).join('');
    }
    document.getElementById('modalHistoricoCli').classList.remove('hidden');
}

// --- RENDERIZAÇÕES ADICIONAIS ---
function renderCliTable() {
    document.getElementById('listaClientesTab').innerHTML = bdClientes.map(c => `
        <tr class="border-b border-slate-50 hover:bg-slate-50">
            <td class="p-5 font-bold text-slate-700">${c.nome}</td>
            <td class="p-5 font-bold ${c.credito >= 0 ? 'text-emerald-500' : 'text-red-500'}">R$ ${(c.credito || 0).toFixed(2)}</td>
            <td class="p-5 text-center space-x-3">
                <button onclick="verHistoricoCliente('${c.id}')" class="text-indigo-400 hover:text-indigo-600 text-xs font-black uppercase">Histórico</button>
                <button onclick="editCli('${c.id}')" class="text-slate-400 hover:text-indigo-600 text-xs font-black uppercase">Editar</button>
                <button onclick="db.collection('clientes').doc('${c.id}').delete()" class="text-red-200 hover:text-red-500">✕</button>
            </td>
        </tr>
    `).join('');
}

function renderPedidosFinanceiro() {
    const tab = document.getElementById('listaPedidosTab');
    if(!tab) return;
    tab.innerHTML = bdPedidos.map(p => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition">
            <td class="p-5 text-slate-400 font-medium">${p.data.toDate().toLocaleDateString('pt-BR')}</td>
            <td class="p-5 font-bold text-slate-700">${p.clienteNome}</td>
            <td class="p-5 font-black text-indigo-600">R$ ${p.total.toFixed(2)}</td>
            <td class="p-5"><span class="bg-indigo-50 text-indigo-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">${p.status}</span></td>
        </tr>
    `).join('');
}

// ... (Mantenha as outras funções de Categoria, Produto e PDV) ...
