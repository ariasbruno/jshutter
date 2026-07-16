import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function select(page: Page, params: ActionConfig): Promise<void> {
	if (!params.selector) {
		throw new Error("Action 'select' requires a 'selector'.");
	}
	if (params.value === undefined) {
		throw new Error("Action 'select' requires a 'value' to select.");
	}
	await page.selectOption(params.selector, String(params.value));
}
