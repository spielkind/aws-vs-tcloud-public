#!/usr/bin/env python3
"""Download T Cloud Public roadmap + release notes and convert them to greppable text.
Writes to ./.sources/ (gitignored):
  roadmap-items.txt   category | product | type(new/release/EOL) | start→end month | title | tooltip
  release-notes.txt   date | title + description (all RSS items, newest first)
Run from repo root: python3 tools/fetch_sources.py"""
import html, os, re, urllib.request, xml.etree.ElementTree as ET
from email.utils import parsedate_to_datetime

OUT = '.sources'
os.makedirs(OUT, exist_ok=True)
open(f'{OUT}/.gitignore', 'w').write('*\n')  # keep downloaded sources out of git


def get(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60).read().decode('utf-8')


def text(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


# Release notes (RSS contains the full history)
rss = ET.fromstring(get('https://www.t-cloud-public.com/en/support/release-notes.rss.xml'))
with open(f'{OUT}/release-notes.txt', 'w') as f:
    for i in rss.findall('.//item'):
        d = parsedate_to_datetime(i.findtext('pubDate')).date()
        f.write(f"## {d} | {i.findtext('title').strip()}\n{text(i.findtext('description') or '')}\n\n")

# Roadmap: grid columns are named q<month><year> (q4 2027 = April 2027)
page = get('https://www.t-cloud-public.com/en/products-services/roadmap')
updated = re.search(r'Last updated:\s*([\d/]+)', text(page))
M = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()


def month(q):
    m = re.match(r'q(\d+)(\d{4})$', q)
    return f'{M[int(m.group(1)) - 1]}-{m.group(2)}' if m else q


tips = {tid: text(body) for tid, body in re.findall(r'id="([0-9a-f-]{36})-tooltip"[^>]*>(.*?)</div>\s*</div>', page, re.S)}
rows, cat = [], ''
for blk in re.split(r'(?=<div class="roadmap-category">)|(?=<div class="roadmap-product">)', page):
    c = re.search(r'class="category-title">([^<]+)', blk)
    if c:
        cat = text(c.group(1))
    p = re.search(r'class="product-name"[^>]*>([^<]+)', blk)
    if not p:
        continue
    for lid, typ, st, en, title in re.findall(r'<li id="([0-9a-f-]{36})" class="release" data-type="(\w+)" style="grid-column-start: ([\w-]+?)-start;grid-column-end: ([\w-]+?)-end;".*?<span class="release-title"[^>]*>(.*?)</span></div>', blk, re.S):
        title = re.sub(r'<span class="status">[^<]*</span>', '', title)
        rows.append(f'{cat} | {text(p.group(1))} | {typ} | {month(st)}→{month(en)} | {text(title)} | {tips.get(lid, "")}')
with open(f'{OUT}/roadmap-items.txt', 'w') as f:
    f.write(f"# Roadmap last updated: {updated.group(1) if updated else '?'}\n" + '\n'.join(rows) + '\n')
print(f'{len(rss.findall(".//item"))} release notes, {len(rows)} roadmap items (updated {updated.group(1) if updated else "?"}) -> {OUT}/')
