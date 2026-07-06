# 🚀 Fred's Agentic Job Hunt Sandbox

Welcome to the **Job Hunt Sandbox**—a custom-tailored workspace designed to automate, optimize, and streamline Fred's job search using agentic AI capabilities.

This environment leverages the **Skills CLI** (`npx skills`) to orchestrate modular capabilities (prompts, scripts, and workflows) that run on top of AI coding agents like Antigravity.

---

## 🎯 Project Core Objective
To develop, test, and run AI agent tools that collaborate with Fred to find jobs, customize resumes, and track applications.

---

## 🤖 Proposed Starter Agents & Skills

### 1. 💼 LinkedIn Operator (`linkedin-operator`) - *Current Focus*
*   **Purpose:** Automatically search, filter, and extract job listings from LinkedIn using browser automation.
*   **Key Capabilities:**
    *   Navigating LinkedIn job searches based on user queries.
    *   Evaluating and extracting job cards (title, company, description, etc.).
    *   Saving job leads to local database structures.

### 2. 📝 Resume Tailor (`resume-tailor`) - *Up Next*
*   **Purpose:** Automatically craft personalized resumes and cover letters.
*   **Key Capabilities:**
    *   Analyzing the target job description.
    *   Extracting key requirements, tech stack, and keywords.
    *   Tailoring Fred's profile to highlight relevant experiences.

### 3. 📊 Application Tracker (`app-tracker`) - *Future*
*   **Purpose:** Keep track of the application lifecycle.
*   **Key Capabilities:**
    *   Saving job application statuses to a localized tracker (markdown or CSV).
    *   Analyzing response rates and sending follow-up alerts.

---

## 🛠️ Environment & Tools

### Managing Agent Skills

*   **List installed skills:**
    ```bash
    npx skills list
    ```
*   **Add a new skill from a repository:**
    ```bash
    npx skills add <owner/repo> --skill <skill-name>
    ```
*   **Sync local skills:**
    ```bash
    npx skills experimental_install
    ```
