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

let bdCategorias = [], bdProdutos = [], bdAcabamentos = [];
let carrinho = [];

// ==========================================
// LOGIN E NAVEGAÇÃO
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
    auth.signInWithEmailAndPassword(e, s).catch(() => alert("Erro no login. Verifique e-mail e senha."));
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
// BANCO DE DADOS (LEITURA CENTRAL)
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
        renderVitrine(); // Atualiza a loja
    });
    db.collection("acabamentos").onSnapshot(s => {
        bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()}));
        renderAcab();
        atualizarListaAcabamentosProduto(); 
    });
}

// ==========================================
// FASE 3: LOJA W2P, MODAL E MATEMÁTICA
// ==========================================

function renderFiltrosVitrine() {
    const nav = document.getElementById('menuFiltroCat');
    if(!nav) return;
    let html = `<button class="ativo" onclick="filtrarVitrine('Todos', this)">Todos</button>`;
    bdCategorias.forEach(c => {
        html += `<button onclick="filtrarVitrine('${c.nome}', this)">${c.nome}</button>`;
    });
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
    
    let produtosExibidos = bdProdutos;
    if(filtro !== 'Todos') {
        produtosExibidos = bdProdutos.filter(p => p.categoria === filtro);
    }

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
        </div>
    `}).join('');
}

// O CONFIGURADOR MÁGICO
function abrirConfigurador(idProduto) {
    const p = bdProdutos.find(x => x.id === idProduto);
    if(!p) return;

    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdRegra').value = p.regraPreco;
    document.getElementById('modalProdPrecoBase').value = p.preco;

    const divMedidas = document.getElementById('modalCorpoMedidas');
    const divAcabamentos = document.getElementById('modalCorpoAcabamentos');

    // 1. GERA OS CAMPOS DE MEDIDAS OU QUANTIDADE
    if (p.regraPreco === 'm2') {
        divMedidas.innerHTML = `
            <div class="input-group"><label>Largura (m)</label><input type="number" id="w2pLargura" value="1.00" step="0.01" max="${p.larguraMax}" oninput="calcularPrecoAoVivo()">
            <small style="color:#718096; font-size:11px;">Máx. Bobina: ${p.larguraMax}m</small></div>
            <div class="input-group"><label>Altura (m)</label><input type="number" id="w2pAltura" value="1.00" step="0.01" max="${p.compMax}" oninput="calcularPrecoAoVivo()"></div>
            <div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>
        `;
    } else {
        divMedidas.innerHTML = `
            <div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>
        `;
    }

    // 2. GERA OS CHECKBOXES DOS ACABAMENTOS (Apenas os permitidos)
    const acabamentosDesteProduto = p.acabamentos || []; // Array de IDs
    if(acabamentosDesteProduto.length > 0) {
        let htmlAcabamentos = `<label style="display:block; font-weight:bold; color:#4A5568; margin-bottom:10px;">Opções e Acabamentos</label><div class="lista-acabamentos-modal">`;
        
        acabamentosDesteProduto.forEach(idAcab => {
            const acabReal = bdAcabamentos.find(a => a.id === idAcab);
            if(acabReal) {
                // Guarda a regra e o preço escondidos no HTML para o cálculo fácil
                htmlAcabamentos += `
                <label class="check-box-custom">
                    <div>
                        <input type="checkbox" class="w2p-check-acab" value="${acabReal.nome}" data-regra="${acabReal.regra}" data-preco="${acabReal.venda}" onchange="calcularPrecoAoVivo()">
                        <span style="font-weight:bold; color:#2D3748; font-size:14px;">${acabReal.nome}</span>
                    </div>
                    <span style="color:#38A169; font-weight:bold; font-size:13px;">+ R$ ${acabReal.venda.toFixed(2)} <small style="color:#A0AEC0; font-weight:normal;">(${acabReal.regra})</small></span>
                </label>`;
            }
        });
        htmlAcabamentos += `</div>`;
        divAcabamentos.innerHTML = htmlAcabamentos;
    } else {
        divAcabamentos.innerHTML = '';
    }

    document.getElementById('modalW2P').style.display = 'flex';
    calcularPrecoAoVivo(); // Já faz o primeiro cálculo
}

function fecharModal() {
    document.getElementById('modalW2P').style.display = 'none';
}

// A MATEMÁTICA BRABA
function calcularPrecoAoVivo() {
    const regraProduto = document.getElementById('modalProdRegra').value;
    const precoBase = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    const qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
    
    let larg = 1, alt = 1;
    let metrosQuadradosTotais = 0;

    // Calcula a base do produto
    let totalBase = 0;
    if (regraProduto === 'm2') {
        larg = parseFloat(document.getElementById('w2pLargura')?.value) || 1;
        alt = parseFloat(document.getElementById('w2pAltura')?.value) || 1;
        
        // Bloqueio visual para não passar da bobina
        const maxL = parseFloat(document.getElementById('w2pLargura')?.max);
        if(larg > maxL) { document.getElementById('w2pLargura').style.borderColor = "red"; } 
        else { document.getElementById('w2pLargura').style.borderColor = "#CBD5E0"; }

        metrosQuadradosTotais = (larg * alt);
        totalBase = (precoBase * metrosQuadradosTotais) * qtd;
    } else {
        totalBase = precoBase * qtd;
    }

    // Calcula os acabamentos
    let totalAcabamentos = 0;
    const checkboxes = document.querySelectorAll('.w2p-check-acab:checked');
    
    checkboxes.forEach(chk => {
        const precoAcab = parseFloat(chk.getAttribute('data-preco')) || 0;
        const regraAcab = chk.getAttribute('data-regra');

        if(regraAcab === 'm2') {
            // Se a pessoa marcou laminação (m2) num produto que vende por Unidade, a gente considera área = 1
            let areaCalculo = metrosQuadradosTotais > 0 ? metrosQuadradosTotais : 1; 
            totalAcabamentos += (precoAcab * areaCalculo) * qtd;
        } else {
            // Preço fixo (Ex: Ilhós unitário)
            totalAcabamentos += (precoAcab * qtd);
        }
    });

    const totalFinal = totalBase + totalAcabamentos;
    document.getElementById('modalSubtotal').innerText = totalFinal.toFixed(2);
}

// CARRINHO DE COMPRAS
function confirmarAdicaoCarrinho() {
    const id = document.getElementById('modalProdId').value;
    const p = bdProdutos.find(x => x.id === id);
    const regraProduto = document.getElementById('modalProdRegra').value;
    const qtd = parseInt(document.getElementById('w2pQtd')?.value) || 1;
    const subtotal = parseFloat(document.getElementById('modalSubtotal').innerText);

    let infoDetalhes = `${qtd}x Unidades. `;
    if(regraProduto === 'm2') {
        const l = document.getElementById('w2pLargura').value;
        const a = document.getElementById('w2pAltura').value;
        infoDetalhes = `${qtd}x Unidades de ${l}x${a}m. `;
    }

    const checks = document.querySelectorAll('.w2p-check-acab:checked');
    if(checks.length > 0) {
        let nomesExtras = Array.from(checks).map(c => c.value);
        infoDetalhes += `<br><b>Extras:</b> ${nomesExtras.join(', ')}`;
    }

    carrinho.push({
        idProduto: p.id,
        nome: p.nome,
        detalhes: infoDetalhes,
        valorFinal: subtotal
    });

    fecharModal();
    renderCarrinho();
}

function renderCarrinho() {
    const div = document.getElementById('listaCarrinho');
    let total = 0;

    if(carrinho.length === 0) {
        div.innerHTML = '<small style="color:#A0AEC0;">O carrinho está vazio.</small>';
        document.getElementById('totalCarrinho').innerText = "0.00";
        return;
    }

    div.innerHTML = carrinho.map((item, index) => {
        total += item.valorFinal;
        return `
        <div class="carrinho-item">
            <div style="flex:1;">
                <strong style="color:var(--cor-principal); display:block; font-size:14px;">${item.nome}</strong>
                <small style="color:#718096; line-height:1.4;">${item.detalhes}</small>
            </div>
            <div style="text-align:right;">
                <b style="color:#2D3748; display:block; font-size:14px; margin-bottom:5px;">R$ ${item.valorFinal.toFixed(2)}</b>
                <button class="btn-remover-item" onclick="removerDoCarrinho(${index})"><i class="fa fa-trash"></i> Remover</button>
            </div>
        </div>
    `}).join('');

    document.getElementById('totalCarrinho').innerText = total.toFixed(2);
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    renderCarrinho();
}

function enviarPedido() {
    const nome = document.getElementById('nomeClienteCarrinho').value;
    if(carrinho.length === 0) return alert("O carrinho está vazio!");
    if(!nome) return alert("Por favor, preencha o nome do cliente.");

    const total = parseFloat(document.getElementById('totalCarrinho').innerText);
    
    // Isso vai para o BD na Fase 4, por enquanto só esvazia e dá sucesso
    alert(`Pedido de R$ ${total.toFixed(2)} gerado com sucesso para ${nome}!`);
    carrinho = [];
    document.getElementById('nomeClienteCarrinho').value = "";
    document.getElementById('telClienteCarrinho').value = "";
    renderCarrinho();
}

// ==========================================
// FASE 2: CADASTROS (FUNÇÕES MANTIDAS INTACTAS DA ETAPA ANTERIOR)
// ==========================================
function ajustarCamposProduto() {
    const tipo = document.getElementById('prodTipo').value;
    const regraPreco = document.getElementById('prodRegraPreco').value;
    const divCor = document.getElementById('grp-cor');
    const divTamanho = document.getElementById('grp-tamanho');
    const boxMedidas = document.getElementById('boxMedidas');
    const labelPreco = document.getElementById('labelPreco');

    if (tipo === 'visual') {
        if(divCor) divCor.style.display = 'none';
        if(divTamanho) divTamanho.style.display = 'none';
    } else {
        if(divCor) divCor.style.display = 'block';
        if(divTamanho) divTamanho.style.display = 'block';
    }
    if (regraPreco === 'm2') {
        if(boxMedidas) boxMedidas.style.display = 'grid'; 
        if(labelPreco) labelPreco.innerText = "Preço por m² (R$)";
    } else {
        if(boxMedidas) boxMedidas.style.display = 'none';
        if(labelPreco) labelPreco.innerText = "Preço Unitário (R$)";
    }
}
document.addEventListener('DOMContentLoaded', ajustarCamposProduto);

async function salvarCategoria() {
    try {
        const id = document.getElementById('catId').value;
        const nome = document.getElementById('catNome').value;
        if (!nome) return alert("Digite o nome da categoria!");
        if (id) await db.collection("categorias").doc(id).update({nome});
        else await db.collection("categorias").add({nome});
        document.getElementById('catId').value = ""; document.getElementById('catNome').value = "";
    } catch (e) { alert("Erro de permissão no Firebase."); }
}

function renderCat() {
    document.getElementById('listaCategorias').innerHTML = bdCategorias.map(c => `<tr><td>${c.nome}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editCat('${c.id}','${c.nome}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('categorias', '${c.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join('');
    const selects = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join('');
    document.getElementById('prodCategoria').innerHTML = selects;
    document.getElementById('acabCategoria').innerHTML = `<option value="Geral (Aparece em todos)">Geral (Aparece em todos)</option>` + selects;
    atualizarListaAcabamentosProduto(); 
}
function editCat(id, n) { document.getElementById('catId').value = id; document.getElementById('catNome').value = n; }

function atualizarListaAcabamentosProduto(selecionadosSalvos = []) {
    const catSelect = document.getElementById('prodCategoria');
    const container = document.getElementById('listaCheckAcabamentos');
    if (!catSelect || !container) return;
    const categoriaSelecionada = catSelect.value;
    if (bdAcabamentos.length === 0) {
        container.innerHTML = '<small style="color:#718096;">Nenhum acabamento encontrado no banco de dados...</small>';
        return;
    }
    const acabamentosFiltrados = bdAcabamentos.filter(a => {
        const cat = a.categoria || ""; 
        return cat === categoriaSelecionada || cat.includes("Geral");
    });
    if(acabamentosFiltrados.length === 0) {
        container.innerHTML = '<small style="color:#718096;">Nenhum acabamento para esta categoria.</small>';
        return;
    }
    const salvos = Array.isArray(selecionadosSalvos) ? selecionadosSalvos : [];
    container.innerHTML = acabamentosFiltrados.map(a => {
        const estaMarcado = salvos.includes(a.id) ? 'checked' : '';
        return `<label><input type="checkbox" class="check-acab-prod" value="${a.id}" ${estaMarcado}> ${a.nome} <small style="color:#A0AEC0; margin-left:5px;">(${a.grupo || 'Solto'})</small></label>`;
    }).join('');
}

async function salvarProduto() {
    try {
        const id = document.getElementById('prodId').value;
        const checkboxes = document.querySelectorAll('.check-acab-prod:checked');
        const acabamentosPermitidos = Array.from(checkboxes).map(c => c.value);
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
            acabamentos: acabamentosPermitidos 
        };
        if (!dados.nome) return alert("Nome do produto é obrigatório!");
        if (id) await db.collection("produtos").doc(id).update(dados);
        else await db.collection("produtos").add(dados);
        limparFormProduto(); alert("Produto salvo com sucesso!");
    } catch (e) { alert("Erro de permissão no Firebase."); }
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

async function salvarAcabamento() {
    try {
        const id = document.getElementById('acabId').value;
        const dados = {
            nome: document.getElementById('acabNome').value,
            grupo: document.getElementById('acabGrupo').value,
            categoria: document.getElementById('acabCategoria').value,
            regra: document.getElementById('acabRegra').value,
            venda: parseFloat(document.getElementById('acabPrecoVenda').value) || 0,
            custo: parseFloat(document.getElementById('acabCusto').value) || 0
        };
        if (!dados.nome) return alert("O nome do acabamento é obrigatório!");
        if (id) await db.collection("acabamentos").doc(id).update(dados);
        else await db.collection("acabamentos").add(dados);
        limparFormAcabamento();
    } catch (e) { alert("Erro de permissão."); }
}

function renderAcab() {
    document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `<tr><td><b>${a.nome}</b><br><small style="color:#718096">${a.grupo || 'Solto'}</small></td><td style="color:#2F855A; font-weight:bold;">R$ ${a.venda.toFixed(2)}</td><td style="text-align:right;"><button class="btn-acao-edit" onclick="editAcab('${a.id}')"><i class="fa fa-pen"></i></button> <button class="btn-acao-del" onclick="deletarDoc('acabamentos', '${a.id}')"><i class="fa fa-trash"></i></button></td></tr>`).join('');
}

function editAcab(id) {
    const a = bdAcabamentos.find(x => x.id === id);
    document.getElementById('acabId').value = a.id; document.getElementById('acabNome').value = a.nome;
    document.getElementById('acabGrupo').value = a.grupo || ''; document.getElementById('acabCategoria').value = a.categoria;
    document.getElementById('acabRegra').value = a.regra; document.getElementById('acabPrecoVenda').value = a.venda;
    document.getElementById('acabCusto').value = a.custo; window.scrollTo(0,0);
}

function limparFormAcabamento() { 
    document.getElementById('acabId').value = ""; document.getElementById('acabNome').value = ""; 
    document.getElementById('acabGrupo').value = ""; document.getElementById('acabPrecoVenda').value = "0.00";
    document.getElementById('acabCusto').value = "0.00";
}

function deletarDoc(colecao, id) {
    if (confirm("Apagar este item para sempre?")) db.collection(colecao).doc(id).delete();
}
