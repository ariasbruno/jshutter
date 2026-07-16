import { loadConfig, resolveConfigPath } from "../config/loader";

export async function validateCommand(configPathArg?: string): Promise<void> {
	try {
		const configPath = await resolveConfigPath(configPathArg);
		const resolved = await loadConfig(configPath);
		console.log(`\x1b[32m✓ Config valid\x1b[0m (${resolved.tasks.length} tasks found)`);
	} catch (error) {
		console.error(`\x1b[31m✗ Invalid config\x1b[0m`);
		console.error(`Error: ${(error as Error).message}`);
		process.exit(1);
	}
}
