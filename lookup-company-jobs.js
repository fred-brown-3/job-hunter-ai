#!/usr/bin/env node

/**
 * lookup-company-jobs.js
 * Queries applied_jobs.md for prior submissions to a specific company.
 * 
 * Usage:
 *   node lookup-company-jobs.js "Company Name"
 */

const fs = require('fs');
const path = require('path');

function searchCompanyJobs(companyQuery) {
  if (!companyQuery) {
    console.error('Usage: node lookup-company-jobs.js "<company_name>"');
    process.exit(1);
  }

  const queryClean = companyQuery.trim().toLowerCase();
  
  // Try applied_jobs.md in root or profiles/fred_brown
  const possiblePaths = [
    path.join(__dirname, 'applied_jobs.md'),
    path.join(__dirname, 'profiles', 'fred_brown', 'applied_jobs.md')
  ];

  let mdPath = possiblePaths.find(p => fs.existsSync(p));
  if (!mdPath) {
    console.log(JSON.stringify({ query: companyQuery, count: 0, matches: [] }, null, 2));
    process.exit(0);
  }

  const content = fs.readFileSync(mdPath, 'utf-8');
  const lines = content.split('\n');
  
  const matches = [];

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('---') || line.includes('Company Name')) {
      continue;
    }

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 4) {
      const date = cells[0];
      const companyClean = cells[1].replace(/\*/g, '').replace(/\\/g, '').trim();
      const titleClean = cells[2].replace(/\\/g, '').trim();
      const statusClean = cells[3].trim();
      
      // Find folder link in any remaining cell
      let folderName = '';
      let folderPath = '';

      for (let i = 3; i < cells.length; i++) {
        const linkMatch = cells[i].match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          folderName = linkMatch[1];
          folderPath = linkMatch[2];
          break;
        }
      }

      if (companyClean.toLowerCase().includes(queryClean) || folderName.toLowerCase().includes(queryClean)) {
        matches.push({
          date,
          company: companyClean,
          job_title: titleClean,
          status: statusClean,
          folder_name: folderName || companyClean,
          folder_path: folderPath
        });
      }
    }
  }

  return { query: companyQuery, count: matches.length, matches };
}

const query = process.argv.slice(2).join(' ');
const result = searchCompanyJobs(query);

console.log(JSON.stringify(result, null, 2));
