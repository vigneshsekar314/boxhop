# Boxhop — Plan

A keyboard-first diagram editor. Type a thought, wrap it in a block, link it to another block, and move on, all without touching the mouse. Runs as a static, offline-capable web page. No login, no backend.

## 1. Goals and non-goals

**Goals**
- Create and link blocks with a few keystrokes, with minimal cognitive load.
- Modal editing (navigate / command / edit / macro) with vim-style motions.
- Fully client-side. Once loaded, it works with no network (installable PWA).
- Customizable key bindings (neovim-style leader and keymap config).
- Export to common formats, modelled on MindMap Studio's export menu.

**Non-goals (v1)**
- Accounts, sync, real-time collaboration.
- Pixel-perfect manual layout tools. Layout is automatic by default.
- Importing third-party mind-map formats.

## 2. What the inputs say

### 2.1 MindMap Studio (reference app)
- Local-first PWA: static files, service worker, installable, opens its own `.mmst` files, and keeps data in the browser. This is the same hosting model we want.
- Export menu, as seen in the toolbar (the site has no written docs), grouped as:
  - **Data:** JSON, Markdown, OPML, FreeMind, Mermaid, XMind, and others.
  - **Image:** PNG (1x / 2x / 4x / transparent), copy image to clipboard, SVG.
  - **Document:** HTML, interactive HTML, PDF (fit / A4 / Letter / browser print), DOCX, XLSX.
  - **Presentation:** HTML deck, PPTX.
- Saving uses the File System Access API where available and falls back to a download otherwise.
- Takeaway: exports are plain client-side serializers over one in-memory document model. Heavy ones (PDF, DOCX, PPTX) are lazy-loaded so the initial load stays small.

### 2.2 `idea_diagram.mmst` (feature ideas)
Core flow and features to support:
1. Type text and wrap it in a block in one move.
2. Link the block to another: press a key, start typing. `Tab` creates a child and `Enter` creates a sibling.
3. Confirm the edit, return to navigate mode, move across nodes.
4. Define the relationship (edge label or type) with a key.
5. Edit a block's metadata in a popup or sidebar.
6. Nest a diagram inside a block (shift+click or a key to enter it).
7. Delete a block.
8. Tag blocks.
9. Give a block a short name for quick navigation.
10. Sub-blocks, either as a separate block or inline, separated by a line.
11. Create an unlinked block, then link it later (`super+l`, navigate to the target, `Enter` to confirm, `Esc` to cancel).

### 2.3 `state_diagram.mmst` (modes and keys)
| Mode | Purpose |
|---|---|
| **Navigate** | `hjkl` to traverse. `/` searches node names (auto-generated labels are visible). Motions like `$` (last node) and a "first node" jump. |
| **Command** | Pick the shape of the next block. File CRUD. Search and filter. Create blocks or templates by command, linked or not. |
| **Edit** | Vim bindings for the text inside a block. |
| **Macro** | Record a key sequence and replay it. |

Example leader bindings from the note, all in navigate mode:
- `<leader>c`: new cylinder linked to the selection, then edit.
- `<leader>ic`: new cylinder with no arrow.
- `<leader>b`: new rectangle, then edit.
- `<leader>s`: sub-block inside the block.
- `<leader>ls`: text area inside the block, separated by a line.

Keymaps must be user-customizable, as in neovim.

## 3. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Build | Vite + React + TypeScript | Requested. Static output. |
| UI kit | shadcn/ui + Tailwind | Requested. Used for dialogs, command palette, sidebar, toasts. |
| Canvas | `@xyflow/react` (React Flow) with custom node types | Handles pan/zoom, edges, selection, and custom shapes. Avoids writing a renderer. |
| Auto-layout | `elkjs` (or `dagre` to start) | Lets the user never position blocks by hand. |
| State | Zustand + Immer | Small, fast, easy undo/redo via patches. |
| Mode machine | Hand-rolled reducer (XState if it gets hairy) | Four modes with explicit transitions. |
| In-block vim editing | CodeMirror 6 + `@replit/codemirror-vim` | Real vim text editing without building it. |
| Storage | IndexedDB (`idb`) plus File System Access API | Offline, no server. |
| Offline | `vite-plugin-pwa` (Workbox) | Precache app shell, installable. |
| Tests | Vitest, Testing Library, Playwright | Unit tests for the keymap engine; e2e for offline and key flows. |

Keep the dependency list lean. Everything must be bundled, with no CDN calls at runtime.

## 4. Architecture

