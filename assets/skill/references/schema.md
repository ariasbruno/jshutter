# jshutter Configuration Guide (`jshutter.json`)

This document provides an in-depth description of the format, blocks, and all supported properties in the `jshutter.json` configuration file, as well as the priority (cascade) rules and path resolution in the system.

---

## 1. General Structure

The `jshutter.json` file is composed of five top-level blocks:
- **`global`**: Default values shared by all tasks.
- **`presets`**: Definition of reusable custom screen resolutions.
- **`macros`**: Definition of reusable external JS scripts under an alias.
- **`setupTasks`**: List of setup tasks executed sequentially.
- **`tasks`**: List of individual capture tasks to run in parallel.

```json
{
	"$schema": "https://raw.githubusercontent.com/ariasbruno/jshutter/main/jshutter.schema.json",
	"global": { ... },
	"presets": { ... },
	"macros": { ... },
	"setupTasks": [ ... ],
	"tasks": [ ... ]
}
```

### Autocompletion and Syntax Validation
To facilitate writing the configuration and prevent errors, **jshutter** provides an official JSON Schema file (`jshutter.schema.json`). You can configure your code editor to enable autocompletion and real-time field validation by adding the `$schema` key at the root of the file:

*   **Remote link** (Recommended):
	```json
	{
		"$schema": "https://raw.githubusercontent.com/ariasbruno/jshutter/main/jshutter.schema.json",
		"global": { ... },
		"tasks": [ ... ]
	}
	```
*   **Local link** (For development within the repository):
	```json
	{
		"$schema": "../jshutter.schema.json",
		"global": { ... },
		"tasks": [ ... ]
	}
	```

## 2. `global` Block (Optional)

This block defines the global options that will be applied to all capture tasks unless a specific task overrides them.

