import { EditorView, keymap } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';

// Regex patterns ported from the old Swift MarkdownTextView
const TASK_LIST_RE = /^(\s*)([-*+])\s\[[ xX]\]\s/;
const UNORDERED_LIST_RE = /^(\s*)([-*+])\s/;
const ORDERED_LIST_RE = /^(\s*)(\d+)\.\s/;

function smartEnter(view: EditorView): boolean {
	const { state } = view;
	const { from } = state.selection.main;
	const line = state.doc.lineAt(from);
	const lineText = line.text;

	// Only handle if cursor is at end of line
	const cursorInLine = from - line.from;

	let match: RegExpMatchArray | null;

	// Task list
	match = lineText.match(TASK_LIST_RE);
	if (match) {
		const marker = match[0];
		const contentAfter = lineText.slice(marker.length);
		if (contentAfter.trim() === '' && cursorInLine <= marker.length) {
			// Empty item — remove marker
			view.dispatch({
				changes: { from: line.from, to: line.to, insert: '' },
				selection: { anchor: line.from },
			});
			return true;
		}
		const indent = match[1];
		const bullet = match[2];
		const newMarker = `\n${indent}${bullet} [ ] `;
		view.dispatch({
			changes: { from, insert: newMarker },
			selection: { anchor: from + newMarker.length },
		});
		return true;
	}

	// Unordered list
	match = lineText.match(UNORDERED_LIST_RE);
	if (match) {
		const marker = match[0];
		const contentAfter = lineText.slice(marker.length);
		if (contentAfter.trim() === '' && cursorInLine <= marker.length) {
			view.dispatch({
				changes: { from: line.from, to: line.to, insert: '' },
				selection: { anchor: line.from },
			});
			return true;
		}
		const newMarker = `\n${match[0]}`;
		view.dispatch({
			changes: { from, insert: newMarker },
			selection: { anchor: from + newMarker.length },
		});
		return true;
	}

	// Ordered list
	match = lineText.match(ORDERED_LIST_RE);
	if (match) {
		const marker = match[0];
		const contentAfter = lineText.slice(marker.length);
		if (contentAfter.trim() === '' && cursorInLine <= marker.length) {
			view.dispatch({
				changes: { from: line.from, to: line.to, insert: '' },
				selection: { anchor: line.from },
			});
			return true;
		}
		const indent = match[1];
		const num = parseInt(match[2], 10);
		const newMarker = `\n${indent}${num + 1}. `;
		view.dispatch({
			changes: { from, insert: newMarker },
			selection: { anchor: from + newMarker.length },
		});
		return true;
	}

	return false;
}

export const smartListExtension: Extension = keymap.of([
	{
		key: 'Enter',
		run: smartEnter,
	},
]);
