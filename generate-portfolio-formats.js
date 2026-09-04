#!/usr/bin/env node

/**
 * generate-portfolio-formats.js
 * Compiles a Markdown portfolio document into beautifully styled HTML,
 * and exports it to PDF via headless Chrome.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseInlineMarkdown(text) {
  let result = text;
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  result = result.replace(/`([^`]+)`/g, '<code style="background: #f4f4f5; padding: 2px 5px; border-radius: 4px; font-family: monospace; font-size: 0.9em;">$1</code>');

  result = result.replace(/\[(.*?)\]\((.*?)\)/g, (match, label, url) => {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('mailto:')) {
      if (targetUrl.includes('@')) {
        targetUrl = 'mailto:' + targetUrl;
      } else {
        targetUrl = 'https://' + targetUrl;
      }
    }
    return `<a href="${targetUrl}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 500;">${label}</a>`;
  });

  return result;
}

function mdToHtml(mdText) {
  const lines = mdText.split('\n');
  let html = '';
  let inList = false;

  for (let line of lines) {
    let trimmed = line.trim();

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        html += '<ul style="margin-top: 4px; margin-bottom: 8px; padding-left: 20px;">\n';
        inList = true;
      }
      let content = trimmed.substring(2);
      html += `  <li style="margin-bottom: 4px; color: #334155;">${parseInlineMarkdown(content)}</li>\n`;
      continue;
    }

    if (inList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
      html += '</ul>\n';
      inList = false;
    }

    if (trimmed === '') continue;

    if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
      html += '<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 10px 0;">\n';
      continue;
    }

    if (trimmed.startsWith('# ')) {
      html += `<h1 style="color: #0f172a; font-size: 22px; margin-top: 0; margin-bottom: 4px; border-bottom: 2px solid #0284c7; padding-bottom: 4px;">${parseInlineMarkdown(trimmed.substring(2))}</h1>\n`;
    } else if (trimmed.startsWith('## ')) {
      html += `<h2 style="color: #0369a1; font-size: 16px; margin-top: 14px; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px;">${parseInlineMarkdown(trimmed.substring(3))}</h2>\n`;
    } else if (trimmed.startsWith('### ')) {
      html += `<h3 style="color: #0f172a; font-size: 14px; margin-top: 10px; margin-bottom: 4px;">${parseInlineMarkdown(trimmed.substring(4))}</h3>\n`;
    } else if (trimmed.startsWith('#### ')) {
      html += `<h4 style="color: #334155; font-size: 13px; margin-top: 8px; margin-bottom: 3px;">${parseInlineMarkdown(trimmed.substring(5))}</h4>\n`;
    } else {
      html += `<p style="margin-top: 4px; margin-bottom: 8px; color: #334155; line-height: 1.45;">${parseInlineMarkdown(trimmed)}</p>\n`;
    }
  }

  if (inList) {
    html += '</ul>\n';
  }

  return html;
}

const inputArg = process.argv[2];
if (!inputArg) {
  console.error("Usage: node generate-portfolio-formats.js <path-to-portfolio.md>");
  process.exit(1);
}

const portfolioMdPath = path.resolve(inputArg);
if (!fs.existsSync(portfolioMdPath)) {
  console.error(`Error: File not found at ${portfolioMdPath}`);
  process.exit(1);
}

const mdContent = fs.readFileSync(portfolioMdPath, 'utf8');
const bodyHtml = mdToHtml(mdContent);

const htmlDocument = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page {
      size: letter;
      margin: 0.5in 0.6in 0.5in 0.6in;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-variant-ligatures: none;
      font-feature-settings: "kern" 0;
      font-kerning: none;
      font-size: 14px;
      line-height: 1.45;
      color: #334155;
      margin: 0;
      padding: 0;
    }
    h1, h2, h3, h4 { font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; letter-spacing: normal; }
    ul { margin-top: 4px; margin-bottom: 8px; }
    li { margin-bottom: 4px; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

const tempHtmlPath = portfolioMdPath.replace(/\.md$/, '.tmp.html');
fs.writeFileSync(tempHtmlPath, htmlDocument, 'utf8');

const outputPdfPath = portfolioMdPath.replace(/\.md$/, '.pdf');
const targetDir = path.dirname(portfolioMdPath);
const atsPdfPath = path.join(targetDir, 'fred_brown_portfolio.pdf');

const fileUrl = `file://${tempHtmlPath}`;
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const pdfCmd = `"${chromePath}" --headless=new --export-tagged-pdf --no-pdf-header-footer --disable-gpu --no-sandbox --print-to-pdf="${outputPdfPath}" "${fileUrl}"`;

try {
  execSync(pdfCmd, { stdio: 'pipe' });
  fs.copyFileSync(outputPdfPath, atsPdfPath);
  fs.unlinkSync(tempHtmlPath);
  console.log(`Generated Portfolio PDF: ${outputPdfPath}`);
  console.log(`Prepared ATS upload Portfolio PDF: ${atsPdfPath}`);
} catch (err) {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
}
