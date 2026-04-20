const firebaseConfig = {
    apiKey: "AIzaSyC4pkjSYpuz4iF0ijF50VxaZ2npsYCi7II",
    authDomain: "app-graficava.firebaseapp.com",
    databaseURL: "https://app-graficava-default-rtdb.firebaseio.com",
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

// ==========================================
// LOGIN E NAVEGAÇÃO
// ==========================================
auth.onAuthStateChanged(user => {
    if (user) { document.getElementById('telaLogin').style.display = 'none'; document.getElementById('appInterface').style.display = 'flex'; iniciarLeitura(); } 
    else { document.getElementById('telaLogin').style.display = 'flex'; document.getElementById('appInterface').style.display = 'none'; }
});
function entrar() { auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('senha').value).catch(() => alert("Erro no login.")); }
function sair() { auth.signOut(); }
function mudarAba(aba) { document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa')); document.querySelectorAll('.menu button').forEach(b => b.classList.remove('ativo')); document.getElementById('aba-' + aba).classList.add('ativa'); event.currentTarget.classList.add('ativo'); }
function mudarSubAba(sub) { document.querySelectorAll('.sub-aba').forEach(a => a.classList.remove('sub-ativa')); document.querySelectorAll('.sub-menu button').forEach(b => b.classList.remove('sub-ativo')); document.getElementById(sub).classList.add('sub-ativa'); document.getElementById('btn-' + sub).classList.add('sub-ativo'); }

// ==========================================
// LEITURA DO BANCO
// ==========================================
function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()})); renderCat(); renderFiltrosVitrine(); });
    db.collection("produtos").onSnapshot(s => { bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()})); renderProd(); renderVitrine(); });
    db.collection("acabamentos").onSnapshot(s => { bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()})); renderAcab(); atualizarListaAcabamentosProduto(); });
    db.collection("clientes").orderBy("nome").onSnapshot(s => { bdClientes = s.docs.map(d => ({id: d.id, ...d.data()})); renderCli(); });
}

// ==========================================
// FASE 3: LOJA E CONFIGURADOR MÁGICO
// ==========================================
function renderFiltrosVitrine() {
    const nav = document.getElementById('menuFiltroCat'); if(!nav) return;
    let html = `<button class="ativo" onclick="filtrarVitrine('Todos', this)">Todos</button>`;
    bdCategorias.forEach(c => { html += `<button onclick="filtrarVitrine('${c.nome}', this)">${c.nome}</button>`; });
    nav.innerHTML = html;
}

function filtrarVitrine(catNome, btn) {
    document.querySelectorAll('#menuFiltroCat button').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo'); renderVitrine(catNome);
}

function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos'); if(!grid) return;
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    if(prods.length === 0) { grid.innerHTML = '<p style="color:#718096; grid-column: 1 / -1;">Nenhum produto encontrado.</p>'; return; }

    grid.innerHTML = prods.map(p => {
        // FIM DO PISCA PISCA: Lógica limpa para imagem via Div Background
        const temFoto = p.foto && p.foto.trim() !== '';
        const imgStyle = temFoto ? `background-image: url('${p.foto}');` : '';
        const imgText = temFoto ? '' : 'Sem Imagem';
        
        let subtitulo = p.regraPreco === 'm2' ? 'A partir de m²' : (p.regraPreco === 'pacote' ? 'Grade Fechada' : 'Preço Unitário');
        let precoVitrine = p.regraPreco === 'pacote' && p.pacotes && p.pacotes.length > 0 ? p.pacotes[0].preco : (p.preco || 0);
        
        let corFundo = p.tipo === 'grafico' ? 'bg-grafico' : (p.tipo === 'visual' ? 'bg-visual' : 'bg-outros');

        return `
        <div class="produto-card ${corFundo}" onclick="abrirConfigurador('${p.id}')">
            <div class="img-vitrine" style="${imgStyle}">${imgText}</div>
            <h4>${p.nome}</h4>
            <small style="color:#718096; font-weight:bold;">${p.categoria}</small>
            <p style="color:var(--cor-sucesso);">R$ ${precoVitrine.toFixed(2)} <br><small style="font-weight:normal; font-size:11px; color:#4A5568;">(${subtitulo})</small></p>
        </div>`
    }).join('');
}

