# AWS vs. T Cloud Public

Service comparison and migration guide between **AWS** and **T Cloud Public** (formerly *Open Telekom Cloud*).

🌐 **Live:** https://spielkind.github.io/aws-vs-tcloud-public/ · 🗄️ Oracle Managed Service: https://spielkind.github.io/aws-vs-tcloud-public/oracle-managed/

- AWS services mapped to their T Cloud Public counterparts (1:1, partial, none) plus T Cloud Public services without AWS counterpart
- Descriptions, equivalence notes, migration hints, effort rating and Terraform coverage (`hashicorp/aws` vs. `opentelekomcloud/opentelekomcloud`)
- Search, filters (category, equivalence, Terraform, effort), DE/EN, dark mode, CSV/PDF export, shareable links
- Data status ("Stand") is shown in the footer (`services/meta.json`)

> 🤖 Content is AI-generated and verified against public sources (service description, roadmap, release notes, docs) – no warranty.

## Run locally
Static site without build step:
```bash
python3 -m http.server 8765   # → http://localhost:8765
```

## Structure
| Path | Content |
|---|---|
| `index.html`, `js/`, `css/` | UI |
| `services/*.json` | Comparison data (one file per category, listed in `services/index.json`) |
| `oracle-managed/` | Oracle-optimized / Managed Service overview |
| `tools/` | Source download, diff report, validation, link check, entry scaffold |
| `.agents/skills/` | Agent skills: `refresh-tcp-comparison` (full data refresh), `add-aws-service` (add one service) |
| `AGENTS.md` | Data model, sources, refresh workflow, learnings |

## Updating the data
See [AGENTS.md](AGENTS.md). Quick check before committing:
```bash
python3 tools/validate.py && python3 tools/check_links.py
```
Pushing to `main` deploys via GitHub Pages.
