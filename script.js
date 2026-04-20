// 1. SUAS CONFIGURAÇÕES REAIS DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyC4pkjSYpuz4iF0ijF50VxaZ2npsYCi7II",
    authDomain: "app-graficava.firebaseapp.com",
    databaseURL: "https://app-graficava-default-rtdb.firebaseio.com",
    projectId: "app-graficava",
    storageBucket: "app-graficava.firebasestorage.app",
    messagingSenderId: "37941958808",
    appId: "1:37941958808:web:b321e78b2191fd1d83d8ed"
};

// Inicializa o Firebase (Modo Compatível com Navegador)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. VERIFICA SE O USUÁRIO ESTÁ LOGADO
auth.onAuthStateChanged(user => {
    if (user) {
        // Logado: Esconde login, mostra sistema
        document.getElementById('telaLogin').style.display = 'none';
        document.getElementById('appInterface').style.display = 'flex';
    } else {
        // Deslogado: Mostra login, esconde sistema
        document.getElementById('telaLogin').style.display = 'flex';
        document.getElementById('appInterface').style.display = 'none';
    }
});

// 3. FUNÇÃO DE ENTRAR E SAIR
function entrar() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msgErro = document.getElementById('msgErro');

    auth.signInWithEmailAndPassword(email, senha)
        .catch(error => {
            msgErro.style.display = 'block';
            console.error("Erro no login:", error);
        });
}

function sair() {
    auth.signOut();
}

// 4. FUNÇÃO DE NAVEGAÇÃO (MUDAR DE TELA)
function mudarAba(nomeDaAba) {
    // Esconde todas as abas
    document.querySelectorAll('.aba').forEach(aba => {
        aba.classList.remove('ativa');
    });
    // Tira a cor de todos os botões do menu
    document.querySelectorAll('.menu button').forEach(btn => {
        btn.classList.remove('ativo');
    });

    // Mostra a aba clicada e pinta o botão correspondente
    document.getElementById('aba-' + nomeDaAba).classList.add('ativa');
    event.currentTarget.classList.add('ativo');
}