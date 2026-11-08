import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HEIGHT, WIDTH } from '../../model';
import { VimEditor } from '../VimEditor';
import type { WorkspaceController } from '../Workspace/Workspace.hooks';

export function DiagramCanvas({ workspace: controller }: { workspace: WorkspaceController }) {
  const {
    canvas,
    onCanvasKey,
    startDrag,
    dragMove,
    endDrag,
    onCanvasWheel,
    editing,
    labelSource,
    help,
    camera,
    diagram,
    focused,
    vimMode,
    edit,
    setVimMode,
    finishEdit,
    updateBlockText,
    create,
    zoomBy,
    returnToCanvas,
    fit,
    preview,
    togglePreview,
    selectedIndex,
  } = controller;

  return (
    <div id='diagram-panel' className='workspace' role='tabpanel' aria-label='Active diagram'>
      <main
        ref={canvas}
        className='canvas'
        tabIndex={0}
        aria-label='Diagram canvas. h j k l to navigate. i to edit. Question mark for help.'
        onKeyDown={onCanvasKey}
        onPointerDown={(event) => startDrag(event)}
        onPointerMove={dragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onCanvasWheel}
        style={{
          backgroundPosition: `${camera.x}px ${camera.y}px`,
          backgroundSize: `${24 * camera.zoom}px ${24 * camera.zoom}px`,
        }}
      >
        <div className='canvas-caption'>
          <span className='tiny-square' /> YOUR THINKING SPACE <span className='caption-rule' />
          {' '}
          <span>one thought at a time</span>
        </div>
        <div
          className='world'
          style={{ transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom})` }}
        >
          <svg className='connections' aria-label='Connections'>
            <defs>
              <marker
                id='arrow'
                viewBox='0 0 10 10'
                refX='9'
                refY='5'
                markerWidth='6'
                markerHeight='6'
                orient='auto-start-reverse'
              >
                <path d='M 0 0 L 10 5 L 0 10 z' fill='currentColor' />
              </marker>
            </defs>
            {diagram.links.map((link) => {
              const a = diagram.blocks.find((b) => b.id === link.from)!,
                b = diagram.blocks.find((b) => b.id === link.to)!;
              const dx = b.x - a.x, dy = b.y - a.y, horizontal = Math.abs(dx) >= Math.abs(dy);
              const sx = a.x + WIDTH / 2 + (horizontal ? Math.sign(dx) * (WIDTH / 2 + 2) : 0),
                sy = a.y + HEIGHT / 2 + (horizontal ? 0 : Math.sign(dy) * (HEIGHT / 2 + 2));
              const tx = b.x + WIDTH / 2 - (horizontal ? Math.sign(dx) * (WIDTH / 2 + 4) : 0),
                ty = b.y + HEIGHT / 2 - (horizontal ? 0 : Math.sign(dy) * (HEIGHT / 2 + 4));
              const active = focused === a.id || focused === b.id;
              return (
                <g key={link.id} className={active ? 'connection active' : 'connection'}>
                  <path
                    d={`M ${sx} ${sy} C ${horizontal ? (sx + tx) / 2 : sx} ${
                      horizontal ? sy : (sy + ty) / 2
                    }, ${horizontal ? (sx + tx) / 2 : tx} ${
                      horizontal ? ty : (sy + ty) / 2
                    }, ${tx} ${ty}`}
                    markerEnd='url(#arrow)'
                  />
                  {link.label && (
                    <text x={(sx + tx) / 2} y={(sy + ty) / 2 - 10} textAnchor='middle'>
                      {link.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {diagram.blocks.map((block, index) => (
            <article
              key={block.id}
              data-block-id={block.id}
              data-focused={focused === block.id}
              data-editing={editing === block.id}
              className={`block ${focused === block.id ? 'focused' : ''} ${
                editing === block.id ? 'editing' : ''
              }`}
              style={{ left: block.x, top: block.y, width: WIDTH, height: HEIGHT }}
              onPointerDown={(event) => startDrag(event, block)}
              onDoubleClick={() => {
                if (!editing && !labelSource && !help) edit(block.id);
              }}
            >
              <div className='block-header'>
                <span className='block-number'>{String(index + 1).padStart(2, '0')}</span>
                <span className='block-type'>THOUGHT</span>
                <span className='block-state'>
                  {editing === block.id
                    ? vimMode.toLowerCase()
                    : focused === block.id
                    ? 'focused'
                    : '·'}
                </span>
              </div>
              {editing === block.id
                ? (
                  <VimEditor
                    text={block.text}
                    onMode={setVimMode}
                    onExit={finishEdit}
                    onChange={(text) => updateBlockText(block.id, text)}
                  />
                )
                : (
                  <div className={`block-text ${!block.text ? 'empty' : ''}`}>
                    {block.text || 'An empty thought…'}
                  </div>
                )}
            </article>
          ))}
        </div>

        {!diagram.blocks.length && (
          <div className='empty-canvas'>
            <h1>Room for a new idea.</h1>
            <p>
              Type <kbd>a</kbd>
              <kbd>a</kbd> to start a thought.
            </p>
            <button onClick={() => create(false)}>
              Create a block <span>↗</span>
            </button>
          </div>
        )}
        <div className='canvas-bottom'>
          <div className='quick-start'>
            <span className='quick-label'>MAKE YOUR NEXT MOVE</span>
            <div>
              <kbd>h</kbd>
              <kbd>j</kbd>
              <kbd>k</kbd>
              <kbd>l</kbd>
              <span>hop between thoughts</span>
            </div>
            <div>
              <kbd>i</kbd>
              <span>edit</span>
              <kbd>a</kbd>
              <kbd>l</kbd>
              <span>add a connection</span>
            </div>
          </div>
          <div className='zoom-controls'>
            <button
              aria-label='Zoom out'
              onClick={() => {
                zoomBy(1 / 1.15);
                returnToCanvas();
              }}
            >
              −
            </button>
            <span>{Math.round(camera.zoom * 100)}%</span>
            <button
              aria-label='Zoom in'
              onClick={() => {
                zoomBy(1.15);
                returnToCanvas();
              }}
            >
              +
            </button>
            <span className='zoom-divider' />
            <button
              aria-label='Fit diagram'
              onClick={() => {
                fit();
                returnToCanvas();
              }}
            >
              ↙↗
            </button>
          </div>
        </div>
      </main>
      {preview && (
        <aside
          id='markdown-preview'
          className='preview-pane'
          aria-label='Markdown preview'
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              togglePreview();
            }
          }}
        >
          <div className='preview-header'>
            <div>
              <span className='eyebrow'>FOCUSED THOUGHT</span>
              <h2>Markdown preview</h2>
            </div>
            <button aria-label='Close preview' onClick={togglePreview}>×</button>
          </div>
          <div key={focused} className='preview-content' tabIndex={0} aria-label='Preview content'>
            {selectedIndex < 0
              ? <p className='preview-empty'>Select a thought to preview it.</p>
              : diagram.blocks[selectedIndex].text
              ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {diagram.blocks[selectedIndex].text}
                </ReactMarkdown>
              )
              : <p className='preview-empty'>This thought is empty.</p>}
          </div>
        </aside>
      )}
    </div>
  );
}
