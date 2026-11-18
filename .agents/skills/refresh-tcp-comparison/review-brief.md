# Review brief for content-verification agents

You verify entries of the "AWS vs. T Cloud Public" comparison (repo root = current working directory; T Cloud Public = Deutsche Telekom public cloud, formerly Open Telekom Cloud). Read `AGENTS.md` for the data model and rules. **Only edit the files assigned to you.** Do not touch JS/CSS/HTML, do not commit.

## Sources (all mandatory)
- `.sources/pdf/servicedescription-en.txt` / `leistungsbeschreibung-de.txt` – what is offered, flavors, prices, region columns (EU-DE/EU-NL; "n.a." = not available), "expected from" markers (extracted *before* their heading), preview/beta chapter 3.12.
- `.sources/release-notes.txt` – launches, new versions/regions, EOL (grep every service name).
- `.sources/roadmap-items.txt` – planned items with month ranges; tooltip-only items are undated.
- Docs: `git clone --depth 1 https://github.com/opentelekomcloud-docs/<slug> <dir outside the repo>` (slug = path segment of `docsTcp`); grep `umn/source`, `api-ref/source` (constraints, specifications, versions, change_history). A docs repo alone does not prove a service is offered.
- Terraform: `opentelekomcloud/terraform-provider-opentelekomcloud` `docs/resources/*.md` (check arguments, not just names); AWS: `hashicorp/terraform-provider-aws` `website/docs/r`.
- AWS: docs.aws.amazon.com, aws.amazon.com/<service>/features, What's New – watch for renames and deprecations.

## Task
For EACH entry, verify every factual claim in `desc`, `tcpDesc`, `equivNote`, `tfNote`, `migration`, `alt` and the fields `tcp`, `equiv`, `effort`, `tfStatus`, `tfTcp`, `tfAws`, links:
- Especially "missing/kein/no …" statements (often outdated), versions, limits, regions, beta/GA, planned dates (must match `roadmap-items.txt`), EOL.
- Fix wrong claims in **both** `de` and `en`, only with a source; keep style and length; JSON `ensure_ascii=False`, `indent=2`, trailing newline.
- Run `python3 tools/validate.py` afterwards (must print OK).

## Report
Per entry: "OK" or corrections (before → after, source), plus claims you could not verify.
