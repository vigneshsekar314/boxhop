import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { VimEditor } from './VimEditor';
import './style.css';

type Block = { id: string; text: string; x: number; y: number };
type Link = { id: string; from: string; to: string; label: string };
type Diagram = { version: 1; blocks: Block[]; links: Link[] };
type Camera = { x: number; y: number; zoom: number };
const STORAGE_KEY = 'boxhop-prototype-v1';
const WIDTH = 264, HEIGHT = 172;
const directions: Record<string, [number, number]> = { h: [-1, 0], j: [0, 1], k: [0, -1], l: [1, 0] };
const demo: Diagram = {
  version: 1,
  blocks: [
    { id: 'start', x: 0, y: 0, text: 'An idea starts here.\n\nPress i to make this thought your own.' },
    { id: 'left', x: -360, y: 0, text: 'Find your way.\n\nh ←   j ↓   k ↑   l →\nMove between thoughts.' },
    { id: 'right', x: 360, y: 0, text: 'Follow a connection.\n\nType al to add a linked thought.\nType aa for an independent one.' },
    { id: 'above', x: 0, y: -210, text: 'A familiar way to write.\n\nVim lives inside every block.\nMotions, visual mode, edits, undo.' },
    { id: 'below', x: 0, y: 210, text: 'Leave room to think.\n\nEsc → Vim normal\nEsc again → back to the canvas' },
  ],
  links: [
    { id: '1', from: 'left', to: 'start', label: '' },
    { id: '2', from: 'start', to: 'right', label: 'then' },
    { id: '3', from: 'above', to: 'start', label: '' },
    { id: '4', from: 'start', to: 'below', label: '' },
  ],
};

function isDiagram(value: unknown): value is Diagram {
  if (!value || typeof value !== 'object') return false;
  const d = value as Diagram;
  if (d.version !== 1 || !Array.isArray(d.blocks) || !Array.isArray(d.links)) return false;
  if (!d.blocks.every(b => b && typeof b.id === 'string' && typeof b.text === 'string' && Number.isFinite(b.x) && Number.isFinite(b.y))) return false;
  const ids = new Set(d.blocks.map(b => b.id));
  return ids.size === d.blocks.length && new Set(d.links.map(l => l?.id)).size === d.links.length &&
    d.links.every(l => l && typeof l.id === 'string' && typeof l.label === 'string' && ids.has(l.from) && ids.has(l.to));
}

function load(): Diagram {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (isDiagram(saved)) return saved;
  } catch { /* The sample remains usable when browser storage is unavailable. */ }
  return demo;
}

