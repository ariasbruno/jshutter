---
name: jshutter
description: Use this skill to generate, validate, and execute screenshot automation configurations using jshutter.json, Bun, and Playwright. Activate this skill whenever the user mentions taking screenshots, automated web captures, visual testing, or performing browser interactions (clicks, form filling, smooth scroll, logins) prior to capturing a webpage.
---

# jshutter — AI Specification

This skill makes you an expert in screenshot automation using **jshutter**. Your goal is to interact with the user, structure declarative configuration files (`jshutter.json`), validate syntax, run focused tests, and deliver results safely and clearly.

---

## 1. Behavioral Directives and Interaction

When the user interacts with you about screenshots or `jshutter` workflows, follow this process:

### Phase 1: Pre-Alignment
Before proposing a configuration, ask the user the following points directly and concisely:
*	**URLs and Structure**: Which pages to capture and whether they are independent or sequential.
*	**Prior interactions**: Whether login, form filling, scroll for lazy-loading, or modal/cookie dismissal is required.
*	**Viewports**: Presets (`desktop`, `tablet`, `mobile`) or specific dimensions.
*	**Format and Capture**: Full page (`fullPage: true`) or visible area, and format (`png`/`jpeg`).
*	**Report (Required Question)**: Ask what type of report to generate (`json`, `html`, `all`, `none`).

### Phase 2: Configuration (`jshutter.json`)
*	**Indentation**: Always use **tabs** for indentation in any JSON or code file you generate or edit.
*	**Schema**: Include the `$schema` key pointing to `"../jshutter.schema.json"` or the official remote URL.
*	**Sessions and Security**: If you create login tasks (`setupTasks`) that save session to a JSON file (`saveStorageState`), you must **automatically add that JSON file to `.gitignore`** and inform the user in your response.

### Phase 3: Validation and Focused Execution
*	**Validation**: Always run `npx jshutter validate` before executing.
*	**Incremental Execution**: Don't run the entire file. Filter using `--task <id>` (to test a specific task) or `--tag <tag>` (for a group of tasks).
*	**Browser and Debugging**: Use `--headed` only when diagnosing interactively or locally, and `--verbose` for detailed network/action logs.

### Phase 4: Completion and Notification
*	 **No Autonomous Review**: Once execution is complete, **do not perform autonomous result inspections** or read generated HTML report files (`jshutter-report.html`) unless the user explicitly requests it.
*	 **Direct Notification**: Notify completion and simply indicate the exact path to the resulting files (e.g., `You can see the result at ./screenshots/my-capture.png`).

---

## 2. Quick Technical References

For full details on each section, use these local references instead of searching the internet or recreating logic:

*	[workflow.md](./references/workflow.md): Detailed step-by-step workflow for the agent.
*	[cli.md](./references/cli.md): Flags, commands (`run`, `validate`) and configuration precedence for the CLI.
*	[schema.md](./references/schema.md): Detailed structure of `global`, `presets`, `macros`, `setupTasks`, and `tasks` in `jshutter.json`.
*	[actions.md](./references/actions.md): Complete list of supported interaction actions (`click`, `type`, `scroll`, `wait_selector`, `hide`, `set_storage`, `evaluate`, etc.) and their parameters.
*	[examples.md](./references/examples.md): Ready-to-use configuration templates (persistent login, e-commerce, lazy loading, etc.).
