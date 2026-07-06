---
name: linkedin-operator
description: Operate the web browser on LinkedIn to search for, inspect, and extract job listings. Use this skill whenever the user asks to search LinkedIn for jobs, find roles matching specific titles, scrape job listings or descriptions, or extract leads from LinkedIn, even if they only mention finding jobs or using LinkedIn casually.
---

# LinkedIn Operator Skill

This skill allows an AI agent to use browser tools to navigate LinkedIn, search for job listings, and scrape details (job title, company, location, application link, and full description) into structured job leads.

## Why this is important

LinkedIn's DOM is highly dynamic, utilizes complex class names, and frequently overlays sign-in walls or cookie banners. To extract job data reliably without getting stuck or blocked:
1. We check login and overlay states dynamically.
2. We load search queries directly via URLs where possible.
3. We run a robust JavaScript parser ([extract_jobs.js](file:///Users/fredbrown/Documents/github/jobhunt-sandbox/.agents/skills/linkedin-operator/scripts/extract_jobs.js)) in the page console to collect results, avoiding brittle class/ID selectors in raw selenium/playwright navigation.

---

## Operating Guidelines

### 1. Pre-flight Checks (Session & Authentication)
Before attempting job searches, navigate to the LinkedIn home page (`https://www.linkedin.com/`) to evaluate the session state:
- **Logged In:** You see your feed, nav bar, or search bar.
- **Login Wall:** You see a login screen or a registration overlay.
  - *Instruction:* Since we operate on behalf of the user, do not attempt to log in using bot accounts or scrape credentials. If you hit a login wall, immediately notify the user and ask them to log in to LinkedIn in the browser session, then try again.
- **Overlays / Modals:** If there are cookie banners or login overlays blocking the viewport, attempt to click the close buttons (`[aria-label="Dismiss"]`, `.modal__dismiss`, or similar close icons) or ask the user to clear it if it persists.

### 2. Formulating the Job Search URL
Rather than clicking through menus, search directly by constructing the LinkedIn Jobs URL. This is faster and more reliable.

*   **Standard Jobs URL Pattern:**
    `https://www.linkedin.com/jobs/search/?keywords=<keywords>&location=<location>&f_WT=<work_type>`
*   **Work Type Filter (`f_WT` values):**
    - `f_WT=2` (Remote)
    - `f_WT=1` (On-site)
    - `f_WT=3` (Hybrid)
*   **Time Posted Filter (`f_TPR` values):**
    - `f_TPR=r86400` (Past 24 hours)
    - `f_TPR=r604800` (Past week)
    - `f_TPR=r2592000` (Past month)

*Example:* To search for remote "Staff Engineer" roles in the United States posted in the last week:
`https://www.linkedin.com/jobs/search/?keywords=Staff%20Engineer&location=United%20States&f_WT=2&f_TPR=r604800`

### 3. Loading and Scrape Extraction
Once on the job search page:
1. Wait for the job card container to load (normally visible as a sidebar list or a central card listing).
2. Scroll the container down slowly to trigger lazy loading of cards.
3. Execute the browser script [extract_jobs.js](file:///Users/fredbrown/Documents/github/jobhunt-sandbox/.agents/skills/linkedin-operator/scripts/extract_jobs.js) using the browser subagent's evaluation capability or by reading the console logs.
4. Save the returned JSON list of job listings.

---

## Expected Output Format

After extracting the jobs, present the results as a markdown table. Example output structure:

| Job Title | Company | Location | Date Posted | Application Link |
| :--- | :--- | :--- | :--- | :--- |
| **Senior AI Engineer** | Vercel | Remote, US | 2 days ago | [Apply on LinkedIn](https://www.linkedin.com/jobs/view/123456789) |
| **Staff Full-stack Engineer** | Cloudflare | Hybrid, SF | 1 week ago | [Apply on LinkedIn](https://www.linkedin.com/jobs/view/987654321) |

Always offer to inspect specific jobs further to extract their full description.
