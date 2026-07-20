'use strict';

const TOKEN_KEY = 'playbook_admin_token';
const USERNAME_KEY = 'playbook_admin_username';

async function apiLogin(username, password) {
  const res = await fetch('/api/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'No se pudo iniciar sesión');
  return body;
}

function init() {
  if (sessionStorage.getItem(TOKEN_KEY)) {
    window.location.replace('/admin/dashboard');
    return;
  }

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorEl.textContent = '';
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = document.getElementById('login-submit');
    submitBtn.disabled = true;
    try {
      const { token, name } = await apiLogin(username, password);
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USERNAME_KEY, name || username);
      window.location.href = '/admin/dashboard';
    } catch (err) {
      errorEl.textContent = err.message;
      submitBtn.disabled = false;
    }
  });
}

init();
