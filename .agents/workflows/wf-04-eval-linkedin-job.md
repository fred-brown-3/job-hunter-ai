---
description: evaluate salary/pay match and skill alignment on current LinkedIn tab, and auto-generate application package if favorable
---

# Rapid LinkedIn Job Evaluation & Auto-Packaging Workflow (`/wf-04-eval-linkedin-job`)

Inspect and evaluate a job posting on the active Chrome LinkedIn tab focusing on Pay/Compensation match and Skill alignment. If the role scores favorably, automatically craft the submission tracking folder, customized resume PDF, cover letter PDF, and recruiter outreach notes.

## Workflow Execution Steps:

1. **Verify Foreground Tab & Search Tab Preservation Guard**:
   - Fetch active tab info: `osascript -e 'tell application "Google Chrome" to get {id, URL, title} of active tab of front window'`
   - **CRITICAL SEARCH TAB PRESERVATION GUARD**: NEVER navigate away from an active job search results page (e.g. `https://www.linkedin.com/jobs/search/...` or `https://www.indeed.com/?vjk=...`).
   - If direct navigation to a job detail URL is required (e.g., `https://www.indeed.com/viewjob?jk=...` or `https://www.linkedin.com/jobs/view/...`), **open the target URL in a NEW Chrome tab** via AppleScript:
     ```bash
     osascript -e 'tell application "Google Chrome" to tell front window to make new tab with properties {URL:"<target_url>"}'
     ```
   - Update `.state/chrome_tab_config.json` with the new tab's ID: `echo '{"tab_id": <NEW_TAB_ID>}' > .state/chrome_tab_config.json`
   - Confirm target tab URL: `node chrome-control.js url`

2. **Expand Hidden Description & Extract Details**:
   - Run JS evaluation via `chrome-control.js` on the job detail tab to automatically click `… more` or `Show more` buttons and extract complete job text under "About the job", including the Date Posted / Time Ago string (e.g. "Posted 3 days ago", "Posted 4 weeks ago", "Posted 2 months ago").

3. **Evaluate Job Posting Age & Freshness**:
   - Classify job posting age based on mandatory freshness thresholds:
     - **Posted <= 3 weeks ago (<=21 days)**: `✅ Fresh (Posted X days/weeks ago)`
     - **Posted > 3 weeks ago (21 to 60 days / 1 month)**: `⚠️ Potentially Stale (Posted X weeks/months ago)`
     - **Posted > 2 months ago (>60 days)**: `🚫 Definitely Stale (Posted X months ago)`
   - Note stale flag in evaluation status.

4. **Evaluate Pay / Compensation Match**:
   - Compare listed base salary against Fred's compensation baseline in `profiles/fred_brown/personal_info.md`:
     - **Fully Remote (US)**: $180,000 – $200,000 base target
     - **On-site / Hybrid Boston (~1 hr commute)**: $250,000+ base target
     - **On-site NH (>30 mins)**: $200,000+ base target
     - **On-site NH (<=30 mins)**: $180,000+ base target
   - Calculate pay variance and note fit status.

5. **Evaluate Skill & Qualification Match-up**:
   - Compare job requirements (cloud platforms, languages, tools, certifications, years of experience, management scope) against Fred's `profiles/fred_brown/cv_detail.md`.
   - Calculate skill fit score (0 - 10).

6. **Output Evaluation Card & Conditional Package Creation**:
   - Present the concise **LinkedIn Job Evaluation Card** (Pay Match, Posting Age / Freshness, Skill Match Table, Verdict).
   - *(Note: LinkedIn connection checks are DISABLED per user directive — do not run connection lookups or generate `01c_linkedin_contacts.md`)*.
   - **If Verdict is Favorable / Strong Match** (Skill Score >= 8.0 and acceptable compensation / freshness):
     1. Automatically create submission folder: `profiles/fred_brown/submissions/{YYYYMMDD_company_role}/`.
     2. Save `01_job_description.md` (including posting age metadata header), `01b_gap_analysis.md`, `01d_recruiter_outreach.md` (notes <200 chars).
     3. Select resume archetype, snapshot into `resume.md`, compile `resume.pdf` & `fred_brown_resume.pdf`, run `02c_review.md`.
     4. Draft single-paragraph cover letter `cover.md`, compile `cover.pdf` & `fred_brown_cover_letter.pdf`, run python dash scan, run `03c_review.md`.
     5. Register in `applied_jobs.md` (`in_progress`) and initialize `submission-state.json`.
     6. Present the **Application Package Summary Card** so the candidate has `fred_brown_resume.pdf` ready for immediate upload.
   - **If Verdict is Weak / Unfavorable / Definitely Stale**: Do not create submission files; output only the Evaluation Card with the rationale.
