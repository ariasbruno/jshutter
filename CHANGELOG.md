# Changelog

## [0.1.3] - 2025-07-16

### Fixed

- **AI skill: Context isolation warnings**: Added critical warnings across SKILL.md, schema.md, actions.md, and workflow.md clarifying that each task runs in its own isolated browser context. Data set via `evaluate` or `set_storage` in one task does NOT persist to other tasks. Only `saveStorageState`/`storageState` (file-based) persists across contexts.
- **AI skill: File location enforcement**: Added mandatory rule to always create `jshutter.json` inside `./jshutter/` directory. Added verification step in workflow to check for existing config before creating.
- **AI skill: Self-contained task examples**: Added Example 9 demonstrating the correct pattern where each task inlines its own setup actions (dismiss modal, fetch data, inject localStorage).
- **AI skill: Best practices updated**: Expanded guidance on modal dismissal, context persistence, and self-contained task patterns.

### Added

- **Documentation: Context isolation notes**: Added context isolation explanations to `configuration.md`, `actions.md`, and `README.md` in both English and Spanish.
- **Documentation: Example 9**: Added "Self-Contained Tasks (Context Isolation Pattern)" to examples documentation (EN/ES) demonstrating independently runnable tasks.
- **README: Engine lifecycle notes**: Added notes about context isolation in the Engine Lifecycle section (EN/ES).

## [0.1.2] - 2025-07-16

### Fixed

- **HTML report template path**: Corrected relative path from `../../assets/report` to `../assets/report` so `html-reporter` resolves assets correctly from bundled `dist/cli.js`
- **HTML report GitHub fallback**: Added automatic download from GitHub repository when local report assets are not found (matching installer pattern)

## [0.1.1] - 2025-07-16

### Fixed

- **Skill installer paths**: Corrected relative path from `../../assets/skill/` to `../assets/skill/` so `install-skill` resolves bundled assets correctly from `dist/`
- **GitHub fallback URL**: Fixed base URL from `assets` to `assets/skill` to match actual repository structure

## [0.1.0] - 2025-07-15

### Added

- **CLI commands**: `run`, `validate`, `init`, `install-skill`, `open-report`
- **Sequential actions**: `click`, `type`, `hover`, `scroll`, `keyboard`, `select`, `fill-form`, `wait`, `wait-selector`, `wait-navigation`, `wait-network-idle`, `screenshot`, `navigate`, `set-storage`, `hide`, `evaluate`
- **Macro support**: Execute external JS scripts via `evaluate` action type
- **Viewport presets**: `mobile-s`, `mobile`, `mobile-l`, `tablet`, `tablet-l`, `desktop`, `desktop-hd`, `desktop-2k`
- **Responsive expansion**: Tasks auto-expand into individual captures per viewport when an array is specified
- **Sequential setup phase**: `setupTasks` block for preparation tasks (login, data fetching, state injection) that run before parallel captures
- **Session persistence**: `storageState` and `saveStorageState` for cookie/localStorage persistence across tasks
- **Configuration resolution**: Recursive `$env.` variable interpolation, relative URL resolution with `baseUrl`, viewport deduplication
- **Security check**: Non-blocking `.gitignore` warning when session storage files are not excluded
- **JSON & HTML reports**: Post-execution reports with automatic sanitization of sensitive values (`password`, `token`, `secret`, etc.)
- **AI skill installer**: `install-skill` command copies `SKILL.md` and reference docs to `.agents/skills/jshutter/`
- **NPM update notifier**: Automatic check for newer versions on CLI startup
- **JSON Schema**: Full schema definition for IDE autocomplete and validation
- **CI pipeline**: TypeScript type checking on push/PR via GitHub Actions
- **Release automation**: Tag-triggered workflow for GitHub Release + NPM publish
