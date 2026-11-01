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
| Canvas | `dd` | Delete the focused block and its links. |
| Canvas | `u` / `Ctrl+r` | Undo / redo a diagram change. |
| Canvas | `Shift+H/J/K/L` | Pan left/down/up/right. |
| Canvas | `+` / `-` / `0` | Zoom in / out / fit the diagram. |
| Canvas | `?` | Show shortcuts. |
| Block editor | `Esc` | Return from insert or visual mode to Vim normal mode. |
| Block editor, normal | `Esc` | Return to canvas navigation. |
| Block editor | Vim motions, `cw`, `dd`, `yy`, `p`, `v`, `u`, etc. | Edit text using the CodeMirror Vim integration. |

`Enter` inserts a newline in insert mode, and `Tab` indents. A Vim `:` command prompt belongs to the text editor; application command mode is not implemented. In canvas mode, `Tab` retains ordinary browser focus navigation. `Esc` also cancels a pending creation prefix or a link-label dialog.

Click to focus a block, double-click to edit, drag a block to reposition it, or drag empty canvas/scroll to pan. Keyboard navigation keeps the focused block visible. New blocks find free space without moving existing blocks.

## Saving and limits

The current diagram saves to this browser's local storage while typing, including before leaving insert mode. **Download** saves a native JSON copy; **Open** replaces the canvas with a previously downloaded prototype file. Opening a file can be undone with `u` on the canvas.

This is a desktop interaction prototype. Blocks have a fixed size and scroll for long text. Diagram undo uses at most 50 in-memory snapshots; Vim history lasts for the current editing session. Some compound Vim edits, such as `cw`, use separate undo steps for deleting and inserting text in this editor integration. Browser-local autosave is one draft, not a document library or a backup. There is no application command line, search, existing-block link creation, custom keymap, nesting, or PWA/offline installation yet.

## Checks

```sh
npm run build
npx playwright install chromium
npm test
```

Browser tests exercise actual Vim modes and motions, spatial navigation, stable placement, labeled-link cancellation, undo, draft recovery, and native file save/open.

## Design notes

- [Product concept](concepts_v2.md)
- [Implementation outline](implementation_v2.md)
- [Original concept](concepts.md), [original plan](plan.md), and [user paths](user_paths.md)
