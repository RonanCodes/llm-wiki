# Git repo connector

Mirror a git repository (typically a wiki, handbook, or docs repo) into a bulk vault's `raw/<source-id>/` mirror.

## When to use

- Source is a public or auth-via-SSH git repo full of markdown/docs (e.g. a company handbook, a public wiki, a docs site source).
- User wants commit-history-aware refresh: pull changes incrementally, get a clean diff per refresh.

## Manifest entry shape

```yaml
- id: org-handbook
  type: git
  location: git@github.com:acme/handbook.git
  branch: main
  subdir: docs                            # optional - mirror only this subtree
  connector-skill: null
  auth-ref: ssh:default                   # uses ambient ssh agent; could be `gh-token` for HTTPS
  include:
    - "**/*.md"
    - "**/*.mdx"
  exclude:
    - "**/node_modules/**"
    - "**/.git/**"
```

A clone of the repo is kept in `raw/<source-id>/.git-mirror/` (a bare-ish working clone, not the source-of-truth tree). The visible mirror under `raw/<source-id>/<files>` is populated by checking out the configured branch into that directory.

## Operations

### list-pages

1. `git -C raw/<source-id>/.git-mirror fetch --quiet origin <branch>`
2. `git -C raw/<source-id>/.git-mirror checkout <branch>` and `git pull --ff-only`
3. Walk the (optionally subdir-scoped) working tree, applying `include`/`exclude` globs.
4. For each file emit the same record shape as the local-folder connector, but populate `url` with a GitHub/GitLab blob URL if the remote is recognised (e.g. `https://github.com/acme/handbook/blob/<branch>/<path>`).
5. `modified-at` comes from `git log -1 --format=%cI -- <path>` (commit time of last change), not file mtime.

### fetch-page

Mirror the file from `raw/<source-id>/.git-mirror/<path>` to `raw/<source-id>/<path>`. For markdown files, body is verbatim. For other formats, delegate extraction same as local-folder.

### fetch-attachments

Walk the working tree for non-text assets referenced from markdown files (images, PDFs, attachments). Copy them under `raw/<source-id>/_attachments/`.

## Refresh detection

The git log IS the change detection. After `git pull`:

- Run `git diff --name-status <last-fetched-sha>..HEAD` to get a precise change list.
- Store the latest SHA on the source's manifest entry as `last-fetched-sha`.
- This is far cheaper than re-hashing the whole tree.

For first-time imports, fall back to full hash walk (no prior SHA).

## Edge cases

- Auth failure: surface the underlying `git` error verbatim, suggest checking the `auth-ref`. Do not retry blindly.
- Branch renamed (e.g. `master` -> `main`): manifest carries the branch; refuse to switch silently. User must update the manifest.
- Force-push that rewrote history: detect by checking whether `<last-fetched-sha>` is reachable from new HEAD. If not, log a warning and fall back to full hash walk.
- Submodules: ignored by default. Add `init-submodules: true` to opt in.
- Very large repos (>500MB): warn the user; recommend `--depth 1` shallow clone (clone command in this connector should default to `--depth 50` to keep refresh history available without ballooning size).
