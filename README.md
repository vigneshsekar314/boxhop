# Boxhop

Boxhop is a keyboard-first canvas for organizing thoughts as connected blocks. It combines spatial navigation with a Vim-style block editor and a Markdown preview.

## Getting started

Requires Node.js 22.12+ or 24+.

```sh
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://127.0.0.1:5173`). A sample diagram opens with the canvas ready for keyboard navigation.

## Working with diagrams

- Create an empty diagram with **File → New diagram**, or enter `:new` in canvas mode. Use `:new Project name` to name it immediately.
- Click a tab to switch diagrams. Double-click a tab or press `F2` in canvas mode to rename it. Press `Enter` to save or `Esc` to cancel.
- Click the **×** on a tab and confirm to delete its diagram. Deletion cannot be undone; deleting the last tab opens a new empty diagram.
- Use **Open** to import a JSON diagram into a new tab. Use **Download** to export the active diagram and its name. Older files without a name use their filename when imported.
- Use **Preview** or `p` in canvas mode to open a scrollable Markdown side pane. It follows the focused block and updates as you edit.

## Canvas shortcuts

| Keys | Action |
|---|---|
| `h`, `j`, `k`, `l` | Focus the block left, down, up, or right. |
| `i` or `Enter` | Edit the focused block in Vim insert mode. |
| `aa` / `al` / `atl` | Create an independent, linked, or labeled linked block. |
| `d` | Delete the focused block and its connections. |
| `u` / `R` or `Ctrl+r` | Undo / redo a diagram change. |
| `Shift+H/J/K/L` | Pan the canvas. |
| `+` / `-` / `0` | Zoom in / out / fit the diagram. |
| `p` | Toggle the Markdown preview. |
| `:new [name]` | Create a diagram in a new tab. |
| `F2` | Rename the active diagram. |
| `?` | Show keyboard shortcuts. |

Inside a block, Vim owns the keyboard. Press `Esc` to return to Vim normal mode, then `Esc` again to return to canvas navigation. Click or drag blocks to focus or move them; drag empty canvas or scroll to pan.

## Saving and limitations

Open diagrams and the active tab save to browser-local storage, including edits in progress. Download JSON copies for backup: browser storage is not a document library or a backup. An existing single-diagram draft migrates to the first tab.

Each tab has its own in-memory undo/redo history, which does not survive a reload. Vim history lasts for the current editing session. The application command line currently supports only `:new`.

## Checks

```sh
npm run build
npx playwright install chromium
npm test
```

See the [user guide](docs/README.md) for more controls and prototype limitations, and the [design notes](docs/concepts_v2.md) for the product concept.
