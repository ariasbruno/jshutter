# jshutter Commands Reference

This document provides an in-depth explanation of the **jshutter** Command Line Interface (CLI), covering each command, its flags, use cases, and exit codes.

---

## 1. `jshutter run [config]` (Alias: `r`)

Runs the capture engine based on the specified configuration.
- If the file path is omitted, it looks for `./jshutter.json` or `./jshutter/jshutter.json` by default in the current working directory.
- If a simple name is provided (like `ayari` or `ayari.json`), it will be searched for and resolved automatically within the `./jshutter/` directory (e.g.: `./jshutter/ayari.json`).

### How It Works:
- **Playwright Orchestration**: Initializes a single instance of the requested browser (`chromium`, `firefox` or `webkit`) and opens isolated navigation contexts (`BrowserContext`) for each active task. This prevents accidental sharing of cookies, session, or cache state between different tasks.
- **Execution Flow**: Strictly follows the phases: navigate to URL -> wait for delay -> sequential execution of interactions (`actions`) -> screenshot -> persist to file -> close context.
- **Exit Codes**:
	- `0`: All active tasks executed and saved successfully.
	- `1`: There was a syntax error, missing dependencies (browsers not installed), or one or more tasks failed (timeout, non-existent selectors, etc.).

### Execution Flags:

#### `--headed`
- **Description**: Launches the browser in visible mode (with a GUI).
- **Use case**: Local visual debugging. Allows you to observe step-by-step how clicks, scrolls, and form filling execute in real time.

#### `-v, --verbose`
- **Description**: Enables detailed logs of the engine's internal lifecycle.
- **Use case**: Failure diagnosis. Prints detailed logs for each navigation, active delays, and parameters for each action before executing in the browser.

#### `--silent`
- **Description**: Silences all console output (except critical and unrecoverable errors).
- **Use case**: Running in automated scripts, scheduled tasks (cron), or CI pipelines where a clean log is desired.

#### `--dry-run`
- **Description**: Validates the configuration file and displays a summary table of the tasks that would be run in the terminal, without opening any browser.
- **Use case**: Quick preview. Allows you to check which tasks will be filtered and in which paths the captures will be saved before triggering the actual execution. Exits immediately with code `0`.

#### `--task <id>`
- **Description**: Filters the execution to run only the task matching the specified unique identifier (`id`). All other tasks are skipped and printed as `SKIPPED`.
- **Use case**: Unit testing captures. Allows you to test a complex interaction (like a payment gateway or login) without re-capturing the rest of the website.

#### `--tag <tag>`
- **Description**: Filters the execution to run only tasks containing the specified tag in their `tags` array. All others are skipped.
- **Use case**: Environment or group execution (e.g.: `--tag prod` or `--tag checkout`).

#### `--browser <type>`
- **Description**: Sets the browser engine for Playwright execution. Supported values: `chromium` (default), `firefox` and `webkit`.
- **Use case**: Cross-browser compatibility testing (e.g.: testing how the design looks in WebKit/Safari or Firefox).
- **Error handling**: If the binaries for the requested browser are not installed locally, the command aborts with a descriptive error message with instructions to install it using `npx playwright install`.

#### `--parallel <number>`
- **Description**: Sets the maximum number of tasks that can be processed simultaneously. Default is `1` (sequential execution).
- **Use case**: Performance optimization. When running, for example, with `--parallel 3`, the engine uses a concurrent worker pool to capture 3 pages at once sharing the same browser process, which drastically reduces execution time in large suites.
- **Performance note**: Setting a concurrency that is too high (e.g.: more than 5 or 8 browsers in parallel) is the user's responsibility and may saturate local CPU and RAM, causing bottlenecks or Playwright timeout failures. It is recommended to adjust this value based on available hardware resources.

#### `--report <type>`
- **Description**: Determines report generation in the base output directory. Supported options:
	- `none` (default): No additional reports are written.
	- `json`: Writes a structured `jshutter-report.json` file.
	- `html`: Writes an interactive `jshutter-report.html` file with result cards, screenshot zoom modal, and filters.
	- `all`: Generates both files.

#### `--force`
- **Description**: Skips interactive confirmation prompts for bulk capture runs.
- **Use case**: Automation in non-interactive environments (like CI/CD or Docker containers) where you want to force HTML report generation with Base64 enabled for more than 100 captures without blocking the terminal.

## Option Precedence

The `--report`, `--headed`, and `--parallel` options can be set both on the CLI command line and in the `"global"` block of `jshutter.json`. The precedence is:

1. **CLI flag** (e.g.: `--report html` or `--parallel 4`) -> Highest priority.
2. **Property in the `global` block** of the configuration.
3. **System default value** (`"none"`, `false`, and `1` respectively) -> Lowest priority.

