import { get, post } from './api.js';

const usuario = JSON.parse(sessionStorage.getItem('avanceUsuario') || 'null');
const token = sessionStorage.getItem('avanceToken');
if (!usuario || !token) {
  window.location.href = '/login.html';
}

const params = new URLSearchParams(window.location.search);
const salaId = params.get('salaId');
const salaNome = params.get('nome') || 'Sala';

const salaTitulo = document.getElementById('sala-titulo');
const dataAula = document.getElementById('data-aula');
const alunosList = document.getElementById('alunos-list');
const mesPesquisa = document.getElementById('mes-pesquisa');
const mensalSummary = document.getElementById('mensal-summary');
const mensalAlunos = document.getElementById('mensal-alunos');
const salvarBtn = document.getElementById('salvar-btn');
const voltarBtn = document.getElementById('voltar-btn');
const alertBox = document.getElementById('alert-box');

const frequenciaAtual = new Map();
const responsaveisCache = new Map();
mesPesquisa.value = new Date().toISOString().slice(0, 7);

if (!salaId) {
  window.location.href = '/dashboard.html';
}

salaTitulo.textContent = `Controle de Frequencia - ${salaNome}`;
dataAula.valueAsDate = new Date();

function showAlert(message, type = 'error') {
  alertBox.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  alertBox.textContent = message;
}

function formatMonthLabel(monthValue) {
  if (!monthValue) return '';
  try {
    const date = new Date(`${monthValue}-01`);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  } catch {
    return monthValue;
  }
}

function renderMonthlySummary(data) {
  const taxa = data.totais.registros
    ? Math.round((data.totais.presentes / data.totais.registros) * 100)
    : 0;

  mensalSummary.innerHTML = `
    <div class="mensal-summary-grid">
      <div><strong>Relatório de:</strong> ${formatMonthLabel(data.mes)}</div>
      <div><strong>Presenças:</strong> ${data.totais.presentes}</div>
      <div><strong>Faltas:</strong> ${data.totais.faltas}</div>
      <div><strong>Total de registros:</strong> ${data.totais.registros}</div>
      <div><strong>Taxa média:</strong> ${taxa}%</div>
      <div><strong>Sala:</strong> ${salaNome}</div>
    </div>
  `;

  if (!Array.isArray(data.alunos) || data.alunos.length === 0) {
    mensalAlunos.innerHTML = '<div class="mensal-row"><span>Nenhum registro mensal encontrado.</span></div>';
    return;
  }

  const rows = data.alunos.map((item) => `
    <div class="mensal-row">
      <span>${item.aluno_nome}</span>
      <span>${salaNome}</span>
      <span>${item.presentes}</span>
      <span>${item.faltas}</span>
      <span>${item.registros}</span>
    </div>
  `).join('');

  mensalAlunos.innerHTML = `
    <div class="mensal-row heading">
      <span>Aluno</span>
      <span>Sala</span>
      <span>Pres.</span>
      <span>Faltas</span>
      <span>Reg.</span>
    </div>
    ${rows}
  `;
}

async function carregarResumoMensal() {
  if (!mesPesquisa?.value) {
    mensalSummary.innerHTML = '<p>Selecione um mês para ver o relatório mensal.</p>';
    mensalAlunos.innerHTML = '';
    return;
  }

  try {
    const data = await get(`/frequencia/sala/${salaId}/mensal?mes=${mesPesquisa.value}`);
    renderMonthlySummary(data);
  } catch (error) {
    mensalSummary.innerHTML = `<p class="responsavel-status responsavel-status-error">${error.message}</p>`;
    mensalAlunos.innerHTML = '';
  }
}

function setStatusButtonStyle(presenteBtn, faltaBtn, status) {
  presenteBtn.classList.remove('active-presente');
  faltaBtn.classList.remove('active-falta');

  if (status === 'presente') {
    presenteBtn.classList.add('active-presente');
  } else {
    faltaBtn.classList.add('active-falta');
  }
}

function createResponsavelCard(responsavel) {
  const card = document.createElement('article');
  card.className = 'responsavel-card';

  const nome = document.createElement('strong');
  nome.textContent = responsavel.nome;

  const email = document.createElement('span');
  email.textContent = responsavel.email;

  const telefone = document.createElement('span');
  telefone.textContent = responsavel.telefone;

  card.appendChild(nome);
  card.appendChild(email);
  card.appendChild(telefone);

  return card;
}

