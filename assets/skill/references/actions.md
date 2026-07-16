# Sequential Actions Catalog

Actions within the `actions` field of each task run sequentially before the final capture.

---

## Supported Actions

#### `click`
Clicks on a DOM element.
- `selector` (string): CSS selector of the element.
- `optional` (boolean, optional): If `true`, does not fail if the element is not found.

#### `type`
Types text into a form field.
- `selector` (string): CSS selector of the input.
- `value` (string/number): Text to type.
- `clear` (boolean, optional): If `true`, clears the field before typing.

#### `select`
Selects an option in a `<select>` using the `value` attribute.
- `selector` (string): CSS selector of the `<select>`.
- `value` (string): Value of the `value` attribute of the option to select.

#### `hover`
Hovers the cursor over the specified element to trigger `:hover` styles.
- `selector` (string): CSS selector of the element.

#### `scroll`
Scrolls the screen.
- `value` (string/number): `"down"` or `"up"` for smooth scroll, or a specific number of pixels.

#### `wait`
Pauses execution for the specified number of milliseconds.
- `value` (number): Milliseconds to wait.

#### `wait_selector`
Pauses until the selector appears in the DOM.
- `selector` (string): CSS selector to wait for.
- `timeout` (number, optional): Maximum wait time in ms.

#### `wait_navigation`
Waits for a redirect or network navigation to finish.
- `timeout` (number, optional): Maximum wait time in ms.

#### `wait_network_idle`
Waits until there are no active network requests for at least 500ms.
- `timeout` (number, optional): Maximum wait time in ms.

#### `keyboard`
Simulates pressing a physical key.
- `key` (string): Key name (e.g.: `"Enter"`, `"Tab"`, `"Escape"`, `"ArrowDown"`).

#### `navigate`
Navigates to another page within the same browser session/context.
- `url` (string): Destination URL.

#### `screenshot`
Takes an intermediate screenshot.
- `output` (string): Output file path (relative to `baseOutputDir`).

#### `fill_form`
Fills multiple inputs in a single step (equivalent to multiple `type` actions).
- `fields` (array of objects): Each object contains `selector` (string), `value` (string) and optionally `clear` (boolean).

#### `hide`
Hides element(s) using `display: none` safely. Uses a `MutationObserver` if they are mounted asynchronously.
- `selector` (string): CSS selector of the element to hide.

#### `set_storage`
Injects a key-value pair into `localStorage` or `sessionStorage`.
- `key` (string): Name of the key.
- `value` (any): Value to inject (auto-serializes objects/arrays).
- `storageType` (string, optional): `"local"` (default) or `"session"`.

> [!IMPORTANT]
> Since actions run **after** the page loads, use `navigate` after `set_storage` if the page needs to read this data during its initial render.

#### `evaluate`
Runs JavaScript code directly on the page.
- `script` (string): JS code to run via `page.evaluate()`.

> [!WARNING]
> Use with caution. The code runs in the browser context.

#### `macro`
Calls and runs an external JavaScript macro registered in the `macros` block.
- `name` (string): Alias of the registered macro.

---

## Best Practices

- **Avoid rigid waits (`wait`):** Instead, prefer using `wait_selector` or `wait_network_idle` for faster and more robust execution against network speed variations.
- **Closing modals and dialogs:** If there are persistent banners, use the `hide` action with a comma-separated list of selectors to remove them from the viewport before taking the final screenshot.
- **Context persistence:** Since each task runs in its own isolated session, if you need to capture a secure internal page, perform the login flow (`navigate` -> `fill_form` -> `click` -> `wait_navigation`) as the first actions of that same task.
