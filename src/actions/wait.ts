import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function wait(page: Page, params: ActionConfig): Promise<void> {
	if (params.value === undefined) {
		throw new Error("Action 'wait' requires a numeric 'value' in milliseconds.");
	}
	const ms = Number(params.value);
	if (Number.isNaN(ms) || ms < 0) {
		throw new Error(`Wait value must be a number >= 0, received: ${params.value}`);
	}
	await page.waitForTimeout(ms);
}
