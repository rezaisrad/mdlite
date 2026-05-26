# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

MDLite — a desktop Markdown editor built with Tauri v2 + SvelteKit + Svelte 5. Product name is "MDLite" (see `tauri.conf.json`). Identifier: `com.rezarad.mdlite`.

## Commands

```bash
# Frontend dev server (Vite on port 1420)
pnpm dev

# Full Tauri desktop app (compiles Rust + launches app)
pnpm tauri dev

# Production build
pnpm tauri build

# Type checking
pnpm check

# Install frontend dependencies
pnpm install
```

Rust builds happen via Cargo inside `src-tauri/`. No separate `cargo build` needed — `pnpm tauri dev` and `pnpm tauri build` handle it.

## Architecture

**Two-process model:**

- **Frontend** (SvelteKit SPA): Editor UI, preview rendering, state management. Runs in a webview. SSR disabled (`+layout.ts` sets `ssr = false`), uses `adapter-static` with SPA fallback.
- **Backend** (Rust/Tauri): File I/O, file watching, HTML export, native menus. Commands exposed via `#[tauri::command]`.

**Frontend → Backend communication:**

- Frontend calls Rust commands via `invoke()` from `@tauri-apps/api/core`
- Rust emits events (e.g., `file-changed`, `menu-event`) that frontend listens to via `listen()` from `@tauri-apps/api/event`
- Native menus are built in Rust (`lib.rs:build_menu`), menu clicks emit `menu-event` which frontend dispatches through `menu-handler.ts`

### Frontend Structure (`src/`)

- `lib/state/document.svelte.ts` — Single `DocumentState` class using Svelte 5 runes (`$state`, `$derived`). Imported as `doc` singleton. Holds content, file path, dirty flag, view mode, cursor position, and derived stats (word/line/char counts).
- `lib/codemirror/setup.ts` — CodeMirror 6 editor config. Extensions: line numbers, markdown syntax, history, search, smart lists, formatting keybindings.
- `lib/codemirror/smart-lists.ts` — Custom Enter key handler for auto-continuing ordered/unordered/task lists.
- `lib/codemirror/formatting.ts` — Keybindings for bold, italic, code, heading, link, list toggling.
- `lib/markdown-formatter.ts` — Auto-formatter using remark (unified/remark-parse/remark-stringify/remark-gfm). Called on save.
- `lib/menu-handler.ts` — Typed listener for Tauri menu events.
- `lib/theme.ts` — System dark/light theme detection via `prefers-color-scheme`.
- `lib/components/` — Svelte 5 components using `$props()` and snippets:
  - `Editor.svelte` — Wraps CodeMirror, syncs external content changes
  - `Preview.svelte` — Renders markdown via `marked` + `highlight.js` + `mermaid`
  - `SplitView.svelte` — Resizable split panes via `svelte-splitpanes`
  - `OutlineSidebar.svelte` — Heading outline navigation
  - `StatusBar.svelte` — Cursor position, word/line/char counts
  - `ReloadDialog.svelte` — External file change notification
- `routes/+page.svelte` — Main page, wires everything together: file ops, menu handling, drag-and-drop, formatting commands

### Backend Structure (`src-tauri/src/`)

- `lib.rs` — Tauri app setup: plugins (opener, fs, dialog), managed state, menu construction, command registration
- `commands/file_ops.rs` — `read_file`, `write_file`, `get_file_name`
- `commands/file_watcher.rs` — `start_watching`/`stop_watching` using `notify` crate with `FileWatcherState` mutex
- `commands/export.rs` — `export_html` using `pulldown-cmark`, embeds `preview.css` into standalone HTML

### Styling

Global CSS variables in `static/styles/global.css` with light/dark theme support (`.dark` class on `<html>`). Preview styling in `static/styles/preview.css` (also embedded in HTML exports via Rust `include_str!`).

## Key Patterns

- **Svelte 5 runes throughout**: `$state`, `$derived`, `$effect`, `$props()`, `$bindable`, snippets. No Svelte 4 stores.
- **File watcher coordination**: Saves set `ignoreNextFileChange = true` to suppress the reload dialog when the app itself writes the file.
- **View modes**: `'editor' | 'preview' | 'split'` controlled via `doc.viewMode`, toggled from menu or keyboard shortcuts (Cmd+1/2/3).
- **Tauri capabilities**: FS access scoped to `$HOME`, `$DESKTOP`, `$DOCUMENT`, `$DOWNLOAD` (see `capabilities/default.json`).
