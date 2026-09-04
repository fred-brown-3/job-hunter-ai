---
name: job-matcher
description: Compare a candidate's cv_detail.md against a target job description, perform a Red Team gap analysis, generate fit scores, and identify missing data/metrics.
---

# Job Matcher & Gap Analysis Skill

This skill governs the process of performing a rigorous **Red Team Gap Analysis** comparing a candidate's master repository (`profiles/<candidate>/cv_detail.md`) against any target job description. It dynamically extracts evaluation categories from the posting, identifies exact alignment, highlights critical vulnerabilities or unquantified metrics, and formulates targeted questions to capture missing data.

---

## 1. Dynamic Category Extraction Directives

**Do NOT use fixed, hardcoded match categories.** Instead, dynamically analyze the target job description and extract evaluation categories customized for that specific role:

1. **Parse Job Posting**: Scan the target job description's *Who You Are*, *Desirable*, and *What the Job Involves* sections.
2. **Extract Key Competency Clusters**: Group the posting's specific requirements into 4–6 dynamic categories tailored to the role (e.g., for an Analytics Engineer role: *Data Platform Architecture*, *Languages & Core Pipelines*, *Governance & Semantic Layer*, *Platform Observability & Quality*, *AI & Agentic Workflows*, *Senior IC Leadership*).
3. **Map Candidate Ingredients**: Compare candidate evidence from `cv_detail.md` against each extracted requirement in the dynamic categories.

---

## 2. 🚨 MANDATORY: Factual Integrity, Content & Quality Audit

Before analyzing job requirements, Red Team MUST perform an explicit **Factual & Quality Audit** of the drafted resume and cover letter against `profiles/<candidate>/cv_detail.md` and content directives:

1. **Education Verification**: Verify that every school/university name, degree title, major, graduation year, and honor (e.g. Summa Cum Laude) in the draft resume matches `cv_detail.md` 100% word-for-word.
2. **Employment Dates & Titles Verification**: Verify that all company names, role titles, and start/end dates (e.g. Meltwater: `April 2017 – July 2026`, NHP: `April 2008 – April 2017`, Edgewater: `January 2000 – April 2008`) match `cv_detail.md` 100% word-for-word. Reject any dummy or estimated date ranges (e.g. `2011 – 2017`).
3. **Experience Duration Cap Audit**: Confirm that stated experience duration is capped at **"10+ years"** maximum. Reject any claims of "20+ years", "25+ years", or total career totals.
4. **Version Number Audit**: Verify that no minor/major version numbers (e.g., Python 3.9, MySQL 8.0, Node.js 20) are present in the resume or cover letter UNLESS explicitly requested in the job description.
5. **Metric Clutter Audit**: Confirm that low-level DB sizes, row counts, table/view counts, or daily record ingestion numbers (e.g., "450+ GB", "50,000+ daily ingested records", "80+ tables") are stripped and replaced with smooth, high-level professional phrasing.
6. **Prefix Repetition Audit**: Confirm that vendor and brand prefixes are consolidated under single parent umbrellas (e.g. `AWS (RDS, S3, EC2, Lambda, SQS)`) and brand names like "Looker" are not repeated redundantly (e.g. `Looker, Looker Studio`).
7. **Internal Codename / Jargon Audit**: Confirm that no internal codenames or obscure company jargon (e.g., "Cash Fire" reports, "intercom-switchboard", "Intercom Triton") are present. Verify they are replaced with professional industry descriptors.
8. **Single Paragraph Cover Letter Audit**: For cover letters, verify that the body consists of **a single stinging, high-impact paragraph** (under 100 words) presenting a clean, focused pitch without multi-paragraph clutter.
9. **Candidate-Branded ATS Files**: Confirm that both `fred_brown_resume.pdf` and `fred_brown_cover_letter.pdf` are generated and available in the submission folder.

### 🚨 Critical Red Team Alert Banner
If ANY factual discrepancy, date mismatch, version clutter, metric clutter, prefix repetition, internal codename, experience cap violation, or multi-paragraph cover letter clutter is found:
- Immediately output a prominent alert banner at the top of the Red Team Assessment:
  `🚨 CRITICAL RED TEAM ALERT: Audit Failure — [Discrepancy / Quality Violation Detail]`
- Force the Overall Fit Score to **0.0 / 10** until corrected.
- BLOCK form submission and notify the user immediately.

---

## 3. Red Team Output Structure

The output must be formatted as a structured Red Team Assessment containing:

### A. Factual Integrity Audit Status
A pass/fail confirmation table verifying Education, Work History & Employment Dates, Certifications, and Contact Info against `cv_detail.md`.

### B. Dynamic Requirement Match Matrix
A markdown table organized by the dynamically extracted job categories listing:
- Specific Job Requirement
- Candidate Match Level (🟢 Strong, 🟡 Partial/Data Gap, 🔴 Critical Gap)
- Fit Score out of 10
- Concise Justification & Evidence from `cv_detail.md`

### C. Executive Fit Score & Summary
Overall weighted fit rating (e.g. 9.5/10) with a bulleted summary of top competitive advantages.

### D. Red Team Vulnerabilities (What's Missing or Weak)
Highlight 2–3 specific areas where an interviewer might push back or flag a gap (e.g. missing specific vendor tech or unquantified scale metrics).

### E. Submission Folder Output File Preservation & STATUS Designation
Save every Red Team Gap Analysis & Factual Audit directly inside the active job application submission directory:
- **Resume Review**: Save report to `profiles/<candidate>/submissions/{YYYYMMDD_company_job}/02c_review.md`.
- **Cover Letter Review**: Save report to `profiles/<candidate>/submissions/{YYYYMMDD_company_job}/03c_review.md`.
- **STATUS Header**: The top of the report MUST explicitly state:
  - `STATUS: PASS` (if Factual Audit contains zero errors and overall match score >= 7.0/10)
  - `STATUS: FAIL` (if any factual discrepancy, date mismatch, or critical requirement gap exists)

---

## 4. Submission Loop Integration

Whenever performing a review for Step 2c or Step 3c:
1. **Load Artifacts**: Read the target job description (`01_job_description.md`), master ingredients (`cv_detail.md`, `personal_info.md`), and draft artifact (`resume.md` or `cover.md`) from the submission folder.
2. **Execute Factual Audit & Match Score**: Verify every employer, date, title, degree, certification, and claim against `cv_detail.md`.
3. **Write Review Report**: Write `02c_review.md` (for resume) or `03c_review.md` (for cover letter) with `STATUS: PASS` or `STATUS: FAIL` and actionable feedback.
4. **State Counter Management**: The caller reads `STATUS` from the review report and updates `submission-state.json`. If `STATUS: FAIL`, the process increments the retry counter and loops back to Step 2a/3a (or halts if `review_count > 2`).

