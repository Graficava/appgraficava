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

// Memória do Sistema
let bdCategorias = [], bdProdutos = [], bdAcabamentos = [], bdClientes = [];
let carrinho = [];

// ==========================================
// 1. SISTEMA DE LOGIN E NAVEGAÇÃO
// ==========================================
auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('appInterface').style.display = 'flex';
        iniciarLeitura();
    } else {
        document.getElementById('telaLogin').style.display = 'flex';
        document.getElementById('appInterface').style.display = 'none';
    }
});

function entrar() {
    const e = document.getElementById('email').value;
    const s = document.getElementById('senha').value;
    auth.signInWithEmailAndPassword(e, s).catch(() => alert("Erro no login."));
}
function sair() { auth.signOut(); }

function mudarAba(aba) {
    document.querySelectorAll('.aba').forEach(a => a.classList.remove('ativa'));
    document.querySelectorAll('.menu button').forEach(b => b.classList.remove('ativo'));
    document.getElementById('aba-' + aba).classList.add('ativa');
    event.currentTarget.classList.add('ativo');
}

function mudarSubAba(sub) {
    document.querySelectorAll('.sub-aba').forEach(a => a.classList.remove('sub-ativa'));
    document.querySelectorAll('.sub-menu button').forEach(b => b.classList.remove('sub-ativo'));
    document.getElementById(sub).classList.add('sub-ativa');
    document.getElementById('btn-' + sub).classList.add('sub-ativo');
}

// ==========================================
// 2. LEITURA DE DADOS DO FIREBASE
// ==========================================
function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => {
        bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCat();
        renderFiltrosVitrine();
    });
    db.collection("produtos").onSnapshot(s => {
        bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderProd();
        renderVitrine(); // Essa linha estava faltando renderizar os produtos!
    });
    db.collection("acabamentos").onSnapshot(s => {
        bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderAcab();
        atualizarListaAcabamentosProduto(); 
    });
    db.collection("clientes").orderBy("nome").onSnapshot(s => {
        bdClientes = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderCli();
    });
}

// ==========================================
// 3. FASE 3: A LOJA E O CARRINHO
// ==========================================
function renderFiltrosVitrine() {
    const nav = document.getElementById('menuFiltroCat');
    if(!nav) return;
    let html = `<button class="ativo" onclick="filtrarVitrine('Todos', this)">Todos</button>`;
    bdCategorias.forEach(c => { html += `<button onclick="filtrarVitrine('${c.nome}', this)">${c.nome}</button>`; });
    nav.innerHTML = html;
}

function filtrarVitrine(catNome, btn) {
    document.querySelectorAll('#menuFiltroCat button').forEach(b => b.classList.remove('ativo'));
    btn.classList.add('ativo');
    renderVitrine(catNome);
}

function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos');
    if(!grid) return;
    
    let produtosExibidos = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);

    if(produtosExibidos.length === 0) {
        grid.innerHTML = '<p style="color:#718096; grid-column: 1 / -1;">Nenhum produto encontrado.</p>';
        return;
    }

    grid.innerHTML = produtosExibidos.map(p => {
        const imgUrl = p.foto ? p.foto : 'https://via.placeholder.com/300x200?text=Sem+Foto';
        const subtitulo = p.regraPreco === 'm2' ? 'A partir de m²' : 'Preço Unitário';
        return `
        <div class="produto-card" onclick="abrirConfigurador('${p.id}')">
            <img src="${imgUrl}" alt="${p.nome}" onerror="this.src='https://via.placeholder.com/300x200?text=Sem+Foto'">
            <h4>${p.nome}</h4>
            <small style="color:#A0AEC0;">${p.categoria}</small>
            <p>R$ ${p.preco.toFixed(2)} <br><small style="font-weight:normal; font-size:11px;">(${subtitulo})</small></p>
        </div>`
    }).join('');
}

