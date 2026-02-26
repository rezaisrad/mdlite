<script lang="ts">
	type HeadingItem = {
		level: number;
		text: string;
		index: number;
	};

	let {
		content = '',
		onheadingclick,
	}: {
		content: string;
		onheadingclick?: (index: number) => void;
	} = $props();

	let headings = $derived.by(() => {
		const items: HeadingItem[] = [];
		const lines = content.split('\n');
		let charIndex = 0;
		for (const line of lines) {
			const match = line.match(/^(#{1,6})\s+(.+)/);
			if (match) {
				items.push({
					level: match[1].length,
					text: match[2].replace(/#+\s*$/, '').trim(),
					index: charIndex,
				});
			}
			charIndex += line.length + 1;
		}
		return items;
	});
</script>

<div class="outline-sidebar">
	<div class="sidebar-header">Outline</div>
	<div class="sidebar-content">
		{#if headings.length === 0}
			<div class="empty-state">No headings</div>
		{:else}
			{#each headings as heading}
				<button
					class="heading-item level-{heading.level}"
					onclick={() => onheadingclick?.(heading.index)}
				>
					{heading.text}
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	.outline-sidebar {
		width: 220px;
		height: 100%;
		background: var(--sidebar-bg);
		border-left: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		flex-shrink: 0;
	}
	.sidebar-header {
		padding: 8px 12px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-color);
	}
	.sidebar-content {
		overflow-y: auto;
		flex: 1;
		padding: 4px 0;
	}
	.empty-state {
		padding: 12px;
		color: var(--text-secondary);
		font-size: 12px;
	}
	.heading-item {
		display: block;
		width: 100%;
		text-align: left;
		padding: 4px 12px;
		font-size: 13px;
		color: var(--text-primary);
		background: none;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.heading-item:hover {
		background: var(--bg-tertiary);
	}
	.level-1 { padding-left: 12px; font-weight: 600; }
	.level-2 { padding-left: 24px; }
	.level-3 { padding-left: 36px; }
	.level-4 { padding-left: 48px; font-size: 12px; }
	.level-5 { padding-left: 60px; font-size: 12px; }
	.level-6 { padding-left: 72px; font-size: 12px; }
</style>