function abrirConfigurador(idProduto) {
    const p = bdProdutos.find(x => x.id === idProduto); if(!p) return;
    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdRegra').value = p.regraPreco;
    document.getElementById('modalProdPrecoBase').value = p.preco;

    const divMedidas = document.getElementById('modalCorpoMedidas');
    const divAcabamentos = document.getElementById('modalCorpoAcabamentos');

    // 1. GERA MEDIDAS, PACOTES OU UNIDADE
    if (p.regraPreco === 'm2') {
        divMedidas.innerHTML = `<div class="input-group"><label>Largura (m)</label><input type="number" id="w2pLargura" value="1.00" step="0.01" max="${p.larguraMax}" oninput="calcularPrecoAoVivo()"><small style="color:#718096; font-size:11px;">Máx. Bobina: ${p.larguraMax}m</small></div><div class="input-group"><label>Altura (m)</label><input type="number" id="w2pAltura" value="1.00" step="0.01" max="${p.compMax}" oninput="calcularPrecoAoVivo()"></div><div class="input-group"><label>Quantidade de Lonas</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>`;
    } else if (p.regraPreco === 'pacote') {
        let options = (p.pacotes || []).map(pct => `<option value="${pct.qtd}" data-preco="${pct.preco}">${pct.qtd} un. - R$ ${pct.preco.toFixed(2)}</option>`).join('');
        if(!options) options = `<option value="1" data-preco="0">Nenhum pacote cadastrado</option>`;
        divMedidas.innerHTML = `<div class="input-group"><label>Escolha a Quantidade (Pacote)</label><select id="w2pPacote" onchange="calcularPrecoAoVivo()">${options}</select></div>`;
    } else {
        divMedidas.innerHTML = `<div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>`;
    }

    // 2. GERA ACABAMENTOS PERMITIDOS
    const acabamentosProd = p.acabamentos || [];
    if(acabamentosProd.length > 0) {
        let htmlAcab = `<label style="display:block; font-weight:bold; color:#4A5568; margin-bottom:10px;">Opções e Acabamentos extras</label><div class="lista-acabamentos-modal">`;
        acabamentosProd.forEach(idAcab => {
            const a = bdAcabamentos.find(x => x.id === idAcab);
            if(a) {
                let lbl = a.regra === 'lote' ? 'Taxa Fixa Lote' : (a.regra === 'm2' ? 'Por m²' : 'Cada');
                htmlAcab += `<label class="check-box-custom"><div><input type="checkbox" class="w2p-check-acab" value="${a.nome}" data-regra="${a.regra}" data-preco="${a.venda}" onchange="calcularPrecoAoVivo()"><span style="font-weight:bold; color:#2D3748; font-size:14px;">${a.nome}</span></div><span style="color:#38A169; font-weight:bold; font-size:13px;">+ R$ ${a.venda.toFixed(2)} <small>(${lbl})</small></span></label>`;
            }
        });
        divAcabamentos.innerHTML = htmlAcab + `</div>`;
    } else { divAcabamentos.innerHTML = ''; }

    document.getElementById('modalW2P').style.display = 'flex';
    calcularPrecoAoVivo();
}

function fecharModal() { document.getElementById('modalW2P').style.display = 'none'; }

