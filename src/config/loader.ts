import fs from "node:fs/promises";
import path from "node:path";
import { BUILTIN_PRESETS } from "./presets";
import type {
	JshutterConfig,
	ViewportConfig,
	ScreenshotFormat,
	ResolvedTaskConfig,
	ResolvedJshutterConfig,
	TaskConfig,
	GlobalConfig
} from "../types";
import { insertSuffixToPath, resolveTaskUrl } from "./url-resolver";
import { resolveTaskViewports } from "./viewport-resolver";
import { resolveActions } from "./action-resolver";

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

export async function loadConfig(configPath: string, silent?: boolean): Promise<ResolvedJshutterConfig> {
	const absoluteConfigPath = path.resolve(configPath);
	const configDir = path.dirname(absoluteConfigPath);

	let configText: string;
	try {
		configText = await fs.readFile(absoluteConfigPath, "utf-8");
	} catch (error) {
		throw new Error(`Could not read configuration file at ${configPath}: ${(error as Error).message}`);
	}

	let config: JshutterConfig;
	try {
		config = JSON.parse(configText);
		config = interpolateConfig(config, silent);
	} catch (error) {
		throw new Error(`Configuration file is not valid JSON: ${(error as Error).message}`);
	}

	if (!config.tasks || !Array.isArray(config.tasks) || config.tasks.length === 0) {
		throw new Error("Configuration file must contain a non-empty 'tasks' array.");
	}

	const global = config.global || {};
	const customPresets = config.presets || {};
	const presets = { ...BUILTIN_PRESETS, ...customPresets };

	const baseOutputDir = path.resolve(configDir, global.baseOutputDir || "./output");

	const taskIds = new Set<string>();

	const resolvedSetupTasks: ResolvedTaskConfig[] = [];
	if (config.setupTasks && Array.isArray(config.setupTasks)) {
		for (const task of config.setupTasks) {
			const resolved = await resolveTask(task, global, presets, configDir, baseOutputDir, config.macros, taskIds);
			resolvedSetupTasks.push(...resolved);
		}
	}

	const resolvedTasks: ResolvedTaskConfig[] = [];
	for (const task of config.tasks) {
		const resolved = await resolveTask(task, global, presets, configDir, baseOutputDir, config.macros, taskIds);
		resolvedTasks.push(...resolved);
	}

	return {
		baseOutputDir,
		setupTasks: resolvedSetupTasks,
		tasks: resolvedTasks,
		report: global.report,
		embedBase64: global.embedBase64 !== false,
		headed: global.headed,
		parallel: global.parallel
	};
}

export async function resolveConfigPath(configPathArg?: string): Promise<string> {
	// 1. No argument specified
	if (!configPathArg) {
		if (await fileExists("./jshutter.json")) {
			return "./jshutter.json";
		}
		if (await fileExists("./jshutter/jshutter.json")) {
			return "./jshutter/jshutter.json";
		}
		return "./jshutter.json"; // Fallback to fail with classic error if neither exists
	}

	// 2. Argument specified, check if it exists directly
	if (await fileExists(configPathArg)) {
		return configPathArg;
	}

	// 3. Try inside jshutter/ folder with extension
	const pathWithExtension = path.join("./jshutter", configPathArg.endsWith(".json") ? configPathArg : `${configPathArg}.json`);
	if (await fileExists(pathWithExtension)) {
		return pathWithExtension;
	}

	// 4. Try inside jshutter/ folder without modifying extension
	const directPathInFolder = path.join("./jshutter", configPathArg);
	if (await fileExists(directPathInFolder)) {
		return directPathInFolder;
	}

	return configPathArg; // Fallback
}

/* --- Private Helper Functions --- */

