import { useVimEditor } from './VimEditor.hooks';
import type { Props } from './VimEditor.hooks';

export function VimEditor(props: Props) {
  const host = useVimEditor(props);
  return <div className='vim-editor' ref={host} />;
}
