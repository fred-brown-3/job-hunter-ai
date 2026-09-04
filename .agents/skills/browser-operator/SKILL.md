---
name: browser-operator
description: Operate the Chrome browser to navigate job boards (Greenhouse, Welcome to the Jungle, LinkedIn, etc.), extract job descriptions, fill application forms (handling plain text, native selects, and React-Select chip fields), and verify filled fields. Use this skill whenever the user asks to navigate, scrape jobs, or autofill job application forms.
---

# Browser Operator Skill

This skill guides the agent on how to control Google Chrome via `chrome-control.js`, search and extract job requirements, fill out application forms, handle complex dropdowns, and verify field persistence.

---

## ⛔ ABSOLUTE RULE — Custom Scripts Only. No Built-in Browser Tools. Ever.

**This is the most critical rule in this skill. Read it before any workflow step.**

All browser interactions MUST be performed exclusively through the project's local Node.js scripts via `run_command`. There are no exceptions.

### Permitted tools

| Script | Purpose |
| :--- | :--- |
| `node chrome-control.js <command>` | ALL browser interaction: navigate, click, fill, inspect HTML, eval JS, upload files |
| `node chrome-control.js use-active-tab` | Atomically pin the foreground Chrome tab and return its ID, URL, and title |
| `node extract-job-details.js [--use-active-tab]` | Scrape the pinned tab's job description; use `--use-active-tab` only when intentionally refreshing from the foreground tab |
| `node fill-typeahead.js <selector> <val>` | Auto-fill React-Select comboboxes (single and multi-select chips) |

### Forbidden tools — NEVER use these

- ❌ `curl`, `wget`, or external CLI HTTP fetching tools for browser tasks
- ❌ `browser_subagent` tool
- ❌ `read_browser_page` tool
- ❌ Any built-in browser automation or visual inspection tools
- ❌ `read_url_content` as a substitute for live browser state

> If you find yourself reaching for any external HTTP or built-in browser tool, **stop and use `node chrome-control.js` instead.**

### Stop and Ask Policy

If a script command returns an error, a selector is not found, or the page state is unexpected — **do NOT switch to a built-in browser tool to work around it.** Stop immediately, report the exact error output, and ask the user to describe what is currently visible on their screen.

---

## Form Filling & Interactive Agent Loop

When filling out job application forms (e.g., on Greenhouse or Lever):

### 0. Mandatory Pre-Fill Sequence: Streamlined Job Submission Workflow

**NEVER jump directly to form filling using a default resume.** Whenever asked to apply for a job or autofill an application form (e.g., "Please apply to the job on the current tab"):

1. **Step 1: Workspace & Submission Directory Setup**
   - Run `node chrome-control.js use-active-tab` to verify the foreground Chrome tab.
   - Run `node extract-job-details.js` to extract target company and job details into `.state/active_job_details.json`.
   - Create working directory: `profiles/<candidate_slug>/submissions/{YYYYMMDD_company_name_job_name}/`.
   - Save job description into `profiles/<candidate_slug>/submissions/{folder}/01_job_description.md`.
   - Initialize `profiles/<candidate_slug>/submissions/{folder}/submission-state.json` with `{"status": "DRAFTING", "resume_review_count": 0, "cover_review_count": 0}`.

2. **Step 2: Resume Planning, Drafting & Factual Audit (`resume-tailorer`)**
   - Execute Step 2a (`02a_resume_plan.md`), Step 2b (`resume.md` & `resume.pdf`), and Step 2c (`02c_review.md`).
   - If factual audit fails, loop back to 2a (up to 2 retries). If `resume_review_count > 2`, halt and ask the user.

3. **Step 3: Cover Letter Planning, Drafting & Factual Audit (`cover-letter-writer`)**
   - Execute Step 3a (`03a_cover_plan.md`), Step 3b (`cover.md` & `cover.pdf`), and Step 3c (`03c_review.md`).
   - If factual audit fails, loop back to 3a (up to 2 retries). If `cover_review_count > 2`, halt and ask the user.

4. **Step 4: User Presentation & Approval**
   - Present a simple, compact summary card including a direct link to the submission directory folder and format-specific document links (`md`, `pdf`, `ats pdf`).
   - **MANDATORY**: Wait for explicit user approval before launching form autofill.