// MODAL E MATEMÁTICA
function abrirConfigurador(idProduto) {
    const p = bdProdutos.find(x => x.id === idProduto);
    if(!p) return;

    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdRegra').value = p.regraPreco;
    document.getElementById('modalProdPrecoBase').value = p.preco;

    const divMedidas = document.getElementById('modalCorpoMedidas');
    const divAcabamentos = document.getElementById('modalCorpoAcabamentos');

    if (p.regraPreco === 'm2') {
        divMedidas.innerHTML = `
            <div class="input-group"><label>Largura (m)</label><input type="number" id="w2pLargura" value="1.00" step="0.01" max="${p.larguraMax}" oninput="calcularPrecoAoVivo()"><small style="color:#718096; font-size:11px;">Máx. Bobina: ${p.larguraMax}m</small></div>
            <div class="input-group"><label>Altura (m)</label><input type="number" id="w2pAltura" value="1.00" step="0.01" max="${p.compMax}" oninput="calcularPrecoAoVivo()"></div>
            <div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>`;
    } else {
        divMedidas.innerHTML = `<div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>`;
    }

    const acabamentosProd = p.acabamentos || [];
    if(acabamentosProd.length > 0) {
        let htmlAcab = `<label style="display:block; font-weight:bold; color:#4A5568; margin-bottom:10px;">Opções e Acabamentos</label><div class="lista-acabamentos-modal">`;
        acabamentosProd.forEach(idAcab => {
            const a = bdAcabamentos.find(x => x.id === idAcab);
            if(a) {
                htmlAcab += `<label class="check-box-custom"><div><input type="checkbox" class="w2p-check-acab" value="${a.nome}" data-regra="${a.regra}" data-preco="${a.venda}" onchange="calcularPrecoAoVivo()"><span style="font-weight:bold; color:#2D3748; font-size:14px;">${a.nome}</span></div><span style="color:#38A169; font-weight:bold; font-size:13px;">+ R$ ${a.venda.toFixed(2)}</span></label>`;
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
    const qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
    let metrosTotais = 0; let totalBase = 0;

    if (regraProduto === 'm2') {
        let larg = parseFloat(document.getElementById('w2pLargura')?.value) || 1;
        let alt = parseFloat(document.getElementById('w2pAltura')?.value) || 1;
        const maxL = parseFloat(document.getElementById('w2pLargura')?.max);
        document.getElementById('w2pLargura').style.borderColor = larg > maxL ? "red" : "#CBD5E0";
        metrosTotais = larg * alt;
        totalBase = (precoBase * metrosTotais) * qtd;
    } else {
        totalBase = precoBase * qtd;
    }

    let totalAcab = 0;
    document.querySelectorAll('.w2p-check-acab:checked').forEach(chk => {
        const pAcab = parseFloat(chk.getAttribute('data-preco')) || 0;
        const rAcab = chk.getAttribute('data-regra');
        if(rAcab === 'm2') {
            let area = metrosTotais > 0 ? metrosTotais : 1; 
            totalAcab += (pAcab * area) * qtd;
        } else {
            totalAcab += (pAcab * qtd);
        }
    });

    document.getElementById('modalSubtotal').innerText = (totalBase + totalAcab).toFixed(2);
}

function confirmarAdicaoCarrinho() {
    const p = bdProdutos.find(x => x.id === document.getElementById('modalProdId').value);
    const qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
    let info = `${qtd}x Un. `;
    
    if(document.getElementById('modalProdRegra').value === 'm2') {
        info = `${qtd}x Un. (${document.getElementById('w2pLargura').value}x${document.getElementById('w2pAltura').value}m). `;
    }

    const checks = document.querySelectorAll('.w2p-check-acab:checked');
    if(checks.length > 0) info += `Extras: ${Array.from(checks).map(c => c.value).join(', ')}`;

    carrinho.push({ nome: p.nome, detalhes: info, valorFinal: parseFloat(document.getElementById('modalSubtotal').innerText) });
    fecharModal(); renderCarrinho();
}

function renderCarrinho() {
    const div = document.getElementById('listaCarrinho');
    let total = 0;
    if(carrinho.length === 0) {
        div.innerHTML = '<small style="color:#A0AEC0;">O carrinho está vazio.</small>';
        document.getElementById('totalCarrinho').innerText = "0.00";
        return;
    }
    div.innerHTML = carrinho.map((item, i) => {
        total += item.valorFinal;
        return `<div class="carrinho-item"><div><strong style="color:var(--cor-principal); font-size:14px;">${item.nome}</strong><br><small style="color:#718096;">${item.detalhes}</small></div><div style="text-align:right;"><b style="color:#2D3748;">R$ ${item.valorFinal.toFixed(2)}</b><br><button class="btn-remover-item" onclick="carrinho.splice(${i},1); renderCarrinho()">Remover</button></div></div>`;
    }).join('');
    document.getElementById('totalCarrinho').innerText = total.toFixed(2);
}

function enviarPedido() {
    const clienteId = document.getElementById('cartCliente').value;
    if(carrinho.length === 0) return alert("Carrinho vazio!");
    if(!clienteId) return alert("Selecione um cliente para fechar o pedido!");
    
    alert("Pedido gerado com sucesso! (Integração na Fase 4)");
    carrinho = []; renderCarrinho();
}

// ==========================================
// 4. CADASTROS (Clientes, Produtos, etc)
// ==========================================

// --- CLIENTES ---
async function salvarCliente() {
    const id = document.getElementById('cliId').value;
    const dados = {
        nome: document.getElementById('cliNome').value,
        documento: document.getElementById('cliDoc').value,
        telefone: document.getElementById('cliTel').value,
        endereco: document.getElementById('cliEnd').value
    };
    if (!dados.nome) return alert("O Nome/Razão Social é obrigatório.");

    if (id) await db.collection("clientes").doc(id).update(dados);
    else await db.collection("clientes").add(dados);
    
    limparFormCliente(); alert("Cliente salvo!");
}

function renderCli() {
    // Alimenta a tabela de Cadastros
    document.getElementById('listaClientes').innerHTML = bdClientes.map(c => `<tr><td><b>${c.nome}</b></td><td>${c.documento}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editCli('${c.id}')"><i class="fa fa-pen"></i></button></td></tr>`).join('');
    
    // Alimenta o Select de Clientes no Carrinho
    const options = `<option value="">Selecione um cliente...</option>` + bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    document.getElementById('cartCliente').innerHTML = options;
}

function editCli(id) {
    const c = bdClientes.find(x => x.id === id);
    document.getElementById('cliId').value = c.id; document.getElementById('cliNome').value = c.nome;
    document.getElementById('cliDoc').value = c.documento || ''; document.getElementById('cliTel').value = c.telefone || '';
    document.getElementById('cliEnd').value = c.endereco || ''; window.scrollTo(0,0);
}

function limparFormCliente() {
    document.getElementById('cliId').value = ""; document.getElementById('cliNome').value = "";
    document.getElementById('cliDoc').value = ""; document.getElementById('cliTel').value = "";
    document.getElementById('cliEnd').value = "";
}

// --- PRODUTOS E LOGICA DE EXIBIÇÃO ---
function ajustarCamposProduto() {
    const tipo = document.getElementById('prodTipo').value;
    const regra = document.getElementById('prodRegraPreco').value;
    const divCor = document.getElementById('grp-cor');
    const divTam = document.getElementById('grp-tamanho');
    const boxMed = document.getElementById('boxMedidas');
    const lblPreco = document.getElementById('labelPreco');

    if (tipo === 'visual') { if(divCor) divCor.style.display = 'none'; if(divTam) divTam.style.display = 'none'; } 
    else { if(divCor) divCor.style.display = 'block'; if(divTam) divTam.style.display = 'block'; }
    if (regra === 'm2') { if(boxMed) boxMed.style.display = 'grid'; if(lblPreco) lblPreco.innerText = "Preço por m² (R$)"; } 
    else { if(boxMed) boxMed.style.display = 'none'; if(lblPreco) lblPreco.innerText = "Preço Unitário (R$)"; }
}
document.addEventListener('DOMContentLoaded', ajustarCamposProduto);

async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    const checks = document.querySelectorAll('.check-acab-prod:checked');
    const dados = {
        tipo: document.getElementById('prodTipo').value,
        categoria: document.getElementById('prodCategoria').value,
        nome: document.getElementById('prodNome').value,
        foto: document.getElementById('prodFoto').value,
        cor: document.getElementById('prodCor').value,
        material: document.getElementById('prodMaterial').value,
        tamanho: document.getElementById('prodTamanho').value,
        prazo: document.getElementById('prodPrazo').value,
        regraPreco: document.getElementById('prodRegraPreco').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 1.50,
        compMax: parseFloat(document.getElementById('prodCompMax').value) || 100,
        acabamentos: Array.from(checks).map(c => c.value)
    };
    if (!dados.nome) return alert("Nome obrigatório!");
    if (id) await db.collection("produtos").doc(id).update(dados);
    else await db.collection("produtos").add(dados);
    limparFormProduto(); alert("Produto salvo!");
}

function renderProd() {
    document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `<tr><td><b>${p.nome}</b><br><small style="color:#718096">${p.categoria}</small></td><td>${p.tipo === 'visual' ? 'Com. Visual' : p.tipo}</td><td style="color:#2F855A; font-weight:bold;">R$ ${p.preco.toFixed(2)}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editProd('${p.id}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('produtos', '${p.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join('');
}

function editProd(id) {
    const p = bdProdutos.find(x => x.id === id);
    document.getElementById('prodId').value = p.id; document.getElementById('prodTipo').value = p.tipo;
    document.getElementById('prodCategoria').value = p.categoria; document.getElementById('prodNome').value = p.nome;
    document.getElementById('prodFoto').value = p.foto || ''; document.getElementById('prodCor').value = p.cor || 'N/A';
    document.getElementById('prodMaterial').value = p.material || ''; document.getElementById('prodTamanho').value = p.tamanho || '';
    document.getElementById('prodPrazo').value = p.prazo || ''; document.getElementById('prodRegraPreco').value = p.regraPreco;
    document.getElementById('prodPreco').value = p.preco; document.getElementById('prodLargMax').value = p.larguraMax || 1.50;
    document.getElementById('prodCompMax').value = p.compMax || 100;
    ajustarCamposProduto(); atualizarListaAcabamentosProduto(p.acabamentos || []); window.scrollTo(0,0);
}
function limparFormProduto() {
    document.getElementById('prodId').value = ""; document.getElementById('prodNome').value = "";
    document.getElementById('prodFoto').value = ""; document.getElementById('prodMaterial').value = "";
    document.getElementById('prodTamanho').value = ""; document.getElementById('prodPrazo').value = "";
    document.getElementById('prodPreco').value = "0.00";
    ajustarCamposProduto(); atualizarListaAcabamentosProduto();
}

function atualizarListaAcabamentosProduto(salvos = []) {
    const container = document.getElementById('listaCheckAcabamentos');
    const cat = document.getElementById('prodCategoria')?.value;
    if (!cat || bdAcabamentos.length === 0) { container.innerHTML = '<small>Nenhum acabamento...</small>'; return; }
    
    const filtrados = bdAcabamentos.filter(a => (a.categoria || "") === cat || (a.categoria || "").includes("Geral"));
    if(filtrados.length === 0) { container.innerHTML = '<small>Nenhum para esta categoria.</small>'; return; }
    
    const arrSalvos = Array.isArray(salvos) ? salvos : [];
    container.innerHTML = filtrados.map(a => `<label><input type="checkbox" class="check-acab-prod" value="${a.id}" ${arrSalvos.includes(a.id) ? 'checked' : ''}> ${a.nome} <small>(${a.grupo || 'Solto'})</small></label>`).join('');
}

// --- CATEGORIAS & ACABAMENTOS ---
async function salvarCategoria() {
    const id = document.getElementById('catId').value; const nome = document.getElementById('catNome').value;
    if (!nome) return alert("Digite o nome!");
    if (id) await db.collection("categorias").doc(id).update({nome}); else await db.collection("categorias").add({nome});
    document.getElementById('catId').value = ""; document.getElementById('catNome').value = "";
}
function renderCat() {
    document.getElementById('listaCategorias').innerHTML = bdCategorias.map(c => `<tr><td>${c.nome}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editCat('${c.id}','${c.nome}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('categorias', '${c.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join('');
    const selects = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('prodCategoria').innerHTML = selects;
    document.getElementById('acabCategoria').innerHTML = `<option value="Geral (Aparece em todos)">Geral (Aparece em todos)</option>` + selects;
    atualizarListaAcabamentosProduto(); 
}
function editCat(id, n) { document.getElementById('catId').value = id; document.getElementById('catNome').value = n; }

async function salvarAcabamento() {
    const id = document.getElementById('acabId').value;
    const dados = { nome: document.getElementById('acabNome').value, grupo: document.getElementById('acabGrupo').value, categoria: document.getElementById('acabCategoria').value, regra: document.getElementById('acabRegra').value, venda: parseFloat(document.getElementById('acabPrecoVenda').value) || 0, custo: parseFloat(document.getElementById('acabCusto').value) || 0 };
    if (id) await db.collection("acabamentos").doc(id).update(dados); else await db.collection("acabamentos").add(dados);
    limparFormAcabamento();
}
function renderAcab() { document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `<tr><td><b>${a.nome}</b><br><small style="color:#718096">${a.grupo || 'Solto'}</small></td><td style="color:#2F855A; font-weight:bold;">R$ ${a.venda.toFixed(2)}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editAcab('${a.id}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('acabamentos', '${a.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join(''); }
function editAcab(id) { const a = bdAcabamentos.find(x => x.id === id); document.getElementById('acabId').value = a.id; document.getElementById('acabNome').value = a.nome; document.getElementById('acabGrupo').value = a.grupo || ''; document.getElementById('acabCategoria').value = a.categoria; document.getElementById('acabRegra').value = a.regra; document.getElementById('acabPrecoVenda').value = a.venda; document.getElementById('acabCusto').value = a.custo; window.scrollTo(0,0); }
function limparFormAcabamento() { document.getElementById('acabId').value = ""; document.getElementById('acabNome').value = ""; document.getElementById('acabGrupo').value = ""; document.getElementById('acabPrecoVenda').value = "0.00"; document.getElementById('acabCusto').value = "0.00"; }
function deletarDoc(colecao, id) { if (confirm("Apagar este item para sempre?")) db.collection(colecao).doc(id).delete(); }
