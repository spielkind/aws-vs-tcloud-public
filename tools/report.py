#!/usr/bin/env python3
"""Refresh report: what needs attention after `tools/fetch_sources.py`.
Sections:
  1. Service description services (chapter 3) not found in any entry's `tcp`/`aliases`
  2. Release notes newer than services/meta.json "updated" (to review one by one)
  3. Roadmap bars whose title is not mentioned anywhere in the data (heuristic)
  4. Roadmap/date claims in the data (cross-check against .sources/roadmap-items.txt)
  5. Terraform provider releases since that date (new resources → tfTcp/tfStatus/tfNote)
  6. Provider resources not referenced in any entry, grouped by service prefix
Run from repo root: python3 tools/report.py [--since YYYY-MM-DD] > .sources/report.md"""
import argparse, json, re, sys

SRC = '.sources'
ap = argparse.ArgumentParser()
ap.add_argument('--since', help='release notes after this date (default: services/meta.json updated)')
args = ap.parse_args()

entries = [s for f in json.load(open('services/index.json')) for s in json.load(open('services/' + f))]
names = ' | '.join(((s['tcp'] or '') + ' ' + ' '.join(s.get('aliases', []))).lower() for s in entries)
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
    if not mentioned(title, names):
        print(f'- {num} {title}')

print(f'\n## 2. Release notes after {since}')
for date, title in re.findall(r'^## (\d{4}-\d{2}-\d{2}) \| (.+)$', open(f'{SRC}/release-notes.txt').read(), re.M):
    if date > since:
        print(f'- {date} {title}')

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

print('\n## 6. Provider resources not referenced in any entry (by prefix) – is a tfStatus/tfTcp too pessimistic?')
used = set(re.findall(r'opentelekomcloud_(\w+)', ' '.join(s['tfTcp'] or '' for s in entries)))
groups = {}
for r in open(f'{SRC}/terraform-resources.txt').read().split():
    if r not in used:
        groups.setdefault(r.split('_')[0], []).append(r)
for prefix, rs in sorted(groups.items()):
    print(f'- {prefix}: ' + ', '.join(rs))
