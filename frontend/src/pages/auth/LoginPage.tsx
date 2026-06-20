import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography } from 'antd';
import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { loginPasswordRules, phoneRules } from '../../utils/formRules';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.phone, values.password);
      message.success(t('auth.loginSuccess'));
      navigate(from, { replace: true });
    } catch (err) {
      message.error(getApiErrorMessage(err, 'auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
        {t('auth.login')}
      </Typography.Title>
      <Form layout="vertical" onFinish={onFinish} size="large">
        <Form.Item name="phone" rules={phoneRules(t)}>
          <Input prefix={<MobileOutlined />} placeholder={t('auth.phone')} maxLength={11} />
        </Form.Item>
        <Form.Item name="password" rules={loginPasswordRules(t)}>
          <Input.Password prefix={<LockOutlined />} placeholder={t('auth.password')} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {t('auth.login')}
          </Button>
        </Form.Item>
        <Typography.Text type="secondary">
          {t('auth.noAccount')} <Link to="/register">{t('auth.registerNow')}</Link>
        </Typography.Text>
      </Form>
    </Card>
  );
}
