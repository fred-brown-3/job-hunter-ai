#!/usr/bin/env node

/**
 * lookup-linkedin-recruiters.js
 * Uses LinkedIn Faceted Company Search (currentCompany) to identify recruiters,
 * talent acquisition partners, and hiring managers currently working at the target company.
 */

const { execSync, execFileSync } = require('child_process');

const KNOWN_COMPANY_IDS = {
  'clickup': '12949663',
  'fingerprint': '30164803',
  'formation bio': '53457193',
  'vanta': '27181347',
  'cohere': '30129202',
  'yipitdata': '580665'
};

function getActiveTabId() {
  try {
    const raw = execSync(`osascript -e 'tell application "Google Chrome" to get id of active tab of front window'`, { encoding: 'utf-8' });
    return raw.trim();
  } catch (e) {
    return null;
  }
}

function resolveCompanyId(companyName) {
  const key = companyName.toLowerCase().trim();
  if (KNOWN_COMPANY_IDS[key]) {
    return KNOWN_COMPANY_IDS[key];
  }

  const searchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(companyName)}`;
  let tempTabId = null;

  try {
    const rawId = execSync(`osascript -e 'tell application "Google Chrome"
      tell front window
        set t to make new tab with properties {URL:"${searchUrl}"}
        set active tab index to (count of tabs)
        return id of t
      end tell
    end tell'`, { encoding: 'utf-8' }).trim();
    tempTabId = rawId;

    if (tempTabId) {
      execSync(`echo '{"tab_id":${tempTabId}}' > .state/chrome_tab_config.json`);
    }

    execSync('sleep 4.5');
  } catch (e) {
    return null;
  }

  const js = `
    const firstComp = document.querySelector('a[href*="/company/"]');
    return firstComp ? firstComp.href : null;
  `;

  let compUrl = null;
  try {
    const rawOutput = execFileSync('node', ['chrome-control.js', 'eval', js], { encoding: 'utf-8' });
    compUrl = JSON.parse(rawOutput.trim());
  } catch (e) {}

  if (tempTabId) {
    try {
      execSync(`osascript -e 'tell application "Google Chrome" to close (first tab of front window whose id is ${tempTabId})'`);
    } catch (e) {}
  }

  if (compUrl) {
    try {
      const cTabId = execSync(`osascript -e 'tell application "Google Chrome"
        tell front window
          set t to make new tab with properties {URL:"${compUrl}"}
          set active tab index to (count of tabs)
          return id of t
        end tell
      end tell'`, { encoding: 'utf-8' }).trim();

      if (cTabId) {
        execSync(`echo '{"tab_id":${cTabId}}' > .state/chrome_tab_config.json`);
      }
      execSync('sleep 4.5');

      const urnJs = `
        const html = document.documentElement.outerHTML;
        const match = html.match(/urn:li:company:(\\d+)/) || html.match(/"objectUrn":"urn:li:company:(\\d+)"/) || html.match(/currentCompany=%5B%22(\\d+)%22%5D/);
        return match ? match[1] : null;
      `;
      const rawUrn = execFileSync('node', ['chrome-control.js', 'eval', urnJs], { encoding: 'utf-8' });
      const compId = JSON.parse(rawUrn.trim());

      execSync(`osascript -e 'tell application "Google Chrome" to close (first tab of front window whose id is ${cTabId})'`);
      if (compId) return compId;
    } catch (e) {}
  }

  return null;
}

