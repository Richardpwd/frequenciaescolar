// Carregar alunos e calcular frequência
async function carregarAlunos() {
    const res = await fetch('/api/alunos');
    const alunos = await res.json();
    let html = '';
    for (const aluno of alunos) {
        const freq = await calcularFrequencia(aluno.id);
        html += `<tr><td>${aluno.nome}</td><td>${aluno.sala_nome || '-'}</td><td>${freq}%</td><td>
            <button onclick="editarAluno(${aluno.id})">Editar</button>
            <button onclick="excluirAluno(${aluno.id})">Excluir</button>
        </td></tr>`;
    }
    document.querySelector('#alunos-table tbody').innerHTML = html;
}

async function calcularFrequencia(aluno_id) {
    // Busca frequência do mês
    const res = await fetch(`/api/frequencia/${aluno_id}`);
    const freq = await res.json();
    // Simulação: retorna 100% (implementar cálculo real depois)
    return 100;
}

window.editarAluno = function(id) { alert('Função editar aluno em desenvolvimento'); };
window.excluirAluno = async function(id) {
    if (confirm('Excluir aluno?')) {
        await fetch(`/api/alunos/${id}`, { method: 'DELETE', credentials: 'include' });
        carregarAlunos();
    }
};
carregarAlunos();

// Cadastro de aluno
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('btnNovoAluno');
    if (btn) {
        btn.onclick = function() {
            const nome = prompt('Nome do aluno:');
            if (!nome) return;
            const sala_id = prompt('ID da sala:');
            if (!sala_id) return;
            fetch('/api/alunos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nome, sala_id })
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    alert('Aluno cadastrado com sucesso!');
                    carregarAlunos();
                } else {
                    alert(data.error || 'Erro ao cadastrar aluno');
                }
            });
        };
    }
});
