// Carregamento dinâmico das abas
const main = document.getElementById('main-content');

function loadView(view) {
    fetch(`../assets/views/${view}.html`)
        .then(r => {
            if (!r.ok) {
                main.innerHTML = '<p>Erro ao carregar a página. Verifique se o arquivo existe.</p>';
                return '';
            }
            return r.text();
        })
        .then(html => {
            if (html) {
                main.innerHTML = html;
                // Carrega o JS correspondente
                let script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = `../assets/${view}.js`;
                script.onload = () => {};
                main.appendChild(script);
            }
        });
}

document.getElementById('menu-frequencia').onclick = function() { loadView('frequencia'); };
document.getElementById('menu-alunos').onclick = function() { loadView('alunos'); };
document.getElementById('menu-calendario').onclick = function() { loadView('calendario'); };
document.getElementById('menu-usuarios').onclick = function() { loadView('usuarios'); };

// Carregar Frequência por padrão
loadView('frequencia');
