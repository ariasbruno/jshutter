import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function scroll(page: Page, params: ActionConfig): Promise<void> {
	if (params.value === undefined) {
		throw new Error("Action 'scroll' requires a 'value' (number, 'down', or 'up').");
	}

	const val = params.value;

	if (typeof val === "number") {
		await page.evaluate((top) => {
			window.scrollTo({ top, behavior: "auto" });
		}, val);
	} else if (val === "down") {
		await page.evaluate(() => {
			window.scrollBy({ top: window.innerHeight, behavior: "smooth" });
		});
		await page.waitForTimeout(500);
	} else if (val === "up") {
		await page.evaluate(() => {
			window.scrollBy({ top: -window.innerHeight, behavior: "smooth" });
		});
		await page.waitForTimeout(500);
	} else if (val === "lazy" || val === "bottom") {
		await page.evaluate(async () => {
			await new Promise<void>((resolve) => {
				let totalHeight = 0;
				const distance = 400;
				const timer = setInterval(() => {
					const doc = window.document;
					const scrollHeight = Math.max(
						doc.body.scrollHeight,
						doc.documentElement.scrollHeight
					);
					window.scrollBy(0, distance);
					totalHeight += distance;

					if (totalHeight >= scrollHeight - window.innerHeight) {
						clearInterval(timer);
						window.scrollTo(0, 0);
						resolve();
					}
				}, 100);
			});
		});
		await page.waitForTimeout(1000);
	} else {
		const parsed = parseFloat(String(val));
		if (Number.isNaN(parsed)) {
			throw new Error(`Invalid scroll value: '${val}'. Must be a number, 'down', 'up', 'lazy', or 'bottom'.`);
		}
		await page.evaluate((top) => {
			window.scrollTo({ top, behavior: "auto" });
		}, parsed);
	}
}
