import type { Browser, BrowserContext, BrowserContextOptions } from "playwright";
import path from "node:path";
import fs from "node:fs/promises";
import { executeAction } from "../actions";
import type { ResolvedTaskConfig, TaskResult } from "../types";

interface TaskRunnerOptions {
	verbose?: boolean;
	silent?: boolean;
	baseOutputDir: string;
}

const color = {
	green: (text: string) => `\x1b[32m${text}\x1b[0m`,
	red: (text: string) => `\x1b[31m${text}\x1b[0m`,
	gray: (text: string) => `\x1b[90m${text}\x1b[0m`
};

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
	let timer: ReturnType<typeof setTimeout> | undefined = undefined;
	const timeoutPromise = new Promise<never>((_, reject) => {
		timer = setTimeout(() => {
			reject(new Error(errorMsg));
		}, timeoutMs);
	});
	try {
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timer) {
			clearTimeout(timer);
		}
	}
}

export async function executeSingleTask(
	task: ResolvedTaskConfig,
	browser: Browser,
	options: TaskRunnerOptions
): Promise<TaskResult> {
	const viewportStr = task.viewport ? `${task.viewport.width}x${task.viewport.height}` : "default";
	const taskStartTime = Date.now();
	let status: "passed" | "failed" | "skipped" = "passed";
	let errorMsg: string | null = null;
	let context: BrowserContext | null = null;

	try {
		const contextOptions: BrowserContextOptions = {
			viewport: task.viewport,
			colorScheme: task.colorScheme !== "no-preference" ? task.colorScheme : undefined,
			userAgent: task.userAgent || undefined
		};

		if (task.storageState) {
			let exists = false;
			try {
				await fs.access(task.storageState);
				exists = true;
			} catch {}
			if (exists) {
				contextOptions.storageState = task.storageState;
				if (options.verbose && !options.silent) {
					console.log(`  [${task.id}] Loading session state from: ${task.storageState}`);
				}
			} else if (options.verbose && !options.silent) {
				console.log(`  [${task.id}] Session file not found: ${task.storageState}`);
			}
		}

		context = await browser.newContext(contextOptions);

		const activeContext = context;

		const runTaskPromise = (async () => {
			const page = await activeContext.newPage();

			if (options.verbose && !options.silent) {
				console.log(`  [${task.id}] Navigating to ${task.url}`);
			}

			await page.goto(task.url, { waitUntil: "load" });

			if (task.delay > 0) {
				if (options.verbose && !options.silent) {
					console.log(`  [${task.id}] Waiting delay of ${task.delay}ms`);
				}
				await page.waitForTimeout(task.delay);
			}

			// Run actions
			for (const action of task.actions) {
				if (options.verbose && !options.silent) {
					console.log(`  [${task.id}] Executing action: ${action.type}`, action);
				}
				await executeAction(page, action, {
					baseOutputDir: options.baseOutputDir,
					taskTimeout: task.timeout
				});
			}

			// Take final screenshot
			if (options.verbose && !options.silent) {
				console.log(`  [${task.id}] Saving final screenshot to: ${task.output}`);
			}
			await fs.mkdir(path.dirname(task.output), { recursive: true });

			let finalFullPage = task.fullPage;
			if (task.fullPage && task.maxPageHeight > 0) {
				const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
				if (scrollHeight > task.maxPageHeight) {
					if (options.verbose && !options.silent) {
						console.log(`  [${task.id}] Page height (${scrollHeight}px) exceeds maxPageHeight (${task.maxPageHeight}px). Resizing viewport.`);
					}
					await page.setViewportSize({
						width: task.viewport.width,
						height: task.maxPageHeight
					});
					finalFullPage = false;
				}
			}

			await page.screenshot({
				path: task.output,
				fullPage: finalFullPage,
				type: task.format,
				quality: task.format === "jpeg" ? task.quality : undefined
			});
		})();

		if (task.timeout > 0) {
			await withTimeout(
				runTaskPromise,
				task.timeout,
				`TimeoutError: waiting for task execution exceeded ${task.timeout}ms`
			);
		} else {
			await runTaskPromise;
		}

		if (task.saveStorageState && context) {
			if (options.verbose && !options.silent) {
				console.log(`  [${task.id}] Saving session state to: ${task.saveStorageState}`);
			}
			await context.storageState({ path: task.saveStorageState });
		}
	} catch (error) {
		status = "failed";
		errorMsg = (error as Error).message || String(error);
		if (options.verbose && !options.silent) {
			console.error(`  [${task.id}] Error during execution:`, error);
		}
	} finally {
		if (context) {
			await context.close().catch(() => {});
		}
	}

	const taskDuration = Date.now() - taskStartTime;
	const relativeOutput = path.relative(options.baseOutputDir, task.output);

	if (!options.silent) {
		const durationStr = `(${(taskDuration / 1000).toFixed(1)}s)`;
		if (status === "passed") {
			console.log(
				`  ${color.green("✓")} ${task.id.padEnd(25)} ${viewportStr.padEnd(12)} → ${relativeOutput.padEnd(30)} ${color.gray(durationStr)}`
			);
		} else {
			console.log(
				`  ${color.red("✗")} ${task.id.padEnd(25)} ${viewportStr.padEnd(12)} → ${relativeOutput.padEnd(30)} ${color.red(`(ERROR: ${errorMsg})`)}`
			);
		}
	}

	return {
		id: task.id,
		url: task.url,
		status,
		output: status === "passed" ? task.output : null,
		viewport: task.viewport,
		duration: taskDuration,
		error: errorMsg,
		tags: task.tags,
		actions: task.actions,
		delay: task.delay,
		fullPage: task.fullPage,
		maxPageHeight: task.maxPageHeight,
		format: task.format,
		quality: task.quality,
		timeout: task.timeout,
		colorScheme: task.colorScheme,
		userAgent: task.userAgent
	};
}
