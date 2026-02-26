<script lang="ts">
	import { onMount } from 'svelte';
	import type { EditorView } from '@codemirror/view';
	import { createEditorState, createEditorView } from '$lib/codemirror/setup';

	let {
		content = '',
		onchange,
		oncursorchange,
		editorRef = $bindable<EditorView | null>(null),
	}: {
		content: string;
		onchange: (content: string) => void;
		oncursorchange: (line: number, col: number) => void;
		editorRef?: EditorView | null;
	} = $props();

	let container: HTMLDivElement;
	let view: EditorView | null = null;
	let ignoreNextUpdate = false;
	// Tracks the last content value known to this component, avoiding
	// a view.state.doc.toString() rope→string allocation on every keystroke.
	// svelte-ignore state_referenced_locally
	let lastKnownContent = content;

	onMount(() => {
		const state = createEditorState(content, handleUpdate, oncursorchange);
		view = createEditorView(container, state);
		editorRef = view;

		return () => {
			view?.destroy();
			view = null;
			editorRef = null;
		};
	});

	function handleUpdate(newContent: string) {
		if (ignoreNextUpdate) {
			ignoreNextUpdate = false;
			return;
		}
		lastKnownContent = newContent;
		onchange(newContent);
	}

	$effect(() => {
		if (view && content !== lastKnownContent) {
			lastKnownContent = content;
			ignoreNextUpdate = true;
			view.dispatch({
				changes: {
					from: 0,
					to: view.state.doc.length,
					insert: content,
				},
			});
		}
	});
</script>

<div class="editor-container" bind:this={container}></div>

<style>
	.editor-container {
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
</style>
