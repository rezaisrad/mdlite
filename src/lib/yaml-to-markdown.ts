import yaml from "js-yaml";

export function yamlToMarkdown(yamlContent: string): string {
	const data = yaml.load(yamlContent);
	if (data == null) return "";
	if (typeof data !== "object" || Array.isArray(data)) return String(data);
	return renderDocument(data as Record<string, unknown>);
}

function formatKey(key: string): string {
	return key
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isShortScalar(value: unknown): boolean {
	if (value == null || typeof value === "number" || typeof value === "boolean") return true;
	if (value instanceof Date) return true;
	if (typeof value === "string") return !value.trim().includes("\n");
	return false;
}

function scalarStr(value: unknown): string {
	if (value == null) return "—";
	if (typeof value === "boolean") return value ? "Yes" : "No";
	if (value instanceof Date) return value.toISOString().split("T")[0];
	if (typeof value === "string") return value.trim();
	return String(value);
}

function renderDocument(obj: Record<string, unknown>): string {
	const parts: string[] = [];

	if (typeof obj.title === "string") {
		parts.push(`# ${obj.title}`, "");
	}

	const meta: [string, string][] = [];
	const sections: [string, unknown][] = [];

	for (const [key, value] of Object.entries(obj)) {
		if (key === "title") continue;
		if (isShortScalar(value)) {
			meta.push([key, scalarStr(value)]);
		} else {
			sections.push([key, value]);
		}
	}

	if (meta.length > 0) {
		parts.push("| | |", "|---|---|");
		for (const [key, val] of meta) {
			parts.push(`| **${formatKey(key)}** | ${val} |`);
		}
		parts.push("");
	}

	for (const [key, value] of sections) {
		if (Array.isArray(value) && value.length === 0) continue;
		parts.push(`## ${formatKey(key)}`, "");
		parts.push(renderValue(value, 2));
	}

	return collapse(parts.join("\n")).trim() + "\n";
}

function renderValue(value: unknown, depth: number): string {
	if (value == null) return "—\n\n";
	if (typeof value === "boolean" || typeof value === "number") return scalarStr(value) + "\n\n";
	if (typeof value === "string") return value.trim() + "\n\n";
	if (Array.isArray(value)) return renderArray(value, depth);
	return renderObject(value as Record<string, unknown>, depth);
}

function renderObject(obj: Record<string, unknown>, depth: number): string {
	const entries = Object.entries(obj);
	const multiLineCount = entries.filter(
		([, v]) => typeof v === "string" && !isShortScalar(v),
	).length;
	const labelMultiLine = multiLineCount > 1;

	const parts: string[] = [];

	for (const [key, value] of entries) {
		if (isShortScalar(value)) {
			parts.push(`**${formatKey(key)}:** ${scalarStr(value)}`, "");
		} else if (typeof value === "string") {
			if (labelMultiLine) {
				parts.push(`**${formatKey(key)}:**`, "", value.trim(), "");
			} else {
				parts.push(value.trim(), "");
			}
		} else if (Array.isArray(value)) {
			if (value.length === 0) continue;
			const h = heading(depth + 1);
			parts.push(`${h} ${formatKey(key)}`, "");
			parts.push(renderArray(value, depth + 1));
		} else if (typeof value === "object" && value !== null) {
			const h = heading(depth + 1);
			parts.push(`${h} ${formatKey(key)}`, "");
			parts.push(renderObject(value as Record<string, unknown>, depth + 1));
		}
	}

	return parts.join("\n");
}

function renderArray(arr: unknown[], depth: number): string {
	if (arr.length === 0) return "";

	if (arr.every((v) => isShortScalar(v))) {
		return arr.map((v) => `- ${scalarStr(v)}`).join("\n") + "\n\n";
	}

	if (arr.every((v) => typeof v === "object" && v !== null && !Array.isArray(v))) {
		return renderObjectArray(arr as Record<string, unknown>[], depth);
	}

	return arr.map((v) => `- ${scalarStr(v)}`).join("\n") + "\n\n";
}

function renderObjectArray(items: Record<string, unknown>[], depth: number): string {
	const lines: string[] = [];
	const titleKey = findTitleKey(items);
	const maxKeys = Math.max(...items.map((i) => Object.keys(i).length));
	const hasLongValues = items.some((item) =>
		Object.values(item).some((v) => scalarStr(v).length > 120),
	);

	if (maxKeys === 1) {
		for (const item of items) {
			lines.push(`- ${scalarStr(Object.values(item)[0])}`);
		}
		lines.push("");
		return lines.join("\n");
	}

	if (maxKeys <= 2 && !hasLongValues) {
		for (const item of items) {
			const entries = Object.entries(item);
			const first = scalarStr(entries[0][1]);
			const second = entries[1] ? scalarStr(entries[1][1]) : "";
			lines.push(second ? `- **${first}** — ${second}` : `- ${first}`);
		}
		lines.push("");
		return lines.join("\n");
	}

	if (maxKeys >= 3) {
		for (const item of items) {
			const title = titleKey ? itemTitle(titleKey, item[titleKey]) : "";
			const h = heading(depth + 1);
			lines.push(`${h} ${title}`, "");
			for (const [key, value] of Object.entries(item)) {
				if (key === titleKey) continue;
				if (typeof value === "string" && !isShortScalar(value)) {
					lines.push(`**${formatKey(key)}:**`, "", value.trim(), "");
				} else if (isShortScalar(value)) {
					lines.push(`**${formatKey(key)}:** ${scalarStr(value)}`, "");
				} else {
					lines.push(renderValue(value, depth + 1));
				}
			}
		}
		return lines.join("\n");
	}

	for (let i = 0; i < items.length; i++) {
		const item = items[i];
		const title = titleKey ? itemTitle(titleKey, item[titleKey]) : `Item ${i + 1}`;
		const others = Object.entries(item).filter(([k]) => k !== titleKey);

		lines.push(`${i + 1}. **${title}**`, "");
		for (const [key, value] of others) {
			lines.push(`   **${formatKey(key)}:** ${scalarStr(value)}`, "");
		}
	}

	lines.push("");
	return lines.join("\n");
}

function findTitleKey(arr: Record<string, unknown>[]): string | null {
	const candidates = [
		"title",
		"name",
		"description",
		"feature",
		"step",
		"statement",
		"summary",
		"label",
		"id",
	];
	const keys = Object.keys(arr[0]);
	for (const c of candidates) {
		if (keys.includes(c)) return c;
	}
	return keys[0] ?? null;
}

function itemTitle(key: string, value: unknown): string {
	if (typeof value === "number") return `${formatKey(key)} ${value}`;
	return scalarStr(value);
}

function heading(depth: number): string {
	return "#".repeat(Math.min(depth + 1, 6));
}

function collapse(text: string): string {
	return text.replace(/\n{3,}/g, "\n\n");
}
