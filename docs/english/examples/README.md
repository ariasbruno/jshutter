# jshutter Configuration Examples

Below are optimized configuration templates for different automation scenarios.

---

## 1. Simple Landing Page
Takes a capture of a static page or landing page at default resolution.

```jsonc
{
	// Global configuration (inherited by all tasks)
	"global": {
		"baseOutputDir": "./screenshots", // Root directory where results will be saved
		"viewport": { // Default resolution for captures
			"width": 1920,
			"height": 1080
		},
		"fullPage": true // Enables full-page capture (total scrollable height)
	},
	// List of individual pages to capture
	"tasks": [
		{
			"id": "landing-home", // Unique task identifier
			"url": "https://example.com/", // Destination URL for the capture
			"output": "landing/home.png" // Output filename (saved to screenshots/landing/home.png)
		}
	]
}
```

### Returned result:
*   **`screenshots/landing/home.png`**: A full-page capture (`fullPage: true` inherited) of the homepage at `1920x1080` resolution (desktop-hd).

---

## 2. Responsive Capture (Multi-Viewport)
Runs the capture of the same page at different resolutions.

```jsonc
{
	"global": {
		"baseOutputDir": "./screenshots/responsive" // Global output directory
	},
	"tasks": [
		{
			"id": "home-capture",
			"url": "https://example.com/",
			// List of viewports in array format.
			// The engine will automatically expand this task generating one capture per resolution.
			"viewport": ["desktop-hd", "tablet", "mobile"],
			"output": "home.png" // Resulting names will have suffixes (e.g.: home-mobile.png)
		}
	]
}
```

### Returned result:
The engine automatically expands the task for each provided viewport and generates:
*   **`screenshots/responsive/home-desktop-hd.png`**: Capture at `1920x1080` resolution.
*   **`screenshots/responsive/home-tablet.png`**: Capture at `768x1024` resolution.
*   **`screenshots/responsive/home-mobile.png`**: Capture at `375x812` resolution.

---

## 3. Login and Dashboard (Advanced Authentication)
Runs an initial sequential login task, saves cookies and localStorage to a JSON file, then reuses that state to capture multiple protected pages in parallel without repeating the authentication steps.

```jsonc
{
	"global": {
		"baseOutputDir": "./screenshots", // Output directory
		"viewport": "desktop", // Inherited resolution (1280x720)
		"storageState": "auth-session.json", // File from which tasks will inherit session state
		"baseUrl": "https://example.com" // Base URL for resolving relative URLs
	},
	// setupTasks run sequentially (one after another) before the main tasks
	"setupTasks": [
		{
			"id": "initial-login",
			"url": "/login", // Resolved against baseUrl as https://example.com/login
			"output": "secure/login-success.png",
			"saveStorageState": "auth-session.json", // Saves cookies/localStorage after completion
			"actions": [
				{
					"type": "fill_form", // Fills the authentication form
					"fields": [
						{ "selector": "#email", "value": "$env.JSHUTTER_USER", "clear": true }, // Dynamic environment resolutions
						{ "selector": "#password", "value": "$env.JSHUTTER_PASSWORD" }
					]
				},
				{
					"type": "click", // Submits the form by clicking the submit button
					"selector": "button[type='submit']"
				},
				{
					"type": "wait_navigation" // Waits for the redirect navigation to finish
				}
			]
		}
	],
	// Main tasks run in parallel sharing the loaded session
	"tasks": [
		{
			"id": "private-dashboard",
			"url": "/dashboard", // Runs pre-authenticated with cookies from auth-session.json
			"output": "secure/dashboard.png"
		},
		{
			"id": "user-profile",
			"url": "/profile", // Runs pre-authenticated with cookies from auth-session.json
			"output": "secure/profile.png"
		}
	]
}
```

### Returned result:
*   **`auth-session.json`**: Serialized file at the root containing session cookies and local storage generated during the setup login.
*   **`screenshots/secure/login-success.png`**: Sequential success capture after filling out and submitting the login form.
*   **`screenshots/secure/dashboard.png`**: Main user dashboard capture (loaded with `auth-session.json` session state).
*   **`screenshots/secure/profile.png`**: Private user profile capture (loaded with `auth-session.json` session state).

