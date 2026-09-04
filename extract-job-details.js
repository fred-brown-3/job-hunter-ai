#!/usr/bin/env node

/**
 * extract-job-details.js
 * Scrapes job details (title, company, URL, full description text)
 * from the active Chrome tab and saves them to `.state/active_job_details.json`.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const chromeControlPath = path.join(rootDir, 'chrome-control.js');
const stateDir = path.join(rootDir, '.state');
const outputPath = path.join(stateDir, 'active_job_details.json');

function runControlCommand(args) {
  try {
    const output = execSync(`node "${chromeControlPath}" ${args}`, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    return output.trim();
  } catch (err) {
    console.error(`Failed to run chrome-control.js with args "${args}":`, err.message);
    process.exit(1);
  }
}

function main() {
  const useActiveTab = process.argv.includes('--use-active-tab');
  if (useActiveTab) {
    console.log('Refreshing target from the foreground Chrome tab...');
    runControlCommand('use-active-tab');
  } else {
    console.log('Using the currently pinned Chrome tab...');
  }

  const activeUrl = runControlCommand('url');
  console.log(`Targeting page: ${activeUrl}`);

  // Define client-side scraping script
  const scraperJsCode = `
    const url = window.location.href;
    let title = '';
    let company = '';
    let description = '';

    // WTTJ Card details check
    if (url.includes('welcometothejungle.com/jobs')) {
      const h1s = Array.from(document.querySelectorAll('h1')).filter(h1 => h1.closest('[class*="gEjmGG"]'));
      let activeH1 = null;
      let minLeftDistance = Infinity;

      // Find the card closest to horizontal center of viewport
      for (const h1 of h1s) {
        let cardEl = h1;
        for (let i = 0; i < 8; i++) {
          if (cardEl) cardEl = cardEl.parentElement;
        }
        if (cardEl) {
          const rect = cardEl.getBoundingClientRect();
          const dist = Math.abs(rect.left);
          if (dist < minLeftDistance) {
            minLeftDistance = dist;
            activeH1 = h1;
          }
        }
      }

      if (activeH1) {
        const h1Text = activeH1.innerText || '';
        const parts = h1Text.split(',');
        title = parts.slice(0, -1).join(',').trim() || h1Text;
        company = parts.length > 1 ? parts[parts.length - 1].trim() : '';

        let activeCard = activeH1;
        for (let i = 0; i < 8; i++) {
          if (activeCard) activeCard = activeCard.parentElement;
        }
        if (!company && activeCard) {
          company = activeCard.querySelector('a[href*="/company"]')?.innerText || '';
        }
        description = activeCard ? activeCard.innerText : '';
      }
    } else {
      // Generic external board check (Greenhouse, Lever, etc.)
      title = document.querySelector('h1')?.innerText || document.title;
      
      // Attempt meta properties for structured details
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
      if (ogTitle.includes(' at ')) {
        const parts = ogTitle.split(' at ');
        title = parts[0].trim();
        company = parts[1].trim();
      } else if (ogTitle.includes(' - ')) {
        const parts = ogTitle.split(' - ');
        company = parts[0].trim();
        title = parts[1].trim();
      } else {
        // Fallback: check site name or clean title
        company = document.querySelector('meta[property="og:site_name"]')?.content || '';
        if (!company && document.title.includes(' at ')) {
          company = document.title.split(' at ')[1].trim();
        } else if (!company && document.title.includes(' @ ')) {
          const titleParts = document.title.split(' @ ');
          title = titleParts[0].trim() || title;
          company = titleParts.slice(1).join(' @ ').trim();
        }
      }

      // Capture main description content block
      const descSelectors = ['#content', '.job-description', '#main', '.posting-page', '.section'];
      let descEl = null;
      for (const sel of descSelectors) {
        descEl = document.querySelector(sel);
        if (descEl) break;
      }
      description = descEl ? descEl.innerText : document.body.innerText;
    }

    return {
      title,
      company,
      url,
      description
    };
  `;

  const tempScriptPath = path.join(stateDir, 'temp_scrape.js');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  fs.writeFileSync(tempScriptPath, scraperJsCode, 'utf-8');
  console.log('Extracting job description details from DOM...');
  const jsonResult = runControlCommand(`eval-file "${tempScriptPath}"`);
  
  try {
    fs.unlinkSync(tempScriptPath);
  } catch (e) {}

  try {
    const jobDetails = JSON.parse(jsonResult);
    if (!jobDetails.title) {
      jobDetails.title = 'Unknown Title';
    }
    if (!jobDetails.company) {
      jobDetails.company = 'Unknown Company';
    }

    fs.writeFileSync(outputPath, JSON.stringify(jobDetails, null, 2), 'utf-8');
    
    console.log('\n--- Job Details Extracted ---');
    console.log(`Title:   ${jobDetails.title}`);
    console.log(`Company: ${jobDetails.company}`);
    console.log(`URL:     ${jobDetails.url}`);
    console.log(`Description size: ${jobDetails.description ? jobDetails.description.length : 0} characters`);
    console.log(`Saved details to: ${outputPath}\n`);
    console.log('Successfully completed job details extraction!');
  } catch (e) {
    console.error('Failed to parse scraper results JSON output:', jsonResult);
    process.exit(1);
  }
}

main();
