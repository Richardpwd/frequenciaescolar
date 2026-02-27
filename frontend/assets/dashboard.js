// Carregamento dinâmico das abas
const main = document.getElementById('main-content');

function loadView(view) {
    fetch(`../assets/views/${view}.html`)
        .then(r => r.text())
        .then(html => { main.innerHTML = html; });
}

document.getElementById('menu-frequencia').onclick = function() { loadView('frequencia'); };
document.getElementById('menu-alunos').onclick = function() { loadView('alunos'); };
document.getElementById('menu-calendario').onclick = function() { loadView('calendario'); };
document.getElementById('menu-usuarios').onclick = function() { loadView('usuarios'); };

// Carregar Frequência por padrão
loadView('frequencia');
