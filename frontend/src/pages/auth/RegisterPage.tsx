import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Progress } from 'antd';
import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';

function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 6) score += 25;
  if (password.length >= 10) score += 25;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 25;
  if (/\d/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 10;
  return Math.min(score, 100);
}

function strengthColor(score: number): string {
  if (score < 40) return '#ff4d4f';
  if (score < 70) return '#faad14';
  return '#52c41a';
}

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const strength = getPasswordStrength(password);

  const strengthLabel = (score: number): string => {
    if (score < 40) return t('auth.passwordStrengthWeak');
    if (score < 70) return t('auth.passwordStrengthMedium');
    return t('auth.passwordStrengthStrong');
  };

  const onFinish = async (values: { phone: string; password: string; name?: string }) => {
    setLoading(true);
    try {
      await register(values.phone, values.password, values.name);
      message.success(t('auth.registerSuccess'));
      navigate('/', { replace: true });
    } catch (err) {
      message.error(getApiErrorMessage(err, 'auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
        {t('auth.register')}
      </Typography.Title>
      <Form layout="vertical" onFinish={onFinish} size="large">
        <Form.Item name="name">
          <Input prefix={<UserOutlined />} placeholder={t('auth.nameOptional')} />
        </Form.Item>
        <Form.Item
          name="phone"
          rules={[
            { required: true, message: t('validation.phoneRequired') },
            { pattern: /^1[3-9]\d{9}$/, message: t('validation.phoneInvalid') },
          ]}
        >
          <Input prefix={<MobileOutlined />} placeholder={t('auth.phone')} maxLength={11} />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: t('validation.passwordRequired') },
            { min: 6, message: t('validation.passwordMin') },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={t('auth.password')}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Form.Item>
        {password && (
          <div style={{ marginBottom: 16 }}>
            <Progress
              percent={strength}
              showInfo={false}
              strokeColor={strengthColor(strength)}
              size="small"
            />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {t('auth.passwordStrength', { level: strengthLabel(strength) })}
            </Typography.Text>
          </div>
        )}
        <Form.Item
          name="confirm"
          dependencies={['password']}
          rules={[
            { required: true, message: t('validation.confirmPasswordRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error(t('validation.passwordMismatch')));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder={t('auth.confirmPassword')} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {t('auth.register')}
          </Button>
        </Form.Item>
        <Typography.Text type="secondary">
          {t('auth.hasAccount')} <Link to="/login">{t('auth.loginNow')}</Link>
        </Typography.Text>
      </Form>
    </Card>
  );
}
