# Dataview Queries for LLM Wiki

Useful [Obsidian Dataview](https://github.com/blacksmithgu/obsidian-dataview) queries for browsing your wiki.

## Setup

1. **Settings** → **Community plugins** → **Browse**
2. Search for **"Dataview"**
3. Install and enable
4. **Settings** → **Dataview** → Enable **"Enable JavaScript Queries"** (for advanced queries)
5. **Settings** → **Dataview** → Enable **"Enable Inline Queries"** (optional, for inline data)

## Basic Queries

### All Sources by Date

```dataview
TABLE
  source-type AS "Type",
  author AS "Author",
  date-created AS "Added",
  join(domain, ", ") AS "Domain"
FROM "wiki/sources"
SORT date-created DESC
```

### All Entities by Type

```dataview
TABLE
  entity-type AS "Type",
  join(aliases, ", ") AS "Aliases",
  join(domain, ", ") AS "Domain",
  length(file.inlinks) AS "Referenced By"
FROM "wiki/entities"
SORT entity-type ASC, file.name ASC
```

### All Concepts by Domain

```dataview
TABLE
  join(domain, ", ") AS "Domain",
  join(tags, ", ") AS "Tags",
  date-modified AS "Last Updated",
  length(file.inlinks) AS "Referenced By"
FROM "wiki/concepts"
SORT domain ASC, file.name ASC
```

### Recently Modified Pages

```dataview
TABLE
  page-type AS "Type",
  join(domain, ", ") AS "Domain",
  date-modified AS "Modified"
FROM "wiki"
WHERE page-type
SORT date-modified DESC
LIMIT 20
```

### Pages Missing Sources

Pages where the `sources` frontmatter is empty — these need attention.

```dataview
TABLE
  page-type AS "Type",
  date-created AS "Created"
FROM "wiki"
WHERE page-type AND (!sources OR length(sources) = 0)
SORT date-created DESC
```

### Orphan Pages (no inlinks)

Pages that nothing links to — potential cleanup candidates.

```dataview
TABLE
  page-type AS "Type",
  date-created AS "Created"
FROM "wiki"
WHERE page-type AND length(file.inlinks) = 0
SORT date-created DESC
```

## Dashboard Query

Create a `wiki/dashboard.md` page with this content for a quick vault overview:

````markdown
# Dashboard

## Stats
- Total pages: `$= dv.pages('"wiki"').where(p => p["page-type"]).length`
- Sources: `$= dv.pages('"wiki/sources"').length`
- Entities: `$= dv.pages('"wiki/entities"').length`
- Concepts: `$= dv.pages('"wiki/concepts"').length`
- Comparisons: `$= dv.pages('"wiki/comparisons"').length`

## Recent Activity

```dataview
TABLE
  page-type AS "Type",
  join(domain, ", ") AS "Domain"
FROM "wiki"
WHERE page-type
SORT date-modified DESC
LIMIT 10
```

## Most Connected Pages

```dataview
TABLE
  page-type AS "Type",
  length(file.inlinks) AS "Inlinks",
  length(file.outlinks) AS "Outlinks"
FROM "wiki"
WHERE page-type
SORT length(file.inlinks) DESC
LIMIT 10
```

## Sources by Type

```dataview
TABLE
  rows.file.link AS "Sources"
FROM "wiki/sources"
GROUP BY source-type
```
````

## Advanced: JavaScript Queries

### Domain Tag Cloud

Shows all unique domain tags with counts:

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

Shows entities and which source-notes mention them:

```dataviewjs
const entities = dv.pages('"wiki/entities"');
const rows = [];
entities.forEach(e => {
  const inlinks = e.file.inlinks;
  const sourceLinks = inlinks.filter(l => l.path.includes("sources/"));
  rows.push([e.file.link, e["entity-type"] || "—", sourceLinks.length, sourceLinks.join(", ")]);
});
rows.sort((a, b) => b[2] - a[2]);
dv.table(["Entity", "Type", "# Sources", "Mentioned In"], rows);
```

## Frontmatter Fields Reference

All fields available for Dataview queries:

| Field | All pages | Type-specific |
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
