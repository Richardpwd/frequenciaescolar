import { post } from './api.js';

const form = document.getElementById('forgot-form');
const alertBox = document.getElementById('alert-box');

function showAlert(message, type = 'error') {
  alertBox.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  alertBox.textContent = message;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();

  try {
    const data = await post('/auth/forgot-password', { usuario });
    showAlert(data.message, 'success');
  } catch (error) {
    showAlert(error.message);
  }
});
