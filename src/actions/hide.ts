import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function hide(page: Page, params: ActionConfig): Promise<void> {
	if (!params.selector) {
		throw new Error("Action 'hide' requires a 'selector' parameter.");
	}

	await page.evaluate((selector) => {
		const hideElements = () => {
			document.querySelectorAll(selector).forEach((el) => {
				if (el instanceof HTMLElement || el instanceof SVGElement) {
					el.style.display = "none";
				}
			});
		};

		hideElements();

		const observer = new MutationObserver(hideElements);
		observer.observe(document.documentElement, { childList: true, subtree: true });

		setTimeout(() => {
			observer.disconnect();
		}, 3000);
	}, params.selector);
}
