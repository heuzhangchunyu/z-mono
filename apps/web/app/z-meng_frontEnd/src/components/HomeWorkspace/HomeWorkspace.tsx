import { Navigate, Route, Routes } from 'react-router-dom';
import CreationWorkspace from '../CreationWorkspace/CreationWorkspace';
import CanvasWorkspace from '../CanvasWorkspace/CanvasWorkspace';
import EpisodeStudio from '../EpisodeStudio/EpisodeStudio';
import type { HomeSectionKey } from '../../types/home';
import './HomeWorkspace.less';

interface HomeWorkspaceProps {
  activeKey: HomeSectionKey;
  username: string;
}

export default function HomeWorkspace({ activeKey, username }: HomeWorkspaceProps) {
  const workspace = activeKey === 'canvas'
    ? <CanvasWorkspace username={username} />
    : (
      <Routes>
        <Route index element={<CreationWorkspace username={username} />} />
        <Route path="episodes/:episodeId/*" element={<EpisodeStudio username={username} />} />
        <Route path="*" element={<Navigate to="/creation" replace />} />
      </Routes>
    );

  return <section className="zmeng-workspace">{workspace}</section>;
}
