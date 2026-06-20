import { useState } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown, Space, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
  HomeOutlined,
  FolderOutlined,
  SettingOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  ApiOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GlobalSearch } from '../components/GlobalSearch';
import { OnboardingTourHost } from '../components/OnboardingTour';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const isSystemAdmin = user?.systemRole === 'SYSTEM_ADMIN';

  const startTour = () => {
    window.dispatchEvent(new CustomEvent('aidoc-hub:start-tour'));
  };

  const settingsChildren: MenuProps['items'] = [
    { key: '/settings/tokens', label: <span data-tour="nav-tokens">Token 管理</span> },
    { key: '/settings/mcp', label: <span data-tour="nav-mcp">MCP 接入</span> },
    ...(isSystemAdmin
      ? [{ key: '/settings/system', label: '系统配置', icon: <ToolOutlined /> }]
      : []),
    { key: '/settings/audit', label: '审计日志' },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <span data-tour="nav-workspaces">工作空间</span>,
    },
    {
      key: '/recycle',
      icon: <FolderOutlined />,
      label: '回收站',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '个人设置',
      children: settingsChildren,
    },
  ];

  const settingsPaths = ['/settings/tokens', '/settings/mcp', '/settings/system', '/settings/audit'];
  const selectedKey =
    ['/', '/recycle', ...settingsPaths].find(
      (p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)),
    ) || (location.pathname.startsWith('/workspaces') ? '/' : location.pathname);

  const userMenuItems: MenuProps['items'] = [
    { key: 'tokens', icon: <SettingOutlined />, label: 'Token 管理' },
    { key: 'mcp', icon: <ApiOutlined />, label: 'MCP 接入' },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
        collapsedWidth={80}
        trigger={null}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            {collapsed ? 'ADH' : 'AI Doc Hub'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          defaultOpenKeys={['/settings']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}
        >
          <Space size={16}>
            {collapsed ? (
              <MenuUnfoldOutlined
                onClick={() => setCollapsed(false)}
                style={{ fontSize: 18, cursor: 'pointer' }}
              />
            ) : (
              <MenuFoldOutlined
                onClick={() => setCollapsed(true)}
                style={{ fontSize: 18, cursor: 'pointer' }}
              />
            )}
            <div data-tour="global-search">
              <GlobalSearch />
            </div>
          </Space>
          <Space size={16}>
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              data-tour="help-button"
              onClick={startTour}
            >
              新手引导
            </Button>
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: ({ key }) => {
                  if (key === 'tokens') navigate('/settings/tokens');
                  if (key === 'mcp') navigate('/settings/mcp');
                },
              }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} size="small" />
                <span>{user?.name || '用户'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content
          style={{
            margin: 24,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      <OnboardingTourHost />
    </Layout>
  );
}
