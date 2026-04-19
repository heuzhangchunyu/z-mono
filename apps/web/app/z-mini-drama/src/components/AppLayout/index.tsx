import { Layout, Menu, Typography } from 'antd';
import type { ItemType } from 'antd/es/menu/interface';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './index.less';

interface MenuClickInfo {
  key: string;
}

const menuItems: ItemType[] = [
  {
    key: '/dashboard',
    label: '项目总览'
  }
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Layout className="zmd-layout">
      <Layout.Sider width={240} className="zmd-layout__sider">
        <div className="zmd-layout__brand">
          <Typography.Title level={4}>Z Mini Drama</Typography.Title>
          <Typography.Paragraph>
            React 前端脚手架
          </Typography.Paragraph>
        </div>
        <Menu
          mode="inline"
          items={menuItems}
          selectedKeys={[location.pathname]}
          onClick={({ key }: MenuClickInfo) => navigate(key)}
        />
      </Layout.Sider>
      <Layout className="zmd-layout__main">
        <Layout.Header className="zmd-layout__header">
          <Typography.Title level={3}>短剧项目工作台</Typography.Title>
          <Typography.Text type="secondary">目录结构和接口组织方式参考 example-mini-drama</Typography.Text>
        </Layout.Header>
        <Layout.Content className="zmd-layout__content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
