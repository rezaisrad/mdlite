import { SvelteMap } from "svelte/reactivity";
import { readDir } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";

export type TreeNode = {
	name: string;
	path: string;
	isDirectory: boolean;
};

async function loadEntries(dirPath: string): Promise<TreeNode[]> {
	const raw = await readDir(dirPath);
	const nodes: TreeNode[] = [];
	for (const entry of raw) {
		if (entry.name.startsWith(".")) continue;
		if (entry.isDirectory) {
			nodes.push({
				name: entry.name,
				path: await join(dirPath, entry.name),
				isDirectory: true,
			});
		} else if (/\.(md|markdown)$/i.test(entry.name)) {
			nodes.push({
				name: entry.name,
				path: await join(dirPath, entry.name),
				isDirectory: false,
			});
		}
	}
	nodes.sort((a, b) => {
		if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
	return nodes;
}

class ProjectState {
	rootPath = $state<string | null>(null);
	entries = $state<Map<string, TreeNode[]>>(new SvelteMap());
	expandedPaths = $state<Record<string, boolean>>({});
	showSidebar = $state(false);

	rootName = $derived(this.rootPath?.split("/").pop() ?? null);

	async setRoot(path: string) {
		this.rootPath = path;
		this.expandedPaths = {};
		const nodes = await loadEntries(path);
		this.entries = new SvelteMap([[path, nodes]]);
	}

	async toggleExpand(dirPath: string) {
		if (this.expandedPaths[dirPath]) {
			this.expandedPaths = { ...this.expandedPaths, [dirPath]: false };
		} else {
			if (!this.entries.has(dirPath)) {
				const nodes = await loadEntries(dirPath);
				const next = new SvelteMap(this.entries);
				next.set(dirPath, nodes);
				this.entries = next;
			}
			this.expandedPaths = { ...this.expandedPaths, [dirPath]: true };
		}
	}

	getChildren(dirPath: string): TreeNode[] {
		return this.entries.get(dirPath) ?? [];
	}

	clear() {
		this.rootPath = null;
		this.entries = new SvelteMap();
		this.expandedPaths = {};
	}
}

export const project = new ProjectState();
