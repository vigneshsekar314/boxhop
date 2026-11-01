# Boxhop — Basic Implementation Outline v2

Status: planning draft based on [concepts_v2.md](concepts_v2.md). This is a sequence of experiments and incremental milestones, not a build schedule. No application implementation is included in this revision.

## 1. What changes from the old plan

| Old approach in `plan.md` | Revised direction |
|---|---|
| `Enter` / `Tab` create sibling/child blocks during text entry | Keep those keys inside the Vim editor; create blocks from pan mode with `aa`, `al`, and `atl`. |
| A single `Esc` exits text editing | Preserve Vim's mode transitions; leave the block only when `Esc` is pressed from Vim normal mode. |
| Tree-first navigation with spatial fallback | Start from a general graph; trial spatial focus movement plus stable cycling. No navigation parent field is required initially. |
| Auto-layout engine included in the core stack | Start with local placement and stable coordinates; evaluate a layout engine for explicit rearrangement later. |
| Macros, nested diagrams, customization, and many exports in the main roadmap | Defer them until the basic authoring and explanation workflows are validated. |
| Detailed stack and milestone commitments | Keep the stack provisional and use acceptance criteria instead of dates. |

The existing documents stay intact as historical references. Use `concepts_v2.md` for product behavior if an older shortcut or interaction conflicts with it.

## 2. Resolve the risky interactions first

Before building a full application, make a small disposable prototype or walkthrough covering:

1. **Keyboard ownership.** Enter a block in insert mode, type multiple lines, switch to Vim normal and visual modes, use Vim's command line, then leave editing with `Esc` from Vim normal. Verify that canvas shortcuts never run while the editor owns input, including held/repeated `Esc` events.
2. **Creation sequences.** Try `aa`, `al`, and `atl`, including invalid prefixes, no focused source, and canceling the link-label step. Check that the sequence is understandable without a mouse.
3. **Navigation and placement.** Use a handful of branching and disconnected blocks. Compare spatial focus movement, cycling, and searching. Add blocks and enlarge text without automatically rearranging existing blocks.
4. **History boundaries.** Try text undo in Vim and diagram undo after leaving the editor. Establish how initial text, subsequent edits, canceled creation, and recovery drafts become durable document changes.
5. **Keyboard exit and browser behavior.** Check focus entry/exit, IME composition, copy/paste, and browser shortcuts. Decide how a user deliberately leaves a canvas whose `Tab` key cycles blocks.

Deliverable: a short list of validated interactions, required Vim commands, remaining limitations, and any necessary changes to the concept. Set the link direction, duplicate-link, and self-link policies before implementing graph mutations. Confirm the browser/local-first delivery assumption before committing to browser-specific infrastructure.

## 3. Provisional technical approach

If the browser delivery model is retained, most of the old plan's technology suggestions remain reasonable. None requires adoption before the interaction trial.

| Concern | Starting candidate | Decision rule |
|---|---|---|
| Application | Vite, React, TypeScript | Static build with a straightforward development setup. |
| Canvas | React Flow with custom text-block nodes | Verify keyboard control, edge targeting, and focus handling in the prototype. |
| Block editor | CodeMirror 6 with a maintained Vim integration, initially evaluate `@replit/codemirror-vim` | Check required commands, nested mode transitions, history, and composition behavior. |
| UI state | React state/reducers; a small store if needed | Separate document and interaction state before adding state-management dependencies. |
| Validation | A runtime schema validator, such as Zod | Validate imported and recovered documents, with a versioned schema. |
| Storage | IndexedDB, possibly through `idb` | Save recoverable local snapshots without requiring file API support. |
| Placement | Small local placement routine | Add a layout engine only when explicit rearrangement needs it. |
| UI components | Minimal accessible components; shadcn/ui/Tailwind if useful | Avoid making a large component system a prerequisite for the canvas trial. |
| Tests | Vitest for core rules; Playwright for complete keyboard flows | Test behavior at the layer that can reveal actual failures. |

If offline support is pursued, bundle runtime dependencies locally and add a service worker after the save/recovery path works. Installable PWA support is a separate milestone.

## 4. Minimal architecture and document model

Use a few clear boundaries rather than a large up-front folder structure:

- **Document operations:** create/update/delete blocks, create/update/delete links, and move blocks. Validate graph invariants and return changes suitable for undo.
- **Interaction controller:** top-level mode, focused block, pending key sequence, editor sub-mode, command input, search, and pending link creation.
- **Canvas and editor adapters:** render document state and send semantic actions to the controller. Keep renderer-specific selection and internal editor state out of saved documents.
- **Persistence:** validated native import/export and local recovery, independent of the canvas library.

Keyboard bindings and the application command line should invoke the same named actions. A small fixed map is sufficient initially; a configurable trie, leader system, counts, and macro machinery are not required to support the three known creation sequences.

An initial native document needs only:

| Item | Minimum fields |
|---|---|
| Document | Schema version, stable ID, title, blocks, links, and stable block order. |
| Block | Stable ID, plain text, position, and the initial shape identifier. |
| Link | Stable ID, source block ID, target block ID, optional label, and direction. |

