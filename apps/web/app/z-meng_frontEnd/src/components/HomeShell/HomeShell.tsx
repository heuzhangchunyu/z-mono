import { Layout } from 'antd';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import HomeSidebar from '../HomeSidebar/HomeSidebar';
import HomeWorkspace from '../HomeWorkspace/HomeWorkspace';
import type { HomeSectionKey } from '../../types/home';
import './HomeShell.less';

interface HomeShellProps {
  username: string;
}

export default function HomeShell({ username }: HomeShellProps) {
  const location = useLocation();

  const activeKey = useMemo<HomeSectionKey>(() => {
    if (location.pathname.startsWith('/canvas')) {
      return 'canvas';
    }
    return 'creation';
  }, [location.pathname]);

  return (
    <Layout className="zmeng-home-shell">
      <HomeSidebar activeKey={activeKey} username={username} />
      <section className="zmeng-home-shell__content">
        <HomeWorkspace activeKey={activeKey} username={username} />
      </section>
    </Layout>
  );
}
