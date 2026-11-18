// ===================================================
// export.js — PDF and CSV export
// ===================================================

/** Localized effort label ('' for entries without AWS counterpart) */
function effortLabel(s, t) {
  return s.effort === 'easy' ? t.easy : s.effort === 'medium' ? t.med : s.effort === 'hard' ? t.hard : '';
}

/** Effort pill class for PDF export */
function effortPill(s) {
  return s.effort === 'easy' ? 'pill-e' : s.effort === 'medium' ? 'pill-m' : s.effort === 'hard' ? 'pill-h' : 'pill-t';
}

/** Localized equivalence label */
function equivLabel(s, t) {
  return { full: t.eqFull, partial: t.eqPartial, none: t.eqNone, tcpOnly: t.eqTcpOnly }[s.equiv] || '';
}

/** Export filtered services as CSV */
function exportCSV() {
  const t = T[state.lang];
  const sep = ';';
  const headers = [
    'Service', 'Category', t.equiv, t.desc, 'T Cloud Public', t.tcpE, t.alt,
    'TF AWS', 'TF T Cloud Public', 'TF Status', t.eff, t.mig,
    'AWS Docs', 'T Cloud Public Docs', 'TF AWS Link', 'TF T Cloud Public Link'
  ];

  const esc = v => {
    v = String(v || '');
    return v.includes(sep) || v.includes('"') || v.includes('\n')
      ? '"' + v.replace(/"/g, '""') + '"' : v;
  };

  let csv = '\uFEFF' + headers.map(esc).join(sep) + '\n';

  getFiltered().forEach(s => {
    const d = loc(s, 'desc');
    const od = loc(s, 'tcpDesc');
    const alt = loc(s, 'alt');
    const mig = loc(s, 'migration');
    const ef = effortLabel(s, t);
    const ts = s.tfStatus === 'full' ? t.full : s.tfStatus === 'partial' ? t.partial : t.none;

    csv += [
      s.name, s.category, equivLabel(s, t), d || '', s.tcp, od || '', alt || '',
      s.tfAws || '', s.tfTcp || '', ts, ef, mig || '',
      s.docsAws || '', s.docsTcp || '',
      s.tfDocsAws || '', s.tfDocsTcp || ''
    ].map(esc).join(sep) + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aws-vs-tcloud-public.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** Export filtered services as printable PDF (opens in new window) */
function exportPDF() {
  const t = T[state.lang];
  const filt = getFiltered();
  const sorted = [...filt].sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );

  const ec = filt.filter(s => s.effort === 'easy').length;
  const mc = filt.filter(s => s.effort === 'medium').length;
  const hc = filt.filter(s => s.effort === 'hard').length;
  const pct = n => (filt.length ? n / filt.length * 100 : 0).toFixed(0);

  // PDF styles
  let h = `<html><head><meta charset="utf-8"><title>AWS vs. T Cloud Public</title>
<style>
@page { margin: 20mm 15mm; size: A4; }
* { box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 10px; color: #333; margin: 0; padding: 0; line-height: 1.5; }
.cover { text-align: center; padding: 60px 40px; page-break-after: always; }
.cover h1 { font-size: 36px; color: #1a1a2e; margin: 0; letter-spacing: -1px; }
.cover h1 span { color: #E20074; }
.cover .sub { font-size: 16px; color: #666; margin: 8px 0 30px; }
.cover .date { font-size: 12px; color: #999; margin-top: 40px; }
.cover .bar { height: 4px; background: linear-gradient(90deg, #28a745 ${pct(ec)}%, #f0ad4e ${pct(ec)}% ${pct(ec + mc)}%, #dc3545 ${pct(ec + mc)}% ${pct(ec + mc + hc)}%, #E20074 ${pct(ec + mc + hc)}%); border-radius: 2px; margin: 20px auto; max-width: 400px; }
.stats { display: flex; justify-content: center; gap: 30px; margin: 20px 0; }
.stat { text-align: center; }
.stat .num { font-size: 28px; font-weight: 800; }
.stat .lbl { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 1px; }
.stat.s-e .num { color: #28a745; }
.stat.s-m .num { color: #f0ad4e; }
.stat.s-h .num { color: #dc3545; }
.stat.s-t .num { color: #E20074; }
.toc { page-break-after: always; padding: 10px 0; }
.toc h2 { color: #E20074; font-size: 16px; border-bottom: 2px solid #E20074; padding-bottom: 4px; margin-bottom: 12px; }
.ov-tbl { width: 100%; border-collapse: collapse; font-size: 9px; }
.ov-tbl th { text-align: left; padding: 4px 6px; border-bottom: 2px solid #E20074; color: #E20074; font-size: 8px; text-transform: uppercase; letter-spacing: .5px; }
.ov-tbl td { padding: 3px 6px; border-bottom: 1px solid #eee; font-size: 9px; }
.ov-tbl .ov-cat td { font-weight: 700; color: #1a1a2e; background: #f8f8f8; padding: 5px 6px; border-bottom: 1px solid #ddd; }
.pill-e { background: #d4edda; color: #155724; } .pill-t { background: #fce4f0; color: #E20074; } .pill-m { background: #fff3cd; color: #856404; } .pill-h { background: #f8d7da; color: #721c24; }
.cat-title { color: #E20074; font-size: 14px; font-weight: 700; border-bottom: 2px solid #E20074; padding: 6px 0 4px; margin: 16px 0 8px; page-break-after: avoid; }
.svc { border: 1px solid #e0e0e0; border-radius: 6px; padding: 10px 12px; margin-bottom: 8px; page-break-inside: avoid; border-left: 4px solid #E20074; }
.svc.tcp-only { border-left-color: #E20074; } .svc.easy { border-left-color: #28a745; } .svc.medium { border-left-color: #f0ad4e; } .svc.hard { border-left-color: #dc3545; }
.svc-head { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
.svc-name { font-size: 12px; font-weight: 700; color: #1a1a2e; }
.svc-tcp { font-size: 10px; color: #E20074; font-weight: 600; }
.svc-row { display: grid; grid-template-columns: 80px 1fr; gap: 2px 8px; font-size: 9px; margin: 3px 0; }
.svc-row .lab { font-weight: 600; color: #E20074; }
.tf { font-family: 'Courier New', monospace; background: #f0f0f0; padding: 1px 4px; border-radius: 2px; font-size: 8px; }
.mig { margin-top: 6px; font-size: 9px; color: #444; }
.mig-wrap { background: #f8f5f0; border: 1px solid #e0d8cc; border-radius: 5px; padding: 6px 8px; margin-top: 4px; font-size: 9px; line-height: 1.6; }
.mig-section { margin-bottom: 4px; } .mig-section:last-child { margin-bottom: 0; }
.mig-title { font-weight: 700; color: #E20074; font-size: 9px; margin-bottom: 1px; }
.mig-text { color: #444; font-size: 9px; line-height: 1.6; }
.mig-ul { margin: 1px 0 0; padding: 0 0 0 12px; font-size: 9px; color: #444; } .mig-ul li { margin: 1px 0; }
code { background: #eee; padding: 0 3px; border-radius: 2px; font-family: 'Courier New', monospace; font-size: 8px; }
.footer { text-align: center; color: #999; font-size: 8px; margin-top: 20px; padding-top: 8px; border-top: 1px solid #eee; }
</style></head><body>`;

  // Cover page
  const dateStr = state.updated
    ? t.updated + ' ' + fmtUpdated({ year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  h += `<div class="cover">` +
    `<h1>AWS vs. <span>T Cloud Public</span></h1>` +
    `<div class="sub">${t.sub.replace('{n}', filt.length)}</div>` +
    `<div class="bar"></div>` +
    `<div class="stats">` +
      `<div class="stat s-e"><div class="num">${ec}</div><div class="lbl">${t.easy}</div></div>` +
      `<div class="stat s-m"><div class="num">${mc}</div><div class="lbl">${t.med}</div></div>` +
      `<div class="stat s-h"><div class="num">${hc}</div><div class="lbl">${t.hard}</div></div>` +
      `<div class="stat s-t"><div class="num">${filt.length}</div><div class="lbl">${t.total}</div></div>` +
    `</div>` +
    `<div class="date">${dateStr}</div>` +
  `</div>`;

  // Overview table
  h += `<div class="toc"><h2>${state.lang === 'de' ? 'Übersicht' : 'Overview'}</h2>` +
    `<table class="ov-tbl"><thead><tr>` +
    `<th>AWS</th><th>T Cloud Public</th><th>${state.lang === 'de' ? 'Aufwand' : 'Effort'}</th><th>Terraform</th>` +
    `</tr></thead><tbody>`;

  let ovCat = '';
  sorted.forEach(s => {
    const ef = effortLabel(s, t);
    const pc = effortPill(s);
    const ts = s.tfStatus === 'full' ? '✓' : s.tfStatus === 'partial' ? '◐' : '✗';
    if (s.category !== ovCat) {
      h += `<tr class="ov-cat"><td colspan="4">${s.category}</td></tr>`;
      ovCat = s.category;
    }
    h += `<tr><td>${s.equiv === 'tcpOnly' ? '—' : s.name}</td><td>${s.equiv === 'none' ? '—' : s.tcp}</td><td><span class="pill ${pc}">${ef}</span></td><td>${ts}</td></tr>`;
  });
  h += '</tbody></table></div>';

  // Service detail pages
  let pdfCat = '';
  sorted.forEach(s => {
    if (s.category !== pdfCat) {
      h += `<div class="cat-title">${s.category}</div>`;
      pdfCat = s.category;
    }

    const d = loc(s, 'desc') || '';
    const od = loc(s, 'tcpDesc') || '';
    const alt = loc(s, 'alt');
    const mig = loc(s, 'migration');
    const ef = effortLabel(s, t);
    const ts = s.tfStatus === 'full' ? t.full : s.tfStatus === 'partial' ? t.partial : t.none;
    const pc = effortPill(s);

    h += `<div class="svc ${s.effort || 'tcp-only'}">` +
      `<div class="svc-head">` +
        `<span class="svc-name">${s.name}</span>` +
        (s.equiv === 'none' || s.equiv === 'tcpOnly' ? '' : `<span class="svc-tcp">→ ${s.tcp}</span>`) +
        `<span class="pill ${pc}">${s.equiv === 'tcpOnly' ? t.eqTcpOnly : ef}</span>` +
      `</div>` +
      `<div class="svc-row"><span class="lab">${t.desc}</span><span>${d}</span></div>` +
      `<div class="svc-row"><span class="lab">${t.tcpE}</span><span>${od}</span></div>` +
      (alt ? `<div class="svc-row"><span class="lab">${t.alt}</span><span>${alt}</span></div>` : '') +
      `<div class="svc-row"><span class="lab">${t.tf}</span><span><span class="tf">${s.tfAws || '—'}</span> → <span class="tf">${s.tfTcp || '—'}</span> (${ts})</span></div>` +
      `<div class="mig">${fmtMig(mig)}</div>` +
    `</div>`;
  });

  h += `<div class="footer">AWS vs. T Cloud Public | T Cloud Public ${t.formerly}${state.updated ? ' | ' + t.updated + ' ' + fmtUpdated() : ''}</div></body></html>`;

  const w = window.open('', '_blank');
  w.document.write(h);
  w.document.close();
  setTimeout(() => w.print(), 600);
}
