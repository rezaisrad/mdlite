use notify::{Config, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

struct WatcherState {
    watcher: Option<RecommendedWatcher>,
    watched_path: Option<String>,
}

pub struct FileWatcherState(Mutex<WatcherState>);

impl FileWatcherState {
    pub fn new() -> Self {
        Self(Mutex::new(WatcherState {
            watcher: None,
            watched_path: None,
        }))
    }
}

// 200ms debounce to coalesce burst events from macOS file operations
const DEBOUNCE_MS: u64 = 200;

#[tauri::command]
pub fn start_watching(app: AppHandle, path: String) -> Result<(), String> {
    let state = app.state::<FileWatcherState>();
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;

    guard.watcher = None;
    guard.watched_path = None;

    let watch_path = path.clone();
    let app_handle = app.clone();
    let pending = Arc::new(AtomicBool::new(false));

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<notify::Event, notify::Error>| {
            if let Ok(event) = res {
                match event.kind {
                    EventKind::Modify(_) | EventKind::Create(_) => {
                        if !pending.swap(true, Ordering::SeqCst) {
                            let handle = app_handle.clone();
                            let wp = watch_path.clone();
                            let flag = pending.clone();
                            std::thread::spawn(move || {
                                std::thread::sleep(Duration::from_millis(DEBOUNCE_MS));
                                flag.store(false, Ordering::SeqCst);
                                let _ = handle.emit("file-changed", &wp);
                            });
                        }
                    }
                    _ => {}
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| format!("Failed to create watcher: {}", e))?;

    watcher
        .watch(std::path::Path::new(&path), RecursiveMode::NonRecursive)
        .map_err(|e| format!("Failed to watch file: {}", e))?;

    guard.watcher = Some(watcher);
    guard.watched_path = Some(path);

    Ok(())
}

#[tauri::command]
pub fn stop_watching(app: AppHandle) -> Result<(), String> {
    let state = app.state::<FileWatcherState>();
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    guard.watcher = None;
    guard.watched_path = None;
    Ok(())
}