5. **Form Autofill Execution**:
   - Once approved, proceed to fill the form on the active tab, uploading `profiles/<candidate_slug>/submissions/{folder}/resume.pdf` and `cover.pdf`.


### 1. Prerequisite Checklist
- Ensure Google Chrome is active and open to the application form page.
- **⚠️ CURRENT/ACTIVE TAB — MANDATORY FIRST STEP — NO EXCEPTIONS**:
  - When the user says “current tab,” “active tab,” “this tab,” or otherwise refers to what is visible in Chrome, run this command before any other browser action:
    ```bash
    node chrome-control.js use-active-tab
    ```
  - This command reads the foreground Chrome tab, saves its ID to `.state/chrome_tab_config.json`, and prints the ID, URL, and title as one atomic context refresh. It prevents a stale cache from silently targeting a background tab.
  - Confirm that the returned URL and title match the user's intended page. If they do not, stop and report the discrepancy.
  - After this context refresh, do not use a helper that clears or auto-selects the cached target. `extract-job-details.js` now preserves the pinned target by default. Use `node extract-job-details.js --use-active-tab` only when the user has explicitly asked to refresh context from the foreground tab.
- **Check for Embedded Cross-Origin Iframes (e.g. Greenhouse)**: Many corporate sites (like point.com) embed the job application form inside an iframe (`id="grnhse_iframe"`). Since browser scripts running on the host page cannot access cross-origin frames, `inspect-form.js` will return 0 unfilled fields.
  - *Resolution*: Detect if an iframe is present, extract its `src` URL, and navigate Chrome directly to it:
    `node chrome-control.js navigate "<iframe-src-url>"`
    Once navigated directly to the Greenhouse source page, `inspect-form.js` will scan and interact with fields correctly.
- **Check for Upfront Registration / Sign-In Requirements**: Job portals like Workday, Taleo, or custom ATS platforms often require upfront user account creation or sign-in before revealing the application form or allowing resume upload.
  - *Mandatory Guard*: If the page presents a registration or sign-in screen, STOP immediately before filling credentials or submitting registration. Warn the user that upfront registration/sign-in is required, and ask if they wish to proceed with automated account creation/login or complete the sign-in manually.
- **Cookie Consent / Preferences Popups**: Many corporate sites display modal cookie consent overlays (e.g., "Customize Consent Preferences" or "Accept All Cookies") on first load. These overlays can intercept clicks, block elements from being interactive, and cause scripts to fail. Ensure these overlays are closed (either programmatically or manually) before running the form filling scripts.
- Locate the candidate profile at `profiles/<candidate_slug>/personal_info.md` and `profiles/<candidate_slug>/application_answers.json` for demographic, identity, and custom application answers.
- Locate the active job details at `.state/active_job_details.json`.

### 2. The Iterative Inspect ➔ Fill ➔ Verify Loop

Run this loop continuously until all fields are complete:

#### **a. Inspect** — Run the form inspector to get the next batch of unfilled fields:
```bash
node inspect-form.js --batch 5
```
This returns a JSON snapshot of unfilled fields with their labels, selectors, types, and options.
- **Check for Skipped File Inputs**: Note that `inspect-form.js` ignores file inputs (like resume and cover letter uploads) by default. You MUST explicitly search for any file inputs in the DOM (e.g. by querying `input[type="file"]`) to check if a resume, cover letter, or portfolio upload is required, and use `node chrome-control.js upload` to submit them.
- **⚠️ Hidden Field Audit — Always run after inspect**: `inspect-form.js` only surfaces text, email, tel, select, and combobox inputs. It will **silently miss** radio buttons, checkboxes, and custom Yes/No toggle buttons — even if they are required. After every inspect pass, always run the following three audits:
  ```js
  // 1. Radio buttons (gender, veteran status, yes/no questions)
  node chrome-control.js eval "JSON.stringify(Array.from(document.querySelectorAll('input[type=radio]')).map(r => ({id: r.id, name: r.name, checked: r.checked, label: document.querySelector('label[for=\"' + r.id + '\"]')?.textContent?.trim()})))"
  // 2. Checkboxes (pronouns, consent, multi-select EEO)
  node chrome-control.js eval "JSON.stringify(Array.from(document.querySelectorAll('input[type=checkbox]')).map(c => ({id: c.id, checked: c.checked, label: document.querySelector('label[for=\"' + c.id + '\"]')?.textContent?.trim()})))"
  // 3. Custom button toggles (Yes/No styled buttons)
  node chrome-control.js eval "JSON.stringify(Array.from(document.querySelectorAll('button')).filter(b => /^(yes|no)$/i.test(b.textContent.trim())).map(b => ({text: b.textContent.trim(), active: b.className, parentQ: b.parentElement?.parentElement?.textContent?.substring(0,80)})))"
  ```
  Fill any unchecked/unselected fields found before moving on.


