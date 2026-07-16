import type { Page } from "playwright";
import type { ActionConfig, ActionContext } from "../types";
import path from "node:path";
import fs from "node:fs/promises";

export async function screenshot(page: Page, params: ActionConfig, context: ActionContext): Promise<void> {
	if (!params.output) {
		throw new Error("Action 'screenshot' requires an 'output' parameter with the file path.");
	}

	const absolutePath = path.resolve(context.baseOutputDir, params.output);
	const directory = path.dirname(absolutePath);

	await fs.mkdir(directory, { recursive: true });
	await page.screenshot({ path: absolutePath });
}
