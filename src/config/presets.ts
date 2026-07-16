import type { ViewportConfig } from "../types";

export const BUILTIN_PRESETS: Record<string, ViewportConfig> = {
	"mobile-s": { width: 320, height: 568 },
	"mobile": { width: 375, height: 812 },
	"mobile-l": { width: 428, height: 926 },
	"tablet": { width: 768, height: 1024 },
	"tablet-l": { width: 1024, height: 1366 },
	"desktop": { width: 1280, height: 720 },
	"desktop-hd": { width: 1920, height: 1080 },
	"desktop-2k": { width: 2560, height: 1440 }
};
