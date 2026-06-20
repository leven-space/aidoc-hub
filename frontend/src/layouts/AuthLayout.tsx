import { Layout, Typography } from 'antd';
import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '../components/AppLogo';
import { authBackgroundGradient, brandColors } from '../theme/brand';

const { Content } = Layout;

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Layout style={{ minHeight: '100vh', background: authBackgroundGradient }}>
      <Content
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Link
          to="/"
          style={{
            marginBottom: 32,
            textDecoration: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AppLogo size={64} showText text={t('common.appName')} textSize={28} />
          <Typography.Text style={{ color: brandColors.textMuted, letterSpacing: 1 }}>
            {t('auth.tagline')}
          </Typography.Text>
        </Link>
        <Outlet />
      </Content>
    </Layout>
  );
}