function calcularPrecoAoVivo() {
    const regraProduto = document.getElementById('modalProdRegra').value;
    const precoBase = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    
    let qtd = 1; let metrosTotais = 0; let totalBase = 0;

    if (regraProduto === 'm2') {
        qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
        let larg = parseFloat(document.getElementById('w2pLargura')?.value) || 1;
        let alt = parseFloat(document.getElementById('w2pAltura')?.value) || 1;
        const maxL = parseFloat(document.getElementById('w2pLargura')?.max);
        document.getElementById('w2pLargura').style.borderColor = larg > maxL ? "red" : "#CBD5E0";
        metrosTotais = larg * alt;
        totalBase = (precoBase * metrosTotais) * qtd;
    } else if (regraProduto === 'pacote') {
        const selectBox = document.getElementById('w2pPacote');
        qtd = parseInt(selectBox.value) || 1; 
        totalBase = parseFloat(selectBox.options[selectBox.selectedIndex]?.getAttribute('data-preco')) || 0;
    } else {
        qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
        totalBase = precoBase * qtd;
    }

    let totalAcab = 0;
    document.querySelectorAll('.w2p-check-acab:checked').forEach(chk => {
        const pAcab = parseFloat(chk.getAttribute('data-preco')) || 0;
        const rAcab = chk.getAttribute('data-regra');
        
        if(rAcab === 'm2') {
            let area = metrosTotais > 0 ? metrosTotais : 1; 
            totalAcab += (pAcab * area) * qtd;
        } else if (rAcab === 'lote') {
            totalAcab += pAcab; // Taxa Única (Ex: Faca Especial R$ 80, independente se tem 1 ou 1000 cartões)
        } else {
            totalAcab += (pAcab * qtd); // Unidade: R$ 0.10 x 1000 cartões = 100.
        }
    });

    document.getElementById('modalSubtotal').innerText = (totalBase + totalAcab).toFixed(2);
}

function confirmarAdicaoCarrinho() {
    const p = bdProdutos.find(x => x.id === document.getElementById('modalProdId').value);
    const regraProduto = document.getElementById('modalProdRegra').value;
    
    let qtd = 1; let info = "";
    if (regraProduto === 'm2') {
        qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
        info = `${qtd}x Un. (${document.getElementById('w2pLargura').value}x${document.getElementById('w2pAltura').value}m). `;
    } else if (regraProduto === 'pacote') {
        qtd = document.getElementById('w2pPacote').value;
        info = `Pacote Fechado: ${qtd} Unidades. `;
    } else {
        qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
        info = `${qtd}x Unidades. `;
    }

    const checks = document.querySelectorAll('.w2p-check-acab:checked');
    if(checks.length > 0) info += `Extras: ${Array.from(checks).map(c => c.value).join(', ')}`;

    carrinho.push({ nome: p.nome, detalhes: info, valorFinal: parseFloat(document.getElementById('modalSubtotal').innerText) });
    fecharModal(); renderCarrinho();
}

function toggleOpcoesPagamento() { document.getElementById('divParcelas').style.display = (document.getElementById('cartPagamento').value === 'Credito_Parcelado') ? 'block' : 'none'; }
function toggleOpcoesEntrega() {
    const e = document.getElementById('cartEntrega').value;
    if(e === 'Motoboy') { document.getElementById('divFrete').style.display = 'block'; } 
    else { document.getElementById('divFrete').style.display = 'none'; document.getElementById('cartFreteValor').value = "0.00"; }
    atualizarTotalComFrete();
}

function renderCarrinho() {
    const div = document.getElementById('listaCarrinho'); let subT = 0;
    if(carrinho.length === 0) { div.innerHTML = '<small style="color:#A0AEC0;">Vazio.</small>'; document.getElementById('totalCarrinho').setAttribute('data-subtotal', "0"); atualizarTotalComFrete(); return; }
    div.innerHTML = carrinho.map((item, i) => { subT += item.valorFinal; return `<div class="carrinho-item"><div><strong style="color:var(--cor-principal); font-size:14px;">${item.nome}</strong><br><small style="color:#718096;">${item.detalhes}</small></div><div style="text-align:right;"><b style="color:#2D3748;">R$ ${item.valorFinal.toFixed(2)}</b><br><button class="btn-remover-item" onclick="carrinho.splice(${i},1); renderCarrinho()">Remover</button></div></div>`; }).join('');
    document.getElementById('totalCarrinho').setAttribute('data-subtotal', subT); atualizarTotalComFrete();
}

