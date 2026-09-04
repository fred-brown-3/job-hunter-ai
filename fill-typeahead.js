#!/usr/bin/env node

/**
 * fill-typeahead.js
 *
 * Fills a React-Select / typeahead chip field by:
 *   1. Finding the input element and control container
 *   2. Checking if dropdown is open. If not, dispatches clicks to open it.
 *   3. Waiting 150ms if we clicked to open.
 *   4. Locating and clicking the matching option element.
 *   5. Waiting 100ms.
 *   6. Verifying the selected chip is present in the DOM.
 *
 * Usage:
 *   node fill-typeahead.js <selector> "<value to select>"
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const chromeControlPath = path.join(rootDir, 'chrome-control.js');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: node fill-typeahead.js <selector> "<value>"');
  process.exit(1);
}

const selector = args[0];
const value = args.slice(1).join(' ');

// Step 1 Browser Script: Open the dropdown if needed
const openScript = `
  const selector = ${JSON.stringify(selector)};
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Input element not found' });
  
  const ctrl = el.closest('.select__control') || el.closest('[class*="control"]') || el.parentElement;
  if (!ctrl) return JSON.stringify({ error: 'Control container not found' });
  
  let isExpanded = el.getAttribute('aria-expanded') === 'true';
  let options = Array.from(document.querySelectorAll('[class*="option"], [class*="-option"]'));
  
  if (!isExpanded || options.length === 0) {
    const btn = ctrl.querySelector('button') || ctrl;
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    btn.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
    btn.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));
    // Keyboard fallback for React-Select custom components that require keyboard activation
    el.focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
    return JSON.stringify({ status: 'opening' });
  }
  
  return JSON.stringify({ status: 'already_open' });
`;

// Step 2 Browser Script: Select the option
const selectScript = `
  const selector = ${JSON.stringify(selector)};
  const targetValue = ${JSON.stringify(value)};
  const normalizedTarget = targetValue.toLowerCase().trim();

  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Input element not found' });

  const ctrl = el.closest('.select__control') || el.closest('[class*="control"]') || el.parentElement;
  if (!ctrl) return JSON.stringify({ error: 'Control container not found' });

  // Query options
  let options = Array.from(document.querySelectorAll('[class*="option"], [class*="-option"]'));
  if (options.length === 0) {
    return JSON.stringify({ error: 'No options rendered in DOM' });
  }

  // Find matching option
  let opt = options.find(o => o.innerText.trim().toLowerCase() === normalizedTarget);
  if (!opt) {
    // Word boundary check to prevent substring collisions (e.g. "no" matching "not")
    const escaped = normalizedTarget.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const rx = new RegExp('\\\\b' + escaped + '\\\\b', 'i');
    opt = options.find(o => rx.test(o.innerText.trim()));
  }
  if (!opt) {
    opt = options.find(o => o.innerText.trim().toLowerCase().includes(normalizedTarget));
  }
  if (!opt) {
    const words = normalizedTarget.split(/[^a-z0-9]+/i).filter(w => w.length > 1);
    if (words.length > 0) {
      opt = options.find(o => o.innerText.trim().toLowerCase().includes(words[0]));
    }
  }

  if (!opt) {
    return JSON.stringify({
      error: 'Option matching "' + targetValue + '" not found',
      availableOptions: options.map(o => o.innerText.trim())
    });
  }

  const matchedText = opt.innerText.trim();

  // Click matched option
  opt.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
  opt.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
  opt.dispatchEvent(new MouseEvent('click',     { bubbles: true, cancelable: true }));

  return JSON.stringify({
    success: true,
    matchedText: matchedText
  });
`;

// Step 3 Browser Script: Verify and get chips
const verifyScript = `
  const selector = ${JSON.stringify(selector)};
  const el = document.querySelector(selector);
  if (!el) return JSON.stringify({ error: 'Input element not found' });

  const ctrl = el.closest('.select__control') || el.closest('[class*="control"]') || el.parentElement;
  if (!ctrl) return JSON.stringify({ error: 'Control container not found' });

  const valContainer = el.closest('[class*="value-container"]') || el.closest('[class*="valueContainer"]') || ctrl;
  const singleVal = valContainer.querySelector('[class*="single-value"], [class*="singleValue"]');
  const multiVals = Array.from(valContainer.querySelectorAll('[class*="multi-value"], [class*="multiValue"]'));
  const chipTexts = singleVal 
    ? [singleVal.innerText.trim()] 
    : multiVals.map(m => m.innerText.trim()).filter(Boolean);

  return JSON.stringify({
    chips: chipTexts
  });
`;

function runEval(jsCode) {
  const stateDir = path.join(rootDir, '.state');
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  const tmpPath = path.join(stateDir, 'temp_typeahead_run.js');
  fs.writeFileSync(tmpPath, jsCode, 'utf-8');

  try {
    const output = execSync(`node "${chromeControlPath}" eval-file "${tmpPath}"`, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    try { fs.unlinkSync(tmpPath); } catch (e) {}
    return JSON.parse(output);
  } catch (err) {
    try { fs.unlinkSync(tmpPath); } catch (e) {}
    throw err;
  }
}

function sleep(ms) {
  execSync(`sleep ${ms / 1000}`, { stdio: 'ignore' });
}

function main() {
  console.log(`\nFilling typeahead field: ${selector}`);
  console.log(`Target value: "${value}"`);

  try {
    // Step 1: Open the dropdown menu if needed
    const openRes = runEval(openScript);
    if (openRes.error) {
      console.error(`❌ Error during open: ${openRes.error}`);
      process.exit(1);
    }

    if (openRes.status === 'opening') {
      console.log('⏳ Menu opening, waiting 150ms for options to render...');
      sleep(150);
    } else {
      console.log('✅ Menu already open.');
    }

    // Step 2: Select the option
    const selectRes = runEval(selectScript);
    if (selectRes.error) {
      console.error(`❌ Error during select: ${selectRes.error}`);
      if (selectRes.availableOptions) {
        console.error(`   Available options were: ${selectRes.availableOptions.join(' | ')}`);
      }
      process.exit(1);
    }

    if (!selectRes.success) {
      console.error(`❌ Unknown failure during selection. Output:`, selectRes);
      process.exit(1);
    }

    console.log(`✅ Clicked option: "${selectRes.matchedText}"`);
    console.log('⏳ Waiting 100ms for React to render chips...');
    sleep(100);

    // Step 3: Verify selection
    const verifyRes = runEval(verifyScript);
    if (verifyRes.error) {
      console.error(`❌ Verification failed: ${verifyRes.error}`);
      process.exit(1);
    }

    console.log(`✅ Current chips: [${verifyRes.chips.join(', ')}]`);
    process.exit(0);

  } catch (err) {
    console.error(`❌ Process failed:`, err.message);
    process.exit(1);
  }
}

main();
