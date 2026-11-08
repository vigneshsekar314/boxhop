# Boxhop prototype

A small keyboard-first thinking canvas. Use this to try the interaction model and give feedback; it deliberately uses a single React component for the canvas and a small CodeMirror Vim adapter.

## Run

From the project root, with Node.js 22.12+ or 24+:

```sh
npm install
npm run dev
```

Open the URL Vite prints (normally http://127.0.0.1:5173). A sample diagram is ready to navigate. The canvas receives keyboard focus on load; click an empty part of it to return focus after using toolbar buttons.

## Controls

| Context | Keys | Action |
|---|---|---|
| Canvas | `h j k l` | Focus a block left, down, up, or right. |
| Canvas | `i` / `Enter` | Edit the focused block in Vim insert mode. |
| Canvas | `aa` | Create an independent block and start typing. |
| Canvas | `al` | Create a linked block and start typing. |
| Canvas | `atl` | Type a link label, then create and edit a linked block. |
| Canvas | `d` | Delete the focused block and its links. |
| Canvas | `u` / `R` or `Ctrl+r` | Undo / redo a diagram change. |
| Canvas | `Shift+H/J/K/L` | Pan left/down/up/right. |
| Canvas | `+` / `-` / `0` | Zoom in / out / fit the diagram. |
| Canvas | `p` | Toggle the focused block's Markdown preview. |
| Canvas | `:new [name]` then `Enter` | Create a new empty diagram in a tab, optionally naming it. |
| Canvas or diagram tab | `F2` | Rename the active diagram. |
| Canvas | `?` | Show shortcuts. |
| Block editor | `Esc` | Return from insert or visual mode to Vim normal mode. |
| Block editor, normal | `Esc` | Return to canvas navigation. |
| Block editor | Vim motions, `cw`, `dd`, `yy`, `p`, `v`, `u`, etc. | Edit text using the CodeMirror Vim integration. |

`Enter` inserts a newline in insert mode, and `Tab` indents. In canvas mode, `:` opens the application command prompt; type `new` or `new diagram name` and press `Enter` to create a diagram, or `Esc` to cancel. A Vim `:` prompt inside a block is separate. In canvas mode, `Tab` retains ordinary browser focus navigation. `Esc` also cancels a pending creation prefix or a link-label dialog.

Choose **File → New diagram** or use `:new` to open an empty diagram in a new application tab. Click a tab to switch diagrams, or use the arrow keys while a tab is focused. Double-click a tab or press `F2` in canvas mode or on a focused tab to rename the active diagram; press `Enter` or click elsewhere to save, or `Esc` to cancel. Empty names leave the existing name unchanged. Each tab has its own in-memory undo and redo history, including renames.

Use the **×** on a tab to delete its diagram after confirmation. Deletion cannot be undone; download a copy first if needed. Deleting the last tab opens a new empty diagram.

Click to focus a block, double-click to edit, drag a block to reposition it, or drag empty canvas/scroll to pan. Keyboard navigation keeps the focused block visible. New blocks find free space without moving existing blocks.

Use **Preview** in the toolbar or `p` on the canvas to open a scrollable Markdown side pane. It follows the focused block and updates while you edit. Tab to the preview content to scroll with the keyboard; `Esc` closes the pane when focus is inside it.

## Saving and limits

All open diagrams and the active tab save to this browser's local storage while typing, including before leaving insert mode. An existing single-diagram draft is carried into the first tab. **Download** saves the active diagram and its name as a native JSON copy. **Open** imports a file into a new tab without replacing existing diagrams, restoring its name when present or using the filename for older files. Use the tab's **×** to delete an imported diagram if needed.

This is a desktop interaction prototype. Blocks have a fixed size and scroll for long text. Diagram undo uses at most 50 in-memory snapshots per tab and does not survive reload; Vim history lasts for the current editing session. Some compound Vim edits, such as `cw`, use separate undo steps for deleting and inserting text in this editor integration. Browser-local autosave is not a document library or a backup. The application command line currently supports only `:new`. There is no search, existing-block link creation, custom keymap, nesting, or PWA/offline installation yet.

## Checks

```sh
npm run build
npx playwright install chromium
npm test
```

Browser tests cover Vim editing, spatial navigation, block and diagram changes, Markdown preview, tab naming and deletion, draft recovery, and importing/exporting diagrams.

## Design notes

- [Product concept](concepts_v2.md)
- [Implementation outline](implementation_v2.md)
- [Original concept](concepts.md), [original plan](plan.md), and [user paths](user_paths.md)
