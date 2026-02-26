<script lang="ts">
	let {
		visible = false,
		onreload,
		ondismiss,
	}: {
		visible: boolean;
		onreload: () => void;
		ondismiss: () => void;
	} = $props();
</script>

{#if visible}
	<div class="dialog-overlay">
		<div class="dialog">
			<p>This file has been changed externally. Reload?</p>
			<div class="dialog-actions">
				<button class="btn btn-secondary" onclick={ondismiss}>Keep Current</button>
				<button class="btn btn-primary" onclick={onreload}>Reload</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.dialog-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	.dialog {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 8px;
		padding: 20px;
		max-width: 400px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}
	.dialog p {
		margin-bottom: 16px;
		font-size: 14px;
	}
	.dialog-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}
	.btn {
		padding: 6px 16px;
		border-radius: 6px;
		font-size: 13px;
		cursor: pointer;
		border: 1px solid var(--border-color);
	}
	.btn-secondary {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}
	.btn-primary {
		background: var(--accent-color);
		color: white;
		border-color: var(--accent-color);
	}
</style>
