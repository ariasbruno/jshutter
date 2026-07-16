import type { Page } from "playwright";
import type { ActionConfig, ActionContext } from "../types";

export async function waitNetworkIdle(page: Page, params: ActionConfig, context: ActionContext): Promise<void> {
	const timeout = params.timeout ?? context.taskTimeout;
	await page.waitForLoadState("networkidle", { timeout });
}
