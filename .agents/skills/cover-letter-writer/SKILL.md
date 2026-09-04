---
name: cover-letter-writer
description: Draft, customize, and compile professional, human-toned cover letters in PDF, HTML, and DOCX formats matching job requirements with your technical portfolio.
---

# Cover Letter Writer Skill

This skill outlines guidelines and execution commands for drafting, custom-tailoring, and compiling professional, human-sounding cover letters that link with your portfolio of accomplishments and automatically sync with the form auto-filler.

## Guidelines for Tone & Style (Anti-AI Checks & Content Directives)

To ensure the letter sounds completely human, clean, and highly impactful:
1. **Length & Structure**: Limit length strictly to **a single stinging, high-impact paragraph** and **under 100 words** (typically 60–90 words) to guarantee an ultra-clean, elegant letterhead fit without visual clutter.
2. **Salutation & Sign-off Lines**: ALWAYS open the letter with a proper salutation line (e.g. `Dear [Company] Hiring Team,`) at the top and end with a sign-off closing (`Sincerely,`) at the bottom of `cover.md` above the signature block.
3. **Informal, Conversational & Teasing Pitch**: Lean into a warm, engaging, informal human tone. Include an intriguing teaser about how your background can solve their key challenges (e.g. *"I can't wait to tell you about how some of my experiences building data platforms can directly help Higharc's business..."*). Avoid rigid corporate speak or generic AI openings like *"I am writing to express..."*.
4. **Eliminate Clichés & AI Punctuation**: Never use transitional keywords (*"Furthermore,"*, *"Moreover,"*) or em-dashes (`—`).
5. **Experience Duration Cap (10+ Years Max)**: NEVER state "20+ years", "25+ years", or total career duration in the letter. Cap experience claims to **"10+ years"** maximum for age neutrality.
6. **No Version Numbers, Low-Level Metrics, or Internal Codenames**: Do not list software/runtime version numbers, granular DB metrics (GB sizes, table/row counts), or internal codenames (e.g. "Cash Fire"). Express scale in smooth, high-level terms.
7. **Vendor Prefix Consolidation (Anti-Repetition)**: Group related cloud services (e.g. `AWS (RDS, S3, Redshift)`) and avoid repeating brand names (e.g. `Looker & Looker Studio`).
8. **Candidate-Branded Output Files**: The cover letter script `generate-letter-formats.js` compiles both `cover.pdf` and `fred_brown_cover_letter.pdf`. Always upload `fred_brown_cover_letter.pdf` to employer job applications.
9. **No Duplications**: Write the salutation at the top and close with `"Sincerely,"` at the bottom of the Markdown file. The compiler script will automatically place your name and contact details cleanly below your closing.
10. **Writing & Anti-AI Directives**: Strictly enforce [.agents/writing-rules.md](file:///.agents/writing-rules.md) (and candidate-specific overrides in `profiles/<candidate>/writing-rules.md`).

---

## Proactive Gap Mitigation Directives

When drafting a cover letter for any role:
1. **Inspect Red Team Gap Analysis**: Review the job-specific Red Team Gap Analysis (`job-matcher`) output at `gap_analyses/<Company>_<Title>_Gap_Analysis.md` (or `.state/red_team_analysis.md`) to identify any perceived technical, vendor, or tooling gaps (e.g. Looker/LookML vs. Tableau/Looker Studio, or dbt vs. custom Python ETL pipelines).
2. **Openly Address Gaps via Substitute Skills**: Seamlessly frame any identified gap by highlighting equivalent architectural experience, substitute skill sets, and proven adaptability.
   - *Example*: *"While my semantic layer architecture has primarily centered around Tableau and Looker Studio with 80+ relational analytical views, my deep experience with database-level schema modeling allows me to transition to Looker/LookML effortlessly."*

---

## Quality Control (QC) Verification Step

Before finalizing or compiling the cover letter files, you MUST perform a manual QC review to verify:
1. **Single-Page Conformity**: Confirm that the cover letter body is strictly under 200 words and at most three paragraphs to guarantee it prints onto a single page.
2. **No Word Repetitions**: Verify that key technical terms, experiences, or adjectives are not repeated in adjacent sentences.
3. **No AI Hallmark Punctuation / Words — MANDATORY SCAN REQUIRED**: Run the following command and include the raw output verbatim in the 3c review report. A PASS is only valid if the output is `PASS: zero em-dashes or en-dashes found`. Any other output MUST result in `STATUS: FAIL`.
   ```bash
   python3 -c "
text = open('profiles/fred_brown/submissions/{FOLDER}/cover.md').read()
dashes = [i for i, c in enumerate(text) if c in '\u2014\u2013']
if dashes:
    for pos in dashes:
        print(f'FAIL: em/en-dash at position {pos}: ...{repr(text[max(0,pos-20):pos+20])}...')
else:
    print('PASS: zero em-dashes or en-dashes found')
"
   ```
4. **Verification of Closing Elements**: Ensure that the salutation ("Dear...") and closing ("Sincerely,") are only present once.

---

## Execution Workflow & Step 3 Drafting/Review Loop

Whenever generating a cover letter for a job application submission:

1. **Step 3a: Generate Cover Letter Plan (`03a_cover_plan.md`)**
   - Read `01_job_description.md`, candidate CV (`profiles/<candidate>/cv_detail.md`), personal info (`personal_info.md`), and resume (`resume.md`) from the submission folder.
   - Outline the three-paragraph strategy: direct interest pitch, key portfolio accomplishment alignment, and proactive gap mitigation using substitute skills.
   - Save plan to `profiles/<candidate>/submissions/{folder}/03a_cover_plan.md`.
   - **Retry Awareness**: If looping back from Step 3c, explicitly incorporate findings and required corrections from `03c_review.md` into `03a_cover_plan.md`.

2. **Step 3b: Generate Draft Cover Letter & Compile PDF (`cover.md` & `cover.pdf`)**
   - Write `cover.md` following Tone & Style rules (exactly 3 paragraphs, under 200 words, no em-dashes, no cliché transitions).
   - Save to `profiles/<candidate>/submissions/{folder}/cover.md`.
   - Compile PDF using:
     ```bash
     node generate-letter-formats.js profiles/<candidate>/submissions/{folder}/cover.md
     ```
     This produces `cover.pdf` in the submission folder.

3. **Step 3c: Critical Review & Factual Audit (`03c_review.md`)**
   - Run Quality Control and Factual Audit comparing `cover.md` against `cv_detail.md` and tone guidelines.
   - **MANDATORY before writing the report**: Run the em-dash scan command from the QC Verification Step above and include its raw output verbatim in the report under the `No em-dashes` row. A `✅ PASS` on that row is ONLY permitted if the scan output is exactly `PASS: zero em-dashes or en-dashes found`. If the scan returns any `FAIL:` line, the row MUST be marked `❌ FAIL` and the overall status MUST be `STATUS: FAIL`.
   - Verify word count (<100 words for single-paragraph letters), salutation/closing single instance, and 100% factual accuracy against `cv_detail.md`.
   - Save the audit report to `profiles/<candidate>/submissions/{folder}/03c_review.md`. Include `STATUS: PASS` or `STATUS: FAIL`.

4. **State Tracking & Retry Escalation**:
   - Update `submission-state.json` in the submission folder.
   - If `03c_review.md` is `STATUS: FAIL`:
     - Increment `cover_review_count` in `submission-state.json`.
     - If `cover_review_count > 2` (2 failures): Halt execution, present `03c_review.md` to the user, and ask for guidance.
     - Otherwise (`cover_review_count <= 2`): Loop back to Step 3a, reading `03c_review.md` to fix errors.
   - If `03c_review.md` is `STATUS: PASS`: Set `status: "READY_FOR_APPROVAL"` in `submission-state.json` and proceed to Step 4 (User Presentation).


   ### Agent Engagement Rules

   > ⚠️ **Critical — Read before filling any field**

   - **Never auto-fill robotically.** Every answer is a reflection of the candidate. Think about it.
   - **Question-specific tailoring**: "Describe your experience with X" requires a targeted answer drawn from the portfolio, not a canned phrase from `profiles/<candidate>/application_answers.json`.
   - **EEO / demographic fields**: Always read `profiles/fred_brown/personal_info.md` for the correct values. Never guess or invent demographic data.
   - **Watch for dynamic/conditional fields**: Triggering a dropdown option (like "Are you Hispanic/Latino?" or veteran/disability questions) frequently causes conditional follow-up questions to appear. Always re-run the inspector after answering key questions to capture these popup fields.
   - **Watch for trick questions**: Fields like "expected salary", "start date", or "notice period" require careful judgment, not defaults. Surface these to the user if unsure.
   - **Verify your own work**: After every batch fill, re-run `inspect-form.js` and explicitly confirm previously filled fields still hold their values.
   - **Flag anomalies**: If the form reveals a field you weren't expecting (a coding test link, a portfolio submission, etc.), stop and tell the user rather than skipping it.
