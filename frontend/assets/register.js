document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nome = this.nome.value;
    const usuario = this.usuario.value;
    const senha = this.senha.value;
    const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, usuario, senha })
    });
    const data = await res.json();
    if (data.success) {
        document.getElementById('registerMsg').style.color = '#1976d2';
        document.getElementById('registerMsg').innerText = 'Usuário cadastrado! Vá para o login.';
    } else {
        document.getElementById('registerMsg').style.color = '#d32f2f';
        document.getElementById('registerMsg').innerText = data.error || 'Erro ao cadastrar usuário';
    }
});
