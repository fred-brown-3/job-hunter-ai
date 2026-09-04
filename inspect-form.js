#!/usr/bin/env node

/**
 * inspect-form.js
 * 
 * Read-only form field inspector for the active Chrome tab.
 * Scans all visible, interactive fields and returns a structured JSON snapshot of:
 *   - filled:   fields that already have a value
 *   - unfilled: fields that are empty or unselected (first N, per --batch)
 * 
 * Usage:
 *   node inspect-form.js              → first 5 unfilled fields (default batch)
 *   node inspect-form.js --batch 8   → first 8 unfilled fields
 *   node inspect-form.js --all       → all unfilled fields (no batch limit)
 */

const { execSync } = require('child_process');
const path = require('path');

const rootDir = __dirname;
const chromeControlPath = path.join(rootDir, 'chrome-control.js');

// Parse CLI args
const args = process.argv.slice(2);
const allFlag = args.includes('--all');
let batchSize = 5;
const batchIdx = args.indexOf('--batch');
if (batchIdx !== -1 && args[batchIdx + 1]) {
  batchSize = parseInt(args[batchIdx + 1], 10) || 5;
}

function runControl(args, allowFailure = false) {
  try {
    return execSync(`node "${chromeControlPath}" ${args}`, {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
  } catch (err) {
    if (allowFailure) return null;
    process.stderr.write(`chrome-control error: ${err.message}\n`);
    process.exit(1);
  }
}

// Run JS code directly via eval, piping the code as a file to avoid shell arg length limits
function runEval(jsCode, allowFailure = false) {
  const { spawnSync } = require('child_process');
  const fs = require('fs');
  // Write to a temp file; then use execSync to call eval-file
  // But we need to avoid the AppleScript length bug in eval-file.
  // Instead: use Node's spawnSync to pass the JS to a tiny wrapper that calls executeJs directly.
  // Workaround: write script to .state/temp_eval.js and call a custom runner that bypasses eval-file.

  // The actual fix: chrome-control.js eval reads JS from its argv[3].
  // For large scripts, we write it to a temp file and call eval-file — but eval-file
  // passes the full content to executeJs which uses JSON.stringify for escaping.
  // The real issue is AppleScript's 32KB string limit in osascript.
  // Solution: split the inspector into smaller chunks, or use localStorage as a side-channel.
  // Pragmatic fix: write result to window.__inspectResult, then read it back separately.

  const fs2 = require('fs');
  const tmpPath = path.join(rootDir, '.state', 'temp_eval_run.js');
  // Wrap the code to store result in window global, then read it back
  const wrappedCode = `
    try {
      window.__inspectResult = JSON.stringify((function() {
        ${jsCode}
      })());
    } catch(e) {
      window.__inspectResult = JSON.stringify({ error: e.toString() });
    }
  `;
  fs2.writeFileSync(tmpPath, wrappedCode, 'utf-8');

  // First eval: run the inspector and store result in window.__inspectResult
  try {
    execSync(`node "${chromeControlPath}" eval-file "${tmpPath}"`, {
      cwd: rootDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore']
    });
  } catch (err) {
    if (allowFailure) return null;
    process.stderr.write(`Eval error: ${err.message}\n`);
    process.exit(1);
  }
  try { fs2.unlinkSync(tmpPath); } catch (e) {}

  // Second eval: read the result back from window.__inspectResult
  try {
    const raw = execSync(`node "${chromeControlPath}" eval "return window.__inspectResult;"`, {
      cwd: rootDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
    return raw;
  } catch (err) {
    if (allowFailure) return null;
    process.stderr.write(`Read-back error: ${err.message}\n`);
    process.exit(1);
  }
}

// The client-side inspector script — runs inside the Chrome tab
const inspectorJs = `
  // Builds a stable CSS selector for an element, preferring id > name > data-testid > positional
  function stableSelector(el) {
    if (el.id) return el.tagName.toLowerCase() + '#' + el.id;
    if (el.name) return el.tagName.toLowerCase() + '[name="' + el.name + '"]';
    if (el.getAttribute('data-testid')) return el.tagName.toLowerCase() + '[data-testid="' + el.getAttribute('data-testid') + '"]';
    // Positional fallback: nth-of-type relative to parent
    const siblings = Array.from(el.parentElement ? el.parentElement.children : []);
    const idx = siblings.indexOf(el) + 1;
    return el.tagName.toLowerCase() + ':nth-child(' + idx + ')';
  }

  // Find the human-readable label for an element
  function findLabel(el) {
    // 1. <label for="id">
    if (el.id) {
      const lbl = document.querySelector('label[for="' + el.id + '"]');
      if (lbl) return lbl.innerText.trim().replace(/\\s+/g, ' ');
    }
    // 2. aria-label attribute
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label').trim();
    // 3. aria-labelledby
    const lblId = el.getAttribute('aria-labelledby');
    if (lblId) {
      const lblEl = document.getElementById(lblId);
      if (lblEl) return lblEl.innerText.trim().replace(/\\s+/g, ' ');
    }
    // 4. Ancestor label wrapping the input
    const parentLabel = el.closest('label');
    if (parentLabel) return parentLabel.innerText.trim().replace(/\\s+/g, ' ');
    // 5. Previous sibling or parent legend (for fieldsets/radio groups)
    const fieldset = el.closest('fieldset');
    if (fieldset) {
      const legend = fieldset.querySelector('legend');
      if (legend) return legend.innerText.trim().replace(/\\s+/g, ' ');
    }
    // 6. Placeholder as last resort
    if (el.placeholder) return el.placeholder.trim();
    return '';
  }

  // Check if element is truly visible and interactive
  function isVisible(el) {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const isCombobox = el.getAttribute('role') === 'combobox' || el.getAttribute('role') === 'listbox';
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      (style.opacity !== '0' || isCombobox) &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  // Find validation warnings near the element
  function getWarning(el) {
    const container = el.closest('.sc-bf9c2d05-1, .sc-893aeb0c-0, [class*="form-group"], [class*="field"]') || el.parentElement.parentElement;
    if (!container) return null;
    const candidates = Array.from(container.querySelectorAll('span, p, div'));
    for (const c of candidates) {
      if (c === el) continue;
      const style = window.getComputedStyle(c);
      const color = style.color;
      const isRed = color.startsWith('rgb(22') || color.startsWith('rgb(23') || color.startsWith('rgb(255') || c.getAttribute('color') === '#E1003A';
      const text = c.innerText.trim();
      if (isRed && text.length > 0 && text.length < 200) {
        return text;
      }
    }
    return null;
  }

  // Skip types that are not meaningful to fill
  const SKIP_TYPES = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'file']);

  const filled = [];
  const unfilled = [];

  // --- Standard inputs and textareas ---
  const inputs = Array.from(document.querySelectorAll('input, textarea'));
  for (const el of inputs) {
    if (!isVisible(el)) continue;
    if (SKIP_TYPES.has((el.type || '').toLowerCase())) continue;
    if (el.getAttribute('role') === 'combobox' || el.getAttribute('role') === 'listbox') continue;


    const label = findLabel(el);
    const type = el.type || el.tagName.toLowerCase();
    const value = el.value || '';
    const checked = el.checked;
    const selector = stableSelector(el);

    const warning = getWarning(el);
    const fieldInfo = { label, selector, type, current_value: value, warning, options: null };

    const isEmpty = (type === 'checkbox' || type === 'radio')
      ? !checked
      : value.trim() === '';

    if (isEmpty) {
      unfilled.push(fieldInfo);
    } else {
      filled.push({ ...fieldInfo, current_value: value || (checked ? 'checked' : '') });
    }
  }

  // --- Select dropdowns ---
  const selects = Array.from(document.querySelectorAll('select'));
  for (const el of selects) {
    if (!isVisible(el)) continue;
    const label = findLabel(el);
    const value = el.value || '';
    const selector = stableSelector(el);
    const options = Array.from(el.options)
      .map(o => o.text.trim())
      .filter(t => t.length > 0 && t !== '--' && t !== 'Select...');

    const warning = getWarning(el);
    const fieldInfo = { label, selector, type: 'select', current_value: value, warning, options };
    if (!value || value.trim() === '' || el.selectedIndex <= 0) {
      unfilled.push(fieldInfo);
    } else {
      filled.push(fieldInfo);
    }
  }

  // --- React-Select / custom combobox dropdowns ([role="combobox"]) ---
  const comboboxes = Array.from(document.querySelectorAll('[role="combobox"], [role="listbox"]'));
  for (const el of comboboxes) {
    if (!isVisible(el)) continue;
    if (el.closest('select')) continue; // already handled above
    const label = findLabel(el);
    const selector = stableSelector(el);
    
    // Try to find React-Select filled values in the parent container
    const ctrl = el.closest('.select__control') || el.closest('[class*="control"]') || el.parentElement;
    let value = '';
    if (ctrl) {
      const valContainer = el.closest('[class*="valueContainer"]') || el.closest('[class*="value-container"]') || ctrl;
      const singleVal = valContainer.querySelector('[class*="singleValue"], [class*="single-value"], [class*="SingleValue"]');
      const multiVals = Array.from(valContainer.querySelectorAll('[class*="multiValue"], [class*="multi-value"], [class*="MultiValue"]'));
      if (singleVal) {
        value = singleVal.innerText.trim();
      } else if (multiVals.length > 0) {
        value = multiVals.map(m => m.innerText.trim()).filter(Boolean).join(', ');
      }
    }
    
    // Fallback to value property or text content
    if (!value) {
      value = el.value || (el.innerText || el.textContent || '').trim();
    }
    
    const warning = getWarning(el);
    const fieldInfo = { label, selector, type: 'combobox', current_value: value, warning, options: null };
    if (!value || value === 'Select...' || value === '') {
      unfilled.push(fieldInfo);
    } else {
      filled.push(fieldInfo);
    }
  }

  return { filled, unfilled };
`;

function main() {
  const fs = require('fs');

  const currentUrl = runControl('url');
  const currentTitle = runControl('title');

  // Write inspector to temp file and run via eval-file
  const tmpPath = path.join(rootDir, '.state', 'temp_inspect.js');
  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });
  fs.writeFileSync(tmpPath, inspectorJs, 'utf-8');

  const rawResult = runControl(`eval-file "${tmpPath}"`, false);
  try { fs.unlinkSync(tmpPath); } catch (e) {}

  // chrome-control.js prints res.value — for an object this is pretty-printed JSON
  let parsed;
  try {
    parsed = JSON.parse(rawResult);
  } catch (e) {
    process.stderr.write(`Failed to parse inspector output.\nRaw: ${rawResult}\nError: ${e.message}\n`);
    process.exit(1);
  }

  const { filled, unfilled } = parsed;

  // Apply batch limit to unfilled
  const unfilledBatch = allFlag ? unfilled : unfilled.slice(0, batchSize);
  const remaining = unfilled.length - unfilledBatch.length;

  const output = {
    url: currentUrl,
    title: currentTitle,
    summary: {
      total_filled: filled.length,
      total_unfilled: unfilled.length,
      showing_unfilled: unfilledBatch.length,
      remaining_after_batch: remaining
    },
    filled,
    unfilled: unfilledBatch
  };

  console.log(JSON.stringify(output, null, 2));
}


main();
