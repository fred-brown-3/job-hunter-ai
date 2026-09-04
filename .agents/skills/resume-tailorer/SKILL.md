---
name: resume-tailorer
description: Tailor a custom, job-aligned resume using raw ingredients from a candidate's cv_detail.md based on target job requirements and preferences in resume-config.md.
---

# Resume Tailorer Skill

This skill governs the process of crafting customized, high-impact resumes tailored for specific job openings using the high-fidelity master ingredients in a candidate's profile directory (`profiles/<candidate>/cv_detail.md`) and candidate-specific directives in their configuration file (`profiles/<candidate>/resume-config.md`).

---

## ⚠️ MANDATORY RULE: Candidate Config Supremacy

Before generating or tailoring any resume:
1. **Read Candidate Preferences First**: You MUST inspect `profiles/<candidate>/resume-config.md` for the active candidate.
2. **Config Overrides Skill**: All rules, page limits, typography preferences, section ordering, item limits, candidate guardrails, and tone instructions specified in `resume-config.md` **REIGN SUPREME** and override any default guidelines in this skill file.

---

## ⚠️ MANDATORY RULE: Red Team Gap Analysis Presentation

Whenever a resume is drafted, tailored, or updated for a specific job posting:
1. **Execute Job Matcher Analysis**: You MUST run the `job-matcher` Red Team Gap Analysis comparing `cv_detail.md` and the drafted/updated resume against the target job description.
2. **Mandatory Presentation to User**: You MUST present the completed Red Team Assessment (Overall Fit Score, Dynamic Requirement Match Matrix, Red Team Vulnerabilities, and Actionable Gap-Filling Questions) directly to the user before declaring completion or moving to form autofill. NEVER skip presenting the Red Team Analysis.
3. **Universal Trigger (Includes Form Applications)**: This requirement applies universally whenever evaluating or applying for a job—including when the user simply asks to "apply to the job on the current tab". Always generate the tailored resume and present the Red Team Analysis BEFORE starting form filling.

---

## 1. Core Philosophy: Baking a Custom Resume from Ingredients

Do not copy preset resume templates. Treat `profiles/<candidate>/cv_detail.md` as a catalog of modular, high-fidelity ingredients (skills, accomplishment stories, metrics, tech stacks, leadership traits). The goal is to bake a fresh resume tailored to the exact requirements of the target role.

### The XYZ Keyword Alignment Rule
If a target job description emphasizes **XYZ** (e.g., specific languages, frameworks, cloud services, tools, or domain competencies) and the candidate has **XYZ** experience documented in `cv_detail.md`:
1. **Explicit Visibility**: Weave **XYZ** clearly throughout the entire resume—not just in the cover letter.
2. **Pervasive Placement**: Integrate **XYZ** into:
   - The tailored **Professional Summary**
   - The **Technical Skills Directory**
   - The relevant **Work Experience bullet points**
   - The selected **Portfolio / Technical Accomplishments**

---

## 2. Signal-to-Noise Directives (Zero Distracting Noise)

1. **Strict Relevance Filtering**: Omit historical, legacy, or unrelated technologies if they have no relevance to the target job description. Never include noise that dilutes the candidate's core technical profile for the target position.
2. **Featured Accomplishments Threshold & Domain Alignment**: Take a fresh look at each target job description and feature 1 to 3 projects from `cv_detail.md` that strictly match the role's primary functional domain:
   - *Head of Data / Data Leadership*: Feature Enterprise Data Warehousing (AWS RDS MySQL, S3, EC2 ETL), AI/LLM Schema Metadata Governance, and Complex Financial/Data Reconciliation ($8M+ recovery models). Never feature chat/webhook routing engines.
   - *Support Leadership & Technical Escalation*: Feature Support Rules Engines, Tier 2/3 Escalation Governance, HAR Network Telemetry Diagnostics, and Incident Management.
   - *Data / Analytics Engineering*: Feature Data Platform Architecture, AWS RDS MySQL, Python ETL, Relational Data Modeling, and BI Reporting.
   - *AI & Automation*: Feature AWS Bedrock/OpenAI Pipelines, Custom MCP Proxies, and API Integration Engines.
   - If only **1 project** in `cv_detail.md` is a direct domain match, feature **ONLY that 1 project**. Do NOT include unrelated 2nd or 3rd projects just to fill space.
