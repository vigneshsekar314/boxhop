import { useEffect, useRef, useState } from 'react';
import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  WheelEvent,
} from 'react';
import { directions, HEIGHT, isDiagram, load, WIDTH, WORKSPACE_KEY } from '../../model';
import type {
  Block,
  Camera,
  Diagram,
  DiagramTab,
  Snapshot,
  TabSession,
  Workspace,
} from '../../model';

export function useWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace>(load);
  const workspaceCurrent = useRef(workspace);
  const diagram = workspace.tabs.find((tab) => tab.id === workspace.activeId)!.diagram;
  const current = useRef(diagram);
  const [focused, setFocused] = useState<string | null>(diagram.blocks[0]?.id ?? null);
  const [editing, setEditing] = useState<string | null>(null);
  const [vimMode, setVimMode] = useState('INSERT');
  const [prefix, setPrefix] = useState('');
  const [help, setHelp] = useState(false);
  const [fileMenu, setFileMenu] = useState(false);
  const [command, setCommand] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [labelSource, setLabelSource] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [saveState, setSaveState] = useState('Saved in this browser');
  const [message, setMessage] = useState('A small canvas. A little Vim. Make it yours.');
  const activeState = useRef({ editing, focused, camera, command });
  activeState.current = { editing, focused, camera, command };
  const canvas = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const helpClose = useRef<HTMLButtonElement>(null);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const fileButton = useRef<HTMLButtonElement>(null);
  const deleteTrigger = useRef<HTMLButtonElement | null>(null);
  const editBefore = useRef<Diagram | null>(null);
  const undoStack = useRef<Snapshot[]>([]);
  const redoStack = useRef<Snapshot[]>([]);
  const renameActive = useRef<string | null>(null);
  const sessions = useRef(new Map<string, TabSession>());
  const drag = useRef<
    null | { id?: string; startX: number; startY: number; x: number; y: number; before: Diagram }
  >(null);

  function updateWorkspace(next: Workspace) {
    workspaceCurrent.current = next;
    setWorkspace(next);
  }

  function update(next: Diagram, title?: string) {
    current.current = next;
    const workspace = workspaceCurrent.current;
    updateWorkspace({
      ...workspace,
      tabs: workspace.tabs.map((tab) =>
        tab.id === workspace.activeId ? { ...tab, diagram: next, title: title ?? tab.title } : tab
      ),
    });
  }

  function remember(before: Diagram) {
    const title =
      workspaceCurrent.current.tabs.find((tab) => tab.id === workspaceCurrent.current.activeId)!
        .title;
    undoStack.current = [...undoStack.current.slice(-49), { diagram: before, title }];
    redoStack.current = [];
  }

  function change(next: Diagram, title?: string) {
    remember(current.current);
    update(next, title);
  }

  function returnToCanvas() {
    canvas.current?.focus();
  }

  function togglePreview() {
    setPreview((open) => !open);
    setPrefix('');
    if (editing) document.querySelector<HTMLElement>('.cm-content')?.focus();
    else returnToCanvas();
  }

  function closeHelp() {
    setHelp(false);
    if (editing) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('.cm-content')?.focus());
    } else returnToCanvas();
  }

  function finishEdit() {
    if (
      editBefore.current && JSON.stringify(editBefore.current) !== JSON.stringify(current.current)
    ) remember(editBefore.current);
    editBefore.current = null;
    setEditing(null);
    setPrefix('');
    returnToCanvas();
  }

  function activateTab(id: string, nextWorkspace = workspaceCurrent.current) {
    if (id === workspaceCurrent.current.activeId) {
      returnToCanvas();
      return;
    }
    const tab = nextWorkspace.tabs.find((item) => item.id === id);
    if (!tab) return;
    const active = activeState.current;
    if (active.editing) finishEdit();
    sessions.current.set(workspaceCurrent.current.activeId, {
      focused: active.focused,
      camera: active.camera,
      undo: undoStack.current,
      redo: redoStack.current,
    });
    const session = sessions.current.get(id);
    current.current = tab.diagram;
    undoStack.current = session?.undo ?? [];
    redoStack.current = session?.redo ?? [];
    updateWorkspace({ ...nextWorkspace, activeId: id });
    setFocused(session?.focused ?? tab.diagram.blocks[0]?.id ?? null);
    if (session) setCamera(session.camera);
    else fit();
    setPrefix('');
    setCommand(null);
    setFileMenu(false);
    setLabelSource(null);
    setLabel('');
    setMessage('Diagram ready.');
    returnToCanvas();
  }

  function newDiagram(title?: string, diagram: Diagram = { version: 1, blocks: [], links: [] }) {
    const workspace = workspaceCurrent.current;
    const id = crypto.randomUUID();
    let number = workspace.tabs.length + 1;
    while (workspace.tabs.some((tab) => tab.title === `Untitled ${number}`)) number++;
    const tab: DiagramTab = { id, title: title?.trim() || `Untitled ${number}`, diagram };
    activateTab(id, { ...workspace, tabs: [...workspace.tabs, tab] });
  }

  function cancelDelete() {
    setDeleting(null);
    deleteTrigger.current?.focus();
    deleteTrigger.current = null;
  }

  function deleteDiagram() {
    const workspace = workspaceCurrent.current;
    const index = workspace.tabs.findIndex((tab) => tab.id === deleting);
    if (index < 0) {
      cancelDelete();
      return;
    }
    const tabs = workspace.tabs.filter((tab) => tab.id !== deleting);
    if (!tabs.length) {
      tabs.push({
        id: crypto.randomUUID(),
        title: 'Untitled 1',
        diagram: { version: 1, blocks: [], links: [] },
      });
    }
    if (workspace.activeId === deleting) {
      activateTab(tabs[Math.min(index, tabs.length - 1)].id, { ...workspace, tabs });
    } else {
      updateWorkspace({ ...workspace, tabs });
      if (editing) document.querySelector<HTMLElement>('.cm-content')?.focus();
      else if (command !== null) document.getElementById('command-input')?.focus();
      else returnToCanvas();
    }
    sessions.current.delete(deleting!);
    deleteTrigger.current = null;
    setDeleting(null);
    setMessage('Diagram deleted.');
  }

  function startRename(tab: DiagramTab) {
    if (editing) finishEdit();
    renameActive.current = tab.id;
    setRenaming({ id: tab.id, value: tab.title });
  }

  function finishRename(save: boolean, focusCanvas: boolean) {
    if (!renaming || renameActive.current !== renaming.id) return;
    renameActive.current = null;
    setRenaming(null);
    const title = renaming.value.trim();
    const active = workspaceCurrent.current.tabs.find((tab) => tab.id === renaming.id);
    if (
      save && title && active && active.id === workspaceCurrent.current.activeId &&
      title !== active.title
    ) {
      change(current.current, title);
    }
    if (focusCanvas) returnToCanvas();
  }

  function edit(id: string) {
    editBefore.current = current.current;
    setFocused(id);
    setVimMode('INSERT');
    setEditing(id);
    setPrefix('');
  }

  function focusBlock(id: string) {
    setFocused(id);
    const block = current.current.blocks.find((b) => b.id === id);
    if (!block || !canvas.current) return;
    const { clientWidth: w, clientHeight: h } = canvas.current;
    setCamera((c) => {
      const x = block.x * c.zoom + c.x, y = block.y * c.zoom + c.y;
      return {
        ...c,
        x: c.x + (x < 40 ? 40 - x : x + WIDTH * c.zoom > w - 40 ? w - 40 - x - WIDTH * c.zoom : 0),
        y: c.y +
          (y < 60 ? 60 - y : y + HEIGHT * c.zoom > h - 40 ? h - 40 - y - HEIGHT * c.zoom : 0),
      };
    });
  }

  function fit() {
    const { clientWidth: w, clientHeight: h } = canvas.current!;
    const blocks = current.current.blocks;
    const left = Math.min(...blocks.map((b) => b.x), 0),
      top = Math.min(...blocks.map((b) => b.y), 0);
    const right = Math.max(...blocks.map((b) => b.x + WIDTH), WIDTH),
      bottom = Math.max(...blocks.map((b) => b.y + HEIGHT), HEIGHT);
    const zoom = Math.max(.2, Math.min(1, (w - 120) / (right - left), (h - 88) / (bottom - top)));
    setCamera({
      x: (w - (right - left) * zoom) / 2 - left * zoom,
      y: (h - (bottom - top) * zoom) / 2 - top * zoom,
      zoom,
    });
  }

  function zoomBy(factor: number) {
    const { clientWidth: w, clientHeight: h } = canvas.current!;
    setCamera((c) => {
      const zoom = Math.max(.2, Math.min(2, c.zoom * factor));
      const ratio = zoom / c.zoom;
      return { x: w / 2 - (w / 2 - c.x) * ratio, y: h / 2 - (h / 2 - c.y) * ratio, zoom };
    });
  }

  function create(linked: boolean, edgeLabel = '') {
    const before = current.current;
    const source = before.blocks.find((b) => b.id === (labelSource || focused));
    if (linked && !source) {
      setMessage('Focus a block first, or use aa for an independent thought.');
      return;
    }
    let x = source
      ? source.x + 360
      : (canvas.current!.clientWidth / 2 - camera.x) / camera.zoom - WIDTH / 2;
    let y = source
      ? source.y
      : (canvas.current!.clientHeight / 2 - camera.y) / camera.zoom - HEIGHT / 2;
    while (
      before.blocks.some((b) => Math.abs(b.x - x) < WIDTH + 40 && Math.abs(b.y - y) < HEIGHT + 40)
    ) y += 240;
    const block: Block = { id: crypto.randomUUID(), text: '', x, y };
    update({
      ...before,
      blocks: [...before.blocks, block],
      links: linked
        ? [...before.links, {
          id: crypto.randomUUID(),
          from: source!.id,
          to: block.id,
          label: edgeLabel,
        }]
        : before.links,
    });
    editBefore.current = before;
    setLabelSource(null);
    setLabel('');
    setPrefix('');
    setEditing(block.id);
    setVimMode('INSERT');
    focusBlock(block.id);
  }

  function undo(redo = false) {
    const from = redo ? redoStack.current : undoStack.current;
    const to = redo ? undoStack.current : redoStack.current;
    const next = from.pop();
    if (!next) {
      setMessage(redo ? 'Nothing to redo.' : 'Nothing to undo.');
      return;
    }
    to.push({
      diagram: current.current,
      title: workspaceCurrent.current.tabs.find((tab) =>
        tab.id === workspaceCurrent.current.activeId
      )!.title,
    });
    update(next.diagram, next.title);
    setFocused(
      next.diagram.blocks.some((b) => b.id === focused)
        ? focused
        : next.diagram.blocks[0]?.id ?? null,
    );
    setMessage(redo ? 'Change restored.' : 'Change undone.');
  }

  function exportFile() {
    const title =
      workspaceCurrent.current.tabs.find((tab) => tab.id === workspaceCurrent.current.activeId)!
        .title;
    const filename =
      title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/, '').slice(0, 120) ||
      'my-thoughts';
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ ...current.current, name: title }, null, 2)], {
        type: 'application/json',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.boxhop.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Diagram downloaded. Your browser copy stays here.');
  }

  async function openFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      const next: unknown = JSON.parse(await file.text());
      if (!isDiagram(next)) throw new Error('Invalid diagram');
      const name = (next as Diagram & { name?: unknown }).name;
      const title = typeof name === 'string' && name.trim()
        ? name.trim()
        : file.name.replace(/(?:\.boxhop)?\.json$/i, '').trim();
      newDiagram(title, { version: next.version, blocks: next.blocks, links: next.links });
      setMessage('Diagram opened. Press i to start editing.');
    } catch {
      setMessage('Could not open this file. Choose a Boxhop prototype JSON file.');
      if (activeState.current.editing) document.querySelector<HTMLElement>('.cm-content')?.focus();
      else if (activeState.current.command !== null) {
        document.getElementById('command-input')?.focus();
      } else returnToCanvas();
    }
  }

  function onTabKey(event: ReactKeyboardEvent<HTMLButtonElement>, tab: DiagramTab, index: number) {
    if (event.key === 'F2') {
      event.preventDefault();
      startRename(tab);
      return;
    }
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % workspace.tabs.length;
    else if (event.key === 'ArrowLeft') {
      next = (index + workspace.tabs.length - 1) % workspace.tabs.length;
    } else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = workspace.tabs.length - 1;
    else return;
    event.preventDefault();
    const button = event.currentTarget.closest('[role="tablist"]')?.querySelectorAll<
      HTMLButtonElement
    >('[role="tab"]')[next];
    activateTab(workspace.tabs[next].id);
    button?.focus();
  }

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entered = command!.trim();
    const newCommand = /^new(?:\s+(.+))?$/.exec(entered);
    if (newCommand) newDiagram(newCommand[1]);
    else {
      setCommand(null);
      setMessage(entered ? `Unknown command: ${entered}` : 'Command canceled.');
      returnToCanvas();
    }
  }

  function onCanvasWheel(event: WheelEvent<HTMLElement>) {
    if (editing || labelSource || help) return;
    if ((event.target as HTMLElement).closest('.block-text')) return;
    setCamera((camera) => ({ ...camera, x: camera.x - event.deltaX, y: camera.y - event.deltaY }));
  }

  function updateBlockText(id: string, text: string) {
    update({
      ...current.current,
      blocks: current.current.blocks.map((block) => block.id === id ? { ...block, text } : block),
    });
  }

  useEffect(() => {
    try {
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(workspace));
      setSaveState('Saved in this browser');
    } catch {
      setSaveState('Browser save failed — download a copy');
    }
  }, [workspace]);

  useEffect(() => {
    fit();
    canvas.current?.focus();
  }, []);

  useEffect(() => {
    if (help) helpClose.current?.focus();
  }, [help]);

  useEffect(() => {
    if (!fileMenu) return;
    const close = (event: PointerEvent) => {
      if (!fileMenuRef.current?.contains(event.target as Node)) setFileMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [fileMenu]);

  useEffect(() => {
    if (focused) focusBlock(focused);
  }, [preview]);

  // Canvas shortcuts only run when the canvas itself owns keyboard focus.
  function onCanvasKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (
      event.target !== event.currentTarget || event.isDefaultPrevented() ||
      event.nativeEvent.isComposing || editing || labelSource || help || command !== null
    ) return;
    if (event.ctrlKey || event.metaKey || event.altKey) {
      if (event.ctrlKey && !event.metaKey && !event.altKey && event.key === 'r') {
        event.preventDefault();
        undo(true);
      }
      return;
    }
    const key = event.key;
    if (key === 'Tab') {
      setPrefix('');
      return;
    } // Preserve normal browser focus navigation.
    if (event.repeat && !directions[key.toLowerCase()]) return;
    if (key === 'Escape') {
      setPrefix('');
      return;
    }
    if (key === 'F2') {
      event.preventDefault();
      setPrefix('');
      const tab = workspaceCurrent.current.tabs.find((item) =>
        item.id === workspaceCurrent.current.activeId
      );
      if (tab) startRename(tab);
      return;
    }
    if (prefix) {
      event.preventDefault();
      const sequence = prefix + key;
      setPrefix('');
      if (sequence === 'aa') create(false);
      else if (sequence === 'al') create(true);
      else if (sequence === 'at') setPrefix('at');
      else if (sequence === 'atl' && focused) {
        setLabelSource(focused);
        setLabel('');
      } else setMessage('Sequence canceled. aa: new · al: linked · atl: labeled link · d: delete');
      return;
    }
    if (key in directions) {
      event.preventDefault();
      const source = current.current.blocks.find((b) => b.id === focused);
      if (!source) {
        if (current.current.blocks[0]) focusBlock(current.current.blocks[0].id);
        return;
      }
      const [dx, dy] = directions[key];
      const candidates = current.current.blocks.filter((b) =>
        (b.x - source.x) * dx + (b.y - source.y) * dy > 1
      );
      candidates.sort((a, b) => {
        const score = (block: Block) =>
          Math.hypot(block.x - source.x, block.y - source.y) +
          2 * Math.abs((block.x - source.x) * dy - (block.y - source.y) * dx);
        return score(a) - score(b);
      });
      if (candidates[0]) focusBlock(candidates[0].id);
    } else if (directions[key.toLowerCase()] && event.shiftKey) {
      event.preventDefault();
      const [dx, dy] = directions[key.toLowerCase()];
      setCamera((c) => ({ ...c, x: c.x - dx * 80, y: c.y - dy * 80 }));
    } else if ((key === 'i' || key === 'Enter') && focused) {
      event.preventDefault();
      edit(focused);
    } else if (key === 'a') {
      event.preventDefault();
      setPrefix(key);
    } else if (key === 'd') {
      event.preventDefault();
      if (focused) {
        change({
          ...current.current,
          blocks: current.current.blocks.filter((b) => b.id !== focused),
          links: current.current.links.filter((l) => l.from !== focused && l.to !== focused),
        });
        setFocused(current.current.blocks[0]?.id ?? null);
      }
    } else if (key === 'u') {
      event.preventDefault();
      undo();
    } else if (key === 'R') {
      event.preventDefault();
      undo(true);
    } else if (key === '+' || key === '=') {
      event.preventDefault();
      zoomBy(1.15);
    } else if (key === '-') {
      event.preventDefault();
      zoomBy(1 / 1.15);
    } else if (key === '0') {
      event.preventDefault();
      fit();
    } else if (key === 'p') {
      event.preventDefault();
      togglePreview();
    } else if (key === ':') {
      event.preventDefault();
      setCommand('');
    } else if (key === '?') {
      event.preventDefault();
      setHelp(true);
    }
  }

  function startDrag(event: ReactPointerEvent, block?: Block) {
    if (
      editing || labelSource || help || event.button !== 0 ||
      (event.target as HTMLElement).closest('button')
    ) return;
    event.preventDefault();
    event.stopPropagation();
    canvas.current?.focus();
    setPrefix('');
    if (block) setFocused(block.id);
    drag.current = {
      id: block?.id,
      startX: event.clientX,
      startY: event.clientY,
      x: block?.x ?? camera.x,
      y: block?.y ?? camera.y,
      before: current.current,
    };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  function dragMove(event: ReactPointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.startX, dy = event.clientY - d.startY;
    if (d.id) {
      update({
        ...current.current,
        blocks: current.current.blocks.map((b) =>
          b.id === d.id ? { ...b, x: d.x + dx / camera.zoom, y: d.y + dy / camera.zoom } : b
        ),
      });
    } else setCamera((c) => ({ ...c, x: d.x + dx, y: d.y + dy }));
  }

  function endDrag() {
    if (
      drag.current?.id && JSON.stringify(drag.current.before) !== JSON.stringify(current.current)
    ) remember(drag.current.before);
    drag.current = null;
  }

  const selectedIndex = diagram.blocks.findIndex((b) => b.id === focused);
  const mode = editing
    ? `EDIT · ${vimMode}`
    : labelSource
    ? 'LINK LABEL'
    : command !== null
    ? 'COMMAND'
    : 'PAN';
  return {
    workspace,
    diagram,
    focused,
    editing,
    vimMode,
    setVimMode,
    prefix,
    help,
    setHelp,
    fileMenu,
    setFileMenu,
    command,
    setCommand,
    renaming,
    setRenaming,
    deleting,
    setDeleting,
    preview,
    labelSource,
    setLabelSource,
    label,
    setLabel,
    camera,
    saveState,
    message,
    canvas,
    fileInput,
    helpClose,
    fileMenuRef,
    fileButton,
    deleteTrigger,
    returnToCanvas,
    togglePreview,
    closeHelp,
    finishEdit,
    activateTab,
    newDiagram,
    cancelDelete,
    deleteDiagram,
    startRename,
    finishRename,
    edit,
    fit,
    zoomBy,
    create,
    exportFile,
    openFile,
    onTabKey,
    submitCommand,
    onCanvasWheel,
    updateBlockText,
    onCanvasKey,
    startDrag,
    dragMove,
    endDrag,
    selectedIndex,
    mode,
  };
}

export type WorkspaceController = ReturnType<typeof useWorkspace>;
