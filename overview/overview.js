// ===================================================
// overview.js — compact visual summary generated from services/*.json
// ===================================================

const TXT = {
  de: {
    title: 'Überblick – AWS vs. T Cloud Public',
    sub: n => `Schneller Überblick · ${n} Services`,
    back: '← Details',
    full: '1:1', partial: 'Teilweise', none: 'Kein Pendant', tcpOnly: 'Nur T Cloud Public',
    fullD: 'direktes Pendant', partialD: 'Pendant mit Einschränkungen', noneD: 'kein Pendant (Alternativen)', tcpOnlyD: 'ohne AWS-Gegenstück',
    hint: 'Jede Kachel zeigt eine Kategorie. Klick auf einen Service öffnet die Details.',
    updated: 'Stand:', formerly: 'ehemals Open Telekom Cloud', ai: '🤖 KI-generiert · ohne Gewähr',
    noEquiv: 'kein Pendant'
  },
  en: {
    title: 'Overview – AWS vs. T Cloud Public',
    sub: n => `Quick overview · ${n} services`,
    back: '← Details',
    full: '1:1', partial: 'Partial', none: 'No equivalent', tcpOnly: 'T Cloud Public only',
    fullD: 'direct counterpart', partialD: 'counterpart with gaps', noneD: 'no counterpart (alternatives)', tcpOnlyD: 'no AWS counterpart',
    hint: 'Each tile is a category. Click a service to open its details.',
    updated: 'Last updated:', formerly: 'formerly Open Telekom Cloud', ai: '🤖 AI-generated · no warranty',
    noEquiv: 'no equivalent'
  }
};

const ICONS = {
  'AI/ML': '🤖', 'Analytics': '📊', 'Compute': '🖥️', 'Contact Center': '🎧', 'Container': '📦',
  'Cost Management': '💶', 'DNS/CDN': '🌐', 'Database': '🗄️', 'Identity': '🔑', 'Management': '🛠️',
  'Messaging': '✉️', 'Monitoring': '📡', 'Networking': '🔗', 'Security': '🛡️', 'Serverless': '⚡', 'Storage': '💾'
};
const ORDER = ['full', 'partial', 'none', 'tcpOnly'];

let lang = (localStorage.getItem('tcp-lang') || (navigator.language || '').slice(0, 2)) === 'en' ? 'en' : 'de';
const q = new URLSearchParams(location.search).get('lang');
if (q === 'de' || q === 'en') lang = q;
let data = [], updated = null;

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Same anchor scheme as the main page (render.js) */
const anchor = name => name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');

/** Short AWS label: "Amazon EC2 Dedicated Hosts" → "EC2 Dedicated Hosts" */
const awsShort = s => s.name.replace(/^(Amazon|AWS)\s+/, '').replace(/\s*\(.*\)$/, '');

/** Short T Cloud Public label: short base name ("DMS", "Cloud Eye") or the abbreviation in parentheses ("ECS") */
function tcpShort(s) {
  const t = s.tcp || '';
  const base = t.split('(')[0].replace(/\s*[+/].*$/, '').trim();
  if (s.equiv === 'tcpOnly' || base.length <= 16) return base;
  const m = t.match(/\(([^)]*)\)/);
  const abbr = m && m[1].split(/[\s,/]+/)[0];
  return abbr && /^[A-Z0-9][A-Za-z0-9]{1,7}$/.test(abbr) && (abbr.match(/[A-Z]/g) || []).length >= 2 ? abbr : base;
}

function chip(s) {
  const t = TXT[lang];
  const href = `../?lang=${lang}#${anchor(s.name)}`;
  if (s.equiv === 'tcpOnly') {
    return `<a class="ov-chip eq-tcpOnly" href="${href}" title="${esc(s.tcp)}"><span class="ov-tcp">${esc(tcpShort(s))}</span></a>`;
  }
  const right = s.equiv === 'none' ? `<span class="ov-tcp ov-none">${t.noEquiv}</span>` : `<span class="ov-tcp">${esc(tcpShort(s))}</span>`;
  return `<a class="ov-chip eq-${s.equiv}" href="${href}" title="${esc(s.name)} → ${esc(s.equiv === 'none' ? t.noEquiv : s.tcp)}">` +
    `<span class="ov-aws">${esc(awsShort(s))}</span><span class="ov-arrow">→</span>${right}</a>`;
}

