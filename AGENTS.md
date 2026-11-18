# AGENTS.md – AWS vs. T Cloud Public

Static site (no build step) comparing AWS services with **T Cloud Public** (formerly *Open Telekom Cloud*, renamed 01.02.2026), served via GitHub Pages from `main` (`/`): https://spielkind.github.io/aws-vs-tcloud-public/

## Structure
- `index.html`, `js/` (`state` → `filters` → `render` → `export` → `app`), `css/` – UI, no dependencies.
- `services/index.json` – list of data files; `services/<category>.json` – entries; `services/meta.json` – data date shown as "Stand"/"Last updated".
- `oracle-managed/` – standalone Oracle-optimized/Managed Service page (prices from service description PDFs).
- `tools/fetch_sources.py` – downloads roadmap + all release notes into `.sources/` (git-ignored) as greppable text (roadmap items with month ranges).
- `tools/validate.py`, `tools/check_links.py` – data checks (run from repo root).

## Data model (one entry)
`name` (AWS service; for `tcpOnly` the T Cloud Public service), `category`, `effort` (`easy|medium|hard`, `null` for `tcpOnly`), `equiv` (`full|partial|none|tcpOnly`), `tcp`, `tfAws`, `tfTcp`, `tfStatus` (Terraform coverage on T Cloud Public side: `full|partial|none`), `docsAws`, `docsTcp`, `tfDocsAws`, `tfDocsTcp`, localized `desc` (AWS), `tcpDesc`, `alt`, `migration` (`**Title.** text` sections), `equivNote`, `tfNote`, optional `aliases` (other T Cloud Public service names merged into this entry – searchable and counted for portfolio coverage).

Rules: every localized field has `de` **and** `en` with the same content · write "T Cloud Public" (never OTC) · scope = all T Cloud Public services + AWS counterparts; map a T Cloud Public service to the closest AWS entry (via `tcp`/`aliases`), only add `tcpOnly` entries if no AWS counterpart exists · Terraform names stay `opentelekomcloud_*` (provider namespace was not renamed) · JSON: `ensure_ascii=False`, `indent=2`, trailing newline.

## Sources (check all of them on every refresh)
| What | Where |
|---|---|
| Service list, prices, EOL/"expected from" markers | Service description PDF (EN) / Leistungsbeschreibung (DE) – take the current PDF links from the footer of https://www.t-cloud-public.com/en (hash paths change per revision); Managed Services PDF from https://www.t-cloud-public.com/de/produkte-services/managed-services |
| Roadmap (planned items, EOL, dates) | https://www.t-cloud-public.com/en/products-services/roadmap (dates are encoded in the HTML grid; tooltips hold descriptions) |
| Release notes (launches, new versions/regions, EOL) | https://www.t-cloud-public.com/en/support/release-notes – full feed: `https://www.t-cloud-public.com/en/support/release-notes.rss.xml` |
| Service documentation | https://github.com/opentelekomcloud-docs – repo name = docs slug (`https://docs.otc.t-systems.com/<slug>/index.html`); `git clone --depth 1` and grep `umn/source`, `api-ref/source` (docs site itself is behind a bot wall) |
| Terraform (T Cloud Public) | https://github.com/opentelekomcloud/terraform-provider-opentelekomcloud (`docs/resources`, GitHub releases – CHANGELOG.md is frozen) |
| AWS | docs.aws.amazon.com, aws.amazon.com/&lt;service&gt;/features, AWS "What's New"; Terraform: hashicorp/terraform-provider-aws `website/docs/r` |

## Refresh workflow
1. **Collect**: `python3 tools/fetch_sources.py` (roadmap + release notes → `.sources/`); download current PDFs (`pdftotext`/pypdf); note PDF "Last revised" and roadmap "Last updated" dates. Clone docs repos outside the repo (e.g. `/tmp/tcpdocs/`).
2. **Portfolio & news diff**: compare the service description TOC (chapter 3, incl. §3.12 preview/beta) with `tcp`/`aliases`; go through **all release notes since the last `meta.json` date** and **all roadmap items** (`new`/`release`/`EOL`, incl. tooltip-only items like CDN or KooSearch). For each: is it a new service or feature that matches an AWS service? → add/merge an entry (planned services: `equiv: none` with the planned date in `tcpDesc`); feature now available → remove "missing" claims; EOL → add warning. Update the `portfolio` list in `tools/validate.py`.
3. **Verify every claim per entry** (`desc`, `tcpDesc`, `equivNote`, `tfNote`, `migration`, `alt`, `equiv`/`effort`/`tfStatus`): T Cloud Public side against docs repo + release notes + roadmap (versions, limits, regions EU-DE/EU-NL, beta/GA, planned dates), AWS side against AWS docs. Change only what a source backs; keep both languages in sync. Work is parallelizable per `services/*.json` file (one owner per file).
4. **Oracle page** (`oracle-managed/index.html`): flavors/prices (service description §3.2.9 + §6.3.9), Direct Connect prices (§6.5.5), Managed Services packages/limits/prices/backup/SLA (Managed Services PDF); update source links, "Stand" dates (subtitle, footer, sources, JS subtitle).
5. **Header links**: `js/i18n.js` (`roadmapUrl`, `releaseUrl`, `leistungUrl` – current PDF URLs).
6. **Bump** `services/meta.json` → `"updated": "YYYY-MM-DD"`.
7. **Check**: `python3 tools/validate.py && python3 tools/check_links.py` (both must print `OK`); then `python3 -m http.server` and test search, filters (incl. category dropdown, "T Cloud Public only"), DE/EN, dark mode, mobile sheet, CSV/PDF export, no console errors.
8. **Publish**: commit and push to `main`; GitHub Pages deploys automatically (verify the latest Pages build and the live page).
