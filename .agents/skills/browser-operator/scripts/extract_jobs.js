/**
 * extract_jobs.js
 * Scrapes the currently active (visible in viewport) job card details on Welcome to the Jungle.
 */
const h1s = Array.from(document.querySelectorAll('h1')).filter(h1 => h1.closest('[class*="gEjmGG"]'));
let activeH1 = null;
let minLeftDistance = Infinity;

// Find the h1 belonging to the card closest to the horizontal center of the viewport
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

if (!activeH1) {
  return { error: 'No active job card found in viewport' };
}

const h1Text = activeH1.innerText || '';
const parts = h1Text.split(',');
const title = parts.slice(0, -1).join(',').trim() || h1Text;
let company = parts.length > 1 ? parts[parts.length - 1].trim() : '';

let activeCard = activeH1;
for (let i = 0; i < 8; i++) {
  if (activeCard) activeCard = activeCard.parentElement;
}

if (!company && activeCard) {
  company = activeCard.querySelector('a[href*="/company"]')?.innerText || '';
}

let location = 'Unknown';
let salary = 'Not Specified';
const metaDiv = activeCard ? activeCard.querySelector('[class*="frHCpz"], [class*="hGJion"]') : null;
if (metaDiv) {
  const items = Array.from(metaDiv.querySelectorAll('*'))
    .map(el => el.innerText ? el.innerText.trim() : '')
    .filter((t, i, arr) => t.length > 0 && !t.includes('\n') && arr.indexOf(t) === i);
  
  for (const item of items) {
    if ((item.includes('Remote') || item.includes('Hybrid') || item.includes('On-site')) && location === 'Unknown') {
      location = item;
    } else if ((item.startsWith('$') || item.startsWith('€') || item.startsWith('£')) && salary === 'Not Specified') {
      salary = item;
    }
  }
}

return {
  title,
  company,
  location,
  salary,
  url: window.location.href
};
