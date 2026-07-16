import fs from "node:fs/promises";
import path from "node:path";
import type { TaskResult, JsonReportData, ActionConfig } from "../types";

export async function generateJsonReport(
	results: TaskResult[],
	configPath: string,
	baseOutputDir: string,
	totalDuration: number
): Promise<string> {
	const timestamp = new Date().toISOString();

	const summary = {
		total: results.length,
		passed: results.filter((r) => r.status === "passed").length,
		failed: results.filter((r) => r.status === "failed").length,
		skipped: results.filter((r) => r.status === "skipped").length
	};

	const reportData: JsonReportData = {
		timestamp,
		config: path.basename(configPath),
		duration: totalDuration,
		summary,
		tasks: results.map((r) => ({
			...r,
			actions: sanitizeActions(r.actions),
			output: r.output ? path.relative(baseOutputDir, r.output) : null
		}))
	};

	const reportPath = path.resolve(baseOutputDir, "jshutter-report.json");
	await fs.mkdir(baseOutputDir, { recursive: true });
	await fs.writeFile(reportPath, `${JSON.stringify(reportData, null, "\t")}\n`);
	return reportPath;
}

function sanitizeActions(actions: ActionConfig[] | undefined): ActionConfig[] | undefined {
	if (!actions) return undefined;
	const sensitiveRegex = /pass|password|key|secret|token|credit_card|card_num|cvv|pin|email/i;
	return actions.map(act => {
		const newAct = { ...act };
		if (newAct.type === "type" && newAct.selector && sensitiveRegex.test(newAct.selector)) {
			newAct.value = "********";
		}
		if (newAct.type === "fill_form" && newAct.fields && Array.isArray(newAct.fields)) {
			newAct.fields = newAct.fields.map(field => {
				if (sensitiveRegex.test(field.selector)) {
					return { ...field, value: "********" };
				}
				return field;
			});
		}
		if (newAct.type === "set_storage" && newAct.key && sensitiveRegex.test(newAct.key)) {
			newAct.value = "********";
		}
		return newAct;
	});
}
