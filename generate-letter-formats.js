#!/usr/bin/env node

/**
 * generate-letter-formats.js
 * Compiles a Markdown cover letter into beautifully styled HTML,
 * and exports it to DOCX (via macOS textutil) and PDF (via headless Chrome).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

function mdToHtml(mdText) {
  const lines = mdText.split('\n');
  let html = '';
  let inList = false;

  for (let line of lines) {
    let trimmed = line.trim();

    // Handle bullet points
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (!inList) {
        html += '<ul>\n';
        inList = true;
      }
      let content = trimmed.substring(2);
      html += `  <li>${parseInlineMarkdown(content)}</li>\n`;
      continue;
    }

    // Close list if we are leaving list block
    if (inList && !trimmed.startsWith('* ') && !trimmed.startsWith('- ')) {
      html += '</ul>\n';
      inList = false;
    }

    if (trimmed === '') {
      continue;
    }

    // Handle headers
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

function parseInlineMarkdown(text) {
  let result = text;
  // Bold-Italic formatting ***text***
  result = result.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold formatting **text**
  result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic formatting *text*
  result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Link formatting [label](url)
  result = result.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" style="color: #2b6cb0; text-decoration: none; border-bottom: 1px solid #cbd5e0;">$1</a>');
  return result;
}

function getFormattedDate() {
  const date = new Date();
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

function main() {
  const mdFileArg = process.argv[2];
  if (!mdFileArg) {
    console.error('Usage: node generate-letter-formats.js <path_to_cover_letter_markdown>');
    process.exit(1);
  }

  const absoluteMdPath = path.resolve(mdFileArg);
  if (!fs.existsSync(absoluteMdPath)) {
    console.error(`Error: Cover letter file not found at: ${absoluteMdPath}`);
    process.exit(1);
  }

  // Dynamically resolve profile directory & candidate info
  let profileDir = path.join(rootDir, 'profiles', 'fred_brown');
  let candidateSlug = 'fred_brown';
  try {
    const { getActiveProfile } = require('./get-active-profile');
    const profilesMatch = absoluteMdPath.match(/profiles[/\\]([^/\\]+)/);
    if (profilesMatch && profilesMatch[1] !== 'template') {
      candidateSlug = profilesMatch[1];
      profileDir = path.join(rootDir, 'profiles', candidateSlug);
    } else {
      const active = getActiveProfile();
      candidateSlug = active.slug;
      profileDir = active.profileDir;
    }
  } catch (e) {}

  const profilePath = path.join(profileDir, 'personal_info.md');

  if (!fs.existsSync(profilePath)) {
    console.error(`Error: Personal info markdown file not found at: ${profilePath}`);
    process.exit(1);
  }

  const personalInfoContent = fs.readFileSync(profilePath, 'utf-8');
  const fullNameMatch = personalInfoContent.match(/\|\s*\*\*Full Name\*\*\s*\|\s*([^|\n]+)/i);
  const emailMatch = personalInfoContent.match(/\|\s*\*\*Email\*\*\s*\|\s*([^|\n]+)/i);
  const phoneMatch = personalInfoContent.match(/\|\s*\*\*Phone\*\*\s*\|\s*([^|\n]+)/i);

  const profile = {
    full_name: fullNameMatch ? fullNameMatch[1].trim() : '',
    email: emailMatch ? emailMatch[1].trim() : '',
    phone: phoneMatch ? phoneMatch[1].trim() : ''
  };

  if (!profile.full_name || !profile.email || !profile.phone) {
    console.error('Error: Failed to extract contact information from personal_info.md.');
    console.error(`Extracted: Name="${profile.full_name}", Email="${profile.email}", Phone="${profile.phone}"`);
    process.exit(1);
  }

  const mdContent = fs.readFileSync(absoluteMdPath, 'utf-8');

  // Parse out recipient and company details from filename or content
  const baseName = path.basename(absoluteMdPath, '.md');
  const filenameParts = baseName.split('_');
  let company = 'Company Name';
  if (filenameParts.length > 0 && filenameParts[0] !== 'active') {
    company = filenameParts[0];
  }

  // Check for signature image in profile directory
  let signatureImgHtml = '';
  let hasSignatureImg = false;
  const possibleSigExts = ['.png', '.jpg', '.jpeg', '.svg'];
  for (const ext of possibleSigExts) {
    const sigPath = path.join(profileDir, `signature${ext}`);
    if (fs.existsSync(sigPath)) {
      const sigBuffer = fs.readFileSync(sigPath);
      const mime = ext === '.svg' ? 'image/svg+xml' : `image/${ext.replace('.', '')}`;
      const sigBase64 = sigBuffer.toString('base64');
      signatureImgHtml = `<img src="data:${mime};base64,${sigBase64}" style="height: 48px; width: auto; margin-top: 2px; margin-bottom: 6px; display: block;" alt="Signature" />`;
      hasSignatureImg = true;
      break;
    }
  }

  // Generate HTML body from Markdown
  const htmlBody = mdToHtml(mdContent);

  const lastParaMargin = hasSignatureImg ? '4px' : '18px';
  const sigMarginTop = hasSignatureImg ? '2px' : '30px';

  // Define HTML letterhead document template
  const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Cover Letter - ${profile.full_name}</title>
  <style>
    @page {
      size: letter;
      margin: 1in;
    }
    body {
      font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
      font-variant-ligatures: none;
      font-feature-settings: "kern" 0;
      font-kerning: none;
      color: #2d3748;
      line-height: 1.5;
      font-size: 15px;
      margin: 40px auto;
      max-width: 6.5in;
      padding: 0 10px;
    }
    .meta-section {
      margin-bottom: 25px;
      font-size: 14px;
      color: #2d3748;
    }
    .date {
      color: #718096;
      margin-bottom: 12px;
    }
    .recipient {
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: 12px;
    }
    .content {
      margin-top: 20px;
    }
    .content p {
      margin-bottom: 18px;
      text-align: left;
    }
    .content p:last-child {
      margin-bottom: ${lastParaMargin};
    }
    .content ul {
      margin-bottom: 18px;
      padding-left: 20px;
    }
    .content li {
      margin-bottom: 8px;
      text-align: left;
    }
    .signature {
      margin-top: ${sigMarginTop};
      line-height: 1.4;
    }
    a {
      color: #2b6cb0;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="meta-section">
    <div class="date">${getFormattedDate()}</div>
  </div>
  
  <div class="content">
    ${htmlBody}
  </div>

  <div class="signature">
    ${signatureImgHtml}
    <strong>${profile.full_name}</strong><br>
    <a href="mailto:${profile.email}">${profile.email}</a><br>
    ${profile.phone}
  </div>
</body>
</html>
`;

  // Write HTML file
  const baseDir = path.dirname(absoluteMdPath);
  const pdfPath = path.join(baseDir, `${baseName}.pdf`);
  const atsPdfPath = path.join(baseDir, `${candidateSlug}_cover_letter.pdf`);
  const htmlPath = path.join(baseDir, `temp_${baseName}.html`);

  fs.writeFileSync(htmlPath, htmlTemplate, 'utf-8');

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

  // Convert to PDF via headless Google Chrome
  try {
    const fileUrl = `file://${htmlPath}`;
    const chromeBin = findChrome();
    execSync(`"${chromeBin}" --headless=new --export-tagged-pdf --print-to-pdf="${pdfPath}" --no-pdf-header-footer "${fileUrl}"`);
    console.log(`Generated PDF cover letter: ${pdfPath}`);

    // Copy to candidate ATS cover letter PDF
    fs.copyFileSync(pdfPath, atsPdfPath);
    console.log(`Prepared ATS upload cover letter PDF: ${atsPdfPath}`);

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
      const companyPdfPath = path.join(baseDir, `${candidateSlug}_cover_letter_for_${companySlug}.pdf`);
      fs.copyFileSync(pdfPath, companyPdfPath);
      console.log(`Prepared company-branded cover letter PDF: ${companyPdfPath}`);

      if (fullSlug && fullSlug !== companySlug) {
        const fullCompanyPdfPath = path.join(baseDir, `${candidateSlug}_cover_letter_for_${fullSlug}.pdf`);
        fs.copyFileSync(pdfPath, fullCompanyPdfPath);
        console.log(`Prepared company-branded cover letter PDF (full): ${fullCompanyPdfPath}`);
      }
    }
  } catch (err) {
    console.error('Failed to generate PDF via headless Chrome:', err.message);
  }

  // Clean up temporary HTML file
  try {
    if (fs.existsSync(htmlPath)) {
      fs.unlinkSync(htmlPath);
    }
  } catch (e) {}

  console.log('\nPDF cover letter generated successfully!');
}

main();
