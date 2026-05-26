<script lang="ts">
	import { project, type TreeNode } from "$lib/state/project.svelte";
	import { doc } from "$lib/state/document.svelte";

	let { onfileclick }: { onfileclick?: (path: string) => void } = $props();
</script>

{#snippet treeNode(node: TreeNode, depth: number)}
	{#if node.isDirectory}
		<button
			class="tree-item dir"
			style="padding-left: {12 + depth * 16}px"
			onclick={() => project.toggleExpand(node.path)}
		>
			<span class="chevron" class:expanded={project.expandedPaths[node.path]}>&#9654;</span>
			<span class="node-name">{node.name}</span>
		</button>
		{#if project.expandedPaths[node.path]}
			{#each project.getChildren(node.path) as child}
				{@render treeNode(child, depth + 1)}
			{/each}
		{/if}
	{:else}
		<button
			class="tree-item file"
			class:active={doc.filePath === node.path}
			style="padding-left: {12 + depth * 16}px"
			onclick={() => onfileclick?.(node.path)}
		>
			<span class="node-name">{node.name}</span>
		</button>
	{/if}
{/snippet}

<div class="project-sidebar">
	<div class="sidebar-header">{project.rootName ?? "Project"}</div>
	<div class="sidebar-content">
		{#if project.rootPath}
			{#each project.getChildren(project.rootPath) as node}
				{@render treeNode(node, 0)}
			{/each}
		{/if}
	</div>
</div>

<style>
	.project-sidebar {
		width: 240px;
		height: 100%;
		background: var(--sidebar-bg);
		border-right: 1px solid var(--border-color);
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
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.sidebar-content {
		overflow-y: auto;
		flex: 1;
		padding: 4px 0;
	}
	.tree-item {
		display: flex;
		align-items: center;
		gap: 4px;
		width: 100%;
		text-align: left;
		padding: 3px 12px;
		font-size: 13px;
		color: var(--text-primary);
		background: none;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
	}
	.tree-item:hover {
		background: var(--bg-tertiary);
	}
	.tree-item.active {
		background: var(--bg-tertiary);
		font-weight: 600;
	}
	.node-name {
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.chevron {
		font-size: 8px;
		flex-shrink: 0;
		transition: transform 0.15s ease;
		display: inline-block;
		width: 12px;
		text-align: center;
	}
	.chevron.expanded {
		transform: rotate(90deg);
	}
</style>
