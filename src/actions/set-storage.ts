import type { Page } from "playwright";
import type { ActionConfig } from "../types";

export async function setStorage(page: Page, params: ActionConfig): Promise<void> {
	if (!params.key) {
		throw new Error("Action 'set_storage' requires a 'key' parameter.");
	}
	if (params.value === undefined) {
		throw new Error("Action 'set_storage' requires a 'value' parameter.");
	}

	const serializedValue = typeof params.value === "string" ? params.value : JSON.stringify(params.value);

	await page.evaluate(({ key, value, storageType }) => {
		const storage = storageType === "session" ? sessionStorage : localStorage;
		storage.setItem(key, value);
	}, { key: params.key, value: serializedValue, storageType: params.storageType ?? "local" });
}
