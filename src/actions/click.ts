import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function click(page: Page, params: ActionConfig): Promise<void> {
	if (!params.selector) {
		throw new Error("Action 'click' requires a 'selector'.");
	}
	try {
		await page.click(params.selector);
	} catch (error) {
		if (params.optional) {
			return;
		}
		throw error;
	}
}
