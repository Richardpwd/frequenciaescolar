import { post } from './api.js';

const form = document.getElementById('register-form');
const alertBox = document.getElementById('alert-box');

function showAlert(message, type = 'error') {
  alertBox.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  alertBox.textContent = message;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const nome = document.getElementById('nome').value.trim();
  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value;

  try {
    const data = await post('/auth/register', { nome, usuario, senha });
    showAlert(data.message, 'success');
    form.reset();
  } catch (error) {
    showAlert(error.message);
  }
});