#### **b. Think before filling** — Choose the right command based on field type:

| Field type | How to identify | Command to use |
| :--- | :--- | :--- |
| Plain text / email / tel | `type: "text"` in inspector, no chip container | `node chrome-control.js fill "<selector>" "<value>"` |
| Native `<select>` dropdown | `type: "select"` in inspector, has `options` list | `node chrome-control.js fill "<selector>" "<option text>"` |
| React-Select chip/typeahead | `type: "combobox"` in inspector, or field renders chips next to the input | `node fill-typeahead.js "<selector>" "<value>"` |
| File upload | `input[type=file]` | `node chrome-control.js upload "<selector>" "<absolute-path>"` (Always upload candidate-branded PDFs `fred_brown_resume.pdf` and `fred_brown_cover_letter.pdf` from the submission folder) |

- **File Upload Naming (`fred_brown_resume.pdf` and `fred_brown_cover_letter.pdf`)**: Always upload `fred_brown_resume.pdf` for resume fields and `fred_brown_cover_letter.pdf` for cover letter fields to target ATS form file inputs so prospective employers receive clean, candidate-branded filenames on their servers.

- **Handling React-Select / typeahead fields**:
  - Do NOT use standard `chrome-control.js fill` or AppleScript keystrokes.
  - Run `node fill-typeahead.js "<selector>" "<value>"`.
  - This script handles **single-select** (replaces value in-place, styled with `.select__single-value`) and **multi-select** (appends multiple gray chips, styled with `.select__multi-value`) robustly using browser-side MouseEvent dispatching.
  - **Focus & Scroll First**: For fields placed lower in the document or inside demographic sections, first run `node chrome-control.js focus "<selector>"` and wait briefly (e.g. `sleep 0.5` or `sleep 1` in the shell) before running `fill-typeahead.js`. This ensures the element is active, scrolled into view, and fully interactive in the DOM.
  - **ArrowDown Fallback**: If the typeahead menu fails to open using MouseEvents, focus the input element and dispatch a keyboard event for `ArrowDown` to force-open it (e.g., `node chrome-control.js eval "const input = document.querySelector('<selector>'); input.focus(); input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));"`).
  - **Keystroke Search Trigger**: For some search typeaheads (e.g. Ashby location search), options only render in the DOM after character inputs are received. First, focus the input and type (using `node chrome-control.js keystroke "<query>"`), then select/click the matched option from the rendered list.
  - **Selector Escaping**: If selector IDs start with a number (e.g., UUID-like IDs like `input#29308850-b0af-...`) or contain brackets (e.g., `input#question_15826313008[]`), avoid the simple `#` notation which causes `Document.querySelector` syntax errors. Instead, use the attribute format: `input[id="29308850-b0af-4c4e-84cd-fc733973d0ac"]` or escape the characters.
  - **React-Select Class Matching (camelCase vs. kebab-case)**: React-Select elements can render classes using either camelCase (e.g., `singleValue`, `multiValue`, `valueContainer` as seen on Welcome to the Jungle) or kebab-case (e.g., `single-value`, `multi-value`, `value-container` on standard Greenhouse forms). Always design DOM queries and scripts to handle both formats (e.g., by matching `[class*="singleValue"], [class*="single-value"]` or using case-insensitive substring selectors).

- **Handling Custom Toggles (e.g. Yes/No buttons)**:
  - Some forms (e.g. Ashby) hide native checkboxes/inputs and render styled button toggles (like a "Yes" button and a "No" button next to each other).
  - When standard filling fails, write custom JavaScript click scripts using `node chrome-control.js eval` that locate the text label of the question, query the adjacent toggle buttons, and execute a `.click()` event on the desired choice (e.g., clicking the "Yes" button).

