import { unified, type Processor } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkGfm from 'remark-gfm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let processor: Processor<any, any, any, any, any> | null = null;

function getProcessor() {
	if (!processor) {
		processor = unified()
			.use(remarkParse)
			.use(remarkGfm)
			.use(remarkStringify, {
				bullet: '-',
				listItemIndent: 'one',
				fences: true,
				rule: '-',
				setext: false,
				incrementListMarker: true,
			});
	}
	return processor;
}

export function formatMarkdown(input: string): string {
	const result = getProcessor().processSync(input);
	return String(result);
}
