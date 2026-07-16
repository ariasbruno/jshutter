import path from "node:path";

export function insertSuffixToPath(filePath: string, suffix: string): string {
	const ext = path.extname(filePath);
	const dir = path.dirname(filePath);
	const base = path.basename(filePath, ext);
	return path.join(dir, `${base}-${suffix}${ext}`);
}

export function resolveTaskUrl(url: string, baseUrl?: string, taskId?: string): string {
	try {
		new URL(url);
		return url;
	} catch {
		if (baseUrl) {
			const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
			const rel = url.startsWith("/") ? url : `/${url}`;
			return `${base}${rel}`;
		}
		throw new Error(
			taskId
				? `Task '${taskId}' defines a relative URL '${url}' but no global 'baseUrl' is configured.`
				: `A relative URL '${url}' was defined but no global 'baseUrl' is configured.`
		);
	}
}
