// ===================================================
// state.js — Central application state
// ===================================================

/** Read a localStorage value, migrating the legacy 'otc-' key once */
function migratedStorage(key) {
  const legacy = 'otc-' + key;
  const current = 'tcp-' + key;
  const old = localStorage.getItem(legacy);
  if (old !== null) {
    if (localStorage.getItem(current) === null) localStorage.setItem(current, old);
    localStorage.removeItem(legacy);
  }
  return localStorage.getItem(current);
}

function storedLang() {
  return migratedStorage('lang');
}

const state = {
  services: [],       // All loaded services
  updated: null,      // ISO date of last data update (services/meta.json)
  categories: [],     // Auto-generated from service data
  lang: storedLang() || (navigator.language && navigator.language.startsWith('de') ? 'de' : 'en'),
  sortBy: 'name',
  allOpen: false,
  filters: {
    categories: [],   // Active category filters (empty = show all)
    efforts: [],      // Active effort filters
    equivs: [],       // Active equivalence filters
    tfStatus: []      // Active TF status filters
  }
};

// ===================================================
// URL <-> filter state sync
// ===================================================

/** Push current filter state to URL query params */
function pushFilterState() {
  const p = new URLSearchParams();
  const f = state.filters;

  if (f.categories.length) p.set('cat', f.categories.join(','));
  if (f.efforts.length) p.set('eff', f.efforts.join(','));
  if (f.equivs.length) p.set('eq', f.equivs.join(','));
  if (f.tfStatus.length) p.set('tf', f.tfStatus.join(','));

  const q = document.getElementById('searchBox');
  if (q && q.value) p.set('q', q.value);
  if (state.sortBy !== 'name') p.set('sort', state.sortBy);
  if (state.lang !== 'de') p.set('lang', state.lang);

  const s = p.toString();
  const url = s ? location.pathname + '?' + s : location.pathname;
  history.replaceState(null, '', url + (location.hash || ''));
}

/** Load filter state from URL query params on page load */
function loadFilterState() {
  const p = new URLSearchParams(location.search);
  const f = state.filters;

  if (p.has('cat')) f.categories = p.get('cat').split(',').filter(Boolean);
  if (p.has('eff')) f.efforts = p.get('eff').split(',').filter(Boolean);
  if (p.has('eq')) f.equivs = p.get('eq').split(',').filter(Boolean);
  if (p.has('tf')) f.tfStatus = p.get('tf').split(',').filter(Boolean);
  if (p.has('q')) setTimeout(() => {
    const q = document.getElementById('searchBox');
    if (q) q.value = p.get('q');
  }, 0);
  if (p.has('sort')) state.sortBy = p.get('sort');
  if (p.has('lang')) state.lang = p.get('lang');
}

loadFilterState();