function App() {
  const [diagram, setDiagram] = useState<Diagram>(load);
  const current = useRef(diagram);
  const [focused, setFocused] = useState<string | null>(diagram.blocks[0]?.id ?? null);
  const [editing, setEditing] = useState<string | null>(null);
  const [vimMode, setVimMode] = useState('INSERT');
  const [prefix, setPrefix] = useState('');
  const [help, setHelp] = useState(false);
  const [labelSource, setLabelSource] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: 1 });
  const [saveState, setSaveState] = useState('Saved in this browser');
  const [message, setMessage] = useState('A small canvas. A little Vim. Make it yours.');
  const canvas = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const helpClose = useRef<HTMLButtonElement>(null);
  const editBefore = useRef<Diagram | null>(null);
  const undoStack = useRef<Diagram[]>([]);
  const redoStack = useRef<Diagram[]>([]);
  const drag = useRef<null | { id?: string; startX: number; startY: number; x: number; y: number; before: Diagram }>(null);

  function update(next: Diagram) { current.current = next; setDiagram(next); }
  function remember(before: Diagram) {
    undoStack.current = [...undoStack.current.slice(-49), before];
    redoStack.current = [];
  }
  function change(next: Diagram) { remember(current.current); update(next); }
  function returnToCanvas() { canvas.current?.focus(); }
  function closeHelp() {
    setHelp(false);
    if (editing) requestAnimationFrame(() => document.querySelector<HTMLElement>('.cm-content')?.focus());
    else returnToCanvas();
  }
  function finishEdit() {
    if (editBefore.current && JSON.stringify(editBefore.current) !== JSON.stringify(current.current)) remember(editBefore.current);
    editBefore.current = null;
    setEditing(null);
    setPrefix('');
    returnToCanvas();
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
    const block = current.current.blocks.find(b => b.id === id);
    if (!block || !canvas.current) return;
    const { clientWidth: w, clientHeight: h } = canvas.current;
    setCamera(c => {
      const x = block.x * c.zoom + c.x, y = block.y * c.zoom + c.y;
      return { ...c,
        x: c.x + (x < 40 ? 40 - x : x + WIDTH * c.zoom > w - 40 ? w - 40 - x - WIDTH * c.zoom : 0),
        y: c.y + (y < 60 ? 60 - y : y + HEIGHT * c.zoom > h - 40 ? h - 40 - y - HEIGHT * c.zoom : 0),
      };
    });
  }
  function fit() {
    const { clientWidth: w, clientHeight: h } = canvas.current!;
    const blocks = current.current.blocks;
    const left = Math.min(...blocks.map(b => b.x), 0), top = Math.min(...blocks.map(b => b.y), 0);
    const right = Math.max(...blocks.map(b => b.x + WIDTH), WIDTH), bottom = Math.max(...blocks.map(b => b.y + HEIGHT), HEIGHT);
    const zoom = Math.max(.2, Math.min(1, (w - 120) / (right - left), (h - 88) / (bottom - top)));
    setCamera({ x: (w - (right - left) * zoom) / 2 - left * zoom, y: (h - (bottom - top) * zoom) / 2 - top * zoom, zoom });
  }
  function zoomBy(factor: number) {
    const { clientWidth: w, clientHeight: h } = canvas.current!;
    setCamera(c => {
      const zoom = Math.max(.2, Math.min(2, c.zoom * factor));
      const ratio = zoom / c.zoom;
      return { x: w / 2 - (w / 2 - c.x) * ratio, y: h / 2 - (h / 2 - c.y) * ratio, zoom };
    });
  }
  function create(linked: boolean, edgeLabel = '') {
    const before = current.current;
    const source = before.blocks.find(b => b.id === (labelSource || focused));
    if (linked && !source) { setMessage('Focus a block first, or use aa for an independent thought.'); return; }
    let x = source ? source.x + 360 : (canvas.current!.clientWidth / 2 - camera.x) / camera.zoom - WIDTH / 2;
    let y = source ? source.y : (canvas.current!.clientHeight / 2 - camera.y) / camera.zoom - HEIGHT / 2;
    while (before.blocks.some(b => Math.abs(b.x - x) < WIDTH + 40 && Math.abs(b.y - y) < HEIGHT + 40)) y += 240;
    const block: Block = { id: crypto.randomUUID(), text: '', x, y };
    update({ ...before, blocks: [...before.blocks, block], links: linked ? [...before.links, { id: crypto.randomUUID(), from: source!.id, to: block.id, label: edgeLabel }] : before.links });
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
    if (!next) { setMessage(redo ? 'Nothing to redo.' : 'Nothing to undo.'); return; }
    to.push(current.current);
    update(next);
    setFocused(next.blocks.some(b => b.id === focused) ? focused : next.blocks[0]?.id ?? null);
    setMessage(redo ? 'Change restored.' : 'Change undone.');
  }
  function exportFile() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(current.current, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'my-thoughts.boxhop.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Diagram downloaded. Your browser copy stays here.');
  }

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(diagram)); setSaveState('Saved in this browser'); }
    catch { setSaveState('Browser save failed — download a copy'); }
  }, [diagram]);

  useEffect(() => {
    fit();
    canvas.current?.focus();
  }, []);

  useEffect(() => { if (help) helpClose.current?.focus(); }, [help]);

  // Canvas shortcuts only run when the canvas itself owns keyboard focus.
  function onCanvasKey(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || event.isDefaultPrevented() || event.nativeEvent.isComposing || editing || labelSource || help) return;
    if (event.ctrlKey || event.metaKey || event.altKey) {
      if (event.ctrlKey && !event.metaKey && !event.altKey && event.key === 'r') { event.preventDefault(); undo(true); }
      return;
    }
    const key = event.key;
    if (key === 'Tab') { setPrefix(''); return; } // Preserve normal browser focus navigation.
    if (event.repeat && !directions[key.toLowerCase()]) return;
    if (key === 'Escape') { setPrefix(''); return; }
    if (prefix) {
      event.preventDefault();
      const sequence = prefix + key;
      setPrefix('');
      if (sequence === 'aa') create(false);
      else if (sequence === 'al') create(true);
      else if (sequence === 'at') setPrefix('at');
      else if (sequence === 'atl' && focused) { setLabelSource(focused); setLabel(''); }
      else if (sequence === 'dd' && focused) {
        change({ ...current.current, blocks: current.current.blocks.filter(b => b.id !== focused), links: current.current.links.filter(l => l.from !== focused && l.to !== focused) });
        setFocused(current.current.blocks[0]?.id ?? null);
      } else setMessage('Sequence canceled. aa: new · al: linked · atl: labeled link · dd: delete');
      return;
    }
    if (key in directions) {
      event.preventDefault();
      const source = current.current.blocks.find(b => b.id === focused);
      if (!source) { if (current.current.blocks[0]) focusBlock(current.current.blocks[0].id); return; }
      const [dx, dy] = directions[key];
      const candidates = current.current.blocks.filter(b => (b.x - source.x) * dx + (b.y - source.y) * dy > 1);
      candidates.sort((a, b) => {
        const score = (block: Block) => Math.hypot(block.x - source.x, block.y - source.y) + 2 * Math.abs((block.x - source.x) * dy - (block.y - source.y) * dx);
        return score(a) - score(b);
      });
      if (candidates[0]) focusBlock(candidates[0].id);
    } else if (directions[key.toLowerCase()] && event.shiftKey) {
      event.preventDefault();
      const [dx, dy] = directions[key.toLowerCase()];
      setCamera(c => ({ ...c, x: c.x - dx * 80, y: c.y - dy * 80 }));
    } else if ((key === 'i' || key === 'Enter') && focused) { event.preventDefault(); edit(focused); }
    else if (key === 'a' || key === 'd') { event.preventDefault(); setPrefix(key); }
    else if (key === 'u') { event.preventDefault(); undo(); }
    else if (key === '+' || key === '=') { event.preventDefault(); zoomBy(1.15); }
    else if (key === '-') { event.preventDefault(); zoomBy(1 / 1.15); }
    else if (key === '0') { event.preventDefault(); fit(); }
    else if (key === '?') { event.preventDefault(); setHelp(true); }
  }

  function startDrag(event: ReactPointerEvent, block?: Block) {
    if (editing || labelSource || help || event.button !== 0 || (event.target as HTMLElement).closest('button')) return;
    event.preventDefault(); event.stopPropagation();
    canvas.current?.focus();
    setPrefix('');
    if (block) setFocused(block.id);
    drag.current = { id: block?.id, startX: event.clientX, startY: event.clientY, x: block?.x ?? camera.x, y: block?.y ?? camera.y, before: current.current };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function dragMove(event: ReactPointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.startX, dy = event.clientY - d.startY;
    if (d.id) update({ ...current.current, blocks: current.current.blocks.map(b => b.id === d.id ? { ...b, x: d.x + dx / camera.zoom, y: d.y + dy / camera.zoom } : b) });
    else setCamera(c => ({ ...c, x: d.x + dx, y: d.y + dy }));
  }
  function endDrag() {
    if (drag.current?.id && JSON.stringify(drag.current.before) !== JSON.stringify(current.current)) remember(drag.current.before);
    drag.current = null;
  }

  const selectedIndex = diagram.blocks.findIndex(b => b.id === focused);
  const mode = editing ? `EDIT · ${vimMode}` : labelSource ? 'LINK LABEL' : 'PAN';
  return <div className="app">
    <header className="topbar">
      <a className="brand" href="./" aria-label="Boxhop home"><span className="brand-icon">b<span>↗</span></span>boxhop<span className="prototype">playground</span></a>
      <div className="document-name">Untitled thoughts <span> / </span><small>local draft</small></div>
      <nav aria-label="Document actions">
        <button onClick={() => { if (editing) finishEdit(); fileInput.current?.click(); }}>Open</button>
        <button onClick={exportFile}>Download <span aria-hidden="true">↗</span></button>
        <button className="help-button" aria-label="Keyboard shortcuts" onClick={() => setHelp(true)}>?</button>
      </nav>
      <input ref={fileInput} hidden type="file" accept=".json" onChange={async event => {
        const file = event.target.files?.[0]; if (!file) return;
        try {
          const next: unknown = JSON.parse(await file.text());
          if (!isDiagram(next)) throw new Error('Invalid diagram');
          change(next); setFocused(next.blocks[0]?.id ?? null);
          requestAnimationFrame(fit);
          setMessage('Diagram opened. Press i to start editing.');
        } catch { setMessage('Could not open this file. Choose a Boxhop prototype JSON file.'); }
        event.target.value = ''; returnToCanvas();
      }} />
    </header>

    <main ref={canvas} className="canvas" tabIndex={0} aria-label="Diagram canvas. h j k l to navigate. i to edit. Question mark for help."
      onKeyDown={onCanvasKey} onPointerDown={event => startDrag(event)} onPointerMove={dragMove} onPointerUp={endDrag} onPointerCancel={endDrag}
      onWheel={event => {
        if (editing || labelSource || help) return;
        if ((event.target as HTMLElement).closest('.block-text')) return;
        setCamera(c => ({ ...c, x: c.x - event.deltaX, y: c.y - event.deltaY }));
      }} style={{ backgroundPosition: `${camera.x}px ${camera.y}px`, backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px` }}>
      <div className="canvas-caption"><span className="tiny-square" /> YOUR THINKING SPACE <span className="caption-rule" /> <span>one thought at a time</span></div>
      <div className="world" style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}>
        <svg className="connections" aria-label="Connections">
          <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
          {diagram.links.map(link => {
            const a = diagram.blocks.find(b => b.id === link.from)!, b = diagram.blocks.find(b => b.id === link.to)!;
            const dx = b.x - a.x, dy = b.y - a.y, horizontal = Math.abs(dx) >= Math.abs(dy);
            const sx = a.x + WIDTH / 2 + (horizontal ? Math.sign(dx) * (WIDTH / 2 + 2) : 0), sy = a.y + HEIGHT / 2 + (horizontal ? 0 : Math.sign(dy) * (HEIGHT / 2 + 2));
            const tx = b.x + WIDTH / 2 - (horizontal ? Math.sign(dx) * (WIDTH / 2 + 4) : 0), ty = b.y + HEIGHT / 2 - (horizontal ? 0 : Math.sign(dy) * (HEIGHT / 2 + 4));
            const active = focused === a.id || focused === b.id;
            return <g key={link.id} className={active ? 'connection active' : 'connection'}>
              <path d={`M ${sx} ${sy} C ${horizontal ? (sx + tx) / 2 : sx} ${horizontal ? sy : (sy + ty) / 2}, ${horizontal ? (sx + tx) / 2 : tx} ${horizontal ? ty : (sy + ty) / 2}, ${tx} ${ty}`} markerEnd="url(#arrow)" />
              {link.label && <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 10} textAnchor="middle">{link.label}</text>}
            </g>;
          })}
        </svg>
        {diagram.blocks.map((block, index) => <article key={block.id} data-block-id={block.id} data-focused={focused === block.id} data-editing={editing === block.id}
          className={`block ${focused === block.id ? 'focused' : ''} ${editing === block.id ? 'editing' : ''}`}
          style={{ left: block.x, top: block.y, width: WIDTH, height: HEIGHT }}
          onPointerDown={event => startDrag(event, block)} onDoubleClick={() => { if (!editing && !labelSource && !help) edit(block.id); }}>
          <div className="block-header"><span className="block-number">{String(index + 1).padStart(2, '0')}</span><span className="block-type">THOUGHT</span><span className="block-state">{editing === block.id ? vimMode.toLowerCase() : focused === block.id ? 'focused' : '·'}</span></div>
          {editing === block.id ? <VimEditor text={block.text} onMode={setVimMode} onExit={finishEdit} onChange={text => update({ ...current.current, blocks: current.current.blocks.map(b => b.id === block.id ? { ...b, text } : b) })} />
            : <div className={`block-text ${!block.text ? 'empty' : ''}`}>{block.text || 'An empty thought…'}</div>}
        </article>)}
      </div>

      {!diagram.blocks.length && <div className="empty-canvas"><h1>Room for a new idea.</h1><p>Type <kbd>a</kbd><kbd>a</kbd> to start a thought.</p><button onClick={() => create(false)}>Create a block <span>↗</span></button></div>}
      <div className="canvas-bottom">
        <div className="quick-start"><span className="quick-label">MAKE YOUR NEXT MOVE</span><div><kbd>h</kbd><kbd>j</kbd><kbd>k</kbd><kbd>l</kbd><span>hop between thoughts</span></div><div><kbd>i</kbd><span>edit</span><kbd>a</kbd><kbd>l</kbd><span>add a connection</span></div></div>
        <div className="zoom-controls"><button aria-label="Zoom out" onClick={() => { zoomBy(1 / 1.15); returnToCanvas(); }}>−</button><span>{Math.round(camera.zoom * 100)}%</span><button aria-label="Zoom in" onClick={() => { zoomBy(1.15); returnToCanvas(); }}>+</button><span className="zoom-divider" /><button aria-label="Fit diagram" onClick={() => { fit(); returnToCanvas(); }}>↙↗</button></div>
      </div>
    </main>

    <footer className="statusbar" aria-label="Editor status">
      <div className={`mode ${editing ? 'mode-edit' : ''}`} aria-live="polite"><span className="mode-dot" />{mode}</div>
      <span className="status-hint" role="status">{prefix ? `${prefix} …  ${prefix === 'a' ? 'a: independent · l: linked · t l: labeled link' : prefix === 'at' ? 'l: labeled link' : 'd: delete focused block'}  · Esc cancels` : editing ? 'Esc → normal · Esc again → canvas' : message}</span>
      <div className="status-right"><span>{selectedIndex >= 0 ? `${String(selectedIndex + 1).padStart(2, '0')} / ` : ''}{diagram.blocks.length} thoughts</span><span className={saveState.startsWith('Saved') ? 'save-indicator' : 'save-error'}>● <span>{saveState}</span></span></div>
    </footer>

    {labelSource && <div className="overlay"><form className="label-dialog" role="dialog" aria-modal="true" aria-label="New link label" onSubmit={event => { event.preventDefault(); create(true, label); }}>
      <span className="eyebrow">CONNECT THE THOUGHTS</span><h2>What's the relationship?</h2>
      <input autoFocus aria-label="Link label" placeholder="depends on, leads to, explains…" value={label} onChange={e => setLabel(e.target.value)} onKeyDown={event => { if (event.key === 'Tab') event.preventDefault(); if (event.key === 'Escape') { event.stopPropagation(); setLabelSource(null); setLabel(''); returnToCanvas(); } }} />
      <p><kbd>Enter</kbd> create & start writing <span>·</span> <kbd>Esc</kbd> cancel</p>
    </form></div>}

    {help && <div className="overlay"><section className="help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-title" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); closeHelp(); } if (event.key === 'Tab') { event.preventDefault(); helpClose.current?.focus(); } }}>
      <div className="dialog-heading"><span className="eyebrow">LESS DRAWING. MORE THINKING.</span><button ref={helpClose} aria-label="Close keyboard shortcuts" onClick={closeHelp}>×</button></div>
      <h2 id="help-title">Keep your hands on the keys.</h2>
      <div className="shortcut-list">{[
        ['h j k l', 'Focus left, down, up, right'], ['i / Enter', 'Edit the focused block · start in insert mode'], ['Esc, then Esc', 'Vim normal, then back to the canvas'],
        ['aa', 'Create an independent block'], ['al', 'Create a linked block'], ['atl', 'Label a connection, then create its block'], ['dd', 'Delete the focused block and its links'],
        ['u / Ctrl+r', 'Undo / redo diagram changes in pan mode'], ['Shift+H J K L', 'Pan the viewport'], ['+ / − / 0', 'Zoom in / out / fit diagram'], ['?', 'Show this guide'],
      ].map(([keys, text]) => <div key={keys}><kbd>{keys}</kbd><span>{text}</span></div>)}</div>
      <p>Inside a block, Vim owns the keyboard. Enter adds a newline in insert mode. Tab indents. Drag a block to reposition it, or drag empty canvas to pan. Your draft saves in this browser as you type.</p>
    </section></div>}
  </div>;
}

createRoot(document.getElementById('root')!).render(<App />);
