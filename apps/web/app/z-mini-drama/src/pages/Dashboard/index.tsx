import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './index.less';

interface WorkspaceNavItem {
  key: string;
  label: string;
  path: '/episode' | '/canvas';
}

const workspaceNavItems: WorkspaceNavItem[] = [
  {
    key: 'episode',
    label: '剧集创作',
    path: '/episode'
  },
  {
    key: 'canvas',
    label: '无限画布',
    path: '/canvas'
  }
];

export default function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="zmd-workspace">
      <aside className="zmd-workspace__sidebar">
        <div className="zmd-workspace__nav">
          {workspaceNavItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.key}
                type="button"
                className={`zmd-workspace__nav-item${isActive ? ' zmd-workspace__nav-item--active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </aside>

      <main className="zmd-workspace__main">
        <Outlet />
      </main>
    </div>
  );
}
