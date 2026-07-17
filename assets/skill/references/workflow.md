# Workflow for AI Agents and Requirements Alignment

To ensure optimal results and avoid unnecessary token consumption or failed runs, the AI agent **must strictly follow** this workflow and perform the pre-alignment interview.

---

## 1. Pre-Alignment (Requirements Interview)

Before writing any configuration or running commands, the agent **must ask** concisely and clearly about the following essential points:

1. **Web Addresses (URLs)**:
	- What are the exact URLs you want to capture?
	- If there are multiple pages, should they be treated independently or as part of a sequential flow (e.g., navigate to page A, click, go to page B)?

2. **Interactions and Navigation Flow**:
	- Is it necessary to perform any actions before capturing (e.g., log in, fill out a form, scroll for lazy loading)?
	- Are there modals, overlays, or cookie banners that need to be hidden or closed before capture?

3. **Resolution and Viewports**:
	- On what devices or dimensions do you want the captures?
	- Do you prefer using predefined presets (like `desktop`, `tablet`, `mobile`) or custom pixel dimensions?

4. **Visual Appearance and Image**:
	- Do you want to capture the full page (`fullPage: true`) or just the initially visible area on screen (`fullPage: false`)?
	- What image format do you prefer (`png` or `jpeg`)?
	- Is it necessary to apply a specific color scheme (`light`, `dark`)?

5. **Report Configuration (Required Question)**:
	- Do you want to generate reports after execution? If so, which format do you prefer?
		- `none` (No reports, images only on disk - **Default**)
		- `json` (Plain `jshutter-report.json` file with timing and metadata)
		- `html` (Interactive standalone `jshutter-report.html` report)
		- `all` (Generates both JSON and HTML)

---

## 2. Execution Cycle

Once requirements are aligned with the user:

1. **Generation / Editing**:
	- Before creating the config, verify: Does `./jshutter/jshutter.json` already exist? If yes, edit it. If no, create the `jshutter/` directory first, then create the config inside it.
	- If there are complex JavaScript scripts for interactions, separate them into the macros folder and use them via aliases in the configuration.
	- **[MANDATORY SECURITY]** If you configure session data saving (`saveStorageState`), you must **automatically add the resulting JSON file path to `.gitignore`** (if not already present) and explicitly inform the user in your response about this addition and its security purpose (preventing accidental leakage of active credentials).
	- **[MANDATORY CONTEXT CHECK]** Before finalizing, verify: Does any task depend on runtime state (dismissed modals, injected localStorage, `window.__variables`) from `setupTasks` or from other tasks? If yes, **inline those actions into every task that needs them**. Each task runs in its own isolated browser context — only `saveStorageState`/`storageState` (file-based) persists across contexts.

2. **Validation**:
	- Always run `jshutter validate` before executing. If there are syntax errors, fix them immediately.

3. **Focused and Incremental Execution**:
	- **Running everything is prohibited** if you are only fixing or testing a specific section of the configuration.
	- Split execution using CLI filters:
		- `jshutter run --task <id>` (if only one task was modified).
		- `jshutter run --tag <tag>` (if testing a group of tasks).

4. **Final Notification**:
	- When execution is complete, **do not perform autonomous inspections or analysis of results** (captures or reports) unless the user explicitly requests it.
	- Briefly inform that the process has finished and indicate the exact path where files were saved (e.g., `Results saved at ./screenshots/my-capture.png`).
