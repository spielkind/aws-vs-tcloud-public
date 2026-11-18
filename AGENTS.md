# AGENTS.md – AWS vs. T Cloud Public

Static site (no build step) comparing AWS services with **T Cloud Public** (formerly *Open Telekom Cloud*, renamed 01.02.2026), served via GitHub Pages from `main` (`/`): https://spielkind.github.io/aws-vs-tcloud-public/

## Structure
- `index.html`, `js/` (`state` → `filters` → `render` → `export` → `app`), `css/` – UI, no dependencies.
- `services/index.json` – list of data files; `services/<category>.json` – entries; `services/meta.json` – data date shown as "Stand"/"Last updated".
- `oracle-managed/` – standalone Oracle-optimized/Managed Service page (prices from service description PDFs).
- `tools/fetch_sources.py` – downloads all sources into `.sources/` (git-ignored) as greppable text: `roadmap-items.txt` (every timeline bar with month range + description, plus undated tooltip-only items), `release-notes.txt` (full RSS history), `terraform-releases.txt` + `terraform-resources.txt` (opentelekomcloud provider), `docs-repos.txt` + `products.txt` (docs repos and product pages, to detect new services; set `GITHUB_TOKEN`, e.g. `$(gh auth token)`, to avoid API rate limits) and `pdf/*.txt` (current service description EN, Leistungsbeschreibung DE, Managed Services PDF – links discovered on the live site; needs `pypdf`). Fails loudly if the site structure changed.
- `tools/report.py` – diff report after fetching: service-description services without entry, release notes since `meta.json`, roadmap items not mentioned in the data, all roadmap/date claims to cross-check, Terraform provider releases since `meta.json`, provider resources not referenced in any entry (new prefixes flagged), docs repos and product pages without entry. Decisions for intentionally unmapped items live in `tools/known_sources.json`.
- `tools/new_entry.py` – scaffolds a schema-complete entry (TODO placeholders) in the right category file.
- `tools/validate.py`, `tools/check_links.py` – data checks (schema, languages, branding, TODOs, portfolio coverage; URLs, Terraform resources, docs slugs).
- `.agents/skills/refresh-tcp-comparison` (full refresh incl. parallel review brief) and `.agents/skills/add-aws-service` (add one service) – agent skills wrapping this workflow.

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
1. **Collect**: `python3 tools/fetch_sources.py` (with `pypdf` available, e.g. in a venv) → `.sources/`; note PDF revision and roadmap "Last updated" dates it prints. Clone docs repos outside the repo (e.g. `/tmp/tcpdocs/`).
2. **Portfolio & news diff** (`python3 tools/report.py > .sources/report.md`): compare the service description TOC (chapter 3, incl. §3.12 preview/beta) with `tcp`/`aliases`; go through **all release notes since the last `meta.json` date** and **all roadmap items** (`new`/`release`/`EOL`, incl. tooltip-only items like CDN or KooSearch). For each: is it a new service or feature that matches an AWS service? → add/merge an entry (planned services: `equiv: none` with the planned date in `tcpDesc`); feature now available → remove "missing" claims; EOL → add warning. Update the `portfolio` list in `tools/validate.py`.
3. **Verify every claim per entry** (`desc`, `tcpDesc`, `equivNote`, `tfNote`, `migration`, `alt`, `equiv`/`effort`/`tfStatus`): T Cloud Public side against docs repo + release notes + roadmap (versions, limits, regions EU-DE/EU-NL, beta/GA, planned dates), AWS side against AWS docs. Change only what a source backs; keep both languages in sync. Work is parallelizable per `services/*.json` file (one owner per file).
4. **Oracle page** (`oracle-managed/index.html`): flavors/prices (service description §3.2.9 + §6.3.9), Direct Connect prices (§6.5.5), Managed Services packages/limits/prices/backup/SLA (Managed Services PDF); update source links, "Stand" dates (subtitle, footer, sources, JS subtitle).
5. **Header links**: `js/i18n.js` (`roadmapUrl`, `releaseUrl`, `leistungUrl` – current PDF URLs).
6. **Bump** `services/meta.json` → `"updated": "YYYY-MM-DD"`.
7. **Check**: `python3 tools/validate.py && python3 tools/check_links.py` (both must print `OK`); then `python3 -m http.server` and test search, filters (incl. category dropdown, "T Cloud Public only"), DE/EN, dark mode, mobile sheet, CSV/PDF export, no console errors.
8. **Publish**: commit and push to `main`; GitHub Pages deploys automatically (verify the latest Pages build and the live page).

