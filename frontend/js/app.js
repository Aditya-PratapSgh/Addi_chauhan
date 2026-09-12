function navigate(path) {
  window.location.hash = `#${path}`;
}

function parseHash() {
  const hash = window.location.hash.slice(1) || '/';
  const [pathPart, queryPart] = hash.split('?');
  return { path: pathPart || '/', query: queryPart || '' };
}

const routeTable = [
  { pattern: /^\/$/, handler: (root) => Pages.home(root) },
  { pattern: /^\/projects$/, handler: (root, m, q) => Pages.projects(root, q) },
  { pattern: /^\/projects\/([^/]+)$/, handler: (root, m) => Pages.projectDetail(root, m[1]) },
  { pattern: /^\/categories$/, handler: (root) => Pages.categories(root) },
  { pattern: /^\/about$/, handler: (root) => Pages.about(root) },
  { pattern: /^\/login$/, handler: (root) => Pages.login(root) },
  { pattern: /^\/register$/, handler: (root) => Pages.register(root) },
  { pattern: /^\/forgot-password$/, handler: (root) => Pages.forgotPassword(root) },
  { pattern: /^\/reset-password$/, handler: (root, m, q) => Pages.resetPassword(root, q) },
  { pattern: /^\/profile$/, handler: (root) => Pages.profile(root), auth: true },
  { pattern: /^\/bookmarks$/, handler: (root) => Pages.bookmarks(root), auth: true },
  { pattern: /^\/admin$/, handler: (root) => Pages.adminDashboard(root), admin: true },
  { pattern: /^\/admin\/upload$/, handler: (root) => Pages.adminUpload(root, null), admin: true },
  { pattern: /^\/admin\/edit\/([^/]+)$/, handler: (root, m) => Pages.adminUpload(root, m[1]), admin: true },
  { pattern: /^\/admin\/students$/, handler: (root) => Pages.adminStudents(root), admin: true },
];

async function router() {
  const { path, query } = parseHash();
  const root = document.getElementById('app');
  const match = routeTable.find((r) => r.pattern.test(path));

  if (match && match.auth && !Store.isLoggedIn()) {
    toast('Please sign in to continue.');
    return navigate('/login');
  }
  if (match && match.admin && !Store.isAdmin()) {
    toast('That page is for admins only.', 'error');
    return navigate(Store.isLoggedIn() ? '/' : '/login');
  }

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  updateActiveNav(path);
  closeMobileNav();
  closeUserDropdown();

  if (!match) return Pages.notFound(root);
  const m = path.match(match.pattern);
  try {
    await match.handler(root, m, query);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<section class="page-section"><div class="container">${emptyState('Something went wrong', err.message || 'Please try again.')}</div></section>`;
  }
}

function updateActiveNav(path) {
  document.querySelectorAll('.main-nav a').forEach((a) => {
    const route = a.getAttribute('data-route');
    a.classList.toggle('active', route === '/' ? path === '/' : path.startsWith(route));
  });
}

function closeMobileNav() {
  document.getElementById('main-nav').classList.remove('open');
}
function closeUserDropdown() {
  document.getElementById('user-dropdown').classList.remove('open');
}

function bootstrapChrome() {
  document.getElementById('year').textContent = new Date().getFullYear();
  initTheme();
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  document.getElementById('nav-toggle').addEventListener('click', () => {
    document.getElementById('main-nav').classList.toggle('open');
  });

  const userChipBtn = document.getElementById('user-chip-btn');
  userChipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('user-dropdown').classList.toggle('open');
  });
  document.addEventListener('click', () => closeUserDropdown());

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try { await api.logout(); } catch (e) { /* stateless JWT — ignore */ }
    Store.logout();
    toast('Logged out.', 'success');
  });
}

window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', async () => {
  bootstrapChrome();
  await Store.checkSession();
  router();
});
