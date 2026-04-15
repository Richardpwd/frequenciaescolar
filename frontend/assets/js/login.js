import { post } from './api.js';

const form = document.getElementById('login-form');
const alertBox = document.getElementById('alert-box');

function showAlert(message, type = 'error') {
  alertBox.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  alertBox.textContent = message;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const usuario = document.getElementById('usuario').value.trim();
  const senha = document.getElementById('senha').value;

  try {
    const data = await post('/auth/login', { usuario, senha });
    sessionStorage.setItem('avanceUsuario', JSON.stringify(data.usuario));
    sessionStorage.setItem('avanceToken', data.token);
    sessionStorage.setItem('avanceRefreshToken', data.refreshToken);
    window.location.href = '/dashboard.html';
  } catch (error) {
    showAlert(error.message);
  }
});
