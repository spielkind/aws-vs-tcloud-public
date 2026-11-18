// ===================================================
// filters.js — Filtering and sorting
// ===================================================

/** Get search text for a service */
function searchText(s) {
  const desc = loc(s, 'desc') || '';
  const aliases = (s.aliases || []).join(' ');
  const tcpDesc = loc(s, 'tcpDesc') || '';
  return (
    s.name + ' ' + aliases + ' ' + desc + ' ' +
    s.category + ' ' + s.tcp + ' ' +
    tcpDesc + ' ' +
    (s.tfTcp || '') + ' ' + (s.tfAws || '')
  ).toLowerCase();
}

/** Get filtered services based on current state */
function getFiltered() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const f = state.filters;

  return state.services.filter(s => {
    const txt = searchText(s);
    return (
      (f.categories.length === 0 || f.categories.includes(s.category)) &&
      (f.efforts.length === 0 || f.efforts.includes(s.effort)) &&
      (f.equivs.length === 0 || f.equivs.includes(s.equiv)) &&
      (f.tfStatus.length === 0 || f.tfStatus.includes(s.tfStatus)) &&
      txt.includes(q)
    );
  });
}

/** Get filtered services excluding effort filter (for effort counts) */
function getBaseFiltered() {
  const q = document.getElementById('searchBox').value.toLowerCase();
  const f = state.filters;

  return state.services.filter(s => {
    const txt = searchText(s);
    return (
      (f.categories.length === 0 || f.categories.includes(s.category)) &&
      (f.equivs.length === 0 || f.equivs.includes(s.equiv)) &&
      (f.tfStatus.length === 0 || f.tfStatus.includes(s.tfStatus)) &&
      txt.includes(q)
    );
  });
}

/** Sort services array */
function getSorted(arr) {
  if (state.sortBy === 'name') {
    return [...arr].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (state.sortBy === 'category') {
    return [...arr].sort((a, b) =>
      a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
    );
  }
  if (state.sortBy === 'effort') {
    const order = { hard: 0, medium: 1, easy: 2 };
    const rank = s => (s.effort in order ? order[s.effort] : 3);
    return [...arr].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }
  return arr;
}

/** Toggle a value in an array (add if missing, remove if present) */
function toggleArrayItem(arr, val) {
  const idx = arr.indexOf(val);
  if (idx === -1) arr.push(val);
  else arr.splice(idx, 1);
}

/** Reset all filters to defaults */
function resetFilters() {
  state.filters.categories = [];
  state.filters.efforts = [];
  state.filters.equivs = [];
  state.filters.tfStatus = [];
  document.getElementById('searchBox').value = '';
}

/** Check if any filters are active */
function hasActiveFilters() {
  const f = state.filters;
  return f.categories.length > 0 || f.efforts.length > 0 ||
    f.equivs.length > 0 || f.tfStatus.length > 0 ||
    document.getElementById('searchBox').value;
}

/** Count active filter groups for badge */
function filterCount() {
  const f = state.filters;
  return [
    f.categories.length, f.efforts.length, f.equivs.length,
    f.tfStatus.length
  ].reduce((a, b) => a + b, 0);
}
