# Agent Instructions: Dynamic Forms and Specialized Dropdowns

These rules govern form filling in this workspace and must be followed by any agent completing application forms.

## 1. Dynamic & Conditional Fields (2nd and 3rd Looks)
- **Check for Popups**: Filling select dropdowns (especially demographic, EEO, veteran, or residency questions like "Are you Hispanic/Latino?" or "Do you have a disability?") often triggers conditional follow-up fields (e.g., "Please identify your race") to render in the DOM.
- **Double-check**: Always take 2nd and 3rd looks by re-running `node inspect-form.js --all` after any demographic select field is filled to detect new inputs that appeared.
- **Verify**: Never assume that filling the initial list of fields is sufficient.

## 2. React-Select Dropdowns (Chip / Typeahead Fields)
- **Identification**: React-Select dropdowns render as inputs with `role="combobox"` and a sibling chevron toggle button. They often appear as `type: "combobox"` in the inspector.
- **Flavors**:
  - **Single-select**: Selecting an option renders a single value overlay (styled with `select__single-value`).
  - **Multi-select**: Selecting an option renders a persistent chip/slug (styled with `select__multi-value`).
- **Handling**: Never attempt to fill React-Select dropdowns using basic `input.value = ...` native setter or AppleScript keystrokes.
- **Tool**: Always use the custom script:
  ```bash
  node fill-typeahead.js "<selector>" "<value>"
  ```
  This script uses a pure browser-side Event-dispatching flow (`mousedown`, `mouseup`, `click`) that works robustly for both single-select and multi-select configurations in Chrome background windows, and waits for React DOM updates to verify selection.
- **University / School Field Typing Directive**: When attempting to fill out the University or School field (e.g. `input#school--0`), type only the first part `"University of Central"` and wait for the dropdown options to populate, then select `"University of Central Florida"`. Never click options before the menu has filtered down.

## 3. Greenhouse Embedded Forms (Cross-Origin Iframes)
- **Problem**: Many corporate job sites (such as point.com) embed the job application form inside an iframe (usually with `id="grnhse_iframe"`) pointing to a cross-origin source like `https://job-boards.greenhouse.io/...`. In this state, browser automation running on the host page will return `0` fields due to Same-Origin security restrictions.
- **Resolution**:
  1. Detect if an iframe is present: `node chrome-control.js eval "return Array.from(document.querySelectorAll('iframe')).map(el => el.src)"`
  2. Extract the direct Greenhouse source URL from the iframe `src`.
  3. Navigate the tab directly to that URL: `node chrome-control.js navigate "<iframe-src-url>"`
  4. Once navigated directly, `inspect-form.js` and all other scripts will execute successfully on the top-level document.

## 4. Active Tab Verification & Target Tab Re-Focus Guard — MANDATORY

- **Tab Memory & State Tracking**: In Step 1 of any application workflow (`/wf-01-craft-custom-job-application`), the agent MUST capture the active tab's `tab_id` and `target_url` and persist them into `submission-state.json` (`tab_id: <ID>`, `target_url: "<URL>"`).
- **Active Tab Guard Procedure**: Before any browser action or form filling (`/wf-02-fill-form`):
  1. Fetch active tab info: `osascript -e 'tell application "Google Chrome" to get {id, URL, title} of active tab of front window'`
  2. **Target Tab Match Check**: Check if the active tab ID or URL matches the target job submission recorded in `submission-state.json`.
  3. **Automated Tab Re-Focus**: If the user has switched to a different tab, run AppleScript to search open Chrome tabs for the recorded `tab_id` or `target_url` and automatically re-focus that tab:
     ```bash
     osascript -e '
     tell application "Google Chrome"
       repeat with w in windows
         set tabIndex to 1
         repeat with t in tabs of w
           if id of t is <TAB_ID> or URL of t contains "<TARGET_URL_KEYWORD>" then
             set active tab index of w to tabIndex
             set index of w to 1
             return {id of t, URL of t, title of t}
           end if
           set tabIndex to tabIndex + 1
         end repeat
       end repeat
     end tell'
     ```
  4. Overwrite `.state/chrome_tab_config.json` with the target tab ID: `echo '{"tab_id":<ID>}' > .state/chrome_tab_config.json`.
  5. Confirm by running `node chrome-control.js url`.