```
src/
  core/
    model/        # Document, Block, Edge types + zod schema + migrations
    commands/     # Pure document operations (addBlock, link, delete, tag...)
    history/      # Undo/redo (immer patches)
    layout/       # elk/dagre adapter
  input/
    modes.ts      # navigate | command | edit | macro state machine
    keymap/       # Trie matcher, counts, leader, user keymap loader
    actions.ts    # Named actions that keys map to (the macro unit)
    macros.ts     # Record/replay of actions
  ui/
    canvas/       # React Flow wrapper, custom nodes (rect, cylinder, ...)
    editor/       # CodeMirror vim editor for block text
    command/      # `:` command line + parser + completions
    hints/        # Jump labels for `/` search
    sidebar/      # Metadata (tags, name, notes), shortcut cheat sheet
    statusline/   # Mode, pending keys, register, file name
  io/
    storage.ts    # IndexedDB autosave + library
    files.ts      # File System Access + download fallback
    export/       # One module per format, lazy-loaded
  pwa/            # Service worker registration, update prompt
```

Principles:
- **Keys map to named actions, and actions call pure commands.** This gives us customizable keymaps, macros that replay actions rather than raw keys, and easy testing.
- **The document is the single source of truth.** The canvas is a view. Layout is derived and stored only as optional per-block overrides.
- **Modes are explicit.** The status line always shows the current mode and any pending keys.

## 5. Data model

A diagram is a graph, not a tree. The ideas file needs both parent/child creation (`Tab`, `Enter`) and arbitrary links between existing blocks, plus unlinked blocks.

```ts
type Doc = {
  schemaVersion: 1; id: string; title: string;
  blocks: Record<string, Block>;
  edges: Record<string, Edge>;
  rootOrder: string[];            // top-level blocks, in navigation order
  meta: { createdAt: number; updatedAt: number; keymapId?: string };
};

type Block = {
  id: string;
  text: string;
  shape: 'rect' | 'rounded' | 'cylinder' | 'diamond' | 'ellipse' | ...;
  name?: string;                  // quick-nav alias
  tags: string[];
  notes?: string;                 // markdown, shown in sidebar
  sections?: string[];            // inline sub-sections separated by a line
  children?: string[];            // nested sub-blocks drawn inside this block
  subDiagram?: Doc['id'];         // nested diagram opened with a key
  parent?: string;                // navigation-tree parent (first creator)
  pos?: { x: number; y: number }; // optional manual override
};

type Edge = {
  id: string; from: string; to: string;
  label?: string;                 // the "relationship"
  arrow: 'none' | 'forward' | 'both';
};
```

- Navigation uses a spanning tree built from `parent` plus edges. This keeps `hjkl` predictable.
- File format: versioned JSON with a zod schema. Extension `.vgm` (or similar), MIME `application/json`.
- Every schema change ships a migration function.

## 6. Interaction design

### 6.1 Modes and transitions
```
            i / a / o / Enter-on-new
 NAVIGATE ──────────────────────────► EDIT
    ▲  │  ▲                              │
    │  │  └──────── Esc ◄────────────────┘
    │  │ :
    │  ▼
    │ COMMAND ── Enter/Esc ──► NAVIGATE
    │
    └─ q{reg} … q ─► MACRO (recording; still in navigate semantics)
```
- The macro "mode" is a recording state layered over navigate. `q{reg}` starts and stops, and `@{reg}` replays.

### 6.2 The fast path ("one move")
1. In navigate mode, press `<leader>b` to create a block and enter edit mode.
2. Type text.
3. `Tab` confirms and creates a linked child, then enters edit mode on it. `Enter` creates a linked sibling. `Esc` confirms and returns to navigate.

A whole branch is typed in one flow: `text Tab text Tab text Esc`.

### 6.3 Navigation
- `h` parent, `l` first child, `j` / `k` next / previous sibling. Counts work (`3j`).
- When a direction has no tree neighbor, fall back to the nearest block in that spatial direction.
- `gg` / `G` jump to first / last block. `0` / `$` jump to the first / last sibling at the current level.
- `/` opens search. Matching blocks get visible hint labels, easymotion-style, and typing a label jumps to the block. `n` / `N` cycle matches.
- `'name` or `:goto name` jumps to a block by its quick-nav name.
- `Enter` on a block with a sub-diagram enters it, and `-` or `Backspace` goes back out, with a breadcrumb.

### 6.4 Linking
- `<leader>l` starts link mode from the selected block. Navigate to the target, then `Enter` confirms or `Esc` cancels.
- `r` on a selected edge or block sets the relationship label.

### 6.5 Command mode (`:`)
- Shape: `:shape cylinder` sets the shape of the next block.
- Create: `:new rect "text" --link`, `:template <name>`.
- Files: `:w`, `:e <name>`, `:new-doc`, `:rm`, `:export <fmt>`.
- Search and filter: `:filter tag:api`, `:filter off`.
- A shadcn `Command` palette gives completions and history.

### 6.6 Keymap customization
- Keymap is JSON (`{ mode, keys, action, args }`), supports `<leader>`, sequences, counts, and per-mode maps.
- A default keymap ships in the app. User overrides are stored in IndexedDB and edited in a settings page, with import and export as JSON.
- Conflict detection is shown when saving.
- A `?` overlay lists the active bindings for the current mode.

## 7. Export

