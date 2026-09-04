---
name: candidate-intake
description: Onboard a new candidate into the Job Hunt Sandbox, conduct an AI interview, separate resume vs. portfolio items, establish canonical profile files, generate 3-5 tailored resume archetypes, and provide optional environment/permission setup.
---

# Candidate Intake Skill (`candidate-intake`)

This skill governs the onboarding of new users into the **Job Hunt Sandbox**. It conducts an interactive, AI-guided intake interview to construct a candidate's complete profile, discerns standout accomplishments into portfolio case studies, proposes and generates 3–5 tailored resume archetypes, and provides decoupled, optional system/permission checks.

---

## 🎯 Core Operating Principles

1. **Decoupled System Permissions**:
   A user might only want AI assistance to build their resumes and portfolio, and may not want or trust browser-controlling scripts. **Resume and portfolio building must proceed without requiring browser automation permissions.** Always offer the environment diagnostic as an optional enhancement for job form-filling.
2. **Flexible Ingestion (Hybrid First)**:
   Always ask if the user has an existing resume (PDF, DOCX, Markdown, or text) or LinkedIn profile. If available, parse it as the foundation. If not, seamlessly pivot to a structured conversational interview.
3. **Discerning Portfolio vs. Resume Accomplishments**:
   Resumes require scannable, high-impact bullet points. Deep architectural case studies, system diagrams, or lengthy accomplishments belong in `portfolio.md`. The intake AI must actively identify such projects and ask the user if they should be spun out into full portfolio case studies.
4. **Dynamic Archetype Generation**:
   Rather than static templates, the AI analyzes the candidate's career spectrum (IC, Management, Architecture, Specialized Tracks) and dynamically proposes 3 to 5 tailored resume archetypes with trigger keywords. Once approved, the AI writes the archetype markdown files and compiles them to PDFs.
5. **Canonical Profile Establishment**:
   When intake is complete, all standard files under `profiles/<candidate_slug>/` must be fully established and formatted to the canonical schema.

---

## 📋 The 6-Phase Intake Workflow

### Phase 0: Welcome & Setup Mode Selection

1. Welcome the candidate warmly and explain the purpose of the sandbox:
   - Automated career profile & portfolio management
   - Tailored multi-track resume archetypes (`archetypes/`)
   - Optional browser-assisted job evaluation and ATS form filling
2. Ask the user's preference for automation:
   - **Mode A (Full Automation)**: Test and configure Google Chrome and browser automation for automated form filling. Run:
     ```bash
     node check-environment.js
     ```
     If permissions are missing on macOS, provide the exact steps (System Settings -> Privacy & Security -> Automation) and verify before proceeding.
   - **Mode B (Resume & Portfolio First)**: Skip browser automation checks and focus 100% on career ingestion, portfolio building, and resume archetypes. (User can run `node check-environment.js` later whenever ready).

---

### Phase 1: Background & Career History Ingestion

1. **Ask for Candidate Name & Handle**:
   - Determine candidate full name (e.g., "Jane Doe") and directory slug (`jane_doe`).
   - Create candidate folder: `profiles/<candidate_slug>/`.
2. **Ingest Raw Career Materials**:
   - Ask: *"Do you have an existing resume, CV, or LinkedIn profile export you can share or paste?"*
   - If provided, parse work experience, dates, companies, roles, and technologies into `profiles/<candidate_slug>/cv_detail.md`.
   - If starting from scratch, conduct a guided interview covering:
     - Past 3–4 employers, titles, exact employment dates, and locations.
     - Key responsibilities and major wins.
     - Complete inventory of verified languages, databases, cloud tools, frameworks, and methodologies.
3. **Establish Verified Competencies**:
   - Ensure `cv_detail.md` contains a dedicated `## Verified Technical & Core Competencies Inventory` categorized cleanly (Languages, Cloud, Databases, APIs, etc.).

---

### Phase 2: Discerning & Structuring Portfolio Work (`portfolio.md`)

1. **Identify Standout Deep Dives**:
   - While analyzing career history, identify complex systems, zero-to-one builds, or high-scale architectures that exceed standard resume bullet brevity.
   - Ask the candidate:
     > *"You mentioned [Project X / Architecture Y]. This sounds like a standout accomplishment that would make an exceptional technical portfolio case study. Would you like to capture this as a deep-dive case study in your portfolio?"*
