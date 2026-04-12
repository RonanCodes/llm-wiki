---
name: ingest-pdf
description: Extract text content from PDF files for wiki ingestion. Lazy-installs poppler on first use.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(pdftotext *) Read
---

# Ingest PDF

Extract text from a PDF file.

## Dependency Check

```bash
which pdftotext >/dev/null 2>&1 || {
  echo "Installing poppler for PDF support..."
  brew install poppler
}
```

## Extraction Method

```bash
pdftotext -layout "<file-path>" -
```

The `-layout` flag preserves formatting. Output goes to stdout for Claude to process.

For large PDFs, extract specific pages:
```bash
pdftotext -f <first-page> -l <last-page> "<file-path>" -
```

## Post-Extraction

1. Copy the original PDF to vault's `raw/` if not already there
2. The extracted text is passed back to the ingest router for wiki page creation
3. Note in the source-note that this was extracted from PDF (some formatting may be lost)

## Limitations

- Scanned PDFs (image-only) won't extract text — note this for the user
- Complex tables may lose structure
- Multi-column layouts may interleave columns
