import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function navigate(page: Page, params: ActionConfig): Promise<void> {
	if (!params.url) {
		throw new Error("Action 'navigate' requires a 'url'.");
	}
	await page.goto(params.url, { waitUntil: "load" });
}