- **If the target tab was closed** and cannot be found in open Chrome tabs, halt immediately and ask the user for input. Do NOT navigate away or fill an unrelated tab.

## 5. File Inputs, Cover Letters & Candidate-Branded Upload Files
- **Problem**: File input elements (like `<input type="file" id="resume">` or `id="cover_letter"`) are skipped by standard form inspection tools (`inspect-form.js` ignores `type="file"` by default).
- **Resolution**:
  - Always check if there are `<input type="file">` elements in the DOM.
  - Form autofill script uploads MUST use candidate-branded PDF filenames in the submission directory:
    - Resume input: `profiles/{user}/submissions/{folder}/fred_brown_resume_for_{company}.pdf` (and `fred_brown_resume.pdf`)
    - Cover Letter input: `profiles/{user}/submissions/{folder}/fred_brown_cover_letter_for_{company}.pdf` (and `fred_brown_cover_letter.pdf`)
  - **Company-Branded PDF Filenames (Mandatory Directive)**: Resumes and cover letters must always be generated with company-specific titles (e.g. `fred_brown_resume_for_fuse.pdf` and `fred_brown_resume_for_fuse_energy.pdf`). `compile-resume-pdf.js` and `generate-letter-formats.js` automatically create both the company-branded files (`fred_brown_resume_for_{company}.pdf`) and the standard `fred_brown_resume.pdf` / `fred_brown_cover_letter.pdf` files so all form upload flows work seamlessly.
  - If a **cover letter** is requested or optional, always draft and customize a single stinging, high-impact paragraph cover letter matching the job requirements (length strictly under 100 words and exactly one paragraph) and compile it using `node generate-letter-formats.js profiles/{user}/submissions/{folder}/cover.md` which produces `cover.pdf`, `fred_brown_cover_letter.pdf`, and `fred_brown_cover_letter_for_{company}.pdf`.

