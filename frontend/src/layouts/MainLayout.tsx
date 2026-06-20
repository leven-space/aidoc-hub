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
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { GlobalSearch } from '../components/GlobalSearch';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { OnboardingTourHost } from '../components/OnboardingTour';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const isSystemAdmin = user?.systemRole === 'SYSTEM_ADMIN';

  const startTour = () => {
    window.dispatchEvent(new CustomEvent('aidoc-hub:start-tour'));
  };

  const settingsChildren: MenuProps['items'] = [
    { key: '/settings/tokens', label: <span data-tour="nav-tokens">{t('nav.tokens')}</span> },
    { key: '/settings/mcp', label: <span data-tour="nav-mcp">{t('nav.mcp')}</span> },
    ...(isSystemAdmin
      ? [{ key: '/settings/system', label: t('nav.systemConfig'), icon: <ToolOutlined /> }]
      : []),
    { key: '/settings/audit', label: t('nav.audit') },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <span data-tour="nav-workspaces">{t('nav.workspaces')}</span>,
    },
    {
      key: '/recycle',
      icon: <FolderOutlined />,
      label: t('nav.recycle'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
      children: settingsChildren,
    },
  ];

  const settingsPaths = ['/settings/tokens', '/settings/mcp', '/settings/system', '/settings/audit'];
  const selectedKey =
    ['/', '/recycle', ...settingsPaths].find(
      (p) => location.pathname === p || (p !== '/' && location.pathname.startsWith(p)),
    ) || (location.pathname.startsWith('/workspaces') ? '/' : location.pathname);

  const userMenuItems: MenuProps['items'] = [
    { key: 'tokens', icon: <SettingOutlined />, label: t('nav.tokens') },
    { key: 'mcp', icon: <ApiOutlined />, label: t('nav.mcp') },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
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
            {collapsed ? t('common.appShortName') : t('common.appName')}
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
              {t('nav.helpTour')}
            </Button>
            <LanguageSwitcher />
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
                <span>{user?.name || t('common.user')}</span>
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
