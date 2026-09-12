function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fullUrl(path) {
  if (!path) return '';
  return path.startsWith('http') ? path : `${window.ADDI_API_BASE || window.location.origin}${path}`;
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86400000;
  if (diff < day) return 'today';
  const days = Math.floor(diff / day);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function projectCardHtml(p) {
  const thumb = p.thumbnailUrl
    ? `<img src="${fullUrl(p.thumbnailUrl)}" alt="${esc(p.title)} thumbnail" loading="lazy" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-family:var(--font-mono);font-size:13px;">no preview</div>`;

  return `
  <article class="project-card">
    <div class="project-thumb">
      ${thumb}
      <span class="project-diff">${esc(p.difficulty)}</span>
      ${Store.isLoggedIn() && !Store.isAdmin() ? `
        <button class="bookmark-btn ${p.bookmarked ? 'active' : ''}" data-bookmark-id="${p.id}" title="Save project" aria-label="Bookmark project">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${p.bookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        </button>` : ''}
    </div>
    <div class="project-body">
      <span class="project-cat">${esc(p.category)}</span>
      <a href="#/projects/${p.id}" class="project-title">${esc(p.title)}</a>
      <p class="project-desc">${esc(p.description)}</p>
      <div class="tech-row">
        ${(p.technologies || []).slice(0, 4).map((t) => `<span class="tech-tag">${esc(t)}</span>`).join('')}
      </div>
      <div class="project-meta-row">
        <span>${p.views || 0} views · ${p.downloads || 0} downloads</span>
        <a href="#/projects/${p.id}" style="color:var(--accent);font-weight:600;">View →</a>
      </div>
    </div>
  </article>`;
}

function skeletonGrid(n = 6) {
  return `<div class="grid grid-3">${Array.from({ length: n })
    .map(
      () => `<div class="project-card" style="opacity:.5;">
        <div class="project-thumb"></div>
        <div class="project-body"><div class="project-title">Loading…</div></div>
      </div>`
    )
    .join('')}</div>`;
}

function emptyState(title, body) {
  return `<div class="empty-state"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
}

// Attaches a click handler to any element with [data-bookmark-id] inside `root`
function wireBookmarkButtons(root, onToggled) {
  root.querySelectorAll('[data-bookmark-id]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!Store.isLoggedIn()) { navigate('/login'); return; }
      const id = btn.getAttribute('data-bookmark-id');
      try {
        const { bookmarked } = await api.toggleBookmark(id);
        btn.classList.toggle('active', bookmarked);
        btn.querySelector('svg').setAttribute('fill', bookmarked ? 'currentColor' : 'none');
        toast(bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks', 'success');
        if (onToggled) onToggled(id, bookmarked);
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function setButtonLoading(btn, loading, labelWhenLoading = '') {
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${labelWhenLoading}`;
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}
