import fs from "node:fs/promises";
import path from "node:path";

export async function installSkill(): Promise<void> {
	const destDir = path.resolve("./.agents/skills/jshutter");
	const destReferencesDir = path.resolve(destDir, "references");
	const destPath = path.resolve(destDir, "SKILL.md");
	let sourceInfo = "";

	const referenceFiles = [
		"actions.md",
		"cli.md",
		"examples.md",
		"schema.md",
		"workflow.md",
	];

	// Ensure destination directories exist
	await fs.mkdir(destReferencesDir, { recursive: true });

	// Try to copy the bundled version from the package
	try {
		const bundledSkillPath = path.resolve(
			import.meta.dirname || "",
			"../../assets/skill/SKILL.md",
		);
		const bundledReferencesDir = path.resolve(
			import.meta.dirname || "",
			"../../assets/skill/references",
		);

		// Verify bundled SKILL.md exists
		await fs.access(bundledSkillPath);

		// Copy SKILL.md
		await fs.copyFile(bundledSkillPath, destPath);

		// Copy references
		for (const file of referenceFiles) {
			const srcFile = path.resolve(bundledReferencesDir, file);
			const destFile = path.resolve(destReferencesDir, file);
			await fs.copyFile(srcFile, destFile);
		}

		sourceInfo = "bundled npm package resources";
	} catch {
		// Fallback to download from GitHub repository
		const githubBaseUrl =
			"https://raw.githubusercontent.com/ariasbruno/jshutter/main/assets";
		try {
			console.log(
				`Local skill not found in package. Attempting to download from GitHub...`,
			);

			// Download SKILL.md
			const skillResponse = await fetch(`${githubBaseUrl}/SKILL.md`);
			if (!skillResponse.ok) {
				throw new Error(
					`Error downloading SKILL.md (HTTP ${skillResponse.status})`,
				);
			}
			const skillContent = await skillResponse.text();
			await fs.writeFile(destPath, skillContent, "utf-8");

			// Download references
			for (const file of referenceFiles) {
				const refResponse = await fetch(`${githubBaseUrl}/references/${file}`);
				if (!refResponse.ok) {
					throw new Error(
						`Error downloading references/${file} (HTTP ${refResponse.status})`,
					);
				}
				const refContent = await refResponse.text();
				await fs.writeFile(
					path.resolve(destReferencesDir, file),
					refContent,
					"utf-8",
				);
			}

			sourceInfo = `GitHub (${githubBaseUrl})`;
		} catch (fetchError) {
			throw new Error(
				`Could not locate or install skill files: ${(fetchError as Error).message}`,
			);
		}
	}

	console.log(
		`\n\x1b[32m✓ Skill and references installed successfully from: ${sourceInfo}\x1b[0m`,
	);
	console.log(`Saved to: \x1b[1m${destDir}\x1b[0m`);
	console.log(
		`\x1b[90m(The skill is automatically registered for AI agents in this workspace)\x1b[0m\n`,
	);
	console.log(`\x1b[1mUsage instructions with an LLM:\x1b[0m`);
	console.log(
		`  1. Open your preferred LLM (ChatGPT, Claude, Gemini, etc.).`,
	);
	console.log(
		`  2. Attach or paste the contents of '.agents/skills/jshutter/SKILL.md' into the chat.`,
	);
	console.log(
		`  3. Write your request, the agent will load secondary references into its context as needed.\n`,
	);
}
