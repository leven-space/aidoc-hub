import { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Steps,
  Tag,
  message,
  Alert,
  Popconfirm,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/PageContainer';
import { tokenApi } from '../../services';
import type { AccessToken } from '../../types';

const scopeLabels: Record<string, string> = {
  READ: '只读',
  READ_WRITE: '读写',
};

type TokenFormValues = {
  name: string;
  scope: 'READ' | 'READ_WRITE';
  expiresAt?: { toISOString: () => string };
};

export function TokenManage() {
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [plaintext, setPlaintext] = useState('');
  const [draft, setDraft] = useState<TokenFormValues | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const data = await tokenApi.list();
      setTokens(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (values: TokenFormValues) => {
    setCreating(true);
    try {
      const result = await tokenApi.create({
        name: values.name,
        scope: values.scope,
        expiresAt: values.expiresAt?.toISOString?.(),
      });
      setPlaintext(result.plaintext);
      setStep(2);
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await tokenApi.revoke(id);
      message.success('Token 已吊销');
      load();
    } catch (err) {
      message.error(err instanceof Error ? err.message : '吊销失败');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setStep(0);
    setPlaintext('');
    setDraft(null);
    form.resetFields();
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '权限范围',
      dataIndex: 'scope',
      key: 'scope',
      render: (scope: string) => <Tag>{scopeLabels[scope] || scope}</Tag>,
    },
    {
      title: '有效期',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : '永久'),
    },
    {
      title: '状态',
      key: 'status',
      render: (_: unknown, record: AccessToken) => {
        if (record.isRevoked) return <Tag color="red">已吊销</Tag>;
        if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
          return <Tag color="orange">已过期</Tag>;
        }
        return <Tag color="green">有效</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: AccessToken) =>
        !record.isRevoked ? (
          <Popconfirm title="确认吊销此 Token？" onConfirm={() => handleRevoke(record.id)}>
            <Button type="link" danger size="small">
              吊销
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <PageContainer
      title="Access Token 管理"
      subtitle="用于 MCP 和 API 接入的个人访问令牌"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          创建 Token
        </Button>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={
          <span>
            创建 Token 后，前往 <Link to="/settings/mcp">MCP 接入配置</Link> 获取 Cursor / Claude Code 配置说明
          </span>
        }
      />
      <Table rowKey="id" columns={columns} dataSource={tokens} loading={loading} />

      <Modal
        title="创建 Access Token"
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={480}
        destroyOnHidden
      >
        <Steps
          current={step}
          size="small"
          style={{ marginBottom: 24 }}
          items={[{ title: '基本信息' }, { title: '确认' }, { title: '完成' }]}
        />

        {step === 0 && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{ scope: 'READ' }}
            onFinish={(values) => {
              setDraft(values);
              setStep(1);
            }}
          >
            <Form.Item
              name="name"
              label="Token 名称"
              rules={[{ required: true, message: '请输入名称' }]}
            >
              <Input placeholder="例如：MCP 开发环境" />
            </Form.Item>
            <Form.Item name="scope" label="权限范围" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: '只读 (READ)', value: 'READ' },
                  { label: '读写 (READ_WRITE)', value: 'READ_WRITE' },
                ]}
              />
            </Form.Item>
            <Form.Item name="expiresAt" label="有效期">
              <DatePicker showTime style={{ width: '100%' }} placeholder="留空则永久有效" />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                下一步
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 1 && (
          <div>
            <p>请确认 Token 配置信息：</p>
            <ul>
              <li>名称：{draft?.name}</li>
              <li>权限：{scopeLabels[draft?.scope ?? '']}</li>
            </ul>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setStep(0)} style={{ marginRight: 8 }}>
                上一步
              </Button>
              <Button
                type="primary"
                loading={creating}
                disabled={!draft}
                onClick={() => draft && handleCreate(draft)}
              >
                创建
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <Alert
              type="warning"
              message="请立即复制 Token"
              description="Token 明文仅显示一次，关闭后将无法再次查看。"
              style={{ marginBottom: 16 }}
            />
            <Input.TextArea value={plaintext} readOnly rows={3} />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => {
                  navigator.clipboard.writeText(plaintext);
                  message.success('已复制');
                }}
                style={{ marginRight: 8 }}
              >
                复制 Token
              </Button>
              <Button onClick={handleCloseModal}>完成</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
