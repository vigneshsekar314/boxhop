# Boxhop — Product Concept v2

Status: brainstorming draft. This document refines `concepts.md`, uses `plan.md` as historical context, and draws on the explaining workflow in `user_paths.md`. It describes intended behavior; it is not a commitment to implement every feature here.

## 1. Purpose

Boxhop is a keyboard-first canvas for thinking through and explaining ideas with connected text blocks. The user should be able to capture a thought, connect it to another thought, and keep explaining without repeatedly switching between typing and drawing tools.

The central interaction is a diagram outside and a Vim-style text editor inside each block. Navigation between thoughts and editing within a thought have distinct scopes, with a visible mode indicating which scope currently owns the keyboard.

The main use cases are brainstorming an unfamiliar concept, building an explanation incrementally, and revisiting or presenting an existing diagram. A useful first version should make these workflows comfortable before adding a broad selection of shapes, exports, or customization options.

## 2. Decisions and working assumptions

### Confirmed direction

- Editing a block preserves Vim text editing: in insert mode, `Enter` inserts a newline, and `Tab` remains an editor key.
- From Vim insert mode, `Esc` returns to Vim normal mode. Another `Esc`, pressed while already in Vim normal mode, leaves the block editor and returns to the canvas.
- On the canvas, `h/j/k/l` moves focus between blocks. Viewport panning uses separate controls.
- New blocks are placed automatically near the focused block. Existing positions remain stable; rearrangement is an explicit action.
- The project is still in a brainstorming phase. The implementation document is a staged outline, with interaction experiments before substantial development.

### Carried forward as working assumptions

The old plan proposes a desktop browser application, static hosting, local storage, and offline use without accounts or a backend. These remain sensible defaults, but they are assumptions rather than new product requirements confirmed in this revision.

Other choices below, including exact navigation rules, extra shortcuts, file naming, and release scope, are proposals. The `aa`, `al`, and `atl` creation sequences come directly from the current concept draft.

## 3. Vocabulary and scope

| Term | Meaning |
|---|---|
| Diagram | A saved collection of blocks and links on a canvas. |
| Block | A thought represented by a text area inside a visible shape. |
| Link / edge | A relationship connecting two blocks, optionally with a text label. |
| Focus | The current keyboard target, visibly indicated on the canvas. Initially, one block at a time. |
| Selection | One or more entities an action will operate on. In the first version, the focused block is also the selection. |
| Viewport | The visible area of the diagram, including its pan position and zoom. |
| Pan mode | The outer canvas mode for navigation, creation, and diagram actions. |
| Vim normal mode | The text editor's normal mode, available only while editing a block. |

The draft's keybinding table uses “normal” for the outer mode. This revision consistently calls that mode **pan mode**, reserving **Vim normal** for text editing. Pan mode includes both moving focus and controlling the viewport; those are separate actions.

A diagram is a graph. It can contain disconnected blocks, branches, cycles, and links between existing blocks. Creating a linked block does not automatically make it a nested child or impose a tree hierarchy.

## 4. Core workflows

### Capture an independent thought

1. From pan mode, press `aa`.
2. Boxhop creates and focuses a block in a nearby open area and enters its editor in Vim insert mode.
3. Type the thought, including multiple lines if useful.
4. Press `Esc` to use Vim normal commands within the block. Press `Esc` again to return to pan mode.

With no focused block, placement uses the visible canvas area. With a focused block, placement is nearby but creates no link.

### Extend an explanation

1. Focus an existing block and press `al`.
2. Boxhop creates a new block and a link from the original block to the new one.
3. Focus moves into the new block's editor in Vim insert mode.
4. Type the next thought, leave editing, and repeat as needed.

The original block remains the link source even after focus moves. The proposed default is a directed link from the existing thought to the new one; arrow style can be revisited separately.

### Explain the relationship before the next thought

1. Focus a block and press `atl`.
2. Boxhop prepares a linked block and opens a small editor for the link label.
3. Type a relationship such as “depends on” or “produces.”
4. Press `Enter` to confirm the label and enter the new block in Vim insert mode.

The link-label editor is a single-line input with `Enter` to confirm and `Esc` to cancel. It is not the block's Vim editor. Proposed cancellation behavior: cancel the pending creation as a whole, leaving the original diagram unchanged. An empty confirmed label creates an unlabeled link.

