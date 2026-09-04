#!/usr/bin/env node

/**
 * compile-resume-pdf.js
 * Compiles a Markdown resume into a clean PDF using headless Chrome.
 * Correctly parses Markdown headings, bold text (**text**), bullet lists, and hyperlinks ([text](url)).
 * Automatically converts email addresses to clickable mailto: links.
 * Saves the compiled PDF to the local path and updates resumes/fred_brown_resume.pdf for ATS form uploads.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function parseInlineMarkdown(text) {
  let result = text;
  // Bold-Italic formatting ***text***
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold formatting **text**
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic formatting *text*
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Explicit Markdown Link formatting [label](url) -> <a href="url">label</a>
  result = result.replace(/\[(.*?)\]\((.*?)\)/g, (match, label, url) => {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && !targetUrl.startsWith('mailto:')) {
      if (targetUrl.includes('@')) {
        targetUrl = 'mailto:' + targetUrl;
      } else {
        targetUrl = 'https://' + targetUrl;
      }
    }
    return `<a href="${targetUrl}" target="_blank" style="color: #0066cc; text-decoration: none; font-weight: 500;">${label}</a>`;
  });

  // Auto-hyperlink standalone email addresses if not already wrapped in <a> tags
  result = result.replace(/(^|[\s,(])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})([\s,)]|$)/g, (match, p1, email, p3) => {
    // Avoid double wrapping if already inside HTML tag or markdown link
    if (result.includes(`">${email}</a>`)) return match;
    return `${p1}<a href="mailto:${email}" style="color: #0066cc; text-decoration: none; font-weight: 500;">${email}</a>${p3}`;
  });

  return result;
}

function mdToHtml(mdText) {
  const lines = mdText.split('\n');
  let html = '';
  let inList = false;

  for (let line of lines) {
    let trimmed = line.trim();

    // Bullet points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      let content = trimmed.substring(2);
      html += `  <li>${parseInlineMarkdown(content)}</li>\n`;
      continue;
    }

    // Close list block if leaving list
    if (inList && !trimmed.startsWith('- ') && !trimmed.startsWith('* ')) {
      html += '</ul>\n';
      inList = false;
    }

    if (trimmed === '') {
      continue;
    }

    if (trimmed === '---') {
      html += '<hr>\n';
      continue;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      html += `<h1>${parseInlineMarkdown(trimmed.substring(2))}</h1>\n`;
    } else if (trimmed.startsWith('## ')) {
      html += `<h2>${parseInlineMarkdown(trimmed.substring(3))}</h2>\n`;
    } else if (trimmed.startsWith('### ')) {
      html += `<h3>${parseInlineMarkdown(trimmed.substring(4))}</h3>\n`;
    } else if (trimmed.startsWith('#### ')) {
      html += `<h4>${parseInlineMarkdown(trimmed.substring(5))}</h4>\n`;
    } else if (trimmed.startsWith('##### ')) {
      html += `<h5>${parseInlineMarkdown(trimmed.substring(6))}</h5>\n`;
    } else if (trimmed.startsWith('###### ')) {
      html += `<h6>${parseInlineMarkdown(trimmed.substring(7))}</h6>\n`;
    } else {
      // Normal paragraph
      html += `<p>${parseInlineMarkdown(trimmed)}</p>\n`;
    }
  }

  if (inList) {
    html += '</ul>\n';
  }

  return html;
}

function main() {
  const mdFileArg = process.argv[2];
  if (!mdFileArg) {
    console.error('Usage: node compile-resume-pdf.js <path_to_resume_markdown>');
    process.exit(1);
  }

  const absoluteMdPath = path.resolve(mdFileArg);
  if (!fs.existsSync(absoluteMdPath)) {
    console.error(`Error: Resume file not found at: ${absoluteMdPath}`);
    process.exit(1);
  }

  const baseDir = path.dirname(absoluteMdPath);
  const baseName = path.basename(absoluteMdPath, '.md');
  const tempHtmlPath = path.join(baseDir, `temp_${baseName}.html`);
  const pdfPath = path.join(baseDir, `${baseName}.pdf`);

  // Dynamically resolve candidate metadata
  let candidateSlug = 'fred_brown';
  let candidateFullName = 'Fred Brown';
  try {
    const { getActiveProfile, parsePersonalInfo } = require('./get-active-profile');
    // Check if path is within a profile folder
    const profilesMatch = absoluteMdPath.match(/profiles[/\\]([^/\\]+)/);
    if (profilesMatch && profilesMatch[1] !== 'template') {
      candidateSlug = profilesMatch[1];
      const pInfo = parsePersonalInfo(path.join(path.resolve(__dirname), 'profiles', candidateSlug));
      if (pInfo.fullName) candidateFullName = pInfo.fullName;
    } else {
      const active = getActiveProfile();
      candidateSlug = active.slug;
      candidateFullName = active.fullName;
    }
  } catch (e) {}

  const atsPdfPath = path.join(baseDir, `${candidateSlug}_resume.pdf`);

  // Detect Chrome binary cross-platform
  function findChrome() {
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
    const candidates = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium'
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return 'google-chrome';
  }

  const mdContent = fs.readFileSync(absoluteMdPath, 'utf-8');
  const bodyHtml = mdToHtml(mdContent);

  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${candidateFullName} Resume</title>
  <style>
    @page {
      size: letter;
      margin: 0.5in;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-variant-ligatures: none;
      font-feature-settings: "kern" 0;
      font-kerning: none;
      color: #222222;
      line-height: 1.4;
      font-size: 13px;
      margin: 0 auto;
      max-width: 7.5in;
      padding: 0;
    }
    h1 {
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 4px;
      color: #111111;
      font-weight: 700;
    }
    h2 {
      font-size: 14px;
      margin-top: 14px;
      margin-bottom: 6px;
      padding-bottom: 2px;
      border-bottom: 1.5px solid #333333;
      text-transform: uppercase;
      letter-spacing: normal;
      color: #1a1a1a;
    }
    h3 {
      font-size: 13px;
      margin-top: 10px;
      margin-bottom: 4px;
      color: #222222;
    }
    h4 {
      font-size: 12px;
      margin-top: 8px;
      margin-bottom: 3px;
      color: #333333;
      font-weight: 600;
    }
    h5, h6 {
      font-size: 12px;
      margin-top: 6px;
      margin-bottom: 2px;
      color: #444444;
      font-weight: 600;
    }
    p {
      margin: 3px 0 6px 0;
    }
    ul {
      margin: 4px 0 8px 18px;
      padding: 0;
    }
    li {
      margin-bottom: 4px;
    }
    hr {
      border: 0;
      border-top: 1px solid #e0e0e0;
      margin: 10px 0;
    }
    a {
      color: #0066cc;
      text-decoration: none;
      font-weight: 500;
    }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>
`;

  fs.writeFileSync(tempHtmlPath, htmlTemplate, 'utf-8');

  try {
    const fileUrl = `file://${tempHtmlPath}`;
    const chromeBin = findChrome();
    execSync(`"${chromeBin}" --headless=new --export-tagged-pdf --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${fileUrl}"`);
    console.log(`✅ Generated PDF resume: ${pdfPath}`);

    // Copy to candidate ATS resume PDF
    fs.copyFileSync(pdfPath, atsPdfPath);
    console.log(`✅ Prepared ATS upload PDF: ${atsPdfPath}`);

    // Determine company name for candidate-branded company filename
    let companySlug = '';
    let fullSlug = '';
    const statePath = path.join(baseDir, 'submission-state.json');
    if (fs.existsSync(statePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        if (state.company) {
          const firstWord = state.company.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          fullSlug = state.company.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
          companySlug = firstWord || fullSlug;
        }
      } catch (e) {}
    }

    if (!companySlug) {
      const dirName = path.basename(baseDir);
      const match = dirName.match(/^\d{8}_([^_]+)/);
      if (match) {
        companySlug = match[1].toLowerCase().replace(/[^a-z0-9]/g, '');
      }
    }

    if (companySlug) {
      const companyPdfPath = path.join(baseDir, `${candidateSlug}_resume_for_${companySlug}.pdf`);
      fs.copyFileSync(pdfPath, companyPdfPath);
      console.log(`✅ Prepared company-branded resume PDF: ${companyPdfPath}`);

      if (fullSlug && fullSlug !== companySlug) {
        const fullCompanyPdfPath = path.join(baseDir, `${candidateSlug}_resume_for_${fullSlug}.pdf`);
        fs.copyFileSync(pdfPath, fullCompanyPdfPath);
        console.log(`✅ Prepared company-branded resume PDF (full): ${fullCompanyPdfPath}`);
      }
    }
  } catch (err) {
    console.error('Failed to generate PDF via headless Chrome:', err.message);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
}

main();
