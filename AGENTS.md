# Job Hunter AI — Universal Agent Directives

**Job Hunter AI** (`job-hunter-ai`) is an agent-agnostic career copilot supporting Antigravity, Claude Code, OpenAI Codex, Cursor, and other agent frameworks.

---

## 1. Candidate Onboarding & Profile Setup

When a new user begins using this sandbox or asks to set up their profile:
1. Trigger the **Candidate Intake Skill**: follow `.agents/skills/candidate-intake/SKILL.md` or invoke `/wf-00-candidate-intake`.
2. **Permissions are Decoupled**: The user can choose to only build resumes and portfolio without granting browser automation permissions.
3. Establish the full set of canonical profile documents in `profiles/<candidate_slug>/`:
   - `personal_info.md` (Contact, salary floors, commute boundaries, EEO)
   - `cv_detail.md` (Factual career history & verified technology inventory)
   - `portfolio.md` (Technical case studies, system architectures, impact)
   - `resume-config.md` (Canonical education, volunteer, leadership blocks)
   - `writing-rules.md` (Anti-AI tone directives)
   - `application_answers.json` (ATS screening answers)
   - `archetypes/metadata.yaml` & tailored archetype resumes

---

## 2. Dynamic Profile & Multi-User Architecture

- The system auto-detects the candidate profile when a single profile exists.
- If multiple profiles exist, the active candidate is stored in `.state/active_profile.json`.
- Resolve active candidate:
  ```bash
  node get-active-profile.js
  node get-active-profile.js --set <slug>
  ```

---

## 3. CLI Script Suite

All capabilities are accessible via standard Node.js CLI tools:
- `node check-environment.js`: Probes Node, Chrome, and AppleScript automation readiness.
- `node compile-resume-pdf.js <file.md>`: Generates formatted PDF resume branded dynamically.
- `node generate-letter-formats.js <file.md>`: Compiles tailored cover letters.
- `node inspect-form.js --all`: Inspects active tab application forms.
- `node fill-typeahead.js "<selector>" "<value>"`: Pure browser event flow for React-Select comboboxes.

For detailed form filling rules, iframe navigation, and Red Team review procedures, refer to [.agents/AGENTS.md](file:///.agents/AGENTS.md).
