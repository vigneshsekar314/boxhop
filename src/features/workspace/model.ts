export type Block = { id: string; text: string; x: number; y: number };
export type Link = { id: string; from: string; to: string; label: string };
export type Diagram = { version: 1; blocks: Block[]; links: Link[] };
export type Camera = { x: number; y: number; zoom: number };
export type DiagramTab = { id: string; title: string; diagram: Diagram };
export type Workspace = { version: 1; activeId: string; tabs: DiagramTab[] };
export type Snapshot = { diagram: Diagram; title: string };
export type TabSession = {
  focused: string | null;
  camera: Camera;
  undo: Snapshot[];
  redo: Snapshot[];
};
const STORAGE_KEY = 'boxhop-prototype-v1';
export const WORKSPACE_KEY = 'boxhop-workspace-v1';
export const WIDTH = 264, HEIGHT = 172;
export const directions: Record<string, [number, number]> = {
  h: [-1, 0],
  j: [0, 1],
  k: [0, -1],
  l: [1, 0],
};
const demo: Diagram = {
  version: 1,
  blocks: [
    {
      id: 'start',
      x: 0,
      y: 0,
      text: 'An idea starts here.\n\nPress i to make this thought your own.',
    },
    {
      id: 'left',
      x: -360,
      y: 0,
      text: 'Find your way.\n\nh ←   j ↓   k ↑   l →\nMove between thoughts.',
    },
    {
      id: 'right',
      x: 360,
      y: 0,
      text:
        'Follow a connection.\n\nType al to add a linked thought.\nType aa for an independent one.',
    },
    {
      id: 'above',
      x: 0,
      y: -210,
      text:
        'A familiar way to write.\n\nVim lives inside every block.\nMotions, visual mode, edits, undo.',
    },
    {
      id: 'below',
      x: 0,
      y: 210,
      text: 'Leave room to think.\n\nEsc → Vim normal\nEsc again → back to the canvas',
    },
  ],
  links: [
    { id: '1', from: 'left', to: 'start', label: '' },
    { id: '2', from: 'start', to: 'right', label: 'then' },
    { id: '3', from: 'above', to: 'start', label: '' },
    { id: '4', from: 'start', to: 'below', label: '' },
  ],
};

export function isDiagram(value: unknown): value is Diagram {
  if (!value || typeof value !== 'object') return false;
  const d = value as Diagram;
  if (d.version !== 1 || !Array.isArray(d.blocks) || !Array.isArray(d.links)) return false;
  if (
    !d.blocks.every((b) =>
      b && typeof b.id === 'string' && typeof b.text === 'string' && Number.isFinite(b.x) &&
      Number.isFinite(b.y)
    )
  ) return false;
  const ids = new Set(d.blocks.map((b) => b.id));
  return ids.size === d.blocks.length &&
    new Set(d.links.map((l) => l?.id)).size === d.links.length &&
    d.links.every((l) =>
      l && typeof l.id === 'string' && typeof l.label === 'string' && ids.has(l.from) &&
      ids.has(l.to)
    );
}

function isWorkspace(value: unknown): value is Workspace {
  if (!value || typeof value !== 'object') return false;
  const workspace = value as Workspace;
  if (
    workspace.version !== 1 || typeof workspace.activeId !== 'string' ||
    !Array.isArray(workspace.tabs) || !workspace.tabs.length
  ) return false;
  if (
    !workspace.tabs.every((tab) =>
      tab && typeof tab.id === 'string' && typeof tab.title === 'string' && isDiagram(tab.diagram)
    )
  ) return false;
  return new Set(workspace.tabs.map((tab) => tab.id)).size === workspace.tabs.length &&
    workspace.tabs.some((tab) => tab.id === workspace.activeId);
}

export function load(): Workspace {
  try {
    const workspace: unknown = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || 'null');
    if (isWorkspace(workspace)) return workspace;
  } catch { /* Try the previous single-diagram draft. */ }
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (isDiagram(saved)) {
      return {
        version: 1,
        activeId: 'initial',
        tabs: [{ id: 'initial', title: 'Untitled 1', diagram: saved }],
      };
    }
  } catch { /* The sample remains usable when browser storage is unavailable. */ }
  return {
    version: 1,
    activeId: 'initial',
    tabs: [{ id: 'initial', title: 'Untitled 1', diagram: demo }],
  };
}
