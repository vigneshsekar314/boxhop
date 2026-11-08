import { useEffect, useRef } from 'react';
import { minimalSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { indentWithTab } from '@codemirror/commands';
import { getCM, Vim, vim } from '@replit/codemirror-vim';

export type Props = {
  text: string;
  onChange: (text: string) => void;
  onMode: (mode: string) => void;
  onExit: () => void;
};

export function useVimEditor(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(function VimEditor() {
    const element = host.current!;
    const view = new EditorView({
      parent: element,
      state: EditorState.create({
        doc: callbacks.current.text,
        extensions: [
          vim(),
          minimalSetup,
          keymap.of([indentWithTab]),
          EditorView.lineWrapping,
          placeholder('Put a thought here…'),
          EditorView.contentAttributes.of({ 'aria-label': 'Block text' }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) callbacks.current.onChange(update.state.doc.toString());
          }),
        ],
      }),
    });
    const cm = getCM(view)!;
    const reportMode = () => {
      const state = cm.state.vim;
      callbacks.current.onMode(
        cm.state.dialog
          ? 'COMMAND'
          : state?.insertMode
          ? 'INSERT'
          : state?.visualMode
          ? 'VISUAL'
          : 'NORMAL',
      );
    };
    cm.on('vim-mode-change', reportMode);
    cm.on('dialog', reportMode);

    // Capture before Vim handles the event: one Esc must never change two scopes.
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.isComposing) return;
      if (event.repeat) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const state = cm.state.vim;
      const pending = state?.inputState;
      if (
        !state?.insertMode && !state?.visualMode && !cm.state.dialog &&
        !pending?.keyBuffer.length && !pending?.operator && !pending?.prefixRepeat.length
      ) {
        event.preventDefault();
        event.stopPropagation();
        callbacks.current.onExit();
      }
    };
    element.addEventListener('keydown', escape, true);
    Vim.handleKey(cm, 'i', 'user');
    view.focus();
    reportMode();

    return () => {
      element.removeEventListener('keydown', escape, true);
      cm.off('vim-mode-change', reportMode);
      cm.off('dialog', reportMode);
      view.destroy();
    };
  }, []);

  return host;
}
