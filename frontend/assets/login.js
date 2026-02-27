document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const usuario = this.usuario.value;
    const senha = this.senha.value;
    const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha })
    });
    const data = await res.json();
    if (data.success) {
        window.location.href = '/views/dashboard.html';
    } else {
        document.getElementById('loginMsg').innerText = data.error || 'Erro ao fazer login';
    }
});

document.getElementById('forgot').onclick = function(e) {
    e.preventDefault();
    const usuario = prompt('Digite seu usuário para recuperar a senha:');
    if (usuario) {
        fetch('/api/users/forgot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario })
        }).then(r => r.json()).then(data => {
            alert(data.message);
        });
    }
};

document.getElementById('register').onclick = function(e) {
    e.preventDefault();
    window.location.href = '/views/register.html';
};
