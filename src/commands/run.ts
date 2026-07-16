import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import readline from "node:readline";
import { loadConfig, resolveConfigPath } from "../config/loader";
import { runEngine } from "../engine";
import { generateJsonReport } from "../reporter/json-reporter";
import { generateHtmlReport } from "../reporter/html-reporter";
import { VERSION } from "../version";

import type { RunOptions } from "../types";

const execAsync = promisify(exec);

async function checkGitIgnore(filePath: string): Promise<boolean> {
	try {
		await execAsync(`git check-ignore "${filePath}"`);
		return true; // Ignored
	} catch {
		return false; // Not ignored
	}
}

export async function runCommand(configPathArg: string | undefined, options: RunOptions): Promise<void> {
	try {
		const configPath = await resolveConfigPath(configPathArg);
		// 1. Load and validate configuration
		const resolved = await loadConfig(configPath, options.silent);

		// 1.1 Validate Git warnings for session files (security)
		const sessionFiles = new Set<string>();
		for (const t of [...resolved.setupTasks, ...resolved.tasks]) {
			if (t.saveStorageState) {
				sessionFiles.add(t.saveStorageState);
			}
		}
		for (const file of sessionFiles) {
			const relativePath = path.relative(process.cwd(), file);
			const ignored = await checkGitIgnore(relativePath);
			if (!ignored && !options.silent) {
				console.warn(`\n\x1b[33m⚠️  SECURITY WARNING: Session file '${relativePath}' is not listed in your .gitignore.\x1b[0m`);
				console.warn(`\x1b[33m   It is recommended to ignore it to prevent accidental leakage of active session tokens or cookies.\x1b[0m\n`);
			}
		}

		// 2. Validate task ID exists if --task filter was specified
		if (options.task) {
			const exists = resolved.tasks.some((t) => t.id === options.task);
			if (!exists) {
				const availableIds = resolved.tasks.map((t) => `'${t.id}'`).join(", ");
				throw new Error(`Task with ID '${options.task}' does not exist. Available tasks: ${availableIds}`);
			}
		}

		// 3. Dry-run flow (tabular summary)
		if (options.dryRun) {
			if (!options.silent) {
				console.log(`\n\x1b[1mjshutter v${VERSION} — Dry Run (Task Summary)\x1b[0m\n`);
				console.log(`${"ID".padEnd(25)}${"URL".padEnd(45)}${"Viewport".padEnd(15)}Output`);
				console.log(`─`.repeat(100));
				let count = 0;
				for (const task of resolved.tasks) {
					let isSkipped = false;
					if (options.task && task.id !== options.task) isSkipped = true;
					else if (options.tag && !task.tags?.includes(options.tag)) isSkipped = true;

					if (!isSkipped) {
						const idStr = task.id.padEnd(25);
						const urlStr = (task.url.length > 42 ? `${task.url.substring(0, 39)}...` : task.url).padEnd(45);
						const viewportStr = `${task.viewport.width}x${task.viewport.height}`.padEnd(15);
						const relativeOutput = path.relative(resolved.baseOutputDir, task.output);
						console.log(`${idStr}${urlStr}${viewportStr}${relativeOutput}`);
						count++;
					}
				}
				console.log(`─`.repeat(100));
				console.log(`\nTotal tasks to run: ${count}\n`);
			}
			process.exit(0);
		}

		// 4. Resolver precedencia de opciones (CLI flag > Config file global setting > System default)
		const headed = options.headed !== undefined ? options.headed : (resolved.headed !== undefined ? resolved.headed : false);
		const reportType = (options.report !== undefined ? options.report : (resolved.report !== undefined ? resolved.report : "none")).toLowerCase();

		// 4.5 UX warning for bulk captures (Alert A: HTML report size)
		const isHtmlReport = reportType === "html" || reportType === "all";
		const activeTasksCount = resolved.tasks.filter((task) => {
			if (options.task && task.id !== options.task) return false;
			if (options.tag && !task.tags?.includes(options.tag)) return false;
			return true;
		}).length;

		if (activeTasksCount > 100 && isHtmlReport && resolved.embedBase64 && !options.force && process.stdout.isTTY) {
			if (!options.silent) {
				console.log(`\n\x1b[33m⚠️  BULK REPORT WARNING:\x1b[0m`);
				console.log(`   You are about to generate an HTML report for \x1b[1m${activeTasksCount} captures\x1b[0m with Base64 embedded images.`);
				console.log(`   The resulting file will be very large and may crash your browser when opened.`);
				console.log(`   (Consider setting "embedBase64": false to use relative image paths instead).\n`);
			}

			const confirmed = await new Promise<boolean>((resolve) => {
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout
				});
				rl.question(`   Do you want to continue with Base64 generation anyway? (y/N): `, (answer) => {
					rl.close();
					const sanitized = answer.trim().toLowerCase();
					resolve(sanitized === "s" || sanitized === "si" || sanitized === "y" || sanitized === "yes");
				});
			});

			if (!confirmed) {
				if (!options.silent) {
					console.log(`\nExecution cancelled by user.`);
				}
				process.exit(0);
			}
		}

		const parallel = options.parallel !== undefined ? parseInt(options.parallel, 10) : (resolved.parallel !== undefined ? resolved.parallel : 1);

		const totalStartTime = Date.now();
		const results = await runEngine(resolved, {
			headed,
			verbose: options.verbose,
			silent: options.silent,
			taskFilter: options.task,
			tagFilter: options.tag,
			browserType: options.browser as "chromium" | "firefox" | "webkit",
			parallel
		});
		const totalDuration = Date.now() - totalStartTime;

		// 5. Generate reports if requested
		if (reportType !== "none") {
			const reportsGenerated: string[] = [];
			if (reportType === "json" || reportType === "all") {
				const jsonPath = await generateJsonReport(results, configPath, resolved.baseOutputDir, totalDuration);
				reportsGenerated.push(jsonPath);
			}
			if (reportType === "html" || reportType === "all") {
				const htmlPath = await generateHtmlReport(results, configPath, resolved.baseOutputDir, totalDuration, resolved.embedBase64);
				reportsGenerated.push(htmlPath);
			}

			if (!options.silent && reportsGenerated.length > 0) {
				console.log(`  Report(s) generated:`);
				for (const reportPath of reportsGenerated) {
					console.log(`    → ${reportPath}`);
				}
				console.log();
			}
		}

		// 6. Determine exit code
		const hasFailures = results.some((r) => r.status === "failed");
		if (hasFailures) {
			process.exit(1);
		}
	} catch (error) {
		if (!options.silent) {
			console.error(`\x1b[31mError:\x1b[0m ${(error as Error).message}`);
		}
		process.exit(1);
	}
}
