// ... Configurações Firebase ...

// --- SALVAR PRODUTO (REVISADO) ---
async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    
    // Coletar Atributos/Variações
    let atributos = [];
    document.querySelectorAll('.item-atrib').forEach(caixa => {
        let ops = [];
        caixa.querySelectorAll('.item-opcao').forEach(l => {
            const n = l.querySelector('.op-nome').value;
            const p = parseFloat(l.querySelector('.op-preco').value) || 0;
            if(n) ops.push({ nome: n, preco: p });
        });
        const nomeAtrib = caixa.querySelector('.atrib-nome').value;
        if(nomeAtrib) atributos.push({ nome: nomeAtrib, opcoes: ops });
    });

    // Coletar Acabamentos
    let acabList = [];
    document.querySelectorAll('.check-acab-prod:checked').forEach(chk => {
        const star = chk.closest('div').querySelector('.star-padrao');
        acabList.push({ id: chk.value, padrao: star.classList.contains('text-amber-400') });
    });

    // Coletar Pacotes
    let pacotes = [];
    document.querySelectorAll('#listaGradePacotes > div').forEach(d => {
        const q = parseInt(d.querySelector('.q').value);
        const p = parseFloat(d.querySelector('.p').value);
        if(q && p) pacotes.push({ qtd: q, preco: p });
    });

    // Coletar Progressivo
    let progressivo = [];
    document.querySelectorAll('#listaGradeProgressivo > div').forEach(d => {
        const q = parseInt(d.querySelector('.q').value);
        const p = parseFloat(d.querySelector('.p').value);
        if(q && p) progressivo.push({ q: q, p: p });
    });

    const d = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        regraPreco: document.getElementById('prodRegraPreco').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        foto: document.getElementById('prodFoto').value || '',
        larguraBobina: parseFloat(document.getElementById('prodLargBobina').value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 0,
        compMax: parseFloat(document.getElementById('prodCompMax').value) || 0,
        atributos: atributos,
        acabamentos: acabList,
        pacotes: pacotes,
        progressivo: progressivo
    };

    if(!d.nome) return alert("Nome do produto é obrigatório!");

    try {
        if(id) await db.collection("produtos").doc(id).update(d);
        else await db.collection("produtos").add(d);
        alert("Produto salvo com sucesso!");
        location.reload();
    } catch (err) {
        console.error(err);
        alert("Erro ao salvar produto.");
    }
}

// --- CALCULO COM TRAVA DE BOBINA ---
function calcularPrecoAoVivo() {
    const idProd = document.getElementById('modalProdId').value;
    const p = bdProdutos.find(x => x.id === idProd);
    const regra = document.getElementById('modalProdRegra').value;
    const base = parseFloat(document.getElementById('modalProdPrecoBase').value) || 0;
    
    let extraVar = 0;
    document.querySelectorAll('.sel-var').forEach(s => extraVar += parseFloat(s.value));

    let qtd = 1; let totalBase = 0; let m2 = 1;

    if(regra === 'm2') {
        const l = parseFloat(document.getElementById('w2pLargura').value) || 0;
        const a = parseFloat(document.getElementById('w2pAltura').value) || 0;
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
        
        // Lógica da Bobina: O menor lado deve caber na bobina
        const menorLado = Math.min(l, a);
        const aviso = document.getElementById('avisoBobina');
        if(p.larguraBobina > 0 && menorLado > p.larguraBobina) {
            aviso.classList.remove('hidden');
            aviso.querySelector('span').innerText = `Atenção: O menor lado (${menorLado.toFixed(2)}m) excede a bobina (${p.larguraBobina.toFixed(2)}m). O material terá emenda.`;
        } else {
            aviso.classList.add('hidden');
        }

        m2 = l * a;
        totalBase = (base + extraVar) * m2 * qtd;
    } else if(regra === 'pacote') {
        const sel = document.getElementById('w2pPacote');
        qtd = parseInt(sel.value) || 1;
        totalBase = (parseFloat(sel.options[sel.selectedIndex]?.dataset.preco) || 0) + (extraVar * qtd);
    } else if(regra === 'progressivo') {
        qtd = parseInt(document.getElementById('w2pQtd').value) || 1;
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

    // Acabamentos
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

// ... (Restante das funções de PDV, Carrinho e Edição permanecem as mesmas) ...
