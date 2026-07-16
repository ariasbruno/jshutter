import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function keyboard(page: Page, params: ActionConfig): Promise<void> {
	if (!params.key) {
		throw new Error("Action 'keyboard' requires a 'key' parameter.");
	}
	await page.keyboard.press(params.key);
}
