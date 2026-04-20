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

// INICIALIZAÇÃO
auth.onAuthStateChanged(user => {
    if (user) { document.getElementById('telaLogin').style.display = 'none'; document.getElementById('appInterface').style.display = 'flex'; iniciarLeitura(); } 
    else { document.getElementById('telaLogin').style.display = 'flex'; document.getElementById('appInterface').style.display = 'none'; }
});

function iniciarLeitura() {
    db.collection("categorias").onSnapshot(s => { bdCategorias = s.docs.map(d => ({id: d.id, ...d.data()})); renderCat(); renderFiltrosVitrine(); });
    db.collection("produtos").onSnapshot(s => { bdProdutos = s.docs.map(d => ({id: d.id, ...d.data()})); renderProd(); renderVitrine(); });
    db.collection("acabamentos").onSnapshot(s => { bdAcabamentos = s.docs.map(d => ({id: d.id, ...d.data()})); renderAcab(); atualizarListaAcabamentosProduto(); });
    db.collection("clientes").orderBy("nome").onSnapshot(s => { bdClientes = s.docs.map(d => ({id: d.id, ...d.data()})); renderCli(); });
}

// ABA LOJA
function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos');
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    grid.innerHTML = prods.map(p => {
        const foto = p.foto ? `background-image:url('${p.foto}')` : '';
        return `<div class="produto-card" onclick="abrirConfigurador('${p.id}')">
            <div class="img-vitrine" style="${foto}"></div>
            <h4>${p.nome}</h4>
            <p>R$ ${(p.preco || 0).toFixed(2)}</p>
        </div>`
    }).join('');
}

function abrirConfigurador(idProduto) {
    const p = bdProdutos.find(x => x.id === idProduto);
    const headerImg = document.getElementById('modalHeaderImg');
    headerImg.style.backgroundImage = p.foto ? `url('${p.foto}')` : 'none';
    
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
        divMedidas.innerHTML = `<div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" oninput="calcularPrecoAoVivo()"></div>`;
    }

    const divAcab = document.getElementById('modalCorpoAcabamentos');
    const permitidos = p.acabamentos || [];
    let htmlAcab = "";
    
    // Agrupar acabamentos por grupo
    let grupos = {};
    permitidos.forEach(obj => {
        const a = bdAcabamentos.find(x => x.id === (obj.id || obj));
        if(a) {
            const grp = a.grupo || "Extras";
            if(!grupos[grp]) grupos[grp] = [];
            grupos[grp].push({...a, isPadrao: obj.padrao || false});
        }
    });

    for(let grpNome in grupos) {
        htmlAcab += `<div style="grid-column: 1/-1; margin-top: 15px; font-weight:800; color:#A0AEC0; font-size:11px; text-transform:uppercase;">${grpNome}</div>`;
        grupos[grpNome].forEach(a => {
            const sel = a.isPadrao ? 'selecionado' : '';
            const icon = a.isPadrao ? 'fa-check' : (a.grupo ? 'fa-circle-thin' : 'fa-square-o');
            htmlAcab += `
                <div class="btn-acab-escolha ${sel}" data-id="${a.id}" data-grupo="${a.grupo || ''}" data-regra="${a.regra}" data-preco="${a.venda}" onclick="toggleAcabamento(this)">
                    <div class="check-icon"><i class="fa ${icon}"></i></div>
                    <b>${a.nome}</b>
                    <span>+ R$ ${a.venda.toFixed(2)}</span>
                </div>`;
        });
    }
    divAcab.innerHTML = htmlAcab;

    document.getElementById('modalW2P').style.display = 'flex';
    calcularPrecoAoVivo();
}

function toggleAcabamento(el) {
    const grupo = el.dataset.grupo;
    if(grupo && grupo !== "") {
        // Se tem grupo, desmarca os outros do mesmo grupo
        document.querySelectorAll(`.btn-acab-escolha[data-grupo="${grupo}"]`).forEach(b => {
            b.classList.remove('selecionado');
            b.querySelector('i').className = 'fa fa-circle-thin';
        });
        el.classList.add('selecionado');
        el.querySelector('i').className = 'fa fa-check';
    } else {
        // Se não tem grupo, funciona como checkbox normal
        el.classList.toggle('selecionado');
        const icon = el.querySelector('i');
        icon.className = el.classList.contains('selecionado') ? 'fa fa-check' : 'fa fa-square-o';
    }
    calcularPrecoAoVivo();
}

