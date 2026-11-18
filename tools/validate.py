#!/usr/bin/env python3
"""Validate services/*.json: schema, enums, both languages, no OTC branding, portfolio coverage.
Run from repo root: python3 tools/validate.py"""
import json,re,sys
KEYS=['name','category','effort','equiv','tcp','tfAws','tfTcp','tfStatus','docsAws','docsTcp','tfDocsAws','tfDocsTcp','desc','tcpDesc','alt','migration','equivNote','tfNote']
errs=[]; allS=[]
for f in json.load(open('services/index.json')):
    for s in json.load(open('services/'+f)):
        allS.append(s)
        for k in KEYS:
            if k not in s: errs.append(f"{s['name']}: missing {k}")
        extra=set(s)-set(KEYS)-{'aliases'}
        if extra: errs.append(f"{s['name']}: extra {extra}")
        if s['equiv'] not in ('full','partial','none','tcpOnly'): errs.append(f"{s['name']}: equiv")
        if s['tfStatus'] not in ('full','partial','none'): errs.append(f"{s['name']}: tfStatus")
        if s['equiv']=='tcpOnly':
            if s['effort'] is not None or s['migration'] is not None: errs.append(f"{s['name']}: tcpOnly effort/migration")
        elif s['effort'] not in ('easy','medium','hard'): errs.append(f"{s['name']}: effort")
        for k in ('desc','tcpDesc','alt','migration','equivNote','tfNote'):
            v=s[k]
            if v is not None and not (isinstance(v,dict) and v.get('de') and v.get('en')): errs.append(f"{s['name']}: {k} lang")
        if s['tfTcp'] and not s['tfDocsTcp']: errs.append(f"{s['name']}: tfDocsTcp missing")
        if 'TODO' in json.dumps(s, ensure_ascii=False): errs.append(f"{s['name']}: unfilled TODO (tools/new_entry.py skeleton)")
        for k in ('desc','tcpDesc','alt','migration','equivNote','tfNote','tcp'):
            v=s[k]; txt=' '.join(v.values()) if isinstance(v,dict) else (v or '')
            if re.search(r'\bOTC\b|Open Telekom Cloud',txt): errs.append(f"{s['name']}: OTC in {k}")
names=[s['name'] for s in allS]
dups={n for n in names if names.count(n)>1}
if dups: errs.append(f'dups {dups}')
# Portfolio coverage: every T Cloud Public service (service description chapter 3 + roadmap GA items)
# must appear in some entry's `tcp` or `aliases`. Update this list when the portfolio changes.
portfolio=['Elastic Cloud Server','Dedicated Host','Auto Scaling','Image Management','FunctionGraph','Bare Metal',
'Relational Database','Distributed Cache','Document Database','Cloud Search','Data Replication','TaurusDB','GeminiDB','Distributed Database Middleware','Oracle',
'Object Storage','Elastic Volume','Scalable File','Storage Disaster Recovery','Cloud Backup and Recovery',
'Virtual Private Cloud','Elastic IP','Elastic Load Balanc','Domain Name','Direct Connect','Secure Mail Gateway','NAT Gateway','VPC Endpoint','Enterprise Router','Enterprise VPN',
'Distributed Message','RocketMQ','API Gateway','Simple Message Notification','Application Operations','Application Performance',
'Cloud Eye','Cloud Trace','Tag Management','Config','Identity and Access','Log Tank','Resource Formation','OpenStack projects','Enterprise Project',
'Cloud Container Engine','Software Repository','Application Service Mesh','Ubiquitous Cloud Native',
'MapReduce','Data Warehouse','ModelArts','Data Lake Insight','DataArts','Optical Character',
'Anti-DDoS','Key Management','Web Application Firewall','Database Security','Host Security','Cloud Secret Management','Cloud Firewall',
'Financial Dashboard','Cloud Create','Managed Services','Marketplace','Cloud Container Instance','Alert Service','Data Admin Service','Enterprise Switch','Cloud Connect','Savings Plans']
hay=' | '.join((s['tcp'] or '')+' '+' '.join(s.get('aliases',[]))+' '+(s['tcpDesc']['en'] if s['tcpDesc'] else '') for s in allS).lower()
tcpfield=' | '.join((s['tcp'] or '')+' '+' '.join(s.get('aliases',[])) for s in allS).lower()
for p in portfolio:
    if p.lower() not in tcpfield:
        errs.append(f'portfolio not in tcp/aliases: {p}' + (' (only in text)' if p.lower() in hay else ''))
print(len(allS),'entries'); print('\n'.join(errs) or 'OK')
sys.exit(1 if errs else 0)
