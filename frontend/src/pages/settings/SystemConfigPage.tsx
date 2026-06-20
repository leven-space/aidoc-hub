import { useEffect, useState } from 'react';
import { Card, Form, Input, Switch, Button, message, Spin, Alert } from 'antd';
import { Navigate } from 'react-router-dom';
import { PageContainer } from '../../components/PageContainer';
import { systemApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import type { SystemConfig } from '../../types';

export function SystemConfigPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SystemConfig>();

  useEffect(() => {
    systemApi
      .getConfig()
      .then((config) => form.setFieldsValue(config))
      .catch((err) => message.error(err instanceof Error ? err.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [form]);

  if (user?.systemRole !== 'SYSTEM_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: SystemConfig) => {
    setSaving(true);
    try {
      await systemApi.updateConfig(values);
      message.success('系统配置已保存');
    } catch (err) {
      message.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="系统配置">
        <Spin />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="系统配置"
      subtitle="配置 MCP 公网地址、站点名称及注册策略（仅系统管理员）"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="修改对外 API 地址后，MCP 接入页将自动使用新地址生成配置"
      />
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 560 }}>
          <Form.Item
            name="siteName"
            label="站点名称"
            rules={[{ required: true, message: '请输入站点名称' }]}
          >
            <Input placeholder="AI Doc Hub" />
          </Form.Item>
          <Form.Item
            name="publicApiUrl"
            label="对外 API 地址"
            extra="供 MCP 与外部 AI 客户端访问，不含 /api 后缀"
            rules={[
              { required: true, message: '请输入对外 API 地址' },
              { type: 'url', message: '请输入有效的 URL' },
            ]}
          >
            <Input placeholder="https://docs.example.com" />
          </Form.Item>
          <Form.Item
            name="registrationEnabled"
            label="允许公开注册"
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存配置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
}