async function toggleResponsaveis(aluno, details, button) {
  const isOpen = !details.classList.contains('hidden');
  if (isOpen) {
    details.classList.add('hidden');
    button.textContent = 'Ver pais';
    return;
  }

  details.classList.remove('hidden');
  button.textContent = 'Ocultar pais';

  if (responsaveisCache.has(aluno.id)) {
    return;
  }

  details.innerHTML = '<p class="responsavel-status">Carregando responsaveis...</p>';

  try {
    const responsaveis = await get(`/responsaveis/aluno/${aluno.id}`);
    responsaveisCache.set(aluno.id, responsaveis);
    details.innerHTML = '';

    if (responsaveis.length === 0) {
      details.innerHTML = '<p class="responsavel-status">Nenhum responsavel cadastrado para este aluno.</p>';
      return;
    }

    responsaveis.forEach((responsavel) => {
      details.appendChild(createResponsavelCard(responsavel));
    });
  } catch (error) {
    details.innerHTML = `<p class="responsavel-status responsavel-status-error">${error.message}</p>`;
  }
}

function renderAluno(aluno, status = 'presente') {
  frequenciaAtual.set(aluno.id, status);

  const item = document.createElement('div');
  item.className = 'card aluno-item';

  const info = document.createElement('div');
  info.className = 'aluno-info';
  info.innerHTML = `<strong>${aluno.nome}</strong><small>ID: ${aluno.id}</small>`;

  const meta = document.createElement('div');
  meta.className = 'aluno-meta';

  const responsaveisBtn = document.createElement('button');
  responsaveisBtn.className = 'btn-secondary responsaveis-toggle';
  responsaveisBtn.textContent = 'Ver pais';

  const responsaveisDetails = document.createElement('div');
  responsaveisDetails.className = 'responsaveis-details hidden';

  responsaveisBtn.addEventListener('click', async () => {
    responsaveisBtn.disabled = true;
    try {
      await toggleResponsaveis(aluno, responsaveisDetails, responsaveisBtn);
    } finally {
      responsaveisBtn.disabled = false;
    }
  });

  meta.appendChild(responsaveisBtn);
  meta.appendChild(responsaveisDetails);
  info.appendChild(meta);

  const statusGroup = document.createElement('div');
  statusGroup.className = 'status-group';

  const presenteBtn = document.createElement('button');
  presenteBtn.className = 'btn-secondary status-btn';
  presenteBtn.textContent = 'Presente';

  const faltaBtn = document.createElement('button');
  faltaBtn.className = 'btn-danger status-btn';
  faltaBtn.textContent = 'Falta';

  setStatusButtonStyle(presenteBtn, faltaBtn, status);

  presenteBtn.addEventListener('click', () => {
    frequenciaAtual.set(aluno.id, 'presente');
    setStatusButtonStyle(presenteBtn, faltaBtn, 'presente');
  });

  faltaBtn.addEventListener('click', () => {
    frequenciaAtual.set(aluno.id, 'falta');
    setStatusButtonStyle(presenteBtn, faltaBtn, 'falta');
  });

  statusGroup.appendChild(presenteBtn);
  statusGroup.appendChild(faltaBtn);

  item.appendChild(info);
  item.appendChild(statusGroup);

  return item;
}

async function carregarAlunos() {
  try {
    const alunos = await get(`/salas/${salaId}/alunos`);
    const data = dataAula.value;
    let frequencias = [];

    if (data) {
      try {
        const result = await get(`/frequencia/sala/${salaId}/data/${data}`);
        frequencias = Array.isArray(result.registros) ? result.registros : [];
      } catch (error) {
        // Se não existirem registros para a data, seguiremos com defaults.
        frequencias = [];
      }
    }

    const statusPorAluno = new Map(frequencias.map((registro) => [registro.aluno_id, registro.status || 'presente']));

    alunosList.innerHTML = '';

    if (alunos.length === 0) {
      alunosList.innerHTML = '<p>Nenhum aluno encontrado para esta sala.</p>';
      salvarBtn.disabled = true;
      return;
    }

    alunos.forEach((aluno) => {
      const status = statusPorAluno.get(aluno.id) || 'presente';
      alunosList.appendChild(renderAluno(aluno, status));
    });
  } catch (error) {
    showAlert(error.message);
  }
}

salvarBtn.addEventListener('click', async () => {
  const data = dataAula.value;
  if (!data) {
    showAlert('Selecione a data da aula.');
    return;
  }

  const registros = Array.from(frequenciaAtual.entries()).map(([alunoId, status]) => ({
    alunoId,
    status,
  }));

  try {
    const dataResponse = await post('/frequencia', {
      salaId: Number(salaId),
      data,
      registros,
    });
    showAlert(dataResponse.message, 'success');
    await carregarAlunos();
    await carregarResumoMensal();
  } catch (error) {
    showAlert(error.message);
  }
});

dataAula.addEventListener('change', async () => {
  await carregarAlunos();
});

voltarBtn.addEventListener('click', () => {
  window.location.href = '/dashboard.html';
});

mesPesquisa.addEventListener('change', carregarResumoMensal);
carregarAlunos();
carregarResumoMensal();