- **Demographics & Voluntary EEO Fields**:
  - Always read `profiles/<candidate_slug>/personal_info.md` for candidate values (gender, pronouns, race, ethnicity, veteran status, disability status).
  - **Option Matching**: For dropdown fields, match candidate values to the closest available option text. Do not invent options.
  - **Voluntary & Non-Blocking**: EEO and demographic fields are voluntary. If an optional EEO dropdown cannot be programmatically selected, note it and move on—never block form completion over an optional EEO field. Surface any unselected optional EEO fields in the summary report at the end.
  - **Fallback Options**: If exact text match is unavailable, using "Prefer not to say" or "Decline to self-identify" is acceptable.

#### **c. Verify & Check for Conditional Fields (2nd and 3rd Looks)**
- **Re-run the inspector**: `node inspect-form.js --all`.
- **Confirm persistence**: Verify previously filled fields still hold their value (some React forms clear values on re-render).
- **Monitor Validation Warnings**: Re-running `node inspect-form.js` will automatically scan the DOM for red warning text adjacent to elements and report them in the `"warning"` property of each field. Always check this property and correct/shorten values to clear warnings (e.g., character limit constraints).
- **Check for Conditional Popups**: Filling select dropdowns (especially demographic questions like "Are you Hispanic/Latino?" or veteran/disability questions) frequently triggers follow-up conditional fields (e.g., "Please identify your race") to render in the DOM. Always take 2nd and 3rd looks by re-running the inspector after any select is filled.
- Repeat until `summary.total_unfilled` is 0.

#### **d. Stop before submitting**:
- Never click the final form submission button. Report the completed state to the user and request their review.

#### **e. Save a Submission History Record**:
After all fields are filled and before ending your turn, always save a markdown record of the completed application to the `submission_history/` folder (which is git-ignored). This gives the candidate a personal archive of every form fill.

**File naming**: `submission_history/YYYYMMDD_Company_JobTitle.md`  
Use today's local date (YYYYMMDD format), the company name, and the job title — all joined with underscores, spaces replaced by underscores.

**Contents to include** (use markdown tables):
- Metadata: date, company, job title, job ID, ATS platform, application URL, job listing URL
- Contact fields and values submitted
- Work experience entries (company, title, start/end month+year, current role status)
- Education entries (school, degree, discipline)
- All custom question answers (question → answer)
- EEO / voluntary self-identification answers
- Uploaded files (resume, cover letter) with relative paths

---

## Welcome to the Jungle (WTTJ) Job Search Workflow

For navigating and extracting roles from Welcome to the Jungle (welcometothejungle.com):

### 1. Search URLs
The core job search landing page is:
`https://www.welcometothejungle.com/en/jobs?query=<keywords>`

### 2. Scrape Job Search Listings
1. Navigate to the page: `node chrome-control.js navigate <url>`
2. Execute the extraction script:
   `node chrome-control.js eval-file ".agents/skills/browser-operator/scripts/extract_jobs.js"`
3. Parse and present the resulting jobs as a markdown table:
   | Job Title | Company | Location | Link |

### 3. Extract Active Job Details
When on a job listing page, run:
```bash
node extract-job-details.js
```
This saves details into `.state/active_job_details.json`.

### 4. WTTJ Apply Types (Direct vs. External)
Welcome to the Jungle supports two kinds of job application flows:
1. **External Redirection**: Clicking the main Apply button (`button[data-testid='apply-button']`) opens a modal. Click the external application button in that modal (`button[data-testid='apply-modal-external-button']`) to navigate to the company's external ATS (e.g., Greenhouse/Lever).
2. **Direct Application**: Clicking `button[data-testid='apply-button']` opens a modal with a button labeled "Apply with your profile" (`button[data-testid='apply-via-otta-button']`). Clicking this redirects Chrome to a local application form at `/jobs/<job-id>/apply` on Welcome to the Jungle.
   - *Note*: This direct form uses custom styled React-Select elements which must be filled using the ArrowDown focus fallback technique mentioned in the React-Select section above.
   - *Caution*: Never click `button[data-testid='next-button']` as it skips to the next job.
   - *Form Validation Bug*: WTTJ direct application forms sometimes fail to save a section and keep it marked as incomplete if conditional follow-up questions are left blank, even if their parent conditional trigger is answered "No". If a section fails to complete after filling, inspect the unfilled fields and fill these conditional inputs with "N/A" (or another appropriate default) to satisfy the validation.

