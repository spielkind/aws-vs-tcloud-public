// ===================================================
// i18n.js — Translations & URL state sync
// ===================================================

const T = {
  de: {
    sub: 'Service-Vergleich & Migrationshilfe · {n} Services',
    easy: 'Einfach', med: 'Mittel', hard: 'Hoch', total: 'Gesamt', all: 'Alle',
    search: 'Service suchen...', desc: 'Beschreibung', tcpE: 'T Cloud Public', awsE: 'AWS', equiv: 'Äquivalenz',
    alt: 'Alternativen', tf: 'Terraform', eff: 'Aufwand', mig: 'Migration',
    full: 'Voll unterstützt', partial: 'Teilweise', none: 'Nicht verfügbar',
    openAll: '⊞ Alle öffnen', closeAll: '⊟ Alle schließen',
    sort: 'Sort:', sortDef: 'Standard', sortAZ: 'A-Z', sortEff: 'Aufwand',
    reset: '✕ Reset', noEquiv: '⚠️ Kein T Cloud Public-Pendant', noAwsEquiv: 'Kein AWS-Pendant',
    eqFull: '1:1', eqPartial: 'Teilweise', eqNone: 'Kein Pendant', eqTcpOnly: 'Nur T Cloud Public',
    tfFull: 'TF ✓', tfPartial: 'TF ~', tfNone: 'TF ✗',
    aiHint: '🤖 KI-generiert · ohne Gewähr', updated: 'Stand:', cat: 'Kategorie', overview: 'Überblick', formerly: '(ehemals Open Telekom Cloud)',
    roadmapUrl: 'https://www.t-cloud-public.com/de/produkte-services/roadmap',
    roadmapLabel: '🗺️ Roadmap',
    releaseUrl: 'https://www.t-cloud-public.com/de/support/release-notes',
    releaseLabel: '📰 Release Notes',
    leistungUrl: 'https://www.t-cloud-public.com/_Resources/Persistent/f/8/b/0/f8b0c9b250662e3a5d28134d9e990007bbabd9fa/t-cloud-public-leistungsbeschreibung-tdg.pdf',
    leistungLabel: '📋 Leistungsbeschreibung'
  },
  en: {
    sub: 'Service comparison & migration guide · {n} services',
    easy: 'Easy', med: 'Medium', hard: 'High', total: 'Total', all: 'All',
    search: 'Search services...', desc: 'Description', tcpE: 'T Cloud Public', awsE: 'AWS', equiv: 'Equivalence',
    alt: 'Alternatives', tf: 'Terraform', eff: 'Effort', mig: 'Migration',
    full: 'Fully supported', partial: 'Partial', none: 'Not available',
    openAll: '⊞ Expand all', closeAll: '⊟ Collapse all',
    sort: 'Sort:', sortDef: 'Default', sortAZ: 'A-Z', sortEff: 'Effort',
    reset: '✕ Reset', noEquiv: '⚠️ No T Cloud Public equivalent', noAwsEquiv: 'No AWS equivalent',
    eqFull: '1:1', eqPartial: 'Partial', eqNone: 'No equivalent', eqTcpOnly: 'T Cloud Public only',
    tfFull: 'TF ✓', tfPartial: 'TF ~', tfNone: 'TF ✗',
    aiHint: '🤖 AI-generated · no warranty', updated: 'Last updated:', cat: 'Category', overview: 'Overview', formerly: '(formerly Open Telekom Cloud)',
    roadmapUrl: 'https://www.t-cloud-public.com/en/products-services/roadmap',
    roadmapLabel: '🗺️ Roadmap',
    releaseUrl: 'https://www.t-cloud-public.com/en/support/release-notes',
    releaseLabel: '📰 Release Notes',
    leistungUrl: 'https://www.t-cloud-public.com/_Resources/Persistent/0/c/0/a/0c0af34c935193d93fa3f783514ecac6c50a206d/t-cloud-public-servicedescription.pdf',
    leistungLabel: '📋 Service Description'
  }
};
