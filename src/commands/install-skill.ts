import { installSkill } from "../skills/installer";

export async function installSkillCommand(): Promise<void> {
	try {
		await installSkill();
	} catch (error) {
		console.error(`\x1b[31mError installing skill:\x1b[0m ${(error as Error).message}`);
		process.exit(1);
	}
}
