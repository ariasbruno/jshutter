import type { Page } from "playwright";

export interface ViewportConfig {
	width: number;
	height: number;
}

export type ColorScheme = "light" | "dark" | "no-preference";
export type ScreenshotFormat = "png" | "jpeg";

interface ActionField {
	selector: string;
	value: string;
	clear?: boolean;
}

export interface ActionConfig {
	type: string;
	selector?: string;
	value?: string | number | boolean;
	optional?: boolean;
	clear?: boolean;
	output?: string;
	url?: string;
	timeout?: number;
	fields?: ActionField[];
	key?: string;
	script?: string;
	name?: string;
	storageType?: "local" | "session";
}

export type ViewportTarget = string | ViewportConfig;
export type SingleOrArray<T> = T | T[];

export interface GlobalConfig {
	baseUrl?: string;
	baseOutputDir?: string;
	viewport?: SingleOrArray<ViewportTarget>;
	fullPage?: boolean;
	maxPageHeight?: number;
	delay?: number;
	format?: ScreenshotFormat;
	quality?: number;
	timeout?: number;
	userAgent?: string | null;
	colorScheme?: ColorScheme;
	actions?: ActionConfig[];
	report?: "json" | "html" | "all" | "none";
	embedBase64?: boolean;
	headed?: boolean;
	parallel?: number;
	saveStorageState?: string;
	storageState?: string;
}

export interface TaskConfig {
	id: string;
	url: string;
	viewport?: SingleOrArray<ViewportTarget>;
	output: string;
	fullPage?: boolean;
	maxPageHeight?: number;
	delay?: number;
	format?: ScreenshotFormat;
	quality?: number;
	colorScheme?: ColorScheme;
	timeout?: number;
	userAgent?: string | null;
	tags?: string[];
	actions?: ActionConfig[];
	saveStorageState?: string;
	storageState?: string;
}

export interface JshutterConfig {
	global?: GlobalConfig;
	presets?: Record<string, ViewportConfig>;
	macros?: Record<string, string>;
	setupTasks?: TaskConfig[];
	tasks: TaskConfig[];
}

export interface TaskResult {
	id: string;
	url: string;
	status: "passed" | "failed" | "skipped";
	output: string | null;
	viewport: ViewportConfig;
	duration: number;
	error: string | null;
	tags?: string[];
	actions?: ActionConfig[];
	delay?: number;
	fullPage?: boolean;
	maxPageHeight?: number;
	format?: ScreenshotFormat;
	quality?: number;
	timeout?: number;
	colorScheme?: ColorScheme;
	userAgent?: string | null;
}

export interface ResolvedTaskConfig {
	id: string;
	url: string;
	viewport: ViewportConfig;
	output: string; // Absolute path
	fullPage: boolean;
	maxPageHeight: number;
	delay: number;
	format: ScreenshotFormat;
	quality: number;
	colorScheme: ColorScheme;
	timeout: number;
	userAgent: string | null;
	tags: string[];
	actions: ActionConfig[];
	saveStorageState?: string;
	storageState?: string;
}

export interface ResolvedJshutterConfig {
	baseOutputDir: string; // Absolute path
	setupTasks: ResolvedTaskConfig[];
	tasks: ResolvedTaskConfig[];
	report?: "json" | "html" | "all" | "none";
	embedBase64: boolean;
	headed?: boolean;
	parallel?: number;
}

export interface ResolvedViewportInfo {
	viewport: ViewportConfig;
	suffix: string;
}

export interface EngineOptions {
	headed?: boolean;
	verbose?: boolean;
	silent?: boolean;
	taskFilter?: string;
	tagFilter?: string;
	browserType?: "chromium" | "firefox" | "webkit";
	parallel?: number;
}

export interface ActionContext {
	baseOutputDir: string;
	taskTimeout: number;
}

export type ActionHandler = (page: Page, params: ActionConfig, context: ActionContext) => Promise<void>;

export interface RunOptions {
	headed?: boolean;
	verbose: boolean;
	silent: boolean;
	report?: string;
	dryRun: boolean;
	task?: string;
	tag?: string;
	browser: string;
	parallel?: string;
	force?: boolean;
}

export interface JsonReportData {
	timestamp: string;
	config: string;
	duration: number;
	summary: {
		total: number;
		passed: number;
		failed: number;
		skipped: number;
	};
	tasks: TaskResult[];
}
