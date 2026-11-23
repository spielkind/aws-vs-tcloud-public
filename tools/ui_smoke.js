#!/usr/bin/env node
// UI smoke test for the static site (main page, overview, Oracle page).
// Setup (once, git-ignored):  npm i --no-save --prefix .sources/node playwright-core
// Run (repo root, server running: python3 -m http.server 8765):
//   NODE_PATH=.sources/node/node_modules node tools/ui_smoke.js [baseUrl]
// Uses the locally installed Google Chrome (channel "chrome"). Exits 1 on any failure.
const { chromium } = require('playwright-core');
const base = (process.argv[2] || 'http://localhost:8765/').replace(/\/?$/, '/');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const fails = [];
  const check = (ok, msg) => { if (!ok) fails.push(msg); console.log(`${ok ? '✓' : '✗'} ${msg}`); };
  const page = async (opts = {}) => {
    const p = await browser.newPage(opts);
    p.on('pageerror', e => fails.push('pageerror: ' + e.message));
    p.on('console', m => { if (m.type() === 'error') fails.push('console: ' + m.text()); });
    return p;
  };

  // Main page
  const p = await page({ viewport: { width: 1280, height: 900 } });
  await p.goto(base + '?lang=de'); await p.waitForSelector('.card');
  const total = await p.$$eval('.card', c => c.length);
  check(total > 50, `main: ${total} cards`);
  check(/Stand: \d/.test(await p.textContent('#genDate')), 'main: footer shows data date');
  check((await p.$eval('.toolbar', e => e.offsetHeight)) <= 60, 'main: toolbar on one line at 1280 px');
  await p.click('#catToggle'); await p.click('#catPills .pill');
  check((await p.$$eval('.card', c => c.length)) < total, 'main: category dropdown filters');
  await p.keyboard.press('Escape');
  check(await p.evaluate(() => document.activeElement.id === 'catToggle'), 'main: Escape returns focus to dropdown');
  await p.goto(base + '?eq=tcpOnly'); await p.waitForSelector('.card');
  const only = await p.$$eval('.card', c => [c.length, c.filter(x => x.classList.contains('tcp-only')).length]);
  check(only[0] >= 1 && only[0] === only[1] && only[0] < total, `main: "T Cloud Public only" filter (${only[0]} cards, all tcp-only)`);
  await p.goto(base); await p.waitForSelector('.card');
  await p.fill('#searchBox', 'kafka');
  const hits = await p.$$eval('.card .card-name', c => c.map(x => x.textContent));
  check(hits.length >= 2 && hits.length < total && hits.includes('Amazon MSK'), `main: search "kafka" (${hits.length} hits incl. Amazon MSK)`);
  await p.fill('#searchBox', ''); await p.dispatchEvent('#searchBox', 'input');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.evaluate(() => exportCSV())]);
  check(dl.suggestedFilename().endsWith('.csv'), 'main: CSV export');
  const pdfLen = await p.evaluate(() => { let h = ''; const o = window.open; window.open = () => ({ document: { write: x => h = x, close() {} }, print() {} }); exportPDF(); window.open = o; return h.length; });
  check(pdfLen > 5000, 'main: PDF export renders');
  check(!/\bOTC\b/.test(await p.evaluate(() => document.body.innerText)), 'main: no "OTC" branding');

  // Mobile sheet + dark mode
  const m = await page({ viewport: { width: 390, height: 844 } });
  await m.addInitScript(() => localStorage.setItem('tcp-dark', '1'));
  await m.goto(base + '?lang=en'); await m.waitForSelector('.card');
  check(await m.evaluate(() => document.body.classList.contains('dark')), 'mobile: dark mode');
  await m.click('#filterFab');
  await m.waitForSelector('#bottomSheet.open #sheetCats .pill', { state: 'visible', timeout: 5000 }).catch(() => {});
  check(await m.evaluate(() => document.getElementById('bottomSheet').classList.contains('open') && document.querySelectorAll('#sheetCats .pill').length > 0), 'mobile: filter sheet opens with categories');

  // Overview
  const o = await page({ viewport: { width: 1440, height: 900 } });
  await o.goto(base + 'overview/?lang=de'); await o.waitForSelector('.ov-chip');
  const chips = await o.$$eval('.ov-chip', c => c.length);
  check(chips === total, `overview: ${chips} chips = ${total} cards`);
  check(await o.$$eval('.ov-tile', t => t.every(x => x.querySelector('.ov-icon').textContent !== '🧩')), 'overview: every category has an icon');
  const target = await o.$eval('.ov-chip', a => decodeURIComponent(new URL(a.href).hash.slice(1)));
  await o.click('.ov-chip');
  const opened = await o.waitForFunction(id => { const c = document.getElementById(id); return c && c.classList.contains('expanded'); }, target, { timeout: 10000 }).then(() => true, () => false);
  check(opened, `overview: chip opens detail card #${target}`);

  // Oracle page
  const r = await page();
  await r.goto(base + 'oracle-managed/');
  check(/T Cloud Public/.test(await r.title()), 'oracle: page loads');

  await browser.close();
  console.log(fails.length ? `\nFAILED (${fails.length}):\n- ` + fails.join('\n- ') : '\nOK');
  process.exit(fails.length ? 1 : 0);
})();
