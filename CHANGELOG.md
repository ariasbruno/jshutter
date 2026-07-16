# Changelog

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
