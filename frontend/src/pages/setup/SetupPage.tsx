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
import { setupApi } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

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
      message.success('系统初始化完成');
      navigate('/', { replace: true, state: { showOnboarding: true } });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '初始化失败');
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
        background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f4ff 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 520, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          欢迎使用 AI Doc Hub
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
          首次部署请创建系统管理员并配置对外访问地址
        </Typography.Paragraph>

        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 24 }}
          items={[{ title: '管理员账号' }, { title: '系统配置' }]}
        />

        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="系统管理员可配置 MCP 公网地址、站点名称及是否允许公开注册"
        />

        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={onFinish}
          initialValues={{
            siteName: 'AI Doc Hub',
            publicApiUrl: window.location.origin,
          }}
        >
          {step === 0 && (
            <>
              <Form.Item name="name">
                <Input prefix={<UserOutlined />} placeholder="管理员姓名（可选）" />
              </Form.Item>
              <Form.Item
                name="phone"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
                ]}
              >
                <Input prefix={<MobileOutlined />} placeholder="管理员手机号" maxLength={11} />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少 6 位' },
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="登录密码" />
              </Form.Item>
              <Form.Item
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
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
                下一步
              </Button>
            </>
          )}

          {step === 1 && (
            <>
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
                extra="供 MCP 与外部 AI 客户端访问的公网地址，不含 /api 后缀"
                rules={[
                  { required: true, message: '请输入对外 API 地址' },
                  { type: 'url', message: '请输入有效的 URL' },
                ]}
              >
                <Input prefix={<GlobalOutlined />} placeholder="https://docs.example.com" />
              </Form.Item>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button block onClick={() => setStep(0)}>
                  上一步
                </Button>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  完成初始化
                </Button>
              </div>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
}
