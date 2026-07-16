import fs from "node:fs/promises";
import path from "node:path";
import type { ActionConfig } from "../types";
import { resolveTaskUrl } from "./url-resolver";

export async function resolveActions(
	rawActions: ActionConfig[],
	baseUrl: string | undefined,
	macros: Record<string, string> | undefined,
	configDir: string,
	resolvedId: string
): Promise<ActionConfig[]> {
	const resolvedActions: ActionConfig[] = [];
	for (const act of rawActions) {
		const clonedAct = { ...act };
		if (clonedAct.type === "macro") {
			if (!clonedAct.name) {
				throw new Error(`Macro action in task '${resolvedId}' must have a defined 'name'.`);
			}
			const macroRelativePath = macros ? macros[clonedAct.name] : undefined;
			if (!macroRelativePath) {
				throw new Error(`Macro '${clonedAct.name}' referenced in task '${resolvedId}' is not registered in the 'macros' block.`);
			}
			const absoluteMacroPath = path.resolve(configDir, macroRelativePath);
			try {
				clonedAct.script = await fs.readFile(absoluteMacroPath, "utf-8");
			} catch (error) {
				throw new Error(`Could not read macro file '${clonedAct.name}' at ${absoluteMacroPath}: ${(error as Error).message}`);
			}
		} else if (clonedAct.type === "navigate") {
			if (!clonedAct.url) {
				throw new Error(`Navigate action in task '${resolvedId}' requires a defined 'url'.`);
			}
			clonedAct.url = resolveTaskUrl(clonedAct.url, baseUrl, resolvedId);
		}
		resolvedActions.push(clonedAct);
	}
	return resolvedActions;
}
