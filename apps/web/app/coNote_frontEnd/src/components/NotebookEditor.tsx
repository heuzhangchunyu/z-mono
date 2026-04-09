import { useMemo, useRef } from 'react';
import type { UIEvent } from 'react';
import type { DocumentFile } from '../types';
import { useNotebookStore } from '../store/useNotebookStore';

interface NotebookEditorProps {
  activeDocument: DocumentFile | null;
}

export default function NotebookEditor({ activeDocument }: NotebookEditorProps) {
  const lineNumberRef = useRef<HTMLDivElement | null>(null);
  const updateActiveDocumentContent = useNotebookStore((state) => state.updateActiveDocumentContent);
  const lineNumbers = useMemo(() => {
    const content = activeDocument?.content ?? '';
    const count = Math.max(1, content.split('\n').length);
    return Array.from({ length: count }, (_, index) => index + 1);
  }, [activeDocument]);

  const handleEditorScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    if (lineNumberRef.current) {
      lineNumberRef.current.scrollTop = event.currentTarget.scrollTop;
    }
  };

  return (
    <section className="conote-workspace">
      {!activeDocument ? (
        <div className="conote-workspace__empty">
          <p>Enter `create your-note-name` and press Enter.</p>
        </div>
      ) : (
        <article className="conote-editor">
          <div className="conote-editor__toolbar">
            <span className="conote-editor__tab">{activeDocument.name}</span>
          </div>

          <div className="conote-editor__body">
            <div ref={lineNumberRef} className="conote-editor__gutter" aria-hidden="true">
              {lineNumbers.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>

            <textarea
              className="conote-editor__textarea"
              value={activeDocument.content}
              onChange={(event) => updateActiveDocumentContent(event.target.value)}
              onScroll={handleEditorScroll}
              spellCheck="false"
              placeholder="Write your note here..."
            />
          </div>
        </article>
      )}
    </section>
  );
}