## Learnings / pitfalls (from the 11/2026 refresh)
- **"Missing feature" claims age fastest.** Many were wrong after a year (DNSSEC, CBR Backup Lock/WORM, SNS filter policies, Smart Connect, CCE workload identity). Grep the release notes for every "kein/no …" statement.
- **Docs repo ≠ offered service.** `opentelekomcloud-docs` contains skeleton/legacy repos (e.g. `distributed-message-service-rabbitmq` – RabbitMQ is *not* offered). The service description is the authority for what is sold; docs for how it works.
- **New services show up in several places at different times** – release notes/website first, service description only at its next revision. `report.py` checks all of them (SD, ★ release notes, roadmap, Terraform prefixes, docs repos, product pages); matching is per entry, so a service is only "covered" if one entry's `tcp`/`aliases` names it. Docs repos for not-offered services exist (CSE, Business Continuity Center) – record such decisions in `known_sources.json`.
- **Track the Terraform provider explicitly.** New resources arrive every few weeks (e.g. `gpfs_*` for General Purpose File System, `aom_*` rules) – `report.py` sections 5/6 show releases and unreferenced resources; resource prefixes don't always match service names (`gpfs` = GP FS, `cc` = Cloud Connect, `er` = Enterprise Router).
- **Terraform resource ≠ full support.** Check resource arguments, not just existence (e.g. `gemini_instance_v3` only supports the Cassandra/Influx engines, not the DynamoDB mode).
- **Roadmap parsing.** Grid columns `q<month><year>` are months (q4 2027 = Apr 2027), numeric starts mean "already running" (EOL notices often look like this). Tooltip-only items (CDN, KooSearch, …) have no date – never invent one; phrase as "announced, no date". Only write "laut Roadmap/per roadmap" if the item is actually in `roadmap-items.txt`.
- **Service description PDF text.** "expected to be available from …" markers are extracted *before* the heading they belong to; PDF URLs are hash-based and change per revision (old `open-telekom-cloud.com/leistungsbeschreibung-tsi` and `/service-description` still redirect to the current PDFs).
- **Link checks lie.** `docs.otc.t-systems.com` (bot wall) and `registry.terraform.io` (SPA) answer 200 for anything; `check_links.py` therefore validates slugs/resources against the GitHub repos. Occasional HTTP 5xx from docs.otc are transient (the script retries 3×) – recheck before changing data.
- **AWS changes too.** Check AWS deprecations/renames (e.g. CloudTrail Lake, DevOps Guru, X-Ray SDKs, Glacier vaults, LiveAnalytics, "SageMaker AI", "Data Firehose") – not only the T Cloud Public side.
- **Cross-entry consistency.** The same T Cloud Public service appears in several entries (e.g. DMS in SQS/MQ/MSK/Kinesis/Lambda, CSMS in Secrets Manager/Systems Manager/CodePipeline). After edits, grep all files for the service name and keep statements and dates identical.
- **New roadmap/release items → AWS mapping.** Each new T Cloud Public service/feature should either extend an existing entry or create a new AWS entry (e.g. Status Dashboard → AWS Health, SFS Turbo HPC → FSx for Lustre, SMB roadmap → FSx for Windows).
- **Parallel agents.** Split the review per `services/*.json` file (one owner per file), give them the source text files, and tell them to clone docs repos **outside** the repo. Finish with an independent review (rubber duck) of the whole diff.
- **UI.** More categories make the toolbar wrap – categories live in a dropdown; check the toolbar at 1280/1440/1600 px after adding categories.
- **Hosting.** The repo was renamed from `otc-vs-aws`; the old Pages URL returns 404 (GitHub only redirects repo URLs).
