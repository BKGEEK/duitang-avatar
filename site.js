const API_URL = '/api/nt';
const CATEGORIES = [
  { id: '女生头像', name: '女生头像' },
  { id: '男生头像', name: '男生头像' },
  { id: '鎯呬荆澶村儚', name: '情侣头像' },
  { id: '闂鸿湝澶村儚', name: '闺蜜头像' },
  { id: '浠欏コ澶村儚', name: '仙女头像' },
  { id: '鍔ㄦ极澶村儚', name: '动漫头像' },
  { id: '娌欓洉澶村儚', name: '沙雕头像' },
  { id: '鍙埍澶村儚', name: '可爱头像' },
  { id: '娆х編澶村儚', name: '欧美头像' },
  { id: '鍙ら澶村儚', name: '古风头像' },
  { id: '钀屽疇澶村儚', name: '萌宠头像' },
  { id: '绠�鍗曞ご鍍?', name: '简单头像' },
  { id: '鏂囧瓧澶村儚', name: '文字头像' }
];

const state = {
  currentCategory: CATEGORIES[0].id,
  categoryState: Object.fromEntries(CATEGORIES.map((item) => [item.id, { loaded: false, loading: false, loadingMore: false, avatars: [], nextStart: 0, hasMore: true }]))
};

const els = {
  nav: document.getElementById('categoryNav'),
  status: document.getElementById('status'),
  grid: document.getElementById('grid'),
  loadMoreStatus: document.getElementById('loadMoreStatus'),
  modal: document.getElementById('previewModal'),
  previewImg: document.getElementById('previewImg'),
  backTopBtn: document.getElementById('backTopBtn')
};

function renderNav() {
  els.nav.innerHTML = CATEGORIES.map((item) => `<button class="category-btn ${item.id === state.currentCategory ? 'active' : ''}" data-id="${item.id}">${item.name}</button>`).join('');
}

function renderGrid() {
  const current = state.categoryState[state.currentCategory];
  if (current.loading && current.avatars.length === 0) {
    els.status.textContent = '加载中...';
    els.grid.innerHTML = '';
    return;
  }
  if (!current.avatars.length) {
    els.status.textContent = '暂无头像数据';
    els.grid.innerHTML = '';
    return;
  }
  els.status.textContent = '';
  els.grid.innerHTML = current.avatars.map((item) => `
    <article class="card" data-url="${item.url}">
      <img loading="lazy" src="${item.url}" alt="头像" />
      <div class="meta">? ${item.favoriteCount}</div>
    </article>
  `).join('');
}

function applyCurrentCategory() {
  renderNav();
  renderGrid();
  const current = state.categoryState[state.currentCategory];
  els.loadMoreStatus.textContent = current.loadingMore ? '加载更多中...' : (current.hasMore ? '' : '没有更多了');
}

function processAvatarData(list) {
  return list.map((item) => ({
    id: item.id,
    url: item.photo?.path || '',
    favoriteCount: item.favorite_count || 0
  })).filter((item) => item.url);
}

async function fetchAvatars(kw, start, limit) {
  const url = new URL(API_URL);
  url.searchParams.set('kw', kw);
  url.searchParams.set('start', String(start));
  url.searchParams.set('limit', String(limit));
  const res = await fetch(url.toString(), { mode: 'cors' });
  const contentType = res.headers.get('content-type') || '';
  const bodyText = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${bodyText.slice(0, 120)}`);
  }
  if (!contentType.includes('application/json')) {
    throw new Error(bodyText.slice(0, 120) || '响应不是 JSON');
  }
  return JSON.parse(bodyText);
}

async function loadCategoryFirstPage(kw, force = false) {
  const current = state.categoryState[kw];
  if (!current || current.loading || (current.loaded && !force)) return;
  current.loading = true;
  applyCurrentCategory();
  try {
    const data = await fetchAvatars(kw, 0, 8);
    if (data.status === 1 && data.data) {
      current.avatars = processAvatarData(data.data.object_list || []);
      current.hasMore = data.data.more === 1;
      current.nextStart = data.data.next_start || 0;
      current.loaded = true;
      if (current.avatars.length === 0) {
        els.status.textContent = `接口返回成功，但当前分类「${kw}」没有数据。`;
      }
    } else {
      els.status.textContent = '接口返回格式不符合预期。';
    }
  } catch (error) {
    els.status.textContent = `加载失败：${error.message}`;
  } finally {
    current.loading = false;
    applyCurrentCategory();
  }
}

async function loadMore() {
  const current = state.categoryState[state.currentCategory];
  if (!current || current.loadingMore || !current.hasMore) return;
  current.loadingMore = true;
  applyCurrentCategory();
  try {
    const data = await fetchAvatars(state.currentCategory, current.nextStart, 20);
    if (data.status === 1 && data.data) {
      current.avatars = current.avatars.concat(processAvatarData(data.data.object_list || []));
      current.hasMore = data.data.more === 1;
      current.nextStart = data.data.next_start || current.nextStart;
    }
  } catch (error) {
    els.loadMoreStatus.textContent = `加载更多失败：${error.message}`;
  } finally {
    current.loadingMore = false;
    applyCurrentCategory();
  }
}

els.nav.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-id]');
  if (!btn) return;
  state.currentCategory = btn.dataset.id;
  renderNav();
  applyCurrentCategory();
  loadCategoryFirstPage(state.currentCategory);
});

els.grid.addEventListener('click', (event) => {
  const card = event.target.closest('[data-url]');
  if (!card) return;
  els.previewImg.src = card.dataset.url;
  els.modal.classList.remove('hidden');
  els.modal.setAttribute('aria-hidden', 'false');
});

els.modal.addEventListener('click', (event) => {
  if (event.target.dataset.close) {
    els.modal.classList.add('hidden');
    els.modal.setAttribute('aria-hidden', 'true');
    els.previewImg.src = '';
  }
});

els.backTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => {
  els.backTopBtn.classList.toggle('hidden', window.scrollY < 600);
});
window.addEventListener('scroll', () => {
  const nearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;
  if (nearBottom) loadMore();
});

(async function init() {
  renderNav();
  await loadCategoryFirstPage(state.currentCategory);
})();