> [!IMPORTANT]
> **AI Directive - Session protection**: Whenever you generate or suggest configuring session data saving (`saveStorageState`), you must **automatically add the JSON file path to the project's `.gitignore`** (if not already present) and explicitly notify the user about this action to ensure credential security.

---

## 4. Multi-Page Sequence (E-commerce)
Adds an item to the cart on the first product page, navigates to another section to add another item, and finally takes a capture of the checkout section. Cookies and session variables remain active during the task sequence.

```jsonc
{
	"tasks": [
		{
			"id": "complete-shopping-cart",
			"url": "https://example.com/products/sports-shoes", // First product
			"viewport": "desktop-hd",
			"output": "checkout/final_cart.png",
			// Sequential actions executed within the same tab context/session
			"actions": [
				{
					"type": "click", // Adds the first product to the cart
					"selector": ".btn-add-to-cart",
					"optional": true // Does not stop the task if the button is not present
				},
				{
					"type": "navigate", // Navigates to the second product page in the same tab
					"url": "https://example.com/products/cotton-tshirt"
				},
				{
					"type": "click", // Adds the second product
					"selector": ".btn-add-to-cart",
					"optional": true
				},
				{
					"type": "navigate", // Navigates to the final checkout page
					"url": "https://example.com/cart"
				},
				{
					"type": "wait_selector", // Waits for the cart total to load before the final screenshot
					"selector": ".cart-summary"
				}
			]
		}
	]
}
```

