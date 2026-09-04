#!/usr/bin/env node

/**
 * update-applied-jobs.js
 * Syncs and updates the central applied_jobs.md catalog from submission-state.json files.
 * 
 * Usage:
 *   node update-applied-jobs.js sync
 *   node update-applied-jobs.js status "<folder_name>" "<status_code>" "[note]"
 * 
 * Status codes:
 *   "completed"   -> ✅ Form Filled
 *   "in_progress" -> ⏳ In Progress
 *   "abandoned"   -> 🚫 Abandoned (Not Applied)
 */

const fs = require('fs');
const path = require('path');

let activeSlug = "candidate";
let profileDir = path.join(__dirname, "profiles", activeSlug);
try {
  const { getActiveProfile } = require("./get-active-profile");
  const active = getActiveProfile();
  activeSlug = active.slug;
  profileDir = active.profileDir;
} catch (e) {}

const submissionsDir = path.join(profileDir, "submissions");
const rootAppliedJobsMd = path.join(__dirname, "applied_jobs.md");
const profileAppliedJobsMd = path.join(profileDir, "applied_jobs.md");

function formatStatusDisplay(status, note) {
  const s = (status || '').toLowerCase();
  if (s.includes('completed') || s.includes('autofilled') || s.includes('submitted') || s.includes('filled')) {
    return '✅ Form Filled';
  } else if (s.includes('abandoned') || s.includes('skipped') || s.includes('canceled') || s.includes('cancelled')) {
    return note ? `🚫 Abandoned (${note})` : '🚫 Abandoned';
  } else if (s.includes('progress') || s.includes('draft') || s.includes('init')) {
    return '⏳ In Progress';
  }
  return status ? `✅ Form Filled` : '⏳ In Progress';
}

function updateSubmissionFolderStatus(folderName, statusCode, note = '') {
  const folderPath = path.join(submissionsDir, folderName);
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder not found: ${folderPath}`);
    process.exit(1);
  }

  const stateFile = path.join(folderPath, 'submission-state.json');
  let stateData = {};

  if (fs.existsSync(stateFile)) {
    try {
      stateData = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
    } catch (e) {}
  }

  stateData.status = statusCode;
  if (note) {
    stateData.abandoned_reason = note;
  }
  stateData.updated_at = new Date().toISOString();

  fs.writeFileSync(stateFile, JSON.stringify(stateData, null, 2), 'utf-8');
  console.log(`Updated ${folderName} status to "${statusCode}"`);
}

function syncAppliedJobsCatalog() {
  if (!fs.existsSync(submissionsDir)) {
    console.error(`Submissions directory not found: ${submissionsDir}`);
    process.exit(1);
  }

  const folders = fs.readdirSync(submissionsDir).sort().reverse();
  const jobs = [];

  for (const folder of folders) {
    const folderPath = path.join(submissionsDir, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const stateFile = path.join(folderPath, 'submission-state.json');
    const jdFile = path.join(folderPath, '01_job_description.md');
    const resumeFile = path.join(folderPath, 'resume.md');

    let company = '';
    let jobTitle = '';
    let createdAt = '';
    let status = 'completed';
    let note = '';

    if (fs.existsSync(stateFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(stateFile, 'utf-8'));
        company = data.company || '';
        jobTitle = data.job_title || '';
        createdAt = data.created_at || '';
        status = data.status || 'completed';
        note = data.abandoned_reason || '';
      } catch (e) {}
    }

    if (fs.existsSync(jdFile)) {
      try {
        const content = fs.readFileSync(jdFile, 'utf-8');
        const cMatch = content.match(/\*\*Company\*\*:\s*([^\n]+)/);
        const tMatch = content.match(/\*\*(?:Title|Role)\*\*:\s*([^\n]+)/);
        const h1Match = content.match(/^#\s*([^\n]+)/m);

        if (cMatch && !company) company = cMatch[1].trim();
        if (tMatch && !jobTitle) jobTitle = tMatch[1].trim();
        else if (h1Match && !jobTitle) {
          const h1Text = h1Match[1].trim();
          if (h1Text.includes(' - ')) {
            const parts = h1Text.split(' - ');
            if (!company) company = parts[0].trim();
            jobTitle = parts[1].trim();
          } else {
            if (!jobTitle) jobTitle = h1Text;
          }
        }
      } catch (e) {}
    }

    if (fs.existsSync(resumeFile) && !jobTitle) {
      try {
        const content = fs.readFileSync(resumeFile, 'utf-8');
        const h2Match = content.match(/^##\s*([^\n]+)/m);
        if (h2Match && h2Match[1].trim() !== 'Technical & Core Competencies') {
          jobTitle = h2Match[1].trim();
        }
      } catch (e) {}
    }

    if (!company || !jobTitle) {
      const parts = folder.split('_');
      if (parts.length >= 3) {
        if (!company) company = parts[1].replace(/-/g, ' ');
        if (!jobTitle) jobTitle = parts.slice(2).join(' ').replace(/_/g, ' ').replace(/-/g, ' ');
      }
    }

    let dateDisplay = createdAt ? createdAt.substring(0, 10) : '';
    if (!dateDisplay && folder.length >= 8 && /^\d{8}/.test(folder)) {
      const d = folder.substring(0, 8);
      dateDisplay = `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`;
    }
    if (!dateDisplay) dateDisplay = 'N/A';

    const companyClean = (company || 'Unknown').replace(/\|/g, '\\|').trim();
    const titleClean = (jobTitle || 'Unknown').replace(/\|/g, '\\|').trim();
    const statusDisplay = formatStatusDisplay(status, note);
    const absPath = path.resolve(folderPath);

    jobs.push({
      date: dateDisplay,
      company: companyClean,
      jobTitle: titleClean,
      statusDisplay,
      folderName: folder,
      absPath
    });
  }

  const mdLines = [
    '# 📋 Job Application Log',
    '',
    `Total Applications Tracked: **${jobs.length}**`,
    '',
    '| Date | Company Name | Job Title | Application Status | Application Package Folder |',
    '| :--- | :--- | :--- | :--- | :--- |'
  ];

  for (const j of jobs) {
    const folderLink = `[${j.folderName}](${j.absPath})`;
    mdLines.push(`| ${j.date} | **${j.company}** | ${j.jobTitle} | ${j.statusDisplay} | ${folderLink} |`);
  }

  const markdownOutput = mdLines.join('\n');
  fs.writeFileSync(rootAppliedJobsMd, markdownOutput, 'utf-8');
  fs.writeFileSync(profileAppliedJobsMd, markdownOutput, 'utf-8');
  console.log(`Successfully synced ${jobs.length} applications to applied_jobs.md!`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'status') {
    const folderName = args[1];
    const statusCode = args[2];
    const note = args[3] || '';
    if (!folderName || !statusCode) {
      console.error('Usage: node update-applied-jobs.js status "<folder_name>" "<completed|in_progress|abandoned>" "[note]"');
      process.exit(1);
    }
    updateSubmissionFolderStatus(folderName, statusCode, note);
    syncAppliedJobsCatalog();
  } else {
    syncAppliedJobsCatalog();
  }
}

main();
