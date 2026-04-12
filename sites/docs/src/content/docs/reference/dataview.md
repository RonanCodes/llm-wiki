---
title: "Dataview Queries"
description: "Obsidian Dataview queries for browsing your wiki: 6 basic queries, dashboard, JS queries, field reference."
---

[Obsidian Dataview](https://github.com/blacksmithgu/obsidian-dataview) lets you query wiki pages by frontmatter fields. Install it from Community plugins and enable JavaScript Queries in its settings.

## 6 Basic Queries

### All Sources by Date

```
TABLE source-type AS "Type", author AS "Author",
  date-created AS "Added", join(domain, ", ") AS "Domain"
FROM "wiki/sources"
SORT date-created DESC
```

### All Entities by Type

```
TABLE entity-type AS "Type", join(aliases, ", ") AS "Aliases",
  join(domain, ", ") AS "Domain", length(file.inlinks) AS "Referenced By"
FROM "wiki/entities"
SORT entity-type ASC, file.name ASC
```

### All Concepts by Domain

```
TABLE join(domain, ", ") AS "Domain", join(tags, ", ") AS "Tags",
  date-modified AS "Last Updated", length(file.inlinks) AS "Referenced By"
FROM "wiki/concepts"
SORT domain ASC, file.name ASC
```

### Recently Modified Pages

```
TABLE page-type AS "Type", join(domain, ", ") AS "Domain",
  date-modified AS "Modified"
FROM "wiki"
WHERE page-type
SORT date-modified DESC
LIMIT 20
```

### Pages Missing Sources

```
TABLE page-type AS "Type", date-created AS "Created"
FROM "wiki"
WHERE page-type AND (!sources OR length(sources) = 0)
SORT date-created DESC
```

### Orphan Pages (no inlinks)

```
TABLE page-type AS "Type", date-created AS "Created"
FROM "wiki"
WHERE page-type AND length(file.inlinks) = 0
SORT date-created DESC
```

## Dashboard Template

Create a `wiki/dashboard.md` page with inline stats and tables:

```markdown
## Stats
- Total pages: `$= dv.pages('"wiki"').where(p => p["page-type"]).length`
- Sources: `$= dv.pages('"wiki/sources"').length`
- Entities: `$= dv.pages('"wiki/entities"').length`
- Concepts: `$= dv.pages('"wiki/concepts"').length`
- Comparisons: `$= dv.pages('"wiki/comparisons"').length`
```

Add the "Recently Modified" and "Most Connected" queries from above for a complete overview.

## JavaScript Queries

### Domain Tag Cloud

```dataviewjs
const pages = dv.pages('"wiki"').where(p => p["page-type"]);
const domains = {};
pages.forEach(p => {
  const d = p.domain;
  if (d) {
    (Array.isArray(d) ? d : [d]).forEach(tag => {
      domains[tag] = (domains[tag] || 0) + 1;
    });
  }
});
const sorted = Object.entries(domains).sort((a, b) => b[1] - a[1]);
dv.table(["Domain", "Pages"], sorted.map(([d, c]) => [d, c]));
```

### Entity Network

```dataviewjs
const entities = dv.pages('"wiki/entities"');
const rows = [];
entities.forEach(e => {
  const inlinks = e.file.inlinks;
  const sourceLinks = inlinks.filter(l => l.path.includes("sources/"));
  rows.push([e.file.link, e["entity-type"] || "-", sourceLinks.length, sourceLinks.join(", ")]);
});
rows.sort((a, b) => b[2] - a[2]);
dv.table(["Entity", "Type", "# Sources", "Mentioned In"], rows);
```

## Frontmatter Field Reference

| Field | All Pages | Type-Specific |
|-------|-----------|---------------|
| `title` | yes | |
| `date-created` | yes | |
| `date-modified` | yes | |
| `page-type` | yes | |
| `domain` | yes (list) | |
| `tags` | yes (list) | |
| `sources` | yes (list) | |
| `related` | yes (list) | |
| `source-url` | | source-note |
| `source-type` | | source-note |
| `author` | | source-note |
| `date-accessed` | | source-note |
| `raw-file` | | source-note |
| `entity-type` | | entity |
| `aliases` | | entity (list) |
| `promoted-from` | | promoted pages |