function render() {
  const t = TXT[lang];
  document.documentElement.lang = lang;
  document.title = t.title;
  document.getElementById('ovSub').textContent = t.sub(data.length);
  document.getElementById('ovBack').textContent = t.back;
  document.getElementById('ovBack').href = `../?lang=${lang}`;
  document.getElementById('ovHint').textContent = t.hint;
  document.querySelectorAll('.ov-lang button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));

  // KPIs + distribution bar
  const cnt = Object.fromEntries(ORDER.map(k => [k, data.filter(s => s.equiv === k).length]));
  document.getElementById('ovKpis').innerHTML = ORDER.map(k =>
    `<div class="ov-kpi eq-${k}"><div class="ov-kpi-num">${cnt[k]}</div><div class="ov-kpi-lbl">${t[k]}</div><div class="ov-kpi-desc">${t[k + 'D']}</div></div>`
  ).join('');
  const bar = document.getElementById('ovBar');
  bar.innerHTML = ORDER.filter(k => cnt[k]).map(k =>
    `<span class="eq-${k}" style="flex:${cnt[k]}" title="${t[k]}: ${cnt[k]}"></span>`).join('');
  bar.setAttribute('aria-label', ORDER.map(k => `${t[k]} ${cnt[k]}`).join(', '));

  // Category tiles, largest first; services sorted by equivalence then name
  const cats = [...new Set(data.map(s => s.category))]
    .map(c => ({ c, items: data.filter(s => s.category === c) }))
    .sort((a, b) => b.items.length - a.items.length || a.c.localeCompare(b.c));
  document.getElementById('ovGrid').innerHTML = cats.map(({ c, items }) => {
    const sorted = [...items].sort((a, b) => ORDER.indexOf(a.equiv) - ORDER.indexOf(b.equiv) || a.name.localeCompare(b.name));
    const dots = ORDER.map(k => items.filter(s => s.equiv === k).length).map((n, i) =>
      n ? `<span class="ov-dot eq-${ORDER[i]}" title="${t[ORDER[i]]}">${n}</span>` : '').join('');
    return `<article class="ov-tile"><header><span class="ov-icon">${ICONS[c] || '🧩'}</span><h2>${esc(c)}</h2><span class="ov-dots">${dots}</span></header>` +
      `<div class="ov-chips">${sorted.map(chip).join('')}</div></article>`;
  }).join('');

  const date = updated ? new Date(updated + 'T00:00:00').toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-US') : '';
  document.getElementById('ovFooter').textContent =
    `AWS vs. T Cloud Public (${t.formerly})${date ? ' · ' + t.updated + ' ' + date : ''} · ${t.ai}`;
}

// Dark mode (shared preference with the main page)
let dark = localStorage.getItem('tcp-dark') !== null ? localStorage.getItem('tcp-dark') === '1' : matchMedia('(prefers-color-scheme: dark)').matches;
function applyDark() {
  document.body.classList.toggle('dark', dark);
  document.getElementById('ovDark').textContent = dark ? '☀️' : '🌙';
}
document.getElementById('ovDark').addEventListener('click', () => { dark = !dark; localStorage.setItem('tcp-dark', dark ? '1' : '0'); applyDark(); });
document.getElementById('ovPrint').addEventListener('click', () => window.print());
document.querySelectorAll('.ov-lang button').forEach(b => b.addEventListener('click', () => {
  lang = b.dataset.lang; localStorage.setItem('tcp-lang', lang); render();
}));
applyDark();

(async () => {
  try {
    const cb = '?v=' + Date.now();
    const idx = await fetch('../services/index.json' + cb).then(r => r.json());
    data = (await Promise.all(idx.map(f => fetch('../services/' + f + cb).then(r => r.json())))).flat();
    updated = await fetch('../services/meta.json' + cb).then(r => r.json()).then(m => m.updated).catch(() => null);
    render();
  } catch (e) {
    console.error(e);
    document.getElementById('ovGrid').textContent = '❌ ' + e.message;
  }
})();
