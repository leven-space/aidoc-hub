import { useEffect, useState } from 'react';
import { Card, Form, Input, Switch, Button, message, Spin, Alert } from 'antd';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { systemApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import type { SystemConfig } from '../../types';

export function SystemConfigPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<SystemConfig>();

  useEffect(() => {
    systemApi
      .getConfig()
      .then((config) => form.setFieldsValue(config))
      .catch((err) => message.error(getApiErrorMessage(err, 'common.loadFailed')))
      .finally(() => setLoading(false));
  }, [form]);

  if (user?.systemRole !== 'SYSTEM_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: SystemConfig) => {
    setSaving(true);
    try {
      await systemApi.updateConfig(values);
      message.success(t('system.saveSuccess'));
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title={t('system.title')}>
        <Spin />
      </PageContainer>
    );
  }

  return (
    <PageContainer title={t('system.title')} subtitle={t('system.subtitle')}>
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('system.apiUrlAlert')} />
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: 560 }}>
          <Form.Item
            name="siteName"
            label={t('system.siteName')}
            rules={[{ required: true, message: t('validation.siteNameRequired') }]}
          >
            <Input placeholder="AI Doc Hub" />
          </Form.Item>
          <Form.Item
            name="publicApiUrl"
            label={t('system.publicApiUrl')}
            extra={t('system.apiUrlExtra')}
            rules={[
              { required: true, message: t('validation.apiUrlRequired') },
              { type: 'url', message: t('validation.urlInvalid') },
            ]}
          >
            <Input placeholder="https://docs.example.com" />
          </Form.Item>
          <Form.Item name="registrationEnabled" label={t('system.registrationEnabled')} valuePropName="checked">
            <Switch checkedChildren={t('common.on')} unCheckedChildren={t('common.off')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              {t('system.saveConfig')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </PageContainer>
  );
}