---

## Ashby HQ (`jobs.ashbyhq.com`) Application Forms

Ashby forms are more complex than standard Greenhouse forms. `inspect-form.js` will correctly surface text/email/tel/combobox fields, but will miss several important field types. Follow these patterns:

> **Tip — Form not found (0 fields)?** If `inspect-form.js` returns 0 fields, you may be on the job *listing* page rather than the application form. Look for an "Apply for this Job" link or button (typically `a[href*="/application"]` wrapping a `<button>`) and click it to navigate to the actual form before inspecting again.

> **Tip — `eval` returns `undefined` on Ashby?** Ashby's React app sometimes prevents `chrome-control.js eval` from returning values. If you get `undefined` back when trying to read state, switch to `node chrome-control.js html "#root"` and parse the output with `grep` or `python3` to inspect field values, checked radios, or active toggle classes instead.

### 1. UUID Selectors (Attribute Format Required)
Ashby assigns UUID-style IDs to most inputs (e.g. `74bbd32a-242a-473a-9728-24ee7cccdcb0`). Since many start with a digit, the `input#<id>` shorthand causes a `querySelector` syntax error. **Always use attribute format:**
```bash
node chrome-control.js fill "input[id='74bbd32a-242a-473a-9728-24ee7cccdcb0']" "value"
```

### 2. Comboboxes (State, Race, etc.)
Ashby comboboxes render as `[role="combobox"]` inputs with no stable IDs. `fill-typeahead.js` does **not** work here. Use the manual focus + keystroke + option-click pattern instead:
```js
// Step 1: Focus the Nth combobox (0-indexed) and open it
node chrome-control.js eval "
const el = document.querySelectorAll('[role=combobox]')[0];
el.focus();
el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', keyCode: 40, bubbles: true }));
"
// Step 2: Type to filter options
node chrome-control.js keystroke "New Hampshire"
// Step 3: Click the matching option
node chrome-control.js eval "
const opt = Array.from(document.querySelectorAll('[role=option]')).find(o => o.textContent.includes('New Hampshire'));
opt?.click();
"
```
> **Tip**: Map comboboxes to their question labels first by evaluating their ancestor elements, since all comboboxes share the same class (`_input_d7ago_28`) and have no IDs. Use `document.querySelectorAll('[role="combobox"]')[N]` to target by index.

> **Tip — Location/city combobox**: For `_systemfield_location`, the ArrowDown dispatch is often unnecessary. `focus → keystroke → click [role=option]` is sufficient: focus the `[role=combobox]` input, type the city name with `node chrome-control.js keystroke`, wait briefly, then click the first rendered `[role=option]` element. The option list appears immediately after typing.

### 3. Radio Buttons (Gender Identity, Veteran Status, Yes/No Questions)
Ashby radio buttons have long UUID-based IDs following the pattern `<section-uuid>_<question-uuid>-labeled-radio-<N>`. The visible option labels are in sibling `<label>` elements.
- **Discovery**: Query `input[type="radio"]` and map each to its `label[for="<id>"]`.
- **Clicking**: Prefer `node chrome-control.js click "input[id='<full-uuid-id>']"` over `eval` — it's more reliable on Ashby where `eval` may return `undefined`. Use the attribute selector format to avoid UUID parsing errors.
- **Never rely on `inspect-form.js`** — it will report 0 radio fields even when many are present.

Example (selecting "Man" for gender identity):
```js
node chrome-control.js eval "document.getElementById('<section-uuid>_<question-uuid>-labeled-radio-1').click()"
```

### 4. Checkboxes (Pronouns, Consent)
Ashby checkboxes follow the same ID pattern as radios: `<section-uuid>_<question-uuid>-labeled-checkbox-<N>`.
- **Discovery**: Query `input[type="checkbox"]` and map labels the same way as radios.
- **Clicking**: Use `.click()` via eval. Verify `.checked === true` after.

Example (selecting "He/him/his" pronouns):
```js
node chrome-control.js eval "document.getElementById('<section-uuid>_<question-uuid>-labeled-checkbox-1').click()"
```

