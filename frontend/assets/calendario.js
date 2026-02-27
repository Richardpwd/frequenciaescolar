// Calendário simples
const calendarDiv = document.getElementById('calendar');
const hoje = new Date();
const ano = hoje.getFullYear();
const mes = hoje.getMonth();

function renderCalendar() {
    let html = '<table><tr>';
    const diasSemana = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    diasSemana.forEach(d => html += `<th>${d}</th>`);
    html += '</tr><tr>';
    const primeiroDia = new Date(ano, mes, 1).getDay();
    for (let i = 0; i < primeiroDia; i++) html += '<td></td>';
    const diasNoMes = new Date(ano, mes+1, 0).getDate();
    for (let d = 1; d <= diasNoMes; d++) {
        html += `<td>${d}</td>`;
        if ((d + primeiroDia) % 7 === 0) html += '</tr><tr>';
    }
    html += '</tr></table>';
    calendarDiv.innerHTML = html;
}
renderCalendar();

document.getElementById('btnAddRecesso').onclick = function() { alert('Função adicionar recesso em desenvolvimento'); };
document.getElementById('btnAddFeriado').onclick = function() { alert('Função adicionar feriado em desenvolvimento'); };
