let currentImages = [];
let currentImageIndex = -1;
let selectedTags = new Set();

// Interactive Zoom Canvas Properties
let zoomLevel = 1.0;
const ZOOM_SPEED = 0.05;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 5.0;

let panX = 0;
let panY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

document.addEventListener("DOMContentLoaded", () => {
	buildTagsFilter();
	setupDragPan();
});

function buildTagsFilter() {
	const allTags = new Set();
	document.querySelectorAll(".card").forEach((card) => {
		const tagsData = card.getAttribute("data-tags");
		if (tagsData) {
			try {
				const tags = JSON.parse(tagsData);
				tags.forEach((t) => allTags.add(t));
			} catch (e) {}
		}
	});

	const menu = document.getElementById("tags-dropdown-menu");
	if (!menu || allTags.size === 0) {
		const container = document.getElementById("tags-dropdown-container");
		if (container) container.style.display = "none";
		return;
	}

	menu.innerHTML = "";

	// Master "All" checkbox
	const allLabel = document.createElement("label");
	allLabel.className = "dropdown-item dropdown-item-all";

	const allCheckbox = document.createElement("input");
	allCheckbox.type = "checkbox";
	allCheckbox.id = "tag-checkbox-all";
	allCheckbox.checked = true;
	allCheckbox.className = "checkbox-input";
	allCheckbox.onchange = (e) =>
		handleAllTagsCheckboxChange(e.target.checked);

	const allSpan = document.createElement("span");
	allSpan.textContent = "All";

	allLabel.appendChild(allCheckbox);
	allLabel.appendChild(allSpan);
	menu.appendChild(allLabel);

	// Divider
	const divider = document.createElement("div");
	divider.className = "dropdown-divider";
	menu.appendChild(divider);

	// Individual tags checkboxes
	allTags.forEach((tag) => {
		const label = document.createElement("label");
		label.className = "dropdown-item";

		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.value = tag;
		checkbox.name = "tag-checkbox-item";
		checkbox.className = "checkbox-input";
		checkbox.onchange = (e) =>
			handleTagCheckboxChange(tag, e.target.checked);

		const span = document.createElement("span");
		span.textContent = "#" + tag;

		label.appendChild(checkbox);
		label.appendChild(span);
		menu.appendChild(label);
	});
}

function toggleTagsDropdown(e) {
	if (e) e.stopPropagation();
	const menu = document.getElementById("tags-dropdown-menu");
	menu.classList.toggle("show");
}

function handleAllTagsCheckboxChange(isChecked) {
	const allCheckbox = document.getElementById("tag-checkbox-all");
	const checkboxes = document.querySelectorAll(
		'input[name="tag-checkbox-item"]',
	);

	if (isChecked) {
		checkboxes.forEach((cb) => (cb.checked = false));
		selectedTags.clear();
	} else {
		if (selectedTags.size === 0) {
			allCheckbox.checked = true;
			return;
		}
	}

	updateTagsLabel();
	applyAllFilters();
}

function handleTagCheckboxChange(tag, isChecked) {
	const allCheckbox = document.getElementById("tag-checkbox-all");

	if (isChecked) {
		selectedTags.add(tag);
		if (allCheckbox) allCheckbox.checked = false;
	} else {
		selectedTags.delete(tag);
		if (selectedTags.size === 0 && allCheckbox) {
			allCheckbox.checked = true;
		}
	}

	updateTagsLabel();
	applyAllFilters();
}

function updateTagsLabel() {
	const label = document.getElementById("tags-dropdown-label");
	if (selectedTags.size === 0) {
		label.textContent = "All";
	} else if (selectedTags.size === 1) {
		label.textContent = `#${Array.from(selectedTags)[0]}`;
	} else {
		label.textContent = `${selectedTags.size} selected`;
	}
}

function openModal(taskId) {
	updateImageList();
	currentImageIndex = currentImages.findIndex((img) => img.id === taskId);
	showModalImage();
}

function updateImageList() {
	const visibleCards = Array.from(
		document.querySelectorAll(".card"),
	).filter((card) => card.style.display !== "none");
	currentImages = visibleCards
		.map((card) => {
			const img = card.querySelector("img");
			if (img) {
				return {
					src: img.getAttribute("src"),
					id: card.getAttribute("data-id"),
					viewport: card.getAttribute("data-viewport"),
				};
			}
			return null;
		})
		.filter(Boolean);
}