### 5. Yes/No Toggle Buttons (Eligibility, Sponsorship, Custom Questions)
Ashby Yes/No questions are rendered as styled `<button>` elements with class `_container_pjyt6_1 _option_1svni_32`. When selected, they gain the `_active_1svni_57` class. These are **not** radios or checkboxes.
- **Discovery**: Query `button._container_pjyt6_1` and match by parent question text.
- **Verification**: After clicking, confirm the button's `className` includes `_active_1svni_57`.

Example (batch-click all Yes/No questions):
```js
node chrome-control.js eval "
const questions = [
  { text: 'eligible to work in the United States', answer: 'Yes' },
  { text: 'visa sponsorship', answer: 'No' }
];
const allButtons = Array.from(document.querySelectorAll('button._container_pjyt6_1'));
questions.forEach(q => {
  const btn = allButtons.find(b => {
    const parentText = b.parentElement?.parentElement?.textContent || '';
    return parentText.includes(q.text) && b.textContent.trim() === q.answer;
  });
  btn?.click();
});
"
```

### 6. Ashby Complete Audit Checklist
After running `inspect-form.js --all`, always additionally run:
1. **Radio audit** — `input[type="radio"]` (gender, veteran, Rula-specific yes/no)
2. **Checkbox audit** — `input[type="checkbox"]` (pronouns, consent)
3. **Toggle button audit** — `button._container_pjyt6_1` (eligibility, sponsorship, experience questions)
4. **File input audit** — `input[type="file"]` (resume upload). The selector `input#_systemfield_resume` is common but not universal — if it doesn't match, fall back to the generic `input[type="file"]` selector which reliably targets the resume upload input on Ashby forms.

### 6a. Ashby Lessons Learned: Mandatory Final Audit

The standard inspector may report the form as complete while required or voluntary controls remain unanswered. Before declaring an Ashby application complete, always inspect the rendered markup and explicitly verify each of these categories:

1. **Custom Yes/No questions** — Search every question label, not only fields returned by `inspect-form.js`. For each question, find its adjacent `button` options and confirm exactly one has the `_active_1svni_57` class. Common examples include work authorization and visa sponsorship.
2. **EEO radio groups** — Inspect every `input[type="radio"]`, including groups under `_systemfield_eeoc_*`. Map each radio to its adjacent label and select profile-backed answers such as gender, race, and veteran status when the profile provides them. Verify the selected wrapper/label contains `_checked_`.
3. **Consent radios** — Treat consent questions separately from their alternate options. A selected “Yes” radio should count as answered even though the unselected “No” radio may still appear in an inspector’s `unfilled` list.
4. **File uploads** — Never rely on a generic file selector when multiple upload fields exist. Inspect the file inputs and upload explicitly to the resume and cover-letter fields, then verify the uploaded filenames in rendered markup.
5. **Location comboboxes** — Match the complete geographic result, not just the typed city name. For ambiguous names (for example, Candidate City), verify the selected option includes the candidate’s state/country.

Only after all five checks pass should the agent report completion. Never click the final submit control.

### 7. Reliable Ashby Verification When `eval` Is `undefined`
Ashby frequently returns `undefined` from `chrome-control.js eval`, including for otherwise-valid DOM reads. Treat this as an expected Ashby limitation, not evidence that the form is blank or that a click failed. Use `node chrome-control.js html "#root"` and inspect the rendered markup instead.

- A selected Ashby radio normally appears in a wrapper with `_option... true`, `_checked...`, and a corresponding checked label class. Do not require a literal `checked` attribute on the `<input>`; React may keep the selected state in the rendered wrapper rather than serialize that attribute.
- Verify the visible option label adjacent to the exact UUID input ID. This makes it clear that, for example, the selected answer is **No**, rather than merely proving that a radio group exists.
- Confirm uploads by looking for the uploaded filename in the form markup. Ashby may not expose a useful value on the hidden file input.
- If no `button._container_pjyt6_1` controls are present, record that the custom-toggle audit found no toggles; do not try to force a toggle-specific workflow onto ordinary radio inputs.

### 8. Factual Answers and Profile Maintenance
Treat employment authorization, sponsorship, current-employer restrictions, and travel commitments as candidate facts, not defaults inferred from location, résumé history, or a typical answer.

