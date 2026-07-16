import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
	const candidates = [
		path.join(__dirname, "..", "package.json"),
		path.join(__dirname, "..", "..", "package.json"),
	];

	for (const candidate of candidates) {
		try {
			const pkg = JSON.parse(readFileSync(candidate, "utf-8")) as { version?: string };
			if (pkg.version) return pkg.version;
		} catch {}
	}

	return "unknown";
}

export const VERSION = getVersion();
