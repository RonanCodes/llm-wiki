#!/usr/bin/env node
/**
 * html-to-pdf.mjs — Render an HTML file to PDF via Playwright (headless Chromium).
 *
 * Usage:
 *   node html-to-pdf.mjs <input.html> <output.pdf> [--format A4|Letter] [--margin <css>]
 *
 * Designed for Observatory-themed HTML books. Preserves dark backgrounds,
 * handles CSS page-break-before, and embeds all styles.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node html-to-pdf.mjs <input.html> <output.pdf> [--format A4|Letter] [--margin <css>]');
  process.exit(1);
}

const inputPath = resolve(args[0]);
const outputPath = resolve(args[1]);

// Parse optional flags
let format = 'A4';
let margin = { top: '1cm', bottom: '1cm', left: '1.5cm', right: '1.5cm' };

for (let i = 2; i < args.length; i++) {
  if (args[i] === '--format' && args[i + 1]) {
    format = args[++i];
  }
  if (args[i] === '--margin' && args[i + 1]) {
    const m = args[++i];
    margin = { top: m, bottom: m, left: m, right: m };
  }
}

const browser = await chromium.launch();
const page = await browser.newPage();

// Load the HTML file
const htmlContent = readFileSync(inputPath, 'utf-8');
await page.setContent(htmlContent, { waitUntil: 'networkidle' });

// Inject print-specific CSS overrides for the PDF
await page.addStyleTag({
  content: `
    @media print {
      /* Preserve dark background in print */
      html, body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      /* Page breaks before each chapter (h1) */
      h1 {
        page-break-before: always;
      }
      /* But not the very first h1 (title) */
      body > header + nav + h1:first-of-type,
      body > h1:first-of-type,
      header h1,
      .title {
        page-break-before: avoid;
      }

      /* Keep headings with their content */
      h1, h2, h3, h4 {
        page-break-after: avoid;
      }

      /* Avoid orphaned list items */
      li, p {
        orphans: 3;
        widows: 3;
      }

      /* Table rows shouldn't split across pages */
      tr {
        page-break-inside: avoid;
      }

      /* Code blocks shouldn't split */
      pre {
        page-break-inside: avoid;
      }
    }
  `
});

// Render to PDF
await page.pdf({
  path: outputPath,
  format: format,
  printBackground: true,  // Critical: preserves dark theme backgrounds
  margin: margin,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `
    <div style="width: 100%; text-align: center; font-size: 9px; color: #64748b; font-family: Inter, system-ui, sans-serif;">
      <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
  `,
});

await browser.close();

const stats = readFileSync(outputPath);
console.log(`PDF generated: ${outputPath} (${(stats.length / 1024).toFixed(0)} KB, ${format})`);
