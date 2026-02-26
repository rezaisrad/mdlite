export type ViewMode = 'editor' | 'preview' | 'split';

export type FontFamily = 'system' | 'serif' | 'classic' | 'humanist' | 'mono';

export const FONT_STACKS: Record<FontFamily, { label: string; css: string }> = {
	system: {
		label: 'System',
		css: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
	},
	serif: {
		label: 'Serif',
		css: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif",
	},
	classic: {
		label: 'Classic',
		css: "'Iowan Old Style', 'Palatino Linotype', 'URW Palladio L', P052, serif",
	},
	humanist: {
		label: 'Humanist',
		css: "Seravek, 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', source-sans-pro, sans-serif",
	},
	mono: {
		label: 'Mono',
		css: "'SF Mono', SFMono-Regular, ui-monospace, Menlo, Consolas, monospace",
	},
};

class DocumentState {
	content = $state('');
	filePath = $state<string | null>(null);
	isDirty = $state(false);
	viewMode = $state<ViewMode>('split');
	showSidebar = $state(false);
	zoomLevel = $state(100);
	fontFamily = $state<FontFamily>('system');
	cursorLine = $state(1);
	cursorCol = $state(1);

	fileName = $derived(
		this.filePath
			? this.filePath.split('/').pop() ?? 'Untitled'
			: 'Untitled'
	);

	windowTitle = $derived(
		(this.isDirty ? '* ' : '') + this.fileName + ' — MDLite'
	);

	private stats = $derived.by(() => {
		const text = this.content;
		let words = 0;
		let lines = 1;
		let inWord = false;
		for (let i = 0; i < text.length; i++) {
			const ch = text.charCodeAt(i);
			if (ch === 10) {
				lines++;
				inWord = false;
			} else if (ch <= 32 || ch === 9 || ch === 13) {
				inWord = false;
			} else {
				if (!inWord) words++;
				inWord = true;
			}
		}
		return { words, lines, chars: text.length };
	});

	get wordCount() { return this.stats.words; }
	get lineCount() { return this.stats.lines; }
	get charCount() { return this.stats.chars; }

	setContent(content: string, markDirty = true) {
		this.content = content;
		if (markDirty) this.isDirty = true;
	}

	setFilePath(path: string | null) {
		this.filePath = path;
	}

	markClean() {
		this.isDirty = false;
	}

	setCursor(line: number, col: number) {
		this.cursorLine = line;
		this.cursorCol = col;
	}

	zoomIn() {
		if (this.zoomLevel < 200) this.zoomLevel += 10;
	}

	zoomOut() {
		if (this.zoomLevel > 50) this.zoomLevel -= 10;
	}

	zoomReset() {
		this.zoomLevel = 100;
	}

	reset() {
		this.content = '';
		this.filePath = null;
		this.isDirty = false;
		this.cursorLine = 1;
		this.cursorCol = 1;
	}
}

export const doc = new DocumentState();
