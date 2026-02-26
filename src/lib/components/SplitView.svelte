<script lang="ts">
	import { Splitpanes, Pane } from 'svelte-splitpanes';
	import type { Snippet } from 'svelte';

	let {
		editorPane,
		previewPane,
	}: {
		editorPane: Snippet;
		previewPane: Snippet;
	} = $props();
</script>

<div class="split-container">
	<Splitpanes horizontal={false}>
		<Pane minSize={20} size={50}>
			{@render editorPane()}
		</Pane>
		<Pane minSize={20} size={50}>
			{@render previewPane()}
		</Pane>
	</Splitpanes>
</div>

<style>
	.split-container {
		width: 100%;
		height: 100%;
	}
</style>
