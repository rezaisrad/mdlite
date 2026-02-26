import { listen } from '@tauri-apps/api/event';

export type MenuAction =
	| 'file_new'
	| 'file_open'
	| 'file_save'
	| 'file_save_as'
	| 'file_export_html'
	| 'file_export_pdf'
	| 'edit_find'
	| 'edit_replace'
	| 'fmt_bold'
	| 'fmt_italic'
	| 'fmt_code'
	| 'fmt_heading'
	| 'fmt_link'
	| 'fmt_list'
	| 'fmt_auto_format'
	| 'view_editor'
	| 'view_split'
	| 'view_preview'
	| 'view_sidebar'
	| 'view_zoom_in'
	| 'view_zoom_out'
	| 'view_zoom_reset'
	| 'font_system'
	| 'font_serif'
	| 'font_classic'
	| 'font_humanist'
	| 'font_mono';

type MenuCallback = (action: MenuAction) => void;

export function listenMenuEvents(callback: MenuCallback): Promise<() => void> {
	return listen<string>('menu-event', (event) => {
		callback(event.payload as MenuAction);
	});
}
