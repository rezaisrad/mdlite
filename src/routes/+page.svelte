<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { listen } from '@tauri-apps/api/event';
	import { open, save } from '@tauri-apps/plugin-dialog';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import type { EditorView } from '@codemirror/view';
	import { openSearchPanel } from '@codemirror/search';

	import Editor from '$lib/components/Editor.svelte';
	import Preview from '$lib/components/Preview.svelte';
	import SplitView from '$lib/components/SplitView.svelte';
	import StatusBar from '$lib/components/StatusBar.svelte';
	import OutlineSidebar from '$lib/components/OutlineSidebar.svelte';
	import ReloadDialog from '$lib/components/ReloadDialog.svelte';
	import { doc, FONT_STACKS, type FontFamily } from '$lib/state/document.svelte';
	import { listenMenuEvents, type MenuAction } from '$lib/menu-handler';
	import { formatMarkdown } from '$lib/markdown-formatter';

	const appWindow = getCurrentWindow();
	let editorRef = $state<EditorView | null>(null);
	let previewRef = $state<HTMLDivElement | null>(null);
	let showReloadDialog = $state(false);
	let ignoreNextFileChange = false;

	const STORAGE_CONTENT = 'mdlite:content';
	const STORAGE_FILEPATH = 'mdlite:filePath';
	const STORAGE_ZOOM = 'mdlite:zoomLevel';
	const STORAGE_FONT = 'mdlite:fontFamily';

	let saveTimer: ReturnType<typeof setTimeout>;
	$effect(() => {
		const content = doc.content;
		const filePath = doc.filePath;
		clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			localStorage.setItem(STORAGE_CONTENT, content);
			if (filePath) {
				localStorage.setItem(STORAGE_FILEPATH, filePath);
			} else {
				localStorage.removeItem(STORAGE_FILEPATH);
			}
		}, 500);
	});

	function handleEditorChange(content: string) {
		doc.setContent(content);
	}

	function handleCursorChange(line: number, col: number) {
		doc.setCursor(line, col);
	}

	// --- File operations ---

	async function fileNew() {
		if (doc.isDirty && !confirm('Discard unsaved changes?')) return;
		if (doc.filePath) {
			await invoke('stop_watching');
		}
		doc.reset();
		localStorage.removeItem(STORAGE_CONTENT);
		localStorage.removeItem(STORAGE_FILEPATH);
	}

	async function fileOpen() {
		const path = await open({
			filters: [{ name: 'Markdown', extensions: ['md', 'markdown', 'txt'] }],
		});
		if (!path) return;
		await openFile(path as string);
	}

	async function openFile(path: string) {
		try {
			const content = await invoke<string>('read_file', { path });
			if (doc.filePath) {
				await invoke('stop_watching');
			}
			doc.setContent(content, false);
			doc.setFilePath(path);
			doc.markClean();
			await invoke('start_watching', { path });
		} catch (e) {
			console.error('Failed to open file:', e);
		}
	}

	function autoFormat() {
		try {
			const formatted = formatMarkdown(doc.content);
			doc.setContent(formatted);
		} catch (e) {
			console.error('Auto-format failed:', e);
		}
	}

	async function fileSave() {
		if (!doc.filePath) {
			await fileSaveAs();
			return;
		}
		try {
			autoFormat();
			ignoreNextFileChange = true;
			await invoke('write_file', { path: doc.filePath, content: doc.content });
			doc.markClean();
		} catch (e) {
			console.error('Failed to save file:', e);
		}
	}

	async function fileSaveAs() {
		const path = await save({
			filters: [{ name: 'Markdown', extensions: ['md'] }],
		});
		if (!path) return;
		try {
			if (doc.filePath) {
				await invoke('stop_watching');
			}
			ignoreNextFileChange = true;
			doc.setFilePath(path);
			await invoke('write_file', { path, content: doc.content });
			doc.markClean();
			await invoke('start_watching', { path });
		} catch (e) {
			console.error('Failed to save file:', e);
		}
	}

	async function fileExportHtml() {
		const path = await save({
			filters: [{ name: 'HTML', extensions: ['html'] }],
		});
		if (!path) return;
		try {
			const html = await invoke<string>('export_html', {
				content: doc.content,
				title: doc.fileName,
			});
			await invoke('write_file', { path, content: html });
		} catch (e) {
			console.error('Failed to export HTML:', e);
		}
	}

	function fileExportPdf() {
		window.print();
	}

	// --- Find/Replace ---

	function editorFind(focusReplace: boolean) {
		if (!editorRef) return;
		openSearchPanel(editorRef);
		if (focusReplace) {
			const replaceField = editorRef.dom.querySelector<HTMLInputElement>('.cm-search input[name=replace]');
			replaceField?.focus();
		}
	}

	// --- Formatting commands ---

	function formatCommand(type: string) {
		if (!editorRef) return;
		const view = editorRef;
		const { from, to } = view.state.selection.main;
		const selected = view.state.sliceDoc(from, to);

		let insert: string;
		let cursorOffset: number;

		switch (type) {
			case 'bold':
				insert = `**${selected}**`;
				cursorOffset = selected ? insert.length : 2;
				break;
			case 'italic':
				insert = `*${selected}*`;
				cursorOffset = selected ? insert.length : 1;
				break;
			case 'code':
				insert = `\`${selected}\``;
				cursorOffset = selected ? insert.length : 1;
				break;
			case 'link':
				insert = `[${selected}](url)`;
				cursorOffset = selected ? selected.length + 2 : 1;
				break;
			default:
				return;
		}

		view.dispatch({
			changes: { from, to, insert },
			selection: { anchor: from + cursorOffset },
		});
		view.focus();
	}

	function toggleLinePrefix(prefix: string) {
		if (!editorRef) return;
		const view = editorRef;
		const { from } = view.state.selection.main;
		const line = view.state.doc.lineAt(from);
		const lineText = line.text;

		if (lineText.startsWith(prefix)) {
			view.dispatch({
				changes: { from: line.from, to: line.from + prefix.length, insert: '' },
			});
		} else {
			view.dispatch({
				changes: { from: line.from, insert: prefix },
			});
		}
		view.focus();
	}

	// --- Sidebar heading click ---

	function handleHeadingClick(charIndex: number) {
		if (editorRef && (doc.viewMode === 'editor' || doc.viewMode === 'split')) {
			const pos = Math.min(charIndex, editorRef.state.doc.length);
			editorRef.dispatch({
				selection: { anchor: pos },
				scrollIntoView: true,
			});
			editorRef.focus();
		}
		if (previewRef && (doc.viewMode === 'preview' || doc.viewMode === 'split')) {
			const headings = previewRef.querySelectorAll('h1, h2, h3, h4, h5, h6');
			const lines = doc.content.substring(0, charIndex).split('\n');
			const headingCount = lines.filter((l) => /^#{1,6}\s/.test(l)).length;
			const target = headings[headingCount];
			if (target) {
				target.scrollIntoView({ behavior: 'smooth', block: 'start' });
			}
		}
	}

	// --- Drag and drop ---

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		const files = e.dataTransfer?.files;
		if (!files?.length) return;

		const file = files[0];
		const ext = file.name.split('.').pop()?.toLowerCase();

		if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
			const path = (file as any).path;
			if (path) openFile(path);
		} else if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext ?? '')) {
			const path = (file as any).path;
			if (path && editorRef) {
				const name = file.name.replace(/\.[^.]+$/, '');
				const md = `![${name}](${path})`;
				const pos = editorRef.state.selection.main.head;
				editorRef.dispatch({
					changes: { from: pos, insert: md },
				});
			}
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
	}

	// --- Menu event handler ---

	function handleMenuAction(action: MenuAction) {
		switch (action) {
			case 'file_new': fileNew(); break;
			case 'file_open': fileOpen(); break;
			case 'file_save': fileSave(); break;
			case 'file_save_as': fileSaveAs(); break;
			case 'file_export_html': fileExportHtml(); break;
			case 'file_export_pdf': fileExportPdf(); break;
			case 'edit_find': editorFind(false); break;
			case 'edit_replace': editorFind(true); break;
			case 'fmt_bold': formatCommand('bold'); break;
			case 'fmt_italic': formatCommand('italic'); break;
			case 'fmt_code': formatCommand('code'); break;
			case 'fmt_heading': toggleLinePrefix('# '); break;
			case 'fmt_link': formatCommand('link'); break;
			case 'fmt_list': toggleLinePrefix('- '); break;
			case 'fmt_auto_format': autoFormat(); break;
			case 'view_editor': doc.viewMode = 'editor'; break;
			case 'view_split': doc.viewMode = 'split'; break;
			case 'view_preview': doc.viewMode = 'preview'; break;
			case 'view_sidebar': doc.showSidebar = !doc.showSidebar; break;
		case 'view_zoom_in': doc.zoomIn(); break;
		case 'view_zoom_out': doc.zoomOut(); break;
		case 'view_zoom_reset': doc.zoomReset(); break;
		case 'font_system':
		case 'font_serif':
		case 'font_classic':
		case 'font_humanist':
		case 'font_mono':
			doc.fontFamily = action.replace('font_', '') as FontFamily;
			break;
		}
	}

	// --- Lifecycle ---

	async function restoreSession() {
		const savedZoom = localStorage.getItem(STORAGE_ZOOM);
		if (savedZoom) doc.zoomLevel = Number(savedZoom);

		const savedFont = localStorage.getItem(STORAGE_FONT);
		if (savedFont && savedFont in FONT_STACKS) doc.fontFamily = savedFont as FontFamily;

		const savedFilePath = localStorage.getItem(STORAGE_FILEPATH);
		const savedContent = localStorage.getItem(STORAGE_CONTENT);
		if (savedFilePath) {
			try {
				const content = await invoke<string>('read_file', { path: savedFilePath });
				doc.setContent(content, false);
				doc.setFilePath(savedFilePath);
				doc.markClean();
				await invoke('start_watching', { path: savedFilePath });
			} catch {
				if (savedContent) {
					doc.setContent(savedContent, false);
				}
			}
		} else if (savedContent) {
			doc.setContent(savedContent, false);
		}
	}

	onMount(() => {
		const cleanups: Array<() => void> = [];

		restoreSession();

		listenMenuEvents(handleMenuAction).then((unlisten) => cleanups.push(unlisten));

		listen('file-changed', async () => {
			if (ignoreNextFileChange) {
				ignoreNextFileChange = false;
				return;
			}
			showReloadDialog = true;
		}).then((unlisten) => cleanups.push(unlisten));

		// Unsaved changes warning on window close
		appWindow.onCloseRequested(async (event) => {
			if (doc.isDirty) {
				if (!confirm('You have unsaved changes. Discard and close?')) {
					event.preventDefault();
				}
			}
		}).then((unlisten) => cleanups.push(unlisten));

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (doc.isDirty) {
				e.preventDefault();
			}
		};
		window.addEventListener('beforeunload', handleBeforeUnload);
		cleanups.push(() => window.removeEventListener('beforeunload', handleBeforeUnload));

		return () => cleanups.forEach((fn) => fn());
	});

	$effect(() => {
		appWindow.setTitle(doc.windowTitle);
	});

	// Apply zoom level to CSS and persist
	$effect(() => {
		const zoom = doc.zoomLevel;
		document.documentElement.style.setProperty('--zoom', String(zoom / 100));
		localStorage.setItem(STORAGE_ZOOM, String(zoom));
	});

	// Apply font family to CSS and persist
	$effect(() => {
		const font = doc.fontFamily;
		document.documentElement.style.setProperty('--preview-font', FONT_STACKS[font].css);
		localStorage.setItem(STORAGE_FONT, font);
	});

	// Reload handler
	async function handleReload() {
		showReloadDialog = false;
		if (doc.filePath) {
			const content = await invoke<string>('read_file', { path: doc.filePath });
			doc.setContent(content, false);
			doc.markClean();
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="app-container" ondrop={handleDrop} ondragover={handleDragOver}>
	<div class="main-content">
		<div class="editor-area">
			{#if doc.viewMode === 'split'}
				<SplitView>
					{#snippet editorPane()}
						<Editor
							content={doc.content}
							onchange={handleEditorChange}
							oncursorchange={handleCursorChange}
							bind:editorRef
						/>
					{/snippet}
					{#snippet previewPane()}
						<Preview content={doc.content} bind:previewRef />
					{/snippet}
				</SplitView>
			{:else if doc.viewMode === 'editor'}
				<Editor
					content={doc.content}
					onchange={handleEditorChange}
					oncursorchange={handleCursorChange}
					bind:editorRef
				/>
			{:else}
				<Preview content={doc.content} bind:previewRef />
			{/if}
		</div>
		{#if doc.showSidebar}
			<OutlineSidebar content={doc.content} onheadingclick={handleHeadingClick} />
		{/if}
	</div>
	<StatusBar />
	<ReloadDialog
		visible={showReloadDialog}
		onreload={handleReload}
		ondismiss={() => (showReloadDialog = false)}
	/>
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		height: 100%;
		width: 100%;
	}
	.main-content {
		display: flex;
		flex: 1;
		overflow: hidden;
	}
	.editor-area {
		flex: 1;
		overflow: hidden;
	}
</style>
