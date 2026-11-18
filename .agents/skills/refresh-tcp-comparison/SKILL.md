---
name: refresh-tcp-comparison
description: Refresh the AWS vs. T Cloud Public comparison data (services/*.json, Oracle page) from current sources – service description PDFs, roadmap, release notes, opentelekomcloud-docs, Terraform providers, AWS docs. Use when asked to update/refresh/verify the comparison, check for new T Cloud Public services, or review content accuracy.
---

# Refresh AWS vs. T Cloud Public

Read `AGENTS.md` (repo root) first – data model, rules and learnings are defined there. All commands run from the repo root. To add a single AWS service, use the `add-aws-service` skill instead.

## 1. Collect sources
```bash
python3 -m venv /tmp/tcpvenv && /tmp/tcpvenv/bin/pip install -q pypdf   # once, for PDF text
/tmp/tcpvenv/bin/python tools/fetch_sources.py
```
Produces `.sources/` (git-ignored): `release-notes.txt`, `terraform-releases.txt`, `terraform-resources.txt`, `roadmap-items.txt` (all bars with month ranges + tooltip-only items), `pdf/servicedescription-en.txt`, `pdf/leistungsbeschreibung-de.txt`, `pdf/managed-services-de.txt`. The script fails loudly if the site structure changed – fix the parser, don't skip it.

## 2. Diff report
```bash
python3 tools/report.py > .sources/report.md        # release notes since services/meta.json "updated"
```
Work through every section:
1. **Services without entry** → new service (add entry, map to closest AWS service; `tcpOnly` only if no AWS counterpart), rename, or sub-feature (add to `aliases` of the right entry).
2. **New release notes** → for each: does it change a statement (version, region, "missing" feature, EOL)? Is it a new service/feature with an AWS counterpart?
3. **Roadmap bars not mentioned** → add to the matching entry if it has an AWS counterpart or changes a migration statement (phrase: "laut Roadmap <Mon YYYY>–<Mon YYYY>" / "on the roadmap for …"); ignore pure maintenance items. Check the tooltip-only section manually (undated → "announced, no date").
4. **Roadmap/date claims in data** → each must match `roadmap-items.txt`; remove claims for items no longer on the roadmap.
5. **Terraform provider releases** (`[Feat]`/new resources since the last update) → extend `tfTcp`, raise `tfStatus`, update `tfNote` (mention provider version).
6. **Provider resources not referenced** → mostly sub-resources (fine); look for main resources of services whose entry says `tfStatus: none/partial` or misses a service variant (e.g. `gpfs_*` = General Purpose File System, `private_nat_*`, `aom_*`).

Also update the `portfolio` list in `tools/validate.py` when services are added/retired.

## 3. Verify all statements (parallel)
Spawn one general-purpose agent per group of `services/*.json` files (one owner per file, e.g. compute+serverless+container · database+storage · networking+dns-cdn · security+identity · management+monitoring · analytics+ai+messaging+contact-center+cost). Give each agent the brief in [review-brief.md](review-brief.md) plus its file list. Then check the Oracle page yourself (AGENTS.md workflow step 4) against `.sources/pdf/*`.

After all agents finish: grep across files for services that appear in several entries (DMS, CSMS, SecMaster, GeminiDB, SFS, …) and make statements/dates consistent.

## 4. Finish
1. Update header PDF links in `js/i18n.js` (`leistungUrl`) if `fetch_sources.py` printed new URLs; update Oracle page source links/"Stand".
2. Set `services/meta.json` → `"updated": "<today>"`.
3. `python3 tools/validate.py && python3 tools/check_links.py` – both must print `OK`.
4. UI smoke test: `python3 -m http.server 8765` → search, category dropdown, filters incl. "T Cloud Public only", DE/EN, dark mode, mobile sheet (390 px), CSV/PDF export, no console errors; toolbar on one line at ≥1280 px.
5. Independent review: run a rubber-duck/code-review agent over the full diff; fix findings.
6. Append new learnings to `AGENTS.md`, commit, push to `main`, verify the GitHub Pages build and https://spielkind.github.io/aws-vs-tcloud-public/.