## 6. Factual Verification, Content Directives & Red Team Quality Guardrails
- **Zero Hallucinated Facts or Dummy Dates**: Every university name, degree title, graduation year, honor, company name, role title, certification, and employment start/end date in any generated resume or cover letter MUST be verified word-for-word against `profiles/<candidate>/cv_detail.md` and `personal_info.md`.
- **Zero Dummy Date Placeholders**: NEVER invent, extrapolate, or insert placeholder dates (e.g. `2011 – 2017` or `2006 – 2011`) into employment history. All dates MUST match `cv_detail.md` exactly (Meltwater: `April 2017 – July 2026`, NHP: `April 2008 – April 2017`, Edgewater: `January 2000 – April 2008`).
- **Company Physical Locations Required**: Always include physical employment locations (City, State) on company headers in the resume (e.g. `Meltwater | Manchester, NH`, `Neighborhood Health Plan | Boston, MA`, `Edgewater Technology | Wakefield, MA`).
- **Strict 3-Bullet Skill Grouping**: Group Technical & Core Competencies into **exactly 3 bullet points** (not 5) for maximum visual scannability.
- **Approachable, Pragmatic Tone**: Write executive summaries and role descriptions in a warm, approachable, hands-on engineering tone. Avoid stiff, overly formal corporate jargon or buzzwords.
- **No Unrequested Software / Runtime / Database Version Numbers**: NEVER include minor/major version numbers (e.g. "Python 3.9 & 3.11", "Python 3.9 - 3.13", "MySQL 8.0", "Node.js 20") in resume or cover letter text unless the target job description explicitly requests or specifies those exact version numbers. Keep technology names clean and version-agnostic (e.g., "Python", "MySQL", "AWS RDS", "Node.js").
- **No Low-Level Data Metric Clutter**: NEVER list hyper-granular data volume stats, database sizes, daily ingestion records, table/view counts, or row counts (e.g., "450+ GB of historical data", "50,000+ daily ingested records", "80+ tables and 80+ views", "8M+ row log table") in resume bullet points or cover letters. They create visual noise and hinder readability. Express scale smoothly in professional, high-level terms (e.g. "large-scale enterprise data warehouse", "high-volume multi-source ETL pipelines", "comprehensive relational schemas"). Reserve numbers for high-level business impact (e.g., "recovering millions in underpayments").
- **Vendor & Brand Prefix Consolidation (Anti-Repetition)**: Group related cloud services and vendor tools under a single parent umbrella instead of repeating prefixes or product brands (e.g., write **"AWS (RDS, S3, EC2, Lambda, SQS)"** instead of "AWS RDS, AWS S3, AWS EC2, AWS Lambda, AWS SQS").
- **Mandatory Deduplication & Conciseness Pass**: Before finalizing any resume or cover letter, execute a dedicated deduplication and conciseness pass over all skill lists and experience bullets. Eliminate redundant, overlapping, or wordy tool pairings (e.g., NEVER write "Looker, Looker Studio" or "SQL Server, MS SQL"; pick the single most relevant tool like "Looker Studio" or write "Looker / Looker Studio"). Eliminate repeated technologies across bullet points within the same section and trim overly wordy enumerations.
- **No Internal Codenames or Company Jargon**: Strip internal/company-specific codenames (e.g. "Cash Fire" reports, "Intercom Triton", "intercom-switchboard") from resume and cover letter text. Replace them with clear, professional industry-standard descriptors (e.g. "revenue-weighted defect impact reporting", "automated event-driven routing engine", "AI ticket sanitization pipeline").
- **Age Neutrality & 10+ Year Experience Cap**: NEVER state "20+ years", "25+ years", or total career duration (e.g., "18+ years") in executive summaries, skill lists, or cover letters to avoid ageism / overqualification bias. Stated experience duration MUST be capped at **"10+ years"** maximum (or aligned directly with the target job posting's requested seniority, e.g. "8+ years").
- **Authentic Candidate Resume Title Header**: ALWAYS map the section header above the executive summary to Fred's authentic core strengths and established leadership domains (e.g. `## Senior Analytics & Operational Data Leader`, `## Senior Data Platform & Analytics Leader`, `## Senior Product Support Engineering Manager`, `## Senior Analytics Engineer`). DO NOT mechanically copy target job titles that Fred has not held (e.g. NEVER write niche unheld titles like `Analytics Manager, Credit Cards`).
- **Candidate Core Leadership Philosophy**: Select and weave only the 1 or 2 authentic candidate values from `personal_info.md` that naturally align with the specific job context: (1) People & culture first (best for management/leadership roles); (2) Anti-technical debt & root-cause engineering discipline (best for data engineering/analytics architecture); (3) Personal accountability & feedback loops (best for product/support/analytics partnership); (4) Rigorous testing discipline (best for production pipelines & AI automation). Express these values using varied, natural human phrasing — DO NOT mechanically repeat the literal phrase "measure twice, cut once" across documents.
- **Authentic Executive Summary & Anti-Parrotting Rule**: The Executive Summary section in `resume.md` MUST focus on Fred's authentic candidate identity, technical strengths, system architectural scope, and real-world accomplishments from `cv_detail.md`. NEVER mechanically copy, parrot, or mirror boilerplate phrasing, buzzwords, or verbatim sentences from the target job posting. The summary must sound like Fred introducing his genuine background and capabilities in a natural, human voice—not a reflection or restatement of the employer's job description.


- **Strict Prohibition of Em-Dashes (—) in Resumes & Cover Letters**: Em-dashes (`—`) are STRICTLY FORBIDDEN in all generated resumes (`resume.md`) and cover letters (`cover.md`). Use commas, colons, semicolons, parentheses, or periods instead. Every Red Team audit (`02c_review.md` and `03c_review.md`) MUST execute a Python em-dash scan; any detected em-dash forces `STATUS: FAIL`.
- **Hardcoded Education & Certifications Block**: The `## Education & Certifications` section in `resume.md` MUST be copied character-for-character from the canonical block defined in `profiles/<candidate>/resume-config.md` Section 7 without any LLM editing or rephrasing.
- **Mandatory Volunteer Experience & Other Items Blocks**: Every generated resume (`resume.md`) MUST include both `## Volunteer Experience` and `## Other Items` sections immediately following `## Education & Certifications`, copied verbatim from `profiles/<candidate>/resume-config.md` Section 8 without omission.

- **Cover Letter Salutation & Closing Sign-Off**: Cover letters MUST start directly with a salutation opening (e.g. `Dear [Company] Hiring Team,`) at the top — NEVER include a top candidate header block like `# Candidate Name` in `cover.md` as `generate-letter-formats.js` injects letterhead automatically — and end strictly with `Sincerely,` as the final line of text. NEVER write the candidate name below `Sincerely,` in `cover.md`, because `generate-letter-formats.js` automatically appends the signature image, full name, email, and cell phone number.
- **Cover Letter Voice & Content Differentiation**: The cover letter MUST NOT repeat or sound identical to the resume's executive summary paragraph. While both remain grounded in the candidate's authentic experience and leadership values, the cover letter MUST adopt a distinct, conversational tone focused on candidate motivation, organizational alignment, and direct partnership.
- **Mandatory Contact Header Markdown Links**: The top contact header in `resume.md` MUST format email, cell phone number, LinkedIn, and Portfolio links using clean anchor text (`[email@example.com](mailto:email@example.com) | Phone | [LinkedIn](https://linkedin.com/in/username) | [Portfolio](https://portfolio.example.com)`), ALWAYS including the cell phone number from personal_info.md and prioritizing the Portfolio link over GitHub unless GitHub is explicitly requested. NEVER expose raw URL strings as text.
- **Global & Candidate Writing Directives (Mandatory Text Quality Guardrails)**: All drafting and Red Team auditing MUST strictly enforce the writing directives in [.agents/writing-rules.md](file:///.agents/writing-rules.md) (or any candidate-specific overrides in `profiles/{candidate}/writing-rules.md`).
- **Red Team Critical Alert & Mandatory Technology Inventory Audit**: Every Red Team Audit (`02c_review.md` and `03c_review.md`) MUST check for date fidelity, unverified technology hallucinations (verifying every listed tool against `cv_detail.md`), unrequested version numbers, metric clutter, prefix repetition/overlapping tool pairs (deduplication & conciseness pass), internal codenames, 3-bullet skill grouping, physical company locations, experience claims exceeding 10+ years, target job title resume header, cover letter salutation/closing lines, and compliance with all writing directives in [.agents/writing-rules.md](file:///.agents/writing-rules.md) (and `profiles/{candidate}/writing-rules.md`). For `03c_review.md` specifically, the em-dash check MUST be backed by running the mandatory scan command (see Step 3 above) — a PASS claimed without running the scan is invalid. If ANY unverified technology or other failure is detected:
  - Red Team MUST display a prominent `🚨 CRITICAL RED TEAM ALERT: Verification Failure — [Detail]` banner at the top of the report.
  - Red Team MUST force the overall fit score to `0.0 / 10`.
  - Red Team MUST set `STATUS: FAIL` to trigger the auto-retry rewrite loop.
  - Form submission MUST be blocked until the error is corrected.

## 7. Streamlined Job Submission Workflow (Mandatory Process)

All job application tasks MUST strictly execute the following 4-step workflow:

1. **Step 1: Workspace & State Setup, Gap Analysis & Recruiter Outreach (Steps 1a, 1b, 1d)**
   - Verify active Chrome tab (Foreground Tab Guard).
   - Identify target company name and job title.
   - **Location & Commute Compatibility Guard**: Check the job description for location/hybrid requirements. Check against commute and location boundaries specified in the candidate's `personal_info.md`. If the role requires on-site / hybrid attendance outside acceptable commute boundaries, mark as **INCOMPATIBLE**, halt execution immediately, notify the user, and run `node update-applied-jobs.js status "{folder_name}" "abandoned" "Location Incompatible (<detail>)"`.
   - **Industry & Domain Exclusion Guard**: Check if the company or role is in a strictly excluded domain from `personal_info.md` (e.g., **Political Organizations, campaigns, PACs, or partisan fundraising tech** like ActBlue/WinRed). If so, mark as **EXCLUDED**, halt execution immediately, notify the user, and run `node update-applied-jobs.js status "{folder_name}" "abandoned" "Domain Excluded (Politics)"`.
   - **Salary & Compensation Compatibility Guard**: Check the job description for posted base salary and total compensation. Compare against candidate floor thresholds from `personal_info.md`:
     - **Remote (US)**: Default floor is **$180,000 base**. Roles whose maximum posted base salary is strictly capped below **$160,000** (e.g. $72k–$107.4k, $120k–$150k) are **BELOW EXPECTATIONS**.
     - **On-site / Hybrid Local**: Minimum floor specified in candidate's `personal_info.md`.
     - **On-site / Hybrid Metro**: Minimum floor specified in candidate's `personal_info.md`.
     If the maximum posted base salary is strictly below **$160,000**, the agent MUST **halt execution immediately**, display a prominent warning to the user with the exact posted salary details, and ask the user for explicit confirmation whether to proceed before creating any files or continuing the application workflow.
   - **Prior Company Lookup**: Run `node lookup-company-jobs.js "<company_name>"` to check for previous applications to this company recorded in `applied_jobs.md`.
   - Create working directory: `profiles/{user}/submissions/{YYYYMMDD_company_name_job_name}/`.
   - Extract and save job description into `01_job_description.md`.
   - **Mandatory Gap Analysis File (`01b_gap_analysis.md`)**: Compare candidate's `cv_detail.md` against target job description and generate `01b_gap_analysis.md` detailing candidate-to-job gaps ordered strictly by significance (High, Medium, Low), including impact and mitigation strategies for each gap.
   - **LinkedIn Connections Check: DISABLED**: Per user directive, do NOT search or check LinkedIn connections (do not run `lookup-linkedin-connections.js` or generate `01c_linkedin_contacts.md`). Focus networking reconnaissance strictly on recruiter and hiring outreach in Step 1d.
   - **Mandatory Recruiter Identification & Outreach Drafting (`01d_recruiter_outreach.md`)**: Run `node lookup-linkedin-recruiters.js "<company_name>"` to identify talent acquisition leads, recruiters, and engineering hiring managers at the company (1st, 2nd, and 3rd+ degrees). Save `01d_recruiter_outreach.md` documenting identified recruiters along with custom, stinging pre-drafted outreach messages. **Mandatory Subject Line & Teaser Question Directive**: Every recruiter draft MUST include a punchy, role-specific **Subject Line** (e.g. `Subject: Application & Platform Architecture Question — Engineering Lead`) and a body text (<300 characters max) featuring a concise, insightful **teaser question** that directly highlights one of Fred's top matching candidate strengths (e.g., monolith-to-microservices modernization, AWS serverless pipelines, high-volume telemetry ingestion, RAG/AI automation).
   - Initialize per-submission state file: `submission-state.json` (tracks `status: "in_progress"`, `resume_review_count`, `cover_review_count`).
   - **Catalog Registration**: Immediately register the new application in `applied_jobs.md` with status `⏳ In Progress` by running: `node update-applied-jobs.js status "{folder_name}" "in_progress"`.

2. **Step 2: Resume Archetype Selection, Snapshot & Factual Audit (Steps 2a, 2b, 2c)**
   - **2a (Selection Plan)**: Write `02a_resume_plan.md`. Read `profiles/{candidate}/archetypes/metadata.yaml` and compare the target job description against the trigger keywords (`selection_triggers`), target roles (`target_roles`), and core competencies (`core_skills`) of the pre-built master resume archetypes:
     - `01_data_architect_warehouse` (Data Architect / Warehouse & Database/Reporting Expert)
     - `02_support_forward_deployed_engineer` (Support Engineer / Forward Deployed Engineer - Problem Solver)
     - `03_senior_manager` (Senior Manager - Leadership & Operations)
     - `04_general_technical_leader` (General Technical Operations & Data Systems Leader)
     - `05_full_send_executive_resume` (Full Send Executive Resume - Maximum CV Detail)
     
     **Selection & New Archetype Suggestion Directive**:
     - Select the pre-built archetype that provides the strongest domain alignment with the target job posting.
     - **Suggesting a New Archetype**: If no existing archetype provides a clear, strong match (or if the role represents a distinct specialized track not adequately covered by the 5 archetypes), the agent MUST explicitly suggest creating a new archetype to the user in `02a_resume_plan.md` and in the chat response, outlining the proposed archetype title, core focus, and trigger keywords. In the meantime, default to the closest matching archetype (e.g. `04_general_technical_leader` or `05_full_send_executive_resume`) for the current application snapshot until the user approves creating a new archetype.
     - If prior applications to this company were found in Step 1, document them in a dedicated `## Prior Submissions to <Company>` section.

   - **2b (Snapshot & Compilation)**:
     - Take a snapshot copy of the selected archetype Markdown file (`profiles/{candidate}/archetypes/<id>.md`) and copy it directly into the active submission directory as `resume.md` (e.g. `cp profiles/{candidate}/archetypes/<id>.md profiles/{candidate}/submissions/{folder}/resume.md`).
     - Compile `resume.pdf` and `fred_brown_resume.pdf` in the submission folder using:
       `node compile-resume-pdf.js profiles/{candidate}/submissions/{folder}/resume.md`
     - This maintains the exact standard file naming conventions (`resume.md`, `resume.pdf`, `fred_brown_resume.pdf`) required for ATS form uploads and submission tracking.

   - **2c (Review)**: Execute Red Team Gap Analysis & Factual/Quality Verification comparing the selected archetype against the target job requirements, saving report to `02c_review.md` with explicit `STATUS: PASS` or `STATUS: FAIL`.
   - **Retry Loop**: If `02c_review.md` is `STATUS: FAIL`, increment `resume_review_count` in `submission-state.json` and loop back to 2a. If `resume_review_count > 2` (2 failures), halt execution and ask the user for input.

3. **Step 3: Cover Letter Planning, Drafting & Factual Audit (Steps 3a, 3b, 3c)**
   - **3a (Plan)**: Write `03a_cover_plan.md` outlining pitch and gap-mitigation strategy. On retries, incorporate `03c_review.md`.
   - **3b (Draft)**: Generate `cover.md` (single stinging, informal, teasing paragraph under 100 words starting directly with the salutation line — NEVER include a top `# Candidate Name` header block —, and ending strictly with `Sincerely,` — DO NOT type `Fred Brown` below `Sincerely,` as `generate-letter-formats.js` appends the signature block automatically —, following writing rules in [.agents/writing-rules.md](file:///.agents/writing-rules.md) / `profiles/{candidate}/writing-rules.md`). Do NOT use em-dashes (`—`) or en-dashes (`–`) anywhere in the cover letter text. Compile `cover.pdf` & `fred_brown_cover_letter.pdf` using `node generate-letter-formats.js`.
   - **3c (Review)**: Execute Factual Verification & Quality Control Audit. **MANDATORY**: Before writing the review report, run the following scan and include its raw output verbatim in the `No em-dashes` row of the Anti-AI Rules table. A `✅ PASS` on that row is ONLY valid if the command outputs exactly `PASS: zero em-dashes or en-dashes found`. Any `FAIL:` output MUST mark the row `❌ FAIL` and force `STATUS: FAIL`:
     ```bash
     python3 -c "
text = open('profiles/{user}/submissions/{FOLDER}/cover.md').read()
dashes = [i for i, c in enumerate(text) if c in '\u2014\u2013']
if dashes:
    for pos in dashes:
        print(f'FAIL: em/en-dash at position {pos}: ...{repr(text[max(0,pos-20):pos+20])}...')
else:
    print('PASS: zero em-dashes or en-dashes found')
"
     ```
   - Enforce salutation, single paragraph <100 words, sign-off, and writing rules in [.agents/writing-rules.md](file:///.agents/writing-rules.md) / `profiles/{candidate}/writing-rules.md`, saving report to `03c_review.md` with explicit `STATUS: PASS` or `STATUS: FAIL`.
   - **Retry Loop**: If `03c_review.md` is `STATUS: FAIL`, increment `cover_review_count` in `submission-state.json` and loop back to 3a. If `cover_review_count > 2` (2 failures), halt execution and ask the user for input.

4. **Step 4: User Presentation & Summary Card Output**
   - Present a simple, compact summary card in the chat response including a link to the submission directory folder, document links, and recruiter outreach targets:
     ```markdown
     ### 📋 Application Package Summary

     **Company**: {Company} | **Role**: {Job Title}  
     **Folder**: [{folder_name}](file:///absolute/path/to/folder)

     *(If prior submissions exist:)*
     📌 **Prior Applications to {Company}**:
     - **{Prior Job Title}** ({Date}): [{prior_folder_name}](file:///absolute/path/to/prior/folder)

     🎯 **Recruiter & Hiring Outreach Targets**:
     - **{Recruiter Name}** ({Headline}) - [{url}]({url})
       *Connection Note (<200 chars)*: "{Note Text}"

     - **Job Description**: [01_job_description.md](file://.../01_job_description.md)
     - **Gap Analysis**: [01b_gap_analysis.md](file://.../01b_gap_analysis.md)
     - **Recruiter Outreach**: [01d_recruiter_outreach.md](file://.../01d_recruiter_outreach.md)
     - **Resume Plan**: [02a_resume_plan.md](file://.../02a_resume_plan.md)
     - **Resume**: [md](file://.../resume.md) | [pdf](file://.../resume.pdf) | [ats pdf](file://.../fred_brown_resume.pdf)
     - **Resume Review**: [02c_review.md](file://.../02c_review.md) (Score: {score}/10 - PASS)
     - **Cover Letter Plan**: [03a_cover_plan.md](file://.../03a_cover_plan.md)
     - **Cover Letter**: [md](file://.../cover.md) | [pdf](file://.../cover.pdf) | [ats pdf](file://.../fred_brown_cover_letter.pdf)
     - **Cover Letter Review**: [03c_review.md](file://.../03c_review.md) (Score: {score}/10 - PASS)
     - **State**: [submission-state.json](file://.../submission-state.json)
     ```
   - **DO NOT AUTOFILL FORM IN STEP 1/WF-01**: `/wf-01-craft-custom-job-application` STOPS immediately after presenting the summary card. Form filling is a separate step and MUST ONLY be executed when the user explicitly triggers `/wf-02-fill-form` or requests to fill the form.
   - **Form Autofill Workflow (`/wf-02-fill-form`)**: When `/wf-02-fill-form` is triggered, proceed with form autofill on the active Chrome tab using `fred_brown_resume.pdf` and `fred_brown_cover_letter.pdf` in the submission directory. Once form autofill is complete, update status to `✅ Form Filled`: `node update-applied-jobs.js status "{folder_name}" "completed"`.
   - **User Abandonment / Rejection Handling**: If the user instructs to skip, cancel, or decides not to apply to a job at any point, immediately run `node update-applied-jobs.js status "{folder_name}" "abandoned" "<reason>"` to mark `applied_jobs.md` as `🚫 Abandoned (<reason>)`.

8. **Dedicated LinkedIn Application Workflow (`/wf-03-linkedin-job-application`)**
- **Trigger**: When the user requests to search, inspect, or apply to jobs directly on LinkedIn (`https://www.linkedin.com/jobs/...`).
- **LinkedIn Session State**: Operates inside the user's logged-in Chrome browser session (`node chrome-control.js`).
- **Job Discovery & Extraction**:
  1. Inspect open LinkedIn jobs search page or view tab.
  2. Extract job title, company, location, application type (Easy Apply vs External Apply), and full description from the DOM.
  3. Perform Step 1 (Gap Analysis `01b`, Recruiter Outreach `01d` with pre-drafted <200 char notes; LinkedIn connection check disabled).
  4. Perform Step 2 (Resume Archetype Snapshot & PDF Compilation `fred_brown_resume.pdf`).
  5. Perform Step 3 (Cover Letter & PDF Compilation `fred_brown_cover_letter.pdf`).
- **Application Execution**:
  - **Easy Apply Modal**: Click Easy Apply, fill contact details, upload `fred_brown_resume.pdf` & `fred_brown_cover_letter.pdf`, fill EEO/custom fields, and present final review before submission.
  - **External Apply Redirect**: Click Apply (which opens the company's ATS tab, e.g. Greenhouse, Ashby, Workday), re-target Chrome tab config (`node chrome-control.js use-active-tab`), and execute `/wf-02-fill-form` on that ATS tab.

9. **Strict Prohibition of External HTTP CLI Tools (`curl`, `wget`)**
- **MANDATORY RULE**: NEVER use `curl`, `wget`, `read_url_content`, or external CLI HTTP tools to fetch web pages, scrape job sites, or bypass browser state during job search and form filling workflows.
- **ALL** browser interactions, DOM evaluations, page inspections, and form filling MUST be performed strictly through project custom scripts (`node chrome-control.js`, `node inspect-form.js`, `node fill-typeahead.js`).
- `curl` is ONLY permitted for non-browser developer troubleshooting (e.g. verifying local API endpoints).

10. **Rapid LinkedIn Job Evaluation & Auto-Packaging Workflow (`/wf-04-eval-linkedin-job`)**
- **Trigger**: When the user requests to evaluate, inspect, or review a job on LinkedIn.
- **Extraction Protocol**:
  1. Automatically expand LinkedIn "...more" / "Show more" buttons using JS DOM evaluation (`node chrome-control.js eval`).
  2. Extract full job details text (Title, Company, Location, Compensation, Date Posted / Posting Age, Responsibilities, Requirements).
- **Evaluation Criteria (Primary Importance)**:
  1. 💰 **Pay / Compensation Match**: Compare listed salary range against candidate's baselines in `personal_info.md` (Remote US: $180k–$200k base target; Boston Hybrid: $250k+ base; NH Local: $180k–$200k+). Explicitly note salary shortfall or match.
  2. ⏱️ **Job Posting Age & Freshness**: Track when the job was posted (e.g. "Posted 3 days ago", "Posted 4 weeks ago", "Posted 2 months ago"). Flag jobs posted over 3 weeks ago as `⚠️ Potentially Stale` and over 2 months ago as `🚫 Definitely Stale`.
  3. ⚡ **Skill & Qualification Match-up**: Compare technical requirements (cloud platforms, languages, tools, certifications, leadership scope) against candidate's `cv_detail.md`.
- **Output & Conditional Auto-Packaging**:
  - Present the **LinkedIn Job Evaluation Card** (Pay Match, Posting Age / Freshness, Skill Match Table, Verdict).
  - *(Note: LinkedIn connection checks are DISABLED per user directive — do not run connection lookups or generate `01c_linkedin_contacts.md`)*.
  - **If Favorable / Strong Match**: Automatically create the submission tracking directory (`profiles/{user}/submissions/{YYYYMMDD_company_role}/`), save `01_job_description.md`, `01b_gap_analysis.md`, `01d_recruiter_outreach.md`, snapshot the resume archetype, compile `fred_brown_resume.pdf` and `fred_brown_cover_letter.pdf`, and register in `applied_jobs.md` so the candidate can apply immediately!
  - 🚦 **Verdict / Recommendation**: (Strong Match / Marginal / Weak Fit Due to Pay Underpayment / Stale Posting Flag)

11. **Job Posting Age & Stale Listing Guard (Mandatory)**
- **Tracking**: During job discovery, extraction, and evaluation, agents MUST extract the posting date or "time ago" string from the job page DOM (e.g. "Posted 3 days ago", "Posted 4 weeks ago", "Posted 2 months ago", "Reposted 1 month ago").
- **Stale Classification Thresholds**:
  - **Fresh**: Posted <= 3 weeks ago (21 days) -> `✅ Fresh (Posted X days/weeks ago)`
  - **Potentially Stale**: Posted > 3 weeks ago (21 days to 60 days) -> `⚠️ Potentially Stale (Posted X weeks/months ago)`
  - **Definitely Stale**: Posted > 2 months ago (>60 days) -> `🚫 Definitely Stale (Posted X months ago)`
- **Reporting & Documentation**: Always record the posting age in `01_job_description.md` metadata header, present it in the Evaluation Card (`/wf-04-eval-linkedin-job`), and highlight stale warnings in chat summaries so the user is aware before investing effort in a stale listing.

12. **Mandatory Search Tab Preservation & New Tab Navigation Guard**
- **Search Tab Protection**: Agents MUST NEVER navigate away from or replace an active job search results list tab (e.g. `https://www.linkedin.com/jobs/search/...`, `https://www.indeed.com/jobs?...`, `https://www.indeed.com/?vjk=...`). Navigating the search tab loses the candidate's active job search list.
- **New Tab Opening Protocol**: Whenever inspecting a specific job posting that requires navigating to a direct job URL (such as `https://www.indeed.com/viewjob?jk=...` or `https://www.linkedin.com/jobs/view/...`), the agent MUST open the URL in a **NEW Chrome tab** using AppleScript:
  ```bash
  osascript -e 'tell application "Google Chrome" to tell front window to make new tab with properties {URL:"<target_url>"}'
  ```
- **Tab Pinning**: Immediately pin `.state/chrome_tab_config.json` to the newly created tab ID (`echo '{"tab_id": <ID>}' > .state/chrome_tab_config.json`), extract the job details from the new tab, and leave the candidate's original job search list tab open and intact.






