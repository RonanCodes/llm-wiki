---
name: generate-paste-kit
description: Build a one-click copy-paste HTML tool from any vault markdown source. Each block offers Plain and Rich copy so the user can paste into either plain-text fields (LinkedIn About, profile forms) or rich-text editors (Gmail, Docs, Notion, blog posts). Source format is a markdown file with `## Section` headers and fenced code blocks. Used by `/generate paste-kit`.
user-invocable: false
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(mkdir *), Bash(date *), Bash(open *), Bash(git *)
content-pipeline:
  - pipeline:review
  - platform:agnostic
  - role:adapter
---

# Generate Paste Kit

Generate a self-contained HTML page of click-to-copy blocks from a vault markdown source. Output file opens in any browser. Each block has a **Plain** button (plain text) and, when meaningful, a **Rich** button (plain + HTML multi-format clipboard) so the user can paste into either plain-only or rich-text targets without re-formatting by hand.

## Usage (via /generate router)

```
/generate paste-kit --vault <name> --source <wiki/path.md> [--title "..."] [--open]
```

Examples:

```
/generate paste-kit --vault personal-work --source wiki/comparisons/headline-bio-drafts-v3.md --open
/generate paste-kit --vault career-moves --source wiki/sources/follow-up-email-acme.md --title "ACME follow-up"
```

## Output

```
vaults/<vault>/artifacts/paste-kits/<source-slug>-<YYYY-MM-DD>-<HHMM>.html
```

The file is self-contained (inline CSS + JS, no external assets) so the user can open it with a double-click, from Finder, or email it to themselves.

## Step 1: Resolve vault + source

Default vault: the vault configured in the most recent similar run. Default source: error out and ask via AskUserQuestion which file to build from.

Read:

- `vaults/<vault>/CLAUDE.md` — for the vault's display name.
- `vaults/<vault>/<source>` — the markdown to convert.

## Step 2: Parse the source markdown

Extract paste blocks using this convention:

1. `## <Section Name>` → top-level grouping in the HTML output (a `<section>` with `<h2>`).
2. `### <Block Label>` inside a section → a labelled block within that section.
3. A fenced code block (triple-backtick) directly after a `### Label` → the paste content for that block.
4. An optional paragraph between `### Label` and the fenced code block → a `field-meta` note under the label (e.g. "Max 220 chars.").
5. A top-level `## Copy-paste blocks` section (by convention in the vault) marks the canonical source; if present, prefer blocks inside it.

If the source has code blocks without `### Label` headers, fall back to auto-labels (`Block 1`, `Block 2`, ...) but prefer asking the user to add labels.

### Example source fragment

```markdown
## Copy-paste blocks

### Headline

Max 220 chars.

\`\`\`
Shipping AI-native software · 10y Angular · Agentic engineering @ Yellowtail · Ex-Fidelity · Amsterdam 🌶
\`\`\`

### About

~120 words.

\`\`\`
I ship AI-native software...

Tech Builder at Yellowtail...
\`\`\`
```

## Step 3: Auto-derive the Rich (HTML) variant

For every block:

- **Single-line** (no `\n`): Plain and Rich are identical. Emit only a Plain button.
- **Multi-line, no bullets:**
  - Plain: preserve `\n` (use `&#10;` in `data-plain`).
  - Rich: wrap each blank-line-separated paragraph in `<p>...</p>`.
- **Multi-line with bullets** (lines starting with `- ` or `* `):
  - Plain: preserve as-is.
  - Rich: emit non-bullet paragraphs as `<p>...</p>`, group consecutive `- ` lines into `<ul><li>...</li></ul>`.
- **Ordered lists** (lines starting with `1. `, `2. `, ...): same as bullets but use `<ol>`.

The Rich clipboard write uses the multi-format API so targets choose:

```javascript
await navigator.clipboard.write([
  new ClipboardItem({
    "text/plain": new Blob([plain], { type: "text/plain" }),
    "text/html":  new Blob([html],  { type: "text/html"  })
  })
]);
```

Targets that don't grok HTML fall back to `text/plain`. LinkedIn About strips HTML, so users paste via the **Plain** button. Docs / Gmail / Notion / blog editors honour HTML, so users paste via **Rich**.

## Step 4: Apply /ro:write-copy scan

Before writing the HTML, scan every block's content for banned patterns:

