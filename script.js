const firebaseConfig = {
    apiKey: "AIzaSyC4pkjSYpuz4iF0ijF50VxaZ2npsYCi7II",
    authDomain: "app-graficava.firebaseapp.com",
    databaseURL: "https://app-graficava-default-rtdb.firebaseio.com",
    projectId: "app-graficava",
    storageBucket: "app-graficava.firebasestorage.app",
    messagingSenderId: "37941958808",
    appId: "1:37941958808:web:b321e78b2191fd1d83d8ed"
};

// Inicialização segura
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let bdCategorias = [], bdProdutos = [], bdAcabamentos = [], bdClientes = [];
let carrinho = [];

// Gerenciamento de Autenticação
auth.onAuthStateChanged(user => {
    const telaLogin = document.getElementById('telaLogin');
    const appInterface = document.getElementById('appInterface');
    
    if (user) {
        telaLogin.style.display = 'none';
        appInterface.style.display = 'flex';
        iniciarLeitura();
    } else {
        telaLogin.style.display = 'flex';
        appInterface.style.display = 'none';
    }
});

// Função de Entrada com tratamento de erro
async function entrar() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msgErro');
    const btn = document.getElementById('btnEntrar');

    if(!email || !senha) return alert("Preencha todos os campos");

    btn.innerText = "Carregando...";
    msgErro.style.display = 'none';

    try {
        await auth.signInWithEmailAndPassword(email, senha);
    } catch (error) {
        console.error("Erro no login:", error.message);
        msgErro.style.display = 'block';
        btn.innerText = "Entrar";
    }
}

function sair() {
    auth.signOut();
}

// Leitura de Dados
function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()})); renderCat(); renderFiltrosVitrine(); });
    db.collection("produtos").onSnapshot(s => { bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()})); renderProd(); renderVitrine(); });
    db.collection("acabamentos").onSnapshot(s => { bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()})); renderAcab(); atualizarListaAcabamentosProduto(); });
    db.collection("clientes").orderBy("nome").onSnapshot(s => { bdClientes = s.docs.map(d => ({id: d.id, ...d.data()})); renderCli(); });
}

// --- LOGICA DE ATRIBUTOS/VARIACOES (CADASTRO) ---
function addAtributo(nomeAtrib = '', opcoes = []) {
    const div = document.createElement('div');
    div.className = 'caixa-atributo';
    div.innerHTML = `
        <div class="form-linha">
            <input type="text" class="atrib-nome" placeholder="Ex: Papel" value="${nomeAtrib}" style="font-weight:bold;">
            <button class="btn-rem-lista" onclick="this.parentElement.parentElement.remove()">x</button>
        </div>
        <div class="lista-opcoes-atrib"></div>
        <button class="btn-add-lista" onclick="addOpcaoAtrib(this)">+ Add Opção de Valor</button>
    `;
    document.getElementById('listaAtributos').appendChild(div);
    if(opcoes.length > 0) opcoes.forEach(o => addOpcaoAtrib(div.querySelector('.btn-add-lista'), o.nome, o.preco));
    else addOpcaoAtrib(div.querySelector('.btn-add-lista'));
}

function addOpcaoAtrib(btn, nomeOp = '', precoOp = '') {
    const lista = btn.previousElementSibling;
    const div = document.createElement('div');
    div.className = 'linha-opcao-atrib';
    div.innerHTML = `
        <input type="text" class="op-nome" placeholder="Ex: Couché 300g" value="${nomeOp}">
        <input type="number" class="op-preco" placeholder="R$ Extra" step="0.01" value="${precoOp}">
        <button class="btn-rem-lista" onclick="this.parentElement.remove()">x</button>
    `;
    lista.appendChild(div);
}

