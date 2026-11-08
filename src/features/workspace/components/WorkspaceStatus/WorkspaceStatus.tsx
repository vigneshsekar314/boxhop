import type { WorkspaceController } from '../Workspace/Workspace.hooks';

export function WorkspaceStatus({ workspace: controller }: { workspace: WorkspaceController }) {
  const {
    editing,
    mode,
    command,
    setCommand,
    submitCommand,
    returnToCanvas,
    prefix,
    message,
    selectedIndex,
    diagram,
    saveState,
  } = controller;

  return (
    <footer className='statusbar' aria-label='Editor status'>
      <div className={`mode ${editing ? 'mode-edit' : ''}`} aria-live='polite'>
        <span className='mode-dot' />
        {mode}
      </div>
      {command !== null
        ? (
          <form className='command-line' onSubmit={submitCommand}>
            <label htmlFor='command-input'>:</label>
            <input
              id='command-input'
              aria-label='Command'
              autoFocus
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  event.stopPropagation();
                  setCommand(null);
                  returnToCanvas();
                }
              }}
            />
          </form>
        )
        : (
          <span className='status-hint' role='status'>
            {prefix
              ? `${prefix} …  ${
                prefix === 'a'
                  ? 'a: independent · l: linked · t l: labeled link'
                  : 'l: labeled link'
              }  · Esc cancels`
              : editing
              ? 'Esc → normal · Esc again → canvas'
              : message}
          </span>
        )}
      <div className='status-right'>
        <span>
          {selectedIndex >= 0 ? `${String(selectedIndex + 1).padStart(2, '0')} / ` : ''}
          {diagram.blocks.length} thoughts
        </span>
        <span className={saveState.startsWith('Saved') ? 'save-indicator' : 'save-error'}>
          ● <span>{saveState}</span>
        </span>
      </div>
    </footer>
  );
}
