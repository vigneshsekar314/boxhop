import type { WorkspaceController } from '../Workspace/Workspace.hooks';

export function WorkspaceDialogs({ workspace: controller }: { workspace: WorkspaceController }) {
  const {
    deleting,
    cancelDelete,
    workspace,
    deleteDiagram,
    labelSource,
    label,
    setLabel,
    setLabelSource,
    create,
    returnToCanvas,
    help,
    helpClose,
    closeHelp,
  } = controller;

  return (
    <>
      {deleting && (
        <div className='overlay'>
          <section
            className='delete-dialog'
            role='dialog'
            aria-modal='true'
            aria-labelledby='delete-title'
            aria-describedby='delete-description'
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancelDelete();
              }
              if (event.key === 'Tab') {
                const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button');
                if (event.shiftKey && document.activeElement === buttons[0]) {
                  event.preventDefault();
                  buttons[buttons.length - 1]?.focus();
                } else if (
                  !event.shiftKey && document.activeElement === buttons[buttons.length - 1]
                ) {
                  event.preventDefault();
                  buttons[0]?.focus();
                }
              }
            }}
          >
            <span className='eyebrow'>DELETE DIAGRAM</span>
            <h2 id='delete-title'>
              Delete “{workspace.tabs.find((tab) => tab.id === deleting)?.title}”?
            </h2>
            <p id='delete-description'>
              This removes the diagram from this workspace and cannot be undone. Download a copy
              first if you want to keep it.{workspace.tabs.length === 1
                ? ' A new empty diagram will open.'
                : ''}
            </p>
            <div className='delete-actions'>
              <button autoFocus onClick={cancelDelete}>Cancel</button>
              <button className='delete-confirm' onClick={deleteDiagram}>Delete diagram</button>
            </div>
          </section>
        </div>
      )}

      {labelSource && (
        <div className='overlay'>
          <form
            className='label-dialog'
            role='dialog'
            aria-modal='true'
            aria-label='New link label'
            onSubmit={(event) => {
              event.preventDefault();
              create(true, label);
            }}
          >
            <span className='eyebrow'>CONNECT THE THOUGHTS</span>
            <h2>What's the relationship?</h2>
            <input
              autoFocus
              aria-label='Link label'
              placeholder='depends on, leads to, explains…'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Tab') event.preventDefault();
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  setLabelSource(null);
                  setLabel('');
                  returnToCanvas();
                }
              }}
            />
            <p>
              <kbd>Enter</kbd> create & start writing <span>·</span> <kbd>Esc</kbd> cancel
            </p>
          </form>
        </div>
      )}

      {help && (
        <div className='overlay'>
          <section
            className='help-dialog'
            role='dialog'
            aria-modal='true'
            aria-labelledby='help-title'
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.stopPropagation();
                closeHelp();
              }
              if (event.key === 'Tab') {
                event.preventDefault();
                helpClose.current?.focus();
              }
            }}
          >
            <div className='dialog-heading'>
              <span className='eyebrow'>LESS DRAWING. MORE THINKING.</span>
              <button ref={helpClose} aria-label='Close keyboard shortcuts' onClick={closeHelp}>
                ×
              </button>
            </div>
            <h2 id='help-title'>Keep your hands on the keys.</h2>
            <div className='shortcut-list'>
              {[
                ['h j k l', 'Focus left, down, up, right'],
                ['i / Enter', 'Edit the focused block · start in insert mode'],
                ['Esc, then Esc', 'Vim normal, then back to the canvas'],
                ['aa', 'Create an independent block'],
                ['al', 'Create a linked block'],
                ['atl', 'Label a connection, then create its block'],
                ['d', 'Delete the focused block and its links'],
                ['u / R / Ctrl+r', 'Undo / redo diagram changes in pan mode'],
                ['Shift+H J K L', 'Pan the viewport'],
                ['+ / − / 0', 'Zoom in / out / fit diagram'],
                ['p', 'Toggle Markdown preview'],
                [':new [name]', 'Open a new diagram in a tab'],
                ['F2', 'Rename the active diagram'],
                ['?', 'Show this guide'],
              ].map(([keys, text]) => (
                <div key={keys}>
                  <kbd>{keys}</kbd>
                  <span>{text}</span>
                </div>
              ))}
            </div>
            <p>
              Inside a block, Vim owns the keyboard. Enter adds a newline in insert mode. Tab
              indents. Drag a block to reposition it, or drag empty canvas to pan. Your draft saves
              in this browser as you type.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
