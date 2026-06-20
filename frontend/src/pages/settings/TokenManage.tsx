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
import { useTranslation } from 'react-i18next';
import { PageContainer } from '../../components/PageContainer';
import { tokenApi } from '../../services';
import { getApiErrorMessage } from '../../utils/apiError';
import type { AccessToken } from '../../types';

type TokenFormValues = {
  name: string;
  scope: 'READ' | 'READ_WRITE';
  expiresAt?: { toISOString: () => string };
};

export function TokenManage() {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [creating, setCreating] = useState(false);
  const [plaintext, setPlaintext] = useState('');
  const [draft, setDraft] = useState<TokenFormValues | null>(null);
  const [form] = Form.useForm();

  const scopeLabel = (scope: string) => {
    if (scope === 'READ') return t('token.scopeReadLabel');
    if (scope === 'READ_WRITE') return t('token.scopeReadWriteLabel');
    return scope;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await tokenApi.list();
      setTokens(data);
    } catch (err) {
      message.error(getApiErrorMessage(err, 'common.loadFailed'));
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
      message.error(getApiErrorMessage(err, 'common.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await tokenApi.revoke(id);
      message.success(t('token.revokeSuccess'));
      load();
    } catch (err) {
      message.error(getApiErrorMessage(err, 'token.revokeFailed'));
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
    { title: t('token.columnName'), dataIndex: 'name', key: 'name' },
    {
      title: t('token.columnScope'),
      dataIndex: 'scope',
      key: 'scope',
      render: (scope: string) => <Tag>{scopeLabel(scope)}</Tag>,
    },
    {
      title: t('token.columnExpires'),
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (v: string | null) => (v ? new Date(v).toLocaleString() : t('token.statusPermanent')),
    },
    {
      title: t('token.columnStatus'),
      key: 'status',
      render: (_: unknown, record: AccessToken) => {
        if (record.isRevoked) return <Tag color="red">{t('token.statusRevoked')}</Tag>;
        if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
          return <Tag color="orange">{t('token.statusExpired')}</Tag>;
        }
        return <Tag color="green">{t('token.statusActive')}</Tag>;
      },
    },
    {
      title: t('token.columnCreated'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('token.columnAction'),
      key: 'action',
      render: (_: unknown, record: AccessToken) =>
        !record.isRevoked ? (
          <Popconfirm title={t('token.revokeConfirm')} onConfirm={() => handleRevoke(record.id)}>
            <Button type="link" danger size="small">
              {t('token.revoke')}
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <PageContainer
      title={t('token.title')}
      subtitle={t('token.subtitle')}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          {t('token.create')}
        </Button>
      }
    >
      <Alert type="info" showIcon style={{ marginBottom: 16 }} message={t('token.alertMcp')} />
      <Table rowKey="id" columns={columns} dataSource={tokens} loading={loading} />

      <Modal
        title={t('token.createModalTitle')}
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
          items={[
            { title: t('token.stepBasic') },
            { title: t('token.stepConfirm') },
            { title: t('token.stepDone') },
          ]}
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
              label={t('token.name')}
              rules={[{ required: true, message: t('validation.nameRequired') }]}
            >
              <Input placeholder={t('token.namePlaceholder')} />
            </Form.Item>
            <Form.Item name="scope" label={t('token.scope')} rules={[{ required: true }]}>
              <Select
                options={[
                  { label: t('token.scopeRead'), value: 'READ' },
                  { label: t('token.scopeReadWrite'), value: 'READ_WRITE' },
                ]}
              />
            </Form.Item>
            <Form.Item name="expiresAt" label={t('token.expires')}>
              <DatePicker showTime style={{ width: '100%' }} placeholder={t('token.expiresPlaceholder')} />
            </Form.Item>
            <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
              <Button onClick={handleCloseModal} style={{ marginRight: 8 }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit">
                {t('common.next')}
              </Button>
            </Form.Item>
          </Form>
        )}

        {step === 1 && (
          <div>
            <p>{t('token.confirmInfo')}</p>
            <ul>
              <li>
                {t('token.confirmName')} {draft?.name}
              </li>
              <li>
                {t('token.confirmScope')} {scopeLabel(draft?.scope ?? '')}
              </li>
            </ul>
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setStep(0)} style={{ marginRight: 8 }}>
                {t('common.prev')}
              </Button>
              <Button
                type="primary"
                loading={creating}
                disabled={!draft}
                onClick={() => draft && handleCreate(draft)}
              >
                {t('common.create')}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <Alert
              type="warning"
              message={t('token.alertCopyOnce')}
              description={t('token.alertCopyOnceDetail')}
              style={{ marginBottom: 16 }}
            />
            <Input.TextArea value={plaintext} readOnly rows={3} />
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button
                type="primary"
                onClick={() => {
                  navigator.clipboard.writeText(plaintext);
                  message.success(t('token.copySuccess'));
                }}
                style={{ marginRight: 8 }}
              >
                {t('token.copyToken')}
              </Button>
              <Button onClick={handleCloseModal}>{t('common.done')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
