import CommandPanel from './components/CommandPanel';
import NotebookEditor from './components/NotebookEditor';
import { useNotebookStore } from './store/useNotebookStore';

export default function App() {
  const documents = useNotebookStore((state) => state.documents);
  const activeDocumentId = useNotebookStore((state) => state.activeDocumentId);
  const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? null;

  return (
    <main className="conote-shell">
      <CommandPanel />

      <div className="conote-divider" aria-hidden="true" />

      <NotebookEditor activeDocument={activeDocument} />
    </main>
  );
}
