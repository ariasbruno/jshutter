import { chromium, firefox, webkit } from "playwright";
import type { Browser } from "playwright";
import path from "node:path";
import { executeSingleTask } from "./engine/task-runner";
import type { ResolvedJshutterConfig, TaskResult, EngineOptions } from "./types";
import { VERSION } from "./version";

const color = {
	yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
	gray: (text: string) => `\x1b[90m${text}\x1b[0m`,
	bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
	green: (text: string) => `\x1b[32m${text}\x1b[0m`,
	red: (text: string) => `\x1b[31m${text}\x1b[0m`
};

export async function runEngine(
	resolvedConfig: ResolvedJshutterConfig,
	options: EngineOptions = {}
): Promise<TaskResult[]> {
	const results: TaskResult[] = [];
	const totalStartTime = Date.now();

	if (!options.silent) {
		console.log(`\n${color.bold(`jshutter v${VERSION}`)}\n`);
		console.log(`  ▸ Running ${resolvedConfig.tasks.length} tasks from config\n`);
	}

	// Filter tasks to execute
	const tasksToExecute = resolvedConfig.tasks.filter((task) => {
		if (options.taskFilter && task.id !== options.taskFilter) return false;
		if (options.tagFilter && !task.tags?.includes(options.tagFilter)) return false;
		return true;
	});

	// Initialize Browser based on browserType option
	let browser: Browser | null = null;
	const browserName = options.browserType || "chromium";
	const browserLauncher = { chromium, firefox, webkit }[browserName];

	if (!browserLauncher) {
		throw new Error(`Unsupported browser: '${browserName}'`);
	}

	const hasActiveTasks = tasksToExecute.length > 0 || resolvedConfig.setupTasks.length > 0;

	if (hasActiveTasks) {
		try {
			browser = await browserLauncher.launch({ headless: !options.headed });
		} catch (err) {
			const msg = (err as Error).message;
			if (msg.includes("Executable doesn't exist") || msg.includes("looks like Playwright was just installed") || msg.includes("playwright install")) {
				throw new Error(`Browser '${browserName}' is not installed.\n\n\x1b[33m▸ Please install the required binaries by running:\n  \x1b[1mbunx playwright install ${browserName}\x1b[0m\n`);
			}
			throw new Error(`Failed to launch browser '${browserName}': ${msg}`);
		}
	}

	// 1. Process and record skipped tasks first
	for (const task of resolvedConfig.tasks) {
		let isSkipped = false;
		let skipReason = "";

		if (options.taskFilter && task.id !== options.taskFilter) {
			isSkipped = true;
			skipReason = "--task filter";
		} else if (options.tagFilter && !task.tags?.includes(options.tagFilter)) {
			isSkipped = true;
			skipReason = "--tag filter";
		}

		if (isSkipped) {
			const viewportStr = task.viewport ? `${task.viewport.width}x${task.viewport.height}` : "default";
			const result: TaskResult = {
				id: task.id,
				url: task.url,
				status: "skipped",
				output: null,
				viewport: task.viewport,
				duration: 0,
				error: null,
				tags: task.tags,
				actions: task.actions,
				delay: task.delay,
				fullPage: task.fullPage,
				format: task.format,
				quality: task.quality,
				timeout: task.timeout
			};
			results.push(result);

			if (!options.silent) {
				const relativeOutput = path.relative(resolvedConfig.baseOutputDir, task.output);
				console.log(
					`  ${color.yellow("⊘")} ${task.id.padEnd(25)} ${viewportStr.padEnd(12)} → ${relativeOutput.padEnd(30)} ${color.gray(`(SKIPPED: ${skipReason})`)}`
				);
			}
		}
	}

	// 2. Execute setup tasks sequentially if any and not skipped
	if (browser && resolvedConfig.setupTasks.length > 0) {
		if (!options.silent) {
			console.log(`  ▸ Running ${resolvedConfig.setupTasks.length} setup tasks sequentially...\n`);
		}
		const activeBrowser = browser;
		for (const task of resolvedConfig.setupTasks) {
			const result = await executeSingleTask(task, activeBrowser, {
				verbose: options.verbose,
				silent: options.silent,
				baseOutputDir: resolvedConfig.baseOutputDir
			});
			results.push(result);
			if (result.status === "failed") {
				throw new Error(`Setup task '${task.id}' failed: ${result.error}. Aborting captures.`);
			}
		}
	}

	// 3. Execute active tasks concurrently using a pool limit
	if (browser && tasksToExecute.length > 0) {
		const activeBrowser = browser;
		const limit = options.parallel || 1;
		const queue = [...tasksToExecute];

		const runWorker = async () => {
			while (queue.length > 0) {
				const task = queue.shift();
				if (!task) break;

				const result = await executeSingleTask(task, activeBrowser, {
					verbose: options.verbose,
					silent: options.silent,
					baseOutputDir: resolvedConfig.baseOutputDir
				});
				results.push(result);
			}
		};

		const workers = Array.from({ length: Math.min(limit, tasksToExecute.length) }, runWorker);
		await Promise.all(workers);
	}

	if (browser) {
		await browser.close();
	}

	const totalDuration = Date.now() - totalStartTime;

	if (!options.silent) {
		const passedCount = results.filter((r) => r.status === "passed").length;
		const failedCount = results.filter((r) => r.status === "failed").length;
		const skippedCount = results.filter((r) => r.status === "skipped").length;

		console.log(`\n  ${color.gray("─────────────────────────────────────────")}`);
		console.log(
			`  ${color.bold("Results:")} ${color.green(`${passedCount} passed`)} · ${color.red(`${failedCount} failed`)} · ${color.yellow(`${skippedCount} skipped`)}`
		);
		console.log(`  ${color.bold("Duration:")} ${(totalDuration / 1000).toFixed(1)}s`);
		console.log(`  ${color.bold("Output:")} ${resolvedConfig.baseOutputDir}\n`);
	}

	return results;
}
