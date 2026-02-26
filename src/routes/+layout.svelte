<script lang="ts">
	import { onMount } from 'svelte';
	import { getSystemTheme, onThemeChange } from '$lib/theme';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	let theme = $state<'light' | 'dark'>('light');

	onMount(() => {
		theme = getSystemTheme();
		const cleanup = onThemeChange((t) => (theme = t));
		return cleanup;
	});

	$effect(() => {
		document.documentElement.classList.toggle('dark', theme === 'dark');
	});
</script>

{@render children()}
