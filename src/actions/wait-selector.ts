import type { Page } from "playwright";
import type { ActionConfig, ActionContext } from "../types";

export async function waitSelector(page: Page, params: ActionConfig, context: ActionContext): Promise<void> {
	if (!params.selector) {
		throw new Error("Action 'wait_selector' requires a 'selector'.");
	}
	const timeout = params.timeout ?? context.taskTimeout;
	await page.waitForSelector(params.selector, { timeout });
}
