# MDLite

A lightweight desktop Markdown editor built with Tauri v2, SvelteKit, and Svelte 5.

## Features

- **CodeMirror 6 editor** with markdown syntax highlighting, line numbers, search, and history
- **Live preview** with [marked](https://github.com/markedjs/marked), syntax highlighting via highlight.js, and Mermaid diagram support
- **Split view** — editor-only, preview-only, or resizable side-by-side (Cmd+1/2/3)
- **Smart lists** — auto-continues ordered, unordered, and task lists on Enter
- **Formatting shortcuts** — bold, italic, code, headings, links, list toggling
- **Auto-formatting on save** using remark (GFM support)
- **Heading outline sidebar** for document navigation
- **File watching** — detects external changes and prompts to reload
- **HTML export** — standalone HTML files with embedded styles
- **Dark/light theme** following system preference
- **Status bar** with cursor position, word count, line count, and character count

## Prerequisites

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

## Getting Started

```bash
# Install frontend dependencies
pnpm install

# Run the full desktop app (compiles Rust + launches app)
pnpm tauri dev

# Or run just the frontend dev server (Vite on port 1420)
pnpm dev
```

## Building

```bash
pnpm tauri build
```

Produces platform-specific installers in `src-tauri/target/release/bundle/`.

## Project Structure

```
src/                        # Frontend (SvelteKit SPA)
├── lib/
│   ├── state/              # Svelte 5 rune-based document state
│   ├── codemirror/         # Editor setup, smart lists, formatting keybindings
│   ├── components/         # Editor, Preview, SplitView, OutlineSidebar, StatusBar
│   ├── markdown-formatter.ts
│   ├── menu-handler.ts
│   └── theme.ts
└── routes/+page.svelte     # Main page

src-tauri/src/              # Backend (Rust)
├── lib.rs                  # App setup, plugins, menu, command registration
└── commands/
    ├── file_ops.rs         # read_file, write_file, get_file_name
    ├── file_watcher.rs     # File change detection via notify crate
    └── export.rs           # HTML export with embedded CSS
```

## Type Checking

```bash
pnpm check
```