- Search all candidate profile artifacts before asking for a fact that may already be recorded, including any résumé PDF when accessible.
- If the profile gives a conditional travel preference (for example, travel is acceptable only above a compensation threshold), apply the condition to the actual listing. If compensation is not stated or does not meet the threshold, choose the conservative answer implied by the profile and mention it in the submission record.
- When the candidate supplies a missing durable fact, update `profiles/<candidate>/personal_info.md` immediately in a clear, reusable form before filling the application.
- Do not substitute an outdated role in the résumé for current employment status. Ask or use the profile's explicit employment-status field.

### 9. Foreground-Tab Targeting in Restricted macOS Environments
Use `node chrome-control.js use-active-tab` through the elevated command runner when macOS automation is sandboxed. The command owns the exact foreground-tab AppleScript, saves the returned ID atomically, and returns the URL and title needed to validate context. Do not replace it with `url`, manual cache edits, or a helper that auto-selects a job-looking tab.

### 9a. Greenhouse/macOS Reliable Startup Sequence
For Greenhouse forms, especially when Chrome is visible but ordinary commands report a closed or missing tab:

1. Run `node chrome-control.js use-active-tab` through the elevated command runner first. Treat its returned URL/title as authoritative.
2. Run `inspect-form.js` only after that refresh. Do not combine tab refresh, focus, and fill operations in one shell command; separate invocations make cached-tab failures easier to recover from.
3. If a normal browser command reports `Cached Chrome tab was closed` or `No Chrome tab or window found`, repeat the elevated `use-active-tab` command before trying anything else.
4. For every Greenhouse React-Select field, focus it in a separate command, then run `fill-typeahead.js` in a separate command. If the helper says no options rendered, inspect `html 'body'` and select the exact rendered option with `chrome-control.js click`.
5. Verify the exact option text after selection. For locations, prefer the complete result including state and country; e.g. select `Candidate City, New Hampshire, United States`, not the similarly named UK result.
6. Greenhouse phone inputs may expose `input#country` as the phone country-code control, not a geographic country selector. If its value is `+1`, treat it as completed and do not try to put `United States` into it.
7. `chrome-control.js eval` can return `undefined` even when the page is healthy. Use `chrome-control.js html 'body'` for DOM/state inspection instead of treating `undefined` as an empty page.

This sequence is also the preferred recovery for `fill-typeahead.js` errors caused by stale tab state or menus that have not rendered yet.

### 9b. Lever Location Dropdown Persistence
Lever’s location field is a custom autocomplete, not a normal `<select>` or React-Select field. Selecting the visible result with `chrome-control.js click` may appear to work while leaving the hidden `selectedLocation` input empty.

Use this sequence:

1. Focus `#location-input` and type the city/state query, such as `Candidate City, NH`.
2. Inspect `html 'body'` for the rendered `.dropdown-location` result and verify the result text.
3. If a normal click does not persist the selection, focus the field and dispatch `ArrowDown` followed by `Enter` through `chrome-control.js eval`.
4. Verify both that the dropdown is hidden and that `#selected-location` contains a non-empty JSON value with the complete location name and ID. A visible text value alone is not sufficient.

For Lever forms generally, inspect hidden inputs and rendered state after custom dropdowns, radio groups, and uploads; `inspect-form.js` may list every unselected radio/checkbox alternative as “unfilled” even when one option in the group is correctly selected.

### 10. Recovery for `chrome-control.js url` Failures

If a command reports an error such as:

```text
Command failed: node ".../chrome-control.js" url
```

do not treat it as proof that Chrome or the visible tab is gone. The `url` command reads the cached tab ID and can fail when that cache is stale or when macOS automation is sandboxed. Recover in this order:

1. Run `node chrome-control.js use-active-tab` through the elevated command runner.
2. Confirm the returned tab ID, URL, and title match the user’s visible tab.
3. Continue with the operation-specific command, such as `inspect-form.js --all` or `extract-job-details.js`; do not use `url` as the recovery step.
4. If `use-active-tab` itself reports no Chrome window/tab, stop and ask the user to confirm that Chrome is open and the intended tab is foregrounded.

The same recovery applies when another command says `Cached Chrome tab was closed` or `No Chrome tab or window found`. A successful `use-active-tab` refresh is the authoritative recovery signal.
