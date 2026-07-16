import fs from "node:fs/promises";
import path from "node:path";

export async function initCommand(): Promise<void> {
	const targetPath = "./jshutter/jshutter.json";
	let exists = false;
	try {
		await fs.access(targetPath);
		exists = true;
	} catch {}

	if (exists) {
		const answer = prompt(
			"The file jshutter/jshutter.json already exists. Do you want to overwrite it? (y/N):",
		);
		if (
			answer?.toLowerCase() !== "s" &&
			answer?.toLowerCase() !== "si" &&
			answer?.toLowerCase() !== "y" &&
			answer?.toLowerCase() !== "yes"
		) {
			console.log("Initialization cancelled.");
			process.exit(0);
		}
	}

	const template = {
		$schema:
			"https://raw.githubusercontent.com/ariasbruno/jshutter/main/jshutter.schema.json",
		global: {
			baseOutputDir: "./output",
			viewport: {
				width: 1280,
				height: 720,
			},
			fullPage: true,
			delay: 500,
			format: "png",
			quality: 100,
			timeout: 30000,
			colorScheme: "light",
			report: "none",
			headed: false,
			parallel: 1,
		},
		tasks: [
			{
				id: "example-home",
				url: "https://example.com",
				viewport: "desktop-hd",
				output: "screenshots/example-home.png",
			},
		],
	};

	try {
		await fs.mkdir(path.dirname(targetPath), { recursive: true });
		await fs.writeFile(
			targetPath,
			`${JSON.stringify(template, null, "\t")}\n`,
			"utf-8",
		);
		console.log(
			"\x1b[32m✓ Example jshutter/jshutter.json file created successfully.\x1b[0m",
		);
	} catch (error) {
		console.error(
			`\x1b[31mError creating file:\x1b[0m ${(error as Error).message}`,
		);
		process.exit(1);
	}
}