#### `baseUrl` (`string`, default: `null`)
Base navigation URL (e.g.: `https://example.com`). If defined, tasks and navigation actions ([`navigate`](./actions.md#navigate)) can specify relative paths (e.g.: `/login`, `/contact`).

#### `baseOutputDir` (`string`, default: `"./output"`)
Base directory where captures and reports are stored. Resolved relative to the location of the `jshutter.json` file.

#### `viewport` (`string`, `object` or `array`, default: `{"width": 1280, "height": 720}`)
Default screen dimensions. Can be a preset name (e.g.: `"mobile"`), a `{width, height}` object, or a mixed array of them (e.g.: `["desktop", {"width": 1024, "height": 768}]`).

#### `fullPage` (`boolean`, default: `false`)
If `true`, captures the full height of the page. If `false`, captures only the current visible viewport area.

#### `maxPageHeight` (`number`, default: `8000`)
Maximum height limit in pixels when taking full-page captures (`fullPage: true`). If the page exceeds this height, the viewport is clipped to this value to prevent RAM saturation. `0` disables the limit.

#### `delay` (`number`, default: `500`)
Wait time in milliseconds once the page has loaded (and before executing actions or taking the final capture). Range: `>= 0`.

#### `format` (`string`, default: `"png"`)
Resulting image file format. Supported values: `"png"` and `"jpeg"`.

#### `quality` (`number`, default: `100`)
Compression quality (range `0-100`). Only applies when the format is `"jpeg"`.

#### `timeout` (`number`, default: `30000`)
Maximum time limit in milliseconds to process the entire task. If exceeded, the task aborts with `TimeoutError`. `0` disables the timeout.

#### `colorScheme` (`string`, default: `"light"`)
Configures the preferred color mode in the browser. Supported values: `"light"`, `"dark"` and `"no-preference"`.

#### `userAgent` (`string`, default: `null`)
Custom User-Agent string that the browser will send in HTTP requests.

#### `report` (`string`, default: `"none"`)
Configures default report generation. Supported values: `"json"`, `"html"`, `"all"`, `"none"`.

#### `embedBase64` (`boolean`, default: `true`)
If `true`, embeds screenshots directly into the HTML report in Base64 format (self-contained report). If `false`, injects links with physical relative paths of the images, ideal for bulk reports.

#### `headed` (`boolean`, default: `false`)
Indicates whether the browser should start in visible mode by default.

#### `parallel` (`number`, default: `1`)
Maximum number of tasks to run in parallel by default.

#### `saveStorageState` (`string`, default: `null`)
Path of the JSON file where the global authentication state (cookies/localStorage) will be saved.

#### `storageState` (`string`, default: `null`)
Path of the JSON file from which the authentication state will be loaded by default for all contexts.

#### `actions` (`array`, default: `[]`)
Default interaction sequence that runs before the screenshot of each task. If a task defines its own `actions`, they completely replace (not merge) the global ones. See [Actions Catalog](./actions.md) for the full list of available types.

---

## 3. `presets` Block (Optional)

Dictionary that allows you to declare custom screen resolutions (viewports) under a descriptive name for reuse in tasks.

### Preset Format:
Each entry within the `presets` object must be an object with two positive numeric fields:
- `width` (number): Width in pixels.
- `height` (number): Height in pixels.

```json
"presets": {
	"my-custom-screen": {
		"width": 1440,
		"height": 900
	}
}
```

### Built-in Presets:
**jshutter** already includes the following reserved names, which you can use in any task without needing to declare them in the `presets` block:
- `mobile-s`: `320 x 568`
- `mobile`: `375 x 812`
- `mobile-l`: `428 x 926`
- `tablet`: `768 x 1024`
- `tablet-l`: `1024 x 1366`
- `desktop`: `1280 x 720`
- `desktop-hd`: `1920 x 1080`
- `desktop-2k`: `2560 x 1440`

---

## 4. `macros` Block (Optional)

Key-value dictionary that allows you to register external JS script files under a descriptive alias for execution within capture tasks.

### Macro Format:
Each macro must map a text key to the relative path of the JavaScript file (relative to the `jshutter.json` file location):

```json
"macros": {
	"close-warning": "./macros/close-warning.js"
}
```

Macros registered here can be invoked within tasks using the action `{ "type": "macro", "name": "close-warning" }`. The jshutter engine reads, validates, and asynchronously loads the macro at runtime.

---

## 5. `tasks` Block (Required)

Array containing the list of capture tasks. Each task runs in isolation in its own clean Playwright context.

### Task Properties:

#### Required:
- **`id`** (`string`): Unique task identifier. Must not be duplicated in the file. Used for logs, filtering (`--task <id>`), and reports.
- **`url`** (`string`): Full web address or relative path (if `global.baseUrl` is configured) to capture (e.g.: `http://example.com/contact` or `/contact`). Must have a valid URL or path format.
- **`output`** (`string`): Destination path to save the capture (e.g.: `contact.png` or `views/contact_mobile.png`). Resolved relative to the `baseOutputDir` directory.

#### Optional (Override global values):
- **`viewport`** (`string`, `object` or `array`): Specific dimensions for this task. Can be a preset (e.g.: `"mobile"`), a `{width, height}` object, or a mixed array of them.
- **`fullPage`** (`boolean`): Overrides the global option.
- **`maxPageHeight`** (`number`): Overrides the global maximum height limit.
- **`delay`** (`number`): Overrides the global delay.
- **`format`** (`string`): `"png"` or `"jpeg"`.
- **`quality`** (`number`): JPEG image quality (range `0-100`).
- **`colorScheme`** (`string`): `"light"`, `"dark"` or `"no-preference"`.
- **`timeout`** (`number`): Specific time limit for this task.
- **`userAgent`** (`string`): Custom User-Agent for this task.
- **`tags`** (`array of strings`): Tags assigned to the task (e.g.: `["prod", "auth"]`). Allow filtering group executions from the CLI (`--tag <tag>`).
- **`actions`** (`array of objects`): Structured interaction sequence to execute before the final screenshot. See [Actions Catalog](./actions.md) for available types and their parameters.
- **`saveStorageState`** (`string`): Relative path of the JSON file where Playwright session state (cookies & localStorage) will be saved after this task succeeds.
- **`storageState`** (`string`): Relative path of the JSON file that this task will load when initializing the browser context to start pre-authenticated.

### Multiple Viewport Expansion

If a task resolves to multiple viewports or presets (either because it defines them as an array locally, or inherits them as an array from the `global` block):
- **Task Cloning**: The original task is multiplied into multiple independent concurrent executions, one for each resolved dimension.
- **Deduplication**: If there are duplicates (e.g.: `["mobile", "mobile"]`), they are automatically filtered before execution starts.
- **Unique IDs**: Each clone's IDs are auto-generated by appending the corresponding preset or dimension suffix to avoid collisions: `[original-id]-[suffix]`.
- **Automatic File Path**: To prevent mutual overwriting, the output filename specified in `output` automatically injects the suffix before the extension. For example, `landing.png` will be saved as `landing-mobile.png` and `landing-desktop-hd.png`.
- **Backward Compatibility**: If the task resolves to a single dimension/preset, no suffix is applied, keeping IDs and output names exactly as originally defined.

---

## 6. Value Resolution Rules (Cascade)

To determine the final value of any optional task property (such as viewport or image format), the **jshutter** engine strictly follows the following precedence order from highest to lowest priority:

1. **Direct Configuration in the Task**: If the task specifies the property directly (e.g.: `"viewport": "mobile"` or `"format": "jpeg"`).
2. **`global` Block**: If the property is defined within the `global` key of the JSON file (e.g.: `"viewport": ["desktop", "tablet"]`).
3. **System Default Value**: The preset constants in the **jshutter** code if not defined in any of the above layers (default viewport: `1280x720`).

---

## 7. Path Resolution

**jshutter** manages directory and file resolution as follows:

1. **Working Directory (`cwd`)**: The directory from where you run the `jshutter run` command.
2. **Configuration file location**: The JSON configuration file (located by default at `./jshutter/jshutter.json`) acts as the anchor point for resolving relative paths of macros, output, and captures.
3. **`baseOutputDir` (Output Directory)**:
   - If defined as a relative path (e.g.: `"baseOutputDir": "./output"`), it is resolved relative to the directory containing the current configuration file.
   - If absolute, it writes directly to that path.
4. **`output` (Capture path)**:
   - **Always** resolved relative to the calculated `baseOutputDir` path.
   - **Recommended standard**: To keep files organized, it is suggested to set `"baseOutputDir": "./output"` at the global level and define task outputs with the `"screenshots/"` prefix (e.g.: `"output": "screenshots/contact.png"`). This will save images to `jshutter/output/screenshots/contact.png` and keep reports clean and accessible at the output directory root: `jshutter/output/jshutter-report.html`.

   **Single capture configuration:**
   ```
   my-project/
   └── jshutter/
       ├── jshutter.json
       └── output/
           ├── jshutter-report.html
           └── screenshots/
               ├── home.png
               └── contact.png
   ```

   **Multiple capture configurations:**
   ```
   my-project/
   └── jshutter/
       ├── production.json
       ├── testing.json
       └── output/
           ├── production/
           │   ├── jshutter-report.html
           │   └── screenshots/
           │       ├── home.png
           │       └── contact.png
           └── testing/
               ├── jshutter-report.html
               └── screenshots/
                   ├── home.png
                   └── contact.png
   ```

---

## 8. `setupTasks` Block (Optional)

The `setupTasks` block is an optional array of preparation tasks that run **sequentially** (one after another, `parallel = 1`) before the parallel execution pool of the main tasks (`tasks`) begins.

It is ideal for any preparation that must occur before captures: fetching data from the server, generating temporary files, configuring application state, or performing a login.

*   **Sequential Guarantee**: Tasks in `setupTasks` never run in parallel with each other or collide.
*   **Filter Immunity**: Unlike the `tasks` block, preparation tasks **always** execute even if you use the `--task` or `--tag` filtering flags on the command line (to ensure any required state or file is ready).
*   **Error Cancellation**: If one of the tasks in the `setupTasks` block fails, the engine will immediately abort and will not execute the parallel tasks in `tasks`, preventing defective captures.
*   **Identical Structure**: Each object in `setupTasks` supports exactly the same properties as regular tasks in the `tasks` block.

---

## 9. Environment Variables (Security)

To avoid storing credentials, tokens, or passwords in plain text within the `jshutter.json` file, you can use the `$env.` prefix in any string property.

*   **Syntax**: `$env.VARIABLE_NAME`
*   **Example**:
	```json
	{
		"type": "fill_form",
		"fields": [
			{ "selector": "#email", "value": "$env.JSHUTTER_USER" },
			{ "selector": "#password", "value": "$env.JSHUTTER_PASSWORD" }
		]
	}
	```
*   **Resolution**: When loading the configuration, the **jshutter** engine dynamically reads `process.env.VARIABLE_NAME`. If the variable is not configured in the current system environment, a prominent warning is displayed in the console and it resolves to an empty string.
