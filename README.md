# 🎯 Job Hunter AI (`job-hunter-ai`)

> **Your personal AI career concierge.** Leveling the playing field in an AI-driven job market through automated candidate intake, a verified "bank of experiences," multi-track resume archetypes, portfolio case study compilation, and browser application automation.

Works seamlessly across **Antigravity**, **Claude Code**, **OpenAI Codex**, and **Cursor**.

> [!CAUTION]
> **⚠️ EXPERIMENTAL BETA DEMO — USE AT YOUR OWN RISK**  
> This project is shared strictly as an experimental, personal **beta demonstration** of what is possible with agentic AI. It is **not** a finished commercial product, nor a guaranteed path to a job. It runs local scripts that compile PDFs, manage candidate files, and can control browser tabs. **You are solely responsible for reviewing and verifying all generated resumes, cover letters, and web form submissions before they are sent to employers.** Use entirely at your own risk.

---

## 📖 The Story Behind Job Hunter AI

### Leveling the Playing Field in an AI Arms Race

Not long ago, after a decade at the same company, I found myself unexpectedly laid off. 

When I last searched for a job ten years ago, the process was human and conversational: you submitted a general resume, spoke with a recruiter who read your background, and discussed how your skills mapped to the role. 

Returning to the market in 2026 was a shock. **The job search has fundamentally changed.**

Today, corporate talent acquisition and HR departments rely heavily on automated screening bots and AI filters. These systems scan hundreds of resumes in seconds, filtering aggressively for exact keyword matches, specific tool combinations, and narrow role terminology. It has become an **AI arms race**: companies use algorithms to filter you out before a human ever sees your name.

To break through, candidates are told to customize their resume for every single job posting. But as experienced engineers, designers, and technical leaders, we have **far too many experiences, projects, and technologies to fit onto a 1- or 2-page resume**. 

Manually tailoring your resume, drafting custom cover letters, researching recruiters, and filling out dozens of repetitive web forms every single day is an exhausting, soul-crushing grind.

### The Breakthrough: The "Bank of Experiences"

During my own job search, I discovered a powerful shortcut:
1. **Build a comprehensive, unvarnished "Bank of Experiences" (`cv_detail.md`)**: A complete inventory of every project, system architecture, database, metric, and leadership win you've ever delivered.
2. **Never invent or hallucinate anything**: Your bank is your unalterable single source of truth.
3. **Use AI as your surgical concierge**: When you find a target job description, let an AI agent scan the job requirements, find the exact matching achievements from your bank, and weave the specific keywords and terminology the recruiter's screening algorithm is looking for into a razor-sharp, 1-page tailored resume.

**Job Hunter AI** is the automation system I built to run this process. It levels the playing field, transforming a tedious full-time application grind into an automated superpower.

---

## 🧭 How It Works (The Pipeline)

```text
  ┌─────────────────────────────────────────────────────────────┐
  │                 1. INTAKE & PROFILE CREATION                │
  │   Raw Resume / Chat  ──►  AI Intake Interview               │
  │                           ├──► Bank of Experiences (cv_detail.md)
  │                           ├──► Deep Case Studies (portfolio.md)
  │                           └──► 3-5 Master Archetypes (archetypes/)
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              2. JOB EVALUATION & SURGICAL TAILORING         │
  │   Job Description    ──►  Compensation & Commute Audit      │
  │                           ├──► Red Team Gap Analysis        │
  │                           ├──► Tailored Resume PDF (Zero Fluff)
  │                           ├──► Stinging 1-Para Cover Letter │
  │                           └──► Recruiter Outreach Messages  │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │              3. APPLICATION SUBMISSION & TRACKING           │
  │   Application Form   ──►  Iterative Form Inspector & Filler │
  │                           ├──► React-Select Combobox Handler│
  │                           ├──► Form File Upload (PDFs)      │
  │                           └──► Auto-Updated Log (applied_jobs)
  └─────────────────────────────────────────────────────────────┘
```

---

## 🎛️ Two Ways to Use Job Hunter AI

You are always in complete control of your privacy, security, and automation depth. You can choose between two modes:

### 📄 Option A: Precision Resume & Portfolio Suite (Zero Browser Permissions)
* **Who it's for**: Users who want world-class AI assistance tailoring resumes, building portfolio case studies, and crafting outreach, but prefer to manually submit forms themselves or don't want to grant browser automation permissions to their terminal.
* **What it does**:
  - Ingests your background and builds your **Bank of Experiences** (`cv_detail.md`).
  - Identifies standout systems/architectures and drafts deep-dive case studies in `portfolio.md`.
  - Proposes 3–5 tailored **Career Archetypes** with trigger keywords.
  - Takes any job description and generates a surgically tailored, ATS-optimized resume PDF and punchy cover letter.
  - **Zero macOS AppleScript or Chrome permissions required.**