2. **Structure Each Portfolio Item**:
   Populate `profiles/<candidate_slug>/portfolio.md` using the canonical structure:
   - **Title & Context**: Role, company, and timeframe.
   - **Tech Stack**: Specific tools and platforms.
   - **Challenge & Problem**: What was broken, slow, or needed from scratch?
   - **Solution & Architecture**: Key architectural decisions and trade-offs.
   - **Impact & Metrics**: Quantifiable business outcomes ($ saved, latency reduced, throughput).
   - **Links / Artifacts**: GitHub repo, architecture diagram, or live URL.

---

### Phase 3: Logistics, Boundaries, Preferences & EEO (`personal_info.md`)

Conduct a focused interview to gather operational constraints:
1. **Contact Information**: Full name, email, phone, location (City, State), LinkedIn, GitHub, Portfolio URL.
2. **Commute & Location Boundaries**:
   - Home base location.
   - Maximum acceptable commute time (e.g. "45 minutes").
   - Strictly incompatible locations (e.g., non-local on-site).
3. **Salary & Compensation Floors**:
   - Minimum acceptable base salary for fully remote roles.
   - Minimum acceptable base salary for local hybrid/on-site.
   - Hard threshold guardrail (roles capped below this trigger an immediate warning).
4. **Domain & Industry Preferences**:
   - Strict exclusions (e.g. political tech, gambling, etc.).
   - Target industries of interest.
5. **Work Authorization & Availability**:
   - US work authorization & sponsorship requirements.
   - Notice period / earliest start date.
6. **Voluntary EEO & Identity Data**:
   - Explain that EEO information is used strictly to autofill voluntary self-identification sections on applications (gender, race/ethnicity, veteran, disability).
   - Confirm candidate's preferred default selections.
7. **Write Canonical Files**:
   - Generate `profiles/<candidate_slug>/personal_info.md`.
   - Generate `profiles/<candidate_slug>/application_answers.json`.

---

### Phase 4: Dynamic Archetype Proposal & Baseline Resumes

1. **Analyze Career Breadth**:
   - Review `cv_detail.md` and `portfolio.md`.
   - Identify 3 to 5 distinct target career tracks (e.g., 1. Senior/Staff Backend Engineer, 2. Engineering Manager / Technical Lead, 3. Solutions Architect / FDE, 4. Full Send Master CV).
2. **Present Proposal to Candidate**:
   - Share proposed archetype titles, headline summaries, target job titles, and trigger keywords.
   - Solicit feedback and refine.
3. **Generate Archetypes Directory**:
   - Create `profiles/<candidate_slug>/archetypes/`.
   - Write `metadata.yaml` with trigger keywords and target roles.
   - Draft each archetype Markdown file (`01_...md`, `02_...md`, etc.) adhering strictly to writing rules:
     - Grounded in `cv_detail.md`.
     - Zero unverified tools or hallucinated dates.
     - Strict 3-bullet competency grouping.
     - Zero em-dashes (`—`).
     - Contact header with markdown links.
4. **Compile Baseline PDFs**:
   Run `compile-resume-pdf.js` for each generated archetype:
   ```bash
   node compile-resume-pdf.js profiles/<candidate_slug>/archetypes/<archetype_file>.md
   ```

---

### Phase 5: Configuration & Writing Rules

1. Copy canonical templates and customize for candidate:
   - `profiles/<candidate_slug>/resume-config.md`: Hardcode verified education, degrees, certifications, volunteer work, and candidate leadership philosophy.
   - `profiles/<candidate_slug>/writing-rules.md`: Capture candidate-specific tone preferences and anti-AI rules.

---

### Phase 6: Registration & Verification

1. **Set Active Profile**:
   Set the newly created candidate as the active profile:
   ```bash
   node get-active-profile.js --set <candidate_slug>
   ```
2. **Verify File Inventory**:
   Ensure all canonical files exist:
   - `profiles/<candidate_slug>/personal_info.md`
   - `profiles/<candidate_slug>/cv_detail.md`
   - `profiles/<candidate_slug>/portfolio.md`
   - `profiles/<candidate_slug>/resume-config.md`
   - `profiles/<candidate_slug>/writing-rules.md`
   - `profiles/<candidate_slug>/application_answers.json`
   - `profiles/<candidate_slug>/archetypes/metadata.yaml`
   - `profiles/<candidate_slug>/archetypes/*.pdf`
3. **Present Summary & Next Steps**:
   Congratulate the user and explain how to apply for jobs:
   - *"To search or evaluate a job posting on your browser tab, run `/wf-01-craft-custom-job-application`."*
   - *"To inspect or fill out an online application form, run `/wf-02-fill-form`."*
