// Carregar usuários
async function carregarUsuarios() {
    const res = await fetch('/api/users/list');
    const usuarios = await res.json();
    let html = '';
    usuarios.forEach(u => {
        html += `<tr><td>${u.nome}</td><td>${u.usuario}</td><td>${u.funcao}</td><td><button onclick="excluirUsuario(${u.id})">Excluir</button></td></tr>`;
    });
    document.querySelector('#usuarios-table tbody').innerHTML = html;
}
window.excluirUsuario = async function(id) {
    if (confirm('Excluir usuário?')) {
        await fetch(`/api/users/${id}`, { method: 'DELETE' });
        carregarUsuarios();
    }
};
carregarUsuarios();
