/* ============================================
   鱼行尺素 - 主脚本（动态版）
   ============================================ */

/* ---- 全局状态 ---- */
let currentPage   = 1;
let currentFilter = 'all';
let currentMusic  = 0;
let musicPlaying  = false;
let allPosts      = [];
let pinnedPosts    = [];
const PAGE_SIZE    = 7;

/* ===========================================
   主题切换
   =========================================== */
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
}

function updateThemeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  document.querySelectorAll('.theme-toggle-icon').forEach(el => {
    el.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  });
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  if (isDark) document.documentElement.classList.add('dark');
  updateThemeIcon();
}

/* ===========================================
   移动端菜单
   =========================================== */
function initMobileMenu() {
  const btn  = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('hidden'));
}

/* ===========================================
   搜索
   =========================================== */
async function handleSearch(e) {
  e.preventDefault();
  const q = document.getElementById('search-input')?.value.trim() || '';
  if (!q) return;
  try {
    const posts = await API.getPosts({ search: q });
    renderSearchResults(posts, q);
  } catch(e) { console.error(e); }
}

function renderSearchResults(posts, q) {
  const resultEl = document.getElementById('search-results');
  if (!resultEl) return;
  if (posts.length === 0) {
    resultEl.innerHTML = '<div class="text-center py-8 text-gray-400">未找到相关文章</div>';
    return;
  }
  resultEl.innerHTML = posts.slice(0, 10).map((p, i) => {
    const highlighted = p.title.replace(new RegExp(`(${q})`, 'gi'), '<mark>$1</mark>');
    return `<a href="/post/${p.slug}" class="flex items-start gap-3 p-4 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-colors group">
      <span class="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-300">${i + 1}</span>
      <div>
        <div class="font-semibold text-gray-800 dark:text-gray-100 group-hover:text-purple-600 transition-colors">${highlighted}</div>
        <div class="text-sm text-gray-400 mt-1 line-clamp-1">${p.excerpt || ''}</div>
        <div class="text-xs text-gray-300 mt-1">${formatDate(p.created_at)} · ${p.view_count || 0} 阅读</div>
      </div>
    </a>`;
  }).join('');
  resultEl.classList.remove('hidden');
}

function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  return text.replace(new RegExp(`(${keyword})`, 'gi'), '<mark>$1</mark>');
}

/* ===========================================
   文章渲染
   =========================================== */
