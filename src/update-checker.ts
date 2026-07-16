import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";

function parseVersion(v: string): [number, number, number] {
	const parts = v.replace(/^v/, "").split(".").map(Number);
	return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function isNewer(latest: string, current: string): boolean {
	const [a, b, c] = parseVersion(latest);
	const [x, y, z] = parseVersion(current);
	if (a !== x) return a > x;
	if (b !== y) return b > y;
	return c > z;
}

export async function checkForUpdate(command?: Command): Promise<void> {
	try {
		if (command?.opts().silent) return;

		const pkgPath = join(import.meta.dirname, "..", "package.json");
		const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { name: string; version: string };
		const current = pkg.version as string;

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 3000);

		const res = await fetch(`https://registry.npmjs.org/${pkg.name}/latest`, {
			signal: controller.signal,
		});
		clearTimeout(timeout);

		if (!res.ok) return;

		const data = (await res.json()) as { version?: string };
		const latest = data.version;
		if (!latest || !isNewer(latest, current)) return;

		console.log(`\x1b[33m\n📦 New version available: \x1b[1m${latest}\x1b[0m\x1b[33m (current: ${current})\x1b[0m`);
		console.log(`\x1b[2m   Run: npm install -g ${pkg.name}@latest\x1b[0m\n`);
	} catch {
		// Silent: no network or no response, don't bother the user
	}
}
