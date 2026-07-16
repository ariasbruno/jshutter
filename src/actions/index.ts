import type { Page } from "playwright";
import type { ActionConfig, ActionContext, ActionHandler } from "../types";

import { click } from "./click";
import { type as typeAction } from "./type";
import { hover } from "./hover";
import { scroll } from "./scroll";
import { wait } from "./wait";
import { waitSelector } from "./wait-selector";
import { screenshot } from "./screenshot";
import { navigate } from "./navigate";
import { select } from "./select";
import { fillForm } from "./fill-form";
import { keyboard } from "./keyboard";
import { evaluate } from "./evaluate";
import { waitNavigation } from "./wait-navigation";
import { waitNetworkIdle } from "./wait-network-idle";
import { hide } from "./hide";
import { setStorage } from "./set-storage";

const ACTION_REGISTRY: Record<string, ActionHandler> = {
	click,
	type: typeAction,
	hover,
	scroll,
	wait,
	wait_selector: waitSelector,
	screenshot,
	navigate,
	select,
	fill_form: fillForm,
	keyboard,
	evaluate,
	wait_navigation: waitNavigation,
	wait_network_idle: waitNetworkIdle,
	hide,
	set_storage: setStorage,
	macro: evaluate
};

export async function executeAction(page: Page, action: ActionConfig, context: ActionContext): Promise<void> {
	const handler = ACTION_REGISTRY[action.type];
	if (!handler) {
		throw new Error(`Unsupported or unknown action: '${action.type}'`);
	}
	await handler(page, action, context);
}
