<script lang="ts">
	import { Marked } from 'marked';
	import { markedHighlight } from 'marked-highlight';
	import hljs from 'highlight.js/lib/core';
	import javascript from 'highlight.js/lib/languages/javascript';
	import typescript from 'highlight.js/lib/languages/typescript';
	import python from 'highlight.js/lib/languages/python';
	import bash from 'highlight.js/lib/languages/bash';
	import css from 'highlight.js/lib/languages/css';
	import json from 'highlight.js/lib/languages/json';
	import rust from 'highlight.js/lib/languages/rust';
	import yaml from 'highlight.js/lib/languages/yaml';
	import xml from 'highlight.js/lib/languages/xml';
	import sql from 'highlight.js/lib/languages/sql';
	import markdown from 'highlight.js/lib/languages/markdown';
	import diff from 'highlight.js/lib/languages/diff';
	import go from 'highlight.js/lib/languages/go';
	import 'highlight.js/styles/github.css';
	import { tick } from 'svelte';

	hljs.registerLanguage('javascript', javascript);
	hljs.registerLanguage('js', javascript);
	hljs.registerLanguage('typescript', typescript);
	hljs.registerLanguage('ts', typescript);
	hljs.registerLanguage('python', python);
	hljs.registerLanguage('bash', bash);
	hljs.registerLanguage('sh', bash);
	hljs.registerLanguage('shell', bash);
	hljs.registerLanguage('css', css);
	hljs.registerLanguage('json', json);
	hljs.registerLanguage('rust', rust);
	hljs.registerLanguage('yaml', yaml);
	hljs.registerLanguage('yml', yaml);
	hljs.registerLanguage('xml', xml);
	hljs.registerLanguage('html', xml);
	hljs.registerLanguage('sql', sql);
	hljs.registerLanguage('markdown', markdown);
	hljs.registerLanguage('md', markdown);
	hljs.registerLanguage('diff', diff);
	hljs.registerLanguage('go', go);

	let {
		content = '',
		previewRef = $bindable<HTMLDivElement | null>(null),
	}: {
		content: string;
		previewRef?: HTMLDivElement | null;
	} = $props();

	let mermaidModule: typeof import('mermaid') | null = null;

	const marked = new Marked(
		markedHighlight({
			langPrefix: 'hljs language-',
			highlight(code: string, lang: string) {
				if (lang === 'mermaid') {
					return code;
				}
				if (lang && hljs.getLanguage(lang)) {
					return hljs.highlight(code, { language: lang }).value;
				}
				return code;
			},
		}),
		{
			gfm: true,
			breaks: false,
		}
	);

	let html = $derived(marked.parse(content) as string);

	// Mermaid rendering uses innerHTML on purpose — the SVG output comes from
	// mermaid.render() which generates diagram markup. This is the same trust
	// model as the {@html html} block above (marked output). In a desktop Tauri
	// app the content is user-authored markdown, not untrusted web input.
	async function renderMermaid() {
		if (!previewRef) return;
		const blocks = previewRef.querySelectorAll('code.hljs.language-mermaid');
		if (!blocks.length) return;

		if (!mermaidModule) {
			mermaidModule = await import('mermaid');
			mermaidModule.default.initialize({ startOnLoad: false, theme: 'default' });
		}

		for (const block of blocks) {
			const pre = block.parentElement;
			if (!pre || pre.dataset.mermaidRendered) continue;

			const source = block.textContent ?? '';
			const id = `mermaid-${crypto.randomUUID()}`;
			try {
				const { svg } = await mermaidModule.default.render(id, source);
				const wrapper = document.createElement('div');
				wrapper.className = 'mermaid-diagram';
				wrapper.innerHTML = svg;
				pre.replaceWith(wrapper);
			} catch {
				pre.dataset.mermaidRendered = 'error';
			}
		}
	}

	$effect(() => {
		html;
		tick().then(renderMermaid);
	});
</script>

<div class="preview-container" bind:this={previewRef}>
	<article class="markdown-body">
		{@html html}
	</article>
</div>

<style>
	.preview-container {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		background: var(--bg-primary);
	}

	.preview-container :global(.mermaid-diagram) {
		display: flex;
		justify-content: center;
		margin: 1rem 0;
		overflow-x: auto;
	}

	.preview-container :global(.mermaid-diagram svg) {
		max-width: 100%;
		height: auto;
	}
</style>