function calcularPrecoAoVivo() {
    const regra = document.getElementById('modalProdRegra').value;
    const base = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    let qtd = 1; let totalBase = 0; let m2 = 0;

    if(regra === 'm2') {
        const l = parseFloat(document.getElementById('w2pLargura').value) || 0;
        const a = parseFloat(document.getElementById('w2pAltura').value) || 0;
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        m2 = l * a; totalBase = (base * m2) * qtd;
    } else if(regra === 'pacote') {
        const sel = document.getElementById('w2pPacote');
        qtd = parseInt(sel.value) || 1;
        totalBase = parseFloat(sel.options[sel.selectedIndex].dataset.preco) || 0;
    } else {
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        totalBase = base * qtd;
    }

    let totalAcab = 0;
    document.querySelectorAll('.btn-acab-escolha.selecionado').forEach(b => {
        const p = parseFloat(b.dataset.preco) || 0;
        const r = b.dataset.regra;
        if(r === 'm2') totalAcab += (p * (m2 || 1)) * qtd;
        else if(r === 'lote') totalAcab += p;
        else totalAcab += p * qtd;
    });

    document.getElementById('modalSubtotal').innerText = "R$ " + (totalBase + totalAcab).toFixed(2);
}

function confirmarAdicaoCarrinho() {
    const p = bdProdutos.find(x => x.id === document.getElementById('modalProdId').value);
    const total = parseFloat(document.getElementById('modalSubtotal').innerText.replace("R$ ",""));
    
    let detalhes = [];
    document.querySelectorAll('.btn-acab-escolha.selecionado').forEach(b => detalhes.push(b.querySelector('b').innerText));
    
    carrinho.push({ nome: p.nome, valor: total, detalhes: detalhes.join(", ") });
    fecharModal(); renderCarrinho();
}

function renderCarrinho() {
    const div = document.getElementById('listaCarrinho');
    let sub = 0;
    div.innerHTML = carrinho.map((c, i) => {
        sub += c.valor;
        return `<div class="carrinho-item">
            <div><b>${c.nome}</b><br><small>${c.detalhes}</small></div>
            <div style="text-align:right;">R$ ${c.valor.toFixed(2)}<br><button onclick="carrinho.splice(${i},1);renderCarrinho()">remover</button></div>
        </div>`;
    }).join("");
    document.getElementById('totalCarrinho').dataset.subtotal = sub;
    atualizarTotalComFrete();
}

function atualizarTotalComFrete() {
    const sub = parseFloat(document.getElementById('totalCarrinho').dataset.subtotal) || 0;
    const frete = parseFloat(document.getElementById('cartFreteValor').value) || 0;
    document.getElementById('totalCarrinho').innerText = "R$ " + (sub + frete).toFixed(2);
}

// CADASTROS
async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    let acabList = [];
    document.querySelectorAll('.setup-linha-acab').forEach(div => {
        const chk = div.querySelector('.check-acab-prod');
        const star = div.querySelector('.star-padrao');
        if(chk.checked) acabList.push({ id: chk.value, padrao: star.classList.contains('ativo') });
    });

    const regra = document.getElementById('prodRegraPreco').value;
    let pacotes = [];
    if(regra === 'pacote') {
        document.querySelectorAll('.linha-pacote-item').forEach(l => {
            pacotes.push({ qtd: parseInt(l.querySelector('.q').value), preco: parseFloat(l.querySelector('.p').value) });
        });
    }

    const dados = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        tipo: document.getElementById('prodTipo').value,
        foto: document.getElementById('prodFoto').value,
        material: document.getElementById('prodMaterial').value,
        tamanho: document.getElementById('prodTamanho').value,
        regraPreco: regra,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 0,
        compMax: parseFloat(document.getElementById('prodCompMax').value) || 0,
        acabamentos: acabList,
        pacotes: pacotes
    };

    if(id) await db.collection("produtos").doc(id).update(dados);
    else await db.collection("produtos").add(dados);
    alert("Produto Salvo!");
}

function atualizarListaAcabamentosProduto(salvos = []) {
    const container = document.getElementById('listaCheckAcabamentos');
    const cat = document.getElementById('prodCategoria').value;
    const filtrados = bdAcabamentos.filter(a => a.categoria === cat || a.categoria.includes("Geral"));
    
    container.innerHTML = filtrados.map(a => {
        const obj = salvos.find(s => (s.id || s) === a.id);
        const checked = obj ? 'checked' : '';
        const starAtiva = (obj && obj.padrao) ? 'ativo' : '';
        return `<div class="setup-linha-acab">
            <label><input type="checkbox" class="check-acab-prod" value="${a.id}" ${checked}> ${a.nome}</label>
            <i class="fa fa-star star-padrao ${starAtiva}" onclick="this.classList.toggle('ativo')"></i>
        </div>`;
    }).join('');
}

