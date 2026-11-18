#!/usr/bin/env python3
"""Refresh report: what needs attention after `tools/fetch_sources.py`.
Sections:
  1. Service description services (chapter 3) not found in any entry's `tcp`/`aliases`
  2. Release notes newer than services/meta.json "updated" (to review one by one)
  3. Roadmap bars whose title is not mentioned anywhere in the data (heuristic)
  4. Roadmap/date claims in the data (cross-check against .sources/roadmap-items.txt)
  5. Terraform provider releases since that date (new resources → tfTcp/tfStatus/tfNote)
  6. Provider resources not referenced in any entry, grouped by service prefix (NEW PREFIX = no entry uses it)
  7. Docs repos (github.com/opentelekomcloud-docs) without entry
  8. Product pages (t-cloud-public.com core services) without entry
Sections 7/8 skip decisions recorded in tools/known_sources.json.
Run from repo root: python3 tools/report.py [--since YYYY-MM-DD] > .sources/report.md"""
import argparse, json, re, sys

SRC = '.sources'
ap = argparse.ArgumentParser()
ap.add_argument('--since', help='release notes after this date (default: services/meta.json updated)')
args = ap.parse_args()

entries = [s for f in json.load(open('services/index.json')) for s in json.load(open('services/' + f))]
# one string per entry: a service must match within a single entry's tcp/aliases
names = [((s['tcp'] or '') + ' ' + ' '.join(s.get('aliases', []))).lower() for s in entries]
full = ' '.join(json.dumps(s, ensure_ascii=False) for s in entries).lower()
since = args.since or json.load(open('services/meta.json'))['updated']


def norm(t):
    t = re.sub(r'\(former[^)]*\)|\(.*?\)', ' ', t.lower())
    return re.sub(r'[^a-z0-9 ]+', ' ', t).split()


def mentioned(title, hay):
    words = [w for w in norm(title) if len(w) > 2 and w not in {'and', 'the', 'for', 'new', 'support', 'service', 'services', 'version'}]
    # prefix match tolerates plural/suffix variants (Balancer/Balance, Containers/Container)
    return bool(words) and sum(w[:6] in hay for w in words) / len(words) >= 0.75


try:
    sd = open(f'{SRC}/pdf/servicedescription-en.txt').read()
except FileNotFoundError:
    sys.exit('Run `python3 tools/fetch_sources.py` first (with pypdf installed for PDF text).')

print(f'# Refresh report (release notes since {since})\n')
print('## 1. Service description services without entry (check: new service? renamed? only a sub-feature?)')
toc = sd[:sd.find('4.1 ')] if '4.1 ' in sd else sd[:15000]
skip = re.compile(r'flavors|images|instance types|high availability|license|licen[cs]ing|general provisions|special conditions|agreement|consulting|modes and metrics|flow log|projects$|seller|for customers|certification', re.I)
for num, title in re.findall(r'^(3\.\d+\.\d+)\s+(.+?)\s+\d+$', toc, re.M):
    if skip.search(title):
        continue
    if not any(mentioned(title, n) for n in names):
        print(f'- {num} {title}')

print(f'\n## 2. Release notes after {since} (★ = launch/beta/EOL – new service or status change?)')
for date, title in re.findall(r'^## (\d{4}-\d{2}-\d{2}) \| (.+)$', open(f'{SRC}/release-notes.txt').read(), re.M):
    if date > since:
        launch = re.search(r'\bNEW\b|available|availability|decommission|\bGA\b|release of|launch|public beta|end of (life|sale)|EOL|EOS', title, re.I)
        print(f'- {"★ " if launch else ""}{date} {title}')

print('\n## 3. Roadmap bars not mentioned in the data (heuristic – decide per item)')
for line in open(f'{SRC}/roadmap-items.txt'):
    if line.startswith('#') or line.count(' | ') < 4:
        continue
    cat, prod, typ, when, title = [x.strip() for x in line.split(' | ')[:5]]
    if not mentioned(title, full):
        print(f'- [{typ}] {prod}: {title} ({when})')

print('\n## 4. Roadmap/date claims in the data (verify against roadmap-items.txt)')
for s in entries:
    for k in ('tcpDesc', 'equivNote', 'tfNote', 'migration'):
        v = s.get(k)
        if not v:
            continue
        for m in re.finditer(r'[^.;]*\b(Roadmap|geplant|expected|erwartet)\b[^.;]*', v['de']):
            print(f'- {s["name"]} ({k}): {m.group(0).strip()[:200]}')

print(f'\n## 5. Terraform provider (opentelekomcloud) releases after {since} – check [Feat]/new resources')
rel = open(f'{SRC}/terraform-releases.txt').read()
for date, tag, body in re.findall(r'^## (\S+) \| (\S+)\n(.*?)(?=^## |\Z)', rel, re.M | re.S):
    if date > since:
        feats = [l for l in body.splitlines() if re.search(r'feat|add|new|resource|deprecat', l, re.I) and not re.search(r'^- \[?fix', l, re.I)]
        print(f'- {date} {tag}' + ''.join(f'\n  {l}' for l in feats))

known = json.load(open('tools/known_sources.json'))
print('\n## 6. Provider resources not referenced in any entry (by prefix) – is a tfStatus/tfTcp too pessimistic?')
used = set(re.findall(r'opentelekomcloud_(\w+)', ' '.join(s['tfTcp'] or '' for s in entries)))
groups = {}
for r in open(f'{SRC}/terraform-resources.txt').read().split():
    if r not in used:
        groups.setdefault(r.split('_')[0], []).append(r)
used_prefixes = {r.split('_')[0] for r in used}
for prefix, rs in sorted(groups.items(), key=lambda kv: (kv[0] in used_prefixes, kv[0])):
    flag = '' if prefix in used_prefixes or prefix in known['terraform_prefixes'] else ' ⚠ NEW PREFIX – new service?'
    print(f'- {prefix}{flag}: ' + ', '.join(rs))

slugs = {s['docsTcp'].split('docs.otc.t-systems.com/')[1].split('/')[0] for s in entries if 'docs.otc.t-systems.com/' in (s['docsTcp'] or '')}
print('\n## 7. Docs repos without entry – new service? (record decisions in tools/known_sources.json)')
for r in open(f'{SRC}/docs-repos.txt').read().split():
    if r not in slugs and r not in known['docs_repos']:
        print(f'- {r} (https://github.com/opentelekomcloud-docs/{r})')

print('\n## 8. Product pages without entry – new service? (record decisions in tools/known_sources.json)')
for p in open(f'{SRC}/products.txt').read().split():
    if p not in known['products'] and p not in slugs and not any(mentioned(p.replace('-', ' '), n) for n in names):
        print(f'- {p} (https://www.t-cloud-public.com/en/products-services/core-services/{p})')
