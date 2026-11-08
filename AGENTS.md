# Boxhop agent guide

## Project layout

- `src/main.tsx` contains the React app, canvas interactions, diagram tabs, history, persistence, and JSON import/export.
- `src/VimEditor.tsx` wraps CodeMirror and its Vim integration. `src/style.css` contains the global UI styles.
- `tests/prototype.spec.ts` contains Playwright browser tests. `docs/README.md` is the detailed user guide; the root `README.md` is the project overview.
- `docs/concepts_v2.md` and `docs/implementation_v2.md` describe the design; check the running code before assuming every planned feature is implemented.

## Development and verification

- Use Node.js 22.12+ or 24+. Install with `npm install` and run locally with `npm run dev`.
- Run `npm run build` for TypeScript checking and the Vite production build. There is no separate lint script.
- Run `npm test` for the Playwright suite, or `npx playwright test -g 'test name'` for a focused test. Install the browser with `npx playwright install chromium` if needed.
- Playwright starts Vite on `127.0.0.1:5173` and reuses an existing server there; it uses `/usr/bin/chromium` when available. Tests run in parallel with isolated browser contexts.

## Behavioral invariants

- Canvas shortcuts must only run when the canvas owns keyboard focus. The CodeMirror editor has its own Vim modes and command prompt; do not let canvas shortcuts consume editor input. Escape moves one scope at a time, and repeated/composing events must not accidentally exit the editor.
- Diagrams are versioned JSON graphs. `isDiagram` validates blocks, links, and identifiers; exported files may also contain a diagram `name`. Keep older unnamed exports and the legacy single-diagram local-storage draft importable when changing the format.
- The workspace and active tab autosave to browser storage as text changes, including during an unfinished edit. Diagram history and camera/focus state are kept per tab in memory. Keep the current refs and React state synchronized through the existing update and tab-switching paths, including after asynchronous file reads.
- Opening a file creates a new tab rather than replacing a draft. Deleting a diagram requires confirmation, and deleting the last tab leaves a new empty diagram. Preserve other tabs and their histories during these operations.
- Markdown preview follows the focused block and updates live. Preserve safe rendering of untrusted text and keyboard-accessible scrolling and controls.

Follow the existing TypeScript, React, and CSS conventions; keep changes focused. Add or update browser tests for behavior changes, and update the relevant README when user-facing controls or storage behavior change.

## Component Architecture

Always organize components by business feature rather than generic file type. 

Structure layout:
src/
├── components/          # Global, generic UI elements only (Button, Input, Modal)
└── features/            # Feature-specific modules
    ├── auth/            # Isolated business domain
    │   ├── components/  # Components scoped strictly to this feature
    │   ├── hooks/       # Feature-specific state/logic hooks
    │   └── index.ts     # Public API (Strict encapsulation)


## Component Composition File Rule

Every non-trivial component must live in its own self-contained directory. 
Group all tightly coupled companion files together. Do not split them into global folders.

Example Structure:
Button/
├── Button.tsx       # UI rendering only
├── Button.hooks.ts  # Isolated data fetching/logic hooks (if any)
├── Button.test.tsx  # Unit and integration tests
└── index.ts         # Clean export point

## Separation of Concerns

* Keep component files focused strictly on UI presentation.
* Move heavy business logic, event listeners, or complex `useEffect` data fetching out of the main component file. 
* Extract logic into a sibling custom hook file (`*.hooks.ts`) or functional utility helpers.

## Encapsulation & Export Rules

* Use an `index.ts` file inside each feature or component folder to act as a strict public API gateway.
* Internal sub-components (e.g., `NavbarItem.tsx` inside a `Navbar` folder) must remain internal. Do not export them from the folder's `index.ts`.
* Avoid massive global barrel files (`components/index.ts` exporting everything in the project) to keep import paths clean and maintain optimal bundle sizes.

## Encapsulation & Export Rules

* Use an `index.ts` file inside each feature or component folder to act as a strict public API gateway.
* Internal sub-components (e.g., `NavbarItem.tsx` inside a `Navbar` folder) must remain internal. Do not export them from the folder's `index.ts`.
* Avoid massive global barrel files (`components/index.ts` exporting everything in the project) to keep import paths clean and maintain optimal bundle sizes.