### Returned result:
*   **`screenshots/checkout/final_cart.png`**: Final capture taken after completing the interaction sequence. The image will reflect the accumulated final state (both products added to the cart thanks to the session persisting throughout the task's sequential navigations).

---

## 5. Lazy-Loading and Intermediate Captures
Smoothly scrolls the window down to force image loading, taking intermediate captures at different positions.

```jsonc
{
	"tasks": [
		{
			"id": "lazy-loading-check",
			"url": "https://example.com/products",
			"viewport": "desktop-hd",
			"output": "lazy_load/final_scroll.png", // Final full-page resulting screenshot
			"actions": [
				{ "type": "scroll", "value": "down" }, // Initial scroll
				{ "type": "wait", "value": 500 }, // Waits for content to load after scroll
				{ "type": "screenshot", "output": "lazy_load/step_1.png" }, // Intermediate capture
				{ "type": "scroll", "value": "down" }, // Second scroll
				{ "type": "wait", "value": 500 },
				{ "type": "screenshot", "output": "lazy_load/step_2.png" }, // Second intermediate capture
				{ "type": "scroll", "value": "up" }, // Scrolls back to the top
				{ "type": "wait", "value": 200 }
			]
		}
	]
}
```

### Returned result:
*   **`screenshots/lazy_load/step_1.png`**: Intermediate capture taken after the first scroll down (first images loaded).
*   **`screenshots/lazy_load/step_2.png`**: Intermediate capture taken after the second scroll down (lower content forced to render).
*   **`screenshots/lazy_load/final_scroll.png`**: Final full-page capture after completing the entire scroll cycle and returning to the top.

---

## 6. External Macros and localStorage Injection (Advanced)
Avoids injecting inline JavaScript blocks by registering them as reusable external macros. Cleanly hides popups and banners and writes data to the browser's local storage.

```jsonc
{
	"global": {
		"actions": [
			{ "type": "macro", "name": "close_warning" } // Global macro: always runs before task actions
		]
	},
	// Mapping of aliases to JavaScript files with custom scripts
	"macros": {
		"close_warning": "./macros/close-warning.js",
		"inject_favorites": "./macros/add-to-favorites.js"
	},
	"tasks": [
		{
			"id": "product-favorites",
			"url": "https://example.com/products",
			"output": "store/favorites.png",
			"actions": [
				{
					"type": "hide", // Hides modals, overlays, or annoying cookie banners
					"selector": ".cookie-banner, [role='dialog']"
				},
				{
					"type": "macro", // Calls the macro associated with the registered alias
					"name": "inject_favorites"
				},
				{
					"type": "set_storage", // Injects variables/keys directly into the browser's localStorage
					"key": "has_dismissed_offer",
					"value": true
				},
				{
					"type": "wait",
					"value": 500
				}
			]
		}
	]
}
```

### Example Macro Code:

#### 1. `close_warning` Macro (`./macros/close-warning.js`)
```javascript
// Hides annoying modals and cookie banners for a clean capture
const banners = document.querySelectorAll(".cookie-banner, [role='dialog']");
banners.forEach(el => {
	el.style.display = "none";
});
```

#### 2. `inject_favorites` Macro (`./macros/add-to-favorites.js`)
```javascript
// Simulates adding products to favorites by marking hearts in the DOM
const heartIcons = document.querySelectorAll(".heart-icon");
heartIcons.forEach((btn, index) => {
	if (index < 2) {
		btn.classList.add("active");
		btn.setAttribute("aria-checked", "true");
	}
});
```

### Returned result:
*   **`screenshots/store/favorites.png`**: Clean capture of the products section, free of cookie banners or dialog popups thanks to the `hide` selector and with favorites activated injected at the localStorage level.

---

## 7. Visual and Context Customization (Dark Mode, JPEG Format, and User-Agent)
Granularly adjusts the browser's execution environment by emulating a dark color scheme, exporting the capture in compressed JPEG format to optimize storage, and modifying the `User-Agent` header along with custom timeout limits.

```jsonc
{
	"tasks": [
		{
			"id": "landing-dark-mode",
			"url": "https://example.com",
			"viewport": "desktop-hd",
			"output": "store/dark_home.jpg",
			"colorScheme": "dark", // Emulates dark theme color scheme preference
			"format": "jpeg", // Alternative compressed JPEG format
			"quality": 75, // Adjusts compression quality (0-100)
			"timeout": 15000, // Sets maximum execution timeout for this task (15 seconds)
			"userAgent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" // Emulates custom User-Agent
		}
	]
}
```

### Returned result:
*   **`screenshots/store/dark_home.jpg`**: Homepage capture emulating a dark color scheme, saved in JPEG format at 75% quality (ideal for lightweight files), executed under a Googlebot User-Agent with a maximum timeout of 15 seconds.

---

## 8. localStorage / sessionStorage Data Injection
Uses `set_storage` with `storageType` to inject data that the site's JavaScript reads to render the UI. Note: since actions run **after** the page loads, you need to re-navigate after `set_storage` so the page reads the injected data during its initial render.

```jsonc
{
	"global": {
		"baseOutputDir": "./screenshots"
	},
	"setupTasks": [
		{
			"id": "login",
			"url": "https://example.com/login",
			"actions": [
				{ "type": "fill_form", "fields": [
					{ "selector": "#email", "value": "$env.USER_EMAIL" },
					{ "selector": "#password", "value": "$env.USER_PASSWORD" }
				]},
				{ "type": "click", "selector": "button[type=submit]" },
				{ "type": "wait_navigation" }
			],
			"saveStorageState": "./auth.json" // Saves cookies + localStorage after successful login
		}
	],
	"tasks": [
		{
			"id": "dark-dashboard",
			"url": "https://example.com/dashboard",
			"output": "dashboard/custom.png",
			"storageState": "./auth.json", // ← Loads cookies + localStorage from the previous login
			"actions": [
				{
					"type": "set_storage",
					"key": "ui_theme",
					"value": "dark",
					"storageType": "local" // ← The site reads ui_theme from localStorage
				},
				{
					"type": "set_storage",
					"key": "sidebar_collapsed",
					"value": "true",
					"storageType": "session" // ← The site reads sidebar_collapsed from sessionStorage
				},
				{
					"type": "navigate",
					"url": "https://example.com/dashboard" // ← Re-navigates so JS reads the injected data
				},
				{ "type": "wait", "value": 500 }
			]
		}
	]
}
```

### Returned result:
*   **`screenshots/dashboard/custom.png`**: Capture of the authenticated dashboard (login cookies) with dark theme and collapsed sidebar, injected directly into the browser's storage.