### 🤖 Option B: Full-Automation AI Concierge (Browser Automation Enabled)
* **Who it's for**: Users who want to take full advantage of agentic AI to inspect live browser tabs, audit jobs on the fly, and autofill repetitive web application forms.
* **What it adds**:
  - Automatically reads the job description from your active Chrome tab.
  - Runs instant compensation floor and commute boundary gatekeepers.
  - Performs recruiter reconnaissance on LinkedIn.
  - Uses browser automation to inspect ATS forms (Greenhouse, Lever, Ashby, Workday) and autofills input fields, native selects, and React-Select comboboxes.
  - Uploads your branded resume and cover letter PDFs directly to the form.
  - Records every application into your central tracking catalog.

### 💡 Browser Automation Best Practices & Practical Pro-Tips

When running in **Full-Automation Mode**, keep these real-world tips in mind:

* **Universal Website Compatibility**: The process is designed to work with **any website**. With browser scripts enabled, the AI can read job descriptions and extract requirements from virtually any page—especially **employer-direct career sites** (Greenhouse, Lever, Ashby, Workday, BambooHR, Rippling, and custom company career portals).
* **Works Great on Single-Page Applications (SPAs)**: The form inspection scripts excel on modern single-page forms where the full application lives on one screen.
* **Avoid Automated Password / Account Creation**: Although the scripts are technically capable of typing into password fields, we strongly recommend that you **log in or create an account manually** first. Once you reach the actual application form, let the AI take over to autofill the tedious fields.
* **One Page at a Time (Multi-Page Flows)**: For multi-step wizard applications, we recommend asking the AI to **fill the single active page**, reviewing the answers yourself, and manually clicking "Next" to advance before triggering the next fill.
* **Triggering Stubborn Form Validations**: Some websites have custom client-side validation on individual fields (e.g. React/Vue synthetic event listeners) that might not register programmatic script insertion.
  > **Quick Fix**: If a field shows a red border or "Required" notice even though text or an option is selected, simply **click into the field and re-select the option**, or **delete and re-enter a single character**. This immediately triggers the form's internal validator.
* **Platform: Developed on macOS & Google Chrome**: I built and tested this system specifically for **macOS running Google Chrome** (using macOS AppleScript for tab management and headless Chrome for PDF compilation). I am not sure if or how well the browser automation scripts work on other platforms (Windows, Linux) or with other browsers. If you are on Windows or Linux, you can still easily use **Option A** for all resume tailoring, gap analysis, and portfolio generation!
* **AI Models Tested (Gemini & ChatGPT)**: I developed and tuned these prompts, skills, and scripts primarily using **Google Gemini** and **ChatGPT**. I am not sure how well it works with AI agents outside of those two. While we include open instructions for Claude Code and Cursor, your mileage with other models may vary.
* **Experimental Beta Demo (Use at Your Own Risk)**:
  > **⚠️ DISCLAIMER**: This software is strictly an **early-stage beta demonstration** provided "as-is", without warranty of any kind. It is not an automated "hands-off magic bullet". Because web applications change constantly and LLM outputs can vary, you must keep yourself in the loop. Always inspect every tailored resume, cover letter, and form field before submission. **By using this repository, you accept full responsibility for your job applications and system interactions.**

---

## 🌐 Recommended Job Hunting Sites

For software engineers, data professionals, and technical leaders, we recommend pairing this repository with these top job platforms:

