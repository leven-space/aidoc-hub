import { Layout, Typography } from 'antd';
import { Outlet, Link } from 'react-router-dom';

const { Content } = Layout;

export function AuthLayout() {
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
            AI Doc Hub
          </Typography.Title>
          <Typography.Text type="secondary">企业 HTML 文档版本管理平台</Typography.Text>
        </Link>
        <Outlet />
      </Content>
    </Layout>
  );
}
