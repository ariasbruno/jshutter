import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function evaluate(page: Page, params: ActionConfig): Promise<void> {
	if (!params.script) {
		throw new Error("Action 'evaluate' requires a 'script' parameter.");
	}
	await page.evaluate(params.script);
}