async function renderArticleList(filter, page) {
  if (filter !== undefined) { currentFilter = filter; }
  if (page !== undefined) { currentPage = page; }

  try {
    const posts = await API.getPosts({ category: currentFilter === 'all' ? undefined : currentFilter });
    allPosts = posts;

    // 分离置顶和非置顶
    pinnedPosts = posts.filter(p => p.is_pinned);
    const normalPosts = posts.filter(p => !p.is_pinned);

    // 渲染置顶
    const pinnedEl = document.getElementById('pinned-articles');
    if (pinnedEl) {
      pinnedEl.innerHTML = pinnedPosts.length
        ? pinnedPosts.map((a, i) => buildArticleCard(a, true, i * 0.08)).join('')
        : '<p class="text-gray-400 text-sm">暂无置顶文章</p>';
    }

    // 分页：全部时不分页，分类筛选时分页
    const isAll = currentFilter === 'all';
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(normalPosts.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = 1;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageArticles = isAll ? normalPosts : normalPosts.slice(start, start + PAGE_SIZE);

    // 渲染列表
    const listEl = document.getElementById('article-list');
    if (listEl) {
      listEl.innerHTML = pageArticles.length === 0
        ? '<p class="text-center text-gray-400 py-12">暂无更多文章</p>'
        : pageArticles.map((a, i) => buildArticleCard(a, false, i * 0.08)).join('');
    }

    // 渲染分页（全部时不显示分页）
    renderPagination(normalPosts.length, isAll ? 1 : totalPages);

    // 更新筛选按钮状态
    document.querySelectorAll('.filter-btn').forEach(btn => {
      const f = btn.getAttribute('onclick')?.match(/filterArticles\('([^']+)'\)/)?.[1];
      if (f === currentFilter) {
        btn.className = btn.className.replace(/bg-\w+-\d+\s+dark:bg-\w+-\d+\s+text-\w+-\d+\s+dark:text-\w+-\d+/,
          'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300');
      } else {
        btn.className = btn.className.replace(/bg-purple-100\s+dark:bg-purple-900\/40\s+text-purple-600\s+dark:text-purple-300/,
          'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400');
      }
    });
  } catch(e) {
    console.error('加载文章失败:', e);
  }
}

function filterArticles(filter) {
  currentFilter = filter;
  currentPage   = 1;
  renderArticleList(currentFilter);
}

function changePage(page) {
  currentPage = page;
  renderArticleList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function buildArticleCard(article, pinned = false, delay = 0) {
  // 安全转义 HTML，防止破坏卡片结构
  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const tagsHtml = (article.tags || []).slice(0, 3).map(t =>
    `<span class="px-2 py-0.5 rounded-full text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">${esc(t)}</span>`
  ).join('');

  const cover = article.cover_image
    ? `<img src="${article.cover_image}" alt="${esc(article.title)}" class="w-full h-40 object-cover rounded-xl mb-4">`
    : '';

  return `
    <article class="article-card bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-all hover:shadow-md animate-fadeInUp"
             style="animation-delay: ${delay}s">
      ${cover}
      <div class="flex items-center gap-2 mb-3">
        ${pinned ? '<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300"><i class="fas fa-thumbtack mr-1"></i>置顶</span>' : ''}
        ${article.category_name ? `<span class="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300">${esc(article.category_name)}</span>` : ''}
      </div>
      <h2 class="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 hover:text-purple-600 dark:hover:text-purple-300 transition-colors cursor-pointer">
        <a href="/post/${article.slug}">${esc(article.title)}</a>
      </h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">${esc(article.excerpt)}</p>
      <div class="flex items-center justify-between text-xs text-gray-400">
        <div class="flex items-center gap-4">
          <span><i class="far fa-calendar mr-1"></i>${formatDate(article.created_at)}</span>
          <span><i class="far fa-eye mr-1"></i>${article.view_count || 0}</span>
        </div>
        <div class="flex gap-1">${tagsHtml}</div>
      </div>
    </article>`;
}

function renderPagination(total, totalPages) {
  const pgEl = document.getElementById('pagination');
  if (!pgEl || totalPages <= 1) {
    if (pgEl) pgEl.innerHTML = '';
    return;
  }

  let html = `
    <button class="page-btn ${currentPage === 1 ? 'opacity-40 cursor-not-allowed' : ''}"
            onclick="changePage(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i>
    </button>`;

  const range = getPaginationRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === '...') {
      html += `<span class="px-2 text-gray-400">…</span>`;
    } else {
      html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" onclick="changePage(${p})">${p}</button>`;
    }
  });

  html += `
    <button class="page-btn ${currentPage === totalPages ? 'opacity-40 cursor-not-allowed' : ''}"
            onclick="changePage(${currentPage + 1})">
      <i class="fas fa-chevron-right"></i>
    </button>`;

  pgEl.innerHTML = html;
}

function getPaginationRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}

/* ===========================================
   音乐播放器
   =========================================== */
function initMusicPlayer() {
  const btn  = document.getElementById('music-play-btn');
  const bars = document.getElementById('music-bars');
  if (!btn || !bars) return;

  btn.addEventListener('click', () => {
    musicPlaying = !musicPlaying;
    btn.innerHTML = musicPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    bars.classList.toggle('music-paused', !musicPlaying);
  });
}

/* ===========================================
   滚动进度条
   =========================================== */
function initReadingProgress() {
  const bar = document.getElementById('reading-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const pct = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (pct > 0 ? (window.scrollY / pct * 100) : 0) + '%';
  }, { passive: true });
}

/* ===========================================
   返回顶部
   =========================================== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.style.opacity = window.scrollY > 300 ? '1' : '0';
    btn.style.pointerEvents = window.scrollY > 300 ? 'auto' : 'none';
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ===========================================
   lazy load images
   =========================================== */
function initLazyLoad() {
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('loaded');
          obs.unobserve(entry.target);
        }
      });
    });
    document.querySelectorAll('img.lazy').forEach(img => obs.observe(img));
  }
}

/* ===========================================
   键盘快捷键
   =========================================== */
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
    e.preventDefault();
    document.getElementById('search-input')?.focus();
  }
  if (e.key === 'Escape') {
    document.getElementById('search-input')?.blur();
    document.getElementById('mobile-menu')?.classList.add('hidden');
    document.getElementById('search-results')?.classList.add('hidden');
  }
});

/* ===========================================
   初始化入口
   =========================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initMobileMenu();
  initReadingProgress();
  initBackToTop();
  initMusicPlayer();
  initLazyLoad();

  // 搜索
  const searchForm = document.getElementById('search-form');
  if (searchForm) searchForm.addEventListener('submit', handleSearch);

  // 搜索结果点击关闭
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-form') && !e.target.closest('#search-results')) {
      document.getElementById('search-results')?.classList.add('hidden');
    }
  });

  // 主题切换按钮
  document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
    btn.addEventListener('click', toggleTheme);
  });
});
