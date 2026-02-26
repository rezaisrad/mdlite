import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, rectangularSelection } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching, indentOnInput, foldGutter, foldKeymap, codeFolding } from '@codemirror/language';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { smartListExtension } from './smart-lists';
import { formattingKeymap } from './formatting';

export function createEditorState(
	content: string,
	onUpdate: (content: string) => void,
	onCursorChange: (line: number, col: number) => void
): EditorState {
	return EditorState.create({
		doc: content,
		extensions: [
			lineNumbers(),
			highlightActiveLineGutter(),
			highlightActiveLine(),
			drawSelection(),
			rectangularSelection(),
			EditorState.allowMultipleSelections.of(true),
			codeFolding(),
			foldGutter(),
			bracketMatching(),
			indentOnInput(),
			history(),
			syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
			highlightSelectionMatches(),
			markdown({ base: markdownLanguage }),
			smartListExtension,
			formattingKeymap,
			keymap.of([
				indentWithTab,
				...defaultKeymap,
				...historyKeymap,
				...searchKeymap,
				...foldKeymap,
			]),
			EditorState.tabSize.of(4),
			EditorView.lineWrapping,
			EditorView.updateListener.of((update) => {
				if (update.docChanged) {
					onUpdate(update.state.doc.toString());
				}
				if (update.selectionSet || update.docChanged) {
					const pos = update.state.selection.main.head;
					const line = update.state.doc.lineAt(pos);
					onCursorChange(line.number, pos - line.from + 1);
				}
			}),
		],
	});
}

export function createEditorView(
	parent: HTMLElement,
	state: EditorState
): EditorView {
	return new EditorView({ state, parent });
}