function searchRecruiters(companyName) {
  const originalTabId = getActiveTabId();
  console.log(`🔍 Precision recruiter & hiring manager search for "${companyName}"...`);

  const compId = resolveCompanyId(companyName);
  let searchUrl = '';

  const titleQuery = encodeURIComponent('recruiter OR "talent acquisition" OR "hiring manager" OR "talent lead" OR "head of talent"');

  if (compId) {
    console.log(`✅ Using LinkedIn currentCompany ID: ${compId}`);
    searchUrl = `https://www.linkedin.com/search/results/people/?origin=FACETED_SEARCH&currentCompany=%5B%22${compId}%22%5D&keywords=${titleQuery}`;
  } else {
    searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(companyName + ' (recruiter OR "talent acquisition" OR "hiring manager")')}`;
  }

  let newTabId = null;
  try {
    const rawId = execSync(`osascript -e 'tell application "Google Chrome"
      tell front window
        set t to make new tab with properties {URL:"${searchUrl}"}
        set active tab index to (count of tabs)
        return id of t
      end tell
    end tell'`, { encoding: 'utf-8' }).trim();
    newTabId = rawId;

    if (newTabId) {
      execSync(`echo '{"tab_id":${newTabId}}' > .state/chrome_tab_config.json`);
    }

    execSync('sleep 5.0');
  } catch (e) {
    console.error("Failed to open search tab:", e.message);
  }

  const js = `
    const results = [];
    const seen = new Set();
    const links = Array.from(document.querySelectorAll('a[href*="/in/"]'));
    const targetCompLower = "${companyName.toLowerCase().replace(/['"]/g, '')}";
    
    // Explicit talent & recruiting keywords
    const RECRUITER_KEYWORDS = [
      'recruiter', 'recruiting', 'talent acquisition', 'talent partner', 'talent lead', 
      'head of talent', 'talent advisor', 'talent specialist', 'sourcer', 'sourcing manager', 
      'hiring manager', 'vp of talent', 'director of talent', 'people acquisition', 'talent management'
    ];
    
    links.forEach(a => {
      const text = a.innerText.trim();
      const href = a.href.split('?')[0];
      
      if (text && !text.includes('LinkedIn Member') && !text.includes('View') && !text.includes('mutual') && text.length > 2) {
        const name = text.split('\\n')[0].trim();
        if (name && !seen.has(name) && !seen.has(href)) {
          const card = a.closest('li') || a.closest('div');
          const cardText = card ? card.innerText : '';
          
          let degree = '3rd+';
          if (cardText.includes('• 1st') || cardText.includes('1st degree')) degree = '1st';
          else if (cardText.includes('• 2nd') || cardText.includes('2nd degree')) degree = '2nd';
          
          const lines = cardText.split('\\n').map(l => l.trim()).filter(Boolean);
          let headline = '';
          const nameIdx = lines.findIndex(l => l.includes(name));
          if (nameIdx !== -1 && lines[nameIdx + 1]) {
            headline = lines.slice(nameIdx + 1).find(l => !l.includes('1st') && !l.includes('2nd') && !l.includes('3rd') && !l.includes('Connect') && !l.includes('Message') && !l.includes('mutual')) || '';
          }

          const headlineLower = headline.toLowerCase();
          
          // Must match a genuine recruiter/talent keyword in headline
          const isRecruiter = RECRUITER_KEYWORDS.some(kw => headlineLower.includes(kw));
          
          // Strict cross-company check: if headline explicitly lists another company after @ or at
          let isDifferentCompany = false;
          if (headline.includes('@') || headlineLower.includes(' at ')) {
            const parts = headline.split(/@|\\bat\\b/i);
            if (parts.length > 1) {
              const compPart = parts[parts.length - 1].trim().toLowerCase();
              const firstWord = compPart.split(/[^a-z0-9]/i)[0];
              if (!compPart.includes(targetCompLower) && !targetCompLower.includes(firstWord) && firstWord.length > 2) {
                const genericWords = ['workday', 'tech', 'technology', 'global', 'remote', 'us', 'usa', 'inc', 'corp', 'llc', 'solutions', 'talent', 'hiring', 'recruiting', 'university'];
                if (!genericWords.includes(firstWord)) {
                  isDifferentCompany = true;
                }
              }
            }
          }

          if (isRecruiter && !isDifferentCompany) {
            seen.add(name);
            seen.add(href);
            results.push({ name, degree, headline, url: href });
          }
        }
      }
    });
    
    return results;
  `;

  let recruiters = [];
  try {
    const rawOutput = execFileSync('node', ['chrome-control.js', 'eval', js], { encoding: 'utf-8' });
    recruiters = JSON.parse(rawOutput.trim());
  } catch (e) {
    console.error("Eval error:", e.message);
  }

  try {
    if (newTabId) {
      execSync(`osascript -e 'tell application "Google Chrome" to close (first tab of front window whose id is ${newTabId})'`);
    }
    if (originalTabId) {
      execSync(`osascript -e 'tell application "Google Chrome"
        repeat with w in windows
          set idx to 1
          repeat with t in tabs of w
            if id of t is ${originalTabId} then
              set active tab index of w to idx
              set index of w to 1
              exit repeat
            end if
            set idx to idx + 1
          end repeat
        end repeat
      end tell'`);
      execSync(`echo '{"tab_id":${originalTabId}}' > .state/chrome_tab_config.json`);
    }
  } catch (e) {}

  return recruiters;
}

const targetCompany = process.argv[2] || 'ClickUp';
const recruiters = searchRecruiters(targetCompany);
console.log(JSON.stringify({ company: targetCompany, count: recruiters.length, recruiters }, null, 2));