function atualizarTotalComFrete() {
    const sub = parseFloat(document.getElementById('totalCarrinho').getAttribute('data-subtotal')) || 0;
    let frete = document.getElementById('cartEntrega').value === 'Motoboy' ? parseFloat(document.getElementById('cartFreteValor').value) || 0 : 0;
    document.getElementById('totalCarrinho').innerText = (sub + frete).toFixed(2);
}

function enviarPedido() {
    if(carrinho.length === 0) return alert("Carrinho vazio!");
    if(!document.getElementById('cartCliente').value) return alert("Selecione um cliente!");
    const p = document.getElementById('cartPagamento').value;
    alert(`Pedido gerado!\nPagamento: ${p === 'Credito_Parcelado' ? p + ' ' + document.getElementById('cartParcelas').value : p}`);
    carrinho = []; document.getElementById('cartFreteValor').value = "0.00"; renderCarrinho(); toggleOpcoesEntrega();
}

// ==========================================
// CADASTROS E LÓGICA DAS GRADES (PACOTES)
// ==========================================
function ajustarCamposProduto() {
    const tipo = document.getElementById('prodTipo').value; const regra = document.getElementById('prodRegraPreco').value;
    const divCor = document.getElementById('grp-cor'); const divTam = document.getElementById('grp-tamanho'); 
    const boxMed = document.getElementById('boxMedidas'); const lblPreco = document.getElementById('labelPreco');
    const boxBase = document.getElementById('boxPrecoBase'); const boxPacotes = document.getElementById('boxPacotes');

    if (tipo === 'visual') { if(divCor) divCor.style.display = 'none'; if(divTam) divTam.style.display = 'none'; } else { if(divCor) divCor.style.display = 'block'; if(divTam) divTam.style.display = 'block'; }
    
    // Mostra/Esconde Telas de Preço
    boxMed.style.display = 'none'; boxBase.style.display = 'none'; boxPacotes.style.display = 'none';
    if (regra === 'm2') { boxMed.style.display = 'grid'; boxBase.style.display = 'block'; lblPreco.innerText = "Preço por m² (R$)"; } 
    else if (regra === 'pacote') { boxPacotes.style.display = 'block'; } 
    else { boxBase.style.display = 'block'; lblPreco.innerText = "Preço Unitário (R$)"; }
}
document.addEventListener('DOMContentLoaded', ajustarCamposProduto);

// NOVA FUNÇÃO: Adiciona a linha de quantidade na grade
function addLinhaPacote(q = '', p = '') {
    const div = document.createElement('div'); div.className = 'linha-pacote';
    div.innerHTML = `<input type="number" class="pacote-qtd" placeholder="Qtd (Ex: 1000)" value="${q}"><input type="number" class="pacote-preco" placeholder="Valor Total (R$)" step="0.01" value="${p}"><button type="button" class="btn-rem-pacote" onclick="this.parentElement.remove()">X</button>`;
    document.getElementById('listaGradePacotes').appendChild(div);
}

async function salvarProduto() {
    const id = document.getElementById('prodId').value; const checks = document.querySelectorAll('.check-acab-prod:checked');
    const regra = document.getElementById('prodRegraPreco').value;
    
    // Captura os pacotes se for o caso
    let pacotes = [];
    if(regra === 'pacote') {
        document.querySelectorAll('.linha-pacote').forEach(l => {
            let q = parseInt(l.querySelector('.pacote-qtd').value); let p = parseFloat(l.querySelector('.pacote-preco').value);
            if(q && p) pacotes.push({qtd: q, preco: p});
        });
        pacotes.sort((a,b) => a.qtd - b.qtd);
        if(pacotes.length === 0) return alert("Adicione pelo menos uma quantidade e preço no pacote!");
    }

    const dados = { 
        tipo: document.getElementById('prodTipo').value, categoria: document.getElementById('prodCategoria').value, 
        nome: document.getElementById('prodNome').value, foto: document.getElementById('prodFoto').value, 
        cor: document.getElementById('prodCor').value, material: document.getElementById('prodMaterial').value, 
        tamanho: document.getElementById('prodTamanho').value, prazo: document.getElementById('prodPrazo').value, 
        regraPreco: regra, preco: parseFloat(document.getElementById('prodPreco').value) || 0, 
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 1.50, compMax: parseFloat(document.getElementById('prodCompMax').value) || 100, 
        acabamentos: Array.from(checks).map(c => c.value), pacotes: pacotes 
    };
    if (!dados.nome) return alert("Nome obrigatório!");
    if (id) await db.collection("produtos").doc(id).update(dados); else await db.collection("produtos").add(dados);
    limparFormProduto(); alert("Produto salvo!");
}

