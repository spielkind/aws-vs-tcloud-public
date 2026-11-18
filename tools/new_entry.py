#!/usr/bin/env python3
"""Scaffold a new comparison entry with all required keys (values marked TODO).
Usage (repo root):
  python3 tools/new_entry.py "Amazon Example" --category Storage [--file storage.json] [--tcp-only]
- Picks the file whose entries already use the category (or --file; new files are added to index.json).
- Refuses duplicates (name or alias already present).
Fill in every TODO, then run tools/validate.py (it fails while TODOs remain)."""
import argparse, json, os, sys

ap = argparse.ArgumentParser()
ap.add_argument('name', help='AWS service name (or T Cloud Public service name with --tcp-only)')
ap.add_argument('--category', required=True)
ap.add_argument('--file', help='target services/<file>.json')
ap.add_argument('--tcp-only', action='store_true', help='T Cloud Public service without AWS counterpart')
a = ap.parse_args()

index = json.load(open('services/index.json'))
data = {f: json.load(open('services/' + f)) for f in index}
for f, d in data.items():
    for s in d:
        if a.name.lower() in [s['name'].lower()] + [x.lower() for x in s.get('aliases', [])]:
            sys.exit(f'"{a.name}" already exists in services/{f} ({s["name"]})')

target = a.file or next((f for f, d in data.items() if any(s['category'] == a.category for s in d)), None)
if not target:
    sys.exit(f'No file uses category "{a.category}" yet – pass --file <new>.json')
if target not in index:
    index.append(target)
    data[target] = []
    json.dump(index, open('services/index.json', 'w'), indent=2)
    open('services/index.json', 'a').write('\n')

T = 'TODO'
L = lambda: {'de': T, 'en': T}
entry = {
    'name': a.name, 'category': a.category,
    'effort': None if a.tcp_only else T,                 # easy | medium | hard (null for tcpOnly)
    'equiv': 'tcpOnly' if a.tcp_only else T,             # full | partial | none | tcpOnly
    'tcp': a.name if a.tcp_only else T,                  # T Cloud Public service name ("Kein Equivalent" if none)
    'tfAws': None if a.tcp_only else T, 'tfTcp': None, 'tfStatus': T,   # tfStatus: full | partial | none
    'docsAws': None if a.tcp_only else T, 'docsTcp': T,
    'tfDocsAws': None if a.tcp_only else T, 'tfDocsTcp': None,
    'desc': L(),          # AWS service (for tcpOnly: why there is no AWS counterpart)
    'tcpDesc': L(),       # T Cloud Public counterpart incl. status/regions/roadmap dates
    'alt': None,
    'migration': None if a.tcp_only else L(),            # "**Title.** text" sections
    'equivNote': None,    # required for partial
    'tfNote': None,
}
data[target].append(entry)
json.dump(data[target], open('services/' + target, 'w'), ensure_ascii=False, indent=2)
open('services/' + target, 'a').write('\n')
print(f'Added skeleton "{a.name}" to services/{target} – replace all TODO values (null = not applicable).')
