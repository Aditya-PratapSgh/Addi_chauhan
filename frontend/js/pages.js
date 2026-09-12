const Pages = {};

// ---------------------------------------------------------------- HOME
Pages.home = async (root) => {
  root.innerHTML = `
    <section class="hero">
      <div class="container hero-grid">
        <div>
          <span class="hero-eyebrow-badge">For B.Tech &amp; CS students</span>
          <h1>Real projects. Real source code. Built to be studied.</h1>
          <p class="hero-lead">Addi_chauhan is a repository of complete development projects — browse the code, read the write-up, and download everything you need to learn how it was actually built.</p>
          <div class="hero-cta-row">
            <a href="#/projects" class="btn btn-primary">Browse projects</a>
            <a href="#/register" class="btn btn-ghost">Create a free account</a>
          </div>
          <div class="hero-stats" id="hero-stats">
            <div class="hero-stat"><b>–</b><span>projects</span></div>
            <div class="hero-stat"><b>–</b><span>categories</span></div>
            <div class="hero-stat"><b>Free</b><span>for students</span></div>
          </div>
        </div>
        <div class="terminal">
          <div class="terminal-bar"><span class="terminal-dot" style="background:#F2545B"></span><span class="terminal-dot" style="background:#E7B84B"></span><span class="terminal-dot" style="background:#00D9B5"></span><span class="terminal-title">addi_chauhan.sh</span></div>
          <div class="terminal-body">
<span class="c3">$</span> <span class="c1">git clone</span> project-of-your-choice.git<br/>
<span class="c3">$</span> <span class="c1">cd</span> project &amp;&amp; <span class="c1">cat</span> README.md<br/>
<span class="c3">›</span> <span class="c2">Problem statement, objective, stack</span><br/>
<span class="c3">›</span> <span class="c2">Screenshots, live demo, GitHub link</span><br/>
<span class="c3">$</span> <span class="c1">unzip</span> source-code.zip<br/>
<span class="c3">$</span> study, run, remix<span class="cursor"></span>
          </div>
        </div>
      </div>
    </section>

    <section class="page-section tight">
      <div class="container">
        <div class="section-head">
          <div><h2>Recently added</h2><p>The latest projects uploaded to the repository.</p></div>
          <a href="#/projects" class="btn btn-ghost">View all →</a>
        </div>
        <div id="home-projects">${skeletonGrid(3)}</div>
      </div>
    </section>

    <section class="page-section tight">
      <div class="container">
        <div class="section-head"><div><h2>Browse by category</h2><p>Jump straight to the stack you're practicing.</p></div></div>
        <div id="home-categories" class="grid grid-4"></div>
      </div>
    </section>
  `;

  try {
    const [{ projects }, { categories }] = await Promise.all([api.listProjects(), api.categories()]);
    document.querySelector('#hero-stats').innerHTML = `
      <div class="hero-stat"><b>${projects.length}</b><span>projects</span></div>
      <div class="hero-stat"><b>${categories.length}</b><span>categories</span></div>
      <div class="hero-stat"><b>Free</b><span>for students</span></div>`;

    const featured = projects.slice(0, 3);
    const grid = document.querySelector('#home-projects');
    grid.innerHTML = featured.length
      ? `<div class="grid grid-3">${featured.map(projectCardHtml).join('')}</div>`
      : emptyState('No projects yet', 'Check back soon — new projects are added regularly.');
    wireBookmarkButtons(grid);

    document.querySelector('#home-categories').innerHTML = categories
      .slice(0, 8)
      .map(
        (c) => `<a href="#/projects?category=${encodeURIComponent(c.name)}" class="category-card">
          <b>${esc(c.name)}</b><span>${c.count} project${c.count === 1 ? '' : 's'}</span>
        </a>`
      )
      .join('') || emptyState('No categories yet', 'Categories appear once projects are uploaded.');
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ---------------------------------------------------------------- PROJECTS LIST
Pages.projects = async (root, query) => {
  const params = new URLSearchParams(query || '');
  root.innerHTML = `
    <section class="page-section">
      <div class="container">
        <div class="section-head">
          <div><h2>All projects</h2><p>Filter by category, tech stack or difficulty to find what you need.</p></div>
        </div>
        <div class="filter-bar">
          <input class="input search-input" id="f-search" type="search" placeholder="Search by title, description or tech…" value="${esc(params.get('search') || '')}" />
          <select class="input" id="f-category" style="max-width:190px"><option value="">All categories</option></select>
          <select class="input" id="f-difficulty" style="max-width:170px">
            <option value="">All difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div id="projects-count" style="margin-bottom:14px;font-size:13.5px;color:var(--text-faint)"></div>
        <div id="projects-results">${skeletonGrid(6)}</div>
      </div>
    </section>
  `;

  const searchInput = document.querySelector('#f-search');
  const categorySelect = document.querySelector('#f-category');
  const difficultySelect = document.querySelector('#f-difficulty');
  if (params.get('difficulty')) difficultySelect.value = params.get('difficulty');

  async function runQuery() {
    const q = new URLSearchParams();
    if (searchInput.value.trim()) q.set('search', searchInput.value.trim());
    if (categorySelect.value) q.set('category', categorySelect.value);
    if (difficultySelect.value) q.set('difficulty', difficultySelect.value);
    const qs = q.toString();
    history.replaceState(null, '', `#/projects${qs ? `?${qs}` : ''}`);

    const resultsEl = document.querySelector('#projects-results');
    resultsEl.innerHTML = skeletonGrid(6);
    try {
      const { projects } = await api.listProjects(qs ? `?${qs}` : '');
      document.querySelector('#projects-count').textContent = `${projects.length} project${projects.length === 1 ? '' : 's'} found`;
      resultsEl.innerHTML = projects.length
        ? `<div class="grid grid-3">${projects.map(projectCardHtml).join('')}</div>`
        : emptyState('No projects match those filters', 'Try clearing a filter or searching a different term.');
      wireBookmarkButtons(resultsEl);
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  try {
    const { categories } = await api.categories();
    categorySelect.innerHTML =
      '<option value="">All categories</option>' +
      categories.map((c) => `<option value="${esc(c.name)}">${esc(c.name)} (${c.count})</option>`).join('');
    if (params.get('category')) categorySelect.value = params.get('category');
  } catch (err) { /* non-fatal */ }

  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runQuery, 300);
  });
  categorySelect.addEventListener('change', runQuery);
  difficultySelect.addEventListener('change', runQuery);

  runQuery();
};

// ---------------------------------------------------------------- PROJECT DETAIL
Pages.projectDetail = async (root, id) => {
  root.innerHTML = `<div class="loading-block"><span class="spinner"></span></div>`;
  let project;
  try {
    const res = await api.getProject(id);
    project = res.project;
  } catch (err) {
    root.innerHTML = emptyState('Project not found', err.message);
    return;
  }

  if (Store.isLoggedIn() && !Store.isAdmin()) {
    api.markViewed(id).catch(() => {});
  }

  const images = [project.thumbnailUrl, ...(project.screenshotUrls || [])].filter(Boolean);
  const mainImg = images[0];

  root.innerHTML = `
    <section class="page-section">
      <div class="container detail-grid">
        <div>
          <a href="#/projects" style="font-size:13.5px;color:var(--text-dim);display:inline-block;margin-bottom:16px;">← Back to projects</a>

          <div class="detail-gallery-main">
            ${mainImg ? `<img id="gallery-main-img" src="${fullUrl(mainImg)}" alt="${esc(project.title)}" style="width:100%;height:100%;object-fit:cover;" />` : ''}
          </div>
          ${images.length > 1 ? `<div class="detail-gallery-thumbs">
            ${images.map((src, i) => `<img src="${fullUrl(src)}" class="${i === 0 ? 'active' : ''}" data-gallery-thumb="${fullUrl(src)}" />`).join('')}
          </div>` : ''}

          <div class="detail-title-row">
            <div>
              <div class="badge-row"><span class="badge badge-cat">${esc(project.category)}</span><span class="badge badge-diff">${esc(project.difficulty)}</span></div>
              <h1>${esc(project.title)}</h1>
            </div>
          </div>

          <div class="detail-section"><h3>Description</h3><p>${esc(project.description)}</p></div>

          ${project.problemStatement ? `<div class="detail-section"><h3>Problem statement</h3><p>${esc(project.problemStatement)}</p></div>` : ''}
          ${project.objective ? `<div class="detail-section"><h3>Project objective</h3><p>${esc(project.objective)}</p></div>` : ''}

          ${(project.features || []).length ? `<div class="detail-section"><h3>Features</h3><ul class="feature-list">${project.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul></div>` : ''}

          <div class="detail-section">
            <h3>Tech stack</h3>
            <div class="tech-row">${(project.technologies || []).map((t) => `<span class="tech-tag">${esc(t)}</span>`).join('')}</div>
          </div>
        </div>

        <aside>
          <div class="side-card">
            <h4>Project stats</h4>
            <div class="side-stats">
              <div class="side-stat"><b>${project.views}</b><span>views</span></div>
              <div class="side-stat"><b>${project.downloads}</b><span>downloads</span></div>
              <div class="side-stat"><b>${timeAgo(project.createdAt)}</b><span>added</span></div>
            </div>
            <div class="side-actions">
              ${project.hasSourceZip ? `<button class="btn btn-primary btn-block" id="dl-source">Download source code</button>` : `<button class="btn btn-ghost btn-block" disabled>No source ZIP uploaded</button>`}
              ${project.hasDocPdf ? `<button class="btn btn-ghost btn-block" id="dl-doc">Download documentation</button>` : ''}
              ${project.githubUrl ? `<a class="btn btn-outline btn-block" href="${esc(project.githubUrl)}" target="_blank" rel="noopener">View on GitHub</a>` : ''}
              ${project.liveDemoUrl ? `<a class="btn btn-ghost btn-block" href="${esc(project.liveDemoUrl)}" target="_blank" rel="noopener">Open live demo</a>` : ''}
              ${!Store.isAdmin() ? `<button class="btn btn-ghost btn-block" id="bookmark-toggle" data-bookmark-id="${project.id}">
                ${project.bookmarked ? '♥ Saved — remove bookmark' : '♡ Save project'}
              </button>` : ''}
            </div>
          </div>
        </aside>
      </div>
    </section>
  `;

  document.querySelectorAll('[data-gallery-thumb]').forEach((thumb) => {
    thumb.addEventListener('click', () => {
      document.querySelector('#gallery-main-img').src = thumb.getAttribute('data-gallery-thumb');
      document.querySelectorAll('[data-gallery-thumb]').forEach((t) => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  const dlSource = document.querySelector('#dl-source');
  if (dlSource) dlSource.addEventListener('click', async () => {
    if (!Store.isLoggedIn()) { toast('Sign in to download source code.'); navigate('/login'); return; }
    setButtonLoading(dlSource, true, 'Preparing…');
    try {
      await api.downloadFile(`/api/projects/${id}/download/source`, `${project.title}-source.zip`);
    } catch (err) { toast(err.message, 'error'); }
    setButtonLoading(dlSource, false);
  });

  const dlDoc = document.querySelector('#dl-doc');
  if (dlDoc) dlDoc.addEventListener('click', async () => {
    if (!Store.isLoggedIn()) { toast('Sign in to download documentation.'); navigate('/login'); return; }
    try {
      await api.downloadFile(`/api/projects/${id}/download/doc`, `${project.title}-documentation.pdf`);
    } catch (err) { toast(err.message, 'error'); }
  });

  const bookmarkToggle = document.querySelector('#bookmark-toggle');
  if (bookmarkToggle) bookmarkToggle.addEventListener('click', async () => {
    if (!Store.isLoggedIn()) { navigate('/login'); return; }
    try {
      const { bookmarked } = await api.toggleBookmark(id);
      bookmarkToggle.textContent = bookmarked ? '♥ Saved — remove bookmark' : '♡ Save project';
      toast(bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks', 'success');
    } catch (err) { toast(err.message, 'error'); }
  });
};

// ---------------------------------------------------------------- CATEGORIES
Pages.categories = async (root) => {
  root.innerHTML = `
    <section class="page-section">
      <div class="container">
        <div class="section-head"><div><h2>Categories</h2><p>Every category currently represented in the repository.</p></div></div>
        <div id="cat-grid" class="grid grid-4">${skeletonGrid(8)}</div>
      </div>
    </section>`;
  try {
    const { categories } = await api.categories();
    document.querySelector('#cat-grid').innerHTML = categories.length
      ? categories
          .map((c) => `<a href="#/projects?category=${encodeURIComponent(c.name)}" class="category-card"><b>${esc(c.name)}</b><span>${c.count} project${c.count === 1 ? '' : 's'}</span></a>`)
          .join('')
      : emptyState('No categories yet', 'Categories will appear once the admin uploads projects.');
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ---------------------------------------------------------------- ABOUT
Pages.about = async (root) => {
  root.innerHTML = `
    <section class="page-section">
      <div class="container about-hero">
        <h1>Built for students who learn by reading real code.</h1>
        <p>Addi_chauhan started as a personal collection of finished projects — the kind with a working README, a clear problem statement and source code you can actually open, not just a screenshot. It grew into a small repository other students could browse, study and build on.</p>
        <p>Every upload includes the same things: what problem it solves, what stack it uses, the source code, and screenshots or a demo link so you know what you're getting before you download anything.</p>
      </div>
      <div class="container value-grid">
        <div class="value-card"><b>Study, don't just copy</b><p style="margin:0;font-size:13.8px;">Each project ships with a problem statement and objective, so you understand the "why" before the "how".</p></div>
        <div class="value-card"><b>Real tech stacks</b><p style="margin:0;font-size:13.8px;">From vanilla JS visualizers to full MERN apps — projects span difficulty levels and stacks.</p></div>
        <div class="value-card"><b>Source code included</b><p style="margin:0;font-size:13.8px;">Download the ZIP, open it in your editor, and run it locally.</p></div>
      </div>
    </section>`;
};

// ---------------------------------------------------------------- LOGIN
Pages.login = async (root) => {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to bookmark projects and download source code.</p>
        <div id="login-error"></div>
        <form id="login-form">
          <div class="field"><label>Email</label><input class="input" type="email" name="email" required /></div>
          <div class="field"><label>Password</label><input class="input" type="password" name="password" required /></div>
          <button class="btn btn-primary btn-block" type="submit">Sign in</button>
        </form>
        <div class="auth-foot">
          <a href="#/forgot-password">Forgot password?</a> &nbsp;·&nbsp;
          Don't have an account? <a href="#/register">Sign up</a>
        </div>
        <div class="demo-creds">
          Demo admin: <code>admin@addichauhan.dev</code> / <code>Admin@123</code><br/>
          Demo student: <code>student@addichauhan.dev</code> / <code>Student@123</code>
        </div>
      </div>
    </div>`;

  document.querySelector('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const fd = new FormData(e.target);
    setButtonLoading(btn, true, 'Signing in…');
    document.querySelector('#login-error').innerHTML = '';
    try {
      const { token, user } = await api.login({ email: fd.get('email'), password: fd.get('password') });
      Store.login(token, user);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      navigate(user.role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      document.querySelector('#login-error').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
    }
    setButtonLoading(btn, false);
  });
};

// ---------------------------------------------------------------- REGISTER
Pages.register = async (root) => {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Create your account</h1>
        <p>Free for students — browse, bookmark and download projects.</p>
        <div id="register-error"></div>
        <form id="register-form">
          <div class="field"><label>Full name</label><input class="input" type="text" name="name" required /></div>
          <div class="field"><label>Email</label><input class="input" type="email" name="email" required /></div>
          <div class="field"><label>Password</label><input class="input" type="password" name="password" minlength="6" required /><div class="field-hint">At least 6 characters.</div></div>
          <button class="btn btn-primary btn-block" type="submit">Create account</button>
        </form>
        <div class="auth-foot">Already have an account? <a href="#/login">Sign in</a></div>
      </div>
    </div>`;

  document.querySelector('#register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const fd = new FormData(e.target);
    setButtonLoading(btn, true, 'Creating…');
    document.querySelector('#register-error').innerHTML = '';
    try {
      const { token, user } = await api.register({ name: fd.get('name'), email: fd.get('email'), password: fd.get('password') });
      Store.login(token, user);
      toast(`Welcome, ${user.name.split(' ')[0]}!`, 'success');
      navigate('/');
    } catch (err) {
      document.querySelector('#register-error').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
    }
    setButtonLoading(btn, false);
  });
};

// ---------------------------------------------------------------- FORGOT / RESET PASSWORD
Pages.forgotPassword = async (root) => {
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Reset your password</h1>
        <p>Enter your account email and we'll generate a reset link.</p>
        <div id="fp-msg"></div>
        <form id="fp-form">
          <div class="field"><label>Email</label><input class="input" type="email" name="email" required /></div>
          <button class="btn btn-primary btn-block" type="submit">Send reset link</button>
        </form>
        <div class="auth-foot"><a href="#/login">Back to login</a></div>
      </div>
    </div>`;

  document.querySelector('#fp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const fd = new FormData(e.target);
    setButtonLoading(btn, true, 'Sending…');
    try {
      const res = await api.forgotPassword({ email: fd.get('email') });
      const linkHtml = res.devResetLink
        ? `<br/><a href="${res.devResetLink}">Open your reset link →</a> <span style="color:var(--text-faint)">(shown here since no email server is configured in this demo)</span>`
        : '';
      document.querySelector('#fp-msg').innerHTML = `<div class="form-success">${esc(res.message)}${linkHtml}</div>`;
    } catch (err) {
      document.querySelector('#fp-msg').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
    }
    setButtonLoading(btn, false);
  });
};

Pages.resetPassword = async (root, query) => {
  const params = new URLSearchParams(query || '');
  const token = params.get('token') || '';
  root.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-card">
        <h1>Choose a new password</h1>
        <p>Paste the reset link's token if it wasn't filled in automatically.</p>
        <div id="rp-msg"></div>
        <form id="rp-form">
          <div class="field"><label>Reset token</label><input class="input" type="text" name="token" value="${esc(token)}" required /></div>
          <div class="field"><label>New password</label><input class="input" type="password" name="newPassword" minlength="6" required /></div>
          <button class="btn btn-primary btn-block" type="submit">Update password</button>
        </form>
        <div class="auth-foot"><a href="#/login">Back to login</a></div>
      </div>
    </div>`;

  document.querySelector('#rp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const fd = new FormData(e.target);
    setButtonLoading(btn, true, 'Updating…');
    try {
      const res = await api.resetPassword({ token: fd.get('token'), newPassword: fd.get('newPassword') });
      document.querySelector('#rp-msg').innerHTML = `<div class="form-success">${esc(res.message)}</div>`;
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      document.querySelector('#rp-msg').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
    }
    setButtonLoading(btn, false);
  });
};

// ---------------------------------------------------------------- PROFILE
Pages.profile = async (root) => {
  const u = Store.user;
  root.innerHTML = `
    <section class="page-section">
      <div class="container" style="max-width:640px;">
        <div class="profile-header">
          <div class="profile-avatar">${esc(u.name.charAt(0).toUpperCase())}</div>
          <div>
            <h2 style="margin-bottom:2px;">${esc(u.name)}</h2>
            <p style="margin:0;">${esc(u.email)} · ${u.role === 'ADMIN' ? 'Administrator' : 'Student'}</p>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-pill"><b>${(u.viewed || []).length}</b><span>projects viewed</span></div>
          <div class="stat-pill"><b>${(u.bookmarks || []).length}</b><span>bookmarked</span></div>
        </div>

        <div class="panel" style="margin-top:30px;">
          <div class="panel-head"><h3 style="margin:0;">Edit profile</h3></div>
          <div id="profile-msg"></div>
          <form id="profile-form">
            <div class="field"><label>Full name</label><input class="input" type="text" name="name" value="${esc(u.name)}" required /></div>
            <div class="field"><label>Email</label><input class="input" type="email" value="${esc(u.email)}" disabled /></div>
            <button class="btn btn-primary" type="submit">Save changes</button>
          </form>
        </div>
      </div>
    </section>`;

  document.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const fd = new FormData(e.target);
    setButtonLoading(btn, true, 'Saving…');
    try {
      const { user } = await api.updateProfile({ name: fd.get('name') });
      Store.user = user;
      renderAuthUI();
      document.querySelector('#profile-msg').innerHTML = `<div class="form-success">Profile updated.</div>`;
    } catch (err) {
      document.querySelector('#profile-msg').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
    }
    setButtonLoading(btn, false);
  });
};

// ---------------------------------------------------------------- BOOKMARKS
Pages.bookmarks = async (root) => {
  root.innerHTML = `
    <section class="page-section">
      <div class="container">
        <div class="section-head"><div><h2>My Bookmarks</h2><p>Projects you've saved to come back to later.</p></div></div>
        <div id="bookmarks-grid">${skeletonGrid(3)}</div>
      </div>
    </section>`;
  try {
    const { projects } = await api.myBookmarks();
    const grid = document.querySelector('#bookmarks-grid');
    grid.innerHTML = projects.length
      ? `<div class="grid grid-3">${projects.map(projectCardHtml).join('')}</div>`
      : emptyState('No bookmarks yet', 'Tap the ♡ icon on any project to save it here.');
    wireBookmarkButtons(grid, (id, bookmarked) => {
      if (!bookmarked) Pages.bookmarks(root); // refresh list if unsaved from here
    });
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ---------------------------------------------------------------- ADMIN SHELL
function adminSideNav(active) {
  const items = [
    { key: 'dashboard', label: 'Dashboard', route: '/admin' },
    { key: 'upload', label: 'Upload project', route: '/admin/upload' },
    { key: 'students', label: 'Manage students', route: '/admin/students' },
  ];
  return `<nav class="admin-side">${items
    .map((i) => `<a href="#${i.route}" class="${active === i.key ? 'active' : ''}">${i.label}</a>`)
    .join('')}</nav>`;
}

Pages.adminDashboard = async (root) => {
  root.innerHTML = `
    <section class="page-section">
      <div class="container admin-shell">
        ${adminSideNav('dashboard')}
        <div>
          <div class="section-head"><div><h2>Admin dashboard</h2><p>Manage every project in the repository.</p></div>
            <a href="#/admin/upload" class="btn btn-primary">+ Upload project</a>
          </div>
          <div class="admin-stat-grid" id="admin-stats">
            ${['Projects','Students','Downloads','Views'].map(l => `<div class="admin-stat"><b>–</b><span>${l}</span></div>`).join('')}
          </div>
          <div class="panel">
            <div class="panel-head"><h3 style="margin:0;">All projects</h3></div>
            <div style="overflow-x:auto;">
              <table class="data-table">
                <thead><tr><th>Title</th><th>Category</th><th>Difficulty</th><th>Views</th><th>Downloads</th><th>Added</th><th></th></tr></thead>
                <tbody id="admin-projects-body"><tr><td colspan="7">Loading…</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>`;

  try {
    const stats = await api.adminStats();
    document.querySelector('#admin-stats').innerHTML = `
      <div class="admin-stat"><b>${stats.totalProjects}</b><span>Projects</span></div>
      <div class="admin-stat"><b>${stats.totalStudents}</b><span>Students</span></div>
      <div class="admin-stat"><b>${stats.totalDownloads}</b><span>Downloads</span></div>
      <div class="admin-stat"><b>${stats.totalViews}</b><span>Views</span></div>`;
  } catch (err) { /* non-fatal */ }

  try {
    const { projects } = await api.listProjects();
    const body = document.querySelector('#admin-projects-body');
    body.innerHTML = projects.length
      ? projects
          .map(
            (p) => `<tr>
              <td><a href="#/projects/${p.id}" style="font-weight:600;">${esc(p.title)}</a></td>
              <td>${esc(p.category)}</td>
              <td>${esc(p.difficulty)}</td>
              <td>${p.views}</td>
              <td>${p.downloads}</td>
              <td>${timeAgo(p.createdAt)}</td>
              <td class="row-actions">
                <a href="#/admin/edit/${p.id}" class="btn btn-ghost btn-sm">Edit</a>
                <button class="btn btn-danger btn-sm" data-delete-id="${p.id}">Delete</button>
              </td>
            </tr>`
          )
          .join('')
      : `<tr><td colspan="7">No projects yet — upload your first one.</td></tr>`;

    body.querySelectorAll('[data-delete-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this project? This also removes its uploaded files.')) return;
        try {
          await api.deleteProject(btn.getAttribute('data-delete-id'));
          toast('Project deleted.', 'success');
          Pages.adminDashboard(root);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ---------------------------------------------------------------- ADMIN UPLOAD / EDIT FORM
Pages.adminUpload = async (root, editId) => {
  let existing = null;
  if (editId) {
    try {
      const res = await api.getProject(editId);
      existing = res.project;
    } catch (err) {
      toast(err.message, 'error');
    }
  }
  const v = (key, fallback = '') => (existing ? existing[key] ?? fallback : fallback);

  root.innerHTML = `
    <section class="page-section">
      <div class="container admin-shell">
        ${adminSideNav(editId ? '' : 'upload')}
        <div>
          <div class="section-head"><div><h2>${editId ? 'Edit project' : 'Upload a project'}</h2><p>${editId ? 'Update details or replace files below.' : 'Fill in project details and attach files. Only ZIP source code and PDF docs are needed — images upload separately.'}</p></div></div>
          <div class="panel">
            <div id="upload-error"></div>
            <form id="upload-form">
              <div class="form-grid">
                <div class="field span-2"><label>Project title *</label><input class="input" name="title" required value="${esc(v('title'))}" /></div>
                <div class="field span-2"><label>Description *</label><textarea class="input" name="description" required>${esc(v('description'))}</textarea></div>

                <div class="field"><label>Category *</label><input class="input" name="category" required placeholder="e.g. Web Development" value="${esc(v('category'))}" /></div>
                <div class="field"><label>Difficulty</label>
                  <select class="input" name="difficulty">
                    ${['Beginner','Intermediate','Advanced'].map(d => `<option ${v('difficulty','Beginner') === d ? 'selected' : ''}>${d}</option>`).join('')}
                  </select>
                </div>

                <div class="field span-2"><label>Technologies (comma-separated)</label><input class="input" name="technologies" placeholder="React, Node.js, MongoDB" value="${esc((existing?.technologies || []).join(', '))}" /></div>
                <div class="field span-2"><label>Features (comma-separated)</label><input class="input" name="features" placeholder="Drag & drop, real-time sync" value="${esc((existing?.features || []).join(', '))}" /></div>

                <div class="field span-2"><label>Problem statement</label><textarea class="input" name="problemStatement">${esc(v('problemStatement'))}</textarea></div>
                <div class="field span-2"><label>Project objective</label><textarea class="input" name="objective">${esc(v('objective'))}</textarea></div>

                <div class="field"><label>GitHub URL</label><input class="input" name="githubUrl" type="url" placeholder="https://github.com/…" value="${esc(v('githubUrl'))}" /></div>
                <div class="field"><label>Live demo URL</label><input class="input" name="liveDemoUrl" type="url" placeholder="https://…" value="${esc(v('liveDemoUrl'))}" /></div>

                <div class="field"><label>Project thumbnail</label>
                  <label class="upload-drop">Click to choose an image<input type="file" name="thumbnail" accept="image/*" /></label>
                </div>
                <div class="field"><label>Screenshots (up to 8)</label>
                  <label class="upload-drop">Click to choose images<input type="file" name="screenshots" accept="image/*" multiple /></label>
                </div>

                <div class="field"><label>Source code ZIP</label>
                  <label class="upload-drop">Click to choose a .zip file<input type="file" name="sourceZip" accept=".zip" /></label>
                  ${existing?.hasSourceZip ? '<div class="field-hint">A source ZIP is already uploaded — choosing a new one replaces it.</div>' : ''}
                </div>
                <div class="field"><label>Documentation PDF</label>
                  <label class="upload-drop">Click to choose a .pdf file<input type="file" name="docPdf" accept=".pdf" /></label>
                  ${existing?.hasDocPdf ? '<div class="field-hint">A documentation PDF is already uploaded — choosing a new one replaces it.</div>' : ''}
                </div>
              </div>

              <div style="margin-top:22px;display:flex;gap:10px;">
                <button class="btn btn-primary" type="submit">${editId ? 'Save changes' : 'Publish project'}</button>
                <a href="#/admin" class="btn btn-ghost">Cancel</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>`;

  // Show chosen filenames under each drop zone
  root.querySelectorAll('.upload-drop input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const wrap = input.closest('.field');
      let chipList = wrap.querySelector('.file-chip-list');
      if (!chipList) {
        chipList = document.createElement('div');
        chipList.className = 'file-chip-list';
        wrap.appendChild(chipList);
      }
      chipList.innerHTML = Array.from(input.files).map((f) => `<span class="file-chip">${esc(f.name)}</span>`).join('');
    });
  });

  document.querySelector('#upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(btn, true, editId ? 'Saving…' : 'Publishing…');
    document.querySelector('#upload-error').innerHTML = '';
    const formData = new FormData(e.target);
    try {
      if (editId) {
        await api.updateProject(editId, formData);
        toast('Project updated.', 'success');
      } else {
        await api.createProject(formData);
        toast('Project published.', 'success');
      }
      navigate('/admin');
    } catch (err) {
      document.querySelector('#upload-error').innerHTML = `<div class="form-error">${esc(err.message)}</div>`;
      setButtonLoading(btn, false);
    }
  });
};

// ---------------------------------------------------------------- ADMIN STUDENTS
Pages.adminStudents = async (root) => {
  root.innerHTML = `
    <section class="page-section">
      <div class="container admin-shell">
        ${adminSideNav('students')}
        <div>
          <div class="section-head"><div><h2>Manage students</h2><p>Enable or disable a student's access to the platform.</p></div></div>
          <div class="panel">
            <div style="overflow-x:auto;">
              <table class="data-table">
                <thead><tr><th>Name</th><th>Email</th><th>Viewed</th><th>Bookmarked</th><th>Joined</th><th>Status</th><th></th></tr></thead>
                <tbody id="students-body"><tr><td colspan="7">Loading…</td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>`;

  try {
    const { students } = await api.students();
    const body = document.querySelector('#students-body');
    body.innerHTML = students.length
      ? students
          .map(
            (s) => `<tr>
              <td>${esc(s.name)}</td>
              <td>${esc(s.email)}</td>
              <td>${s.projectsViewed}</td>
              <td>${s.projectsBookmarked}</td>
              <td>${timeAgo(s.createdAt)}</td>
              <td><span class="status-pill ${s.active ? 'status-active' : 'status-inactive'}">${s.active ? 'Active' : 'Disabled'}</span></td>
              <td class="row-actions">
                <button class="btn btn-sm ${s.active ? 'btn-danger' : 'btn-outline'}" data-toggle-id="${s.id}" data-next="${s.active ? 'false' : 'true'}">
                  ${s.active ? 'Disable access' : 'Enable access'}
                </button>
              </td>
            </tr>`
          )
          .join('')
      : `<tr><td colspan="7">No students have registered yet.</td></tr>`;

    body.querySelectorAll('[data-toggle-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await api.setStudentStatus(btn.getAttribute('data-toggle-id'), btn.getAttribute('data-next') === 'true');
          toast('Student status updated.', 'success');
          Pages.adminStudents(root);
        } catch (err) {
          toast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    toast(err.message, 'error');
  }
};

// ---------------------------------------------------------------- 404
Pages.notFound = async (root) => {
  root.innerHTML = `<section class="page-section"><div class="container">${emptyState('Page not found', "The page you're looking for doesn't exist.")}</div></section>`;
};
