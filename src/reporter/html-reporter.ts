import fs from "node:fs/promises";
import path from "node:path";
import type { TaskResult, ActionConfig } from "../types";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export async function generateHtmlReport(
	results: TaskResult[],
	configPath: string,
	baseOutputDir: string,
	totalDuration: number,
	embedBase64 = true
): Promise<string> {
	const timestamp = new Date().toLocaleString();
	const configName = path.basename(configPath);

	// Load HTML template and components (HTML, CSS, JS, SVGs)
	let htmlContent = "";
	let configIcon = "";
	try {
		const templateDir = path.resolve(import.meta.dirname || "", "../../assets/report");
		const htmlTemplate = await fs.readFile(path.join(templateDir, "report.html"), "utf-8");
		const cssContent = await fs.readFile(path.join(templateDir, "report.css"), "utf-8");
		const jsContent = await fs.readFile(path.join(templateDir, "report.js"), "utf-8");

		// Load SVGs from icons folder
		const iconsDir = path.join(templateDir, "icons");
		const searchIcon = await fs.readFile(path.join(iconsDir, "search.svg"), "utf-8");
		const tagIcon = await fs.readFile(path.join(iconsDir, "tag.svg"), "utf-8");
		const arrowDownIcon = await fs.readFile(path.join(iconsDir, "expand.svg"), "utf-8");
		const closeIcon = await fs.readFile(path.join(iconsDir, "close.svg"), "utf-8");
		const arrowLeftIcon = await fs.readFile(path.join(iconsDir, "arrow_left.svg"), "utf-8");
		const arrowRightIcon = await fs.readFile(path.join(iconsDir, "arrow-right.svg"), "utf-8");
		configIcon = await fs.readFile(path.join(iconsDir, "config.svg"), "utf-8");

		// Merge styles, scripts and SVGs on the fly
		htmlContent = htmlTemplate
			.replace("<!-- STYLE_INJECT -->", `<style>\n${cssContent}\n</style>`)
			.replace("<!-- SCRIPT_INJECT -->", `<script>\n${jsContent}\n</script>`)
			.replace("<!-- ICON_SEARCH -->", searchIcon)
			.replace("<!-- ICON_TAG -->", tagIcon)
			.replace("<!-- ICON_ARROW_DOWN -->", arrowDownIcon)
			.replace("<!-- ICON_ARROW_LEFT -->", arrowLeftIcon)
			.replace("<!-- ICON_ARROW_RIGHT -->", arrowRightIcon)
			.replaceAll("<!-- ICON_CLOSE -->", closeIcon);
	} catch (error) {
		throw new Error(`Could not read or consolidate HTML report template: ${(error as Error).message}`);
	}

	const summary = {
		total: results.length,
		passed: results.filter((r) => r.status === "passed").length,
		failed: results.filter((r) => r.status === "failed").length,
		skipped: results.filter((r) => r.status === "skipped").length
	};

	let cardsHtml = "";

	for (const task of results) {
		let imageHtml = "";
		let errorHtml = "";

		if (task.status === "passed" && task.output) {
			try {
				let src = "";
				if (embedBase64) {
					const imageBuffer = await fs.readFile(task.output);
					const base64Image = imageBuffer.toString("base64");
					const ext = path.extname(task.output).toLowerCase();
					const mimeType = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
					src = `data:${mimeType};base64,${base64Image}`;
				} else {
					src = path.relative(baseOutputDir, task.output).replace(/\\/g, "/");
				}
				imageHtml = `
					<div class="card-media-container">
						<img class="card-screenshot" src="${src}" alt="Screenshot for ${task.id}" onclick="openModal('${task.id}')">
					</div>
				`;
			} catch (err) {
				imageHtml = `
					<div class="card-skipped-container">
						<div class="card-skipped-text">
							Error loading image:<br>${(err as Error).message}
						</div>
					</div>
				`;
			}
		} else if (task.status === "failed") {
			errorHtml = `
				<div class="card-error-container">
					<div class="card-error-title text-error">Stack Trace</div>
					<pre class="card-error-trace">${task.error || "Unknown error"}</pre>
				</div>
			`;
		} else if (task.status === "skipped") {
			imageHtml = `
				<div class="card-skipped-container">
					<div class="card-skipped-text">
						<p>Task skipped</p>
						<p style="font-size: 12px; opacity: 0.7; margin-top: 4px;">Filter active</p>
					</div>
				</div>
			`;
		}

		const viewportStr = task.viewport ? `${task.viewport.width}x${task.viewport.height}` : "Default";
		const durationStr = task.status === "skipped" ? "—" : `${(task.duration / 1000).toFixed(2)}s`;

		const tagsList = task.tags || [];

		const semanticStatus = task.status === "passed" ? "success" : task.status === "failed" ? "error" : "skipped";
		const displayStatus = task.status === "passed" ? "Passed" : task.status === "failed" ? "Failed" : "Skipped";

		const sanitizedActions = sanitizeActions(task.actions);

		cardsHtml += `
		<article class="card" data-status="${task.status}" data-id="${task.id}" data-url="${task.url}" data-viewport="${viewportStr}" data-tags='${escapeHtml(JSON.stringify(tagsList))}' data-config='${escapeHtml(JSON.stringify({ delay: task.delay, fullPage: task.fullPage, format: task.format, quality: task.quality, timeout: task.timeout, tags: tagsList, actions: sanitizedActions, url: task.url, viewport: task.viewport, colorScheme: task.colorScheme, userAgent: task.userAgent, duration: task.duration }))}'>
			<div class="card-header">
				<div class="card-header-row" style="align-items: center;">
					<h3 class="card-title" title="${task.id}" style="margin-bottom: 0; min-width: 0; flex: 1; padding-right: 12px;">${task.id}</h3>
					<div class="card-status-badge" style="flex-shrink: 0;">
						<div class="card-status-dot bg-${semanticStatus}"></div>
						<span class="card-status-text text-${semanticStatus}">${displayStatus}</span>
					</div>
				</div>
				<div class="card-header-row" style="margin-top: 8px; align-items: center;">
					<div class="card-url-wrapper" style="min-width: 0; flex: 1; padding-right: 12px;">
						<a href="${task.url}" target="_blank">${task.url}</a>
					</div>
					<button class="config-link-btn" onclick="openConfigModal('${task.id}')" style="flex-shrink: 0;">
						${configIcon}
						Config
					</button>
				</div>
			</div>
			${imageHtml || errorHtml}
			<div class="card-footer">
				<span>${viewportStr}</span>
				<span>${durationStr}</span>
			</div>
		</article>
		`;
	}



	const totalTasks = summary.passed + summary.failed + summary.skipped;
	const passedPct = totalTasks > 0 ? ((summary.passed / totalTasks) * 100).toFixed(1) : "0.0";
	const failedPct = totalTasks > 0 ? ((summary.failed / totalTasks) * 100).toFixed(1) : "0.0";
	const skippedPct = totalTasks > 0 ? ((summary.skipped / totalTasks) * 100).toFixed(1) : "0.0";

	// Replace placeholders using IDs and Regular Expressions
	htmlContent = injectById(htmlContent, "config-name", configName);
	htmlContent = injectById(htmlContent, "timestamp", timestamp);
	htmlContent = injectById(htmlContent, "metric-passed", String(summary.passed));
	htmlContent = injectById(htmlContent, "metric-passed-pct", `${passedPct}%`);
	htmlContent = injectById(htmlContent, "metric-failed", String(summary.failed));
	htmlContent = injectById(htmlContent, "metric-failed-pct", `${failedPct}%`);
	htmlContent = injectById(htmlContent, "metric-skipped", String(summary.skipped));
	htmlContent = injectById(htmlContent, "metric-skipped-pct", `${skippedPct}%`);
	htmlContent = injectById(htmlContent, "metric-duration", `${(totalDuration / 1000).toFixed(2)}s`);
	htmlContent = injectById(htmlContent, "results-grid", cardsHtml);

	const reportPath = path.resolve(baseOutputDir, "jshutter-report.html");
	await fs.mkdir(baseOutputDir, { recursive: true });
	await fs.writeFile(reportPath, htmlContent);
	return reportPath;
}

function injectById(html: string, id: string, content: string): string {
	const regex = new RegExp(`(<[^>]*id="${id}"[^>]*>)([\\s\\S]*?)(</[^>]+>)`, "g");
	return html.replace(regex, `$1${content}$3`);
}

function sanitizeActions(actions: ActionConfig[] | undefined): ActionConfig[] | undefined {
	if (!actions) return undefined;
	const sensitiveRegex = /pass|password|key|secret|token|credit_card|card_num|cvv|pin|email/i;
	return actions.map(act => {
		const newAct = { ...act };
		if (newAct.type === "type" && newAct.selector && sensitiveRegex.test(newAct.selector)) {
			newAct.value = "********";
		}
		if (newAct.type === "fill_form" && newAct.fields && Array.isArray(newAct.fields)) {
			newAct.fields = newAct.fields.map(field => {
				if (sensitiveRegex.test(field.selector)) {
					return { ...field, value: "********" };
				}
				return field;
			});
		}
		if (newAct.type === "set_storage" && newAct.key && sensitiveRegex.test(newAct.key)) {
			newAct.value = "********";
		}
		return newAct;
	});
}
