import { EditorView, keymap } from '@codemirror/view';
import type { Extension } from '@codemirror/state';

function wrapSelection(view: EditorView, prefix: string, suffix: string): boolean {
	const { from, to } = view.state.selection.main;
	const selected = view.state.sliceDoc(from, to);

	// Check if already wrapped — toggle off
	if (
		selected.startsWith(prefix) &&
		selected.endsWith(suffix) &&
		selected.length >= prefix.length + suffix.length
	) {
		const unwrapped = selected.slice(prefix.length, -suffix.length);
		view.dispatch({
			changes: { from, to, insert: unwrapped },
			selection: { anchor: from, head: from + unwrapped.length },
		});
		return true;
	}

	const insert = `${prefix}${selected}${suffix}`;
	if (selected) {
		view.dispatch({
			changes: { from, to, insert },
			selection: { anchor: from, head: from + insert.length },
		});
	} else {
		view.dispatch({
			changes: { from, to, insert },
			selection: { anchor: from + prefix.length },
		});
	}
	return true;
}

function toggleLinePrefix(view: EditorView, prefix: string): boolean {
	const { from } = view.state.selection.main;
	const line = view.state.doc.lineAt(from);

	if (line.text.startsWith(prefix)) {
		view.dispatch({
			changes: { from: line.from, to: line.from + prefix.length, insert: '' },
		});
	} else {
		view.dispatch({
			changes: { from: line.from, insert: prefix },
		});
	}
	return true;
}

function insertLinkAtCursor(view: EditorView): boolean {
	const { from, to } = view.state.selection.main;
	const selected = view.state.sliceDoc(from, to);
	const insert = `[${selected}](url)`;
	view.dispatch({
		changes: { from, to, insert },
		// Select "url" for easy replacement
		selection: { anchor: from + selected.length + 2, head: from + selected.length + 5 },
	});
	return true;
}

export const formattingKeymap: Extension = keymap.of([
	{ key: 'Mod-b', run: (v) => wrapSelection(v, '**', '**') },
	{ key: 'Mod-i', run: (v) => wrapSelection(v, '*', '*') },
	{ key: 'Mod-`', run: (v) => wrapSelection(v, '`', '`') },
	{ key: 'Mod-Shift-h', run: (v) => toggleLinePrefix(v, '# ') },
	{ key: 'Mod-k', run: insertLinkAtCursor },
	{ key: 'Mod-Shift-l', run: (v) => toggleLinePrefix(v, '- ') },
]);
