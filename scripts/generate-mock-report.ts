import fs from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import type { TaskResult } from "../src/types";

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

const mockResults: TaskResult[] = [
	{
		id: "landing-page-mobile",
		url: "https://ejemplo.com",
		status: "passed",
		output: "home-mobile.png",
		viewport: { width: 375, height: 812 },
		duration: 1240,
		error: null,
		tags: ["home", "landing", "mobile"],
		delay: 500,
		fullPage: true,
		format: "png",
		quality: 80,
		timeout: 30000,
		colorScheme: "dark",
		userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
		actions: [
			{ type: "scroll", value: "down" },
			{ type: "wait", value: 300 }
		]
	},
	{
		id: "landing-page-desktop",
		url: "https://ejemplo.com",
		status: "passed",
		output: "home-desktop.png",
		viewport: { width: 1920, height: 1080 },
		duration: 1890,
		error: null,
		tags: ["home", "landing", "desktop"],
		delay: 500,
		fullPage: true,
		format: "png",
		quality: 80,
		timeout: 30000,
		colorScheme: "light",
		userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36",
		actions: []
	},
	{
		id: "formulario-contacto",
		url: "https://ejemplo.com/contacto",
		status: "failed",
		output: null,
		viewport: { width: 1280, height: 720 },
		duration: 30000,
		error: "TimeoutError: waiting for selector \"button[type='submit']\" to be visible\n  at Page.click (login.ts:42)\n  at TaskRunner.run (task-runner.ts:112)",
		tags: ["contacto", "forms"],
		delay: 1000,
		fullPage: false,
		format: "jpeg",
		quality: 90,
		timeout: 30000,
		actions: [
			{ type: "fill_form", fields: [{ selector: "#name", value: "John Doe" }, { selector: "#email", value: "john@example.com" }] },
			{ type: "click", selector: "button[type='submit']" }
		]
	},
	{
		id: "galeria-proyectos",
		url: "https://ejemplo.com/galeria",
		status: "passed",
		output: "galeria.png",
		viewport: { width: 1920, height: 1080 },
		duration: 2100,
		error: null,
		tags: ["galeria", "portfolio"],
		delay: 500,
		fullPage: true,
		format: "png",
		quality: 80,
		timeout: 30000,
		actions: [
			{ type: "wait_selector", selector: ".grid-items" }
		]
	},
	{
		id: "area-clientes-login",
		url: "https://ejemplo.com/login",
		status: "skipped",
		output: null,
		viewport: { width: 1280, height: 720 },
		duration: 0,
		error: null,
		tags: ["auth", "clientes"],
		delay: 500,
		fullPage: true,
		format: "png",
		quality: 80,
		timeout: 30000,
		actions: []
	}
];

// Mock rich SVGs to represent realistic layouts
const mockSvgMobile = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="375" height="812" viewBox="0 0 375 812">
	<rect width="375" height="812" fill="#0f172a"/>
	<rect width="375" height="60" fill="#1e293b"/>
	<text x="187" y="38" font-family="sans-serif" font-size="16" fill="#38bdf8" text-anchor="middle" font-weight="bold">Obrafina (Mobile View)</text>
	<rect x="20" y="90" width="335" height="200" rx="10" fill="#1e293b"/>
	<text x="187" y="195" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Mobile Hero Showcase Banner</text>
	<rect x="20" y="310" width="157" height="150" rx="8" fill="#1e293b"/>
	<rect x="197" y="310" width="157" height="150" rx="8" fill="#1e293b"/>
	<rect x="20" y="480" width="335" height="180" rx="8" fill="#1e293b"/>
	<text x="187" y="570" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Footer Contact Info</text>
</svg>`);

const mockSvgDesktop = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
	<rect width="1280" height="720" fill="#0f172a"/>
	<rect width="1280" height="80" fill="#1e293b"/>
	<text x="100" y="48" font-family="sans-serif" font-size="22" fill="#38bdf8" font-weight="bold">Obrafina (Desktop View)</text>
	<rect x="100" y="130" width="1080" height="280" rx="15" fill="#1e293b"/>
	<text x="640" y="280" font-family="sans-serif" font-size="24" fill="#94a3b8" text-anchor="middle">Main Desktop Slider Layout</text>
	<rect x="100" y="440" width="340" height="200" rx="10" fill="#1e293b"/>
	<rect x="470" y="440" width="340" height="200" rx="10" fill="#1e293b"/>
	<rect x="840" y="440" width="340" height="200" rx="10" fill="#1e293b"/>
</svg>`);

const mockSvgGallery = "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
	<rect width="1280" height="720" fill="#0f172a"/>
	<rect width="1280" height="80" fill="#1e293b"/>
	<text x="100" y="48" font-family="sans-serif" font-size="22" fill="#10b981" font-weight="bold">Obrafina (Proyectos Galería)</text>
	<rect x="100" y="130" width="250" height="230" rx="8" fill="#1e293b"/>
	<rect x="380" y="130" width="250" height="230" rx="8" fill="#1e293b"/>
	<rect x="660" y="130" width="250" height="230" rx="8" fill="#1e293b"/>
	<rect x="940" y="130" width="250" height="230" rx="8" fill="#1e293b"/>
	<rect x="100" y="390" width="250" height="230" rx="8" fill="#1e293b"/>
	<rect x="380" y="390" width="250" height="230" rx="8" fill="#1e293b"/>
	<rect x="660" y="390" width="250" height="230" rx="8" fill="#1e293b"/>
	<rect x="940" y="390" width="250" height="230" rx="8" fill="#1e293b"/>
