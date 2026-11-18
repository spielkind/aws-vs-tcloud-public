#!/usr/bin/env python3
"""Download all T Cloud Public sources and convert them to greppable text.
Writes to ./.sources/ (git-ignored):
  roadmap-items.txt   category | product | type(new/release/EOL) | start→end month | title | description
                      + undated tooltip-only items
  release-notes.txt   date | title + description (all RSS items, newest first)
  terraform-releases.txt   opentelekomcloud provider releases (date | tag | changelog lines)
  terraform-resources.txt  all resource types of the provider (docs/resources)
  docs-repos.txt      non-archived repos of github.com/opentelekomcloud-docs
  products.txt        product page slugs from t-cloud-public.com/en/products-services/core-services
  pdf/*.pdf + *.txt   current service description (EN), Leistungsbeschreibung (DE), Managed Services PDF
                      (links taken from the live site; text extraction needs `pypdf`: pip install pypdf)
Run from repo root: python3 tools/fetch_sources.py"""
import html, json, os, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
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

# Roadmap: grid columns are named q<month><year> (q4 2027 = April 2027); numeric starts (e.g. 1)
# mean the bar starts before the visible timeline (already running).
page = get('https://www.t-cloud-public.com/en/products-services/roadmap')
updated = re.search(r'Last updated:\s*([\d/]+)', text(page))
M = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()


def month(col):
    col = re.sub(r'-(start|end)$', '', col.strip())
    m = re.match(r'q(\d+)(\d{4})$', col)
    if m:
        return f'{M[int(m.group(1)) - 1]}-{m.group(2)}'
    return 'ongoing' if col.isdigit() else col


# Tooltips: <span class="tooltip" id="<id>-tooltip"><span class="title">..</span><span class="description">..</span><span data-popper-arrow>
tips = {tid: (text(title), text(desc)) for tid, title, desc in re.findall(
    r'id="([0-9a-f-]{36})-tooltip"><span class="title">(.*?)</span><span class="description">(.*?)<span data-popper-arrow', page, re.S)}
release_ids = re.findall(r'<li id="([0-9a-f-]{36})" class="release"', page)
rows, used, cat = [], set(), ''
for blk in re.split(r'(?=<div class="roadmap-category">)|(?=<div class="roadmap-product">)', page):
    c = re.search(r'class="category-title">([^<]+)', blk)
    if c:
        cat = text(c.group(1))
    p = re.search(r'class="product-name"[^>]*>([^<]+)', blk)
    if not p:
        continue
    for lid, typ, st, en, title in re.findall(r'<li id="([0-9a-f-]{36})" class="release" data-type="(\w+)" style="grid-column-start: ([^;]+);grid-column-end: ([^;]+);".*?<span class="release-title"[^>]*>(.*?)</span></div>', blk, re.S):
        used.add(lid)
        title = re.sub(r'<span class="status">[^<]*</span>', '', title)
        rows.append(f'{cat} | {text(p.group(1))} | {typ} | {month(st)}→{month(en)} | {text(title)} | {tips.get(lid, ("", ""))[1]}')
missing = [i for i in release_ids if i not in used]
tooltip_only = [f'{t} | {d}' for tid, (t, d) in tips.items() if tid not in used]
with open(f'{OUT}/roadmap-items.txt', 'w') as f:
    f.write(f"# Roadmap last updated: {updated.group(1) if updated else '?'}\n"
            '# category | product | type (new/release/EOL) | start→end month | title | description\n'
            + '\n'.join(rows)
            + '\n\n# Tooltip-only items (no timeline bar – undated announcements or past items, check manually)\n'
            + '\n'.join(tooltip_only) + '\n')
print(f'{len(rss.findall(".//item"))} release notes, {len(rows)}/{len(release_ids)} roadmap bars, '
      f'{len(tooltip_only)} tooltip-only items (updated {updated.group(1) if updated else "?"}) -> {OUT}/')
