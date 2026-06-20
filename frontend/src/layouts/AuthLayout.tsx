import { Layout, Typography } from 'antd';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Content } = Layout;

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e8f0fe 100%)' }}>
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Link to="/" style={{ marginBottom: 32, textDecoration: 'none' }}>
          <Typography.Title level={2} style={{ color: '#1677ff', margin: 0 }}>
            {t('common.appName')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('auth.tagline')}</Typography.Text>
        </Link>
        <Outlet />
      </Content>
    </Layout>
  );
}
