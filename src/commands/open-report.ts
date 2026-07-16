import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { resolveConfigPath, loadConfig } from "../config/loader";

export async function openReportCommand(configPathArg?: string): Promise<void> {
	let reportPath = "";
	try {
		// 1. Try to load config to locate the output base directory
		const configPath = await resolveConfigPath(configPathArg);
		const resolvedConfig = await loadConfig(configPath);
		reportPath = path.join(resolvedConfig.baseOutputDir, "jshutter-report.html");
	} catch {
		// 2. Fallback to common paths if JSON cannot be resolved/loaded
		const pathsToTry = [
			"./output/jshutter-report.html",
			"./jshutter/output/jshutter-report.html",
			"./jshutter-report.html"
		];
		for (const p of pathsToTry) {
			try {
				const abs = path.resolve(p);
				await fs.access(abs);
				reportPath = abs;
				break;
			} catch {}
		}
	}

	if (!reportPath) {
		console.error("\x1b[31mError: Could not locate any HTML report (jshutter-report.html).\x1b[0m");
		console.error("Make sure to run your captures first using the '--report html' flag.");
		process.exit(1);
	}

	const absolutePath = path.resolve(reportPath);
	try {
		await fs.access(absolutePath);
	} catch {
		console.error(`\x1b[31mError: Report file does not exist at: ${absolutePath}\x1b[0m`);
		process.exit(1);
	}

	console.log(`Opening report in browser: \x1b[1m${reportPath}\x1b[0m`);

	const platform = process.platform;
	let command = "";
	if (platform === "darwin") {
		command = `open "${absolutePath}"`;
	} else if (platform === "win32") {
		command = `start "" "${absolutePath}"`;
	} else {
		command = `xdg-open "${absolutePath}"`;
	}

	exec(command, (error) => {
		if (error) {
			console.error(`\x1b[31mError opening browser:\x1b[0m ${error.message}`);
			process.exit(1);
		}
		process.exit(0);
	});
}
