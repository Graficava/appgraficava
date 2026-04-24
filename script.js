async function salvarProduto() {
    const id = document.getElementById('prodId').value;
    let atributos =[];
    document.querySelectorAll('.item-atrib').forEach(caixa => {
        let ops =[];
        caixa.querySelectorAll('.item-opcao').forEach(l => {
            const n = l.querySelector('.op-nome').value;
            const p = parseFloat(l.querySelector('.op-preco').value) || 0;
            if (n) ops.push({ nome: n, preco: p });
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
        // Mudamos para aceitar texto (ex: "100 Cartões")
        const q = d.querySelector('.q').value; 
        const p = parseFloat(d.querySelector('.p').value);
        if (q && p) pacotes.push({ qtd: q, preco: p });
    });

    let progressivo =[];
    document.querySelectorAll('#listaGradeProgressivo > div').forEach(d => {
        const q = parseInt(d.querySelector('.q').value); const p = parseFloat(d.querySelector('.p').value);
        if (q && p) progressivo.push({ q: q, p: p });
    });

    const d = {
        nome: document.getElementById('prodNome').value,
        categoria: document.getElementById('prodCategoria').value,
        regraPreco: document.getElementById('prodRegraPreco').value,
        preco: parseFloat(document.getElementById('prodPreco').value) || 0,
        foto: document.getElementById('prodFoto').value || '',
        ref: document.getElementById('prodRef').value || '',
        material: document.getElementById('prodMaterial').value || '',
        gramatura: document.getElementById('prodGramatura').value || '',
        prazo: parseInt(document.getElementById('prodPrazo').value) || 0,
        larguraBobina: parseFloat(document.getElementById('prodLargBobina').value) || 0,
        larguraMax: parseFloat(document.getElementById('prodLargMax').value) || 0,
        compMax: parseFloat(document.getElementById('prodCompMax').value) || 0,
        obs: document.getElementById('prodObs').value || '',
        atributos: atributos,
        acabamentos: acabList,
        pacotes: pacotes,
        progressivo: progressivo
    };

    if (!d.nome) return alert("Nome obrigatório!");
    
    try {
        if (id) await db.collection("produtos").doc(id).update(d); 
        else await db.collection("produtos").add(d);
        
        alert("Produto salvo com sucesso!");
        // Limpa o formulário e volta pra aba de lista de produtos sem recarregar a página
        document.getElementById('prodId').value = '';
        mudarSubAba('sub-prod', document.querySelectorAll('.sub-aba-btn')[1]);
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Erro ao salvar produto.");
    }
}
