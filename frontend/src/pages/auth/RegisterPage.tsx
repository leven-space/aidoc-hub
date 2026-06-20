import { useState } from 'react';
import { Card, Form, Input, Button, message, Typography, Progress } from 'antd';
import { LockOutlined, MobileOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

function strengthLabel(score: number): string {
  if (score < 40) return '弱';
  if (score < 70) return '中';
  return '强';
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
  const strength = getPasswordStrength(password);

  const onFinish = async (values: { phone: string; password: string; name?: string }) => {
    setLoading(true);
    try {
      await register(values.phone, values.password, values.name);
      message.success('注册成功');
      navigate('/', { replace: true });
    } catch (err) {
      message.error(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
      <Typography.Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
        注册
      </Typography.Title>
      <Form layout="vertical" onFinish={onFinish} size="large">
        <Form.Item name="name">
          <Input prefix={<UserOutlined />} placeholder="昵称（可选）" />
        </Form.Item>
        <Form.Item
          name="phone"
          rules={[
            { required: true, message: '请输入手机号' },
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
          ]}
        >
          <Input prefix={<MobileOutlined />} placeholder="手机号" maxLength={11} />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少 6 位' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="密码"
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
              密码强度：{strengthLabel(strength)}
            </Typography.Text>
          </div>
        )}
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
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            注册
          </Button>
        </Form.Item>
        <Typography.Text type="secondary">
          已有账号？ <Link to="/login">立即登录</Link>
        </Typography.Text>
      </Form>
    </Card>
  );
}
