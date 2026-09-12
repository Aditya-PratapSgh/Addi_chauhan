const Store = {
  user: null, // populated after checkSession()

  isAdmin() { return this.user && this.user.role === 'ADMIN'; },
  isLoggedIn() { return !!this.user; },

  async checkSession() {
    const token = localStorage.getItem('addi_token');
    if (!token) { this.user = null; renderAuthUI(); return; }
    try {
      const { user } = await api.me();
      this.user = user;
    } catch (e) {
      localStorage.removeItem('addi_token');
      this.user = null;
    }
    renderAuthUI();
  },

  login(token, user) {
    localStorage.setItem('addi_token', token);
    this.user = user;
    renderAuthUI();
  },

  logout() {
    localStorage.removeItem('addi_token');
    this.user = null;
    renderAuthUI();
    navigate('/');
  },
};

function renderAuthUI() {
  const guestEls = document.querySelectorAll('[data-guest-only]');
  const userEls = document.querySelectorAll('[data-user-only]');
  const adminEls = document.querySelectorAll('[data-admin-only]');
  const loggedIn = Store.isLoggedIn();

  guestEls.forEach((el) => (el.style.display = loggedIn ? 'none' : ''));
  userEls.forEach((el) => (el.style.display = loggedIn ? '' : 'none'));
  adminEls.forEach((el) => (el.style.display = Store.isAdmin() ? '' : 'none'));

  if (loggedIn) {
    document.getElementById('user-chip-name').textContent = Store.user.name.split(' ')[0];
    document.getElementById('user-avatar').textContent = Store.user.name.charAt(0).toUpperCase();
  }
}

function toast(message, type = 'default') {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  root.appendChild(el);
  setTimeout(() => el.remove(), 3400);
}

function initTheme() {
  const saved = localStorage.getItem('addi_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  syncThemeIcon(saved);
}

function syncThemeIcon(theme) {
  document.getElementById('theme-icon-dark').style.display = theme === 'dark' ? '' : 'none';
  document.getElementById('theme-icon-light').style.display = theme === 'light' ? '' : 'none';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('addi_theme', next);
  syncThemeIcon(next);
}