### Security Control: Git Warnings (.gitignore)

When running `jshutter run`, if the configuration defines the `saveStorageState` property to save browser session cookies to a local file (e.g. `auth-session.json`), the engine automatically runs a Git check (`git check-ignore`).

*   **Purpose**: Prevent accidental leakage of active web sessions in public repositories.
*   **Behavior**: If the resulting JSON file is not listed in the current project's `.gitignore` file, a prominent warning message is displayed in the console before starting execution. The warning is **informational, not blocking**: execution continues regardless.

### Performance Control: Bulk Report Warning (Base64 Alert)

When running `jshutter run`, if the following conditions are met simultaneously:
1. The total number of individual captures to perform (after viewport expansion) is **greater than 100**.
2. The configured or requested report type is `"html"` or `"all"`.
3. The HTML report is configured to embed images directly in Base64 (`"embedBase64": true`).
4. It is running in an interactive terminal (TTY) without the `--force` flag.

*   **Behavior**: The console pauses engine execution and prints a warning about the possible browser crash when opening an extremely heavy HTML file. It requests interactive confirmation (`Do you want to continue with Base64 generation anyway? (y/N)`). If the user declines or presses Enter, the process exits with code `0`.
*   **Bypass**: The prompt is automatically skipped if the terminal is non-interactive (CI/CD) or if the `--force` flag is added.

### Automatic Version Check

When running any command, **jshutter** checks in the background if a newer version is available on npm. If found, it displays a discreet notice with the new version and the command to update. This check is non-blocking and fails silently when there is no internet connection.

### Commander Built-in Commands

| Flag | Description |
| :--- | :--- |
| `--help` | Shows the general CLI help with all available commands and flags. |
| `-V, --version` | Shows the currently installed **jshutter** version. |

> [!NOTE]
> `-V` (version) is different from `-v` (verbose), which is a flag exclusive to the `run` command.

---

## 2. `jshutter init` (Alias: `i`)

Creates a `jshutter/` folder in the project root containing a basic template `jshutter.json` configuration intended to store organized captures.

### Behavior:
- **Overwrite prevention**: If the installer detects that a `./jshutter/jshutter.json` file already exists in the project, it interactively requests confirmation in the console (`The jshutter/jshutter.json file already exists. Do you want to overwrite it? (y/N):`).
- If the user declines the overwrite, it immediately cancels the process without modifying the disk (exit code `0`).
- If the file does not exist or overwrite is authorized, it writes a standard template with global settings (`baseOutputDir`, `viewport`, `delay`, `fullPage`) and a sample task pointing to `example.com`.

---

## 3. `jshutter validate [config]` (Alias: `v`)

Analyzes and statically validates the structure and coherence of the specified configuration file.

### Behavior:
- **Loading and Verification**: Reads the JSON, parses the syntax, and validates strict schema compliance (positive viewports, valid preset names, required parameters for each action in the list).
- **Quick diagnosis**: Does not open any Playwright browser, so its execution is nearly instantaneous (less than 50ms).
- **Exit Codes**:
	- If valid: Prints `✓ Config valid` and the number of tasks found, exiting with code `0`.
	- If invalid: Prints `✗ Config invalid`, details the typing error or missing field detected, and exits with code `1`.

---

## 4. `jshutter install-skill` (Alias: `is`)

Installs the AI assistance skill (`SKILL.md`) in the project's local agent configuration.

### Behavior:
- **Skill Registration**: Writes the main file to `.agents/skills/jshutter/SKILL.md` and its associated references to `.agents/skills/jshutter/references/` (creating necessary subdirectories automatically).
- **Smart detection**: Tries to load the local copy of resources bundled internally within the npm package itself (inside the `node_modules` installation directory). If not found, falls back to downloading the latest stable version from the official GitHub repository.
- **Purpose**: This registers the manual, config grammar, and project command references directly within your agent's capabilities, allowing them to natively understand how to build tasks and resolve complex interactions.

---

## 5. `jshutter open-report [config]` (Alias: `open`, `o`)

Opens the generated interactive HTML report in the user's default system browser.

### Behavior:
- **Automatic Localization**: Tries to read the resolved configuration file to locate the global output directory (`baseOutputDir`) and find the `jshutter-report.html` file.
- **Path Fallback**: If loading the JSON fails, it searches for the report sequentially in common project paths (e.g. `./output/jshutter-report.html`, `./jshutter/output/jshutter-report.html`, `./jshutter-report.html`).
- **Cross-platform Opening**: Detects the operating system and asynchronously and transparently runs the appropriate command to invoke the user's browser (`open` on macOS, `start` on Windows, `xdg-open` on Linux environments).
- **Exit Codes**: Exits with code `0` if the report was successfully opened in the browser and with code `1` if the file could not be located or the system command failed.
