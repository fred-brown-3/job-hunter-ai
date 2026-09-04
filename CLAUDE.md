# Job Hunter AI — Claude Code Instructions

Welcome to **Job Hunter AI** (`job-hunter-ai`). This repository is an agentic AI career copilot for searching, evaluating, and applying to jobs, managing candidate profiles, generating tailored resumes from archetypes, and automating web application forms.

---

## Architecture & Multi-User Support

- **Profiles Directory (`profiles/`)**: Each candidate has their own directory under `profiles/<candidate_slug>/`.
- **Single vs Multi-User Resolution**:
  - If only 1 candidate profile exists, scripts automatically select it.
  - If multiple profiles exist, the active profile is resolved via `.state/active_profile.json` or by passing `--profile <slug>`.
  - Check active profile anytime:
    ```bash
    node get-active-profile.js
    ```
  - Switch active profile:
    ```bash
    node get-active-profile.js --set <slug>
    ```

---

## Onboarding a New Candidate (`/intake` or `/wf-00-candidate-intake`)

When onboarding a new user or establishing a fresh profile:
1. Follow the step-by-step instructions in [SKILL.md](file:///.agents/skills/candidate-intake/SKILL.md).
2. **Permissions are Optional / Decoupled**: The user can choose to only build resumes and portfolio without granting browser automation permissions.
3. Establish the canonical profile files:
   - `profiles/<slug>/personal_info.md` (contact, salary, commute, EEO)
   - `profiles/<slug>/cv_detail.md` (chronology & verified tech inventory)
   - `profiles/<slug>/portfolio.md` (standout project deep-dives)
   - `profiles/<slug>/resume-config.md` (canonical education, volunteer, leadership blocks)
   - `profiles/<slug>/writing-rules.md` (anti-AI tone and formatting)
   - `profiles/<slug>/application_answers.json` (common screening responses)
   - `profiles/<slug>/archetypes/metadata.yaml` (archetype trigger mapping)
4. Propose 3–5 tailored career archetypes and compile baseline PDFs via `node compile-resume-pdf.js <path>`.

---

## CLI Commands Cheatsheet

All agent actions are encapsulated as zero-dependency Node.js CLI tools runnable via shell:

```bash
# 1. Environment & System Readiness Diagnostic
node check-environment.js                 # Full test (Chrome + AppleScript)
node check-environment.js --skip-browser  # Resume/PDF generation test only

# 2. Profile Management
node get-active-profile.js                # Show active candidate
node get-active-profile.js --set <slug>   # Change active candidate

# 3. Resume & Portfolio Compilation
node compile-resume-pdf.js <path_to_resume.md>
node generate-letter-formats.js <path_to_cover.md>
node generate-portfolio-formats.js <path_to_portfolio.md>

# 4. Form Inspection & Autofill
node inspect-form.js --all                # Inspect live form inputs in active Chrome tab
node fill-typeahead.js "<selector>" "<value>" # Select React-Select / typeahead fields
node chrome-control.js url                # Get active tab URL
```

---

## Core Guardrails & Writing Directives

When tailoring resumes, drafting cover letters, or reviewing submissions:
1. **Anti-Hallucination**: Every technology, programming language, tool, and employment date MUST exist verbatim in the candidate's `cv_detail.md`.
2. **Zero Em-Dashes**: Em-dashes (`—`) are strictly forbidden in generated `resume.md` and `cover.md` documents. Use commas, colons, or parentheses.
3. **Anti-AI Natural Tone**:
   - Avoid buzzwords: *delve*, *robust*, *dynamic*, *multifaceted*, *tapestry*, *testament*, *landscape*, *pivotal*, *leverage*.
   - No summary conclusions ("Ultimately," "Overall," "In conclusion").
   - Eliminate hedging and the rule-of-three list pattern.
4. **Dynamic File Branding**: Resumes and cover letters must be branded dynamically with the candidate's name (`${slug}_resume.pdf`), not hardcoded.