```
— (em-dash U+2014), – (en-dash U+2013)
delve, leverage, robust, seamless, tapestry, landscape, empower, unlock, streamline (as filler)
"not only X but also Y", "it's not just X, it's Y", "more than just a tool", "at the intersection of"
```

If any hit, flag to the user via a banner at the top of the HTML (`<div class="note warn">...</div>`) naming the offending block. Do not silently rewrite: the content may have been deliberate (e.g. a quote).

## Step 5: Render the HTML

Use this exact template. The navy + teal palette matches the user's LinkedIn cover / CV stack for brand coherence. Keep inline so the file is portable.

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{{TITLE}}</title>
<style>
  :root {
    --navy: #0f172a;
    --navy-2: #1e293b;
    --teal: #14b8a6;
    --teal-deep: #0f766e;
    --cream: #f8fafc;
    --slate: #94a3b8;
    --slate-line: #334155;
    --warn: #f59e0b;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--navy); color: var(--cream); font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.5; }
  .wrap { max-width: 880px; margin: 0 auto; padding: 56px 40px 120px; }
  header { margin-bottom: 48px; }
  header .tag { font-size: 11px; font-weight: 700; letter-spacing: 2.4px; text-transform: uppercase; color: var(--teal); }
  header h1 { font-family: Georgia, serif; font-weight: 700; font-size: 36px; line-height: 1.1; margin: 8px 0 12px; color: #fff; }
  header p { color: var(--slate); margin: 0; max-width: 680px; }
  section { margin-bottom: 48px; }
  section > h2 { font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #fff; border-bottom: 1px solid var(--slate-line); padding-bottom: 10px; margin: 0 0 24px; letter-spacing: 0.3px; }
  .block { margin-bottom: 24px; }
  .block .label { display: block; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: var(--teal); margin-bottom: 6px; }
  .block .field-meta { font-size: 12px; color: var(--slate); margin-bottom: 8px; }
  .copybox { position: relative; background: var(--navy-2); border: 1px solid var(--slate-line); border-radius: 8px; padding: 16px 140px 16px 18px; font-family: "SF Mono", "Menlo", "Consolas", monospace; font-size: 13px; line-height: 1.55; color: var(--cream); white-space: pre-wrap; word-break: break-word; }
  .copybox:hover { border-color: var(--teal-deep); }
  .copybox[data-single] { padding-right: 80px; }
  .btn-row { position: absolute; top: 10px; right: 10px; display: flex; gap: 6px; }
  .cbtn { background: var(--teal); color: var(--navy); border: 0; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; cursor: pointer; transition: background 0.15s ease; }
  .cbtn:hover { background: #2dd4bf; }
  .cbtn.rich { background: var(--slate-line); color: var(--cream); }
  .cbtn.rich:hover { background: var(--teal-deep); color: #fff; }
  .cbtn.copied { background: #7dcea0; color: var(--navy); }
  .cbtn.copied::before { content: "✓ "; }
  .hint { font-size: 12px; color: var(--slate); margin-top: 16px; padding-left: 4px; }
  .hint code { background: var(--navy-2); padding: 2px 6px; border-radius: 3px; color: var(--teal); font-family: inherit; }
  .note { background: rgba(20, 184, 166, 0.08); border-left: 3px solid var(--teal); padding: 12px 16px; margin: 16px 0 24px; font-size: 13px; color: var(--cream); border-radius: 0 6px 6px 0; }
  .note.warn { background: rgba(245, 158, 11, 0.08); border-left-color: var(--warn); }
  .note.warn strong { color: var(--warn); }
  .note strong { color: var(--teal); }
  .legend { display: flex; gap: 24px; margin: 16px 0 0; font-size: 12px; color: var(--slate); }
  .legend .cbtn { font-size: 10px; padding: 3px 8px; pointer-events: none; }
  footer { margin-top: 72px; padding-top: 24px; border-top: 1px solid var(--slate-line); color: var(--slate); font-size: 12px; }
  footer a { color: var(--teal); text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div class="tag">{{SUBTITLE}}</div>
    <h1>{{TITLE}}</h1>
    <p>{{INTRO}}</p>
    <div class="legend">
      <span><button class="cbtn" tabindex="-1">Plain</button> copies text only (LinkedIn, forms).</span>
      <span><button class="cbtn rich" tabindex="-1">Rich</button> copies with HTML formatting (Docs, Gmail, Notion).</span>
    </div>
  </header>

  {{SECTIONS}}

  <footer>
    <p>{{FOOTER}}</p>
  </footer>
</div>

<script>
function feedback(btn) {
  const original = btn.textContent;
  btn.textContent = "Copied";
  btn.classList.add("copied");
  setTimeout(() => { btn.textContent = original; btn.classList.remove("copied"); }, 1500);
}

document.querySelectorAll(".copybox").forEach((box) => {
  const plain = box.getAttribute("data-plain") || box.textContent;
  const html  = box.getAttribute("data-html");
  const plainBtn = box.querySelector(".cbtn:not(.rich)");
  const richBtn  = box.querySelector(".cbtn.rich");

  plainBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(plain); }
    catch { // file:// fallback
      const ta = document.createElement("textarea");
      ta.value = plain; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
    feedback(plainBtn);
  });

  richBtn?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([plain], { type: "text/plain" }),
        "text/html":  new Blob([html],  { type: "text/html"  })
      })]);
    } catch {
      // If ClipboardItem is unavailable, fall back to plain.
      try { await navigator.clipboard.writeText(plain); } catch {}
    }
    feedback(richBtn);
  });
});
</script>
</body>
</html>
```

### Section and block markup

Inside `{{SECTIONS}}`, emit one `<section>` per top-level grouping. Inside each, emit one `.block` per paste block.

**Single-line block** (no HTML variant):

```html
<section>
  <h2>{{SECTION_NAME}}</h2>
  <div class="block">
    <span class="label">{{BLOCK_LABEL}}</span>
    <div class="field-meta">{{OPTIONAL_META}}</div>
    <div class="copybox" data-single data-plain="{{ESCAPED_PLAIN}}">{{DISPLAY_PLAIN}}<span class="btn-row"><button class="cbtn">Copy</button></span></div>
  </div>
