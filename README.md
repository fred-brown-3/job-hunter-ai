# Jobhunt Sandbox

This is a development sandbox configured with the **Skills CLI** for managing AI agent capabilities (custom instructions, tools, and workflows).

## Managing Agent Skills

This environment is set up to manage skills at both the project level and global level using the `skills` package.

### Common Commands

You can run these commands using `npx skills` (or via `npm run skills`):

*   **Find available skills:**
    ```bash
    npx skills find
    # Or search for specific terms
    npx skills find web-design
    ```
*   **Add a new skill to the project:**
    ```bash
    npx skills add vercel-labs/agent-skills --skill web-design-guidelines
    ```
*   **List installed skills:**
    ```bash
    # Project-level skills:
    npx skills list
    
    # Global-level skills:
    npx skills list -g
    ```
*   **Restore skills from lockfile:**
    ```bash
    npx skills experimental_install
    ```
*   **Remove a skill:**
    ```bash
    npx skills remove web-design-guidelines
    ```

---

## How it Works

1.  **Skills Lockfile (`skills-lock.json`):** Tracks the specific skills and versions installed in this project, similar to `package-lock.json`.
2.  **Workspace Customizations (`.agents/skills/`):** When you add a project-level skill, it is installed under `.agents/skills/<skill-name>`.
3.  **Agent Integration:** The AI agent (Antigravity) automatically discovers, loads, and uses the skills located in `.agents/skills/` when they match your current tasks and instructions.