function showModalImage() {
	const modal = document.getElementById("image-modal");
	const modalImg = document.getElementById("modal-img");
	const modalTitle = document.getElementById("modal-title");

	resetZoom();

	if (
		currentImageIndex >= 0 &&
		currentImageIndex < currentImages.length
	) {
		const item = currentImages[currentImageIndex];
		modalImg.src = item.src;
		modalTitle.textContent = `${item.id} (${item.viewport})`;
		modal.classList.add("show");
	}
}

function prevImage(e) {
	if (e) e.stopPropagation();
	if (currentImages.length === 0) return;
	currentImageIndex =
		(currentImageIndex - 1 + currentImages.length) % currentImages.length;
	showModalImage();
}

function nextImage(e) {
	if (e) e.stopPropagation();
	if (currentImages.length === 0) return;
	currentImageIndex = (currentImageIndex + 1) % currentImages.length;
	showModalImage();
}

function closeModal() {
	resetZoom();
	document.getElementById("image-modal").classList.remove("show");
}

/* GPU-Accelerated Canvas Panning & Mouse Wheel Zooming */
function applyTransform() {
	const img = document.getElementById("modal-img");
	const percentageText = document.getElementById("zoom-percentage");

	if (img) {
		img.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${zoomLevel})`;
	}
	if (percentageText) {
		percentageText.textContent = `${Math.round(zoomLevel * 100)}%`;
	}
}

function handleWheel(e) {
	e.preventDefault();
	const delta = e.deltaY;

	if (delta < 0) {
		zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_SPEED * 2.5);
	} else {
		zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_SPEED * 2.5);
	}

	applyTransform();
}

function zoomIn() {
	zoomLevel = Math.min(MAX_ZOOM, zoomLevel + 0.15);
	applyTransform();
}

function zoomOut() {
	zoomLevel = Math.max(MIN_ZOOM, zoomLevel - 0.15);
	applyTransform();
}

// Rename map variable to resetZoom to not conflict with JS built-in Array.prototype.map
function resetZoom() {
	zoomLevel = 1.0;
	panX = 0;
	panY = 0;
	applyTransform();
}

function setupDragPan() {
	const viewport = document.getElementById("modal-viewport");
	let dragStartX = 0;
	let dragStartY = 0;

	viewport.addEventListener("mousedown", (e) => {
		isDragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		startX = e.clientX - panX;
		startY = e.clientY - panY;
	});

	window.addEventListener("mouseup", () => {
		isDragging = false;
	});

	viewport.addEventListener("mousemove", (e) => {
		if (!isDragging) return;
		e.preventDefault();
		panX = e.clientX - startX;
		panY = e.clientY - startY;
		applyTransform();
	});

	viewport.addEventListener("click", (e) => {
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (e.target === viewport && dist < 5) {
			closeModal();
		}
	});
}

/* Task Configuration Modal */
function openConfigModal(taskId) {
	const card = document.querySelector(`.card[data-id="${taskId}"]`);
	if (!card) return;
	const configData = JSON.parse(card.getAttribute("data-config"));

	document.getElementById("config-modal-task-id").textContent = taskId;
	document.getElementById("config-modal-task-url").textContent =
		configData.url;

	// General metadata
	document.getElementById("cfg-viewport").textContent =
		configData.viewport ? `${configData.viewport.width}x${configData.viewport.height}` : "Default";
	document.getElementById("cfg-duration").textContent =
		configData.duration !== undefined ? `${(configData.duration / 1000).toFixed(2)}s` : "—";
	document.getElementById("cfg-colorscheme").textContent =
		configData.colorScheme ? (configData.colorScheme === "light" ? "Light" : configData.colorScheme === "dark" ? "Dark" : configData.colorScheme) : "Default (System)";
	document.getElementById("cfg-useragent").textContent =
		configData.userAgent || "Default (Chromium)";

	// Execution options
	document.getElementById("cfg-delay").textContent =
		configData.delay !== undefined ? `${configData.delay}ms` : "—";
	document.getElementById("cfg-fullpage").textContent =
		configData.fullPage !== undefined
			? configData.fullPage
			? "Yes"
			: "No"
			: "—";
	document.getElementById("cfg-format").textContent = configData.format
		? `${configData.format.toUpperCase()} (${configData.quality || 100}%)`
		: "—";
	document.getElementById("cfg-timeout").textContent =
		configData.timeout !== undefined ? `${configData.timeout}ms` : "—";

	// Populate Tags
	const tagsDiv = document.getElementById("cfg-tags");
	tagsDiv.innerHTML = "";
	const tags = configData.tags || [];
	if (tags.length > 0) {
		tags.forEach((t) => {
			const span = document.createElement("span");
			span.className = "config-tag-badge";
			span.textContent = t;
			tagsDiv.appendChild(span);
		});
		document.getElementById("cfg-tags-container").style.display = "block";
	} else {
		document.getElementById("cfg-tags-container").style.display = "none";
	}

	// Populate Actions
	const actionsDiv = document.getElementById("cfg-actions");
	actionsDiv.innerHTML = "";
	const actions = configData.actions || [];
	if (actions.length > 0) {
		actions.forEach((act, idx) => {
			const step = document.createElement("div");
			step.className = "config-action-step";

			const num = document.createElement("span");
			num.className = "action-num-badge";
			num.textContent = idx + 1;

			const content = document.createElement("span");
			let actDetails = "";
			if (act.type === "click") actDetails = `selector: ${act.selector}`;
			else if (act.type === "type")
				actDetails = `selector: ${act.selector}, value: "${act.value}"`;
			else if (act.type === "scroll")
				actDetails = `value: "${act.value}"`;
			else if (act.type === "wait") actDetails = `${act.value}ms`;
			else if (act.type === "wait_selector")
				actDetails = `selector: ${act.selector}`;
			else if (act.type === "fill_form")
				actDetails = `fields: ${act.fields?.length || 0} inputs`;
			else actDetails = act.selector ? `selector: ${act.selector}` : "";

			content.innerHTML = `<span class="action-type">${act.type}</span> <span class="action-details">${actDetails}</span>`;
			step.appendChild(num);
			step.appendChild(content);
			actionsDiv.appendChild(step);
		});
		document.getElementById("cfg-actions-container").style.display =
			"block";
	} else {
		document.getElementById("cfg-actions-container").style.display =
			"none";
	}

	document.getElementById("config-modal").classList.add("show");
}

function closeConfigModal() {
	document.getElementById("config-modal").classList.remove("show");
}

function filterTasks(status) {
	document.querySelectorAll(".tab-button").forEach((btn) => {
		btn.classList.remove("active");
	});
	const btn = document.querySelector(
		`.tab-button[data-filter="${status}"]`,
	);
	if (btn) {
		btn.classList.add("active");
	}

	applyAllFilters();
}

function applyAllFilters() {
	const activeBtn = document.querySelector(".tab-button.active");
	const activeFilter = activeBtn
		? activeBtn.getAttribute("data-filter")
		: "all";
	const query = document
		.getElementById("search-input")
		.value.toLowerCase();

	document.querySelectorAll(".card").forEach((card) => {
		const cardStatus = card.getAttribute("data-status");
		const cardId = card.getAttribute("data-id").toLowerCase();
		const cardUrl = card.getAttribute("data-url").toLowerCase();

		let cardTags = [];
		const tagsData = card.getAttribute("data-tags");
		if (tagsData) {
			try {
				cardTags = JSON.parse(tagsData);
			} catch (e) {}
		}

		const statusMatch =
			activeFilter === "all" || cardStatus === activeFilter;
		const searchMatch = cardId.includes(query) || cardUrl.includes(query);
		const tagMatch =
			selectedTags.size === 0 ||
			cardTags.some((t) => selectedTags.has(t));

		if (statusMatch && searchMatch && tagMatch) {
			card.style.display = "flex";
		} else {
			card.style.display = "none";
		}
	});
}

function searchTasks() {
	applyAllFilters();
}

document.addEventListener("keydown", function (e) {
	if (document.getElementById("image-modal").classList.contains("show")) {
		if (e.key === "Escape") closeModal();
		if (e.key === "ArrowLeft") prevImage();
		if (e.key === "ArrowRight") nextImage();
	}
	if (
		document.getElementById("config-modal").classList.contains("show")
	) {
		if (e.key === "Escape") closeConfigModal();
	}
});
