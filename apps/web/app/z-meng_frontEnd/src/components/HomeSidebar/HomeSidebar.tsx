import { Avatar, Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { NavLink } from 'react-router-dom';
import type { HomeSectionKey } from '../../types/home';
import './HomeSidebar.less';

interface HomeSidebarProps {
  activeKey: HomeSectionKey;
  username: string;
}

const menuItems: MenuProps['items'] = [
  {
    key: 'creation',
    label: <NavLink to="/creation">创作</NavLink>
  },
  {
    key: 'canvas',
    label: <NavLink to="/canvas">画布</NavLink>
  }
];

export default function HomeSidebar({ activeKey, username }: HomeSidebarProps) {
  return (
    <Layout.Sider className="zmeng-sidebar" width={116} theme="dark">
      <div className="zmeng-sidebar__brand">
        <div className="zmeng-sidebar__logo">z</div>
        <Typography.Text className="zmeng-sidebar__brand-text">z-meng</Typography.Text>
      </div>

      <Menu
        className="zmeng-sidebar__menu"
        mode="inline"
        selectedKeys={[activeKey]}
        items={menuItems}
      />

      <div className="zmeng-sidebar__footer">
        <Avatar className="zmeng-sidebar__avatar" size={42}>
          {username.slice(0, 1).toUpperCase()}
        </Avatar>
        <Typography.Text className="zmeng-sidebar__user">{username}</Typography.Text>
      </div>
    </Layout.Sider>
  );
}