function renderProd() { 
    document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => {
        let textoPreco = p.regraPreco === 'pacote' ? `Grade (${(p.pacotes||[]).length} pacotes)` : `R$ ${p.preco.toFixed(2)}`;
        return `<tr><td><b>${p.nome}</b><br><small style="color:#718096">${p.categoria}</small></td><td>${p.tipo === 'visual' ? 'Com. Visual' : p.tipo}</td><td style="color:#2F855A; font-weight:bold;">${textoPreco}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editProd('${p.id}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('produtos', '${p.id}')"><i class="fa fa-trash"></i></button></td></tr>`;
    }).join(''); 
}

function editProd(id) { 
    const p = bdProdutos.find(x => x.id === id); document.getElementById('prodId').value = p.id; document.getElementById('prodTipo').value = p.tipo; document.getElementById('prodCategoria').value = p.categoria; document.getElementById('prodNome').value = p.nome; document.getElementById('prodFoto').value = p.foto || ''; document.getElementById('prodCor').value = p.cor || 'N/A'; document.getElementById('prodMaterial').value = p.material || ''; document.getElementById('prodTamanho').value = p.tamanho || ''; document.getElementById('prodPrazo').value = p.prazo || ''; document.getElementById('prodRegraPreco').value = p.regraPreco; document.getElementById('prodPreco').value = p.preco; document.getElementById('prodLargMax').value = p.larguraMax || 1.50; document.getElementById('prodCompMax').value = p.compMax || 100; 
    document.getElementById('listaGradePacotes').innerHTML = "";
    if(p.pacotes) p.pacotes.forEach(pct => addLinhaPacote(pct.qtd, pct.preco));
    ajustarCamposProduto(); atualizarListaAcabamentosProduto(p.acabamentos || []); window.scrollTo(0,0); 
}

function limparFormProduto() { 
    document.getElementById('prodId').value = ""; document.getElementById('prodNome').value = ""; document.getElementById('prodFoto').value = ""; document.getElementById('prodMaterial').value = ""; document.getElementById('prodTamanho').value = ""; document.getElementById('prodPrazo').value = ""; document.getElementById('prodPreco').value = "0.00"; 
    document.getElementById('listaGradePacotes').innerHTML = ""; // Limpa as linhas extras
    ajustarCamposProduto(); atualizarListaAcabamentosProduto(); 
}

function atualizarListaAcabamentosProduto(salvos = []) { const container = document.getElementById('listaCheckAcabamentos'); const cat = document.getElementById('prodCategoria')?.value; if (!cat || bdAcabamentos.length === 0) { container.innerHTML = '<small>Nenhum acabamento...</small>'; return; } const filtrados = bdAcabamentos.filter(a => (a.categoria || "") === cat || (a.categoria || "").includes("Geral")); if(filtrados.length === 0) { container.innerHTML = '<small>Nenhum para esta categoria.</small>'; return; } const arrSalvos = Array.isArray(salvos) ? salvos : []; container.innerHTML = filtrados.map(a => `<label><input type="checkbox" class="check-acab-prod" value="${a.id}" ${arrSalvos.includes(a.id) ? 'checked' : ''}> ${a.nome} <small>(${a.grupo || 'Solto'})</small></label>`).join(''); }

