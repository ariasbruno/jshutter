#!/usr/bin/env node
import { Command } from "commander";
import { runCommand } from "./commands/run";
import { initCommand } from "./commands/init";
import { validateCommand } from "./commands/validate";
import { installSkillCommand } from "./commands/install-skill";
import { openReportCommand } from "./commands/open-report";
import { checkForUpdate } from "./update-checker";
import { VERSION } from "./version";

const program = new Command();

program
	.name("jshutter")
	.description("CLI for automated webpage screenshot capture")
	.version(VERSION);

program
	.command("run [config]")
	.alias("r")
	.description("Run screenshot captures from the configuration file")
	.option("--headed", "Run the browser in visible mode (debug mode)")
	.option("-v, --verbose", "Show detailed log for each action", false)
	.option("--silent", "Silence all console output", false)
	.option("--report <type>", "Generate execution reports (json, html, all, none)")
	.option("--dry-run", "Validate and show task summary without running the browser", false)
	.option("--task <id>", "Run only the task with the specified ID")
	.option("--tag <tag>", "Run only tasks containing the specified tag")
	.option("--browser <type>", "Browser to use: chromium, firefox, webkit", "chromium")
	.option("--parallel <number>", "Maximum number of tasks to run in parallel", "1")
	.option("--force", "Skip interactive confirmation warnings when running bulk captures", false)
	.action(runCommand);

program
	.command("init")
	.alias("i")
	.description("Create an example jshutter.json file in the current directory")
	.action(initCommand);

program
	.command("validate [config]")
	.alias("v")
	.description("Validate the configuration file without running tasks")
	.action(validateCommand);

program
	.command("install-skill")
	.alias("is")
	.description("Install the AI skill file (SKILL.md) in the current directory")
	.action(installSkillCommand);

program
	.command("open-report [config]")
	.aliases(["open", "o"])
	.description("Open the generated HTML report in the default browser")
	.action(openReportCommand);

program.hook("preAction", (thisCommand) => {
	checkForUpdate(thisCommand);
});

program.parse(process.argv);