### Revisit and explain an existing diagram

Move focus with `h/j/k/l`, cycle through blocks, or search for text. Keep the focused block visible, center it when useful, and enter its editor with `i` or `Enter` to add detail. Adding emphasis, hiding unrelated material, and following a prepared focus queue are later extensions of this workflow.

## 5. Interaction model

There are three top-level modes: **pan**, **edit**, and **application command**. Edit mode contains Vim's own modes. Search and link-target selection are temporary interactions within pan mode; they do not need to become permanent top-level modes.

| Current context | Input | Result |
|---|---|---|
| Pan, block focused | `i` or `Enter` | Enter that block's editor in Vim insert mode. |
| Pan | `aa` | Create an unlinked block and start typing. |
| Pan, block focused | `al` | Create a linked block and start typing. |
| Pan, block focused | `atl` | Label a new link, then type in its new block. |
| Pan | `:` | Open the application command line. |
| Edit · insert | `Esc` | Enter Vim normal mode inside the same block. |
| Edit · normal | `Esc` | Leave the editor and return focus to the block on the canvas. |
| Edit · visual or Vim command line | `Esc` | Follow Vim behavior, returning to Vim normal before a later `Esc` leaves editing. |
| Edit | `Enter` / `Tab` | Follow editor behavior; do not create or navigate to blocks. |
| Edit · normal | `:` | Open the editor's Vim command line. |
| Application command | `Enter` | Execute a recognized command; normally return to pan mode. |
| Application command | `Esc` | Cancel and return to pan mode. |

The distinction between the two command lines is deliberate. `:` inside a block belongs to Vim. Application commands are entered from pan mode. The first version need not implement every Vim Ex command, and must not silently reinterpret unsupported editor commands as application commands.

The mode display should use explicit labels such as `PAN`, `EDIT · INSERT`, `EDIT · NORMAL`, and `COMMAND · APP`. Pending key sequences and temporary interactions should also be visible. For example, pressing `a` starts the creation prefix and shows the available continuations; it does not create a block immediately. `Esc` cancels the prefix, and an invalid continuation produces no document mutation.

### Vim support

The desired experience is familiar Vim editing, using an existing editor integration where possible. A reasonable first subset includes normal, insert, and visual modes; motions and word movement; insert/append; delete/change/yank/paste; and text undo/redo. Ex commands depend on the editor integration and need an explicit support list.

Full Neovim compatibility, plugins, and configuration are not implied. Remapping the key that returns to Vim normal mode remains a low-priority enhancement, as in the original draft.

## 6. Navigation and layout

Moving focus changes the keyboard target. Panning changes what part of the canvas is visible. Neither operation edits block positions.

Proposed navigation defaults:

- `h/j/k/l`: focus a block to the left/below/above/right. Choose candidates using a predictable spatial rule, with stable tie-breaking; do nothing if there is no candidate in that direction.
- `Tab` / `Shift+Tab` in pan mode: cycle through all blocks in a stable order, including disconnected blocks. This order is independent of graph links and can initially follow creation order.
- `/`: search block text, then confirm a match to focus it. Canceling returns to the previous focus.
- An explicit center action brings the focused block to the middle of the viewport. Ordinary focus changes pan only enough to keep the target visible.
- Separate pan, zoom, and fit-to-diagram actions remain available by keyboard; their exact bindings are still open.

Spatial navigation is a proposal, not a requirement to infer parents and children from links. A more graph-oriented navigation scheme can be explored after trying representative diagrams.

Automatic placement should find nearby free space and preserve existing block coordinates. Editing longer text may enlarge a block, but should not trigger a full-diagram rearrangement. An explicit rearrange action may move existing blocks and must be undoable. The precise placement and collision rules need a small prototype rather than a promise of perfect automatic layout.

The first version can start with one rectangular block shape. More shapes are useful only if they improve explanation without complicating the creation flow.

## 7. Diagram actions and commands

Beyond creation and editing, the usable core needs:

- Linking two existing blocks through source selection, target navigation/search, and confirmation. `Esc` cancels without creating a link.
- Editing and removing an existing link or its label. A keyboard target picker can provide access to links without mixing them into block navigation.
- Deleting a focused block together with its incident links, with undo available.
- Undo and redo for document changes, with clear boundaries between text editing history and diagram history.
- Creating, opening, and saving diagrams, plus help for the active mode.