1. **[Welcome to the Jungle](https://www.welcometothejungle.com/)** (`welcometothejungle.com`)
   * *Why it's great*: Exceptional transparency into modern tech stacks, engineering team sizes, company cultures, and verified salary bands. Highly recommended for European and US tech roles.
2. **[LinkedIn Jobs](https://www.linkedin.com/jobs/)** (`linkedin.com`)
   * *Why it's great*: The largest global talent surface with live hiring indicators, alumni connections, and direct recruiter visibility. Use our `lookup-linkedin-recruiters.js` tool to identify hiring managers.
3. **[Indeed](https://www.indeed.com/)** (`indeed.com`)
   * *Why it's great*: High volume of direct employer postings, robust geographic filters, and strong salary transparency indicators.

---

## 🚀 Quickstart: From Zero to Tailored Application in 5 Minutes

### Step 1: Clone the Repo & Install Dependencies

> **Prerequisites**: Node.js (>= 18) and **Google Chrome on macOS** (recommended for browser automation).

```bash
git clone https://github.com/fred-brown-3/job-hunter-ai.git
cd job-hunter-ai
npm install
```

### Step 2: Choose Your AI Agent

> **AI Models Tested**: I originally wrote and battle-tested these workflows using **Google Gemini** (via Antigravity) and **ChatGPT / OpenAI models**. While standard instructions are provided for other environments, I have not thoroughly tested agents outside of those two.

Open this folder in your favorite AI coding tool:

* **[Google Antigravity](https://deepmind.google/technologies/antigravity/)**: Native support out of the box via `.agents/skills/` and workflows.
* **[Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code)**: Run `claude` in this directory. It automatically reads [CLAUDE.md](file:///CLAUDE.md).
* **[Cursor](https://www.cursor.com/) / [VS Code](https://code.visualstudio.com/)**: Automatically guided by [.cursorrules](file:///.cursorrules) and [AGENTS.md](file:///AGENTS.md).
* **OpenAI Codex / Terminal Agents**: Follows root [AGENTS.md](file:///AGENTS.md).

### Step 3: Run the Environment Diagnostic

Run the built-in diagnostic tool to test your environment:

```bash
# If you want Resume & Portfolio building only (Option A):
node check-environment.js --skip-browser

# If you want Full Browser Automation (Option B):
node check-environment.js
```
*If browser permissions are missing on macOS, the diagnostic provides exact step-by-step instructions (System Settings → Privacy & Security → Automation).*

### Step 4: Run the AI Candidate Intake Interview

In your AI chat window, run:
```text
/wf-00-candidate-intake
```
*(or tell the agent: **"Run the candidate intake interview to set up my profile"**)*

The AI will:
1. Ask if you have an existing resume, CV, or LinkedIn profile (or interview you conversationally if starting fresh).
2. Establish your master **Bank of Experiences** in `profiles/<your_name>/cv_detail.md`.
3. Detect complex projects and help you branch them into **Portfolio Case Studies** in `portfolio.md`.
4. Capture your salary floors, commute boundaries, and target domains in `personal_info.md`.
5. Propose 3–5 tailored **Resume Archetypes** (e.g., Staff Backend Engineer, Engineering Manager, Solutions Architect) and compile your baseline PDFs.

### Step 5: Tailor Your First Job Application

Open a job listing in Google Chrome (e.g. on Welcome to the Jungle, LinkedIn, or Indeed), and tell your agent:
```text
/wf-01-craft-custom-job-application
```

The AI will:
- Check the salary and location against your boundaries.
- Analyze the requirements and perform a **Red Team Gap Analysis**.
- Pick the best archetype from your bank and generate a tailored resume PDF branded with your name.
- Draft a stinging, single-paragraph cover letter matching the role.
- Prepare a recruiter outreach message.

### Step 6: (Optional) Autofill the Application Form

Navigate to the job's application form page and tell your agent:
```text
/wf-02-fill-form
```
The agent iteratively inspects the fields, handles comboboxes, uploads your tailored resume and cover letter, and fills screening questions using your saved profile answers.

---

## 📂 Profile Architecture (`profiles/`)

Your personal information is kept completely private and modular:

```text
profiles/
├── template/                   # Tracked schema templates for new users
│   ├── personal_info.md        # Contact info, salary floors, commute limits, EEO
│   ├── cv_detail.md            # Master verified experience & skills inventory
│   ├── portfolio.md            # Technical case studies & architecture deep-dives
│   ├── resume-config.md        # Canonical education, volunteer, & header styles
│   ├── writing-rules.md        # Anti-AI natural tone directives
│   ├── application_answers.json# Standard ATS screening responses
│   └── archetypes/metadata.yaml# Career track mappings & triggers
└── <your_slug>/                # Your private candidate profile (GIT-IGNORED)
    ├── personal_info.md
    ├── cv_detail.md
    ├── portfolio.md
    ├── archetypes/             # 3-5 Tailored master resumes (.md & .pdf)
    └── submissions/            # Isolated folders for every job you apply to
```

> **🔒 Privacy First**: Your candidate folder (`profiles/<your_slug>/`), personal application tracker (`applied_jobs.md`), scratch scripts, and submission records are strictly **git-ignored** and will never be pushed to a public repository.

---

## 🛡️ Core Guardrails & Trust Guarantees

* **Zero Unverified Technologies (Anti-Hallucination)**: Every tool, database, language, or metric in a generated resume MUST exist verbatim in your `cv_detail.md`. If the AI detects an unverified skill, the Red Team review fails with a score of `0.0 / 10` and forces a rewrite.
* **Anti-AI Tone Rules**:
  - Strictly banned buzzwords: *delve*, *robust*, *dynamic*, *multifaceted*, *tapestry*, *testament*, *landscape*, *pivotal*, *leverage*.
  - **Zero Em-Dashes (`—`)**: Banned across all generated resumes and cover letters.
  - No generic summary wrap-ups ("Ultimately," "Overall," "In conclusion").
* **Single User Auto-Selection**: If only one candidate profile exists, scripts run automatically without prompting. If multiple profiles exist, the active profile is stored in `.state/active_profile.json`.

---

## 💻 CLI Commands Suite

All actions are runnable directly from the command line:

| Command | Purpose |
| :--- | :--- |
| `node check-environment.js [--skip-browser]` | System readiness probe for Node, Chrome & AppleScript |
| `node get-active-profile.js [--set <slug>]` | Inspects or switches the active candidate profile |
| `node compile-resume-pdf.js <file.md>` | Compiles Markdown resume to styled PDF using headless Chrome |
| `node generate-letter-formats.js <file.md>` | Compiles cover letter to PDF and DOCX |
| `node generate-portfolio-formats.js <file.md>` | Compiles portfolio case studies into styled PDF |
| `node inspect-form.js --all` | Snapshots live input fields on active Chrome tab |
| `node fill-typeahead.js "<selector>" "<val>"` | Dispatches React-Select typeahead chip events |
| `node update-applied-jobs.js sync` | Synchronizes application statuses with `applied_jobs.md` |

---

## 📄 License

ISC License. Built by engineers, for engineers taking back control of their career search with agentic AI.
