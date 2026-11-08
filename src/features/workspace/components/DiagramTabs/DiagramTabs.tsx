import type { WorkspaceController } from '../Workspace/Workspace.hooks';

export function DiagramTabs({ workspace: controller }: { workspace: WorkspaceController }) {
  const {
    workspace,
    renaming,
    setRenaming,
    finishRename,
    activateTab,
    startRename,
    onTabKey,
    deleteTrigger,
    setDeleting,
  } = controller;

  return (
    <div className='diagram-tabs' role='tablist' aria-label='Open diagrams'>
      {workspace.tabs.map((tab, index) => (
        <div
          key={tab.id}
          role='presentation'
          className={`diagram-tab ${workspace.activeId === tab.id ? 'active' : ''}`}
        >
          {renaming?.id === tab.id
            ? (
              <input
                className='tab-rename'
                aria-label='Diagram name'
                autoFocus
                value={renaming.value}
                onFocus={(event) => event.currentTarget.select()}
                onChange={(event) => setRenaming({ id: tab.id, value: event.target.value })}
                onBlur={() => finishRename(true, false)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    finishRename(event.key === 'Enter', true);
                  }
                }}
              />
            )
            : (
              <button
                className='tab-select'
                role='tab'
                aria-selected={workspace.activeId === tab.id}
                aria-controls='diagram-panel'
                tabIndex={workspace.activeId === tab.id ? 0 : -1}
                title='Double-click or press F2 to rename'
                onClick={() => activateTab(tab.id)}
                onDoubleClick={() => startRename(tab)}
                onKeyDown={(event) => onTabKey(event, tab, index)}
              >
                {tab.title}
              </button>
            )}
          <button
            className='tab-close'
            aria-label={`Delete diagram ${tab.title}`}
            title={`Delete ${tab.title}`}
            onClick={(event) => {
              deleteTrigger.current = event.currentTarget;
              setDeleting(tab.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