// CRUD CLIENTES (MANTIDO)
async function salvarCliente() { const id = document.getElementById('cliId').value; const dados = { nome: document.getElementById('cliNome').value, documento: document.getElementById('cliDoc').value, telefone: document.getElementById('cliTel').value, endereco: document.getElementById('cliEnd').value }; if (!dados.nome) return alert("O Nome/Razão Social é obrigatório."); if (id) await db.collection("clientes").doc(id).update(dados); else await db.collection("clientes").add(dados); limparFormCliente(); alert("Cliente salvo!"); }
function renderCli() { document.getElementById('listaClientes').innerHTML = bdClientes.map(c => `<tr><td><b>${c.nome}</b></td><td>${c.documento}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editCli('${c.id}')"><i class="fa fa-pen"></i></button></td></tr>`).join(''); document.getElementById('cartCliente').innerHTML = `<option value="">Selecione um cliente...</option>` + bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join(''); }
function editCli(id) { const c = bdClientes.find(x => x.id === id); document.getElementById('cliId').value = c.id; document.getElementById('cliNome').value = c.nome; document.getElementById('cliDoc').value = c.documento || ''; document.getElementById('cliTel').value = c.telefone || ''; document.getElementById('cliEnd').value = c.endereco || ''; window.scrollTo(0,0); }
function limparFormCliente() { document.getElementById('cliId').value = ""; document.getElementById('cliNome').value = ""; document.getElementById('cliDoc').value = ""; document.getElementById('cliTel').value = ""; document.getElementById('cliEnd').value = ""; }

// CRUD CATEGORIA (MANTIDO)
async function salvarCategoria() { const id = document.getElementById('catId').value; const nome = document.getElementById('catNome').value; if (!nome) return alert("Digite o nome!"); if (id) await db.collection("categorias").doc(id).update({nome}); else await db.collection("categorias").add({nome}); document.getElementById('catId').value = ""; document.getElementById('catNome').value = ""; }
function renderCat() { document.getElementById('listaCategorias').innerHTML = bdCategorias.map(c => `<tr><td>${c.nome}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editCat('${c.id}','${c.nome}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('categorias', '${c.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join(''); const selects = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join(''); document.getElementById('prodCategoria').innerHTML = selects; document.getElementById('acabCategoria').innerHTML = `<option value="Geral (Aparece em todos)">Geral (Aparece em todos)</option>` + selects; atualizarListaAcabamentosProduto(); }
function editCat(id, n) { document.getElementById('catId').value = id; document.getElementById('catNome').value = n; }

// CRUD ACABAMENTO (MANTIDO)
async function salvarAcabamento() { const id = document.getElementById('acabId').value; const dados = { nome: document.getElementById('acabNome').value, grupo: document.getElementById('acabGrupo').value, categoria: document.getElementById('acabCategoria').value, regra: document.getElementById('acabRegra').value, venda: parseFloat(document.getElementById('acabPrecoVenda').value) || 0, custo: parseFloat(document.getElementById('acabCusto').value) || 0 }; if (id) await db.collection("acabamentos").doc(id).update(dados); else await db.collection("acabamentos").add(dados); limparFormAcabamento(); }
function renderAcab() { document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `<tr><td><b>${a.nome}</b><br><small style="color:#718096">${a.grupo || 'Solto'}</small></td><td style="color:#2F855A; font-weight:bold;">R$ ${a.venda.toFixed(2)}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editAcab('${a.id}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('acabamentos', '${a.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join(''); }
function editAcab(id) { const a = bdAcabamentos.find(x => x.id === id); document.getElementById('acabId').value = a.id; document.getElementById('acabNome').value = a.nome; document.getElementById('acabGrupo').value = a.grupo || ''; document.getElementById('acabCategoria').value = a.categoria; document.getElementById('acabRegra').value = a.regra; document.getElementById('acabPrecoVenda').value = a.venda; document.getElementById('acabCusto').value = a.custo; window.scrollTo(0,0); }
function limparFormAcabamento() { document.getElementById('acabId').value = ""; document.getElementById('acabNome').value = ""; document.getElementById('acabGrupo').value = ""; document.getElementById('acabPrecoVenda').value = "0.00"; document.getElementById('acabCusto').value = "0.00"; }

function deletarDoc(colecao, id) { if (confirm("Apagar este item para sempre?")) db.collection(colecao).doc(id).delete(); }
