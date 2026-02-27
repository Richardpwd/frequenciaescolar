// Carregar salas e alunos para frequência
async function carregarSalas() {
    const res = await fetch('/api/salas');
    const salas = await res.json();
    let html = '';
    salas.forEach(sala => {
        html += `<button class="sala-btn" onclick="carregarAlunos(${sala.id}, '${sala.nome}')">${sala.nome}</button> `;
    });
    document.getElementById('salas-list').innerHTML = html;
}

async function carregarAlunos(sala_id, sala_nome) {
    const res = await fetch(`/api/frequencia/${sala_id}`);
    const alunos = await res.json();
    let html = `<h3>${sala_nome}</h3><table><tr><th>Aluno</th><th>Status</th><th>Marcar</th></tr>`;
    alunos.forEach(aluno => {
        html += `<tr><td>${aluno.nome}</td><td>${aluno.status || '-'}</td><td>
            <button onclick="marcarFrequencia(${aluno.id}, 'Presente')">Presente</button>
            <button onclick="marcarFrequencia(${aluno.id}, 'Falta')">Falta</button>
        </td></tr>`;
    });
    html += '</table>';
    document.getElementById('sala-alunos').innerHTML = html;
}

async function marcarFrequencia(aluno_id, status) {
    const data = new Date().toISOString().slice(0,10);
    await fetch('/api/frequencia/marcar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aluno_id, status, data })
    });
    // Atualiza lista após marcar
    document.getElementById('sala-alunos').innerHTML = '<span>Atualizando...</span>';
    setTimeout(carregarSalas, 500);
}

window.carregarAlunos = carregarAlunos;
window.marcarFrequencia = marcarFrequencia;
carregarSalas();
