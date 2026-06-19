import type { ReactNode } from 'react';
import { Typography, Breadcrumb, Space } from 'antd';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { title: string; href?: string }[];
  extra?: ReactNode;
  children: ReactNode;
}

export function PageContainer({
  title,
  subtitle,
  breadcrumb,
  extra,
  children,
}: PageContainerProps) {
  return (
    <div>
      <div
        style={{
          marginBottom: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          {breadcrumb && (
            <Breadcrumb
              items={breadcrumb}
              style={{ marginBottom: 8 }}
            />
          )}
          <Space align="center" size={12}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            {subtitle && (
              <Typography.Text type="secondary">{subtitle}</Typography.Text>
            )}
          </Space>
        </div>
        {extra && <Space>{extra}</Space>}
      </div>
      <div>{children}</div>
    </div>
  );
}
