#!/usr/bin/env node

/**
 * list_jobs.js
 * Node.js automation script that interfaces with chrome-control.js to
 * extract multiple job cards sequentially on Welcome to the Jungle.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '../../../../');
const chromeControlPath = path.join(rootDir, 'chrome-control.js');
const extractJsPath = path.join(__dirname, 'extract_jobs.js');

function runControlCommand(args, allowFailure = false) {
  try {
    const output = execSync(`node "${chromeControlPath}" ${args}`, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'] // ignore stderr warnings
    });
    return output.trim();
  } catch (err) {
    if (allowFailure) {
      return null;
    }
    console.error(`Failed to run chrome-control.js with args "${args}":`, err.message);
    process.exit(1);
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const countArg = process.argv[2];
  const maxJobs = countArg ? parseInt(countArg, 10) : 5;

  if (isNaN(maxJobs) || maxJobs <= 0) {
    console.error('Usage: node list_jobs.js [number_of_jobs_to_list]');
    process.exit(1);
  }

  console.log(`Starting Welcome to the Jungle scraping loop for ${maxJobs} jobs...`);

  // Verify we are on the jobs page
  const initialUrl = runControlCommand('url');
  if (!initialUrl.includes('welcometothejungle.com/jobs')) {
    console.error(`Error: Browser is not on a Welcome to the Jungle jobs page. Current URL: ${initialUrl}`);
    console.error('Please navigate to https://app.welcometothejungle.com/jobs first.');
    process.exit(1);
  }

  const scrapedJobs = [];

  for (let i = 0; i < maxJobs; i++) {
    console.log(`\n[${i + 1}/${maxJobs}] Extracting current job card...`);
    
    // Evaluate the extraction script via eval-file
    const jsonOutput = runControlCommand(`eval-file "${extractJsPath}"`);
    
    let jobDetails;
    try {
      jobDetails = JSON.parse(jsonOutput);
      scrapedJobs.push(jobDetails);
      console.log(`-> Found: ${jobDetails.title} at ${jobDetails.company} (${jobDetails.location}, Salary: ${jobDetails.salary})`);
    } catch (e) {
      console.error(`Failed to parse job card output: ${jsonOutput}`);
      break;
    }

    if (i < maxJobs - 1) {
      console.log('Clicking "Next" button...');
      const clickRes = runControlCommand('click "[data-testid=\'next-button\']"', true);
      if (clickRes === null) {
        console.log('Stopping loop: "Next" button not found or disabled (reached end of queue).');
        break;
      }

      // Wait for URL to change (representing a new card load)
      const currentUrl = jobDetails.url;
      let urlChanged = false;
      
      for (let attempt = 0; attempt < 15; attempt++) {
        await sleep(200);
        const newUrl = runControlCommand('url');
        if (newUrl !== currentUrl) {
          urlChanged = true;
          break;
        }
      }

      if (urlChanged) {
        // Wait for React DOM to render new card content and slide transition to finish
        await sleep(1500);
      }

      if (!urlChanged) {
        console.warn('Warning: URL did not change after clicking Next. Next button might be disabled or loading is slow.');
        // Brief extra sleep and check one more time
        await sleep(1000);
        const finalUrl = runControlCommand('url');
        if (finalUrl === currentUrl) {
          console.log('Stopping loop: reached end of job matching queue.');
          break;
        }
      }
    }
  }

  console.log('\n--- Extraction Complete ---\n');
  console.log(`Total jobs extracted: ${scrapedJobs.length}\n`);

  // Format as Markdown table
  if (scrapedJobs.length > 0) {
    console.log('| Job Title | Company | Location | Salary | Link |');
    console.log('| :--- | :--- | :--- | :--- | :--- |');
    for (const job of scrapedJobs) {
      console.log(`| **${job.title}** | ${job.company} | ${job.location} | ${job.salary} | [View Card](${job.url}) |`);
    }
  } else {
    console.log('No jobs found.');
  }
}

main();
