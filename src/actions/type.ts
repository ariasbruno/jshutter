import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function type(page: Page, params: ActionConfig): Promise<void> {
	if (!params.selector) {
		throw new Error("Action 'type' requires a 'selector'.");
	}
	const value = params.value !== undefined ? String(params.value) : "";
	const locator = page.locator(params.selector);

	if (params.clear) {
		await locator.fill(value);
	} else {
		await locator.focus();
		await locator.pressSequentially(value);
	}
}