3. **No Version Number Clutter**: NEVER include minor or major version numbers for programming languages, runtimes, or databases (e.g. list **Python**, NOT **Python (3.9 – 3.13)**; list **MySQL**, NOT **MySQL 8.0**; list **Node.js**, NOT **Node.js 20**) UNLESS the target job description explicitly requests or specifies those exact version numbers.
4. **No Low-Level Data Metric Clutter**: Strip hyper-detailed database stats, data volume sizes, daily record/ingestion counts, and exact table/view counts (e.g. "450+ GB of historical data", "50,000+ daily ingested records", "80+ tables and 80+ views", "8M+ rows") from resume bullets. State scale smoothly using high-level professional phrasing (e.g. "enterprise cloud data warehouse", "high-volume multi-source ETL pipelines").
5. **Vendor & Brand Prefix Consolidation**: Group related cloud services and vendor tools under a single parent umbrella instead of repeating vendor prefixes or product names (e.g., list **"AWS (RDS, S3, EC2, Lambda, SQS)"** instead of "AWS RDS, AWS S3, AWS EC2, AWS Lambda, AWS SQS"; list **"Looker & Looker Studio"** instead of repeating "Looker, Looker Studio").
6. **No Internal Codenames or Obscure Jargon**: Strip internal project codenames and internal team jargon (e.g., replace **"Cash Fire" reports** with **revenue-weighted defect impact reporting**; replace **intercom-switchboard** with **automated event-driven routing engine**). Always frame accomplishments in industry-standard professional language.
7. **No Redundant Protocol/Interface Suffix Clutter**: Strip redundant protocol or interface suffix descriptors from brand/technology names in skill lists (e.g., list **OpenAI**, NOT "OpenAI API"; list **Git**, NOT "Git & Version Control"; list **OpsGenie**, NOT "OpsGenie Alerting"). State core technology, model, and platform names cleanly.
8. **Writing & Anti-AI Directives**: Strictly enforce [.agents/writing-rules.md](file:///.agents/writing-rules.md) (and candidate-specific overrides in `profiles/<candidate>/writing-rules.md`).

---

## 3. Dynamic Template Hydration Structure

The master template file at [resources/resume_template.md](file:///Users/fredbrown/Documents/github/jobhunt-sandbox/.agents/skills/resume-tailorer/resources/resume_template.md) is 100% sanitized and user-agnostic. It contains no hardcoded personal text, company names, job titles, or dates.

When generating a resume for any candidate:
- **Header & Contact Info**: Hydrated from candidate's `personal_info.md`. All contact links MUST be formatted as active Markdown links. Email addresses MUST be hyperlinked with `mailto:` (e.g. `[candidate@example.com](mailto:candidate@example.com)`), and web links MUST be hyperlinked (e.g. `[LinkedIn](url)`, `[Portfolio](url)`).
- **Target Headline & Executive Summary**: Dynamically synthesized using identity ingredients from `cv_detail.md` matched against target job requirements.
- **Technical Competencies Block**: Dynamically categorized and filtered for strict relevance to the job.
- **Featured Technical Accomplishments**: Dynamically populated with high-fidelity project ingredients that pass the relevance threshold.
- **Employment History & Role Progression**: Dynamically hydrated from employment ingredients in `cv_detail.md`. Dates MUST be populated directly from `DATES_OF_EMPLOYMENT` in `cv_detail.md`.
- **Education & Credentials**: Hydrated directly from education ingredients in `cv_detail.md` (canonical block).
- **Volunteer Experience & Other Items**: Mandated standalone sections inserted verbatim from `resume-config.md` Section 8 immediately following Education & Credentials.


---

## 4. Section Composition Directives

### A. Authentic Candidate Resume Title Header & Custom Executive Summary
- **Authentic Candidate Resume Title Header**: ALWAYS map the section header above the executive summary to Fred's authentic core strengths and established leadership domains (e.g. `## Senior Analytics & Operational Data Leader`, `## Senior Data Platform & Analytics Leader`, `## Senior Product Support Engineering Manager`, `## Senior Analytics Engineer`). DO NOT mechanically copy target job titles that Fred has not held (e.g. NEVER write niche unheld titles like `Analytics Manager, Credit Cards`).
- **Target Headline**: Match the headline to the candidate's target identity and the job title.
- **Approachable, Pragmatic Tone**: Write in an approachable, hands-on, human engineering tone. Avoid rigid, overly formal corporate jargon (e.g. use clean phrasing like *"Pragmatic Senior Data & Analytics Engineer passionate about turning messy stakeholder requests into clean SQL models and dashboards people actually use"*).
- **Authentic Candidate Identity & Anti-Parrotting**: Synthesize a fresh 3-4 sentence summary centered on Fred's genuine identity, system scope, and real-world accomplishments from `cv_detail.md`. NEVER mechanically copy, parrot, or mirror wording from the target job posting. It must sound like Fred introducing his real-world capabilities, not a restatement of the job description.

- **Experience Years Framing & 10+ Year Cap**:
  - **No Large Totals**: NEVER state "18+ years", "25+ years", or total career duration. Stating excessive years creates friction with hiring managers (risk of overqualification or ageism).
  - **Mirror Job Requirement**: Align stated years directly with the target job's requested seniority (e.g., if the job spec requests 6–8 years, state "8+ years").
  - **Default 10+ Year Cap**: Avoid stating more than "10+ years" of experience in any skill or domain unless the job spec explicitly asks for 10+ / 12+ / 15+ years.

### B. Technical Skills Directory (Strict 3-Bullet Grouping)
- Group skills strictly into **exactly 3 clean bullet points** (not 5).
- Consolidate related cloud infrastructure, BI tools, and languages cleanly.
- Filter out irrelevant legacy technologies not called for by the position.

### C. Experience & Professional History Format (Physical Locations Required)
- **Physical Locations**: Always include the company's physical location (City, State) on the company header line (e.g., `### **Meltwater** | Boston, MA`).
- **Role Progression & Dates**: Present role titles and start/end dates cleanly on the sub-header line (e.g., `**Senior Product Support Engineering Manager** | April 2017 – July 2026`).
- **Project Selection**: Select only the most directly relevant accomplishment ingredients from `cv_detail.md` matching the target job's domain.

---

## 5. General Guardrails & Anti-Hallucination Rules

Unless explicitly configured in `resume-config.md`:
1. **Page Budget**: Respect candidate's target length in `resume-config.md` (e.g., strict 2-page max).
2. **No Unverified Technologies**: Do NOT add unverified technologies or claim experience with tools not present in the candidate's `cv_detail.md`.
3. **Candidate-Specific Rules**: Read and obey all candidate guardrails, certification formatting rules, and experience nuances specified in `profiles/<candidate>/resume-config.md`.
4. **Strict Factual & Date Verification (Zero Tolerance for Dummy Dates or Hallucinated Credentials)**: Every university name, college, degree title, graduation year, honor, company name, job title, employment start/end date, and certification in a drafted resume MUST be verified word-for-word against `profiles/<candidate>/cv_detail.md` and `personal_info.md`. Inventing, estimating, or inserting dummy date placeholders (e.g. `2011 – 2017`) is strictly forbidden and constitutes a catastrophic failure.

---

## 6. Execution Workflow & Step 2 Archetype Selection/Snapshot Loop

Whenever preparing a resume for a job application submission:

1. **Step 2a: Archetype Selection & Alignment Plan (`02a_resume_plan.md`)**
   - Read `profiles/<candidate>/archetypes/metadata.yaml` and `01_job_description.md` from the active submission directory (`profiles/<candidate>/submissions/{YYYYMMDD_company_job}/`).
   - Match the target job's requirements against the selection triggers, target roles, and core competencies of the 5 master archetypes:
     - `01_data_architect_warehouse` (Data Architect / Warehouse & Database/Reporting Expert)
     - `02_support_forward_deployed_engineer` (Support Engineer / Forward Deployed Engineer)
     - `03_senior_manager` (Senior Manager - Leadership & Operations)
     - `04_general_technical_leader` (General Technical Operations & Data Leader)
     - `05_full_send_executive_resume` (Full Send Executive Resume - Maximum CV Detail)
   - **New Archetype Suggestion Directive**: If no existing archetype provides a clear match (or if the target role represents a novel track), explicitly recommend creating a new archetype in `02a_resume_plan.md` and user chat, detailing proposed title, focus, and triggers. Default to the closest archetype (`04` or `05`) for the immediate application snapshot until confirmed by the user.
   - Save selection plan to `profiles/<candidate>/submissions/{folder}/02a_resume_plan.md`.

2. **Step 2b: Resume Snapshot & PDF Compilation (`resume.md`, `resume.pdf` & `fred_brown_resume.pdf`)**
   - Copy the selected archetype Markdown file to the submission folder:
     `cp profiles/<candidate>/archetypes/<id>.md profiles/<candidate>/submissions/{folder}/resume.md`
   - Compile PDF using:
     ```bash
     node compile-resume-pdf.js profiles/<candidate>/submissions/{folder}/resume.md
     ```
     This produces `resume.pdf` and `fred_brown_resume.pdf` in the submission directory, preserving standard ATS upload file naming conventions.

3. **Step 2c: Critical Factual & Technology Verification Review (`02c_review.md`)**
   - Run a Red Team Gap Analysis and Factual Verification Audit comparing `resume.md` and `cv_detail.md` against job requirements.
   - Verify every employer name, job title, employment date, degree, graduation year, certification, and quantitative metric word-for-word against `cv_detail.md`.
   - **Mandatory Technology Inventory Audit**: Cross-reference every single software tool listed in `resume.md` against `cv_detail.md`. If ANY unverified technology is listed that does not exist in `cv_detail.md`, Red Team MUST mark `STATUS: FAIL` with `Score: 0.0 / 10`.
   - Save the audit report to `profiles/<candidate>/submissions/{folder}/02c_review.md` with explicit `STATUS: PASS` or `STATUS: FAIL`.

4. **State Tracking & Retry Escalation**:
   - Update `submission-state.json` in the submission folder.
   - If `02c_review.md` is `STATUS: FAIL`:
     - Increment `resume_review_count` in `submission-state.json`.
     - If `resume_review_count > 2` (2 failures): Halt execution, present `02c_review.md` to the user, and ask for guidance.
     - Otherwise (`resume_review_count <= 2`): Loop back to Step 2a, reading `02c_review.md` to fix errors or pick an alternate archetype.
   - If `02c_review.md` is `STATUS: PASS`: Set `status: "RESUME_PASSED"` in `submission-state.json` and proceed to Step 3a.

