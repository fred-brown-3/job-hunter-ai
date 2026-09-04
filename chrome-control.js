#!/usr/bin/env node

/**
 * chrome-control.js
 * A Node.js CLI to control an interactive Google Chrome browser on macOS.
 * Mimics the behavior of chrome_control.py in antigrav-sandbox.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Exit codes
const EXIT_GENERAL_ERROR = 1;
const EXIT_TAB_CLOSED = 2;
const EXIT_NO_TAB_FOUND = 3;
const EXIT_PAGE_LOAD_FAILURE = 4;

const STATE_DIR = path.join(__dirname, '.state');
const CONFIG_PATH = path.join(STATE_DIR, 'chrome_tab_config.json');

// Reusable helper to run AppleScript via osascript
function runAppleScript(scriptContent) {
  const result = spawnSync('osascript', [], {
    input: scriptContent,
    encoding: 'utf-8'
  });
  return {
    stdout: result.stdout ? result.stdout.trim() : '',
    stderr: result.stderr ? result.stderr.trim() : '',
    status: result.status
  };
}

// Check if we can communicate with Chrome
function checkChromePermission() {
  const script = `
    tell application "Google Chrome"
        return "OK"
    end tell
  `;
  const { stdout, stderr, status } = runAppleScript(script);
  if (status !== 0 || stdout !== 'OK') {
    console.error(`Error: Unable to communicate with Google Chrome. Ensure Chrome is running and macOS permissions are granted.\nDetails: ${stderr}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

// Get/Save targeted tab
function getTargetTabId() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return config.tab_id;
    } catch (e) {
      console.warn(`Warning: Could not read tab config: ${e.message}`);
    }
  }
  return null;
}

function saveTargetTabId(tabId) {
  try {
    if (!fs.existsSync(STATE_DIR)) {
      fs.mkdirSync(STATE_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify({ tab_id: tabId }), 'utf-8');
  } catch (e) {
    console.warn(`Warning: Failed to save tab config: ${e.message}`);
  }
}

// Refresh the pinned target from the actual foreground Chrome tab.
// Use this explicitly when a user refers to their current or active tab.
function cmdUseActiveTab() {
  const script = `
    tell application "Google Chrome"
        if (count of windows) is 0 then
            return "ERROR: No Chrome window found"
        end if
        set activeTab to active tab of front window
        return (id of activeTab as text) & linefeed & (URL of activeTab) & linefeed & (title of activeTab)
    end tell
  `;
  const { stdout, stderr, status } = runAppleScript(script);
  if (status !== 0) {
    console.error(`Error: ${stderr}`);
    process.exit(EXIT_GENERAL_ERROR);
  }

  const [idText, url, ...titleParts] = stdout.split(/\r?\n/);
  const tabId = parseInt(idText, 10);
  if (!Number.isInteger(tabId) || !url || idText.startsWith('ERROR:')) {
    console.error(`Error: Unable to resolve foreground Chrome tab. Details: ${stdout}`);
    process.exit(EXIT_NO_TAB_FOUND);
  }

  saveTargetTabId(tabId);
  console.log(JSON.stringify({ tab_id: tabId, url, title: titleParts.join('\n') }, null, 2));
}

// Finds or returns the pinned target tab
function getTargetTab() {
  const tabId = getTargetTabId();
  if (tabId !== null) {
    // Verify if this tab still exists in Chrome
    const checkScript = `
      tell application "Google Chrome"
          repeat with w in windows
              repeat with t in tabs of w
                  if (id of t) as integer is ${tabId} then
                      return "FOUND"
                  end if
              end repeat
          end repeat
          return "NOT_FOUND"
      end tell
    `;
    const { stdout, status } = runAppleScript(checkScript);
    if (status === 0 && stdout === 'FOUND') {
      return tabId;
    } else {
      // Clear the invalid cached config
      try {
        fs.unlinkSync(CONFIG_PATH);
      } catch (e) {}
      console.warn('Warning: Cached Chrome tab was closed. Re-evaluating active tabs...');
    }
  }

  const findScript = `
    tell application "Google Chrome"
        if (count of windows) is not 0 then
            set activeTab to active tab of front window
            set activeUrl to URL of activeTab
            if activeUrl contains "linkedin.com" or activeUrl contains "indeed.com" or activeUrl contains "greenhouse.io" or activeUrl contains "lever.co" or activeUrl contains "glassdoor.com" or activeUrl contains "welcometothejungle.com" or activeUrl contains "apply" or activeUrl contains "workday" or activeUrl contains "myworkdayjobs" or activeUrl contains "careers" or activeUrl contains "hiring" then
                return id of activeTab
            end if
        end if

        repeat with w in windows
            repeat with t in tabs of w
                set theUrl to URL of t
                if theUrl contains "linkedin.com" or theUrl contains "indeed.com" or theUrl contains "greenhouse.io" or theUrl contains "lever.co" or theUrl contains "glassdoor.com" or theUrl contains "welcometothejungle.com" or theUrl contains "apply" or theUrl contains "workday" or theUrl contains "myworkdayjobs" or theUrl contains "careers" or theUrl contains "hiring" then
                    return id of t
                end if
            end repeat
        end repeat
        
        -- Fallback: return active tab of front window if a window exists
        if (count of windows) is not 0 then
            return id of active tab of front window
        end if
        
        return "NONE"
    end tell
  `;
  const { stdout, stderr, status } = runAppleScript(findScript);
  if (status === 0 && stdout !== 'NONE' && stdout !== '') {
    const foundId = parseInt(stdout, 10);
    if (!isNaN(foundId)) {
      saveTargetTabId(foundId);
      console.warn(`Auto-targeted Chrome tab ID: ${foundId}`);
      return foundId;
    }
  }

  console.error('ERROR: No Chrome tab or window found.');
  process.exit(EXIT_NO_TAB_FOUND);
}

// Evaluates JavaScript in the pinned target tab
function executeJs(jsCode) {
  const tabId = getTargetTab();

  // Wrap JS code to handle exceptions and return a JSON string
  const wrappedJs = `
    (function() {
        try {
            let result = (function() {
                ${jsCode}
            })();
            return JSON.stringify({status: "success", value: result});
        } catch (e) {
            return JSON.stringify({status: "error", message: e.toString(), stack: e.stack});
        }
    })()
  `;

  // Use JSON.stringify to safely escape the JavaScript code string for AppleScript double quotes
  const escapedJs = JSON.stringify(wrappedJs).slice(1, -1);

  const applescript = `
    tell application "Google Chrome"
        set found to false
        set jsResult to ""
        repeat with w in windows
            repeat with t in tabs of w
                if (id of t) as integer is ${tabId} then
                    tell t
                        set jsResult to execute javascript "${escapedJs}"
                    end tell
                    set found to true
                    exit repeat
                end if
            end repeat
            if found then exit repeat
        end repeat
        
        if not found then
            return "ERROR: Tab closed"
        else
            return jsResult
        end if
    end tell
  `;

  const { stdout, stderr, status } = runAppleScript(applescript);
  if (status !== 0) {
    return { status: 'error', message: `AppleScript execution failed: ${stderr}` };
  }

  if (stdout.startsWith('ERROR:')) {
    if (stdout.includes('Tab closed')) {
      console.error('ERROR: Pinned Chrome tab was closed.');
      process.exit(EXIT_TAB_CLOSED);
    }
    return { status: 'error', message: stdout };
  }

  try {
    return JSON.parse(stdout);
  } catch (e) {
    return { status: 'success', value: stdout };
  }
}

// Commands implementation
function cmdUrl() {
  const tabId = getTargetTab();
  const script = `
    tell application "Google Chrome"
        repeat with w in windows
            repeat with t in tabs of w
                if (id of t) as integer is ${tabId} then
                    return URL of t
                end if
            end repeat
        end repeat
        return "ERROR: Tab closed"
    end tell
  `;
  const { stdout, stderr, status } = runAppleScript(script);
  if (status === 0) {
    if (stdout.startsWith('ERROR:')) {
      console.error('ERROR: Pinned Chrome tab was closed.');
      process.exit(EXIT_TAB_CLOSED);
    }
    console.log(stdout);
  } else {
    console.error(`Error: ${stderr}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdTitle() {
  const tabId = getTargetTab();
  const script = `
    tell application "Google Chrome"
        repeat with w in windows
            repeat with t in tabs of w
                if (id of t) as integer is ${tabId} then
                    return title of t
                end if
            end repeat
        end repeat
        return "ERROR: Tab closed"
    end tell
  `;
  const { stdout, stderr, status } = runAppleScript(script);
  if (status === 0) {
    if (stdout.startsWith('ERROR:')) {
      console.error('ERROR: Pinned Chrome tab was closed.');
      process.exit(EXIT_TAB_CLOSED);
    }
    console.log(stdout);
  } else {
    console.error(`Error: ${stderr}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdNavigate(url) {
  const safeUrl = url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const tabId = getTargetTabId();

  const script = `
    tell application "Google Chrome"
        activate
        if ${tabId !== null ? tabId : -1} is not -1 then
            repeat with w in windows
                repeat with t in tabs of w
                    if (id of t) as integer is ${tabId !== null ? tabId : -1} then
                        set URL of t to "${safeUrl}"
                        return id of t
                    end if
                end repeat
            end repeat
        end if
        
        if (count of windows) is 0 then
            make new window
        end if
        set newTab to make new tab at end of tabs of front window with properties {URL:"${safeUrl}"}
        return id of newTab
    end tell
  `;
  const { stdout, stderr, status } = runAppleScript(script);
  if (status === 0) {
    try {
      const newTabId = parseInt(stdout.trim(), 10);
      saveTargetTabId(newTabId);
      console.warn(`Navigated target tab ID ${newTabId} to ${url}`);
    } catch (e) {
      console.warn(`Navigated to ${url}`);
    }
  } else {
    console.error(`Error: ${stderr}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdHtml(selector) {
  let js;
  if (selector) {
    js = `
      let el = document.querySelector(${JSON.stringify(selector)});
      return el ? el.outerHTML : null;
    `;
  } else {
    js = `return document.documentElement.outerHTML;`;
  }

  const res = executeJs(js);
  if (res.status === 'success') {
    if (res.value === null) {
      console.error(`Selector not found: ${selector}`);
      process.exit(EXIT_GENERAL_ERROR);
    }
    console.log(res.value);
  } else {
    console.error(`JS Error: ${res.message}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdEval(jsCode) {
  const res = executeJs(jsCode);
  if (res.status === 'success') {
    if (typeof res.value === 'object' && res.value !== null) {
      console.log(JSON.stringify(res.value, null, 2));
    } else {
      console.log(res.value);
    }
  } else {
    console.error(`JS Error: ${res.message}`);
    if (res.stack) {
      console.error(res.stack);
    }
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdClick(selector) {
  const js = `
    let el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return "Element not found";
    el.click();
    return "Clicked";
  `;
  const res = executeJs(js);
  if (res.status === 'success') {
    console.log(res.value);
    if (res.value === 'Element not found') {
      process.exit(EXIT_GENERAL_ERROR);
    }
  } else {
    console.error(`JS Error: ${res.message}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdFill(selector, value) {
  const js = `
    let el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return "Element not found";
    
    // 1. Mouse/Focus Events
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    el.focus();
    el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    // 2. React _valueTracker Reset & Native Setter
    const previousValue = el.value;
    const prototype = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : (window.HTMLInputElement.prototype || el.__proto__);
    const nativeSetter = Object.getOwnPropertyDescriptor(prototype, 'value') ? Object.getOwnPropertyDescriptor(prototype, 'value').set : null;

    if (el._valueTracker) {
      el._valueTracker.setValue('FORCE_REACT_DIRTY_STATE');
    }

    if (nativeSetter) {
      nativeSetter.call(el, ${JSON.stringify(value)});
    } else {
      el.value = ${JSON.stringify(value)};
    }

    // 3. Keydown & Keypress Simulation
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', code: 'KeyA', bubbles: true, cancelable: true }));
    el.dispatchEvent(new KeyboardEvent('keypress', { key: 'a', code: 'KeyA', bubbles: true, cancelable: true }));

    // 4. Input & Change Events
    try {
      el.dispatchEvent(new InputEvent('input', { inputType: 'insertText', data: ${JSON.stringify(value)}, bubbles: true, cancelable: true }));
    } catch (e) {
      el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }

    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'a', code: 'KeyA', bubbles: true, cancelable: true }));
    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    // 5. Blur
    el.blur();
    return "Filled";
  `;
  const res = executeJs(js);
  if (res.status === 'success') {
    console.log(res.value);
    if (res.value === 'Element not found') {
      process.exit(EXIT_GENERAL_ERROR);
    }
  } else {
    console.error(`JS Error: ${res.message}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdUpload(selector, filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File does not exist: ${absolutePath}`);
    process.exit(EXIT_GENERAL_ERROR);
  }

  const fileBuffer = fs.readFileSync(absolutePath);
  const base64Data = fileBuffer.toString('base64');
  const fileName = path.basename(absolutePath);

  // Map MIME types based on file extension
  const ext = path.extname(fileName).toLowerCase();
  let mimeType = 'application/octet-stream';
  if (ext === '.pdf') mimeType = 'application/pdf';
  else if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (ext === '.doc') mimeType = 'application/msword';
  else if (ext === '.txt') mimeType = 'text/plain';

  const js = `
    let el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return { error: "Selector not found: " + ${JSON.stringify(selector)} };
    
    if (el.tagName !== 'INPUT' || el.type !== 'file') {
      // Try finding a file input inside this element
      let innerInput = el.querySelector('input[type="file"]');
      if (innerInput) {
        el = innerInput;
      } else {
        // Try finding any file input on the page
        let allInputs = Array.from(document.querySelectorAll('input[type="file"]'));
        if (allInputs.length > 0) {
          el = allInputs[0];
        } else {
          return { error: "No input[type='file'] element found on page or within target selector" };
        }
      }
    }
    
    const base64Data = ${JSON.stringify(base64Data)};
    const fileName = ${JSON.stringify(fileName)};
    const mimeType = ${JSON.stringify(mimeType)};
    
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: mimeType });
      const file = new File([blob], fileName, { type: mimeType });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      el.files = dataTransfer.files;
      
      el.dispatchEvent(new Event('focus', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('blur', { bubbles: true }));
      return { success: true, fileName: fileName, selectorUsed: el.id ? '#' + el.id : el.tagName };
    } catch (e) {
      return { error: "Failed to construct and assign file: " + e.toString() };
    }
  `;

  const res = executeJs(js);
  if (res.status === 'success') {
    if (res.value.error) {
      console.error(`Upload Error: ${res.value.error}`);
      process.exit(EXIT_GENERAL_ERROR);
    }
    console.log(`Successfully uploaded ${res.value.fileName} via input element (${res.value.selectorUsed})`);
  } else {
    console.error(`JS Error: ${res.message}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
}

function cmdEvalFile(filePath) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File does not exist: ${absolutePath}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
  const jsCode = fs.readFileSync(absolutePath, 'utf-8');
  cmdEval(jsCode);
}

// Focus a DOM element and bring Chrome to front so real keystrokes land on it
function cmdFocus(selector) {
  // First scroll into view and click via JS
  const js = `
    let el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return "Element not found";
    el.scrollIntoView({ block: 'center' });
    el.focus();
    return "Focused: " + (el.id || el.tagName);
  `;
  const res = executeJs(js);
  if (res.status !== 'success') {
    console.error(`JS Error: ${res.message}`);
    process.exit(EXIT_GENERAL_ERROR);
  }
  // Bring Chrome window to front so keystrokes land on the focused element
  const activateScript = `
    tell application "Google Chrome"
      activate
    end tell
  `;
  runAppleScript(activateScript);
  console.log(res.value);
}

// Send real system-level keystrokes to Chrome via AppleScript System Events
// This is the only reliable way to open React-Select / typeahead dropdowns
function cmdKeystroke(text) {
  // Bring Chrome to front first
  const activateScript = `tell application "Google Chrome" to activate`;
  runAppleScript(activateScript);

  // Small delay to ensure Chrome is focused
  const sleepScript = `delay 0.15`;
  runAppleScript(sleepScript);

  // Use System Events to type the text
  const safeText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  const typeScript = `
    tell application "System Events"
      keystroke "${safeText}"
    end tell
  `;
  const { status, stderr } = runAppleScript(typeScript);
  if (status !== 0) {
    console.error(`Keystroke failed: ${stderr}`);
    console.error('Tip: Grant Accessibility access to Terminal in System Preferences > Privacy & Security > Accessibility');
    process.exit(EXIT_GENERAL_ERROR);
  }
  console.log(`Keystroked: "${text}"`);
}

function printUsage() {
  console.error(`
Interactive Chrome Controller CLI (Node.js)

Usage:
  node chrome-control.js use-active-tab  Pin the foreground Chrome tab as the target
  node chrome-control.js url
  node chrome-control.js title
  node chrome-control.js navigate <url>
  node chrome-control.js html [selector]
  node chrome-control.js eval <js_code>
  node chrome-control.js eval-file <file_path>
  node chrome-control.js click <selector>
  node chrome-control.js fill <selector> <value>
  node chrome-control.js focus <selector>        Focus element and bring Chrome to front
  node chrome-control.js keystroke <text>        Send real system keystrokes to Chrome
  node chrome-control.js upload <selector> <file_path>

Examples:
  node chrome-control.js use-active-tab
  node chrome-control.js url
  node chrome-control.js navigate https://www.linkedin.com
  node chrome-control.js click "button[type='submit']"
  node chrome-control.js fill "input[type='text']" "Senior Software Engineer"
  node chrome-control.js focus "input#gender"          # Focus for real keystroke input
  node chrome-control.js keystroke "Man"               # Type into focused React-Select
  node chrome-control.js upload "input[type='file']" "./resume.pdf"
  node chrome-control.js eval-file "./extract_jobs.js"
`);
}

function main() {
  if (process.argv.length < 3) {
    printUsage();
    process.exit(EXIT_GENERAL_ERROR);
  }

  const cmd = process.argv[2];

  // We check for Google Chrome access except for navigate command which might spawn it.
  if (cmd !== 'navigate') {
    checkChromePermission();
  }

  switch (cmd) {
    case 'use-active-tab':
      cmdUseActiveTab();
      break;
    case 'url':
      cmdUrl();
      break;
    case 'title':
      cmdTitle();
      break;
    case 'navigate':
      if (process.argv.length < 4) {
        console.error('Error: Missing URL');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdNavigate(process.argv[3]);
      break;
    case 'html':
      cmdHtml(process.argv[3]);
      break;
    case 'eval':
      if (process.argv.length < 4) {
        console.error('Error: Missing JS code');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdEval(process.argv[3]);
      break;
    case 'eval-file':
      if (process.argv.length < 4) {
        console.error('Error: Missing file path');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdEvalFile(process.argv[3]);
      break;
    case 'click':
      if (process.argv.length < 4) {
        console.error('Error: Missing selector');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdClick(process.argv[3]);
      break;
    case 'fill':
      if (process.argv.length < 5) {
        console.error('Error: Missing selector or value');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdFill(process.argv[3], process.argv[4]);
      break;
    case 'upload':
      if (process.argv.length < 5) {
        console.error('Error: Missing selector or file path');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdUpload(process.argv[3], process.argv[4]);
      break;
    case 'focus':
      if (process.argv.length < 4) {
        console.error('Error: Missing selector');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdFocus(process.argv[3]);
      break;
    case 'keystroke':
      if (process.argv.length < 4) {
        console.error('Error: Missing text to type');
        process.exit(EXIT_GENERAL_ERROR);
      }
      cmdKeystroke(process.argv[3]);
      break;
    default:
      console.error(`Unknown command: ${cmd}`);
      printUsage();
      process.exit(EXIT_GENERAL_ERROR);
  }
}

main();