// RESTANTE DAS FUNÇÕES (IGUAIS)
function mudarAba(a) { document.querySelectorAll('.aba').forEach(x => x.classList.remove('ativa')); document.getElementById('aba-'+a).classList.add('ativa'); }
function mudarSubAba(s) { document.querySelectorAll('.sub-aba').forEach(x => x.classList.remove('sub-ativa')); document.getElementById(s).classList.add('sub-ativa'); }
function addLinhaPacote(q='', p='') { 
    const d = document.createElement('div'); d.className = 'form-linha linha-pacote-item';
    d.innerHTML = `<input type="number" class="q" placeholder="Qtd" value="${q}"><input type="number" class="p" placeholder="R$" value="${p}"><button onclick="this.parentElement.remove()">x</button>`;
    document.getElementById('listaGradePacotes').appendChild(d);
}
function fecharModal() { document.getElementById('modalW2P').style.display = 'none'; }
function ajustarCamposProduto() {
    const r = document.getElementById('prodRegraPreco').value;
    document.getElementById('boxPrecoBase').style.display = r === 'pacote' ? 'none' : 'block';
    document.getElementById('boxPacotes').style.display = r === 'pacote' ? 'block' : 'none';
    document.getElementById('boxMedidas').style.display = r === 'm2' ? 'grid' : 'none';
}
function toggleOpcoesPagamento() { document.getElementById('divParcelas').style.display = document.getElementById('cartPagamento').value === 'Credito_Parcelado' ? 'block' : 'none'; }
function toggleOpcoesEntrega() { document.getElementById('divFrete').style.display = document.getElementById('cartEntrega').value === 'Motoboy' ? 'block' : 'none'; atualizarTotalComFrete(); }
function entrar() { auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('senha').value); }
function sair() { auth.signOut(); }
function salvarCategoria() { const n = document.getElementById('catNome').value; db.collection("categorias").add({nome: n}); }
function renderCat() { document.getElementById('listaCategorias').innerHTML = bdCategorias.map(c => `<tr><td>${c.nome}</td><td><button onclick="db.collection('categorias').doc('${c.id}').delete()">x</button></td></tr>`).join(''); document.getElementById('prodCategoria').innerHTML = bdCategorias.map(c => `<option value="${c.nome}">${c.nome}</option>`).join(''); document.getElementById('acabCategoria').innerHTML = document.getElementById('prodCategoria').innerHTML; }
async function salvarCliente() { const d = { nome: document.getElementById('cliNome').value, documento: document.getElementById('cliDoc').value, telefone: document.getElementById('cliTel').value, endereco: document.getElementById('cliEnd').value }; db.collection("clientes").add(d); }
function renderCli() { document.getElementById('listaClientes').innerHTML = bdClientes.map(c => `<tr><td>${c.nome}</td><td>${c.documento}</td><td><button onclick="db.collection('clientes').doc('${c.id}').delete()">x</button></td></tr>`).join(''); document.getElementById('cartCliente').innerHTML = bdClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join(''); }
function renderProd() { document.getElementById('listaProdutos').innerHTML = bdProdutos.map(p => `<tr><td>${p.nome}</td><td>${p.regraPreco}</td><td><button onclick="db.collection('produtos').doc('${p.id}').delete()">x</button></td></tr>`).join(''); }
async function salvarAcabamento() { const d = { nome: document.getElementById('acabNome').value, grupo: document.getElementById('acabGrupo').value, categoria: document.getElementById('acabCategoria').value, regra: document.getElementById('acabRegra').value, venda: parseFloat(document.getElementById('acabPrecoVenda').value), custo: parseFloat(document.getElementById('acabCusto').value) }; db.collection("acabamentos").add(d); }
function renderAcab() { document.getElementById('listaAcabamentos').innerHTML = bdAcabamentos.map(a => `<tr><td>${a.nome} (${a.grupo})</td><td>R$ ${a.venda.toFixed(2)}</td><td><button onclick="db.collection('acabamentos').doc('${a.id}').delete()">x</button></td></tr>`).join(''); }