async function resolveTask(
	task: TaskConfig,
	global: GlobalConfig,
	presets: Record<string, ViewportConfig>,
	configDir: string,
	baseOutputDir: string,
	configMacros: Record<string, string> | undefined,
	taskIds: Set<string>
): Promise<ResolvedTaskConfig[]> {
	if (!task.id) {
		throw new Error("All tasks must have a defined 'id'.");
	}
	if (!task.url) {
		throw new Error(`Task '${task.id}' must have a defined 'url'.`);
	}
	if (!task.output) {
		throw new Error(`Task '${task.id}' must have a defined 'output' path.`);
	}

	const resolvedUrl = resolveTaskUrl(task.url, global.baseUrl, task.id);
	const uniqueTaskViewports = resolveTaskViewports(task.viewport, global.viewport, presets, task.id);
	const useSuffix = uniqueTaskViewports.length > 1;
	const resolvedTasks: ResolvedTaskConfig[] = [];

	for (const vpInfo of uniqueTaskViewports) {
		const resolvedId = useSuffix ? `${task.id}-${vpInfo.suffix}` : task.id;

		if (taskIds.has(resolvedId)) {
			throw new Error(`Task ID '${resolvedId}' is duplicated (possibly due to viewport expansion).`);
		}
		taskIds.add(resolvedId);

		const viewport = vpInfo.viewport;
		if (typeof viewport.width !== "number" || viewport.width <= 0) {
			throw new Error(`Viewport width for task '${resolvedId}' must be a positive number.`);
		}
		if (typeof viewport.height !== "number" || viewport.height <= 0) {
			throw new Error(`Viewport height for task '${resolvedId}' must be a positive number.`);
		}

		const delay = task.delay ?? global.delay ?? 500;
		if (typeof delay !== "number" || delay < 0) {
			throw new Error(`Delay for task '${resolvedId}' must be a number >= 0.`);
		}

		const timeout = task.timeout ?? global.timeout ?? 30000;
		if (typeof timeout !== "number" || timeout < 0) {
			throw new Error(`Timeout for task '${resolvedId}' must be a number >= 0.`);
		}

		const maxPageHeight = task.maxPageHeight ?? global.maxPageHeight ?? 8000;
		if (typeof maxPageHeight !== "number" || maxPageHeight < 0) {
			throw new Error(`maxPageHeight for task '${resolvedId}' must be a number >= 0.`);
		}

		// Format resolution
		const finalOutputName = useSuffix ? insertSuffixToPath(task.output, vpInfo.suffix) : task.output;
		const ext = path.extname(finalOutputName).toLowerCase();
		const inferredFormat: ScreenshotFormat | null = (ext === ".jpg" || ext === ".jpeg") ? "jpeg" : (ext === ".png" ? "png" : null);

		const format: ScreenshotFormat = task.format ?? global.format ?? inferredFormat ?? "png";
		if (format !== "png" && format !== "jpeg") {
			throw new Error(`Format for task '${resolvedId}' must be 'png' or 'jpeg'.`);
		}

		const quality = task.quality ?? global.quality ?? 100;
		if (typeof quality !== "number" || quality < 0 || quality > 100) {
			throw new Error(`Quality for task '${resolvedId}' must be a number between 0 and 100.`);
		}

		const colorScheme = task.colorScheme ?? global.colorScheme ?? "light";
		if (colorScheme !== "light" && colorScheme !== "dark" && colorScheme !== "no-preference") {
			throw new Error(`colorScheme for task '${resolvedId}' must be 'light', 'dark', or 'no-preference'.`);
		}

		const userAgent = task.userAgent !== undefined ? task.userAgent : (global.userAgent !== undefined ? global.userAgent : null);
		const taskOutput = path.resolve(baseOutputDir, finalOutputName);

		const rawActions = task.actions ?? global.actions ?? [];
		const resolvedActions = await resolveActions(rawActions, global.baseUrl, configMacros, configDir, resolvedId);

		const rawSaveStorageState = task.saveStorageState ?? global.saveStorageState;
		const saveStorageState = rawSaveStorageState
			? path.resolve(configDir, rawSaveStorageState)
			: undefined;

		const rawStorageState = task.storageState ?? global.storageState;
		const storageState = rawStorageState
			? path.resolve(configDir, rawStorageState)
			: undefined;

		resolvedTasks.push({
			id: resolvedId,
			url: resolvedUrl,
			viewport,
			output: taskOutput,
			fullPage: task.fullPage ?? global.fullPage ?? false,
			maxPageHeight,
			delay,
			format,
			quality,
			colorScheme,
			timeout,
			userAgent,
			tags: task.tags ?? [],
			actions: resolvedActions,
			saveStorageState,
			storageState
		});
	}

	return resolvedTasks;
}

function interpolateConfig<T>(obj: T, silent?: boolean): T {
	if (obj === null || obj === undefined) {
		return obj;
	}
	if (typeof obj === "string") {
		const result = obj.replace(/\$env\.([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => {
			const envVal = process.env[name];
			if (envVal === undefined) {
				if (!silent) {
					console.warn(`\x1b[33m⚠️ Warning: Environment variable '${name}' is not defined.\x1b[0m`);
				}
				return "";
			}
			return envVal;
		});
		return result as unknown as T;
	}
	if (Array.isArray(obj)) {
		return obj.map((item) => interpolateConfig(item, silent)) as unknown as T;
	}
	if (typeof obj === "object") {
		const res: Record<string, unknown> = {};
		const rawObj = obj as Record<string, unknown>;
		for (const key of Object.keys(rawObj)) {
			res[key] = interpolateConfig(rawObj[key], silent);
		}
		return res as unknown as T;
	}
	return obj;
}
