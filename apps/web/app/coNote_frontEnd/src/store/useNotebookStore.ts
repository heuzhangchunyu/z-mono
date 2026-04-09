import { create } from 'zustand';
import type { CommandLog, DocumentFile } from '../types';

interface NotebookState {
  command: string;
  documents: DocumentFile[];
  commandLogs: CommandLog[];
  activeDocumentId: string | null;
  setCommand: (value: string) => void;
  runCommand: () => void;
  updateActiveDocumentContent: (value: string) => void;
}

const MAX_LOGS = 24;

const createCommandLog = (command: string, lines: string[]): CommandLog => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  command,
  lines
});

const appendCommandLog = (logs: CommandLog[], command: string, lines: string[]) =>
  [...logs, createCommandLog(command, lines)].slice(-MAX_LOGS);

const normalizeNotebookName = (value: string) => value.trim();

const findDocumentByName = (documents: DocumentFile[], name: string) =>
  documents.find((document) => document.name === name);

const buildCreateResult = (documents: DocumentFile[], name: string) => {
  const existingDocument = findDocumentByName(documents, name);

  if (existingDocument) {
    return {
      document: existingDocument,
      documents,
      lines: [`Notebook "${name}" already exists.`]
    };
  }

  const nextDocument: DocumentFile = {
    id: `${name}-${Date.now()}`,
    name,
    content: ''
  };

  return {
    document: nextDocument,
    documents: [nextDocument, ...documents],
    lines: [`Notebook "${name}" created successfully.`]
  };
};

export const useNotebookStore = create<NotebookState>((set, get) => ({
  command: '',
  documents: [],
  commandLogs: [],
  activeDocumentId: null,
  setCommand: (value) => set({ command: value }),
  runCommand: () => {
    const trimmed = get().command.trim();

    if (!trimmed) {
      return;
    }

    const state = get();

    if (trimmed === 'clear') {
      set({
        command: '',
        commandLogs: []
      });
      return;
    }

    if (trimmed === 'ls') {
      const lines =
        state.documents.length === 0
          ? ['No notebooks found.']
          : state.documents.map((document) => document.name);

      set({
        command: '',
        commandLogs: appendCommandLog(state.commandLogs, trimmed, lines)
      });
      return;
    }

    if (trimmed.startsWith('catch ')) {
      const name = normalizeNotebookName(trimmed.slice(6));

      if (!name) {
        set({
          command: '',
          commandLogs: appendCommandLog(state.commandLogs, trimmed, ['Missing notebook name.'])
        });
        return;
      }

      const targetDocument = findDocumentByName(state.documents, name);

      if (!targetDocument) {
        set({
          command: '',
          commandLogs: appendCommandLog(state.commandLogs, trimmed, [`Notebook "${name}" not found.`])
        });
        return;
      }

      set({
        command: '',
        activeDocumentId: targetDocument.id,
        commandLogs: appendCommandLog(state.commandLogs, trimmed, [`Entered notebook "${name}".`])
      });
      return;
    }

    if (trimmed.startsWith('create ')) {
      const name = normalizeNotebookName(trimmed.slice(7));

      if (!name) {
        set({
          command: '',
          commandLogs: appendCommandLog(state.commandLogs, trimmed, ['Missing notebook name.'])
        });
        return;
      }

      const result = buildCreateResult(state.documents, name);

      set({
        command: '',
        documents: result.documents,
        activeDocumentId: result.document.id,
        commandLogs: appendCommandLog(state.commandLogs, trimmed, result.lines)
      });
      return;
    }

    if (!trimmed.startsWith('vim ')) {
      set({
        command: '',
        commandLogs: appendCommandLog(state.commandLogs, trimmed, [`Command not found: ${trimmed}`])
      });
      return;
    }

    const name = normalizeNotebookName(trimmed.slice(4));

    if (!name) {
      set({
        command: '',
        commandLogs: appendCommandLog(state.commandLogs, trimmed, ['Missing notebook name.'])
      });
      return;
    }

    const result = buildCreateResult(state.documents, name);

    set({
      command: '',
      activeDocumentId: result.document.id,
      documents: result.documents,
      commandLogs: appendCommandLog(state.commandLogs, trimmed, result.lines)
    });
  },
  updateActiveDocumentContent: (value) =>
    set((state) => ({
      documents: state.documents.map((document) =>
        document.id === state.activeDocumentId
          ? {
              ...document,
              content: value
            }
          : document
      )
    }))
}));