// --- VITRINE E LOJA ---
function renderFiltrosVitrine() {
    const nav = document.getElementById('menuFiltroCat'); if(!nav) return;
    nav.innerHTML = `<button class="ativo" onclick="filtrarVitrine('Todos', this)">Todos</button>` + bdCategorias.map(c => `<button onclick="filtrarVitrine('${c.nome}', this)">${c.nome}</button>`).join('');
}
function filtrarVitrine(cat, btn) { document.querySelectorAll('#menuFiltroCat button').forEach(b => b.classList.remove('ativo')); btn.classList.add('ativo'); renderVitrine(cat); }

function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos');
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    grid.innerHTML = prods.map(p => {
        const foto = p.foto ? `background-image:url('${p.foto}')` : '';
        return `<div class="produto-card" onclick="abrirConfigurador('${p.id}')">
            <div class="img-vitrine" style="${foto}"></div>
            <h4>${p.nome}</h4><small>${p.categoria}</small>
            <p style="color:var(--cor-sucesso); font-weight:bold; margin-top:5px;">A partir de R$ ${(p.preco || 0).toFixed(2)}</p>
        </div>`
    }).join('');
}

function abrirConfigurador(idProduto) {
    const p = bdProdutos.find(x => x.id === idProduto);
    if(!p) return;
    document.getElementById('modalHeaderImg').style.backgroundImage = p.foto ? `url('${p.foto}')` : 'none';
    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdRegra').value = p.regraPreco;
    document.getElementById('modalProdPrecoBase').value = p.preco;

    const divMedidas = document.getElementById('modalCorpoMedidas');
    if (p.regraPreco === 'm2') {
        divMedidas.innerHTML = `<div class="input-group"><label>Largura (m)</label><input type="number" id="w2pLargura" value="1.00" oninput="calcularPrecoAoVivo()"></div><div class="input-group"><label>Altura (m)</label><input type="number" id="w2pAltura" value="1.00" oninput="calcularPrecoAoVivo()"></div><div class="input-group"><label>Qtd</label><input type="number" id="w2pQtd" value="1" oninput="calcularPrecoAoVivo()"></div>`;
    } else if (p.regraPreco === 'pacote') {
        let opts = (p.pacotes || []).map(pct => `<option value="${pct.qtd}" data-preco="${pct.preco}">${pct.qtd} un - R$ ${pct.preco.toFixed(2)}</option>`).join('');
        divMedidas.innerHTML = `<div class="input-group"><label>Quantidade</label><select id="w2pPacote" onchange="calcularPrecoAoVivo()">${opts}</select></div>`;
    } else {
        divMedidas.innerHTML = `<div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>`;
    }

    const divVariacoes = document.getElementById('modalCorpoVariacoes');
    divVariacoes.innerHTML = "";
    if(p.atributos && p.atributos.length > 0) {
        p.atributos.forEach(atrib => {
            let optionsHtml = atrib.opcoes.map(o => `<option value="${o.preco}">${o.nome} (+ R$ ${o.preco.toFixed(2)})</option>`).join('');
            divVariacoes.innerHTML += `<div class="input-group"><label>${atrib.nome}</label><select class="w2p-atrib-sel" onchange="calcularPrecoAoVivo()">${optionsHtml}</select></div>`;
        });
    }

    const divAcab = document.getElementById('modalCorpoAcabamentos');
    const permitidos = p.acabamentos || [];
    let htmlAcab = ""; let grupos = {};
    permitidos.forEach(obj => {
        const a = bdAcabamentos.find(x => x.id === (obj.id || obj));
        if(a) { const grp = a.grupo || "Extras"; if(!grupos[grp]) grupos[grp] = []; grupos[grp].push({...a, isPadrao: obj.padrao || false}); }
    });
    for(let grpNome in grupos) {
        htmlAcab += `<div style="grid-column: 1/-1; margin-top: 15px; font-weight:800; color:#A0AEC0; font-size:11px; text-transform:uppercase;">${grpNome}</div>`;
        grupos[grpNome].forEach(a => {
            const sel = a.isPadrao ? 'selecionado' : '';
            htmlAcab += `<div class="btn-acab-escolha ${sel}" data-id="${a.id}" data-grupo="${a.grupo || ''}" data-regra="${a.regra}" data-preco="${a.venda}" onclick="toggleAcabamento(this)"><b>${a.nome}</b><br><span>+ R$ ${a.venda.toFixed(2)}</span></div>`;
        });
    }
    divAcab.innerHTML = htmlAcab;
    document.getElementById('modalW2P').style.display = 'flex';
    calcularPrecoAoVivo();
}