</svg>`);

const templatePath = path.resolve(import.meta.dirname || "", "../assets/report/report.html");
const outputPath = path.resolve(import.meta.dirname || "", "../screenshots/mock-report.html");

async function generateMock() {
	let template = "";
	try {
		template = await fs.readFile(templatePath, "utf-8");
	} catch (err) {
		console.error("Could not read report template:", (err as Error).message);
		return;
	}

	let cardsHtml = "";
	for (const task of mockResults) {
		let imageHtml = "";
		let errorHtml = "";

		const viewportStr = `${task.viewport.width}x${task.viewport.height}`;
		const durationStr = task.status === "skipped" ? "—" : `${(task.duration / 1000).toFixed(2)}s`;

		if (task.status === "passed") {
			let pixelSrc = mockSvgDesktop;
			if (task.id.includes("mobile")) pixelSrc = mockSvgMobile;
			if (task.id.includes("galeria")) pixelSrc = mockSvgGallery;

			imageHtml = `
				<div class="card-media-container">
					<img class="card-screenshot" src="${pixelSrc}" alt="Screenshot for ${task.id}" onclick="openModal('${task.id}')">
				</div>
			`;
		} else if (task.status === "failed") {
			errorHtml = `
				<div class="card-error-container">
					<div class="card-error-title text-error">Stack Trace</div>
					<pre class="card-error-trace">${task.error}</pre>
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

		const tagsList = task.tags || [];

		const semanticStatus = task.status === "passed" ? "success" : task.status === "failed" ? "error" : "skipped";
		const displayStatus = task.status === "passed" ? "Passed" : task.status === "failed" ? "Failed" : "Skipped";

		cardsHtml += `
		<article class="card" data-status="${task.status}" data-id="${task.id}" data-url="${task.url}" data-viewport="${viewportStr}" data-tags='${escapeHtml(JSON.stringify(tagsList))}' data-config='${escapeHtml(JSON.stringify({ delay: task.delay, fullPage: task.fullPage, format: task.format, quality: task.quality, timeout: task.timeout, tags: tagsList, actions: task.actions, url: task.url, viewport: task.viewport, colorScheme: task.colorScheme, userAgent: task.userAgent, duration: task.duration }))}'>
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
						<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" style="fill: currentColor; flex-shrink: 0;"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="m13.691 15.778l-.63-.49a2 2 0 0 0 .023-.288a1.6 1.6 0 0 0-.024-.289l.625-.49a.15.15 0 0 0 .036-.188l-.59-1.02a.15.15 0 0 0-.183-.065l-.73.295a2 2 0 0 0-.502-.289l-.112-.778a.14.14 0 0 0-.141-.124h-1.18a.15.15 0 0 0-.147.124l-.112.778a2.4 2.4 0 0 0-.5.29l-.732-.296a.154.154 0 0 0-.183.065l-.59 1.02a.146.146 0 0 0 .036.189l.625.49a2.4 2.4 0 0 0 0 .577l-.625.49a.15.15 0 0 0-.035.188l.59 1.02a.15.15 0 0 0 .182.065l.731-.295a2 2 0 0 0 .501.289l.112.778a.15.15 0 0 0 .148.124h1.179a.15.15 0 0 0 .147-.124l.112-.778a2.2 2.2 0 0 0 .495-.29l.737.296a.154.154 0 0 0 .183-.065l.59-1.02a.15.15 0 0 0-.036-.189m-2.818.106a.884.884 0 1 1 .885-.884a.883.883 0 0 1-.885.884" /><path fill="currentColor" d="M14 2H6a2.006 2.006 0 0 0-2 2v16a2.006 2.006 0 0 0 2 2h12a2.006 2.006 0 0 0 2-2V8Zm4 18H6V4h7v5h5Z" /></svg>
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

	const timestamp = new Date().toLocaleString();
	let finalHtml = template;
	finalHtml = injectById(finalHtml, "config-name", "mock-config.json");
	finalHtml = injectById(finalHtml, "timestamp", timestamp);
	finalHtml = injectById(finalHtml, "metric-passed", "3");
	finalHtml = injectById(finalHtml, "metric-passed-pct", "60.0%");
	finalHtml = injectById(finalHtml, "metric-failed", "1");
	finalHtml = injectById(finalHtml, "metric-failed-pct", "20.0%");
	finalHtml = injectById(finalHtml, "metric-skipped", "1");
	finalHtml = injectById(finalHtml, "metric-skipped-pct", "20.0%");
	finalHtml = injectById(finalHtml, "metric-duration", "5.23s");
	finalHtml = injectById(finalHtml, "results-grid", cardsHtml);

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, finalHtml);
	console.log(`[${new Date().toLocaleTimeString()}] Mock report HTML regenerated successfully at: screenshots/mock-report.html`);
}

function injectById(html: string, id: string, content: string): string {
	const regex = new RegExp(`(<[^>]*id="${id}"[^>]*>)([\\s\\S]*?)(</[^>]+>)`, "g");
	return html.replace(regex, `$1${content}$3`);
}

generateMock();
watch(templatePath, () => {
	generateMock();
});