Application commands should invoke the same actions as shortcuts. A small proposed vocabulary is `:new-diagram`, `:open`, `:w`, `:help`, and later `:layout` or `:export <format>`. Names and syntax remain open; a complete command language is unnecessary for the first experiment. These commands operate on Boxhop documents, not a shell.

Missing prerequisites should produce a brief explanation. For example, `al` without a focused source should ask the user to focus a block or use `aa`; it should not silently create something different.

## 8. State, history, and local ownership

Keep three kinds of state distinct:

| State | Examples | Expected lifetime |
|---|---|---|
| Document content | Block text, positions, links, labels, stable block order | Saved and exported. |
| Session state | Current mode, focus, pending keys, search, link source | Temporary; never treated as diagram content. |
| Preferences | Future keymap overrides, theme | Stored separately from the diagram. |

The user must be able to save and reopen a diagram without losing its text, relationships, or layout. A versioned native JSON file is the proposed baseline; `.boxhop.json` is a provisional filename convention, not a finalized format.

Under the browser-based assumption, local autosave supports recovery, while file save provides a portable copy. The interface should distinguish “saved in this browser” from “saved to a file.” File save uses a supported file API or a download fallback; browser storage alone is not a portable backup.

While editing, Vim undo/redo operates on text. From pan mode, document undo/redo operates on diagram changes. Creating a linked block must be reversible without leaving a dangling link. The implementation needs to verify how editor history joins document history, including text recovery before the user leaves the editor.

Viewport movement and focus changes should not clutter document undo. Exporting or autosaving a document should not require leaving Vim insert mode first.

## 9. Scope proposal

### First usable version

- One canvas with rectangular text blocks and optional labeled links.
- Pan mode, nested Vim editing modes, and a small application command line.
- `aa`, `al`, `atl`, editing existing blocks, navigation, search, and separate viewport controls.
- Stable automatic placement, with an explicit way to adjust positions.
- Link existing blocks; edit labels; remove blocks and links; undo/redo.
- Local recovery, native JSON save/open, and visible mode/save status.
- Keyboard help and reliable focus behavior, including a deliberate way to leave the canvas using normal browser navigation.

### Later possibilities

These ideas remain valuable, but are not prerequisites for validating the central interaction:

- Highlighting several blocks while explaining, filtering, and named focus queues.
- Tags, block aliases, notes, and metadata panels.
- Visual sub-blocks, divided text sections, and nested diagrams. These represent different concepts and need separate examples before designing storage or shortcuts.
- More shapes, templates, configurable keymaps, and macro recording.
- SVG/PNG export, followed by Mermaid, Markdown, PDF, or standalone HTML when there is a concrete need. Any graph-to-outline export needs an explicit policy for cycles and shared links.
- PWA installation and verified offline use, if the static browser delivery model is retained.

Accounts, collaboration, cloud sync, mobile-first editing, and compatibility with third-party mind-map files are outside the current core proposal. They can be reconsidered when there is a specific need.

## 10. What would make the concept successful?

An early hands-on trial should establish whether someone can:

1. Build a small explanation using only the keyboard, including independent blocks, connected blocks, and labeled relationships.
2. Edit multiline text with familiar Vim behavior without accidentally creating blocks or triggering canvas actions.
3. Understand the current keyboard scope and leave editing reliably.
4. Move through disconnected or branching ideas without losing their place.
5. Add a thought without shifting the rest of the diagram, and rearrange deliberately when needed.
6. Undo a mistake and recover a saved diagram with its content and positions intact.

These are workflow criteria, not performance targets or a release deadline.

## 11. Remaining discussion points

- Is the static, local-first browser application still the intended delivery model?
- Does spatial `h/j/k/l` navigation feel right in real examples, or should links determine movement? How should ties be resolved?
- Which keyboard controls feel natural for panning, zooming, centering, and moving a block?
- Which Vim commands are essential personally, beyond the proposed initial subset?
- What should happen when an empty new block is left without typing? The conservative starting proposal is to retain it and allow undo/delete.
- Are links directed by default, and are parallel links or self-links useful? These need a stated policy before graph operations are implemented.
- Does the first usable version need image export or highlighting to support live explanation, or can these follow the core workflow?

The matching [implementation outline](implementation_v2.md) is organized around resolving these uncertainties before expanding the feature set.
