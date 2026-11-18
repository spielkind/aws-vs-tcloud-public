#!/usr/bin/env python3
"""Check references in services/*.json.
- HTTP status of all docs/registry URLs (note: registry.terraform.io and docs.otc.t-systems.com
  always answer 200 - SPA / bot wall - so they are checked structurally below instead)
- opentelekomcloud_* / aws_* resource names and tf docs URLs exist in the provider repos
- docs.otc.t-systems.com/<slug> exists as repo in github.com/opentelekomcloud-docs
Requires: authenticated `gh` CLI. Run from repo root: python3 tools/check_links.py"""
import json, re, subprocess, sys, time, urllib.request, concurrent.futures as cf


def gh_lines(*args):
    return subprocess.run(['gh', 'api', *args], capture_output=True, text=True, check=True).stdout.split()


tcp_res = {n[:-3] for n in gh_lines('repos/opentelekomcloud/terraform-provider-opentelekomcloud/contents/docs/resources', '--paginate', '--jq', '.[].name')}
aws_res = {re.sub(r'\.(html\.)?markdown$', '', p.split('/')[-1]) for p in gh_lines('repos/hashicorp/terraform-provider-aws/git/trees/main?recursive=1', '--jq', '.tree[].path') if p.startswith('website/docs/r/')}
doc_repos = set(gh_lines('orgs/opentelekomcloud-docs/repos', '--paginate', '--jq', '.[] | select(.archived==false) | .name'))

errs, urls = [], set()
for f in json.load(open('services/index.json')):
    for s in json.load(open('services/' + f)):
        n = s['name']
        for r in re.findall(r'opentelekomcloud_(\w+)', s['tfTcp'] or ''):
            if r not in tcp_res: errs.append(f'{n}: unknown TCP resource {r}')
        for r in re.findall(r'\baws_(\w+)', s['tfAws'] or ''):
            if r not in aws_res: errs.append(f'{n}: unknown AWS resource {r}')
        for k, pre, res in (('tfDocsTcp', '/opentelekomcloud/latest/docs/resources/', tcp_res), ('tfDocsAws', '/aws/latest/docs/resources/', aws_res)):
            if s[k] and (pre not in s[k] or s[k].split(pre)[-1] not in res): errs.append(f'{n}: bad {k} {s[k]}')
        if s['docsTcp'] and 'docs.otc.t-systems.com/' in s['docsTcp']:
            slug = s['docsTcp'].split('docs.otc.t-systems.com/')[1].split('/')[0]
            if slug not in doc_repos: errs.append(f'{n}: docs slug without repo: {slug}')
        for k in ('docsAws', 'docsTcp', 'tfDocsAws', 'tfDocsTcp'):
            if s[k] and s[k].startswith('http'): urls.add(s[k])


def status(u, attempts=3):
    # docs.otc.t-systems.com sporadically answers 5xx – retry before reporting
    for i in range(attempts):
        try:
            return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=25).status, u
        except Exception as e:
            code = getattr(e, 'code', str(e)[:60])
            if isinstance(code, int) and code < 500:
                return code, u
            time.sleep(2 * (i + 1))
    return code, u


with cf.ThreadPoolExecutor(16) as ex:
    for code, u in ex.map(status, sorted(urls)):
        if code != 200: errs.append(f'HTTP {code}: {u}')
print(f'{len(urls)} URLs checked'); print('\n'.join(errs) or 'OK')
sys.exit(1 if errs else 0)