Priorities follow the MindMap Studio menu, scaled to what a diagram editor needs.

| Phase | Formats | Approach |
|---|---|---|
| v1 | **JSON** (native), **SVG**, **PNG** (1x/2x/4x/transparent), **copy PNG to clipboard**, **Mermaid**, **Markdown** (outline) | Serialize the doc. SVG is built from our own render (not a DOM screenshot) so it is crisp and self-contained. PNG is the SVG drawn to a canvas. |
| v1.x | **PDF** (fit / A4 / Letter), **standalone HTML** | Lazy-loaded; PDF from SVG via `jspdf` + `svg2pdf.js`. |
| Later | OPML, FreeMind, XMind, DOCX, XLSX, PPTX | Only if needed. Skip if they don't fit a graph model. |

Notes:
- Each exporter is `(doc) => Blob`, in its own lazily imported module.
- Save through the File System Access API when present, otherwise an `<a download>`.
- Mermaid export needs a mapping from our shapes and edge types to Mermaid flowchart syntax. Nested diagrams and sub-blocks become `subgraph`s.
- Round-trip import is required for JSON only.

## 8. Offline and hosting

- `vite-plugin-pwa` with `generateSW`, precaching all built assets. Self-host fonts and icons.
- Set Vite `base: './'` so the build works from any static path.
- Web app manifest with `file_handlers` for the native extension.
- Show an "update available" toast when a new service worker is waiting. Never reload mid-edit.
- Request persistent storage (`navigator.storage.persist()`) to reduce eviction risk.
- Autosave to IndexedDB on every change (debounced), and warn users that clearing site data deletes unsaved diagrams. Prompt for file export regularly.
- Host on any static host (Cloudflare Pages, GitHub Pages, Netlify). Needs HTTPS for the service worker.
- Verify offline in CI: Playwright loads the site, goes offline, and exercises create/link/export.

## 9. Milestones

**M0: Scaffold (day 1)**
- Vite + React + TS, Tailwind, shadcn init, ESLint/Prettier, Vitest, Playwright.
- PWA plugin with a trivial offline shell.

**M1: Model and canvas**
- Types, zod schema, pure commands, undo/redo.
- React Flow canvas with rect and cylinder nodes, auto-layout, pan/zoom.
- Mouse-free selection highlighting.

**M2: Input engine**
- Mode machine, trie keymap matcher with counts and leader, status line.
- Navigate mode: `hjkl`, `gg`, `G`, `0`, `$`.
- Edit mode with CodeMirror vim, `Tab` / `Enter` / `Esc` create-and-confirm flow.

**M3: Authoring features**
- Create, link, delete, tag, name, relationship labels.
- Sub-blocks (separate and inline sections).
- `/` search with hint labels, `'name` jumps.

**M4: Command mode and persistence**
- `:` command line with palette, shapes, templates, filter.
- IndexedDB library, autosave, open/save files, multiple documents.

**M5: Nesting, macros, customization**
- Nested diagrams with breadcrumbs.
- Macro record/replay.
- Keymap settings UI, cheat sheet overlay.

**M6: Export**
- v1 formats, then PDF and HTML.

**M7: Polish and ship**
- Accessibility (focus, ARIA live status for mode), dark mode, responsive layout.
- Performance check at ~1000 blocks.
- Deployment and offline CI test.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Key handling clashes with browser shortcuts and with CodeMirror's own vim | One global key listener owned by the mode machine. In edit mode, hand keys to CodeMirror and intercept only `Esc`, `Tab`, `Enter`. Avoid `Ctrl+W/T/N` bindings. |
| Auto-layout feels unstable as blocks are added | Incremental layout that keeps existing positions. Animate transitions. Allow a manual override later. |
| Spatial `hjkl` is ambiguous in a graph | Tree-first navigation with spatial fallback, covered by unit tests on fixture graphs. |
| IndexedDB eviction loses data | Persistent storage request, periodic export prompt, easy file save. |
| Bundle size from layout and PDF libs | Lazy-load `elkjs`, PDF and other exporters. |
| Scope creep from the idea list | Ship through M4 as the usable core. M5 onward is incremental. |

## 11. Open questions

1. **"First node" key.** The state diagram says `I` for "go to first node", but `I` is insert-at-start in vim. Suggest `gg` / `0`. Confirm.
2. **Leader key.** `Space` is the proposed default. OK?
3. **File extension and format.** A new native format (`.vgm`), or reuse MindMap Studio's `.mmst`? Reuse would allow opening existing maps but ties us to a tree model.
4. **Sub-block vs nested diagram.** Both are in the ideas. Plan treats sub-blocks as visual containment inside a block and nested diagrams as a separate document opened from a block. Confirm.
5. **Mobile.** Out of scope for v1 since the input model is keyboard-first. Confirm.
6. **Export priority.** Is the v1 list (JSON, SVG, PNG, Mermaid, Markdown) enough to start, with PDF next?
