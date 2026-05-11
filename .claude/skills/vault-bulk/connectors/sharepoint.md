# SharePoint connector

**This file does not implement SharePoint auth. It delegates to a separate connector skill.**

SharePoint requires Microsoft Graph API authentication (app registration, tenant ID, client secret, or delegated user token), pagination, document library traversal, attachment handling, and rate-limit respect. That auth surface belongs in its own skill so credentials never live in this repo.

## Resolution order

When `vault-bulk` encounters a `type: sharepoint` source, it scans the loaded skill list for a connector in this order:

1. **Vault-local override**: a skill named `bulk-connector-sharepoint` in the vault's own `.claude/skills/` (if the vault has one).
2. **Work plugin connector**: `yellowtail:sharepoint`, `<employer>:sharepoint`, or any `*:sharepoint` skill provided by a plugin the user has loaded.
3. **Personal connector**: `ro:sharepoint`.
4. None found -> abort.

## Abort message

If no connector resolves, print exactly this and stop:

> No SharePoint connector skill is loaded. To bulk-import from SharePoint you need a skill that can authenticate to Microsoft Graph, walk a site or document library, fetch pages and attachments, and report change tokens.
>
> Options:
>
> 1. If your work plugin provides one (e.g. on your work machine you may have `yellowtail:sharepoint`), enable that plugin in this session.
> 2. Create a connector: `/ro:create-skill bulk-connector-sharepoint` and implement the cross-skill contract below.
> 3. As a workaround, export the SharePoint library to a local folder (Files -> Sync, or the SharePoint export tools) and use `--type local` instead.

Do NOT half-implement SharePoint here. No partial Graph API calls, no "let's try the public endpoint", no "I'll prompt for a client secret in chat". The connector is its own skill or it does not exist.

## Cross-skill contract

A skill that wants to serve as `bulk-connector-sharepoint` MUST expose the following operations the dispatcher can invoke via the `Skill` tool. Operations are invoked with JSON-stringified arguments; return values are JSON.

### list-pages

```
Skill bulk-connector-sharepoint operation=list-pages
  --source <site-url-or-drive-id>
  [--since <iso-timestamp>]
```

Return: JSON array of `{ id, path, url, modified-at, hash }` records. `id` is the SharePoint item ID. `path` is a synthetic path constructed from the document library hierarchy. `url` is the canonical sharepoint.com URL. `modified-at` is the item's `lastModifiedDateTime`. `hash` is either the item's `eTag` or a sha256 of the bytes (whichever the connector chooses).

Use Graph's delta query (`/me/drive/root/delta`) when `--since` is supplied for cheap incremental listing.

### fetch-page

```
Skill bulk-connector-sharepoint operation=fetch-page
  --source <site-url-or-drive-id>
  --page-id <item-id>
  --target <raw-path>
```

Download the item content to the target path. Convert .docx/.pptx/.xlsx to markdown using Graph's content conversion endpoint where available, otherwise fetch the binary and delegate to `ingest-office` for extraction.

Return: `{ hash, modified-at }` of what was written.

### fetch-attachments

```
Skill bulk-connector-sharepoint operation=fetch-attachments
  --source <...>
  --page-id <item-id>
  --target <raw-path>
```

For modern SharePoint pages, fetch embedded images and inline attachments under `<target>/_attachments/`. For document-library files (Word/Excel/PowerPoint), this is usually a no-op because the file IS the page.

## What the connector skill is responsible for

- Reading credentials from `~/.claude/.env` or the OS keychain. Never accepting tokens via chat input.
- Surfacing `auth-ref` values that vault-bulk can store in the manifest (e.g. `auth-ref: keychain:sharepoint-acme`).
- Handling Graph rate limits (429 + Retry-After).
- Pagination across `@odata.nextLink`.
- Mapping SharePoint paths to filesystem-safe paths (slashes, colons, reserved names).

## What the dispatcher (this skill, `vault-bulk`) is responsible for

- Frontmatter, manifest, hashing, refresh policy, `## Notes` preservation, lint-rule downgrades, log entries.

The split keeps SharePoint auth out of this repo entirely.
