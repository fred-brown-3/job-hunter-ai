#!/usr/bin/env node

/**
 * check-environment.js
 * Environment & Permissions Diagnostic Utility
 * 
 * Verifies system readiness for:
 * 1. Node.js environment
 * 2. Google Chrome binary & headless PDF compilation
 * 3. (Optional) macOS AppleScript Chrome automation permissions
 * 
 * Usage:
 *   node check-environment.js
 *   node check-environment.js --skip-browser
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const skipBrowser = args.includes('--skip-browser');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function logPass(msg) {
  console.log(`  ${colors.green}✔ PASS:${colors.reset} ${msg}`);
}

function logWarn(msg) {
  console.log(`  ${colors.yellow}▲ WARN:${colors.reset} ${msg}`);
}

function logFail(msg) {
  console.log(`  ${colors.red}✖ FAIL:${colors.reset} ${msg}`);
}

function findChromePath() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }

  const platform = os.platform();
  const candidates = [];

  if (platform === 'darwin') {
    candidates.push(
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      `${process.env.HOME}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
    );
  } else if (platform === 'linux') {
    candidates.push(
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
      '/snap/bin/chromium'
    );
  } else if (platform === 'win32') {
    candidates.push(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    );
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

console.log(`\n${colors.bold}${colors.cyan}=== Job Hunter AI Environment Diagnostic ===${colors.reset}\n`);

let overallSuccess = true;

// 1. Check Node.js Version
console.log(`${colors.bold}1. Node.js Environment${colors.reset}`);
const nodeVer = process.version;
const major = parseInt(nodeVer.slice(1).split('.')[0], 10);
if (major >= 18) {
  logPass(`Node.js version ${nodeVer} detected (>= 18 required)`);
} else {
  logFail(`Node.js version ${nodeVer} is outdated. Please install Node.js 18 or newer.`);
  overallSuccess = false;
}

// 2. Google Chrome Binary Check
console.log(`\n${colors.bold}2. Google Chrome Installation${colors.reset}`);
const chromePath = findChromePath();
if (chromePath) {
  logPass(`Google Chrome binary found at:\n         ${chromePath}`);
} else {
  logFail(`Google Chrome binary could not be found.`);
  console.log(`         Install Google Chrome or specify CHROME_PATH environment variable.`);
  overallSuccess = false;
}

// 3. Headless PDF Compilation Check
console.log(`\n${colors.bold}3. Headless PDF Compilation${colors.reset}`);
if (chromePath) {
  const tempHtml = path.join(os.tmpdir(), `test_print_${Date.now()}.html`);
  const tempPdf = path.join(os.tmpdir(), `test_print_${Date.now()}.pdf`);
  fs.writeFileSync(tempHtml, '<html><body><h1>Verification Test</h1></body></html>', 'utf-8');

  try {
    execSync(`"${chromePath}" --headless=new --export-tagged-pdf --print-to-pdf="${tempPdf}" --no-pdf-header-footer "file://${tempHtml}"`, { stdio: 'pipe' });
    if (fs.existsSync(tempPdf) && fs.statSync(tempPdf).size > 0) {
      logPass('Headless Chrome successfully compiled test HTML to PDF');
    } else {
      logFail('Headless Chrome execution finished, but test PDF was not generated or empty.');
      overallSuccess = false;
    }
  } catch (err) {
    logFail(`Headless Chrome failed to render PDF: ${err.message}`);
    overallSuccess = false;
  } finally {
    try { if (fs.existsSync(tempHtml)) fs.unlinkSync(tempHtml); } catch (e) {}
    try { if (fs.existsSync(tempPdf)) fs.unlinkSync(tempPdf); } catch (e) {}
  }
} else {
  logWarn('Skipping PDF compilation check because Google Chrome was not found.');
}

// 4. Chrome AppleScript / Browser Automation Permissions (macOS)
console.log(`\n${colors.bold}4. Browser Automation & macOS Permissions${colors.reset}`);
if (skipBrowser) {
  logPass('Skipped browser automation check (--skip-browser enabled).');
  console.log('         You can use the sandbox for resume & portfolio generation without browser automation.');
} else if (os.platform() !== 'darwin') {
  logWarn(`Non-macOS platform detected (${os.platform()}). AppleScript automation is disabled; use manual form filling or DevTools.`);
} else {
  try {
    // Check if Chrome is open
    const isRunning = execSync(`osascript -e 'application "Google Chrome" is running'`, { encoding: 'utf-8' }).trim();
    if (isRunning !== 'true') {
      logWarn('Google Chrome is not currently open. Testing permission check will launch or focus Chrome.');
    }

    const testCmd = `osascript -e 'tell application "Google Chrome" to get URL of active tab of front window'`;
    const result = execSync(testCmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
    logPass(`AppleScript successfully communicated with Google Chrome.`);
    logPass(`Active tab URL: ${result || '(empty tab)'}`);
  } catch (err) {
    const errStr = err.stderr ? err.stderr.toString() : err.message;
    if (errStr.includes('Application isn’t running') || errStr.includes('Application is not running')) {
      logWarn('Google Chrome is not running. Please open Google Chrome and run this check again.');
    } else if (errStr.includes('Not authorized') || errStr.includes('1743') || errStr.includes('Assistive Access')) {
      logFail('macOS Automation permission NOT granted for Google Chrome.');
      console.log(`\n  ${colors.yellow}${colors.bold}How to Fix (macOS Permission):${colors.reset}`);
      console.log(`  1. Open ${colors.cyan}System Settings${colors.reset} on your Mac.`);
      console.log(`  2. Go to ${colors.cyan}Privacy & Security -> Automation${colors.reset}.`);
      console.log(`  3. Find your Terminal / IDE app (e.g. Antigravity, Terminal, iTerm2, VS Code).`);
      console.log(`  4. Toggle the checkmark for ${colors.bold}Google Chrome${colors.reset} to ON.`);
      console.log(`  5. Return here and run: ${colors.bold}node check-environment.js${colors.reset}\n`);
      overallSuccess = false;
    } else {
      logWarn(`Browser test warning: ${errStr.split('\n')[0]}`);
      console.log('         Make sure Google Chrome is open with at least one window.');
    }
  }
}

console.log(`\n${colors.bold}${colors.cyan}=================================================${colors.reset}\n`);

if (overallSuccess) {
  console.log(`${colors.green}${colors.bold}Diagnostic Result: Ready to run!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.yellow}${colors.bold}Diagnostic Result: Some checks need attention before full automation can run.${colors.reset}\n`);
  process.exit(skipBrowser ? 0 : 1);
}
