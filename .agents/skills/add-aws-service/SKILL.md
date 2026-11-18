---
name: add-aws-service
description: Add a single AWS service (or a T Cloud Public service without AWS counterpart) to the AWS vs. T Cloud Public comparison – research the T Cloud Public counterpart, scaffold and fill the entry in services/*.json, validate. Use when asked to add/include a service that is not yet on the page.
---

# Add an AWS service to the comparison

Read `AGENTS.md` (repo root) for the data model, rules and learnings. Commands run from the repo root.

## 1. Check it is really missing
```bash
grep -ril "<service name or keyword>" services/
```
If the service is already covered (as entry, `tcp` or `aliases`), extend that entry instead of adding a new one. One AWS service = one entry; several T Cloud Public services may be combined in `tcp`/`aliases`.

## 2. Find the T Cloud Public counterpart
Sources (refresh with `tools/fetch_sources.py` if `.sources/` is missing or old – see `refresh-tcp-comparison` skill):
- Offered services: `.sources/pdf/servicedescription-en.txt` (chapter 3, preview/beta 3.12, prices/regions chapter 6).
- New/planned: grep `.sources/release-notes.txt` and `.sources/roadmap-items.txt` (incl. tooltip-only section).
- Details: docs repo `https://github.com/opentelekomcloud-docs/<slug>` (clone outside the repo), Terraform `opentelekomcloud/terraform-provider-opentelekomcloud` `docs/resources`.
- AWS: docs.aws.amazon.com / features page / Terraform `hashicorp/terraform-provider-aws`.

Decide `equiv`:
- `full` – same capability set; `partial` – usable with gaps (then `equivNote` is required);
- `none` – no counterpart (`tcp`: "Kein Equivalent", mention planned roadmap items with their dates or "announced, no date");
- `tcpOnly` – a T Cloud Public service without AWS counterpart (use `--tcp-only`, name = T Cloud Public service).

## 3. Scaffold and fill
```bash
python3 tools/new_entry.py "<AWS service name>" --category "<existing category>" [--file <file>.json] [--tcp-only]
```
Replace every `TODO` (use `null` where not applicable):
- `desc` = AWS service, `tcpDesc` = counterpart incl. status (GA/beta), regions (EU-DE/EU-NL) and roadmap dates; both **de and en**.
- `migration` as `**Title.** text` sections (mapping, gaps, data migration, alternatives); `effort` easy/medium/hard.
- Terraform: `tfAws`/`tfTcp` as comma-separated resource types, `tfStatus` = coverage on the T Cloud Public side, `tfDocs*` = registry URL of the main resource.
- `docsTcp` = `https://docs.otc.t-systems.com/<slug>/index.html` (slug = docs repo name), `docsAws` = AWS docs URL.
- New T Cloud Public service names → also add them to the `portfolio` list in `tools/validate.py`.
- A new category → add an icon to `ICONS` in `overview/overview.js` and check the toolbar/category dropdown still fits (AGENTS.md learnings).
- Check the entry's short label on `/overview/` (derived from `tcp`).

## 4. Validate and publish
```bash
python3 tools/validate.py && python3 tools/check_links.py
```
Smoke-test locally (`python3 -m http.server 8765`, search for the new entry in DE/EN, open the card). Do **not** bump `services/meta.json` for a single addition unless the whole data set was re-verified. Commit and push to `main`; verify the Pages build.
