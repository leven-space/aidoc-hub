import { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Steps,
  Alert,
} from 'antd';
import { LockOutlined, MobileOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { setupApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { getApiErrorMessage } from '../../utils/apiError';
import { AppLogo } from '../../components/AppLogo';
import { authBackgroundGradient } from '../../theme/brand';

type SetupFormValues = {
  phone: string;
  password: string;
  confirm: string;
  name?: string;
  siteName: string;
  publicApiUrl: string;
};

export function SetupPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<SetupFormValues>();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { t } = useTranslation();

  const onFinish = async (values: SetupFormValues) => {
    setLoading(true);
    try {
      const res = await setupApi.initialize({
        phone: values.phone,
        password: values.password,
        name: values.name,
        siteName: values.siteName,
        publicApiUrl: values.publicApiUrl,
      });
      loginWithToken(res.accessToken, res.user);
      message.success(t('setup.initSuccess'));
      navigate('/', { replace: true, state: { showOnboarding: true } });
    } catch (err) {
      message.error(getApiErrorMessage(err, 'setup.initFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: authBackgroundGradient,
        padding: 24,
      }}
    >
      <Card style={{ width: 520, boxShadow: '0 4px 16px rgba(99, 102, 241, 0.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <AppLogo size={48} showText text={t('common.appName')} textSize={22} />
        </div>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          {t('setup.welcome')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
          {t('setup.subtitle')}
        </Typography.Paragraph>

        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 24 }}
          items={[{ title: t('setup.stepAdmin') }, { title: t('setup.stepConfig') }]}
        />

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('setup.adminAlert')}
        />

        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={onFinish}
          initialValues={{
            siteName: t('common.appName'),
            publicApiUrl: window.location.origin,
          }}
        >
          {step === 0 && (
            <>
              <Form.Item name="name">
                <Input prefix={<UserOutlined />} placeholder={t('setup.adminName')} />
              </Form.Item>
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: t('validation.phoneRequired') },
                  { pattern: /^1[3-9]\d{9}$/, message: t('validation.phoneInvalid') },
                ]}
              >
                <Input prefix={<MobileOutlined />} placeholder={t('setup.adminPhone')} maxLength={11} />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: t('validation.passwordRequired') },
                  { min: 6, message: t('validation.passwordMin') },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder={t('setup.loginPassword')} />
              </Form.Item>
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
              <Button
                type="primary"
                block
                onClick={() => {
                  form
                    .validateFields(['phone', 'password', 'confirm'])
                    .then(() => setStep(1))
                    .catch(() => {});
                }}
              >
                {t('common.next')}
              </Button>
            </>
          )}

          {step === 1 && (
            <>
              <Form.Item
                name="siteName"
                label={t('setup.siteName')}
                rules={[{ required: true, message: t('validation.siteNameRequired') }]}
              >
                <Input placeholder={t('common.appName')} />
              </Form.Item>
              <Form.Item
                name="publicApiUrl"
                label={t('setup.publicApiUrl')}
                extra={t('setup.apiUrlExtra')}
                rules={[
                  { required: true, message: t('validation.apiUrlRequired') },
                  { type: 'url', message: t('validation.urlInvalid') },
                ]}
              >
                <Input prefix={<GlobalOutlined />} placeholder="https://docs.example.com" />
              </Form.Item>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button block onClick={() => setStep(0)}>
                  {t('common.prev')}
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  {t('setup.finishInit')}
                </Button>
              </div>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
}
