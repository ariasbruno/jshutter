import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function fillForm(page: Page, params: ActionConfig): Promise<void> {
	if (!params.fields || !Array.isArray(params.fields)) {
		throw new Error("Action 'fill_form' requires a 'fields' array.");
	}

	for (const field of params.fields) {
		if (!field.selector) {
			throw new Error("Each field in 'fill_form' requires a 'selector'.");
		}
		const val = field.value !== undefined ? String(field.value) : "";
		const locator = page.locator(field.selector);

		if (field.clear) {
			await locator.fill(val);
		} else {
			await locator.focus();
			await locator.pressSequentially(val);
		}
	}
}
