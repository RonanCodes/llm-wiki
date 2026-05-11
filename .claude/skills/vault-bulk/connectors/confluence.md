# Confluence connector

**This file does not implement Confluence auth. It delegates to a separate connector skill.**

Confluence Cloud uses an Atlassian email + API token; Confluence Server/Data Center uses session cookies or personal access tokens. Either way the auth surface belongs in its own skill, not in this repo.

## Resolution order

When `vault-bulk` encounters a `type: confluence` source, it scans the loaded skill list for a connector in this order:

1. **Vault-local override**: a skill named `bulk-connector-confluence` in the vault's own `.claude/skills/`.
2. **Work plugin connector**: `yellowtail:confluence`, `<employer>:confluence`, or any `*:confluence` skill provided by a loaded plugin.
3. **Personal connector**: `ro:confluence`.
4. None found -> abort.

## Abort message

If no connector resolves, print exactly this and stop:

> No Confluence connector skill is loaded. To bulk-import from Confluence you need a skill that can authenticate to the Atlassian REST API (or Server PAT), walk a space, fetch page content as storage-format XML or ADF, convert to markdown, and report a change cursor.
>
> Options:
>
> 1. If your work plugin provides one (you mentioned `yellowtail` skills on your work machine that touch Confluence), enable that plugin in this session.
> 2. Create a connector: `/ro:create-skill bulk-connector-confluence` and implement the cross-skill contract below.
> 3. As a workaround, export the Confluence space (Space settings -> Content tools -> Export -> HTML or Word) and import via `--type local`.

Do NOT half-implement Confluence here. No partial REST calls, no token prompts in chat, no "I'll just try a few endpoints". The connector is its own skill or it does not exist.

## Cross-skill contract

A skill that wants to serve as `bulk-connector-confluence` MUST expose three operations the dispatcher invokes via the `Skill` tool.

### list-pages

```
Skill bulk-connector-confluence operation=list-pages
  --source <space-url-or-key>
  [--since <iso-timestamp>]
```

Return: JSON array of `{ id, path, url, modified-at, hash }` records. `id` is the Confluence page ID. `path` is the breadcrumb hierarchy (`<parent-title>/<child-title>/...`), slugified. `url` is the canonical wiki URL (e.g. `https://acme.atlassian.net/wiki/spaces/PROD/pages/12345/Page+Title`). `modified-at` is the page's `version.when`. `hash` is the `version.number` concatenated with a sha256 of the rendered storage-format body.

For `--since`, prefer the Confluence CQL query `lastModified > "<iso>"` for cheap incremental listing.

### fetch-page

```
Skill bulk-connector-confluence operation=fetch-page
  --source <space-url-or-key>
  --page-id <page-id>
  --target <raw-path>
```

Fetch the page in storage-format (Confluence Cloud REST v2: `?body-format=storage`). Convert to markdown using pandoc (`pandoc -f html -t gfm`) or a Confluence-specific converter that handles macros (info, warning, code, panel, expand). Write the markdown to the target path.

Preserve any embedded image references as relative paths to `_attachments/`. Write the page's body to `raw/<source-id>/<path>.md`.

Return: `{ hash, modified-at, version-number }` of what was written.

### fetch-attachments

```
Skill bulk-connector-confluence operation=fetch-attachments
  --source <space-url-or-key>
  --page-id <page-id>
  --target <raw-path>
```

For each attachment on the page (via `/rest/api/content/<id>/child/attachment`), download the binary into `<target>/_attachments/<filename>`. Rewrite image references in the page body to point at the local path.

## What the connector skill is responsible for

- Reading credentials from `~/.claude/.env` (e.g. `CONFLUENCE_EMAIL`, `CONFLUENCE_TOKEN`, `CONFLUENCE_BASE_URL`).
- Surfacing `auth-ref` values for the manifest.
- Handling rate limits and pagination cursors.
- Macro translation (info -> blockquote, code -> fenced block with language, expand -> collapsible HTML).
- Slugifying breadcrumb paths to filesystem-safe paths.

## What the dispatcher (this skill, `vault-bulk`) is responsible for

- Frontmatter, manifest, hashing, refresh policy, `## Notes` preservation, lint-rule downgrades, log entries.

The split keeps Confluence auth out of this repo entirely. Personal-plugin and work-plugin connectors can both register under the `*:confluence` namespace, so you can have `ro:confluence` for personal stuff and `yellowtail:confluence` for work-tenant access without overlap.
