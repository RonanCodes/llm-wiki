# Local folder connector

Mirror a directory tree from anywhere on disk into a bulk vault's `raw/<source-id>/` mirror.

## When to use

- User points at a SharePoint export, a Confluence export, an inherited HR archive, or any folder of docs.
- Source has no API, no auth, no URLs.
- User wants the raw bytes preserved with full fidelity.

## Manifest entry shape

```yaml
- id: hr-archive
  type: local
  location: /Users/ronan/Archives/hr-2024-export
  connector-skill: null
  auth-ref: null
  include:
    - "**/*.md"
    - "**/*.docx"
    - "**/*.pdf"
    - "**/*.xlsx"
  exclude:
    - "**/.DS_Store"
    - "**/~$*"
```

## Operations

### list-pages

Walk the source tree honouring `include`/`exclude` globs. For each file emit:

```json
{
  "id": "<relative-path-without-extension-slugified>",
  "path": "<relative-path-from-source-root>",
  "url": null,
  "modified-at": "<file mtime as ISO 8601>",
  "hash": "sha256:<bytes>"
}
```

Use `find` with `-newer` for cheap filtering on `--since`, fall back to a full walk if no `--since` is supplied.

### fetch-page

Copy the source file into `raw/<source-id>/<path>` verbatim using `rsync -a`. Preserve directory structure exactly.

For markdown files, the source-note body is a verbatim copy of the file content (no extraction needed).

For other formats, delegate extraction:

- `.pdf` -> invoke `ingest-pdf` to extract text
- `.docx`, `.doc`, `.pptx`, `.xlsx` -> invoke `ingest-office`
- `.txt`, `.rtf` -> read as text, wrap in a code block if structure is non-obvious

The extracted markdown becomes the body above `## Notes`. The original binary is also kept in `raw/` for reference.

### fetch-attachments

Not applicable for local folder (attachments are already in the tree). No-op.

## Refresh detection

Compute `sha256` of file bytes. If hash matches stored hash, skip. If hash differs OR file is new, fetch. If file is gone from source, move corresponding `wiki/sources/<page>.md` to `wiki/sources/.removed-<refresh-date>/`.

## Edge cases

- Symlinks: do not follow by default. Add `follow-symlinks: true` to the manifest entry to opt in.
- Hidden files (starting with `.`): excluded by default. Add explicit include pattern to override.
- Files outside the source root (path-escape via `..`): refuse. Bug.
- Very large files (>50MB): warn and skip by default; user can override per-source with `max-file-size-mb: <n>`.
