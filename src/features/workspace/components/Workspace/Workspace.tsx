import { useWorkspace } from './Workspace.hooks';
import { WorkspaceHeader } from '../WorkspaceHeader';
import { DiagramTabs } from '../DiagramTabs';
import { DiagramCanvas } from '../DiagramCanvas';
import { WorkspaceStatus } from '../WorkspaceStatus';
import { WorkspaceDialogs } from '../WorkspaceDialogs';

export function Workspace() {
  const workspace = useWorkspace();

  return (
    <div className='app'>
      <WorkspaceHeader workspace={workspace} />
      <DiagramTabs workspace={workspace} />
      <DiagramCanvas workspace={workspace} />
      <WorkspaceStatus workspace={workspace} />
      <WorkspaceDialogs workspace={workspace} />
    </div>
  );
}
