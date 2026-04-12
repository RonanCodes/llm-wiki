---
name: ingest-office
description: Extract text from Office documents (Word, Excel, PowerPoint) for wiki ingestion. Lazy-installs pandoc on first use.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(pandoc *) Read
---

# Ingest Office Documents

Extract text from Word (.docx), Excel (.xlsx), and PowerPoint (.pptx) files.

## Dependency Check

```bash
which pandoc >/dev/null 2>&1 || {
  echo "Installing pandoc for Office document support..."
  brew install pandoc
}
```

## Extraction Methods

**Word (.docx):**
```bash
pandoc -f docx -t markdown "<file-path>"
```

**PowerPoint (.pptx):**
```bash
pandoc -f pptx -t markdown "<file-path>"
```

**Excel (.xlsx):**
Pandoc doesn't handle Excel natively. Use:
```bash
# Convert to CSV first if possible, or read with Python
python3 -c "
import openpyxl
wb = openpyxl.load_workbook('<file-path>', read_only=True)
for sheet in wb.sheetnames:
    ws = wb[sheet]
    print(f'## Sheet: {sheet}')
    for row in ws.iter_rows(values_only=True):
        print(' | '.join(str(c) if c else '' for c in row))
    print()
"
```
If openpyxl is not installed: `pip3 install openpyxl`

## Post-Extraction

1. Copy the original file to vault's `raw/` if not already there
2. Pass extracted content to ingest router for wiki page creation
3. Note the source-type in the source-note (word/excel/powerpoint)
