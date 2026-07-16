import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function hover(page: Page, params: ActionConfig): Promise<void> {
	if (!params.selector) {
		throw new Error("Action 'hover' requires a 'selector'.");
	}
	await page.hover(params.selector);
}