</section>
```

**Multi-line block** (with HTML variant):

```html
<div class="block">
  <span class="label">{{BLOCK_LABEL}}</span>
  <div class="field-meta">{{OPTIONAL_META}}</div>
  <div class="copybox" data-plain="{{ESCAPED_PLAIN}}" data-html="{{ESCAPED_HTML}}">{{DISPLAY_PLAIN}}<span class="btn-row"><button class="cbtn">Plain</button><button class="cbtn rich">Rich</button></span></div>
</div>
```

### Escaping rules

- For `data-plain` and `data-html` attributes: HTML-escape `"`, `&`, `<`, `>`, and replace `\n` with `&#10;`.
- For display content inside `<div class="copybox">...</div>`: HTML-escape `"`, `&`, `<`, `>` only. Preserve `\n` as real newlines (the `white-space: pre-wrap` CSS renders them).
- Never insert raw user content into attribute values without escaping.

## Step 6: Save and optionally open

```bash
TS=$(date +%H%M)
DATE=$(date +%Y-%m-%d)
SLUG=$(basename "$SOURCE" .md)
OUT="vaults/$VAULT/artifacts/paste-kits/$SLUG-$DATE-$TS.html"
mkdir -p "$(dirname "$OUT")"
# write file
```

If `--open` was passed, also run `open "$OUT"`.

## Step 7: Report

Print:
- Output path.
- Block count per section.
- Any `/ro:write-copy` hits flagged in Step 4.
- Next steps ("Paste from the Plain button for LinkedIn fields; Rich for Docs / Gmail.").

No auto-commit. Leave commits to the user.

## Rules

- **One source, one output file.** Never overwrite a prior kit; timestamp the filename.
- **Self-contained HTML.** Inline CSS + JS, no external assets. File should work from `file://` and email attachments.
- **Plain is the default button.** For LinkedIn-first workflows, the first-press button is plain.
- **Rich is opt-in per block.** Single-line blocks don't need it; complex blocks (paragraphs, bullets) do.
- **Apply /ro:write-copy rules on every block.** Em-dashes especially — they leak through PDF extractions easily.
- **Escape every attribute.** User content from vault markdown can contain `<`, `>`, `&`, `"`.
- **Palette:** navy (`#0f172a`), teal (`#14b8a6`), cream (`#f8fafc`). Matches the LinkedIn cover + CV stack so kits feel part of the same brand.

## Changelog

- **v0.1.0 (2026-04-24):** initial skill. Dual-format copy (text/plain + text/html) via the multi-format Clipboard API. Palette matches the LinkedIn cover / CV brand stack.
