import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Button, Typography } from 'antd';
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
  KeyOutlined,
  AuditOutlined,
  BookOutlined,
  HistoryOutlined,
  CompassOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { GlobalSearch } from '../components/GlobalSearch';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { OnboardingTourHost } from '../components/OnboardingTour';
import { ChangelogDrawer } from '../components/ChangelogDrawer';
import { AppLogo } from '../components/AppLogo';
import { startFeatureTour } from '../content/tours';
import { APP_VERSION } from '../content/version';

const { Header, Sider, Content } = Layout;

export function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const isSystemAdmin = user?.systemRole === 'SYSTEM_ADMIN';

  const helpMenuItems: MenuProps['items'] = [
    {
      key: 'tour',
      icon: <CompassOutlined />,
      label: t('nav.helpTour'),
      onClick: () => startFeatureTour('onboarding'),
    },
    {
      key: 'features',
      icon: <BookOutlined />,
      label: t('nav.helpFeatures'),
      onClick: () => navigate('/help/features'),
    },
    {
      key: 'changelog',
      icon: <HistoryOutlined />,
      label: t('nav.helpChangelog'),
      onClick: () => setChangelogOpen(true),
    },
  ];

  const settingsChildren: MenuProps['items'] = [
    {
      key: '/settings/tokens',
      icon: <KeyOutlined />,
      label: <span data-tour="nav-tokens">{t('nav.tokens')}</span>,
    },
    {
      key: '/settings/mcp',
      icon: <ApiOutlined />,
      label: <span data-tour="nav-mcp">{t('nav.mcp')}</span>,
    },
    ...(isSystemAdmin
      ? [
          { key: '/settings/system', icon: <ToolOutlined />, label: t('nav.systemConfig') },
          { key: '/settings/audit', icon: <AuditOutlined />, label: t('nav.audit') },
        ]
      : []),
  ];

  const settingsPaths = [
    '/settings/tokens',
    '/settings/mcp',
    ...(isSystemAdmin ? ['/settings/system', '/settings/audit'] : []),
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
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            cursor: 'pointer',
            padding: collapsed ? '0 8px' : '0 16px',
          }}
          onClick={() => navigate('/')}
        >
          <AppLogo
            size={collapsed ? 32 : 36}
            showText={!collapsed}
            text={t('common.appName')}
            textSize={16}
          />
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
            <Dropdown menu={{ items: helpMenuItems }} placement="bottomRight">
              <Button
                type="text"
                icon={<QuestionCircleOutlined />}
                data-tour="help-button"
              >
                {t('nav.help')}
                <Typography.Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                  v{APP_VERSION}
                </Typography.Text>
              </Button>
            </Dropdown>
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
      <ChangelogDrawer open={changelogOpen} onClose={() => setChangelogOpen(false)} />
    </Layout>
  );
}
