import { useNotebookStore } from '../store/useNotebookStore';

export default function CommandPanel() {
  const command = useNotebookStore((state) => state.command);
  const commandLogs = useNotebookStore((state) => state.commandLogs);
  const documents = useNotebookStore((state) => state.documents);
  const setCommand = useNotebookStore((state) => state.setCommand);
  const runCommand = useNotebookStore((state) => state.runCommand);

  const latestCommand = commandLogs[commandLogs.length - 1]?.command ?? '';
  const lastNotebookName = documents[0]?.name ?? 'your-note-name';
  const tipLines =
    latestCommand === 'ls' && documents.length > 0
      ? [
          'Type `catch your-note-name` to enter a notebook.',
          `Example: \`catch ${lastNotebookName}\``
        ]
      : ['Type `create your-note-name` to create a notebook.', 'Type `ls` to list notebooks.'];

  const renderCommand = (value: string) => {
    const [keyword, ...rest] = value.trim().split(/\s+/);

    return (
      <>
        <span className="conote-cmd__outputKeyword">{keyword}</span>
        {rest.length > 0 ? <span className="conote-cmd__outputArgs"> {rest.join(' ')}</span> : null}
      </>
    );
  };

  return (
    <section className="conote-command">
      <div className="conote-cmd">
        <div className="conote-cmd__header">
          <span className="conote-cmd__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="conote-cmd__title">coNote.cmd</span>
          <span className="conote-cmd__mode">interactive</span>
        </div>

        <div className="conote-cmd__body">
          <div className="conote-cmd__tips" aria-hidden="true">
            {tipLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <label className="conote-cmd__inputWrap">
            <span className="conote-cmd__caret">$</span>
            <input
              className="conote-cmd__input"
              type="text"
              placeholder="Type: create your-note-name"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  runCommand();
                }
              }}
            />
          </label>

          <div className="conote-cmd__output" aria-live="polite">
            {commandLogs.map((entry) => (
              <div key={entry.id} className="conote-cmd__outputBlock">
                <div className="conote-cmd__outputRow">
                  <span className="conote-cmd__outputPrompt">conote:/&gt;</span>
                  <span className="conote-cmd__outputCommand">{renderCommand(entry.command)}</span>
                </div>

                {entry.lines.map((line, index) => (
                  <div key={`${entry.id}-${index}`} className="conote-cmd__outputRow">
                    <span className="conote-cmd__outputText">{line}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