function calcularPrecoAoVivo() {
    const idProd = document.getElementById('modalProdId').value;
    const p = bdProdutos.find(x => x.id === idProd);
    const regra = document.getElementById('modalProdRegra').value;
    const baseInput = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    
    let extraAtributos = 0;
    document.querySelectorAll('.w2p-atrib-sel').forEach(sel => { extraAtributos += parseFloat(sel.value) || 0; });

    let qtd = 1; let totalBase = 0; let m2 = 0;
    let unitarioBaseComAtrib = baseInput + extraAtributos;

    if(regra === 'm2') {
        const l = parseFloat(document.getElementById('w2pLargura').value) || 0; const a = parseFloat(document.getElementById('w2pAltura').value) || 0;
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        m2 = l * a; totalBase = (unitarioBaseComAtrib * m2) * qtd;
    } else if(regra === 'pacote') {
        const sel = document.getElementById('w2pPacote');
        qtd = parseInt(sel.value) || 1; 
        totalBase = (parseFloat(sel.options[sel.selectedIndex]?.dataset.preco) || 0) + (extraAtributos * qtd);
    } else {
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1; 
        totalBase = unitarioBaseComAtrib * qtd;
    }

    let totalAcab = 0;
    document.querySelectorAll('.btn-acab-escolha.selecionado').forEach(b => {
        const precoA = parseFloat(b.dataset.preco) || 0; const regA = b.dataset.regra;
        if(regA === 'm2') totalAcab += (precoA * (m2 || 1)) * qtd; else totalAcab += precoA * qtd;
    });

    document.getElementById('modalSubtotal').innerText = "R$ " + (totalBase + totalAcab).toFixed(2);
}

// ... Restante das funções de Carrinho e Cadastro permanecem iguais às anteriores
function mudarAba(a) { document.querySelectorAll('.aba').forEach(x => x.classList.remove('ativa')); document.getElementById('aba-'+a).classList.add('ativa'); }
function mudarSubAba(s) { document.querySelectorAll('.sub-aba').forEach(x => x.classList.remove('sub-ativa')); document.getElementById(s).classList.add('sub-ativa'); }
function fecharModal() { document.getElementById('modalW2P').style.display = 'none'; }
function renderCat() { document.getElementById('listaCategorias').innerHTML = bdCategorias.map(c => `<tr><td>${c.nome}</td><td><button onclick="db.collection('categorias').doc('${c.id}').delete()">x</button></td></tr>`).join(''); document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join(''); document.getElementById('acabCategoria').innerHTML = document.getElementById('prodCategoria').innerHTML; }
function renderProd() { document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `<tr><td>${p.nome}</td><td>${p.regraPreco}</td><td><button onclick="editProd('${p.id}')">Editar</button> <button onclick="db.collection('produtos').doc('${p.id}').delete()">X</button></td></tr>`).join(''); }
function renderAcab() { document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `<tr><td>${a.nome}</td><td>R$ ${a.venda.toFixed(2)}</td><td><button onclick="db.collection('acabamentos').doc('${a.id}').delete()">x</button></td></tr>`).join(''); }
function renderCli() { document.getElementById('listaClientes').innerHTML = bdClientes.map(c => `<tr><td>${c.nome}</td><td>${c.documento}</td><td><button onclick="db.collection('clientes').doc('${c.id}').delete()">x</button></td></tr>`).join(''); document.getElementById('cartCliente').innerHTML = bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join(''); }
function toggleAcabamento(el) { el.classList.toggle('selecionado'); calcularPrecoAoVivo(); }

// ... (Incluir aqui o restante do CRUD de Clientes, Categorias e SalvarProduto se necessário)
