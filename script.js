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
function filtrarVitrine(catNome, btn) { document.querySelectorAll('#menuFiltroCat button').forEach(b => b.classList.remove('ativo')); btn.classList.add('ativo'); renderVitrine(catNome); }

function renderVitrine(filtro = 'Todos') {
    const grid = document.getElementById('gradeProdutos'); if(!grid) return;
    let prods = filtro === 'Todos' ? bdProdutos : bdProdutos.filter(p => p.categoria === filtro);
    if(prods.length === 0) { grid.innerHTML = '<p style="color:#718096; grid-column: 1 / -1;">Nenhum produto encontrado.</p>'; return; }

    grid.innerHTML = prods.map(p => {
        const temFoto = p.foto && p.foto.trim() !== '';
        const imgStyle = temFoto ? `background-image: url('${p.foto}');` : '';
        const imgText = temFoto ? '' : 'Sem Imagem';
        let subtitulo = p.regraPreco === 'm2' ? 'A partir de m²' : (p.regraPreco === 'pacote' ? 'Grade Fechada' : 'Preço Unitário');
        let precoVitrine = p.regraPreco === 'pacote' && p.pacotes && p.pacotes.length > 0 ? p.pacotes[0].preco : (p.preco || 0);
        let corFundo = p.tipo === 'grafico' ? 'bg-grafico' : (p.tipo === 'visual' ? 'bg-visual' : 'bg-outros');

        return `<div class="produto-card ${corFundo}" onclick="abrirConfigurador('${p.id}')"><div class="img-vitrine" style="${imgStyle}">${imgText}</div><h4>${p.nome}</h4><small style="color:#718096; font-weight:bold;">${p.categoria}</small><p style="color:var(--cor-sucesso);">R$ ${precoVitrine.toFixed(2)} <br><small style="font-weight:normal; font-size:11px; color:#4A5568;">(${subtitulo})</small></p></div>`
    }).join('');
}

function abrirConfigurador(idProduto) {
    const p = bdProdutos.find(x => x.id === idProduto); if(!p) return;
    
    const headerImg = document.getElementById('modalHeaderImg');
    if(p.foto && p.foto.trim() !== '') { headerImg.style.backgroundImage = `url('${p.foto}')`; headerImg.style.display = 'block'; } 
    else { headerImg.style.display = 'none'; }

    document.getElementById('modalNomeProd').innerText = p.nome;
    document.getElementById('modalProdId').value = p.id;
    document.getElementById('modalProdRegra').value = p.regraPreco;
    document.getElementById('modalProdPrecoBase').value = p.preco;

    const divMedidas = document.getElementById('modalCorpoMedidas');
    const divAcabamentos = document.getElementById('modalCorpoAcabamentos');

    if (p.regraPreco === 'm2') { divMedidas.innerHTML = `<div class="input-group"><label>Largura (m)</label><input type="number" id="w2pLargura" value="1.00" step="0.01" max="${p.larguraMax}" oninput="calcularPrecoAoVivo()"><small style="color:#718096; font-size:11px;">Máx. Bobina: ${p.larguraMax}m</small></div><div class="input-group"><label>Altura (m)</label><input type="number" id="w2pAltura" value="1.00" step="0.01" max="${p.compMax}" oninput="calcularPrecoAoVivo()"></div><div class="input-group"><label>Quantidade</label><input type="number" id="w2pQtd" value="1" min="1" oninput="calcularPrecoAoVivo()"></div>`; } 
    else if (p.regraPreco === 'pacote') { let options = (p.pacotes || []).map(pct => `<option value="${pct.qtd}" data-preco="${pct.preco}">${pct.qtd} un. - R$ ${pct.preco.toFixed(2)}</option>`).join(''); if(!options) options = `<option value="1" data-preco="0">Nenhum pacote cadastrado</option>`; divMedidas.innerHTML = `<div class="input-group"><label>Escolha a Quantidade (Pacote)</label><select id="w2pPacote