if missing or not rows or not tips:
    raise SystemExit(f'Roadmap parsing incomplete: {len(missing)} bars not parsed, {len(tips)} tooltips – check HTML structure')


# Terraform provider (GitHub API; set GITHUB_TOKEN to avoid rate limits)
def gh_api(path):
    hdr = {'User-Agent': 'Mozilla/5.0', 'Accept': 'application/vnd.github+json'}
    if os.environ.get('GITHUB_TOKEN'):
        hdr['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
    return json.loads(urllib.request.urlopen(urllib.request.Request('https://api.github.com/' + path, headers=hdr), timeout=60).read())


REPO = 'repos/opentelekomcloud/terraform-provider-opentelekomcloud'
rels = gh_api(f'{REPO}/releases?per_page=100')
with open(f'{OUT}/terraform-releases.txt', 'w') as f:
    for r in rels:
        lines = [re.sub(r'^\*\s*[0-9a-f]{40}\s*', '- ', l.strip()) for l in (r.get('body') or '').splitlines() if l.strip().startswith('*')]
        f.write(f"## {r['published_at'][:10]} | {r['tag_name']}\n" + '\n'.join(lines) + '\n\n')
resources = sorted(x['name'][:-3] for x in gh_api(f'{REPO}/contents/docs/resources') if x['name'].endswith('.md'))
open(f'{OUT}/terraform-resources.txt', 'w').write('\n'.join(resources) + '\n')
print(f'terraform provider: latest {rels[0]["tag_name"]} ({rels[0]["published_at"][:10]}), {len(resources)} resources')


SITE = 'https://www.t-cloud-public.com'
# Docs repos (one per service) and product pages – used to detect new services
repos, page = [], 1
while True:
    batch = gh_api(f'orgs/opentelekomcloud-docs/repos?per_page=100&page={page}')
    repos += [r['name'] for r in batch if not r['archived']]
    if len(batch) < 100:
        break
    page += 1
open(f'{OUT}/docs-repos.txt', 'w').write('\n'.join(sorted(repos)) + '\n')
products = sorted(set(re.findall(r'href="/en/products-services/core-services/([a-z0-9-]+)"', get(f'{SITE}/en/products-services/core-services'))))
open(f'{OUT}/products.txt', 'w').write('\n'.join(products) + '\n')
print(f'{len(repos)} docs repos, {len(products)} product pages')


# PDFs: hash-based URLs change with every revision, so discover them on the live pages
PDF_PAGES = {
    'servicedescription-en': (f'{SITE}/en', r'servicedescription\.pdf'),
    'leistungsbeschreibung-de': (f'{SITE}/de', r'leistungsbeschreibung-tdg\.pdf'),
    'managed-services-de': (f'{SITE}/de/produkte-services/managed-services', r'managed-services[^"]*\.pdf'),
}
os.makedirs(f'{OUT}/pdf', exist_ok=True)
try:
    import pypdf
except ImportError:
    pypdf = None
for name, (page_url, pattern) in PDF_PAGES.items():
    links = [h for h in re.findall(r'href="([^"]+\.pdf)"', get(page_url)) if re.search(pattern, h)]
    if not links:
        raise SystemExit(f'No PDF matching {pattern} found on {page_url} – site structure changed?')
    url = urllib.parse.urljoin(page_url, links[0])
    data = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}), timeout=120).read()
    open(f'{OUT}/pdf/{name}.pdf', 'wb').write(data)
    note = 'text extraction skipped (pip install pypdf)'
    if pypdf:
        import io
        txt = '\n'.join(pg.extract_text() or '' for pg in pypdf.PdfReader(io.BytesIO(data)).pages)
        open(f'{OUT}/pdf/{name}.txt', 'w').write(f'# Source: {url}\n' + txt)
        rev = re.search(r'(Last revised|Stand):\s*([\d.]+)', txt)
        note = f'revision {rev.group(2) if rev else "?"}'
    print(f'{name}: {url} ({note})')
