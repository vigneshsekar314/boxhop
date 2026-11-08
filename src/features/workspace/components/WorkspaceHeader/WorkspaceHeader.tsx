import type { WorkspaceController } from '../Workspace/Workspace.hooks';

export function WorkspaceHeader({ workspace: controller }: { workspace: WorkspaceController }) {
  const {
    workspace,
    fileMenu,
    setFileMenu,
    fileMenuRef,
    fileButton,
    preview,
    togglePreview,
    editing,
    finishEdit,
    fileInput,
    exportFile,
    openFile,
    setHelp,
    newDiagram,
  } = controller;

  return (
    <header className='topbar'>
      <a className='brand' href='./' aria-label='Boxhop home'>
        <span className='brand-icon'>
          b<span>↗</span>
        </span>boxhop<span className='prototype'>playground</span>
      </a>
      <div className='document-name'>
        {workspace.tabs.find((tab) => tab.id === workspace.activeId)!.title} <span>/</span>
        <small>local draft</small>
      </div>
      <nav aria-label='Document actions'>
        <div
          className='file-menu'
          ref={fileMenuRef}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setFileMenu(false);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && fileMenu) {
              event.stopPropagation();
              setFileMenu(false);
              fileButton.current?.focus();
            }
          }}
        >
          <button
            ref={fileButton}
            aria-haspopup='menu'
            aria-expanded={fileMenu}
            onClick={() => setFileMenu((open) => !open)}
          >
            File
          </button>
          {fileMenu && (
            <div className='file-menu-items' role='menu'>
              <button autoFocus role='menuitem' onClick={() => newDiagram()}>
                New diagram <kbd>:new</kbd>
              </button>
            </div>
          )}
        </div>
        <button aria-pressed={preview} aria-controls='markdown-preview' onClick={togglePreview}>
          Preview
        </button>
        <button
          onClick={() => {
            if (editing) finishEdit();
            fileInput.current?.click();
          }}
        >
          Open
        </button>
        <button onClick={exportFile}>
          Download <span aria-hidden='true'>↗</span>
        </button>
        <button
          className='help-button'
          aria-label='Keyboard shortcuts'
          onClick={() => setHelp(true)}
        >
          ?
        </button>
      </nav>
      <input ref={fileInput} hidden type='file' accept='.json' onChange={openFile} />
    </header>
  );
}
