import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import './index.less';

export default function AppLayout() {
  return (
    <Layout className="zmd-layout">
      <Layout.Content className="zmd-layout__content">
        <Outlet />
      </Layout.Content>
    </Layout>
  );
}
