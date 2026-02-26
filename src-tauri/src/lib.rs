mod commands;

use commands::file_watcher::FileWatcherState;
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
use tauri::Emitter;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(FileWatcherState::new())
        .setup(|app| {
            build_menu(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::file_ops::read_file,
            commands::file_ops::write_file,
            commands::file_watcher::start_watching,
            commands::file_watcher::stop_watching,
            commands::export::export_html,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn build_menu(handle: &tauri::AppHandle) -> Result<(), tauri::Error> {
    let file_new = MenuItemBuilder::with_id("file_new", "New")
        .accelerator("CmdOrCtrl+N")
        .build(handle)?;
    let file_open = MenuItemBuilder::with_id("file_open", "Open…")
        .accelerator("CmdOrCtrl+O")
        .build(handle)?;
    let file_save = MenuItemBuilder::with_id("file_save", "Save")
        .accelerator("CmdOrCtrl+S")
        .build(handle)?;
    let file_save_as = MenuItemBuilder::with_id("file_save_as", "Save As…")
        .accelerator("CmdOrCtrl+Shift+S")
        .build(handle)?;
    let file_export_html = MenuItemBuilder::with_id("file_export_html", "Export HTML…")
        .build(handle)?;
    let file_export_pdf = MenuItemBuilder::with_id("file_export_pdf", "Print / PDF…")
        .accelerator("CmdOrCtrl+P")
        .build(handle)?;
    let file_quit = MenuItemBuilder::with_id("file_quit", "Quit")
        .accelerator("CmdOrCtrl+Q")
        .build(handle)?;

    let file_menu = SubmenuBuilder::new(handle, "File")
        .items(&[
            &file_new,
            &file_open,
            &file_save,
            &file_save_as,
            &file_export_html,
            &file_export_pdf,
        ])
        .separator()
        .item(&file_quit)
        .build()?;

    let edit_find = MenuItemBuilder::with_id("edit_find", "Find…")
        .accelerator("CmdOrCtrl+F")
        .build(handle)?;
    let edit_replace = MenuItemBuilder::with_id("edit_replace", "Find and Replace…")
        .accelerator("CmdOrCtrl+H")
        .build(handle)?;

    let edit_menu = SubmenuBuilder::new(handle, "Edit")
        .item(&PredefinedMenuItem::undo(handle, None)?)
        .item(&PredefinedMenuItem::redo(handle, None)?)
        .separator()
        .item(&PredefinedMenuItem::cut(handle, None)?)
        .item(&PredefinedMenuItem::copy(handle, None)?)
        .item(&PredefinedMenuItem::paste(handle, None)?)
        .item(&PredefinedMenuItem::select_all(handle, None)?)
        .separator()
        .item(&edit_find)
        .item(&edit_replace)
        .build()?;

    let fmt_bold = MenuItemBuilder::with_id("fmt_bold", "Bold")
        .accelerator("CmdOrCtrl+B")
        .build(handle)?;
    let fmt_italic = MenuItemBuilder::with_id("fmt_italic", "Italic")
        .accelerator("CmdOrCtrl+I")
        .build(handle)?;
    let fmt_code = MenuItemBuilder::with_id("fmt_code", "Inline Code")
        .accelerator("CmdOrCtrl+`")
        .build(handle)?;
    let fmt_heading = MenuItemBuilder::with_id("fmt_heading", "Toggle Heading")
        .accelerator("CmdOrCtrl+Shift+H")
        .build(handle)?;
    let fmt_link = MenuItemBuilder::with_id("fmt_link", "Insert Link")
        .accelerator("CmdOrCtrl+K")
        .build(handle)?;
    let fmt_list = MenuItemBuilder::with_id("fmt_list", "Toggle List")
        .accelerator("CmdOrCtrl+Shift+L")
        .build(handle)?;
    let fmt_auto_format = MenuItemBuilder::with_id("fmt_auto_format", "Auto-Format")
        .accelerator("CmdOrCtrl+Shift+F")
        .build(handle)?;

    let format_menu = SubmenuBuilder::new(handle, "Format")
        .items(&[
            &fmt_bold,
            &fmt_italic,
            &fmt_code,
            &fmt_heading,
            &fmt_link,
            &fmt_list,
            &fmt_auto_format,
        ])
        .build()?;

    let view_editor = MenuItemBuilder::with_id("view_editor", "Editor Only")
        .accelerator("CmdOrCtrl+1")
        .build(handle)?;
    let view_split = MenuItemBuilder::with_id("view_split", "Split View")
        .accelerator("CmdOrCtrl+2")
        .build(handle)?;
    let view_preview = MenuItemBuilder::with_id("view_preview", "Preview Only")
        .accelerator("CmdOrCtrl+3")
        .build(handle)?;
    let view_sidebar = MenuItemBuilder::with_id("view_sidebar", "Toggle Sidebar")
        .accelerator("CmdOrCtrl+\\")
        .build(handle)?;
    let view_zoom_in = MenuItemBuilder::with_id("view_zoom_in", "Zoom In")
        .accelerator("CmdOrCtrl+=")
        .build(handle)?;
    let view_zoom_out = MenuItemBuilder::with_id("view_zoom_out", "Zoom Out")
        .accelerator("CmdOrCtrl+-")
        .build(handle)?;
    let view_zoom_reset = MenuItemBuilder::with_id("view_zoom_reset", "Actual Size")
        .accelerator("CmdOrCtrl+0")
        .build(handle)?;

    let font_system = MenuItemBuilder::with_id("font_system", "System")
        .build(handle)?;
    let font_serif = MenuItemBuilder::with_id("font_serif", "Serif")
        .build(handle)?;
    let font_classic = MenuItemBuilder::with_id("font_classic", "Classic")
        .build(handle)?;
    let font_humanist = MenuItemBuilder::with_id("font_humanist", "Humanist")
        .build(handle)?;
    let font_mono = MenuItemBuilder::with_id("font_mono", "Mono")
        .build(handle)?;

    let font_menu = SubmenuBuilder::new(handle, "Font")
        .items(&[&font_system, &font_serif, &font_classic, &font_humanist, &font_mono])
        .build()?;

    let view_menu = SubmenuBuilder::new(handle, "View")
        .items(&[&view_editor, &view_split, &view_preview, &view_sidebar])
        .separator()
        .items(&[&view_zoom_in, &view_zoom_out, &view_zoom_reset])
        .separator()
        .item(&font_menu)
        .build()?;

    let menu = MenuBuilder::new(handle)
        .items(&[&file_menu, &edit_menu, &format_menu, &view_menu])
        .build()?;

    handle.set_menu(menu)?;

    let handle_clone = handle.clone();
    handle.on_menu_event(move |app, event| {
        if event.id().0.as_str() == "file_quit" {
            app.exit(0);
            return;
        }
        let _ = handle_clone.emit("menu-event", event.id().0.as_str());
    });

    Ok(())
}
