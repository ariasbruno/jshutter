import type {
	ViewportConfig,
	ViewportTarget,
	SingleOrArray,
	ResolvedViewportInfo,
} from "../types";

export function resolveTaskViewports(
	taskViewport: SingleOrArray<ViewportTarget> | undefined,
	globalViewport: SingleOrArray<ViewportTarget> | undefined,
	presets: Record<string, ViewportConfig>,
	taskId: string,
): ResolvedViewportInfo[] {
	let targets: ViewportTarget[] = [];
	if (taskViewport !== undefined) {
		targets = Array.isArray(taskViewport) ? taskViewport : [taskViewport];
	} else if (globalViewport !== undefined) {
		targets = Array.isArray(globalViewport) ? globalViewport : [globalViewport];
	}

	const taskViewports: ResolvedViewportInfo[] = [];

	if (targets.length > 0) {
		for (const target of targets) {
			if (typeof target === "string") {
				const presetVal = presets[target];
				if (!presetVal) {
					throw new Error(
						`Task '${taskId}' (or global) references a non-existent preset: '${target}'.`,
					);
				}
				taskViewports.push({
					viewport: presetVal,
					suffix: target,
				});
		} else if (typeof target === "object" && target !== null) {
			taskViewports.push({
				viewport: target,
				suffix: `${target.width}x${target.height}`,
			});
		}
		}
	} else {
		taskViewports.push({
			viewport: { width: 1280, height: 720 },
			suffix: "default",
		});
	}

	// Deduplicate resolved viewports by suffix
	const uniqueTaskViewports: ResolvedViewportInfo[] = [];
	const seenSuffixes = new Set<string>();
	for (const vpInfo of taskViewports) {
		if (!seenSuffixes.has(vpInfo.suffix)) {
			seenSuffixes.add(vpInfo.suffix);
			uniqueTaskViewports.push(vpInfo);
		}
	}

	return uniqueTaskViewports;
}
