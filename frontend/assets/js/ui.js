export const SESSION_KEYS = {
  user: 'avanceUsuario',
  token: 'avanceToken',
  refreshToken: 'avanceRefreshToken',
};

export function getSessionStorage() {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // Ignora erro de acesso ao storage (ex.: ambiente restrito).
  }

  return null;
}

export function getSessionItem(key) {
  const storage = getSessionStorage();
  return storage ? storage.getItem(key) : null;
}

export function setSessionItem(key, value) {
  const storage = getSessionStorage();
  if (!storage) {
    return false;
  }

  storage.setItem(key, value);
  return true;
}

export function removeSessionItem(key) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(key);
}

export function getLocalStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignora erro de acesso ao storage (ex.: ambiente restrito).
  }

  return null;
}

export function getLocalItem(key) {
  const storage = getLocalStorage();
  return storage ? storage.getItem(key) : null;
}

export function setLocalItem(key, value) {
  const storage = getLocalStorage();
  if (!storage) {
    return false;
  }

  storage.setItem(key, value);
  return true;
}

export function removeLocalItem(key) {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(key);
}

export function showAlert(alertBox, message, type = 'error') {
  if (!alertBox) {
    return;
  }

  alertBox.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
  alertBox.textContent = message;
}

export function getSessionUser() {
  try {
    return JSON.parse(getSessionItem(SESSION_KEYS.user) || 'null');
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getSessionItem(SESSION_KEYS.token);
}

export function clearSession() {
  Object.values(SESSION_KEYS).forEach((key) => {
    removeSessionItem(key);
  });
}

export function redirectToLogin() {
  window.location.href = '/login.html';
}

export function clearSessionAndRedirect() {
  clearSession();
  redirectToLogin();
}

export function requireAuth() {
  const usuario = getSessionUser();
  const token = getAccessToken();

  if (!usuario || !token) {
    clearSessionAndRedirect();
    return null;
  }

  return { usuario, token };
}

export async function logoutUser(remoteLogout) {
  const refreshToken = getSessionItem(SESSION_KEYS.refreshToken);

  if (refreshToken && typeof remoteLogout === 'function') {
    try {
      await remoteLogout(refreshToken);
    } catch {
      // O encerramento local deve ocorrer mesmo se o backend falhar.
    }
  }

  clearSessionAndRedirect();
}
