<script lang="ts">
	import { doc } from '$lib/state/document.svelte';
</script>

<div class="status-bar">
	<span class="status-item">
		Ln {doc.cursorLine}, Col {doc.cursorCol}
	</span>
	<span class="status-separator">|</span>
	<span class="status-item">
		{doc.wordCount} words
	</span>
	<span class="status-separator">|</span>
	<span class="status-item">
		{doc.lineCount} lines
	</span>
	<span class="status-separator">|</span>
	<span class="status-item">
		{doc.charCount} chars
	</span>
	{#if doc.zoomLevel !== 100}
		<span class="status-separator">|</span>
		<span class="status-item">
			{doc.zoomLevel}%
		</span>
	{/if}
</div>

<style>
	.status-bar {
		display: flex;
		align-items: center;
		height: 24px;
		padding: 0 12px;
		background: var(--status-bar-bg);
		border-top: 1px solid var(--border-color);
		font-size: 12px;
		color: var(--text-secondary);
		flex-shrink: 0;
		gap: 4px;
	}
	.status-separator {
		opacity: 0.4;
	}
</style>