Block order supports cycling; positions support stable layout. Store each fact once. Do not introduce tree parents, nested documents, inline sections, or metadata structures before their behavior is defined. Viewport and preferences may be recovered separately without becoming document edits.

Keep block and link references valid, reject unsupported schema versions clearly, and migrate supported older versions only when an actual schema change requires it. Use `.boxhop.json` only as a provisional native filename convention.

## 5. Staged implementation

### Stage A — Thin authoring loop

Build the smallest useful path after the interaction trial:

- One canvas with rectangular text blocks and a clear focus indicator.
- Pan mode and an embedded Vim editor entered with `i` or `Enter`.
- `aa` and `al`, local non-overlapping placement where possible, and stable existing positions.
- `h/j/k/l` for spatial focus; `Tab` / `Shift+Tab` for stable cycling in pan mode.
- Separate keyboard actions for panning, zooming, and centering.
- A visible mode indicator, creation-prefix hints, and minimal help.

Acceptance: create and edit a short chain plus a disconnected thought entirely by keyboard. `Enter` and `Tab` never trigger canvas creation during text editing. Each deliberate `Esc` press follows the mode model; editor input never leaks into canvas actions. Newly created blocks do not relocate existing ones.

### Stage B — Complete the graph workflow

- Add `atl` with the temporary single-line link-label input. Keep pending creation separate from committed graph changes until confirmation; cancellation leaves no stray block or link.
- Support linking existing blocks, choosing a link by keyboard, editing its label, and removing a link independently.
- Add block deletion with incident-link cleanup and coherent undo/redo.
- Add simple text search and an explicit way to adjust block positions. Full automatic rearrangement can remain a later enhancement.
- Add the small application command line and route it to the existing action layer. Start with help and document actions as they become available.

Acceptance: build a branching diagram, connect an independent block, edit a relationship, cancel a pending relationship, and undo a deletion without losing links. Canceling target search restores its prior focus. Focus and viewport changes do not become document-history entries.

### Stage C — Make work recoverable and portable

- Validate and serialize native JSON, including coordinates and stable cycling order.
- Add local autosave and startup recovery. Capture current text even while its editor remains active; keep unconfirmed creation drafts separate from committed document content.
- Add explicit new/open/save actions with appropriate handling of unsaved work. Offer file access when supported and a download/upload fallback otherwise.
- Show local save state, file save state, and storage errors accurately. A failed save must leave the active document available for retry or download.
- Validate an imported document before replacing the active one. Bound local autosave delay and verify the recovery path rather than relying solely on a page-close handler.

Acceptance: a native save/open round trip preserves text, relationships, positions, and order. After a reported local save, reloading restores the document, including text entered before leaving insert mode. Malformed files or storage failures do not silently discard the current work.

Stages A–C form the proposed first usable version. Persistence should be developed alongside earlier stages if people will use the prototype for real work; a disposable prototype must be clearly identified.

### Stage D — Evaluate real use, then expand

Use Boxhop to prepare and explain a few real concepts. Record friction in focus movement, text editing, link creation, and placement before selecting the next feature.

Possible follow-up increments are highlighting, explicit automatic rearrangement, SVG/PNG export, metadata, configurable keymaps, and offline installation. Nested diagrams, macros, and broad export support remain independent projects with their own product questions. Do not turn the old feature list into a mandatory release checklist.

If adding offline installation, test a previously loaded app with the network disabled, including editing, save/recovery, and all lazily loaded assets needed for the supported workflow. Make application updates explicit and preserve active edits through the update path.

## 6. Verification strategy

Focus automated coverage on rules that could lose work or break the modal interaction:

- **Core tests:** graph integrity, deletion and undo, creation transactions, stable order, native round trips, and invalid-file rejection.
- **Interaction tests:** exclusive ownership of keys, prefix cancellation, mode-aware `Esc`, editor versus application `:`, and link-target cancellation.
- **Browser tests:** keyboard-only creation/edit/link/save/open, editor focus transitions, local recovery during editing, file fallback, and undo across editor/canvas boundaries.
- **Manual trials:** live explanation, visible mode/focus states, leaving the canvas by keyboard, composition input, browser shortcut conflicts, and representative desktop browsers.

Choose performance targets after observing realistic diagram sizes. Verify that text growth, focus changes, and new-block placement remain comfortable before adding a benchmark requirement from the old plan.

## 7. Decisions to revisit before expanding scope

- Retain or revise the static browser/local-first delivery model.
- Finalize spatial navigation rules and viewport/block-movement bindings from the interaction trial.
- Establish the supported Vim command subset and text-to-document history boundary.
- Decide whether highlighting or an image export is necessary for the first real explanation workflow.
- Define nesting, sub-blocks, and outline export semantics only when those features become priorities.

Update `concepts_v2.md` when these product decisions change, then adapt this outline. The next meaningful step is to review and try the interaction model, not to scaffold the entire old roadmap.
