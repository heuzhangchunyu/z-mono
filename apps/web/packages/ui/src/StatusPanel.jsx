const items = [
  ['Frontend Apps', 'apps/web/app/*'],
  ['Packages', 'apps/web/packages/*'],
  ['Backend', 'apps/server on port 4000']
];

export default function StatusPanel() {
  return (
    <aside className="status-panel">
      <h2>Workspace snapshot</h2>
      <ul>
        {items.map(([label, value]) => (
          <li key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </li>
        ))}
      </ul>
    </aside>
  );
}
