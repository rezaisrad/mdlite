export function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function onThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	const handler = (e: MediaQueryListEvent) => callback(e.matches ? 'dark' : 'light');
	mq.addEventListener('change', handler);
	return () => mq.removeEventListener('change', handler);
}
